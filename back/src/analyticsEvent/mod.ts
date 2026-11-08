import { addSetup } from "./add/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const analyticsEventSetup = () => {
  addSetup();
  getsSetup();
};
