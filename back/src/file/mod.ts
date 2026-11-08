import { requestUploadSetup } from "./requestUpload/mod.ts";
import { completeUploadSetup } from "./completeUpload/mod.ts";
import { getSignedUrlSetup } from "./getSignedUrl/mod.ts";
import { getReviewMediaUrlSetup } from "./getReviewMediaUrl/mod.ts";

export const fileSetup = () => {
  requestUploadSetup();
  completeUploadSetup();
  getSignedUrlSetup();
  getReviewMediaUrlSetup();
};
