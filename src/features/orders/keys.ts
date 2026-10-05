export const orderKeys = {
  all: ["orders"] as const,
  list: ["orders", "list"] as const,
  detail: (orderId: string) => ["orders", orderId] as const,
};
