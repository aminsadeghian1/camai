import { ALL_ROLES, grantAccess, setTokens, setUser } from "@lib";
import { coreApp } from "../../../mod.ts";
import { logoutFn } from "./logout.fn.ts";
import { logoutValidator } from "./logout.val.ts";

export const logoutSetup = () =>
  coreApp.acts.setAct({
    schema: "session",
    actName: "logout",
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: logoutValidator(),
    fn: logoutFn,
  });
