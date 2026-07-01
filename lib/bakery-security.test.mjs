import assert from "node:assert/strict";
import test from "node:test";

import {
  canRoleUpdateOrderStatus,
  requireSameUserId,
} from "./bakery-security.js";

test("requireSameUserId rejects caller-supplied user IDs that do not match the session", () => {
  assert.throws(
    () => requireSameUserId("11111111-1111-1111-1111-111111111111", "22222222-2222-2222-2222-222222222222"),
    /does not match authenticated user/
  );
});

test("requireSameUserId returns the authenticated user ID when IDs match", () => {
  assert.equal(
    requireSameUserId("11111111-1111-1111-1111-111111111111", "11111111-1111-1111-1111-111111111111"),
    "11111111-1111-1111-1111-111111111111"
  );
});

test("baker can only move orders into baking states", () => {
  assert.equal(canRoleUpdateOrderStatus("baker", "preparing"), true);
  assert.equal(canRoleUpdateOrderStatus("baker", "prepared"), true);
  assert.equal(canRoleUpdateOrderStatus("baker", "delivered"), false);
});

test("delivery can only move orders through delivery states", () => {
  assert.equal(canRoleUpdateOrderStatus("delivery", "in transit"), true);
  assert.equal(canRoleUpdateOrderStatus("delivery", "delivered"), true);
  assert.equal(canRoleUpdateOrderStatus("delivery", "prepared"), false);
});

test("accountant cannot mutate order status", () => {
  assert.equal(canRoleUpdateOrderStatus("accountant", "delivered"), false);
});

test("manager and admin can update operational order status", () => {
  assert.equal(canRoleUpdateOrderStatus("manager", "delivered"), true);
  assert.equal(canRoleUpdateOrderStatus("admin", "cancelled"), true);
});
