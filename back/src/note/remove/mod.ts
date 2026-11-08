import { coreApp } from "../../../mod.ts";
import { removeFn } from "./remove.fn.ts";
import { removeValidator } from "./remove.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const removeSetup = () =>
  coreApp.acts.setAct({
    schema: "note",
    actName: "remove",
    fn: removeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: removeValidator(),
  });
