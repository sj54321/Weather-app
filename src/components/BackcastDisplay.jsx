// src/components/BackcastDisplay.jsx
import React, { useEffect, useState } from 'react';
import { getCustomIconFilename } from '../utils/iconMapping'; // keep using your icon mapper

function BackcastDisplay({ city, coord, units }) {
  const [backcastData, setBackcastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!coord || coord.lat == null || coord.lon == null) return;
    fetchBackcastData(coord.lat, coord.lon);
  }, [coord]);

  // map Open-Meteo weathercode -> OpenWeather-like icon code (01d, 02n, etc.)
  const weathercodeToIconCode = (code, hour) => {
    const isDay = hour >= 6 && hour <= 18;
    const suffix = isDay ? 'd' : 'n';
    // mapping based on typical WMO codes -> approximate OpenWeather icons
    if (code === 0) return `01${suffix}`;
    if (code === 1 || code === 2) return `02${suffix}`;
    if (code === 3) return `03${suffix}`;
    if (code === 45 || code === 48) return `50${suffix}`;
    if ([51,53,55,80,81,82].includes(code)) return `09${suffix}`; // drizzle/showers
    if ([61,63,65,66,67,95,96,99].includes(code)) return `10${suffix}`; // rain/thunder
    if ([71,73,75,77,85,86].includes(code)) return `13${suffix}`; // snow
    return `03${suffix}`;
  };

  const convertTemp = (t) => (units.temp === 'C' ? t : (t * 9) / 5 + 32);
  const convertSpeed = (s) => (units.speed === 'm/s' ? s : s * 3.6);

  // find best index for a date: prefer 12:00, else nearest hour to 12:00, else first
  const findIndexForDateNoon = (timeArray, targetDate) => {
    const targetExact = `${targetDate}T12:00`;
    let idx = timeArray.indexOf(targetExact);
    if (idx !== -1) return idx;

    // collect indices matching the date
    const candidates = [];
    for (let i = 0; i < timeArray.length; i++) {
      const [datePart, timePart] = timeArray[i].split('T');
      if (datePart === targetDate) {
        const hour = parseInt(timePart.slice(0, 2), 10);
        candidates.push({ i, hour });
      }
    }
    if (candidates.length === 0) return -1;
    // pick nearest to 12
    let best = candidates[0];
    let bestDiff = Math.abs(best.hour - 12);
    for (const c of candidates) {
      const diff = Math.abs(c.hour - 12);
      if (diff < bestDiff) {
        best = c;
        bestDiff = diff;
      }
    }
    return best.i;
  };

  const fetchBackcastData = async (lat, lon) => {
    setLoading(true);
    setError(null);
    setBackcastData([]);
    try {
      const now = new Date();
      const dates = [];
      for (let i = 1; i <= 5; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        dates.push(d.toISOString().split('T')[0]); // YYYY-MM-DD
      }
      // oldest first -> startDate, endDate
      const startDate = dates[dates.length - 1];
      const endDate = dates[0];

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&hourly=temperature_2m,relativehumidity_2m,weathercode,wind_speed_10m&timezone=auto`;
      const res = await fetch(url);
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Open-Meteo responded ${res.status}: ${txt}`);
      }
      const json = await res.json();
      console.log('OpenMeteo archive response:', json);

      const hourly = json.hourly;
      if (!hourly || !hourly.time || hourly.time.length === 0) {
        setError('No historical hourly data available for this location/date range.');
        setBackcastData([]);
        return;
      }

      const results = [];
      for (const date of dates) {
        const idx = findIndexForDateNoon(hourly.time, date);
        if (idx === -1) {
          // no data for that day; skip gracefully
          continue;
        }
        const timeStr = hourly.time[idx]; // e.g. "2025-10-08T12:00"
        const hour = parseInt(timeStr.split('T')[1].slice(0, 2), 10);

        results.push({
          date,
          time: timeStr,
          temp: hourly.temperature_2m ? hourly.temperature_2m[idx] : null,
          humidity: hourly.relativehumidity_2m ? hourly.relativehumidity_2m[idx] : null,
          wind: hourly.wind_speed_10m ? hourly.wind_speed_10m[idx] : null,
          weatherCode: hourly.weathercode ? hourly.weathercode[idx] : null,
          hour,
        });
      }

      // sort results newest first
      results.sort((a, b) => (a.date < b.date ? 1 : -1));
      setBackcastData(results);
    } catch (err) {
      console.error('Error fetching OpenMeteo archive:', err);
      setError(String(err.message || err));
      setBackcastData([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forecast-display glass-effect">
      <h3 style={{ color: 'var(--primary-color)' }}>Past 5 Days Weather in {city}</h3>
      {loading && <p className="loading">Loading historical data...</p>}
      {error && <p className="error">{error}</p>}
  
      <div className="forecast-list">
        {backcastData.length === 0 && !loading && !error && (
          <p style={{ textAlign: 'center' }}>No historical data to show.</p>
        )}
  
        {backcastData.map((dayObj) => {
          const iconCode = weathercodeToIconCode(dayObj.weatherCode ?? -1, dayObj.hour ?? 12);
          const iconFile = getCustomIconFilename(iconCode);
  
          const formattedDate = new Date(dayObj.date).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
          });
  
          return (
            <div key={dayObj.date} className="forecast-item" style={{ backgroundColor: 'var(--card-bg)' }}>
              <div className="forecast-date" style={{ color: 'var(--text-color)' }}>{formattedDate}</div>
  
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50px' }}>
                <img
                  src={`/icons/${iconFile}`}
                  alt={`weather ${dayObj.weatherCode}`}
                  style={{ display: 'block', width: '50px', height: '50px' }}
                />
              </div>
  
              <div className="forecast-temp" style={{ color: 'var(--primary-color)' }}>
                {dayObj.temp != null ? Math.round(convertTemp(dayObj.temp)) : 'N/A'}°{units.temp}
              </div>
  
              <div className="forecast-description" style={{ color: 'var(--text-color)' }}>
                {dayObj.humidity != null ? `Humidity: ${Math.round(dayObj.humidity)}%` : '—'}
              </div>
  
              <div className="forecast-wind" style={{ color: 'var(--text-color)' }}>
                Wind: {dayObj.wind != null ? Math.round(convertSpeed(dayObj.wind)) : '—'} {units.speed}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
  

}

export default BackcastDisplay;
