import { useState, useEffect } from 'react'
import * as fzstd from 'fzstd'

function App() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadZarrData() {
      try {
        setLoading(true)
        
        const [timeMetaRes, tideMetaRes, timeChunkRes, tideChunkRes] = await Promise.all([
          fetch('/tide_data.zarr/time/zarr.json'),
          fetch('/tide_data.zarr/tide_m/zarr.json'),
          fetch('/tide_data.zarr/time/c/0'),
          fetch('/tide_data.zarr/tide_m/c/0')
        ])
        
        if (!timeChunkRes.ok || !tideChunkRes.ok) {
          throw new Error('Failed to fetch Zarr data')
        }
        
        const timeMeta = await timeMetaRes.json()
        const tideMeta = await tideMetaRes.json()
        
        const timeCompressed = new Uint8Array(await timeChunkRes.arrayBuffer())
        const tideCompressed = new Uint8Array(await tideChunkRes.arrayBuffer())
        
        const timeDecompressed = fzstd.decompress(timeCompressed)
        const tideDecompressed = fzstd.decompress(tideCompressed)
        
        const tideView = new DataView(tideDecompressed.buffer, tideDecompressed.byteOffset, tideDecompressed.byteLength)
        const numTideValues = tideMeta.shape[0]
        const tideValues = []
        for (let i = 0; i < numTideValues; i++) {
          tideValues.push(tideView.getFloat64(i * 8, true))
        }
        
        const dtype = timeMeta.data_type
        let charLength = 19
        if (dtype?.configuration?.length_bytes) {
          charLength = dtype.configuration.length_bytes / 4
        }
        
        const timeStrings = []
        const view = new DataView(timeDecompressed.buffer, timeDecompressed.byteOffset, timeDecompressed.byteLength)
        const numStrings = timeMeta.shape[0]
        
        for (let i = 0; i < numStrings; i++) {
          let str = ''
          for (let j = 0; j < charLength; j++) {
            const offset = (i * charLength + j) * 4
            if (offset + 4 <= timeDecompressed.length) {
              const codePoint = view.getUint32(offset, true)
              if (codePoint !== 0) {
                str += String.fromCodePoint(codePoint)
              }
            }
          }
          timeStrings.push(str.trim())
        }
        
        const combinedData = timeStrings.map((time, index) => ({
          time: time,
          tide_m: tideValues[index]
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
        Data loaded from <strong>Zstd-compressed</strong> Zarr format. Check the <code>/public</code> folder for:
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
