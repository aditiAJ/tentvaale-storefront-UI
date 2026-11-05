"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { planKeys } from "@/features/plans/api";
import { quotationKeys } from "@/features/quotations/keys";
import { useSession } from "@/features/auth";
import { ApiError } from "@/services/api-client";
import { confirmPayment, createCheckout, getPayable, getProgress } from "./api";
import { loadRazorpay } from "./razorpay";
import type { PaymentProgress } from "./types";

export function usePayable(requestId: string, enabled: boolean) {
  return useQuery({
    queryKey: ["payable", requestId],
    queryFn: ({ signal }) => getPayable(requestId, signal),
    enabled,
    retry: false,
  });
}

/**
 * Where the customer is in paying:
 * `idle` nothing started, `starting` opening the payment window, `checkout` the window is open, `confirming` paid and being
 * checked, `waiting` paid but the order is not made yet (we keep checking), `done` ordered, `review` paid and staff must look,
 * `failed` the payment did not go through (the reason is in `error`), `cancelled` the window was closed.
 */
export type PayPhase = "idle" | "starting" | "checkout" | "confirming" | "waiting" | "done" | "review" | "failed" | "cancelled";

const POLLS = 8;
const POLL_MS = 2000;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const messageOf = (error: unknown) => (error instanceof Error ? error.message : "Something went wrong. Please try again.");

/** Runs the whole payment: open Razorpay's window, report the result to the backend, and wait for the order. */
export function usePayQuotation(requestId: string) {
  const queryClient = useQueryClient();
  const { account } = useSession();
  const [phase, setPhase] = useState<PayPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);

  const refresh = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: quotationKeys.detail(requestId) }),
      queryClient.invalidateQueries({ queryKey: quotationKeys.requests }),
      queryClient.invalidateQueries({ queryKey: planKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["payable", requestId] }),
      queryClient.invalidateQueries({ queryKey: ["orders"] }),
    ]);

  /** The payment is in; the order follows within moments. Checks a few times, then tells the customer it is on its way. */
  async function settle(first: PaymentProgress) {
    let progress = first;
    for (let attempt = 0; attempt < POLLS && progress.state === "PAID_CONFIRMING_ORDER"; attempt++) {
      setPhase("waiting");
      await sleep(POLL_MS);
      progress = await getProgress(requestId);
    }
    if (progress.state === "ORDERED") {
      setOrderId(progress.orderId ?? null);
      setPhase("done");
    } else if (progress.state === "NEEDS_REVIEW") {
      setPhase("review");
    } else if (progress.state === "FAILED") {
      setError(progress.reason ?? "The payment did not go through.");
      setPhase("failed");
    } else {
      setPhase("waiting");
    }
    await refresh();
  }

  async function pay() {
    setError(null);
    setPhase("starting");
    try {
      const Razorpay = await loadRazorpay();
      const checkout = await createCheckout(requestId);
      await new Promise<void>((resolve) => {
        const checkoutWindow = new Razorpay({
          key: checkout.keyId,
          amount: checkout.amountPaise,
          currency: checkout.currency,
          name: checkout.businessName,
          description: `Advance for quotation ${checkout.quotationNumber}`,
          order_id: checkout.gatewayOrderId,
          prefill: { name: account?.fullName, email: account?.email, contact: account?.phone },
          theme: { color: "#A96720" },
          handler: (result) => {
            setPhase("confirming");
            confirmPayment(result)
              .then(settle)
              .catch((caught: unknown) => {
                // The money may have been taken: say so rather than inviting a second payment.
                setError(
                  caught instanceof ApiError && caught.status === 400
                    ? "We could not verify that payment. If money left your account, contact us and we will sort it out."
                    : messageOf(caught),
                );
                setPhase("failed");
              })
              .finally(resolve);
          },
          // Closing the window is the customer changing their mind, not an error.
          modal: { ondismiss: () => { setPhase((current) => (current === "checkout" ? "cancelled" : current)); resolve(); } },
        });
        checkoutWindow.on("payment.failed", (response) => {
          setError(response.error?.description ?? "The payment did not go through. You can try again.");
          setPhase("failed");
        });
        setPhase("checkout");
        checkoutWindow.open();
      });
    } catch (caught) {
      setError(messageOf(caught));
      setPhase("failed");
    }
  }

  return { phase, error, orderId, pay, reset: () => { setPhase("idle"); setError(null); } };
}
