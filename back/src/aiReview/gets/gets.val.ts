import { enums, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { ai_review_status_enums } from "../../../models/aiReview.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      status: optional(ai_review_status_enums),
      userId: optional(string()),
      submissionId: optional(string()),
      provider: optional(string()),
      sortBy: optional(enums(["createdAt", "updatedAt"])),
      sortOrder: optional(enums(["asc", "desc"])),
    }),
    get: selectStruct("aiReview", 2),
  });
