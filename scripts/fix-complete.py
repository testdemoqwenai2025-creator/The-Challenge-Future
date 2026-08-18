#!/usr/bin/env python3
"""
Complete fix for all portfolio shorts:
1. Image stays VISIBLE during entire playback (no disappearing)
2. Add HOME button (links to main page)
3. Add English label overlay on images (to override any Chinese text)
"""

import re
import os

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# English labels for each portfolio short
IMAGE_LABELS = {
    "P12.html": {
        "title": "Helios Tandem Technologies",
        "subtitle": "Perovskite-on-Silicon Tandem Photovoltaics",
        "metrics": ["Efficiency >33%", "Tandem Architecture", "Stability 1000+ hrs"]
    },
    "P3.html": {
        "title": "Solid State Labs",
        "subtitle": "Solid-State Li-Metal Batteries",
        "metrics": ["Sulfide Electrolyte", "10 mS/cm Conductivity", "500+ Cycle Life"]
    },
    "P11.html": {
        "title": "Orbital AI",
        "subtitle": "Space-Based Solar Power",
        "metrics": ["90% Capacity Factor", "Wireless Power Beaming", "Carbon-Negative Computing"]
    },
    "P5.html": {
        "title": "Hydrogen Forge",
        "subtitle": "SOEC Green Hydrogen Production",
        "metrics": ["800°C Operation", "$2/kg H2 Target", "Industrial Scale"]
    },
    "P9.html": {
        "title": "TMD Logic",
        "subtitle": "2D Materials Wafer Synthesis",
        "metrics": ["300mm Wafer", ">50μm Grains", "MoS2/WSe2 Monolayers"]
    },
    "P-cmos-2nm.html": {
        "title": "Atomic Gate Systems",
        "subtitle": "GAA Transistor Technology",
        "metrics": ["2nm Node", "<5nm Nanosheet", "Gate-All-Around"]
    },
    "P-ai-materials.html": {
        "title": "Lattice Forge",
        "subtitle": "AI Materials Discovery Platform",
        "metrics": ["4.2M Crystals", "GNoME Neural Network", "90% Validation Rate"]
    }
}

# Fixed JavaScript that KEEPS IMAGE VISIBLE during playback
FIXED_VISIBILITY_JS = '''
<script>
// ===== RESEARCH IMAGE OVERLAY - STAYS VISIBLE DURING PLAYBACK =====
(function() {
  var overlay = document.getElementById('researchOverlay');
  if (!overlay) return;
  
  var isVisible = false;
  
  function showImage() {
    if (!isVisible) {
      overlay.classList.add('visible');
      isVisible = true;
    }
  }
  
  function hideImage() {
    if (isVisible) {
      overlay.classList.remove('visible');
      isVisible = false;
    }
  }
  
  // CRITICAL: Keep checking every 500ms and show if playing
  setInterval(function() {
    var timeDisplay = document.getElementById('timeDisplay');
    if (timeDisplay) {
      var txt = timeDisplay.textContent || '';
      // If timer is running (not 0:00 and not at end), show image
      if (txt.indexOf(':') !== -1 && !txt.startsWith('0:00') && !txt.includes('1:00')) {
        showImage();
      }
    }
  }, 500);
  
  // Show immediately when play clicked
  document.getElementById('playPauseBtn')?.addEventListener('click', function() {
    setTimeout(showImage, 100);
  });
  
  // Show when overlay clicked
  document.getElementById('playOverlay')?.addEventListener('click', function() {
    setTimeout(showImage, 200);
  });
  
  // Show on restart/replay
  ['restartBtn', 'replayBtn'].forEach(function(id) {
    document.getElementById(id)?.addEventListener('click', function() {
      setTimeout(showImage, 200);
    });
  });
  
  // Hide only at end screen
  var endScreen = document.getElementById('endScreen');
  if (endScreen) {
    var observer = new MutationObserver(function() {
      if (endScreen.classList.contains('show')) {
        hideImage();
      }
    });
    observer.observe(endScreen, {attributes: true, attributeFilter: ['class']});
  }
  
  // Keyboard support
  document.addEventListener('keydown', function(e) {
    if (e.key === ' ') setTimeout(showImage, 150);
  });
  
  // Initial show after user interacts
  document.addEventListener('click', function fn() {
    setTimeout(showImage, 600);
    document.removeEventListener('click', fn);
  }, {once: true});
})();
</script>'''

# Enhanced home navigation button
HOME_BUTTON_HTML = '''
  <!-- Home Navigation Button -->
  <div class="nav-buttons">
    <a href="../" class="home-nav-btn" id="homeNavBtn" title="Go to Home">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span>Home</span>
    </a>
    <a href="../#startups" class="back-nav-btn" id="backNavBtn" title="Back to Startups">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
      <span>Back</span>
    </a>
  </div>
'''

# Navigation CSS
NAV_CSS = '''
  /* Navigation Buttons */
  .nav-buttons {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 50;
    display: flex;
    gap: .5rem;
  }
  .home-nav-btn, .back-nav-btn {
    display: flex;
    align-items: center;
    gap: .4rem;
    padding: .45rem .85rem;
    background: rgba(17, 28, 46, 0.92);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 8px;
    color: #e5edff;
    font-family: -apple-system, BlinkMacSystemFont, 'Inter', sans-serif;
    font-size: .82rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.25s ease;
    cursor: pointer;
  }
  .home-nav-btn:hover {
    background: rgba(220, 38, 38, 0.2);
    border-color: rgba(220, 38, 38, 0.6);
    color: #fca5a5;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(220, 38, 38, 0.25);
  }
  .back-nav-btn:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.7);
    color: #93c5fd;
    transform: translateY(-1px);
    box-shadow: 0 4px 20px rgba(59, 130, 246, 0.25);
  }
  .home-nav-btn svg, .back-nav-btn svg {
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .nav-buttons {
      top: auto;
      bottom: 70px;
      right: 1rem;
      flex-direction: column;
      gap: .35rem;
    }
    .home-nav-btn, .back-nav-btn {
      padding: .4rem .7rem;
      font-size: .75rem;
    }
    .home-nav-btn span, .back-nav-btn span {
      display: none;
    }
  }'''

# Image label overlay HTML
def get_label_html(labels):
    metrics_html = ''.join([f'<span class="img-metric">{m}</span>' for m in labels['metrics']])
    return f'''
  <!-- Image Label Overlay -->
  <div class="image-labels" id="imageLabels">
    <h3 class="img-title">{labels['title']}</h3>
    <p class="img-subtitle">{labels['subtitle']}</p>
    <div class="img-metrics">{metrics_html}</div>
  </div>'''

# Labels CSS
LABELS_CSS = '''
  /* Image Labels Overlay */
  .image-labels {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    padding: 1.2rem 1.5rem;
    background: linear-gradient(to top, rgba(7,11,20,0.95) 0%, rgba(7,11,20,0.8) 70%, transparent 100%);
    border-radius: 0 0 12px 12px;
    pointer-events: none;
  }
  .img-title {
    font-size: 1.1rem;
    font-weight: 700;
    color: #fff;
    margin-bottom: .3rem;
    letter-spacing: -0.01em;
  }
  .img-subtitle {
    font-size: .85rem;
    color: #93c5fd;
    margin-bottom: .6rem;
    font-weight: 500;
  }
  .img-metrics {
    display: flex;
    gap: .6rem;
    flex-wrap: wrap;
  }
  .img-metric {
    padding: .25rem .65rem;
    background: rgba(59, 130, 246, 0.2);
    border: 1px solid rgba(59, 130, 246, 0.4);
    border-radius: 6px;
    font-size: .72rem;
    font-weight: 600;
    color: #bfdbfe;
    font-family: 'JetBrains Mono', monospace;
  }'''


def fix_file(filepath, filename):
    """Apply all fixes to a single file."""
    print(f"\n{'='*50}")
    print(f"📄 Fixing {filename}...")
    print(f"{'='*50}")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    modified = False
    
    # 1. Replace old back button with new nav buttons (Home + Back)
    old_back_btn_pattern = r'<!-- Back Navigation Button -->.*?</a>'
    if re.search(old_back_btn_pattern, content, re.DOTALL):
        content = re.sub(old_back_btn_pattern, HOME_BUTTON_HTML.strip(), content, flags=re.DOTALL)
        print("  ✅ Updated navigation buttons (Home + Back)")
        modified = True
    elif 'back-nav-btn' not in content:
        # Add before scene-label
        content = content.replace(
            '<div class="scene-label"',
            HOME_BUTTON_HTML + '<div class="scene-label"'
        )
        print("  ✅ Added navigation buttons")
        modified = True
    
    # 2. Update/add navigation CSS
    if 'nav-buttons' not in content or '.home-nav-btn' not in content:
        # Remove old nav CSS if exists
        content = re.sub(r'/\* Back Navigation Button \*/.*?@media \(max-width: 640px\) \{.*?\n  \}', '', content, flags=re.DOTALL)
        # Add new CSS before </style>
        content = content.replace('</style>', NAV_CSS + '\n</style>')
        print("  ✅ Added navigation CSS")
        modified = True
    
    # 3. Replace old image JS with fixed version that keeps image visible
    old_js_markers = [
        '// Research image overlay control',
        '// Research image overlay control - FIXED VERSION'
    ]
    
    for marker in old_js_markers:
        if marker in content:
            # Find and replace the script block
            pattern = r'<script>\s*' + re.escape(marker) + r'.*?</script>'
            if re.search(pattern, content, re.DOTALL):
                content = re.sub(pattern, FIXED_VISIBILITY_JS.strip(), content, flags=re.DOTALL)
                print("  ✅ Fixed image visibility (stays visible during playback)")
                modified = True
                break
    
    # 4. Add English labels overlay inside research-overlay
    if filename in IMAGE_LABELS:
        labels = IMAGE_LABELS[filename]
        label_html = get_label_html(labels)
        
        # Check if labels already exist
        if 'image-labels' not in content:
            # Add labels inside the overlay div, after the img tag
            content = content.replace(
                '</div>\n<div class="stage">',
                label_html + '</div>\n<div class="stage">'
            )
            # Also add labels CSS
            if 'image-labels' not in content:
                content = content.replace('</style>', LABELS_CSS + '\n</style>')
            print(f"  ✅ Added English labels: {labels['title']}")
            modified = True
    
    if modified:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print("  ⚠️ No changes needed")
        return False


def main():
    print("=" * 60)
    print(" COMPLETE FIX: Visibility + Home Button + English Labels ")
    print("=" * 60)
    
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
    
    print("\n" + "=" * 60)
    print(f"✅ Complete! Fixed {success}/{len(files)} files")
    print("=" * 60)
    print("\nFixes applied:")
    print("  🖼️  Image stays VISIBLE during full 60s narration")
    print("  🏠 HOME button added (links to main page)")
    print("  🔙 BACK button added (links to #startups)")
    print("  🏷️  English labels overlay on images")


if __name__ == "__main__":
    main()
