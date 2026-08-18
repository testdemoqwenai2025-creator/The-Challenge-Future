#!/usr/bin/env python3
"""
Direct fix: Replace research-overlay with dynamic visual HTML in all 7 files
"""

import os
import re

PORTFOLIO_DIR = "/home/z/my-project/scimspt-platform/docs/portfolio-shorts"

# Dynamic visual HTML template
DYNAMIC_VISUAL_TEMPLATE = '''<div class="research-visual" id="researchVisual"><div class="visual-container"><div class="grid-bg"></div><div class="particles"><div class="particle p1"></div><div class="particle p2"></div><div class="particle p3"></div><div class="particle p4"></div><div class="particle p5"></div><div class="particle p6"></div></div><div class="rotating-core"><div class="core-inner"><div class="core-ring ring1"></div><div class="core-ring ring2"></div><div class="core-ring ring3"></div><div class="core-icon">⚛</div></div></div><div class="orbit orbit1"><div class="orbit-dot"></div></div><div class="orbit orbit2"><div class="orbit-dot"></div></div><div class="orbit orbit3"><div class="orbit-dot"></div></div><div class="data-stream stream1"></div><div class="data-stream stream2"></div><div class="data-stream stream3"></div><div class="data-stream stream4"></div><div class="visual-labels"><h3 class="visual-title">{TITLE}</h3><p class="visual-subtitle">{SUB}</p><div class="visual-metrics"><span>{M1}</span><span>{M2}</span><span>{M3}</span></div></div></div></div>'''

FILE_LABELS = {
    "P12.html": {"TITLE": "Helios Tandem Technologies", "SUB": "Perovskite-on-Silicon Tandem Photovoltaics", "M1": "Efficiency >33%", "M2": "Tandem Architecture", "M3": "1000+ hrs Stability"},
    "P3.html": {"TITLE": "Solid State Labs", "SUB": "Solid-State Li-Metal Battery Systems", "M1": "Sulfide Electrolyte", "M2": "10 mS/cm", "M3": "500+ Cycle Life"},
    "P11.html": {"TITLE": "Orbital AI", "SUB": "Space-Based Solar Power Transmission", "M1": "90% Capacity Factor", "M2": "Wireless Beaming", "M3": "Carbon-Negative"},
    "P5.html": {"TITLE": "Hydrogen Forge", "SUB": "SOEC Green Hydrogen Production", "M1": "800°C Operation", "M2": "$2/kg Target", "M3": "Industrial Scale"},
    "P9.html": {"TITLE": "TMD Logic", "SUB": "2D Materials Wafer Synthesis", "M1": "300mm Wafer", "M2": ">50μm Grains", "M3": "MoS2/WSe2 Monolayers"},
    "P-cmos-2nm.html": {"TITLE": "Atomic Gate Systems", "SUB": "GAA Transistor Architecture", "M1": "2nm Node", "M2": "<5nm Nanosheet", "M3": "Gate-All-Around"},
    "P-ai-materials.html": {"TITLE": "Lattice Forge", "SUB": "AI Materials Discovery Platform", "M1": "4.2M Crystals", "M2": "GNoME Neural Net", "M3": "90% Validation"}
}


def fix_file(filepath, filename):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    labels = FILE_LABELS.get(filename, {})
    
    # Build the dynamic visual HTML
    dynamic_html = DYNAMIC_VISUAL_TEMPLATE.format(**labels)
    
    # Find and replace the old research-overlay div
    # Pattern matches: <div class="research-overlay" ...>...</div>
    old_pattern = r'<div class="research-overlay"[^>]*>.*?</div>\s*'
    
    if re.search(old_pattern, content, re.DOTALL):
        new_content = re.sub(old_pattern, dynamic_html + '\n', content, count=1, flags=re.DOTALL)
        
        if new_content != content:
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            return True
    
    return False


def main():
    files = ["P12.html", "P3.html", "P11.html", "P5.html", "P9.html", "P-cmos-2nm.html", "P-ai-materials.html"]
    
    for filename in files:
        filepath = os.path.join(PORTFOLIO_DIR, filename)
        if os.path.exists(filepath):
            if fix_file(filepath, filename):
                print(f"✅ {filename} - Dynamic visual added")
            else:
                print(f"⚠️ {filename} - No change (may already be fixed)")


if __name__ == "__main__":
    main()
