import { LoginForm } from "@/features/auth";

export default function LoginPage() {
  return (
    <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <LoginForm />
    </div>
  );
}
