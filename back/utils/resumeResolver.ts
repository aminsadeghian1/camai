export type ResumeInput = {
  currentBlock?: number;
  status?: string;
  completedBlockIds?: string[];
  blockIds?: string[];
};

export type ResumeResult = {
  currentBlock: number;
  firstIncompleteBlock: number;
  lastCompletedBlock: number;
  resumeLabel: "Start" | "Continue" | "Review";
  completed: boolean;
};

export const resolveResume = ({
  currentBlock = 0,
  status,
  completedBlockIds = [],
  blockIds = [],
}: ResumeInput): ResumeResult => {
  const completedSet = new Set(completedBlockIds);
  const lastCompletedBlock = blockIds.reduce(
    (last, id, index) => completedSet.has(id) ? index : last,
    -1,
  );
  const firstIncompleteBlock = blockIds.findIndex((id) =>
    !completedSet.has(id)
  );
  const completed = status === "completed" ||
    (blockIds.length > 0 && firstIncompleteBlock === -1);
  const nextBlock = completed
    ? Math.max(blockIds.length - 1, 0)
    : firstIncompleteBlock >= 0
    ? firstIncompleteBlock
    : Math.min(Math.max(currentBlock, 0), Math.max(blockIds.length - 1, 0));

  return {
    currentBlock: nextBlock,
    firstIncompleteBlock: firstIncompleteBlock >= 0
      ? firstIncompleteBlock
      : blockIds.length,
    lastCompletedBlock,
    resumeLabel: completed
      ? "Review"
      : lastCompletedBlock >= 0 || currentBlock > 0
      ? "Continue"
      : "Start",
    completed,
  };
};
