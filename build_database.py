import pandas as pd
import json
import numpy as np
import os

excel_file = "/Users/kevinbolger/local/projects/movies/Top_10_Movies_By_Year_All_Categories.xlsx"
output_file = "/Users/kevinbolger/local/projects/movies/data.js"
json_output_file = "/Users/kevinbolger/local/projects/movies/data.json"

def clean_data(df):
    return df.replace({np.nan: None})

try:
    # Read tables (skiprows=1 gets the true headers)
    dim_movies = pd.read_excel(excel_file, sheet_name='dim_Movies', skiprows=1)
    dim_categories = pd.read_excel(excel_file, sheet_name='dim_Categories', skiprows=1)
    fact_rankings = pd.read_excel(excel_file, sheet_name='fact_Rankings', skiprows=1)

    # Clean empty rows
    dim_movies = clean_data(dim_movies.dropna(how='all'))
    dim_categories = clean_data(dim_categories.dropna(how='all'))
    fact_rankings = clean_data(fact_rankings.dropna(how='all'))

    # Join the Fact table to both Dimension tables
    # fact_Rankings -> dim_Movies on MovieID
    merged = fact_rankings.merge(dim_movies, on='MovieID', how='left')
    
    # -> dim_Categories on CategoryID
    merged = merged.merge(dim_categories, on='CategoryID', how='left')

    records = merged.to_dict(orient='records')
    unified_records = []

    for record in records:
        title = record.get("Title")
        # Ensure it has a title
        if not title:
            continue

        unified_record = {
            "Title": title,
            "Year": record.get("Release Year"), # The year the movie released
            "RankYear": record.get("Year"), # The year of the category ranking
            "Rank": record.get("Rank"),
            "Director": record.get("Director"),
            "Description": record.get("Description"),
            "Genre": record.get("Genre"),
            "Studio": record.get("Studio"),
            "Category": record.get("Category"),
            "Color": record.get("Color"),
            "Metrics": []
        }

        # Dynamically append any Metric X that has both a Label and a Value
        for i in range(1, 5):
            label = record.get(f"Metric{i} Label")
            val = record.get(f"Metric{i}")
            if label is not None and val is not None:
                unified_record["Metrics"].append({"Label": label, "Value": val})

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

    print(f"Successfully processed and cleanly joined {len(unified_records)} records from Star Schema into unified data.js")

except Exception as e:
    print(f"Error processing data: {e}")
