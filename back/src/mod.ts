import { userSetup } from "./user/mod.ts";
import { sessionSetup } from "./session/mod.ts";

export const functionsSetup = () => {
  userSetup();
  sessionSetup();
};
