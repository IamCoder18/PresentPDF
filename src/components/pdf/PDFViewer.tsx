'use client';

import { Document, Page, pdfjs } from 'react-pdf';
import { useEffect, useRef, useState, useMemo } from 'react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF.js worker using unpkg CDN
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Force high-quality rendering for vector components
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

interface PDFViewerProps {
  file: ArrayBuffer | null;
  pageNumber: number;
  onLoadSuccess?: (numPages: number) => void;
  width?: number;
  onRenderSuccess?: (canvas: HTMLCanvasElement) => void;
}

export function PDFViewer({ file, pageNumber, onLoadSuccess, width: forcedWidth, onRenderSuccess }: PDFViewerProps) {
  const [numPagesState, setNumPagesState] = useState<number>(0);
  const [containerSize, setContainerSize] = useState({ width: forcedWidth || 1000, height: 1000 });
  const [aspectRatio, setAspectRatio] = useState<number>(1.414); // Default to A4 aspect ratio until loaded
  const [maxRendered, setMaxRendered] = useState<number>(80);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (forcedWidth || !wrapperRef.current) return;
    
    const measure = () => {
      if (wrapperRef.current) {
        const { width: w, height: h } = wrapperRef.current.getBoundingClientRect();
        if (w > 0 && h > 0) {
          setContainerSize(prev => {
             if (Math.abs(prev.width - w) < 1 && Math.abs(prev.height - h) < 1) return prev;
             return { width: w, height: h };
          });
        }
      }
    };

    measure(); // Initial measurement

    const observer = new ResizeObserver(() => measure());
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    
    return () => observer.disconnect();
  }, [forcedWidth]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPagesState(numPages);
    if (onLoadSuccess) {
      onLoadSuccess(numPages);
    }
  }

  // Pre-render logic: render pages around the current one
  useEffect(() => {
    if (numPagesState > 0 && pageNumber + 10 > maxRendered) {
      setMaxRendered(prev => Math.min(numPagesState, Math.max(prev, pageNumber + 40)));
    }
  }, [pageNumber, maxRendered, numPagesState]);

  const fileObj = useMemo(() => {
    if (!file) return null;
    return { data: file };
  }, [file]);

  if (!fileObj) {
    return <div className="flex items-center justify-center p-8 text-slate-500 font-mono uppercase">Loading PDF memory...</div>;
  }

  // Calculation for the best fit
  const fitWidth = containerSize.width;
  const fitHeight = containerSize.width / aspectRatio;
  
  let finalWidth = fitWidth;
  if (fitHeight > containerSize.height) {
    finalWidth = containerSize.height * aspectRatio;
  }

  // Create the visible render list
  const renderedPages = [];
  const limit = Math.min(numPagesState || 1, maxRendered);
  for (let i = 1; i <= limit; i++) {
    renderedPages.push(i);
  }

  return (
    <div className="w-full h-full flex items-center justify-center overflow-hidden relative" ref={wrapperRef}>
      <Document
        file={fileObj}
        onLoadSuccess={onDocumentLoadSuccess}
        className="block relative w-full h-full"
        loading={<div className="p-8 text-slate-500 animate-pulse font-mono uppercase text-sm w-full text-center">Init.PDF_Core...</div>}
      >
        {renderedPages.map(idx => (
          <div 
            key={idx} 
            id={`pdf-page-wrapper-${idx}`}
            className="absolute inset-0 flex items-center justify-center transition-opacity duration-300"
            style={{ 
              opacity: idx === pageNumber ? 1 : 0,
              zIndex: idx === pageNumber ? 1 : 0,
              pointerEvents: idx === pageNumber ? 'auto' : 'none',
              display: Math.abs(idx - pageNumber) <= 3 ? 'flex' : 'none'
            }}
          >
            <Page
              pageNumber={idx}
              width={forcedWidth || Math.max(10, Math.floor(finalWidth))} 
              devicePixelRatio={typeof window !== 'undefined' ? (window.devicePixelRatio || 1) * 2 : 2}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              className="pdf-page-optimized"
              onLoadSuccess={(page) => {
                if (idx === pageNumber) {
                   const ratio = page.width / page.height;
                   setAspectRatio(prev => Math.abs(prev - ratio) < 0.01 ? prev : ratio);
                }
              }}
              onRenderSuccess={() => {
                console.log(`[PDFViewer] onRenderSuccess fired for page ${idx}, current pageNumber=${pageNumber}, hasCallback=${!!onRenderSuccess}`);
                if (idx === pageNumber && onRenderSuccess) {
                   setTimeout(() => {
                     const wrapper = document.getElementById(`pdf-page-wrapper-${idx}`);
                     const canvasElement = wrapper?.querySelector('canvas') as HTMLCanvasElement;
                     console.log(`[PDFViewer] Page ${idx}: wrapper=${!!wrapper}, canvas=${!!canvasElement}, dims=${canvasElement?.width}x${canvasElement?.height}`);
                     if (canvasElement) {
                       onRenderSuccess(canvasElement);
                     } else {
                       console.warn(`[PDFViewer] No canvas found for page ${idx}`);
                     }
                   }, 50);
                }
              }}
              loading={null}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
