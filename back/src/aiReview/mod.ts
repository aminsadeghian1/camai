import { getsSetup } from "./gets/mod.ts";
import { retrySetup } from "./retry/mod.ts";
import { getForAssignmentSetup } from "./getForAssignment/mod.ts";

export const aiReviewSetup = () => {
  getsSetup();
  retrySetup();
  getForAssignmentSetup();
};
