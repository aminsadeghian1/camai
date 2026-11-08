import { coreApp } from "../../../mod.ts";
import { getForAssignmentFn } from "./getForAssignment.fn.ts";
import { getForAssignmentValidator } from "./getForAssignment.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getForAssignmentSetup = () =>
  coreApp.acts.setAct({
    schema: "aiReview",
    actName: "getForAssignment",
    fn: getForAssignmentFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Reviewer", "Admin", "Manager"] }]),
    ],
    validator: getForAssignmentValidator(),
  });
