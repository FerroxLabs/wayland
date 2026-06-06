---
name: collection-inventory-builder
description: |
  Creates a structured collection inventory system with database schema design, cataloguing workflows, condition grading frameworks, and storage documentation for any collectible type. Gathers the user's collection type, size, and goals to produce a complete inventory template with fields, grading criteria, and maintenance protocols.
  Use when the user asks about cataloguing a collection, building a collection database, tracking collectible items, organizing an inventory of collectibles, or documenting collection condition and provenance.
  Do NOT use for determining the monetary value of collectibles (use collection-valuation-guide), authenticating items for fraud detection (use collectible-authentication-guide), insurance appraisals, or business inventory management for retail stock.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "checklist template planning guide"
  category: "hobbies-crafts"
  subcategory: "collecting"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Collection Inventory Builder

## When to Use

**Use this skill when:**
- User asks about cataloguing or organizing a collection
- User wants to build a database or spreadsheet for tracking collectible items
- User needs a system for documenting item condition, provenance, or storage
- User mentions stamps, coins, cards, art, memorabilia, vinyl records, books, or other collectibles
- User wants to create a collection inventory from scratch
- User asks about condition grading for collectibles

**Do NOT use when:**
- User asks about the monetary value of items (use `collection-valuation-guide`)
- User needs authentication or fraud detection (use `collectible-authentication-guide`)
- User needs an insurance appraisal or legal documentation of value
- User asks about business inventory management for retail or wholesale operations
- User wants to sell a collection online (marketplace logistics are out of scope)

## Process

1. **Identify the collection type and scope.** Ask the user for:
   - Collection type: what they collect (coins, stamps, trading cards, art prints, vinyl records, comic books, sports memorabilia, antiques, figurines, books, wine, watches, etc.)
   - Collection size: approximate number of items (under 50, 50-200, 200-1000, over 1000)
   - Current organization: completely unorganized, partially organized, or has an existing system that needs improvement
   - Primary goal: personal tracking, insurance documentation, future sale preparation, sharing with other collectors, or estate planning
   - Storage situation: how and where items are currently stored

2. **Design the database schema.** Create fields appropriate to the collection type:
   - **Universal fields (all collection types):**
     - Item ID: unique identifier (sequential number or custom code)
     - Name/Title: item description
     - Category/Type: classification within the collection
     - Date acquired: when obtained
     - Acquisition source: where obtained (store, auction, gift, estate sale, trade)
     - Acquisition cost: price paid (or estimated value at time of receipt if gift)
     - Condition grade: standardized condition rating
     - Storage location: where the item is physically stored
     - Photo reference: filename or link to item photograph
     - Notes: free-text field for special details
   - **Type-specific fields by collection category:**
     - **Coins:** Year, mint mark, denomination, country, metal composition, variety, certification number (if graded)
     - **Stamps:** Year, country, denomination, watermark, perforation gauge, used/unused, cancellation type
     - **Trading cards:** Year, set name, card number, player/character, manufacturer, parallel/variant, grading service and grade
     - **Comic books:** Issue number, series title, publisher, year, key issue status, cover artist, grading service and grade
     - **Vinyl records:** Artist, album title, label, pressing year, catalog number, pressing country, matrix number, sleeve condition (separate from disc)
     - **Art:** Artist, title, medium, dimensions, year created, edition number (if print), provenance chain, framing status
     - **Sports memorabilia:** Sport, player/team, item type (jersey, ball, card, autograph), year, authentication certificate number
     - **Books:** Author, title, publisher, year, edition, printing, binding type, dust jacket presence and condition
     - **Watches:** Brand, model, reference number, serial number, movement type, case material, year, box and papers status

3. **Establish condition grading framework.** Define a grading scale appropriate to the collection:
   - **Generic grading scale (for collections without established industry standards):**
     - Mint (M): Flawless, as-new condition. No wear, damage, or aging visible
     - Near Mint (NM): Almost perfect. Only the most minor imperfections visible under close inspection
     - Excellent (EX): Minor wear visible. All original parts/components intact. No significant defects
     - Very Good (VG): Moderate wear visible. All original parts present. Minor defects acceptable
     - Good (G): Noticeable wear. May have minor missing elements. Clearly used but intact
     - Fair (F): Significant wear or damage. May be missing elements. Structural integrity maintained
     - Poor (P): Heavy wear, damage, or missing components. Primarily of interest for completeness
   - **Industry-specific scales (use these when applicable):**
     - Coins: Sheldon scale 1-70 (Poor-1 to Mint State-70) or descriptive (Good, Fine, Extremely Fine, Uncirculated)
     - Comics: CGC/CBCS 0.5-10.0 scale or descriptive equivalent
     - Trading cards: PSA/BGS 1-10 scale
     - Stamps: Mint/Unused/Used with subcategories (Original Gum, Hinged, No Gum, Canceled)
   - **Grading documentation:** For each item, record:
     - Grade assigned
     - Grader: self-graded or professionally graded (service name and certificate number)
     - Date graded
     - Specific defects noted (list each defect)

4. **Build the cataloguing workflow.** Define the step-by-step process for adding new items:
   - **Step 1: Receive and document.** Photograph the item upon acquisition (front, back, any notable features or defects). Record acquisition date and source immediately.
   - **Step 2: Research and classify.** Identify the item using reference materials. Determine category, year, variety, and any special characteristics. Assign to the correct classification within the collection.
   - **Step 3: Grade condition.** Using the appropriate grading framework, assign a condition grade. Photograph any defects. Note the specific factors that determined the grade.
   - **Step 4: Assign ID and enter data.** Generate or assign the item ID. Enter all fields into the inventory system. Attach photographs.
   - **Step 5: Store and label.** Place the item in its designated storage location. If using physical storage, label the storage container with the item ID. Update the storage location field.
   - **Step 6: Backup.** Ensure the inventory data is backed up (cloud storage, second copy, or export to spreadsheet).

5. **Design storage documentation.** Create a storage map:
   - **Storage hierarchy:** Room -> Container -> Position (e.g., "Office, Binder 3, Page 12, Slot 4")
   - **Environmental notes:** Temperature range, humidity range, light exposure
   - **Protective housing by type:**
     - Coins: acid-free flips, capsules, or slabs; avoid PVC holders
     - Stamps: acid-free mounts or stock pages; glassine envelopes for loose stamps
     - Cards: penny sleeves inside top loaders; graded cards in slab holders
     - Comics: acid-free bags with acid-free boards; stored upright
     - Vinyl: inner sleeves (HDPE), outer sleeves (polypropylene); stored vertically, never stacked flat
     - Art: acid-free matting if framed; flat storage with acid-free interleaving for prints
   - **Climate control priorities:**
     - Temperature: 65-72F (18-22C) -- avoid attics and garages with temperature swings
     - Humidity: 40-55% relative humidity -- use dehumidifier if needed
     - Light: minimize direct sunlight and fluorescent light exposure
     - Handling: clean hands or cotton gloves for high-value items

6. **Set up maintenance schedule.** Define regular inventory maintenance tasks:
   - **Monthly:** Backup inventory data. Check storage environment (temperature, humidity) if monitoring
   - **Quarterly:** Spot-check 10% of stored items against inventory records. Verify storage conditions
   - **Annually:** Full inventory audit -- verify every item against the database. Update condition grades for any items showing change. Review storage supplies and replace worn protective housing
   - **On acquisition:** Follow the cataloguing workflow for every new item within 7 days of acquisition
   - **On disposal:** Mark items as sold, traded, or donated. Record sale price and date. Archive the entry (do not delete)

## Output Format

```
## Collection Inventory System

### Collection Profile
| Parameter            | Value                              |
|----------------------|------------------------------------|
| Collection type      | [Type of collectible]              |
| Estimated items      | [Number of items]                  |
| Primary goal         | [Tracking / Insurance / Sale prep] |
| Storage location     | [Primary storage description]      |

### Database Schema
| Field              | Type     | Required | Notes                   |
|--------------------|----------|----------|-------------------------|
| item_id            | Text     | Yes      | [Format: TYPE-NNNN]     |
| name               | Text     | Yes      | [Item description]       |
| category           | Text     | Yes      | [Classification]         |
| date_acquired      | Date     | Yes      | [YYYY-MM-DD]             |
| acquisition_source | Text     | Yes      | [Store/auction/gift]     |
| acquisition_cost   | Currency | Yes      | [Price paid or est.]     |
| condition_grade    | Text     | Yes      | [Grading scale]          |
| storage_location   | Text     | Yes      | [Room > Container > Pos] |
| photo_ref          | Text     | No       | [Filename]               |
| notes              | Text     | No       | [Free text]              |
| [Type field 1]     | [Type]   | [Y/N]   | [Type-specific]          |
| [Type field 2]     | [Type]   | [Y/N]   | [Type-specific]          |

### Condition Grading Scale
| Grade         | Code | Description                        |
|---------------|------|------------------------------------|
| [Grade 1]     | [M]  | [Definition]                       |
| [Grade 2]     | [NM] | [Definition]                       |
| [Grade 3]     | [EX] | [Definition]                       |
| ...           | ...  | ...                                |

### Cataloguing Workflow
1. [ ] Photograph item (front, back, defects)
2. [ ] Record acquisition date and source
3. [ ] Research and classify
4. [ ] Assign condition grade
5. [ ] Enter all fields in inventory
6. [ ] Store and label
7. [ ] Backup data

### Storage Map
| Location Code  | Description           | Items   | Climate Notes    |
|----------------|-----------------------|---------|------------------|
| [LOC-01]       | [Room, Container]     | [Count] | [Temp, humidity] |
| [LOC-02]       | [Room, Container]     | [Count] | [Temp, humidity] |

### Protective Housing
| Material                | Use For             | Replace When        |
|-------------------------|---------------------|---------------------|
| [Housing type]          | [Item type]         | [Replacement rule]  |

### Maintenance Schedule
| Frequency  | Task                              | Last Done  | Next Due   |
|------------|-----------------------------------|------------|------------|
| Monthly    | [Task]                            | [Date]     | [Date]     |
| Quarterly  | [Task]                            | [Date]     | [Date]     |
| Annually   | [Task]                            | [Date]     | [Date]     |
```

## Rules

1. NEVER recommend a specific software product or platform for inventory management -- provide schema and workflow that work in any system (spreadsheet, database, paper)
2. ALWAYS include the universal fields in every inventory schema regardless of collection type
3. Condition grading must use a defined scale with written criteria for each grade -- never just "condition: good" without defining what "good" means
4. Storage recommendations must include environmental controls (temperature, humidity, light) appropriate to the collection type
5. Protective housing recommendations must be specific to the material type -- PVC holders damage certain collectibles; acid-free materials are mandatory for paper-based collections
6. The cataloguing workflow must include photography as the first step -- visual documentation prevents disputes about condition at time of acquisition
7. ALWAYS include a backup procedure in the maintenance schedule
8. Item IDs must be unique and follow a consistent format -- recommend a type prefix plus sequential number
9. On-disposal procedures must archive the record, not delete it -- historical records of items that were in the collection have value for provenance and tax documentation
10. If the collection exceeds 200 items, recommend batch cataloguing (process 10-20 items per session) rather than attempting the entire collection at once

## Edge Cases

- **User has an inherited collection they know nothing about:** Start with a triage process before full cataloguing. Sort items into broad categories first (type, apparent age, apparent condition). Photograph everything in batches. Do not assign detailed grades until the user has basic familiarity with the category. Recommend a reference guide or collector community for the specific type. Full cataloguing can follow once the collection scope is understood.

- **User has a very large collection (over 1000 items):** Recommend a phased approach: catalogue the most valuable or fragile 10% first, then systematically work through the remainder at a sustainable pace (10-20 items per session, 2-3 sessions per week). Estimate total cataloguing time: approximately 5-10 minutes per item for detailed cataloguing, 2-3 minutes per item for basic entry.

- **User collects across multiple categories (e.g., stamps and coins and cards):** Create a unified inventory system with a master table and type-specific extension tables. The master table contains universal fields; each type table contains type-specific fields. Link via item ID. This avoids blank columns for irrelevant fields while maintaining one searchable inventory.

- **User wants to catalogue for insurance purposes:** Emphasize documentation of acquisition cost or current estimated replacement value. Photographs must be high-resolution and stored separately from the collection (cloud backup or safety deposit box). The inventory should be exportable as a document that an insurance adjuster can use. Recommend updating estimated values annually for high-value items.

- **User has items that are damaged or in poor condition:** Still catalogue them -- completeness matters for the collection record. Grade accurately using the scale (Fair or Poor is a legitimate grade). Note specific damage in the defects field. These items may still have value for completeness in a set or as candidates for professional restoration.

## Example

**Input:** "I have about 150 vinyl records that I've collected over the years. They're all in a closet in various conditions. I want to organize them properly and know what I have. Some might be worth something but mostly I just want to take better care of them."

**Output:**

## Collection Inventory System: Vinyl Records

### Collection Profile
| Parameter            | Value                                  |
|----------------------|----------------------------------------|
| Collection type      | Vinyl records (LP, 45s, and other formats) |
| Estimated items      | ~150 records                           |
| Primary goal         | Personal tracking and improved storage |
| Storage location     | Closet (to be reorganized)             |

### Database Schema
| Field              | Type     | Required | Notes                              |
|--------------------|----------|----------|------------------------------------|
| item_id            | Text     | Yes      | Format: VNL-0001, VNL-0002, etc.  |
| artist             | Text     | Yes      | Primary artist or band name        |
| album_title        | Text     | Yes      | Full album title                   |
| label              | Text     | Yes      | Record label name                  |
| catalog_number     | Text     | Yes      | Label catalog number (on spine/label) |
| year               | Number   | Yes      | Year of this pressing              |
| format             | Text     | Yes      | LP, 2xLP, 45, 12-inch single, 10-inch, 78 |
| pressing_country   | Text     | No       | Country of pressing (US, UK, Japan, etc.) |
| matrix_number      | Text     | No       | Dead wax inscription (identifies pressing) |
| disc_condition     | Text     | Yes      | Goldmine grading scale             |
| sleeve_condition   | Text     | Yes      | Goldmine grading scale (separate)  |
| storage_location   | Text     | Yes      | Shelf/crate/position number        |
| date_acquired      | Date     | Yes      | When you got it                    |
| acquisition_source | Text     | Yes      | Store, online, gift, thrift, etc.  |
| acquisition_cost   | Currency | Yes      | What you paid (0 if gift)          |
| photo_ref          | Text     | No       | Photo filename (cover + label)     |
| notes              | Text     | No       | Special pressings, colored vinyl, inserts, etc. |

### Condition Grading Scale (Goldmine Standard for Vinyl)
| Grade              | Code | Disc Description                              | Sleeve Description                        |
|--------------------|------|-----------------------------------------------|-------------------------------------------|
| Mint               | M    | Unplayed, factory-sealed. No marks whatsoever  | No wear, creases, or writing. As-new       |
| Near Mint          | NM   | Nearly flawless. May have been played but shows no wear | Minimal handling. No splits, ring wear, or writing |
| Very Good Plus     | VG+  | Light surface marks visible. Plays with very minor noise | Light wear at edges. No splits. Minor ring wear acceptable |
| Very Good          | VG   | Audible surface noise, light scratches. Still enjoyable to play | Obvious wear: ring wear, minor seam splits, light writing |
| Good               | G    | Significant surface noise and scratches. Plays through without skipping | Heavy wear: seam splits, writing, tape, missing pieces |
| Fair               | F    | Plays but with skips or repeating grooves | Major damage: tears, water damage, missing panels |
| Poor               | P    | May not play. Cracked, warped, or deeply scratched | Barely holding together or missing entirely |

**Important:** Disc and sleeve are graded separately. A VG+ disc in a G sleeve is common for older records.

### Cataloguing Workflow for Vinyl Records
1. [ ] Photograph the front cover, back cover, and record labels (both sides)
2. [ ] Record the catalog number from the spine or label
3. [ ] Check the dead wax (the smooth area near the label) for matrix numbers
4. [ ] Grade the disc: hold at an angle under light -- look for scratches, scuffs, and warping
5. [ ] Grade the sleeve: check seams, ring wear, corner wear, writing
6. [ ] Enter all fields in your inventory spreadsheet
7. [ ] Place the record in a new inner sleeve and outer sleeve if the originals are damaged
8. [ ] File in alphabetical order by artist in the designated storage location
9. [ ] Update the storage_location field with the final position

### Storage Map
| Location Code | Description                    | Capacity | Climate Notes              |
|---------------|--------------------------------|----------|----------------------------|
| CLO-A         | Closet, shelf 1, crate A       | 40-50 LPs | Room temperature, no direct sun |
| CLO-B         | Closet, shelf 1, crate B       | 40-50 LPs | Room temperature, no direct sun |
| CLO-C         | Closet, shelf 2, crate C       | 40-50 LPs | Room temperature, no direct sun |
| CLO-D         | Closet, shelf 2, overflow       | 20-30 LPs | Room temperature             |

### Protective Housing
| Material                     | Use For           | Replace When                          |
|------------------------------|-------------------|---------------------------------------|
| HDPE inner sleeves           | All discs         | When torn or creased                  |
| Polypropylene outer sleeves  | All cover jackets | When cloudy or torn                   |
| Acid-free cardboard dividers | Alphabetical tabs | When bent or damaged                  |

**Storage rules for vinyl:**
- Store vertically, never stacked flat (stacking causes warping)
- Maintain 65-72F temperature (avoid attics, garages, and basements with moisture)
- Keep humidity at 40-55% -- vinyl and cardboard both suffer in high humidity
- Avoid direct sunlight on any shelf or crate
- Do not overstuff crates -- records should slide in and out without friction

### Maintenance Schedule
| Frequency  | Task                                              | Next Due |
|------------|---------------------------------------------------|----------|
| Monthly    | Backup inventory spreadsheet to cloud              | 1 month  |
| Quarterly  | Spot-check 15 records against inventory            | 3 months |
| Annually   | Full inventory audit: verify all 150 records match | 1 year   |
| Annually   | Inspect inner and outer sleeves; replace worn ones | 1 year   |
| On acquire | Catalogue within 7 days using the workflow above   | Ongoing  |

### Getting Started: Batch Cataloguing Plan
With 150 records, plan to catalogue 15 records per session, 2-3 sessions per week. At that pace, the full inventory will be complete in approximately 4-5 weeks.

| Week | Sessions | Records Catalogued | Running Total |
|------|----------|--------------------|---------------|
| 1    | 3        | 45                 | 45            |
| 2    | 3        | 45                 | 90            |
| 3    | 3        | 45                 | 135           |
| 4    | 1-2      | 15-30              | 150           |
