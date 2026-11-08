import { coreApp } from "../../../mod.ts";
import { completeFn } from "./complete.fn.ts";
import { completeValidator } from "./complete.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const completeSetup = () =>
  coreApp.acts.setAct({
    schema: "labAttempt",
    actName: "complete",
    fn: completeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: completeValidator(),
  });
