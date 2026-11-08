import { coreApp } from "../../../mod.ts";
import { setStatusFn } from "./setStatus.fn.ts";
import { setStatusValidator } from "./setStatus.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const setStatusSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "setStatus",
    fn: setStatusFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: setStatusValidator(),
  });
