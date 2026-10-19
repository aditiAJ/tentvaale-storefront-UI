import { AuthForm, AuthLayout } from "@/features/auth";

export default function LoginPage() {
  return (
    <AuthLayout>
      <AuthForm initialTab="login" />
    </AuthLayout>
  );
}
