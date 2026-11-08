import { type ActFn } from "lesan";
import { getAuth, updateLessonProgress } from "@lib";

export const updateFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user } = await getAuth();

  return await updateLessonProgress({
    userId: String(user._id),
    lessonId: String(set.lessonId),
    currentBlock: Number(set.currentBlock ?? 0),
    projection: get,
  });
};
