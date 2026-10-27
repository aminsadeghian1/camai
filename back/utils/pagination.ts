import { defaulted, number, optional, string } from "lesan";

export const pagination = {
  page: optional(defaulted(number(), () => 1)),
  limit: optional(defaulted(number(), () => 50)),
  skip: optional(number()),
  cursor: optional(string()),
};

export const pageSkip = (set: {
  page?: number;
  limit?: number;
  skip?: number;
}): number => {
  const limit = Math.min(Math.max(set.limit ?? 50, 1), 200);
  if (typeof set.skip === "number") return Math.max(set.skip, 0);
  return limit * (Math.max(set.page ?? 1, 1) - 1);
};
