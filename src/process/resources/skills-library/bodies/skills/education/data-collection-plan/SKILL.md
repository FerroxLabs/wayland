---
name: data-collection-plan
description: |
  Creates data collection plans with instrument selection, participant criteria, ethical considerations, and timeline for learners designing research studies. Produces a complete data collection protocol.
  Use when a learner asks to plan data collection, design a survey or interview protocol, determine sample size, or address research ethics requirements.
  Do NOT use for choosing a methodology (use `research-methodology`), for analyzing collected data (not an education skill), or for writing the methods section (use writing category skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "research academic-writing study-skills step-by-step"
  category: "education"
  subcategory: "academic-skills"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---
# Data Collection Plan

## When to Use

Use this skill when a learner is actively designing a research study and needs to build a concrete, executable plan for gathering data. Specific trigger scenarios include:

- A graduate student asks how to design a survey, interview guide, or observation protocol for a thesis or dissertation chapter
- A learner needs to justify their sample size to a committee, IRB, or course instructor and does not know how to calculate or argue for a specific N
- A student has a research question and methodology already chosen but does not know how to operationalize variables into instruments
- A learner needs to complete an ethics application (IRB, institutional review, or course-level ethics form) and needs to think through consent, confidentiality, and risk
- A researcher at any level needs a phased timeline to coordinate recruitment, data collection, and processing before a hard deadline (defense, submission, or grant report)
- A learner is designing a pilot study and needs to know what to test and how to use the results to refine the main study
- A student conducting mixed-methods research needs to decide whether to sequence or integrate their quantitative and qualitative strands

**Do NOT use when:**

- The learner has not yet chosen a research methodology -- send them to `research-methodology` first; instrument selection and participant criteria depend entirely on paradigm and design
- The learner needs help analyzing data they have already collected -- this is a data analysis task, not a data collection planning task
- The learner needs to write the Methods section of a paper -- use a writing-category skill for academic prose; this skill produces a working protocol document, not a written narrative
- The learner is asking how to find existing datasets (secondary data) -- this skill addresses primary data collection only
- The learner needs help with systematic literature review data extraction -- that is a distinct protocol governed by PRISMA or similar frameworks
- The learner is an educator designing assessment rubrics for a class -- use a teaching subcategory skill
- The request is purely statistical (e.g., running a regression, computing Cronbach's alpha) -- use a statistics or data analysis skill

---

## Process

### Step 1: Gather Research Context Before Producing Anything

Do not begin drafting instruments or timelines until you have the following information. Ask for it in one grouped message rather than piecemeal:

- The research question (verbatim, as written or proposed)
- The research design already chosen (e.g., survey-based cross-sectional, phenomenological interview, quasi-experimental, case study, ethnographic observation, content analysis)
- The target population (who they want to study -- age, role, setting, experience, or other defining characteristics)
- The key variables or constructs to be measured (e.g., academic self-efficacy, job satisfaction, reading fluency)
- Any institutional requirements (IRB status, course ethics form, departmental protocol deadlines)
- Timeline constraints (defense date, course submission deadline, grant report due date)
- Available resources (budget, access to participants, recording equipment, software licenses)
- Level of prior research methods experience (so you can calibrate how much explanation to embed)

If the learner cannot answer all of these, work through the gaps collaboratively. A vague research question must be tightened before instrument design begins -- you cannot design a valid instrument for an underspecified construct.

### Step 2: Align Instruments to Research Design and Constructs

Match every instrument to the epistemological logic of the research design:

- **Quantitative designs** (survey research, quasi-experimental, correlational): Use structured instruments with closed-ended items. Prioritize validated scales over researcher-developed items -- validated scales have published reliability (Cronbach's alpha ≥ 0.70 is the accepted minimum threshold) and construct validity evidence. Examples: Likert-scale surveys using published instruments such as the General Self-Efficacy Scale (Schwarzer & Jerusalem), the Motivated Strategies for Learning Questionnaire (MSLQ), the Maslach Burnout Inventory, or domain-specific measures. When no validated scale exists, design items using established principles: one idea per item, positively and negatively worded items balanced, response categories exhaustive and mutually exclusive, 5-point or 7-point Likert scales for most attitudinal constructs
- **Qualitative designs** (phenomenology, grounded theory, case study, narrative): Use semi-structured interview guides or focus group protocols, not questionnaires. The instrument is a guide, not a script -- it contains 5-10 open-ended anchor questions with 2-3 probes each. Observation protocols use field note templates with pre-defined foci and open sections for emergent data
- **Mixed-methods designs**: Identify which strand is primary (QUAN → qual, QUAL → quan, or equal weight) and which is sequential (explanatory, exploratory) or concurrent (convergent). Design instruments independently for each strand but plan integration points explicitly

For each construct, complete a variable-to-item mapping table (see Output Format) to ensure every construct is operationalized by at least one instrument item and no item is unmapped to a construct.

### Step 3: Determine Participant Criteria and Justify Sample Size

Write explicit inclusion and exclusion criteria before recruiting anyone. Ambiguous criteria are the leading cause of sample contamination and validity threats.

**Inclusion criteria** must be logically connected to the research question. Each criterion should answer: "Would excluding this characteristic make my findings less generalizable to my target population, or would including participants without this characteristic introduce noise?" Criteria typically address: demographic characteristics (age range, gender if theoretically relevant), role or status (current enrollment, employment status, experience level), exposure or experience with the phenomenon under study, language proficiency if instruments are in a single language, and access requirements (must have internet access for an online survey, must be able to participate in a 60-minute interview).

**Exclusion criteria** address: characteristics that confound the variables of interest, prior participation in related studies if carryover effects are a concern, inability to provide informed consent, and membership in categories that require additional protections (minors, prisoners, pregnant individuals in medical research, cognitively impaired individuals) if the study is not specifically designed with those protections.

**Sample size determination by design:**

- **Quantitative survey/correlational**: Use G*Power (free software) to conduct an a priori power analysis. For detecting a medium effect size (Cohen's f² = 0.15) in multiple regression with 80% power and α = 0.05 with 5 predictors, the required N is approximately 92. For a small effect (f² = 0.02), N approaches 395. Always report the software used, effect size assumption, power level, and alpha
- **Experimental/quasi-experimental**: Power analysis using expected effect size from prior literature or a conservative estimate (d = 0.5 for medium). For a two-group comparison with d = 0.5, 80% power, α = 0.05, N ≈ 128 total (64 per group)
- **Qualitative phenomenological**: Aim for 8-25 participants with rich experience of the phenomenon. Saturation -- the point at which no new themes emerge -- is the actual stopping criterion, typically reached by 12-15 interviews in homogeneous samples, later in heterogeneous samples
- **Grounded theory**: Theoretical saturation typically requires 20-30 participants with active theoretical sampling (selecting new participants to test emerging theory)
- **Case study**: Purposeful sampling of 1-15 cases depending on design (single, multiple, embedded). Justify case selection on theoretical grounds, not convenience
- **Mixed-methods**: Calculate sample size for each strand independently; do not compromise the quantitative N for qualitative depth

Always add 10-20% to quantitative target N to account for attrition, incomplete responses, and data quality exclusions.

### Step 4: Design or Adapt Each Instrument

For each instrument identified in Step 2, produce either a complete instrument or a detailed specification:

**Survey/questionnaire instrument design:**
- Open with demographic items (age, gender, years of experience, etc.) unless there is a theoretical reason to place them last (e.g., if demographic questions might prime responses)
- Group items by construct, using clear section headers
- Include reverse-coded items to detect satisficing (participants checking the same response box throughout); plan to reverse-score these before analysis
- Use established response formats: 1-5 or 1-7 Likert for frequency/agreement/intensity, semantic differential for bipolar constructs, multiple-select for categorical choices
- End with an open-ended item ("Is there anything else you would like to share?") for qualitative texture
- Plan for a pilot test with 5-10 participants from the target population before full deployment; use pilot data to compute preliminary reliability and revise confusing items

**Interview guide design:**
- Begin with rapport-building questions (low-stakes, descriptive: "Can you describe your role and how long you've been in it?")
- Move to substantive questions aligned to research sub-questions, ordered from broad/descriptive to specific/interpretive
- Write probes as follow-up prompts: "Can you say more about that?", "What did that feel like?", "Can you give me an example?", "How did others respond?"
- Close with a grand tour question and an exit question ("Is there anything I haven't asked about that you think is important for me to understand?")
- Plan for 45-90 minutes for individual interviews; 90-120 minutes for focus groups of 6-8 participants
- Specify recording method (audio with transcription, video if nonverbal data is needed) and transcription approach (verbatim vs. clean copy)

**Observation protocol design:**
- Define the unit of observation (an individual, a classroom interaction, a transaction)
- Specify the observation window (time-sampled: observe for 10 minutes every hour; event-sampled: record every occurrence of a defined behavior)
- Include a structured section (a checklist of pre-defined observable indicators) and an unstructured section (running field notes)
- Establish inter-rater reliability if more than one observer: code the same 10-20% of data independently and compute Cohen's kappa (κ ≥ 0.70 is acceptable; κ ≥ 0.80 is strong)

**Document/archival analysis protocol:**
- Define the corpus precisely (which documents, date range, source)
- Specify the unit of analysis (sentence, paragraph, document, artifact)
- Create a coding guide before analysis begins
- Document the search or retrieval procedure to ensure replicability

### Step 5: Address Ethical Requirements Systematically

Walk the learner through each ethical obligation rather than treating it as a checklist afterthought. Ethics permeates design, not just paperwork:

**IRB/ethics review determination:**
- In the United States, research involving human subjects at an institution that receives federal funding requires IRB review. The Common Rule (45 CFR 46) defines categories: exempt, expedited, and full board review
- Exempt categories include most educational research using standard educational practices, surveys/interviews when disclosure of responses cannot reasonably place participants at risk, and secondary data analysis of existing datasets with no identifiers
- Expedited review applies to minimal-risk research that doesn't qualify as exempt (e.g., focus groups, research involving vulnerable populations with minimal risk)
- Full board review is required when risk exceeds minimal risk, involves deception, or involves protected populations (children, prisoners, pregnant individuals, cognitively impaired)
- Outside the US, learners should identify the equivalent body (Research Ethics Committee in the UK, Institutional Ethics Committee in India, etc.)

**Informed consent design:**
- Consent documents must include: purpose of the study in plain language, procedures and time commitment, risks (including breach of confidentiality), benefits (direct and indirect), voluntary participation statement, right to withdraw without penalty, how data will be stored and for how long, who to contact with questions (researcher and IRB contact)
- For online surveys, consent is typically obtained via a "I agree to participate" button after presenting the consent information on the first page
- For minors, parental consent plus child assent (for children 7 and older) is required
- Waiver of written consent may be granted by IRB when the only record linking the participant to the study is the consent form itself (i.e., the form is the risk)

**Confidentiality and data security:**
- Distinguish confidentiality (researcher knows identity but protects it) from anonymity (researcher does not know identity)
- Survey data: use coded participant IDs; store the ID-name key separately from data, or design for anonymity from the start
- Interview data: use pseudonyms in transcripts; store audio files encrypted and password-protected; specify destruction timeline (typically 3-5 years post-publication per institutional policy)
- Cloud storage: specify compliant platforms (institutional Box or OneDrive accounts, not personal Google Drive)
- Qualitative data with thin populations: aggregate or alter identifying details in reports when a participant's unique characteristics could identify them even with a pseudonym

**Special populations and additional protections:**
- Participants under 18: parental consent + child assent; consider whether school or program administrator permission is also required
- Participants who are employees or students of the researcher: address the coercive power dynamic explicitly; consider using a third-party recruiter or ensuring non-participation has no consequences
- Participants discussing sensitive topics (trauma, illegal activity, stigmatized identities): provide referral resources; plan for distress protocols; consider whether identifiable data is necessary at all

### Step 6: Build the Data Collection Timeline

A realistic timeline is not a list of activities -- it is a sequenced plan with dependencies and buffers:

**Phases and typical durations:**

- **Instrument development and review** (2-4 weeks): Draft instruments, review by advisor or peer, revise
- **IRB submission and approval** (2-8 weeks depending on review level): Exempt decisions in 1-2 weeks at many institutions; expedited 2-4 weeks; full board may take 6-8 weeks or more; DO NOT begin recruitment before approval is received
- **Pilot testing** (1-2 weeks): Administer to 5-10 participants from the target population; analyze reliability, revise items, document changes
- **Participant recruitment** (2-6 weeks): Identify recruitment channels (email lists, social media groups, institutional rosters, community organizations), draft recruitment scripts, screen participants against inclusion/exclusion criteria
- **Data collection** (2-12 weeks): Varies by N and method -- a 500-participant survey may take 2 weeks online; 20 one-hour interviews typically take 4-8 weeks to schedule, conduct, record, and transcribe
- **Data processing** (1-4 weeks): Transcription (60-90 minutes of transcription per 1 hour of audio for a trained transcriber), data cleaning, entry verification, codebook development for qualitative data
- **Quality check/audit** (1 week): Review for missing data, out-of-range values, transcript accuracy; compute initial reliability statistics; confirm data are analysis-ready

Build in a 10-15% time buffer at each phase. IRB delays and participant recruitment shortfalls are the two most common causes of timeline failure.

**Coordination table:** For team-based or multi-site research, assign a responsible party to each phase and sub-task. Even for solo student research, naming the advisor's review checkpoints in the timeline keeps the plan accountable.

### Step 7: Pilot Test Planning

The pilot test is the single highest-return investment in data quality, yet learners routinely skip it:

- **Who to pilot**: 5-10 participants who resemble your target population but will NOT be in the main study (or, if impossible, participants whose data will be excluded from analysis)
- **What to assess in a survey pilot**: Average completion time (compare to your stated time commitment in consent form); items with high skipping rates (>10% missing); items with near-zero variance (everyone answered the same way -- the item may be ambiguous or too obvious); preliminary Cronbach's alpha for each subscale (revise if α < 0.60); any written comments from participants about confusing wording
- **What to assess in an interview pilot**: Whether opening questions produce rich narrative or short answers (revise probes); whether the guide can be completed in the allotted time; whether the recording equipment and software work; whether you can transcribe and code the pilot transcript efficiently
- **What to do with pilot data**: Document changes made to instruments after the pilot; if major revisions were made, consider a second pilot round; do not include pilot participants in the main study's analysis unless changes were minimal and documented

### Step 8: Verify Plan Completeness and Connect to Next Steps

Before finalizing the plan, run a completeness check against each research sub-question:

- Does at least one instrument item address each sub-question or construct? If not, the plan has an operationalization gap
- Is every instrument matched to a data type, an analysis plan, and a storage location? If not, the plan is incomplete
- Does the timeline account for IRB approval before recruitment begins? If not, the timeline is invalid
- Are all ethical obligations addressed? Run through the ethics checklist item by item
- Is the sample size justified with a specific method (power analysis, saturation rationale, or theoretical sampling logic)?

**Connect to next steps for the learner:**
- After the data collection plan is complete, the next task is typically writing the Methods section of the proposal or report -- use a writing-category skill
- After data are collected, the learner will need data analysis guidance -- point them to the appropriate analysis skill (quantitative statistics, qualitative coding, or mixed-methods integration)
- If the plan reveals the research question is underspecified or the methodology is poorly matched to it, redirect to `research-methodology`

---

## Output Format

Produce the following complete document. Every field must be filled with the learner's specific content -- never leave bracketed placeholders in the final output.

```
## Data Collection Plan: [Study Title or Working Title]

**Research Question:** [Verbatim research question]
**Research Design:** [e.g., Descriptive survey, Phenomenological interview study, Sequential
                      explanatory mixed-methods, Single case study]
**Primary Methodology:** [Quantitative / Qualitative / Mixed Methods]
**Target Population:** [Who you are studying]
**Data Collection Window:** [Start date -- End date]
**Prepared by:** [Learner name or "Researcher"] | **Plan Version:** [1.0] | **Date:** [Today]

---

### Section 1: Constructs and Operationalization

| Research Sub-Question | Construct/Variable | Type (IV/DV/Moderator/Theme) | Instrument | Item Numbers |
|---|---|---|---|---|
| [Sub-question 1] | [Construct name] | [DV / IV / etc.] | [Instrument name] | [e.g., Q4-Q9] |
| [Sub-question 2] | [Construct name] | [IV] | [Instrument name] | [e.g., Q10-Q16] |
| [Sub-question 3] | [Theme/phenomenon] | [Theme] | [Interview Guide] | [Questions 3, 5, 7] |

---

### Section 2: Instruments

#### Instrument 1: [Name, e.g., "Student Motivation Survey"]
- **Type:** [Questionnaire / Interview Guide / Observation Protocol / Document Analysis Form]
- **Source:** [Validated scale (citation) / Researcher-developed / Adapted from (citation)]
- **Constructs measured:** [List constructs]
- **Number of items:** [N items across N subscales]
- **Response format:** [e.g., 7-point Likert scale (1 = Strongly Disagree, 7 = Strongly Agree)]
- **Estimated completion time:** [e.g., 12-15 minutes]
- **Reliability evidence:** [If validated: Cronbach's α reported in prior studies; if new: pilot α target ≥ 0.70]
- **Reverse-coded items:** [List item numbers or "None"]
- **Administration mode:** [Online via Qualtrics / Paper / In-person interview / Synchronous video]
- **Pilot test plan:** [5-10 participants, dates, what will be assessed, revision criteria]

#### Instrument 2: [Name, e.g., "Faculty Experience Interview Guide"]
- **Type:** Semi-structured interview guide
- **Constructs/themes addressed:** [List]
- **Number of anchor questions:** [N questions with N probes each]
- **Estimated duration:** [45-75 minutes]
- **Recording method:** [Audio recording with [software] / Video / Field notes only]
- **Transcription plan:** [Verbatim / Clean copy / AI-assisted with human review; who transcribes]
- **Pilot interview plan:** [N pilot interviews, with whom, dates]

---

### Section 3: Participant Criteria and Sample Size

#### Inclusion Criteria
| Criterion | Rationale |
|---|---|
| [e.g., Currently enrolled in an undergraduate program] | [Necessary to match research population] |
| [e.g., Minimum 1 year of teaching experience] | [Ensures sufficient experience with the phenomenon] |
| [e.g., Age 18 or older] | [Standard consent requirement] |

#### Exclusion Criteria
| Criterion | Rationale |
|---|---|
| [e.g., Concurrent enrollment in another study using the same instruments] | [Prevents carryover effects] |
| [e.g., Less than 6 months in current role] | [Insufficient exposure to constructs of interest] |

#### Sample Size Justification
- **Target N:** [Number]
- **Method of determination:** [G*Power power analysis / Saturation rationale / Theoretical sampling / Rule of thumb for design]
- **Specifications (if power analysis):** Effect size = [value and basis], Power = [0.80], α = [0.05], [N predictors / groups]
- **Adjusted target (with attrition buffer):** [N + 15% = final recruitment target]
- **Rationale for qualitative N:** [Expected saturation rationale, homogeneity/heterogeneity of sample]

#### Recruitment Strategy
- **Recruitment channels:** [List specific channels: course listservs, professional associations, snowball referrals, institutional rosters]
- **Recruitment materials:** [Email script, flyer, social media post -- note which will be submitted with IRB application]
- **Screening procedure:** [Screening survey / Eligibility questions at start of survey / Phone screen]
- **Compensation:** [None / $N gift card / Course credit / Other -- note ethical implications]

---

### Section 4: Ethical Considerations

#### IRB Status
- **Review type required:** [Exempt / Expedited / Full Board / Not required (reason)]
- **Submission status:** [Not yet submitted / Submitted [date] / Approved [date], Protocol #]
- **Approval required before:** [Recruitment begins -- DO NOT begin recruitment before approval]

#### Informed Consent
- [ ] Consent form drafted (plain language, 8th-grade reading level target)
- [ ] Consent form reviewed by advisor/IRB
- [ ] Online consent procedure designed (first-page click-through, or wet signature)
- [ ] Parental consent required: [Yes / No -- if yes, procedure described]
- [ ] Assent required (participants under 18): [Yes / No]
- [ ] Waiver of written consent requested: [Yes (basis) / No]

#### Confidentiality and Data Security
- **Anonymity or confidentiality:** [Anonymous (no identifiers collected) / Confidential (IDs used, key stored separately)]
- **Participant ID system:** [e.g., "P001" through "P050"; ID-name key stored in encrypted file separate from data]
- **Audio/video storage:** [Encrypted institutional cloud storage; access restricted to research team]
- **Retention period:** [3 years post-publication per institutional policy]
- **Destruction plan:** [Secure deletion of audio files; shredding of paper documents]
- **Thin population risk:** [Addressed / Not applicable -- if addressed, describe mitigation]

#### Risk/Benefit Analysis
- **Risks to participants:** [List: time burden, discomfort with sensitive questions, breach of confidentiality (likelihood and severity)]
- **Risk mitigation measures:** [List specific measures for each risk]
- **Benefits:** [Direct benefits to participants; contribution to knowledge]
- **Vulnerable population considerations:** [List any special protections if applicable]

#### Deception (if applicable)
- [ ] No deception involved
- [ ] Deception involved: [describe] -- debriefing procedure: [describe]

---

### Section 5: Data Collection Timeline

| Phase | Activities | Start | End | Responsible | Dependencies |
|---|---|---|---|---|---|
| Instrument Development | Draft survey, interview guide; advisor review; revisions | [Date] | [Date] | Researcher | Research question finalized |
| IRB Submission | Prepare application, consent forms, instruments; submit | [Date] | [Date] | Researcher | Instruments finalized |
| IRB Approval | Await decision | [Date] | [Date] | IRB office | Submission complete |
| Pilot Testing | Administer to 5-10 pilot participants; analyze; revise | [Date] | [Date] | Researcher | IRB approval |
| Participant Recruitment | Send recruitment materials; screen; schedule | [Date] | [Date] | Researcher | IRB approval + revised instruments |
| Data Collection | Administer surveys / conduct interviews | [Date] | [Date] | Researcher | Recruitment complete |
| Data Processing | Transcription, data entry, cleaning, quality check | [Date] | [Date] | Researcher | Data collection complete |
| Analysis-Ready Audit | Confirm data completeness; compute initial reliability | [Date] | [Date] | Researcher | Processing complete |

**Critical path note:** [Identify the single phase most likely to cause delay and your contingency plan]

---

### Section 6: Data Management Plan

| Data Type | File Format | Storage Location | Backup | Access Control | Retention |
|---|---|---|---|---|---|
| Survey responses | .csv / Qualtrics export | Encrypted institutional drive | Weekly backup | Researcher only | 3 years post-publication |
| Audio recordings | .mp4 / .wav | Encrypted institutional drive | External encrypted drive | Researcher only | 3 years post-publication |
| Transcripts | .docx (pseudonymized) | Encrypted institutional drive | Weekly backup | Research team | 3 years post-publication |
| Consent forms | .pdf (signed) | Locked file cabinet or encrypted drive | N/A | Researcher only | [Institutional requirement] |

---

### Section 7: Completeness Verification Checklist

- [ ] Every research sub-question is addressed by at least one instrument item
- [ ] Every instrument has a reliability plan (validation evidence or pilot α target)
- [ ] Sample size is justified with a named method
- [ ] IRB approval precedes recruitment in the timeline
- [ ] Consent procedure matches review level (exempt, expedited, or full)
- [ ] Data storage locations named and compliant with institutional policy
- [ ] Pilot test is planned before full data collection
- [ ] Critical path delay risk identified with contingency

---

### Next Steps
1. [Immediate -- within this week]: [Specific action, e.g., "Submit IRB application by [date]; advisor to review consent form by [date]"]
2. [Short-term -- within 2-4 weeks]: [e.g., "Complete instrument development and schedule pilot participants"]
3. [Before data collection begins]: [e.g., "Receive IRB approval and complete pilot test revisions"]
4. [After data collection]: [e.g., "Proceed to data analysis -- consult [analysis skill] for next steps"]
```

---

## Rules

1. **Never design instruments before the research question and methodology are confirmed.** Instrument choice is downstream of epistemology. A phenomenological study cannot use a closed-ended Likert survey as its primary instrument; a large-N correlational study cannot rely on 8 interviews. If the learner's methodology choice and instrument request are misaligned, flag it explicitly before proceeding.

2. **Always produce a variable-to-item mapping table.** Every construct named in the research question must be traceable to at least one instrument item. Constructs without items represent operationalization gaps that will make the data unanalyzable. Do not allow the plan to move forward with unmapped constructs.

3. **Never suggest starting recruitment before IRB approval.** This is not a procedural formality -- it is a federal requirement in the US under 45 CFR 46 and an equivalent legal/ethical requirement in most countries. Any timeline that shows recruitment beginning before IRB approval is issued must be corrected. If the learner's deadline makes proper IRB review impossible, say so directly and suggest solutions (exempt category redesign, secondary data, course ethics waiver).

4. **Always justify sample size with a named method, not intuition.** "I'll survey 50 people because that seems like enough" is not a justification. For quantitative studies, always run or describe a G*Power calculation. For qualitative studies, always explain the saturation rationale with reference to sample homogeneity. An unjustified N will be rejected by thesis committees and IRB reviewers alike.

5. **Distinguish confidentiality from anonymity -- never conflate them.** Confidentiality means the researcher knows identities but protects them through data practices. Anonymity means the researcher cannot link responses to individuals. Qualitative interviews are almost never anonymous. Asserting anonymity for identifiable data in a consent form is an ethical violation, not a minor wording error.

6. **Always include a pilot test phase in the timeline.** Skipping the pilot test is the single most common cause of scale validity failure in student research. Even a 3-participant cognitive interview (asking participants to think aloud as they complete a survey) catches the majority of item-wording problems. A plan without pilot testing must be flagged and revised.

7. **Always flag power imbalance in recruitment.** When a researcher recruits participants from within their own classroom, institution, workplace, or any setting where non-participation could carry consequences, this must be addressed with a concrete mitigation strategy (third-party recruiter, anonymous response option, explicit statement that non-participation has no consequences and is verifiable). IRB reviewers scrutinize this; committees question it.

8. **Do not recommend generic storage solutions.** "Google Drive" or "personal laptop" are not acceptable data storage plans for research with human participants. Always recommend institutional cloud platforms with access controls, encrypted drives for sensitive data, and separate storage for consent forms vs. participant data. If the learner does not know their institution's approved platforms, instruct them to contact their IRB or research office.

9. **Reverse-coded items must be explicitly identified in the plan.** Any instrument using a Likert-type scale should include at least some reverse-worded items to detect satisficing and acquiescence bias. If a validated scale includes reverse-coded items, list them explicitly so the learner knows to recode them before running reliability analysis (a common analysis error when not planned from the start).

10. **The timeline must show dependencies, not just dates.** A list of dates with no sequencing logic is not a plan -- it is a calendar. Each phase must show what it depends on (IRB approval must precede recruitment; pilot testing must precede full data collection; instrument finalization must precede IRB submission). A timeline with dependencies makes delay consequences visible and allows the learner to plan contingencies.

---

## Edge Cases

### The Learner Has Not Yet Chosen a Research Methodology

If the learner arrives with a research question but no methodology selected, do not proceed. An instrument cannot be chosen until the design is known. Explain: "Instrument selection, sample size, and analysis are all downstream of your methodology choice. Before we build your data collection plan, we need to confirm your research design. Use the `research-methodology` skill to work through that decision, then return here." You may briefly outline the general mapping (surveys → quantitative descriptive; interviews → qualitative; both → mixed methods) to orient the learner, but do not produce a plan for an unspecified design.

### The Learner Wants to Use an Existing Validated Scale But Cannot Access It

Many validated instruments (e.g., Maslach Burnout Inventory, MMSE, many proprietary scales) are behind licenses or publisher paywalls. Advise: (1) check whether the scale is reproduced in a dissertation or open-access publication -- this is sometimes legally permissible; (2) contact the scale developer directly, as many academic researchers grant free use for non-commercial research; (3) search for validated alternative measures in the same domain using PsycINFO or ERIC instrument filters; (4) if all else fail, develop items based on the construct definition in the original scale's documentation and plan a rigorous pilot for preliminary validation. Never tell a learner to simply copy a copyrighted instrument without permission.

### The Learner Has an Extremely Short Timeline (Thesis Defense in 6 Weeks)

A compressed timeline requires honest trade-off conversations. Walk through what is absolutely non-negotiable (IRB approval before any data collection) and what can be compressed (pilot test reduced to 3-5 participants with cognitive interview approach rather than full psychometric pilot; recruitment via existing relationships rather than cold outreach; synchronous online interviews scheduled on a compressed schedule). Help the learner calculate backwards from the defense date to determine whether primary data collection is actually feasible. If it is not, genuinely discuss alternatives: secondary data analysis, archival data, or a scope reduction. Do not produce a plan that is logistically impossible -- document the constraints explicitly.

### The Research Involves Sensitive Topics (Trauma, Stigmatized Identities, Illegal Behavior)

Sensitive topic research requires enhanced ethical planning beyond the standard checklist. Additional requirements to address: (1) interview termination protocol -- the researcher must know how to respond if a participant becomes distressed, including having a script for closing the interview gracefully and referral resources ready; (2) mandated reporting -- if the research touches on child abuse, suicidal ideation, or ongoing criminal activity, the researcher may have legal reporting obligations that must be disclosed in the consent form and navigated carefully; (3) certificate of confidentiality -- in the US, NIH-funded research on sensitive topics may qualify for a Certificate of Confidentiality that protects research data from legal subpoena; (4) consider whether fully anonymous data collection is possible, as identifiability increases risk to participants; (5) debriefing and support resources should be provided at the end of every data collection session.

### The Learner Is Conducting a Multi-Site Study

Multi-site research multiplies IRB complexity and coordination challenges. Address: (1) each institution with human subjects research oversight may require its own IRB approval, or the sites may operate under a reliance agreement where one institution's IRB serves as the IRB of record; (2) instrument administration must be standardized across sites to ensure data comparability -- this requires a data collection procedures manual, not just an instrument; (3) data from different sites may need to be kept separate until all approvals are received; (4) recruitment timelines across sites rarely align, so build explicit buffers and a minimum acceptable N per site into the plan; (5) any site-level variables (school type, program differences, regional demographics) may need to be treated as covariates or moderators in analysis.

### The Learner Wants to Use Social Media or Online Platforms as a Data Source

Social media data collection raises distinct ethical and methodological issues. Address: (1) public vs. private data -- content posted in public forums (Twitter/X, public Facebook groups, Reddit public subreddits) is generally considered public data for research purposes, but private groups, direct messages, and closed communities require consent; (2) terms of service -- platforms' ToS may prohibit scraping or research use; check each platform's academic API or research access program; (3) de-identification of social media data is complex -- usernames, even pseudonymous ones, can be searched and linked to real identities; consider paraphrasing quotes rather than reproducing them verbatim; (4) IRB classification of social media research varies by institution; some classify it as exempt, others as expedited -- check with your specific IRB; (5) consent for survey recruitment through social media requires that the recruitment post be IRB-approved in advance, just like any other recruitment material.

### The Learner Is Using a Mixed-Methods Design But Cannot Articulate the Integration Logic

Mixed-methods research fails most often at integration -- the quantitative and qualitative strands are conducted as parallel but unconnected studies. If the learner cannot explain specifically how the strands will be connected, address this in the data collection plan rather than leaving it to analysis. For an explanatory sequential design (QUAN → qual): identify in advance what quantitative finding patterns (e.g., outliers, low-scoring subgroups, unexpected non-significant results) will trigger and shape the qualitative purposeful sample. For an exploratory sequential design (qual → QUAN): describe how qualitative themes will be used to develop survey items or select quantitative measures. For a convergent design: create a joint display matrix in the plan showing how each qualitative theme maps to a quantitative variable for convergence analysis. Integration that is planned at the data collection stage produces richer findings than integration attempted retroactively.

---

## Example

**Input from learner:** "I'm a master's student in education. My research question is: 'How do first-generation college students experience academic self-efficacy in their first year, and does participation in a peer mentoring program moderate the relationship between self-efficacy and GPA?' I've already decided to use a sequential explanatory mixed-methods design. I need to plan my data collection. My thesis defense is in about 9 months. I'm at a mid-sized public university in the US and will need IRB approval."

---

**Output:**

## Data Collection Plan: First-Generation Student Self-Efficacy and Peer Mentoring

**Research Question:** How do first-generation college students experience academic self-efficacy in their first year, and does participation in a peer mentoring program moderate the relationship between self-efficacy and GPA?
**Research Design:** Sequential explanatory mixed-methods (QUAN Phase 1 → qual Phase 2)
**Primary Methodology:** Mixed Methods -- quantitative primary strand, qualitative explanatory strand
**Target Population:** First-generation college students (first-generation defined as: neither parent completed a 4-year college degree) in their first year at [researcher's institution]
**Data Collection Window:** Phase 1 Survey: Months 3-5 | Phase 2 Interviews: Months 6-7
**Prepared by:** [Researcher] | **Plan Version:** 1.0 | **Date:** [Today]

---

### Section 1: Constructs and Operationalization

| Research Sub-Question | Construct/Variable | Type | Instrument | Item Numbers |
|---|---|---|---|---|
| Does self-efficacy predict GPA? | Academic self-efficacy | IV | MSLQ Self-Efficacy Subscale | Q1-Q8 |
| Does self-efficacy predict GPA? | Cumulative GPA (end of semester 1) | DV | Institutional records request | N/A |
| Does mentoring moderate the relationship? | Peer mentoring participation | Moderator | Survey Q9-Q11 (researcher-developed) | Q9-Q11 |
| How do students experience self-efficacy? | Lived experience of self-efficacy | Phenomenon | Semi-structured interview guide | All questions |
| What role does mentoring play experientially? | Experience of mentoring support | Theme | Semi-structured interview guide | Q4, Q6, Q7, probes |

---

### Section 2: Instruments

#### Instrument 1: Student Experience Survey

- **Type:** Questionnaire
- **Source:** MSLQ Self-Efficacy subscale (Pintrich et al., 1991) -- validated instrument; researcher-developed peer mentoring items
- **Constructs measured:** Academic self-efficacy (MSLQ); peer mentoring participation and frequency
- **Number of items:** 11 items total (8 MSLQ self-efficacy items + 3 researcher-developed mentoring items)
- **Response format:** MSLQ items: 7-point Likert (1 = Not at all true of me, 7 = Very true of me); Mentoring items: Q9 = Yes/No participation; Q10 = frequency (0, 1-2, 3-5, 6+ sessions); Q11 = type of mentoring contact (peer mentor assigned through program, peer mentor sought independently, no mentoring)
- **Estimated completion time:** 8-10 minutes
- **Reliability evidence:** MSLQ self-efficacy subscale: Cronbach's α = 0.93 in original validation (Pintrich et al., 1991); α ranging 0.82-0.90 in subsequent studies with college students. Researcher-developed mentoring items will be assessed during pilot
- **Reverse-coded items:** MSLQ item 2 and item 6 are reverse-coded in original scale; must be recoded before reliability analysis (recode: 1↔7, 2↔6, 3↔5)
- **Administration mode:** Online via institutional Qualtrics license; link distributed via institutional email and First-Generation Student Program coordinator
- **Pilot test plan:** Administer to 8 first-generation students from the prior year's cohort (not in the current study sample); assess completion time, item skipping, response variance on mentoring items, preliminary α for self-efficacy subscale; revise if α < 0.80 or >15% of participants skip any item

#### Instrument 2: First-Generation Student Experience Interview Guide

- **Type:** Semi-structured interview guide
- **Constructs/themes addressed:** Academic self-efficacy experiences, academic challenges, peer mentoring participation experiences, help-seeking behavior, sense of belonging
- **Number of anchor questions:** 8 anchor questions, each with 2-3 probes
- **Structure:**
  - Opening (rapport): Q1 -- "Tell me a bit about yourself and what brought you to [institution]."
  - Core questions: Q2 -- "Describe a moment in your first semester when you felt confident you could succeed academically. What was happening?" Q3 -- "Describe a moment when you doubted your academic ability. What contributed to that?" Q4 -- "If you participated in peer mentoring, what did that experience look like for you?" [If no: Q5 -- "What resources, if any, did you turn to when you found coursework challenging?"] Q6 -- "How, if at all, did interactions with other students affect how you felt about your ability to succeed?" Q7 -- "Looking back on your first year, what would you say most shaped your confidence as a college student?"
  - Closing: Q8 -- "Is there anything about your experience that you feel is important for me to understand that I haven't asked about?"
  - Probes for all core questions: "Can you say more about that?", "Can you give me a specific example?", "How did that make you feel?", "Did that change over time?"
- **Estimated duration:** 50-70 minutes
- **Recording method:** Audio recording via encrypted app (Otter.ai on researcher's institutional account, or Zoom cloud recording for remote interviews); video not required as nonverbal data is not a focus
- **Transcription plan:** AI-assisted transcription (Otter.ai) reviewed and corrected verbatim by researcher within 48 hours of interview; pseudonymized before storage
- **Pilot interview plan:** Conduct 2 pilot interviews with first-generation students from a different institution or prior cohort; assess guide flow, probe effectiveness, completion time; revise anchor questions that produce short/closed answers

---

### Section 3: Participant Criteria and Sample Size

#### QUAN Phase 1: Survey

**Inclusion Criteria**

| Criterion | Rationale |
|---|---|
| Neither parent completed a 4-year college degree | Defines the first-generation population of interest |
| Currently enrolled as a first-year student (0-29 credit hours completed) | Targets the first-year experience specifically |
| Enrolled in at least 12 credit hours (full-time) | Controls for part-time enrollment as a confound with GPA |
| Age 18 or older | Standard consent requirement; avoids minor participant complexity |
| Enrolled at [researcher's institution] | Access and institutional GPA data availability |

**Exclusion Criteria**

| Criterion | Rationale |
|---|---|
| Transfer students with prior college credits | Prior college experience confounds first-generation first-year experience |
| Students enrolled primarily in online programs | Campus-based peer mentoring program not accessible; different experience |
| Students who have already withdrawn from the institution | GPA data may be incomplete; experience is retrospective |

**Sample Size Justification -- QUAN Phase**
- **Target N:** 104 participants
- **Method:** G*Power 3.1, linear multiple regression
- **Specifications:** Moderating effect in regression (interaction term for self-efficacy × mentoring participation predicting GPA); f² = 0.10 (small-to-medium interaction effect, conservative estimate per Champoux & Peters, 1987, on typical interaction effects in behavioral research); Power = 0.80; α = 0.05; 3 predictors (self-efficacy, mentoring participation, self-efficacy × mentoring interaction) → required N = 89
- **Adjusted target:** 89 × 1.17 attrition buffer = 104 recruitment target (accounting for incomplete surveys, GPA data unavailability, and ineligible participants discovered post-enrollment)
- **Recruitment target:** 104 valid completed surveys

#### QUAL Phase 2: Interviews

**Purposeful sampling design (from QUAN results):**
Phase 2 participants will be selected purposefully from Phase 1 survey respondents based on QUAN results:
- 5-6 participants with high self-efficacy scores AND high GPA who participated in peer mentoring
- 5-6 participants with high self-efficacy scores AND high GPA who did NOT participate in peer mentoring
- 4-5 participants with low self-efficacy scores regardless of mentoring (to explore what shaped low efficacy perceptions)
- Total target: 15-17 interviews; will continue until thematic saturation is confirmed (point at which no new themes emerge in consecutive interviews)

**Rationale for N:** Homogeneous sample (all first-year, first-generation, same institution) suggests saturation by 12-15 interviews based on Guest et al. (2006) finding saturation in homogeneous populations by interview 12; 15-17 provides buffer and purposeful contrast groups

#### Recruitment Strategy
- **Phase 1:** Partner with First-Generation Student Services office to distribute survey link via their email list and program communications; post in first-generation student Facebook group (IRB-approved recruitment language); brief First-Year Experience course instructors about study for in-class announcement
- **Phase 2:** At end of Phase 1 survey, participants indicate willingness to be contacted for an interview (separate consent checkbox; no obligation); researcher selects interview sample from willing Phase 1 participants based on QUAN results
- **Screening:** Phase 1 survey first page includes 3 eligibility questions (parent education, current year, full-time status); ineligible respondents are redirected out of the survey automatically via Qualtrics skip logic
- **Compensation:** $10 gift card for Phase 1 survey completion (via institutional procurement); $25 gift card for Phase 2 interview completion; compensation disclosed in consent form

---

### Section 4: Ethical Considerations

#### IRB Status
- **Review type required:** Expedited -- survey of adults on a sensitive topic (first-generation identity, academic performance) with minimal risk; no deception; GPA data requires additional institutional data use agreement
- **Submission status:** Not yet submitted -- target submission date: [Month 2, Week 1]
- **Approval required before:** Any recruitment materials distributed or survey link activated
- **GPA data:** Requires a separate FERPA-compliant data use agreement with the Registrar; initiate this process simultaneously with IRB submission; may take 3-4 weeks for Registrar approval

#### Informed Consent
- [x] Phase 1 consent presented on Qualtrics page 1 before eligibility screening; participants click "I agree to participate" to proceed; participants who do not agree are exited with a thank-you message
- [x] Phase 2 informed consent is a separate document emailed to interview participants before scheduled interview; signed copy returned before interview begins (PDF signature acceptable)
- [x] Consent language explains: purpose, procedures for both phases, right to skip questions, right to withdraw at any time without impact on academic standing, how GPA data will be used and stored, audio recording (participant may request no recording), data retention timeline
- [x] Separate consent checkbox at end of Phase 1 for willingness to be contacted for Phase 2 -- this is not presumed from Phase 1 consent
- [ ] Parental consent: Not required (all participants 18+)
- [ ] Waiver of written consent requested for Phase 1: Yes (electronic consent, risk is minimal, consent form is the only identifier)

#### Confidentiality and Data Security
- **Phase 1:** Survey is confidential (not anonymous) -- participant email collected only for Phase 2 contact list; email stored separately from response data; Qualtrics configured to anonymize IP addresses; response data exported without embedded email data
- **Phase 2:** Participants assigned pseudonyms (P-01 through P-17); pseudonym key stored in password-protected file separate from transcripts; audio files stored on institutional encrypted OneDrive folder, accessible only to researcher
- **GPA data:** Linked to participant IDs, not names; Registrar provides data with student ID numbers only; ID-name key destroyed after data linkage is verified
- **Retention period:** All data retained for 3 years post-thesis submission, then securely deleted
- **Thin population risk:** With a small purposeful sample at one institution, qualitative quotes will be altered (composite paraphrasing or minor detail changes) if a participant's demographic profile could be re-identified through their words; this will be disclosed in the thesis limitations section

#### Risk/Benefit Analysis
- **Risks:** Mild discomfort when reflecting on academic struggles or self-doubt (low probability, low severity); breach of confidentiality (low probability given security measures, moderate severity given GPA sensitivity)
- **Risk mitigation:** Participants may skip any question; may withdraw without consequence; Phase 2 interview distress protocol: if participant becomes distressed, researcher will acknowledge, offer to pause or stop, and provide campus counseling center contact information at end of interview
- **Benefits:** Participants may experience reflection as personally meaningful; study contributes to understanding of first-generation student support needs

#### Deception
- [x] No deception involved

---

### Section 5: Data Collection Timeline

| Phase | Activities | Start | End | Responsible | Dependencies |
|---|---|---|---|---|---|
| Instrument Development | Draft survey (MSLQ + mentoring items); draft interview guide; advisor review | Month 1 | Month 1, Wk 3 | Researcher | Research question finalized |
| IR
