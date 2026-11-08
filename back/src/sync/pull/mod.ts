import { coreApp } from "../../../mod.ts";
import { ALL_ROLES, grantAccess, setTokens, setUser } from "@lib";
import { pullFn } from "./pull.fn.ts";
import { pullValidator } from "./pull.val.ts";

export const pullSetup = () =>
  coreApp.acts.setAct({
    schema: "sync",
    actName: "pull",
    fn: pullFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: pullValidator(),
  });
