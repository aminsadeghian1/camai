import { createFromLessonSetup } from "./createFromLesson/mod.ts";
import { getSetup } from "./get/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const practiceAssignmentSetup = () => {
  createFromLessonSetup();
  getSetup();
  getsSetup();
};
