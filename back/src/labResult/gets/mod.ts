import { coreApp } from "../../../mod.ts";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";
import { grantAccess, setTokens, setUser } from "@lib";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "labResult",
    actName: "gets",
    fn: getsFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Learner", "Manager", "Admin"] }]),
    ],
    validator: getsValidator(),
  });
