import { assertEquals } from "@std/assert";
import {
  ALL_ROLES,
  isGhostScopeBypass,
  isManagerLike,
  isRoleAllowed,
  isScopeBypass,
  scopeMatches,
} from "./authzPolicy.ts";

Deno.test("manager and admin are manager-like", () => {
  assertEquals(
    isManagerLike({ roleId: "1", name: "Manager" }),
    true,
  );
  assertEquals(
    isManagerLike({ roleId: "2", name: "Admin" }),
    true,
  );
  assertEquals(
    isManagerLike({ roleId: "3", name: "Learner" }),
    false,
  );
});

Deno.test("all configured roles are recognized", () => {
  for (const role of ALL_ROLES) {
    assertEquals(isRoleAllowed({ roleId: role, name: role }, ALL_ROLES), true);
  }

  assertEquals(
    isRoleAllowed(
      { roleId: "x", name: "Learner" },
      ["Manager", "Admin"],
    ),
    false,
  );
});

Deno.test("ghost bypass only applies without an active role scope", () => {
  assertEquals(
    isGhostScopeBypass(
      { roleId: "1", name: "Learner" },
      { isGhost: true },
    ),
    true,
  );
  assertEquals(
    isGhostScopeBypass(
      { roleId: "1", name: "Learner", scopeType: "course", scopeId: "c1" },
      { isGhost: true },
    ),
    false,
  );
  assertEquals(
    isScopeBypass(
      { roleId: "1", name: "Admin" },
      { isGhost: false },
    ),
    true,
  );
});

Deno.test("scope matching compares type and id", () => {
  assertEquals(
    scopeMatches(
      {
        roleId: "1",
        name: "ContentEditor",
        scopeType: "course",
        scopeId: "c1",
      },
      { scopeType: "course", scopeId: "c1" },
    ),
    true,
  );
  assertEquals(
    scopeMatches(
      {
        roleId: "1",
        name: "ContentEditor",
        scopeType: "course",
        scopeId: "c1",
      },
      { scopeType: "course", scopeId: "c2" },
    ),
    false,
  );
});
