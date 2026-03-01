const fs = require('fs');
const file = './app/admin/Sidebar.tsx';
let txt = fs.readFileSync(file, 'utf8');

const target = `<span className="text-sm border-transparent">Gestão de Ecrãs (TVs)</span>
                                </Link>
                            </nav>`;

const injection = `
                            <p className="px-3 text-[10px] font-extrabold text-[#f59e0b] uppercase tracking-widest mb-2 mt-4">Lean & Manufatura Lean</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/lean/kaizen" className={\`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium \${pathname.includes('/admin/lean/kaizen') ? 'bg-amber-600 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}\`}>
                                    <Lightbulb size={18} className={pathname.includes('/admin/lean/kaizen') ? 'text-white' : 'text-amber-400'} />
                                    <span className="text-sm border-transparent">Ideias Kaizen</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/lean/gemba" className={\`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium \${pathname.includes('/admin/lean/gemba') ? 'bg-amber-600 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}\`}>
                                    <Footprints size={18} className={pathname.includes('/admin/lean/gemba') ? 'text-white' : 'text-amber-400'} />
                                    <span className="text-sm border-transparent">Gemba Walks</span>
                                </Link>
                                <Link onClick={() => setIsOpen(false)} href="/admin/lean/acoes" className={\`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium \${pathname.includes('/admin/lean/acoes') ? 'bg-amber-600 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}\`}>
                                    <ListTodo size={18} className={pathname.includes('/admin/lean/acoes') ? 'text-white' : 'text-amber-400'} />
                                    <span className="text-sm border-transparent">Scrum Board (Ações)</span>
                                </Link>
                            </nav>

                            <p className="px-3 text-[10px] font-extrabold text-[#f43f5e] uppercase tracking-widest mb-2 mt-4">Saúde, Seg. e Ambiente</p>
                            <nav className="flex flex-col gap-1 mb-6">
                                <Link onClick={() => setIsOpen(false)} href="/admin/hst/ocorrencias" className={\`flex items-center gap-3 rounded-md px-3 py-2 transition-all font-medium \${pathname.includes('/admin/hst/ocorrencias') ? 'bg-rose-600 text-white shadow-sm border border-transparent' : 'text-blue-100 hover:bg-blue-800/50 hover:text-white'}\`}>
                                    <Crosshair size={18} className={pathname.includes('/admin/hst/ocorrencias') ? 'text-white' : 'text-rose-400'} />
                                    <span className="text-sm border-transparent">Registar Ocorrência</span>
                                </Link>
                            </nav>`;

if(txt.includes(target) && !txt.includes("Lean & Manufatura Lean")) {
    txt = txt.replace(target, target + injection);
    fs.writeFileSync(file, txt);
    console.log("Patched successfully!");
} else {
    console.error("Target completely missing or already patched.");
}
