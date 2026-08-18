#!/usr/bin/env python3
"""
Add UK/US Native Voice TTS System to Portfolio Shorts
======================================================
This script adds the same Web Speech API-based TTS narration system
from the weekly shorts (docs/shorts/) to all portfolio shorts (docs/portfolio-shorts/).

Features added:
- UK (en-GB) and US (en-US) native voice selection
- Voice picker UI with toggle buttons
- Real-time SpeechSynthesis narration
- Caption bar showing current narration text
- LocalStorage persistence for voice preference
"""

import os
import re
import glob
from pathlib import Path

# Base paths
BASE_DIR = Path("/home/z/my-project/scimspt-platform")
PORTFOLIO_DIR = BASE_DIR / "docs" / "portfolio-shorts"

# CSS for voice picker and caption bar
VOICE_CSS = """
  /* === Voice Picker & Narration System === */
  .voice-picker{
    display:flex;align-items:center;gap:.35rem;
    padding:.3rem .5rem;border-radius:6px;
    font-size:.7rem;font-weight:600;letter-spacing:.04em;
    color:var(--text-muted);
    background:rgba(255,255,255,.02);
    border:1px solid var(--border);
    user-select:none;
  }
  .voice-picker:hover{background:var(--surface-2);color:var(--text)}
  .voice-picker .vp-btn{
    padding:.15rem .4rem;border-radius:4px;
    color:var(--text-dim);cursor:pointer;
    font-family:var(--mono);
    transition:all .12s ease;
    border:none;background:transparent;
  }
  .voice-picker .vp-btn.active{
    background:rgba(96,165,250,.18);
    color:var(--accent-2);
    box-shadow:inset 0 0 0 1px rgba(96,165,250,.4);
  }
  /* Caption bar for narration text */
  .caption-bar{
    position:fixed;bottom:56px;left:0;right:0;
    z-index:100;
    background:linear-gradient(transparent, rgba(7,11,20,.92));
    padding:.6rem 1rem;
    transform:translateY(100%);
    transition:transform .35s cubic-bezier(.4,0,.2,1);
    pointer-events:none;
  }
  .caption-bar.visible{transform:translateY(0)}
  .caption-inner{
    max-width:800px;margin:0 auto;
    display:flex;align-items:center;gap:.6rem;
  }
  .caption-text{
    flex:1;
    font-size:.85rem;line-height:1.45;
    color:var(--text);font-style:italic;
    text-shadow:0 1px 3px rgba(0,0,0,.5);
  }
  .caption-meta{
    font-family:var(--mono);font-size:.65rem;
    color:var(--accent-2);white-space:nowrap;
    padding:.2rem .45rem;
    background:rgba(59,130,246,.12);
    border:1px solid rgba(59,130,246,.3);
    border-radius:4px;
  }
  /* Voice button in controls */
  .narration-toggle{
    display:flex;align-items:center;gap:.25rem;
    padding:.25rem .5rem;border-radius:6px;
    font-size:.7rem;color:var(--text-muted);
    background:transparent;border:1px solid var(--border);
    cursor:pointer;transition:all .12s ease;
  }
  .narration-toggle:hover{background:var(--surface-2);color:var(--text)}
  .narration-toggle.muted{opacity:.5}
  .narration-toggle .voice-icon{font-size:.85rem}
  @media (max-width:640px){
    .voice-picker{display:none}
    .caption-bar{bottom:50px}
  }
"""

# JavaScript for TTS system
VOICE_JS = """
<script data-scimspt-native-voice-js>
(function(){
  'use strict';
  if (window.__SCIMSPT_NATIVE_VOICE_BOUND__) return;
  window.__SCIMSPT_NATIVE_VOICE_BOUND__ = true;

  // === Web Speech API narration system ===
  var synth = window.speechSynthesis;
  var SUPPORTED = !!(synth && typeof SpeechSynthesisUtterance !== 'undefined');

  // Voice selection — prefer en-GB (UK), then en-US, then any en
  var voicesCache = [];
  var chosenAccent = (function(){
    try { return localStorage.getItem('scimspt-voice-accent') || 'uk'; }
    catch(e){ return 'uk'; }
  })();
  if (chosenAccent !== 'uk' && chosenAccent !== 'us') chosenAccent = 'uk';

  function refreshVoices(){
    if (!SUPPORTED) return;
    try { voicesCache = synth.getVoices() || []; } catch(e){ voicesCache = []; }
  }
  refreshVoices();
  if (SUPPORTED && synth.onvoiceschanged !== undefined){
    synth.onvoiceschanged = refreshVoices;
  }

  function pickVoice(){
    if (!SUPPORTED || !voicesCache.length) return null;
    var wantLang = (chosenAccent === 'uk') ? 'en-GB' : 'en-US';
    var fallbackLang = (chosenAccent === 'uk') ? 'en-US' : 'en-GB';
    var exact = null, fallback = null, anyEn = null;
    for (var i=0; i<voicesCache.length; i++){
      var v = voicesCache[i];
      var lang = (v.lang || '').toLowerCase();
      if (lang === wantLang.toLowerCase()){
        if (!exact) exact = v;
        else if (exact.name.indexOf('Google') !== -1 && v.name.indexOf('Google') === -1) exact = v;
      } else if (lang === fallbackLang.toLowerCase()){
        if (!fallback) fallback = v;
      } else if (lang.indexOf('en') === 0){
        if (!anyEn) anyEn = v;
      }
    }
    return exact || fallback || anyEn || null;
  }

  function setAccent(acc){
    if (acc !== 'uk' && acc !== 'us') return;
    chosenAccent = acc;
    try { localStorage.setItem('scimspt-voice-accent', acc); } catch(e){}
    var btns = document.querySelectorAll('.voice-picker .vp-btn');
    btns.forEach(function(b){
      b.classList.toggle('active', b.getAttribute('data-accent') === acc);
    });
    if (SUPPORTED && synth.speaking){
      var restoreText = currentUtteranceText;
      synth.cancel();
      if (restoreText) speak(restoreText, true);
    }
    updateCaptionMeta();
  }

  // Wire up voice picker buttons
  document.querySelectorAll('.voice-picker .vp-btn').forEach(function(btn){
    btn.addEventListener('click', function(){
      setAccent(btn.getAttribute('data-accent'));
    });
  });
  setAccent(chosenAccent);

  // Caption bar elements
  var captionBar = document.getElementById('captionBar');
  var captionText = document.getElementById('captionText');
  var captionMeta = document.getElementById('captionMeta');

  function updateCaptionMeta(){
    if (captionMeta) captionMeta.textContent = narrationEnabled
      ? 'native ' + (chosenAccent === 'uk' ? 'UK' : 'US') + ' voice'
      : 'muted';
  }
  updateCaptionMeta();

  var currentUtteranceText = '';
  var narrationEnabled = true;
  var synthPaused = false;

  function speak(text, isResume){
    if (!SUPPORTED || !narrationEnabled || !text) return;
    try { synth.cancel(); } catch(e){}
    currentUtteranceText = text;
    var u = new SpeechSynthesisUtterance(text);
    var v = pickVoice();
    if (v){ u.voice = v; u.lang = v.lang; }
    else { u.lang = (chosenAccent === 'uk') ? 'en-GB' : 'en-US'; }
    u.rate = 1.02;
    u.pitch = 1.0;
    u.volume = 1.0;
    try { synth.speak(u); } catch(e){}
  }

  function stopSpeak(){
    if (!SUPPORTED) return;
    try { synth.cancel(); } catch(e){}
    currentUtteranceText = '';
  }

  function pauseSpeak(){
    if (!SUPPORTED || !synth.speaking) return;
    try { synth.pause(); synthPaused = true; } catch(e){}
  }

  function resumeSpeak(){
    if (!SUPPORTED || !synthPaused) return;
    try { synth.resume(); synthPaused = false; } catch(e){}
  }

  // Narration toggle button
  var narrationBtn = document.getElementById('narrationBtn');
  if (narrationBtn){
    narrationBtn.addEventListener('click', function(){
      setTimeout(function(){
        var muted = narrationBtn.classList.contains('muted');
        narrationEnabled = !muted;
        if (muted){ stopSpeak(); }
        else {
          var playing = (window.playing !== undefined) ? window.playing : false;
          if (playing) triggerNarrationForCurrentScene();
        }
        updateCaptionMeta();
      }, 0);
    });
  }

  // Trigger narration for current scene
  function triggerNarrationForCurrentScene(){
    if (!narrationEnabled) return;
    var label = document.getElementById('sceneLabel');
    if (!label) return;
    var m = label.textContent.match(/^(\d+)\//);
    if (!m) return;
    var idx = parseInt(m[1], 10) - 1;
    if (!window.NARRATION || idx < 0 || idx >= NARRATION.length) return;
    var clip = NARRATION[idx];
    if (!clip || !clip.text) return;
    if (captionText) captionText.textContent = clip.text;
    if (captionBar) captionBar.classList.add('visible');
    speak(clip.text, false);
  }

  // Hook into scene changes via MutationObserver
  var sceneLabelEl = document.getElementById('sceneLabel');
  var lastSeenSceneLabel = '';
  if (sceneLabelEl && 'MutationObserver' in window){
    var mo = new MutationObserver(function(){
      var txt = sceneLabelEl.textContent;
      if (txt === lastSeenSceneLabel) return;
      lastSeenSceneLabel = txt;
      var playing = (window.playing !== undefined) ? window.playing : false;
      if (playing && narrationEnabled) triggerNarrationForCurrentScene();
    });
    mo.observe(sceneLabelEl, {childList:true, characterData:true, subtree:true});
  }

  // Hook into playback controls
  function hookClick(id, fn){
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', fn);
  }
  hookClick('playPauseBtn', function(){
    setTimeout(function(){
      var playing = (window.playing !== undefined) ? window.playing : false;
      if (playing && narrationEnabled) triggerNarrationForCurrentScene();
      else if (!playing) pauseSpeak();
    }, 0);
  });
  hookClick('playOverlay', function(){
    setTimeout(function(){ if (narrationEnabled) triggerNarrationForCurrentScene(); }, 50);
  });
  hookClick('restartBtn', function(){
    setTimeout(function(){ if (narrationEnabled) triggerNarrationForCurrentScene(); }, 50);
  });
  hookClick('replayBtn', function(){
    setTimeout(function(){ if (narrationEnabled) triggerNarrationForCurrentScene(); }, 50);
  });
  hookClick('prevBtn', function(){
    setTimeout(function(){ if (narrationEnabled) triggerNarrationForCurrentScene(); }, 50);
  });
  hookClick('nextBtn', function(){
    setTimeout(function(){ if (narrationEnabled) triggerNarrationForCurrentScene(); }, 50);
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', function(e){
    if (e.key === ' ' || e.key === 'r' || e.key === 'R' ||
        e.key === 'ArrowRight' || e.key === 'ArrowLeft'){
      setTimeout(function(){
        var playing = (window.playing !== undefined) ? window.playing : false;
        if (playing && narrationEnabled) triggerNarrationForCurrentScene();
        else if (!playing) pauseSpeak();
      }, 80);
    }
  });

  // Expose for debugging
  window.SCIMSPT_NATIVE_VOICE = {
    supported: SUPPORTED,
    accent: function(){ return chosenAccent; },
    setAccent: setAccent,
    speak: speak,
    stop: stopSpeak,
    pickVoice: pickVoice,
  };
})();
</script>
"""


def extract_scene_content(html_content: str) -> list:
    """Extract narration text from each scene in the HTML."""
    scenes = []
    
    # Find all scene sections
    scene_pattern = r'<section class="scene[^"]*"[^>]*data-scene="([^"]*)"[^>]*>(.*?)</section>'
    matches = re.findall(scene_pattern, html_content, re.DOTALL | re.IGNORECASE)
    
    for scene_id, scene_html in matches:
        # Extract title/h2
        title_match = re.search(r'<h2[^>]*class="[^"]*scene-h2[^"]*"[^>]*>(.*?)</h2>', scene_html, re.DOTALL | re.IGNORECASE)
        title = title_match.group(1).strip() if title_match else ""
        
        # Clean HTML tags
        title = re.sub(r'<[^>]+>', '', title).strip()
        
        # Extract thesis/text content
        thesis_match = re.search(r'<p class="[^"]*thesis[^"]*"[^>]*>(.*?)</p>', scene_html, re.DOTALL | re.IGNORECASE)
        thesis = thesis_match.group(1).strip() if thesis_match else ""
        
        # Clean HTML tags and decode entities
        thesis = re.sub(r'<[^>]+>', '', thesis).strip()
        thesis = thesis.replace('&gt;', '>').replace('&lt;', '<').replace('&amp;', '&')
        
        # Build narration text
        if title and thesis:
            narration = f"{title}. {thesis}"
        elif title:
            narration = title
        elif thesis:
            narration = thesis
        else:
            narration = f"Scene {scene_id}"
        
        scenes.append({
            "id": scene_id,
            "text": narration[:500]  # Limit length for TTS
        })
    
    return scenes


def generate_narration_js(scenes: list) -> str:
    """Generate NARRATION JavaScript array."""
    narration_items = []
    for i, scene in enumerate(scenes):
        # Escape quotes and newlines for JS string
        text = scene['text'].replace('\\', '\\\\').replace("'", "\\'").replace('\n', ' ')
        narration_items.append(f'{{idx:{i}, scene:"{scene["id"]}", text:\'{text}\'}}')
    
    return f"// ===== Narration data for TTS =====\n  var NARRATION = [{', '.join(narration_items)}];\n"


def add_voice_picker_to_controls(html_content: str) -> str:
    """Add voice picker and narration toggle to controls section."""
    voice_picker_html = '''<button class="icon-btn narration-toggle" id="narrationBtn" title="Toggle narration (UK/US voice)">
        <span class="voice-icon">🎙️</span>
        <span>VOICE</span>
      </button>
      <div class="voice-picker">
        <button class="vp-btn active" data-accent="uk" title="UK English (en-GB)">UK</button>
        <button class="vp-btn" data-accent="us" title="US English (en-US)">US</button>
      </div>'''
    
    # Insert after play-row div opening or before timeline-wrap
    html_content = re.sub(
        r'(<div class="play-row">)',
        rf'\1\n      {voice_picker_html}',
        html_content
    )
    
    return html_content


def add_caption_bar(html_content: str) -> str:
    """Add caption bar before closing body tag."""
    caption_html = '''<div class="caption-bar" id="captionBar">
    <div class="caption-inner">
      <span class="caption-text" id="captionText"></span>
      <span class="caption-meta" id="captionMeta">native UK voice</span>
    </div>
  </div>'''
    
    # Insert before </body>
    html_content = html_content.replace('</body>', f'{caption_html}\n</body>')
    
    return html_content


def process_portfolio_short(filepath: Path):
    """Process a single portfolio short file to add TTS system."""
    print(f"\n📝 Processing: {filepath.name}")
    
    # Read original file
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Check if already processed
    if '__SCIMSPT_NATIVE_VOICE_BOUND__' in content:
        print(f"   ⏭️  Already has TTS system, skipping...")
        return False
    
    # Extract scenes for narration
    scenes = extract_scene_content(content)
    print(f"   📊 Found {len(scenes)} scenes for narration")
    
    # Generate narration JS
    narration_js = generate_narration_js(scenes)
    
    # Add CSS (before first script tag or in head)
    css_insert_point = content.find('<script>') if '<script>' in content else content.find('</head>')
    if css_insert_point > 0:
        style_tag = f'<style data-scimspt-native-voice-css>{VOICE_CSS}</style>\n'
        content = content[:css_insert_point] + style_tag + content[css_insert_point:]
    
    # Add narration data variable before main script
    main_script_pos = content.find('<script>') 
    if main_script_pos > 0 and 'const SCENES' in content:
        # Insert NARRATION after SCENES definition
        scenes_end = content.find('const TOTAL_DURATION')
        if scenes_end > 0:
            # Find end of line
            line_end = content.find('\n', scenes_end)
            content = content[:line_end+1] + '\n  ' + narration_js + content[line_end+1:]
    
    # Add voice picker to controls
    content = add_voice_picker_to_controls(content)
    
    # Add caption bar
    content = add_caption_bar(content)
    
    # Add main TJS script before </body>
    content = content.replace('</body>', f'{VOICE_JS}\n</body>')
    
    # Write modified file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"   ✅ Added TTS system with {len(scenes)} narration segments")
    return True


def main():
    """Main entry point."""
    print("=" * 60)
    print("🎙️  Adding UK/US TTS System to Portfolio Shorts")
    print("=" * 60)
    
    # Find all portfolio short HTML files
    portfolio_files = sorted(PORTFOLIO_DIR.glob("P*.html"))
    
    if not portfolio_files:
        print("❌ No portfolio short files found!")
        return
    
    print(f"\n📁 Found {len(portfolio_files)} portfolio shorts:")
    for f in portfolio_files:
        print(f"   - {f.name}")
    
    # Process each file
    success_count = 0
    for filepath in portfolio_files:
        try:
            if process_portfolio_short(filepath):
                success_count += 1
        except Exception as e:
            print(f"   ❌ Error processing {filepath.name}: {e}")
    
    print("\n" + "=" * 60)
    print(f"✨ Complete! Processed {success_count}/{len(portfolio_files)} files")
    print("=" * 60)
    print("\n📋 Features added to each file:")
    print("   • UK (en-GB) / US (en-US) voice toggle")
    print("   • Web Speech API real-time narration")
    print("   • Caption bar with narration text")
    print("   • Voice preference saved to localStorage")
    print("   • Non-Google native OS voices preferred")


if __name__ == "__main__":
    main()
