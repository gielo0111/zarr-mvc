"""
Script to convert all tide CSV files to a single Zarr v3 directory.
Each location is stored as a separate group within the Zarr store.
Includes metadata for efficient chunk queries.
Run this script from the public directory.
"""
import pandas as pd
import zarr
import zarr.codecs
import numpy as np
from pathlib import Path
import shutil
import json

def convert_all_csv_to_zarr():
    public_dir = Path(__file__).parent
    zarr_path = public_dir / "tides.zarr"
    
    if zarr_path.exists():
        shutil.rmtree(zarr_path)
    
    csv_files = list(public_dir.glob("*_tide.csv"))
    
    if not csv_files:
        print("No CSV files found matching *_tide.csv pattern")
        return
    
    print(f"Found {len(csv_files)} CSV files:")
    for f in csv_files:
        print(f"  - {f.name}")
    
    store = zarr.storage.LocalStore(zarr_path)
    root = zarr.open_group(store, mode='w', zarr_format=3)
    
    locations_meta = {}
    
    compressors = [zarr.codecs.ZstdCodec(level=3)]
    
    for csv_file in csv_files:
        location_name = csv_file.stem.replace("_tide", "")
        
        print(f"\nProcessing {location_name}...")
        
        df = pd.read_csv(csv_file)
        print(f"  Rows: {len(df)}")
        
        location_group = root.create_group(location_name)
        
        timestamps = pd.to_datetime(df['time'])
        unix_timestamps = (timestamps.astype('int64') // 10**6).values
        
        start_time = int(unix_timestamps[0])
        end_time = int(unix_timestamps[-1])
        interval_ms = int(unix_timestamps[1] - unix_timestamps[0])
        
        location_group.create_array(
            'time', 
            data=unix_timestamps,
            compressors=compressors
        )
        
        tide_values = df['tide_m'].values.astype(np.float64)
        location_group.create_array(
            'tide_m', 
            data=tide_values,
            compressors=compressors
        )
        
        locations_meta[location_name] = {
            "start_time": start_time,
            "end_time": end_time,
            "interval_ms": interval_ms,
            "count": len(df)
        }
        
        print(f"  Time range: {df['time'].iloc[0]} to {df['time'].iloc[-1]}")
        print(f"  Interval: {interval_ms / 60000} minutes")
        print(f"  Tide range: {tide_values.min():.2f}m to {tide_values.max():.2f}m")
    
    locations_json = public_dir / "locations.json"
    with open(locations_json, 'w') as f:
        json.dump(locations_meta, f, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Zarr v3 store created at: {zarr_path}")
    print(f"Locations metadata saved to: {locations_json}")
    print(f"Total locations: {len(locations_meta)}")

if __name__ == "__main__":
    convert_all_csv_to_zarr()
