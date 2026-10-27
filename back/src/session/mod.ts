import { refreshSetup } from "./refresh/mod.ts";
import { logoutSetup } from "./logout/mod.ts";

export const sessionSetup = () => {
  refreshSetup();
  logoutSetup();
};
