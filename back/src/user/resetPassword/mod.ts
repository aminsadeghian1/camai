import { coreApp } from "../../../mod.ts";
import { resetPasswordFn } from "./resetPassword.fn.ts";
import { resetPasswordValidator } from "./resetPassword.val.ts";
import { setRequestId } from "@lib";

export const resetPasswordSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "resetPassword",
    preAct: [setRequestId],
    validator: resetPasswordValidator(),
    fn: resetPasswordFn,
  });
