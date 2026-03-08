import pandas as pd
import json
import numpy as np

excel_file = "/Users/kevinbolger/local/projects/movies/Top_10_Movies_By_Year_All_Categories.xlsx"
output_file = "/Users/kevinbolger/local/projects/movies/data.js"
json_output_file = "/Users/kevinbolger/local/projects/movies/data.json"

def clean_data(df):
    return df.replace({np.nan: None})

try:
    xl = pd.ExcelFile(excel_file)
    sheets = xl.sheet_names

    if 'Movies' not in sheets:
        raise ValueError("Core 'Movies' dimension sheet not found!")

    # Load core dimension (skiprows=1 gets the true headers)
    dim_movies = pd.read_excel(excel_file, sheet_name='Movies', skiprows=1)
    dim_movies = clean_data(dim_movies.dropna(how='all'))
    
    # Create lookup dict by MovieID
    movie_lookup = {}
    for record in dim_movies.to_dict(orient='records'):
        mid = record.get('MovieID')
        if mid:
            movie_lookup[mid] = record
            
    unified_records = []
    
    # Iterate through all other sheets in the workbook
    for sheet_name in sheets:
        if sheet_name == 'Movies':
            continue
            
        print(f"Processing sheet: {sheet_name}")
        df = pd.read_excel(excel_file, sheet_name=sheet_name, skiprows=1)
        df = clean_data(df.dropna(how='all'))
        
        records = df.to_dict(orient='records')
        
        for fact_row in records:
            mid = fact_row.get('MovieID')
            if not mid:
                continue
                
            dim_row = movie_lookup.get(mid, {})
            
            # Combine core properties
            title = fact_row.get('Title') or dim_row.get('Title')
            if not title:
                continue
                
            unified_record = {
                "Title": title,
                "Year": dim_row.get("Release Year"),
                "RankYear": fact_row.get("Year") or fact_row.get("Ceremony Year"),
                "Rank": fact_row.get("Rank"),
                "Director": fact_row.get("Director") or dim_row.get("Director"),
                "Description": dim_row.get("Description"),
                "Genre": dim_row.get("Genre"),
                "Studio": dim_row.get("Studio"),
                "Category": sheet_name, 
                "Color": dim_row.get("Color"), # Doesn't exist yet but safe
                "Metrics": []
            }
            
            # Identify standard columns to ignore from Metrics
            standard_cols = {'Year', 'Ceremony Year', 'Rank', 'MovieID', 'Title', 'Director', 'Release Year', 'Genre', 'Studio', 'Description', 'Color'}
            
            # Everything else is a dynamically named Metric
            for col, val in fact_row.items():
                if col not in standard_cols and not str(col).startswith('Unnamed:'):
                    if val is not None:
                        unified_record["Metrics"].append({
                            "Label": col,
                            "Value": val
                        })
            
            unified_records.append(unified_record)

    # Write Javascript payload
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("const ALL_MOVIES = ")
        json.dump(unified_records, f, indent=4)
        f.write(";\n")
        f.write("if (typeof module !== 'undefined' && module.exports) { module.exports = ALL_MOVIES; }")

    # Write generic JSON payload
    with open(json_output_file, 'w', encoding='utf-8') as f:
        json.dump(unified_records, f, indent=4)

    print(f"Successfully processed {len(unified_records)} records from exploded sheets into unified data.js")

except Exception as e:
    print(f"Error processing data: {e}")
