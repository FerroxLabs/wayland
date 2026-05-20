---
name: home-automation-builder
description: |
  Guides smart home system design with Home Assistant, Zigbee/Z-Wave protocols, automation rules, dashboards, and integration patterns
  Use when the user asks about home automation builder, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of home automation builder or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced iot template guide cloud testing automation networking"
  category: "emerging-tech"
  subcategory: "embedded-iot"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Home Automation Builder

You are an expert home automation architect. You guide developers through Home Assistant configuration, Zigbee and Z-Wave protocol selection, automation rule design, dashboard creation, device integration patterns, and reliable smart home system architecture.


## When to Use

**Use this skill when:**
- User asks about home automation builder techniques or best practices
- User needs guidance on home automation builder concepts
- User wants to implement or improve their approach to home automation builder

**Do NOT use when:**
- The request falls outside the scope of home automation builder
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Protocol Comparison

### Wireless Protocol Selection

| Protocol | Frequency | Range | Mesh | Power | Best For |
|----------|-----------|-------|------|-------|----------|
| Zigbee 3.0 | 2.4 GHz | 10-30m | Yes | Very Low | Sensors, lights |
| Z-Wave LR | 908 MHz | 100m+ | Yes | Very Low | Locks, switches |
| Thread/Matter | 2.4 GHz | 30m | Yes | Low | New devices |
| WiFi | 2.4/5 GHz | 50m | No | High | Cameras, displays |
| BLE | 2.4 GHz | 10m | BLE Mesh | Very Low | Presence, beacons |

### Coordinator Hardware

| Coordinator | Zigbee | Z-Wave | Thread | Notes |
|-------------|--------|--------|--------|-------|
| SkyConnect | Yes | No | Yes | Official HA dongle |
| Sonoff ZBDongle-P | Yes | No | No | CC2652P, wide support |
| Sonoff ZBDongle-E | Yes | No | Yes | EFR32MG21, Thread ready |
| Zooz ZST39 | No | Yes | No | 800 series, Long Range |

## Home Assistant Configuration

### Core Configuration

```yaml
# configuration.yaml
homeassistant:
  name: Home
  unit_system: imperial
  time_zone: America/New_York
  latitude: 40.7128
  longitude: -74.0060

default_config:

logger:
  default: warning
  logs:
    homeassistant.components.zha: info
    homeassistant.components.automation: info

recorder:
  db_url: "postgresql://hass:password@localhost/hass"
  purge_keep_days: 30
  commit_interval: 5
  exclude:
    domains: [automation, updater]
    entity_globs: [sensor.weather_*]

http:
  ssl_certificate: /ssl/fullchain.pem
  ssl_key: /ssl/privkey.pem
  ip_ban_enabled: true
  login_attempts_threshold: 5
```

### Sensor Template Configuration

```yaml
# templates.yaml
- sensor:
    - name: "House Average Temperature"
      unique_id: house_avg_temp
      unit_of_measurement: "°F"
      state: >
        {% set sensors = [
          states('sensor.living_room_temperature'),
          states('sensor.bedroom_temperature'),
          states('sensor.kitchen_temperature'),
          states('sensor.office_temperature')
        ] | select('is_number') | map('float') | list %}
        {% if sensors | length > 0 %}
          {{ (sensors | sum / sensors | length) | round(1) }}
        {% else %}unknown{% endif %}

    - name: "Energy Cost Today"
      unique_id: energy_cost_today
      unit_of_measurement: "$"
      state: >
        {% set kwh = states('sensor.total_energy_today') | float(0) %}
        {{ (kwh * 0.12) | round(2) }}
```

## Automation Design Patterns

### Motion-Activated Lighting

```yaml
- alias: "Living Room Motion Light"
  id: living_room_motion_light
  mode: restart

  trigger:
    - platform: state
      entity_id: binary_sensor.living_room_motion
      to: "on"
      id: motion_on
    - platform: state
      entity_id: binary_sensor.living_room_motion
      to: "off"
      for: { minutes: 5 }
      id: motion_off

  action:
    - choose:
        - conditions:
            - condition: trigger
              id: motion_on
          sequence:
            - choose:
                - conditions:
                    - condition: time
                      after: "22:00:00"
                      before: "06:00:00"
                  sequence:
                    - service: light.turn_on
                      target: { entity_id: light.living_room }
                      data: { brightness_pct: 10, color_temp_kelvin: 2200 }
                - conditions:
                    - condition: numeric_state
                      entity_id: sensor.living_room_illuminance
                      below: 100
                  sequence:
                    - service: light.turn_on
                      target: { entity_id: light.living_room }
                      data: { brightness_pct: 80, color_temp_kelvin: 4000 }
        - conditions:
            - condition: trigger
              id: motion_off
          sequence:
            - service: light.turn_off
              target: { entity_id: light.living_room }
              data: { transition: 5 }
```

### Climate Control Automation

```yaml
- alias: "Smart Thermostat Schedule"
  id: smart_thermostat_schedule
  mode: queued

  trigger:
    - platform: time
      at: ["06:30:00", "08:30:00", "17:00:00", "22:00:00"]
    - platform: state
      entity_id: group.family
      to: "not_home"
      for: { minutes: 15 }
      id: everyone_left
    - platform: state
      entity_id: group.family
      to: "home"
      id: someone_home

  action:
    - choose:
        - conditions: [{ condition: trigger, id: everyone_left }]
          sequence:
            - service: climate.set_preset_mode
              target: { entity_id: climate.thermostat }
              data: { preset_mode: eco }
        - conditions: [{ condition: trigger, id: someone_home }]
          sequence:
            - service: climate.set_preset_mode
              target: { entity_id: climate.thermostat }
              data: { preset_mode: comfort }
```

### Security System

```yaml
- alias: "Security Arm on Departure"
  id: security_arm_departure
  mode: single
  trigger:
    - platform: state
      entity_id: group.family
      to: "not_home"
      for: { minutes: 5 }
  condition:
    - condition: state
      entity_id: alarm_control_panel.home
      state: "disarmed"
  action:
    - service: alarm_control_panel.alarm_arm_away
      target: { entity_id: alarm_control_panel.home }
    - service: lock.lock
      target:
        entity_id: [lock.front_door, lock.back_door]
    - service: notify.family
      data: { title: "Security", message: "Home armed - all doors locked" }

- alias: "Security Alert on Breach"
  id: security_breach_alert
  mode: single
  trigger:
    - platform: state
      entity_id:
        - binary_sensor.front_door_contact
        - binary_sensor.back_door_contact
        - binary_sensor.garage_door_contact
      to: "on"
  condition:
    - condition: state
      entity_id: alarm_control_panel.home
      state: "armed_away"
  action:
    - service: alarm_control_panel.alarm_trigger
      target: { entity_id: alarm_control_panel.home }
    - service: notify.family
      data:
        title: "SECURITY ALERT"
        message: >
          {{ trigger.to_state.attributes.friendly_name }} opened
          while alarm is armed! ({{ now().strftime('%H:%M') }})
        data: { priority: high }
    - service: camera.snapshot
      target: { entity_id: camera.front_door }
      data:
        filename: "/config/snapshots/alert_{{ now().strftime('%Y%m%d_%H%M%S') }}.jpg"
```

## Dashboard Design

### Lovelace Dashboard Configuration

```yaml
title: Home
views:
  - title: Overview
    path: overview
    type: sections
    sections:
      - title: Climate
        cards:
          - type: thermostat
            entity: climate.thermostat
          - type: sensor
            entity: sensor.house_avg_temp
            graph: line
            hours_to_show: 24

      - title: Lighting
        cards:
          - type: light
            entity: light.living_room
          - type: entities
            title: All Lights
            show_header_toggle: true
            entities:
              - light.kitchen
              - light.office
              - light.garage
              - light.porch

      - title: Security
        cards:
          - type: alarm-panel
            entity: alarm_control_panel.home
          - type: grid
            columns: 2
            cards:
              - type: entity
                entity: lock.front_door
              - type: entity
                entity: lock.back_door
              - type: entity
                entity: binary_sensor.garage_door_contact
              - type: entity
                entity: binary_sensor.front_door_contact

      - title: Energy
        cards:
          - type: energy-distribution
            link_dashboard: true
```

## Custom Integration Pattern

### MQTT Device Integration

```yaml
mqtt:
  sensor:
    - name: "Garden Temperature"
      unique_id: garden_node_temp
      state_topic: "sensors/garden/data"
      value_template: "{{ value_json.temperature }}"
      unit_of_measurement: "°F"
      device_class: temperature
      state_class: measurement
      availability_topic: "sensors/garden/status"
      device:
        identifiers: ["garden_node_001"]
        name: "Garden Sensor Node"
        manufacturer: "DIY"
        model: "ESP32 Weather Station"

    - name: "Garden Humidity"
      unique_id: garden_node_hum
      state_topic: "sensors/garden/data"
      value_template: "{{ value_json.humidity }}"
      unit_of_measurement: "%"
      device_class: humidity
      device:
        identifiers: ["garden_node_001"]
```

## Reliability Patterns

### Automation Error Handling

```yaml
- alias: "Resilient Light Control"
  id: resilient_light_control
  mode: queued
  max: 3
  trigger:
    - platform: state
      entity_id: binary_sensor.motion
      to: "on"
  action:
    - repeat:
        count: 3
        sequence:
          - service: light.turn_on
            target: { entity_id: light.unreliable_bulb }
            data: { brightness_pct: 100 }
          - delay: { seconds: 2 }
          - condition: template
            value_template: "{{ is_state('light.unreliable_bulb', 'on') }}"
        until:
          - condition: template
            value_template: "{{ is_state('light.unreliable_bulb', 'on') }}"
    - if:
        - condition: template
          value_template: "{{ is_state('light.unreliable_bulb', 'off') }}"
      then:
        - service: notify.admin
          data: { message: "Light failed to turn on after 3 attempts" }
```

## Common Pitfalls

| Mistake | Impact | Solution |
|---------|--------|----------|
| WiFi-only devices | Network congestion | Prefer Zigbee/Z-Wave for sensors |
| Cloud-dependent devices | Fails without internet | Choose local-control devices |
| No backup automations | Smart home becomes dumb | Physical switches as fallback |
| Too many automations | Conflicts, unpredictable | Document, test, use blueprints |
| No recorder filtering | Database grows to GB | Exclude noisy entities |
| Unencrypted MQTT | Eavesdropping | TLS + authentication always |

## Exercises

1. **Lighting Scenes**: Create 4 scenes (Morning, Day, Evening, Night) with smooth transitions triggered by time and occupancy
2. **Climate Zones**: Build multi-zone climate with temperature sensors and smart vents
3. **Security Dashboard**: Design panel with door/window sensors, cameras, motion detection, and mobile notifications
4. **Energy Monitor**: Track whole-home energy with per-circuit breakdown and solar production
5. **Guest Mode**: Implement guest automation with simplified controls and comfortable defaults


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to home automation builder
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Home Automation Builder Analysis

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

**Input:** "Help me with home automation builder for my current situation"

**Output:**

Based on your situation, here is a structured approach to home automation builder:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
