import { coreApp } from "../../../mod.ts";
import { addBatchFn } from "./addBatch.fn.ts";
import { addBatchValidator } from "./addBatch.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const addBatchSetup = () =>
  coreApp.acts.setAct({
    schema: "labEvent",
    actName: "addBatch",
    fn: addBatchFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: addBatchValidator(),
  });
