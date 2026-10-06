"use client";

import { Suspense, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session";
import { useAcceptInvite, usePlanInvite } from "@/features/plans";
import { ApiError } from "@/services/api-client";

const ROLE_TEXT = { OWNER: "own", EDITOR: "edit", VIEWER: "view" } as const;

/** Where an invitation link lands: sign in with the invited email, then accept to join the plan. */
function JoinPlan() {
  const token = useSearchParams().get("token") ?? "";
  const router = useRouter();
  const { status } = useSession();
  const invite = usePlanInvite(token);
  const accept = useAcceptInvite();

  // The login page returns here with the token still on the address.
  useEffect(() => {
    if (status === "anonymous" && token) {
      router.replace(`/login?next=${encodeURIComponent(`/plans/join?token=${token}`)}`);
    }
  }, [status, token, router]);

  if (!token) {
    return <Notice title="This invitation link is not complete" />;
  }
  if (status !== "authenticated" || invite.isPending) {
    return <Skeleton className="h-48 w-full max-w-xl" />;
  }
  if (invite.isError) {
    const hidden = invite.error instanceof ApiError && invite.error.status === 404;
    return (
      <Notice
        title="This invitation is not for this account"
        text={
          hidden
            ? "Invitations can only be opened by the email address they were sent to. Sign in with that address and try again."
            : "We could not load the invitation. Please try again."
        }
      />
    );
  }
  const data = invite.data;

  return (
    <div className="flex w-full max-w-xl flex-col gap-4 rounded-2xl border border-border bg-card p-8">
      <h1 className="font-serif text-2xl text-foreground">Join &ldquo;{data.planName}&rdquo;</h1>
      <p className="text-sm text-muted-foreground">
        {data.invitedBy ? `${data.invitedBy} invited you` : "You have been invited"} to {ROLE_TEXT[data.role]} this event
        plan.
      </p>
      {data.accepted ? (
        <Button nativeButton={false} render={<Link href={`/plans/${data.planId}`}>Open the plan</Link>} />
      ) : (
        <Button
          disabled={accept.isPending}
          onClick={() =>
            accept.mutate(token, {
              onSuccess: (plan) => {
                toast.success("You joined the plan");
                router.replace(`/plans/${plan.id}`);
              },
              onError: (e) => toast.error(e instanceof ApiError ? e.message : "Could not accept the invitation."),
            })
          }
        >
          Accept invitation
        </Button>
      )}
    </div>
  );
}

function Notice({ title, text }: { title: string; text?: string }) {
  return (
    <div className="flex max-w-xl flex-col items-center gap-3 text-center">
      <h1 className="font-serif text-2xl text-foreground">{title}</h1>
      {text && <p className="text-sm text-muted-foreground">{text}</p>}
      <Button nativeButton={false} render={<Link href="/plans">My plans</Link>} />
    </div>
  );
}

export default function JoinPlanPage() {
  return (
    <div className="mx-auto flex w-full max-w-3xl justify-center py-16 page-x">
      <Suspense fallback={<Skeleton className="h-48 w-full max-w-xl" />}>
        <JoinPlan />
      </Suspense>
    </div>
  );
}
