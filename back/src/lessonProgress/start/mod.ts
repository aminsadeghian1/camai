import { coreApp } from "../../../mod.ts";
import { startFn } from "./start.fn.ts";
import { startValidator } from "./start.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const startSetup = () =>
  coreApp.acts.setAct({
    schema: "lessonProgress",
    actName: "start",
    fn: startFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: startValidator(),
  });
