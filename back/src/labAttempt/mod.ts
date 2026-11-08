import { addSetup } from "./add/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { completeSetup } from "./complete/mod.ts";

export const labAttemptSetup = () => {
  addSetup();
  getSetup();
  getsSetup();
  completeSetup();
};
