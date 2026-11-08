import { boolean, object, optional, string } from "lesan";
import { selectStruct } from "../../../mod.ts";
import { note_target_type_enums } from "../../../models/note.ts";
import { activeRoleMixin, pagination } from "@lib";

export const getsValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      ...pagination,
      targetType: optional(note_target_type_enums),
      targetId: optional(string()),
      isPinned: optional(boolean()),
      search: optional(string()),
    }),
    get: selectStruct("note", 2),
  });
