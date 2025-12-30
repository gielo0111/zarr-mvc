# Tide Data Zarr Viewer - Proof of Concept

## Overview
A React + Vite proof of concept that demonstrates reading and displaying tide data from Zarr format in a web browser.

## Project Structure
```
├── index.html              # Entry HTML file
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main component - loads and displays Zarr data
│   └── index.css          # Styles
└── public/
    ├── tide_data.csv      # Original CSV data
    ├── convert_csv_to_zarr.py  # Python conversion script
    └── tide_data.zarr/    # Zarr directory
        ├── zarr.json      # Root metadata
        ├── time/          # Time array
        │   ├── zarr.json
        │   └── c/0        # Chunk data (JSON)
        └── tide_m/        # Tide measurement array
            ├── zarr.json
            └── c/0        # Chunk data (JSON)
```

## How It Works
1. **CSV to Zarr Conversion**: The Python script `convert_csv_to_zarr.py` reads `tide_data.csv` and creates a Zarr v3 store with JSON-encoded chunks for browser compatibility.

2. **Data Loading**: The React app fetches the chunk files directly from `/tide_data.zarr/*/c/0` and parses them as JSON.

3. **Display**: The data is rendered in a styled table showing time and tide measurements.

## Running the Project
```bash
npm run dev
```

## Regenerating Zarr Data
If you modify the CSV file, run:
```bash
cd public && python convert_csv_to_zarr.py
```

## Technical Notes
- Zarr chunks are stored as JSON for browser compatibility (browsers cannot decompress Zstd)
- The zarrita npm package is installed but not used in the final implementation due to URL handling issues
- Server runs on port 5000

## Recent Changes
- 2025-12-30: Initial implementation with CSV, Python conversion script, and React viewer
