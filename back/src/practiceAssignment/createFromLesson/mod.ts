import { coreApp } from "../../../mod.ts";
import { createFromLessonFn } from "./createFromLesson.fn.ts";
import { createFromLessonValidator } from "./createFromLesson.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const createFromLessonSetup = () =>
  coreApp.acts.setAct({
    schema: "practiceAssignment",
    actName: "createFromLesson",
    fn: createFromLessonFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: createFromLessonValidator(),
    validationRunType: "create",
  });
