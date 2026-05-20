---
name: climate-science-explainer
description: |
  Explains climate science concepts including the greenhouse effect, feedback loops, carbon cycle, evidence types, and climate modeling basics at a level appropriate for non-scientists. Gathers the user's specific question or topic area and produces a structured educational explanation with diagrams in text form and evidence references.
  Use when the user asks about how climate change works, greenhouse gases, feedback loops, climate evidence, or the science behind global warming.
  Do NOT use for policy recommendations or advocacy, carbon footprint calculation (use carbon-footprint-estimator), sustainability action planning (use other sustainability skills), or academic research methodology.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "sustainability guide research teaching"
  category: "sustainability"
  subcategory: "sustainable-living"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Climate Science Explainer

## When to Use

**Use this skill when:**
- The user asks how climate change works mechanically -- the greenhouse effect, radiative forcing, feedback loops, or atmospheric physics
- The user wants a plain-language explanation of a specific climate science concept they encountered in news coverage, a documentary, or a conversation
- The user is a student, teacher, or curious adult who wants to understand the science behind global warming at a conceptual level, without needing to read technical papers
- The user asks about specific evidence types -- ice cores, temperature records, satellite data, ocean heat content -- and wants to understand what they show and how scientists interpret them
- The user asks about the carbon cycle, ocean acidification, sea level rise, or the relationship between CO2 and temperature
- The user wants to understand climate projections and what climate models actually are
- The user asks about why the climate is changing now, how scientists know humans are the cause, or how current changes compare to natural variability in Earth's history
- The user wants to understand specific terms they encountered: radiative forcing, albedo, tipping points, RCP/SSP pathways, equilibrium climate sensitivity, or attribution science

**Do NOT use when:**
- The user asks which climate policies to support, oppose, or vote for -- use `environmental-policy-researcher` for policy analysis
- The user wants to calculate their personal or household carbon footprint -- use `carbon-footprint-estimator`
- The user needs a sustainability action plan for their home, business, or organization -- use dedicated sustainability planning skills
- The user is asking about climate change as an academic research topic and needs peer-reviewed citation methodology, literature review frameworks, or research design guidance
- The user wants debate preparation or one-sided persuasive talking points for or against climate action -- this skill teaches science, not rhetoric
- The user is asking about specific current weather events and whether they were caused by climate change -- that requires attribution science at a technical level beyond this skill's scope
- The user asks about geoengineering proposals or climate intervention technologies as engineering projects -- those require separate technical frameworks

---

## Process

### Step 1: Establish the User's Starting Point and Specific Question

Before explaining anything, gather the minimum information needed to calibrate the response:

- **Identify the specific concept:** Is the user asking about the greenhouse effect mechanism, feedback loops, evidence and attribution, the carbon cycle, sea level rise, climate projections and models, or a general overview? Each requires a different explanation arc.
- **Gauge scientific background:** Three tiers work well -- (a) no science background at all, (b) basic science literacy (high school level), or (c) some familiarity with climate science already. Ask directly or infer from how the question is phrased.
- **Identify context:** Personal curiosity, school assignment, wanting to explain to someone else, trying to understand a specific news story, or addressing a misconception they encountered. Context shapes the tone and depth.
- **Surface any specific confusion:** If the user mentions something specific they heard -- "someone told me the sun is causing warming" or "I read CO2 is too small to matter" -- note it. Address this as evidence, not as a correction.
- **Note what NOT to cover:** If the user says they already understand the basic greenhouse effect, skip the foundational explanation and go deeper. Never re-explain what someone already knows.

---

### Step 2: Build the Core Physical Mechanism First

Always start with the greenhouse effect as the physical foundation, even if the user is asking about something downstream (like sea level rise or feedback loops). Everything else depends on understanding this mechanism.

**The greenhouse effect explained in four-step physical sequence:**

1. **Incoming solar radiation:** The sun emits energy predominantly as shortwave radiation -- visible light and near-infrared, peaking around 0.5 micrometers wavelength. Of incoming solar radiation, approximately 30% is reflected back to space by clouds (23%), ice and snow (7%), and other bright surfaces. The remaining 70% is absorbed by the surface and lower atmosphere and converted to heat.

2. **Surface emission:** The warmed surface radiates energy upward, but at a longer wavelength than incoming sunlight. Surface temperatures of 50-90F (10-32C) produce outgoing longwave infrared radiation peaking around 10 micrometers -- wavelengths entirely different from incoming sunlight. This is why the atmosphere can be largely transparent to sunlight while also trapping heat.

3. **Molecular absorption:** Greenhouse gas molecules are quantum mechanically structured to absorb specific wavelengths of infrared radiation. CO2 has strong absorption bands near 15 micrometers. Methane absorbs near 3.3 and 7.7 micrometers. Water vapor has broad absorption across much of the infrared spectrum. When a greenhouse gas molecule absorbs an infrared photon, it vibrates and re-emits the energy in a random direction -- including back toward the surface. This is not reflection; it is absorption and re-emission.

4. **Radiative equilibrium at a higher temperature:** Earth must radiate as much energy to space as it receives from the sun (energy balance). If greenhouse gases trap more outgoing radiation, the surface must warm until it radiates enough energy to restore balance. More greenhouse gases means equilibrium is reached at a higher surface temperature. This is the fundamental physics, established in laboratory measurements by Eunice Newton Foote in 1856 and John Tyndall in 1859.

**Key teaching distinctions at this stage:**
- The natural greenhouse effect (pre-industrial) is essential and beneficial -- without it, Earth's average temperature would be approximately -0.4F (-18C)
- The enhanced greenhouse effect is the additional warming from human-emitted greenhouse gases added on top of the natural effect
- The greenhouse effect analogy to an actual glass greenhouse is imperfect -- a real greenhouse works primarily by preventing convective cooling; the atmospheric greenhouse effect works through radiation absorption. A better analogy is a blanket: it does not generate heat, but it slows heat loss

---

### Step 3: Explain the Major Greenhouse Gases with Precision

Present gases with quantitative context, not just a list:

**Radiative forcing** is the key concept here -- it measures how much a gas alters the energy balance of the atmosphere, expressed in watts per square meter (W/m²). Total human-caused radiative forcing since pre-industrial times is approximately +2.7 W/m² as of 2022 (IPCC AR6).

| Gas | Chemical Formula | Contribution to Enhanced Warming | Global Warming Potential (100-yr, vs CO2) | Atmospheric Lifetime | Primary Human Sources |
|-----|-----------------|----------------------------------|-------------------------------------------|---------------------|-----------------------|
| Carbon dioxide | CO2 | ~65% | 1 (reference) | Centuries to millennia | Fossil fuel combustion, deforestation, cement production (~37 billion tonnes CO2/year currently) |
| Methane | CH4 | ~16% | ~30 | ~12 years | Livestock (~32%), fossil fuel extraction (~33%), landfills, rice paddies |
| Nitrous oxide | N2O | ~6% | ~273 | ~114 years | Nitrogen fertilizers (~70%), livestock waste, industrial processes |
| Fluorinated gases | HFCs, PFCs, SF6 | ~2% | 1,000-23,000+ | Years to millennia | Refrigerants, air conditioning, semiconductor manufacturing |
| Water vapor | H2O | Largest amplifier | Not applicable as a forcing | ~10 days (rapid turnover) | Not directly emitted -- increases as temperature rises (feedback, not forcing) |

**Key teaching point on water vapor:** Water vapor is the most abundant greenhouse gas, contributing approximately 50% of the total natural greenhouse effect. But it is a feedback, not a forcing. Humans do not add meaningful amounts of water vapor directly. Instead, warming from CO2 allows the warmer atmosphere to hold more water vapor (about 7% more per 1°C of warming, following the Clausius-Clapeyron relation), which amplifies warming further. This is why CO2 is described as the "control knob" of Earth's temperature.

---

### Step 4: Explain Feedback Loops in Full Detail

Feedback loops are often the most confusing concept for non-scientists. Use the "thermostat vs. amplifier" framing.

**Positive (amplifying) feedbacks -- these increase warming beyond the direct CO2 effect:**

- **Water vapor feedback:** The dominant amplifying feedback. Responsible for roughly doubling the warming that CO2 alone would produce. As noted above, the Clausius-Clapeyron relation means a warmer atmosphere holds more water vapor. Since water vapor is itself a potent greenhouse gas, this creates an amplifying loop. Without this feedback, equilibrium climate sensitivity (ECS) would be about 1.2°C per doubling of CO2; with all feedbacks combined, the best estimate is approximately 3°C.

- **Ice-albedo feedback:** Ice and snow have an albedo (reflectivity) of roughly 0.8-0.9 -- they reflect 80-90% of incoming sunlight. Ocean water has an albedo of about 0.06 -- it absorbs 94% of incoming sunlight. When warming melts Arctic sea ice, the dark ocean surface is exposed, absorbing far more solar energy and causing more warming. This is why Arctic temperatures have risen approximately 3-4 times faster than the global average since the 1970s -- a phenomenon called Arctic amplification.

- **Permafrost feedback:** Approximately 1.5 trillion tonnes of organic carbon (roughly twice the current atmospheric carbon stock) is stored in permafrost -- permanently frozen soil in Arctic regions. As permafrost thaws, microbial decomposition releases this stored carbon as CO2 (aerobic conditions) or methane (anaerobic conditions, e.g., waterlogged thaw lakes). This is a delayed, non-linear feedback -- once triggered, it continues even if human emissions stop.

- **Forest loss feedback:** Warming and changing precipitation patterns stress forests, increasing wildfire frequency and bark beetle outbreaks. Dying forests release stored carbon and reduce the amount of future CO2 uptake, amplifying warming further.

**Negative (stabilizing) feedbacks -- these reduce warming:**

- **Planck feedback (blackbody feedback):** The most fundamental stabilizing feedback. A warmer object radiates more energy (proportional to temperature to the fourth power, per Stefan-Boltzmann). So as Earth warms, it radiates more energy to space, eventually restoring energy balance. This is the primary reason warming stops eventually rather than escalating without limit.

- **Lapse rate feedback:** In the tropics, the atmosphere warms faster at altitude than at the surface (following moist adiabatic lapse rate). This upper-atmosphere warming increases outgoing radiation to space, providing a modest stabilizing effect at tropical latitudes.

- **CO2 fertilization (partial):** Higher atmospheric CO2 and longer growing seasons increase plant growth in some regions, causing additional carbon uptake. However, this effect is limited by water availability, nutrient cycles, and temperature stress -- it absorbs only a fraction of human emissions.

**Cloud feedbacks (uncertain -- still active research area):**
- Low clouds (below 2 km altitude, such as marine stratus and stratocumulus) reflect sunlight strongly -- a stabilizing feedback if they increase
- High clouds (cirrus, above 6 km altitude) trap outgoing longwave radiation -- an amplifying feedback if they increase or thin
- IPCC AR6 best estimate is that cloud feedbacks are net positive (amplifying), contributing approximately +0.42 W/m²/°C, but with wide uncertainty bounds

---

### Step 5: Present the Evidence Architecture

Explain evidence in terms of both what is measured and why scientists trust each line of evidence:

**Tier 1 -- Direct instrumental measurements (most direct, available since the industrial era):**

- **Surface temperature records:** Global surface temperature monitoring began systematically in the 1880s using land weather stations and ship-based ocean temperature measurements. Multiple independent research groups (NASA GISS, NOAA, Berkeley Earth, UK Met Office / Hadley Centre) analyze the raw data using different methodologies and produce highly consistent results. Global average surface temperature has increased approximately 2°F (1.1°C) since the pre-industrial baseline (1850-1900 average), with the ten warmest years on record all occurring since 2010.

- **Atmospheric CO2 concentration:** Continuous monitoring at Mauna Loa Observatory (Hawaii) since 1958, chosen for its remoteness from local pollution sources. CO2 has risen from 315 ppm in 1958 to over 422 ppm in 2024 -- a 34% increase within one human lifetime. The seasonal oscillation visible on the Keeling Curve (CO2 rises in Northern Hemisphere winter, falls in summer as vegetation absorbs it) is itself evidence that the measurements are real and tied to biological processes.

- **Ocean heat content:** The oceans absorb approximately 90% of the excess heat trapped by greenhouse gases. Argo float systems (approximately 4,000 autonomous floats measuring temperature and salinity down to 2,000 meters depth) show the global ocean has warmed measurably since the 1970s. Ocean heat content increase is considered one of the most robust measures of Earth's energy imbalance -- less subject to urban heat island or land-use change complications than surface records.

- **Sea level:** Tide gauge records since the late 1800s and satellite altimetry since 1993 (TOPEX/Poseidon and successor missions). Global mean sea level has risen approximately 8-9 inches (21-24 cm) since 1900, with the rate accelerating to approximately 3.7 mm/year currently from approximately 1.3 mm/year early in the 20th century.

**Tier 2 -- Proxy records (extending the record back beyond instruments):**

- **Ice cores:** Drilled from Antarctic ice sheets (notably the EPICA Dome C core) and Greenland. Trapped air bubbles preserve samples of ancient atmosphere. Antarctic records extend 800,000 years back through multiple glacial-interglacial cycles. Key finding: current CO2 (~422 ppm) is higher than at any point in the 800,000-year record. Pre-industrial interglacial peaks reached approximately 280-300 ppm.

- **Isotopic fingerprinting (carbon isotopes):** This is among the most compelling evidence for human causation. Fossil fuels are ancient organic carbon, depleted in the isotopes carbon-13 (¹³C) and carbon-14 (¹⁴C). As humans burn fossil fuels, the ratio of ¹³C to ¹²C in atmospheric CO2 decreases measurably -- this is called the Suess effect. Simultaneously, ¹⁴C (which decays over thousands of years) is nearly absent from fossil fuel carbon. Both of these isotopic shifts are measurable in the atmosphere and match predictions from fossil fuel emissions -- ruling out volcanic or oceanic CO2 sources, which would have different isotopic signatures.

- **Tree rings (dendroclimatology):** Annual growth rings in long-lived trees (bristlecone pines can live 5,000+ years) encode temperature and precipitation in ring width and density. Cross-referenced with instrument records to build temperature reconstructions.

- **Ocean sediment cores and foraminifera:** Microscopic marine organisms (foraminifera) build calcium carbonate shells with isotopic compositions that record ocean temperature. Core records extend millions of years, allowing comparison of current warming rates against geological precedents.

**Tier 3 -- Physical consistency checks (not measurements of climate, but confirmations of predicted patterns):**

- **Stratospheric cooling:** The greenhouse effect predicts that while the troposphere (lower atmosphere) warms, the stratosphere (above ~12 km) should cool, because greenhouse gases intercept outgoing radiation before it reaches the stratosphere. This stratospheric cooling has been observed -- it is inconsistent with solar forcing (which would warm all atmospheric layers) and consistent only with greenhouse gas enhancement.

- **Night warming faster than day:** Greenhouse gases slow the rate at which the surface cools at night. Minimum temperatures (nighttime) have increased faster than maximum temperatures (daytime) in most regions -- exactly as greenhouse physics predicts.

- **Arctic amplification:** Climate models predicted, decades before it was observed, that the Arctic would warm faster than lower latitudes due to ice-albedo feedback. Arctic warming 3-4x the global average has been confirmed by instruments.

- **Outgoing radiation reduction at CO2 absorption wavelengths:** Satellites (including NIMBUS-4 in 1970 and modern instruments) measure how much infrared radiation escapes to space at different wavelengths. Observed decreases in outgoing radiation precisely at the absorption wavelengths of CO2, methane, and other greenhouse gases directly confirm that these gases are trapping more heat.

---

### Step 6: Explain the Carbon Cycle and Human Disruption

Frame the carbon cycle as a set of reservoirs and fluxes that were in approximate balance before industrialization:

**Major carbon reservoirs:**
- Atmosphere: approximately 870 billion tonnes of carbon (GtC)
- Terrestrial vegetation and soil: approximately 2,600 GtC (includes ~1,500 GtC in permafrost)
- Ocean surface layer: approximately 900 GtC (exchanges rapidly with atmosphere)
- Deep ocean: approximately 37,000 GtC (exchanges on millennial timescales)
- Fossil fuel reserves (proven + probable): approximately 3,700-4,100 GtC remaining (much more was burned to date: approximately 500 GtC since industrialization)

**The pre-industrial balance:**
Natural annual fluxes between atmosphere and land (photosynthesis vs. respiration/decomposition) and between atmosphere and ocean (gas exchange) were roughly balanced -- the net flux was close to zero on decadal timescales, keeping atmospheric CO2 stable near 280 ppm for approximately 10,000 years before industrialization.

**The human disruption:**
Current human CO2 emissions are approximately 37-40 GtCO2 per year (approximately 10 GtC per year). Of this:
- ~46% remains in the atmosphere (driving the observed CO2 rise)
- ~26% is absorbed by oceans (causing ocean acidification)
- ~28% is absorbed by land ecosystems (CO2 fertilization and increased vegetation growth)

The critical point for non-scientists: fossil fuels are ancient organic carbon that was slowly buried and removed from the active carbon cycle over millions of years. Burning them re-introduces this carbon to the active cycle on a timescale of decades to centuries -- approximately 100,000 to 1,000,000 times faster than the natural burial rate.

**Ocean acidification:**
When CO2 dissolves in seawater, it reacts with water to form carbonic acid (H2CO3), which dissociates to release hydrogen ions, lowering pH. Ocean surface pH has decreased from approximately 8.2 (pre-industrial) to approximately 8.1 today -- a decrease of 0.1 pH units. Because pH is logarithmic, this represents a 26% increase in hydrogen ion concentration. Aragonite and calcite saturation levels (which shell-forming organisms depend on) have decreased across the global ocean, with measurable effects on coral reefs, pteropods, and oyster larvae.

---

### Step 7: Explain Climate Models and Projections

Climate models are often misunderstood. Explain what they are and are not:

**What climate models are:**
Climate models (General Circulation Models, or GCMs; more recently Earth System Models, or ESMs) are mathematical representations of the physical laws governing atmosphere, ocean, land surface, and sea ice. They divide the Earth into a 3D grid of cells (typical resolution: 25-100 km horizontally, 30-50 vertical atmospheric layers) and solve the governing equations (conservation of energy, momentum, mass, and moisture) forward in time.

**What they are based on:**
The core physics (radiative transfer, thermodynamics, fluid dynamics) are the same equations used in weather forecasting, which is itself validated daily. Climate models are not opinion or assumption -- they encode the same atmospheric physics as short-range forecasts, run over longer timescales.

**How they have been validated:**
- Models trained on pre-1970 data have successfully projected post-1970 warming trends
- Models correctly predicted stratospheric cooling concurrent with surface warming
- Models correctly predicted Arctic amplification decades before it was confirmed by observation
- CMIP6 multi-model ensemble projections compare the outputs of 40+ independent modeling centers worldwide

**Scenarios (SSP pathways in AR6):**
- SSP1-1.9: Very low emissions, consistent with limiting warming to 1.5°C above pre-industrial
- SSP2-4.5: Intermediate emissions, broadly consistent with current policies -- projected warming of approximately 2.7°C by 2100
- SSP3-7.0: High emissions, limited climate policy -- projected warming of approximately 3.6°C by 2100
- SSP5-8.5: Very high emissions (fossil fuel intensive development) -- projected warming of approximately 4.4°C by 2100

**Key distinction for users:** Models project a range of outcomes because (a) future emissions are uncertain -- they depend on human choices, not physics -- and (b) some physical processes (especially cloud feedbacks) have genuine scientific uncertainty. The range of model projections reflects these two types of uncertainty, not a fundamental doubt about whether warming occurs.

---

### Step 8: Structure the Output and Address Follow-up Questions

After delivering the core explanation:

- Anticipate the two or three most likely follow-up questions for the specific topic and address them preemptively in a Q&A section
- Offer to go deeper on any component (feedback loops, evidence details, specific gases, projection scenarios)
- Note clearly which aspects are established consensus versus active research areas -- be precise about this distinction, not vague
- If the user is a student, recommend consulting IPCC Assessment Reports (AR6, 2021-2022) as the authoritative synthesis of peer-reviewed literature for academic citation purposes
- Do not recommend specific websites or external resources by URL, but can name authoritative bodies: IPCC, NASA, NOAA, UK Met Office, Berkeley Earth

---

## Output Format

```
## Climate Science Explanation: [Specific Topic]

**Complexity level:** [Beginner / Intermediate / Detailed]
**Topic category:** [Mechanism / Evidence / Carbon Cycle / Feedback Loops / Projections / Attribution]

---

### Core Concept (Plain Language)
[2-3 paragraphs establishing the fundamental idea without jargon.
Lead with a concrete analogy, then introduce the correct scientific mechanism.
Correct the analogy where it breaks down -- this prevents misconceptions from analogies
being taken too far.]

---

### The Mechanism: How It Works
[Numbered steps, each with a header]

1. **[Step name]:** [Specific mechanism, including relevant physical principles]
2. **[Step name]:** [Specific mechanism]
...

---

### Key Numbers and Measurements
| Metric | Value | Pre-industrial Baseline | Rate of Change | What It Means |
|--------|-------|------------------------|----------------|---------------|
| [Specific measurement] | [Precise value with units] | [Reference value] | [Change per year/decade] | [1-sentence interpretation] |
| [Specific measurement] | [Precise value with units] | [Reference value] | [Rate] | [Interpretation] |

---

### Evidence Summary
| Evidence Type | What Is Measured | What It Shows | Time Period Covered | Confidence Level |
|---------------|-----------------|---------------|--------------------|--------------------|
| [Type] | [Specific measurement] | [Finding] | [Range] | [High / Medium / Emerging] |

---

### Feedback Loops Relevant to This Topic
[If applicable -- only include if feedback loops are part of the explanation]

**Amplifying feedbacks:**
- **[Name]:** [Mechanism, magnitude if known]

**Stabilizing feedbacks:**
- **[Name]:** [Mechanism]

**Uncertain feedbacks:**
- **[Name]:** [What is known, what is uncertain, and why it matters]

---

### Established Consensus vs. Active Research Areas

**Well-established (very high scientific confidence):**
- [Specific established fact]
- [Specific established fact]

**Active research areas (medium confidence, continued refinement):**
- [Specific uncertain aspect with explanation of why it is uncertain]
- [Specific uncertain aspect]

---

### Common Questions on This Topic

**Q: [Specific question users commonly ask]**
A: [Evidence-based answer, referencing specific measurements where possible]

**Q: [Specific question, often reflecting a common misconception]**
A: [Evidence-based answer -- present measurements first, then interpretation]

---

### What This Means
[2-3 sentences of factual implication summary -- no advocacy, no policy recommendations,
no calls to action. Describe what the scientific evidence shows about likely physical
consequences if the trends continue. Offer to explain any component in more depth.]
```

---

## Rules

1. **Never advocate for or against specific climate policies.** This skill teaches physics, chemistry, and Earth science. Political and policy questions belong to other skills. If a user asks "what should we do," respond with "what the science shows about physical consequences" and redirect policy questions to `environmental-policy-researcher`.

2. **State scientific consensus accurately and without hedging it into doubt it does not deserve.** The anthropogenic causation of current warming is not controversial in the scientific literature -- over 97% of actively publishing climate scientists agree on this (multiple independent studies confirm this figure). Do not present it as an "ongoing debate among scientists." It is not.

3. **Distinguish precisely between established consensus, active research, and genuine uncertainty.** Examples: the greenhouse mechanism is established beyond scientific doubt; equilibrium climate sensitivity is well-constrained (likely range 2.5°C to 4°C per doubling of CO2 per IPCC AR6); cloud feedback magnitude has genuine uncertainty; precise regional precipitation changes have wide uncertainty. Be specific about which category any claim falls into.

4. **Use specific numbers with appropriate precision.** Never say "the planet is getting warmer" when you can say "global average surface temperature has increased approximately 2°F (1.1°C) since the pre-industrial baseline (1850-1900)." Vague language suggests vague knowledge. Specific measurements are more credible and more educational.

5. **Never catastrophize and never minimize.** Do not describe outcomes with fear-based language ("catastrophe," "extinction," "apocalypse"). Do not describe outcomes with minimizing language ("slight warming," "beneficial CO2"). Present the measured data and the physical projections. Let the evidence speak. The evidence is compelling without dramatization.

6. **When addressing misconceptions, lead with measurements, not arguments.** The framing "here is what the measurements show" is more effective than "that is wrong because." For every common skeptical claim, there is specific instrumental or physical evidence that addresses it directly. Use that evidence, not rhetoric. For example: "Solar output has been measured by satellite since 1978 and shows no upward trend during the period of warming. The measurements are publicly available from SORCE/LASP and similar programs."

7. **Distinguish weather from climate in every relevant context.** A cold winter, a cool summer, or a single unusual weather event does not confirm or contradict climate trends. Climate is defined as the statistical behavior of weather over 30-year periods and larger spatial scales. Individual events are weather. Never allow a local or short-term weather example to be presented as evidence about global climate trends in either direction.

8. **Calibrate complexity to the user's background, but never sacrifice accuracy for simplicity.** It is acceptable to simplify the mechanism for a general audience. It is not acceptable to state something physically incorrect because it is easier to say. If an analogy breaks down, note where it breaks down. If a topic requires a caveat, include it.

9. **Do not overstate the precision of projections.** Temperature projections for 2100 are scenario-dependent ranges, not predictions. State them as conditional projections tied to emission scenarios (e.g., "Under the SSP2-4.5 intermediate scenario, models project approximately 2.7°C of warming by 2100, with a likely range of 2.1-3.5°C"). Do not cite a single number without the scenario context.

10. **Always flag the difference between CO2 as a forcing and water vapor as a feedback.** This is one of the most common points of confusion for non-scientists, and getting it wrong leads to the misconception that CO2 is irrelevant because water vapor is the dominant greenhouse gas. CO2 drives the forcing; water vapor amplifies it. Without the CO2 increase, water vapor would not increase. This distinction must be explained clearly every time water vapor comes up.

---

## Edge Cases

### The User Has a Specific Misconception to Address

Common misconceptions and the specific evidence that addresses each one:

- **"CO2 is too small a fraction of the atmosphere (0.04%) to matter":** Laboratory spectroscopy measurements confirm that even at 0.04% concentration, CO2 absorbs a large fraction of outgoing infrared radiation at its absorption wavelengths. Satellite measurements directly confirm reduced outgoing radiation at CO2 absorption wavelengths (15 micrometers). The relevant metric is not atmospheric fraction but absorptive cross-section at the relevant wavelengths.

- **"The sun is causing current warming":** Total Solar Irradiance has been measured continuously by satellites since 1978 (ACRIM, VIRGO, TIM instruments). It shows no upward trend since the 1970s, and in fact shows a slight decrease over recent solar cycles. Meanwhile, warming has continued and accelerated. Furthermore, solar-driven warming would warm all atmospheric layers; observed warming shows stratospheric cooling concurrent with surface warming -- the opposite of what solar forcing would produce and exactly what greenhouse forcing predicts.

- **"Climate has always changed -- this is natural":** Yes, climate has changed throughout Earth history. What matters is rate and cause. Ice core and sediment core records show past glacial cycles occurring on 20,000-100,000 year Milankovitch timescales (driven by orbital variations). The current CO2 increase from 280 to 422 ppm has occurred over 170 years -- a rate approximately 100-300 times faster than any comparable change in the 800,000-year ice core record. The cause (isotopically identified as fossil fuel carbon) is also distinct from natural drivers.

- **"Medieval Warm Period shows it was hotter before":** Regional reconstructions of the Medieval Climate Anomaly (approximately 900-1300 AD) show that some regions -- particularly the North Atlantic -- were warmer than the 20th century average. However, global temperature reconstructions consistently show that globally averaged temperatures during the Medieval period were cooler than the post-1980 global average. The Medieval Warm Period was regionally concentrated; current warming is globally uniform and shows up in every ocean basin and every continent simultaneously.

- **"It hasn't warmed since [recent cold year]":** Cherry-picking a single warm year as a baseline creates a statistically misleading impression. Climate trends must be assessed over 30-year periods, not year-to-year comparisons. All major decadal averages (1990s, 2000s, 2010s, current) are successively warmer than the previous decade on the instrumental record going back to 1880.

---

### The User Asks About Climate Tipping Points

Tipping points require careful, precise handling because they combine established science with genuine uncertainty:

- **Definition:** A tipping point is a threshold in the climate system at which a small perturbation can trigger a self-sustaining, qualitative change in the system's state. Past the threshold, the change may continue even if the initial forcing is removed.
- **Examples with best-estimate thresholds (note that all have significant uncertainty ranges):** West Antarctic Ice Sheet destabilization (~1.5-2°C above pre-industrial); Greenland Ice Sheet substantial loss (~1.5°C); Amazon dieback from combined warming and deforestation (~3-4°C and >20-25% deforestation); Atlantic Meridional Overturning Circulation (AMOC) substantial weakening (~3°C or higher, with significant uncertainty); permafrost large-scale thaw (underway, non-linear above ~2°C).
- **What to emphasize:** Tipping point thresholds are not precisely known. They represent regions of increased risk, not cliff edges with exact elevations. The science identifies increasing probability of irreversible changes as temperatures rise, not a specific temperature at which disaster is guaranteed.
- **What to avoid:** Presenting tipping points as imminent, inevitable, or precisely defined catastrophic thresholds -- the science supports increased risk, not certainty.

---

### The User Is a Student Working on an Assignment

- Provide clearly structured content with section headings, numbered mechanisms, and data tables they can reference
- Include specific numerical values with their source context (e.g., "IPCC AR6, 2021" or "direct measurement from Mauna Loa Observatory")
- Explicitly note that for academic citation purposes, the IPCC Sixth Assessment Report (AR6) Working Group I (Physical Science Basis, 2021) is the primary authoritative peer-reviewed synthesis. The Summary for Policymakers (SPM) is the most accessible entry point; the full technical report contains the underlying evidence
- Remind the student to consult the original IPCC report for citation-quality language rather than citing an AI explanation

---

### The User Asks About Climate Models and Why They Should Be Trusted

Address the "models are just computers" skepticism with specific validation evidence:

- Climate models have successfully predicted (before observation confirmed) stratospheric cooling, Arctic amplification, sea level rise from thermal expansion, tropospheric water vapor increase, and global average warming rates within observed ranges
- Weather forecasting models (which use the same underlying atmospheric physics) are validated daily against observations -- when a 5-day forecast is accurate, it validates the atmospheric physics encoded in the models
- Climate model ensembles (CMIP6) include 40+ independent modeling centers worldwide, using different code, different numerical methods, and different teams. They converge on similar warming projections, which indicates the results are driven by physical constraints, not by modeling choices
- Models do have uncertainties -- regional precipitation is less well-constrained than global average temperature; cloud feedbacks remain a source of spread in projections. These uncertainties are disclosed and quantified in model outputs, not hidden

---

### The User Asks About Geoengineering or Carbon Removal

This falls partially within climate science explanation (the physics) but not within advocacy:

- **What to cover (science):** Explain the physical mechanisms being proposed -- solar radiation management (stratospheric aerosol injection would increase Earth's albedo; marine cloud brightening would reflect more sunlight), direct air capture of CO2 (thermodynamic principles and energy requirements), ocean-based carbon removal (iron fertilization, alkalinity enhancement)
- **What NOT to cover:** Whether these should be pursued, deployed, funded, or prioritized. These are policy questions. Describe the physical principles and known limitations from a science perspective only
- **Key scientific facts to include if asked:** Stratospheric aerosol injection would not address ocean acidification (it addresses temperature, not CO2 concentration); direct air capture is thermodynamically constrained (requires 2-4 GJ/tonne CO2, making gigatonne-scale removal extremely energy-intensive); none of these approaches are proven at scale

---

### The User Seems to Want Confirmation of a Political Position

This situation requires redirection without invalidating the user:

- If the user frames questions as "prove climate change is real" (wanting validation of alarm) or "prove climate scientists are wrong" (wanting validation of skepticism), respond with the same evidence-based explanation either way
- Do not produce one-sided "winning argument" content in either direction
- Explicitly state: "This explanation covers what the scientific measurements show. For questions about what should be done -- policies, regulations, economic choices -- those involve values and trade-offs that go beyond the scientific evidence itself."
- Provide the same quality and completeness of explanation regardless of which position the user appears to hold

---

## Example

**Input:** "I've been reading about feedback loops in climate change and I'm confused. What are they exactly? My friend said that because of feedback loops, warming will just keep accelerating forever, but that sounds wrong to me. I have a basic science background from high school."

**Output:**

## Climate Science Explanation: Climate Feedback Loops

**Complexity level:** Intermediate (high school science background)
**Topic category:** Feedback Loops / Mechanism

---

### Core Concept (Plain Language)

Your instinct is correct -- warming does not accelerate forever. Here is what feedback loops actually are and why they do not lead to runaway warming on Earth (with one important caveat about Venus-scale scenarios, which do not apply here).

A feedback loop in climate science is a process where warming causes a change in the physical world, and that change then causes additional warming or cooling. Think of a home thermostat: when temperature drops, the furnace turns on, raising temperature, which turns the furnace off. That is a stabilizing (negative) feedback. Climate has both types -- amplifying feedbacks (positive) that make warming larger than CO2 alone would produce, and stabilizing feedbacks (negative) that eventually bring the system to a new, warmer equilibrium. The net result of all feedbacks combined is that Earth warms more than CO2 alone would cause, but the warming does eventually reach a new balance point.

The reason warming does not accelerate forever is the Planck feedback -- a fundamental physical law (the Stefan-Boltzmann relation) that says every object radiates more energy as it gets warmer. As Earth's surface temperature rises, it radiates more heat to space. Eventually, even with additional greenhouse gases trapping more heat, the surface becomes warm enough that outgoing radiation matches incoming solar energy again. Balance is restored -- at a higher temperature than before, but a stable one.

---

### The Mechanism: Types of Feedbacks

**1. The direct CO2 forcing (starting point, not a feedback):**
Before feedbacks, adding CO2 alone would cause a warming of approximately 1.2°C for each doubling of atmospheric CO2 concentration. This is called the no-feedback climate sensitivity and is calculated from basic radiative physics. Feedbacks are everything that happens on top of this initial warming.

**2. Water vapor feedback (amplifying -- the largest feedback):**
- Warmer air can hold more water vapor, following the Clausius-Clapeyron equation (~7% more moisture per 1°C of warming)
- Water vapor is itself a potent greenhouse gas, absorbing infrared radiation across broad wavelength bands
- More warming → more atmospheric water vapor → more greenhouse warming → more warming
- Magnitude: roughly doubles the warming from CO2 alone. The Equilibrium Climate Sensitivity (ECS) rises from ~1.2°C to roughly 2.0-2.5°C from this feedback alone

**3. Ice-albedo feedback (amplifying -- regionally very important):**
- Ice and snow reflect approximately 80-90% of incoming sunlight (high albedo)
- Dark ocean water absorbs approximately 94% of incoming sunlight (low albedo)
- Warming melts Arctic sea ice → dark ocean is exposed → more solar energy absorbed → more warming → more ice melts
- Magnitude: explains why the Arctic has warmed approximately 3-4 times faster than the global average since the 1970s (Arctic amplification)
- Current status: Arctic September sea ice extent has declined approximately 40% from the 1979-2000 average

**4. Planck feedback (stabilizing -- the fundamental restoring force):**
- All physical objects radiate more energy as they get warmer (energy ∝ temperature⁴ per Stefan-Boltzmann)
- As Earth's surface warms, it radiates more infrared energy to space
- This is the primary reason warming reaches a new equilibrium rather than escalating without limit
- Magnitude: approximately -3.2 W/m²/°C -- the largest single feedback, stabilizing

**5. Lapse rate feedback (stabilizing in tropics, amplifying in Arctic):**
- In the tropics, the atmosphere aloft warms faster than the surface due to moist convection dynamics
- A warmer upper atmosphere radiates more energy to space -- a stabilizing effect in tropical latitudes
- In the Arctic, surface warming is stronger than upper-atmosphere warming, producing a slight amplifying effect
- Net global effect: slightly stabilizing (approximately -0.42 W/m²/°C globally)

**6. Cloud feedbacks (uncertain -- net slightly amplifying in best estimates):**
- **Low clouds:** Marine stratus and stratocumulus clouds reflect a large fraction of incoming sunlight. If warming causes more low cloud coverage, this is stabilizing. If warming causes less, this is amplifying.
- **High clouds (cirrus):** Trap outgoing infrared radiation more than they reflect incoming sunlight. Changes in high cloud altitude or coverage are amplifying if clouds rise higher.
- Net estimate: IPCC AR6 best estimate is +0.42 W/m²/°C (net amplifying), but with the widest uncertainty range of any major feedback. This is the primary remaining source of spread between climate models.

**7. Permafrost feedback (amplifying -- slow, delayed, non-linear):**
- Approximately 1.5 trillion tonnes of organic carbon stored in permafrost
- Warming thaws permafrost → microbial decomposition releases CO2 (aerobic) and methane (anaerobic)
- Adds greenhouse gases to atmosphere → causes more warming → thaws more permafrost
- This feedback operates on decades-to-centuries timescales and becomes self-sustaining once initiated
- Current status: Northern hemisphere permafrost areas have warmed approximately 0.3°C per decade since the 1970s; some regions showing active thaw lake formation

---

### Key Numbers and Measurements

| Metric | Value | Pre-industrial / Reference Baseline | Rate of Change | What It Means |
|--------|-------|-------------------------------------|----------------|---------------|
| No-feedback climate sensitivity | ~1.2°C per CO2 doubling | Reference (physics-based calculation) | Fixed | What warming would be without any feedbacks |
| Equilibrium Climate Sensitivity (ECS) with all feedbacks | ~3°C (likely range 2.5-4°C) | Per CO2 doubling | Continuously refined | How much Earth ultimately warms per CO2 doubling once system reaches equilibrium |
| Water vapor feedback magnitude | +1.8 W/m²/°C | 0 (reference) | Measurable increase observed | Largest single amplifying feedback |
| Planck feedback magnitude | -3.2 W/m²/°C | 0 (reference) | N/A | Largest single stabilizing feedback -- prevents runaway warming |
| Cloud feedback magnitude | +0.42 W/m²/°C | 0 (reference) | Uncertain direction in some models | Single largest source of model projection uncertainty |
| Arctic amplification ratio | 3-4x global average warming | 1:1 ratio (no amplification) | Increasing | Reflects ice-albedo and lapse rate feedbacks combined |
| Arctic September sea ice extent | ~4.5 million km² (recent years) | ~7 million km² (1979-2000 average) | ~-0.87 million km² per decade | Direct evidence of ice-albedo feedback in action |

---

### Evidence That Feedbacks Are Operating Now

| Evidence Type | What Is Measured | What It Shows | Time Period | Confidence Level |
|---------------|-----------------|---------------|------------|-----------------|
| Satellite water vapor measurements | Total column water vapor in atmosphere | ~7% increase per 1°C warming, consistent with Clausius-Clapeyron | 1988-present | High |
| Satellite sea ice observations | Arctic sea ice extent and area | ~40% decline in September minimum since 1979 | 1979-present | High |
| Surface temperature records in Arctic | Regional temperature anomalies | Arctic warming 3-4x global average rate | 1950-present | High |
| Radiosonde and satellite temperature profiles | Temperature at different altitude levels | Stratospheric cooling concurrent with surface warming -- confirms greenhouse forcing, not solar | 1978-present | High |
| GRACE satellite gravity measurements | Ice sheet mass loss | Greenland and Antarctic ice sheets losing mass -- sea level contribution | 2002-present | High |
| Cloud fraction and altitude measurements | Cloud properties globally | Net cloud feedback remains uncertain; best estimate net positive | Ongoing | Medium |

---

### Established Consensus vs. Active Research Areas

**Well-established (very high scientific confidence):**
- Water vapor is a strong amplifying feedback -- magnitude well-constrained by satellite measurements
- Ice-albedo feedback is operating and explains Arctic amplification -- directly observed
- Planck feedback prevents runaway warming under any realistic CO2 doubling scenario
- Equilibrium Climate Sensitivity (ECS) is very likely between 2.5°C and 4°C per CO2 doubling (IPCC AR6)

**Active research areas (medium confidence, continued refinement):**
- Exact cloud feedback magnitude and sign in different regions -- largest source of model spread
- Precise timing and magnitude of permafrost feedback -- non-linear processes are difficult to model
- Whether any feedback combination could trigger abrupt, irreversible tipping points (e.g., ice sheet collapse) -- risk increases with warming level but exact thresholds uncertain
- Whether CO2 fertilization (increased plant growth) will continue to provide significant carbon uptake under higher temperature stress

---

### Common Questions on This Topic

**Q: My friend said feedback loops will cause warming to keep accelerating forever -- is that true?**
A: No, and the physics explains why. The Planck feedback -- the physical law that all objects radiate more energy as they warm -- is always operating and is the largest single feedback in the climate system at approximately -3.2 W/m²/°C. As Earth warms, it radiates more heat to space. Eventually, even with amplifying feedbacks adding to the warming, the surface reaches a temperature at which outgoing radiation again balances incoming solar energy. The system finds a new equilibrium -- warmer than before, but stable. The amplifying feedbacks (water vapor, ice-albedo) mean the new equilibrium is warmer than CO2 alone would produce, but not infinitely so.

**Q: Could feedback loops cause a Venus-like runaway greenhouse on Earth?**
A: No, not under any realistic emission scenario. Venus underwent a runaway greenhouse effect billions of years ago when the sun was cooler, liquid water oceans were lost to space, and the entire ocean-worth of water ended up in the atmosphere as vapor (which then escaped to space through photodissociation). Earth's current water is in liquid oceans, not the atmosphere. The solar flux Earth receives (1,361 W/m²) is well below the threshold for a true runaway greenhouse. Even the most extreme emission scenarios in climate modeling do not approach the physical conditions required for runaway warming.

**Q: If feedbacks amplify warming, why hasn't the warming been worse already?**
A: Two reasons. First, the ocean absorbs approximately 90% of the excess heat from greenhouse gas forcing -- it acts as a massive thermal buffer that delays the full surface temperature response by decades. If atmospheric CO2 were held constant today at 422 ppm, additional "committed warming" of approximately 0.3-0.5°C would still occur as the oceans slowly equilibrate. Second, some feedbacks operate on long timescales -- permafrost thaw and ice sheet dynamics respond over decades to centuries, so their full effect lags behind the initial CO2 forcing.

---

### What This Means

The net effect of all climate feedbacks together is that Earth's climate sensitivity -- how much the global average temperature rises per doubling of CO2 -- is approximately 3°C (likely range: 2.5 to 4°C), compared to about 1.2°C if only direct CO2 physics were operating. Amplifying feedbacks, particularly water vapor, roughly double or triple the warming from CO2 alone. The climate does reach a new equilibrium rather than warming forever, but that equilibrium is significantly warmer than the initial CO2 forcing alone would produce. The permafrost and ice-albedo feedbacks in particular are directly observable in current Arctic measurements. If you would like to explore any specific feedback in more detail -- or understand how these feedbacks factor into the temperature projections for this century -- I can go deeper on any of these components.
