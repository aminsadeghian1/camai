import { coreApp } from "../../../mod.ts";
import { loginFn } from "./login.fn.ts";
import { loginValidator } from "./login.val.ts";

export const loginSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "login",
    fn: loginFn,
    validator: loginValidator(),
  });
