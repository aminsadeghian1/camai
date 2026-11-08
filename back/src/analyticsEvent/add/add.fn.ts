import { type ActFn, ObjectId } from "lesan";
import { analyticsEvent, coreApp } from "../../../mod.ts";
import { getAuth, throwError } from "@lib";

const PRIVATE_KEYS = ["image", "imageBytes", "base64", "photo", "file"];

const sanitizePayload = (payload: Record<string, unknown>) => {
  const clean: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(payload)) {
    if (PRIVATE_KEYS.includes(key)) continue;
    if (typeof value === "string" && value.length > 2000) continue;
    clean[key] = value;
  }
  return clean;
};

export const addFn: ActFn = async (body) => {
  const { set } = body.details;
  const { user } = await getAuth();
  const userId = new ObjectId(String(user._id));

  const foundedUser = await coreApp.odm.getCollection("user").findOne(
    { _id: userId },
    { projection: { settings: 1 } },
  );
  const consent = (foundedUser?.settings as {
    privacy?: { analyticsConsent?: boolean };
  } | undefined)?.privacy?.analyticsConsent;
  if (consent === false) return { accepted: 1 as const };

  const operationId = typeof set.operationId === "string"
    ? set.operationId
    : undefined;

  if (operationId) {
    const existing = await analyticsEvent.findOne({
      filters: { "user._id": userId, operationId },
      projection: { _id: 1 },
    });
    if (existing) return { accepted: 1 as const };
  }

  const now = new Date();
  try {
    await analyticsEvent.insertOne({
      doc: {
        eventType: set.eventType,
        payload: sanitizePayload(
          (set.payload ?? {}) as Record<string, unknown>,
        ),
        ...(set.sessionId ? { sessionId: set.sessionId } : {}),
        ...(operationId ? { operationId } : {}),
        createdAt: now,
        updatedAt: now,
      },
      relations: { user: { _ids: userId } },
    });
  } catch {
    if (!operationId) {
      return throwError("DUPLICATE_OPERATION: Analytics event already exists");
    }
  }

  return { accepted: 1 as const };
};
