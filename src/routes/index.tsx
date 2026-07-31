import React, { useState, useEffect } from 'react';

export default function RadarComponent() {
  const [radarUrl, setRadarUrl] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');
  const [errorCount, setErrorCount] = useState<number>(0);

  useEffect(() => {
    const updateRadarImage = () => {
      const now = new Date();
      
      // ČHMÚ funguje v UTC čase
      // Odečítáme minuty podle počtu chyb (pokud aktuální čas nejede, zkusíme o 15 minut starší)
      const minutesToSubtract = 15 + (errorCount * 15);
      const radarTime = new Date(now.getTime() - minutesToSubtract * 60 * 1000);
      
      const utcYear = radarTime.getUTCFullYear();
      const utcMonth = String(radarTime.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(radarTime.getUTCDate()).padStart(2, '0');
      const utcHours = String(radarTime.getUTCHours()).padStart(2, '0');
      
      // Nový formát ČHMÚ používá intervaly po 15 minutách (00, 15, 30, 45)
      const currentMinutes = radarTime.getUTCMinutes();
      const radarMinutes = Math.floor(currentMinutes / 15) * 15;
      const strMinutes = String(radarMinutes).padStart(2, '0');
      
      // Sestavení nového timestampu: YYYYMMDD.HHmm
      const timeStamp = `${utcYear}${utcMonth}${utcDay}.${utcHours}${strMinutes}`;
      
      // NOVÁ A FUNKČNÍ STRUKTURA URL ADRESY ČHMÚ RADARU
      const url = `https://chmi.cz{timeStamp}.0.png`;
      
      setRadarUrl(url);
      setFormattedTime(`${utcHours}:${strMinutes} UTC`);
    };

    updateRadarImage();
    const interval = setInterval(updateRadarImage, 60000); // Kontrola každou minutu

    return () => clearInterval(interval);
  }, [errorCount]);

  const handleImageError = () => {
    // Pokud obrázek neexistuje, zvýšíme errorCount, což posune čas o dalších 15 minut zpět
    if (errorCount < 4) {
      setErrorCount(prev => prev + 1);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#131313', padding: '20px', borderRadius: '16px', color: '#fff', fontFamily: 'sans-serif' }}>
      <h2 style={{ margin: '0 0 5px 0', fontSize: '22px', fontWeight: 'bold', color: '#00d2ff' }}>Živý radar Bouřkář CZ</h2>
      <p style={{ margin: '0 0 20px 0', color: '#888', fontSize: '14px' }}>Čas snímku: {formattedTime} (Aktualizováno)</p>
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '650px', border: '1px solid #222', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
        {radarUrl ? (
          <img 
            src={radarUrl} 
            alt="Srážkový radar" 
            style={{ width: '100%', height: 'auto', display: 'block', filter: 'contrast(1.1)' }}
            onError={handleImageError}
          />
        ) : (
          <p style={{ padding: '60px', textAlign: 'center', color: '#666' }}>Načítám srážková data...</p>
        )}
      </div>
      <p style={{ fontSize: '11px', color: '#444', marginTop: '15px' }}>Data poskytuje © Český hydrometeorologický ústav</p>
    </div>
  );
}

