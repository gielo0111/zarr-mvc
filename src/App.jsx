import { useState, useEffect } from 'react'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadZarrData() {
      try {
        setLoading(true)
        
        const timeResponse = await fetch('/tide_data.zarr/time/c/0')
        const tideResponse = await fetch('/tide_data.zarr/tide_m/c/0')
        
        if (!timeResponse.ok || !tideResponse.ok) {
          throw new Error('Failed to fetch Zarr data')
        }
        
        const timeData = await timeResponse.json()
        const tideData = await tideResponse.json()
        
        const combinedData = timeData.map((time, index) => ({
          time: time,
          tide_m: tideData[index]
        }))
        
        setData(combinedData)
        setLoading(false)
      } catch (err) {
        console.error('Error loading Zarr data:', err)
        setError(err.message)
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
        Data loaded from Zarr format. Check the <code>/public</code> folder for:
        <ul style={{ marginTop: '10px', marginLeft: '20px' }}>
          <li><code>tide_data.csv</code> - Original CSV file</li>
          <li><code>convert_csv_to_zarr.py</code> - Python conversion script</li>
          <li><code>tide_data.zarr/</code> - Zarr directory</li>
        </ul>
      </div>
    </div>
  )
}

export default App
