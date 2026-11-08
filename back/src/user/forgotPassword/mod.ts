import { coreApp } from "../../../mod.ts";
import { forgotPasswordFn } from "./forgotPassword.fn.ts";
import { forgotPasswordValidator } from "./forgotPassword.val.ts";
import { setRequestId } from "@lib";

export const forgotPasswordSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "forgotPassword",
    preAct: [setRequestId],
    validator: forgotPasswordValidator(),
    fn: forgotPasswordFn,
  });
