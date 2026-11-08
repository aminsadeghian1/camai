import { object, objectIdValidation, optional, size, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { activeRoleMixin } from "@lib";

export const submitValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      assignmentId: objectIdValidation,
      mediaId: objectIdValidation,
      operationId: size(string(), 1, 100),
      note: optional(size(string(), 0, 4000)),
      exif: optional(object()),
    }),
    get: optional(
      object({
        submission: optional(selectStruct("practiceSubmission", 2)),
        review: optional(selectStruct("aiReview", 2)),
      }),
    ),
  });
