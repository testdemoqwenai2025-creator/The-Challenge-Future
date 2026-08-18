#!/usr/bin/env python3
"""
Generate Audio Files with z-ai TTS SDK
=====================================
This script generates high-quality audio files using the z-ai TTS SDK
for portfolio shorts and weekly research shorts.

Output: WAV audio files in docs/shorts/assets/audio/ and docs/portfolio-shorts/assets/audio/
"""

import subprocess
import json
import os
from pathlib import Path

# Base paths
BASE_DIR = Path("/home/z/my-project/scimspt-platform")
OUTPUT_DIR_SHORTS = BASE_DIR / "docs" / "shorts" / "assets" / "audio"
OUTPUT_DIR_PORTFOLIO = BASE_DIR / "docs" / "portfolio-shorts" / "assets" / "audio"

# Create output directories
OUTPUT_DIR_PORTFOLIO.mkdir(parents=True, exist_ok=True)

# Portfolio narrations for TTS generation
PORTFOLIO_NARRATIONS = {
    "P12": {
        "name": "Helios Tandem",
        "scenes": [
            {"id": "intro", "text": "Helios Tandem. Perovskite-on-silicon tandem photovoltaics — first commercial thirty percent module efficiency at scaling cost parity with mono-Si."},
            {"id": "signal", "text": "Perovskite and silicon tandem solar cells break thirty-three percent efficiency barrier, marking a pivotal moment for next-generation photovoltaics."},
            {"id": "paper1", "text": "Paper one demonstrates certified twenty-nine point three percent efficient two-terminal perovskite-silicon tandem solar cell, approaching theoretical limits."},
            {"id": "paper2", "text": "Paper two presents scalable fabrication methods for large-area perovskite-silicon modules suitable for industrial manufacturing."},
            {"id": "paper3", "text": "Paper three analyzes long-term stability and degradation mechanisms under real-world operating conditions."},
            {"id": "paper4", "text": "Paper four provides comprehensive cost analysis showing path to grid parity without subsidies."},
            {"id": "bullets", "text": "Key takeaways: largest total addressable market at thirty-two billion dollars, proven technology readiness level, and strategic IP position."},
            {"id": "outro", "text": "Helios Tandem — powering the solar revolution with perovskite-silicon tandem technology."}
        ]
    },
    "P3": {
        "name": "Solid State Labs",
        "scenes": [
            {"id": "intro", "text": "Solid State Labs. Solid-state lithium-metal batteries with sulfide electrolyte — four hundred fifty watt-hours per kilogram cell-level energy density."},
            {"id": "signal", "text": "Breakthrough in solid-state electrolyte materials enables safe, high-energy-density batteries for electric vehicles."},
            {"id": "paper1", "text": "Paper one reports novel sulfide-based solid electrolyte with ionic conductivity exceeding liquid electrolytes."},
            {"id": "paper2", "text": "Paper two demonstrates stable cycling performance over one thousand charge-discharge cycles."},
            {"id": "bullets", "text": "Key advantages: drop-in replacement form factor, pilot line operational month eighteen, OEM qualification by month twenty-four."},
            {"id": "outro", "text": "Solid State Labs — redefining energy storage for the electric vehicle era."}
        ]
    },
    "P11": {
        "name": "Carbon Sink",
        "scenes": [
            {"id": "intro", "text": "Carbon Sink. Orbital AI data centres powered by space-based solar — liquid-cooled GPU pods in Low Earth Orbit."},
            {"id": "signal", "text": "Space-based solar power combined with orbital computing eliminates grid-side carbon emissions entirely."},
            {"id": "paper1", "text": "Paper one analyzes wireless power transmission efficiency from orbit to ground stations."},
            {"id": "paper2", "text": "Paper two presents thermal management solutions for GPU clusters in microgravity environment."},
            {"id": "bullets", "text": "Impact: eliminates one hundred percent of grid carbon, optical downlink provides low-latency connectivity, positions AI growth outside atmospheric constraints."},
            {"id": "outro", "text": "Carbon Sink — zero-carbon AI computing from space."}
        ]
    },
    "P5": {
        "name": "Hydrogen Forge",
        "scenes": [
            {"id": "intro", "text": "Hydrogen Forge. High-temperature solid-oxide electrolysis cells at eighty-five percent system efficiency for green hydrogen production."},
            {"id": "signal", "text": "Next-generation electrolysis technology achieves unprecedented efficiency in hydrogen production from renewable electricity."},
            {"id": "paper1", "text": "Paper one details novel ceramic electrode materials enabling lower temperature operation."},
            {"id": "paper2", "text": "Paper two demonstrates stack durability exceeding forty thousand hours continuous operation."},
            {"id": "bullets", "text": "Economics: lowest levelized cost of hydrogen production, turnkey plants for industrial applications, ammonia synthesis integration ready."},
            {"id": "outro", "text": "Hydrogen Forge — industrial decarbonization through efficient green hydrogen."}
        ]
    },
    "P9": {
        "name": "TMD Logic",
        "scenes": [
            {"id": "intro", "text": "TMD Logic. Wafer-scale transition-metal dichalcogenide synthesis — the enabler for beyond-silicon two-dimensional semiconductors."},
            {"id": "signal", "text": "Wafer-scale epitaxial monolayer Molybdenum Disulfide grown with sub-zero point one percent defect density."},
            {"id": "paper1", "text": "Paper one demonstrates scalable chemical vapor deposition process for uniform monolayer coverage."},
            {"id": "paper2", "text": "Paper two presents electrical characterization showing carrier mobility exceeding one hundred square centimeters per volt-second."},
            {"id": "bullets", "text": "Market position: sells ready-to-use Molybdenum Disulfide and Tungsten Diselenide wafers to foundries and two-nanometer CMOS R&D programmes."},
            {"id": "outro", "text": "TMD Logic — powering the beyond-silicon semiconductor revolution."}
        ]
    },
    "P-cmos-2nm": {
        "name": "Atomic Gate Systems",
        "scenes": [
            {"id": "intro", "text": "Atomic Gate Systems. Two-nanometer-class gate-all-around transistor technology with vertically-stacked nanosheet architecture."},
            {"id": "signal", "text": "IBM demonstrates two-nanometer gate-all-around nanosheet transistor with twenty-five percent performance gain over FinFET."},
            {"id": "paper1", "text": "Paper one details the nanosheet fabrication process with critical dimension control below one nanometer."},
            {"id": "paper2", "text": "Paper two presents benchmark results showing power reduction up to seventy-five percent at same performance."},
            {"id": "bullets", "text": "Business model: license to Tier-one foundries — capital-light, royalty-heavy. Targets mobile and high-performance computing markets."},
            {"id": "outro", "text": "Atomic Gate Systems — redefining the limits of Moore's Law."}
        ]
    },
    "P-ai-materials": {
        "name": "Lattice Forge",
        "scenes": [
            {"id": "intro", "text": "Lattice Forge. AI-discovered crystalline materials as a service — the AlphaFold for materials science."},
            {"id": "signal", "text": "GNoME: Google DeepMind's four point two million new stable crystals discovery accelerates materials screening by orders of magnitude."},
            {"id": "paper1", "text": "Paper one describes the graph neural network architecture predicting crystal stability across chemical space."},
            {"id": "paper2", "text": "Paper two validates AI predictions with autonomous synthesis laboratory achieving ninety percent accuracy."},
            {"id": "bullets", "text": "Revenue model: sells screened candidate structures to battery, catalyst, and semiconductor OEMs. Vertical-integrated wet-lab validation in years two to three."},
            {"id": "outro", "text": "Lattice Forge — accelerating materials discovery with artificial intelligence."}
        ]
    }
}

# Weekly shorts narrations (sample)
WEEKLY_NARRATIONS = {
    "SD-S-04": {
        "name": "Synapse Onco",
        "scenes": [
            {"id": "scene01", "text": "Synapse Onco. Translating this week's ScienceDaily signal into a fundable venture opportunity."},
            {"id": "scene02", "text": "Signal: A low-cost antidepressant may offer new hope for people struggling with long COVID fatigue."},
            {"id": "scene03", "text": "Research identifies repurposing opportunity for existing FDA-approved medication."},
            {"id": "scene04", "text": "Market need: millions of long-haul patients seeking effective treatments."},
            {"id": "scene05", "text": "Thesis: Accelerated clinical pathway through known safety profile."}
        ]
    }
}


def generate_tts_audio(text: str, output_path: Path, voice: str = "jam", speed: float = 1.0) -> bool:
    """Generate TTS audio using z-ai CLI."""
    try:
        # Truncate text if too long (TTS API limit)
        if len(text) > 1000:
            text = text[:997] + "..."
        
        cmd = [
            "z-ai", "tts",
            "-i", text,
            "-o", str(output_path),
            "-v", voice,
            "-s", str(speed),
            "-f", "wav"
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        
        if result.returncode == 0:
            return True
        else:
            print(f"   ❌ Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print(f"   ❌ Timeout generating {output_path.name}")
        return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False


def main():
    """Main entry point."""
    print("=" * 70)
    print("🎙️  Generating Audio Files with z-ai TTS SDK")
    print("=" * 70)
    
    # Voice options from z-ai TTS SDK
    # Available voices: tongtong, chuichui, xiaochen, jam, kazi, douji, luodo
    # For English content, 'jam' is described as "英音绅士" (British gentleman)
    # Other voices may work well too
    
    VOICE_OPTIONS = {
        "uk-style": "jam",      # British accent style
        "us-style": "kazi",     # Clear standard style  
        "natural": "douji",     # Natural flowing style
    }
    
    selected_voice = VOICE_OPTIONS["uk-style"]
    
    print(f"\n📋 Configuration:")
    print(f"   Voice: {selected_voice} (UK-style British)")
    print(f"   Speed: 1.0x (normal)")
    print(f"   Format: WAV (24000 Hz)")
    
    # Generate portfolio short audios
    print(f"\n📁 Generating Portfolio Short Audio Files:")
    print("-" * 50)
    
    portfolio_count = 0
    for short_id, data in PORTFOLIO_NARRATIONS.items():
        print(f"\n🎬 {short_id}: {data['name']}")
        
        # Create output directory for this short
        short_dir = OUTPUT_DIR_PORTFOLIO / short_id
        short_dir.mkdir(parents=True, exist_ok=True)
        
        for scene in data["scenes"]:
            output_file = short_dir / f"{scene['id']}.wav"
            
            if output_file.exists():
                print(f"   ⏭️  {scene['id']}.wav exists, skipping...")
                continue
            
            success = generate_tts_audio(scene["text"], output_file, selected_voice)
            if success:
                size_kb = output_file.stat().st_size / 1024
                print(f"   ✅ {scene['id']}.wav ({size_kb:.1f} KB)")
                portfolio_count += 1
            else:
                print(f"   ❌ Failed to generate {scene['id']}.wav")
    
    # Generate weekly short audios (sample)
    print(f"\n📁 Generating Weekly Short Audio Files:")
    print("-" * 50)
    
    weekly_count = 0
    for short_id, data in WEEKLY_NARRATIONS.items():
        print(f"\n🎬 {short_id}: {data['name']}")
        
        # Use existing directory structure
        short_dir = OUTPUT_DIR_SHORTS / short_id
        
        for scene in data["scenes"]:
            output_file = short_dir / f"{scene['id']}_tts.wav"
            
            success = generate_tts_audio(scene["text"], output_file, selected_voice)
            if success:
                size_kb = output_file.stat().st_size / 1024
                print(f"   ✅ {scene['id']}_tts.wav ({size_kb:.1f} KB)")
                weekly_count += 1
    
    # Summary
    print("\n" + "=" * 70)
    print(f"✨ Generation Complete!")
    print("=" * 70)
    print(f"\n📊 Results:")
    print(f"   Portfolio shorts: {portfolio_count} audio files generated")
    print(f"   Weekly shorts: {weekly_count} audio files generated")
    print(f"\n📂 Output locations:")
    print(f"   Portfolio: {OUTPUT_DIR_PORTFOLIO}")
    print(f"   Weekly: {OUTPUT_DIR_SHORTS}")
    print(f"\n💡 Note: These are generated using z-ai TTS SDK.")
    print(f"   The Web Speech API system uses browser-native voices.")
    print(f"   Both systems support UK/US voice selection.")


if __name__ == "__main__":
    main()
