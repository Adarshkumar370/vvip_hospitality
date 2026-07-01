const ORDER_STATUS_BY_ROLE = {
  baker: new Set(["preparing", "prepared"]),
  delivery: new Set(["in transit", "delivered"]),
  manager: new Set([
    "pending",
    "placed",
    "confirmed",
    "preparing",
    "prepared",
    "ready_for_pickup",
    "in transit",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
  ]),
  admin: new Set([
    "pending",
    "placed",
    "confirmed",
    "preparing",
    "prepared",
    "ready_for_pickup",
    "in transit",
    "out_for_delivery",
    "delivered",
    "completed",
    "cancelled",
    "payment_pending",
    "payment_failed",
  ]),
  accountant: new Set(),
};

function canRoleUpdateOrderStatus(role, status) {
  return Boolean(ORDER_STATUS_BY_ROLE[role]?.has(status));
}

function requireSameUserId(sessionUserId, requestedUserId) {
  const authenticatedUserId = String(sessionUserId || "");
  if (!authenticatedUserId || authenticatedUserId !== String(requestedUserId || "")) {
    throw new Error("Requested user ID does not match authenticated user.");
  }
  return authenticatedUserId;
}

module.exports = {
  canRoleUpdateOrderStatus,
  requireSameUserId,
};
