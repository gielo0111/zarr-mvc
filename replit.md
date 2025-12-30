# Tide Data Zarr Viewer

## Overview

This is a React-based web application for viewing tide data stored in Zarr format. The application reads scientific array data (time series of tide measurements) from a Zarr store and displays it in a browser interface. It serves as a demonstration of using the Zarrita JavaScript library to work with Zarr v3 format data in a web context.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 19 with Vite 7 as the build tool and dev server
- **Purpose**: Single-page application that fetches and displays Zarr-formatted tide data
- **Entry Point**: `src/main.jsx` bootstraps the React app into `index.html`
- **Styling**: Plain CSS in `src/index.css` with a clean, minimal design

### Data Layer
- **Format**: Zarr v3 format for storing multidimensional array data
- **Library**: Zarrita (JavaScript Zarr implementation) for reading Zarr stores in the browser
- **Data Structure**: 
  - `time` array: Fixed-length UTF-32 encoded datetime strings
  - `tide_m` array: Float64 tide measurements in meters
- **Storage**: Static Zarr store served from the `public/` directory

### Data Pipeline
- **Source**: CSV file (`tide_data.csv`) containing time and tide measurements
- **Conversion**: Python script (`convert_csv_to_zarr.py`) transforms CSV to Zarr format using pandas and the zarr Python library
- **Serving**: Vite serves the Zarr directory as static files, allowing the browser to fetch chunks via HTTP

### Build Configuration
- Vite configured to run on host `0.0.0.0` port `5000` for Replit compatibility
- React plugin enabled for JSX transformation and fast refresh

## External Dependencies

### JavaScript Dependencies
| Package | Purpose |
|---------|---------|
| `react` / `react-dom` | UI framework |
| `vite` | Development server and build tool |
| `@vitejs/plugin-react` | React integration for Vite |
| `zarrita` | JavaScript library for reading Zarr v3 format |

### Python Dependencies (for data conversion)
| Package | Purpose |
|---------|---------|
| `pandas` | CSV reading and data manipulation |
| `zarr` | Creating Zarr stores |
| `numpy` | Numerical array operations |

### Data Format
- **Zarr v3**: Chunk-based array storage format using zstd compression
- **Codecs**: Little-endian byte encoding with zstd compression (level 0)