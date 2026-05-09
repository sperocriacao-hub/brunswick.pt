"use client"

import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

export interface SearchableOption {
    value: string;
    label: string;
}

interface SearchableSelectProps {
    options: SearchableOption[];
    value?: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string; // Add className prop
}

export function SearchableSelect({ options, value, onChange, placeholder = "Selecione...", className }: SearchableSelectProps) {
    const [open, setOpen] = React.useState(false)

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={open}
                    className={cn("w-full justify-between bg-white font-medium text-slate-800", !value && "text-slate-400 font-normal", className)}
                >
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white" align="start">
                <Command className="touch-pan-y">
                    <CommandInput placeholder="Localizar..." />
                    <CommandList className="max-h-[250px] overflow-y-auto overscroll-contain touch-pan-y pointer-events-auto">
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label}
                                    onSelect={(currentValue) => {
                                        const selected = options.find(o => o.label.toLowerCase() === currentValue.toLowerCase());
                                        if (selected) onChange(selected.value);
                                        setOpen(false)
                                    }}
                                    onClick={() => {
                                        onChange(option.value);
                                        setOpen(false);
                                    }}
                                    className="cursor-pointer py-3 text-slate-800 font-medium"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4 text-slate-800",
                                            value === option.value ? "opacity-100" : "opacity-0"
                                        )}
                                    />
                                    {option.label}
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    )
}
