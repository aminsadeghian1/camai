**CAMAI**

**Complete Master Product, UX, AI, Android, Backend, Web Admin & Data Specification**

**Version 4.1 — English — Implementation-Ready Product Contract (Deno + Lesan backend)**

CAMAI is a photography learning and intelligent shooting platform combining Smart Camera guidance, structured education, interactive Photo Labs, real-world practice, AI photography critique, personal notes, account synchronization and progress tracking.

# Document Control

| **Field** | **Definition** |
|---|---|
| Product | CAMAI |
| Document Version | 4.1 (Deno + Lesan backend revision) |
| Scope | Android mobile application + Backend API + Web Admin Portal + AI services + media storage + database |
| Primary mobile platform | Android |
| Backend | Deno + Lesan + TypeScript |
| Database | MongoDB (Lesan ODM) |
| Cache / jobs | MongoDB-backed Job queue + Deno workers (Redis optional) |
| Object storage | S3-compatible private storage (storage adapter; local uploads/ in development) |
| Mobile architecture | Kotlin + Jetpack Compose + Clean Architecture |
| AI architecture | Hybrid: on-device CV/ML + server-side multimodal AI |
| Core principle | Learn → Experiment → Predict → Practice → Submit → Critique → Progress → Continue |

# How to Read This Specification

This is the master implementation document. Product behavior, data ownership, APIs, screen behavior, state transitions, offline behavior, security, AI boundaries, administration and acceptance criteria are defined here. Where an exact third-party model or infrastructure vendor is not mandated, the implementation must preserve the documented interface and behavior.

# 1. Product Vision and Scope

# 1.1 Vision

CAMAI teaches photography through an active learning loop instead of passive video consumption. The user learns a concept, manipulates photographic variables, predicts an outcome, solves a controlled challenge, performs a real-world exercise, submits evidence, receives AI coaching and sees the resulting skill progress.

# 1.2 Primary Areas

| **Area** | **Purpose** |
|---|---|
| 01 Smart Camera | Analyze the live scene and provide understandable photography guidance. |
| 02 Step-by-Step Learning | Teach photography in ordered, progressive lessons. |
| 03 Practice & Challenges | Convert concepts into measurable exercises and real photography assignments. |
| 04 AI Photography Teacher | Critique submitted photographs and coach the learner. |
| 05 Profile & Photography Progress | Store identity, notes, learning state, evidence, mastery and recommendations. |

# 1.3 Supporting Systems

- Authentication and account management
- Cloud data synchronization
- Personal notes
- Media management
- Offline-first storage
- Web Admin Portal
- Content Management System
- Analytics and observability
- AI orchestration
- Notifications
- Security and privacy

# 1.4 Non-Goals

- CAMAI is not an automatic photo editor by default.
- CAMAI must not claim artistic judgments are objective facts.
- CAMAI must not require cloud AI for every camera frame.
- CAMAI must not expose unsupported hardware controls.
- CAMAI must not silently overwrite historical learning evidence.

# 2. User Accounts, Login and Identity

# 2.1 Account Creation

Users can create an account using the supported authentication methods configured by the product. The initial implementation must support email/password and must be architected so OAuth providers can be added without changing the user domain.

# 2.2 Authentication Screens

| **Screen** | **Function** |
|---|---|
| Welcome | Introduce CAMAI and provide Sign Up / Log In / Continue Offline. |
| Sign Up | Collect required account fields and create an account. |
| Log In | Authenticate an existing account. |
| Forgot Password | Start password recovery. |
| Verification | Verify email when enabled. |
| Session Recovery | Refresh an expired access token securely. |

# 2.3 Account Requirements

- Unique stable user ID.
- Password stored only as a secure hash on the server.
- Short-lived access token.
- Rotating refresh token.
- Session/device management.
- Logout from current device.
- Optional logout from all devices.
- Account deletion workflow.
- Privacy settings.
- Consent records where required.

# 2.4 Continue Offline

The user may enter a limited local/offline mode before creating an account. Local progress remains on the device. When the user later signs in, the application offers a controlled merge into the cloud account; it must never silently discard local learning evidence.

# 2.5 Data Ownership

User-generated notes, practice photos, attempts, preferences and progress belong to the user's account domain. The backend must enforce object-level authorization so one user can never access another user's private media or notes.

# 3. Personal Data and Cloud Storage

# 3.1 Data Categories

| **Category** | **Examples** | **Storage** |
|---|---|---|
| Identity | User ID, email, display name | MongoDB |
| Learning state | Lesson completion, current position, timestamps | MongoDB + local Room |
| Lab data | Attempts, predictions, scores | MongoDB + local Room |
| Practice | Assignments, submissions, EXIF | MongoDB + private object storage |
| Notes | User notes attached to lessons/photos/attempts | MongoDB + local cache |
| AI reviews | Structured critique and metadata | MongoDB |
| Preferences | Language, notifications, camera preferences | MongoDB + DataStore |
| Analytics | Product interaction events | Analytics storage / MongoDB depending on scale |

# 3.2 Synchronization Rule

Every cloud-owned user record has a stable server ID. Every local mutation has a client-generated operation ID. The backend must process the same operation idempotently so retries do not create duplicates.

# 3.3 Data Export

The system should provide an account data export workflow covering profile data, learning progress, notes and metadata, with media included through secure export packaging or signed download links.

# 4. Notes System

# 4.1 Purpose

Notes allow the learner to turn CAMAI into a personal photography notebook. Notes are not generic comments; they are first-class user-owned records connected to learning and photographic evidence.

# 4.2 Note Attachment Targets

| **Target** | **Example** |
|---|---|
| Photo | “The background was too distracting; next time move left.” |
| Practice submission | “I used 1/250 because the subject was moving.” |
| Lesson | “I finally understood why f/1.4 is a wider opening.” |
| Photo Lab attempt | “At 85mm the framing changed faster than I expected.” |
| Challenge | “I solved this by increasing shutter rather than ISO.” |
| AI Review | “Try the suggested background-separation exercise.” |

# 4.3 Note Features

- Create note.
- Edit note.
- Delete note.
- Pin important note.
- Search notes.
- Filter by lesson, photo, skill or date.
- Offline creation.
- Sync when online.
- Timestamp and ownership.
- Optional rich text in future version.

# 4.4 Note Data Model

```
Note {
  id
  userId
  targetType
  targetId
  body
  isPinned
  createdAt
  updatedAt
  deletedAt
  clientOperationId
}
```

# 4.5 Notes UI

Every relevant detail screen includes an unobtrusive Add Note action. A note list is also available from Profile/Progress so users can review their accumulated learning notes.

# 5. Learning Progress and Resume

# 5.1 Requirement

CAMAI must remember exactly where the user stopped. A user who closes a lesson halfway through must be able to return to the same lesson and continue without restarting.

# 5.2 Progress Layers

| **Layer** | **Stored information** |
|---|---|
| Course | Started/completed, percentage, last activity |
| Lesson | Started/completed, current block, last opened time |
| Lab | Attempt count, best score, last state, current controls |
| Challenge | Attempts, best result, completion |
| Practice | Assigned, submitted, reviewed, passed/needs practice |
| Skill | Evidence, mastery state, confidence, recency |
| Notes | Personal annotations linked to the exact learning target |

# 5.3 Resume Algorithm

```
On lesson open:
1. Fetch latest local progress.
2. If cloud is newer, reconcile.
3. Determine last completed block.
4. Determine first incomplete required block.
5. Restore the lesson at that block.
6. Restore saved Lab state when valid.
7. Show “Continue” rather than “Start” when progress exists.
```

# 5.4 Completion Rule

Viewing a lesson is not automatically equivalent to mastering a skill. Completion is content-specific; mastery requires defined evidence such as prediction accuracy, challenge performance and/or real-world practice.

# 6. Smart Camera

# 6.1 Purpose

Smart Camera is the real-time photography assistant. It observes the camera preview locally, extracts useful visual signals and provides context-sensitive recommendations.

# 6.2 Main Screen

| **Element** | **Behavior** |
|---|---|
| Preview | Live CameraX preview. |
| Subject indicator | Shows detected primary subject. |
| Composition grid | Optional overlays selected by user or recommendation engine. |
| Horizon guide | Appears when confidence is sufficient. |
| Suggestion card | One high-priority recommendation at a time. |
| Explain | Opens why the recommendation was made. |
| Learn | Opens the related lesson. |
| Capture | Captures image using supported camera API. |
| Settings | Lens, grid, guidance and privacy controls. |

# 6.3 Analysis Pipeline

```
CameraX Preview
 → Frame Sampler
 → On-device CV/ML
 → Scene Signals
 → Rule Engine
 → Recommendation Ranking
 → Overlay
 → Explanation
```

# 6.4 Scene Signals

- People/faces/eyes where supported
- Primary object
- Object position and scale
- Motion estimate
- Brightness/luminance
- Highlight/shadow clipping estimate
- Horizon/strong lines
- Available focal lengths
- Approximate depth where device/model permits
- Scene category

# 6.5 Composition Suggestions

| **Suggestion** | **Trigger example** | **Guidance** |
|---|---|---|
| Rule of Thirds | Subject near center with open side space | Try placing subject near a third. |
| Leading Lines | Strong converging lines | Use lines to direct attention. |
| Negative Space | Large usable empty region | Place subject toward the open area. |
| Headroom | Portrait with insufficient top margin | Adjust framing to avoid awkward crop. |
| Balance | Uneven visual weight | Reframe or introduce counterweight. |
| Centered symmetry | Strong symmetry detected | Centered framing may reinforce symmetry. |

# 6.6 Smart Camera Privacy

Continuous preview analysis should remain on-device whenever possible. The application must not upload the camera feed continuously. Remote analysis is an explicit action, not a hidden background behavior.

# 7. Step-by-Step Learning

# 7.1 Curriculum Structure

```
Learning Path
 └─ Course
    └─ Module
       └─ Lesson
          ├─ Explanation
          ├─ Example
          ├─ Interactive Demo
          ├─ Photo Lab
          ├─ Prediction
          ├─ Challenge
          ├─ Practice Assignment
          └─ Reflection / Notes
```

# 7.2 Lesson Screen

| **Area** | **Behavior** |
|---|---|
| Header | Title, skill, estimated time and progress. |
| Content | Text, diagrams, examples and optional video. |
| Interactive block | Learner manipulates a concept. |
| Photo Lab | Launches the relevant simulation. |
| Prediction | Requires learner choice before reveal. |
| Challenge | Tests understanding. |
| Practice | Creates real-world assignment. |
| Notes | Create/view notes attached to lesson. |
| Resume | Returns to saved position. |

# 7.3 Core Curriculum

- Camera fundamentals
- Exposure
- Shutter speed
- Aperture
- ISO
- Exposure triangle
- Motion
- Focus
- Depth of field
- Focal length
- Camera distance
- Composition
- Light
- Color
- Portrait
- Product
- Street
- Landscape
- Low light
- Creative control

# 8. Photo Lab / Interactive Camera Simulator

# 8.1 Purpose

The Photo Lab provides controlled experimentation without requiring the learner to physically change camera settings. It is the main bridge between theory and intuition.

# 8.2 Labs

| **Lab** | **Controls** | **Result** |
|---|---|---|
| Shutter Speed | Shutter | Motion + exposure |
| Aperture | Aperture | DOF + exposure |
| ISO | ISO | Noise + exposure |
| Depth of Field | Aperture, focal length, focus distance, camera distance | DOF relationships |
| Focal Length | Focal length | FOV + framing |
| Camera Distance | Camera distance | Perspective + framing |
| Exposure Triangle | Shutter, aperture, ISO | Trade-offs |
| Free Experiment | Combined controls | Integrated understanding |

# 8.3 Depth of Field Lab

This Lab must let the user change focal length, aperture, focus distance and camera distance on a stable scene. It must show the resulting focus/blur relationship and explain which variable changed what. The learner must be able to reset to a canonical state and compare states.

# 8.4 Lab State

```
LabAttempt {
  id
  userId
  labId
  labVersion
  sceneId
  controls
  derivedMetrics
  prediction
  challengeResult
  startedAt
  completedAt
}
```

# 8.5 Deterministic Scoring

Scoring uses deterministic formulas/rules. AI must not decide whether a learner correctly selected a numeric shutter/aperture/ISO target when the expected result can be calculated directly.

# 9. Practice and Challenge

# 9.1 Practice Creation

A lesson can create a real-world assignment. The assignment records objective, constraints, required concept, submission requirements, deadline if any and the skill evidence it contributes.

# 9.2 Example

After the shutter-speed lesson, CAMAI may assign: photograph a moving subject, produce one frame with intentional motion control, record the camera settings through EXIF where available, and add a short learner note explaining the choice.

# 9.3 Submission Pipeline

```
Capture / Gallery Import
 → Local validation
 → EXIF extraction
 → Thumbnail generation
 → Private upload
 → Submission record
 → AI analysis job
 → Review
 → Skill evidence
```

# 9.4 Challenge States

```
DRAFT → AVAILABLE → IN_PROGRESS → SUBMITTED → SCORED → COMPLETED
                                   ↘ NEEDS_RETRY
```

# 10. AI Photography Teacher

# 10.1 Purpose

AI Teacher is the online, server-side multimodal coaching system in the current architecture. It receives a submitted photograph and structured context and returns evidence-based feedback.

# 10.2 Review Categories

- Composition
- Exposure
- Focus
- Depth of field
- Motion
- Lighting
- Color
- Background
- Subject separation
- Visual storytelling
- Assignment compliance
- Technical metadata

# 10.3 AI Pipeline

```
Photo Submission
 → Media Validation
 → EXIF Extraction
 → Deterministic Technical Analysis
 → Image Preprocessing
 → Vision Model
 → Reasoning / Language Model
 → JSON Schema Validation
 → Policy / Truthfulness Checks
 → Persist Review
 → Update Skill Evidence
```

# 10.4 AI Input Contract

```
{
  "assignment": {},
  "lessonObjective": "...",
  "learnerLevel": "...",
  "skillState": {},
  "exif": {},
  "technicalAnalysis": {},
  "imageReference": "...",
  "labEvidence": {}
}
```

# 10.5 AI Output Contract

```
{
  "summary": "...",
  "strengths": [],
  "issues": [],
  "evidence": [],
  "actions": [],
  "nextExercise": {},
  "confidence": 0.0,
  "modelVersion": "...",
  "promptVersion": "..."
}
```

# 10.6 AI Truthfulness Rules

- Never invent EXIF.
- Never state an exact setting when it is absent.
- Separate visible evidence from interpretation.
- State uncertainty when the image cannot support a conclusion.
- Do not claim professional certification or objective artistic truth.
- Recommendations must connect to the learner's current skill and assignment.

# 10.7 Online vs Offline AI

| **Capability** | **Execution** |
|---|---|
| Live scene signals | On-device where feasible |
| Photo Lab | On-device |
| Basic rules | On-device |
| AI photo critique | Online/server-side |
| AI conversational teacher | Online/server-side |
| Future compact local critique model | Optional future architecture extension |

# 11. Profile and Photography Progress

# 11.1 Profile

- Name/display name
- Account email
- Profile image optional
- Language
- Notification preferences
- Privacy controls
- Offline content management
- Account security
- Data export/delete

# 11.2 Skill Graph

| **Skill** | **Evidence** |
|---|---|
| Shutter Control | Lesson + prediction + challenge + practice |
| Aperture Control | Lesson + Lab + practice |
| ISO Control | Lesson + Lab + low-light practice |
| Depth of Field | DOF Lab + real photo |
| Focal Length | Focal Length Lab + practice |
| Camera Distance | Distance Lab + practice |
| Exposure | Exposure Triangle + submissions |
| Composition | Composition lessons + AI reviews |
| Lighting | Lessons + practice + AI review |
| Focus | Camera guidance + real photos |
| Creative Control | Open challenges + reflection |

# 11.3 Mastery States

NOT_STARTED → INTRODUCED → PRACTICING → DEVELOPING → COMPETENT → MASTERED

# 11.4 Progress Calculation

Progress must preserve raw evidence. A mastery algorithm can use recency, difficulty, repetition, prediction accuracy, challenge scores and transfer to real-world images. The exact weights must be versioned so historical results remain explainable.

# 12. Personal Photo Library

# 12.1 Purpose

The user can keep photographs submitted to CAMAI and their associated learning context. This is not intended to replace a full photo-management application.

# 12.2 Photo Detail

- Full preview
- Thumbnail
- Capture date
- EXIF when available
- Assignment
- Lesson
- Skill tags
- AI review
- Personal notes
- Submission status
- Delete

# 12.3 Search and Filter

- By skill
- By lesson
- By assignment
- By date
- By reviewed/unreviewed
- By mastery relevance

# 13. Web Admin Portal

# 13.1 Purpose

A secure web application is built for the CAMAI owner/admin. It is not the learner-facing product. It allows the owner to see users, monitor learning activity, manage content, inspect submissions and operate the platform.

# 13.2 Admin Navigation

```
Admin Portal
├── Dashboard
├── Users
│   ├── User List
│   ├── User Detail
│   ├── Learning Progress
│   ├── Practice
│   ├── AI Reviews
│   └── Notes (only when permitted by privacy policy)
├── Learning Content
├── Photo Labs
├── Challenges
├── Practice Assignments
├── AI Reviews
├── Media / Reports
├── Analytics
├── Notifications
├── System Health
├── Roles & Permissions
└── Audit Logs
```

# 13.3 Admin Dashboard

| **Widget** | **Purpose** |
|---|---|
| Total users | Account count |
| Active learners | Users active in selected period |
| Lessons completed | Learning activity |
| Practice submissions | Real-world practice volume |
| AI reviews | Completed/failed/pending |
| Top skills | Most practiced skills |
| Weak skills | High retry / low mastery areas |
| Sync failures | Operational monitoring |
| AI queue | Job backlog |
| Recent signups | Account activity |

# 13.4 User Detail

- Account status
- Registration date
- Last activity
- Learning path
- Course progress
- Current lesson
- Skill mastery
- Lab history
- Challenge history
- Practice submissions
- AI reviews
- Achievements
- Sync status
- Device/session information allowed by privacy policy

# 13.5 Admin Actions

- Search/filter users
- Open user detail
- Suspend account according to policy
- Reset selected account flows
- Review content
- Publish content
- Create content versions
- Retry failed AI review jobs
- Inspect operational errors
- Export permitted analytics
- View audit trail

# 13.6 Admin Security

Admin access uses separate roles and permissions. Every privileged mutation is audited. The web portal must not expose raw private images or personal notes to an admin role unless the role explicitly has permission and the product privacy policy permits it.

# 14. Backend Architecture

# 14.1 Technology

| **Layer** | **Implementation** |
|---|---|
| Framework | Lesan (github.com/MiaadTeam/lesan) - MongoDB-based ODM and web framework |
| Runtime | Deno |
| Language | TypeScript (strict) |
| Database | MongoDB |
| Data modeling | Lesan models: pure fields + relations, superstruct-style validators, embedded relations |
| Cache / rate limiting | In-process cache and MongoDB TTL indexes (Redis may be added later behind the same interface) |
| Jobs / queue | MongoDB-backed Job collection, Deno workers and Deno.cron schedules |
| Storage | File model with a storage adapter: local uploads/ directory in development, S3-compatible private storage in production; signed short-lived URLs for private media |
| API | Lesan acts over a single endpoint POST /lesan; interactive /playground in development; generated TypeScript declarations |
| Auth | djwt access token + rotating refresh tokens (stored hashed in Session); activeRoleId in every request body |
| Deployment | Docker (multi-stage) / container platform |

Lesan is a Deno/Node/Bun framework built directly on the official MongoDB driver. It combines the data model and the API: models are declared with coreApp.odm.newModel, endpoints ("acts") are registered with coreApp.acts.setAct, and the client controls the response shape through the "get" projection. Single relations are embedded inside the owning document, so reads need no joins.

# 14.2 Modules

The backend is a modular Deno application. Each module is a group of Lesan models (models/) and act folders (src/).

| **Module** | **Lesan models / act folders** |
|---|---|
| auth | user (register, login, forgotPassword, resetPassword), session (refresh, logout) |
| users | user (getMe, updateMe, updateSettings, deleteMe, admin CRUD), file (avatar) |
| learning | learningPath, course, module, lesson, lessonProgress |
| photolab | lab, labScene, labChallenge, labAttempt, labEvent, labResult, deterministic labScoring |
| practice | practiceAssignment, practiceSubmission |
| media | file (requestUpload, completeUpload, getSignedUrl), storage adapter |
| ai | aiReview, job, AI gateway (utils/ai) with provider adapters |
| progress | skill, skillProgress, achievement, userAchievement |
| recommendations | recommendation, recommendationEngine |
| analytics | analyticsEvent |
| notifications | notification, notification jobs |
| admin | admin-guarded acts: dashboardStatistic, user inspection, content CMS and publish, AI review queue |
| audit | auditLog (read-only, written by system code) |
| sync | sync.push and sync.pull acts for the offline outbox |

# 14.3 Repository Structure

```
back/
├── deno.json               # Deno project configuration and tasks
├── mod.ts                  # Entry point: coreApp, models, acts, workers, runServer
├── Dockerfile              # Multi-stage Docker configuration
├── declarations/           # Generated type declarations (typeGeneration)
├── models/                 # Lesan model definitions
│   ├── mod.ts              # Model exports
│   ├── excludes.ts         # Field exclusion lists
│   ├── indexes.ts          # Index bootstrap
│   ├── *.ts                # One file per model
│   └── utils/              # createUpdateAt, shared validators
├── src/                    # Act implementations
│   ├── mod.ts              # Functions setup module
│   ├── user/  session/  file/
│   ├── learningPath/  course/  module/  lesson/
│   ├── lab/  labScene/  labChallenge/
│   ├── lessonProgress/  labAttempt/  labEvent/  labResult/
│   ├── practiceAssignment/  practiceSubmission/  aiReview/
│   ├── note/  skill/  skillProgress/  recommendation/
│   ├── achievement/  userAchievement/
│   ├── notification/  analyticsEvent/  auditLog/
│   └── sync/               # push, pull
├── jobs/                   # worker loop, job handlers, Deno.cron schedules
├── uploads/                # Static upload directory (development)
├── http/                   # e2e.json, e2e-with-remove.json (playground collections)
├── scripts/migrations/     # One-off Deno migration scripts
└── utils/                  # context, grantAccess, activeRole, setToken, setUser,
                            # readScope, authzPolicy, checkContentEditable, labScoring,
                            # skillEngine, recommendationEngine, resumeResolver,
                            # signedUrl, audit, errors, ai/ (gateway + providers)
```

Each act lives in its own subfolder with three files: mod.ts (registers the act with Lesan), [action].fn.ts (implementation) and [action].val.ts (validator).

# 14.4 Backend Rules

- Acts validate and route; domain services in utils/ contain business logic.
- Persistence is reached only through Lesan models; shared queries are wrapped in utils/ helpers.
- AI SDKs are isolated behind provider interfaces in utils/ai/providers.
- Queue workers are idempotent.
- Published content is immutable.
- All user-scoped queries enforce authorization (ownerScope / readScope).
- Media URLs are signed and short-lived.
- No AI secrets in Android; keys exist only in backend environment variables.
- Prefer deleting redundant models over maintaining them.

# 14.5 Lesan Conventions

Request shape. All calls are POST /lesan with the token in the request header:

```
{
  "service": "main",
  "model": "lesson",
  "act": "get",
  "details": {
    "set": { "activeRoleId": "<uuid>", "_id": "<objectId>" },
    "get": { "_id": 1, "title": 1, "objective": 1, "module": { "_id": 1, "title": 1 } }
  }
}
```

Model definition. Every model exports pure fields, relations and a factory, and spreads createUpdateAt:

```
export const model_pure = {
  name: string(),
  description: optional(string()),
  ...createUpdateAt,
};

export const model_relations = {
  relationName: {
    schemaName: "targetModel",
    type: "single" as RelationDataType,
    optional: true,
    excludes: target_excludes,
    relatedRelations: {
      reverseRelation: {
        type: "multiple" as RelationDataType,
        limit: 50,
        sort: { field: "_id", order: "desc" as RelationSortOrderType },
      },
    },
  },
};

export const modelFactory = () =>
  coreApp.odm.newModel("modelName", model_pure, model_relations);
```

Action pattern. Registration, validator and implementation (example: note.add):

```
// add/mod.ts
export const addSetup = () =>
  coreApp.acts.setAct({
    schema: "note",
    fn: addFn,
    actName: "add",
    preAct: [setTokens, setUser, grantAccess([{ roles: ["Learner", "Admin", "Manager"] }])],
    validator: addValidator(),
    validationRunType: "create",
  });

// add/add.val.ts
export const addValidator = () =>
  object({
    set: object({
      ...activeRoleMixin,
      operationId: string(),
      targetType: enums(["lesson", "lab", "practice", "photo", "general"]),
      targetId: optional(string()),
      body: string(),
      pinned: optional(boolean()),
    }),
    get: selectStruct("note", 1),
  });

// add/add.fn.ts
export const addFn: ActFn = async (body) => {
  const { set, get } = body.details;
  const { user }: MyContext = coreApp.contextFns.getContextModel() as MyContext;
  const { activeRoleId, ...rest } = set;
  return await note.insertOne({
    doc: rest,
    projection: get,
    relations: { user: { _ids: [new ObjectId(user._id)] } },
  });
};
```

Relation rules:

- Relations are one-directional and never duplicated. The child (the model that belongs to another) defines the relation and uses relatedRelations; Lesan creates and maintains the reverse on the parent. Parents never redefine it.
- Single relations are embedded as inline subdocuments (all pure fields + _id). They cost no extra query, and sub-fields such as lesson.module._id are indexable like top-level fields.
- Use relations instead of fooId + fooName pure fields. Use pure-field snapshots only for immutable audit data or when the reference must survive deletion of the source.
- Limit reverse arrays with limit and sort. Never put unbounded collections (lab events, evidence history, analytics) in relatedRelations; query them by attempt._id or user._id instead. Respect the MongoDB 16 MB document limit.
- Use excludes so passwords, refreshTokenHash and storageKey never appear in embedded copies.
- Separate pure field updates (update) from relation updates (updateRelations).

Parent-child example (Lesan creates module.lessons from lesson.module):

```
export const lesson_relations = {
  module: {
    schemaName: "module",
    type: "single" as RelationDataType,
    optional: false,
    relatedRelations: {
      lessons: {
        type: "multiple" as RelationDataType,
        limit: 100,
        sort: { field: "order", order: "asc" as RelationSortOrderType },
      },
    },
  },
};
```

Deletion (hardCascade). deleteOne accepts hardCascade (default false). Without it, deleting a child removes it from the parent automatically, and deleting a parent that still has children is blocked. With hardCascade: true the parent and all children are deleted. Rules: delete children first; never use hardCascade for routine cleanup; only the audited account-deletion job may use it. Remove acts always pass hardCascade: hardCascade || false.

# 14.6 Authentication and Authorization

Authentication: djwt short-lived access token in the request header and a rotating refresh token stored hashed in Session. Reuse of a revoked refresh token revokes the whole session chain. Every request body includes activeRoleId; the setTokens and setUser pre-acts load the user and the active role.

Roles: Manager, Admin, ContentEditor, Reviewer (AI review queue) and Learner (mobile users). Each role has a unique roleId (UUID), name and optional scopeType/scopeId. isGhost marks the bootstrap user created by tempUser; it bypasses checks only while the active role has no scope.

Authorization has three layers and every act must use the right ones:

- Role gate - grantAccess(checks) in preAct declares which roles may call an act. It reads activeRoleId and never trusts client-supplied scope IDs.
- DB-derived ownership and scope - ownerScope, readScope and writeScope derive scope from the database target (attempt, submission, note, file...) and the token user. readScope builds Mongo filters for get/gets so a payload filter cannot widen results.
- Object rules in shared utilities - checkAttemptOwner, checkSubmissionOwner, checkContentEditable (blocks edits to Published content) and checkQuota (AI cost/quota).

Every write loads the target document and checks ownership or scope before mutating; a role gate alone is insufficient. Manager and Admin bypass scope checks but must still be listed in grantAccess. Ghost bypass is evaluated only through the shared helpers in utils/authzPolicy.ts (isGhostScopeBypass, isScopeBypass). Every admin mutation writes an AuditLog entry through utils/audit.ts.

# 14.7 Background Jobs

- The Job collection holds queue, payload, status (queued, running, done, failed, dead), attempts, maxAttempts, runAt, lockedUntil, lastError and a unique idempotencyKey.
- A worker loop (jobs/worker.ts) started from mod.ts locks jobs atomically with findOneAndUpdate (queued to running, lockedUntil).
- Retries use exponential backoff up to maxAttempts, then the job becomes dead and is visible in the Admin Portal (dead-letter handling).
- Deno.cron schedules notification dispatch, analytics rollup, expired session and file cleanup and account-deletion execution.
- The queue sits behind enqueue()/process() so it can move to Redis later without changing callers.

# 14.8 Media Handling

- file.requestUpload creates a File (status pending) and returns a short-lived signed upload URL (S3 adapter) or a one-time upload token (local adapter).
- The client uploads the binary.
- file.completeUpload verifies size, MIME type and magic bytes, extracts safe metadata (EXIF summary, dimensions) and sets status uploaded.
- Reads go through file.getSignedUrl (short-lived; owner or admin only). Private user photos are never served from a public static path.

# 14.9 Pure Domain Logic

Calculations live in utils/, never in act files, so they are unit-testable and shared:

- labScoring.ts - deterministic exposure, depth-of-field and field-of-view formulas. The server implementation must match the Android engine test vectors; AI never decides numeric correctness.
- skillEngine.ts - evidence-based mastery state calculation.
- recommendationEngine.ts - next-activity selection with reasonCode explainability.
- resumeResolver.ts - learning resume algorithm.

# 15. Database Design

# 15.1 Core Models

The relational tables of earlier versions are replaced by Lesan (MongoDB) models. Field names are camelCase and every model spreads createUpdateAt. Relations are listed per model; see 15.2 for the full map.

Identity and account domain

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| User | users, user_settings | displayName, email, mobile?, password (hash), is_verified, isGhost, status (active\|suspended\|deleted), settings {language, notifications, privacy}, roles [{roleId, name, scopeType?, scopeId?}] | avatar (File) |
| Session | sessions | refreshTokenHash, device, expiresAt (TTL), revokedAt? | user |
| File | media_assets | name, mimeType, size, type (image\|video\|docs\|other), storageKey, metadata, status (pending\|uploaded\|failed) | owner (User) |

Learning content domain (versioned, immutable once published)

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| LearningPath | learning_paths | key, title, version, status (Draft\|Published\|Archived) | - |
| Course | courses | title, version, status, order | path (LearningPath) |
| Module | modules | title, order | course (Course) |
| Lesson | lessons | key, title, objective, version, status, order, blocks (embedded array) | module (Module); prerequisiteSkills (Skill, multiple, optional) |
| Lab | labs | labType (shutter\|aperture\|iso\|depthOfField\|focalLength\|cameraDistance\|exposureTriangle\|freeExperiment), version, status, configuration | lesson (Lesson); scene (LabScene) |
| LabScene | lab_scenes | assets (File refs), cameraModel (camera math parameters) | - |
| LabChallenge | lab_challenges | version, rules (deterministic) | lab (Lab) |

Learner activity domain

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| LessonProgress | lesson_progress | version, currentBlock, status (notStarted\|inProgress\|completed), completedAt? | user; lesson |
| LabAttempt | lab_attempts | labVersion, sceneId, controls, derivedMetrics, prediction, challengeResult, startedAt, completedAt, operationId (unique) | user; lab; challenge? |
| LabEvent | lab_events | operationId (unique), eventType, payload | attempt (no reverse array on LabAttempt) |
| LabResult | lab_results | score, metrics (deterministic) | attempt |
| PracticeAssignment | practice_assignments | status (assigned\|inProgress\|submitted\|reviewed\|failed), dueAt? | user; lesson; skill; sourceLab? |
| PracticeSubmission | practice_submissions | status (pending\|submitted\|reviewing\|reviewed\|failed), operationId (unique), note? | assignment; media (File) |
| Note | notes | targetType (lesson\|lab\|practice\|photo\|general), targetId, body, pinned, operationId | user |

AI and job domain

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| AiReview | ai_reviews | provider, model, promptVersion, reviewVersion, status (queued\|running\|valid\|failed), result (schema-validated), errorDiagnostics? (no secrets), attempts | submission (PracticeSubmission); user |
| Job | (BullMQ queues) | queue (aiReview\|notification\|analyticsRollup\|cleanup), payload, status, attempts, maxAttempts, runAt, lockedUntil, lastError?, idempotencyKey (unique) | - (ids in payload) |

Progress and engagement domain

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| Skill | skills | key (stable), title, version | - |
| SkillProgress | skill_progress | state (unseen\|learning\|practicing\|competent\|mastered), evidence (capped embedded array {type, refId, score, at}; older evidence archived) | user; skill |
| Recommendation | recommendations | reasonCode, activityType, activityId, status (new\|shown\|dismissed\|done) | user |
| Achievement | achievements | key, definition (embedded rules) | - |
| UserAchievement | user_achievements | awardedAt | user; achievement |

Operations domain

| **Model** | **Replaces** | **Key fields** | **Relations** |
|---|---|---|---|
| AnalyticsEvent | analytics_events | sessionId, eventType, payload; TTL index per retention policy | user? (honors privacy setting) |
| AuditLog | audit_logs | action, targetType, targetId, metadata; read-only | adminUser (User) |
| Notification | (new) | type, title, body, readAt?, scheduledAt? | user |

# 15.2 Relation Map

```
User
  └── avatar (File)
Session            └── user (User)
File               └── owner (User)

LearningPath ─< Course ─< Module ─< Lesson   (each child defines its `parent` relation)
Lesson
  ├── module (Module)
  └── prerequisiteSkills (Skill) [multiple, optional]
Lab
  ├── lesson (Lesson)
  └── scene (LabScene)
LabChallenge       └── lab (Lab)

LessonProgress
  ├── user (User)
  └── lesson (Lesson)
LabAttempt
  ├── user (User)
  ├── lab (Lab)
  └── challenge (LabChallenge) [optional]
LabEvent           └── attempt (LabAttempt)
LabResult          └── attempt (LabAttempt)

PracticeAssignment
  ├── user (User)
  ├── lesson (Lesson)
  └── skill (Skill)
PracticeSubmission
  ├── assignment (PracticeAssignment)
  └── media (File)
AiReview
  ├── submission (PracticeSubmission)
  └── user (User)

Note               └── user (User)   (targetType/targetId are pure fields: polymorphic target)
SkillProgress
  ├── user (User)
  └── skill (Skill)
Recommendation     └── user (User)
UserAchievement
  ├── user (User)
  └── achievement (Achievement)
Notification       └── user (User)
AuditLog           └── adminUser (User)
```

# 15.3 Indexing

Indexes are created by models/indexes.ts at startup:

- Unique operationId (per user) on LabAttempt, LabEvent, PracticeSubmission and Note for idempotent mutations.
- { "user._id": 1, updatedAt: -1 } on LessonProgress, SkillProgress, LabAttempt, Note and PracticeAssignment for progress and history.
- { status: 1, runAt: 1 } on Job and { status: 1, createdAt: -1 } on AiReview for queues.
- { targetType: 1, targetId: 1 } on Note.
- { "owner._id": 1, createdAt: -1 } on File for media owner and creation time.
- { key: 1, version: -1 } and { status: 1 } on content models.
- TTL indexes on Session.expiresAt and AnalyticsEvent.createdAt.
- Embedded relation fields (for example lesson.module._id) are indexed like top-level fields.
- Referential integrity is maintained by Lesan relations (reverse arrays updated automatically, parent deletion blocked while children exist) plus validators.

# 16. API Specification

# 16.1 Conventions

- Endpoint: POST /lesan with service, model, act and details { set, get }.
- JSON by default; ISO-8601 timestamps.
- Stable error codes thrown with throwError("CODE: message") from utils/errors.ts: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, VALIDATION_FAILED, PUBLISHED_IMMUTABLE, QUOTA_EXCEEDED, DUPLICATE_OPERATION, AI_UNAVAILABLE.
- Request ID generated in a pre-act, stored in context and included in all logs.
- Cursor pagination: gets accepts limit and cursor (an _id; filter { _id: { $lt: cursor } }, sorted _id desc). skip is allowed only for admin tables.
- Idempotency: duplicate-sensitive writes carry operationId (UUID) in set; a unique index returns the original result on repeat.
- Bearer authentication: access JWT in the request header; activeRoleId in set for every authenticated act.
- The "get" projection selects returned fields and relation depth; type declarations are generated into declarations/.

# 16.2 Auth

| **Former endpoint** | **Lesan call** | **Access** |
|---|---|---|
| POST /v1/auth/register | user.register | public |
| POST /v1/auth/login | user.login | public |
| POST /v1/auth/refresh | session.refresh | public (refresh token) |
| POST /v1/auth/logout | session.logout | authenticated |
| POST /v1/auth/forgot-password | user.forgotPassword | public |
| POST /v1/auth/reset-password | user.resetPassword | public (reset token) |
| GET /v1/me | user.getMe | authenticated |
| PATCH /v1/me | user.updateMe | authenticated |
| PATCH /v1/me/settings | user.updateSettings | authenticated |
| DELETE /v1/me | user.deleteMe | authenticated (queues deletion job) |

# 16.3 Learning

| **Former endpoint** | **Lesan call** |
|---|---|
| GET /v1/learning/paths | learningPath.gets |
| GET /v1/learning/paths/:id | learningPath.get |
| GET /v1/courses/:id | course.get |
| GET /v1/lessons/:id | lesson.get |
| POST /v1/lessons/:id/start | lessonProgress.start |
| PATCH /v1/lessons/:id/progress | lessonProgress.update |
| POST /v1/lessons/:id/complete | lessonProgress.complete |
| GET /v1/labs/:id | lab.get |

Learner reads of content models return only Published versions. Photo Lab acts: labAttempt.add, get, gets and complete (deterministic scoring in utils/labScoring.ts; AI is never used for numeric correctness) and labEvent.addBatch.

# 16.4 Practice / Media

| **Former endpoint** | **Lesan call** |
|---|---|
| GET /v1/practice | practiceAssignment.gets |
| GET /v1/practice/:id | practiceAssignment.get |
| POST /v1/practice/from-lesson | practiceAssignment.createFromLesson |
| POST /v1/media/upload-url | file.requestUpload |
| POST /v1/media/:id/complete | file.completeUpload |
| POST /v1/practice/:id/submit | practiceSubmission.submit (creates AiReview + Job) |
| GET /v1/practice/:id/review | aiReview.getForAssignment |

# 16.5 Notes

| **Former endpoint** | **Lesan call** |
|---|---|
| GET /v1/notes | note.gets |
| POST /v1/notes | note.add |
| PATCH /v1/notes/:id | note.update |
| DELETE /v1/notes/:id | note.remove (owner only) |

# 16.6 Progress

| **Former endpoint** | **Lesan call** |
|---|---|
| GET /v1/progress | skillProgress.getOverview |
| GET /v1/progress/skills | skillProgress.gets |
| GET /v1/progress/skills/:id | skillProgress.get |
| GET /v1/progress/history | skillProgress.getHistory |
| GET /v1/recommendations/next | recommendation.getNext |
| GET /v1/achievements | userAchievement.gets |

# 16.7 Admin

| **Former endpoint** | **Lesan call** | **Roles** |
|---|---|---|
| GET /v1/admin/dashboard | user.dashboardStatistic | Manager, Admin |
| GET /v1/admin/users | user.gets | Manager, Admin |
| GET /v1/admin/users/:id | user.get | Manager, Admin |
| GET /v1/admin/users/:id/progress | skillProgress.gets (admin filter) | Manager, Admin |
| GET /v1/admin/users/:id/practice | practiceAssignment.gets (admin filter) | Manager, Admin |
| GET /v1/admin/content | <model>.gets (lesson, course, lab, ...) | ContentEditor, Admin, Manager |
| POST /v1/admin/content | <model>.add | ContentEditor, Admin, Manager |
| PATCH /v1/admin/content/:id | <model>.update (rejects Published) | ContentEditor, Admin, Manager |
| POST /v1/admin/content/:id/publish | <model>.publish | ContentEditor, Admin, Manager |
| GET /v1/admin/ai/reviews | aiReview.gets | Reviewer, Admin |
| POST /v1/admin/ai/reviews/:id/retry | aiReview.retry | Reviewer, Admin |
| GET /v1/admin/audit-logs | auditLog.gets | Manager, Admin |

# 16.8 Synchronization

- sync.push accepts a batch of operations { operationId, entityType, op, payload, clientTimestamp }, applies each through the same domain functions as the single acts and returns a per-operation result: ack, duplicate or rejected(code).
- sync.pull returns changes since a cursor (updatedAt/_id) for the user's own data and for newly published content versions.

# 16.9 Standard Acts per Model

Most models expose add, get, gets, update, updateRelations, remove and count. Read-only models (AuditLog, LabEvent, LabResult, AnalyticsEvent) expose only get, gets and count and are written by system code. Remove acts are restricted to Manager/Admin and accept { _id, activeRoleId, hardCascade? } following the standard deleteOne pattern.

# 17. Offline-First Architecture

# 17.1 Offline Features

- Downloaded lessons
- Photo Labs
- Predictions
- Challenges that use local deterministic logic
- Local practice drafts
- Notes
- Local progress
- Photo metadata extraction
- Queued AI review
- Queued synchronization

# 17.2 Sync Engine

```
Local Mutation
 → Outbox
 → Connectivity Monitor
 → WorkManager
 → API
 → Idempotency Check
 → Server ACK
 → Mark Synced

Conflict:
published content = server authority
unsynced attempt = client preserved
progress = evidence-based merge
notes = operation-based merge
media = never silently delete
```

Backend implementation (Lesan): the sync.push act accepts the outbox batch, checks each operationId against the unique indexes (idempotency check) and applies the operation through the same domain functions as the regular acts, returning ack, duplicate or rejected per operation. sync.pull returns server-side changes since a cursor. Unsynced attempts are stored with their original content version reference; progress evidence is merged by operationId; notes merge by operation; media is soft-deleted with a retention job and never silently removed.

# 17.3 Content Versioning

Every lesson, Lab and challenge has a published version. A LabAttempt stores the exact version used. Future edits create a new version instead of changing the historical meaning of an old attempt.

# 18. AI and Offline/Online Architecture

# 18.1 Hybrid Model

CAMAI uses two AI layers. Fast, privacy-sensitive, frame-level signals should run locally when feasible. Deep image critique and conversational teaching run through the backend AI gateway.

# 18.2 AI Gateway

```
Android
  ↓
Backend AI Gateway
  ├── Provider Adapter A
  ├── Provider Adapter B
  ├── Prompt Registry
  ├── Schema Validator
  ├── Cost/Quota
  ├── Safety/Truthfulness
  └── Retry/Fallback
```

Backend implementation (Lesan): the gateway lives in utils/ai/. practiceSubmission.submit creates an AiReview (status queued) and a Job; a Deno worker runs the pipeline: prompt registry, provider adapter with fallback, schema validation, truthfulness and safety checks, per-user quota (checkQuota) and exponential-backoff retry. Provider keys come only from environment variables (AI_PROVIDER_A_KEY, AI_PROVIDER_B_KEY, AI_DAILY_QUOTA). No AI SDK is imported outside utils/ai/providers.

# 18.3 Model Versioning

Persist provider, model version, prompt version and review version with every AI review. This is required for debugging, quality evaluation and future re-review.

# 18.4 AI Failure

- Queue retry with exponential backoff.
- Show pending state to user.
- Do not mark the assignment as reviewed until a valid structured result exists.
- Allow controlled admin retry.
- Preserve failed-job diagnostics without exposing secrets.

# 19. Admin Web Technology

# 19.1 Recommended Stack

| **Component** | **Technology** |
|---|---|
| Framework | Next.js + TypeScript |
| UI | React |
| Styling | Tailwind CSS or equivalent design system |
| Data fetching | Typed API client |
| Authentication | Secure server-aware session/token strategy |
| Charts | A tested chart library |
| Tables | Virtualized/paginated table where required |
| Testing | Playwright + unit/component tests |

# 19.2 Admin Pages

- Login
- Dashboard
- Users
- User detail
- Learning content
- Lesson editor
- Lab editor
- Challenge editor
- Practice assignments
- AI review queue
- Media moderation/operations
- Analytics
- Notifications
- System health
- Roles
- Audit logs
- Settings

# 19.3 User List

Admin can search by user ID/email/display name where policy allows, filter by status, registration date, last activity, learning activity and practice status, paginate results and open a detailed user record.

# 20. Notifications

# 20.1 Notification Types

- Continue learning reminder
- Practice reminder
- AI review ready
- Challenge result
- Achievement unlocked
- New course available
- System message

# 20.2 Rules

- User controls notification preferences.
- No sensitive photo content in push notification text.
- Deep links open the relevant CAMAI screen.
- Notifications must be idempotent.

# 21. Security and Privacy

# 21.1 Security

- TLS everywhere.
- Password hashing.
- Access/refresh token separation.
- Refresh rotation.
- RBAC for admin.
- Object-level authorization.
- Signed private media URLs.
- Rate limiting.
- Input validation.
- CSRF protection for applicable web flows.
- Audit logs.
- Secret management.
- Dependency scanning.
- Secure headers.
- Database least privilege.

# 21.2 Privacy

- Private photos by default.
- Explicit consent for optional public use.
- Remote AI processing clearly disclosed.
- Account deletion.
- Data export.
- Retention policy.
- No continuous camera upload by default.
- Do not include image bytes in analytics.

# 22. Analytics

# 22.1 Events

| **Event** | **Required fields** |
|---|---|
| user_registered | userId, timestamp |
| lesson_started | lessonId, version |
| lesson_progressed | lessonId, blockId |
| lesson_completed | lessonId, version |
| lab_started | labId, version |
| lab_control_changed | labId, parameter |
| prediction_submitted | questionId, correctness |
| challenge_completed | challengeId, score |
| practice_submitted | assignmentId |
| ai_review_completed | reviewId, modelVersion |
| note_created | targetType, targetId |
| skill_updated | skillId, oldState, newState |
| recommendation_opened | activityId, reasonCode |

# 22.2 Analytics Rules

- Analytics must not block learning.
- Events can queue offline.
- Use operation/event IDs to avoid duplicate counts.
- Avoid storing unnecessary personal content.
- Analytics schema is versioned.

# 23. Error Handling

# 23.1 User-Facing Error Categories

| **Category** | **Behavior** |
|---|---|
| Network unavailable | Offer offline continuation or retry. |
| Upload failed | Preserve local file and offer retry. |
| AI pending | Show processing state. |
| AI failed | Explain retry without exposing internals. |
| Permission denied | Explain required permission and alternative. |
| Unsupported camera feature | Hide/disable unsupported control. |
| Content unavailable | Show cached version or safe error. |
| Authentication expired | Attempt refresh; otherwise request login. |

# 23.2 Error Contract

```
{
  "code": "MEDIA_UPLOAD_FAILED",
  "message": "The photo could not be uploaded.",
  "requestId": "req_...",
  "retryable": true
}
```

# 24. Performance Requirements

| **Area** | **Requirement** |
|---|---|
| Smart Camera | Local guidance must remain responsive and must not wait for cloud inference. |
| Photo Lab | Controls should feel interactive; avoid full-scene reprocessing for every small UI event. |
| Learning | Cached lessons open offline. |
| Upload | Background upload with retry. |
| AI | Asynchronous processing. |
| Backend | Stateless API instances where possible. |
| Database | Indexes for user/status/history queries. |
| Queue | Retry + dead-letter handling. |
| Web Admin | Paginated/virtualized large user tables. |

# 25. Testing Strategy

# 25.1 Test Layers

- Unit tests
- Integration tests
- API contract tests
- Database migration tests
- Android UI tests
- Camera capability tests
- Photo Lab regression tests
- Offline synchronization tests
- AI schema tests
- AI benchmark tests
- Security tests
- Web end-to-end tests
- Performance tests

# 25.2 Photography Regression Tests

| **Scenario** | **Expected** |
|---|---|
| 1/30 → 1/125 | Shorter exposure and lower motion-blur tendency |
| 1/125 → 1/2000 | Much shorter exposure and stronger freeze-motion tendency |
| f/1.4 → f/8 | Smaller aperture and deeper DOF tendency under fixed assumptions |
| ISO 100 → 6400 | Higher simulated noise |
| 24mm → 85mm | Narrower FOV |
| 85mm → 200mm | Narrower FOV |
| Closer focus | Different focus/DOF relationship |
| Move camera position | Perspective relationship changes |

# 25.3 Critical Account Tests

- Register → login → logout → login.
- Refresh token rotation.
- Forgot/reset password.
- Offline progress → login → sync.
- Two-device note editing.
- Duplicate sync request.
- Account deletion.
- Unauthorized user media access must fail.
- Admin without permission must not access restricted data.

# 26. CI/CD and Infrastructure

# 26.1 Repositories

```
/android
/backend
/admin-web
/content
/infrastructure
/docs
```

# 26.2 Pipeline

1. Format/lint
2. Unit tests
3. Integration tests
4. Build Android
5. Build backend (deno check, Docker image)
6. Build admin
7. Security/dependency scan
8. Container build
9. Deploy staging
10. Smoke tests
11. Manual/automated production approval
12. Production deployment
13. Post-deploy monitoring

# 26.3 Environments

| **Environment** | **Purpose** |
|---|---|
| Local | Individual development |
| Development | Team integration |
| Staging | Production-like QA |
| Production | Real users |

# 27. Content Management and Versioning

# 27.1 Published Content Rule

A published lesson/Lab/challenge is immutable. Changes create a new version. This protects the integrity of historical attempts and analytics.

# 27.2 Content Validation

- All referenced IDs exist.
- All assets exist.
- Prerequisites resolve.
- Scoring weights are valid.
- Ranges are valid.
- Every challenge has a pass condition.
- Every practice assignment maps to a skill.
- Translations are complete where required.
- Version can be rendered without missing dependencies.

# 28. Recommendation Engine

# 28.1 Inputs

- Current skill state
- Recent mistakes
- Prediction accuracy
- Challenge scores
- Practice history
- AI review issues
- Lesson prerequisites
- User preferences
- Recency

# 28.2 Outputs

| **Recommendation** | **Example** |
|---|---|
| Continue lesson | Resume Depth of Field lesson at saved block. |
| Repeat Lab | Repeat Aperture Lab because prediction accuracy is low. |
| Practice | Shoot a real subject-background separation photo. |
| Review | Read the lesson on camera distance. |
| Challenge | Attempt a harder composition challenge. |

# 28.3 Explainability

Every recommendation stores a reasonCode and human-readable explanation so the user understands why CAMAI is suggesting it.

# 29. Complete User Journeys

# 29.1 New User

1. Install CAMAI.
2. Open Welcome.
3. Create account or continue offline.
4. Select language/preferences.
5. See recommended learning path.
6. Start first lesson.
7. Complete interactive section.
8. Complete Photo Lab.
9. Make prediction.
10. Complete challenge.
11. Receive real-world practice.
12. Submit photograph.
13. AI Teacher reviews it.
14. Progress updates.
15. CAMAI recommends next activity.

# 29.2 Returning User

1. Open app.
2. Authenticate automatically if session is valid.
3. Home reads progress.
4. Show Continue Learning.
5. Restore exact lesson position.
6. Continue Lab/lesson.
7. Complete or save.
8. Update progress.
9. Show next recommendation.

# 29.3 Offline User

1. Open app without network.
2. Read downloaded lesson.
3. Run Lab.
4. Take notes.
5. Complete challenge.
6. Save local progress.
7. Submit practice locally.
8. When connection returns, upload/sync.
9. AI review enters queue.
10. Notify user when review is ready.

# 29.4 Admin

1. Admin login.
2. Dashboard.
3. Search user.
4. Open user detail.
5. Inspect progress/practice/reviews according to permission.
6. Manage content.
7. Create new version.
8. Validate.
9. Publish.
10. Monitor AI/media/queue health.
11. Review audit logs.

# 30. Full Feature Inventory

# 30.1 Inventory

| **Group** | **Capabilities** |
|---|---|
| Identity | Registration, login, recovery, sessions, deletion, guest/offline mode |
| Learning | Curriculum, lessons, resume, notes, progress |
| Simulation | All eight Photo Labs, prediction, challenge, deterministic scoring |
| Practice | Assignments, capture/import, EXIF, submission, history |
| AI | Critique, conversation, structured review, recommendations |
| Camera | Scene understanding, subject, composition, motion, light, depth guidance |
| Progress | Skill graph, mastery, achievements, streak, history |
| Data | Cloud storage, notes, media, synchronization, export |
| Admin | Users, content, labs, challenges, reviews, analytics, audit |
| Platform | Security, privacy, notifications, offline, monitoring, CI/CD |

# 31. Definition of Done

- Feature matches this specification.
- UI has loading/empty/offline/error states.
- Data is persisted correctly.
- Offline behavior is defined and tested where applicable.
- Authorization is enforced.
- Analytics event is implemented if required.
- Unit tests cover non-trivial logic.
- Integration tests cover important boundaries.
- Accessibility labels exist.
- Localization does not break layout.
- API acts are documented through Lesan validators, generated type declarations and playground e2e collections.
- Index bootstrap and migration scripts are included.
- AI output is schema-validated.
- Logs contain request/job identifiers but no secrets.
- Build and CI pass.
- Acceptance criteria are verified on supported Android devices.

# 32. AI Coding Agent Contract

# 32.1 Rules

- Read this specification before coding.
- Inspect the existing repository before changing it.
- Never invent a missing API or database field when a documented contract exists.
- Never put domain rules in Compose UI.
- Never duplicate camera mathematics.
- Never hard-code AI provider credentials.
- Never make cloud AI mandatory for offline Photo Lab.
- Never silently delete unsynced user data.
- Never modify published content in place.
- Write tests before/with complex logic.
- Keep changes small and buildable.
- After each task report files changed, tests run, build result and known limitations.
- Backend: never define the same relation on both Lesan models; the child defines it and relatedRelations creates the reverse.
- Backend: never trust a client-provided scope ID; derive scope from the database and the token user.
- Backend: never use hardCascade for routine cleanup; delete children before parents.
- Backend: never put unbounded collections in relatedRelations.

# 32.2 Android Bootstrap Prompt

```
Implement CAMAI Android according to the Master Specification v4.0.
Use Kotlin, Jetpack Compose, Hilt, Room, DataStore, Retrofit/OkHttp,
WorkManager and CameraX.

Start by inspecting the repository. Preserve existing working code.
Create domain boundaries for learning, photolab, practice, teacher,
progress and smartcamera. Implement local-first persistence and an
outbox sync mechanism. Do not put product logic inside UI.
```

# 32.3 Backend Bootstrap Prompt

```
Implement the CAMAI backend as a Deno + Lesan application following the
backend sections of this specification (AGENTS.md conventions).
Use MongoDB, djwt and the Lesan act pattern (mod.ts, *.fn.ts, *.val.ts per action).
Use a MongoDB-backed Job queue with Deno workers and an S3-compatible storage adapter.
Implement auth, users, learning, photolab, practice, media, ai,
progress, recommendations, notifications, admin, audit and sync modules.
Expose Lesan acts via POST /lesan with validators, three-layer authorization
(grantAccess, DB-derived scope, object rules), operationId idempotency and
structured errors. Keep domain math in utils/. Never trust client-provided
scope IDs. Never define a relation on both models.
After each task report files changed, tests run, build result and known limitations.
```

# 32.4 Admin Web Bootstrap Prompt

```
Implement the CAMAI Admin Portal as a secure TypeScript React/Next.js
application. Implement admin authentication, RBAC, dashboard, user
search/detail, progress inspection, content CMS, Lab/challenge CMS,
AI review queue, analytics, system health and audit logs.
All data must come from the documented backend API.
```

# 33. Recommended Implementation Order

1. Repository and engineering conventions.
2. Backend foundation (Deno + Lesan, MongoDB, models bootstrap, errors, request ID, tempUser) and authentication (User, Session, djwt, grantAccess).
3. Android foundation, navigation and design system.
4. Account and profile.
5. Learning content API and local cache.
6. Lesson renderer and resume state.
7. Photo Lab engine with Shutter Lab.
8. Aperture, ISO, DOF, Focal Length, Camera Distance, Exposure Triangle and Free Experiment.
9. Prediction and Challenge engine.
10. Practice assignment and media upload.
11. Notes system across lesson/photo/practice/Lab.
12. Progress and skill evidence.
13. AI Teacher gateway and asynchronous review (utils/ai, Job queue with Deno workers, aiReview).
14. Offline outbox and robust synchronization (Android outbox + backend sync.push / sync.pull).
15. Smart Camera local analysis and guidance.
16. Admin web portal.
17. Analytics, notifications and observability.
18. Security, accessibility, performance and device QA.
19. Production deployment.

# 34. Master System Relationship

```
ACCOUNT
  ↓
PROFILE + SETTINGS
  ↓
LEARNING PATH
  ↓
LESSON
  ↓
PHOTO LAB
  ↓
PREDICTION
  ↓
CHALLENGE
  ↓
REAL-WORLD PRACTICE
  ↓
PHOTO + EXIF + NOTE
  ↓
AI TEACHER
  ↓
FEEDBACK + NEXT EXERCISE
  ↓
SKILL EVIDENCE
  ↓
PROGRESS / MASTERY
  ↓
RECOMMENDATION
  ↓
NEXT LESSON

SMART CAMERA ───────────────┐
                            ↓
                      REAL-WORLD PRACTICE
                            ↑
AI TEACHER ←──────── PHOTO SUBMISSION
                            ↑
ADMIN WEB ───── CONTENT / USERS / OPERATIONS
                            ↑
BACKEND ───── AUTH / DATA / MEDIA / AI / SYNC
```

# 35. Final Product Principle

**CAMAI is not five independent screens. It is one learning system. The Smart Camera creates real-world context; Learning explains the concept; Photo Lab makes the concept visible; Practice requires the learner to use it; AI Teacher evaluates the photograph and coaches the next improvement; Profile and Progress preserve the learner's history and determine what should happen next. Accounts, notes, synchronization and the Admin Portal make this learning loop persistent and operational at product scale.**

**MASTER SPECIFICATION COMPLETE — CAMAI v4.0**

