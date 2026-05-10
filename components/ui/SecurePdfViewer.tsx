"use client";

import { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight, Loader2, AlertCircle } from 'lucide-react';
import { Button } from './button';

// CSS necessários para o react-pdf funcionar bem
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar o Worker do PDF.js através de uma CDN (evita configurações complexas no Next.js)
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface SecurePdfViewerProps {
    url: string;
}

export function SecurePdfViewer({ url }: SecurePdfViewerProps) {
    const [numPages, setNumPages] = useState<number>();
    const [pageNumber, setPageNumber] = useState<number>(1);
    const [width, setWidth] = useState<number>(800);
    const [isLoading, setIsLoading] = useState(true);

    // Ajustar largura responsiva
    useEffect(() => {
        const updateWidth = () => {
            const containerWidth = window.innerWidth;
            if (containerWidth < 768) {
                setWidth(containerWidth - 32); // Mobile
            } else if (containerWidth < 1024) {
                setWidth(containerWidth - 64); // Tablet
            } else {
                setWidth(800); // PC Max Width
            }
        };
        updateWidth();
        window.addEventListener('resize', updateWidth);
        return () => window.removeEventListener('resize', updateWidth);
    }, []);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
        setIsLoading(false);
    }

    function changePage(offset: number) {
        setPageNumber(prevPageNumber => prevPageNumber + offset);
    }

    return (
        <div className="flex flex-col h-full w-full bg-slate-200" onContextMenu={(e) => e.preventDefault()}>
            {/* Toolbar de Controlo (Sem Download!) */}
            <div className="flex items-center justify-between p-3 bg-slate-800 text-white shadow-md z-10 shrink-0">
                <Button 
                    variant="outline" 
                    size="sm"
                    className="text-slate-800 bg-white hover:bg-slate-100 h-9 px-3"
                    disabled={pageNumber <= 1 || isLoading} 
                    onClick={() => changePage(-1)}
                >
                    <ChevronLeft size={16} className="mr-1" /> Anterior
                </Button>
                
                <div className="text-sm font-bold tracking-wider font-mono bg-slate-900 px-4 py-1.5 rounded-full border border-slate-700">
                    {isLoading ? 'A Carregar...' : `Pág. ${pageNumber} de ${numPages || '--'}`}
                </div>
                
                <Button 
                    variant="outline" 
                    size="sm"
                    className="text-slate-800 bg-white hover:bg-slate-100 h-9 px-3"
                    disabled={pageNumber >= (numPages || 1) || isLoading} 
                    onClick={() => changePage(1)}
                >
                    Seguinte <ChevronRight size={16} className="ml-1" />
                </Button>
            </div>

            {/* Contentor do PDF */}
            <div className="flex-1 overflow-y-auto flex justify-center p-4">
                {isLoading && (
                    <div className="flex flex-col items-center justify-center mt-20 text-slate-500">
                        <Loader2 size={40} className="animate-spin mb-4 text-blue-600" />
                        <p className="font-medium animate-pulse">A extrair ficheiro seguro...</p>
                        <p className="text-xs mt-2 text-slate-400">Pode demorar alguns segundos em ficheiros grandes.</p>
                    </div>
                )}
                <Document 
                    file={url} 
                    onLoadSuccess={onDocumentLoadSuccess}
                    loading={null}
                    error={
                        <div className="flex flex-col items-center justify-center mt-20 text-rose-500 bg-rose-50 p-6 rounded-xl">
                            <AlertCircle size={40} className="mb-4" />
                            <p className="font-bold text-lg">Erro ao carregar o PDF</p>
                            <p className="text-sm mt-1 text-center">O ficheiro pode estar corrompido ou o Supabase bloqueou o acesso.</p>
                        </div>
                    }
                    className="drop-shadow-2xl"
                >
                    {!isLoading && (
                        <Page 
                            pageNumber={pageNumber} 
                            width={width} 
                            renderTextLayer={false} 
                            renderAnnotationLayer={false}
                            className="bg-white rounded-md overflow-hidden"
                        />
                    )}
                </Document>
            </div>
        </div>
    );
}
