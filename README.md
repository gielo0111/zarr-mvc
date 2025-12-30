# Tide Data Zarr Viewer

A React + Vite proof of concept that demonstrates reading and displaying tide data from Zstd-compressed Zarr format in a web browser using zarrita.js.

## Features

- Converts CSV tide data to Zarr v3 format with Zstd compression
- Reads compressed Zarr data directly in the browser using zarrita.js
- Displays tide measurements in a styled table

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
        ├── time/          # Time array (int64 Unix timestamps)
        └── tide_m/        # Tide measurement array (float64)
```

## How It Works

1. **CSV to Zarr Conversion**: The Python script `convert_csv_to_zarr.py` reads `tide_data.csv` and creates a Zarr v3 store with Zstd-compressed chunks.

2. **Data Loading**: The React app uses `zarrita.js` to load the Zarr data. The `numcodecs` package handles Zstd decompression automatically.

3. **Display**: The data is rendered in a styled table showing time and tide measurements.

## Getting Started

### Install dependencies

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Regenerate Zarr Data

If you modify the CSV file, run:

```bash
cd public && python convert_csv_to_zarr.py
```

## Technical Notes

- Zarr v3 format with Zstd compression
- `zarrita.js` library for reading Zarr data in browser
- `numcodecs` package provides WASM-based Zstd decompression
- Must use `zarr.open.v3()` for Zarr v3 data
- Time values stored as int64 Unix timestamps (milliseconds)
- Tide values stored as float64

## Dependencies

- React 18
- Vite
- zarrita.js
- numcodecs
- Python: zarr, pandas, numpy (for data conversion)
