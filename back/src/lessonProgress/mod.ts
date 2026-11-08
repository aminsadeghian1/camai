import { startSetup } from "./start/mod.ts";
import { updateSetup } from "./update/mod.ts";
import { completeSetup } from "./complete/mod.ts";

export const lessonProgressSetup = () => {
  startSetup();
  updateSetup();
  completeSetup();
};
