import { assert, assertEquals, assertFalse } from "@std/assert";
import * as jwt from "djwt";
import { MongoClient, ObjectId } from "lesan";

const MONGO_URI = "mongodb://127.0.0.1:27017/";
const TOKEN_KEY = "camai-sensitive-field-test-token-key-32-bytes";
const MEDIA_SECRET = "camai-sensitive-field-test-secret-32-bytes-minimum";
const TOKEN_TTL_SECONDS = 900;
const SENSITIVE_FIELDS = [
  "password",
  "passwordResetTokenHash",
  "passwordResetExpiresAt",
  "refreshTokenHash",
  "storageKey",
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mongoReachable = await (async () => {
  try {
    const connection = await Deno.connect({
      hostname: "127.0.0.1",
      port: 27017,
    });
    connection.close();
    return true;
  } catch {
    return false;
  }
})();

const freePort = () => {
  const listener = Deno.listen({ hostname: "127.0.0.1", port: 0 });
  const { port } = listener.addr as Deno.NetAddr;
  listener.close();
  return port;
};

const assertNoSensitiveFields = (value: unknown, path = "body"): void => {
  if (Array.isArray(value)) {
    value.forEach((item, index) =>
      assertNoSensitiveFields(item, `${path}[${index}]`)
    );
    return;
  }

  if (!value || typeof value !== "object") return;

  const record = value as Record<string, unknown>;
  for (const field of SENSITIVE_FIELDS) {
    assertFalse(
      field in record,
      `${path}.${field} must never be exposed by the API`,
    );
  }

  for (const [key, child] of Object.entries(record)) {
    assertNoSensitiveFields(child, `${path}.${key}`);
  }
};

const tokenFor = async (userId: string) => {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(TOKEN_KEY),
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign"],
  );

  return await jwt.create(
    { alg: "HS512", typ: "JWT" },
    {
      _id: userId,
      email: `${userId}@example.com`,
      exp: jwt.getNumericDate(TOKEN_TTL_SECONDS),
    },
    key,
  );
};

Deno.test({
  name: "user endpoints never expose credential material",
  ignore: !mongoReachable,
  sanitizeOps: false,
  sanitizeResources: false,
  async fn(t) {
    const client = await new MongoClient(MONGO_URI).connect();
    const dbName = `camai_sec_${
      crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    }`;
    const db = client.db(dbName);
    const port = freePort();
    const baseUrl = `http://127.0.0.1:${port}/lesan`;
    const backendDir = new URL("../..", import.meta.url).pathname;

    const managerRoleId = crypto.randomUUID();
    const learnerRoleId = crypto.randomUUID();
    const secondLearnerRoleId = crypto.randomUUID();
    const statusLearnerRoleId = crypto.randomUUID();

    const managerId = new ObjectId();
    const learnerId = new ObjectId();
    const secondLearnerId = new ObjectId();
    const statusLearnerId = new ObjectId();

    const managerEmail = `manager-${managerId}@example.com`;
    const learnerEmail = `learner-${learnerId}@example.com`;
    const secondLearnerEmail = `profile-${secondLearnerId}@example.com`;
    const statusLearnerEmail = `status-${statusLearnerId}@example.com`;

    const baseUser = (
      {
        _id,
        displayName,
        email,
        roleId,
        role,
        withSecrets,
      }: {
        _id: ObjectId;
        displayName: string;
        email: string;
        roleId: string;
        role: string;
        withSecrets: boolean;
      },
    ) => ({
      _id,
      displayName,
      email,
      mobile: "09120000000",
      password: "hashed-password-value",
      is_verified: true,
      isGhost: false,
      status: "active",
      roles: [{ roleId, name: role }],
      settings: {
        language: "en",
        notifications: { push: true, email: true },
        privacy: { aiProcessingConsent: false, analyticsConsent: true },
      },
      ...(withSecrets
        ? {
          passwordResetTokenHash: "reset-token-hash-secret",
          passwordResetExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
          avatar: {
            _id: new ObjectId(),
            name: "avatar.png",
            mimeType: "image/png",
            type: "image",
            status: "uploaded",
            storageKey: "private/avatar-storage-secret",
          },
          sessions: [
            {
              _id: new ObjectId(),
              refreshTokenHash: "refresh-token-hash-secret",
              device: "test-device",
              expiresAt: new Date(Date.now() + 60 * 60 * 1000),
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
        }
        : { sessions: [] }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const managerToken = await tokenFor(managerId.toHexString());
    const learnerToken = await tokenFor(learnerId.toHexString());
    const secondLearnerToken = await tokenFor(secondLearnerId.toHexString());

    await db.collection("user").insertMany([
      baseUser({
        _id: managerId,
        displayName: "Sensitive Manager",
        email: managerEmail,
        roleId: managerRoleId,
        role: "Manager",
        withSecrets: false,
      }),
      baseUser({
        _id: learnerId,
        displayName: "Sensitive Learner",
        email: learnerEmail,
        roleId: learnerRoleId,
        role: "Learner",
        withSecrets: true,
      }),
      baseUser({
        _id: secondLearnerId,
        displayName: "Profile Learner",
        email: secondLearnerEmail,
        roleId: secondLearnerRoleId,
        role: "Learner",
        withSecrets: true,
      }),
      baseUser({
        _id: statusLearnerId,
        displayName: "Status Learner",
        email: statusLearnerEmail,
        roleId: statusLearnerRoleId,
        role: "Learner",
        withSecrets: true,
      }),
    ]);

    const command = new Deno.Command(Deno.execPath(), {
      args: ["run", "--allow-all", "mod.ts"],
      cwd: backendDir,
      env: {
        MONGO_URI,
        MONGO_DB: dbName,
        ENV: "test",
        APP_PORT: String(port),
        TOKEN_KEY,
        MEDIA_SECRET,
        ACCESS_TOKEN_TTL_SECONDS: String(TOKEN_TTL_SECONDS),
        REFRESH_TOKEN_TTL_DAYS: "1",
        STORAGE_DRIVER: "s3",
        CORS_ORIGINS: "*",
      },
      stdout: "null",
      stderr: "null",
    });

    const server = command.spawn();

    const callAct = async (
      act: string,
      details: Record<string, unknown>,
      token: string,
    ) => {
      const response = await fetch(baseUrl, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ model: "user", act, details }),
      });

      return {
        status: response.status,
        payload: await response.json(),
      };
    };

    try {
      let ready = false;
      for (let attempt = 0; attempt < 300; attempt++) {
        try {
          await fetch(baseUrl, {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              model: "user",
              act: "getMe",
              details: { set: {}, get: { _id: 1 } },
            }),
          });
          ready = true;
          break;
        } catch {
          await sleep(100);
        }
      }

      assert(ready, "test backend did not become ready");

      await t.step("getMe strips requested reset credentials", async () => {
        const { status, payload } = await callAct(
          "getMe",
          {
            set: { activeRoleId: learnerRoleId },
            get: {
              _id: 1,
              displayName: 1,
              email: 1,
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
            },
          },
          learnerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.displayName, "Sensitive Learner");
        assertEquals(payload.body.email, learnerEmail);
        assertNoSensitiveFields(payload.body);
      });

      await t.step("getMe with an empty projection stays safe", async () => {
        const { status, payload } = await callAct(
          "getMe",
          {
            set: { activeRoleId: learnerRoleId },
            get: {},
          },
          learnerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.displayName, "Sensitive Learner");
        assertNoSensitiveFields(payload.body);
      });

      await t.step("getMe strips nested session credentials", async () => {
        const { status, payload } = await callAct(
          "getMe",
          {
            set: { activeRoleId: learnerRoleId },
            get: {
              _id: 1,
              displayName: 1,
              avatar: {},
              sessions: {},
            },
          },
          learnerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.displayName, "Sensitive Learner");
        assertEquals(payload.body.avatar.name, "avatar.png");
        assertEquals(payload.body.sessions[0].device, "test-device");
        assertNoSensitiveFields(payload.body);
      });

      await t.step("user.get strips requested reset credentials", async () => {
        const { status, payload } = await callAct(
          "get",
          {
            set: {
              activeRoleId: managerRoleId,
              _id: learnerId.toHexString(),
            },
            get: {
              _id: 1,
              displayName: 1,
              email: 1,
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
              sessions: {},
            },
          },
          managerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.displayName, "Sensitive Learner");
        assertEquals(payload.body.email, learnerEmail);
        assertNoSensitiveFields(payload.body);
      });

      await t.step("user.gets strips requested reset credentials", async () => {
        const { status, payload } = await callAct(
          "gets",
          {
            set: { activeRoleId: managerRoleId, limit: 10 },
            get: {
              _id: 1,
              displayName: 1,
              email: 1,
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
            },
          },
          managerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);

        const learner = payload.body.find(
          (item: Record<string, unknown>) =>
            item._id === learnerId.toHexString(),
        );
        assert(learner, "target learner must be returned");
        assertEquals(learner.displayName, "Sensitive Learner");
        assertNoSensitiveFields(payload.body);
      });

      await t.step("user.get preserves exclusion projections", async () => {
        const { status, payload } = await callAct(
          "get",
          {
            set: {
              activeRoleId: managerRoleId,
              _id: learnerId.toHexString(),
            },
            get: { displayName: 0 },
          },
          managerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertFalse("displayName" in payload.body);
        assertEquals(payload.body.email, learnerEmail);
        assertNoSensitiveFields(payload.body);
      });

      await t.step("updateMe does not return reset credentials", async () => {
        const { status, payload } = await callAct(
          "updateMe",
          {
            set: {
              activeRoleId: secondLearnerRoleId,
              displayName: "Updated Profile Learner",
            },
            get: {
              _id: 1,
              displayName: 1,
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
            },
          },
          secondLearnerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.displayName, "Updated Profile Learner");
        assertNoSensitiveFields(payload.body);
      });

      await t.step(
        "updateSettings does not return reset credentials",
        async () => {
          const { status, payload } = await callAct(
            "updateSettings",
            {
              set: {
                activeRoleId: secondLearnerRoleId,
                settings: { language: "fa" },
              },
              get: {
                _id: 1,
                settings: 1,
                passwordResetTokenHash: 1,
                passwordResetExpiresAt: 1,
              },
            },
            secondLearnerToken,
          );

          assertEquals(status, 200);
          assertEquals(payload.success, true);
          assertEquals(payload.body.settings.language, "fa");
          assertNoSensitiveFields(payload.body);
        },
      );

      await t.step("setStatus does not return reset credentials", async () => {
        const { status, payload } = await callAct(
          "setStatus",
          {
            set: {
              activeRoleId: managerRoleId,
              _id: statusLearnerId.toHexString(),
              status: "suspended",
            },
            get: {
              _id: 1,
              status: 1,
              passwordResetTokenHash: 1,
              passwordResetExpiresAt: 1,
            },
          },
          managerToken,
        );

        assertEquals(status, 200);
        assertEquals(payload.success, true);
        assertEquals(payload.body.status, "suspended");
        assertNoSensitiveFields(payload.body);
      });
    } finally {
      try {
        server.kill("SIGKILL");
      } catch {
        console.error("failed to kill test server");
      }
      await server.status.catch(() => undefined);
      await db.dropDatabase();
      await client.close();
    }
  },
});
