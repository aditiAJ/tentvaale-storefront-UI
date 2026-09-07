import type { RateType } from "@/features/catalog";

export type PlanStatus =
  | "Draft"
  | "Submitted"
  | "Quoted"
  | "PartiallyAccepted"
  | "Ordered"
  | "Cancelled";

export interface Plan {
  id: string;
  ownerAccountId: string;
  name: string;
  status: PlanStatus;
  subEvents: SubEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface SubEvent {
  id: string;
  planId: string;
  name: string;
  eventDate: string;
}

export type PlanCoOwnerRole = "CoOwner" | "ViewOnlyPlanner";

export interface PlanCoOwner {
  planId: string;
  accountId: string;
  role: PlanCoOwnerRole;
}

export interface PlanItem {
  id: string;
  planId: string;
  subEventId: string | null; // null = tagged to plan generally, not a sub-event
  adminProductId: string;
  isBundle: boolean;
  rateType: RateType;
  quantity: number;
  dimensions?: { length: number; width?: number }; // required when rateType is SqFt/RFt
  rentalStart: string;
  rentalEnd: string;
}

export type PlanAuditAction =
  | "ItemAdded"
  | "ItemRemoved"
  | "ItemModified"
  | "SubEventAdded"
  | "SubEventRemoved"
  | "CoOwnerAdded"
  | "CoOwnerRemoved"
  | "PlanSubmitted";

export interface PlanAuditLogEntry {
  id: string;
  planId: string;
  accountId: string;
  action: PlanAuditAction;
  detail: Record<string, unknown>;
  createdAt: string;
}
