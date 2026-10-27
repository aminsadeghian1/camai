import { coreApp } from "../../../mod.ts";
import { refreshFn } from "./refresh.fn.ts";
import { refreshValidator } from "./refresh.val.ts";

export const refreshSetup = () =>
  coreApp.acts.setAct({
    schema: "session",
    actName: "refresh",
    fn: refreshFn,
    validator: refreshValidator(),
  });
