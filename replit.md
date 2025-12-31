# Tide Data Zarr Viewer

## Overview
A React + Vite application that displays tide forecasts from multiple locations stored in Zstd-compressed Zarr v3 format. Features searchable location selection, efficient chunk-based queries, and a hybrid storage structure optimized for S3 scalability (10,000+ locations).

## Project Structure
```
├── index.html              # Entry HTML file
├── vite.config.js          # Vite configuration
├── src/
│   ├── main.jsx           # React entry point
│   ├── App.jsx            # Main component - search and display tide data
│   └── index.css          # Dark theme styles
└── public/
    ├── csv_data/          # Source CSV files folder
    │   └── *_tide.csv     # Per-location tide data
    ├── convert_all_csv_to_zarr.py  # Hybrid Zarr conversion script
    ├── locations.json     # Manifest with time + location metadata
    └── tides.zarr/        # Zarr v3 directory (Zstd compressed)
        ├── zarr.json      # Root metadata
        ├── time/          # Shared time array (int64 ms)
        └── {shard}/       # Sharded by first letter (a/, b/, etc.)
            └── {location}/
                └── tide_m/  # Tide values (float64)
```

## Hybrid Storage Architecture
Designed for S3 scalability with 10,000+ locations:

1. **Shared Time Array**: Stored once at root, not duplicated per location
2. **Sharded Locations**: Grouped by first letter to reduce S3 list operations
3. **24-Hour Chunks**: ~96 samples per chunk (128-512KB compressed)
4. **Compact Manifest**: `locations.json` with time metadata for index calculation

## How It Works
1. **CSV to Zarr Conversion**: `convert_all_csv_to_zarr.py` reads CSVs from `csv_data/` folder and creates a hybrid Zarr v3 store with shared time array and sharded locations.

2. **Efficient Chunk Queries**: The app calculates array indices from time metadata and uses `zarr.slice()` to fetch only the chunks needed for the 2-week window. A 2-week query touches ~14 chunks.

3. **Display**: Search/select a location to view the next 2 weeks of tide predictions.

## Running the Project
```bash
npm run dev
```

## Regenerating Zarr Data
Add CSV files to `public/csv_data/` then run:
```bash
cd public && python convert_all_csv_to_zarr.py
```

## Technical Notes
- Zarr v3 format with Zstd compression (level 3)
- `zarrita.js` library for browser-side Zarr reading
- Chunk size: 96 samples (~24 hours at 15-min intervals)
- Paths: shared time at `/time`, tide data at `/{shard}/{location}/tide_m`
- Server runs on port 5000

## Recent Changes
- 2025-12-31: Hybrid storage structure with shared time, sharded locations, 24h chunks
- 2025-12-31: CSV files moved to csv_data folder
- 2025-12-31: Added chunk-based queries using time+location slicing
- 2025-12-31: Multi-location support with searchable UI
- 2025-12-30: Initial implementation with zarrita.js and Zstd compression
