import { coreApp } from "../../../mod.ts";
import { revokeFn } from "./revoke.fn.ts";
import { revokeValidator } from "./revoke.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const revokeSetup = () =>
  coreApp.acts.setAct({
    schema: "reviewAssignment",
    actName: "revoke",
    fn: revokeFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: revokeValidator(),
  });
