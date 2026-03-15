'use client';

import { Suspense, useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { getPDF, getNotes, saveNotes } from '@/lib/storage';
import { useSyncState } from '@/hooks/useSyncState';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ExternalLink, MonitorPlay, FileText, Settings2, ShieldCheck } from 'lucide-react';
import { MarkdownPasteModal } from '@/components/MarkdownPasteModal';

const PDFViewer = dynamic(() => import('@/components/pdf/PDFViewer').then(mod => mod.PDFViewer), {
  ssr: false,
  loading: () => <div className="p-8 text-slate-500 animate-pulse flex items-center justify-center h-full w-full">Loading PDF Engine...</div>
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
    setSyncState({ currentSlide: currentSlide + 1 });
  }, [currentSlide, setSyncState]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in notes
      if (document.activeElement?.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePrev, handleNext]);

  if (!id) return (
    <div className="p-8 text-slate-900 min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center space-y-4 max-w-md">
         <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings2 className="w-6 h-6" />
         </div>
         <h2 className="text-xl font-bold">Session Not Found</h2>
         <p className="text-slate-500">No presentation ID was provided. Please start from the homepage to select a PDF.</p>
         <Button onClick={() => window.location.href = '/'} className="w-full mt-4">Return Home</Button>
      </div>
    </div>
  );

  if (!fileData) return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col items-center justify-center p-8">
      <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6" />
      <p className="text-lg font-medium text-slate-600">Loading your presentation securely...</p>
    </div>
  );

  return (
    <div className="h-screen overflow-hidden bg-slate-50 text-slate-900 font-sans flex flex-col selection:bg-blue-100 selection:text-blue-900">

      {/* Top Navigation */}
      <header className="px-6 py-4 border-b border-slate-200 bg-white flex justify-between items-center z-50">
        <div className="flex items-center space-x-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-lg tracking-tight hidden sm:block">Control Panel</span>
          </div>
          <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block" />
          <div className="flex items-center text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            Local Session: {id.substring(0, 8)}
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button
            variant="outline"
            className="hidden sm:flex items-center gap-2 border-slate-200 text-slate-700 hover:bg-slate-50"
            onClick={() => window.open(`/teleprompter?id=${id}`, '_blank')}
          >
            <MonitorPlay className="w-4 h-4" />
            Teleprompter
          </Button>
          
          <Button
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={() => window.open(`/present?id=${id}`, '_blank')}
          >
            <ExternalLink className="w-4 h-4" />
            Launch Audience View
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden max-w-[1600px] mx-auto w-full p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
        
        {/* Left Column: Preview & Controls */}
        <div className="flex flex-col space-y-6 overflow-hidden min-h-0">
          
          {/* Main Display Preview */}
          <div className="flex-1 min-h-0 w-full flex items-center justify-center bg-slate-200/50 rounded-2xl border border-slate-200 relative group overflow-hidden shadow-inner">
            <div className="absolute top-4 left-4 z-10">
              <span className="bg-white/90 backdrop-blur text-slate-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm border border-slate-200/50 flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                Live Sync
              </span>
            </div>
            <div className="w-full h-full relative p-4 flex items-center justify-center">
              <PDFViewer
                file={fileData}
                pageNumber={currentSlide}
                onLoadSuccess={setNumPages}
              />
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="w-full flex items-center justify-between bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrev}
              disabled={currentSlide <= 1}
              className="w-12 h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            <div className="flex flex-col items-center flex-1 mx-8">
              <div className="flex items-baseline gap-2 mb-2">
                <span className="text-3xl font-bold text-slate-900">{currentSlide}</span>
                <span className="text-slate-400 font-medium text-lg">/</span>
                <span className="text-slate-500 font-medium text-xl">{numPages || '--'}</span>
              </div>

              <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden max-w-sm">
                 <div
                   className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                   style={{ width: `${numPages ? (currentSlide / numPages) * 100 : 0}%` }}
                 />
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={numPages ? currentSlide >= numPages : true}
              className="w-12 h-12 rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              <ChevronRight className="w-6 h-6" />
            </Button>
          </div>
        </div>

        {/* Right Column: Speaker Notes */}
        <div className="flex flex-col bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-slate-800 font-semibold flex items-center text-sm">
              <FileText className="w-4 h-4 mr-2 text-slate-500" />
              Speaker Notes
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMarkdownModalOpen(true)}
              className="h-8 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
            >
              Import Script
            </Button>
          </div>

          <div className="flex-1 p-0 relative flex flex-col bg-white">
            <textarea
              className="flex-1 w-full p-6 text-slate-700 resize-none font-sans text-lg leading-relaxed focus:outline-none placeholder:text-slate-300"
              placeholder={`Add notes for slide ${currentSlide}...`}
              value={notes[currentSlide] || ''}
              onChange={(e) => handleNoteChange(e.target.value)}
            />
            {isSavingNotes && (
              <div className="absolute bottom-4 right-4 text-xs font-medium text-slate-400 bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-slate-100 shadow-sm flex items-center transition-opacity">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2" />
                Saving...
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
    <Suspense fallback={<div className="min-h-screen bg-slate-50 text-slate-900 p-8 flex items-center justify-center">Loading Panel...</div>}>
      <ControlPanelContent />
    </Suspense>
  );
}