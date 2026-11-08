import { addSetup } from "./add/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { removeSetup } from "./remove/mod.ts";
import { getsSetup } from "./gets/mod.ts";

export const noteSetup = () => {
  addSetup();
  updateSetup();
  removeSetup();
  getsSetup();
};
