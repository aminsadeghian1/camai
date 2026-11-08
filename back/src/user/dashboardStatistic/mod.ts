import { coreApp } from "../../../mod.ts";
import { dashboardStatisticFn } from "./dashboardStatistic.fn.ts";
import { dashboardStatisticValidator } from "./dashboardStatistic.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const dashboardStatisticSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "dashboardStatistic",
    fn: dashboardStatisticFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: dashboardStatisticValidator(),
  });
