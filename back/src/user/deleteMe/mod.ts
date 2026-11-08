import { coreApp } from "../../../mod.ts";
import { deleteMeFn } from "./deleteMe.fn.ts";
import { deleteMeValidator } from "./deleteMe.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const deleteMeSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "deleteMe",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: deleteMeValidator(),
    fn: deleteMeFn,
  });
