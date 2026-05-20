---
name: packing-list-builder
description: |
  Creates categorized packing checklists with quantity columns and trip-type
  and weather conditionals. Gathers destination, trip duration, activities
  planned, weather forecast, and traveler preferences to produce a printable
  packing list organized by category with check-off boxes.
  Use when the user asks to create a packing list, figure out what to pack,
  prepare luggage for a trip, or organize travel gear by category.
  Do NOT use for trip itinerary building (use trip-itinerary-builder), travel
  budgets (use budget-travel-planner), or moving and relocation packing.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "travel packing checklist template"
  category: "travel-experiences"
  subcategory: "trip-planning"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Packing List Builder

## When to Use

**Use this skill when:**
- User asks to create a packing list for a trip
- User wants to know what to pack for a specific destination or activity
- User needs a categorized, printable packing checklist
- User asks about luggage organization or how much to bring
- User wants a weather-conditional packing list (rainy season, cold climate, tropical)
- User wants a packing list for a specific trip type (backpacking, business, beach, adventure)

**Do NOT use when:**
- User wants a trip itinerary (use `trip-itinerary-builder`)
- User wants a travel budget (use `budget-travel-planner`)
- User is packing for a move or relocation (use home-household skills)
- User wants a gear list for a specific hobby (use hobbies-crafts skills)
- User wants a baby packing list as part of family trip planning (use `family-trip-planner`)

## Process

1. **Gather packing parameters.** Ask the user for:
   - Destination and climate (tropical, temperate, cold, desert, mixed)
   - Trip duration (number of days and nights)
   - Trip type (leisure, business, backpacking, adventure, beach, city sightseeing, cruise)
   - Planned activities (hiking, swimming, formal dinners, temple visits, nightlife)
   - Season and expected weather (temperature range, rain likelihood)
   - Luggage constraint (carry-on only, checked bag, backpack only)
   - Laundry access (hotel laundry, laundromat, hand-wash, none)
   - Special needs (medications, medical devices, dietary supplements, baby items)
   - Airline or transport restrictions if applicable

2. **Calculate clothing quantities.** Use the clothing formula:
   - **Base formula:** 1 outfit per day, up to a maximum based on laundry access
   - **With laundry every 3-4 days:** Pack 4-5 complete outfits
   - **With laundry every 7 days:** Pack 7 outfits
   - **No laundry access:** Pack 1 outfit per day (or slightly fewer with quick-dry materials)
   - **Underwear and socks:** 1 per day + 1 extra pair regardless of laundry access
   - **Sleep clothes:** 1-2 sets
   - **Outerwear:** 1 primary layer (jacket or sweater), 1 rain layer if applicable
   - **Formal or dressy:** 1 outfit per formal event planned
   - **Activity-specific:** 1 set per activity type (swimsuit, hiking clothes, gym clothes)

3. **Build categories.** Organize items into these standard categories:
   - **Clothing:** Tops, bottoms, underwear, socks, sleepwear, outerwear, shoes
   - **Toiletries:** Hygiene basics, skincare, dental, hair, shaving
   - **Electronics:** Phone, charger, adapter, camera, headphones, power bank
   - **Documents:** Passport, tickets, insurance, copies, wallet, cards
   - **Health and safety:** Medications, first aid, sunscreen, insect repellent
   - **Comfort and convenience:** Neck pillow, eye mask, reusable water bottle, daypack
   - **Activity-specific:** Gear for planned activities (swim, hike, formal, religious sites)

4. **Apply conditionals.** Add or remove items based on:
   - **Weather conditionals:** Rain gear if rain is likely, warm layers if temperature drops below 15C/60F, sun protection if tropical or summer
   - **Trip type conditionals:** Business trip adds formal wear and laptop; backpacking removes bulky items; beach trip adds swim and cover-ups
   - **Destination conditionals:** Adapter type for destination country, modest clothing for conservative destinations, mosquito net for tropical regions
   - **Duration conditionals:** Trips over 7 days add laundry kit; trips over 14 days add a packing cube strategy

5. **Add the luggage strategy.** Include:
   - Recommended bag type and size
   - Packing method (roll vs. fold, packing cubes, compression bags)
   - Weight estimate and airline limit comparison
   - Day bag or personal item recommendation
   - Dirty laundry separation method

6. **Compile the final list.** Format as a printable checklist with:
   - Check boxes for each item
   - Quantity column
   - Conditional flags (marked with weather or trip-type symbol)
   - Packed status column (for checking off while packing)
   - Notes column for user customization

## Output Format

```
## Packing List: [Destination] -- [N] Days, [Trip Type]

**Climate:** [Climate type, temperature range]
**Luggage:** [Carry-on | Checked bag | Backpack] -- [Size recommendation]
**Laundry access:** [Yes, every X days | No]

---

### Clothing

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    |                                |
| [ ]    | [Item]                  | [X] | Rain season        | [Waterproof recommended]       |
| [ ]    | [Item]                  | [X] | Cold weather       | [Layer under jacket]           |
| [ ]    | [Item]                  | [X] | Formal event       | [Dinner on Day 3]              |
| [ ]    | [Item]                  | [X] | Beach/swim         |                                |

### Toiletries

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    | [Travel size if carry-on]      |

### Electronics

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    |                                |

### Documents

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    |                                |

### Health and Safety

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] | Tropical           | [DEET or picaridin based]      |

### Comfort and Convenience

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    |                                |

### Activity-Specific: [Activity Name]

| Packed | Item                    | Qty | Conditional        | Notes                          |
|--------|-------------------------|-----|--------------------|--------------------------------|
| [ ]    | [Item]                  | [X] |                    |                                |

---

### Luggage Strategy

- **Bag:** [Type and size]
- **Packing method:** [Roll, fold, packing cubes]
- **Estimated weight:** [X] kg / [X] lbs (limit: [X])
- **Day bag:** [Type for daily outings]
- **Dirty laundry:** [Separate bag or packing cube strategy]

### Do NOT Pack (Common Mistakes)

- [Item people commonly overpack or should not bring]
- [Item restricted by airline or destination]
- [Item available cheaply at destination]
```

## Rules

1. NEVER include external URLs, specific brand names, or product names -- use generic item descriptions
2. ALWAYS include a quantity column for every item
3. ALWAYS mark conditional items with their condition (weather, trip type, activity, destination)
4. Clothing quantities must follow the laundry-adjusted formula -- never pack 1 outfit per day for a 14-day trip with laundry access
5. Toiletries must note "travel size" for carry-on packing lists
6. Include a Documents section with passport, insurance, and copies for every international trip
7. Include a "Do NOT Pack" section listing common over-packing mistakes and destination-restricted items
8. The list must be organized by category with clear section headers
9. NEVER output generic advice like "pack light" without specific quantities -- every item must have a number
10. Include a luggage strategy section with bag type, packing method, and weight estimate
11. Activity-specific sections are added only when the user has planned specific activities -- do not add a swim section for a winter city trip
12. Every list must include a Health and Safety section regardless of trip type

## Edge Cases

- **Carry-on only for a long trip (7+ days):** Enforce strict quantity limits. Prioritize quick-dry, wrinkle-resistant fabrics. Remove full-size toiletries. Add laundry kit (sink wash soap, clothesline). Suggest wearing bulkiest items on the plane. Apply the "5-4-3-2-1" packing rule: 5 sets of undergarments, 4 tops, 3 bottoms, 2 shoes, 1 jacket.

- **Multi-climate trip (e.g., beach then mountains):** Create two sub-lists, one per climate zone. Identify items that cross over (rain jacket works for both). Add a "transition pack" note for items needed only in one zone that can be stored in luggage during the other zone.

- **Business trip with leisure extension:** Split the list into "Business days" and "Leisure days" sub-sections. Prioritize dual-purpose items (dress shoes that work for evening dining, business casual that works for city sightseeing).

- **Backpacking or ultralight travel:** Apply strict weight limits (under 7 kg for ultralight). Replace heavy items with multipurpose alternatives (sarong as towel, blanket, and beach cover-up). Remove all "nice to have" items. Add packing cube and compression bag requirements.

- **Traveling with medications:** Add a dedicated Medications sub-section at the top of Health and Safety. Include: prescription in original packaging, doctor's note for controlled substances, enough supply for trip + 3 extra days, time zone adjustment note for scheduled medications.

- **Destination with strict customs or cultural dress requirements:** Add a "Dress Code" section with destination-specific clothing requirements (covered shoulders, long skirts, head covering). Mark these items as non-negotiable in the Conditional column.

## Example

**Input:** "I need a packing list for a 7-day trip to Thailand in August. Tropical climate, beach and temple visits. Carry-on bag only. I have laundry access every 3 days."

**Output:**

## Packing List: Thailand -- 7 Days, Beach and Cultural

**Climate:** Tropical, 28-35C (82-95F), monsoon season (frequent afternoon rain showers)
**Luggage:** Carry-on only -- 40L backpack or 22-inch rolling bag
**Laundry access:** Yes, every 3 days

---

### Clothing

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Lightweight t-shirts or tanks  | 4   |                    | Quick-dry fabric preferred             |
| [ ]    | Shorts (casual)                | 2   |                    | Knee-length for temple flexibility     |
| [ ]    | Light pants or long skirt      | 1   | Temple visits      | Required for temple entry              |
| [ ]    | Swimsuit                       | 2   | Beach              | One to wear, one drying                |
| [ ]    | Cover-up or sarong             | 1   | Beach + temples    | Doubles as temple cover and beach wrap |
| [ ]    | Lightweight dress or romper    | 1   |                    | Evening dining option                  |
| [ ]    | Underwear                      | 5   |                    | Quick-dry recommended                  |
| [ ]    | Socks (lightweight)            | 2   |                    | For temple visits requiring sock entry |
| [ ]    | Sleepwear                      | 1   |                    | Lightweight shorts and top             |
| [ ]    | Rain jacket (packable)         | 1   | Monsoon season     | Folds into its own pocket              |
| [ ]    | Sandals (walking)              | 1   |                    | Primary footwear, secure strap         |
| [ ]    | Water shoes or flip-flops      | 1   | Beach              | For beach and hostel showers           |
| [ ]    | Lightweight sneakers           | 1   |                    | Wear on plane, use for temple walking  |

### Toiletries

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Toothbrush and toothpaste      | 1   |                    | Travel size (100ml max)                |
| [ ]    | Deodorant                      | 1   |                    | Travel size                            |
| [ ]    | Shampoo and conditioner        | 1 ea|                    | Solid bars or travel bottles (100ml)   |
| [ ]    | Body wash or soap bar          | 1   |                    | Bar saves space and weight             |
| [ ]    | Razor                          | 1   |                    |                                        |
| [ ]    | Sunscreen (face and body)      | 1   | Tropical           | SPF 50+, reef-safe if swimming         |
| [ ]    | After-sun or aloe gel          | 1   | Tropical           | Small tube, 50ml                       |
| [ ]    | Insect repellent               | 1   | Tropical           | DEET or picaridin based                |
| [ ]    | Lip balm with SPF              | 1   |                    |                                        |
| [ ]    | Contact lens supplies          | 1   |                    | If applicable                          |

### Electronics

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Phone and charger cable        | 1   |                    |                                        |
| [ ]    | Portable power bank            | 1   |                    | 10,000 mAh minimum for full-day outings|
| [ ]    | Universal power adapter        | 1   |                    | Thailand uses Type A, B, C, O outlets  |
| [ ]    | Earbuds or headphones          | 1   |                    | For transit and beach                  |
| [ ]    | Waterproof phone pouch         | 1   | Beach              | For beach and boat trips               |

### Documents

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Passport                       | 1   |                    | Valid for 6+ months beyond trip dates  |
| [ ]    | Passport photocopy             | 1   |                    | Store separately from original         |
| [ ]    | Travel insurance card or policy| 1   |                    | Photo on phone + paper copy            |
| [ ]    | Flight confirmation printout   | 1   |                    | Backup in case phone is dead           |
| [ ]    | Accommodation confirmation     | 1   |                    | Address in local script if possible    |
| [ ]    | Emergency contact card         | 1   |                    | Written card in wallet                 |
| [ ]    | Cash (local currency)          | --  |                    | Withdraw at arrival, carry small bills |
| [ ]    | Credit or debit card           | 2   |                    | Two different cards as backup          |

### Health and Safety

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Personal medications           | --  |                    | Trip duration + 3 extra days           |
| [ ]    | Basic first aid (band-aids, antiseptic) | 1 kit |            | Small zip pouch                    |
| [ ]    | Anti-diarrhea medication       | 1   |                    | Common traveler issue in tropical regions |
| [ ]    | Rehydration sachets            | 4   | Tropical           | For heat and stomach issues            |
| [ ]    | Antihistamine                  | 1   |                    | For insect bites or food reactions     |
| [ ]    | Pain reliever                  | 1   |                    | Ibuprofen or acetaminophen             |

### Comfort and Convenience

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Day bag or small backpack      | 1   |                    | Foldable, for daily outings            |
| [ ]    | Reusable water bottle          | 1   |                    | Collapsible to save space              |
| [ ]    | Packing cubes                  | 2-3 |                    | Organize clothing by type              |
| [ ]    | Dry bag or waterproof pouch    | 1   | Monsoon season     | For electronics during rain            |
| [ ]    | Travel towel (quick-dry)       | 1   |                    | Microfiber, compact for beach          |
| [ ]    | Laundry bag                    | 1   |                    | Separate dirty clothes                 |
| [ ]    | Sink laundry soap              | 1   |                    | Small packet for hand-washing between laundry days |
| [ ]    | Zip-lock bags (assorted)       | 4-6 |                    | Wet items, snacks, organization        |
| [ ]    | Padlock                        | 1   |                    | For hostel lockers if applicable       |

### Activity-Specific: Temple Visits

| Packed | Item                           | Qty | Conditional        | Notes                                  |
|--------|--------------------------------|-----|--------------------|----------------------------------------|
| [ ]    | Long pants or skirt (knee-covering) | 1 | Temple visits   | Required at most temples               |
| [ ]    | Shirt covering shoulders       | 1   | Temple visits      | No sleeveless tops at temples          |
| [ ]    | Socks                          | 1   | Temple visits      | Some temples require socks not bare feet|

---

### Luggage Strategy

- **Bag:** 40L travel backpack or 22-inch carry-on (max 7-10 kg depending on airline)
- **Packing method:** Roll all clothing, use 2-3 packing cubes (clean/dirty separation)
- **Estimated weight:** 6-8 kg fully packed
- **Day bag:** Packable 20L daypack for daily outings
- **Dirty laundry:** Dedicated laundry packing cube, wash every 3 days

### Do NOT Pack (Common Mistakes)

- Jeans (too heavy, too hot, takes forever to dry -- bring lightweight pants instead)
- Full-size toiletries (buy locally if you run out, save weight and liquid limit space)
- More than 2 pairs of shoes (sandals, sneakers, and water shoes cover all activities)
- Towels (accommodation provides them; bring one travel towel for beach only)
- Expensive jewelry or valuables (risk of loss or theft, not needed for beach and temple trips)
- Thick cotton t-shirts (absorb sweat and take hours to dry -- quick-dry synthetics or linen instead)
