---
name: legal-eula
description: Generate an End-User License Agreement (EULA) - license grant, restrictions, ownership, warranty disclaimer, app-store-specific addenda (Apple App Store / Google Play). Distinct from Terms of Service. Templates only - not legal advice. Have an attorney review before publication.
slash_command: false
attribution:
  lineage: "Wayland Business Suite (Original)"
metadata:
  wayland:
    tags: [eula, app-store, legal, smb, business]
---

> **Templates only - not legal advice.** Have an attorney review before signing or distributing.

# Legal - End-User License Agreement (EULA)

Generate an EULA for software (desktop, mobile, SaaS). An EULA grants a **license to the software**; a Terms of Service (ToS) governs **service use and account**. Many SMBs conflate them - they are different documents. Apple App Store and Google Play **require** developers to either accept the platform's standard EULA OR provide their own EULA that meets minimum platform terms. ToS alone does not satisfy this.

## When to use

- Distributing software (desktop installer, mobile app, hardware firmware, SDK, library)
- Publishing on Apple App Store or Google Play (custom EULA only required if you don't use the platform default; most developers benefit from their own to extend warranty/IP terms)
- Licensing a software product to enterprise customers (combine with SaaS ToS for cloud-delivered)

## When NOT to use as-is (instead of, or alongside)

- Pure SaaS with no client install → ToS may suffice; EULA optional
- Open-source distributions → use the OSS license (MIT, Apache-2.0, GPL); a separate EULA usually conflicts

## Required inputs (ask upfront)

1. **Jurisdiction (HARD GATE)** - country + state/province for governing law. **If the user does not answer after one ask, REFUSE to generate.** Reply: "I cannot generate an EULA without a governing-law jurisdiction. License-grant scope, warranty-disclaimer enforceability, and consumer-protection overrides differ sharply by jurisdiction."
2. **Software type** - desktop application / mobile app / SaaS with client install / SDK or library / firmware / browser extension / game
3. **License model** - perpetual (one-time purchase) / subscription / freemium / trial-then-paid / free-with-ads / open-core
4. **Distribution platform** - Apple App Store / Google Play / Microsoft Store / direct download / enterprise distribution / multiple
5. **User type** - consumer / business / both
6. **Geography of users** - US-only / EU / UK / global
7. **Commercial use allowed?** - personal-only / commercial / per-seat / per-device
8. **Number of installs/devices per license** - 1 / 3 / unlimited / per-seat
9. **Sublicensing / redistribution allowed?** - usually no, but SDKs/libraries often allow internal use
10. **Reverse engineering, decompilation prohibited?** - typically yes, except where statutorily permitted
11. **Auto-update mechanism?** - yes/no (drives consent language)
12. **Data collection by the software?** - yes (refer to separate Privacy Policy) / no
13. **Company legal name and address**

## Workflow

### Step 1: Confirm inputs

Echo back. **If jurisdiction is missing, refuse to generate** and re-ask. Other unknowns may be marked `[TO BE COMPLETED]`.

### Step 2: Select section bundle

Always include:

1. License grant (scope, term, exclusivity)
2. License restrictions (no reverse engineering, no transfer, no commercial use beyond grant)
3. Ownership and IP (Licensor retains all rights; user gets a license, not a sale)
4. Updates and modifications
5. User data and Privacy Policy reference
6. Third-party components and open-source notices
7. Warranty disclaimer ("AS IS")
8. Limitation of liability
9. Indemnification (often by user for misuse)
10. Termination (auto-termination on breach; license reverts)
11. Export controls (US Export Administration Regulations; sanctioned-country prohibition)
12. Governing law and dispute resolution
13. Miscellaneous (entire agreement, severability, assignment)

Add platform-specific addenda (see Step 3).

### Step 3: Platform-specific addenda

#### Apple App Store EULA addendum (REQUIRED if distributed via App Store and you opt out of Apple's default EULA)

Apple's standard developer terms (Schedule 1 / Schedule 2) require any custom EULA to be **at least as protective** as Apple's standard EULA on the following points. Reproduce verbatim or adapt:

```
APPLE END-USER LICENSE ADDENDUM

This Addendum applies to App Store distribution.

1. Acknowledgement. The Parties acknowledge this License Agreement is between Licensor and the End User only, and not with Apple, Inc. ("Apple"). Licensor, not Apple, is solely responsible for the licensed application and its content.

2. Scope of License. The license granted to End User is limited to a non-transferable license to use the licensed application on any Apple-branded products that End User owns or controls and as permitted by the Usage Rules set forth in the Apple Media Services Terms and Conditions, except that the licensed application may be accessed and used by other accounts associated with the purchaser via Family Sharing or volume purchasing.

3. Maintenance and Support. Licensor is solely responsible for providing any maintenance and support services. Apple has no obligation whatsoever to furnish any maintenance or support services.

4. Warranty. Licensor is solely responsible for any product warranties, whether express or implied by law, to the extent not effectively disclaimed. In the event of any failure of the licensed application to conform to any applicable warranty, End User may notify Apple, and Apple will refund the purchase price. To the maximum extent permitted by applicable law, Apple has no other warranty obligation whatsoever.

5. Product Claims. Licensor (not Apple) is responsible for addressing any End User or third-party claims relating to the licensed application or End User's possession and/or use of it, including but not limited to: (i) product liability claims; (ii) any claim that the licensed application fails to conform to any applicable legal or regulatory requirement; and (iii) claims arising under consumer protection, privacy, or similar legislation, including in connection with the licensed application's use of HealthKit and HomeKit frameworks.

6. Intellectual Property Rights. In the event of any third-party claim that the licensed application or End User's possession and use of that licensed application infringes that third party's intellectual property rights, Licensor (not Apple) will be solely responsible for the investigation, defense, settlement, and discharge of any such intellectual property infringement claim.

7. Legal Compliance. End User represents and warrants that (i) End User is not located in a country that is subject to a U.S. Government embargo, or that has been designated by the U.S. Government as a "terrorist supporting" country; and (ii) End User is not listed on any U.S. Government list of prohibited or restricted parties.

8. Developer Contact Information. End User may direct questions, complaints, or claims regarding the licensed application to: [LICENSOR LEGAL NAME], [ADDRESS], [EMAIL].

9. Third-Party Terms of Agreement. End User must comply with applicable third-party terms of agreement when using the licensed application.

10. Third-Party Beneficiary. The Parties acknowledge that Apple and Apple's subsidiaries are third-party beneficiaries of this EULA, and that, upon End User's acceptance, Apple will have the right (and will be deemed to have accepted the right) to enforce this EULA against End User as a third-party beneficiary.
```

Confirm against current Apple Developer Program License Agreement Schedule terms - Apple updates these periodically.

#### Google Play addendum (REQUIRED if distributed via Google Play)

```
GOOGLE PLAY END-USER LICENSE ADDENDUM

This Addendum applies to Google Play distribution.

1. End User must comply with the Google Play Terms of Service in addition to this License.
2. The license granted does not permit redistribution outside Google Play except as expressly permitted.
3. End User may not use the application in violation of the Google Play Developer Program Policies, including the Restricted Content Policy.
4. Refunds are governed by the Google Play refund policy and applicable consumer-protection law of End User's jurisdiction.
5. Licensor's contact information for support: [LICENSOR LEGAL NAME], [ADDRESS], [EMAIL].
```

#### Microsoft Store addendum (if applicable)

Reference Microsoft's Standard Application License Terms; ensure any custom EULA is no less protective for End User.

### Step 4: Generate the EULA - verbatim canonical clauses

Reproduce the sections below verbatim, replacing bracketed placeholders.

#### 1. License Grant

```
Subject to End User's compliance with this Agreement and payment of any applicable fees, Licensor grants End User a [non-exclusive / non-transferable / revocable / limited / personal] license to install and use the Software on [SCOPE - e.g., one (1) device owned or controlled by End User] solely for End User's [personal / internal business] use, for the [term - perpetual / subscription period] specified at the time of license acquisition.

This license is a license, not a sale. Licensor and its licensors retain all right, title, and interest in and to the Software, including all intellectual property rights.
```

#### 2. License Restrictions

```
Except as expressly permitted by this Agreement or by mandatory applicable law, End User shall not, and shall not permit any third party to:

(a) copy, modify, or create derivative works of the Software;
(b) distribute, sublicense, lease, rent, lend, or transfer the Software to any third party;
(c) reverse engineer, decompile, or disassemble the Software, except to the extent expressly permitted by applicable law (e.g., EU Software Directive 2009/24/EC Art. 6 for interoperability);
(d) remove, alter, or obscure any proprietary notices on the Software;
(e) use the Software to develop a competing product;
(f) use the Software in violation of applicable export-control laws (US EAR, OFAC sanctions, EU dual-use); or
(g) use the Software for any unlawful purpose.
```

#### 3. Updates and Modifications

```
Licensor may, at its discretion, provide updates, patches, bug fixes, or new versions of the Software ("Updates"). Updates may modify or remove features. End User authorizes Licensor to deliver Updates automatically; End User may opt out of automatic Updates only as expressly provided in the Software's settings, but unsupported versions may cease to function or be entitled to support. Updates are governed by this Agreement unless accompanied by a separate license, in which case the separate license controls for the Updates.
```

#### 4. Ownership

```
The Software is licensed, not sold. Licensor and its licensors own all right, title, and interest in and to the Software, including all copyrights, patents, trademarks, trade secrets, and other intellectual property rights. Nothing in this Agreement transfers any ownership interest to End User. End User's only rights in the Software are those expressly granted in Section 1.
```

#### 5. Third-Party Components

```
The Software may include third-party software components, including open-source software, governed by separate license terms. Those terms, including any required notices, are listed in [LOCATION - e.g., the Software's "About" screen or accompanying NOTICES file]. To the extent any third-party license conflicts with this Agreement, the third-party license controls only with respect to that component.
```

#### 6. Privacy

```
Licensor's collection and use of personal data in connection with the Software is governed by Licensor's Privacy Policy, available at [URL], which is incorporated herein by reference.
```

#### 7. Warranty Disclaimer

```
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, THE SOFTWARE IS PROVIDED "AS IS" AND "AS AVAILABLE," WITHOUT WARRANTY OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE. LICENSOR DISCLAIMS ALL WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, AND ANY WARRANTY ARISING OUT OF COURSE OF DEALING OR USAGE OF TRADE. LICENSOR DOES NOT WARRANT THAT THE SOFTWARE WILL BE UNINTERRUPTED, ERROR-FREE, SECURE, OR FREE OF VIRUSES OR HARMFUL COMPONENTS.

[For EU consumers: Nothing in this Section excludes any non-disclaimable statutory rights. Under the EU Sale of Goods Directive 2019/771 and Digital Content Directive 2019/770, certain warranty rights are mandatory and cannot be waived.]
```

#### 8. Limitation of Liability

```
TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL LICENSOR BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR FOR LOST PROFITS, LOST DATA, BUSINESS INTERRUPTION, OR LOSS OF GOODWILL, ARISING OUT OF OR RELATING TO THIS AGREEMENT OR THE SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

LICENSOR'S AGGREGATE LIABILITY ARISING OUT OF OR RELATING TO THIS AGREEMENT SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNTS PAID BY END USER FOR THE SOFTWARE IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM OR (B) [USD $50.00].

SOME JURISDICTIONS DO NOT ALLOW THE LIMITATION OR EXCLUSION OF CERTAIN DAMAGES; THE FOREGOING LIMITATIONS APPLY TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW. NOTHING IN THIS SECTION LIMITS LIABILITY FOR DEATH, PERSONAL INJURY, FRAUD, OR GROSS NEGLIGENCE WHERE SUCH LIMITATION IS PROHIBITED BY LAW.
```

#### 9. Indemnification (by user)

```
End User agrees to indemnify, defend, and hold harmless Licensor and its officers, employees, and affiliates from any claims, losses, damages, and expenses (including reasonable attorneys' fees) arising out of (a) End User's misuse of the Software, (b) End User's breach of this Agreement, or (c) End User's violation of applicable law in connection with the Software.
```

#### 10. Term and Termination

```
This Agreement is effective until terminated. End User's rights automatically terminate without notice if End User fails to comply with any term of this Agreement. Upon termination, End User shall cease all use of the Software and destroy all copies in End User's possession or control. Sections [Ownership, Warranty Disclaimer, Limitation of Liability, Indemnification, Governing Law, Miscellaneous] survive termination.
```

#### 11. Export Controls

```
End User shall not export, re-export, or transfer the Software in violation of any applicable export-control law, including the U.S. Export Administration Regulations and U.S. Office of Foreign Assets Control sanctions, and the European Union dual-use regulation. End User represents and warrants that End User is not located in any country subject to a comprehensive U.S. embargo and is not on any U.S. Government list of prohibited or restricted parties.
```

#### 12. Governing Law and Dispute Resolution

```
This Agreement shall be governed by the laws of [JURISDICTION - required input], without regard to conflict-of-laws principles. [Insert dispute-resolution clause matching consumer/B2B and jurisdiction - see legal-tos for the matrix.]
```

#### 13. Miscellaneous

```
This Agreement is the entire agreement between Licensor and End User regarding the Software and supersedes all prior or contemporaneous communications. No amendment is effective unless in writing or accepted electronically through Licensor's update mechanism. If any provision is unenforceable, the remainder continues in effect. Licensor's failure to enforce any right is not a waiver. End User may not assign this Agreement; Licensor may assign on notice. This Agreement may be executed in counterparts, including by electronic acceptance.
```

#### 14. Contact

```
Licensor: [LEGAL NAME]
Address: [ADDRESS]
Email: [SUPPORT EMAIL]
```

#### 15. App-Store Addenda

Append the Apple, Google, or Microsoft addenda from Step 3 as applicable.

### Step 5: Save

Save to `build_report_path("business-legal", "eula-<product>-<date>.md")`.

### Step 6: Tell the user the next steps

1. Counsel review - especially the warranty-disclaimer and limitation-of-liability sections (these are most likely to be challenged in EU/UK consumer disputes).
2. Verify the App Store / Play Store addenda against current platform terms (these change).
3. Confirm the Privacy Policy URL is live before publishing.
4. Add a click-through accept flow for desktop installers (browser-wrap is weaker than click-wrap; *Specht v. Netscape*, 306 F.3d 17 (2d Cir. 2002)).
5. Calendar an annual review.

## Output footer (REQUIRED on every generated document)

End every generated EULA with this block, verbatim:

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

> _Templates only - not legal advice. Verify app-store addenda against current platform terms before publication._
