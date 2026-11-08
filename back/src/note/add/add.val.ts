import { boolean, object, optional, size, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { note_target_type_enums } from "../../../models/note.ts";
import { activeRoleMixin } from "@lib";

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      targetType: note_target_type_enums,
      targetId: optional(string()),
      body: size(string(), 1, 10000),
      isPinned: optional(boolean()),
      operationId: size(string(), 1, 100),
    }),
    get: selectStruct("note", 2),
  });
