---
name: weather-station
description: |
  Guide to personal weather stations including selection, sensor types, proper placement, data collection, online integration, and basic weather forecasting skills. Use when the user asks about weather station or needs help with related topics. Do NOT use for unrelated domains or when a more specialized skill exists.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "iot guide step-by-step"
  category: "hobbies-crafts"
  subcategory: "making-building"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---

# Weather Station

## When to Use


## Process

1. **Gather requirements.** Ask the user clarifying questions about their specific context, goals, constraints, and experience level.

2. **Analyze the situation.** Review the information provided and identify key factors, challenges, and opportunities relevant to weather station.

3. **Develop the framework.** Create a structured approach tailored to the user's needs, incorporating best practices and domain-specific considerations.

4. **Deliver actionable output.** Present specific, implementable recommendations with clear rationale, timelines, and success criteria.

5. **Address edge cases.** Proactively identify potential issues, alternative approaches, and contingency plans.

**Use this skill when:**
- User needs guidance on weather station
- User asks about weather station best practices or techniques
- User wants a structured approach to weather station

**Do NOT use this skill when:**
- A more specialized skill exists for the specific subtopic
- The request is outside the scope of weather station

## Questions to Ask First

Before recommending a weather station setup:

1. What is your primary interest? (Casual monitoring, gardening, severe weather tracking, data analysis, aviation)
2. What is your budget? ($50-100 / $100-300 / $300-800 / $800+)
3. Where will you install it? (Rooftop, yard, balcony, farm)
4. Do you have WiFi access at the installation location?
5. Do you want to share data online (Weather Underground, CWOP)?
6. What is your technical comfort level? (Plug-and-play / Some setup / Advanced networking)
7. Are you in an area prone to severe weather?
8. How important is data accuracy vs convenience?

## Station Selection Guide

### Budget Tier ($50-100)
**AcuRite 5-in-1 Weather Station**
- Temperature, humidity, wind speed/direction, rainfall
- Wireless to indoor display
- Basic functionality, good starting point
- Limited online connectivity without additional hardware

**Ambient Weather WS-2902**
- WiFi-connected, sends data to Weather Underground, Ambient Weather Network
- Temperature, humidity, wind speed/direction, rainfall, UV, solar radiation
- Best value weather station overall
- Good app and web dashboard

### Mid-Range ($200-400)
**Davis Vantage Vue**
- Industry standard for personal weather stations
- Highly accurate sensors, rugged construction
- Built for long-term outdoor exposure
- Requires WeatherLink dongle for internet connectivity (additional $)

**Ambient Weather WS-5000**
- Ultrasonic wind sensor (no moving parts, more durable)
- WiFi built-in, excellent app
- Additional sensor expansion capability
- Haptic rain gauge

### Professional ($500-1500+)
**Davis Vantage Pro2**
- Research-grade accuracy
- Modular sensor suite
- Fan-aspirated radiation shield (most accurate temperature)
- Standard for citizen science networks
- Expandable with soil moisture, leaf wetness, UV sensors

**Tempest WeatherFlow**
- All-in-one design, no moving parts
- Lightning detection
- Haptic rain sensor
- Solar powered, no batteries
- AI-enhanced forecasting
- $330 for station, requires subscription for some features

### Comparison Matrix

| Feature | WS-2902 | Davis Vue | WS-5000 | Davis Pro2 |
|---------|---------|-----------|---------|------------|
| Price | ~$190 | ~$300 | ~$400 | ~$600+ |
| Accuracy | Good | Excellent | Very Good | Research-grade |
| WiFi | Built-in | Add-on | Built-in | Add-on |
| Durability | Good | Excellent | Very Good | Excellent |
| Expandable | Limited | Limited | Yes | Very |
| Wind sensor | Cups/vane | Cups/vane | Ultrasonic | Cups/vane |

## Sensor Types and What They Measure

### Temperature
- **Thermistor** (most stations) - Resistance changes with temperature
- **Accuracy matters**: +/- 1F is good, +/- 0.5F is excellent
- Radiation shield is critical - direct sunlight creates false high readings
- Fan-aspirated shields are most accurate (Davis Pro2 option)

### Humidity
- **Capacitive sensors** - Most common, measure relative humidity (RH)
- Accuracy: +/- 3-5% RH is typical
- Dew point calculated from temperature and humidity
- Dew point is often more useful than RH for comfort assessment

### Wind Speed (Anemometer)
- **Cup anemometer** - Traditional, mechanical, proven technology
- **Ultrasonic** - No moving parts, measures wind speed and direction simultaneously
- **Hot wire** - Laboratory grade, rarely in personal stations
- Measure: Average speed, gust speed (peak in reporting period), direction

### Wind Direction (Wind Vane)
- Mechanical vane or integrated ultrasonic sensor
- Reports in degrees (0/360 = North, 90 = East, 180 = South, 270 = West)
- Important for weather prediction and identifying approaching fronts

### Rain Gauge
- **Tipping bucket** - Most common, tips at measured increments (0.01" or 0.2mm)
- **Haptic/impact** - No moving parts, measures raindrop impacts
- **Weighing** - Most accurate, used in research stations
- Annual calibration recommended for tipping buckets

### Barometric Pressure
- Usually in the indoor console, not the outdoor unit
- Measures in inHg (inches of mercury) or hPa/mb (hectopascals/millibars)
- Must be calibrated to sea level pressure for meaningful comparison
- Most important single measurement for short-term forecasting

### UV Index and Solar Radiation
- UV index (0-11+) measures ultraviolet radiation intensity
- Solar radiation (W/m2) measures total solar energy
- Useful for gardening, solar panel assessment, health awareness

## Proper Sensor Placement

### Temperature/Humidity Sensor
- **Height**: 4-6 feet (1.2-1.8m) above ground (standard meteorological height is 5 feet)
- **Surface**: Over grass or natural ground, NOT over concrete or asphalt
- **Shade**: Radiation shield must prevent direct sunlight
- **Airflow**: At least 10 feet from buildings, trees, or other heat sources
- **Avoid**: South-facing walls, HVAC units, dryer vents, barbecue areas

### Anemometer (Wind)
- **Height**: As high as practical - ideally 33 feet (10m) above ground
- **Clearance**: At least 10 feet above roofline if roof-mounted
- **Distance**: Away from buildings and trees (at least 4x the obstacle height)
- **Mounting**: Secure pole mount rated for wind loads in your area
- **Compromise**: Even imperfect placement gives useful relative data

### Rain Gauge
- **Level**: Must be perfectly level for accurate measurement
- **Height**: 3-5 feet above ground (avoid splash from ground)
- **Clearance**: Distance from obstacles at least 2x the obstacle height
- **Avoid**: Under trees (drip), near buildings (wind eddies), sprinkler zones
- **Heating**: Optional heating element prevents freezing (important in cold climates)

### Common Placement Mistakes
- Temperature sensor in direct sun (reads 10-20F high on sunny days)
- Anemometer below roofline (dramatically underestimates wind)
- Rain gauge under eaves or near trees
- All sensors mounted on same pole too close together
- Installing over concrete or dark surfaces (heat island effect)

## Data Collection and Analysis

### Understanding Your Data

**Temperature Trends**
- Daily high and low, when they occur
- Diurnal range (difference between high and low)
- Compare to official station (closest NWS/airport data)
- Frost/freeze warnings based on your microclimate

**Barometric Pressure Trends**
- Rising pressure: Improving weather, clearing skies
- Falling pressure: Deteriorating weather, approaching storms
- Rapid drop (0.06+ inHg/hour): Significant storm approaching
- Steady pressure: Current conditions likely to continue
- Note: Absolute value matters less than the trend

**Wind Patterns**
- Prevailing wind direction for your location
- Seasonal changes in wind patterns
- Wind shifts indicating frontal passages
- Correlation between wind direction and weather type

**Rainfall Analysis**
- Monthly and annual totals
- Rain rate (inches/hour) for intensity
- Compare to historical averages for your area
- Track drought conditions or excess rainfall

### Data Logging
- Most WiFi stations log to cloud services automatically
- CSV export for spreadsheet analysis
- Calculate: Monthly averages, records, degree days, growing degree days
- Create charts to visualize trends over time

## Online Integration

### Weather Underground (wunderground.com)
1. Create Weather Underground account
2. Register your station (get Station ID and API key)
3. Enter credentials in your station's settings
4. Your data appears on the WU map and personal weather station page
5. Compare with nearby stations for accuracy validation

### CWOP (Citizen Weather Observer Program)
- Data feeds into NOAA/NWS forecasting models
- Your data directly helps improve official weather forecasts
- Registration through wxqa.com
- Requires APRS-formatted data (most Davis and Ambient stations support this)

### Other Networks
- **Ambient Weather Network** - For Ambient Weather stations
- **WeatherCloud** - International weather station network
- **PWSweather** - Community weather data sharing
- **Weather Observations Website (WOW)** - UK Met Office program

### Home Automation Integration
- **Home Assistant** - Direct integration with most station types
- **IFTTT** - Trigger actions based on weather thresholds
- **SmartThings** - Automate based on temperature, rain, wind
- Example automations: Close smart blinds when UV is high, alert when frost is likely, turn on dehumidifier when humidity exceeds threshold

## Basic Forecasting Skills

### Using Barometric Pressure
The barometer is your most powerful forecasting tool:
- **Steady above 30.20 inHg**: Fair weather likely
- **Falling from 30.00 to below 29.80**: Storm approaching within 12-24 hours
- **Below 29.60 and still falling**: Significant storm imminent
- **Rising after low**: Storm passing, improvement coming

### Cloud Identification for Forecasting
- **Cirrus** (thin, wispy, high): Fair now, but weather may change in 24-48 hours
- **Cumulus** (puffy, white): Fair weather (unless they grow tall)
- **Cumulonimbus** (tall, anvil-shaped): Thunderstorms, severe weather
- **Stratus** (flat, gray, low): Overcast, possible light rain/drizzle
- **Nimbostratus** (thick, dark): Steady rain or snow

### Wind Direction Rules (Northern Hemisphere)
- **South/Southeast wind**: Warm, moist air approaching
- **Northwest wind**: Cold, dry air behind a cold front
- **East/Northeast wind**: Often precedes storms (coastal areas especially)
- **Veering winds** (shifting clockwise): Improving weather
- **Backing winds** (shifting counterclockwise): Deteriorating weather

### Forecasting Checklist
1. Check barometric pressure and its 3-hour and 12-hour trend
2. Note current wind direction and any shifts
3. Observe cloud types and movement direction
4. Check humidity and dew point trends
5. Compare with official NWS forecast for calibration
6. Over time, develop local knowledge of patterns specific to your area

## Storm Tracking

### Severe Weather Awareness
- Sign up for NWS alerts for your county
- Watch for: Rapid pressure drops, sudden wind shifts, green-tinted sky, rotating clouds
- Have a NOAA Weather Radio as backup to internet
- Know the difference: Watch (conditions favorable) vs Warning (event occurring or imminent)

### Lightning Safety
- Count seconds between flash and thunder, divide by 5 = miles
- 30/30 rule: Go inside when count is under 30 seconds, stay inside 30 minutes after last thunder
- Your station data can show the pressure drop and wind shift that precedes storms

## Seasonal Patterns to Track

### Spring
- Rapid temperature swings, severe weather season begins
- Track last frost date for gardening
- Monitor soil temperature if you have soil probe
- Tornado season peak (varies by region)

### Summer
- Heat index calculations (temperature + humidity)
- Afternoon thunderstorm patterns
- UV index monitoring for health
- Drought tracking via rainfall totals

### Fall
- First frost date monitoring
- Cooling degree days calculation
- Hurricane season awareness (June-November, peak August-October)
- Fog formation conditions (dew point near temperature)

### Winter
- Wind chill monitoring
- Snowfall measurement (manual, separate from rain gauge)
- Freezing rain conditions (temperature near 32F with precipitation)
- Heating degree days calculation

## Equipment Maintenance

### Monthly
- Check rain gauge for debris (leaves, insects, bird droppings)
- Verify data against nearby NWS station for accuracy
- Clean solar panel if station is solar-powered

### Quarterly
- Inspect all mounting hardware for corrosion or loosening
- Check radiation shield vents for blockage
- Verify battery levels in all sensors
- Compare readings with a calibrated reference if available

### Annually
- Replace batteries in outdoor sensors (even if showing OK)
- Clean and lubricate moving parts (cup anemometer bearings)
- Calibrate rain gauge with measured water pour
- Inspect cables and mounting pole for weather damage
- Update firmware/software

## Progression Path

1. **Phase 1**: Install basic station, learn to read conditions, compare with official data
2. **Phase 2**: Join Weather Underground, start data analysis, learn forecasting basics
3. **Phase 3**: Add supplementary sensors (soil moisture, lightning, additional temperature)
4. **Phase 4**: Contribute to CWOP, track seasonal patterns, refine local forecasting
5. **Phase 5**: Integrate with home automation, build custom dashboards (Grafana)
6. **Phase 6**: Mentor others, participate in CoCoRaHS or local NWS spotter training


## Output Format

Deliver the response as a structured document with clear headings and actionable content. Use tables for comparisons, numbered lists for sequential steps, and bullet points for options. Include specific examples where applicable.

```
[Weather Station deliverable]
1. Context and objectives
2. Analysis or framework
3. Specific recommendations with rationale
4. Action items with timeline
```


## Example

**Input:** "Help me with weather station for a mid-size project."

**Output:** A complete weather station framework tailored to the specific context, with actionable steps, relevant considerations, and measurable outcomes.


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding rather than making assumptions
- **Conflicting requirements:** Identify trade-offs explicitly and present options with pros and cons
- **Scale mismatch:** Adapt recommendations to match the user's context (individual vs. team vs. organization)
- **Domain crossover:** When the request overlaps with other skill domains, address what falls within scope and reference specialized skills for the rest
