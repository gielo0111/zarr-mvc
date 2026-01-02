"""
Hybrid Zarr v3 converter for tide data.
- Reads all CSVs from csv_data folder
- Looks up location IDs from tides-combined.json
- Creates shared time array at root
- Shards locations by first letter for S3 scalability
- Uses 24-hour chunks (~96 samples at 15-min intervals)
- Stores only tide_m per location (references shared time)

Run from public directory: python convert_all_csv_to_zarr.py
"""
import pandas as pd
import zarr
import zarr.codecs
import numpy as np
from pathlib import Path
import shutil
import json

CHUNK_SIZE = 96  # ~24 hours at 15-min intervals (good for S3: 128-512KB compressed)

def get_shard_prefix(location_name):
    """Get first letter as shard prefix (lowercase)"""
    return location_name[0].lower() if location_name else 'x'

def build_location_lookup(tides_combined_path):
    """Build a lookup from CSV name prefix to full location ID"""
    lookup = {}
    location_info = {}
    
    if not tides_combined_path.exists():
        print(f"Warning: {tides_combined_path} not found. Using CSV names as-is.")
        return lookup, location_info
    
    with open(tides_combined_path) as f:
        data = json.load(f)
    
    for region, locations in data.get("data", {}).items():
        for loc in locations:
            loc_id = loc.get("id", "")
            loc_name = loc.get("name", "")
            
            # Extract the prefix (part before coordinates) from ID
            # e.g., "Ahu_Ahu_173.9_-39.1" -> match against "Ahu_Ahu"
            parts = loc_id.rsplit("_", 2)
            if len(parts) >= 3:
                prefix = parts[0]
            else:
                prefix = loc_id
            
            lookup[prefix] = loc_id
            location_info[loc_id] = {
                "name": loc_name,
                "region": region,
                "latitude": loc.get("latitude"),
                "longitude": loc.get("longitude")
            }
    
    return lookup, location_info

def convert_all_csv_to_zarr():
    public_dir = Path(__file__).parent
    csv_dir = public_dir / "csv_data"
    zarr_path = public_dir / "tides.zarr"
    tides_combined_path = public_dir / "tides-combined.json"
    
    if zarr_path.exists():
        shutil.rmtree(zarr_path)
    
    csv_files = list(csv_dir.glob("*_tide_ts.csv"))
    
    if not csv_files:
        print(f"No CSV files found in {csv_dir}")
        return
    
    # Build location lookup from tides-combined.json
    location_lookup, location_info = build_location_lookup(tides_combined_path)
    print(f"Loaded {len(location_lookup)} location mappings from tides-combined.json")
    
    print(f"\nFound {len(csv_files)} CSV files in {csv_dir}:")
    for f in csv_files:
        print(f"  - {f.name}")
    
    store = zarr.storage.LocalStore(zarr_path)
    root = zarr.open_group(store, mode='w', zarr_format=3)
    
    compressors = [zarr.codecs.ZstdCodec(level=3)]
    
    # First pass: determine shared time array from first file
    first_df = pd.read_csv(csv_files[0])
    timestamps = pd.to_datetime(first_df['time'])
    shared_time = (timestamps.astype('int64') // 10**6).values
    
    start_time = int(shared_time[0])
    end_time = int(shared_time[-1])
    interval_ms = int(shared_time[1] - shared_time[0])
    time_count = len(shared_time)
    
    print(f"\nShared time axis:")
    print(f"  Range: {first_df['time'].iloc[0]} to {first_df['time'].iloc[-1]}")
    print(f"  Interval: {interval_ms / 60000} minutes")
    print(f"  Count: {time_count}")
    print(f"  Chunk size: {CHUNK_SIZE} (~{CHUNK_SIZE * interval_ms / 3600000:.1f} hours)")
    
    # Create shared time array at root
    root.create_array(
        'time',
        data=shared_time,
        chunks=(CHUNK_SIZE,),
        compressors=compressors
    )
    
    # Track locations and shards
    locations_meta = {}
    shards = set()
    
    # Second pass: process all locations
    for csv_file in csv_files:
        csv_name = csv_file.stem.replace("_tide_ts", "")
        
        # Look up the full location ID from tides-combined.json
        location_id = location_lookup.get(csv_name, csv_name)
        shard = get_shard_prefix(location_id)
        shards.add(shard)
        
        print(f"\nProcessing {csv_name} -> {location_id} (shard: {shard}/)...")
        
        df = pd.read_csv(csv_file)
        
        # Verify time alignment with shared time
        loc_timestamps = pd.to_datetime(df['time'])
        loc_time = (loc_timestamps.astype('int64') // 10**6).values
        
        if len(loc_time) != time_count:
            print(f"  ERROR: Time count mismatch ({len(loc_time)} vs {time_count}). Skipping.")
            continue
        
        if not np.array_equal(loc_time, shared_time):
            print(f"  ERROR: Timestamps don't match shared time axis. Skipping.")
            continue
        
        # Create shard group if needed
        if shard not in [g for g in root.group_keys()]:
            root.create_group(shard)
        
        shard_group = root[shard]
        
        # Create location group under shard using the full ID
        location_group = shard_group.create_group(location_id)
        
        # Store only tide_m (time is shared at root)
        tide_values = df['tide_m'].values.astype(np.float64)
        location_group.create_array(
            'tide_m',
            data=tide_values,
            chunks=(CHUNK_SIZE,),
            compressors=compressors
        )
        
        # Include location info in manifest if available
        loc_meta = {
            "shard": shard,
            "count": len(df),
            "tide_min": float(tide_values.min()),
            "tide_max": float(tide_values.max())
        }
        if location_id in location_info:
            loc_meta.update(location_info[location_id])
        
        locations_meta[location_id] = loc_meta
        
        print(f"  Rows: {len(df)}")
        print(f"  Tide range: {tide_values.min():.2f}m to {tide_values.max():.2f}m")
    
    # Create locations manifest with shared time metadata
    manifest = {
        "time": {
            "start_time": start_time,
            "end_time": end_time,
            "interval_ms": interval_ms,
            "count": time_count
        },
        "locations": locations_meta
    }
    
    locations_json = public_dir / "locations.json"
    with open(locations_json, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n{'='*50}")
    print(f"Zarr v3 store created at: {zarr_path}")
    print(f"Structure:")
    print(f"  - Shared time array at root ({time_count} values)")
    print(f"  - {len(shards)} shard(s): {sorted(shards)}")
    print(f"  - {len(locations_meta)} location(s)")
    print(f"Locations manifest saved to: {locations_json}")

if __name__ == "__main__":
    convert_all_csv_to_zarr()
