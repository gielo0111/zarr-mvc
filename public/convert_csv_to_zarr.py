"""
Script to convert tide_data.csv to Zarr format.
Run this script from the public directory.
"""
import pandas as pd
import zarr
import numpy as np
from pathlib import Path
import shutil
import json

def convert_csv_to_zarr():
    csv_path = Path(__file__).parent / "tide_data.csv"
    zarr_path = Path(__file__).parent / "tide_data.zarr"
    
    if zarr_path.exists():
        shutil.rmtree(zarr_path)
    
    df = pd.read_csv(csv_path)
    
    print(f"Reading CSV from: {csv_path}")
    print(f"Data shape: {df.shape}")
    print(df)
    
    zarr_path.mkdir(parents=True, exist_ok=True)
    
    zarr_json = {
        "zarr_format": 3,
        "node_type": "group",
        "attributes": {}
    }
    with open(zarr_path / "zarr.json", "w") as f:
        json.dump(zarr_json, f, indent=2)
    
    time_dir = zarr_path / "time"
    time_dir.mkdir(exist_ok=True)
    (time_dir / "c").mkdir(exist_ok=True)
    
    time_strings = df['time'].values.astype(str).tolist()
    with open(time_dir / "c" / "0", "w") as f:
        json.dump(time_strings, f)
    
    time_meta = {
        "zarr_format": 3,
        "node_type": "array",
        "shape": [len(time_strings)],
        "data_type": "string",
        "chunk_grid": {"name": "regular", "configuration": {"chunk_shape": [len(time_strings)]}},
        "chunk_key_encoding": {"name": "default", "configuration": {"separator": "/"}},
        "codecs": [{"name": "json"}],
        "fill_value": "",
        "attributes": {}
    }
    with open(time_dir / "zarr.json", "w") as f:
        json.dump(time_meta, f, indent=2)
    
    tide_dir = zarr_path / "tide_m"
    tide_dir.mkdir(exist_ok=True)
    (tide_dir / "c").mkdir(exist_ok=True)
    
    tide_values = df['tide_m'].values.astype(np.float64).tolist()
    with open(tide_dir / "c" / "0", "w") as f:
        json.dump(tide_values, f)
    
    tide_meta = {
        "zarr_format": 3,
        "node_type": "array",
        "shape": [len(tide_values)],
        "data_type": "float64",
        "chunk_grid": {"name": "regular", "configuration": {"chunk_shape": [len(tide_values)]}},
        "chunk_key_encoding": {"name": "default", "configuration": {"separator": "/"}},
        "codecs": [{"name": "json"}],
        "fill_value": 0.0,
        "attributes": {}
    }
    with open(tide_dir / "zarr.json", "w") as f:
        json.dump(tide_meta, f, indent=2)
    
    print(f"\nZarr store created at: {zarr_path}")
    print("Arrays created: 'time', 'tide_m'")
    print("\nVerification:")
    print(f"  time: {time_strings}")
    print(f"  tide_m: {tide_values}")

if __name__ == "__main__":
    convert_csv_to_zarr()
