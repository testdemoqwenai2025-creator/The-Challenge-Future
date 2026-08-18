#!/usr/bin/env python3
"""
Complete Audio Generation for Remaining Portfolio Shorts
=====================================================
Generates TTS audio for P11 (Carbon Sink) and P5 (Hydrogen Forge)
with rate-limit handling and delays between requests.
"""

import subprocess
import time
from pathlib import Path

BASE_DIR = Path("/home/z/my-project/scimspt-platform")
OUTPUT_DIR = BASE_DIR / "docs" / "portfolio-shorts" / "assets" / "audio"

# Remaining narrations to generate
REMAINING_NARRATIONS = {
    "P11": {
        "name": "Carbon Sink",
        "scenes": [
            {"id": "intro", "text": "Carbon Sink. Orbital AI data centres powered by space-based solar — liquid-cooled GPU pods in Low Earth Orbit."},
            {"id": "signal", "text": "Space-based solar power combined with orbital computing eliminates grid-side carbon emissions entirely."},
            {"id": "paper1", "text": "Paper one analyzes wireless power transmission efficiency from orbit to ground stations."},
            {"id": "paper2", "text": "Paper two presents thermal management solutions for GPU clusters in microgravity environment."},
            {"id": "paper3", "text": "Paper three demonstrates optical downlink achieving gigabit speeds from LEO to ground."},
            {"id": "paper4", "text": "Paper four provides cost analysis showing competitive advantage over terrestrial data centres."},
            {"id": "bullets", "text": "Impact: eliminates one hundred percent of grid carbon, optical downlink provides low-latency connectivity, positions AI growth outside atmospheric constraints."},
            {"id": "outro", "text": "Carbon Sink — zero-carbon AI computing from space."}
        ]
    },
    "P5": {
        "name": "Hydrogen Forge",
        "scenes": [
            {"id": "intro", "text": "Hydrogen Forge. High-temperature solid-oxide electrolysis cells at eighty-five percent system efficiency for green hydrogen production."},
            {"id": "signal", "text": "Next-generation electrolysis technology achieves unprecedented efficiency in hydrogen production from renewable electricity."},
            {"id": "paper1", "text": "Paper one details novel ceramic electrode materials enabling lower temperature operation at seven hundred degrees Celsius."},
            {"id": "paper2", "text": "Paper two demonstrates stack durability exceeding forty thousand hours continuous operation."},
            {"id": "paper3", "text": "Paper three presents system integration with industrial heat recovery achieving ninety percent total efficiency."},
            {"id": "bullets", "text": "Economics: lowest levelized cost of hydrogen production, turnkey plants for industrial applications, ammonia synthesis integration ready."},
            {"id": "outro", "text": "Hydrogen Forge — industrial decarbonization through efficient green hydrogen."}
        ]
    }
}


def generate_tts_audio(text: str, output_path: Path, voice: str = "jam", speed: float = 1.0) -> bool:
    """Generate TTS audio using z-ai CLI with retry logic."""
    max_retries = 3
    
    for attempt in range(max_retries):
        try:
            # Truncate text if too long
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
                if "429" in result.stderr or "rate limit" in result.stderr.lower():
                    wait_time = (attempt + 1) * 10  # 10s, 20s, 30s
                    print(f"   ⏳ Rate limited, waiting {wait_time}s... (attempt {attempt + 1}/{max_retries})")
                    time.sleep(wait_time)
                else:
                    print(f"   ❌ Error: {result.stderr[:200]}")
                    return False
                    
        except subprocess.TimeoutExpired:
            print(f"   ⏳ Timeout, retrying...")
            time.sleep(15)
        except Exception as e:
            print(f"   ❌ Exception: {e}")
            return False
    
    return False


def main():
    """Main entry point."""
    print("=" * 70)
    print("🎙️  Completing Audio Generation (P11 & P5)")
    print("=" * 70)
    
    selected_voice = "jam"  # UK-style British
    delay_between_requests = 3  # seconds
    
    print(f"\n📋 Configuration:")
    print(f"   Voice: {selected_voice} (UK-style British)")
    print(f"   Delay between requests: {delay_between_requests}s")
    
    total_generated = 0
    total_failed = 0
    
    for short_id, data in REMAINING_NARRATIONS.items():
        print(f"\n🎬 {short_id}: {data['name']}")
        print("-" * 50)
        
        # Create output directory
        short_dir = OUTPUT_DIR / short_id
        short_dir.mkdir(parents=True, exist_ok=True)
        
        for i, scene in enumerate(data["scenes"]):
            output_file = short_dir / f"{scene['id']}.wav"
            
            # Skip if already exists
            if output_file.exists():
                size_kb = output_file.stat().st_size / 1024
                print(f"   ⏭️  {scene['id']}.wav exists ({size_kb:.1f} KB)")
                total_generated += 1
                continue
            
            print(f"   🎙️  Generating {scene['id']}.wav...", end=" ", flush=True)
            
            success = generate_tts_audio(scene["text"], output_file, selected_voice)
            
            if success:
                size_kb = output_file.stat().st_size / 1024
                print(f"✅ ({size_kb:.1f} KB)")
                total_generated += 1
            else:
                print("❌ Failed")
                total_failed += 1
            
            # Delay between requests to avoid rate limiting
            if i < len(data["scenes"]) - 1:
                time.sleep(delay_between_requests)
        
        # Extra delay between different shorts
        time.sleep(5)
    
    # Summary
    print("\n" + "=" * 70)
    print(f"✨ Generation Complete!")
    print("=" * 70)
    print(f"\n📊 Results:")
    print(f"   ✅ Successfully generated: {total_generated} files")
    print(f"   ❌ Failed: {total_failed} files")
    print(f"\n📂 Output location:")
    print(f"   {OUTPUT_DIR}")
    
    # List all generated files
    print(f"\n📁 All portfolio audio files:")
    for short_dir in sorted(OUTPUT_DIR.iterdir()):
        if short_dir.is_dir():
            files = list(short_dir.glob("*.wav"))
            print(f"   📂 {short_dir.name}/: {len(files)} files")
            for f in sorted(files)[:3]:
                size_kb = f.stat().st_size / 1024
                print(f"      • {f.name} ({size_kb:.1f} KB)")
            if len(files) > 3:
                print(f"      ... and {len(files) - 3} more")


if __name__ == "__main__":
    main()
