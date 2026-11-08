import { assertEquals } from "@std/assert";

// Independent test-only secret.
// Never use this value in development or production.
const TEST_TOKEN_KEY = "camai-jwt-unit-test-secret-32-bytes-minimum";

// Set the secret before loading tokens.ts.
Deno.env.set("TOKEN_KEY", TEST_TOKEN_KEY);

// Load the module after configuring the test environment.
const { createPasswordResetToken, parsePasswordResetToken } = await import(
  "./tokens.ts"
);

Deno.test("password reset tokens round-trip the user id and secret", () => {
  const token = createPasswordResetToken("65f000000000000000000000");
  const parsed = parsePasswordResetToken(token);

  assertEquals(parsed.userId, "65f000000000000000000000");
  assertEquals(parsed.secret.length > 20, true);
  assertEquals(token.startsWith("65f000000000000000000000."), true);
});

Deno.test("malformed password reset tokens are rejected", () => {
  assertEquals(parsePasswordResetToken("").userId, "");
  assertEquals(parsePasswordResetToken("nodot").userId, "");
  assertEquals(parsePasswordResetToken("user.").userId, "");
  assertEquals(parsePasswordResetToken(".secret").userId, "");
});

Deno.test("each reset token gets a fresh secret", () => {
  const first = parsePasswordResetToken(createPasswordResetToken("u1"));
  const second = parsePasswordResetToken(createPasswordResetToken("u1"));

  assertEquals(first.secret === second.secret, false);
});
