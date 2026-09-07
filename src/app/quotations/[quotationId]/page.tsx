"use client";

import { use, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useRequireAccount } from "@/features/auth";
import { useMockStore } from "@/mock-data/store";
import { formatRupees } from "@/mock-data/seed";

// Flow 5: review a (possibly multi-round) quotation line-by-line and accept
// only the confirmed/acceptable subset — not all-or-nothing.
export default function QuotationDetailPage({ params }: { params: Promise<{ quotationId: string }> }) {
  const { quotationId } = use(params);
  const account = useRequireAccount();
  const router = useRouter();
  const { getQuotation, getPlan, acceptQuotationLines, rejectQuotation } = useMockStore();
  const quotation = getQuotation(quotationId);
  const plan = quotation ? getPlan(quotation.planId) : undefined;

  const acceptableLines = useMemo(
    () => quotation?.lines.filter((l) => l.status !== "Rejected" && !l.accepted) ?? [],
    [quotation],
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());

  if (!account) return null;
  if (!quotation || !plan) return <div className="mx-auto w-full max-w-4xl px-4 py-10">Quotation not found.</div>;

  const payable = quotation.lines
    .filter((l) => selected.has(l.planItemId))
    .reduce((sum, l) => sum + l.unitPrice * l.confirmedQty, 0);

  function toggle(planItemId: string) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(planItemId)) next.delete(planItemId);
      else next.add(planItemId);
      return next;
    });
  }

  function handleAccept() {
    if (selected.size === 0) return;
    acceptQuotationLines(quotationId, Array.from(selected));
    toast.success("Lines accepted — continue to payment.");
    router.push(`/checkout/${quotationId}`);
  }

  function handleReject(resolution: "Draft" | "Cancelled") {
    rejectQuotation(quotationId, resolution);
    toast.success(resolution === "Draft" ? "Quotation rejected — plan is back in Draft." : "Quotation rejected — plan cancelled.");
    router.push(`/plans/${plan!.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <div className="flex items-center gap-2">
        <Badge variant="secondary">{quotation.status}</Badge>
        <span className="text-sm text-muted-foreground">Round {quotation.round}</span>
      </div>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Quotation for {plan.name}</h1>
      <p className="mt-1 text-muted-foreground">
        Valid until {new Date(quotation.validUntil).toLocaleDateString()}. Some items may be confirmed at requested
        quantity, others adjusted against stock — accept only what works for you.
      </p>

      <div className="mt-6 space-y-2">
        {quotation.lines.map((line) => {
          const alreadyAccepted = line.accepted;
          const isRejected = line.status === "Rejected";
          return (
            <Card key={line.planItemId}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="flex items-center gap-3">
                  {!alreadyAccepted && !isRejected && (
                    <Checkbox checked={selected.has(line.planItemId)} onCheckedChange={() => toggle(line.planItemId)} />
                  )}
                  <div>
                    <p className="font-medium">{line.productName}</p>
                    <p className="text-sm text-muted-foreground">
                      Requested {line.requestedQty} → Confirmed {line.confirmedQty}
                      {alreadyAccepted && " · Accepted"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={line.status === "Adjusted" ? "outline" : line.status === "Rejected" ? "destructive" : "secondary"}>
                    {line.status}
                  </Badge>
                  <span className="font-medium">{formatRupees(line.unitPrice * line.confirmedQty)}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Separator className="my-6" />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Payable for selected lines</p>
          <p className="text-2xl font-semibold">{formatRupees(payable)}</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger render={<Button variant="outline">Reject quotation</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Reject this quotation</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Choose what happens to the plan — this needs an explicit choice, not a silent timeout.
              </p>
              <DialogFooter className="gap-2 sm:justify-start">
                <Button variant="outline" onClick={() => handleReject("Draft")}>
                  Keep editing (back to Draft)
                </Button>
                <Button variant="destructive" onClick={() => handleReject("Cancelled")}>
                  Cancel the plan
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button onClick={handleAccept} disabled={selected.size === 0 || acceptableLines.length === 0}>
            Accept &amp; pay for selected
          </Button>
        </div>
      </div>

      {acceptableLines.length === 0 && quotation.status === "Accepted" && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">All lines accepted</CardTitle>
            <CardDescription>Continue to payment to confirm your order.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button nativeButton={false} render={<a href={`/checkout/${quotationId}`}>Go to checkout</a>} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
