"use client"

import React, { useState, useRef, useEffect } from "react"
import { Check, ChevronsUpDown, Search } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface SearchableOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
}

export function SearchableSelect({ options, value, onChange, placeholder = "Selecione...", className }: SearchableSelectProps) {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const containerRef = useRef<HTMLDivElement>(null);

    // Fechar ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent | TouchEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("touchstart", handleClickOutside, { passive: true });
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, []);

    const filteredOptions = options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="relative w-full" ref={containerRef}>
            <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={open}
                onClick={() => setOpen(!open)}
                className={cn("w-full justify-between bg-white font-medium text-slate-800", !value && "text-slate-400 font-normal", className)}
            >
                {value ? options.find(o => o.value === value)?.label : placeholder}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>

            {open && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <input
                            type="text"
                            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground"
                            placeholder="Localizar..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            // Em mobile, autoFocus pode ser chato porque abre o teclado logo. 
                            // No entanto, como é "Searchable", é expectável.
                        />
                    </div>
                    <div className="max-h-[250px] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto">
                        {filteredOptions.length === 0 ? (
                            <div className="py-6 text-center text-sm text-slate-500">Nenhum item encontrado.</div>
                        ) : (
                            <div className="p-1">
                                {filteredOptions.map((option) => (
                                    <div
                                        key={option.value}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onChange(option.value);
                                            setOpen(false);
                                            setSearchTerm("");
                                        }}
                                        className={cn(
                                            "relative flex cursor-pointer select-none items-center rounded-sm px-2 py-3 text-sm outline-none hover:bg-slate-100 font-medium text-slate-800 transition-colors",
                                            value === option.value && "bg-slate-100"
                                        )}
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4 text-blue-600",
                                                value === option.value ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {option.label}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
