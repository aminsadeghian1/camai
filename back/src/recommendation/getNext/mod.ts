import { coreApp } from "../../../mod.ts";
import { getNextFn } from "./getNext.fn.ts";
import { getNextValidator } from "./getNext.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getNextSetup = () =>
  coreApp.acts.setAct({
    schema: "recommendation",
    actName: "getNext",
    fn: getNextFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: getNextValidator(),
  });
