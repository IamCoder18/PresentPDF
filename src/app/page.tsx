'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { UploadCloud, FileCog, Shield, Zap, Lock, Github, CheckCircle2 } from 'lucide-react';
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
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-100 selection:text-blue-900">
      
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">P</span>
            </div>
            PresentPDF
          </div>
          <a
            href="https://github.com/IamCoder18/PresentPDF"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Github className="w-5 h-5" />
            <span className="hidden sm:inline">Star on GitHub</span>
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-white -z-10" />

        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium mb-4">
            <Shield className="w-4 h-4" />
            100% Local Processing
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900">
            Present your PDFs <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">securely & beautifully.</span>
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            A professional, high-performance presenter for your documents.
            Everything runs directly in your browser. No uploads. No servers. No tracking.
          </p>

          {/* Upload Area */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div
              onDrop={onDrop}
              onDragOver={onDragOver}
              onDragLeave={() => setIsDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden bg-white
                ${isDragOver
                  ? 'border-blue-500 bg-blue-50 scale-[1.02]'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
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

              <div className="px-8 py-16 flex flex-col items-center justify-center text-center space-y-6">
                <div className={`p-4 rounded-full transition-colors duration-300 ${isProcessing ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'}`}>
                  {isProcessing ? (
                    <FileCog className="w-12 h-12 animate-spin" />
                  ) : (
                    <UploadCloud className="w-12 h-12" />
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-semibold text-slate-900">
                    {isProcessing ? 'Processing Document...' : 'Click or drag PDF to begin'}
                  </h3>
                  <p className="text-slate-500">
                    {isProcessing
                      ? 'Preparing presentation environment safely'
                      : 'Files stay on your device forever'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Why choose PresentPDF?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Designed for professionals who care about privacy, performance, and reliability during critical presentations.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Privacy First</h3>
              <p className="text-slate-600 leading-relaxed">
                Your documents never leave your computer. We use IndexedDB to store your PDFs locally in your browser. Complete peace of mind for sensitive information.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">High Performance</h3>
              <p className="text-slate-600 leading-relaxed">
                Optimized 2x supersampled rendering ensures your text and vector graphics remain crisp and clear, no matter the resolution of the projector or screen.
              </p>
            </div>

            <div className="space-y-4">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900">Professional Tools</h3>
              <p className="text-slate-600 leading-relaxed">
                Dual-window mode keeps you in control. A dedicated presenter view with speaker notes syncs instantly with the clean, full-screen audience view.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works Section */}
      <section className="py-24">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-slate-900 mb-12 text-center">How it works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">1</div>
              <div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Upload your PDF</h4>
                <p className="text-slate-600">Drag and drop your presentation file into the browser. It gets saved locally using modern web storage APIs.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">2</div>
              <div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Open Presenter & Audience Views</h4>
                <p className="text-slate-600">The app provides you with a dedicated control panel for notes, and a separate clean view you can drag to the projector or screen share.</p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">3</div>
              <div>
                <h4 className="text-xl font-semibold text-slate-900 mb-2">Present with Confidence</h4>
                <p className="text-slate-600">Navigate using your keyboard. Views stay perfectly synchronized using the BroadcastChannel API, instantly.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Open Source / CTA Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
          <Github className="w-16 h-16 mx-auto text-slate-400" />
          <h2 className="text-3xl md:text-4xl font-bold">Open Source & Community Driven</h2>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            PresentPDF is open source software. We believe in building secure, transparent tools for professionals.
          </p>
          <div className="pt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="https://github.com/IamCoder18/PresentPDF"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-white text-slate-900 rounded-lg font-semibold hover:bg-slate-100 transition-colors flex items-center gap-2"
            >
              <Github className="w-5 h-5" />
              View Source Code
            </a>
            <a
              href="https://github.com/IamCoder18/PresentPDF/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 bg-slate-800 text-white rounded-lg font-semibold hover:bg-slate-700 transition-colors border border-slate-700"
            >
              Report an Issue
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between text-slate-500 text-sm">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <div className="w-6 h-6 bg-slate-200 rounded flex items-center justify-center">
              <span className="text-slate-600 text-xs font-bold">P</span>
            </div>
            PresentPDF
          </div>
          <div className="flex gap-6">
            <a href="https://github.com/IamCoder18/PresentPDF" className="hover:text-slate-900">GitHub</a>
            <a href="https://github.com/IamCoder18/PresentPDF/pulls" className="hover:text-slate-900">Open a PR</a>
          </div>
        </div>
      </footer>

    </div>
  );
}