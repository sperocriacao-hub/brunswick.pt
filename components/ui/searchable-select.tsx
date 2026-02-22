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
                    className={cn("w-full justify-between bg-white font-normal", !value && "text-muted-foreground", className)}
                >
                    {value
                        ? options.find((option) => option.value === value)?.label
                        : placeholder}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0 bg-white" align="start">
                <Command>
                    <CommandInput placeholder="Localizar..." />
                    <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty>Nenhum item encontrado.</CommandEmpty>
                        <CommandGroup>
                            {options.map((option) => (
                                <CommandItem
                                    key={option.value}
                                    value={option.label} // Search by label
                                    onSelect={(currentValue) => {
                                        // cmdk returns the value/label lowercased as 'value'.
                                        // We rely on the index or finding the match.
                                        // But here we want the original value.
                                        // The safest is to search by the label we passed.
                                        const selected = options.find(o => o.label.toLowerCase() === currentValue.toLowerCase());
                                        if (selected) onChange(selected.value);
                                        setOpen(false)
                                    }}
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
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
