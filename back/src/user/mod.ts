import { registerSetup } from "./register/mod.ts";
import { loginSetup } from "./login/mod.ts";
import { getMeSetup } from "./getMe/mod.ts";

export const userSetup = () => {
  registerSetup();
  loginSetup();
  getMeSetup();
};
