import { coreApp } from "../../../mod.ts";
import { updateFn } from "./update.fn.ts";
import { updateValidator } from "./update.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const updateSetup = () =>
  coreApp.acts.setAct({
    schema: "note",
    actName: "update",
    fn: updateFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: updateValidator(),
  });
