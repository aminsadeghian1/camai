import { type ActFn } from "lesan";
import { getAuth, startLessonProgress } from "@lib";

export const startFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await startLessonProgress({
    userId: String(user._id),
    lessonId: String(set.lessonId),
    projection: get,
  });
};
