import { coreApp } from "../../../mod.ts";
import { completeUploadFn } from "./completeUpload.fn.ts";
import { completeUploadValidator } from "./completeUpload.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const completeUploadSetup = () =>
  coreApp.acts.setAct({
    schema: "file",
    actName: "completeUpload",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: completeUploadValidator(),
    fn: completeUploadFn,
  });
