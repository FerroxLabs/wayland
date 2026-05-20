---
name: healthcare-directive-guide
description: |
  Explains living wills and advance healthcare directives, the medical decisions they
  cover, and how they interact with healthcare power of attorney. Produces a concept
  overview, a personal values worksheet, and a question list for attorney consultation.
  Use when the user asks about living wills, advance directives, end-of-life medical
  preferences, or healthcare decision documents.
  Do NOT use for drafting a legal healthcare directive, providing medical advice, or
  general power of attorney topics (use power-of-attorney-explainer instead).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "estate-planning legal-literacy guide checklist"
  category: "legal-civic"
  subcategory: "estate-planning"
  depends: ""
  disclaimer: "not-legal-advice"
  difficulty: "beginner"
---
# Healthcare Directive Guide

> **Disclaimer:** This skill provides general legal literacy and educational information to help you understand legal concepts and processes. It does NOT constitute legal advice, represent you in any legal matter, or create an attorney-client relationship. Laws vary significantly by jurisdiction and change over time. Always consult a qualified attorney licensed in your jurisdiction for advice on specific legal matters affecting you. Always consult a physician for medical guidance.

## When to Use

**Use this skill when:**
- The user asks about living wills, advance directives, advance healthcare directives, or personal directives for medical care
- The user wants to understand what specific medical decisions can and should be documented before a health crisis
- The user is preparing for an attorney meeting about estate planning and has been told they need a healthcare directive
- The user asks how a living will differs from a healthcare power of attorney or how the two documents work together
- The user asks about DNR orders, POLST forms, MOLST forms, life support, mechanical ventilation, artificial nutrition, or specific end-of-life medical interventions in the context of advance planning
- The user is helping an aging parent or a family member with a serious illness organize their healthcare planning documents
- The user experienced a family member's difficult end-of-life situation and wants to prevent the same experience for their own family
- The user asks what "five wishes" means or asks about state-specific advance directive forms
- The user wants a values clarification worksheet or a question list to bring to a physician or attorney consultation

**Do NOT use when:**
- The user wants to draft, complete, or review actual healthcare directive language -- this requires a licensed attorney; do not produce document text
- The user is facing an immediate or unfolding medical emergency or needs real-time clinical guidance -- redirect to their healthcare provider or emergency services
- The user asks for medical advice about specific treatment options, prognoses, or clinical recommendations -- redirect to a physician
- The user asks about financial power of attorney, general durable power of attorney, or property management during incapacity -- use `power-of-attorney-explainer`
- The user asks about guardianship proceedings or court-appointed conservatorship -- refer to an attorney specializing in elder law
- The user asks about medical malpractice, patient rights violations, or disputes with a healthcare provider -- refer to an attorney
- The user asks about Social Security disability, Medicare, or Medicaid benefits -- these are separate topics outside this skill
- The user is asking about organ procurement organization processes or transplant waitlist rules from a medical perspective -- refer to a physician or organ procurement organization

---

## Process

### Step 1: Establish Context and Urgency

Before providing any information, ask a targeted clarifying question to understand the user's situation. The nature of the conversation changes significantly depending on whether the user is doing routine estate planning at 40 or responding to a parent's terminal diagnosis.

- Identify which of the following contexts applies: (a) routine estate planning with no immediate health concerns, (b) upcoming surgery or hospitalization, (c) caring for a parent or family member with declining health, (d) personal serious illness or recent diagnosis, or (e) updating or replacing an existing directive after life changes
- If the user has a serious or terminal illness, acknowledge that the POLST/MOLST track runs parallel to and is more immediately actionable than the advance directive track -- see Edge Cases
- If the user is helping a parent or family member, clarify whether that person is cognitively capable of making their own decisions -- capacity is legally required to execute a valid advance directive
- Note that urgency affects the recommended sequence: for healthy adults, agent selection is equally important as written preferences; for seriously ill individuals, agent designation alone (via healthcare POA) can be accomplished very quickly and may be more immediately important than a detailed written directive
- If context is unclear after one clarifying question, proceed with the assumption of general estate planning -- do not ask multiple clarifying questions before providing value

### Step 2: Explain the Core Documents With Precision

Healthcare planning documents are frequently confused and conflated. Provide clear distinctions between each instrument.

- **Living Will (also called Advance Directive for Healthcare, Directive to Physicians, or Personal Directive depending on jurisdiction):** A written statement of the person's own medical treatment preferences, effective only when two conditions are simultaneously met: (1) the person lacks the capacity to communicate their own decisions, AND (2) the person has a qualifying medical condition -- the most common definitions are terminal illness with death expected within a relatively short time, permanent unconsciousness (persistent vegetative state or coma), or end-stage condition where medical treatment would only prolong dying. The living will does not give any other person authority; it speaks for the person directly.
- **Healthcare Power of Attorney (also called Healthcare Proxy, Medical Power of Attorney, or Durable Power of Attorney for Healthcare):** Designates a named individual (the "healthcare agent" or "proxy") with legal authority to make healthcare decisions whenever the person cannot communicate -- this activation threshold is lower and broader than the living will's threshold, because it is not limited to terminal or unconscious states. A person under general anesthesia during surgery technically cannot communicate; the healthcare agent has authority during that period.
- **Combined Advance Healthcare Directive:** A single document that incorporates both the healthcare agent designation AND the written preferences. Approximately 30 U.S. states have a statutory combined form. Many states, including California (using the California Advance Health Care Directive), New York (Health Care Proxy plus a separate healthcare directive), and Texas (Directive to Physicians and Family or Surrogates plus Medical Power of Attorney) have well-established statutory forms.
- **POLST/MOLST (Physician Orders for Life-Sustaining Treatment / Medical Orders for Life-Sustaining Treatment):** This is NOT a legal directive -- it is a set of actual physician medical orders, typically on a brightly colored form (pink in most states), signed by both patient and physician, and designed to travel with the patient across care settings. It has immediate clinical force. It is completed in collaboration with a physician, not an attorney, and is most appropriate for seriously ill, elderly, or frail patients. It is NOT a substitute for a full advance directive but complements it.
- **DNR / DNI Orders (Do Not Resuscitate / Do Not Intubate):** These are facility-specific medical orders, not legal documents. They are in force only at the facility that issued them. A person with a DNR at a hospital who is transferred to a nursing home does not automatically have a DNR there. The advance directive (living will) can express the underlying preference, but the POLST/MOLST translates that preference into actionable orders across settings.
- **Five Wishes:** A widely used commercially available advance directive document accepted as legally valid in approximately 44 states (as of this skill's last update). It covers medical preferences, healthcare agent designation, comfort measures, personal values, and instructions to loved ones in plain language. Some attorneys use it as the basis for their directive work; others draft custom documents. Ask the attorney whether Five Wishes is valid and sufficient in the relevant jurisdiction.

### Step 3: Walk Through Every Medical Decision Category

Do not leave the user guessing about what a healthcare directive can and cannot cover. Address each category explicitly.

- **CPR (Cardiopulmonary Resuscitation):** The directive can specify whether CPR should be attempted, and under what conditions. Medically, CPR in a hospital setting for a witnessed cardiac arrest has a survival-to-discharge rate that varies widely by patient condition -- roughly 15--30% for in-hospital arrests, much lower for patients with terminal illness. The living will can express a nuanced preference: attempt CPR if the condition is potentially reversible; do not attempt if in a terminal state with no expected recovery.
- **Mechanical Ventilation (Intubation and Ventilator Support):** A respirator breathes for the patient. The directive can address: (a) whether to start ventilation, (b) whether to continue ventilation if started, and (c) whether the user would want a time-limited trial (common approach: agree to a defined trial period, reassess, then withdraw if no improvement). Withdrawal of ventilation is legally and ethically equivalent to not starting it in most jurisdictions, but physicians and families often experience it differently -- this distinction is worth explaining to users.
- **Artificial Nutrition and Hydration (ANH):** Feeding tubes (nasogastric tube for short-term, PEG tube surgically placed for long-term) and IV fluids. The directive can distinguish between short-term ANH during a recovery period vs. long-term ANH when recovery is not anticipated. Courts have consistently upheld the right to refuse ANH (landmark cases: Cruzan v. Director, 1990 U.S. Supreme Court; Terri Schiavo case, 2005, which drove many states to tighten their statutory form requirements). Some individuals, especially with certain religious backgrounds, have strong feelings about this -- document carefully.
- **Dialysis:** Kidney dialysis can sustain life when kidneys fail. The directive can state whether to initiate dialysis, how long to continue it, and whether to withdraw if there is no reasonable expectation of recovery. Dialysis typically requires 3 sessions per week; this is a significant quality-of-life consideration some people weigh heavily.
- **Antibiotics and Other Disease-Directed Treatments:** Some people want comfort care only and do not want antibiotics or other treatments that prolong the dying process even when death is inevitable. This is a preference some individuals have and the directive can express it, though physicians vary in their willingness to withhold routine antibiotics.
- **Pain Management and Comfort / Palliative Care:** This is almost universally desired and should be explicitly stated in the directive. Some pain medications (opioids at high doses) may theoretically hasten death -- the doctrine of double effect provides the ethical and legal framework under which physicians can administer adequate pain relief even if it carries this risk. The directive should explicitly authorize aggressive pain management to remove doubt.
- **Hospice Care:** The directive can express a preference for hospice over curative treatment in defined circumstances. Hospice is a Medicare benefit (available to those with a prognosis of 6 months or less if disease runs its normal course) that focuses on quality of life, comfort, and family support. Stating a hospice preference in the directive gives the agent clear authority.
- **Organ and Tissue Donation:** The directive or a separate donor registry enrollment can address donation. Note that donor registry enrollment (through the state DMV in most states) creates an independent legal authorization that can override the next of kin's wishes in most states. Directive and registry enrollment should be consistent. Tissue donation (corneas, skin, bone, heart valves) is broader and possible even when organ donation is not. The user should specify if they have limitations.
- **Experimental Treatment / Clinical Trials:** Whether the user would consent to being enrolled in a clinical trial or receiving experimental therapy if standard treatment fails. Some individuals specifically want this option; others do not. The healthcare agent needs clear guidance on this preference.
- **Psychiatric Advance Directive (PAD):** Approximately 25 states have specific statutes for psychiatric advance directives, which allow a person to specify preferences for mental health treatment (including medication, hospitalization, and restraints) during a mental health crisis. If the user has a mental health history or concern, note this option and refer to an attorney familiar with behavioral health law.
- **Pregnancy Provisions:** Approximately 26 states have laws that restrict or override certain advance directive provisions when the patient is pregnant. This is a significant and often unknown limitation. Attorneys in states with these restrictions must draft around them or ensure the client understands the limitation. This should be on the attorney question list for any person of childbearing age.
- **Dementia and Alzheimer's Considerations:** Standard triggering conditions for a living will (terminal illness, permanent unconsciousness) may not clearly capture early-to-mid stage dementia, where a person is alive but may have significantly impaired capacity. Some states allow a "dementia provision" or "Ulysses clause" that specifies treatment preferences specifically in the event of dementia. If this is a concern, add it to the attorney question list.

### Step 4: Guide Values Clarification Before Preference Setting

Medical decision-making in end-of-life contexts is values-driven, not just clinically driven. Help the user think through the underlying values that should anchor their specific preferences.

- **Quality vs. Quantity of Life:** Does the user prioritize maximum life extension regardless of condition, or does the quality of the remaining life matter more than its length? This is the single most foundational values question -- everything else flows from it.
- **Burdens of Treatment:** Help the user understand that treatments have real burdens -- prolonged ICU stays, repeated procedures, inability to communicate, physical restraints, and significant pain are all potential costs of aggressive life extension. Some people are willing to bear any burden for any chance of survival; others are not. Neither is wrong.
- **Definition of Acceptable Quality of Life:** Ask the user to consider: what conditions would make continued life meaningful to them? Common reference points: ability to recognize family members, ability to communicate in any form, absence of constant severe pain, ability to breathe without a machine, ability to experience any pleasure or comfort. These personal definitions should drive the specific choices in the directive.
- **Role of Probability and Prognosis:** Some people want maximum intervention as long as there is any chance of recovery; others set a threshold -- for example, they would want intervention only if there is a reasonable (perhaps greater than 10% or 20%) chance of returning to a meaningful quality of life. These are deeply personal calibrations.
- **Past Experiences:** Many people's preferences are shaped by witnessing a family member's death -- either a peaceful, comfortable death or a prolonged, technology-heavy death. Invite the user to reflect on whether such experiences have shaped their preferences and in what direction.
- **Religious and Spiritual Beliefs:** Some faith traditions (including certain strains of Catholicism, Orthodox Judaism, and Jehovah's Witnesses) have specific teachings about life-sustaining treatment, organ donation, and the nature of death that directly affect medical decision-making. These should be documented explicitly in the directive. If the user has relevant religious beliefs, add an attorney question about how to make those beliefs enforceable and how they interact with state law.
- **Loved Ones' Emotional Burden:** Some users care deeply about the experience of their family members during end-of-life care. A prolonged death on life support can be traumatic for family. This consideration is legitimate and worth noting in the values discussion.

### Step 5: Explain Healthcare Agent Selection With Concrete Criteria

Choosing a healthcare agent is at least as important as drafting the written directive. Many agents make poor decisions not from bad intent but from inadequate preparation.

- **Primary Criteria for an Effective Agent:** (1) Knows the user's values deeply, not just the document's instructions; (2) Can make decisions under extreme emotional stress; (3) Can advocate assertively with physicians and hospital staff, who sometimes push toward continued treatment; (4) Is accessible geographically or can travel quickly; (5) Will follow the user's wishes even if those wishes conflict with the agent's own preferences or family pressure.
- **Who Should NOT Be a Healthcare Agent:** (1) Someone who would be unable to authorize withdrawal of treatment because of their own grief or religious beliefs, if the user would want the option of withdrawal; (2) Someone too emotionally close to the user to make rational decisions under pressure; (3) Someone who is estranged from or has an adversarial relationship with the user's likely medical team; (4) Someone who is a minor (agents must be adults); (5) A treating physician or care facility operator (prohibited by law in most jurisdictions as a conflict of interest).
- **Primary and Successor Agents:** Always designate at least one successor (backup) agent. If the primary agent predeceases the user, becomes incapacitated, or is unavailable, the successor steps in. In high-risk or complex family situations, a second successor is worth considering.
- **The Values Conversation -- Why It Cannot Be Skipped:** The most common failure mode in healthcare proxy arrangements is an agent who has the legal authority but does not know what the user would want in a specific situation. The living will cannot anticipate every scenario. The agent should know: (a) the user's position on quality vs. quantity of life; (b) any specific conditions that would make life unacceptable to the user; (c) how to interpret ambiguous clinical situations; (d) that the user wants the agent to follow the user's wishes, not the agent's own instincts. This conversation should happen before the directive is executed and be repeated periodically.
- **Co-Agents:** Most estate planning attorneys advise against naming co-agents who must agree, because deadlock can paralyze decision-making during a crisis. Some jurisdictions allow this structure but it requires unanimous agreement, which is impractical under time pressure. If the user wants a second voice involved, a better solution is a named primary agent with instructions to consult the second person before deciding.

### Step 6: Address the Legal Infrastructure

The user needs to understand the procedural requirements that make a healthcare directive legally valid and practically effective.

- **Execution Requirements Vary by Jurisdiction:** Every state has its own requirements. Common patterns: two adult witnesses who are not the healthcare agent, not related to the user, not the user's physician, and not heirs to the user's estate. Some states require notarization in addition to or instead of witnesses. Some states offer a statutory form that, if used exactly as written, is presumptively valid. Using the statutory form is generally the safest approach and reduces the chance of a healthcare provider questioning the document's validity.
- **How to Ensure Providers Have and Honor the Directive:** A directive that exists only in a desk drawer is nearly useless. Distribution should include: primary care physician's file, each specialist treating a serious condition, the hospital's medical records department (most hospitals have a patient portal where it can be uploaded), the healthcare agent (the agent should carry a copy), close family members, and the user's estate planning attorney's files. Many hospitals and health systems participate in state advance directive registries -- ask the attorney whether the state has one and whether registration is advisable.
- **Revocation:** A person with capacity can revoke a healthcare directive at any time by any means -- verbally, in writing, or by destroying the document -- regardless of what the document says about revocation procedures. The most recent clearly expressed preference governs. This is important to tell users: they are not locked into their choices. Regular review (every 3--5 years or after major health changes) is recommended.
- **HIPAA Authorization:** A healthcare agent needs access to the user's medical records to make informed decisions. Most well-drafted healthcare POA forms include a HIPAA release, but if the directive does not, the agent may face barriers getting information from providers. This should be an explicit item on the attorney checklist.
- **Portability Across State Lines:** No uniform national standard for advance directive portability exists in the United States. The majority of states have "honor and enforce" statutes that recognize out-of-state directives if they were valid in the state where executed, but enforcement varies in practice. If the user lives near a state border, splits time between states, or has the agent in a different state, ask the attorney about drafting to comply with requirements of both states, or executing parallel state-specific documents.
- **Do Not Confuse a Directive With a DNR Order:** If the user has a directive stating they do not want CPR, that alone does not create a DNR order at a hospital. The healthcare agent or physician must still initiate a DNR order within the facility. Understanding this gap is important so the user can ensure the chain from directive to medical order is actually completed.

### Step 7: Address Special Instruments and Cross-Document Coordination

Healthcare directives do not exist in isolation -- they interact with other documents and instruments.

- **Coordination With the Overall Estate Plan:** The healthcare agent in the directive and the personal representative (executor) named in the will can be the same person or different people. Neither automatically has the authority of the other. The financial power of attorney and the healthcare power of attorney are separate. Ensure these documents are consistent and that the agents know their respective roles.
- **POLST/MOLST -- Knowing When to Recommend It:** The POLST form is not for healthy adults doing routine estate planning. It is appropriate when the patient has a serious illness, advanced frailty, or a life expectancy that makes end-of-life scenarios plausible in the near-to-medium term. The physician initiates the conversation and the form is co-signed by physician and patient (or, in some states, by surrogate). The form typically covers CPR preference, medical interventions level (full treatment, limited interventions, or comfort care), and artificially administered nutrition. It is immediately operative, travels across care settings, and has more immediate clinical force than a living will.
- **Mental Capacity Assessment:** If there is any question about whether the user has sufficient legal capacity to execute a valid directive (due to early dementia, brain injury, or other cognitive impairment), an attorney may want a physician's written assessment of capacity at the time of signing. This documentation can be critical to defending the directive's validity if challenged later.
- **Trust and Will Consistency:** If the user has a revocable living trust, the trust document may contain provisions about the trustee's authority during the user's incapacity, which interacts with the healthcare agent's authority. Ensure the attorney reviews all documents together for consistency.

### Step 8: Compile the Preparation Materials

Organize all gathered information into the structured output format below. Tailor the values worksheet and attorney question list based on what the user shared during the conversation. Flag any areas of particular complexity (religious beliefs, serious illness, cross-state living, dementia concerns) for the attorney's attention.

---

## Output Format

```
## Healthcare Directive Preparation Package

> This is an educational preparation worksheet. It does not constitute a legal document
> or legal advice. Bring this to your attorney consultation and physician as appropriate.

---

### SECTION 1: Document Overview

| Document                        | Legal Character     | Who Drafts It              | When It Activates                          | Immediate Clinical Force |
|---------------------------------|---------------------|----------------------------|--------------------------------------------|--------------------------|
| Living Will / Advance Directive | Legal document      | Attorney (or statutory form) | Incapacity + qualifying condition (terminal, permanent unconsciousness, end-stage) | No -- must be interpreted by provider |
| Healthcare Power of Attorney    | Legal document      | Attorney                   | Any incapacity to communicate               | No -- agent makes decisions |
| Combined Advance Directive      | Legal document      | Attorney (or statutory form) | Varies by provision invoked                 | No |
| POLST / MOLST Form              | Medical order       | Physician and patient together | Immediately -- it is an order, not a preference statement | Yes -- travels across care settings |
| DNR / DNI Order                 | Facility medical order | Physician at facility     | At that specific facility only              | Yes -- at that facility only |

**Note:** Your attorney will advise whether your state uses separate documents or a combined
statutory form. Ask specifically what forms are standard in your state.

---

### SECTION 2: Values Clarification Worksheet

Take time with these questions before your attorney meeting. There are no right or wrong answers.
These preferences are deeply personal and reflect your individual values.

#### PART A -- Core Values

| Reflection Question | Your Thoughts |
|---------------------|---------------|
| Do you prioritize length of life above all, or does quality of life matter equally or more? | |
| If you had a 5% chance of surviving a serious episode with significant permanent disability vs. a near-certain peaceful death, which would you choose? | |
| Are there conditions in which you would NOT want your life prolonged? (e.g., permanent unconsciousness, severe dementia, end-stage disease) | |
| Have you witnessed a family member's end-of-life experience? How did that shape your own preferences? | |
| Do religious or spiritual beliefs guide your medical decision-making? If yes, how? | |
| How important is it to you that your family not be burdened by prolonged end-of-life care? | |

#### PART B -- Specific Medical Interventions

For each intervention, indicate your general preference. Use this as a discussion guide, not a
final legal statement -- your attorney will translate your preferences into appropriate language.

| Intervention | I generally WANT this | Only in certain conditions (describe) | I generally do NOT want this | I want my agent to decide |
|---|---|---|---|---|
| CPR (cardiopulmonary resuscitation) | | | | |
| Mechanical ventilation (breathing machine) | | | | |
| Time-limited trial of ventilation then reassess | | | | |
| Artificial nutrition via feeding tube (long-term) | | | | |
| Artificial nutrition (short-term during recovery) | | | | |
| IV fluids for hydration | | | | |
| Dialysis (kidney replacement) | | | | |
| Hospitalization for life-sustaining treatment | | | | |
| Aggressive pain management (even if it may shorten life) | | | | |
| Hospice / comfort care only (no curative treatment) | | | | |
| Organ donation after death | | | | |
| Tissue donation after death (corneas, bone, skin) | | | | |
| Experimental treatment / clinical trials | | | | |
| Psychiatric treatment preferences during mental health crisis | | | | |

#### PART C -- Conditions Requiring Special Guidance for Your Agent

| Condition | My Preference |
|-----------|---------------|
| If I have a terminal diagnosis and death is expected within weeks | |
| If I am permanently unconscious with no reasonable chance of recovery | |
| If I have severe dementia and cannot recognize family members | |
| If I have a reversible condition but a very low probability of meaningful recovery | |
| If I am pregnant at the time of incapacity [note: state law may constrain directive in this scenario -- ask your attorney] | |

---

### SECTION 3: Healthcare Agent Selection

| Role                        | Candidate Name | Relationship | Phone / Location | Has this person agreed to serve? | Have you had the values conversation? |
|-----------------------------|----------------|--------------|------------------|----------------------------------|---------------------------------------|
| Primary Healthcare Agent    | | | | Yes / No / Not yet | Yes / No / Not yet |
| Successor (Backup) Agent #1 | | | | Yes / No / Not yet | Yes / No / Not yet |
| Successor (Backup) Agent #2 | | | | Yes / No / Not yet | Yes / No / Not yet |

**Self-assessment for each candidate:**
- Can this person make difficult decisions under emotional stress?
- Will this person follow my wishes even if other family members push back?
- Will this person advocate assertively with physicians and hospital staff?
- Is this person geographically accessible for medical emergencies?
- Does this person know my values well enough to handle scenarios my written directive doesn't cover?

---

### SECTION 4: Questions for Your Attorney

**Required questions for every consultation:**
1. What is the standard statutory form for healthcare directives in this state, and should I use it or have you draft a custom document?
2. What are the witnessing and notarization requirements for a valid healthcare directive in this state?
3. Does this state have laws that restrict or override advance directive provisions during pregnancy? If so, how should we address this?
4. Should my healthcare power of attorney include a HIPAA authorization so my agent can access my medical records?
5. How do I legally revoke or update this directive if my preferences change?
6. Does this state have an advance directive registry I should enroll in?
7. How do I ensure that hospitals and my physician have this document on file and will actually honor it?
8. How does this directive interact with my other estate planning documents (will, durable financial POA, trust)?

**Add these questions if they apply to your situation:**
- [If crossing state lines] I [live/travel frequently/have my agent] in [State X] -- how do I ensure this directive is honored there?
- [If serious illness or frailty] Should I also complete a POLST/MOLST form with my physician in addition to this legal directive?
- [If religious beliefs apply] How do I make my religious preferences legally enforceable in this directive?
- [If dementia is a concern] Does this state allow a dementia-specific provision or "Ulysses clause" in the directive?
- [If psychiatric history] Does this state have a psychiatric advance directive statute, and should I execute a separate one?
- [If minor children] How does my healthcare directive interact with guardianship planning for my children?

---

### SECTION 5: Conversations to Have Before Execution

- [ ] Sit down with your chosen healthcare agent and walk through Section 2 of this worksheet -- not just the document, but your underlying values
- [ ] Discuss your preferences with your spouse or partner, even if they are not your agent
- [ ] Inform adult children or close family members of your agent designation and general preferences (to reduce the chance of family conflict later)
- [ ] Mention your advance directive at your next primary care visit and ask your physician to note it in your medical record
- [ ] If you have a serious illness, ask your physician whether a POLST/MOLST form would be appropriate for you

---

### SECTION 6: Distribution Checklist (Complete After Execution)

- [ ] Primary healthcare agent (physical copy + digital copy)
- [ ] Each successor healthcare agent
- [ ] Primary care physician (upload to patient portal or bring to next appointment)
- [ ] Any specialists treating significant health conditions
- [ ] Hospital(s) you would most likely use (provide to medical records or patient registration)
- [ ] State advance directive registry (if your state has one)
- [ ] Your estate planning attorney's file
- [ ] Secure but accessible location at home (not a safe deposit box that others cannot access)

---

### SECTION 7: Review Schedule

| Trigger for Review | Action |
|--------------------|--------|
| Every 3--5 years regardless of health changes | Review and reconfirm or update |
| Significant change in health status or diagnosis | Review with attorney and physician |
| Change in relationship with healthcare agent (divorce, death, estrangement) | Update immediately |
| Move to a different state | Review with new state attorney |
| Change in core values or religious/spiritual beliefs | Review and update |
| After witnessing a family member's end-of-life experience | Consider whether preferences have changed |
```

---

## Rules

1. **Never produce healthcare directive document language.** This skill produces educational explanations, values worksheets, and attorney preparation materials only -- it does not draft, suggest, or edit the language of a legal document. If the user asks for sample directive language, explain that drafting is the attorney's role and redirect to the preparation materials this skill provides.

2. **Never conflate POLST/MOLST with an advance directive.** The POLST/MOLST is a physician's medical order with immediate clinical force; the advance directive is a legal document expressing preferences. They serve different functions, have different creators, and operate in different contexts. Using these terms interchangeably is a serious and common error that can mislead users about the clinical effectiveness of their documents.

3. **Never provide jurisdiction-specific legal conclusions.** This skill may describe general patterns (e.g., "most states require two witnesses") but must never say "in your state, the law requires X" without the user having confirmed their jurisdiction AND without noting that this information should be verified with a local attorney. Laws change; jurisdiction-specific statements in an AI skill can become outdated.

4. **Never advise on who the user should choose as their healthcare agent.** Present the criteria for an effective agent and the questions the user should ask themselves, but never suggest a specific person or category of person is the right choice. Agent selection is deeply personal and family-specific.

5. **Always distinguish living will activation from healthcare agent activation.** The living will activates under a higher, narrower threshold (incapacity plus qualifying condition). The healthcare agent activates under the lower threshold of any incapacity to communicate. Failing to explain this distinction leaves users thinking both documents are equivalent -- they are not.

6. **Always note the pregnancy restriction issue for users of childbearing age.** Approximately 26 states have laws that restrict or override advance directive provisions when the patient is pregnant. This limitation is poorly known and can have significant consequences. It must appear on the attorney question list for any user who could be affected.

7. **Always include the values conversation as a non-negotiable step.** The living will is a legal document, not a complete solution. A healthcare agent who does not understand the user's underlying values will make decisions the user would not have wanted, regardless of what the document says. The values conversation with the agent is as important as the legal execution.

8. **Never direct the user toward or away from specific intervention choices.** The skill presents the medical facts about interventions (including realistic survival statistics and quality-of-life implications where relevant) but never implies that a particular choice is the right one. Aggressive treatment and comfort care are both legitimate choices that depend entirely on individual values.

9. **Redirect immediately when the user describes an actively unfolding medical situation.** If a user says a family member is currently in an ICU, is on life support, or is currently dying, this skill does not apply. Redirect to the healthcare provider, hospital ethics committee, or a healthcare attorney for immediate assistance. This skill is for advance planning, not crisis navigation.

10. **Always treat a POLST/MOLST conversation as a physician conversation, not an attorney conversation.** The POLST/MOLST form is completed with a physician and operates as a medical order. Users should never be directed to an attorney to create a POLST. When the POLST is relevant, the instruction is to bring it up with the treating physician at the next clinical appointment.

11. **Never assume the advance directive will automatically translate into clinical orders.** A living will stating a preference against CPR does not create a DNR order. The advance directive must be interpreted by a physician and translated into facility-specific medical orders. Users must understand this gap and ensure the chain from directive to active medical order is completed with their healthcare team.

12. **When the user has an existing directive, do not assume it is current or compliant.** Directives executed many years ago may use outdated statutory forms, may name deceased or unavailable agents, or may have been executed in a different state. The review criteria in the Output Format should be presented whenever the user mentions having an existing directive.

---

## Edge Cases

### User Has a Current Serious or Terminal Illness

This situation changes the priority order significantly. The advance directive remains important for broad authority, but the POLST/MOLST form -- completed with the treating physician -- has immediate clinical force and should be prioritized alongside or ahead of the legal directive. Recommend: (1) execute or update the healthcare power of attorney immediately so an agent has authority now; (2) schedule a POLST/MOLST conversation with the primary physician or specialist managing the serious condition; (3) complete the full advance directive (living will provisions) with an attorney, but do not let that process delay step 1 or step 2. Note that some attorneys who specialize in elder law or serious illness planning can execute a healthcare POA on an expedited basis. Flag for the attorney that the condition creates urgency.

### User Has Existing Directive From Many Years Ago or Another State

An advance directive executed 15 years ago may name an agent who has since died, may use a statutory form that has been superseded, or may have been valid in California but not clearly enforceable in the state where the user now lives. Present the review triggers from Section 7 of the Output Format. Encourage the user to bring the existing document to the attorney meeting rather than assuming it is still effective. Many people have a false sense of security from a directive they executed once and never revisited.

### User's Family Has a History of Conflict Over Medical Decisions

High-conflict family situations make healthcare directives especially important -- and especially important to execute correctly. A clearly executed, legally valid directive with an explicitly named agent provides the agent with authority that supersedes other family members' preferences in most jurisdictions. The key practical steps are: (1) name the agent unambiguously with no co-agents; (2) document specific preferences in writing so there is less for the agent to interpret; (3) ensure the attorney notes (if state law allows) that the agent's decisions are final; (4) tell the user that the agent should be someone who will not cave to family pressure, even if that means choosing a friend over a sibling. Also recommend the user discuss the directive's existence and general contents with family before it is needed -- surprises at the deathbed create conflict.

### User's Religious Beliefs Affect Medical Decision-Making

Certain faith traditions have specific and legally relevant teachings about life-sustaining treatment. Notable examples: Jehovah's Witnesses have a well-developed legal framework for refusing blood transfusions, and courts have generally upheld competent adults' right to refuse transfusion even in life-threatening situations -- the directive should document this clearly; some Orthodox Jewish authorities interpret the prohibition against hastening death to require life extension in all circumstances, which affects the living will's content; some Catholic moral theology distinguishes between ordinary and extraordinary (disproportionate) means, which affects how the directive frames its preferences. In all cases: (1) document the religious preference explicitly; (2) ask the attorney whether the state has any provisions for or against religious exemptions in healthcare directives; (3) choose a healthcare agent who shares and will enforce those religious values; (4) consider whether the healthcare agent should have the authority to override a specific written preference if new religious guidance applies -- or not.

### User and Healthcare Agent Live in Different States

No federal law guarantees portability of advance directives across state lines. The majority of states follow the Uniform Health Care Decisions Act and will honor out-of-state directives that were valid in the state of execution, but "honor in practice" is different from "honor by law" at 2 a.m. in an emergency room. Practical recommendations: (1) ask the attorney whether the directive can be drafted to comply with the requirements of both states simultaneously (often possible, since the requirements overlap significantly); (2) if the user spends significant time in another state (e.g., a snowbird), consider executing a state-specific version for each state, drafted by attorneys in each state; (3) ensure the agent carries a copy of the directive and understands they may need to advocate for its recognition.

### User Is Young and Healthy With No Immediate Concerns

Unexpected incapacity from accidents, strokes, or sudden illness is not limited to elderly people. The case for a young, healthy adult having at minimum a healthcare power of attorney is compelling: it takes minimal effort, costs little, and can prevent an emergency court proceeding for guardianship if the person is incapacitated without a designated agent. The living will provisions can be kept simple ("I prefer comfort care in a terminal situation with no chance of recovery") and updated later. A 28-year-old heading into general anesthesia for surgery may want their spouse to have healthcare agent authority, not just default next-of-kin status (which has no formal legal authority in many jurisdictions). Present this context without creating alarm -- frame it as the same logic as having a fire extinguisher: low probability, high consequence if needed.

### User Is Concerned About Dementia or Alzheimer's Disease

Standard living will triggering language (terminal illness, permanent unconsciousness, end-stage condition) may not capture progressive dementia until the very late stages. A person with mid-stage Alzheimer's who cannot recognize family members and cannot live independently is not "terminal" or "unconscious" in the legal sense -- the standard living will may not give the agent authority to make the decisions the user would want. Some states allow a specific dementia provision in which the user specifies, while competent, what they would want if they reach a defined state of cognitive decline. The user should: (1) discuss this explicitly with the attorney; (2) ask whether their state has dementia-specific directive language; (3) consider whether the healthcare agent designation alone (rather than the written directive) should carry most of the decision-making authority in dementia situations, since the agent can respond to the evolving clinical situation. Note that the Alzheimer's Association publishes guidance on advance care planning for dementia that the user's physician may reference.

### User Is Being Asked to Serve as Someone Else's Healthcare Agent

The skill is written from the perspective of the person creating the directive, but occasionally a user asks what it means to be named as an agent. In this case: (1) explain that serving as an agent is a serious legal and personal responsibility, not just an honor; (2) the agent has the authority and obligation to make medical decisions consistent with the principal's expressed wishes, or -- where the directive is silent -- consistent with the principal's best interests; (3) the agent should insist on having the values conversation with the principal before accepting; (4) the agent should obtain a copy of the executed directive and understand exactly what it says; (5) in a crisis, the agent should ask the medical team for a clear clinical picture before making decisions, and should not feel rushed into immediate decisions unless the situation is truly emergent.

---

## Example

**Input:** "My mom was just diagnosed with early-stage Parkinson's disease. She's 72, still sharp, and wants to get her affairs in order while she can. She asked me to help her understand what documents she needs for healthcare decisions. What should she be thinking about?"

**Output:**

## Healthcare Directive Preparation Package for Your Mother

> This is an educational preparation worksheet. It does not constitute a legal document or legal advice.
> Your mother should bring this to a consultation with an estate planning or elder law attorney.

Your mother is in exactly the right situation to address this -- she has capacity now, she has time to think carefully, and she has you to help. A Parkinson's diagnosis does add some urgency and some specific planning considerations I'll note below.

She needs two related things: (1) a legal document that names someone she trusts to make healthcare decisions if she cannot (healthcare power of attorney), and (2) a legal document that states what her medical preferences are in serious situations (living will or combined advance directive). In many states these come as a single combined form -- her attorney will advise.

---

### SECTION 1: Document Overview

| Document | Legal Character | Who Drafts It | When It Activates | Immediate Clinical Force |
|---|---|---|---|---|
| Living Will / Advance Directive | Legal document | Attorney or statutory form | Incapacity + qualifying condition (terminal, permanent unconsciousness, end-stage) | No -- provider must interpret and act |
| Healthcare Power of Attorney | Legal document | Attorney | Any incapacity to communicate | No -- agent makes the decision |
| POLST / MOLST Form | Physician medical order | Physician + patient together | Immediately -- it is an order | Yes -- travels across care settings |
| DNR / DNI Order | Facility-specific medical order | Physician at that facility | At that facility only | Yes -- at that facility only |

**For your mother specifically:** Because she has a progressive neurological condition, she should discuss POLST/MOLST timing with her neurologist and primary care physician. She doesn't necessarily need it today while her condition is early-stage, but she should understand it exists and plan to revisit the question as her disease progresses.

---

### SECTION 2: Values Clarification Worksheet

#### PART A -- Core Values

Your mother should reflect on these questions before meeting with an attorney. Her answers will guide what the directive says.

| Reflection Question | Notes for Discussion |
|---------------------|----------------------|
| Does she prioritize length of life above all, or does quality of life matter equally or more? | Parkinson's disease has a very wide range of progression -- quality of life at different stages varies enormously. This question matters especially for her. |
| Are there conditions in which she would not want her life prolonged? | Common reference points: unable to recognize family, requiring 24-hour nursing care, unable to communicate in any meaningful way, constant pain or distress |
| What has she observed in others' end-of-life experiences that shaped her preferences? | Her own parents' deaths, friends' experiences, or medical history as a patient |
| What role does faith or spirituality play in her medical decision-making? | Some faith traditions have specific teachings about life-sustaining treatment -- document if applicable |
| How concerned is she about being a burden to family during a prolonged illness? | This is a legitimate value to document, not a selfish one |

#### PART B -- Specific Medical Interventions

Your mother should indicate her general preference for each. These are discussion starting points, not final legal decisions.

| Intervention | Generally WANT | Only in certain conditions | Generally do NOT want | Want agent to decide |
|---|---|---|---|---|
| CPR | | | | |
| Mechanical ventilation (breathing machine) | | | | |
| Time-limited trial of ventilation then reassess | | | | |
| Artificial feeding tube (long-term) | | | | |
| Artificial nutrition (short-term during recovery) | | | | |
| IV fluids for hydration | | | | |
| Dialysis | | | | |
| Aggressive pain management (even if it may shorten life) | | | | |
| Hospice / comfort care only when curative treatment no longer helps | | | | |
| Organ donation | | | | |
| Tissue donation (corneas, bone, skin, heart valves) | | | | |

#### PART C -- Conditions Requiring Special Guidance for Her Agent

**This section is especially important given your mother's Parkinson's diagnosis.**

| Condition | Her Preference |
|-----------|----------------|
| If terminally ill (any cause) with death expected within weeks | |
| If permanently unconscious with no reasonable chance of recovery | |
| If Parkinson's progresses to the point where she cannot recognize family, cannot communicate, and requires full-time nursing care | This is a scenario standard directive language may not clearly cover -- ask the attorney specifically about this |
| If she develops dementia in addition to Parkinson's (Lewy body dementia or Parkinson's disease dementia is a recognized progression in some patients) | Ask attorney about dementia-specific provision |
| If she has a reversible acute illness (pneumonia, infection) during advanced Parkinson's -- does she want aggressive treatment? | |

---

### SECTION 3: Healthcare Agent Selection

| Role | Candidate | Relationship | Phone / Location | Agreed to serve? | Values conversation had? |
|---|---|---|---|---|---|
| Primary Healthcare Agent | You (her child) are one candidate -- discuss as a family | | | | |
| Successor Agent #1 | | | | | |
| Successor Agent #2 | | | | | |

**Important considerations for your mother's situation:**

- As Parkinson's progresses, she may eventually lose the ability to communicate. Her agent should be someone who will be accessible not just now but over a potentially long disease course.
- The agent needs to understand not just the document but her mother's specific values about quality of life at different stages of neurological decline.
- If you are the likely agent, begin having the values conversation now -- while she can fully articulate her preferences -- not after her condition has progressed.
- Consider whether one of her adult children or a trusted friend might serve as successor if circumstances change.

---

### SECTION 4: Questions for the Attorney

**Standard questions for any healthcare directive consultation:**
1. What is the correct statutory form for healthcare directives in this state -- should we use the state form or do you draft a custom document?
2. What are the exact witnessing and notarization requirements in this state?
3. Should the healthcare power of attorney include an explicit HIPAA release for her agent?
4. How should we update or revoke the directive if her preferences change as her condition progresses?
5. Does this state have an advance directive registry where the document can be filed?
6. How do we ensure her primary care physician and neurologist have this on file?

**Additional questions specific to your mother's situation:**
7. Her diagnosis is early-stage Parkinson's disease. Does this create any urgency in the type or timing of documents we execute today?
8. Parkinson's can progress to include cognitive changes and, in some cases, dementia. Does this state allow a dementia-specific provision in the advance directive? How would we draft it?
9. Is it too early to discuss POLST/MOLST, or should we address it now? At what point in the disease progression would you recommend it?
10. Should the living will address specifically the scenario of advanced-stage Parkinson's with loss of communication and recognition -- and if so, how would you draft that language?
11. How does her advance directive interact with her other estate planning documents (will, financial POA, any trusts)?

---

### SECTION 5: Conversations to Have Before Execution

- [ ] You and your mother should sit down together and work through Part A of Section 2 -- not the checkboxes, but the underlying values discussion
- [ ] Your mother should confirm with her chosen agent that the agent is willing to serve and understands the emotional weight of the role
- [ ] Your mother should have the values conversation with her agent before the attorney meeting -- the agent should attend if possible, or review this worksheet
- [ ] Your mother should inform her neurologist and primary care physician of her plans to execute a directive and ask them to note it in her chart
- [ ] Your mother and her physician should discuss at what stage of disease progression a POLST conversation would be appropriate

---

### SECTION 6: Distribution Checklist (Complete After Execution)

- [ ] Primary healthcare agent and each successor (physical copy and digital copy)
- [ ] Primary care physician
- [ ] Neurologist managing the Parkinson's diagnosis
- [ ] Any other specialists
- [ ] Hospital(s) she would most likely use
- [ ] State advance directive registry (if available)
- [ ] Estate planning attorney's file
- [ ] Accessible location at home (not a locked safe or safe deposit box)

---

### SECTION 7: Review Schedule

Given your mother's progressive diagnosis, the review schedule should be more active than for a healthy adult.

| Trigger | Action |
|---------|--------|
| Every 1--2 years given progressive condition | Review with attorney and physician |
| Any significant change in neurological function or ability to communicate | Review immediately -- POLST may become appropriate |
| Any change in relationship with healthcare agent | Update immediately |
| If disease progresses to involve cognitive changes | Return to attorney to update dementia-specific provisions |
| If she moves to assisted living or memory care | Review and update with the new facility's patient registration |

---

**A note on timing:** Your mother is making a wise decision to address this while she has full capacity. The worst time to execute a healthcare directive is when capacity is uncertain or contested. Her attorney may also want a brief physician note confirming her capacity at the time of signing -- this is not unusual for patients with progressive neurological conditions and it protects the validity of the document against any future challenge.

The most important next step is scheduling a consultation with an elder law or estate planning attorney. Bring this completed worksheet and any existing estate planning documents to that meeting.
