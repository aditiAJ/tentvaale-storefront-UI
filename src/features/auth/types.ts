export type AccountType = "Customer" | "EventPlanner";

export interface Account {
  id: string;
  email: string;
  phone: string;
  name: string;
  accountType: AccountType;
}
