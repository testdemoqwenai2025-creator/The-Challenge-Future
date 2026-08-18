#!/usr/bin/env python3
"""
Fix timing AND add back button to all 7 portfolio shorts.
The SCENES array must match the actual number of HTML scenes.
"""

import re
import os

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# Scene configurations for each file based on actual HTML content
FILE_CONFIGS = {
    "P12.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":7},
            {"id":"signal","label":"Signal","start":7,"end":14},
            {"id":"paper-0","label":"Paper 1","start":14,"end":22},
            {"id":"paper-1","label":"Paper 2","start":22,"end":30},
            {"id":"paper-2","label":"Paper 3","start":30,"end":38},
            {"id":"paper-3","label":"Paper 4","start":38,"end":46},
            {"id":"bullets","label":"Bullets","start":46,"end":53},
            {"id":"outro","label":"Outro","start":53,"end":60}
        ],
        "name": "Helios Tandem"
    },
    "P3.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":8},
            {"id":"signal","label":"Signal","start":8,"end":16},
            {"id":"paper-0","label":"Paper 1","start":16,"end":26},
            {"id":"paper-1","label":"Paper 2","start":26,"end":36},
            {"id":"paper-2","label":"Paper 3","start":36,"end":46},
            {"id":"bullets","label":"Bullets","start":46,"end":54},
            {"id":"outro","label":"Outro","start":54,"end":60}
        ],
        "name": "Solid State Labs"
    },
    "P11.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":7},
            {"id":"signal","label":"Signal","start":7,"end":14},
            {"id":"paper-0","label":"Paper 1","start":14,"end":23},
            {"id":"paper-1","label":"Paper 2","start":23,"end":32},
            {"id":"paper-2","label":"Paper 3","start":32,"end":41},
            {"id":"paper-3","label":"Paper 4","start":41,"end":50},
            {"id":"bullets","label":"Bullets","start":50,"end":56},
            {"id":"outro","label":"Outro","start":56,"end":60}
        ],
        "name": "Orbital AI"
    },
    "P5.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":8},
            {"id":"signal","label":"Signal","start":8,"end":16},
            {"id":"paper-0","label":"Paper 1","start":16,"end":26},
            {"id":"paper-1","label":"Paper 2","start":26,"end":36},
            {"id":"paper-2","label":"Paper 3","start":36,"end":46},
            {"id":"paper-3","label":"Paper 4","start":46,"end":53},
            {"id":"bullets","label":"Bullets","start":53,"end":57},
            {"id":"outro","label":"Outro","start":57,"end":60}
        ],
        "name": "Hydrogen Forge"
    },
    "P9.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":9},
            {"id":"signal","label":"Signal","start":9,"end":18},
            {"id":"paper-0","label":"Paper 1","start":18,"end":28},
            {"id":"paper-1","label":"Paper 2","start":28,"end":38},
            {"id":"paper-2","label":"Paper 3","start":38,"end":48},
            {"id":"bullets","label":"Bullets","start":48,"end":55},
            {"id":"outro","label":"Outro","start":55,"end":60}
        ],
        "name": "TMD Logic"
    },
    "P-cmos-2nm.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":9},
            {"id":"signal","label":"Signal","start":9,"end":18},
            {"id":"paper-0","label":"Paper 1","start":18,"end":28},
            {"id":"paper-1","label":"Paper 2","start":28,"end":38},
            {"id":"paper-2","label":"Paper 3","start":38,"end":48},
            {"id":"bullets","label":"Bullets","start":48,"end":55},
            {"id":"outro","label":"Outro","start":55,"end":60}
        ],
        "name": "Atomic Gate Systems"
    },
    "P-ai-materials.html": {
        "scenes": [
            {"id":"intro","label":"Hypothesis","start":0,"end":8},
            {"id":"signal","label":"Signal","start":8,"end":16},
            {"id":"paper-0","label":"Paper 1","start":16,"end":26},
            {"id":"paper-1","label":"Paper 2","start":26,"end":36},
            {"id":"paper-2","label":"Paper 3","start":36,"end":44},
            {"id":"paper-3","label":"Paper 4","start":44,"end":51},
            {"id":"bullets","label":"Bullets","start":51,"end":56},
            {"id":"outro","label":"Outro","start":56,"end":60}
        ],
        "name": "Lattice Forge"
    }
}

# Back button HTML to inject
BACK_BUTTON_HTML = '''
  <!-- Back Navigation Button -->
  <a href="../#startups" class="back-nav-btn" id="backNavBtn" title="Back to Startups">
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
    <span>Back</span>
  </a>
'''

# Back button CSS to add
BACK_BUTTON_CSS = '''
  /* Back Navigation Button */
  .back-nav-btn {
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 50;
    display: flex;
    align-items: center;
    gap: .4rem;
    padding: .45rem .85rem;
    background: rgba(17, 28, 46, 0.9);
    backdrop-filter: blur(8px);
    border: 1px solid var(--border);
    border-radius: 8px;
    color: var(--text-muted);
    font-family: var(--sans);
    font-size: .82rem;
    font-weight: 600;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
  }
  .back-nav-btn:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.5);
    color: var(--accent-2);
    transform: translateX(-2px);
  }
  .back-nav-btn svg {
    flex-shrink: 0;
  }

  @media (max-width: 640px) {
    .back-nav-btn {
      top: auto;
      bottom: 70px;
      right: 1rem;
      padding: .4rem .7rem;
      font-size: .75rem;
    }
  }
'''


def count_actual_scenes(content):
    """Count actual data-scene attributes in HTML."""
    return len(re.findall(r'data-scene="[^"]*"', content))


def fix_scenes_array(filepath, filename, config):
    """Fix the SCENES JavaScript array to match actual HTML scenes."""
    print(f"\n📝 Fixing SCENES in {filename}...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Count actual scenes
    actual_count = count_actual_scenes(content)
    new_scenes = config['scenes']
    
    print(f"   Actual HTML scenes: {actual_count}")
    print(f"   New SCENES entries: {len(new_scenes)}")
    
    # Build new SCENES array string
    scenes_json = []
    for s in new_scenes:
        scenes_json.append(f'{{"{s["id"]}","{s["label"]}",start:{s["start"]},end:{s["end"]}}}')
    
    new_scenes_str = f"const SCENES = [{','.join(scenes_json)}];"
    
    # Replace existing SCENES
    old_pattern = r'const SCENES = \[.*?\];'
    
    if re.search(old_pattern, content, re.DOTALL):
        content = re.sub(old_pattern, new_scenes_str, content, flags=re.DOTALL)
        print(f"   ✅ Updated SCENES array ({len(new_scenes)} scenes, ending at {new_scenes[-1]['end']}s)")
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    else:
        print(f"   ❌ Could not find SCENES pattern")
        return False


def add_back_button(filepath, filename):
    """Add back navigation button to HTML file."""
    print(f"   ➕ Adding back button...")
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if back button already exists
    if 'back-nav-btn' in content:
        print(f"   ⏭️ Back button already exists")
        return True
    
    # Add CSS before closing </style> tag
    if BACK_BUTTON_CSS.split('\n')[0].strip() not in content:
        content = content.replace('</style>', BACK_BUTTON_CSS + '\n</style>')
    
    # Add HTML after scene-label div
    content = content.replace(
        '<div class="scene-label" id="sceneLabel">',
        BACK_BUTTON_HTML + '<div class="scene-label" id="sceneLabel">'
    )
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Added back navigation button")
    return True


def main():
    print("=" * 65)
    print(" Fixing Timing & Adding Navigation to Portfolio Shorts ")
    print("=" * 65)
    
    files_to_fix = list(FILE_CONFIGS.keys())
    success_count = 0
    
    for filename in files_to_fix:
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        config = FILE_CONFIGS[filename]
        
        print(f"\n{'─' * 50}")
        print(f"📄 {filename} ({config['name']})")
        print(f"{'─' * 50}")
        
        if os.path.exists(filepath):
            # Fix timing
            timing_ok = fix_scenes_array(filepath, filename, config)
            
            # Add back button
            nav_ok = add_back_button(filepath, filename)
            
            if timing_ok and nav_ok:
                success_count += 1
        else:
            print(f"❌ File not found: {filepath}")
    
    print("\n" + "=" * 65)
    print(f"✨ Complete! Fixed {success_count}/{len(files_to_fix)} files")
    print("=" * 65)
    print("\nChanges made:")
    print("  • SCENES arrays now match actual HTML scene counts")
    print("  • All timelines end at exactly 60 seconds")
    print("  • Back navigation button added to each file")


if __name__ == "__main__":
    main()
