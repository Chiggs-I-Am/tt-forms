---
version: 1
slug: "apps-web-app-page-tsx"
primary_target: "apps/web/app/page.tsx"
related_targets: ["apps/web/components/form-search.tsx"]
---

THESIS: The homepage is a service counter, not a pitch. One search box owns the first screen; numbered form cards each carry a single explicit next action. It refuses the generic marketing hero and any explanation longer than a kicker and a footer line.

OWN-WORLD: Civic Service Counter per DESIGN.md. Square corners, Rule Line borders, Stamp Red only at action points, mono uppercase kickers, queue numerals 01-04. shadcn Input, Button, Card primitives restyled to the square language.

STORY: A visitor with a concrete task understands within seconds this is a demo of online T&T forms, finds their form by search, and opens it with one click. Every card answers "what next".

FIRST VIEWPORT: Header row with TT-FORMS wordmark, single DEMO badge, auth state. Display headline, then the search label plus Input with Clear button. Results stack as numbered cards below, each with OPEN FORM action. Footer holds one quiet safety line above a top rule.

FORM: Precisely specified narrow extension inside the established world per shape; no concept seed. Code-led build on apps/web/app/page.tsx and apps/web/components/form-search.tsx.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
