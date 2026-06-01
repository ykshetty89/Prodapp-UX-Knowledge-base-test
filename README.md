# Prodapp UX — Knowledge Base

Research and domain knowledge captured by the Prodapp UX design team for the Posten/Bring logistics platform.

## Live URLs

- 📚 **Browse the KB:** https://ykshetty89.github.io/Prodapp-UX-Knowledge-base-test/
- 💬 **Ask the KB:** Prodapp UX Claude Project (team members only)

## How entries are captured

Entries are created by the team Claude assistant when a designer shares research. Each entry is event-based, not document-based — a single research document may produce multiple entries across multiple domains.

## Domain definitions

Each domain corresponds to a distinct part of the parcel journey.

| Domain | What it means | Signals |
|---|---|---|
| 📦 **Hub operations** | Activities inside a sorting terminal, hub, or distribution point | sorted, scanned, rejected, rerouted, terminal, DIP, hub |
| 🚚 **Pickup** | Collection of parcels from a sender | collected, picked up, pickup order, sender location |
| 📥 **Loading** | Placing parcels into a vehicle for transport | loaded, scan-to-load, assigned to vehicle, truck |
| 📬 **Delivery** | Final step where parcels reach the customer | delivered, delivery attempt, recipient, locker, Pakkeboks |
| 🧭 **Dispatcher** | Planning and control of logistics operations | assigned, planned route, reassigned, dispatch |
| 🏬 **Warehouse** | Storage and inventory handling between movements | stored, inventory, buffer, retrieved, warehouse |
| 👷 **Driver** | Actions and behaviours of the driver | driver, courier, reported, could not, confirmed |
| 📍 **Tracking** | Visibility of parcel status across the journey | status updated, in transit, out for delivery, tracking |
| 🔀 **Sorting** | Sort plans, belt logic, parcel routing, scan-sort flows | sort plan, belt, scan-sort |

## Classification rules

1. **Multiple domains allowed** — an event involving more than one part of the journey gets all relevant domains.
2. **Follow the flow:** Pickup → Hub → Loading → Delivery → Tracking
3. **Be precise, not excessive** — only assign domains clearly supported by the content.
4. **Handle cause and effect** — if a problem originates in one domain and impacts another, both are relevant.
5. **Normalise terminology:** Terminal/Depot/Sorting centre → Hub operations · Courier → Driver · Status update → Tracking

## Entry format

```
### [Title]
- **Domains:** Domain 1, Domain 2
- **Date:** DD Mon YYYY
- **Author:** Name
- **Source:** chat / file / PDF / image / Claude Cowork session
- **Tags:** #tag1 #tag2 #tag3

[2-3 sentence synthesis from the source — no padding, no assumptions]

---
```
