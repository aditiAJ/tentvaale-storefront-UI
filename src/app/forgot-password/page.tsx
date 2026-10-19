import { AuthLayout } from "@/features/auth";
import { ForgotPasswordForm } from "@/features/auth/components/PasswordResetForms";

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotPasswordForm />
    </AuthLayout>
  );
}
