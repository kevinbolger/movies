import pandas as pd
import json
import numpy as np
import os

excel_file = "/Users/kevinbolger/local/projects/movies/Top_10_Movies_By_Year_All_Categories.xlsx"
output_file = "/Users/kevinbolger/local/projects/movies/data.js"

def clean_data(df):
    return df.replace({np.nan: None})

try:
    xl = pd.ExcelFile(excel_file)
    all_records_map = {}

    for sheet in xl.sheet_names:
        # The new structure has headers dynamically in row 1, so skiprows=1
        df = pd.read_excel(excel_file, sheet_name=sheet, skiprows=1)
        df = df.dropna(how='all').dropna(axis=1, how='all')
        df = clean_data(df)
        
        records = df.to_dict(orient='records')
        
        for record in records:
            # Re-map columns specifically to a unified format so the frontend isn't messy
            unified_record = {
                "Title": record.get("Title"),
                "Year": record.get("Year"),
                "Rank": record.get("Rank"),
                "Director": record.get("Director"),
                "Genre": record.get("Genre"),
                "Studio": record.get("Studio"),
                "Category": sheet
            }
            
            # Category specific mappings
            if sheet == "Top 10 Box Office":
                unified_record["Budget"] = record.get("Budget")
                unified_record["DomesticGross"] = record.get("Domestic Gross")
                unified_record["WorldwideGross"] = record.get("Worldwide Gross")
                unified_record["OpeningWeekend"] = record.get("Opening Weekend")
            elif sheet == "Top 10 Critically Acclaimed":
                unified_record["RTScore"] = record.get("RT Score")
                unified_record["Metacritic"] = record.get("Metacritic")
                unified_record["KeyRecognition"] = record.get("Key Recognition")
            elif sheet == "Top 10 Award Winning":
                unified_record["OscarWins"] = record.get("Oscar Wins")
                unified_record["OscarNoms"] = record.get("Oscar Noms")
                unified_record["OtherAwards"] = record.get("Other Major Awards")
            elif sheet == "Top 10 Cult Classics":
                unified_record["OriginalBoxOffice"] = record.get("Original Box Office")
                unified_record["CurrentRTScore"] = record.get("Current RT Score")
                unified_record["CultStatusReason"] = record.get("Cult Status Reason")
                
            # Skip invalid processing entries (e.g. empty rows interpreted as NaN Year)
            if not unified_record["Title"] or not unified_record["Year"]:
                continue
                
            try:
                year = int(unified_record["Year"])
            except ValueError:
                continue # Skip if year isn't a number
                
            # Deduplication Logic (keep earliest year representation per movie per category)
            title = unified_record["Title"]
            key = f"{title}_{sheet}"
            
            if key not in all_records_map:
                all_records_map[key] = unified_record
            else:
                existing_year = int(all_records_map[key].get("Year", 9999))
                if year < existing_year:
                    all_records_map[key] = unified_record

    # Flatten and Sort
    final_records = list(all_records_map.values())
    final_records.sort(key=lambda x: (x.get('Category', ''), int(x.get('Year', 9999)), int(x.get('Rank', 9999))))

    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("const ALL_MOVIES = ")
        f.write(json.dumps(final_records, indent=2, ensure_ascii=False))
        f.write(";\n")
        
    print(f"Successfully processed and cleaned {len(final_records)} records into unified data.js")
    
except Exception as e:
    import traceback
    traceback.print_exc()
