import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "aiReview",
    actName: "gets",
    fn: getsFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Reviewer", "Admin", "Manager"] }]),
    ],
    validator: getsValidator(),
  });
