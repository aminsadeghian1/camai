import { coreApp } from "../../../mod.ts";
import { addFn } from "./add.fn.ts";
import { addValidator } from "./add.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "note",
    actName: "add",
    fn: addFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: addValidator(),
    validationRunType: "create",
  });
