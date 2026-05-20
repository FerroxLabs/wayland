---
name: pcb-designer
description: |
  Guides PCB design workflow including KiCad schematic capture, board layout, design rules, fabrication preparation, and component selection
  Use when the user asks about pcb designer, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of pcb designer or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot budgeting stress-management checklist template guide python"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# PCB Designer

You are an expert PCB designer. You guide engineers through the complete PCB design workflow including KiCad schematic capture, component selection, board layout, signal integrity considerations, design rule compliance, fabrication file generation, and manufacturing preparation.


## When to Use

**Use this skill when:**
- User asks about pcb designer techniques or best practices
- User needs guidance on pcb designer concepts
- User wants to implement or improve their approach to pcb designer

**Do NOT use when:**
- The request falls outside the scope of pcb designer
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## PCB Design Workflow

```
1. Requirements    → Define specs, constraints, form factor
2. Schematic       → Capture circuit in KiCad Eeschema
3. Component       → Select parts, check availability, assign footprints
4. Board Setup     → Define outline, stackup, design rules
5. Placement       → Position components strategically
6. Routing         → Connect traces, pour copper fills
7. DRC/ERC         → Run design rule and electrical rule checks
8. Review          → 3D viewer, design review checklist
9. Fabrication     → Generate Gerbers, BOM, pick-and-place
10. Assembly       → Solder, test, iterate
```

## Schematic Design in KiCad

### Schematic Best Practices

| Practice | Reason |
|----------|--------|
| One function per sheet | Readability and modularity |
| Power symbols at top, ground at bottom | Natural current flow visualization |
| Signal flow left to right | Intuitive reading order |
| Label all nets | Enables cross-sheet references |
| Add decoupling caps near IC symbols | Visual association with IC |
| Include test points | Debug and production testing |
| Document values and tolerances | Manufacturing clarity |
| Use hierarchical sheets | Manage complexity |

### Common Subcircuit Patterns

```
Voltage Regulator (LDO):
  VIN ──┤+C1├── VIN_REG ──┤ LDO ├── VOUT_REG ──┤+C2├── VOUT
              100uF         │   │                 10uF
                           GND  EN

USB-C Power Input:
  VBUS ──┤F1├── VIN ──┤TVS├── Regulated
         Fuse        Protection

I2C Bus:
  SDA ──┤R1├── VCC     R1 = 4.7K (3.3V) or 2.2K (1.8V)
  SCL ──┤R2├── VCC     R2 = 4.7K (3.3V) or 2.2K (1.8V)

Crystal Oscillator:
  XTAL_IN ──┤C1├── GND     C1, C2 = 2 * (CL - Cstray)
  XTAL_OUT ──┤C2├── GND    CL from crystal datasheet
             ├──XTAL──┤    Cstray typically 3-5pF
             │   Rf   │    Rf = 1M feedback resistor
```

### Power Distribution Network

```
Power Budget Template:
┌─────────────────────────────────────────────────┐
│ Component        │ Voltage │ Current │ Notes     │
├──────────────────┼─────────┼─────────┼───────────┤
│ MCU (active)     │ 3.3V    │ 50mA    │ Peak      │
│ MCU (sleep)      │ 3.3V    │ 5uA     │           │
│ WiFi module      │ 3.3V    │ 240mA   │ TX peak   │
│ Sensors (3x)     │ 3.3V    │ 3mA     │ Total     │
│ LED indicator    │ 3.3V    │ 20mA    │ Per LED   │
│ Motor driver     │ 5V      │ 1A      │ Stall     │
├──────────────────┼─────────┼─────────┼───────────┤
│ 3.3V rail total  │ 3.3V    │ 313mA   │ Peak      │
│ 5V rail total    │ 5V      │ 1A      │ Peak      │
│ Total from USB   │ 5V      │ 1.5A    │ Max       │
└─────────────────────────────────────────────────┘
```

## Component Selection Guide

### Passive Component Selection

| Component | Key Parameters | Selection Priority |
|-----------|---------------|-------------------|
| Resistor | Tolerance, power, package | 1% for signal, 5% for pull-up |
| Capacitor | Capacitance, voltage, ESR, temp coefficient | X5R/X7R for bypass, C0G for precision |
| Inductor | Inductance, DCR, saturation current, SRF | Saturation > 1.3x max current |
| Ferrite bead | Impedance at freq, current rating | Match impedance to noise frequency |

### Capacitor Technology Comparison

| Type | Range | Temp Stability | Voltage Derating | Use |
|------|-------|----------------|-------------------|-----|
| C0G/NP0 | 1pF - 10nF | Excellent | None needed | Timing, filters |
| X5R | 100nF - 22uF | Fair (-55 to 85C) | Use 2x rated | Bypass, bulk |
| X7R | 100nF - 10uF | Good (-55 to 125C) | Use 2x rated | General bypass |
| Electrolytic | 1uF - 10000uF | Poor | Use 1.5x rated | Bulk power |
| Tantalum | 100nF - 1000uF | Good | Use 2x rated | Compact bulk |

### Package Size Reference

| Imperial | Metric | Size (mm) | Power (typ) | Best For |
|----------|--------|-----------|-------------|----------|
| 0201 | 0603 | 0.6 x 0.3 | 1/20W | High density, auto assembly |
| 0402 | 1005 | 1.0 x 0.5 | 1/16W | Compact designs |
| 0603 | 1608 | 1.6 x 0.8 | 1/10W | General purpose, hand solderable |
| 0805 | 2012 | 2.0 x 1.25 | 1/8W | Easy hand solder |
| 1206 | 3216 | 3.2 x 1.6 | 1/4W | Power, easy hand solder |

## Board Layout

### Layer Stackup Design

```
2-Layer (Simple, low cost):
  Top     - Signal + Power
  Bottom  - Ground plane + Signal

4-Layer (Recommended for MCU designs):
  Layer 1 - Signal + Components
  Layer 2 - Ground plane (continuous)
  Layer 3 - Power plane
  Layer 4 - Signal + Components

6-Layer (High-speed, RF):
  Layer 1 - Signal (high-speed)
  Layer 2 - Ground plane
  Layer 3 - Signal (inner)
  Layer 4 - Power plane
  Layer 5 - Ground plane
  Layer 6 - Signal (high-speed)
```

### Trace Width Calculator

```python
def trace_width_external(
    current_a: float,
    temp_rise_c: float = 10,
    copper_oz: float = 1.0,
    max_length_mm: float = None,
    max_voltage_drop: float = None
) -> dict:
    """Calculate minimum trace width for external layer (IPC-2221).

    Args:
        current_a: Maximum current in amps
        temp_rise_c: Acceptable temperature rise in Celsius
        copper_oz: Copper weight (1 oz = 35um = 1.4 mil)
        max_length_mm: Optional trace length for voltage drop calc
        max_voltage_drop: Optional maximum acceptable voltage drop
    """
    # IPC-2221 formula for external layers
    # Area = (I / (k * dT^b))^(1/c)
    k = 0.048    # External layer constant
    b = 0.44
    c = 0.725

    area_mils2 = (current_a / (k * (temp_rise_c ** b))) ** (1 / c)
    thickness_mils = copper_oz * 1.378  # 1 oz = 1.378 mils
    width_mils = area_mils2 / thickness_mils
    width_mm = width_mils * 0.0254

    result = {
        "width_mils": round(width_mils, 1),
        "width_mm": round(width_mm, 3),
        "cross_section_mils2": round(area_mils2, 1),
    }

    # Voltage drop calculation
    if max_length_mm:
        resistivity = 1.724e-6  # Ohm-cm for copper at 20C
        thickness_cm = copper_oz * 1.378 * 0.00254
        width_cm = width_mm / 10
        length_cm = max_length_mm / 10
        resistance = resistivity * length_cm / (width_cm * thickness_cm)
        v_drop = current_a * resistance
        result["resistance_mohm"] = round(resistance * 1000, 2)
        result["voltage_drop_mv"] = round(v_drop * 1000, 1)

    return result

# Examples:
# print(trace_width_external(0.5))   # 500mA signal
# print(trace_width_external(3.0, max_length_mm=50))  # 3A power trace
```

### Placement Rules

| Rule | Guideline |
|------|-----------|
| Decoupling caps | Within 3mm of IC power pin, via to ground plane |
| Crystal | As close to MCU as possible, guard ring ground |
| Antenna | Keep clear zone (no copper pour, no traces) |
| Power input | Near board edge, close to connector |
| High-current paths | Short, wide traces, thermal relief |
| Sensitive analog | Separate from digital, dedicated ground area |
| Connectors | Board edges, consider mechanical stress |
| Thermal pads | Connect to ground plane with thermal vias |

### Routing Guidelines

```
Signal Integrity Rules:
  ┌──────────────────────────────────────────────┐
  │ Rule                  │ Guideline             │
  ├───────────────────────┼───────────────────────┤
  │ 3W rule               │ Trace spacing >= 3x   │
  │                       │ trace width            │
  │ Return path           │ Signal trace must have │
  │                       │ ground plane below     │
  │ Via transitions       │ Add ground vias near   │
  │                       │ signal vias            │
  │ Differential pairs    │ Match length ±5 mils   │
  │ Clock traces          │ No stubs, direct route │
  │ Analog/digital split  │ Cross at one point     │
  │ Power traces          │ Width per current calc │
  └──────────────────────────────────────────────┘

Impedance Targets (typical):
  Single-ended: 50 ohm (RF), 90 ohm (USB)
  Differential: 90 ohm (USB), 100 ohm (Ethernet, LVDS)
```

## Design Rule Check (DRC)

### Common DRC Rules

```
Minimum Clearances (typical 2-layer fab):
  Trace to trace:        6 mil (0.15mm)
  Trace to pad:          6 mil
  Trace to board edge:   10 mil (0.25mm)
  Via to via:            8 mil
  Via to trace:          6 mil
  Pad to pad:            6 mil

Minimum Widths:
  Signal trace:          6 mil (0.15mm)
  Power trace:           10-20 mil (per current)
  Via drill:             0.3mm (12 mil)
  Via annular ring:      0.15mm (6 mil)

Copper Pour:
  Clearance to traces:   10 mil
  Thermal spoke width:   10 mil
  Minimum connection:    4 spokes
```

### KiCad DRC Configuration

```
# Design Rules in KiCad Board Setup

Net Classes:
  Default:
    Clearance: 0.2mm
    Track Width: 0.25mm
    Via Size: 0.8mm / 0.4mm drill

  Power:
    Clearance: 0.3mm
    Track Width: 0.5mm
    Via Size: 1.0mm / 0.5mm drill

  HighSpeed:
    Clearance: 0.15mm
    Track Width: 0.15mm
    Via Size: 0.6mm / 0.3mm drill
    Diff Pair Width: 0.15mm
    Diff Pair Gap: 0.15mm
```

## Fabrication Output

### Gerber File Generation Checklist

| File | Layer | Extension | Content |
|------|-------|-----------|---------|
| Front Copper | F.Cu | .GTL | Top copper traces |
| Back Copper | B.Cu | .GBL | Bottom copper traces |
| Front Solder Mask | F.Mask | .GTS | Top mask openings |
| Back Solder Mask | B.Mask | .GBS | Bottom mask openings |
| Front Silkscreen | F.SilkS | .GTO | Top markings |
| Back Silkscreen | B.SilkS | .GBO | Bottom markings |
| Board Outline | Edge.Cuts | .GKO | Board shape |
| Drill File | PTH + NPTH | .DRL | Drill locations |
| Drill Map | - | .DRL (map) | Visual drill reference |

### BOM (Bill of Materials) Template

```csv
Reference,Value,Package,Manufacturer,MPN,Quantity,DNP,Notes
C1,100nF,0603,Samsung,CL10B104KB8NNNL,1,,Decoupling MCU VDD
C2,10uF,0805,Samsung,CL21A106KPFNNNE,1,,LDO output
C3,100uF,Electrolytic,Panasonic,EEE-1CA101SP,1,,Input bulk
R1,10K,0402,Yageo,RC0402FR-0710KL,4,,I2C pullups
R2,330,0603,Yageo,RC0603FR-07330RL,2,,LED current limit
U1,STM32F411,LQFP48,ST Micro,STM32F411CEU6,1,,Main MCU
U2,AP2112K-3.3,SOT-23-5,Diodes Inc,AP2112K-3.3TRG1,1,,3.3V LDO
J1,USB-C,USB-C-16P,Korean Hroparts,TYPE-C-31-M-12,1,,USB connector
```

### Fabrication Specification

```
Board Specification:
  Material:           FR-4 (TG 130+)
  Layers:             2
  Board thickness:    1.6mm
  Copper weight:      1 oz (35um) outer
  Min trace/space:    6/6 mil
  Min via drill:      0.3mm
  Surface finish:     HASL (lead-free) or ENIG
  Solder mask:        Green LPI
  Silkscreen:         White
  Board outline:      Routed
  Panelization:       V-score or tab-route

Impedance Control (if needed):
  50 ohm single-ended on outer layers
  90 ohm differential for USB
  Stackup: specify exact dielectric thickness
```

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| Missing decoupling caps | Noise, instability, crashes | 100nF per power pin, close placement |
| No ground plane | Poor EMC, crosstalk | Dedicate a full layer to ground |
| Trace too thin for current | Overheating, failure | Calculate with IPC-2221 formula |
| Crystal too far from MCU | Oscillator fails to start | Place within 5mm, guard ground |
| Via in pad (without fill) | Solder wicking, cold joints | Use via-in-pad with fill, or move via |
| Acid traps | Etching residue, shorts | Avoid acute angles in traces |
| Missing thermal relief | Difficult soldering | Use 4-spoke thermal relief on ground |
| Wrong footprint | Component does not fit | Always verify 3D model before order |

## Exercises

1. **LED Driver Board**: Design a 2-layer board with USB-C power input, LDO regulator, MCU, and 8 PWM-controlled LEDs
2. **Sensor Breakout**: Create a 4-sensor I2C breakout board with proper pull-ups, decoupling, and castellated edges
3. **Power Supply**: Design a buck converter board with proper inductor placement, ground plane, and thermal management
4. **Impedance Controlled**: Route a USB 2.0 differential pair with correct impedance on a 4-layer stackup
5. **Design for Manufacturing**: Take an existing design through full DRC, generate Gerbers, BOM, and pick-and-place files for JLCPCB


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to pcb designer
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Pcb Designer Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with pcb designer for my current situation"

**Output:**

Based on your situation, here is a structured approach to pcb designer:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
