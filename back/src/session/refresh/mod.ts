import { coreApp } from "../../../mod.ts";
import { refreshFn } from "./refresh.fn.ts";
import { refreshValidator } from "./refresh.val.ts";
import { setRequestId } from "@lib";

export const refreshSetup = () =>
  coreApp.acts.setAct({
    schema: "session",
    actName: "refresh",
    preAct: [setRequestId],
    fn: refreshFn,
    validator: refreshValidator(),
  });
