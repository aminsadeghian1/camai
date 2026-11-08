import { coreApp } from "../../../mod.ts";
import { updateSettingsFn } from "./updateSettings.fn.ts";
import { updateSettingsValidator } from "./updateSettings.val.ts";
import { ALL_ROLES, grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const updateSettingsSetup = () =>
  coreApp.acts.setAct({
    schema: "user",
    actName: "updateSettings",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ALL_ROLES }]),
    ],
    validator: updateSettingsValidator(),
    fn: updateSettingsFn,
  });
