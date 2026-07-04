export const ORDER_STATUS = {
  PENDING: "PENDING",
  ACCEPTED: "ACCEPTED",
  PREPARING: "PREPARING",
  READY: "READY",
  SERVED: "SERVED",
  CANCELLED: "CANCELLED",
} as const;

export type OrderStatus =
  (typeof ORDER_STATUS)[keyof typeof ORDER_STATUS];

export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: ["ACCEPTED", "CANCELLED"],

  ACCEPTED: ["PREPARING", "CANCELLED"],

  PREPARING: ["READY", "CANCELLED"],

  READY: ["SERVED", "CANCELLED"],

  SERVED: [],

  CANCELLED: [],
};

export function canTransitionOrderStatus(
  current: OrderStatus,
  next: OrderStatus,
): boolean {
  return ORDER_STATUS_TRANSITIONS[current].includes(next);
}