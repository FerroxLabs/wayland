---
name: fleet-manager
description: |
  Vehicle fleet tracking, maintenance scheduling, cost optimization, compliance management, and operational efficiency for multi-vehicle operations.
  Use when the user asks about fleet manager, or needs help with vehicle fleet tracking, maintenance scheduling, cost optimization, compliance management, and operational efficiency for multi-vehicle operations.
  Do NOT use when the request requires professional specialized advice or falls outside the scope of fleet manager.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "automotive home-maintenance planning"
  category: "home-household"
  subcategory: "home-maintenance"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Fleet Manager

## When to Use

**Use this skill when:**
- A user manages 3 or more vehicles -- whether a small business delivery fleet, a municipal government motor pool, a construction equipment fleet, a nonprofit shuttle operation, or a family with multiple household vehicles -- and wants a systematic approach to tracking, maintenance, and cost control
- A user is experiencing runaway maintenance costs, frequent unexpected breakdowns, compliance violations, or poor vehicle utilization and needs a structured diagnostic framework
- A user wants to build or overhaul a preventive maintenance program, create a replacement lifecycle schedule, or set up a telematics monitoring system from scratch
- A user needs to justify fleet budget requests, calculate total cost of ownership (TCO) per vehicle, compare buy vs. lease vs. rent options, or present a vehicle replacement business case
- A user is planning an EV transition, adding vehicles to an existing fleet, or consolidating operations and needs to right-size their fleet to actual utilization data
- A user needs to establish driver qualification files, DOT/FMCSA compliance documentation, fuel card programs, or accident response protocols that will withstand regulatory scrutiny
- A user wants to evaluate or implement fleet management software (FMS) or telematics hardware and needs an objective evaluation framework
- A user is tracking IFTA fuel tax obligations, managing CDL driver hours-of-service (HOS) records, or preparing for a DOT safety audit

**Do NOT use when:**
- The user is asking about a single personal vehicle -- use the **home-auto-maintenance** skill instead
- The user needs a commercial trucking carrier authority application, BOC-3 filing, or Interstate Operating Authority setup -- refer to a licensed transportation attorney or DOT consultant
- The user is dealing with an active roadside emergency, vehicle fire, or accident requiring immediate 911 guidance -- redirect to emergency services immediately
- The user needs vehicle financing, commercial auto insurance policy underwriting, or specific coverage advice -- refer to a commercial insurance broker or fleet financing specialist
- The user is designing a vehicle dealer inventory management system -- that is an automotive retail topic, not fleet operations
- The user is asking about aircraft, marine vessels, or heavy construction equipment maintenance standards -- those domains have separate regulatory regimes (FAA, USCG, OSHA) that fall outside scope
- The user needs union labor contract interpretation for fleet technicians -- refer to an employment attorney

---

## Process

### Step 1: Fleet Inventory Audit and Data Baseline

Before any analysis or recommendations are possible, establish a complete, accurate fleet inventory.

- Collect every vehicle's VIN, year/make/model, acquisition date, acquisition cost, current odometer reading, assigned department or driver, fuel type, and ownership structure (owned/leased/rented)
- Assign unit numbers using a consistent scheme -- for example, Department prefix + sequential number (OPS-001, OPS-002) -- which makes sorting, reporting, and work order referencing unambiguous
- Record the GVWR (Gross Vehicle Weight Rating) for every unit; vehicles over 10,001 lbs GVWR trigger separate federal and state regulatory requirements, and vehicles over 26,001 lbs require CDL operators
- Document current status for each vehicle: Active (revenue or operational service), Reserve (available but not assigned), In Maintenance (awaiting or undergoing repair), or Pending Disposal (decommissioned but not yet sold or salvaged)
- Pull the maintenance history for each vehicle -- service records, repair invoices, warranty claims -- and enter cumulative lifetime maintenance cost per unit; this is the foundation of replacement scoring
- Calculate current fleet utilization: divide actual days in service by available days per month per vehicle; any unit below 60% utilization for 3+ consecutive months is a candidate for disposal or reallocation, not replacement
- Flag every vehicle that has missed its last scheduled preventive maintenance interval so that a catch-up schedule can be built immediately

### Step 2: Total Cost of Ownership (TCO) Analysis Per Vehicle

TCO is the only metric that supports defensible acquisition, retention, and replacement decisions.

- Calculate annual TCO per vehicle using six cost buckets: (1) depreciation or lease payment, (2) fuel, (3) insurance premium allocation, (4) maintenance and unscheduled repairs, (5) tires plus consumables, (6) registration, fees, and compliance costs -- telematics hardware and software subscription are a seventh bucket for fleets using GPS monitoring
- For owned vehicles, use straight-line depreciation from acquisition cost to residual value over expected service life; a light-duty pickup truck purchased at $45,000 with a 10-year/200,000-mile life and $5,000 residual depreciates at $4,000/year
- Compute cost per mile (CPM) by dividing total annual TCO by annual miles driven; benchmark CPM against fleet averages: light-duty sedan $0.50--$0.70, light-duty truck/SUV $0.60--$0.85, medium-duty truck $0.80--$1.20, heavy-duty Class 8 $1.00--$1.80; units running 20%+ above benchmark need investigation
- Track the "maintenance cost inflection point" -- the year or mileage at which a vehicle's annual maintenance spend exceeds its annual depreciation; this crossover is typically the economic signal to begin replacement planning, usually occurring around year 7--9 for light duty and year 5--7 for heavily worked vocational trucks
- Separate planned maintenance costs (PM labor and parts at scheduled intervals) from unplanned repair costs (breakdowns, roadside failures, accident-related work); the ratio of unplanned to planned costs should stay below 0.5:1; ratios above 1:1 indicate deferred maintenance or aging assets
- Calculate fully-loaded cost per productive unit of output if applicable -- cost per delivery stop, cost per route mile, cost per passenger trip -- because CPM alone can obscure vehicles that do less work per dollar

### Step 3: Preventive Maintenance Program Design and Scheduling

A rigorous PM program is the single highest-ROI activity in fleet management -- every $1 spent on PM avoids approximately $4--$8 in unplanned repair costs.

- Align PM intervals to the manufacturer's severe-duty schedule, not the standard schedule, for any vehicle used in stop-and-go urban routing, towing, off-road operation, temperature extremes, or short-trip duty cycles under 10 miles; most commercial fleet vehicles qualify as severe-duty
- Define four standard service intervals using mileage OR time triggers, whichever comes first:
  - **Interval A (5,000 mi / 3 months):** Oil and filter, tire pressure and visual inspection, all fluid levels, exterior lights, wiper blades
  - **Interval B (15,000 mi / 12 months):** All A items plus engine and cabin air filters, brake pad measurement (replace below 3mm front / 2mm rear), tire rotation, battery load test, belt and hose visual inspection
  - **Interval C (30,000 mi / 24 months):** All B items plus transmission fluid (drain-and-fill, not just top-off), coolant flush, brake fluid flush, spark plugs (iridium plugs can extend to 60,000 mi on some engines), differential and transfer case fluid if applicable
  - **Interval D (60,000 mi / 48 months):** All C items plus timing belt inspection (replace at 90,000--105,000 mi per OEM spec), full chassis inspection, 4WD/AWD driveline service, lifecycle evaluation using replacement scoring
- Build a 12-month PM forecast calendar at the start of each fiscal year: project each vehicle's expected mileage accumulation, pre-schedule service appointments, and level-load the shop or vendor capacity to avoid month-end bunching that causes delays and deferred services
- Measure PM compliance rate monthly: (PMs completed on time / PMs scheduled) x 100; target is 95% or above; a fleet consistently below 85% has a scheduling or accountability problem, not a maintenance problem
- Track mean time between failures (MTBF): total operating hours divided by number of unplanned breakdowns; a declining MTBF trend is an early warning of systemic issues -- aging fleet, deferred PM, or driver abuse -- and requires root-cause investigation before the next PM cycle
- Negotiate fleet service agreements with dealerships or independent shops for flat-rate labor pricing on high-frequency services; a fleet of 20+ vehicles can typically negotiate 15--25% below posted labor rates in exchange for volume commitment and scheduling flexibility

### Step 4: Fuel Management and Driver Behavior Program

Fuel typically represents 25--35% of total fleet operating cost and is the fastest variable cost to reduce with the right controls.

- Implement a dedicated fleet fuel card (universal programs accept at 95%+ of US fueling locations) with per-transaction limits, required odometer entry at fueling, product restrictions to fuel only (no car washes, merchandise), and real-time alert triggers for transactions outside business hours or geographic radius
- Calculate miles per gallon (MPG) per vehicle per fill cycle using odometer entries from fuel card data; flag any fill where calculated MPG drops more than 15% from that unit's rolling 90-day average -- this catches fuel card misuse, misfueling, and developing mechanical issues (worn injectors, failed O2 sensors, low tire pressure) simultaneously
- Establish fleet average MPG as a monthly KPI and track it against a baseline; a 10% improvement in fleet MPG on a 25-vehicle fleet consuming 5,000 gallons/month at $4.00/gallon saves $20,000 annually -- achievable through route optimization and driver coaching alone
- Identify and address idle time: commercial vehicles burning fuel at idle consume roughly 0.8--1.0 gallon per hour; a fleet where vehicles idle an average of 2 hours per day across 20 units wastes approximately 11,680 gallons per year at current diesel prices; set idle time alerts in telematics at 5-minute threshold and include idle time in monthly driver scorecards
- Implement a driver behavior coaching program with monthly scorecards covering five measurable behaviors: speeding events (mph over limit), hard braking events per 100 miles, hard acceleration events per 100 miles, idle time percentage, and seatbelt compliance; score each driver 0--100; drivers below 70 receive one-on-one coaching; drivers above 90 receive public recognition; the program typically reduces fuel consumption 5--12% and accident frequency 15--25% within 90 days
- Evaluate route optimization software for fleets with 5+ vehicles making multiple daily stops; well-implemented routing reduces total fleet miles 10--20%, which compounds across fuel, tire wear, and depreciation savings simultaneously

### Step 5: Regulatory Compliance Program

Compliance failures carry fines, out-of-service orders, insurance consequences, and liability exposure that can exceed the entire annual fleet budget.

- Map every vehicle to its applicable regulatory tier: (1) light-duty non-commercial (standard DMV, state insurance minimums), (2) commercial vehicles over 10,001 lbs GVWR operating in interstate commerce (FMCSA registration, DOT number, USDOT marking, potential MCS-150 biennial update), (3) vehicles operated by CDL drivers (drug and alcohol testing program, medical certificates, driver qualification files, ELD/HOS if over 100 air-mile radius)
- For FMCSA-regulated operations: file MCS-150 updates within 30 days of any change to carrier information and biennially regardless; failure to update is a $1,000/day civil penalty and can result in revocation of operating authority
- Build a compliance calendar with hard deadlines for: vehicle registrations (stagger renewals to avoid month-end bunching), commercial vehicle inspections (annual per FMCSA 49 CFR 396.17), IFTA quarterly fuel tax returns (due last day of month following quarter end: April 30, July 31, October 31, January 31), IRP apportioned plate renewals, and insurance policy renewals
- Maintain a Driver Qualification File (DQF) for every driver operating a commercial motor vehicle; required contents under 49 CFR Part 391: application for employment, motor vehicle record (MVR) from every state where licensed in past 3 years, annual MVR review, medical examiner's certificate (CDL drivers), road test certificate or equivalent, drug and alcohol pre-employment test result, and annual review of driving record; DQFs must be retained for 3 years after driver leaves the company
- Pull MVRs annually on ALL drivers -- not just CDL holders -- using your state's DMV employer pull-notice program or a third-party screening service; establish a written policy that defines disqualifying violations: any DUI/DWI within 5 years, 3+ moving violations in 12 months, license suspension or revocation, or a reckless driving conviction within 3 years are standard disqualifiers for commercial fleet operators
- Document every vehicle defect report: FMCSA 49 CFR 396.11 requires drivers operating CMVs to complete a written Driver Vehicle Inspection Report (DVIR) at the end of each day; the mechanic must certify repairs were made or were unnecessary before the next dispatch; retain DVIRs for 3 months

### Step 6: Vehicle Replacement Decision Framework

Replacement decisions driven by objective scoring criteria rather than age alone save 10--15% in annual fleet operating costs.

- Score each vehicle on five dimensions, each rated 1--10, producing a total score out of 50:
  - **Age:** Under 3 years = 2, 3--5 years = 4, 5--7 years = 6, 7--10 years = 8, over 10 years = 10
  - **Mileage:** Under 50,000 = 2, 50,000--100,000 = 4, 100,000--150,000 = 6, 150,000--200,000 = 8, over 200,000 = 10
  - **Maintenance Cost Trend (year-over-year):** Declining = 2, Stable = 4, Up less than 20% = 6, Up 20--50% = 8, Up more than 50% = 10
  - **Annual Downtime Days:** Fewer than 3 = 2, 3--7 = 4, 7--14 = 6, 14--30 = 8, more than 30 = 10
  - **Physical Condition / Safety:** Excellent = 2, Good = 4, Fair = 6, Poor = 8, Unsafe/Non-compliant = 10
- Interpret scores: 0--15 = Keep, no action needed; 16--25 = Monitor closely, increase PM frequency; 26--35 = Begin replacement planning, budget next cycle; 36--45 = Replace within 12 months; 46--50 = Immediate replacement -- safety or compliance risk
- When replacement is indicated, run a replacement cost-justification calculation: estimate the vehicle's likely repair costs over the next 24 months based on current trend, add residual downtime cost (revenue or productivity lost per day out of service multiplied by expected downtime days), subtract current resale or trade-in value, and compare to the 24-month all-in cost of a replacement vehicle; the case for replacement is clear when repair/downtime cost exceeds 75% of replacement cost
- Time disposals strategically: light-duty pickups and SUVs achieve highest resale value at 3--5 years / 60,000--80,000 miles at auction; Class 6--8 trucks hold value best at 3--6 years depending on engine/transmission spec; selling at 10 years vs. 5 years for a pickup truck can reduce net proceeds by $8,000--$15,000 on the same unit
- For vehicles transitioning out of fleet service: document all maintenance records, pull a CARFAX or equivalent report to verify clean title and lien release, obtain a fleet disposal quote from at least two wholesale auction channels (Manheim, ADESA, or dealer trade-in), and compare against retail private-party value net of preparation costs

### Step 7: Fleet Technology Stack Selection and Implementation

Technology provides the data infrastructure that makes every other fleet management process more accurate and less labor-intensive.

- Define your minimum viable technology stack based on fleet size:
  - **3--10 vehicles:** Spreadsheet-based vehicle register plus a basic GPS tracking subscription ($15--$30/vehicle/month); manual fuel card reporting is manageable
  - **11--30 vehicles:** Dedicated fleet management software (FMS) with integrated maintenance scheduling, fuel card data import, and driver records; combined telematics and FMS platforms in the $25--$55/vehicle/month range become cost-justified above 15 vehicles
  - **31+ vehicles:** Enterprise FMS with open API integration between telematics, fuel card data, maintenance work orders, and financial systems; advanced analytics, predictive maintenance alerts based on DTC codes and mileage triggers, and driver behavior dashboards become operationally essential
- Evaluate telematics platforms on six criteria: (1) GPS tracking update frequency (30-second or better intervals for active routing), (2) engine diagnostic (J1939/OBD-II) integration for fault code alerts, (3) driver behavior event detection (harsh braking threshold sensitivity, typically 0.4g), (4) DVIR and HOS compliance tools if needed, (5) fuel card data integration and MPG calculation, (6) API or native integration with your FMS
- When implementing telematics for the first time, pilot with 10--15% of the fleet for 60--90 days before full rollout; use the pilot period to calibrate alert thresholds to your actual operating conditions -- a construction fleet operating on unpaved roads will generate excessive false-positive harsh-event alerts at settings calibrated for highway driving
- Communicate telematics deployment to drivers transparently: written notice, a team meeting explaining the safety and efficiency purpose, and a clear policy statement distinguishing what is monitored during work hours versus personal use periods; fleets that implement surveillance-framed telematics without driver communication experience 20--35% higher turnover in the first 12 months post-installation
- Implement a weekly fleet dashboard review routine: a 20-minute standing review of the prior week's top-10 speeding events, top-5 harsh-event drivers, vehicles with open fault codes, and PM compliance status; this cadence catches problems before they become expensive and creates accountability without requiring dedicated fleet analyst headcount

### Step 8: EV Transition Planning and Infrastructure

Electrification reduces per-mile fuel and maintenance costs by 30--50% for suitable use cases but introduces new capital, infrastructure, and operational planning requirements.

- Identify EV-suitable candidates using four criteria: (1) predictable daily range under 200 miles (BEV) or under 400 miles (PHEV), (2) vehicle returns to a central location for overnight charging, (3) duty cycle does not require rapid turnaround charging during the operating day, (4) no heavy towing or payload requirements that exceed current BEV ratings
- Calculate the EV TCO premium payback period: a Class 2 electric van (e.g., Ford E-Transit) may cost $20,000--$30,000 more than its ICE equivalent but saves approximately $0.08--$0.12 per mile in fuel and $0.03--$0.06 per mile in maintenance (no oil changes, fewer brake replacements due to regenerative braking, no transmission service); at 25,000 miles/year, the combined savings of $0.11--$0.18/mile deliver $2,750--$4,500/year, producing a 5--8 year payback on the acquisition premium before incentives
- Model charging infrastructure requirements: Level 2 EVSE (240V, 7.2 kW to 19.2 kW) adds 20--35 miles of range per hour; for a vehicle with 200-mile daily range, an 8-hour overnight window on a 11 kW Level 2 charger delivers approximately 90 kWh -- sufficient for most light-duty EV models; plan for one L2 EVSE circuit per 1.5 vehicles if all EVs return at similar times
- Research available incentives before finalizing acquisition decisions: the federal Commercial Clean Vehicle Credit (26 USC 45W) provides up to $7,500 for vehicles under 14,000 lbs GVWR and up to $40,000 for heavier vehicles through 2032; many states offer additional purchase rebates, utility companies offer charging infrastructure rebates, and accelerated depreciation (MACRS Section 179) can apply to charging equipment
- Start with a pilot cohort of 3--5 EVs in your most suitable use case before committing to fleet-wide electrification; track real-world range, charging behavior, driver acceptance, and maintenance cost actuals for 12 months before scaling; real-world EV range in cold climates (below 20°F) can be 20--40% lower than EPA-rated range and must be factored into range adequacy analysis

---

## Output Format

When responding to fleet management queries, structure the output as follows based on the nature of the request:

---

### Fleet Status Report

```
FLEET OPERATIONS REPORT
========================
Organization:          ___________________
Report Period:         ___________________
Fleet Manager:         ___________________

FLEET INVENTORY SUMMARY
-----------------------
Total Vehicles:        ____
  Active:              ____
  In Maintenance:      ____
  Reserve:             ____
  Pending Disposal:    ____
Utilization Rate:      ____%  (Target: >80%)

VEHICLE REGISTER
----------------
Unit #  | Year/Make/Model      | VIN (last 6) | Miles   | Status    | Next PM Due  | Score/50
--------|----------------------|--------------|---------|-----------|--------------|----------
OPS-001 | 2021 Ford F-150 XLT  | xxxxxx       | 67,400  | Active    | 70,000 mi    | 18
OPS-002 | 2019 Chev Express    | xxxxxx       | 112,800 | Active    | 115,000 mi   | 34
OPS-003 | 2018 Ford Transit    | xxxxxx       | 143,200 | Maint.    | Overdue      | 41

COST SUMMARY (CURRENT PERIOD)
------------------------------
Category               | Budget      | Actual      | Variance    | CPM
-----------------------|-------------|-------------|-------------|------
Fuel                   | $________   | $________   | $________   | $____
Maintenance (Planned)  | $________   | $________   | $________   | $____
Maintenance (Unplanned)| $________   | $________   | $________   | $____
Insurance              | $________   | $________   | N/A         | $____
Depreciation/Lease     | $________   | $________   | N/A         | $____
Tires                  | $________   | $________   | $________   | $____
Registration/Fees      | $________   | $________   | $________   | $____
Telematics             | $________   | $________   | N/A         | $____
TOTAL                  | $________   | $________   | $________   | $____

OPERATIONS
----------
Total Fleet Miles:     ________
Fleet Average MPG:     ________  (Prior period: ________)
Vehicle Availability:  ____%     (Target: >92%)
PM Compliance Rate:    ____%     (Target: >95%)
MTBF:                  ________ hours

SAFETY
------
Accidents (period):    ____  | Preventable: ____  | Claim Filed: ____
Driver Violations:     ____  | MVR Reviews Overdue: ____
Avg Driver Score:      ____/100

COMPLIANCE STATUS
-----------------
Item                          | Due Date    | Status
------------------------------|-------------|------------------
DOT/MCS-150 Update            |             | Current / Due / Overdue
IFTA Quarterly Return         |             | Filed / Due
Annual Vehicle Inspections    |             | _____ of _____ complete
Insurance Renewal             |             |
CDL Medical Certificates      |             | _____ of _____ current
MVR Annual Pulls              |             | _____ of _____ complete

REPLACEMENT PIPELINE
--------------------
Unit #  | Score | Recommendation      | Target Replacement Date
--------|-------|---------------------|------------------------
        |  /50  |                     |
        |  /50  |                     |

FUEL ANALYSIS
-------------
Total Gallons:         ________
Total Fuel Spend:      $________
Fleet Avg MPG:         ________
Idle Time (hrs):       ________
Top 3 Consumers:
  1. Unit _____ - $_____ - _____ MPG
  2. Unit _____ - $_____ - _____ MPG
  3. Unit _____ - $_____ - _____ MPG
Flagged Anomalies:     ________

OPEN ITEMS / ACTION REQUIRED
-----------------------------
Priority | Item                        | Owner    | Due Date
---------|-----------------------------|---------|---------
HIGH     |                             |          |
MEDIUM   |                             |          |
LOW      |                             |          |
```

---

### Vehicle Record Card

```
VEHICLE RECORD
==============
Unit Number:           ___________________
Year / Make / Model:   ___________________
VIN:                   ___________________
License Plate:         ___________________  State: _____
GVWR:                  ___________________  lbs
DOT-Regulated (Y/N):   ___________________
Fuel Type:             Gasoline / Diesel / Hybrid / BEV / PHEV
Ownership:             Owned / Leased / Rented
Acquisition Date:      ___________________
Acquisition Cost:      $__________________
Current Market Value:  $__________________  (as of: _______)
Assigned Driver:       ___________________
Department/Route:      ___________________

ODOMETER LOG
------------
Date         | Odometer  | Source
-------------|-----------|--------
             |           |
             |           |

LIFETIME COST SUMMARY
---------------------
Total Maintenance (lifetime): $__________
Total Fuel (lifetime):        $__________
Total Insurance Allocated:    $__________
Total Cost (lifetime):        $__________
Lifetime Miles:               __________
Lifetime CPM:                 $__________

MAINTENANCE HISTORY (recent 5 services)
----------------------------------------
Date    | Odometer | Service Type   | Shop        | Cost    | Next Due
--------|----------|----------------|-------------|---------|----------
        |          |                |             | $       |
        |          |                |             | $       |

REPLACEMENT SCORE
-----------------
Age Score:              ___/10
Mileage Score:          ___/10
Maint Trend Score:      ___/10
Downtime Score:         ___/10
Condition Score:        ___/10
TOTAL:                  ___/50  | Recommendation: ___________________
```

---

## Rules

1. **Never skip the utilization check before recommending fleet expansion.** A fleet with vehicles averaging under 60% utilization has a reallocation problem, not a capacity problem. Adding vehicles to an underutilized fleet increases fixed costs without improving output and is the most common expensive mistake in fleet management.

2. **Always use the manufacturer's severe-duty PM interval for commercial fleet vehicles, not the standard/normal-duty interval.** Urban stop-and-go delivery, frequent towing, short-trip cycles, and temperature extremes all qualify as severe duty. Using the standard 7,500-mile or 10,000-mile oil change interval on a severe-duty vehicle causes premature engine wear that voids warranties and accelerates the cost inflection curve.

3. **GVWR determines regulatory tier -- always verify it before making compliance recommendations.** A truck that looks like a half-ton pickup may have a GVWR over 10,001 lbs, triggering FMCSA jurisdiction. Never assume regulatory status from vehicle appearance; pull the door-jamb label or manufacturer spec sheet.

4. **Cost per mile must be calculated on actual miles driven, not estimated or budgeted miles.** Fleets that budget CPM on projected mileage and then underutilize vehicles see artificially high CPM that triggers premature replacement recommendations. Separate the analysis: if CPM looks high, check whether mileage was lower than planned before assuming costs are out of control.

5. **Unplanned maintenance cost above 50% of total maintenance cost is a red flag requiring root cause analysis, not just more repair budget.** A ratio above 1:1 (unplanned exceeds planned) indicates deferred PM, aging assets past economic life, or driver abuse -- three conditions with different solutions. Never increase the unplanned repair budget without diagnosing which condition is driving it.

6. **Never recommend a straight age-based or mileage-based replacement trigger without completing the five-factor replacement score.** A 12-year-old vehicle with 40,000 miles, low maintenance costs, and a perfect record should not be replaced simply because it is old. Conversely, a 5-year-old high-mileage unit with deteriorating maintenance trends may score 35+ and warrant early replacement. Age and mileage are inputs, not conclusions.

7. **Driver qualification files and MVR pull documentation must be maintained even for non-CDL drivers operating company vehicles.** The most common fleet liability gap is the assumption that DQF requirements only apply to CDL operators. In a negligent entrustment lawsuit, the plaintiff's attorney will ask whether the employer checked the driver's MVR. If the answer is no, the employer faces potential punitive damages exposure regardless of CDL status.

8. **Telematics data used in driver discipline must follow written policy disclosed to drivers before collection.** In many states, using GPS or telematics data to terminate an employee without prior written policy disclosure creates wrongful termination exposure. Always establish and distribute a written telematics and electronic monitoring policy signed by each driver before activating tracking.

9. **IFTA fuel tax reporting requires fuel purchase records AND mileage records by jurisdiction -- fuel card data alone is insufficient.** A common IFTA audit finding is that fleet operators have fuel purchase records but cannot produce jurisdiction-specific mileage from GPS or trip records. Without both data sets, the auditor will assess tax on gross fuel purchases, which typically results in significant underpayment assessments plus interest and penalties.

10. **EV payback calculations must include charging infrastructure cost and electrical service upgrade cost, not just vehicle acquisition delta.** A facility requiring a 200A panel upgrade plus 10 Level 2 EVSE installations may face $40,000--$80,000 in infrastructure costs that extend the payback period by 3--5 years compared to analysis that only compares vehicle prices. Always model the full infrastructure investment in the TCO comparison.

---

## Edge Cases

### Small Fleet (3--10 Vehicles) at a Non-Commercial Business
A small contractor, caterer, or nonprofit with 3--8 vans or trucks often cannot justify fleet management software costs but is too large to manage effectively in a driver's head. Recommend a structured Google Sheets or Excel template covering vehicle register, PM schedule, and monthly fuel log. These workbooks can handle a fleet of this size with 1--2 hours of administrative effort per month. Provide the specific column structure: Unit, YMME, VIN, Odometer, Last PM Date, Last PM Mileage, Next PM Mileage (Last + interval), Next PM Date (Last + time interval), Status, Monthly Fuel ($), Monthly Miles, CPM. A conditional formatting rule that turns the Next PM Mileage cell red when current odometer exceeds it by more than 500 miles provides an effective visual alert with zero software cost. Emphasize that this approach works until the fleet exceeds 12--15 vehicles or adds CDL-regulated operations, at which point dedicated software becomes necessary.

### Fleet With Missing or Incomplete Maintenance History
When a user inherits a fleet with gaps in maintenance records -- common after a management change, acquisition of another company's vehicles, or years of informal management -- the correct approach is not to assume all PM is current. Recommend a one-time comprehensive inspection of every vehicle: oil sample analysis (a $25--$35 lab test reveals contamination, wear metals, and helps estimate engine condition without disassembly), brake measurement, fluid condition inspection, tire tread depth and age (DOT date code on tire sidewall -- tires over 6 years old should be replaced regardless of tread depth due to rubber degradation), and battery load test. Use these results to establish a new baseline rather than attempting to reconstruct history. The inspection investment of $150--$300 per vehicle is far less expensive than the first unexpected breakdown on a vehicle with unknown service history.

### Mixed Fleet With Both DOT-Regulated and Non-Regulated Vehicles
Fleets that mix light-duty non-commercial vehicles with CMVs over 10,001 lbs GVWR must maintain parallel compliance programs. The most common error is applying the same documentation standards uniformly -- either under-documenting CMVs (creating compliance violations) or over-documenting light-duty vehicles (wasting administrative effort). The practical solution is to tag each vehicle record with its regulatory tier and build separate compliance checklists: Tier 1 (standard state registration, annual inspection, insurance) for all vehicles, Tier 2 (DOT number, FMCSA rules, annual FMCSA inspection per 49 CFR 396.17, driver DQF requirements) layered on top for CMVs. Maintenance intervals for Tier 2 vehicles should also follow DOT-recommended inspection categories A, B, and C rather than purely mileage triggers.

### High-Turnover Fleet Operation With Rotating Drivers
Fleets in delivery, staffing, or field service where multiple drivers operate the same vehicle -- or where driver assignment changes weekly -- face specific challenges: pre-trip inspection accountability gaps, fuel card misuse (a driver who won't be in the vehicle next week has less incentive to report a defect), and inability to attribute poor driver scores to an individual. Recommendations: (1) implement digital DVIRs tied to individual driver login so each pre-trip and post-trip report is time-stamped to a specific driver; (2) assign fuel cards by driver rather than by vehicle so fuel transactions follow the person, not the unit; (3) use geofencing and telematics event logging by driver profile rather than by vehicle ID; (4) require departing drivers to complete a condition report with photos at assignment handoff.

### Fleet Operating in Multiple States or Provinces
A fleet crossing state lines regularly must address: IFTA (International Fuel Tax Agreement) licensing and quarterly reporting if operating CMVs in two or more IFTA jurisdictions; IRP (International Registration Plan) apportioned plates based on percentage of miles in each jurisdiction; state-specific weight limits and permit requirements for overweight/oversize loads; varying emissions inspection requirements (California, for example, has separate smog inspection cycles and aftermarket parts restrictions under CARB that do not apply in other states). Recommend that any fleet adding interstate operations get a transportation compliance consultant review before the first trip -- the fine structure for operating without proper IFTA or IRP credentials is steep: up to $5,000 per violation in some jurisdictions, plus back taxes and interest.

### Transitioning From a Fully Outsourced Fleet Management Company
Some organizations outsource all fleet management to a third-party fleet management company (FMC) like Element, Wheels, or ARI (Holman) and then decide to bring operations in-house. The critical data to extract before contract expiration: complete vehicle history reports from the FMC's system (these are your legal records for warranty claims and resale), all maintenance invoices and parts records, all fuel transaction history, driver records, and insurance certificates. FMCs are contractually required to provide this data but may deliver it in proprietary formats requiring conversion. Plan 60--90 days of parallel operation (continuing the FMC relationship while standing up internal systems) to avoid data loss and operational disruption. The cost savings from insourcing fleet management are real -- typically $15--$40/vehicle/month in FMC management fees -- but the transition has a 3--6 month productivity dip before the new system reaches operational maturity.

### Fleet Preparing for a DOT Safety Audit (Compliance Review)
FMCSA safety audits (either New Entrant audits within 12--18 months of registration, or targeted compliance reviews triggered by safety rating or complaint) review six safety management controls: controlled substances and alcohol testing, driver qualifications, financial responsibility (insurance), hours of service, vehicle maintenance, and hazardous materials (if applicable). A fleet with poor documentation in any of these areas is at risk for an Unsatisfactory safety rating, which can result in a cease-operations order within 45 days. Pre-audit preparation steps: pull every driver's DQF and verify completeness, pull 90 days of ELD or paper log records and check for HOS violations, assemble all annual vehicle inspection certificates (Form MCSA-5875 or equivalent), verify drug testing program documentation, and confirm current MCS-150 filing. Fleets that have never been audited often discover documentation gaps during this review that would constitute automatic violations -- better to find and fix them during self-audit than during an FMCSA visit.

---

## Example

**User Input:** "I manage a 12-vehicle fleet for a regional HVAC service company. We have 8 Ford Transit cargo vans (2019--2022 models), 3 F-250 Super Duty trucks (2018--2020), and 1 2017 F-350 flatbed. We're spending about $18,000/month on maintenance and I feel like it's out of control. The F-350 has been in the shop 4 times in the past 6 months. The Transits average about 120 miles/day each. We don't have any formal PM program -- mechanics just fix things when drivers call in. I need to know where to start."

---

**Full Output:**

```
FLEET ASSESSMENT AND ACTION PLAN
=================================
Organization:       [HVAC Service Co.]
Fleet Size:         12 vehicles (8 Transits, 3 F-250s, 1 F-350)
Assessment Date:    [Current Date]
Primary Issue:      Reactive-only maintenance driving excessive costs

SITUATION ANALYSIS
------------------
At $18,000/month for 12 vehicles, your maintenance cost is
$1,500/vehicle/month. For this vehicle mix operating in a commercial
service environment, benchmark ranges are:

  Ford Transit (commercial service):  $400-$650/month in PM-managed fleet
  F-250 Super Duty (heavy use):       $500-$800/month in PM-managed fleet
  F-350 flatbed (vocational):         $600-$1,000/month in PM-managed fleet

Your current spend implies $1,500/vehicle versus a well-managed
benchmark of approximately $480-$720/vehicle -- you are likely
spending 2x-3x what a PM program would produce. On a 12-vehicle
fleet, a 50% cost reduction is realistic within 12 months,
representing $7,000-$9,000/month in savings.

The F-350's 4 shop visits in 6 months is a critical signal.
Without a maintenance history review I cannot confirm, but a
vehicle with 4+ unplanned repairs in 6 months is almost certainly
past its economic replacement point unless the visits were driven
by a single deferred systemic issue (e.g., ignored coolant system
problem that cascaded into overheating, then thermostat, then
head gasket).

ROOT CAUSE ANALYSIS
-------------------
A fully reactive maintenance program ("fix it when it breaks")
produces three systematic cost drivers:

1. FAILURE ESCALATION: Minor issues (e.g., slightly worn brake
   pads, low coolant, marginal battery) that cost $150-$400 to
   address proactively become $800-$3,000 failures when they
   progress to rotor replacement, overheating damage, or
   jump-start/tow events.

2. DOWNTIME COST: Each service van out for unplanned repair
   represents lost technician productivity. At a blended HVAC
   tech rate of $85-$120/hour and 8-hour service day, one day of
   van downtime costs $680-$960 in lost billable capacity BEFORE
   the repair invoice.

3. DEFERRED FLEET HISTORY: Without documented service records,
   you cannot calculate true CPM, cannot make defensible
   replacement decisions, and cannot identify which vehicles are
   pulling the cost average up.

IMMEDIATE ACTIONS (Week 1-2)
-----------------------------
PRIORITY 1: Pull the F-350 out of rotation for a comprehensive
mechanical inspection before it returns to service. Given 4
shop visits in 6 months, you need a full system evaluation:
engine oil sample analysis ($25-$35 via Blackstone Labs or
Polaris Labs, results in 5-7 business days), brake system
measurement, coolant system pressure test, transmission fluid
condition, and a complete undercarriage inspection for frame
or suspension damage consistent with heavy flatbed use.
Run the replacement score:

  F-350 (2017 = 7 years old):
    Age:              7 years = 6/10
    Mileage:          (need actual -- estimate 85,000-120,000
                       for 7-year service vehicle) assume 8/10
    Maint Trend:      4 visits in 6 months = Up 50%+ = 10/10
    Downtime:         4 events x est. 2 days = 8+ days = 8/10
    Condition:        Unknown -- inspect before scoring

  Preliminary score without condition: 32+/50
  If condition scores 6 or higher: Total 38+/50 = REPLACE

  Run the replacement cost justification:
  - Estimate next 24 months of repair cost at current trajectory:
    4 events/6 mo = 8 events/year x avg $1,200/event = $9,600/yr
    x 2 years = $19,200 projected repair cost
  - Current estimated resale value for 2017 F-350 flatbed in fair
    commercial condition: $22,000-$30,000
  - New equivalent replacement (2024 F-350 flatbed):
    $58,000-$65,000 acquisition
  - 24-month cost of replacement at $1,200/month payment +
    lower projected maintenance ($400/mo) = $38,400
  - 24-month cost of keeping: $19,200 repairs + declining
    resale value (est. -$5,000 further) + downtime costs
    ($960/day x 8+ days = $7,680 productivity) = $31,880+

  The financial case for replacement is marginal on cost alone
  at this point but becomes clear if the inspection reveals
  a major repair need (transmission, engine work, suspension).
  Recommend: get inspection results first, then decide.

PRIORITY 2: Establish a vehicle register this week. You need:
  - Unit number for each vehicle (VAN-01 through VAN-08,
    TRUCK-01 through TRUCK-03, FLAT-01)
  - Current odometer reading for each unit
  - Date of last oil change (ask drivers, check glove boxes
    for stickers)
  - Any known open issues per vehicle

This takes 2-3 hours and is the foundation for everything else.

90-DAY PM PROGRAM BUILDOUT
---------------------------
The Transits average 120 miles/day x 260 workdays = 31,200
miles/year. At this rate, they hit Interval A (5,000 mi) every
7-8 weeks. Schedule all 8 Transits for a catch-up Interval B
service (everything through 15,000 mi) within the next 30 days
since none have had structured PM; assume they are all behind.
Stagger appointments 1-2 per week to avoid operational disruption.

The F-250s are heavy-use vocational trucks (towing equipment,
payload stress). Run them on severe-duty intervals:
  Interval A: Every 4,000 miles or 2 months, whichever first
  Interval B: Every 12,000 miles or 9 months
  Interval C: Every 24,000 miles or 18 months

Build a 12-month PM calendar:

Month 1:
  - VAN-01, VAN-02: Interval B catch-up ($280-$380 each)
  - TRUCK-01: Interval B catch-up
  - FLAT-01: Comprehensive inspection (hold for results)

Month 2:
  - VAN-03, VAN-04: Interval B catch-up
  - TRUCK-02: Interval B catch-up

Month 3:
  - VAN-05, VAN-06: Interval B catch-up
  - TRUCK-03: Interval B catch-up
  - VAN-01: Interval A (will hit 5K miles since month 1 service)

Continue staggering through month 12 based on actual mileage
logged in your vehicle register.

FUEL MANAGEMENT QUICK WIN
--------------------------
At 120 miles/day x 8 Transits + estimated 80 miles/day x 4
trucks = 1,280 fleet miles/day x 260 days = 332,800 fleet miles/
year.

Assuming Transit averages 18 MPG, F-250/350 averages 14 MPG:
  8 Transits: 265,000 miles / 18 MPG = 14,722 gallons
  4 trucks:   67,800 miles / 14 MPG = 4,843 gallons
  Total:      ~19,565 gallons/year

At $3.80/gallon diesel/premium mix: ~$74,000/year fuel spend

A 10% MPG improvement through driver coaching and route
optimization = 1,957 gallons = $7,400/year.

Implement fuel cards with odometer entry requirement
immediately. The odometer-entry requirement alone -- because
drivers know MPG is being calculated -- typically produces
a 5-8% efficiency improvement in the first 90 days without
any other intervention.

PROJECTED COST TRAJECTORY
--------------------------
Current:    $18,000/month = $216,000/year maintenance
Target (12 months post-PM program):
  Planned maintenance (all 12 vehicles at benchmark):
    8 Transits x $500/mo avg = $4,000
    3 F-250s x $650/mo avg =   $1,950
    1 replacement F-350 x $450/mo = $450  (if replaced)
  Unplanned repairs (target: <30% of total):
    Est. $1,900/month
  Total target: ~$8,300/month = $99,600/year

  Projected annual savings: ~$116,000
  PM program buildout cost (catch-up services + software):
    ~$8,000-$12,000 one-time
  Net Year 1 savings: ~$104,000-$108,000

RECOMMENDED TECHNOLOGY STACK FOR THIS FLEET SIZE
-------------------------------------------------
12 vehicles is in the range where telematics + FMS integration
becomes cost-justified:

  Fleet Management Software: Samsara, Verizon Connect, or
  Fleetio -- all offer maintenance scheduling, work order
  tracking, fuel card integration, and driver scorecards.
  Budget $30-$45/vehicle/month = $360-$540/month ($4,320-
  $6,480/year). This pays back in the first month at your
  current cost run rate.

  Telematics hardware: OBD-II plug-in devices ($0-$50 one-time
  per vehicle on most platform subscriptions) covering GPS,
  harsh events, idle time, and DTC fault code alerts.

  Priority telematics alerts to configure immediately:
    - DTC fault code alert: any check engine or system fault
      triggers email/SMS to fleet manager within 15 minutes
      (this alone would have flagged the F-350 issues earlier)
    - Idle time alert: >10 minutes continuous idle on HVAC
      routes is atypical and should trigger review
    - Mileage-based PM alert: 500 miles before next service due

COMPLIANCE CHECKLIST FOR YOUR FLEET
-------------------------------------
Your vehicles are light-duty (Transit and F-250 are under
10,001 lbs GVWR standard config; F-350 flatbed may approach
or exceed 10,001 lbs -- verify door jamb label).

If any vehicle exceeds 10,001 lbs GVWR and crosses state lines:
  [ ] DOT number required (register at fmcsa.dot.gov, free)
  [ ] USDOT number marked on both sides of vehicle
  [ ] MCS-150 biennial update scheduled
  [ ] Annual vehicle inspection per 49 CFR 396.17

For all vehicles regardless of GVWR:
  [ ] Commercial auto insurance -- verify all 12 units listed
      on current policy; any unscheduled vehicle is uninsured
  [ ] Driver MVRs pulled within last 12 months for all drivers
  [ ] Signed driver policy acknowledgment on file for each driver
  [ ] Vehicle registrations current (check renewal dates now)

90-DAY MILESTONES
-----------------
Week 1-2:
  [ ] Build vehicle register spreadsheet or enter into FMS
  [ ] Pull F-350 for comprehensive inspection
  [ ] Order fuel cards with odometer-entry requirement
  [ ] Contact preferred shop for staggered PM scheduling

Month 1:
  [ ] Complete catch-up PM for first 3 units
  [ ] Activate telematics on all 12 vehicles
  [ ] Pull MVRs for all drivers
  [ ] Make F-350 replacement decision based on inspection

Month 2-3:
  [ ] Complete catch-up PM for all remaining vehicles
  [ ] Run first monthly fleet cost report using actual data
  [ ] Review first 8 weeks of driver behavior scores
  [ ] Set Year 1 budget targets for each cost category

OPEN QUESTIONS TO ANSWER BEFORE FINAL RECOMMENDATIONS
------------------------------------------------------
1. What is the current odometer reading on the F-350 and
   what specific repairs were the 4 shop visits for?
2. Do any vehicles cross state lines regularly?
   (determines DOT compliance requirements)
3. Do any drivers hold CDLs? (if so, DQF and drug testing
   program requirements apply)
4. Is there an on-site facility for overnight parking and
