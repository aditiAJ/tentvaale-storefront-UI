import { Suspense } from "react";
import { AuthForm, AuthLayout } from "@/features/auth";

export default function SignupPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthForm initialTab="signup" />
      </Suspense>
    </AuthLayout>
  );
}
