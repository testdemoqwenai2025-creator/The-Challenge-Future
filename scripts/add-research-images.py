#!/usr/bin/env python3
"""
Add Research Images to Portfolio Shorts
========================================
Adds research visualization images that display during narration playback
"""

import re
from pathlib import Path

BASE_DIR = Path("/home/z/my-project/scimspt-platform/docs/portfolio-shorts")

# Image mapping for each short
IMAGES = {
    "P12": "P12-research.png",
    "P3": "P3-research.png",
    "P11": "P11-research.png",
    "P5": "P5-research.png",
    "P9": "P9-research.png",
    "P-cmos-2nm": "P-cmos-2nm-research.png",
    "P-ai-materials": "P-ai-materials-research.png"
}

# CSS for the research image overlay
RESEARCH_IMAGE_CSS = """
  /* Research Image Overlay */
  .research-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 100;
    max-width: 85vw;
    max-height: 60vh;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s ease, transform 0.5s ease;
    border-radius: 12px;
    box-shadow: 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(59,130,246,0.2);
    border: 2px solid rgba(59,130,246,0.4);
  }
  .research-overlay.visible {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
  }
  .research-overlay img {
    width: 100%;
    height: auto;
    border-radius: 10px;
    display: block;
  }
  @media (max-width: 768px) {
    .research-overlay {
      max-width: 95vw;
      max-height: 45vh;
      top: 40%;
    }
  }
"""

# HTML for the research image overlay
RESEARCH_IMAGE_HTML = '''
  <!-- Research Visualization Overlay -->
  <div class="research-overlay" id="researchOverlay">
    <img src="assets/images/{IMAGE_FILE}" alt="Research Papers Visualization" loading="lazy">
  </div>
'''

# JavaScript to show/hide image during playback
RESEARCH_IMAGE_JS = '''
  // Research image overlay control
  var researchOverlay = document.getElementById('researchOverlay');
  
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
  
  // Show image when playing, hide when paused/stopped
  // Hook into existing play/pause events
  if (typeof window.playing !== 'undefined') {
    var originalPlayPause = window.playing;
  }
  
  // Show on play, hide on pause/stop/end
  document.addEventListener('DOMContentLoaded', function() {
    // Show after short delay when playing starts
    var checkPlaying = setInterval(function() {
      if (window.playing === true) {
        showResearchImage();
      } else {
        hideResearchImage();
      }
    }, 500);
    
    // Also show on click of play button
    var playBtn = document.getElementById('playPauseBtn');
    if (playBtn) {
      playBtn.addEventListener('click', function() {
        setTimeout(showResearchImage, 300);
      });
    }
    
    var playOverlay = document.getElementById('playOverlay');
    if (playOverlay) {
      playOverlay.addEventListener('click', function() {
        setTimeout(showResearchImage, 300);
      });
    }
  });
'''


def add_research_image_to_file(filepath: Path, short_id: str) -> bool:
    """Add research image overlay to a portfolio short HTML file."""
    try:
        content = filepath.read_text(encoding='utf-8')
        
        if short_id not in IMAGES:
            print(f"   ⚠️ No image for {short_id}")
            return False
        
        image_file = IMAGES[short_id]
        
        # Check if already added
        if 'research-overlay' in content:
            print(f"   ⏭️ Already has research image")
            return True
        
        # Add CSS before </style> (find last </style>)
        css_pattern = r'(</style>)'
        new_content = re.sub(css_pattern, RESEARCH_IMAGE_CSS + r'\1', content, count=1)
        
        # Add HTML after <body> or after scenes-wrap div
        html_to_add = RESEARCH_IMAGE_HTML.replace('{IMAGE_FILE}', image_file)
        body_pattern = r'(<div class="stage">)'
        new_content = re.sub(body_pattern, html_to_add + r'\n\1', new_content, count=1)
        
        # Add JS before </body>
        js_pattern = r'(</body>)'
        new_content = re.sub(js_pattern, '<script>' + RESEARCH_IMAGE_JS + '</script>\n\1', new_content, count=1)
        
        filepath.write_text(new_content, encoding='utf-8')
        print(f"   ✅ Added {image_file}")
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    print("=" * 70)
    print("🖼️  Adding Research Images to Portfolio Shorts")
    print("=" * 70)
    
    fixed_count = 0
    
    for short_id, image_file in IMAGES.items():
        filepath = BASE_DIR / f"{short_id}.html"
        
        if not filepath.exists():
            print(f"\n⚠️ File not found: {short_id}.html")
            continue
        
        print(f"\n🖼️  Processing {short_id}:")
        
        if add_research_image_to_file(filepath, short_id):
            fixed_count += 1
    
    print("\n" + "=" * 70)
    print(f"✨ Added research images to {fixed_count}/{len(IMAGES)} portfolio shorts")
    print("=" * 70)


if __name__ == "__main__":
    main()
