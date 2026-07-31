# 🛡️ Stable Backup & Restoration Guide

A complete backup of the working 3D portfolio has been created at:
`/Users/adarshsahu/Documents/claude/retro-room-portfolio-BACKUP-STABLE`

---

## 📌 Backup Summary
* **Backup Location**: `/Users/adarshsahu/Documents/claude/retro-room-portfolio-BACKUP-STABLE`
* **Created Date**: July 27, 2026
* **Key Configuration**:
  * `CRTMonitor.jsx`: `distanceFactor = 0.42`, recessed at `z = -0.008m`
  * `CameraRig.jsx`: `MONITOR` view at `position = [0, 1.25, 2.4]`
  * `DesktopOS.jsx`: Initial open windows set to `[]` (clean desktop on boot)

---

## 🔄 How to Restore This Backup in the Future

If any future changes break the site, run the following single command in your terminal to instantly restore this working copy:

```bash
# 1. Remove current broken folder and restore from stable backup
rm -rf /Users/adarshsahu/Documents/claude/retro-room-portfolio
cp -r /Users/adarshsahu/Documents/claude/retro-room-portfolio-BACKUP-STABLE /Users/adarshsahu/Documents/claude/retro-room-portfolio

# 2. Re-run production preview
cd /Users/adarshsahu/Documents/claude/retro-room-portfolio
npm run build
npx vite preview --port 5195
```
