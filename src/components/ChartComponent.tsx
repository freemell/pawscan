import React, { useEffect, useMemo, useRef, useState } from 'react';
import asciichart from 'asciichart';
import { getHistoricalPriceSeries } from '@lib/solana';

type Props = {
  symbol: string;
};

export default function ChartComponent({ symbol }: Props) {
  const [prices, setPrices] = useState<number[]>([]);
  const [volumes, setVolumes] = useState<number[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      const { priceSeries, volumeSeries } = await getHistoricalPriceSeries(symbol);
      if (!mounted) return;
      setPrices(priceSeries);
      setVolumes(volumeSeries);
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  const ascii = useMemo(() => {
    if (!prices.length) return 'No data';
    const p = asciichart.plot(prices.slice(-60), {
      height: 12,
      format: (x: number) => x.toFixed(4)
    });
    const v = asciichart.plot(volumes.slice(-60).map((n) => n / Math.max(1, Math.max(...volumes))), {
      height: 6
    });
    return `Price (${symbol})\n${p}\nVolume (normalized)\n${v}`;
  }, [prices, volumes, symbol]);

  // Minimal Chart.js-like placeholder (styled terminal-like)
  useEffect(() => {
    if (!canvasRef.current || !prices.length) return;
    const ctx = canvasRef.current.getContext('2d')!;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.strokeStyle = '#00ff7f';
    ctx.lineWidth = 1;
    const w = canvasRef.current.width;
    const h = canvasRef.current.height;
    const data = prices.slice(-120);
    const max = Math.max(...data);
    const min = Math.min(...data);
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = (i / (data.length - 1)) * (w - 2) + 1;
      const y = h - 1 - ((val - min) / Math.max(1e-9, max - min)) * (h - 2);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [prices]);

  return (
    <div className="section">
      <div className="ascii-box">
        {loading ? 'Loading chart...' : <pre>{ascii}</pre>}
      </div>
      <div style={{ display: 'none' }}>
        <canvas ref={canvasRef} width={480} height={120} />
      </div>
    </div>
  );
}


