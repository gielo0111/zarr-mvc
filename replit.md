# Tide Data Zarr Viewer - Proof of Concept

## Overview
A React + Vite proof of concept that demonstrates reading and displaying tide data from Zstd-compressed Zarr format in a web browser using zarrita.js.

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
    └── tide_data.zarr/    # Zarr directory (Zstd compressed)
        ├── zarr.json      # Root metadata
        ├── time/          # Time array
        │   ├── zarr.json
        │   └── c/0        # Chunk data (Zstd compressed)
        └── tide_m/        # Tide measurement array
            ├── zarr.json
            └── c/0        # Chunk data (Zstd compressed)
```

## How It Works
1. **CSV to Zarr Conversion**: The Python script `convert_csv_to_zarr.py` reads `tide_data.csv` and creates a Zarr v3 store with Zstd-compressed chunks.

2. **Data Loading**: The React app uses `zarrita.js` to load the Zarr data. The `numcodecs` package handles Zstd decompression automatically.

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
- Zarr v3 format with Zstd compression
- `zarrita.js` library for reading Zarr data in browser
- `numcodecs` package provides WASM-based Zstd decompression
- Must use `zarr.open.v3()` for Zarr v3 data (not auto-detect)
- Time strings are encoded as fixed-length UTF-32 (little endian)
- Tide values are encoded as float64
- Server runs on port 5000

## Recent Changes
- 2025-12-30: Migrated to zarrita.js with numcodecs for Zstd decompression
- 2025-12-30: Added Zstd compression support with browser-side decompression
- 2025-12-30: Initial implementation with CSV, Python conversion script, and React viewer
