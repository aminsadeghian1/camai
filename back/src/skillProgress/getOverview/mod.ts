import { coreApp } from "../../../mod.ts";
import { getOverviewFn } from "./getOverview.fn.ts";
import { getOverviewValidator } from "./getOverview.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getOverviewSetup = () =>
  coreApp.acts.setAct({
    schema: "skillProgress",
    actName: "getOverview",
    fn: getOverviewFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: getOverviewValidator(),
  });
