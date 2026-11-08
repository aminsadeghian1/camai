import { registerSetup } from "./register/mod.ts";
import { loginSetup } from "./login/mod.ts";
import { getMeSetup } from "./getMe/mod.ts";
import { forgotPasswordSetup } from "./forgotPassword/mod.ts";
import { resetPasswordSetup } from "./resetPassword/mod.ts";
import { updateMeSetup } from "./updateMe/mod.ts";
import { updateSettingsSetup } from "./updateSettings/mod.ts";
import { deleteMeSetup } from "./deleteMe/mod.ts";
import { getsSetup } from "./gets/mod.ts";
import { getSetup } from "./get/mod.ts";
import { setStatusSetup } from "./setStatus/mod.ts";
import { dashboardStatisticSetup } from "./dashboardStatistic/mod.ts";

export const userSetup = () => {
  registerSetup();
  loginSetup();
  getMeSetup();
  forgotPasswordSetup();
  resetPasswordSetup();
  updateMeSetup();
  updateSettingsSetup();
  deleteMeSetup();
  getsSetup();
  getSetup();
  setStatusSetup();
  dashboardStatisticSetup();
};
