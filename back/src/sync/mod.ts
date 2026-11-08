import { pushSetup } from "./push/mod.ts";
import { pullSetup } from "./pull/mod.ts";

export const syncSetup = () => {
  pushSetup();
  pullSetup();
};
