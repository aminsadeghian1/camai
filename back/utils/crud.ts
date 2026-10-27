import {
  type ActFn,
  array,
  boolean,
  enums,
  ObjectId,
  object,
  objectIdValidation,
  optional,
  string,
} from "lesan";
import { coreApp, selectStruct } from "../mod.ts";
import type { RoleName } from "./authzPolicy.ts";
import { ALL_ROLES } from "./authzPolicy.ts";
import { activeRoleMixin } from "./activeRole.ts";
import { writeAudit } from "./audit.ts";
import {
  assertContentEditable,
  assertContentRemovable,
  assertPublished,
  currentContentAccess,
} from "./content.ts";
import { getAuth, grantAccess } from "./grantAccess.ts";
import { pageSkip, pagination } from "./pagination.ts";
import { setTokens } from "./setToken.ts";
import { setUser } from "./setUser.ts";
import { throwError } from "./throwError.ts";

export type CrudRelation = {
  field: string;
  name: string;
  optional?: boolean;
  multiple?: boolean;
  relatedRelations?: Record<string, boolean>;
};

export type CrudConfig = {
  schema: string;
  model: {
    insertOne: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    findOne: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    findOneAndUpdate: (args: Record<string, unknown>) => Promise<Record<string, unknown> | null>;
    addRelation: (args: Record<string, unknown>) => Promise<unknown>;
    deleteOne: (args: Record<string, unknown>) => Promise<unknown>;
    countDocument: (args: Record<string, unknown>) => Promise<number>;
    aggregation: (args: Record<string, unknown>) => {
      toArray: () => Promise<Record<string, unknown>[]>;
    };
  };
  pure: Record<string, unknown>;
  relations?: CrudRelation[];
  readRoles?: RoleName[];
  writeRoles?: RoleName[];
  removeRoles?: RoleName[];
  publishRoles?: RoleName[];
  publishedOnlyForLearners?: boolean;
  immutableWhenPublished?: boolean;
  publishable?: boolean;
  searchFields?: string[];
  filterFields?: Record<string, unknown>;
  sortFields?: string[];
  auditWrites?: boolean;
  validatePublish?: (doc: Record<string, unknown>) => Promise<void>;
};

const roleChecks = (roles: RoleName[]) => [{ roles }];

const withoutTimestamps = (pure: Record<string, unknown>) => {
  const { createdAt: _createdAt, updatedAt: _updatedAt, ...rest } = pure;
  return rest;
};

const optionalize = (pure: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(pure).map(([key, validator]) => [key, optional(validator)]),
  );

const escapeRegex = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const audit = async (
  config: CrudConfig,
  action: string,
  targetId: string,
  metadata: Record<string, unknown> = {},
) => {
  if (config.auditWrites === false) return;
  const { user } = await getAuth();
  await writeAudit({
    adminUserId: String(user._id),
    action,
    targetType: config.schema,
    targetId,
    metadata,
  });
};

const relationSetValidators = (relations: CrudRelation[] = []) =>
  Object.fromEntries(
    relations.map((relation) => {
      const validator = relation.multiple
        ? array(objectIdValidation)
        : objectIdValidation;
      return [relation.field, relation.optional === false ? validator : optional(validator)];
    }),
  );

const buildRelations = (
  raw: Record<string, unknown>,
  relations: CrudRelation[] = [],
) => {
  const built: Record<string, unknown> = {};

  for (const relation of relations) {
    const value = raw[relation.field];
    delete raw[relation.field];

    if (value === undefined || value === null) {
      if (relation.optional === false) {
        throwError(`VALIDATION_FAILED: ${relation.field} is required`);
      }
      continue;
    }

    const ids = relation.multiple
      ? (Array.isArray(value) ? value : [value]).map((id) => new ObjectId(String(id)))
      : new ObjectId(String(value));

    built[relation.name] = {
      _ids: ids,
      ...(relation.relatedRelations
        ? { relatedRelations: relation.relatedRelations }
        : {}),
    };
  }

  return built;
};

const readMatch = async (
  config: CrudConfig,
  set: Record<string, unknown>,
) => {
  const match: Record<string, unknown> = {};
  const access = config.publishedOnlyForLearners
    ? await currentContentAccess()
    : null;

  if (access && !access.staff) {
    match.status = "Published";
  }

  for (const field of Object.keys(config.filterFields ?? {})) {
    if (set[field] !== undefined) match[field] = set[field];
  }

  for (const relation of config.relations ?? []) {
    const value = set[relation.field];
    if (value !== undefined) {
      match[`${relation.name}._id`] = new ObjectId(String(value));
    }
  }

  const search = typeof set.search === "string" ? set.search.trim() : "";
  if (search && config.searchFields?.length) {
    const expression = new RegExp(escapeRegex(search), "i");
    match.$or = config.searchFields.map((field) => ({ [field]: expression }));
  }

  return match;
};

const registerGet = (config: CrudConfig) => {
  const getFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const _id = new ObjectId(String(set._id));
    const existing = await config.model.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });

    if (!existing) throwError("NOT_FOUND: Record not found");

    if (config.publishedOnlyForLearners) {
      const access = await currentContentAccess();
      if (!access.staff) assertPublished(existing);
    }

    return await config.model.findOne({
      filters: { _id },
      projection: get,
    });
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "get",
    fn: getFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(roleChecks(config.readRoles ?? ALL_ROLES)),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        _id: objectIdValidation,
      }),
      get: selectStruct(config.schema, 2),
    }),
  });
};

const registerGets = (config: CrudConfig) => {
  const getsFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const pipeline: Record<string, unknown>[] = [];
    const match = await readMatch(config, set as Record<string, unknown>);

    if (set.cursor && ObjectId.isValid(String(set.cursor))) {
      match._id = { $lt: new ObjectId(String(set.cursor)) };
    }

    pipeline.push({ $match: match });
    const requestedSort = typeof set.sortBy === "string" ? set.sortBy : "_id";
    const sortField = (config.sortFields ?? ["_id", "createdAt", "updatedAt"])
        .includes(requestedSort)
      ? requestedSort
      : "_id";
    pipeline.push({
      $sort: { [sortField]: set.sortOrder === "asc" ? 1 : -1 },
    });
    pipeline.push({ $skip: pageSkip(set) });
    pipeline.push({ $limit: Math.min(Math.max(Number(set.limit ?? 50), 1), 200) });

    return await config.model.aggregation({ pipeline, projection: get })
      .toArray();
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "gets",
    fn: getsFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(roleChecks(config.readRoles ?? ALL_ROLES)),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        ...pagination,
        search: optional(string()),
        sortBy: optional(string()),
        sortOrder: optional(enums(["asc", "desc"])),
        ...(config.filterFields ?? {}),
      }),
      get: selectStruct(config.schema, 2),
    }),
  });
};

const registerAdd = (config: CrudConfig) => {
  const addFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const raw = { ...(set as Record<string, unknown>) };
    delete raw.activeRoleId;

    const relations = buildRelations(raw, config.relations);
    const allowedFields = withoutTimestamps(config.pure);
    const doc: Record<string, unknown> = {};

    for (const key of Object.keys(allowedFields)) {
      if (raw[key] !== undefined) doc[key] = raw[key];
    }

    doc.createdAt = new Date();
    doc.updatedAt = new Date();

    const created = await config.model.insertOne({
      doc,
      projection: get,
      ...(Object.keys(relations).length ? { relations } : {}),
    });

    if (!created) throwError("VALIDATION_FAILED: Record could not be created");

    await audit(config, "create", String(created._id));
    return created;
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "add",
    fn: addFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(
        roleChecks(config.writeRoles ?? ["Manager", "Admin", "ContentEditor"]),
      ),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        ...withoutTimestamps(config.pure),
        ...relationSetValidators(config.relations),
      }),
      get: selectStruct(config.schema, 2),
    }),
    validationRunType: "create",
  });
};

const registerUpdate = (config: CrudConfig) => {
  const updateFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const _id = new ObjectId(String(set._id));
    const existing = await config.model.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });

    if (!existing) throwError("NOT_FOUND: Record not found");
    if (config.immutableWhenPublished) assertContentEditable(existing);

    if (
      config.immutableWhenPublished &&
      set.status === "Published" &&
      existing.status !== "Published"
    ) {
      throwError("VALIDATION_FAILED: Use the publish act to publish content");
    }

    const update: Record<string, unknown> = { updatedAt: new Date() };
    const allowedFields = withoutTimestamps(config.pure);

    for (const key of Object.keys(allowedFields)) {
      if (set[key] !== undefined) update[key] = set[key];
    }

    const updated = await config.model.findOneAndUpdate({
      filter: { _id },
      update: { $set: update },
      projection: get,
    });

    await audit(config, "update", String(_id));
    return updated;
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "update",
    fn: updateFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(
        roleChecks(config.writeRoles ?? ["Manager", "Admin", "ContentEditor"]),
      ),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        _id: objectIdValidation,
        ...optionalize(withoutTimestamps(config.pure)),
      }),
      get: selectStruct(config.schema, 2),
    }),
  });
};

const registerUpdateRelations = (config: CrudConfig) => {
  if (!config.relations?.length) return;

  const updateRelationsFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const _id = new ObjectId(String(set._id));
    const existing = await config.model.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });

    if (!existing) throwError("NOT_FOUND: Record not found");
    if (config.immutableWhenPublished) assertContentEditable(existing);

    for (const relation of config.relations ?? []) {
      const value = set[relation.field];
      if (value === undefined) continue;

      const ids = relation.multiple
        ? (Array.isArray(value) ? value : [value]).map((id) =>
          new ObjectId(String(id))
        )
        : new ObjectId(String(value));

      await config.model.addRelation({
        filters: { _id },
        relations: {
          [relation.name]: {
            _ids: ids,
            ...(relation.relatedRelations
              ? { relatedRelations: relation.relatedRelations }
              : {}),
          },
        },
        replace: true,
      });
    }

    await audit(config, "updateRelations", String(_id));
    return await config.model.findOne({
      filters: { _id },
      projection: get,
    });
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "updateRelations",
    fn: updateRelationsFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(
        roleChecks(config.writeRoles ?? ["Manager", "Admin", "ContentEditor"]),
      ),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        _id: objectIdValidation,
        ...Object.fromEntries(
          (config.relations ?? []).map((relation) => [
            relation.field,
            optional(
              relation.multiple
                ? array(objectIdValidation)
                : objectIdValidation,
            ),
          ]),
        ),
      }),
      get: selectStruct(config.schema, 2),
    }),
  });
};

const registerRemove = (config: CrudConfig) => {
  const removeFn: ActFn = async (body) => {
    const { set } = body.details;
    const _id = new ObjectId(String(set._id));
    const existing = await config.model.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });

    if (!existing) throwError("NOT_FOUND: Record not found");
    if (config.immutableWhenPublished) assertContentRemovable(existing);

    await config.model.deleteOne({
      filter: { _id },
      hardCascade: set.hardCascade || false,
    });

    await audit(config, "remove", String(_id));
    return { success: 1 };
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "remove",
    fn: removeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(roleChecks(config.removeRoles ?? ["Manager", "Admin"])),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        _id: objectIdValidation,
        hardCascade: optional(boolean()),
      }),
      get: object({ success: optional(enums([0, 1])) }),
    }),
  });
};

const registerCount = (config: CrudConfig) => {
  const countFn: ActFn = async (body) => {
    const { set } = body.details;
    const match = await readMatch(config, set as Record<string, unknown>);
    return {
      qty: await config.model.countDocument({ filter: match }),
    };
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "count",
    fn: countFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(roleChecks(config.readRoles ?? ALL_ROLES)),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        search: optional(string()),
        ...(config.filterFields ?? {}),
      }),
      get: object({ qty: optional(enums([0, 1])) }),
    }),
  });
};

const registerPublish = (config: CrudConfig) => {
  if (!config.publishable) return;

  const publishFn: ActFn = async (body) => {
    const { set, get } = body.details;
    const _id = new ObjectId(String(set._id));
    const existing = await config.model.findOne({
      filters: { _id },
      projection: { _id: 1, status: 1 },
    });

    if (!existing) throwError("NOT_FOUND: Content not found");
    if (existing.status === "Published") {
      return await config.model.findOne({
        filters: { _id },
        projection: get,
      });
    }

    await config.validatePublish?.(existing);

    const published = await config.model.findOneAndUpdate({
      filter: { _id },
      update: {
        $set: {
          status: "Published",
          publishedAt: new Date(),
          updatedAt: new Date(),
        },
      },
      projection: get,
    });

    await audit(config, "publish", String(_id));
    return published;
  };

  coreApp.acts.setAct({
    schema: config.schema,
    actName: "publish",
    fn: publishFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess(
        roleChecks(config.publishRoles ?? ["Manager", "Admin", "ContentEditor"]),
      ),
    ],
    validator: object({
      set: object({
        ...activeRoleMixin,
        _id: objectIdValidation,
      }),
      get: selectStruct(config.schema, 2),
    }),
  });
};

export const registerCrud = (config: CrudConfig) => {
  registerGet(config);
  registerGets(config);
  registerAdd(config);
  registerUpdate(config);
  registerUpdateRelations(config);
  registerRemove(config);
  registerCount(config);
  registerPublish(config);
};
