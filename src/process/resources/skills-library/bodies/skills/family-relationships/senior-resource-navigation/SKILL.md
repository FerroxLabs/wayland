---
name: senior-resource-navigation
description: |
  Produces a structured guide for finding and accessing community resources
  for seniors including Area Agency on Aging services, senior center programs,
  PACE programs, transportation services, meal delivery, and benefit
  enrollment assistance. Teaches how to identify and connect with local
  equivalents of national resource types.
  Use when the user asks about finding senior services, community resources
  for aging parents, or navigating the senior care system.
  Do NOT use for specific facility recommendations by name, medical care
  guidance, or Medicare/Medicaid claims processing.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "elder-care guide meal-planning"
  category: "family-relationships"
  subcategory: "caregiving"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Senior Resource Navigation Guide

## When to Use

**Use this skill when:**
- User asks about finding community resources for an aging parent or relative
- User wants to know what services are available for seniors in their area
- User asks about senior centers, meal delivery, or transportation for seniors
- User needs help navigating the elder care system or connecting with support services
- User asks about PACE programs, Area Agency on Aging, or senior assistance programs

**Do NOT use this skill when:**
- User wants a specific facility recommendation by name (this skill teaches how to find resources, not which specific ones to use)
- User needs medical care guidance (physician consultation required)
- User asks about Medicare or Medicaid enrollment or claims (benefits counselor needed)
- User wants to evaluate care facilities (use `care-facility-evaluation`)
- User asks about legal planning (use `elder-care-legal-triggers`)

## Process

1. **Identify the senior's needs.** Determine which resource categories are relevant:

   | Need Category | Examples | Priority |
   |--------------|----------|----------|
   | Daily living assistance | Meal preparation, bathing, dressing, housekeeping | [High/Med/Low] |
   | Nutrition | Meal delivery, congregate meals, grocery assistance | [High/Med/Low] |
   | Transportation | Medical appointments, grocery store, social activities | [High/Med/Low] |
   | Health monitoring | Wellness checks, chronic disease management support | [High/Med/Low] |
   | Social engagement | Companionship, activity groups, classes | [High/Med/Low] |
   | Financial assistance | Utility help, prescription assistance, tax preparation | [High/Med/Low] |
   | Legal assistance | Power of attorney, advance directives, benefits appeals | [High/Med/Low] |
   | Home modifications | Safety equipment, ramp installation, grab bars | [High/Med/Low] |
   | Caregiver support | Respite care, support groups, training | [High/Med/Low] |
   | Information and referral | General guidance on available programs | [High/Med/Low] |

2. **Start with the Area Agency on Aging (AAA).** This is the single most important entry point:

   **What the AAA provides:**
   - Free information and referral to local services
   - Needs assessment to determine which programs the senior qualifies for
   - Direct services or funding for many of the categories listed above
   - Case management for seniors with complex needs
   - Caregiver support programs

   **How to find the local AAA:**
   - Call the Eldercare Locator at their national toll-free number (a federally funded service connecting callers to their local AAA)
   - Search online for "[County or City name] Area Agency on Aging"
   - Contact the local Department of Social Services for a referral
   - Ask a hospital social worker or discharge planner for the local number

   **What to ask at the first AAA contact:**
   - "What services are available for a senior who needs [specific need]?"
   - "What is the application process and timeline for services?"
   - "Are there income requirements or eligibility criteria?"
   - "What is the waitlist situation for [specific service]?"
   - "Can you send someone to do an in-home needs assessment?"

3. **Map available resource types.** For each need, identify the type of resource to look for:

   **Nutrition Resources:**

   | Resource Type | What It Provides | Who Qualifies | How to Access |
   |--------------|-----------------|---------------|---------------|
   | Home-delivered meals (Meals on Wheels model) | Daily meals delivered to homebound seniors | Generally age 60+, homebound, unable to prepare meals | Contact AAA or local meal delivery program |
   | Congregate meal sites | Free or low-cost meals at senior centers and community centers | Generally age 60+, no income requirement for federally funded sites | Contact local senior center |
   | Grocery assistance | Grocery shopping help or delivery | Varies by program | AAA, volunteer organizations, faith communities |
   | Supplemental nutrition program (SNAP) | Monthly food benefit | Income-based eligibility | Contact local Department of Social Services |
   | Food pantries | Emergency food supplies | Open to anyone in need | 211 helpline, faith communities, local food bank network |

   **Transportation Resources:**

   | Resource Type | What It Provides | Who Qualifies | How to Access |
   |--------------|-----------------|---------------|---------------|
   | Paratransit services | Door-to-door rides for those unable to use fixed-route transit | Certification required (disability-based, not age-based) | Apply through local transit authority |
   | Senior shuttle programs | Scheduled routes to common destinations (medical, shopping) | Generally age 60+ in service area | Contact AAA or local senior center |
   | Volunteer driver programs | Individual rides provided by trained volunteers | Varies by program | AAA, faith communities, local nonprofits |
   | Medical transportation | Rides specifically to medical appointments | Often covered by insurance or Medicaid | Contact insurance provider or Medicaid managed care plan |
   | Ride-share assistance | Subsidized rides through commercial ride-share platforms | Varies by program | Some AAAs and nonprofits offer ride-share vouchers |

   **Home and Community-Based Services:**

   | Resource Type | What It Provides | Who Qualifies | How to Access |
   |--------------|-----------------|---------------|---------------|
   | In-home aide services | Personal care and homemaking assistance | Varies: some income-based, some Medicaid-funded | AAA, state Medicaid waiver programs |
   | Adult day programs | Structured daytime activities, supervision, socialization | Generally any senior who needs daytime supervision | AAA, local senior centers, health organizations |
   | PACE programs | Comprehensive medical and social services for nursing-home-eligible seniors living at home | Age 55+, nursing home eligible, living in PACE service area | Find local PACE program through AAA |
   | Friendly visitor programs | Regular companionship visits from volunteers | Generally age 60+ or homebound | AAA, faith communities, volunteer organizations |
   | Telephone reassurance | Daily check-in calls to verify wellbeing | Generally homebound seniors | AAA, local police departments (some offer this), volunteer organizations |
   | Home modification programs | Funding or labor for safety modifications | Income-based eligibility in most programs | AAA, local housing authority, nonprofit organizations |

   **Financial Assistance Resources:**

   | Resource Type | What It Provides | Who Qualifies | How to Access |
   |--------------|-----------------|---------------|---------------|
   | Utility assistance programs | Help with heating, cooling, and electric bills | Income-based eligibility | Local Department of Social Services, utility company |
   | Property tax relief | Reduced property taxes for qualifying seniors | Age and income-based (varies by jurisdiction) | Local tax assessor's office |
   | Prescription assistance | Discounted or free prescription medications | Program-specific (manufacturer, state, nonprofit) | Physician's office, AAA, state pharmaceutical assistance program |
   | Free tax preparation | Tax filing assistance for seniors | Generally age 60+ with simple tax situations | AARP Tax-Aide program (seasonal), VITA sites |
   | Benefit enrollment assistance | Help applying for benefits the senior may qualify for | Anyone who needs help navigating applications | AAA, local Department of Social Services, hospital social workers |

   **Caregiver Support Resources:**

   | Resource Type | What It Provides | Who Qualifies | How to Access |
   |--------------|-----------------|---------------|---------------|
   | Respite care programs | Temporary relief for primary caregivers | Family caregivers (some programs income-based) | AAA, National Family Caregiver Support Program |
   | Caregiver support groups | Peer support and shared experience | Any family caregiver | AAA, disease-specific organizations, online platforms |
   | Caregiver training | Skills training for home care tasks | Family caregivers | AAA, home health agencies, hospital discharge programs |
   | Counseling services | Individual counseling for caregiver stress | Family caregivers | AAA referral, community mental health centers |

4. **Navigate the 211 system.** 211 is a national helpline that connects callers to local services:

   **How to use 211:**
   - Dial 2-1-1 from any phone
   - A trained information specialist will assess needs and provide referrals
   - Services are free, confidential, and available in multiple languages
   - Available 24/7 in most areas
   - Can also be accessed online for searchable databases of local resources

   **Best for:** When you need to find services quickly and are unsure where to start, when the AAA office is closed, when you need services that fall outside the AAA's scope (housing, mental health, disability services), or when you need emergency assistance.

5. **Assess eligibility and apply for services:**

   **Typical eligibility factors:**
   - Age (most federally funded senior services: age 60+)
   - Income level (many services have income caps; some are available regardless of income)
   - Functional need (some services require a needs assessment showing difficulty with daily activities)
   - Geographic location (services are organized by county or region)
   - Medicaid or Medicare enrollment (opens access to additional programs)

   **Application process (general pattern):**
   1. Contact the resource provider (usually by phone)
   2. Complete an intake interview (often by phone)
   3. Provide documentation (ID, income verification, medical documentation as needed)
   4. Schedule a needs assessment (in-home visit for many services)
   5. Wait for approval and service start date
   6. Expected timeline: 1-6 weeks for most services; some have waitlists of 3-12 months

   **If there is a waitlist:**
   - Ask to be placed on the waitlist immediately (do not delay application)
   - Ask if there are alternative programs with shorter wait times
   - Ask if the senior's situation qualifies for expedited processing
   - Check back monthly for waitlist status updates
   - Look for private-pay alternatives in the interim

6. **Create the resource map.** Compile all identified resources into a single reference:

   For each resource:
   - Program name and contact information
   - What it provides
   - Eligibility requirements
   - Application status (applied / approved / waitlisted / not yet applied)
   - Costs (free, sliding scale, copay, private pay)
   - Review date (when to re-evaluate this resource)

## Output Format

```
## Senior Resource Guide for [Name]

### Needs Assessment Summary

| Need | Priority | Resource Type to Find | Status |
|------|----------|----------------------|--------|
| [Need] | [High/Med/Low] | [Resource type] | [Found / Searching / Not started] |

### Key Contact: Area Agency on Aging
- **Name:** [Local AAA name]
- **Phone:** [Number]
- **Website:** [If found]
- **Case manager (if assigned):** [Name]
- **Last contact date:** [Date]

### Resource Map

#### Nutrition
| Program | Contact | Status | Eligibility | Cost |
|---------|---------|--------|-------------|------|
| [Program] | [Phone] | [Applied/Approved/Waitlisted] | [Requirements] | [Free/Copay/$] |

#### Transportation
| Program | Contact | Status | Eligibility | Cost |
|---------|---------|--------|-------------|------|
| [Program] | [Phone] | [Applied/Approved/Waitlisted] | [Requirements] | [Free/Copay/$] |

#### Home Support
| Program | Contact | Status | Eligibility | Cost |
|---------|---------|--------|-------------|------|
| [Program] | [Phone] | [Applied/Approved/Waitlisted] | [Requirements] | [Free/Copay/$] |

#### Financial Assistance
| Program | Contact | Status | Eligibility | Cost |
|---------|---------|--------|-------------|------|
| [Program] | [Phone] | [Applied/Approved/Waitlisted] | [Requirements] | [Free/Copay/$] |

### Application Tracker

| Program | Date Applied | Documentation Needed | Status | Follow-Up Date |
|---------|-------------|---------------------|--------|---------------|
| [Program] | [Date] | [What's needed] | [Pending/Approved/Denied] | [Date] |

### Next Steps
1. [Specific action with timeline]
2. [Specific action with timeline]
3. [Specific action with timeline]
```

## Rules

1. NEVER name specific organizations or providers -- this skill teaches types of resources and how to find them, not which specific ones to contact
2. NEVER provide Medicare or Medicaid enrollment guidance -- direct to the local benefits counselor or Department of Social Services
3. ALWAYS start with the Area Agency on Aging as the primary entry point -- it is the federally mandated hub for senior services in every region
4. ALWAYS include the 211 helpline as a backup resource -- it covers services that the AAA may not directly provide
5. Include application tracking in every resource guide -- pending applications get lost without follow-up
6. Present resources in table format organized by need category, never as unstructured lists
7. Include waitlist management advice for every resource that commonly has waitlists (meal delivery, in-home aide services, adult day programs)
8. ALWAYS note that eligibility requirements and available programs vary by jurisdiction -- the resource types are national, but the specific programs differ by county and state
9. Include a follow-up schedule for checking application status and re-evaluating resource needs
10. Frame PACE programs as an especially valuable option for nursing-home-eligible seniors who want to remain at home -- they are underutilized because many families do not know they exist

## Edge Cases

- **Rural areas with limited services:** In rural areas, some resource types (adult day programs, PACE programs, paratransit) may not exist locally. Focus on: telephone-based services (check-in calls, telehealth), mail-order meal delivery programs, volunteer driver networks, faith community support, and whether the AAA operates any mobile service programs. Some rural areas have cooperative models where multiple counties share resources. Ask the AAA specifically about rural-specific programs.

- **Non-English-speaking senior:** Language barriers significantly limit access to resources. Prioritize: finding the AAA's multilingual services (many have staff who speak common languages or use interpreter lines), ethnic community organizations that serve seniors in the person's language, faith communities with matching language services, and culturally specific meal delivery or social programs. When calling 211 or the AAA, request interpreter assistance immediately.

- **Senior who refuses services:** When the senior is resistant to accepting help from outside the family, start with the least intrusive options: telephone check-in calls, grocery delivery (can be framed as convenience rather than assistance), and social activities at senior centers (framed as recreation, not care). Some seniors accept services from faith communities more readily than from government programs. Respect autonomy while ensuring safety -- if refusal of services creates a safety risk, involve the primary care physician in the conversation.

- **Financial complexity (too much income for programs, too little for private pay):** Seniors whose income slightly exceeds eligibility thresholds fall into a gap. Options include: sliding-scale fee programs (many services charge based on ability to pay rather than strict cutoffs), negotiating with program administrators about borderline cases, state-funded programs with different eligibility criteria than federal programs, nonprofit organizations with more flexible eligibility, and veteran-specific programs (if applicable). Ask the AAA about every possible funding source before concluding that no assistance is available.

- **Recently relocated senior:** When the senior has moved to a new area and has no established local connections, the resource-finding process starts from zero. Begin with: the local AAA (first call), 211 (second call), the local senior center (visit in person -- this also addresses social isolation), and the new primary care physician's office (social workers can provide resource lists). Moving is a common trigger for senior isolation -- prioritize social engagement resources alongside practical needs.

## Example

**Input:** "My dad is 75, lives alone, and just stopped driving. He can still take care of himself but he's stuck at home now. What services are out there to help?"

**Output:**

## Senior Resource Guide for Dad

### Needs Assessment Summary

| Need | Priority | Resource Type | Status |
|------|----------|--------------|--------|
| Transportation | HIGH | Senior shuttle, paratransit, volunteer drivers | Searching |
| Social engagement | HIGH | Senior center programs, friendly visitors | Searching |
| Nutrition | MEDIUM | Congregate meals (at senior center), grocery delivery | Searching |
| Wellness check | MEDIUM | Telephone reassurance, friendly visitor | Searching |
| Financial | LOW | Assess if any assistance programs applicable | Not started |

### Step 1: Contact the Area Agency on Aging (This Week)

**How to find your local AAA:**
- Call the Eldercare Locator national helpline
- Or search online for "[Dad's county] Area Agency on Aging"

**What to ask:**
1. "My father is 75, lives alone, and can no longer drive. What transportation programs are available in [county]?"
2. "Are there senior center programs near [address] that include transportation to the center?"
3. "Does the county have a friendly visitor or telephone check-in program?"
4. "Is my father eligible for any home-delivered meal programs, or can he attend congregate meals at a senior center?"
5. "Can you send someone to do an in-home needs assessment?"

### Step 2: Resource Types to Research

#### Transportation (Top Priority)

| Resource Type | What to Look For | How to Find |
|--------------|-----------------|------------|
| Senior shuttle/bus | Scheduled routes to medical, shopping, senior center | AAA, local transit authority, senior center |
| Volunteer driver program | Individual rides by trained volunteers | AAA, faith communities, local nonprofits |
| Paratransit service | Door-to-door rides (may require ADA eligibility certification) | Local transit authority |
| Medical transportation | Rides to doctor appointments (may be covered by insurance) | Dad's health insurance provider |
| Ride-share vouchers | Subsidized commercial rides | Some AAAs and nonprofits offer voucher programs |

**Interim solution while researching:** Ask family, friends, or neighbors to help with essential trips (grocery, pharmacy, medical). Create a list of errands that can be batched into one trip per week.

#### Social Engagement (Critical -- Isolation Risk)

Losing the ability to drive often leads to social isolation, which has significant health impacts for seniors. Prioritize reconnecting your dad with regular social contact.

| Resource Type | What to Look For | How to Find |
|--------------|-----------------|------------|
| Senior center programs | Daily activities, classes, social events, meals | AAA, local parks and recreation department |
| Friendly visitor program | Volunteer visits 1-2 times per week | AAA, faith communities, local nonprofits |
| Telephone reassurance | Daily check-in calls | AAA, some local police departments |
| Library programs | Senior-focused classes, book groups, computer classes | Local public library |
| Faith community groups | Social groups, meal programs, volunteer visitors | Local faith communities in Dad's area |

#### Nutrition

| Resource Type | What to Look For | How to Find |
|--------------|-----------------|------------|
| Congregate meals at senior center | Daily lunch in a social setting (often free or by donation) | Local senior center |
| Home-delivered meals | Daily meal delivery for homebound seniors | AAA, local meal delivery program |
| Grocery delivery assistance | Volunteer grocery shoppers or delivery service | AAA, faith communities, volunteer organizations |

### Action Plan

| # | Action | Timeline | Who |
|---|--------|----------|-----|
| 1 | Call the Area Agency on Aging | This week | [User] |
| 2 | Visit the nearest senior center in person with Dad | This week | [User] + Dad |
| 3 | Research transportation options from AAA referrals | Week 2 | [User] |
| 4 | Sign Dad up for at least one recurring weekly activity | Week 2-3 | [User] + Dad |
| 5 | Apply for transportation programs identified by AAA | Week 2-3 | [User] |
| 6 | Set up telephone check-in if available | Week 3-4 | [User] |
| 7 | Assess whether meal delivery or congregate meals would help | Week 3-4 | [User] + Dad |
| 8 | Follow up on all applications | Monthly | [User] |

### Application Tracker

| Program | Date Applied | Status | Follow-Up |
|---------|-------------|--------|-----------|
| AAA intake | [Date of first call] | [Status] | [Date] |
| Senior center registration | [Date] | [Status] | [Date] |
| Transportation program | [Date] | [Status] | [Date] |

### Follow-Up Schedule
- Week 2: Check in with Dad about how he is managing daily tasks
- Week 4: Review all applications and follow up on pending items
- Month 2: Assess whether current resources are sufficient or if additional support is needed
- Every 3 months: Re-evaluate needs as they may change over time
