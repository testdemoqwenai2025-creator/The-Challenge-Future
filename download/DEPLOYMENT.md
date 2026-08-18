# SciMSPT Deployment Guide

## 🚀 Quick Start: Push to GitHub

### Option 1: Using GitHub CLI (Recommended)

```bash
# Install GitHub CLI if not available
# macOS: brew install gh
# Ubuntu/Debian: sudo apt install gh

# Authenticate with GitHub
gh auth login

# Push to repository
cd /home/z/my-project/scimspt-platform
git push origin main
```

### Option 2: Using Personal Access Token

1. **Generate Token:**
   - Go to GitHub → Settings → Developer Settings → Personal Access Tokens
   - Click "Generate new token" (classic)
   - Select `repo` scope
   - Copy the token

2. **Configure Remote:**
```bash
cd /home/z/my-project/scimspt-platform

# Update remote URL with token
git remote set-url origin https://<YOUR_TOKEN>@github.com/testdemoqwenai2025-creator/SciMSPT.git

# Push
git push origin main
```

### Option 3: Using SSH Key

```bash
# Generate SSH key (if you don't have one)
ssh-keygen -t ed25519 -C "your@email.com"

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub: Settings → SSH Keys → New SSH key

# Change remote URL
git remote set-url origin git@github.com:testdemoqwenai2025-creator/SciMSPT.git

# Push
git push origin main
```

---

## 📁 Repository Structure

```
SciMSPT/                          # Public Repository (GitHub Pages)
├── .github/workflows/
│   └── deploy.yml               # Auto-deployment workflow
├── docs/                        # Served on GitHub Pages ✅
│   ├── index.html               # Main landing page
│   ├── portfolio-shorts/        # Portfolio briefs WITH TTS
│   │   ├── P12.html            # Helios Tandem (UK/US voice)
│   │   ├── P3.html             # Solid State Labs
│   │   ├── P11.html            # Carbon Sink
│   │   ├── P5.html             # Hydrogen Forge
│   │   ├── P9.html             # TMD Logic
│   │   ├── P-cmos-2nm.html     # Atomic Gate Systems
│   │   └── P-ai-materials.html # Lattice Forge
│   │   └── assets/audio/       # Generated WAV files (25 files)
│   ├── shorts/                 # Weekly research shorts
│   │   └── SD-*.html          # With existing TTS system
│   ├── pdfs/                   # PDF reports
│   └── studio.html             # Studio interface
├── src/                         # Next.js source (not deployed)
├── preview_server.py           # Local dev server
└── scripts/                    # Utility scripts
```

---

## 🌐 Live Site URL

**GitHub Pages:** https://testdemoqwenai2025-creator.github.io/SciMSPT/

The site is automatically deployed from the `/docs` folder when changes are pushed to `main` branch.

---

## 🎙️ TTS Voice Features (Now Live!)

### What's Included:

| Feature | Status | Details |
|---------|--------|---------|
| UK Voice (en-GB) | ✅ Live | Default British accent |
| US Voice (en-US) | ✅ Live | American accent alternative |
| Voice Picker UI | ✅ Live | Toggle buttons in each short |
| Caption Bar | ✅ Live | Shows narration text |
| LocalStorage | ✅ Live | Remembers user preference |
| Web Speech API | ✅ Live | Browser-native synthesis |

### How It Works:

1. **User opens portfolio short** (e.g., `/portfolio/P12.html`)
2. **Voice picker shows** UK/US buttons (default: UK)
3. **User clicks Play** → Scene narration starts with selected voice
4. **Caption bar displays** current narration text
5. **Preference saved** for next visit

---

## 🔧 Local Development

### Preview Server:

```bash
cd /home/z/my-project/scimspt-platform

# Start local preview server
python3 preview_server.py --port 8080

# Open in browser:
# http://localhost:8080          # Main index
# http://localhost:8080/portfolio/  # Portfolio shorts
# http://localhost:8080/shorts/     # Weekly shorts
# http://localhost:8080/test       # Voice test suite
# http://localhost:8080/api/status  # API status
```

### Test Voice System:

```bash
# Open test suite
open /home/z/my-project/download/voice-test-suite.html

# Or access via preview server
open http://localhost:8080/test
```

---

## 📊 Deployment Verification

After pushing, verify deployment at:

1. **GitHub Actions:** https://github.com/testdemoqwenai2025-creator/SciMSPT/actions
2. **Live Site:** https://testdemoqwenai2025-creator.github.io/SciMSPT/
3. **Portfolio Short:** https://testdemoqwenai2025-creator.github.io/SciMSPT/#startups

### Check TTS is Working:

1. Open any portfolio short URL
2. Look for **VOICE button** with UK/US toggle
3. Click **Play** to hear narration
4. Switch between **UK** and **US** voices

---

## 🔄 Automatic Deployment (GitHub Actions)

The `.github/workflows/deploy.yml` file enables:

- ✅ **Automatic builds** on push to main
- ✅ **GitHub Pages deployment** from `/docs`
- ✅ **Manual trigger** via workflow_dispatch
- ✅ **Concurrency control** to prevent conflicts

---

## 📝 Commit History

Latest commit includes:

```
feat(voice): add UK/US TTS narration system to portfolio shorts

35 files changed, 2748 insertions(+)

Features:
• Web Speech API integration with native UK/US voice selection
• Voice picker UI with toggle buttons
• Caption bar showing real-time narration text
• 25 WAV audio files (~12 MB)
• Preview server for local testing
```

---

## ⚠️ Troubleshooting

### Push Fails with Authentication Error:

```bash
# Check remote URL
git remote -v

# Re-authenticate
gh auth login
# OR update token
git remote set-url origin https://<NEW_TOKEN>@github.com/...
```

### GitHub Pages Not Updating:

1. Check Actions tab for build status
2. Verify `docs/` folder exists and has content
3. Check GitHub Pages settings enabled
4. Wait 2-3 minutes for CDN propagation

### TTS Not Working in Browser:

1. Ensure browser supports Web Speech API (Chrome, Edge, Safari)
2. Check browser console for errors
3. Try refreshing the page
4. Verify JavaScript not blocked by ad blocker

---

## 🎯 Next Steps

1. **Push to GitHub** using one of the options above
2. **Verify live site** loads with TTS features
3. **Test voice selection** on multiple browsers
4. **Generate remaining audio** (P5 partial):
   ```bash
   python3 /home/z/my-project/scripts/complete-tts-audio.py
   ```

---

## 📞 Support

For issues or questions:
- Check this guide first
- Review git log: `git log --oneline -5`
- Run verification: `python3 /home/z/my-project/scripts/verify-voice-system.py`

---

**Last Updated:** 2026-08-18  
**Version:** 1.0.0 (TTS Release)
