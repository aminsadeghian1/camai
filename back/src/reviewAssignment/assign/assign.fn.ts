import { type ActFn, ObjectId } from "lesan";
import { practiceAssignment, reviewAssignment, user } from "../../../mod.ts";
import { getAuth, throwError, writeAudit } from "@lib";

export const assignFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user: actor } = await getAuth();
  const assignmentId = new ObjectId(String(set.assignmentId));
  const reviewerId = new ObjectId(String(set.reviewerId));

  const assignment = await practiceAssignment.findOne({
    filters: { _id: assignmentId },
    projection: { _id: 1 },
  });

  if (!assignment) return throwError("NOT_FOUND: Assignment not found");

  const reviewer = await user.findOne({
    filters: { _id: reviewerId },
    projection: { _id: 1, status: 1, roles: { roleId: 1, name: 1 } },
  });

  if (!reviewer) return throwError("NOT_FOUND: Reviewer not found");
  if (reviewer.status !== "active") {
    return throwError("VALIDATION_FAILED: Reviewer is not active");
  }

  const roles = (reviewer.roles ?? []) as { name?: string }[];
  if (!roles.some((role) => role.name === "Reviewer")) {
    return throwError(
      "VALIDATION_FAILED: User does not have the Reviewer role",
    );
  }

  const existing = await reviewAssignment.findOne({
    filters: {
      "assignment._id": assignmentId,
      "reviewer._id": reviewerId,
      status: "active",
    },
    projection: get,
  });

  if (existing) return existing;

  const now = new Date();
  const relations = {
    reviewer: { _ids: reviewerId },
    assignment: { _ids: assignmentId },
    assignedBy: { _ids: new ObjectId(String(actor._id)) },
  };

  let created:
    | Awaited<
      ReturnType<typeof reviewAssignment.insertOne>
    >
    | null = null;
  try {
    created = await reviewAssignment.insertOne({
      doc: {
        status: "active",
        assignedAt: now,
        createdAt: now,
        updatedAt: now,
      },
      relations,
      projection: get,
    });
  } catch (error) {
    const raced = await reviewAssignment.findOne({
      filters: {
        "assignment._id": assignmentId,
        "reviewer._id": reviewerId,
        status: "active",
      },
      projection: get,
    });

    if (raced) return raced;
    throw error;
  }

  if (!created) {
    return throwError(
      "VALIDATION_FAILED: Review assignment could not be created",
    );
  }

  await writeAudit({
    adminUserId: String(actor._id),
    action: "reviewAssignment.assign",
    targetType: "reviewAssignment",
    targetId: String(created._id),
    metadata: {
      assignmentId: String(assignmentId),
      reviewerId: String(reviewerId),
    },
  });

  return created;
};
