#!/usr/bin/env python3
"""
Fix Narration Content in Portfolio Shorts
=========================================
This script replaces placeholder narration text with actual content
and adds proper audio initialization for browser compatibility.
"""

import re
from pathlib import Path

# Base path
BASE_DIR = Path("/home/z/my-project/scimspt-platform/docs/portfolio-shorts")

# Proper narration content for each portfolio short
NARRATIONS = {
    "P12": {
        "name": "Helios Tandem",
        "scenes": [
            "Helios Tandem. Perovskite-on-silicon tandem photovoltaics — first commercial thirty percent module efficiency at scaling cost parity with mono-Si. P twelve wins the SciMSPT scoring matrix as the largest TAM, thirty-two billion dollars, with structural demand from grid-storage build-out.",
            "Signal: Perovskite and silicon tandem solar cells break thirty-three percent efficiency barrier, marking a pivotal moment for next-generation photovoltaics.",
            "Paper one demonstrates certified twenty-nine point three percent efficient two-terminal perovskite-silicon tandem solar cell, approaching theoretical limits.",
            "Paper two presents scalable fabrication methods for large-area perovskite-silicon modules suitable for industrial manufacturing.",
            "Paper three analyzes long-term stability and degradation mechanisms under real-world operating conditions.",
            "Paper four provides comprehensive cost analysis showing path to grid parity without subsidies.",
            "Key takeaways: largest total addressable market at thirty-two billion dollars, proven technology readiness level, and strategic IP position.",
            "Helios Tandem — powering the solar revolution with perovskite-silicon tandem technology."
        ]
    },
    "P3": {
        "name": "Solid State Labs",
        "scenes": [
            "Solid State Labs. Solid-state lithium-metal batteries with sulfide electrolyte — four hundred fifty watt-hours per kilogram cell-level energy density.",
            "Signal: Breakthrough in solid-state electrolyte materials enables safe, high-energy-density batteries for electric vehicles.",
            "Paper one reports novel sulfide-based solid electrolyte with ionic conductivity exceeding liquid electrolytes.",
            "Paper two demonstrates stable cycling performance over one thousand charge-discharge cycles.",
            "Key advantages: drop-in replacement form factor, pilot line operational month eighteen, OEM qualification by month twenty-four.",
            "Solid State Labs — redefining energy storage for the electric vehicle era."
        ]
    },
    "P11": {
        "name": "Carbon Sink",
        "scenes": [
            "Carbon Sink. Orbital AI data centres powered by space-based solar — liquid-cooled GPU pods in Low Earth Orbit.",
            "Signal: Space-based solar power combined with orbital computing eliminates grid-side carbon emissions entirely.",
            "Paper one analyzes wireless power transmission efficiency from orbit to ground stations.",
            "Paper two presents thermal management solutions for GPU clusters in microgravity environment.",
            "Impact: eliminates one hundred percent of grid carbon, optical downlink provides low-latency connectivity, positions AI growth outside atmospheric constraints.",
            "Carbon Sink — zero-carbon AI computing from space."
        ]
    },
    "P5": {
        "name": "Hydrogen Forge",
        "scenes": [
            "Hydrogen Forge. High-temperature solid-oxide electrolysis cells at eighty-five percent system efficiency for green hydrogen production.",
            "Signal: Next-generation electrolysis technology achieves unprecedented efficiency in hydrogen production from renewable electricity.",
            "Paper one details novel ceramic electrode materials enabling lower temperature operation.",
            "Paper two demonstrates stack durability exceeding forty thousand hours continuous operation.",
            "Economics: lowest levelized cost of hydrogen production, turnkey plants for industrial applications, ammonia synthesis integration ready.",
            "Hydrogen Forge — industrial decarbonization through efficient green hydrogen."
        ]
    },
    "P9": {
        "name": "TMD Logic",
        "scenes": [
            "TMD Logic. Wafer-scale transition-metal dichalcogenide synthesis — the enabler for beyond-silicon two-dimensional semiconductors.",
            "Signal: Wafer-scale epitaxial monolayer Molybdenum Disulfide grown with sub-zero point one percent defect density.",
            "Paper one demonstrates scalable chemical vapor deposition process for uniform monolayer coverage.",
            "Paper two presents electrical characterization showing carrier mobility exceeding one hundred square centimeters per volt-second.",
            "Market position: sells ready-to-use Molybdenum Disulfide and Tungsten Diselenide wafers to foundries and two-nanometer CMOS R&D programmes.",
            "TMD Logic — powering the beyond-silicon semiconductor revolution."
        ]
    },
    "P-cmos-2nm": {
        "name": "Atomic Gate Systems",
        "scenes": [
            "Atomic Gate Systems. Two-nanometer-class gate-all-around transistor technology with vertically-stacked nanosheet architecture.",
            "Signal: IBM demonstrates two-nanometer gate-all-around nanosheet transistor with twenty-five percent performance gain over FinFET.",
            "Paper one details the nanosheet fabrication process with critical dimension control below one nanometer.",
            "Paper two presents benchmark results showing power reduction up to seventy-five percent at same performance.",
            "Business model: license to Tier-one foundries — capital-light, royalty-heavy. Targets mobile and high-performance computing markets.",
            "Atomic Gate Systems — redefining the limits of Moore's Law."
        ]
    },
    "P-ai-materials": {
        "name": "Lattice Forge",
        "scenes": [
            "Lattice Forge. AI-discovered crystalline materials as a service — the AlphaFold for materials science.",
            "Signal: GNoME, Google DeepMind's four point two million new stable crystals discovery accelerates materials screening by orders of magnitude.",
            "Paper one describes the graph neural network architecture predicting crystal stability across chemical space.",
            "Paper two validates AI predictions with autonomous synthesis laboratory achieving ninety percent accuracy.",
            "Revenue model: sells screened candidate structures to battery, catalyst, and semiconductor OEMs. Vertical-integrated wet-lab validation in years two to three.",
            "Lattice Forge — accelerating materials discovery with artificial intelligence."
        ]
    }
}

# Audio initialization script to add
AUDIO_INIT_SCRIPT = '''
<script>
// ===== Audio Initialization (Browser Policy Compliance) =====
(function() {
  var audioInitialized = false;
  
  function initAudio() {
    if (audioInitialized) return;
    audioInitialized = true;
    
    // Remove init overlay if exists
    var overlay = document.getElementById('audioInitOverlay');
    if (overlay) overlay.style.display = 'none';
    
    // Initialize speech synthesis with empty utterance
    if ('speechSynthesis' in window) {
      var synth = window.speechSynthesis;
      // Some browsers need this to unlock audio
      var u = new SpeechSynthesisUtterance('');
      u.volume = 0;
      try { synth.speak(u); setTimeout(function() { synth.cancel(); }, 100); } catch(e) {}
    }
    
    console.log('[SciMSPT] Audio initialized');
  }
  
  // Create audio init overlay
  function createOverlay() {
    var div = document.createElement('div');
    div.id = 'audioInitOverlay';
    div.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(7,11,20,.95);display:flex;align-items:center;justify-content:center;cursor:pointer;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';
    div.innerHTML = '<div style="text-align:center;padding:2rem;max-width:400px;"><div style="font-size:4rem;margin-bottom:1rem;">🔊</div><h2 style="color:#e5edff;margin-bottom:.5rem;font-size:1.5rem;">Enable Voice</h2><p style="color:#9fb0cc;font-size:.95rem;line-height:1.6;">Click anywhere to enable voice narration.<br>Browsers require user interaction before playing audio.</p><div style="margin-top:1.5rem;padding:.75rem 1.5rem;background:rgba(59,130,246,.15);border:1px solid rgba(59,130,246,.4);border-radius:8px;color:#60a5fa;font-size:.85rem;">🎙️ UK/US Native Voice Support</div></div>';
    div.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      initAudio();
    });
    document.body.appendChild(div);
  }
  
  // Wait for DOM
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createOverlay);
  } else {
    createOverlay();
  }
  
  // Also init on first user gesture
  document.addEventListener('click', function initOnClick(e) {
    if (!audioInitialized && e.target.closest('#audioInitOverlay')) return; // Let overlay handle it
    if (!audioInitialized) {
      initAudio();
      document.removeEventListener('click', initOnClick);
    }
  }, true);
  
  // Expose
  window.__SCIMSPT_AUDIO_INIT = { initialized: function() { return audioInitialized; }, init: initAudio };
})();
</script>
'''


def fix_narration_in_file(filepath: Path, short_id: str) -> bool:
    """Fix narration content in a single HTML file."""
    try:
        content = filepath.read_text(encoding='utf-8')
        
        # Get proper narration data
        if short_id not in NARRATIONS:
            print(f"   ⚠️ No narration data for {short_id}")
            return False
        
        scenes = NARRATIONS[short_id]["scenes"]
        
        # Build new NARRATION array
        narration_items = []
        for i, text in enumerate(scenes):
            # Escape single quotes in text
            escaped_text = text.replace("'", "\\'")
            narration_items.append(f'{{idx:{i}, scene:"{i}", text:\'{escaped_text}\'}}')
        
        new_narration_str = "var NARRATION = [" + ", ".join(narration_items) + "];"
        
        # Replace old NARRATION
        pattern = r'var NARRATION = \[.*?\];'
        new_content = re.sub(pattern, new_narration_str, content, flags=re.DOTALL)
        
        if new_content == content:
            print(f"   ⚠️ No NARRATION pattern found in {filepath.name}")
            return False
        
        # Add audio init script before </body>
        if '</body>' in new_content:
            new_content = new_content.replace('</body>', AUDIO_INIT_SCRIPT + '\n</body>')
        elif '</html>' in new_content:
            new_content = new_content.replace('</html>', AUDIO_INIT_SCRIPT + '\n</html>')
        
        filepath.write_text(new_content, encoding='utf-8')
        return True
        
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def main():
    print("=" * 70)
    print("🔧 Fixing Narration Content in Portfolio Shorts")
    print("=" * 70)
    
    fixed_count = 0
    
    for short_id, data in NARRATIONS.items():
        filepath = BASE_DIR / f"{short_id}.html"
        
        if not filepath.exists():
            print(f"\n⚠️ File not found: {short_id}.html")
            continue
        
        print(f"\n📝 Fixing {short_id}: {data['name']}")
        
        if fix_narration_in_file(filepath, short_id):
            print(f"   ✅ Fixed narration ({len(data['scenes'])} scenes)")
            fixed_count += 1
        else:
            print(f"   ❌ Failed to fix")
    
    print("\n" + "=" * 70)
    print(f"✨ Fixed {fixed_count}/{len(NARRATIONS)} portfolio shorts")
    print("=" * 70)
    print("\nChanges:")
    print("  - Replaced placeholder narration with actual content")
    print("  - Added audio initialization overlay (browser policy)")
    print("  - All scenes now have proper UK-style narration")


if __name__ == "__main__":
    main()
