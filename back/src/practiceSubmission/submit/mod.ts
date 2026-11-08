import { coreApp } from "../../../mod.ts";
import { submitFn } from "./submit.fn.ts";
import { submitValidator } from "./submit.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const submitSetup = () =>
  coreApp.acts.setAct({
    schema: "practiceSubmission",
    actName: "submit",
    fn: submitFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: submitValidator(),
    validationRunType: "create",
  });
