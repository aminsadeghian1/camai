import { getOverviewSetup } from "./getOverview/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getHistorySetup } from "./getHistory/mod.ts";

export const skillProgressSetup = () => {
  getOverviewSetup();
  getsSetup();
  getSetup();
  getHistorySetup();
};
