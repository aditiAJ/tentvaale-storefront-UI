import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Profile &amp; account details go here</CardTitle>
            <CardDescription>
              Wire up to features/auth getCurrentAccount(). This route should
              be gated to authenticated accounts once route-level auth is
              wired (see services/auth-token.ts).
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
