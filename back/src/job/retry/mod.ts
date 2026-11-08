import { coreApp } from "../../../mod.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { retryFn } from "./retry.fn.ts";
import { retryValidator } from "./retry.val.ts";

export const retrySetup = () =>
  coreApp.acts.setAct({
    schema: "job",
    actName: "retry",
    fn: retryFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: retryValidator(),
  });
