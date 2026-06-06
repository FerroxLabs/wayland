---
name: legal-dmca
description: Generate DMCA takedown notice, counter-notice, and designated-agent registration walkthrough - 17 USC §512(c)(3) elements, dmca.copyright.gov registration, repeat-infringer policy template. Templates only - not legal advice. Have an attorney review high-stakes notices.
slash_command: false
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [dmca, ip, legal, smb, business]
---

> **Templates only - not legal advice.** Have an attorney review before signing or distributing.

# Legal - DMCA Takedown Toolkit

Three modes:

1. **Takedown notice mode** - generate a DMCA §512(c)(3) takedown notice to send to a service provider hosting infringing content
2. **Counter-notice mode** - generate a §512(g) counter-notice for the alleged infringer to push back on a takedown
3. **Designated-agent registration walkthrough** - guide a service provider through registering a DMCA agent at dmca.copyright.gov, which is **a prerequisite for §512 safe-harbor protection**

The DMCA is US federal law (17 USC §512). Some non-US jurisdictions have analogues (EU Directive on Copyright in the Digital Single Market 2019/790 Art. 17; UK CDPA; Canada Copyright Modernization Act notice-and-notice). This skill is US-centric; for non-US, surface the analogous regime and refer to local counsel.

## When to use

- Your copyrighted work is hosted on a third-party service without authorization → takedown notice
- You received a takedown notice and believe it is mistaken or fair use → counter-notice
- You operate a service that hosts user-generated content and want §512 safe harbor → designated-agent registration

## When NOT to use as-is

- Defamation, trade-secret misappropriation, or trademark claims - DMCA §512 does not cover these. Use `legal-cease-and-desist` instead.
- High-volume / commercial-scale infringement - engage litigation counsel immediately; takedown is just the starting move.
- Children's privacy or content-moderation issues - different framework.
- Knowingly false takedown notices - §512(f) creates liability for misrepresentation. *Lenz v. Universal*, 815 F.3d 1145 (9th Cir. 2016) requires good-faith fair-use consideration before sending.

## Required inputs (ask upfront)

Common to all modes:

1. **Jurisdiction** - default US (DMCA is US federal); flag non-US scenarios prominently and route to local counsel
2. **Mode** - takedown / counter-notice / agent-registration

For takedown mode, additionally:

3. **Copyright holder identity** - name, contact info, agent-of-record if any
4. **Copyrighted work** - description, URL/registration number if registered with US Copyright Office, date of creation
5. **Infringing material location** - URLs (specific pages, not just the host root)
6. **Service provider receiving the notice** - name + designated-agent contact (find at dmca.copyright.gov/list)
7. **Good-faith and fair-use evaluation** - confirm the user has considered whether the use is fair (this is required by *Lenz v. Universal*)

For counter-notice mode:

8. **Original takedown notice received** - full text + claim ID
9. **User identity** - name, address, phone, email
10. **Basis for counter-notice** - mistaken identity / fair use / authorized use / non-infringing material
11. **Consent to jurisdiction** - counter-notice REQUIRES the user consent to federal court in their district (or in the case of foreign users, in the jurisdiction where the service provider is located)

For agent-registration mode:

12. **Service provider name and address**
13. **Designated agent** - individual or entity that will receive notices
14. **Agent contact details** - name, organization, mailing address, phone, email
15. **Service URL(s) where the agent contact will be displayed**

## Workflow - Takedown notice mode

### Step 1: Confirm fair-use / good-faith review

Ask the user to confirm:
- "Have you considered whether the use of your copyrighted material might qualify as fair use under 17 USC §107 (purpose, nature, amount, market effect)?"
- "Are you the copyright holder or authorized to act on the holder's behalf?"

If user is unsure about fair use, surface the *Lenz v. Universal* requirement and recommend attorney review before sending. Do not refuse to generate but make the warning prominent in the output.

### Step 2: Locate the designated agent

Tell the user: "DMCA notices must be sent to the service provider's **designated agent**, registered at https://dmca.copyright.gov/list - not to a generic support address. Confirm the agent contact before sending."

If the user does not have the agent contact, run a `web_extract` against dmca.copyright.gov/list?searchType=name with the service provider's name.

### Step 3: Generate the takedown notice - verbatim canonical text

Reproduce verbatim:

```
DMCA TAKEDOWN NOTICE

To: [Designated Agent Name], DMCA Designated Agent
[Service Provider Name]
[Designated Agent Mailing Address]
[Designated Agent Email]

Date: [DATE]

Re: Notice of Infringement Pursuant to 17 U.S.C. §512(c)(3)

Dear DMCA Agent:

I am writing pursuant to the Digital Millennium Copyright Act, 17 U.S.C. §512(c)(3), to provide notice of copyright infringement. The information below is provided in good faith and is accurate to the best of my knowledge under penalty of perjury.

1. Identification of the copyrighted work claimed to have been infringed:
[DESCRIPTION OF COPYRIGHTED WORK - title, type (image / video / text / software), date of creation, U.S. Copyright Office registration number if registered, and a representative example or URL where the original work is published.]

2. Identification of the material that is claimed to be infringing and that is to be removed:
[SPECIFIC URL(s) of infringing material on the service provider's platform - list each URL separately. Be specific; "their whole site" is not sufficient.]

3. Information reasonably sufficient to permit the service provider to contact me:
Name: [COMPLAINANT NAME]
Address: [STREET ADDRESS]
Phone: [PHONE]
Email: [EMAIL]

4. Statement of good-faith belief:
I have a good-faith belief that the use of the material in the manner complained of is not authorized by the copyright owner, its agent, or the law.

5. Statement of accuracy and authority (under penalty of perjury):
I state, under penalty of perjury, that the information in this notice is accurate, and that I am the copyright owner or am authorized to act on behalf of the owner of an exclusive right that is allegedly infringed.

6. Signature:
[ELECTRONIC OR PHYSICAL SIGNATURE OF THE COPYRIGHT OWNER OR AUTHORIZED PERSON]

[NAME, TITLE if signing on behalf of an entity]
```

Include the §512(f) misrepresentation warning in the cover note (but not in the notice itself):

> **§512(f) WARNING**: Knowingly material misrepresentations in a takedown notice expose the sender to liability for damages, costs, and attorneys' fees under 17 U.S.C. §512(f). *Lenz v. Universal Music Corp.*, 815 F.3d 1145 (9th Cir. 2016) requires good-faith fair-use consideration before sending. Do not send this notice if you have not evaluated fair use in good faith.

### Step 4: Save

Save to `build_report_path("business-legal", "dmca-takedown-<service>-<date>.md")`.

## Workflow - Counter-notice mode

### Step 1: Eligibility check

Ask:
- Is the material the user posted actually theirs, licensed to them, fair use, or otherwise non-infringing?
- Is the user willing to consent to federal-court jurisdiction in the district where the user resides (US users) OR where the service provider is located (foreign users)?

If the answer to either is no, REFUSE and recommend attorney consultation.

Surface §512(f) symmetrically: a knowingly false counter-notice also creates liability.

### Step 2: Generate the counter-notice - verbatim

```
DMCA COUNTER-NOTICE

To: [Designated Agent Name], DMCA Designated Agent
[Service Provider Name]
[Designated Agent Mailing Address]
[Designated Agent Email]

Date: [DATE]

Re: Counter-Notification Pursuant to 17 U.S.C. §512(g)(3) - [Original Takedown Claim ID or reference]

Dear DMCA Agent:

I am submitting this counter-notification pursuant to the Digital Millennium Copyright Act, 17 U.S.C. §512(g)(3), in response to a takedown notice received concerning the material identified below.

1. Identification of the material removed or disabled and its prior location:
[DESCRIPTION OF MATERIAL - title, content type - and the URL(s) at which it appeared before removal or disabling.]

2. Statement under penalty of perjury that I have a good-faith belief that the material was removed or disabled as a result of mistake or misidentification:
I have a good-faith belief that the material identified above was removed or disabled as a result of mistake or misidentification of the material to be removed or disabled.

3. My contact information:
Name: [USER NAME]
Address: [STREET ADDRESS]
Phone: [PHONE]
Email: [EMAIL]

4. Consent to jurisdiction:
I consent to the jurisdiction of the United States District Court for [the federal judicial district in which I reside / for any judicial district in which the service provider may be found, if I am located outside the United States - Northern District of California is common for major US service providers], and I will accept service of process from the person who provided the original takedown notice or from an agent of that person.

5. Signature:
I declare under penalty of perjury that the foregoing is true and correct.

[ELECTRONIC OR PHYSICAL SIGNATURE]

[NAME]
```

### Step 3: Tell the user the consequences

After receiving a valid counter-notice, the service provider must:
1. Promptly forward the counter-notice to the original notice sender.
2. Restore the material in not less than 10 and not more than 14 business days, **unless** the original sender notifies the service provider that they have filed a federal-court action against the user.

Surface this so the user knows what to expect.

### Step 4: Save

Save to `build_report_path("business-legal", "dmca-counter-<service>-<date>.md")`.

## Workflow - Designated-agent registration

### Step 1: Confirm eligibility

Service providers eligible for §512 safe harbor include:
- Mere conduit (§512(a)) - ISPs / network providers
- System caching (§512(b))
- Information storage (§512(c)) - most user-generated-content services
- Information location tools (§512(d)) - search engines

For §512(c) and (d) safe harbor, **registering a designated agent at dmca.copyright.gov is mandatory**. Also required: a published policy that addresses repeat infringers (see Step 3).

### Step 2: Walk through the registration

Tell the user the current process (verify against https://dmca.copyright.gov/ before each registration - process and fees update):

1. Create an account at https://dmca.copyright.gov/ (separate from the older paper-form system; that system is no longer accepted).
2. Pay the filing fee (currently $6 per registration as of recent rules; verify at registration time).
3. Provide the following:
   - Service provider's full legal name and any alternate names
   - Physical address
   - The designated agent's name (or the title or function of an entity, e.g., "DMCA Agent")
   - Designated agent's full mailing address (P.O. boxes accepted only with a physical alternate)
   - Designated agent's phone number
   - Designated agent's email address
   - URL(s) of the service provider's website(s)
4. **Renewal**: registration must be renewed every 3 years. Calendar a renewal reminder at registration time.
5. **Public display**: the designated-agent contact information must also be conspicuously published on the service provider's website (typically in a /dmca, /copyright, or footer-link location).

### Step 3: Generate the repeat-infringer policy template

§512(i) requires service providers to "adopt and reasonably implement" a policy for terminating repeat infringers in appropriate circumstances. Generate verbatim:

```
[SERVICE PROVIDER NAME] - REPEAT INFRINGER POLICY

Effective: [DATE]

This Repeat Infringer Policy is adopted pursuant to 17 U.S.C. §512(i) and applies to all users of [SERVICE NAME].

1. Notice of Infringement. Copyright holders may submit DMCA takedown notices under §512(c)(3) to our Designated Agent at [AGENT EMAIL / ADDRESS]. Notices must include the elements required by §512(c)(3).

2. Counter-Notification. Users whose material has been removed or disabled may submit a counter-notification under §512(g)(3). Counter-notifications must include the elements required by §512(g)(3) and consent to federal-court jurisdiction.

3. Tracking Repeat Infringers. We maintain records of takedown notices and the users to whom they pertain. A user is considered a "repeat infringer" if [DEFINE - e.g., the user is the subject of three (3) substantiated takedown notices within a twelve (12) month period, or one (1) substantiated takedown notice for material that the user has previously been on notice of infringing].

4. Account Termination. We will terminate, in appropriate circumstances, the accounts of users who are repeat infringers. "Appropriate circumstances" include but are not limited to repeat substantiated takedowns, willful disregard of prior notices, and material harm to copyright holders.

5. Counter-Notification Restoration. A user who successfully submits a counter-notification under §512(g)(3) may have a takedown notice excluded from the repeat-infringer count, in our reasonable discretion.

6. Discretion. We may, in our sole discretion, terminate accounts more aggressively in cases of clear or egregious infringement.

7. Notice and Updates. We may update this Policy from time to time. The current version is posted at [URL].

Designated Agent: [AGENT NAME]
[AGENT EMAIL]
[AGENT MAILING ADDRESS]
```

Surface case-law context: *BMG v. Cox Communications*, 881 F.3d 293 (4th Cir. 2018) - a service provider lost safe harbor because it failed to "reasonably implement" its repeat-infringer policy. The policy must be applied in practice, not just on paper.

### Step 4: Save

Save to `build_report_path("business-legal", "dmca-agent-<service>-<date>.md")`.

## Non-US analogues - surface, do not generate

- **EU**: Directive 2019/790 Art. 17 imposes content-recognition obligations on large platforms; member-state implementation varies. The eCommerce Directive 2000/31/EC notice-and-takedown framework is being superseded by the Digital Services Act (Regulation 2022/2065) which adds a notice-and-action mechanism.
- **UK**: Copyright, Designs and Patents Act 1988; specialist solicitor.
- **Canada**: Copyright Modernization Act - notice-and-notice (forwarded to user) rather than notice-and-takedown.
- **Australia**: Copyright Act 1968 - limited safe-harbor only for educational and CCS providers.

For any non-US scenario, generate the US-style notice but flag prominently that the receiving service provider may not be subject to DMCA and route the user to local counsel.

## Output footer (REQUIRED on every generated document)

End every generated DMCA document with this block, verbatim:

```
---
**DRAFT - NOT LEGAL ADVICE**

This document was generated as a starting template. It has not been reviewed by an attorney and may not comply with applicable law in your jurisdiction. Before signing, distributing, or relying on this document, you must:

1. Have a qualified attorney licensed in your jurisdiction review and revise it.
2. Verify all clauses are enforceable under applicable law.
3. Confirm it fits your specific situation, parties, and use case.

Generated by Wayland business-legal plugin. No warranty, express or implied.
```

---

> _Templates only - not legal advice. §512(f) creates liability for knowing misrepresentations - confirm fair use and authority before sending._
