import { enums, object, objectIdValidation } from "lesan";
import { activeRoleMixin } from "@lib";

export const removeValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      _id: objectIdValidation,
    }),
    get: object({ success: enums([0, 1]) }),
  });
