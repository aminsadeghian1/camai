import { coreApp } from "../../../mod.ts";
import { getSignedUrlFn } from "./getSignedUrl.fn.ts";
import { getSignedUrlValidator } from "./getSignedUrl.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const getSignedUrlSetup = () =>
  coreApp.acts.setAct({
    schema: "file",
    actName: "getSignedUrl",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: getSignedUrlValidator(),
    fn: getSignedUrlFn,
  });
