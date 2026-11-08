import { type ActFn } from "lesan";
import { applySyncOperation, getAuth, throwError } from "@lib";

const MAX_OPERATIONS = 50;

export const pushFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();
  const operations = (set.operations ?? []) as {
    operationId: string;
    entityType: string;
    op: string;
    payload?: Record<string, unknown>;
    clientTimestamp?: string;
  }[];

  if (operations.length > MAX_OPERATIONS) {
    return throwError(
      `VALIDATION_FAILED: At most ${MAX_OPERATIONS} operations are allowed`,
    );
  }

  const results = [];
  for (const operation of operations) {
    results.push(
      await applySyncOperation(String(user._id), {
        operationId: operation.operationId,
        entityType: operation.entityType,
        op: operation.op,
        payload: operation.payload ?? {},
        clientTimestamp: operation.clientTimestamp,
      }),
    );
  }

  return { results };
};
