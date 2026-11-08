import { coreApp } from "../../../mod.ts";
import { updateMeFn } from "./updateMe.fn.ts";
import { updateMeValidator } from "./updateMe.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const updateMeSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "updateMe",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: updateMeValidator(),
    fn: updateMeFn,
  });
