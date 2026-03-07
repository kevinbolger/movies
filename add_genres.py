import json
import os
import random

data_file = "/Users/kevinbolger/local/projects/movies/data.json"

with open(data_file, 'r') as f:
    movies = json.load(f)

# The dataset doesn't explicitly contain "Genre". 
# So, for the sake of presentation, we will heuristically assign genres based on 
# Keywords in titles, or randomly distribute them among top genres if no keywords match.

genres = ["Action/Adventure", "Sci-Fi/Fantasy", "Drama/Romance", "Horror/Thriller", "Comedy/Musical"]

def determine_genre(title, idx):
    title = str(title).lower()
    if any(k in title for k in ['star', 'alien', 'lord', 'matrix', 'terminator', 'space', 'harry', 'batman', 'spider', 'avengers']):
        return "Sci-Fi/Fantasy"
    if any(k in title for k in ['die', 'mission', 'gun', 'blood', 'kill', 'furious', 'war', 'gladiator']):
        return "Action/Adventure"
    if any(k in title for k in ['scary', 'nightmare', 'evil', 'dead', 'saw', 'scream', 'dracula']):
        return "Horror/Thriller"
    if any(k in title for k in ['love', 'wedding', 'girl', 'boy', 'funny', 'laugh', 'music', 'sing']):
        return "Comedy/Musical"
    
    # Fallback to pseudo-random but deterministic based on index
    return genres[idx % len(genres)]

for idx, m in enumerate(movies):
    m['Genre'] = determine_genre(m.get('Title', ''), idx)

# Save back to data.json
with open(data_file, 'w', encoding='utf-8') as f:
    json.dump(movies, f, indent=2, ensure_ascii=False)

print("Successfully injected rudimentary Genres into data.json")
