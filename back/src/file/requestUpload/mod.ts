import { coreApp } from "../../../mod.ts";
import { requestUploadFn } from "./requestUpload.fn.ts";
import { requestUploadValidator } from "./requestUpload.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const requestUploadSetup = () =>
  coreApp.acts.setAct({
    schema: "file",
    actName: "requestUpload",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: requestUploadValidator(),
    fn: requestUploadFn,
  });
