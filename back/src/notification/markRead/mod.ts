import { coreApp } from "../../../mod.ts";
import { markReadFn } from "./markRead.fn.ts";
import { markReadValidator } from "./markRead.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const markReadSetup = () =>
  coreApp.acts.setAct({
    schema: "notification",
    actName: "markRead",
    fn: markReadFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: markReadValidator(),
  });
