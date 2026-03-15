'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileCog, Sparkles } from 'lucide-react';
import { savePDF } from '@/lib/storage';

export default function LandingPage() {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    if (file.type !== 'application/pdf') {
      alert('Please upload a valid PDF file.');
      return;
    }

    setIsProcessing(true);
    try {
      const id = crypto.randomUUID();
      await savePDF(id, file);
      router.push(`/control?id=${id}`);
    } catch (err) {
      console.error(err);
      alert('Failed to process PDF.');
      setIsProcessing(false);
    }
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  return (
    <div className="min-h-screen bg-black text-white font-mono selection:bg-[#EBFF00] selection:text-black flex flex-col items-center justify-center p-6 bg-[linear-gradient(rgba(255,255,255,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(255,255,255,0.05)_2px,transparent_2px)] bg-[size:40px_40px]">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00F0FF] to-transparent animate-pulse" />
      
      <div className="w-full max-w-4xl border-8 border-white bg-black shadow-[24px_24px_0px_0px_#EBFF00] p-8 md:p-16 space-y-12 relative overflow-hidden group/container transition-all hover:shadow-[32px_32px_0px_0px_#FF00FF] duration-700">
        
        {/* Scanner Line */}
        <div className="absolute inset-0 pointer-events-none z-20">
          <div className="w-full h-1 bg-[#EBFF00]/30 shadow-[0_0_15px_#EBFF00] animate-[scan_4s_linear_infinite]" />
        </div>

        <div className="space-y-6 relative z-10">
          <div className="flex items-center space-x-4">
            <div className="px-3 py-1 bg-white text-black font-black uppercase tracking-widest text-sm border-4 border-black shadow-[4px_4px_0px_0px_#00F0FF]">
              CORE.OS_v2.1
            </div>
            <div className="h-0.5 flex-1 bg-white/20" />
          </div>
          <h1 className="text-7xl md:text-9xl font-black uppercase tracking-tighter leading-[0.85] italic">
            Present<br/><span className="text-[#00F0FF] group-hover/container:text-[#00FF66] transition-colors duration-500">PDF.</span>
          </h1>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <p className="text-xl md:text-2xl text-slate-300 max-w-xl border-l-8 border-[#EBFF00] pl-6 py-2 bg-white/5">
              [ ACCESS GRANTED ] A brutalist, high-performance local presenter for technical documents.
            </p>
            <div className="flex-1 flex justify-end">
               <div className="w-24 h-24 border-4 border-white flex items-center justify-center animate-spin-slow">
                 <div className="w-16 h-16 border-4 border-[#FF00FF]" />
               </div>
            </div>
          </div>
        </div>

        <div
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={() => setIsDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`
            relative w-full cursor-pointer group border-8 border-white transition-all duration-200 overflow-hidden
            ${isDragOver 
              ? 'bg-[#00FF66] text-black py-24 scale-[1.01]' 
              : 'bg-black hover:bg-zinc-900 py-20'
            }
          `}
        >
          <input
            type="file"
            className="hidden"
            accept=".pdf"
            ref={fileInputRef}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFile(e.target.files[0]);
              }
            }}
          />
          
          <div className="relative z-10 flex flex-col items-center justify-center space-y-8 text-center px-4">
            <div className={`p-6 border-8 transition-all duration-300 ${isProcessing ? 'border-[#00FF66] bg-black text-[#00FF66]' : 'border-white group-hover:bg-[#EBFF00] group-hover:text-black group-hover:shadow-[12px_12px_0px_0px_#FFF] shadow-[8px_8px_0px_0px_rgba(255,255,255,0.2)]'}`}>
              {isProcessing ? (
                <FileCog className="w-20 h-20 animate-spin" />
              ) : (
                <UploadCloud className="w-20 h-20" />
              )}
            </div>
            
            <div className="space-y-4 uppercase tracking-tighter">
              <p className="text-4xl md:text-5xl font-black">
                {isProcessing ? 'READING_FILE...' : 'INPUT.FILE_NOW'}
              </p>
              <div className="flex items-center justify-center space-x-4">
                <span className="w-12 h-1 bg-[#EBFF00]" />
                <p className="text-xl text-slate-400 font-bold">
                  {isProcessing 
                    ? 'ALLOCATING_RESOURCES' 
                    : '100% SECURE_LOCAL_TRANSMISSION'}
                </p>
                <span className="w-12 h-1 bg-[#EBFF00]" />
              </div>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="flex justify-between items-end border-t-4 border-white pt-8 opacity-60">
           <div className="text-sm space-y-1">
             <p>[ STATE: IDLE ]</p>
             <p>[ CACHE: 0.0GB ]</p>
           </div>
           <p className="text-xs tracking-[0.3em] font-black uppercase">v2.1_REDACTED_PROJECT</p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(1000%); }
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
