import { coreApp } from "../../../mod.ts";
import { getFn } from "./get.fn.ts";
import { getValidator } from "./get.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getSetup = () =>
  coreApp.acts.setAct({
    schema: "practiceSubmission",
    actName: "get",
    fn: getFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([
        { roles: ["Learner", "Reviewer", "Manager", "Admin"] },
      ]),
    ],
    validator: getValidator(),
  });
