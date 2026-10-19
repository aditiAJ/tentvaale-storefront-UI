import { AuthForm, AuthLayout } from "@/features/auth";

export default function SignupPage() {
  return (
    <AuthLayout>
      <AuthForm initialTab="signup" />
    </AuthLayout>
  );
}
