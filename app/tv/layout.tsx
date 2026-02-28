import React from 'react';

export default function TVLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // Layout exclusivo para TVs de 55"
    // Sem Sidebar, fundo 100% negro para poupança de energia e contraste máximo
    return (
        <div className="w-screen h-screen overflow-hidden bg-black text-white selection:bg-rose-500/30">
            {children}
        </div>
    );
}
