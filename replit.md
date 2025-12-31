# Tide Data Zarr Viewer

## Overview
A React + Vite application that displays tide forecasts from multiple locations stored in Zstd-compressed Zarr v3 format. Features searchable location selection and efficient chunk-based data queries.

## Project Structure
```
├── index.html              # Entry HTML file
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main component - search and display tide data
│   └── index.css          # Dark theme styles
└── public/
    ├── *_tide.csv         # Source CSV files (per location)
    ├── convert_all_csv_to_zarr.py  # Multi-location conversion script
    ├── locations.json     # Location metadata (start_time, interval, count)
    └── tides.zarr/        # Zarr v3 directory (Zstd compressed)
        ├── zarr.json      # Root metadata
        └── {location}/    # Per-location group
            ├── time/      # Unix timestamps (int64 ms)
            └── tide_m/    # Tide values (float64)
```

## How It Works
1. **CSV to Zarr Conversion**: `convert_all_csv_to_zarr.py` reads all `*_tide.csv` files and creates a single Zarr v3 store with location-based groups and Zstd compression. Also generates `locations.json` with time metadata.

2. **Efficient Chunk Queries**: The app calculates array indices from time metadata and uses `zarr.slice()` to fetch only the chunks needed for the 2-week forecast window.

3. **Display**: Search/select a location to view the next 2 weeks of tide predictions in a styled table.

## Running the Project
```bash
npm run dev
```

## Regenerating Zarr Data
If you modify or add CSV files, run:
```bash
cd public && python convert_all_csv_to_zarr.py
```

## Technical Notes
- Zarr v3 format with Zstd compression
- `zarrita.js` library for reading Zarr data in browser
- Timestamps stored as int64 Unix milliseconds (not strings)
- Chunk slicing uses location + time to fetch only needed data
- Server runs on port 5000

## Recent Changes
- 2025-12-31: Added chunk-based queries using time+location slicing
- 2025-12-31: Multi-location support with searchable UI
- 2025-12-30: Initial implementation with zarrita.js and Zstd compression
