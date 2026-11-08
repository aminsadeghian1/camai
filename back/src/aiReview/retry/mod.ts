import { coreApp } from "../../../mod.ts";
import { retryFn } from "./retry.fn.ts";
import { retryValidator } from "./retry.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const retrySetup = () =>
  coreApp.acts.setAct({
    schema: "aiReview",
    actName: "retry",
    fn: retryFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Reviewer", "Admin", "Manager"] }]),
    ],
    validator: retryValidator(),
  });
