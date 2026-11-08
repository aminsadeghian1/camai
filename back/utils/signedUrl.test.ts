import { assertEquals } from "@std/assert";
import { createMediaToken, verifyMediaToken } from "./signedUrl.ts";

Deno.test("signed media tokens verify for the right file and action", async () => {
  const token = await createMediaToken("file-1", "download", 60);
  assertEquals(await verifyMediaToken(token, "file-1", "download"), true);
  assertEquals(await verifyMediaToken(token, "file-2", "download"), false);
  assertEquals(await verifyMediaToken(token, "file-1", "upload"), false);
});

Deno.test("expired media tokens are rejected", async () => {
  const token = await createMediaToken("file-1", "download", -1);
  assertEquals(await verifyMediaToken(token, "file-1", "download"), false);
});

Deno.test("tampered media tokens are rejected", async () => {
  const token = await createMediaToken("file-1", "download", 60);
  const [encoded, signature] = token.split(".");
  const flipped = `${encoded[0] === "A" ? "B" : "A"}${encoded.slice(1)}`;
  assertEquals(
    await verifyMediaToken(`${flipped}.${signature}`, "file-1", "download"),
    false,
  );
  assertEquals(
    await verifyMediaToken(
      `${encoded}.${signature.slice(0, -1)}!`,
      "file-1",
      "download",
    ),
    false,
  );
});

Deno.test("malformed media tokens are rejected without throwing", async () => {
  assertEquals(
    await verifyMediaToken("not-a-token", "file-1", "download"),
    false,
  );
  assertEquals(await verifyMediaToken("", "file-1", "download"), false);
  assertEquals(
    await verifyMediaToken("abc.def", "file-1", "download"),
    false,
  );
});
