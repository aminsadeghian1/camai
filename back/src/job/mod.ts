import { getsSetup } from "./gets/mod.ts";
import { retrySetup } from "./retry/mod.ts";

export const jobSetup = () => {
  getsSetup();
  retrySetup();
};
