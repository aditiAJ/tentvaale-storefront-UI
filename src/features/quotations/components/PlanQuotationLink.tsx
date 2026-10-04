"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useQuotationRequests } from "../hooks";
import { STAGE_COPY } from "../types";

/**
 * Where a submitted plan's quotation is: the newest request made from the plan, its stage in words,
 * and a link to it. Shows nothing until the plan has been submitted.
 */
export function PlanQuotationLink({ planId }: { planId: string }) {
  const { data } = useQuotationRequests();
  const request = data?.find((candidate) => candidate.planId === planId);
  if (!request) return null;
  return (
    <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
      <span className="text-muted-foreground">
        {request.quotationNumber}: <span className="text-foreground">{STAGE_COPY[request.stage].label}</span>
      </span>
      <Button size="sm" nativeButton={false} render={<Link href={`/quotations/${request.id}`}>View quotation</Link>} />
    </div>
  );
}
