import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { X, Copy, Check } from 'lucide-react';

interface MarkdownPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (notes: Record<number, string>) => void;
}

const AI_PROMPT = `Please convert my script into slide-by-slide speaker notes.
Format the output with exactly one slide per section, starting each section with exactly: ## 
This includes the first slide.
Do not include slide numbers, and please remove all other markdown formatting from the script. Just the ## and the text itself.

Example:
## 
Hello everyone, welcome to the presentation.
## 
Today we will discuss our new strategy.
## 
Let's look at the metrics...`;

export function MarkdownPasteModal({ isOpen, onClose, onImport }: MarkdownPasteModalProps) {
  const [inputText, setInputText] = useState('');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(AI_PROMPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImport = () => {
    // Split by ## at the start of a line
    const segments = inputText.split(/^##\s*/m);
    const newNotes: Record<number, string> = {};
    
    let slideIndex = 1;
    segments.forEach((segment) => {
      const trimmed = segment.trim();
      if (trimmed) {
        newNotes[slideIndex] = trimmed;
        slideIndex++;
      }
    });

    onImport(newNotes);
    setInputText('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm tracking-tighter text-white font-mono">
      <div className="bg-zinc-950 border-2 border-[#EBFF00] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(235,255,0,0.5)]">
        <div className="flex justify-between items-center p-4 border-b-2 border-white/10 bg-black">
          <h2 className="text-xl font-black uppercase text-[#00F0FF]">Import Markdown Notes</h2>
          <button onClick={onClose} className="hover:text-[#EBFF00] transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 flex-1 overflow-y-auto space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between items-end">
              <label className="text-sm font-bold uppercase text-white/60">AI Assistant Prompt</label>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-xs hover:bg-[#EBFF00] hover:text-black border border-white/20 rounded-none h-8 px-3"
                onClick={handleCopyPrompt}
              >
                {copied ? <Check className="w-4 h-4 mr-2 text-[#00FF66]" /> : <Copy className="w-4 h-4 mr-2" />}
                {copied ? 'Copied!' : 'Copy Prompt'}
              </Button>
            </div>
            <div className="bg-black border border-white/20 p-3 text-sm text-white/80 whitespace-pre-wrap selection:bg-[#FF00FF] selection:text-white">
              {AI_PROMPT}
            </div>
          </div>

          <div className="space-y-2 flex-1 flex flex-col min-h-[300px]">
             <label className="text-sm font-bold uppercase text-white/60">Paste Result Here</label>
             <textarea 
               className="w-full flex-1 bg-zinc-900 border-2 border-white/20 p-4 text-white focus:outline-none focus:border-[#00F0FF] resize-none font-mono text-sm shadow-inner transition-colors selection:bg-[#EBFF00] selection:text-black"
               placeholder="Paste your slide notes starting with ## \n..."
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
             />
          </div>
        </div>

        <div className="p-4 border-t-2 border-white/10 flex justify-end gap-4 bg-black">
          <Button 
            variant="ghost" 
            onClick={onClose}
            className="rounded-none uppercase font-bold text-white/60 hover:text-white hover:bg-white/10"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleImport}
            className="rounded-none bg-[#00F0FF] text-black font-black uppercase hover:bg-white border-2 border-transparent transition-all shadow-[4px_4px_0px_0px_white] active:shadow-none active:translate-x-[2px] active:translate-y-[2px]"
          >
            Import Notes
          </Button>
        </div>
      </div>
    </div>
  );
}
