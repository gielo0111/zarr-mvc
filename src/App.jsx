import { useState, useEffect, useMemo } from 'react'
import * as zarr from 'zarrita'

function App() {
  const [manifest, setManifest] = useState(null)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [tideData, setTideData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dataLoading, setDataLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    async function loadManifest() {
      try {
        const response = await fetch('/locations.json')
        const data = await response.json()
        setManifest(data)
        setLoading(false)
      } catch (err) {
        console.error('Error loading manifest:', err)
        setError('Failed to load locations')
        setLoading(false)
      }
    }
    loadManifest()
  }, [])

  const locationNames = useMemo(() => {
    if (!manifest?.locations) return []
    return Object.keys(manifest.locations)
  }, [manifest])

  const filteredLocations = useMemo(() => {
    if (!searchQuery.trim()) return locationNames
    const query = searchQuery.toLowerCase().replace(/_/g, ' ')
    return locationNames.filter(loc => 
      loc.toLowerCase().replace(/_/g, ' ').includes(query)
    )
  }, [locationNames, searchQuery])

  async function loadTideData(location) {
    try {
      setDataLoading(true)
      setSelectedLocation(location)
      setTideData(null)
      
      const locMeta = manifest.locations[location]
      const timeMeta = manifest.time
      if (!locMeta || !timeMeta) {
        throw new Error('Metadata not found')
      }
      
      const now = Date.now()
      const twoWeeksMs = 14 * 24 * 60 * 60 * 1000
      const endTime = now + twoWeeksMs
      
      const startIdx = Math.max(0, Math.floor((now - timeMeta.start_time) / timeMeta.interval_ms))
      const endIdx = Math.min(timeMeta.count, Math.ceil((endTime - timeMeta.start_time) / timeMeta.interval_ms))
      
      if (startIdx >= timeMeta.count || endIdx <= 0) {
        setTideData([])
        setDataLoading(false)
        return
      }
      
      const storeUrl = window.location.origin + '/tides.zarr'
      const store = new zarr.FetchStore(storeUrl)
      const root = zarr.root(store)
      
      // Shared time array at root
      const timeArray = await zarr.open.v3(root.resolve('time'), { kind: 'array' })
      // Tide data under shard/location/tide_m
      const tidePath = `${locMeta.shard}/${location}/tide_m`
      const tideArray = await zarr.open.v3(root.resolve(tidePath), { kind: 'array' })
      
      // Fetch only the chunks needed for 2-week window
      const timeData = await zarr.get(timeArray, [zarr.slice(startIdx, endIdx)])
      const tideValues = await zarr.get(tideArray, [zarr.slice(startIdx, endIdx)])
      
      const filteredData = []
      for (let i = 0; i < timeData.data.length; i++) {
        const timestamp = Number(timeData.data[i])
        if (timestamp >= now && timestamp <= endTime) {
          filteredData.push({
            time: new Date(timestamp).toLocaleString(),
            timestamp: timestamp,
            tide_m: tideValues.data[i]
          })
        }
      }
      
      console.log(`Loaded ${filteredData.length} records (indices ${startIdx}-${endIdx}, path: ${tidePath})`)
      setTideData(filteredData)
      setDataLoading(false)
    } catch (err) {
      console.error('Error loading tide data:', err)
      setError(`Failed to load data for ${location}`)
      setDataLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container">
        <h1>Tide Data Viewer</h1>
        <div className="loading">Loading locations...</div>
      </div>
    )
  }

  if (error && !selectedLocation) {
    return (
      <div className="container">
        <h1>Tide Data Viewer</h1>
        <div className="error">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className="container">
      <h1>Tide Data Viewer</h1>
      
      <div className="search-section">
        <input
          type="text"
          placeholder="Search for a location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        
        {!selectedLocation && filteredLocations.length > 0 && (
          <div className="location-list">
            {filteredLocations.map(loc => (
              <button
                key={loc}
                className="location-button"
                onClick={() => loadTideData(loc)}
              >
                {loc.replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        )}
        
        {searchQuery && filteredLocations.length === 0 && (
          <div className="no-results">No locations found matching "{searchQuery}"</div>
        )}
      </div>
      
      {selectedLocation && (
        <div className="results-section">
          <div className="location-header">
            <h2>{selectedLocation.replace(/_/g, ' ')}</h2>
            <button 
              className="clear-button"
              onClick={() => {
                setSelectedLocation(null)
                setTideData(null)
                setSearchQuery('')
                setError(null)
              }}
            >
              Clear
            </button>
          </div>
          
          <p className="subtitle">Next 2 weeks of tide data</p>
          
          {dataLoading ? (
            <div className="loading">Loading tide data...</div>
          ) : tideData && tideData.length > 0 ? (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Time</th>
                    <th>Tide (m)</th>
                  </tr>
                </thead>
                <tbody>
                  {tideData.map((row, index) => (
                    <tr key={index}>
                      <td>{row.time}</td>
                      <td className={row.tide_m >= 0 ? 'positive' : 'negative'}>
                        {row.tide_m.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="no-results">No tide data available for the next 2 weeks</div>
          )}
        </div>
      )}
      
    </div>
  )
}

export default App
