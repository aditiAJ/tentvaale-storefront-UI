"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, UNAUTHORIZED_EVENT } from "@/services/api-client";
import { useMockStore } from "@/mock-data/store";
import {
  authKeys,
  getCurrentAccount,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
  updateAccount as apiUpdateAccount,
} from "./api";
import type { LoginPayload, SignupPayload, StorefrontAccount, UpdateProfilePayload } from "./types";

/**
 * Whether anyone is signed in.
 *  - loading: the answer has not come back yet; show nothing that depends on it
 *  - authenticated: `account` is the signed-in customer
 *  - anonymous: nobody is signed in (no cookie, or it expired)
 *  - error: the server could not be asked; the last known state is kept rather than guessing
 */
export type SessionStatus = "loading" | "authenticated" | "anonymous" | "error";

interface SessionValue {
  status: SessionStatus;
  account: StorefrontAccount | null;
  /**
   * True only for the moment the customer signs out on purpose, and only on the page they signed
   * out from. That page would normally send an anonymous visitor to /login, but the customer is
   * already heading home. It ends as soon as they navigate anywhere else, so reaching a protected
   * page afterwards (even by a link inside the app) does ask them to sign in.
   */
  signedOutByUser: boolean;
  login: (payload: LoginPayload) => Promise<StorefrontAccount>;
  /** Creates the account, then signs it in. */
  signup: (payload: SignupPayload) => Promise<StorefrontAccount>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<StorefrontAccount>;
}

const SessionContext = createContext<SessionValue | null>(null);

/**
 * The customer's session, from the backend. The browser cannot see the login token (it is an
 * httpOnly cookie), so "who is signed in" is simply asked of the server.
 *
 * <p>TEMPORARY BRIDGE. Plans, wishlist, quotations and orders still live in the local mock store
 * until their own phases are built, and they hang off a local account. While that is true, the mock
 * store's current account is kept as a shadow of the real one (same id, name, email), and cleared
 * the moment the real session ends, so nothing in the mock store can outlive or invent a login.
 * Delete the two effects below (and `syncAccount` in the store) when plans move to the backend.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const store = useMockStore();
  const pathname = usePathname();
  // The page the customer signed out from, or null. Reset the moment they are anywhere else.
  const [signedOutAt, setSignedOutAt] = useState<string | null>(null);
  if (signedOutAt !== null && signedOutAt !== pathname) setSignedOutAt(null);
  const signedOutByUser = signedOutAt !== null;
  const { hydrated, syncAccount, logout: clearShadowAccount } = store;

  const me = useQuery({
    queryKey: authKeys.me,
    queryFn: async ({ signal }) => {
      try {
        return await getCurrentAccount(signal);
      } catch (error) {
        // 401 is the normal answer to "who is signed in?" when nobody is.
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 5 * 60_000,
    retry: false,
    refetchOnWindowFocus: true,
  });

  // A request somewhere came back 401: the session has ended. Forget it here too.
  useEffect(() => {
    const onUnauthorized = () => queryClient.setQueryData(authKeys.me, null);
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [queryClient]);

  // Bridge: shadow the real account in the mock store, or clear it when there is none.
  useEffect(() => {
    if (!hydrated) return;
    if (me.data) syncAccount(me.data);
    else if (!me.isPending && !me.isError) clearShadowAccount();
  }, [hydrated, me.data, me.isPending, me.isError, syncAccount, clearShadowAccount]);

  const account = me.data ?? null;
  const status: SessionStatus = me.isPending ? "loading" : me.isError ? "error" : account ? "authenticated" : "anonymous";

  const refresh = useCallback(async () => {
    const fresh = await queryClient.fetchQuery({
      queryKey: authKeys.me,
      queryFn: ({ signal }) => getCurrentAccount(signal),
      staleTime: 0,
    });
    return fresh;
  }, [queryClient]);

  const login = useCallback(
    async (payload: LoginPayload) => {
      await apiLogin(payload);
      setSignedOutAt(null);
      return refresh();
    },
    [refresh],
  );

  const signup = useCallback(
    async (payload: SignupPayload) => {
      await apiSignup(payload);
      await apiLogin({ email: payload.email, password: payload.password });
      setSignedOutAt(null);
      return refresh();
    },
    [refresh],
  );

  const logout = useCallback(async () => {
    setSignedOutAt(window.location.pathname);
    await apiLogout();
    queryClient.setQueryData(authKeys.me, null);
    // Anything cached for this customer must not be shown to the next person on this browser. The
    // catalogue is the same for everyone, so it stays.
    queryClient.removeQueries({ predicate: (query) => query.queryKey[0] !== "catalog" && query.queryKey[0] !== "auth" });
    clearShadowAccount();
  }, [queryClient, clearShadowAccount]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      const updated = await apiUpdateAccount(payload);
      queryClient.setQueryData(authKeys.me, updated);
      return updated;
    },
    [queryClient],
  );

  const value = useMemo<SessionValue>(
    () => ({ status, account, signedOutByUser, login, signup, logout, updateProfile }),
    [status, account, signedOutByUser, login, signup, logout, updateProfile],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error("useSession must be used within SessionProvider");
  return value;
}
