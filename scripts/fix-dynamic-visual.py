#!/usr/bin/env python3
"""
Complete fix for ALL 7 portfolio shorts:
1. Fix narration/play not working (simplify audio init)
2. Replace Chinese-text images with DYNAMIC ANIMATED visuals
3. Add rotation/pulse/glow animations to research overlay
"""

import re
import os

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# Dynamic animated visual HTML (replaces static image)
DYNAMIC_VISUAL_HTML = '''
  <!-- Dynamic Research Visualization -->
  <div class="research-visual" id="researchVisual">
    <div class="visual-container">
      <!-- Animated background grid -->
      <div class="grid-bg"></div>
      
      <!-- Floating particles -->
      <div class="particles">
        <div class="particle p1"></div>
        <div class="particle p2"></div>
        <div class="particle p3"></div>
        <div class="particle p4"></div>
        <div class="particle p5"></div>
        <div class="particle p6"></div>
      </div>
      
      <!-- Central rotating element -->
      <div class="rotating-core">
        <div class="core-inner">
          <div class="core-ring ring1"></div>
          <div class="core-ring ring2"></div>
          <div class="core-ring ring3"></div>
          <div class="core-icon">⚛</div>
        </div>
      </div>
      
      <!-- Orbiting elements -->
      <div class="orbit orbit1"><div class="orbit-dot"></div></div>
      <div class="orbit orbit2"><div class="orbit-dot"></div></div>
      <div class="orbit orbit3"><div class="orbit-dot"></div></div>
      
      <!-- Data streams -->
      <div class="data-stream stream1"></div>
      <div class="data-stream stream2"></div>
      <div class="data-stream stream3"></div>
      <div class="data-stream stream4"></div>
      
      <!-- English labels -->
      <div class="visual-labels">
        <h3 class="visual-title" id="visualTitle">{TITLE}</h3>
        <p class="visual-subtitle" id="visualSubtitle">{SUBTITLE}</p>
        <div class="visual-metrics" id="visualMetrics">{METRICS}</div>
      </div>
    </div>
  </div>'''

# Dynamic CSS for animated visuals
DYNAMIC_CSS = '''
  /* ===== DYNAMIC RESEARCH VISUALIZATION ===== */
  .research-visual {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.9);
    z-index: 100;
    width: 70vw;
    max-width: 700px;
    aspect-ratio: 16/10;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1);
    border-radius: 20px;
    overflow: hidden;
  }
  
  .research-visual.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    pointer-events: auto;
  }
  
  .visual-container {
    position: relative;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, #0a1628 0%, #0d1f3c 30%, #0a1628 70%, #071021 100%);
    border-radius: 20px;
    border: 2px solid rgba(59, 130, 246, 0.4);
    box-shadow: 
      0 25px 80px rgba(0, 0, 0, 0.7),
      0 0 60px rgba(59, 130, 246, 0.15),
      inset 0 0 100px rgba(59, 130, 246, 0.05);
    overflow: hidden;
  }
  
  /* Animated grid background */
  .grid-bg {
    position: absolute;
    inset: 0;
    background-image: 
      linear-gradient(rgba(59, 130, 246, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(59, 130, 246, 0.08) 1px, transparent 1px);
    background-size: 40px 40px;
    animation: gridMove 20s linear infinite;
  }
  
  @keyframes gridMove {
    0% { transform: translate(0, 0); }
    100% { transform: translate(40px, 40px); }
  }
  
  /* Particles */
  .particles { position: absolute; inset: 0; }
  
  .particle {
    position: absolute;
    width: 4px;
    height: 4px;
    background: #60a5fa;
    border-radius: 50%;
    box-shadow: 0 0 10px #60a5fa, 0 0 20px rgba(96, 165, 250, 0.5);
    animation: particleFloat 8s ease-in-out infinite;
  }
  
  .p1 { top: 15%; left: 20%; animation-delay: 0s; }
  .p2 { top: 25%; left: 75%; animation-delay: 1s; }
  .p3 { top: 65%; left: 15%; animation-delay: 2s; }
  .p4 { top: 75%; left: 80%; animation-delay: 3s; }
  .p5 { top: 45%; left: 10%; animation-delay: 4s; }
  .p6 { top: 35%; left: 85%; animation-delay: 5s; }
  
  @keyframes particleFloat {
    0%, 100% { transform: translateY(0) scale(1); opacity: 0.8; }
    50% { transform: translateY(-20px) scale(1.5); opacity: 1; }
  }
  
  /* Rotating core */
  .rotating-core {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 150px;
    height: 150px;
  }
  
  .core-inner {
    position: relative;
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .core-ring {
    position: absolute;
    border: 2px solid transparent;
    border-radius: 50%;
    animation: coreRotate 10s linear infinite;
  }
  
  .ring1 {
    inset: 0;
    border-top-color: #60a5fa;
    border-bottom-color: #60a5fa;
    animation-duration: 8s;
  }
  
  .ring2 {
    inset: 20px;
    border-left-color: #34d399;
    border-right-color: #34d399;
    animation-duration: 12s;
    animation-direction: reverse;
  }
  
  .ring3 {
    inset: 40px;
    border-top-color: #fbbf24;
    border-bottom-color: #fbbf24;
    animation-duration: 6s;
  }
  
  @keyframes coreRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  .core-icon {
    font-size: 2.5rem;
    animation: iconPulse 2s ease-in-out infinite;
    filter: drop-shadow(0 0 20px rgba(96, 165, 250, 0.8));
  }
  
  @keyframes iconPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.2); }
  }
  
  /* Orbiting dots */
  .orbit {
    position: absolute;
    top: 50%;
    left: 50%;
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 50%;
    animation: orbitRotate 15s linear infinite;
  }
  
  .orbit1 { width: 220px; height: 220px; margin: -110px 0 0 -110px; animation-duration: 20s; }
  .orbit2 { width: 280px; height: 280px; margin: -140px 0 0 -140px; animation-duration: 25s; animation-direction: reverse; }
  .orbit3 { width: 340px; height: 340px; margin: -170px 0 0 -170px; animation-duration: 30s; }
  
  .orbit-dot {
    position: absolute;
    top: -5px;
    left: 50%;
    margin-left: -5px;
    width: 10px;
    height: 10px;
    background: linear-gradient(135deg, #60a5fa, #34d399);
    border-radius: 50%;
    box-shadow: 0 0 15px currentColor;
  }
  
  @keyframes orbitRotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  /* Data streams */
  .data-stream {
    position: absolute;
    height: 2px;
    background: linear-gradient(90deg, transparent, #60a5fa, transparent);
    animation: dataFlow 3s ease-in-out infinite;
  }
  
  .stream1 { top: 20%; left: 0; width: 30%; animation-delay: 0s; }
  .stream2 { top: 80%; right: 0; width: 25%; animation-delay: 1s; transform: rotate(180deg); }
  .stream3 { bottom: 10%; left: 20%; width: 35%; animation-delay: 2s; }
  .stream4 { top: 45%; right: 0; width: 20%; animation-delay: 0.5s; }
  
  @keyframes dataFlow {
    0% { opacity: 0; transform: scaleX(0); }
    50% { opacity: 1; transform: scaleX(1); }
    100% { opacity: 0; transform: scaleX(0); }
  }
  
  /* Labels overlay */
  .visual-labels {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.5rem;
    background: linear-gradient(to top, rgba(7, 11, 20, 0.98) 0%, rgba(7, 11, 20, 0.9) 60%, transparent 100%);
    text-align: center;
  }
  
  .visual-title {
    font-size: 1.3rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: 0.4rem;
    letter-spacing: -0.02em;
    text-shadow: 0 0 20px rgba(96, 165, 250, 0.5);
  }
  
  .visual-subtitle {
    font-size: 0.9rem;
    color: #93c5fd;
    margin-bottom: 0.8rem;
    font-weight: 500;
  }
  
  .visual-metrics {
    display: flex;
    justify-content: center;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
  
  .visual-metrics span {
    padding: 0.3rem 0.7rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 20px;
    font-size: 0.72rem;
    font-weight: 600;
    color: #bfdbfe;
    font-family: 'JetBrains Mono', monospace;
  }
  
  /* Glow pulse on visible */
  .research-visual.visible .visual-container {
    animation: containerGlow 3s ease-in-out infinite;
  }
  
  @keyframes containerGlow {
    0%, 100% { box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7), 0 0 60px rgba(59, 130, 246, 0.15); }
    50% { box-shadow: 0 25px 80px rgba(0, 0, 0, 0.7), 0 0 100px rgba(59, 130, 246, 0.3), 0 0 150px rgba(96, 165, 250, 0.1); }
  }
  
  /* Mobile responsive */
  @media (max-width: 768px) {
    .research-visual {
      width: 95vw;
      max-width: none;
      top: 42%;
    }
    
    .rotating-core { width: 100px; height: 100px; }
    .core-icon { font-size: 1.8rem; }
    
    .orbit1 { width: 160px; height: 160px; margin: -80px 0 0 -80px; }
    .orbit2 { width: 200px; height: 200px; margin: -100px 0 0 -100px; }
    .orbit3 { width: 240px; height: 240px; margin: -120px 0 0 -120px; }
    
    .visual-title { font-size: 1.1rem; }
    .visual-subtitle { font-size: 0.8rem; }
    .visual-metrics span { font-size: 0.65rem; padding: 0.25rem 0.55rem; }
  }'''

# Labels for each file
FILE_LABELS = {
    "P12.html": {"title": "Helios Tandem Technologies", "subtitle": "Perovskite-on-Silicon Tandem Photovoltaics", "metrics": ["Efficiency >33%", "Tandem Architecture", "1000+ hrs Stability"]},
    "P3.html": {"title": "Solid State Labs", "subtitle": "Solid-State Li-Metal Battery Systems", "metrics": ["Sulfide Electrolyte", "10 mS/cm", "500+ Cycle Life"]},
    "P11.html": {"title": "Orbital AI", "subtitle": "Space-Based Solar Power Transmission", "metrics": ["90% Capacity Factor", "Wireless Beaming", "Carbon-Negative"]},
    "P5.html": {"title": "Hydrogen Forge", "subtitle": "SOEC Green Hydrogen Production", "metrics": ["800°C Operation", "$2/kg Target", "Industrial Scale"]},
    "P9.html": {"title": "TMD Logic", "subtitle": "2D Materials Wafer Synthesis", "metrics": ["300mm Wafer", ">50μm Grains", "MoS2/WSe2 Monolayers"]},
    "P-cmos-2nm.html": {"title": "Atomic Gate Systems", "subtitle": "GAA Transistor Architecture", "metrics": ["2nm Node", "<5nm Nanosheet", "Gate-All-Around"]},
    "P-ai-materials.html": {"title": "Lattice Forge", "subtitle": "AI Materials Discovery Platform", "metrics": ["4.2M Crystals", "GNoME Neural Net", "90% Validation"]}
}

# Fixed simplified narration JS that WORKS
FIXED_NARRATION_JS = '''
<script>
// ===== SIMPLIFIED NARRATION SYSTEM =====
(function() {
  'use strict';
  
  var synth = window.speechSynthesis;
  var utterance = null;
  var isSpeaking = false;
  var currentSceneIdx = -1;
  
  // Check support
  if (!synth || !window.SpeechSynthesisUtterance) {
    console.warn('[SciMSPT] Speech synthesis not supported');
    return;
  }
  
  // Load voices
  var voices = [];
  function loadVoices() {
    voices = synth.getVoices() || [];
  }
  loadVoices();
  if (synth.onvoiceschanged) synth.onvoiceschanged = loadVoices;
  
  // Pick best voice (prefer UK/US English)
  function pickVoice() {
    if (!voices.length) return null;
    var uk = voices.find(function(v) { return v.lang.indexOf('en-GB') === 0; });
    var us = voices.find(function(v) { return v.lang.indexOf('en-US') === 0; });
    return uk || us || voices.find(function(v) { return v.lang.indexOf('en') === 0; }) || voices[0];
  }
  
  // Speak text
  function speak(text) {
    if (!text) return;
    
    // Cancel previous
    try { synth.cancel(); } catch(e) {}
    
    utterance = new SpeechSynthesisUtterance(text);
    var voice = pickVoice();
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = function() {
      isSpeaking = true;
      updateCaption(text);
    };
    
    utterance.onend = function() {
      isSpeaking = false;
    };
    
    utterance.onerror = function(e) {
      console.warn('[SciMSPT] Speech error:', e);
      isSpeaking = false;
    };
    
    try {
      synth.speak(utterance);
    } catch(e) {
      console.warn('[SciMSPT] Speak failed:', e);
    }
  }
  
  // Stop speaking
  function stopSpeak() {
    try { synth.cancel(); } catch(e) {}
    isSpeaking = false;
  }
  
  // Update caption bar
  function updateCaption(text) {
    var captionText = document.getElementById('captionText');
    if (captionText) captionText.textContent = text || '';
  }
  
  // Get narration for scene index
  function getNarration(idx) {
    if (!window.NARRATION || idx < 0 || idx >= NARRATION.length) return '';
    var item = NARRATION[idx];
    return item ? item.text : '';
  }
  
  // Trigger narration for current scene
  function triggerNarration(sceneIdx) {
    if (sceneIdx === currentSceneIdx && isSpeaking) return; // Already narrating this
    
    currentSceneIdx = sceneIdx;
    var text = getNarration(sceneIdx);
    if (text) speak(text);
  }
  
  // Watch for scene changes via label
  var sceneLabel = document.getElementById('sceneLabel');
  if (sceneLabel) {
    var lastLabel = '';
    var observer = new MutationObserver(function() {
      var txt = sceneLabel.textContent || '';
      if (txt === lastLabel) return;
      lastLabel = txt;
      
      // Extract scene number from label like "1/7 · Hypothesis"
      var match = txt.match(/^(\\d+)\\//);
      if (match) {
        var idx = parseInt(match[1], 10) - 1;
        
        // Only narrate if playing
        var timeDisplay = document.getElementById('timeDisplay');
        var timeText = timeDisplay ? timeDisplay.textContent : '';
        
        if (timeText && !timeText.startsWith('0:00') && timeText !== '1:00') {
          triggerNarration(idx);
        }
      }
    });
    observer.observe(sceneLabel, { childList: true, characterData: true, subtree: true });
  }
  
  // Hook into play button
  var playBtn = document.getElementById('playPauseBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      setTimeout(function() {
        var ppIcon = document.getElementById('ppIcon');
        var isPlaying = ppIcon && ppIcon.innerHTML.indexOf('M6 4') !== -1;
        if (isPlaying) {
          // Get current scene and narrate
          var label = document.getElementById('sceneLabel');
          if (label) {
            var match = label.textContent.match(/^(\\d+)\\//);
            if (match) triggerNarration(parseInt(match[1], 10) - 1);
          }
        } else {
          stopSpeak();
        }
      }, 200);
    });
  }
  
  // Hook into play overlay
  var playOverlay = document.getElementById('playOverlay');
  if (playOverlay) {
    playOverlay.addEventListener('click', function() {
      setTimeout(function() { triggerNarration(0); }, 300);
    });
  }
  
  // Hook into restart/replay
  ['restartBtn', 'replayBtn'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', function() {
      setTimeout(function() { triggerNarration(0); }, 300);
    });
  });
  
  // Hook into prev/next
  document.getElementById('prevBtn')?.addEventListener('click', function() {
    setTimeout(function() {
      var label = document.getElementById('sceneLabel');
      if (label) {
        var match = label.textContent.match(/^(\\d+)\\//);
        if (match) triggerNarration(parseInt(match[1], 10) - 1);
      }
    }, 200);
  });
  
  document.getElementById('nextBtn')?.addEventListener('click', function() {
    setTimeout(function() {
      var label = document.getElementById('sceneLabel');
      if (label) {
        var match = label.textContent.match(/^(\\d+)\\//);
        if (match) triggerNarration(parseInt(match[1], 10) - 1);
      }
    }, 200);
  });
  
  // Expose globally for debugging
  window.__scimspt_narration = {
    speak: speak,
    stop: stopSpeak,
    trigger: triggerNarration,
    isSpeaking: function() { return isSpeaking; }
  };
})();
</script>'''

# Dynamic visual show/hide JS
DYNAMIC_VISUAL_JS = '''
<script>
// ===== DYNAMIC VISUAL SHOW/HIDE =====
(function() {
  var visual = document.getElementById('researchVisual');
  if (!visual) return;
  
  var isVisible = false;
  
  function showVisual() {
    if (!isVisible) {
      visual.classList.add('visible');
      isVisible = true;
    }
  }
  
  function hideVisual() {
    if (isVisible) {
      visual.classList.remove('visible');
      isVisible = false;
    }
  }
  
  // Keep checking every 500ms - show when playing
  setInterval(function() {
    var timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      var txt = timeDisplay.textContent || '';
      if (txt.indexOf(':') !== -1 && !txt.startsWith('0:00') && !txt.includes('1:00')) {
        showVisual();
      }
    }
  }, 500);
  
  // Show on play
  document.getElementById('playPauseBtn')?.addEventListener('click', function() {
    setTimeout(showVisual, 100);
  });
  
  document.getElementById('playOverlay')?.addEventListener('click', function() {
    setTimeout(showVisual, 200);
  });
  
  ['restartBtn', 'replayBtn'].forEach(function(id) {
    document.getElementById(id)?.addEventListener('click', function() {
      setTimeout(showVisual, 200);
    });
  });
  
  // Hide at end
  var endScreen = document.getElementById('endScreen');
  if (endScreen) {
    new MutationObserver(function() {
      if (endScreen.classList.contains('show')) hideVisual();
    }).observe(endScreen, { attributes: true, attributeFilter: ['class'] });
  }
})();
</script>'''


def fix_file(filepath, filename):
    """Apply complete fix to a single portfolio short."""
    print(f"\n{'='*50}")
    print(f"🔧 Fixing {filename}...")
    print(f"{'='*50}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    labels = FILE_LABELS.get(filename, {})
    
    # 1. Build dynamic visual HTML with labels
    metrics_html = ''.join([f'<span>{m}</span>' for m in labels.get('metrics', ['', '', ''])])
    dynamic_html = DYNAMIC_VISUAL_HTML.format(
        TITLE=labels.get('title', ''),
        SUBTITLE=labels.get('subtitle', ''),
        METRICS=metrics_html
    )
    
    # 2. Replace old research-overlay with new dynamic visual
    old_overlay_pattern = r'<!-- Research Visualization Overlay.*?</div>\s*</div>\s*<div class="stage">'
    if re.search(old_overlay_pattern, content, re.DOTALL):
        content = re.sub(
            old_overlay_pattern, 
            dynamic_html + '\n\n<div class="stage">', 
            content, 
            flags=re.DOTALL
        )
        print("  ✅ Replaced static image with DYNAMIC animated visual")
        modified = True
    
    # 3. Add dynamic CSS before </style>
    if '.research-visual' not in content:
        content = content.replace('</style>', DYNAMIC_CSS + '\n</style>')
        print("  ✅ Added dynamic animation CSS")
        modified = True
    
    # 4. Remove old image-related CSS/JS
    old_patterns_to_remove = [
        r'/\* Research Image Overlay.*?@media \(max-width: 768px\) \{.*?\n  \}',  # Old image CSS
        r'// Research image overlay control.*?</script>',  # Old image JS
        r'// RESEARCH IMAGE OVERLAY.*?</script>',  # Another variant
    ]
    
    for pattern in old_patterns_to_remove:
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, '', content, flags=re.DOTALL)
            print("  ✅ Removed old image code")
            modified = True
    
    # 5. Add simplified narration JS before </body>
    if '__scimspt_narration' not in content:
        # Find a good place to insert (before last script or before </body>)
        if '</body>' in content:
            content = content.replace('</body>', FIXED_NARRATION_JS + '\n' + DYNAMIC_VISUAL_JS + '\n</body>')
            print("  ✅ Added simplified narration system")
            modified = True
    
    # 6. Remove complex audio init overlay (causing issues)
    if 'audioInitOverlay' in content:
        # Remove the entire audio init script block
        audio_init_pattern = r'<script>\s*// ===== Audio Initialization.*?</script>'
        if re.search(audio_init_pattern, content, re.DOTALL):
            content = re.sub(audio_init_pattern, '', content, flags=re.DOTALL)
            print("  ✅ Removed problematic audio init overlay")
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print("  ⚠️ No changes needed")
        return False


def main():
    print("=" * 65)
    print(" COMPLETE FIX: Narration + Dynamic Visuals + No Chinese Text ")
    print("=" * 65)
    
    files = [
        "P12.html",
        "P3.html",
        "P11.html",
        "P5.html",
        "P9.html",
        "P-cmos-2nm.html",
        "P-ai-materials.html"
    ]
    
    success = 0
    for f in files:
        filepath = os.path.join(PORTFOLIO_DIR, f)
        if os.path.exists(filepath):
            if fix_file(filepath, f):
                success += 1
        else:
            print(f"\n❌ Not found: {filepath}")
    
    print("\n" + "=" * 65)
    print(f"✅ Complete! Fixed {success}/{len(files)} files")
    print("=" * 65)
    print("\nWhat's fixed:")
    print("  🎬 Play button now works (simplified audio)")
    print("  🌟 Dynamic animated visuals (no more Chinese text!)")
    print("  🔄 Rotating rings, floating particles, data streams")
    print("  📝 English labels on each visual")
    print("  ✨ Glowing pulse effect during playback")


if __name__ == "__main__":
    main()
