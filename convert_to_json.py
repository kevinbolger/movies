import pandas as pd
import json
import numpy as np

excel_file = "/Users/kevinbolger/local/projects/movies/Top_10_Movies_By_Year_All_Categories.xlsx"
output_file = "/Users/kevinbolger/local/projects/movies/data.json"

def clean_data(df):
    # Replace NaN, NaT, and inf with None/null for JSON compatibility
    return df.replace({np.nan: None})

try:
    xl = pd.ExcelFile(excel_file)
    all_data = []

    for sheet in xl.sheet_names:
        # Read sheet, skipping the first row which is the generic title
        df = pd.read_excel(excel_file, sheet_name=sheet, skiprows=1)
        
        # Drop completely empty rows or columns (if any)
        df = df.dropna(how='all').dropna(axis=1, how='all')
        
        # Clean dataframe for JSON export
        df = clean_data(df)
        
        # Convert to dictionary records
        records = df.to_dict(orient='records')
        
        # Group by year for easier consumption in the frontend (optional, but good for structured UI)
        # But for global search, a flat list with a 'Category' field is actually better.
        for record in records:
            # We want to normalize keys. Some sheets might have different column names.
            # E.g. "Box Office Note", "Critical Recognition", "Awards & Honors", "Cult Status"
            # We will map these specific notes into a generic 'Note' or just keep them as 'Note'
            
            note_field = None
            note_content = None
            possible_notes = ["Box Office Note", "Critical Recognition", "Awards & Honors", "Cult Status"]
            for pn in possible_notes:
                if pn in record:
                    note_field = pn
                    note_content = record[pn]
                    del record[pn]
                    break
            
            record['Category'] = sheet
            if note_field:
                record['NoteType'] = note_field
                record['Note'] = note_content
            
            all_data.append(record)

    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(all_data, f, indent=2, ensure_ascii=False)
        
    print(f"Successfully exported {len(all_data)} records to {output_file}")
    
    # Print sample of the first element to verify structure
    if all_data:
        print("Sample record:", json.dumps(all_data[0], indent=2))
        
except Exception as e:
    import traceback
    traceback.print_exc()
