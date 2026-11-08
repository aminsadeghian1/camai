import { assignSetup } from "./assign/mod.ts";
import { revokeSetup } from "./revoke/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const reviewAssignmentSetup = () => {
  assignSetup();
  revokeSetup();
  getsSetup();
};
