"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Mail, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useRequireAccount } from "@/features/auth";
import { useSession } from "@/features/auth/session";
import { useChangeMemberRole, useInviteMember, useRemoveMember, type PlanRole } from "@/features/plans";
import { usePlan } from "@/features/plans/hooks";
import { ApiError } from "@/services/api-client";

const ROLE_LABEL: Record<PlanRole, string> = { OWNER: "Owner", EDITOR: "Editor", VIEWER: "Viewer" };
const ROLE_HELP: Record<Exclude<PlanRole, "OWNER">, string> = {
  EDITOR: "Can add and change items, functions and details.",
  VIEWER: "Can look at the plan, nothing more.",
};

const message = (e: unknown, fallback: string) => (e instanceof ApiError ? e.message : fallback);

/**
 * Plan together. The owner invites people by email as editors or viewers; each person joins by signing in
 * with that address and accepting. Only the owner can send the plan for a quotation or delete it.
 */
export default function SharePlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { account: me } = useSession();
  const router = useRouter();
  const query = usePlan(planId);
  const invite = useInviteMember(planId);
  const changeRole = useChangeMemberRole(planId);
  const remove = useRemoveMember(planId);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Exclude<PlanRole, "OWNER">>("EDITOR");

  if (!account) return null;
  if (query.isPending) {
    return (
      <div className="mx-auto w-full max-w-3xl py-10 page-x">
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }
  if (query.isError) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-3 py-24 text-center page-x">
        <h1 className="font-serif text-2xl">Plan not found</h1>
        <Button nativeButton={false} render={<Link href="/plans">My plans</Link>} />
      </div>
    );
  }
  const plan = query.data;
  const isOwner = (plan.myRole ?? "OWNER") === "OWNER";
  const members = plan.members ?? [];

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 py-8 page-x">
      <Link href={`/plans/${planId}`} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Back to {plan.name}
      </Link>
      <div>
        <h1 className="font-serif text-3xl text-foreground">Plan together</h1>
        <p className="text-sm text-muted-foreground">
          {isOwner
            ? "Invite people to work on this plan with you. They join when they sign in with the email you invite and accept."
            : `You are ${ROLE_LABEL[plan.myRole ?? "VIEWER"].toLowerCase()} on this plan.`}
        </p>
      </div>

      {isOwner && (
        <form
          className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault();
            invite.mutate(
              { email: email.trim(), role },
              {
                onSuccess: () => {
                  setEmail("");
                  toast.success("Invitation sent");
                },
                onError: (e) => toast.error(message(e, "Could not send the invitation.")),
              },
            );
          }}
        >
          <div className="grid gap-3 sm:grid-cols-[1fr_180px]">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-email">Email address</Label>
              <Input id="invite-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="invite-role">They can</Label>
              <select
                id="invite-role"
                className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                value={role}
                onChange={(e) => setRole(e.target.value as Exclude<PlanRole, "OWNER">)}
              >
                <option value="EDITOR">Edit</option>
                <option value="VIEWER">View only</option>
              </select>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{ROLE_HELP[role]}</p>
          <div>
            <Button type="submit" disabled={invite.isPending || !email.trim()} className="gap-1.5">
              <Mail className="size-4" /> Send invitation
            </Button>
          </div>
        </form>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-serif text-xl text-foreground">People on this plan</h2>
        <ul className="overflow-hidden rounded-2xl border border-border bg-card">
          <li className="flex items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm">
            <span className="text-foreground">{isOwner ? "You" : "The owner"}</span>
            <Badge variant="default">Owner</Badge>
          </li>
          {members.length === 0 && <li className="px-5 py-3 text-sm text-muted-foreground">Nobody else yet.</li>}
          {members.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3 text-sm last:border-b-0">
              <span className="text-foreground">
                {member.email}
                {!member.accepted && <span className="ml-2 text-xs text-muted-foreground">waiting to accept</span>}
              </span>
              <span className="flex items-center gap-2">
                {isOwner && member.role !== "OWNER" ? (
                  <select
                    aria-label={`Role of ${member.email}`}
                    className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                    value={member.role}
                    onChange={(e) =>
                      changeRole.mutate(
                        { memberId: member.id, role: e.target.value as Exclude<PlanRole, "OWNER"> },
                        { onError: (err) => toast.error(message(err, "Could not change the role.")) },
                      )
                    }
                  >
                    <option value="EDITOR">Editor</option>
                    <option value="VIEWER">Viewer</option>
                  </select>
                ) : (
                  <Badge variant="outline">{ROLE_LABEL[member.role]}</Badge>
                )}
                {isOwner && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    aria-label={`Remove ${member.email}`}
                    onClick={() =>
                      remove.mutate(member.id, { onError: (err) => toast.error(message(err, "Could not remove them.")) })
                    }
                  >
                    <Trash2 className="size-4" />
                  </Button>
                )}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {!isOwner && (
        <div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              const mine = members.find((m) => m.email.toLowerCase() === (me?.email ?? "").toLowerCase());
              if (!mine) return;
              remove.mutate(mine.id, {
                onSuccess: () => {
                  toast.success("You left the plan");
                  router.replace("/plans");
                },
                onError: (e) => toast.error(message(e, "Could not leave the plan.")),
              });
            }}
          >
            Leave this plan
          </Button>
        </div>
      )}
    </div>
  );
}
