# Hub Operations
> Sorting, preloading, worker workflows

---

## Entries

### Hub Worker Pre-loading Workflow — Apollo Project Synthesis
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis (Posten/Bring · Apollo)
- **Tags:** #hub #preloading #workflow #apollo #glow #hubworker

The Apollo project identified a critical gap: Glow (the logistics back-end) needs to be available through the loading distribution function in Hubworker. Hub workers and drivers currently rely on a fragmented set of tools — Glow, DriverApp, and manual processes — to load distribution trucks with no single coherent flow. On a busy terminal processing ~21,000 parcels per day (e.g. Trondheim), loading inefficiency compounds across shifts.

---

### Hub Worker Day Start — Orient to Day Stage
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis
- **Tags:** #hub #day-start #cognitive-load #dispatcher #orientation

Hub workers arrive 05:30–06:00 and learn tasks via dispatcher or loading map with no single system view. Cognitive load at this stage is high — no single source of truth exists, the route plan is not always visible to the HW in the app, and sorting is mostly manual memory. Workers often use the same route for a week but must still verify daily.

---

### Hub Worker Mental Model — System Built for Drivers Not Hub Workers
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis
- **Tags:** #hub #mental-model #role-mismatch #hubworker #driver

The Hubworker app is structurally a loading tool but its confirmation and routing logic mirrors the driver experience. Hub workers are forced to adopt driver mental models — confirm per stop, interact with route cards — despite having a fundamentally different task: bulk physical loading, not sequential delivery. This role mismatch is the root cause of most UX friction in the current flow.

---

### Pre-loading Time Dependency — Current UX Ignores Time Decoupling
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis
- **Tags:** #hub #preloading #time-decoupling #confirmation #states

Pre-loading happens before the driver arrives — sometimes days in advance — but the system's confirmation flow is designed as if loading and departure happen in sequence. This creates undefined states: 'what does confirmed mean if the driver is not there yet?' The UX must represent time-decoupled loading states with clear 'ready to load' vs. 'loaded' distinctions.

---

### Terminal Size Creates Irreconcilable Context Differences
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis
- **Tags:** #hub #terminal-size #trondheim #small-terminal #context

Trondheim (21,000+ parcels/day, multiple HWs, pre-loading essential) and Alta (1 route/day, driver loads themselves) need the same app to serve fundamentally different operational modes. A single design that satisfies both risks optimising for neither. The MVP should define which terminal context is primary before committing to a flow.

---

### Workers Compensate with Physical-World Shortcuts
- **Date:** 01 Jun 2026
- **Author:** Prodapp UX team
- **Source:** PDF — Hub Worker Loading UX Research Synthesis
- **Tags:** #hub #workarounds #postal-code #resilience #design-consideration

Workers use postal codes as a sorting heuristic even when they map to multiple route areas. They drive the same route for a week to build implicit knowledge and rely on physical maps posted in the terminal. These workarounds reveal system gaps but represent resilient behaviour that design must preserve, not replace.

---
