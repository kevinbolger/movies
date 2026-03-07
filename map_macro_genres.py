import json
import os
import subprocess

data_file = "/Users/kevinbolger/local/projects/movies/data.json"

with open(data_file, 'r') as f:
    movies = json.load(f)

# The 5 Macro Genres
macro_genres = ["Action", "Sci-Fi", "Drama", "Horror", "Comedy"]

def get_macro_genre(genre_str):
    if not genre_str: return "Drama" # Default fallback
    g = genre_str.lower()
    
    if any(k in g for k in ['sci-fi', 'fantasy', 'space', 'alien', 'superhero', 'monster']):
        return "Sci-Fi"
    if any(k in g for k in ['action', 'adventure', 'war', 'spy', 'western', 'martial', 'disaster', 'epic']):
        return "Action"
    if any(k in g for k in ['horror', 'thriller', 'vampire', 'zombie', 'slasher', 'giallo', 'terrifying']):
        return "Horror"
    if any(k in g for k in ['comedy', 'musical', 'satire', 'laugh', 'funny', 'parody', 'animation']):
        return "Comedy"
        
    return "Drama" # Catch-all for Drama, Romance, Biography, History, Crime, Mystery, etc.

for m in movies:
    m['MacroGenre'] = get_macro_genre(m.get('Genre', ''))

# Save the mapped JSON back so the frontend can use it
with open(data_file, 'w', encoding='utf-8') as f:
    json.dump(movies, f, indent=2, ensure_ascii=False)

print("Successfully injected MacroGenre into data.json")

# Now let's calculate the unique combinations of MacroGenre and Decade
combinations = set()

for m in movies:
    year = m.get('Year')
    if not year: continue
    
    try:
        decade = (int(year) // 10) * 10
        if decade < 1920: decade = 1920 # cap at 1920s for simplicity
        if decade > 2020: decade = 2020
    except ValueError:
        continue
        
    macro = m.get('MacroGenre')
    combinations.add((macro, decade))

print(f"Need to generate images for {len(combinations)} unique combinations.")
for combo in sorted(list(combinations)):
    print(f"- {combo[0]} in the {combo[1]}s")
