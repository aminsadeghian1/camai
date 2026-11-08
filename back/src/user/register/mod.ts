import { coreApp } from "../../../mod.ts";
import { registerFn } from "./register.fn.ts";
import { registerValidator } from "./register.val.ts";
import { setRequestId } from "@lib";

export const registerSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "register",
    validationRunType: "create",
    preAct: [setRequestId],
    validator: registerValidator(),
    fn: registerFn,
  });
