#!/usr/bin/env python3
"""
Fix research image visibility during narration playback.
The issue: image checks 'window.playing' which doesn't exist - need to hook into actual play/pause.
"""

import re
import os

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# Fixed JavaScript for image overlay - hooks into actual play/pause state
FIXED_IMAGE_JS = '''
<script>
// Research image overlay control - FIXED VERSION
(function() {
  var researchOverlay = document.getElementById('researchOverlay');
  if (!researchOverlay) return;
  
  function showResearchImage() {
    if (researchOverlay) {
      researchOverlay.classList.add('visible');
    }
  }
  
  function hideResearchImage() {
    if (researchOverlay) {
      researchOverlay.classList.remove('visible');
    }
  }
  
  // Show image when playing starts
  function handlePlay() {
    setTimeout(showResearchImage, 200);
  }
  
  // Hide image when paused/stopped
  function handlePause() {
    hideResearchImage();
  }
  
  // Hook into play button click
  var playBtn = document.getElementById('playPauseBtn');
  if (playBtn) {
    playBtn.addEventListener('click', function() {
      setTimeout(function() {
        // Check if now playing by looking at icon path (pause icon = playing)
        var ppIcon = document.getElementById('ppIcon');
        if (ppIcon && ppIcon.innerHTML.indexOf('M6 4') !== -1) {
          showResearchImage(); // Is playing (shows pause icon)
        } else {
          hideResearchImage(); // Is paused (shows play icon)
        }
      }, 250);
    });
  }
  
  // Hook into play overlay click
  var playOverlay = document.getElementById('playOverlay');
  if (playOverlay) {
    playOverlay.addEventListener('click', function() {
      setTimeout(showResearchImage, 300);
    });
  }
  
  // Hook into restart/replay buttons
  ['restartBtn', 'replayBtn'].forEach(function(id) {
    var btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', function() {
        setTimeout(showResearchImage, 300);
      });
    }
  });
  
  // Monitor scene changes to keep image visible during playback
  var sceneLabelEl = document.getElementById('sceneLabel');
  if (sceneLabelEl) {
    var observer = new MutationObserver(function() {
      // When scene changes, if we see progress moving, show image
      var timeDisplay = document.getElementById('timeDisplay');
      if (timeDisplay) {
        var timeText = timeDisplay.textContent;
        if (timeText && timeText.indexOf(':') !== -1 && !timeText.startsWith('0:00')) {
          showResearchImage();
        }
      }
    });
    observer.observe(sceneLabelEl, {childList: true, characterData: true, subtree: true});
  }
  
  // Also monitor timeline progress
  var progress = document.getElementById('progress');
  if (progress) {
    var progressObserver = new MutationObserver(function() {
      var width = progress.style.width;
      if (width && parseFloat(width) > 0 && parseFloat(width) < 100) {
        showResearchImage();
      }
    });
    progressObserver.observe(progress, {attributes: true, attributeFilter: ['style']});
  }
  
  // Auto-show on page load after user interacts (audio init)
  document.addEventListener('click', function initImgShow(e) {
    setTimeout(showResearchImage, 500);
    document.removeEventListener('click', initImgShow);
  }, {once: true});
  
  // Keyboard shortcuts
  document.addEventListener('keydown', function(e) {
    if (e.key === ' ') {
      setTimeout(function() {
        var ppIcon = document.getElementById('ppIcon');
        if (ppIcon && ppIcon.innerHTML.indexOf('M6 4') !== -1) {
          showResearchImage();
        }
      }, 200);
    }
  });
  
  // End screen - hide image when complete
  var endScreen = document.getElementById('endScreen');
  if (endScreen) {
    var endObserver = new MutationObserver(function() {
      if (endScreen.classList.contains('show')) {
        hideResearchImage();
      }
    });
    endObserver.observe(endScreen, {attributes: true, attributeFilter: ['class']});
  }
  
  // Expose functions globally for debugging
  window.__scimspt_showImg = showResearchImage;
  window.__scimspt_hideImg = hideResearchImage;
})();
</script>'''

# Enhanced CSS for better image visibility
ENHANCED_CSS = '''
  /* Research Image Overlay - ENHANCED */
  .research-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) scale(0.95);
    z-index: 100;
    max-width: 75vw;
    max-height: 55vh;
    opacity: 0;
    pointer-events: auto;
    transition: opacity 0.6s ease, transform 0.6s cubic-bezier(0.2, 0.8, 0.3, 1);
    border-radius: 16px;
    box-shadow: 
      0 25px 80px rgba(0,0,0,0.7),
      0 0 60px rgba(59,130,246,0.15),
      inset 0 0 0 1px rgba(255,255,255,0.1);
    border: 2px solid rgba(59,130,246,0.5);
    background: rgba(7,11,20,0.85);
    backdrop-filter: blur(12px);
  }
  .research-overlay.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    pointer-events: auto;
  }
  .research-overlay img {
    width: 100%;
    height: auto;
    max-height: 52vh;
    object-fit: contain;
    border-radius: 12px;
    display: block;
  }
  /* Subtle pulse animation when visible */
  @keyframes researchPulse {
    0%, 100% { box-shadow: 0 25px 80px rgba(0,0,0,0.7), 0 0 60px rgba(59,130,246,0.15); }
    50% { box-shadow: 0 25px 80px rgba(0,0,0,0.7), 0 0 80px rgba(59,130,246,0.25); }
  }
  .research-overlay.visible {
    animation: researchPulse 3s ease-in-out infinite;
  }
  @media (max-width: 768px) {
    .research-overlay {
      max-width: 92vw;
      max-height: 40vh;
      top: 45%;
    }
    .research-overlay img {
      max-height: 38vh;
    }
  }'''


def fix_image_visibility(filepath, filename):
    """Fix the research image visibility in HTML file."""
    print(f"\n🖼️ Fixing image visibility in {filename}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # 1. Replace old CSS with enhanced version
    old_css_start = '/* Research Image Overlay */'
    old_css_end = '@media (max-width: 768px) {'
    
    if old_css_start in content:
        # Find and replace the entire CSS block
        css_pattern = r'/\* Research Image Overlay \*/.*?@media \(max-width: 768px\) \{.*?\n  \}'
        if re.search(css_pattern, content, re.DOTALL):
            content = re.sub(css_pattern, ENHANCED_CSS.rstrip(), content, flags=re.DOTALL)
            print(f"   ✅ Updated CSS for better visibility")
            modified = True
    
    # 2. Replace old JavaScript with fixed version
    # Find the old script block
    old_js_marker = '// Research image overlay control'
    if old_js_marker in content:
        # Find the complete script block from this marker
        pattern = r'<script>\s*' + re.escape(old_js_marker) + r'.*?</script>'
        if re.search(pattern, content, re.DOTALL):
            content = re.sub(pattern, FIXED_IMAGE_JS.strip(), content, flags=re.DOTALL)
            print(f"   ✅ Replaced JS with fixed event handlers")
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print(f"   ⚠️ No changes needed or patterns not found")
        return False


def main():
    print("=" * 65)
    print(" Fixing Research Image Visibility During Narration ")
    print("=" * 65)
    
    files_to_fix = [
        "P12.html",
        "P3.html",
        "P11.html", 
        "P5.html",
        "P9.html",
        "P-cmos-2nm.html",
        "P-ai-materials.html"
    ]
    
    success_count = 0
    for filename in files_to_fix:
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if os.path.exists(filepath):
            if fix_image_visibility(filepath, filename):
                success_count += 1
        else:
            print(f"\n❌ File not found: {filepath}")
    
    print("\n" + "=" * 65)
    print(f"✨ Complete! Fixed {success_count}/{len(files_to_fix)} files")
    print("=" * 65)
    print("\nImage will now:")
    print("  • Appear when you click Play")
    print("  • Stay visible during full narration")
    print("  • Have enhanced styling with glow effect")
    print("  • Hide when paused or completed")


if __name__ == "__main__":
    main()
