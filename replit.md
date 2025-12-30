# Tide Data Zarr Viewer - Proof of Concept

## Overview
A React + Vite proof of concept that demonstrates reading and displaying tide data from Zstd-compressed Zarr format in a web browser.

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

2. **Data Loading**: The React app fetches the compressed chunk files from `/tide_data.zarr/*/c/0` and decompresses them using the `fzstd` library.

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
- Zarr chunks are stored with Zstd compression
- The `fzstd` npm package is used for browser-side decompression
- Time strings are encoded as fixed-length UTF-32 (little endian)
- Tide values are encoded as float64
- Server runs on port 5000

## Recent Changes
- 2025-12-30: Added Zstd compression support with browser-side decompression
- 2025-12-30: Initial implementation with CSV, Python conversion script, and React viewer
