import { coreApp } from "../../../mod.ts";
import { getHistoryFn } from "./getHistory.fn.ts";
import { getHistoryValidator } from "./getHistory.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getHistorySetup = () =>
  coreApp.acts.setAct({
    schema: "skillProgress",
    actName: "getHistory",
    fn: getHistoryFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: getHistoryValidator(),
  });
