"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AuthLayout } from "@/features/auth";
import { ResetPasswordForm } from "@/features/auth/components/PasswordResetForms";

function ResetPasswordContent() {
  return <ResetPasswordForm token={useSearchParams().get("token")} />;
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={null}>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
