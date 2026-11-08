import { coreApp } from "../mod.ts";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 128;

type RequestContext = {
  requestId?: string;
  Headers?: Headers;
};

const normalizeIncoming = (value: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > MAX_REQUEST_ID_LENGTH) return undefined;
  return /^[\w.:-]+$/.test(trimmed) ? trimmed : undefined;
};

export const newRequestId = (): string =>
  `req_${crypto.randomUUID().replace(/-/g, "")}`;

export const setRequestId = () => {
  const context = coreApp.contextFns.getContextModel() as RequestContext;

  if (context.requestId) return context.requestId;

  const incoming = normalizeIncoming(
    context.Headers?.get(REQUEST_ID_HEADER) ?? null,
  );
  const requestId = incoming ?? newRequestId();

  coreApp.contextFns.setContext({ requestId });
  return requestId;
};

export const getRequestId = (): string | undefined => {
  const context = coreApp.contextFns.getContextModel() as RequestContext;
  return context.requestId;
};
