import { ObjectId } from "lesan";
import { auditLog } from "../mod.ts";

export const writeAudit = async ({
  adminUserId,
  action,
  targetType,
  targetId,
  metadata = {},
}: {
  adminUserId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> => {
  await auditLog.insertOne({
    doc: {
      action,
      targetType,
      targetId,
      metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    ...(adminUserId
      ? {
        relations: {
          adminUser: { _ids: new ObjectId(adminUserId) },
        },
      }
      : {}),
  });
};
