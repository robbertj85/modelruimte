# Ruimtemodel Stadslogistiek — Webapp

## Project Overview

Web application for the **Ruimtemodel Stadslogistiek** (Urban Logistics Space Model), a Monte Carlo simulation tool that calculates the required loading/unloading space for urban logistics. The original model was built as an Excel (xlsm) workbook by Rebel Group; this webapp is its web-based successor.

**Stack:** Next.js 16 + React 19 + TypeScript, Recharts for charts, Tailwind CSS, shadcn/ui components.

## Three Layout Views

The app currently ships with **three layout views** that can be switched at runtime via a floating `LayoutSwitcher` component:

1. **Rebel Excel** (`rebel`) — Mimics the original xlsm look: coral/warm color palette, Calibri font, Excel-style tabs at the bottom, left sidebar with Rebel branding. Uses the Rebel/xlsm color scheme for diagrams.
2. **DMI Cockpit** (`dmi`) — DMI Ecosysteem style guide: dark blue + yellow palette, IBM Plex Sans fonts, header-based navigation. Uses DMI colors for diagrams.
3. **Webapp** (`webapp`) — Clean modern webapp layout with sidebar navigation. Also uses DMI colors. This is the **target layout** — the long-term plan is to move away from the Excel-like views and converge on this view.

All three views share the same simulation engine, state management, content (handleiding, partner logos, contact info), and diagram components. The difference is purely visual/layout.

### Key architecture decisions
- Shared content lives in `src/lib/content.ts` (handleiding text, partner sections, contact info)
- Shared simulation logic in `src/lib/simulation.ts` and `src/lib/model-data.ts`
- Shared state hook in `src/lib/use-simulation-state.ts`
- DMI design tokens in `src/lib/dmi-theme.ts`
- Diagrams in `src/components/HandleidingDiagrams.tsx` accept a `theme` prop (`'rebel'` | `'dmi'`)
- Each layout is a single large component in `src/components/layouts/`

## Direction

The **Rebel Excel** and **DMI Cockpit** views exist to help stakeholders compare the webapp with the original xlsm model and the DMI style guide. Over time, the plan is to:

- Gradually enhance the **Webapp** view with all features
- Eventually deprecate the two Excel-like views
- Keep the simulation engine and data model stable across this transition

When adding new features, implement them in **all three views** for now, unless explicitly told otherwise.

## Model

The simulation replicates the Excel model's logic:
- 12 urban functions (Woningen, Supermarkt, Retail Food, Winkels keten/onafh., Restaurant high/basis, Cafe, Hotel, Kantoor klein/middel/groot)
- 6 vehicle types (Fiets/cargobike, LEVV/personenwagen, Bestelwagen, Vrachtwagen N2, Vrachtwagen N3, Service bestelwagen)
- 15 distribution types (delivery profiles) connecting functions to vehicles
- 4 time periods of 6 hours each, subdivided into 10-minute intervals
- Monte Carlo simulation generating random arrivals per interval
- Percentile analysis (service levels 75%-95%) to determine peak capacity
- Cluster-based aggregation of vehicle types sharing physical space

Delivery profiles (`DELIVERY_PROFILES` in `model-data.ts`) contain: stops per week per unit, stop duration in minutes, and period distribution — all per vehicle type. These are the "expert" parameters from the original xlsm that most users don't need to touch.

## Partners & Licensing

- **Gerealiseerd door:** Rebel Group
- **In samenwerking met:** HAN, Breda University (BUAS), Posad Maxwan
- **Data & feedback:** Gemeente Amsterdam, Gemeente Utrecht, HvA
- **Mede-gerealiseerd vanuit:** DMI Ecosysteem
- **License:** EUPL-1.2 (matching the original xlsm model)
- **Contact:** Laura.Tavernier@rebelgroup.com, dmiteam@minienw.nl
