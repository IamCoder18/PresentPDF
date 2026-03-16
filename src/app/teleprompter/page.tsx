'use client';

import { Suspense, useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getNotes, getPDF } from '@/lib/storage';
import { useSyncState } from '@/hooks/useSyncState';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, Maximize, AlertCircle } from 'lucide-react';

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
  const [numPages, setNumPages] = useState(0);
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
    if (numPages > 0 && currentSlide < numPages) {
      setSyncState({ currentSlide: currentSlide + 1 });
    } else if (numPages === 0) {
      setSyncState({ currentSlide: currentSlide + 1 });
    }
  }, [currentSlide, numPages, setSyncState]);

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
    <div className="p-8 text-slate-900 min-h-screen bg-slate-50 flex items-center justify-center font-sans">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4 max-w-md">
         <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-6 h-6" />
         </div>
         <h2 className="text-xl font-bold">Session Not Found</h2>
         <p className="text-slate-500">No presentation ID provided. Please return to the control panel or homepage.</p>
      </div>
    </div>
  );

  const currentText = notes[currentSlide] || "No notes for this slide.";

  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans flex flex-col selection:bg-blue-500/30 selection:text-white">
      
      {/* Hidden Settings Bar - Shows on Hover at top */}
      <div className="absolute top-0 left-0 right-0 h-16 bg-slate-900/95 border-b border-slate-800 flex items-center gap-6 px-6 z-50 transform -translate-y-full hover:translate-y-0 transition-transform duration-300 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-2 text-slate-300 font-medium text-sm">
          <Settings className="w-4 h-4" />
          Teleprompter Settings
        </div>
        
        <div className="flex-1" />

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400">Text Size</span>
          <input 
            type="range" 
            min="32" 
            max="120" 
            value={fontSize} 
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-32 accent-blue-500"
          />
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-slate-400">Mirror Mode</span>
          <button 
            onClick={() => setMirror(!mirror)}
            className={`w-11 h-6 rounded-full transition-colors relative shadow-inner ${mirror ? 'bg-blue-500' : 'bg-slate-700'}`}
          >
            <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-sm ${mirror ? 'left-[22px]' : 'left-1'}`} />
          </button>
        </div>

        <div className="w-px h-6 bg-slate-800" />

        <button 
          onClick={toggleFullscreen}
          className="text-slate-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-slate-800"
          title="Toggle Fullscreen"
        >
          <Maximize className="w-4 h-4" />
        </button>
      </div>

      {/* Main Scroller Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-12 md:px-32 pt-[20vh] pb-[40vh] scroll-smooth"
        style={{
          transform: mirror ? 'scaleX(-1)' : 'none',
        }}
      >
         <div 
           className="max-w-[1200px] mx-auto w-full font-medium whitespace-pre-wrap leading-[1.5] tracking-tight text-slate-100"
           style={{ 
             fontSize: `${fontSize}px`,
           }}
         >
           {currentText}
         </div>
      </div>

      {/* Slide Navigation Overlay Components */}
      <div 
        className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent flex items-center justify-start p-6 hover:from-slate-900 transition-colors cursor-pointer group z-40 opacity-0 hover:opacity-100"
        onClick={handlePrev}
      >
        <ChevronLeft className="w-16 h-16 text-slate-400 group-hover:text-white transition-all group-hover:-translate-x-2" />
      </div>

      <div 
        className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-slate-950 via-slate-950/50 to-transparent flex items-center justify-end p-6 hover:from-slate-900 transition-colors cursor-pointer group z-40 opacity-0 hover:opacity-100"
        onClick={handleNext}
      >
        <ChevronRight className="w-16 h-16 text-slate-400 group-hover:text-white transition-all group-hover:translate-x-2" />
      </div>

      {/* Absolute Slide Indicator (Bottom Center) */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40 pointer-events-none transition-opacity duration-300 opacity-30">
        <div className="bg-slate-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-slate-800/50 text-slate-400 font-medium text-sm flex items-center gap-2 shadow-xl">
          Slide <span className="text-white font-bold">{currentSlide}</span>
        </div>
      </div>

      {/* Focus Indicator / Reading Line */}
      <div className="absolute top-[25%] left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/20 to-transparent pointer-events-none -z-10" />

      {/* Slide Preview (Bottom Right / Corner) */}
      {pdfData && (
        <>
          <div className="absolute bottom-8 right-8 w-48 xl:w-64 aspect-video border border-slate-800 rounded-xl bg-slate-900 shadow-2xl z-[60] pointer-events-none hidden sm:block overflow-hidden opacity-50 transition-opacity hover:opacity-100">
             <PDFViewer file={pdfData} pageNumber={currentSlide} onLoadSuccess={setNumPages} />
             <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur text-white px-2 py-0.5 rounded text-[10px] font-bold uppercase z-10 shadow-sm">
               Live
             </div>
          </div>
          <div className="absolute bottom-20 right-4 w-32 aspect-video border border-slate-800 rounded-lg bg-slate-900 shadow-2xl z-[60] pointer-events-none sm:hidden overflow-hidden opacity-50">
             <PDFViewer file={pdfData} pageNumber={currentSlide} onLoadSuccess={setNumPages} />
          </div>
        </>
      )}

    </div>
  );
}

export default function TeleprompterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-slate-400 p-8 font-sans flex items-center justify-center">Loading Teleprompter...</div>}>
      <TeleprompterContent />
    </Suspense>
  );
}