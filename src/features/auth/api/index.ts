import { apiFetch } from "@/services/api-client";
import type { Account, AccountType } from "../types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface SignupPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  accountType: AccountType;
}

export interface AuthResult {
  token: string;
  account: Account;
}

// POST /api/storefront/auth/login — see ARCHITECTURE.md "Auth" section.
export function login(payload: LoginPayload): Promise<AuthResult> {
  return apiFetch<AuthResult>("api/storefront/auth/login", {
    method: "POST",
    body: payload,
  });
}

// POST /api/storefront/auth/signup — creates the account and its default Plan Board (Flow 1).
export function signup(payload: SignupPayload): Promise<AuthResult> {
  return apiFetch<AuthResult>("api/storefront/auth/signup", {
    method: "POST",
    body: payload,
  });
}

export function getCurrentAccount(): Promise<Account> {
  return apiFetch<Account>("api/storefront/auth/me");
}
