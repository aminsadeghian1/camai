import { coreApp } from "../../../mod.ts";
import { grantAccess, setTokens, setUser } from "@lib";
import { getsFn } from "./gets.fn.ts";
import { getsValidator } from "./gets.val.ts";

export const getsSetup = () =>
  coreApp.acts.setAct({
    schema: "job",
    actName: "gets",
    fn: getsFn,
    preAct: [
      setTokens,
      setUser,
      grantAccess([{ roles: ["Manager", "Admin"] }]),
    ],
    validator: getsValidator(),
  });
