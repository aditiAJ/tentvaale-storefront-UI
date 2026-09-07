"use client";

import { use, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import type { PlanCoOwnerRole } from "@/mock-data/types";

// Flow 3: Invite a Co-Owner / Share with Event Planner.
export default function PlanSharePage({ params }: { params: Promise<{ planId: string }> }) {
  const { planId } = use(params);
  const account = useRequireAccount();
  const { getPlan, addCoOwner, removeCoOwner } = useMockStore();
  const plan = getPlan(planId);

  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<PlanCoOwnerRole>("CoOwner");

  if (!account) return null;
  if (!plan) return <div className="mx-auto w-full max-w-2xl px-4 py-10">Plan not found.</div>;

  const isOwner = plan.ownerAccountId === account.id;

  function handleAdd() {
    if (!email.trim() || !name.trim()) return;
    addCoOwner(planId, email.trim(), name.trim(), role);
    toast.success(`Invited ${email} as ${role === "CoOwner" ? "co-owner" : "view-only planner"}`);
    setEmail("");
    setName("");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href={`/plans/${planId}`} className="text-sm text-muted-foreground hover:underline">
        ← Back to plan
      </Link>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Share &quot;{plan.name}&quot;</h1>
      <p className="mt-1 text-muted-foreground">
        Co-owners can edit the plan but can&apos;t submit it for quotation — only the owner can. Event planners you share with
        get a view-only copy.
      </p>

      {isOwner ? (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Add a collaborator</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="co-name">Name</Label>
                <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="co-email">Email</Label>
                <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Role</Label>
              <Select value={role} onValueChange={(v) => v && setRole(v as PlanCoOwnerRole)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CoOwner">Co-owner — can edit</SelectItem>
                  <SelectItem value="ViewOnlyPlanner">Event planner — view only</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd}>Invite</Button>
          </CardContent>
        </Card>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">Only the plan owner can manage collaborators.</p>
      )}

      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-medium">Collaborators</h2>
        {plan.coOwners.map((co) => (
          <div key={co.accountId} className="flex items-center justify-between rounded-md border p-3">
            <div>
              <p className="font-medium">{co.name}</p>
              <p className="text-sm text-muted-foreground">{co.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{co.role === "CoOwner" ? "Co-owner" : "View only"}</Badge>
              {isOwner && (
                <Button variant="ghost" size="sm" onClick={() => removeCoOwner(planId, co.accountId)}>
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
        {plan.coOwners.length === 0 && <p className="text-sm text-muted-foreground">No collaborators yet.</p>}
      </div>
    </div>
  );
}
