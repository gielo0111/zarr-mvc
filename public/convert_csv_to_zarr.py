"""
Script to convert tide_data.csv to Zarr format.
Run this script from the public directory.
"""
import pandas as pd
import zarr
import numpy as np
from pathlib import Path

def convert_csv_to_zarr():
    csv_path = Path(__file__).parent / "tide_data.csv"
    zarr_path = Path(__file__).parent / "tide_data.zarr"
    
    df = pd.read_csv(csv_path)
    
    print(f"Reading CSV from: {csv_path}")
    print(f"Data shape: {df.shape}")
    print(df)
    
    store = zarr.storage.LocalStore(zarr_path)
    root = zarr.open_group(store, mode='w')
    
    time_strings = df['time'].values.astype(str)
    root.create_array('time', data=time_strings)
    
    tide_values = df['tide_m'].values.astype(np.float64)
    root.create_array('tide_m', data=tide_values)
    
    print(f"\nZarr store created at: {zarr_path}")
    print("Arrays created: 'time', 'tide_m'")
    
    root_check = zarr.open_group(store, mode='r')
    print("\nVerification:")
    print(f"  time: {root_check['time'][:]}")
    print(f"  tide_m: {root_check['tide_m'][:]}")

if __name__ == "__main__":
    convert_csv_to_zarr()
