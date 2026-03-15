'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPDF, getNotes, saveNotes } from '@/lib/storage';
import { useSyncState } from '@/hooks/useSyncState';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, MonitorPlay, FileText } from 'lucide-react';
import { MarkdownPasteModal } from '@/components/MarkdownPasteModal';

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="p-8 text-slate-500 animate-pulse flex items-center justify-center">Loading PDF Engine...</div>
});

function ControlPanelContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [fileData, setFileData] = useState<ArrayBuffer | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [isMarkdownModalOpen, setIsMarkdownModalOpen] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  
  const { state, setSyncState } = useSyncState();
  const currentSlide = state.currentSlide;

  useEffect(() => {
    if (id) {
      getPDF(id).then((data) => {
        if (data) setFileData(data);
      });
      getNotes(id).then((data) => {
        if (data) setNotes(data);
      });
    }
  }, [id]);

  const handleNoteChange = (text: string) => {
    const newNotes = { ...notes, [currentSlide]: text };
    setNotes(newNotes);
    
    // Auto-save
    setIsSavingNotes(true);
    if (id) {
      saveNotes(id, newNotes).finally(() => {
        setTimeout(() => setIsSavingNotes(false), 500);
      });
    }
  };

  const handleImportNotes = (importedNotes: Record<number, string>) => {
    const newNotes = { ...notes, ...importedNotes };
    setNotes(newNotes);
    if (id) {
      saveNotes(id, newNotes);
    }
  };

  useEffect(() => {
    if (id) {
      setSyncState({ pdfId: id });
    }
  }, [id, setSyncState]);

  const handlePrev = useCallback(() => {
    setSyncState({ currentSlide: Math.max(1, currentSlide - 1) });
  }, [currentSlide, setSyncState]);

  const handleNext = useCallback(() => {
    // We don't have numPages here easily without props, but the hook is fine.
    // In Control panel we have it, here we just increment.
    setSyncState({ currentSlide: currentSlide + 1 });
  }, [currentSlide, setSyncState]);
  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  if (!id) return (
    <div className="p-8 text-black min-h-screen bg-[#EBFF00] font-mono text-2xl uppercase font-black flex items-center justify-center">
      ERROR: NO_ID_PROVIDED
    </div>
  );

  if (!fileData) return (
    <div className="min-h-screen bg-black text-white font-mono flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-white border-t-[#00FF66] animate-spin mb-6" />
      <p className="text-xl font-bold uppercase tracking-widest">LOADING.SYSTEM...</p>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-zinc-950 text-white font-mono flex flex-col selection:bg-[#00F0FF] selection:text-black">
      {/* Header - Toned down */}
      <header className="px-6 py-4 border-b-2 border-white/20 flex justify-between items-center bg-black/50 backdrop-blur-md sticky top-0 z-50">
        <div className="flex items-center space-x-4">
          <div className="bg-[#EBFF00] text-black px-3 py-1 font-black text-lg border-2 border-black">
            CTRL
          </div>
          <h1 className="text-xl font-bold tracking-widest uppercase text-white/80">
            {id.substring(0, 8)}
          </h1>
        </div>
        
        <div className="flex gap-4">
          <button 
            className="group text-black bg-[#00F0FF] border-2 border-black transition-all shadow-[8px_8px_0px_0px_white] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[6px] active:translate-y-[6px] rounded-none px-6 py-5 font-black text-sm uppercase relative overflow-hidden hidden sm:block"
            onClick={() => window.open(`/teleprompter?id=${id}`, '_blank')}
          >
            <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            <div className="relative flex items-center tracking-tighter">
              <MonitorPlay className="mr-3 w-6 h-6 group-hover:scale-110 transition-transform duration-500" />
              TELEPROMPTER
            </div>
          </button>
          
          <button 
            className="group text-black bg-[#EBFF00] border-2 border-black transition-all shadow-[8px_8px_0px_0px_white] hover:shadow-none hover:translate-x-[4px] hover:translate-y-[4px] active:translate-x-[6px] active:translate-y-[6px] rounded-none px-8 py-5 font-black text-sm uppercase relative overflow-hidden"
            onClick={() => window.open(`/present?id=${id}`, '_blank')}
          >
            {/* Mechanical Shutter Effect */}
            <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            
            <div className="relative flex items-center tracking-tighter">
              <ExternalLink className="mr-3 w-6 h-6 group-hover:rotate-45 transition-transform duration-500" />
              PRESENT.SESSION
            </div>
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-hidden max-w-[1400px] mx-auto w-full p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        <div className="flex flex-col space-y-6 overflow-hidden min-h-0">
        
        {/* Main Display - Toned down and fixed scaling */}
        <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-zinc-900 border-2 border-white/10 relative group overflow-hidden preview-scaling">
          <div className="absolute top-4 left-4 z-10">
            <span className="bg-black/80 text-[#00F0FF] px-2 py-0.5 text-[10px] font-bold border border-[#00F0FF]/30 uppercase tracking-widest">
              Live Preview
            </span>
          </div>
          <div className="w-full h-full relative">
            <PDFViewer 
              file={fileData} 
              pageNumber={currentSlide} 
              onLoadSuccess={setNumPages}
            />
          </div>
        </div>

        {/* Controller Deck - Toned down */}
        <div className="w-full flex items-center justify-between bg-black p-6 border-2 border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]">
          <Button 
            size="icon" 
            onClick={handlePrev} 
            disabled={currentSlide <= 1}
            className="border-2 border-white bg-transparent hover:bg-white hover:text-black rounded-none w-14 h-14 p-0 transition-all disabled:opacity-20 flex-shrink-0 shadow-[2px_2px_0px_white] active:shadow-none"
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
          
          <div className="flex flex-col items-center flex-1 mx-8 pt-2">
            <div className="text-4xl font-black text-[#EBFF00] tracking-tighter leading-none mb-4">
              {String(currentSlide).padStart(2, '0')} <span className="text-white/20 text-2xl font-normal">/</span> <span className="text-white/40 text-3xl font-bold">{numPages || '--'}</span>
            </div>
            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden max-w-md">
               <div 
                 className="h-full bg-[#00F0FF] transition-all duration-300 shadow-[0_0_10px_#00F0FF]" 
                 style={{ width: `${numPages ? (currentSlide / numPages) * 100 : 0}%` }} 
               />
            </div>
            <div className="mt-3 flex space-x-4 text-[10px] font-bold text-white/30 tracking-[0.2em] uppercase">
              <span>Use Arrow Keys</span>
              <span>•</span>
              <span>Page Sync: Active</span>
            </div>
          </div>

          <Button 
            size="icon" 
            onClick={handleNext} 
            disabled={numPages ? currentSlide >= numPages : true}
            className="border-2 border-white bg-transparent hover:bg-white hover:text-black rounded-none w-14 h-14 p-0 transition-all disabled:opacity-20 flex-shrink-0 shadow-[2px_2px_0px_white] active:shadow-none"
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        </div>
        </div>

        {/* Speaker Notes Sidebar */}
        <div className="flex flex-col bg-zinc-950 border-2 border-white/20 shadow-[8px_8px_0px_0px_rgba(255,255,255,0.05)] overflow-hidden">
          <div className="p-4 border-b-2 border-white/10 flex justify-between items-center bg-black">
            <h2 className="text-[#00F0FF] font-black uppercase flex items-center tracking-widest">
              <FileText className="w-5 h-5 mr-2" />
              Speaker Notes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarkdownModalOpen(true)}
              className="h-8 text-[10px] font-bold uppercase tracking-widest border border-white/20 hover:bg-white hover:text-black rounded-none"
            >
              Paste Script
            </Button>
          </div>
          <div className="flex-1 p-4 relative flex flex-col">
            <textarea
              className="flex-1 w-full bg-zinc-900/50 border-2 border-transparent focus:border-[#EBFF00] focus:outline-none p-4 text-white resize-none font-sans text-lg md:text-xl leading-relaxed shadow-inner placeholder:text-white/20 transition-colors selection:bg-[#00F0FF] selection:text-black"
              placeholder={`Write notes for slide ${currentSlide} here...`}
              value={notes[currentSlide] || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
            />
            {isSavingNotes && (
              <div className="absolute bottom-6 right-6 text-[10px] text-[#00FF66] font-bold uppercase tracking-widest bg-black px-2 py-1 flex items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00FF66] animate-pulse mr-2" />
                Saved
              </div>
            )}
          </div>
        </div>
      </div>

      <MarkdownPasteModal 
        isOpen={isMarkdownModalOpen}
        onClose={() => setIsMarkdownModalOpen(false)}
        onImport={handleImportNotes}
      />
    </div>
  );
}

export default function ControlPanelPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-950 text-white p-8">Loading...</div>}>
      <ControlPanelContent />
    </Suspense>
  );
}
