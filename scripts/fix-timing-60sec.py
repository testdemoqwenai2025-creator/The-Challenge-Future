#!/usr/bin/env python3
"""
Fix Portfolio Shorts Timing
============================
Update all portfolio shorts to have proper 60-second duration
"""

import re
from pathlib import Path

BASE_DIR = Path("/home/z/my-project/scimspt-platform/docs/portfolio-shorts")

# Portfolio shorts with their scene data
PORTFOLIO_SHORTS = {
    "P12": {
        "name": "Helios Tandem",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 8},
            {"id": "signal", "label": "Signal", "duration": 7},
            {"id": "paper-0", "label": "Paper 1", "duration": 8},
            {"id": "paper-1", "label": "Paper 2", "duration": 8},
            {"id": "paper-2", "label": "Paper 3", "duration": 8},
            {"id": "paper-3", "label": "Paper 4", "duration": 8},
            {"id": "bullets", "label": "Bullets", "duration": 7},
            {"id": "outro", "label": "Outro", "duration": 6}
        ]
    },
    "P3": {
        "name": "Solid State Labs",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    },
    "P11": {
        "name": "Carbon Sink",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    },
    "P5": {
        "name": "Hydrogen Forge",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    },
    "P9": {
        "name": "TMD Logic",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    },
    "P-cmos-2nm": {
        "name": "Atomic Gate Systems",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    },
    "P-ai-materials": {
        "name": "Lattice Forge",
        "scenes": [
            {"id": "intro", "label": "Hypothesis", "duration": 10},
            {"id": "signal", "label": "Signal", "duration": 9},
            {"id": "paper-0", "label": "Paper 1", "duration": 11},
            {"id": "paper-1", "label": "Paper 2", "duration": 11},
            {"id": "bullets", "label": "Bullets", "duration": 10},
            {"id": "outro", "label": "Outro", "duration": 9}
        ]
    }
}


def generate_scenes_array(scenes):
    """Generate SCENES array with proper 60-second timing."""
    result = []
    current_time = 0.0
    
    for scene in scenes:
        start = round(current_time, 1)
        end = round(current_time + scene["duration"], 1)
        result.append({
            "id": scene["id"],
            "label": scene["label"],
            "start": start,
            "end": end
        })
        current_time = end
    
    return result


def fix_timing_in_file(filepath: Path, short_id: str) -> bool:
    """Fix timing in a single HTML file."""
    try:
        content = filepath.read_text(encoding='utf-8')
        
        if short_id not in PORTFOLIO_SHORTS:
            print(f"   ⚠️ No config for {short_id}")
            return False
        
        # Generate new SCENES array
        new_scenes = generate_scenes_array(PORTFOLIO_SHORTS[short_id]["scenes"])
        total_duration = new_scenes[-1]["end"]
        
        # Build SCENES array string
        scenes_str = "["
        for i, s in enumerate(new_scenes):
            comma = "," if i < len(new_scenes) - 1 else ""
            scenes_str += f'{{"id":"{s["id"]}","label":"{s["label"]}",start:{s["start"]},end:{s["end"]}}}{comma}'
        scenes_str += "]"
        
        # Replace old SCENES
        pattern = r'const SCENES = \[.*?\];'
        new_content = re.sub(pattern, f'const SCENES = {scenes_str};', content, flags=re.DOTALL)
        
        if new_content == content:
            print(f"   ⚠️ No SCENES pattern found")
            return False
        
        filepath.write_text(new_content, encoding='utf-8')
        
        print(f"   ✅ Updated to {total_duration}s ({len(new_scenes)} scenes)")
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    print("=" * 70)
    print("⏱️  Fixing Portfolio Shorts Timing (60 seconds)")
    print("=" * 70)
    
    fixed_count = 0
    
    for short_id, data in PORTFOLIO_SHORTS.items():
        filepath = BASE_DIR / f"{short_id}.html"
        
        if not filepath.exists():
            print(f"\n⚠️ File not found: {short_id}.html")
            continue
        
        print(f"\n⏱️  Fixing {short_id}: {data['name']}")
        
        if fix_timing_in_file(filepath, short_id):
            fixed_count += 1
    
    print("\n" + "=" * 70)
    print(f"✨ Fixed {fixed_count}/{len(PORTFOLIO_SHORTS)} portfolio shorts")
    print("All shorts now have ~60 second duration!")
    print("=" * 70)


if __name__ == "__main__":
    main()
