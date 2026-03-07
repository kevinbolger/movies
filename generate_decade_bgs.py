import os
import json
import subprocess
import time

data_file = "/Users/kevinbolger/local/projects/movies/data.json"
out_dir = "/Users/kevinbolger/local/projects/movies/assets"

if not os.path.exists(out_dir):
    os.makedirs(out_dir)

with open(data_file, 'r') as f:
    movies = json.load(f)

combinations = set()

for m in movies:
    year = m.get('Year')
    if not year: continue
    
    try:
        decade = (int(year) // 10) * 10
        if decade < 1920: decade = 1920 
        if decade > 2020: decade = 2020
    except ValueError:
        continue
        
    macro = m.get('MacroGenre')
    if macro:
        combinations.add((macro, decade))

# Prompt map defining the artistic style of each genre
style_map = {
    "Action": "explosions, high speed motion blur, dynamic camera angles, cinematic lighting",
    "Sci-Fi": "neon glowing lights, spaceships, futuristic cityscapes, alien planets, cinematic lighting",
    "Drama": "soft rain on window, blurred city lights bokeh, moody romantic atmosphere, cinematic lighting",
    "Horror": "creepy fog, haunted woods silhouette, dark desaturated colors, eerie atmosphere, cinematic lighting",
    "Comedy": "bright stage lights, colorful confetti falling, vibrant and energetic atmosphere, cinematic lighting"
}

# Prompt map defining the visual aesthetic of the decade
decade_map = {
    1920: "1920s vintage silent film aesthetic, sepia tones, film grain, art deco elements",
    1930: "1930s golden age of hollywood, high contrast black and white, dramatic lighting",
    1940: "1940s film noir style, deep shadows, cinematic smoking, wartime aesthetic",
    1950: "1950s technicolor, vibrant pastel colors, mid-century modern aesthetic, classic hollywood",
    1960: "1960s psychedelic colors, retro-futurism, mod style, bold and saturated",
    1970: "1970s gritty realism, faded colors, cinematic lens flares, disco era vibes",
    1980: "1980s neon synthwave aesthetic, vhs tape artifacts, bright vibrant colors",
    1990: "1990s grunge and cyberpunk aesthetic, cool blue and green tones, early digital look",
    2000: "2000s glossy high-definition aesthetic, fast cuts style, post-matrix green tint",
    2010: "2010s modern blockbuster teal and orange color grading, highly polished, epic scale",
    2020: "2020s ultra-realistic 8k volumetric lighting, hyper-detailed, state of the art cinematic VFX"
}

print(f"Starting generation for {len(combinations)} images...")

count = 0
for macro, decade in sorted(list(combinations)):
    filename = f"bg_{macro.lower()}_{decade}.png"
    filepath = os.path.join(out_dir, filename)
    
    if os.path.exists(filepath):
        print(f"Skipping {filename}, already exists.")
        continue
        
    style_prompt = style_map.get(macro, style_map["Drama"])
    decade_prompt = decade_map.get(decade, decade_map[2020])
    
    full_prompt = f"Abstract background for a movie poster. Genre: {macro}. Decade: {decade}s. Visuals: {style_prompt}. Era aesthetic: {decade_prompt}. No text. Beautiful abstract composition."
    
    print(f"[{count+1}/{len(combinations)}] Generating {filename}...")
    
    try:
        # Run nano-banana synchronously
        result = subprocess.run(
            ["nano-banana", "--prompt", full_prompt, "--output", filepath],
            capture_output=True,
            text=True,
            check=True
        )
        print(f"  Success: {filepath}")
    except subprocess.CalledProcessError as e:
        print(f"  Failed: {e.stderr}")
        
    count += 1
    time.sleep(1) # Small delay to not overwhelm the system

print("All generations completed.")
