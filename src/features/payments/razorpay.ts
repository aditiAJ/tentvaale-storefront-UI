import type { RazorpayResult } from "./types";

/** The parts of Razorpay's checkout.js this app uses. */
export interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (result: RazorpayResult) => void;
  modal?: { ondismiss?: () => void };
}

export interface RazorpayFailure {
  error?: { description?: string; reason?: string };
}

export interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", callback: (response: RazorpayFailure) => void): void;
}

type RazorpayConstructor = new (options: RazorpayOptions) => RazorpayInstance;

declare global {
  interface Window {
    Razorpay?: RazorpayConstructor;
  }
}

const SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";
let loading: Promise<RazorpayConstructor> | null = null;

/** Loads Razorpay's checkout script once, only when a customer is about to pay, and resolves with its constructor. */
export function loadRazorpay(): Promise<RazorpayConstructor> {
  if (window.Razorpay) return Promise.resolve(window.Razorpay);
  loading ??= new Promise<RazorpayConstructor>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT;
    script.async = true;
    script.onload = () => (window.Razorpay ? resolve(window.Razorpay) : reject(new Error("Razorpay did not start")));
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("The payment window could not be loaded. Check your connection and try again."));
    };
    document.head.appendChild(script);
  });
  return loading;
}
