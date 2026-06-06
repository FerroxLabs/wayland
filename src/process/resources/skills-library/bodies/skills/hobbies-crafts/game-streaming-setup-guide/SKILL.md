---
name: game-streaming-setup-guide
description: |
  Guides beginners through setting up a game streaming environment: hardware
  requirements (PC specifications, capture cards, microphones, webcams),
  streaming software configuration (scenes, sources, audio routing),
  stream settings (bitrate, resolution, encoder), and channel setup. Organized
  by budget tier with a step-by-step first-stream checklist. Use when the
  user wants to start streaming games, asks about streaming hardware or
  software setup, needs help with stream settings like bitrate and resolution,
  or wants to configure scenes and audio routing. Do NOT use for tabletop
  RPG campaign design (use tabletop-rpg-campaign-builder), board game
  selection (use board-game-selection-guide), or video production and
  editing (use design-creative skills).
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "beginner-friendly step-by-step checklist guide"
  category: "hobbies-crafts"
  subcategory: "games-puzzles"
  depends: ""
  disclaimer: "none"
  difficulty: "beginner"
---
# Game Streaming Setup Guide

## When to Use

Use this skill when the user's request clearly falls into one of these scenarios:

- The user explicitly says they want to start streaming games and does not know where to begin -- they need hardware guidance, software setup, and stream configuration from scratch
- The user asks about streaming software scenes, sources, transitions, overlays, or audio routing for a live gaming stream
- The user needs help choosing or configuring specific stream output settings: bitrate, resolution, frame rate, encoder type, keyframe interval, or buffer size
- The user has streaming software installed but is getting errors: dropped frames, encoding overload warnings, black screen on game capture, or audio sync issues
- The user asks how to set up a capture card for console streaming (PlayStation, Xbox, Nintendo Switch, or retro consoles)
- The user wants a budget-tier hardware recommendation for streaming -- either "what do I need to buy" or "can I stream with what I already own"
- The user wants to build or improve their streaming overlay, scene structure, or on-screen information layout
- The user asks about audio setup for streaming -- microphone filters, audio routing, avoiding echo, managing multiple audio sources simultaneously
- The user wants a pre-stream checklist or a systematic approach to their first live stream

Do NOT use this skill when:
- The user wants to design a tabletop RPG campaign or game session (use `tabletop-rpg-campaign-builder` -- streaming and tabletop are entirely separate domains)
- The user wants board game recommendations or game selection advice (use `board-game-selection-guide`)
- The user wants to edit recorded video, create YouTube content, or produce post-stream VODs (use design-creative video production skills -- streaming and video editing have different toolchains and workflows)
- The user is asking about professional broadcast production for television, esports events, or commercial broadcasting -- this requires dedicated broadcast hardware, multi-camera directors, and production software beyond the scope of a personal streaming setup
- The user only wants to record gameplay locally without streaming -- recording-only setups have different encoder and storage tradeoffs not covered here (no upload speed constraints, different bitrate targets, different scene needs)
- The user wants to host a gaming tournament, set up a LAN event, or manage spectator infrastructure -- these are network engineering and event production problems, not personal streaming setup
- The user wants to create video game content on short-form platforms (vertical-format recording, phone-based editing, algorithmic optimization) -- this is social media content creation, not live streaming setup

---

## Process

### Step 1: Assess the Streamer's Starting Point

Before recommending anything, gather the following information. If the user has not provided it, ask directly -- do not make assumptions about hardware or internet:

- **Target platform:** Where do they plan to stream? Different platforms have different bitrate limits, ingest server requirements, and partner/affiliate tier restrictions. This affects bitrate ceilings and encoder recommendations.
- **Game type:** PC games, console games (identify the specific console -- PlayStation 5, Xbox Series X/S, Nintendo Switch, older generation), mobile games, or retro/emulated games. Each requires a different capture approach.
- **PC specifications:** CPU (brand, model, core count), GPU (brand and generation), RAM (total GB). If the user does not know their specs, guide them: on Windows, press Win+R, type `dxdiag`, and press Enter -- this shows CPU, RAM, and GPU. Alternatively, open Task Manager (Ctrl+Shift+Esc), click Performance tab.
- **Internet upload speed:** Must be measured via a speed test taken on the streaming PC using a wired Ethernet connection, not Wi-Fi. The test result -- not the advertised plan speed -- is what matters. Ask specifically for the upload Mbps result.
- **Available budget:** Use these tiers -- $0 (stream with existing hardware), under $100, $100-$300, $300-$500, $500+. Each tier unlocks meaningfully different hardware options.
- **Streaming goal:** Casual streaming for friends and family, building a public audience, competitive/esports content, or just personal archiving. This affects how much time to invest in overlays, scene polish, and branding.
- **Current peripherals:** Does the user have a headset (and what type -- gaming headset, studio headset), a standalone microphone, a webcam, a second monitor, or a capture card already? Many beginners underestimate what they already own.

### Step 2: Evaluate and Recommend Hardware by Budget Tier

After gathering the profile, assess hardware needs systematically. Address each component category:

**CPU Requirements for Streaming:**
- 4-core CPU (e.g., older Intel Core i5 or AMD Ryzen 3): Can stream at 720p30 using hardware encoding only. Software encoding (x264) will cause encoding overload warnings during demanding games. This is a hard limitation.
- 6-core CPU (e.g., Intel Core i5-10th gen or newer, AMD Ryzen 5 3600 or newer): Comfortable 1080p30 with hardware encoding. Software encoding is possible at the "fast" or "veryfast" preset, not slower presets.
- 8-core CPU or better: Can run software encoding at "medium" preset while gaming without significant performance impact. This is the threshold where dual-PC streaming setups become unnecessary for most game types.
- For a dual-PC setup (gaming PC + dedicated streaming PC), the streaming PC only needs a 4-core CPU with decent single-threaded performance -- it handles only encoding, not gameplay.

**GPU Requirements and Hardware Encoding:**
- NVIDIA GPUs (GTX 1000 series and newer) support NVENC hardware encoding. GTX 1060 and older use NVENC 6.0 with lower quality. RTX 2000 series and newer use NVENC 7.0, which is significantly better -- nearly matching x264 "slow" preset quality at the same bitrate.
- AMD GPUs (RX 400 series and newer) support VCE/AMF hardware encoding. Quality is generally below NVENC 7.0 but acceptable for streaming.
- Intel Arc GPUs (2022 and newer) support QuickSync hardware encoding with competitive quality to NVENC.
- If the GPU supports hardware encoding, use it for single-PC setups. The performance impact on the GPU for encoding is typically 0-5% on modern GPUs.

**RAM:**
- 16 GB minimum for streaming. The game, streaming software, operating system, and browser (for alerts/chat monitoring) together consume 10-14 GB in typical use.
- 32 GB is recommended if the user also wants to run a voice chat application, a browser with extensions, and a music streaming app simultaneously.
- RAM speed matters less than total capacity for streaming. Do not recommend expensive high-speed kits over capacity.

**Storage:**
- SSD for OS and game installations is essential. HDD boot drives create startup latency and occasional streaming hitches when the drive is accessed. This is not optional for a quality experience.
- If the user wants to record locally while streaming (recommended), they need sufficient free space. At 1080p60 recording (lossless or near-lossless), expect 4-8 GB per hour. At re-encoded 1080p30, expect 1-2 GB per hour.

**Internet Connection:**
- Upload speed thresholds are firm ceilings, not targets. The stream bitrate must never exceed 80% of the measured upload speed to leave headroom for connection variability.
- For a 10 Mbps upload: maximum sustainable stream bitrate is 8000 Kbps. In practice, stay at 6000 Kbps.
- For a 6 Mbps upload: cap at 4500 Kbps maximum. This limits practical streaming to 720p60 or 1080p30 at lower quality.
- Under 5 Mbps upload: streaming is possible at 720p30 with 3000-3500 Kbps. Warn the user that quality will be limited. Wired Ethernet is mandatory.
- Always recommend wired Ethernet over Wi-Fi for streaming. Even fast Wi-Fi connections have microsecond-level packet variance that manifests as dropped frames in streaming software.

**Peripheral Recommendations by Budget Tier:**

| Budget | Microphone | Webcam | Lighting | Other |
|--------|-----------|--------|---------|-------|
| $0 (use existing) | Gaming headset mic with noise gate filter | Built-in laptop cam or skip | Desk lamp facing you | Second monitor from TV or old monitor |
| Under $100 | USB dynamic microphone ($50-60) | 1080p USB webcam ($30-40) | Ring light ($15-25) | External USB hub if needed |
| $100-$300 | USB condenser mic or dynamic mic with USB interface ($80-130) | 1080p 60fps webcam ($70-100) | Two-point lighting kit ($40-60) | Capture card for console ($100-160) |
| $300-$500 | XLR dynamic mic + USB audio interface ($150-200) | 4K webcam or mirrorless camera with capture card ($150-250) | Full 3-point lighting setup ($60-100) | Stream deck controller ($100-150) |
| $500+ | Professional XLR condenser or dynamic mic + quality interface ($200-400) | Mirrorless or DSLR via HDMI with capture card ($300-600) | Softbox lighting ($100-200) | Second monitor, acoustic panels, premium stream deck |

**Microphone type guidance:** Dynamic microphones (cardioid pickup pattern) reject off-axis sound -- keyboard noise, PC fans, room echo -- because of their tighter polar pattern and lower sensitivity. Condenser microphones are more sensitive and capture higher frequency detail but pick up every sound in the room. For untreated rooms with ambient noise, dynamic microphones are the better choice for streaming. Condenser microphones reward acoustic treatment.

**Capture Card Selection (console streamers):**
- USB external capture cards: plug into any USB 3.0 port, no PC case slot required. Latency is slightly higher than internal cards but imperceptible for streaming purposes (not for gaming response time). Best choice for most beginners.
- PCIe internal capture cards: sit inside the PC case, connect via PCIe slot. Lower latency on the capture preview, higher throughput for 4K30 or 1080p60 HDR capture. Necessary for high-fidelity console capture at premium quality.
- Passthrough requirement: verify the capture card supports 4K60 HDMI passthrough if using a 4K TV. Some budget capture cards cap passthrough at 1080p60, which means the TV display is limited even if the console outputs 4K.

### Step 3: Configure Streaming Software -- Scenes, Sources, and Layout

Streaming software is the hub where all hardware inputs combine into a broadcast. Guide the user through initial configuration:

**Software Overview:**
- OBS Studio is the dominant free, open-source streaming application for Windows, macOS, and Linux. It is the reference for this skill's configuration guidance because it is universally available and used as the basis for most other streaming applications.
- Streamlabs (built on OBS) adds a built-in alert system and theme store but uses more RAM and CPU than OBS Studio. Appropriate for beginners who want an easier first-time setup.
- OBS with the StreamElements or similar plugin provides alerts and overlays while keeping OBS's lightweight footprint. Recommended for users with mid-range hardware.

**Scene Structure -- Minimum Required Scenes:**

Every stream needs at least four scenes before going live. Having fewer creates awkward dead air or exposes the desktop during transitions:

1. **Starting Soon scene:** Displayed for 5-10 minutes before gameplay begins. Sources: a static branded image or a looping animation, a countdown timer (implemented as a browser source pointing to a countdown widget), and optionally soft background music as an audio source. This sets viewer expectations and lets latecomers join before the game begins.

2. **Game scene:** The main active scene during gameplay. Sources in stacking order (top to bottom in software source list = top to bottom in visual render):
   - Overlay graphics (top layer): follower/subscriber alerts, donation alerts, stream info panels. Implemented as browser sources pointing to an alert service.
   - Webcam (second layer): positioned in a lower corner, typically 15-20% of total frame width. Use the built-in color key or chroma key filter if using a green screen.
   - Game capture (bottom layer): full-screen game capture source.
   
3. **Be Right Back (BRB) scene:** A holding image with background music. The image should include the stream name and an indication that the streamer will return. Do not show gameplay while away -- it continues without commentary and is not engaging.

4. **Ending scene:** Displayed during the last 1-3 minutes of the stream. Include the stream name, social media handles, a "thanks for watching" message, and potentially an auto-playing clip from a highlight moment if the platform supports it.

**Optional advanced scenes:**
- **Intermission/Transition scene:** A brief animated transition (0.5-1 second) used between scene switches. Created using a "Stinger" transition in OBS (a video file with transparency that plays between scenes).
- **Facecam-only scene:** Used when the game audio is silent or during discussions. Webcam takes 80% of the frame.
- **Chat overlay scene:** For games where showing chat on-screen is part of the content.

**Game Capture Configuration -- Specific Settings:**
- Use "Game Capture" source type (not "Window Capture" or "Display Capture") whenever possible. Game Capture hooks directly into the game's render pipeline for lower latency capture and better compatibility with anti-cheat software.
- Set Game Capture to "Capture specific window" and select the game process. This prevents accidentally capturing the wrong window during an alt-tab.
- If Game Capture shows a black screen: (1) Run the streaming software as administrator (right-click the shortcut, "Run as administrator"). (2) In the game's settings, disable hardware acceleration or switch from DirectX 12 to DirectX 11 mode. (3) Try Window Capture as a fallback.
- For multi-monitor setups: make sure the game is running on the primary monitor when using Game Capture (or specify the correct window).

**Webcam Configuration:**
- Set webcam properties: 1920x1080 resolution, 30 fps (or 60 fps if the webcam supports it). In OBS, right-click the webcam source, click "Properties," and set resolution and FPS manually rather than leaving them on "Device Default."
- Apply a slight crop to remove webcam edges. Use the Alt+drag shortcut in OBS to crop without adding a crop filter.
- Add a "Color Correction" filter to adjust brightness, contrast, and saturation if the webcam image looks flat or overexposed. A -5 to -10 brightness reduction and +10-15 saturation boost is common.
- Position: lower-right corner is conventional in Western streaming culture. Lower-left is also acceptable. Do not center the webcam overlay -- it covers too much of the game.

### Step 4: Configure Audio Routing with Precision

Audio quality is the most critical factor in viewer retention. A stream with mediocre video but excellent audio is far more watchable than the reverse. Configure audio with care:

**Audio Sources in Streaming Software:**
- **Desktop Audio:** Captures all system audio -- game sounds, Windows notifications, music players, video calls. This appears in the mixer as a single channel. If the user is playing music from a subscription service (for copyright reasons, this is risky -- flag the concern), it is captured here.
- **Microphone/Auxiliary Input:** The streamer's voice. Appears as a separate mixer channel.
- **Browser Source Audio:** Alert sounds from the streaming overlay service. These appear as part of the browser source's audio output.

**Audio Filters -- Applied to the Microphone Source:**

Apply these three filters in this order (order matters -- they chain in sequence):

1. **Noise Suppression:** Uses algorithmic processing to remove constant background noise (PC fans, air conditioning, room hum). Set suppression level to -30 dB for moderate background noise, -24 dB for a quiet room. Use sparingly -- too aggressive causes the voice to sound robotic.

2. **Noise Gate:** Silences the microphone completely when the volume falls below a threshold. This eliminates keyboard clicks, breathing, and ambient noise during pauses.
   - Close Threshold: -35 to -30 dB (microphone opens when sound exceeds this)
   - Open Threshold: -26 to -22 dB (microphone stays open above this)
   - Attack: 25 ms (how fast the gate opens)
   - Hold: 200 ms (how long the gate stays open after sound drops below threshold)
   - Release: 150 ms (how fast the gate closes)
   - Adjust thresholds by watching the meter while speaking and being silent.

3. **Compressor:** Reduces dynamic range -- makes quiet speech louder and loud speech quieter, resulting in consistent volume.
   - Ratio: 3:1 to 4:1 (appropriate for speech; 10:1 is for hard limiting, not needed here)
   - Threshold: -18 dB (compression begins when the signal exceeds this level)
   - Attack: 6 ms
   - Release: 60 ms
   - Output Gain: +3 to +6 dB (compensates for the gain reduction the compressor applies)

4. **Optional -- Gain Filter:** If the microphone is still too quiet after the compressor, add a Gain filter after the compressor and add +3 to +6 dB. Do not add more than +12 dB total -- this amplifies noise floor.

**Audio Level Targets (in the streaming software mixer, represented by the VU meter):**
- Microphone while speaking normally: peaks at -6 to -3 dB. The meter should be in the yellow zone, never hitting red.
- Game audio: consistently around -15 to -12 dB. It should be clearly audible but subordinate to the voice.
- Alert sounds: -12 to -9 dB. Loud enough to be heard but not startling.
- Music (background): -20 to -15 dB. Barely audible under speech, present during pauses.

**Monitoring: Always use closed-back headphones while streaming.** Open-back headphones and speakers leak sound back into the microphone, causing the viewer to hear an echo of game audio. Closed-back headphones also let the streamer monitor their own microphone mix (enable monitoring in OBS audio settings with "Monitor and Output" to hear the stream mix in headphones).

**Multi-track audio recording (advanced):** For streamers who plan to edit VODs, configure OBS to record separate audio tracks. Track 1: mixed (mic + game + alerts). Track 2: microphone only. Track 3: game audio only. This allows re-balancing audio in post-editing without destructive mixing. Set this in OBS Settings > Output > Recording > Audio Track selection.

### Step 5: Configure Output and Stream Settings

Stream settings are the most technically impactful configuration area. Wrong settings cause dropped frames, poor quality, or encoding overload. Configure with the user's measured upload speed and hardware as the firm constraints:

**Resolution and Frame Rate Selection:**

| Stream Profile | Resolution | Frame Rate | Bitrate Range | Min Upload Needed | Best For |
|----------------|-----------|-----------|--------------|-------------------|----------|
| Entry Level | 1280x720 | 30 fps | 3000-4000 Kbps | 6 Mbps | Low-end PCs, slow internet |
| Standard | 1280x720 | 60 fps | 4000-5000 Kbps | 7 Mbps | Fast-paced games, OK hardware |
| Improved | 1920x1080 | 30 fps | 4500-6000 Kbps | 8 Mbps | Good hardware, stable internet |
| High Quality | 1920x1080 | 60 fps | 6000-8000 Kbps | 10 Mbps | Recommended target for 1080p |
| Premium | 1920x1080 | 60 fps | 8000 Kbps | 12 Mbps | Most platforms' quality ceiling |

Note: Most major streaming platforms cap accepted bitrate at 6000-8000 Kbps for standard accounts. Partner or affiliate tiers on some platforms allow higher bitrates. Check the specific platform's documented ingest limits before setting bitrate higher than 8000 Kbps.

**Encoder Selection Decision Tree:**
- If GPU is NVIDIA RTX 2000 series or newer: use NVENC H.264 as the default encoder. Set preset to "Quality" or "Max Quality" in OBS encoder settings. Enable "Psycho Visual Tuning" and "Lookahead" for improved perceived quality.
- If GPU is NVIDIA GTX 1000 series or older: use NVENC H.264, but lower quality. Consider x264 "veryfast" preset if the CPU has 6+ cores and headroom.
- If GPU is AMD RX 5000 series or newer: use AV1 encoding in the AMF stack if supported and the target platform accepts AV1. Otherwise use H.264 AMF.
- If GPU is Intel Arc: use QuickSync H.264 or AV1. QuickSync on recent Intel Arc processors is competitive with NVENC in quality.
- If none of the above or on an older GPU: use software x264 encoding. Start with the "veryfast" preset and monitor CPU usage during gameplay. If CPU usage is under 70%, try "faster." Never use "medium" or slower presets on a single-PC gaming setup without a high-core-count CPU.

**Critical Settings That Are Commonly Missed:**
- **Keyframe interval:** Set to exactly 2 seconds (or "2" in the interval field). This is a technical requirement for most platforms' ingest servers to properly index the stream. If set to 0 (automatic), some platforms will reject or degrade the stream.
- **Rate control:** Use CBR (Constant Bit Rate) for streaming, not VBR or CQP. CBR maintains a steady upload rate, which is what streaming ingest servers expect. VBR can cause buffer underflows on the ingest server side.
- **B-frames:** For NVENC on RTX GPUs, set B-frames to 2. This improves compression efficiency at the same bitrate. On older NVENC (GTX), set B-frames to 0 -- older NVENC handles B-frames less efficiently.
- **Profile:** Set H.264 profile to "High" (not "Baseline" or "Main"). High profile enables the compression improvements that make 1080p streaming practical.
- **Output canvas vs. downscale filter:** In OBS, the base canvas resolution should match the monitor resolution (typically 1920x1080 or 2560x1440). The output resolution is the stream resolution. If streaming at 1280x720 from a 1920x1080 canvas, OBS will downscale. Set the downscale filter to "Lanczos (32 samples)" for the best quality downscale.

**Network Settings (in OBS under Advanced Output):**
- Bind to IP: leave as "Default" unless on a machine with multiple network interfaces and a specific NIC is preferred.
- Network Optimization: enable "Dynamically change bitrate to manage congestion" (OBS' adaptive bitrate feature, called Dynamic Bitrate in some versions) as a safety net. This automatically reduces bitrate temporarily if network congestion occurs, then restores it.
- Enable "New Networking Code" in OBS if available -- it uses better socket management for lower packet loss.

### Step 6: Set Up the Streaming Channel and Platform Configuration

The streaming software setup is meaningless without a properly configured channel on the streaming platform. Guide the user through channel basics:

**Stream Key Setup:**
- The stream key is a secret authentication token generated by the platform. It is found in the platform's dashboard under Settings > Stream or Channel > Stream Key.
- In OBS: Settings > Stream > Service (select platform or use "Custom RTMP") > paste the stream key. Never share the stream key publicly -- anyone with it can stream to the channel.
- Some platforms offer OAuth integration in OBS (connect account directly without pasting a key) -- this is more secure and enables additional features like automatic scene switching.

**Ingest Server Selection:**
- Most platforms offer multiple geographic ingest servers. OBS has a built-in "Auto" option that pings all servers and selects the lowest latency. Use this unless a specific server is known to perform better.
- For manual server selection: choose the geographically nearest server. A server with 20 ms ping will always outperform a server with 80 ms ping at the same bitrate.

**Channel Configuration on the Platform:**
- Set a stream title that includes the game name and an angle ("Learning [Game Name] from scratch" performs better than "Playing games").
- Set the correct game category/tag. Platform algorithms surface streams to viewers who follow or watch that game category. Miscategorizing will hurt discoverability.
- Configure the channel page: profile picture, banner, panel descriptions, and social links. These elements build legitimacy for first-time visitors.
- Age restriction settings: if streaming content intended for adults, configure the appropriate mature content flag to avoid platform policy violations.

**Low Latency Mode:**
- Most platforms offer a low latency or ultra-low latency streaming mode. This reduces the delay between the streamer's actions and what viewers see (from 15-20 seconds on standard latency to 2-5 seconds on ultra-low latency).
- Ultra-low latency increases the ingest server's processing demands and can increase dropped frames on unstable connections. For beginners, start with "Low Latency" mode, not "Ultra-Low Latency."
- Low latency modes are enabled on the platform dashboard, not in the streaming software.

### Step 7: Execute the First-Stream Pre-Flight Checklist

Before going live, the user should complete every item on this checklist. Skipping items is the most common cause of embarrassing first-stream failures (no audio for 30 minutes, black screen instead of game capture, microphone picking up keyboard so loudly viewers leave):

**Technical Verification (30-60 minutes before going live):**
- [ ] Run a speed test on the streaming PC via wired Ethernet. Confirm upload speed exceeds the stream bitrate by at least 25%. (For a 5000 Kbps stream, upload must be at least 6250 Kbps = 6.25 Mbps.)
- [ ] Run a 2-3 minute test stream using the platform's private stream feature (or a secondary test account/channel). Watch the playback immediately after.
- [ ] In the test playback, verify: audio is present and clear, game video is visible and not black, microphone is louder than game audio, no echo or feedback.
- [ ] Check OBS Stats (View > Stats): Dropped Frames % should be 0%. Rendering lag should be under 0.5%. Encoding lag should be 0%.
- [ ] Close all non-essential applications: web browsers, Discord (move to phone), system update clients, cloud sync services (these run background uploads that compete with stream bitrate), and any software that might pop up notifications.
- [ ] Disable system notifications: in Windows, enable Focus Assist (Do Not Disturb) to suppress notification pop-ups that would appear on screen if using Display Capture.

**Environment Check (10 minutes before going live):**
- [ ] Webcam framing: face occupies the upper 2/3 of the webcam overlay box. Top of head should have a small amount of headroom (5-10% of frame). Eyes should be at the upper-third line of the frame.
- [ ] Lighting: the key light is positioned in front of and slightly above eye level. There should be no harsh shadow across the face. Check in the OBS preview, not just by looking at the webcam software.
- [ ] Background: visible in webcam feed. Tidy, intentional, or replaced with a virtual background. Nothing embarrassing or distracting (moving objects, other people in the background, cluttered desk).
- [ ] Microphone position: USB microphone positioned 6-10 inches from the mouth, slightly off-axis (angled slightly to the side of the mouth, not directly in front). Direct positioning causes plosive sounds ("p" and "b" sounds that pop loudly).

**Platform Setup (5 minutes before going live):**
- [ ] Stream title set (includes game name, angle, or hook)
- [ ] Game category selected correctly
- [ ] Relevant tags applied (if the platform supports tags)
- [ ] Stream schedule posted (if applicable -- platforms reward scheduled streams with notification pushes)

### Step 8: Post-Stream Review and Iteration

The first stream is a data-gathering exercise. Guide the user through systematic review to improve the second stream:

**Immediate post-stream review:**
- Watch 10 minutes from the local recording: the opening 5 minutes and a random middle section. Is the audio balance good? Is the video quality acceptable? Are overlays displaying correctly?
- Review the OBS log file (Help > Log Files > Current Log in OBS). Look for lines containing "warning," "encoder," "frame dropped," or "Network congestion." These identify the root cause of any quality issues during the stream.
- Note the OBS Stats for dropped frames. Under 0.5% is acceptable. Over 1% requires investigation (reduce bitrate, check network, close background apps).

**Iterative improvement framework:**
- First 3 streams: focus exclusively on technical stability. If the stream runs without dropped frames and audio is intelligible, it is a success. Do not add complexity (alerts, channel points, subscriptions) until the base is stable.
- Streams 4-10: optimize audio quality. Tune microphone filters. Experiment with game audio balance. Get feedback from viewers on audio levels.
- Streams 10+: add overlay polish, transition stingers, alert animations, and channel branding. These elements matter more once an audience exists to see them.

---

## Output Format

```
## Game Streaming Setup Plan

### Streamer Profile
- Platform target: [platform name]
- Game type: [PC games / Console (specify) / Mobile / Mixed]
- PC specs: [CPU name and core count], [GPU name and generation], [RAM GB]
- Measured upload speed: [X] Mbps (wired Ethernet test)
- Budget: [$X tier]
- Streaming goal: [casual / audience building / competitive content]
- Hardware already owned: [list relevant items]

---

### Hardware Assessment and Recommendations

| Component | Current Status | Recommendation | Est. Cost | Priority |
|-----------|---------------|---------------|-----------|---------|
| PC / CPU | [spec] | [sufficient / needs upgrade] | $0 or $X | [1-5] |
| GPU | [spec] | [hardware encoding capable: yes/no] | $0 or $X | [1-5] |
| RAM | [GB] | [sufficient / upgrade to 16+ GB] | $0 or $X | [1-5] |
| Microphone | [current mic] | [recommendation with type and reason] | $X | [1-5] |
| Webcam | [current cam or none] | [recommendation or "optional"] | $X | [1-5] |
| Lighting | [current setup] | [recommendation] | $X | [1-5] |
| Capture card | [N/A or needed] | [USB external or PCIe internal] | $X | [1-5] |
| Second monitor | [yes/no] | [recommended / use phone as alternative] | $X | [1-5] |
| **Estimated Total** | | | **$X-X** | |

Hardware priorities explanation:
- Priority 1: [most impactful upgrade for this user -- explain why]
- Priority 2: [second most impactful -- explain why]
- Priority 3+: [defer until the stream is stable and audience is growing]

---

### Recommended Stream Output Settings

| Setting | Recommended Value | Reasoning |
|---------|------------------|-----------|
| Base Canvas Resolution | [user's monitor resolution] | Matches source material |
| Output Stream Resolution | [1280x720 or 1920x1080] | [based on upload speed and hardware] |
| Downscale Filter | Lanczos (32 samples) | Best quality for downscaling |
| Frame Rate | [30 or 60 fps] | [based on game type and hardware headroom] |
| Bitrate | [XXXX] Kbps CBR | [X% of measured upload speed] |
| Encoder | [NVENC H.264 / AMF H.264 / x264 veryfast] | [based on GPU generation] |
| Encoder Preset | [Quality / Max Quality / veryfast] | [hardware or software specific] |
| Keyframe Interval | 2 seconds | Platform ingest requirement |
| Rate Control | CBR | Required for stable ingest |
| H.264 Profile | High | Enables best compression efficiency |
| B-frames | [0 or 2] | [based on GPU generation] |

---

### Scene Structure

| Scene Name | Layer Order (top to bottom) | Audio Sources | When to Activate |
|------------|---------------------------|--------------|-----------------|
| Starting Soon | Countdown timer (browser), Branded image, Background music | Music (BG) only | 5-10 min before go live |
| Game Scene | Alert overlay (browser), Webcam (lower corner), Game capture | Desktop audio, Microphone, Alert audio | During gameplay |
| Be Right Back | BRB image, Background music | Music (BG) only | During any break |
| Ending | End card image, Social handles text | None or music at -20 dB | Final 2-3 minutes |

Scene transition: use a 150-300 ms Fade transition between all scenes. Add a Stinger transition when one is designed.

---

### Audio Configuration

| Source | OBS Mixer Level Target | Filters (in order) | Notes |
|--------|----------------------|-------------------|-------|
| Microphone | -6 to -3 dB peak | 1. Noise Suppression (-30 dB), 2. Noise Gate (close: -32 dB, open: -26 dB, attack 25ms, hold 200ms, release 150ms), 3. Compressor (ratio 3:1, threshold -18 dB, attack 6ms, release 60ms, gain +3 dB) | Monitor on headphones only |
| Desktop Audio (Game) | -15 to -12 dB | None | Includes game sounds, music |
| Alert Browser Source | -12 to -9 dB | None | Alerts managed in OBS mixer |
| Background Music | -20 to -15 dB | None | BRB and Starting Soon scenes |

Monitoring: Enable "Monitor and Output" on microphone source in OBS. Use closed-back headphones. Never use speakers while streaming.

---

### Pre-Stream Checklist

**Technical Setup (30-60 min before)**
- [ ] Speed test completed -- upload: [X] Mbps (must be ≥ [Y] Mbps for [bitrate] Kbps stream)
- [ ] OBS stream key confirmed in Settings > Stream
- [ ] Game launched and Game Capture source shows game (not black screen)
- [ ] Webcam visible in preview, framing correct (eyes at upper-third line)
- [ ] Microphone peaking at -6 to -3 dB when speaking at normal volume
- [ ] Game audio running at -15 to -12 dB in OBS mixer
- [ ] Alert sources tested (browser source refreshed)
- [ ] 2-3 minute test stream completed and VOD reviewed (audio: ✓, video: ✓, no echo: ✓)
- [ ] OBS Stats confirm: Dropped Frames = 0%, Rendering Lag < 0.5%

**Application Environment**
- [ ] Browsers closed (or minimized -- do not leave active tabs loading)
- [ ] Cloud sync paused (suspend automatic uploads during stream)
- [ ] System update service paused (Windows Update / driver updaters)
- [ ] Focus Assist (Do Not Disturb) enabled in OS
- [ ] Discord moved to phone or tablet

**Platform Configuration**
- [ ] Stream title set (includes game name)
- [ ] Game category selected correctly
- [ ] Tags applied
- [ ] Mature content flag set if applicable
- [ ] Channel panels updated if first stream

---

### Common Issues Quick Reference

| Issue | Symptom | Diagnosis | Fix |
|-------|---------|----------|-----|
| Dropped frames | OBS Stats: Dropped % > 0.5% | Network congestion | Reduce bitrate by 500-1000 Kbps. Switch to wired Ethernet. Pause cloud sync. |
| Encoding overload | OBS warning banner, stuttering | CPU saturated | Switch to hardware encoder (NVENC/AMF). Reduce x264 preset to "veryfast." Close CPU-heavy background apps. |
| Game capture black screen | Black preview in OBS | Hook failure or permissions | Run OBS as administrator. Switch from Game Capture to Window Capture. Disable game's hardware acceleration. |
| Echo / viewer double-hears game audio | Viewers report echo | Speakers bleeding into mic, or desktop audio captured twice | Use closed-back headphones. Check OBS mixer for duplicate desktop audio sources. |
| Mic too quiet relative to game | Viewers can't hear streamer | Gain too low | Add Gain filter (+3 to +6 dB) after compressor. Reduce desktop audio level in mixer. |
| OBS and game stuttering | Both OBS preview and game are choppy | GPU overloaded | Cap in-game frame rate (use V-sync at 60 fps cap while streaming). Reduce in-game graphics quality. |
| Alert sounds not playing | Follower alerts silent | Browser source audio not monitored | Right-click browser source > properties > enable "Shutdown source when not visible" is OFF. Check browser source audio in mixer is not muted. |

---

### 30-Day Improvement Roadmap

| Phase | Streams | Focus |
|-------|---------|-------|
| Foundation | Streams 1-3 | Technical stability only. No dropped frames. Intelligible audio. Don't add complexity. |
| Audio optimization | Streams 4-6 | Tune microphone filters. Get viewer feedback on audio balance. |
| Visual polish | Streams 7-10 | Upgrade overlays, add stinger transitions, refine webcam framing. |
| Engagement | Streams 11-20 | Add channel point rewards, chat commands, schedule consistency. |
| Growth | Streams 20+ | Analyze metrics, optimize stream title/tags, network with other streamers in the category. |
```

---

## Rules

1. **Never recommend a stream bitrate that exceeds 80% of the measured upload speed.** If the user reports 10 Mbps upload, the absolute maximum stream bitrate is 8000 Kbps -- in practice recommend 6000 Kbps to leave margin. Recommending 10,000 Kbps on a 10 Mbps connection guarantees dropped frames and viewer disconnects.

2. **Hardware encoding (NVENC/AMF/QuickSync) must be the default recommendation for any single-PC setup regardless of CPU tier.** The only scenario to recommend software x264 encoding is when the GPU is over five years old (no meaningful hardware encoding support), or the user has an 8+ core CPU with demonstrated headroom (over 30% CPU free while gaming). Recommending x264 on a modern single-PC setup is a common beginner mistake that causes encoding overload.

3. **Audio quality outweighs video quality in viewer retention decisions.** If the user has to choose between spending $50 on a webcam versus $50 on a USB microphone, always recommend the microphone first. Viewers will watch a 720p stream with clear audio; they will not stay for a 1080p stream where the microphone crackles, clips, or has an echo. This is the single most impactful beginner upgrade.

4. **The noise gate and compressor filters must always be recommended for the microphone source.** Without a noise gate, keyboard clicks, breathing, and room noise are broadcast live. Without a compressor, loud exclamations during gameplay will spike the microphone into clipping while quiet speech is inaudible. These two filters are not optional -- they are the minimum viable audio processing chain.

5. **A test stream must be completed before the first public live stream.** This is non-negotiable. The most common first-stream disasters (30 minutes with no audio, black screen for the entire stream, wrong scene active) are 100% preventable with a 2-minute private test stream. Guide the user to use the platform's private stream feature or a secondary test account.

6. **Rate control must be set to CBR (Constant Bit Rate) for streaming output.** VBR (Variable Bit Rate) is appropriate for local recording but causes buffer problems on streaming ingest servers, which expect a steady data rate. CQP/CRF modes are for file encoding, not live streaming. Setting the wrong rate control is a subtle but impactful misconfiguration.

7. **The keyframe interval must be exactly 2 seconds.** Setting it to 0 (OBS's automatic mode) is technically equivalent on some platforms but fails on others. Setting it to anything other than 2 (such as 3 or 5) breaks the ingest server's ability to serve viewers who join mid-stream -- they will see a black screen until the next keyframe. This is a required platform standard, not a suggestion.

8. **Scene structure must include a minimum of four scenes: Starting Soon, Game, BRB, and Ending.** Going live directly into the game with no Starting Soon or Ending scene looks unprofessional and creates abrupt start/stop experiences. A streamer who transitions cleanly between scenes signals intentionality to new viewers. The effort to create these four scenes is under 20 minutes and pays long-term dividends.

9. **For console streamers using a capture card, confirm passthrough resolution compatibility before purchase.** If the user's TV is 4K and the console outputs 4K, a capture card with only 1080p60 passthrough will downgrade the TV display to 1080p -- an unacceptable trade-off for the gaming experience. Always verify the passthrough spec against the display spec before recommending a specific capture card tier.

10. **Never recommend wireless internet (Wi-Fi) for streaming.** Even Wi-Fi 6 connections with strong signal exhibit microsecond-level packet variance (jitter) that manifests as dropped frames in streaming software. The impact is amplified during peak network usage hours when neighbors are also on the same Wi-Fi channels. Wired Ethernet is a hard requirement for stable streaming. If the user cannot run an Ethernet cable, recommend a Powerline adapter (using electrical wiring in the house as a network cable) as a second-best alternative -- never pure Wi-Fi as the only option.

---

## Edge Cases

**User has a very low-end PC (4-core CPU, GPU over 5 years old with no hardware encoding):**
This is the hardest configuration. The CPU is simultaneously running the game and encoding the stream. Guidance: cap the in-game frame rate to 60 fps using V-sync or an in-game limiter -- this frees CPU cycles that would be spent rendering excess frames. Set stream to 720p30, bitrate 2500-3000 Kbps, x264 encoder at "ultrafast" or "superfast" preset (the worst quality x264 presets, but the only ones that run on 4 cores while gaming). Close every background application without exception. If the CPU still shows encoding overload warnings, the user must choose: better game performance (play without streaming) or stream at degraded settings. Be honest about this limitation rather than suggesting settings that will fail. If they want to stream and play demanding games, a hardware upgrade is the real solution. Suggest starting with low-demand games (pixel art games, turn-based games) that have lower CPU requirements while streaming.

**Console-only streamer with no PC:**
Two distinct paths with different trade-offs. Path 1 (no-cost): use the console's built-in streaming feature (PlayStation and Xbox both have integrated streaming to major platforms). Limitations: no custom overlays, no scene switching, no microphone filter processing, no webcam framing control. This is appropriate for a total beginner who wants to test whether streaming is interesting to them before spending money. Path 2 (with a laptop): add an external USB capture card ($100-160) connected between the console and a laptop via HDMI. The laptop runs streaming software and manages scenes, overlays, and audio. The capture card is the video source. This unlocks full streaming software control. The laptop's CPU handles encoding -- verify it has at least a 6th-generation Intel Core i5 or AMD Ryzen 5. The laptop must stay plugged in (streaming drains battery in 30-45 minutes on laptops not plugged in). Strongly recommend Path 1 for the first 2-3 streams to establish baseline comfort with live streaming before investing in capture card hardware.

**User has asymmetric internet with very fast download but slow upload (common on cable/DOCSIS connections):**
Many residential cable internet plans offer 200-500 Mbps download but only 10-20 Mbps upload. The download speed is irrelevant for streaming -- the upload is the only number that matters. This user likely thinks their internet is "fast" because downloads are quick, and may not realize upload is the bottleneck. Specifically confirm: "Your upload speed for streaming is [X] Mbps, not your download speed. Run a speed test and look specifically at the upload result." If the upload is under 6 Mbps despite a "fast" plan, recommend calling the ISP to ask about plans with higher upload speeds, or switching to a fiber connection which offers symmetric upload/download. Powerline adapters can also help if the user is on Wi-Fi -- switching to wired often improves upload consistency even if peak speed is similar.

**User wants to stream but explicitly does not want a webcam or does not want to be on camera:**
This is a completely valid choice and should not be discouraged. Many successful streamers use animated avatars (VTuber-style), a static branded image, a faceless gameplay approach, or simply no camera at all. Guidance: redirect the webcam budget entirely to a better microphone. Without a webcam, audio becomes the primary way viewers feel connected to the streamer -- voice quality matters even more. For animated avatar (VTuber) setups, the user will need face-tracking software and a 2D or 3D avatar model. This is a separate configuration beyond this skill's scope but worth mentioning as an option. For the stream scene layout without a webcam: expand the game capture to full frame, use a bottom panel overlay for channel info and alerts instead of a corner webcam box.

**User experiences significant in-game performance degradation when OBS is running (frame rate drops in game):**
This indicates the streaming setup is consuming too many resources from the gaming workload. Systematic debugging approach: (1) Is the encoder set to hardware or software? If software x264 -- switch to hardware encoding immediately. (2) Is the GPU being used for both gaming and encoding? Check GPU utilization in Task Manager (or GPU-Z) -- if at 99%, the game and encoding are competing. Cap in-game frame rate to reduce GPU load (a frame rate cap of 1-2x the stream frame rate is sufficient; streaming at 60 fps does not require 144 fps in the game). (3) Is RAM insufficient? If total system RAM usage is over 90%, the OS is using the page file (disk-based virtual memory), causing hitches. Adding RAM is the fix. (4) Is the streaming software canvas resolution unnecessarily large? If streaming at 720p from a 4K canvas, OBS must downscale 4K->720p on every frame -- this is CPU-intensive. Change the base canvas to 1920x1080 to reduce the downscale workload.

**User asks about streaming copyrighted music and audio (DMCA issues):**
This is a real and consequential concern. Background music from commercial music services (Spotify, Apple Music, mainstream radio stations) will trigger automated DMCA detection on most major platforms. This results in muted VODs (past recordings of the stream) or, for repeat violations, account suspensions. Guidance: for background music, use royalty-free music services specifically designed for streaming (there are many free and paid options). For game music: most game publishers do not actively DMCA their game's soundtrack during live streams (they want the exposure), but some do. Recommend the user research the specific game's streaming policy if the game has well-known soundtrack music. For viewer-requested music: strongly discourage playing copyrighted tracks via screen share or audio during the stream. This is a platform policy issue, not a streaming setup issue, but it comes up frequently in first-time setup conversations.

**User has a high-end PC and very fast internet (100+ Mbps upload, RTX 4000-series GPU, 32 GB RAM) but is still confused about settings:**
This user is not limited by hardware or internet. The configuration is simpler: use NVENC H.264 or NVENC AV1 (if the platform accepts AV1), max quality preset, 1920x1080 at 60 fps, 8000 Kbps bitrate (platform ceiling for most services). The remaining setup complexity is software configuration and scene design, not hardware trade-offs. Guide them to focus on: overlay design, alert configuration, scene transitions, and channel branding. They may also benefit from dual-output streaming (streaming to two platforms simultaneously via a restream service) or configuring separate local recording at near-lossless quality for VOD editing, since their hardware can handle it easily.

---

## Example

**Input:** "Hey I want to start streaming on Twitch. I have a gaming PC with an Intel Core i5-12400 (6-core), an NVIDIA RTX 3060, and 16 GB of RAM. I just ran a speed test and my upload is 22 Mbps on wired Ethernet. I already have a gaming headset but nothing else for streaming. My budget is about $150. I mostly play first-person shooters and want to eventually build a small audience."

**Output:**

## Game Streaming Setup Plan

### Streamer Profile
- Platform target: Twitch
- Game type: PC games (first-person shooters -- fast-paced, 60 fps recommended)
- PC specs: Intel Core i5-12400 (6-core, 12th gen), NVIDIA
