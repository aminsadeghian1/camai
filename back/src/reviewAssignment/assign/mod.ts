import { coreApp } from "../../../mod.ts";
import { assignFn } from "./assign.fn.ts";
import { assignValidator } from "./assign.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const assignSetup = () =>
  coreApp.acts.setAct({
    schema: "reviewAssignment",
    actName: "assign",
    fn: assignFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: assignValidator(),
    validationRunType: "create",
  });
