import { coreApp } from "../../../mod.ts";
import { loginFn } from "./login.fn.ts";
import { loginValidator } from "./login.val.ts";
import { setRequestId } from "@lib";

export const loginSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "login",
    preAct: [setRequestId],
    validator: loginValidator(),
    fn: loginFn,
  });
