# Tentvaale Storefront UI

Customer-facing storefront for Tentvaale — browse the rental catalog, build an
event Plan, request a quotation, pay, and track delivery. Consumes the
`api/storefront/*` surface of the Tentvaale backend (see
[`ARCHITECTURE.md`](../Tentvaale_extracted/Tentvaale%20Copy/TentVaale/TentVaale/ARCHITECTURE.md)
for the storefront/admin boundary rules).

## Stack

- Next.js (App Router) + TypeScript
- Tailwind CSS v4 + shadcn/ui
- TanStack Query for server state
- react-hook-form + zod for forms

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in the storefront API base URL
npm run dev
```

## Structure

Feature-sliced, adapted for Next.js App Router (the `app/` folder is the
router itself, so there's no `App.tsx`/`main.tsx`/`pages/`/`routes/` the way a
Vite SPA would have them):

```
src/
  app/                route segments — one folder per flow (catalog, plans,
                      quotations, checkout, orders, login, signup, account).
                      Pages stay thin: layout + data fetching, delegating UI
                      to the matching feature's components.
  components/ui/      shadcn/ui primitives (globally shared, not domain-specific)
  components/providers.tsx  app-wide providers (React Query, toaster)
  layouts/            header/footer shell
  features/<name>/    one folder per business domain — auth, catalog, plans,
                      quotations, orders, payments
    types.ts          the domain types this feature owns
    api/              typed fetch wrappers for this feature's endpoints
    components/       feature-specific UI (e.g. auth/components/LoginForm.tsx)
    index.ts          the feature's public surface — import from here
                      ("@/features/auth"), not from its internals
  services/           cross-cutting, feature-agnostic: api-client.ts (fetch
                      wrapper matching the admin backend's ApiResponse<T>/
                      SaveResult envelope), env.ts, auth-token.ts (JWT storage)
  lib/utils.ts        shadcn's cn() helper — kept at this path because
                      components.json and every generated ui/ component
                      hardcode "@/lib/utils"
```

Cross-feature type dependencies are real and intentional — e.g.
`features/plans` imports `RateType` from `features/catalog`, and
`features/plans/api` imports `QuotationLink` from `features/quotations` for
`submitPlanForQuotation`'s return type. Import across features through the
target feature's `index.ts`, not its internal files.

Pages are scaffolded per user flow with a comment pointing at the relevant
feature module and the open product decisions still called out in the flow
doc — fill in data fetching and UI as each flow gets built.

## Background & specs

Product/behavior context lives outside this repo, in `Contexts/`:

- `Contexts/CustomerStorefront features.txt` — feature list
- `Contexts/Tentvaale_Storefront_UserFlows.md.txt` — the flows referenced
  throughout this codebase (Flow 1–8)
- `Contexts/Tentvaale Customer Storefront — Diagrams.md.txt` — system context,
  ER diagram, sequence diagrams, state machines
- `Contexts/Specs/` — behavior specs for the legacy admin app this storefront
  talks to (quotation, order, stock movement, product master, etc.)

Check the relevant flow/spec before making business-rule assumptions —
several decisions (delivery-status granularity, quotation rollup, event
planner permissions) were explicitly resolved there and shouldn't be
re-litigated in code.
