'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNotes, getPDF } from '@/lib/storage';
import { useSyncState } from '@/hooks/useSyncState';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Maximize } from 'lucide-react';

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer').then(mod => mod.PDFViewer), {
  ssr: false
});

function TeleprompterContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [pdfData, setPdfData] = useState<ArrayBuffer | null>(null);
  const [fontSize, setFontSize] = useState(64); // default large font
  const [mirror, setMirror] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { state, setSyncState } = useSyncState();
  const currentSlide = state.currentSlide;

  // Load notes initially and continuously sync them in case of updates
  useEffect(() => {
    if (!id) return;
    
    const loadData = async () => {
      const data = await getNotes(id);
      if (data) setNotes(data);
      if (!pdfData) {
        const pData = await getPDF(id);
        if (pData) setPdfData(pData);
      }
    };

    loadData();
    
    // Poll for notes updates every 2 seconds to keep teleprompter in sync with live edits
    const interval = setInterval(async () => {
      const data = await getNotes(id);
      if (data) setNotes(data);
    }, 2000);
    return () => clearInterval(interval);
  }, [id]);

  useEffect(() => {
    if (id) {
      setSyncState({ pdfId: id });
    }
  }, [id, setSyncState]);

  // Reset scroll position when slide changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
  }, [currentSlide]);

  const handlePrev = useCallback(() => {
    setSyncState({ currentSlide: Math.max(1, currentSlide - 1) });
  }, [currentSlide, setSyncState]);

  const handleNext = useCallback(() => {
    setSyncState({ currentSlide: currentSlide + 1 });
  }, [currentSlide, setSyncState]);

  // Keyboard navigation for teleprompter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      }
      
      // ArrowUp and ArrowDown behavior is naturally handled by the scrollable div
      // but we can augment it for larger jumps if needed. Native scroll is usually fine
      // if the div is focused or if we manually scroll.
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        if (scrollRef.current) {
          e.preventDefault(); // Prevent default to handle custom scroll speed
          const amount = fontSize * 1.5;
          scrollRef.current.scrollBy({
            top: e.key === 'ArrowDown' ? amount : -amount,
            behavior: 'smooth'
          });
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext, fontSize]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  if (!id) return (
    <div className="p-8 text-black min-h-screen bg-[#EBFF00] font-mono text-2xl uppercase font-black flex items-center justify-center">
      ERROR: NO_ID_PROVIDED
    </div>
  );

  const currentText = notes[currentSlide] || "No notes for this slide.";

  return (
    <div className="h-screen w-screen overflow-hidden bg-black text-white font-sans flex flex-col selection:bg-white selection:text-black">
      
      {/* Hidden Settings Bar - Shows on Hover at top */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-zinc-900/90 border-b border-white/20 flex items-center gap-6 px-6 z-50 transform -translate-y-full hover:translate-y-0 transition-transform duration-300">
        <div className="flex items-center gap-2 text-[#00F0FF] font-mono font-bold uppercase tracking-widest text-sm">
          <Settings className="w-5 h-5" />
          Teleprompter Settings
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Text Size</span>
          <input 
            type="range" 
            min="32" 
            max="120" 
            value={fontSize} 
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-32 accent-[#EBFF00]"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-mono text-white/50 uppercase tracking-widest">Mirror Mode</span>
          <button 
            onClick={() => setMirror(!mirror)}
            className={`w-12 h-6 rounded-full border-2 border-white/20 transition-colors relative ${mirror ? 'bg-[#00F0FF]' : 'bg-transparent'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all ${mirror ? 'left-[26px]' : 'left-0.5'}`} />
          </button>
        </div>

        <button 
          onClick={toggleFullscreen}
          className="text-white hover:text-[#EBFF00] transition-colors mt-0.5"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-5 h-5" />
        </button>
      </div>

      {/* Main Scroller Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-12 md:px-32 pt-[15vh] pb-[40vh] scroll-smooth"
        style={{
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      >
         <div 
           className="max-w-[1200px] mx-auto w-full font-bold whitespace-pre-wrap leading-[1.4] tracking-tight"
           style={{ 
             fontSize: `${fontSize}px`,
             textShadow: '0 4px 12px rgba(0,0,0,0.8)'
           }}
         >
           {currentText}
         </div>
      </div>

      {/* Slide Navigation Overlay Component - Hidden visually but acts as touch targets if needed, or we use explicit buttons.
          Let's add subtle gradient edges that act as previous / next touch targets. */}
      
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-black/50 to-transparent flex items-center justify-start p-4 hover:from-black/80 transition-colors cursor-pointer group z-40"
        onClick={handlePrev}
      >
        <ChevronLeft className="w-16 h-16 text-white/20 group-hover:text-white group-active:text-[#EBFF00] transition-all group-hover:-translate-x-2" />
      </div>

      <div 
        className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-black/50 to-transparent flex items-center justify-end p-4 hover:from-black/80 transition-colors cursor-pointer group z-40"
        onClick={handleNext}
      >
        <ChevronRight className="w-16 h-16 text-white/20 group-hover:text-white group-active:text-[#EBFF00] transition-all group-hover:translate-x-2" />
      </div>

      {/* Absolute Slide Indicator (Bottom Center) - Toned down so it doesn't distract */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <div className="bg-zinc-900/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 text-white/50 font-mono text-lg font-bold">
          SLIDE <span className="text-[#00F0FF]">{currentSlide}</span>
        </div>
      </div>

      {/* Focus Indicator / Reading Line */}
      <div className="absolute top-[20%] left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#EBFF00]/30 to-transparent pointer-events-none -z-10" />

      {/* Slide Preview (Bottom Right / Corner) */}
      {pdfData && (
        <>
          <div className="absolute bottom-6 right-6 w-48 xl:w-64 aspect-video border-2 border-white/20 bg-black shadow-2xl z-[60] pointer-events-none hidden sm:block">
             <PDFViewer file={pdfData} pageNumber={currentSlide} />
             <div className="absolute top-0 right-0 bg-[#00F0FF] text-black px-1.5 py-0.5 text-[10px] font-bold uppercase z-10">
               LIVE
             </div>
          </div>
          <div className="absolute bottom-20 right-4 w-32 aspect-video border border-white/20 bg-black shadow-2xl z-[60] pointer-events-none sm:hidden">
             <PDFViewer file={pdfData} pageNumber={currentSlide} />
          </div>
        </>
      )}

    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white p-8 font-mono">Loading Teleprompter...</div>}>
      <TeleprompterContent />
    </Suspense>
  );
}
