import { type ActFn } from "lesan";
import { completeLessonProgress, getAuth } from "@lib";

export const completeFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await completeLessonProgress({
    userId: String(user._id),
    lessonId: String(set.lessonId),
    projection: get,
  });
};
