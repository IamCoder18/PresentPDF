'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPDF } from '@/lib/storage';
import { useSyncState } from '@/hooks/useSyncState';
import dynamic from 'next/dynamic';

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer').then(mod => mod.PDFViewer), {
  ssr: false
});

/**
 * Safely samples a pixel from a canvas using an offscreen 1x1 canvas.
 * This avoids conflicts with the pdf.js rendering context.
 */
function samplePixel(source: HTMLCanvasElement, sx: number, sy: number): [number, number, number] {
  const tmp = document.createElement('canvas');
  tmp.width = 1;
  tmp.height = 1;
  const ctx = tmp.getContext('2d')!;
  ctx.drawImage(source, sx, sy, 1, 1, 0, 0, 1, 1);
  const d = ctx.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

/**
 * Extracts the dominant background color from a rendered PDF canvas
 * by sampling pixels along all 4 edges (slightly inward to avoid
 * anti-aliasing), clustering similar colors, and returning the most
 * frequent one. Uses offscreen canvas to avoid pdf.js context conflicts.
 */
function extractBackgroundColor(canvas: HTMLCanvasElement): string {
  try {
    const w = canvas.width;
    const h = canvas.height;
    console.log(`[BG Extract] Canvas dimensions: ${w}x${h}`);
    if (w === 0 || h === 0) {
      console.warn('[BG Extract] Canvas has zero dimensions');
      return '#000000';
    }

    // Sample 5px inside the edges to avoid anti-aliasing/rendering artifacts
    const MARGIN = Math.min(5, Math.floor(w / 10), Math.floor(h / 10));
    const innerW = w - 2 * MARGIN;
    const innerH = h - 2 * MARGIN;
    console.log(`[BG Extract] MARGIN=${MARGIN}, innerW=${innerW}, innerH=${innerH}`);
    if (innerW <= 0 || innerH <= 0) return '#000000';

    const samples: [number, number, number][] = [];
    const NUM = 8;

    for (let i = 0; i < NUM; i++) {
      const t = i / (NUM - 1);
      const x = MARGIN + Math.floor(t * (innerW - 1));
      const y = MARGIN + Math.floor(t * (innerH - 1));

      samples.push(samplePixel(canvas, x, MARGIN));           // Top edge
      samples.push(samplePixel(canvas, x, h - MARGIN - 1));   // Bottom edge
      samples.push(samplePixel(canvas, MARGIN, y));            // Left edge
      samples.push(samplePixel(canvas, w - MARGIN - 1, y));   // Right edge
    }

    console.log(`[BG Extract] Sampled ${samples.length} pixels. First 4:`, samples.slice(0, 4));

    // Cluster similar colors (Manhattan distance threshold)
    const THRESHOLD = 30;
    const groups: { color: [number, number, number]; count: number }[] = [];

    for (const sample of samples) {
      let matched = false;
      for (const group of groups) {
        const dist =
          Math.abs(sample[0] - group.color[0]) +
          Math.abs(sample[1] - group.color[1]) +
          Math.abs(sample[2] - group.color[2]);
        if (dist < THRESHOLD) {
          group.count++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        groups.push({ color: sample, count: 1 });
      }
    }

    groups.sort((a, b) => b.count - a.count);
    console.log(`[BG Extract] Color groups:`, groups.map(g => `rgb(${g.color.join(',')}) x${g.count}`));
    const [r, g, b] = groups[0].color;
    const result = `rgb(${r}, ${g}, ${b})`;
    console.log(`[BG Extract] Final color: ${result}`);
    return result;
  } catch (e) {
    console.error('[BG Extract] FAILED:', e);
    return '#000000';
  }
}

function PresentContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [bgColor, setBgColor] = useState('#000000');

  const { state, setSyncState } = useSyncState();
  const currentSlide = state.currentSlide;
  const [numPages, setNumPages] = useState(0);

  useEffect(() => {
    if (id) {
      getPDF(id).then((data) => {
        if (data) setFileData(data);
      });
    }
  }, [id]);

  const handleNext = useCallback(() => {
    if (currentSlide < numPages) {
      setSyncState({ currentSlide: currentSlide + 1 });
    }
  }, [currentSlide, numPages, setSyncState]);

  const handlePrev = useCallback(() => {
    if (currentSlide > 1) {
      setSyncState({ currentSlide: currentSlide - 1 });
    }
  }, [currentSlide, setSyncState]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  const handleRenderSuccess = useCallback((canvas: HTMLCanvasElement) => {
    console.log(`[Present] handleRenderSuccess called, canvas=${canvas.width}x${canvas.height}`);
    const color = extractBackgroundColor(canvas);
    console.log(`[Present] Setting bgColor to: ${color}`);
    setBgColor(color);
  }, []);

  // Re-extract background color immediately on slide change
  // (canvases are pre-rendered, so no delay needed)
  useEffect(() => {
    if (!fileData) return;
    const wrapper = document.getElementById(`pdf-page-wrapper-${currentSlide}`);
    const canvas = wrapper?.querySelector('canvas') as HTMLCanvasElement;
    if (canvas && canvas.width > 0 && canvas.height > 0) {
      const color = extractBackgroundColor(canvas);
      setBgColor(color);
    }
  }, [currentSlide, fileData]);

  if (!id) return <div className="p-8 text-black min-h-screen bg-[#EBFF00] font-mono text-4xl uppercase font-black uppercase flex items-center justify-center">ERROR: NO_ID_PROVIDED</div>;
  if (!fileData) return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8 border-[20px] border-white">
      <div className="w-24 h-24 border-[12px] border-white border-t-[#00F0FF] animate-spin mb-12 shadow-[12px_12px_0px_#FF00FF]" />
      <div className="text-4xl font-black uppercase tracking-[0.2em] animate-pulse text-center">
        INIT.PRESENTATION_STREAM...
      </div>
      <div className="mt-8 text-xs opacity-50 font-bold uppercase tracking-widest">{`UPLINK_ID: ${id?.substring(0,16)}`}</div>
    </div>
  );
  return (
    <div
      className="fixed inset-0 flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: bgColor, transition: 'background-color 300ms ease' }}
    >
      <div className="w-screen h-screen relative">
        <PDFViewer
          file={fileData}
          pageNumber={currentSlide}
          onLoadSuccess={setNumPages}
          onRenderSuccess={handleRenderSuccess}
        />
      </div>
    </div>
  );
}

export default function PresentPage() {
  return (
    <Suspense fallback={null}>
      <PresentContent />
    </Suspense>
  );
}

