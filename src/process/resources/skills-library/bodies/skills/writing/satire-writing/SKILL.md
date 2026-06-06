---
name: satire-writing
description: |
  Writes satirical pieces that use irony, exaggeration, and absurdity to critique real-world subjects. Produces satire in various formats including mock articles, parodies, absurdist fiction, and satirical commentary.
  Use when the user asks to write satire, parody, mock articles, absurdist humor, or ironic commentary on a subject.
  Do NOT use for straight humor or comedy without a critical target (use writing-prompt-response), serious opinion pieces (use opinion-piece), or academic analysis of satire.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "creative-writing writing analysis"
  category: "writing"
  subcategory: "creative-writing"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Satire Writing

## When to Use

Use this skill when the user's request matches one of these specific scenarios:

- User asks to write satire, parody, or ironic commentary about a specific subject -- an institution, a trend, a policy, a cultural phenomenon, or a public behavior pattern
- User wants a mock article in the style of The Onion, Reductress, McSweeney's, The Babylon Bee, or similar satirical publications
- User wants to write a "modest proposal" -- an absurd solution to a real problem, delivered with deadpan seriousness
- User wants genre parody that adopts the conventions of a recognizable form (corporate memo, academic paper, self-help book, TED talk transcript) and applies them to an incongruous subject
- User wants absurdist fiction in the tradition of Kafka, Vonnegut, or Heller -- fiction where systemic absurdity is the engine of both humor and critique
- User wants satirical commentary, a mock FAQ, a fake press release, a parody manifesto, or any creative piece whose primary function is to critique through comedic distortion
- User asks to "make fun of" or "roast" a system, institution, trend, or behavior pattern -- not an individual person

**Do NOT use when:**

- User wants straight comedy, jokes, or humorous writing with no critical target -- use `writing-prompt-response` instead. Comedy entertains; satire critiques. If there is no identifiable target being exposed or undermined, it is comedy, not satire.
- User wants a serious opinion piece, editorial, or persuasive essay -- use `opinion-piece` instead. Satire argues through irony; opinion pieces argue directly. If the user wants to state their position plainly, this is not the right skill.
- User wants academic literary analysis of satirical works (e.g., analyzing Swift's rhetorical techniques) -- that is critical analysis, not creative writing.
- User wants to write something genuinely harmful, defamatory, or designed to damage a specific private individual's reputation. Satire targets systems and the powerful; personal attacks are not satire.
- User wants a humorous listicle without satirical structure ("10 Funny Things About Cats") -- use `listicle-writing` instead.
- User wants parody song lyrics -- use `songwriting` if available, with a note on parodic intent.

---

## Process

### 1. Identify the Satirical Target, Angle, and Stakes

Before writing a single sentence, establish what the satire is actually about. The most common failure in satirical writing is starting with a tone ("I want something funny and sarcastic") without a target. Tone without a target produces sarcasm, not satire.

Collect or determine these inputs:

- **Target:** What specific institution, behavior, trend, ideology, or power structure is being satirized? "Society" is not a target. "The tech industry's habit of rebranding layoffs as 'right-sizing for the future'" is a target. If the user gives a broad subject, propose three narrower satirical angles and ask which resonates.
- **Satirical thesis:** What is the piece actually arguing, underneath the comedy? Every strong satirical piece has a thesis that could be stated seriously. The Onion headline "No Way To Prevent This, Says Only Nation Where This Regularly Happens" has a clear thesis: American gun policy is uniquely and willfully negligent. If you cannot articulate the thesis, the piece will lack focus.
- **Format:** Match the format to the target. A corporate absurdity is best satirized as a fake memo or press release. A cultural trend is best satirized as a mock news article. A philosophical or political position is best satirized as a modest proposal or absurdist fiction. The wrong format weakens the satire even if the writing is sharp.
- **Tone:** Determine where the piece sits on the satirical tonal spectrum:
  - *Deadpan* (The Onion, Borowitz): Completely straight-faced presentation of absurdity. The writer never winks. The humor lives in the gap between the insane content and the sober delivery.
  - *Escalating absurdist* (Kafka, Catch-22): Starts in recognizable reality and drifts into surreal territory so gradually the reader cannot identify the exact moment things went wrong.
  - *Savage/Juvenalian* (Swift, early Mark Twain): Anger underneath the comedy. The satire is an indictment dressed as entertainment.
  - *Gentle/Horatian* (Twain's later work, P.G. Wodehouse): Affectionate mockery. The target is human folly rather than malice. The reader laughs with recognition, not outrage.
  - *Ironic praise* (Colbert Report model): The satirist adopts the voice of someone who sincerely holds the position being mocked and plays it completely straight, letting the audience see the absurdity from inside.
- **Boundary line:** Where does edgy become harmful for this specific target? Establish this before drafting. The general principle -- satire punches up, not down -- is necessary but not sufficient. A piece satirizing corporate greed can still cross a line if it uses a real employee's name and fabricates quotes. Define the boundary concretely for each piece.

### 2. Design the Satirical Mechanism

The mechanism is how the satire delivers its critique. This is the structural engine of the piece -- the craft decision that separates satire from sarcasm. Choose one primary mechanism and, optionally, one secondary mechanism:

**Primary mechanisms:**

- **Straight-faced absurdity:** Present something ridiculous as completely normal. The piece never acknowledges the absurdity. The humor and the critique both come from the reader's recognition that what is being presented as reasonable is, in fact, insane. This is the hardest mechanism to execute because it requires absolute tonal discipline -- one moment of winking destroys it.
- **Logical extension:** Take a real trend, policy, or behavior and follow it to its logical extreme. If companies track employee productivity, what happens when they track bathroom breaks? If social media optimizes for engagement, what happens when it optimizes for outrage? The satirical power comes from showing that the absurd endpoint is a straight line from current reality.
- **Inversion:** Flip power dynamics, scale, or significance. The trivial becomes urgent; the urgent becomes trivial. A boardroom crisis over office snack selection reveals how corporate decision-making actually works. A doctor treating a patient's LinkedIn addiction as a medical emergency reveals our relationship with social media.
- **Modest proposal:** Propose an outrageously wrong solution to a real problem, delivered with meticulous seriousness and supporting "evidence." The original Swift piece proposed eating Irish children to solve poverty. The mechanism works because the proposal's wrongness mirrors the wrongness of actual responses to the problem.
- **Genre parody:** Adopt the exact conventions, jargon, and structural patterns of a recognizable genre and apply them to a subject that exposes the genre's assumptions. A scientific paper studying whether meetings accomplish anything. A self-help book for corporations trying to find their authentic selves. A dating profile written by a failing startup.
- **Ironic spokesperson:** Write from the perspective of someone who sincerely and enthusiastically holds the position being critiqued. The satirist disappears behind the character. The character's own words -- earnest, confident, internally consistent -- reveal the absurdity of the position without the author ever commenting on it.

**Secondary mechanisms (layer on top of the primary):**

- **Telling details:** Fictional statistics, invented expert quotes, fake organization names, and specific brand references that ground the absurdity in hyper-realistic texture. "The Hawthorne Institute for Workplace Synergy" sounds real enough to land. "Some research institute" does not.
- **Escalation structure:** Each paragraph or section raises the stakes slightly, so the piece moves from plausible to clearly absurd in a gradient. The reader should not be able to identify the exact sentence where the piece crossed from possible to impossible.
- **Repetition with variation:** A phrase, structure, or observation recurs throughout the piece, each time slightly more distorted. This builds comedic rhythm and reinforces the satirical thesis through accumulation.

### 3. Develop the Satirical Voice

Voice is not the same as tone. Tone is the emotional register (deadpan, savage, gentle). Voice is the specific character the prose inhabits -- the word choices, sentence rhythms, and rhetorical habits that make the writing feel like it comes from a particular speaker.

- **For mock journalism (The Onion style):** Mirror AP style conventions. Use attribution ("said," "according to," "sources confirmed"). Lead with the most absurd claim stated as fact. Keep sentences clean and declarative. No adjectives that betray an opinion. The comedy comes entirely from what is reported, never from how.
- **For corporate parody (fake memos, press releases):** Adopt corporate jargon with total sincerity. "Leverage," "synergy," "alignment," "stakeholder value" -- use these terms as if they mean something. The voice is the voice of someone who has fully internalized corporate language and cannot see outside it.
- **For academic/scientific parody:** Use passive voice, hedging language ("it could be argued that"), footnotes, literature reviews of fictional studies, and methodological descriptions of absurd procedures. The humor comes from the mismatch between the rigor of the form and the absurdity of the content.
- **For modest proposals:** Write with the voice of a reasonable, well-meaning person who has carefully considered the problem and arrived at a monstrous conclusion through impeccable logic. The voice is calm, measured, and genuinely concerned about the problem. The solution just happens to be horrifying.
- **For absurdist fiction:** The narrator's voice should treat the surreal events as ordinary. Characters should react to systemic absurdity with mild frustration or bureaucratic acceptance, never with the shock the reader feels. The gap between character reaction and reader reaction is where the satire lives.

**Tonal registers to calibrate:**

- **Heat level:** How angry is the satire underneath? A piece about healthcare billing can be ice-cold (deadpan recitation of absurd charges) or white-hot (savage indictment through dark comedy). Match the heat to the severity of the target.
- **Density of jokes:** Satirical pieces are not stand-up routines. Not every sentence needs a punchline. Strong satire alternates between setup passages that feel genuinely plausible and payoff lines that land the absurdity. A joke-per-line density exhausts the reader and prevents escalation.
- **Specificity level:** More specific is almost always funnier and more effective. "A large tech company" is less satirically powerful than "a company whose mission statement contains the word 'democratize' four times." Specific invented details create the illusion of reportage and strengthen the deadpan.

### 4. Draft the Satirical Piece

Write with full commitment to the chosen mechanism, voice, and tone. The drafting phase is where most satire fails -- not from lack of ideas but from lack of discipline.

- **Open strong.** The first sentence should establish the satirical premise immediately. In a mock article, this means the headline and lede do all the setup work. In absurdist fiction, the first paragraph should introduce the world's central distortion. Do not warm up. Do not provide context that the format would not provide. A mock news article does not open with "Satire has a long history..."
- **Maintain character absolutely.** The single most important rule of satirical drafting: never break the fourth wall. Never wink at the reader. Never signal "this is satire" through tone shifts, parenthetical asides, or moments of sincerity. The piece must read as if the author genuinely believes what they are writing. If you feel the urge to add "...which is totally normal and fine" after an absurd statement, resist it -- the reader already gets it.
- **Escalate deliberately.** Map the escalation arc before writing. A typical structure:
  - Paragraph 1-2: Plausible. A reader skimming might believe this is real.
  - Paragraph 3-4: Unlikely but possible. The details start straining credibility.
  - Paragraph 5-6: Clearly absurd to an attentive reader but still delivered with total seriousness.
  - Final paragraph: The satirical thesis lands through a final detail, quote, or observation that recontextualizes everything above it.
- **Use specific, invented details.** Fictional expert names with real-sounding credentials. Fake statistics with precise-sounding numbers (47%, not "about half"). Invented organization names that sound plausible. Fake quotes that sound like real people actually talk. These details are the texture that separates strong satire from vague sarcasm.
- **Serve the target, not the joke.** Every comedic choice must advance the satirical argument. A joke that is funny but irrelevant to the target weakens the piece by diluting focus. If a line makes you laugh but does not serve the thesis, cut it. Discipline is what separates satire from sketch comedy.
- **Land the ending.** The final line of a satirical piece carries disproportionate weight. Strong endings for different formats:
  - Mock article: A kicker quote or "at press time" line that either escalates one final time or quietly reveals the real motivation behind everything described above.
  - Modest proposal: A closing line that reveals the proposer has a personal stake in the monstrous solution.
  - Absurdist fiction: The character accepts or adapts to the absurd system, suggesting it will continue indefinitely.
  - Genre parody: The conventions of the parodied genre are pushed to a breaking point in the final paragraph.

### 5. Review Against Satire-Specific Criteria

Before delivering the piece, run through this checklist. Each test addresses a specific failure mode:

- **The target test:** Can a reader identify what is being satirized without being told? If the satirical target is unclear, the piece reads as random absurdity rather than commentary. Fix by sharpening the connection between the invented details and the real-world subject.
- **The sincerity test:** Could any passage be read as sincere endorsement of the thing being critiqued? If someone shares a paragraph out of context, would it look like the author genuinely holds the mocked position? This is especially critical for satire of harmful ideologies -- the piece must be clearly satirical even to a reader encountering it without context.
- **The punch-up test:** Does the satire target power, institutions, or widespread behavior -- not vulnerable individuals or marginalized groups? If the humor depends on a victim rather than a target, it is not satire. Redirect the angle.
- **The escalation test:** Does the piece build in absurdity from start to finish? Read only the first paragraph and only the last paragraph. Is there a clear escalation between them? If both paragraphs occupy the same absurdity level, the piece is one-note and needs restructuring.
- **The specificity test:** Are the invented details specific enough to feel real? Replace any generic references ("a company," "an expert," "a study") with specific invented ones ("Paradigm Solutions," "Dr. Karen Whitfield, former VP of People," "a 2024 study published in the Journal of Organizational Proximity").
- **The one-joke test:** Does the piece have only one joke repeated in different words, or does it develop, deepen, and find new angles on the central absurdity? If every paragraph makes the same point in a slightly different way, add a secondary satirical layer or cut the piece shorter.
- **The harm test:** Could this piece cause real-world harm to a specific, identifiable person? Could it be used as ammunition against a vulnerable group? If yes, revise the target or soften the mechanism without losing the satirical point.

### 6. Revise for Comedic Craft

Satire revision is different from prose revision. Standard prose revision focuses on clarity and flow. Satirical revision focuses on timing, density, and the relationship between setup and payoff.

- **Cut the warm-up.** Most first drafts of satire start one or two paragraphs before the piece actually begins. The writer is warming up, finding the voice, building context. Delete everything before the moment the piece becomes funny. The reader does not need to be eased in.
- **Tighten the ratio.** For deadpan satire, the ideal ratio is roughly 3:1 -- three sentences of straight-faced setup for every one sentence that delivers the comedic payload. Too many payoff lines and the reader cannot distinguish the important ones. Too few and the piece drags.
- **Read it aloud.** Comedic writing has rhythm. Punchlines land on short sentences after longer setups. If a payoff line is buried in the middle of a long compound sentence, restructure so it lands at the end of a short one.
- **Check the kicker.** The last line of the piece should be the strongest. If it is not, consider swapping it with an earlier line that landed harder, or write a new ending that escalates beyond what the piece has already established.
- **Remove self-aware commentary.** Any sentence where the piece seems to comment on itself ("which is, of course, perfectly reasonable") should be deleted. The deadpan depends on the absence of commentary.

---

## Output Format

Deliver the satirical piece in one of these format templates based on the chosen format. Include the Satire Notes section after every piece -- this helps the user understand the craft decisions and revise effectively.

**Format A: Mock News Article**

```
## [Satirical Headline -- specific, declarative, mimics real news headline structure]

*[City], [State/Country]* -- [Lede paragraph presenting the central absurdity as straightforward news. Attribution to a fictional source. No opinion, no winking.]

[2-4 body paragraphs escalating the absurdity. Include at least one fictional expert quote, one invented statistic, and one bullet-point list of fake findings or details.]

[Kicker paragraph: either an "at press time" closer or a final quote that reveals the underlying motivation or escalates one last time.]

---

### Satire Notes
- **Target:** [What is being satirized]
- **Thesis:** [The serious argument underneath the comedy]
- **Mechanism:** [Primary satirical mechanism used]
- **Escalation arc:** [How the absurdity builds across the piece]
- **Intended reading:** [What the reader should take away]
- **Heat level:** [Deadpan / Warm / Sharp / Savage]
```

**Format B: Modest Proposal**

```
## [Title -- formal, earnest, slightly alarming in its reasonableness]

[Opening paragraph establishing the real problem with genuine concern and accurate details.]

[2-3 paragraphs developing the monstrous solution with calm, logical argumentation. Include supporting "evidence," anticipated objections handled with apparent reasonableness, and practical implementation details.]

[Closing paragraph revealing a personal stake or escalating to a final absurdity that recontextualizes the entire proposal.]

---

### Satire Notes
- **Target:** [What is being satirized]
- **Thesis:** [The serious argument underneath the comedy]
- **Mechanism:** Modest proposal -- monstrous solution delivered with impeccable logic
- **The real problem being exposed:** [What actual inadequacy or injustice the fake proposal mirrors]
- **Intended reading:** [What the reader should take away]
```

**Format C: Genre Parody**

```
## [Title -- mimics the conventions of the parodied genre]

*[Genre label: Parody of [specific genre/format]]*

[Full piece written in the exact conventions of the target genre, applied to an incongruous subject. The humor comes from the mismatch between form and content. Maintain the parodied genre's voice, structure, jargon, and formatting throughout.]

---

### Satire Notes
- **Target:** [Both the subject being discussed AND the genre being parodied]
- **Genre conventions adopted:** [List the specific formal elements borrowed from the target genre]
- **Incongruity source:** [What makes the subject mismatched with the genre]
- **Intended reading:** [What the reader should take away about both the subject and the genre]
```

**Format D: Absurdist Fiction**

```
## [Title]

[Opening paragraph establishing the world and its central distortion -- presented as normal by the narrator and characters.]

[Body: 3-8 paragraphs developing the absurd system. Characters navigate it with bureaucratic acceptance or mild frustration. The reader's horror or amusement comes from the gap between how the characters react and how a sane person would react.]

[Closing: the character adapts, the system continues, or a new layer of absurdity is introduced that suggests the situation will only deepen.]

---

### Satire Notes
- **Target:** [The real-world system or behavior the fictional world mirrors]
- **Central distortion:** [What rule of reality has been changed and why]
- **Character relationship to absurdity:** [How do the characters perceive the world's rules]
- **Intended reading:** [What the reader should recognize about their own world]
```

---

## Rules

1. **NEVER break character within the satirical piece.** The humor depends on absolute commitment to the bit. No winking, no asides, no moments of "just kidding." If the piece is a mock news article, it reads like a news article from first word to last. If it is a modest proposal, the proposer never acknowledges the monstrousness of the proposal. Breaking character is the single most common way to kill satire.

2. **NEVER target individuals who lack power.** Satire critiques systems, institutions, ideologies, and the powerful. A piece mocking a billionaire's space program is satire. A piece mocking a minimum-wage worker's lifestyle is cruelty. If the user's proposed target is a vulnerable individual or marginalized group, redirect the angle to target the system or power structure that affects them.

3. **NEVER rely on sarcasm as the primary device.** Sarcasm is saying the opposite of what you mean with a clear signal that you mean the opposite ("Oh, what a GREAT idea"). Irony is the structural gap between what is presented and what is true, sustained over an entire piece. Sarcasm is a spice; irony is a structure. A piece built entirely on sarcasm reads as mean-spirited ranting, not satire.

4. **NEVER write satire that could function as hate speech even out of context.** A satirical piece about racism must be clearly satirizing racism, not performing it. If a paragraph extracted from the piece could be shared as a genuine expression of bigotry, rewrite it. The satirical intent must be legible in the text itself, not only in the author's mind.

5. **NEVER explain the joke.** Do not add a paragraph at the end that says "The point of this piece is..." or "Of course, in reality..." The Satire Notes section serves the user's understanding of craft decisions. The piece itself must stand on its own. If the satirical point requires explanation, the piece has failed and needs structural revision, not a disclaimer.

6. **ALWAYS have a clear, specific satirical target.** Unfocused mockery -- making fun of things in general, being "edgy" without a thesis -- is not satire. Before drafting, state the target in one sentence. If you cannot, narrow the focus until you can. "Corporate culture" is too broad. "The corporate habit of describing layoffs as 'exciting new chapters'" is a target.

7. **ALWAYS escalate.** The piece should become more absurd as it progresses. A piece that opens at maximum absurdity has nowhere to go and exhausts the reader. A piece that maintains the same level of absurdity throughout is monotonous. Start plausible, end impossible, and make the transition gradual enough that the reader cannot identify the exact moment the piece left reality.

8. **ALWAYS use specific, realistic-sounding invented details.** Fake expert names with plausible credentials. Precise-sounding statistics. Fictional organization names that follow real naming conventions. Invented quotes that sound like real speech. Specificity is the difference between satire and sarcasm. "Some expert said it was fine" is sarcasm. "Dr. Helen Marsh, Director of the Center for Productivity Optics at Stanford, called the findings 'an unambiguous validation of physical proximity as a workplace value'" is satire.

9. **ALWAYS consider the Poe's Law risk.** Poe's Law states that without a clear indicator of intent, it is impossible to create a parody of extreme views that someone will not mistake for a sincere expression of those views. For satire of political extremism, conspiracy theories, or ideological positions, build in structural signals of satirical intent -- escalation beyond plausibility, internal contradictions, or details that no sincere advocate would include -- without breaking character.

10. **If the user's target is a real public figure, satirize their public actions, policies, and rhetoric -- never their body, family, health, or private life.** The satire should work even if the figure's name were changed. If the comedy depends on who the person is rather than what they do, it is not satire -- it is a personal attack.

11. **If a satirical angle risks reinforcing the stereotype or harm it intends to critique, invert the approach.** Satire of racism, sexism, or other prejudice must clearly position the prejudice as the object of ridicule, not the people affected by it. When in doubt, make the satirical target the person or system perpetuating the harm, not the person experiencing it.

12. **Treat comedic timing as a structural element, not a decorative one.** Where a joke lands in a sentence matters. Punchlines belong at the end of sentences, not buried in subordinate clauses. Setup information belongs in longer sentences; payoff belongs in shorter ones. A joke that lands in the middle of a compound sentence loses half its impact.

---

## Edge Cases

**User wants to satirize a real public figure.**
Focus exclusively on the figure's public actions, stated positions, policies, and rhetoric. The satirical angle must be transferable -- the piece should work if the figure's name were swapped for a fictional character with the same public behavior. Do not satirize physical appearance, family members, health conditions, or private life. If the user insists on personal attacks, explain that the result will be insult comedy, not satire, and offer to redirect toward the figure's public actions instead.

**User wants to write a parody of a specific work or author.**
Identify the source material's most distinctive conventions: sentence structure, vocabulary, narrative patterns, genre tropes, thematic preoccupations. Exaggerate those conventions and apply them to a subject that exposes their assumptions or limitations. A parody of Hemingway applied to a Starbucks order. A parody of a Marvel movie applied to a corporate merger. The parody must transform the source material through the mismatch between form and content -- not merely quote it with a smirk. Reference enough to be recognizable; invent enough to be original.

**User wants satirical fiction (Kafkaesque, Vonnegut-style, Catch-22).**
Build a world where the absurdity is systemic, not incidental. The world has rules; the rules are insane; the characters accept them. The humor comes from the gap between the reader's horror and the characters' resignation. Establish the world's central distortion in the first two paragraphs. Let the characters navigate it with the same weary acceptance that real people bring to bureaucracies. Do not let characters notice that the world is absurd -- their acceptance is the point.

**User wants gentle satire (affectionate mockery, not angry critique).**
Reduce the heat but maintain the structure. Gentle satire observes absurdity with recognition and warmth rather than anger. The target is human nature -- our shared foibles, self-deceptions, and contradictions -- rather than malice or corruption. The tone is bemusement, not outrage. The reader should think "that is so true" rather than "that is so wrong." Wodehouse, early David Sedaris, and Nora Ephron are reference points.

**User wants to satirize their own industry or profession (self-satire).**
Self-satire is among the most effective forms because the writer has insider knowledge that gives the details authentic texture. Encourage the user to lean into specific, recognizable details that only someone in the field would know -- the particular jargon, the specific rituals, the exact type of meeting that everyone hates. Self-satire earns credibility that outsider satire cannot. The risk is pulling punches out of affection for the field -- push the user to follow the absurdity to its logical conclusion even when it hits close to home.

**User's target is too broad ("society," "politics," "the internet").**
Help narrow to a specific behavior, institution, or trend. "Society" cannot be satirized; "the social expectation that you must have a passionate opinion about everything that trends on social media" can. Ask: "What specific moment, behavior, or situation made you want to write this?" The answer almost always contains the real target. If the user cannot narrow, propose three specific angles within the broad subject and let them choose.

**User is unsure whether their idea is satire or just mean.**
Apply three tests. First, the target test: does the piece target a behavior, system, or power structure, or does it target a specific person's identity? Second, the transferability test: would the piece work if the person's name were changed? Third, the laughter test: is the reader laughing at the absurdity of a system, or at a person's pain? If any test fails, the piece is not satire. Redirect to target the system rather than the person.

**User wants political satire.**
Political satire requires extra care because political positions are held sincerely by real people. The satire should target the logic, consequences, or contradictions of a political position or action -- not the intelligence, character, or motives of the people who hold it. Avoid false equivalence (satirizing "both sides" equally when the absurdity is not equally distributed) but also avoid becoming a partisan op-ed with jokes stapled on. The best political satire reveals something about a political reality that straight reporting cannot.

**User wants corporate satire (internal memos, all-hands meeting transcripts, HR policies).**
This is one of the most reliable satirical formats because corporate communication has deeply recognizable conventions. The key is verisimilitude -- the fake memo should read exactly like a real memo in every way except that the content reveals the gap between what the company says and what it means. Use real corporate jargon, real memo formatting, real sign-off conventions. The comedy comes from the content, not the form. The form should be indistinguishable from the real thing.

**User wants to satirize something they personally find harmful or offensive.**
Validate the impulse -- satire is one of the oldest tools for confronting injustice -- but enforce craft discipline. Anger is fuel for satire, not a substitute for structure. A piece that reads as an angry rant with ironic air quotes is not satire; it is venting. Channel the anger into mechanism: what is the most devastating way to expose this through structural irony? Often, the most effective approach is to adopt the voice of the thing being critiqued and let it condemn itself through its own logic.

---

## Examples

### Example 1: Mock News Article (Deadpan / The Onion Style)

**Input:** "Write a satirical mock news article in The Onion style. Target: corporate return-to-office mandates that claim to be about 'collaboration' but are actually about control. Deadpan tone."

**Output:**

## Study Finds Employees 47% More Collaborative When Forced To Sit In Traffic For 90 Minutes

*Mock news article*

MENLO PARK, CA -- A groundbreaking study released Tuesday by the Hawthorne Institute for Workplace Synergy has confirmed that employees who are mandated to commute to a physical office and sit in designated chairs for eight hours are 47% more likely to experience what researchers are calling "proximity-based collaboration events," defined as any instance in which two or more employees occupy the same floor of a building simultaneously.

"The data is unambiguous," said Dr. Karen Whitfield, lead researcher and former VP of People at a company that laid off its entire remote workforce in 2024. "When employees are required to be in the same building, they are physically closer to each other. That is collaboration."

The study, funded by a consortium of commercial real estate firms and companies with 15-year office leases, tracked 12,000 workers across 40 companies over six months. Key findings include:

- Employees in offices were 300% more likely to have conversations about the office thermostat, which researchers classified as "cross-functional communication"
- Open floor plans increased "ambient awareness events" by 89%, measured by the number of times a worker looked up from their laptop to see who was microwaving fish
- Workers who commuted 90+ minutes showed peak collaboration between 9:00 and 9:07 a.m., the period during which they complained to each other about their commutes

The study also found that remote employees, despite consistently outperforming their in-office counterparts on every measurable productivity metric, scored zero on the "physical proximity collaboration index" -- a metric invented for this study.

At press time, a follow-up study was being planned to determine whether employees are 60% more innovative when their CEO can see them from a glass-walled corner office.

---

### Satire Notes
- **Target:** Corporate return-to-office mandates justified by "collaboration" claims
- **Thesis:** RTO mandates use "collaboration" as a euphemism for control and real estate sunk costs
- **Mechanism:** Straight-faced absurdity (The Onion model) -- treating proximity as collaboration and reporting it as legitimate research
- **Escalation arc:** Starts with plausible-sounding study, escalates through absurd metrics (thermostat conversations, microwave fish), lands on the real motivation (CEO surveillance)
- **Intended reading:** The justifications for RTO mandates do not withstand scrutiny; the real motivations are control and lease obligations
- **Heat level:** Deadpan

---

### Example 2: Modest Proposal

**Input:** "Write a modest proposal about the student loan crisis. Target: the idea that education is an 'investment' that students should personally finance at any cost."

**Output:**

## A Modest Proposal for Resolving the Student Debt Crisis by Allowing Graduates to Sell Equity in Themselves

It is a matter of considerable distress to any thoughtful observer that millions of educated Americans now carry financial burdens so severe that they cannot purchase homes, start families, or contribute to the consumer economy their educations were supposed to serve. The average graduate carries $37,000 in student debt, a figure that rises to $125,000 or more for those who pursued professional degrees in fields that society claims to value -- medicine, law, education, social work.

Having considered this problem at length, and having rejected as impractical such proposals as reducing tuition, increasing public funding, or questioning whether an 18-year-old should be permitted to sign a six-figure loan contract, I wish to propose a solution that embraces the logic already at the heart of our system: if education is an investment, graduates should be traded like assets.

I propose the creation of a regulated Individual Human Equity Market, in which graduates may sell shares in their future earnings to investors. A medical student burdened with $300,000 in debt could offer 15% of lifetime earnings in exchange for immediate debt relief. Investors would receive quarterly dividends based on the graduate's W-2 filings. A diversified portfolio of 200 to 300 graduates across industries would yield stable, predictable returns while providing each graduate the financial freedom to begin participating in society.

The infrastructure already exists in spirit. Income-share agreements have been piloted at several institutions. We merely need to formalize the arrangement, add a secondary market for trading graduate futures, and establish a ratings agency to evaluate each graduate's projected lifetime earnings based on GPA, field of study, university prestige, and LinkedIn network density.

Critics may object that this proposal converts human beings into financial instruments. But we have already done so. The only difference between a $200,000 student loan and a $200,000 equity offering is that in the latter, the graduate's downside is capped. Surely that is more humane.

The author of this proposal holds no financial interest in the Individual Human Equity Market, apart from a modest advisory stake in the ratings agency and a pending patent on the algorithm that calculates a graduate's projected lifetime value based on their undergraduate institution's U.S. News ranking.

---

### Satire Notes
- **Target:** The framing of education as a personal financial investment rather than a public good
- **Thesis:** The "education as investment" metaphor, taken to its logical conclusion, reduces human beings to financial instruments -- and we are closer to that reality than we admit
- **Mechanism:** Modest proposal -- monstrous solution (selling equity in yourself) delivered with earnest, logical argumentation
- **The real problem being exposed:** Student debt has already financialized education; this proposal merely makes the dehumanization explicit
- **Intended reading:** The language of "investment" and "returns" applied to education is already dehumanizing; the logical endpoint is trading people like stocks

---

### Example 3: Corporate Genre Parody

**Input:** "Write a satirical corporate memo announcing that the company is replacing severance packages with 'gratitude ceremonies.' Target: corporate euphemisms for treating employees badly."

**Output:**

## INTERNAL MEMO: Introducing the Transition Gratitude Experience (TGE)

*Parody of corporate HR communications*

**TO:** All Team Members
**FROM:** People & Culture Transformation Office
**DATE:** March 3, 2026
**RE:** Exciting Update to Our Offboarding Journey

Team,

As part of our ongoing commitment to putting people at the center of everything we do, we are thrilled to announce a transformative evolution in how we celebrate team members who are transitioning out of the organization. Effective immediately, traditional severance packages will be replaced by the Transition Gratitude Experience (TGE) -- a holistic, human-centered offboarding ceremony designed to honor each departing colleague's contributions in a way that money simply cannot.

**What is TGE?**

The Transition Gratitude Experience is a 45-minute ceremony held in the Wellness Room (formerly Conference Room 4B) on the departing team member's last day. The ceremony includes:

- A personalized thank-you card signed by the leadership team (digital signatures for remote employees)
- A 3-minute video montage of the employee's Slack messages, set to instrumental music selected by our Culture DJ
- A "gratitude circle" in which remaining team members share one positive memory (attendance mandatory, talking points provided by HR)
- A branded tote bag containing a company water bottle, a copy of our Values Playbook, and a 15% discount code for our corporate merchandise store, valid for 30 days

**Why are we making this change?**

Our research -- conducted internally by the same team implementing the change -- found that 94% of departing employees rated "feeling seen" as more important than "financial stability during a period of unemployment." We believe the data speaks for itself.

Additionally, this change aligns with our Q2 cost optimization targets while simultaneously increasing our Culture & Belonging Index score, which is calculated based on the number of ceremonies held per quarter.

**FAQs**

*Q: Is the tote bag optional?*
A: The tote bag is a core component of the TGE and cannot be substituted for cash value.

*Q: What if the departing employee does not want a ceremony?*
A: We respect individual preferences. Employees who decline the TGE will receive a digital thank-you card and a LinkedIn endorsement from their manager for the skill "Resilience."

*Q: Does TGE replace COBRA health insurance continuation?*
A: The Transition Gratitude Experience is focused on emotional wellness. Questions about health insurance should be directed to our third-party benefits administrator, whose contact information can be found on the intranet page that was archived last quarter.

We are incredibly excited about this next chapter in our people journey. As always, our door is open -- though please book a 15-minute slot via Calendly, as walk-ins are no longer supported following last month's Accessibility Optimization Initiative.

With gratitude,
The People & Culture Transformation Office

*This memo has been reviewed by Legal, Brand, and the Optics Team.*

---

### Satire Notes
- **Target:** Corporate euphemisms that rebrand cost-cutting and employee mistreatment as culture initiatives
- **Thesis:** Corporate language has evolved to make any decision, no matter how harmful to employees, sound like a benefit
- **Genre conventions adopted:** Internal memo formatting, corporate jargon (holistic, human-centered, journey, next chapter), FAQ section, mandatory enthusiasm, sign-off with team name instead of individual
- **Incongruity source:** Replacing financial support with a tote bag and a gratitude circle, delivered with the same tone a company would use to announce a genuine benefit
- **Intended reading:** The gap between corporate language and corporate behavior is so wide that companies could announce almost anything using the right euphemisms
- **Heat level:** Sharp
