import {
  number,
  object,
  objectIdValidation,
  optional,
  size,
  string,
} from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const controlsValidator = object({
  shutterSeconds: optional(number()),
  aperture: optional(number()),
  iso: optional(number()),
  focalLength: optional(number()),
  focusDistance: optional(number()),
  cameraDistance: optional(number()),
  subjectSpeed: optional(number()),
});

export const predictionValidator = object({
  metric: optional(string()),
  value: optional(number()),
});

export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      labId: objectIdValidation,
      challengeId: optional(objectIdValidation),
      operationId: size(string(), 1, 100),
      controls: controlsValidator,
      prediction: optional(predictionValidator),
    }),
    get: selectStruct("labAttempt", 2),
  });
