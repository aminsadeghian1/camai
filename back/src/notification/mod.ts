import { getsSetup } from "./gets/mod.ts";
import { markReadSetup } from "./markRead/mod.ts";
import { markAllReadSetup } from "./markAllRead/mod.ts";

export const notificationSetup = () => {
  getsSetup();
  markReadSetup();
  markAllReadSetup();
};
