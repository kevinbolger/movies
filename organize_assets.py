import os
import shutil
import glob

assets_dir = "/Users/kevinbolger/local/projects/movies/assets"

for f in glob.glob(f"{assets_dir}/*.png"):
    filename = os.path.basename(f)
    print(f"Processing {filename}...")
    
    # Files are named like action_1920_timestamp.png
    parts = filename.split("_")
    if len(parts) >= 2:
        genre = parts[0]
        # Make sure it's one of ours
        if genre in ["action", "comedy", "drama", "horror", "scifi", "sci-fi"]:
            decade = parts[1]
            # Handle if decade has '.png' (e.g., if there's no timestamp)
            decade = decade.replace(".png", "")
            
            target_dir = os.path.join(assets_dir, genre, decade)
            os.makedirs(target_dir, exist_ok=True)
            
            target_file = os.path.join(target_dir, "bg.png")
            shutil.move(f, target_file)
            print(f"  Moved to {target_file}")
