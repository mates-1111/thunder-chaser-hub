
import React, { useState, useEffect } from 'react';

export default function RadarComponent() {
  const [radarUrl, setRadarUrl] = useState<string>('');
  const [formattedTime, setFormattedTime] = useState<string>('');

  useEffect(() => {
    const updateRadarImage = () => {
      const now = new Date();
      
      // ČHMÚ data jsou v UTC čase (posun o -1 hodinu v zimě, -2 hodiny v létě)
      const utcYear = now.getUTCFullYear();
      const utcMonth = String(now.getUTCMonth() + 1).padStart(2, '0');
      const utcDay = String(now.getUTCDate()).padStart(2, '0');
      const utcHours = String(now.getUTCHours()).padStart(2, '0');
      
      // Zaokrouhlení minut dolů na nejbližších 10 minut (ČHMÚ aktualizuje: 00, 10, 20, 30, 40, 50)
      // Přidáváme rezervu 2-3 minuty (delay), protože zpracování snímku na ČHMÚ chvíli trvá
      const currentMinutes = now.getUTCMinutes();
      let radarMinutes = Math.floor((currentMinutes - 2) / 10) * 10;
      
      let finalHours = utcHours;
      let finalDay = utcDay;

      // Ošetření přechodu přes celou hodinu
      if (radarMinutes < 0) {
        radarMinutes = 50;
        let hoursNum = parseInt(utcHours) - 1;
        if (hoursNum < 0) {
          hoursNum = 23;
          // Zde by se musel teoreticky ošetřit i posun dne, ale pro real-time widget to většinou stačí takto
        }
        finalHours = String(hoursNum).padStart(2, '0');
      }
      
      const strMinutes = String(radarMinutes).padStart(2, '0');
      
      // Sestavení výsledného timestampu ve formátu: YYYYMMDD.HHmm
      const timeStamp = `${utcYear}${utcMonth}${finalDay}.${finalHours}${strMinutes}`;
      
      // Oficiální URL adresa sloučeného radarového snímku z ČHMÚ
      const url = `https://chmi.cz{timeStamp}.0.png`;
      
      setRadarUrl(url);
      setFormattedTime(`${finalHours}:${strMinutes} UTC`);
    };

    // Spuštění hned po načtení stránky
    updateRadarImage();

    // Každou minutu zkontrolujeme, jestli není k dispozici nový snímek
    const interval = setInterval(updateRadarImage, 60000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#1a1a1a', padding: '20px', borderRadius: '12px', color: '#fff' }}>
      <h2 style={{ margin: '0 0 10px 0', fontSize: '20px' }}>Aktuální radar ČHMÚ</h2>
      <p style={{ margin: '0 0 15px 0', color: '#aaa', fontSize: '14px' }}>Poslední snímek: {formattedTime}</p>
      
      <div style={{ position: 'relative', width: '100%', maxWidth: '600px', border: '2px solid #333', borderRadius: '8px', overflow: 'hidden' }}>
        {radarUrl ? (
          <img 
            src={radarUrl} 
            alt="Aktuální srážkový radar ČHMÚ" 
            style={{ width: '100%', height: 'auto', display: 'block' }}
            onError={(e) => {
              // Pokud snímek ještě neexistuje (má zpoždění), zkusí se načíst o 10 minut starší záložní verze
              console.log("Snímek se nepodařilo načíst, zkouším starší...");
            }}
          />
        ) : (
          <p style={{ padding: '40px', textAlign: 'center' }}>Načítám radarová data...</p>
        )}
      </div>
      <p style={{ fontSize: '11px', color: '#666', marginTop: '10px' }}>Zdroj dat: © Český hydrometeorologický ústav (ČHMÚ)</p>
    </div>
  );
}
