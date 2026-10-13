/**
 * The in-app user guide (MOM-03). One short topic per kind of screen, written from what that screen does today, so
 * it describes the product as it is and invents no procedure. When a screen changes, change its topic here.
 *
 * DRAFT: the wording is waiting for the owner's review.
 */
export type GuideTopicId = "general" | "browse" | "plans" | "plan" | "submit" | "quotation" | "orders";

export interface GuideTopic {
  id: GuideTopicId;
  title: string;
  /** One sentence: what the screen is for. */
  summary: string;
  steps: string[];
}

export const GUIDE_TOPICS: GuideTopic[] = [
  {
    id: "general",
    title: "How Tentvaale works",
    summary: "Tentvaale rents furniture, décor and fully styled collections for events. Everything runs through a plan.",
    steps: [
      "Browse the Product Catalog, Bundles or Featured Collections.",
      "Add what you like to a plan. If you don't have a plan yet, you are asked to name one first.",
      "Add your functions (Haldi, Sangeet and so on) with their date, time and venue, and place items on them.",
      "Review the plan and submit it for a quotation. You are not charged.",
      "Our team sends a quotation with the prices. You can accept it, ask for changes or close it.",
      "When you accept, an order is created. Follow it under My Orders.",
    ],
  },
  {
    id: "browse",
    title: "Finding items to rent",
    summary: "Browse the catalogue and put what you like into a plan.",
    steps: [
      "Use the search box, or open Product Catalog, Bundles or Featured Collections.",
      "Choose Add to Plan on an item to put it in a plan. With no plan yet, you are asked to name one first.",
      "A bundle is a set of items offered together at a discount. For an item inside a bundle you can choose a different variant.",
      "On a bundle, Send for quotation adds it to your plan and opens the review page. Nothing is sent until you submit there.",
    ],
  },
  {
    id: "plans",
    title: "My Plans",
    summary: "Your event plans, in one place.",
    steps: [
      "Choose New Plan to start one. You give it a name, the event type, venue, dates and guest count, and you can add a photo.",
      "Open a plan to keep working on it.",
      "Each plan shows its status: Draft (you can still change it), Quotation requested, or Ordered.",
    ],
  },
  {
    id: "plan",
    title: "Your plan",
    summary: "One event, with its functions and the items you want for each.",
    steps: [
      "Press Edit to change the event name, dates, venue, sub-venue (the hall or room inside the venue), guest count and photo.",
      "Add functions such as Haldi or Sangeet. Each one needs a date, a start time and a venue; the end time and the rest are optional.",
      "Add items from the catalogue, bundles or collections. An item sits under a function, or under the whole event.",
      "The estimated total is only an estimate. The final price is confirmed in your quotation.",
      "Use Share to invite other people to edit the plan or only to view it.",
      "When every item is on a function and every function has its date, time and venue, choose Submit for Quotation.",
      "Only a Draft plan can be changed. Once it is submitted, it is locked.",
    ],
  },
  {
    id: "submit",
    title: "Review before you submit",
    summary: "A last look at your plan before our team prices it.",
    steps: [
      "Check each function and its items.",
      "If the venue or the event dates are missing, the page asks for them first. Use Add details to fill them in.",
      "Confirm & Submit sends the plan to our team. You are not charged.",
      "You get a quotation reference. Our team reviews pricing and availability and comes back with a quotation.",
      "A submitted plan can no longer be changed.",
    ],
  },
  {
    id: "quotation",
    title: "Your quotation",
    summary: "The prices our team has set for your plan.",
    steps: [
      "Nothing is shown until our team has sent the quotation.",
      "It shows the items, the delivery charge, any discount, the total, the deposit and how long the quotation is valid.",
      "Accept quotation accepts the whole quotation. You cannot accept part of it.",
      "Request changes lets you say what to change. Our team revises it and sends a new version; every version is kept.",
      "Close quotation ends it, and a closed quotation cannot be reopened. You can start over from your plan afterwards.",
    ],
  },
  {
    id: "orders",
    title: "My Orders",
    summary: "The orders created when you accepted a quotation.",
    steps: [
      "Open an order to see its summary, payments, progress, items, deliveries and security deposit.",
      "The status moves as our team dispatches, collects and completes the order.",
    ],
  },
];

/** Which topic belongs to the page the customer is on. Anything not listed gets the general overview. */
export function topicIdFor(pathname: string): GuideTopicId {
  if (/^\/plans\/[^/]+\/submit\/?$/.test(pathname)) return "submit";
  if (/^\/plans\/(?!join(\/|$))[^/]+\/?$/.test(pathname)) return "plan";
  if (/^\/plans\/?$/.test(pathname)) return "plans";
  if (/^\/quotations\//.test(pathname)) return "quotation";
  if (/^\/orders(\/|$)/.test(pathname)) return "orders";
  if (/^\/(catalog|bundles|collections|search)(\/|$)/.test(pathname)) return "browse";
  return "general";
}
