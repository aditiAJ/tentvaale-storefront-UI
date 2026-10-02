import { Suspense } from "react";
import { AuthForm, AuthLayout } from "@/features/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <AuthForm initialTab="login" />
      </Suspense>
    </AuthLayout>
  );
}
