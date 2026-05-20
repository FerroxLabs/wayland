---
name: business-letter
description: |
  Writes formal business letters with proper formatting, professional tone,
  and clear purpose for external correspondence including partnership requests,
  complaints, announcements, and official communications. Use when the user
  needs a formal letter to an external party. Do NOT use for internal memos
  (use `business-memo`), emails (use `professional-email`), or proposals
  (use `business-proposal`).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "writing business-writing email"
  category: "writing"
  subcategory: "business-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Business Letter Writing

## When to Use

Use this skill when the user needs a formal written communication directed to an **external party** -- an entity or individual outside their own organization -- where the correspondence will exist as a standalone, signed document (physical mail, scanned PDF, or formally transmitted digital letter).

**Use this skill for:**
- Vendor or supplier correspondence: delivery failures, pricing disputes, contract renewals, onboarding communications
- Client-facing formal notices: service changes, payment demands, contract amendments, account terminations
- Partnership or collaboration requests to external organizations
- Regulatory, compliance, or governmental correspondence (e.g., responses to audits, licensing authorities, regulatory bodies)
- Formal complaints to companies, government agencies, or professional bodies
- Legal-adjacent notices that do not constitute legal documents themselves: demand letters for payment, breach-of-contract notifications, cease-and-desist requests (while advising legal review)
- Announcements requiring documented external record: price increases, service discontinuations, merger notifications, policy changes
- Reference letters, letters of recommendation, or attestation letters for individuals
- Credit reference letters, bank comfort letters, or letters of good standing
- Formal thank-you correspondence following significant business milestones

**Do NOT use this skill for:**
- Internal communications within the same organization -- use `business-memo` instead
- Emails, even formal ones -- use `professional-email` instead; letters sent by email as body text lose legal standing as formal correspondence
- Business proposals, RFP responses, or pitch documents -- use `business-proposal` instead
- Rejection letters for job applicants or vendor bids -- use `rejection-letter` instead
- Press releases or public announcements -- use `press-release` instead
- Legal filings, affidavits, or court documents -- these require licensed legal professionals, not a writing skill
- Internal policy announcements distributed to staff -- use `business-memo` or `internal-announcement` instead
- Sales prospecting or cold outreach -- use `sales-outreach` instead; formal letters are inappropriate for first-contact sales

---

## Process

### Step 1: Gather the Critical Inputs Before Writing Anything

Never begin drafting without collecting the following. If the user has not provided these, ask before proceeding.

- **Sender identity:** Full name, title, organization, mailing address, email, and direct phone number. If the sender is signing on behalf of a company, confirm whether the letter represents a personal view or an official organizational position.
- **Recipient identity:** Full name (confirm spelling), exact title, organization name (confirm legal entity vs. trade name), and mailing address. Errors in names or titles undermine credibility immediately.
- **Letter purpose:** Classify by type -- request, complaint, demand, announcement, confirmation, reference, or notice. Each type has a different structural logic.
- **Key facts and figures:** Dates, invoice numbers, contract references, order numbers, dollar amounts, quantities, agreement terms, or prior correspondence dates. These are what transform a generic letter into a legally and professionally credible document.
- **Desired outcome:** What does the sender want the recipient to do? By when? What happens if they do not?
- **Tone calibration:** Formal-cordial (existing positive relationship), formal-firm (dispute or demand), formal-conciliatory (repairing a relationship), or formal-neutral (announcement or informational).
- **Physical or digital delivery:** Physical mail requires standard block format with no digital embellishments. PDF attachments sent via email may include company letterhead instructions. Fully digital letters may be formatted differently but must still follow block format conventions.
- **Enclosures and copies:** What supporting documents will accompany the letter? Who else is being copied, and does the recipient need to know that?

### Step 2: Select the Correct Letter Format

Business letters follow one of three established format conventions. Select based on organizational preference and context:

- **Full Block Format (most common in the United States):** Every element -- sender block, date, recipient block, salutation, body, closing, and signature -- is flush left with no indentation. Paragraphs are separated by a blank line rather than indentation. This is the default format and appropriate for most business correspondence.
- **Modified Block Format:** The sender block, date, closing, and signature are aligned to the right or center of the page. Body paragraphs remain flush left or are indented five spaces. Used in some professional services industries (law, finance) where tradition is valued.
- **Semi-Block Format:** Same as modified block but body paragraphs are indented. The least common modern format; only use if the user's organization explicitly uses it.

For this skill, default to **Full Block Format** unless the user specifies otherwise.

**Margin and spacing standards:**
- Margins: 1 inch on all sides (standard business letter)
- Font: 12-point Times New Roman or 11-point Calibri or Arial -- nothing smaller than 10.5pt
- Spacing: single-spaced within paragraphs, one blank line between paragraphs
- Date format: Write out fully -- "February 26, 2026" not "2/26/26" or "26/02/26"
- Page limit: one page for most correspondence; two pages maximum for complex matters; three or more pages almost always indicates the document should be a different format (report, proposal, agreement)

### Step 3: Construct the Sender and Recipient Blocks

The header block is not merely administrative -- it establishes the legal identity of the correspondence and creates the chain of record. Build it precisely.

**Sender Block (top of letter):**
- Full legal name of the sender
- Official title (do not abbreviate titles like "VP" if writing for formal or legal correspondence -- use "Vice President")
- Organization's full legal name (e.g., "Westfield Manufacturing, Inc." not "Westfield Mfg.")
- Complete mailing address on separate lines (no comma-separated single-line addresses)
- Direct email and direct phone number (not a general switchboard)

**Date Line:**
- Skip one line after the sender block
- Write the date the letter will be signed and sent, not the date it was drafted
- Use the full written-out format: "March 15, 2026"

**Recipient Block:**
- Skip two lines after the date
- Recipient's full name with appropriate honorific (Mr., Ms., Dr., Professor, The Honorable)
- Exact title as it appears on their official communications or LinkedIn (mismatched titles cause friction)
- Organization name -- use the legal entity name for formal correspondence
- Full mailing address

**Reference Line (optional but valuable for complex correspondence):**
- After the recipient block, add "Re: [Subject]" -- e.g., "Re: Purchase Order #PO-2026-0183 -- Late Delivery Claim"
- This allows the recipient to route the letter immediately and file it correctly
- Use for any letter referencing a specific contract, invoice, order, or prior correspondence

### Step 4: Write the Salutation Correctly

The salutation in a business letter is not a formality -- it signals your level of acquaintance with the recipient and the register of the correspondence.

**Salutation rules by scenario:**
- Known recipient, formal relationship: "Dear Mr. Mitchell," or "Dear Dr. Reyes," -- use last name only, followed by a comma (US convention) or colon (more formal, also acceptable)
- Known recipient, established first-name relationship: "Dear James," is acceptable if you regularly address each other by first name -- but err toward the formal if in doubt
- Unknown name, known title: "Dear Vice President of Operations," or "Dear Hiring Manager," or "Dear Director of Procurement,"
- Unknown individual, known department: "Dear Customer Relations Team," or "Dear Legal Department,"
- Unknown recipient entirely: "To Whom It May Concern," is the last resort -- it signals poor research and reduces the letter's impact
- Government officials: "Dear Representative [Last Name]," or "Dear Commissioner [Last Name]," -- never "Mr." or "Ms." for elected officials in formal correspondence
- International recipients: In Germany and Austria, "Sehr geehrte/r" (formal) is standard; in the UK, "Dear Mr./Ms. [Last Name]" is identical to US convention; in Japan, correspondence routed through a company rather than an individual is the norm -- consult the user on international protocol when relevant

### Step 5: Draft the Body Using the Purpose-Specific Structure

Each letter type has a distinct structural logic. Do not apply a one-size-fits-all paragraph structure.

**Request Letters:**
- Paragraph 1: State the specific request in the first two sentences. Do not bury it.
- Paragraph 2: Provide the rationale or business context that makes the request reasonable.
- Paragraph 3: Address any likely objections or constraints proactively.
- Closing: Make it easy to say yes -- specify the exact next step, provide contact information, and set a deadline.

**Complaint or Dispute Letters:**
- Paragraph 1: State the specific problem and its impact in factual, unemotional terms.
- Paragraph 2: Provide the documented chronology: what was agreed, what happened, when, with reference numbers.
- Paragraph 3: State the remedy requested precisely -- a specific dollar amount, replacement, corrective action, or written explanation.
- Closing: Specify the response deadline and the consequence of non-response (without threats -- "we will be required to escalate this matter" is appropriate; "we will sue you" is not).

**Announcement Letters:**
- Paragraph 1: Lead with the news itself. Do not build to it.
- Paragraph 2: Provide the context, rationale, or background that helps the recipient understand why.
- Paragraph 3: State the practical impact on the recipient -- effective dates, required actions, changes to their relationship with your organization.
- Closing: Provide a contact for questions and express willingness to discuss.

**Confirmation or Agreement Letters:**
- Paragraph 1: Reference the conversation, meeting, or agreement being confirmed and its date.
- Paragraph 2: Restate the agreed terms with specificity -- dollar amounts, deliverable dates, responsibilities of each party.
- Paragraph 3: Identify what each party needs to do next to move forward.
- Closing: Request acknowledgment -- ask the recipient to sign and return a copy, or confirm receipt by a specific date.

**Reference or Attestation Letters:**
- Paragraph 1: State your relationship to the individual and the capacity in which you know them.
- Paragraph 2: Provide specific, evidence-based assessments -- not generic praise ("James consistently reduced procurement cycle time by 20% year-over-year").
- Paragraph 3: Address suitability for the specific purpose for which the letter is being written.
- Closing: Offer to discuss further and provide direct contact.

**Payment Demand Letters:**
- Paragraph 1: State the amount owed, the original due date, and how many days past due it is.
- Paragraph 2: Reference the original agreement, invoice numbers, and any prior collection attempts.
- Paragraph 3: State the payment deadline and the specific consequences of non-payment (collections, legal action, credit reporting).
- Closing: Provide payment instructions. Keep tone firm but professional.

### Step 6: Write the Closing Paragraph and Signature Block

The closing paragraph is where letters most often fail. Vague closings ("We look forward to hearing from you") are filler. Every closing must contain:
- The **specific action** you want the recipient to take
- A **specific deadline** -- "by March 10, 2026" not "soon" or "at your earliest convenience"
- A **direct contact method** -- the sender's direct phone and email
- A **conditional consequence** if appropriate -- "if we do not receive confirmation by March 10, we will proceed with..." (for demand or dispute letters)

**Complimentary close options by tone:**
- "Sincerely," -- universal, appropriate for all formal business correspondence
- "Respectfully," or "Respectfully yours," -- appropriate for correspondence to government officials, regulatory bodies, or in highly formal contexts
- "Cordially," -- appropriate for warm, collegial correspondence where a relationship exists
- "Best regards," -- acceptable for semi-formal correspondence; less appropriate for complaint or demand letters
- Never use: "Yours truly" (archaic), "Warmly" (too personal), "Thanks" (too casual)

Skip four lines after the complimentary close for the handwritten signature. Then:
- Typed name
- Title
- Organization (optional if letterhead is used)

**Notation Lines (below signature block):**
- "Enclosures: [list each document]" or "Enc. (3)" for the number of items
- "cc: [Name, Title, Organization]" for anyone receiving a copy -- list all cc recipients the primary recipient should know about
- "Attachment:" if the letter is sent digitally and files are attached rather than physically enclosed

### Step 7: Review Against the Business Letter Quality Checklist

Before presenting the letter to the user, verify:

- [ ] No passive opening ("I am writing to inform you...") -- purpose is stated directly in sentence one
- [ ] Recipient name and title are spelled correctly and match their actual title
- [ ] All dates, amounts, invoice numbers, and reference numbers are accurate as provided by the user
- [ ] The letter is one page (flag if it exceeds one page and recommend condensing or restructuring)
- [ ] The closing paragraph contains a specific action, a specific deadline, and contact information
- [ ] Appropriate notation lines (Enclosures, cc) are included
- [ ] No contractions (do not, cannot, we will -- not don't, can't, we'll)
- [ ] Tone is calibrated to the relationship and letter type
- [ ] The "Re:" line is included for any letter referencing a specific agreement, invoice, or prior correspondence
- [ ] For legally sensitive letters, a recommendation for legal review is included as a note to the user

---

## Output Format

Present the letter as a formatted document block followed by any user-facing notes about the letter.

```
[Sender Full Name]
[Sender Title]
[Organization Full Legal Name]
[Address Line 1]
[City, State ZIP Code]
[Direct Email]
[Direct Phone]

[Full Date -- e.g., March 15, 2026]

[Recipient Full Name]
[Recipient Exact Title]
[Organization Full Legal Name]
[Address Line 1]
[City, State ZIP Code]

Re: [Subject -- invoice number, contract reference, or topic -- optional but recommended]

Dear [Mr./Ms./Dr. Last Name],

[Opening paragraph: State the purpose directly in the first one to two sentences. No
pleasantries, no buildup. Name what you want or what this letter addresses. Reference
any prior correspondence or shared context that establishes the letter's basis. 3-5
sentences maximum.]

[Body paragraph 1: Provide the core facts, documentation, or context. Include specific
dates, reference numbers, dollar amounts, and any agreed terms that are relevant.
This is the evidentiary paragraph -- make it specific enough to stand alone as a
record. 4-6 sentences.]

[Body paragraph 2 (if needed): Secondary supporting information, anticipated questions,
or additional context. For complex matters, this paragraph bridges the facts to the
requested action. Omit if the matter is straightforward. 3-5 sentences.]

[Closing paragraph: State the specific action requested. Name the exact deadline.
For dispute or demand letters, note the consequence of non-response. Provide the
sender's direct contact information. Express willingness to discuss if appropriate
to the tone. 3-5 sentences.]

[Complimentary Close -- Sincerely / Respectfully / Cordially],


[Sender Full Name]
[Sender Title]

Enclosures: [Document 1 with date, Document 2 with date]
cc: [Name, Title, Organization]
```

**After the letter, include a brief user note if any of the following apply:**
- The letter references legal obligations or potential litigation -- flag for legal review
- Key facts were inferred because the user did not provide them -- list what was assumed
- The letter exceeds one page -- note why and confirm with the user
- An international recipient is involved -- note any cultural conventions observed

---

## Rules

1. **Never open with "I am writing to..."** -- This construction wastes the reader's first sentence and signals weak writing. The purpose must be stated as the subject of the opening sentence itself. "We are requesting..." or "This letter addresses..." or "Westfield Manufacturing disputes..." are all stronger openings.

2. **Never write a letter without a specific deadline in the closing paragraph.** "At your earliest convenience" is not a deadline. For requests: 10 to 15 business days is standard. For disputes: 5 to 10 business days. For payment demands: 7 to 30 days depending on the amount and relationship stage.

3. **Never guess at the recipient's name, title, or address.** If the user cannot provide these, ask. A letter addressed to the wrong person or with a misspelled name is immediately discredited and may not reach the correct party.

4. **Never use contractions in formal business letters.** "We cannot" not "we can't." "We will not" not "we won't." "It is" not "it's." Contractions lower the register of the document and undermine its authority as a formal record.

5. **Never make accusations -- state facts and consequences.** In dispute or complaint letters, write "The shipment arrived on February 24, fourteen days after the confirmed delivery date of February 10" rather than "Your team failed to meet its commitment and damaged our business." Facts create a record; accusations create defensiveness and invite counterargument.

6. **Never exceed one page without flagging it.** A two-page business letter is occasionally justified for complex matters (detailed payment demands, multi-issue complaints, complex confirmations). A three-page business letter almost always means the document should be a different format entirely -- a report, a proposal, or a legal brief.

7. **Never omit the "Re:" reference line for letters tied to a specific contract, invoice, order, or case.** This line allows the recipient's organization to file and route the letter correctly. Without it, letters are lost in administrative limbo, which undermines your client's ability to claim they gave proper notice.

8. **Always match the complimentary close to the tone.** Using "Cordially" in a demand letter or "Respectfully" in a friendly confirmation letter sends a mixed signal. The close is part of the tone architecture of the letter.

9. **Always include enclosure notation when documents are referenced.** If the letter references "the attached sales confirmation dated January 15," that document must appear in the Enclosures line. A letter that references documentation that is not enclosed is an incomplete record.

10. **Always recommend legal review for any letter that uses the words "demand," "breach," "legal action," "damages," "claim," or "liability."** These are legally operative terms. The user should know that even a well-written letter could have unintended legal consequences if not reviewed by counsel.

11. **Always present numbers in both figures and written form when the amount is significant or legally relevant.** "Eight thousand dollars ($8,000)" rather than just "$8,000" -- this convention prevents disputes over amounts and is standard in formal financial correspondence.

12. **Never use "To Whom It May Concern" if any alternative exists.** Research the correct recipient title ("Dear Compliance Officer," "Dear Collections Department," "Dear Customer Relations Team") before defaulting to this generic salutation. "To Whom It May Concern" signals that the sender did not make the effort to identify the correct recipient.

---

## Edge Cases

### The Legally Sensitive Letter
When the letter involves potential legal action, breach of contract, or financial liability claims, the writing approach changes significantly. Maintain factual precision at all costs -- every sentence could be read into a court record. Do not characterize intent ("you deliberately delayed..."); document only observable facts and their consequences. Avoid emotional language entirely. Add the notation "CONFIDENTIAL -- ATTORNEY-CLIENT COMMUNICATION" only if the letter was drafted at an attorney's direction -- do not use this notation speculatively. After drafting, include a clear note to the user: "This letter addresses matters that may have legal consequences. I recommend having legal counsel review it before sending." Do not draft cease-and-desist letters without flagging that these are legal instruments that should originate from an attorney, not a business executive.

### The International Recipient
Business letter conventions differ materially across cultures. In **Germany and Austria**, letters are often more formal and structured, frequently include a subject line in bold, use "Sehr geehrte Damen und Herren" (formal unknown recipient) or "Sehr geehrter Herr/Sehr geehrte Frau [Last Name]," and end with "Mit freundlichen Grüßen." In **Japan**, business correspondence follows strict hierarchical protocols; if writing to a Japanese company, it is more effective to address the letter to the company or department rather than an individual unless you have a direct relationship. In **the United Kingdom**, "Dear Mr./Ms. [Last Name]" is standard, and letters are closed with "Yours sincerely" (when you know the name) or "Yours faithfully" (when you have used "Dear Sir/Madam"). Flag cultural differences to the user when the recipient is in a country with materially different conventions and ask whether they want to apply local conventions or use US-standard format.

### The Follow-Up Letter After No Response
When drafting a follow-up to a letter that received no reply, the structure changes. Open by referencing the original letter by date and subject ("This letter follows our correspondence of January 15, 2026, regarding PO-2026-0183, to which we have not received a response."). Do not express frustration or imply bad faith -- the original letter may have been lost or misdirected. Restate the core request in condensed form (two to three sentences maximum). Set a new, shorter deadline than the original. State a specific next step if the deadline is not met ("If we do not receive a response by March 15, we will escalate this matter to our legal department / collections agency / regulatory body" -- whichever is appropriate). For payment demands, escalate the tone incrementally: first letter is cordial-firm, second letter is firm, third letter explicitly references next steps such as collections referral or legal action.

### The Letter on Behalf of Someone Else
When the user is drafting a letter that will be signed by someone else -- their CEO, a client, a supervisor -- the letter must reflect the voice and authority of the signer, not the drafter. Use first-person singular ("I am writing" or "I request") if the signer is an individual; use first-person plural ("We are requesting") if the signer represents the organization in an institutional capacity. Do not include information the signer would not know directly. The drafter's name does not appear in the letter unless they are named as a contact ("Please contact [Drafter Name] at [phone/email] to coordinate follow-up"). If a letter is signed "on behalf of" a senior executive by an assistant or delegate, the convention is to write the executive's name in the signature block, sign the delegate's initials above it, and add "p.p." (per procurationem) before the executive's printed name.

### The Confidential or Sensitive-Content Letter
For letters containing sensitive business information -- financial terms, personnel matters, proprietary data, or confidential negotiations -- add "CONFIDENTIAL" as a single bold or capitalized line between the date and the recipient block, and again in the header of any second page. This notation has no strict legal force on its own but establishes the sender's intent and can be relevant in disputes. For letters sent by email as a PDF attachment, recommend the user password-protect the PDF or use secure document transmission. Advise the user not to include sensitive information in the email body text accompanying a formal letter -- the body email is not the letter.

### The Letter Requiring Multiple Signatories
Some formal letters -- joint venture announcements, multi-party agreements, letters co-signed by two executives -- require multiple signature blocks. Place signature blocks side by side if space permits (two columns), or stack them vertically. Each block must include the full name and title of each signer. Both parties must sign before the letter is sent. If the letter is being sent physically, two original copies should be created so each party retains a signed original. If the user describes a scenario where two companies are jointly signing, flag that this type of correspondence often warrants legal review to confirm it does not inadvertently create a binding agreement.

### The Letter Requiring a Specific Legal Notice Convention
Certain business letters must follow legally prescribed formats to be valid -- notice of contract termination (must often comply with the notice provisions in the contract), notice of default, notice of lease termination, DMCA notices, and COBRA election notices are examples. When the user's request involves a letter that is likely governed by a contractual notice clause or a legal statute, ask: "Does your contract specify how notice must be delivered (certified mail, specific address, specific timeframe)?" If yes, the letter must comply with those provisions exactly. Flag that failure to follow contractual notice requirements can invalidate the notice entirely, even if the letter itself is well-written.

---

## Example

**Input:** "I need a letter to our landlord's property management company about a broken HVAC system in our office. We've been waiting 6 weeks for repairs, it's mid-summer, and our lease requires them to maintain the building systems. We've called three times with no resolution. We want it fixed within 2 weeks or we're going to withhold rent. Contact is Karen Alvarez, Property Manager at Meridian Commercial Properties."

---

**Output:**

---

```
David Reyes
Chief Operating Officer
Clearpath Analytics, LLC
800 Commerce Center Drive, Suite 410
Phoenix, AZ 85004
dreyes@clearpathanalytics.com
(602) 555-0188

July 14, 2026

Karen Alvarez
Property Manager
Meridian Commercial Properties
2200 North Central Avenue, Suite 100
Phoenix, AZ 85004

Re: Unresolved HVAC System Failure -- Suite 410, 800 Commerce Center Drive
    Formal Notice of Repair Demand Pursuant to Lease Agreement

Dear Ms. Alvarez,

This letter serves as formal written notice that the HVAC system serving Suite 410 at
800 Commerce Center Drive has been non-functional since approximately June 2, 2026 --
a period of six weeks as of this writing -- and demands that repairs be completed in
full no later than July 28, 2026.

Clearpath Analytics, LLC occupies Suite 410 under a commercial lease agreement
(Lease Agreement dated March 1, 2024, hereinafter "the Lease"). Section 8.2 of the
Lease requires Meridian Commercial Properties to maintain all building mechanical
systems, including HVAC, in good working order and to complete non-emergency repairs
within a commercially reasonable time, not to exceed thirty (30) days. The current
HVAC failure has persisted for twice that period with no resolution. Our staff have
reported the malfunction by phone to Meridian's maintenance line on June 5, June 18,
and July 7, 2026. In each instance, we were advised that the repair had been scheduled,
but no technician has appeared and the system remains inoperative.

Interior temperatures in Suite 410 have consistently exceeded 88°F during business
hours throughout this period, as measured by two calibrated thermometers maintained
on the premises. These conditions have forced us to send staff home early on 11
separate days, resulting in documented productivity losses. We have also incurred
two hundred forty dollars ($240) in out-of-pocket costs for portable cooling units
purchased to maintain minimally safe working conditions during the period of
Meridian's non-performance.

If full HVAC repairs are not completed and the system is not restored to normal
operating function by July 28, 2026, Clearpath Analytics, LLC will exercise its
rights under Arizona Revised Statutes § 33-361 and the Lease's repair-and-deduct
provisions, which permit a tenant to arrange for repairs independently and deduct
the verified cost from rent, and will also withhold the August 2026 rent payment
in an amount not to exceed the repair cost and documented losses until the matter
is resolved. We strongly prefer to resolve this without escalation and remain
available to coordinate access for repair technicians at any time, including
outside standard business hours.

Please confirm in writing that repairs will be completed by July 28, 2026, and provide
the name and scheduled date of the repair contractor. You may reach me directly at
(602) 555-0188 or dreyes@clearpathanalytics.com. If we do not receive written
confirmation by July 21, 2026, we will proceed accordingly.

Respectfully,


David Reyes
Chief Operating Officer
Clearpath Analytics, LLC

Enclosures: Lease Agreement Section 8.2 (excerpt), maintenance call log (dates June 5,
            June 18, July 7, 2026), temperature log (June 2 -- July 14, 2026),
            portable cooling unit receipts ($240)
cc: Michael Torres, CEO, Clearpath Analytics, LLC
    Sandra Kim, Corporate Counsel, Clearpath Analytics, LLC
```

---

**Note to user:** This letter references Arizona's repair-and-deduct statute (A.R.S. § 33-361) and your lease's repair provisions. Before sending, confirm with your attorney that:
1. Your lease does include a repair-and-deduct provision -- the letter assumes it does based on your description.
2. Your lease does not require formal written notice to be delivered by certified mail -- if it does, send this via certified mail with return receipt and retain the receipt.
3. The specific dollar thresholds and procedures for invoking repair-and-deduct in Arizona apply to your commercial lease context.

I have assumed your name is David Reyes and your title is COO -- please replace these with your actual information. The HVAC failure start date and call dates are based on your description -- verify them against your records before sending.
