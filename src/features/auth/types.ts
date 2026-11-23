/**
 * A customer's account, as the backend serves it (com.tentvaale.identity.api.StorefrontAccountView).
 * There is no password or token in it: the login token lives in an httpOnly cookie the page cannot
 * read.
 */
export type StorefrontAccountType = "CUSTOMER" | "EVENT_PLANNER";

export interface StorefrontAccount {
  id: string;
  /** Null for an account made with a mobile number only. */
  email: string | null;
  fullName: string;
  phone?: string;
  city?: string;
  state?: string;
  accountType: StorefrontAccountType;
}

export interface SignupPayload {
  fullName: string;
  /** Optional: a mobile number is enough to have an account. */
  email?: string;
  password: string;
  /** Required: ten digits, one account each. */
  phone: string;
  city: string;
  state: string;
  accountType: StorefrontAccountType;
}

export interface LoginPayload {
  /** The email or the mobile number the account was made with. */
  login: string;
  password: string;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone?: string;
  /** Left out keeps the state on file; one sent must be a state or union territory of India. */
  state?: string;
}
