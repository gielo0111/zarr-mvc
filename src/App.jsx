import { useState, useEffect } from 'react'
import * as zarr from 'zarrita'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadZarrData() {
      try {
        setLoading(true)
        
        const storeUrl = window.location.origin + '/tide_data.zarr'
        const store = new zarr.FetchStore(storeUrl)
        const root = zarr.root(store)
        
        const timeArray = await zarr.open.v3(root.resolve('time'), { kind: 'array' })
        const tideArray = await zarr.open.v3(root.resolve('tide_m'), { kind: 'array' })
        
        const timeData = await zarr.get(timeArray)
        const tideData = await zarr.get(tideArray)
        
        const combinedData = Array.from(timeData.data).map((time, index) => ({
          time: time,
          tide_m: tideData.data[index]
        }))
        
        setData(combinedData)
        setLoading(false)
      } catch (err) {
        console.error('Error loading Zarr data:', err)
        console.error('Error stack:', err.stack)
        setError(err.message || String(err))
        setLoading(false)
      }
    }

    loadZarrData()
  }, [])

  if (loading) {
    return (
      <div className="container">
        <h1>Tide Data Zarr Viewer</h1>
        <div className="loading">Loading Zarr data...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container">
        <h1>Tide Data Zarr Viewer</h1>
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Tide Data Zarr Viewer</h1>
      
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Tide (m)</th>
          </tr>
        </thead>
        <tbody>
          {data && data.map((row, index) => (
            <tr key={index}>
              <td>{row.time}</td>
              <td>{row.tide_m.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <div className="info">
        Data loaded from <strong>Zstd-compressed</strong> Zarr format using <code>zarrita.js</code>. Check the <code>/public</code> folder for:
        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li><code>tide_data.csv</code> - Original CSV file</li>
          <li><code>convert_csv_to_zarr.py</code> - Python conversion script</li>
          <li><code>tide_data.zarr/</code> - Zarr directory (with Zstd compression)</li>
        </ul>
      </div>
    </div>
  )
}

export default App
