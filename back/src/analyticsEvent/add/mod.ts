import { coreApp } from "../../../mod.ts";
import { ALL_ROLES, grantAccess, setTokens, setUser } from "@lib";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "analyticsEvent",
    actName: "add",
    fn: addFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: addValidator(),
  });
