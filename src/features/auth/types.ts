/**
 * A customer's account, as the backend serves it (com.tentvaale.identity.api.StorefrontAccountView).
 * There is no password or token in it: the login token lives in an httpOnly cookie the page cannot
 * read.
 */
export type StorefrontAccountType = "CUSTOMER" | "EVENT_PLANNER";

export interface StorefrontAccount {
  id: string;
  email: string;
  fullName: string;
  /** Absent when the customer gave none. */
  phone?: string;
  accountType: StorefrontAccountType;
}

export interface SignupPayload {
  fullName: string;
  email: string;
  password: string;
  /** Optional; 6 to 20 characters of digits, +, spaces, dashes and brackets. */
  phone?: string;
  accountType: StorefrontAccountType;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
}
