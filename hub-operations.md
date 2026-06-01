# Hub Operations
> Sorting, preloading, worker workflows

---

User Flow — Hub Worker Perspective
Five stages, each showing the action, decision points, and cognitive/emotional load.
Stage 1 · Orient to day
Actions: Check loading map or Hubworker for what needs loading. Find out which truck/licence plate is active.
Decision point: Is the plan updated? Has the dispatcher changed anything overnight?
Cognitive load: High — no single source of truth. HW often uses the same route for a week but must verify.
Sorting is mostly manual memory at this stage.
Stage 2 · Plan the load
Actions: Identify what needs to go on each truck. Group by postal code or recipient area. Check for
non-scannable items on the pre-plan.
Decision point: Are there non-scannable items (pallets, flyers, empty roller cages)? How many? Which
customers?
Cognitive load: Medium-high — workers mentally switch between two system roles. Non-scannable items are
rarely surfaced proactively.
Stage 3 · Scan items
Actions: Scan each parcel with Zebra device. System verifies against pre-planned route. Scan determines
placement order in truck.
Decision point: What if a scanned item does not match the planned route? Is anything going to the wrong
truck?
Cognitive load: Medium — scanning is procedural but exceptions cause hesitation. Workers trust the scan but
errors are high-stakes.
Stage 4 · Non-scannable goods [HIGHEST FRICTION]
Actions: Manually identify non-scannable items (pallets with letters, flyers, empty roller cages). Manually enter
type and quantity. Trigger status event to Glow.
Decision point: Is this item actually pre-planned? Is the count correct? Who confirms — HW or driver?
Cognitive load: Very high — no visual distinction in UI between scannable and non-scannable tasks. Manual
entry is error-prone under physical, time-pressured conditions.
Stage 5 · Confirm & complete
Actions: Mark load as complete in Hubworker. System sends event to Glow. Driver can now see load and
depart.
Decision point: Should each stop be confirmed individually, or the entire route at once?
Cognitive load: Low-medium — mostly procedural, but redundant confirmation step frustrates workers. Role
overlap with driver creates confusion about who confirms.
4. Information Needs by Step
Orient to day
Needs Which routes are active today, which truck/licence plate, what is pre-planned.
Currently available Loading map (physical/printed), Hubworker overview, Dispatcher verbal briefing.
Gap No consolidated, real-time view — licence plate must be found inside the truck cab manually.
Risk HW loads wrong truck; dispatcher's changes not propagated to HW in time.
Plan the load
Needs What customers/stops are on each route, which stops have non-scannable goods and of what
type/quantity.
Currently available Pre-planned task list in Hubworker (route card). Scannable items shown; non-scannable implied but
not explicit.
Gap Non-scannable items not visually distinguished. HW must know from memory or dispatcher that
these exist.
Risk Non-scannable goods omitted from truck entirely; driver discovers discrepancy at customer.
Scan items
Needs Confirmation each scan was registered correctly; placement order in truck; whether item belongs on
this route.
Currently available Scan confirmation in Hubworker. Placement/order not surfaced. Route mismatch not always clearly
flagged.
Gap No visual loading map showing where in the truck items go. No clear DIP routing indication.
Risk Wrong load order forces re-sequencing mid-route for driver.
Non-scannable goods
Needs Which customers have non-scannable goods, type (pallet/flyer/roller cage), quantity, and whether
already confirmed.
Currently available Manual entry screen exists but is not proactively surfaced. Driver app can show what has been
added.
Gap No automatic prompting to declare non-scannable items. No visual separation from scannable
tasks.
Risk Goods omitted or incorrectly counted; incorrect status sent to Glow; driver/customer dispute.
Confirm load
Needs Whether all items (scannable + non-scannable) have been accounted for; confirmation scope (per
stop vs. per route).
Currently available Confirm button in Hubworker triggers Glow status event. Scope unclear.
Gap Redundant confirmation when scanning already counted. No clear summary before confirm.
Risk HW marks complete while items are still missing; driver can also modify after HW confirms.
5. Key Pain Points
Theme A — Inefficiency
Manual non-scannable handling is a bottleneck
Hub workers must manually identify, count, and enter non-scannable goods (pallets with letters, flyers, empty
roller cages) with no system prompting. There is no visible distinction between scannable and non-scannable
tasks in the current UI. The process is entirely dependent on worker memory and dispatcher communication.
Pre-loading forces workers back to terminal unnecessarily
Trondheim: drivers drive the same route every week. Pre-loading could eliminate their need to return to terminal
to load. Today, the system does not support this workflow fully, wasting driver hours that are legally constrained.
Theme B — Errors & Accuracy
Non-scannable items are frequently omitted or miscounted
Because non-scannable items are not visually cued in any task list, they depend entirely on HW initiative and
memory. If never entered, Glow is never updated, and the driver discovers the discrepancy at the customer.
Route mismatch during scan is unclear
When a scanned item does not match the pre-planned route (e.g. it should go to a DIP instead), the system does
not clearly communicate this. Workers must make a judgment call in real-time on a noisy, time-pressured
terminal floor.
Theme C — Cognitive Load
Two-app role split causes mental switching
"Hubworker is filling 9 out, Driver uses it when driving." Workers using Hubworker during loading AND being
expected to interpret Driver app logic creates confusion. Workers in hub worker role are functionally acting as a
driver during confirmation steps.
Redundant confirmation step after successful scan
Workers must confirm loading even when every item has already been counted by scanning. Pain point explicitly
noted in research: "User has to confirm even when the count has been updated by scanning."
Day shift vs. night shift creates entirely different mental models
Night shift focuses on DIP pre-planned loads. Day shift focuses on distribution point loading. The Hubworker app
does not differentiate between these contexts, presenting the same UI to both. Workers adapt mentally but this
causes errors when shifts overlap.
Theme D — System Limitations
Licence plate lookup is physical, not digital
Licence plate can be found inside the truck cab. HW must physically enter the truck or rely on memory to enter
the correct truck identifier. No integration with a licence-plate lookup in Hubworker.
DPS/pickup-point ID mismatch blocks auto-matching
All DPS and pickup points have a 6-number ID that cannot be auto-matched to Glow pre-plan IDs. This structural
data gap requires backend resolution before UX can solve the matching problem.

## Entries

