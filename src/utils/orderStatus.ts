export const ORDER_STATUS = {
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],

  CONFIRMED: ["PREPARING", "CANCELLED"],

  PREPARING: ["COMPLETED", "CANCELLED"],

  COMPLETED: [],

  CANCELLED: [],
};

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[current].includes(next);
}