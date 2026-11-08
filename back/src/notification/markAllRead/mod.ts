import { coreApp } from "../../../mod.ts";
import { markAllReadFn } from "./markAllRead.fn.ts";
import { markAllReadValidator } from "./markAllRead.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const markAllReadSetup = () =>
  coreApp.acts.setAct({
    schema: "notification",
    actName: "markAllRead",
    fn: markAllReadFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: markAllReadValidator(),
  });
