import { coreApp } from "../../../mod.ts";
import { getReviewMediaUrlFn } from "./getReviewMediaUrl.fn.ts";
import { getReviewMediaUrlValidator } from "./getReviewMediaUrl.val.ts";
import { grantAccess, setRequestId, setTokens, setUser } from "@lib";

export const getReviewMediaUrlSetup = () =>
  coreApp.acts.setAct({
    schema: "file",
    actName: "getReviewMediaUrl",
    preAct: [
      setRequestId,
      setTokens,
      setUser,
      grantAccess([{ roles: ["Reviewer", "Admin", "Manager"] }]),
    ],
    validator: getReviewMediaUrlValidator(),
    fn: getReviewMediaUrlFn,
  });
