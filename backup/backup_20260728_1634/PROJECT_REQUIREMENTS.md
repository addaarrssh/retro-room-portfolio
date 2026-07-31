# PROJECT REQUIREMENTS & DESIGN RULES

## 🎯 Primary Objective
Build a 3D interactive portfolio website inspired by [henryheffernan.com](https://henryheffernan.com).

## 📌 Non-Negotiable Rules & Requirements

### 1. 3D Camera Zoom & Framing (Henry Heffernan Style)
- **DO NOT cover the entire browser screen with the 2D Desktop OS.**
- When the user clicks the monitor to sit down at the desk (`MONITOR_ZOOMED`), the camera flies close to the monitor, but the **3D Monitor Casing, Bezel, Desk Surface, Keyboard, Lamp, and Room Environment MUST REMAIN VISIBLE around the monitor**.
- The Desktop OS must be rendered **STRICTLY INSIDE the monitor glass frame in 3D space** (`distanceFactor={0.765}` for 1024x768 mapped to `1.02m x 0.765m` screen plane).

### 2. Monitor Design
- Sleek modern monitor casing with thin even bezels and ambient RGB backlight behind the monitor.
- The screen glass houses the interactive Desktop OS.

### 3. Desktop OS UI & Windows
- **Default Window on Startup**: Automatically open "Adarsh Sahu - My Showcase" (`ShowcaseApp.jsx`) when sitting down.
- **Window Centering**: Windows MUST be centered horizontally and vertically inside the 1024x768 desktop area (`x = (1024 - w) / 2`, `y = (768 - 34 - h) / 2`).
- **Navigation Links**: Underlined uppercase navigation (`ABOUT` | `PROJECTS` | `CONTACT` | `MUSIC` | `GAME`).

### 4. Audio Engine
- **NO vintage CRT flyback whines or loud static noise.**
- Use modern, crisp C-major startup chime arpeggios, warm ambient lofi synth pads, and soft click sounds.

---
*Maintained and enforced across all updates.*
