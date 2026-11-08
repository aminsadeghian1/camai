import { coreApp } from "../../../mod.ts";
import { ALL_ROLES, grantAccess, setTokens, setUser } from "@lib";
import { pushFn } from "./push.fn.ts";
import { pushValidator } from "./push.val.ts";

export const pushSetup = () =>
  coreApp.acts.setAct({
    schema: "sync",
    actName: "push",
    fn: pushFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: pushValidator(),
  });
