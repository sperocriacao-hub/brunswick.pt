import re

file_path = "/Users/alessandromoura/.gemini/antigravity/playground/brunswick-pt/app/admin/lean/5s/page.tsx"
with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update TabsList
old_tabs_list = """<TabsList className="mb-6 grid w-full max-w-2xl grid-cols-3">
                    <TabsTrigger value="historico" className="font-bold">Histórico de Rondas</TabsTrigger>
                    <TabsTrigger value="acoes" className="font-bold text-rose-600 data-[state=active]:bg-rose-600 data-[state=active]:text-white">Planos de Ação (A3)</TabsTrigger>
                    <TabsTrigger value="kpis" className="font-bold text-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">KPIs & Gincana</TabsTrigger>
                </TabsList>"""

new_tabs_list = """<TabsList className="mb-6 grid w-full max-w-4xl grid-cols-4">
                    <TabsTrigger value="historico" className="font-bold">Histórico de Rondas</TabsTrigger>
                    <TabsTrigger value="comite" className="font-bold text-indigo-600 data-[state=active]:bg-indigo-600 data-[state=active]:text-white">Comitê 5S (Triagem)</TabsTrigger>
                    <TabsTrigger value="kanban" className="font-bold text-emerald-600 data-[state=active]:bg-emerald-600 data-[state=active]:text-white">Scrum Board (8D)</TabsTrigger>
                    <TabsTrigger value="kpis" className="font-bold text-amber-600 data-[state=active]:bg-amber-600 data-[state=active]:text-white">KPIs & Gincana</TabsTrigger>
                </TabsList>"""

content = content.replace(old_tabs_list, new_tabs_list)

# 2. Extract and replace the acoes TabsContent
start_str = '<TabsContent value="acoes">'
end_str = '</TabsContent>'

start_idx = content.find(start_str)
end_idx = content.find(end_str, start_idx + len(start_str)) + len(end_str)

new_tabs_content = """<TabsContent value="comite" className="space-y-6">
                <Card className="border-0 shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50 border-b pb-4">
                        <CardTitle className="flex justify-between items-center text-lg">
                            <span className="flex items-center gap-2"><Target className="text-indigo-500"/> Comitê 5S (Avaliação de Apontamentos)</span>
                        </CardTitle>
                    </CardHeader>
                    <Table>
                        <TableHeader className="bg-slate-50 border-b">
                            <TableRow>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs h-12">Falha / Apontamento</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Local</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Responsável</TableHead>
                                <TableHead className="font-bold text-slate-500 uppercase text-xs">Status</TableHead>
                                <TableHead className="text-right"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {acoes.filter(a => a.status === 'Em Analise').length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center text-slate-500">Nenhum apontamento a aguardar análise do Comitê.</TableCell>
                                </TableRow>
                            ) : acoes.filter(a => a.status === 'Em Analise').map(acao => (
                                <TableRow key={acao.id} className="hover:bg-slate-50 transition-colors">
                                    <TableCell className="font-bold text-slate-800 py-4 max-w-sm" title={acao.descricao_acao}>{acao.descricao_acao}</TableCell>
                                    <TableCell className="text-slate-600">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-xs uppercase">{acao.areas_fabrica?.nome_area || 'Universal'}</span>
                                            {acao.linhas_producao && <span className="text-xs text-slate-400">Linha {acao.linhas_producao.letra_linha}</span>}
                                            {acao.estacoes && <span className="text-xs text-slate-400">{acao.estacoes.nome_estacao}</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {acao.operadores ? (
                                            <span className="text-sm font-medium text-slate-700">{acao.operadores.nome_operador}</span>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Não atribuído</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <span className="px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-widest bg-indigo-100 text-indigo-700">
                                            {acao.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button onClick={() => openEvaluationModal(acao)} className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold h-8">
                                            Avaliar Impacto
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </Card>
            </TabsContent>

            <TabsContent value="kanban">
                <div className="flex flex-col lg:flex-row gap-6 w-full items-start">
                    {StatusColumns.map(columnId => {
                        const colItems = acoes.filter(a => a.status === columnId);
                        
                        let headerTheme = "bg-rose-50 text-rose-800 border-rose-200";
                        if (columnId === 'Em Investigacao') headerTheme = "bg-indigo-100 text-indigo-800 border-indigo-200";
                        if (columnId === 'Validacao') headerTheme = "bg-amber-100 text-amber-800 border-amber-200";
                        if (columnId === 'Concluido') headerTheme = "bg-emerald-100 text-emerald-800 border-emerald-200";

                        return (
                            <div 
                                key={columnId} 
                                className="flex-1 w-full flex flex-col gap-4 rounded-2xl transition-all"
                                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-rose-400', 'ring-offset-4'); }}
                                onDragLeave={e => e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-4')}
                                onDrop={e => {
                                    e.preventDefault();
                                    e.currentTarget.classList.remove('ring-2', 'ring-rose-400', 'ring-offset-4');
                                    if (draggedItem) moveCard(draggedItem, columnId);
                                }}
                            >
                                <div className={`px-4 py-3 rounded-xl border flex justify-between items-center font-black uppercase tracking-widest ${headerTheme}`}>
                                    <div className="flex items-center gap-2">{columnId}</div>
                                    <span className="bg-white/50 text-black/60 px-2 py-0.5 rounded text-xs leading-none">{colItems.length}</span>
                                </div>

                                <div className="flex flex-col gap-3 min-h-[500px] border-2 border-dashed border-slate-200 rounded-2xl p-4 bg-slate-100/30">
                                    {colItems.length === 0 ? (
                                        <div className="h-full flex items-center justify-center text-slate-400 text-sm font-semibold uppercase tracking-widest p-8 text-center italic">Vazio</div>
                                    ) : (
                                        colItems.map(task => (
                                            <Card
                                                key={task.id}
                                                draggable
                                                onDragStart={() => setDraggedItem(task.id)}
                                                onDragEnd={() => setDraggedItem(null)}
                                                onClick={() => openA3Modal(task)}
                                                className="cursor-grab active:cursor-grabbing border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all group relative bg-white overflow-hidden"
                                            >
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                                <CardContent className="p-4 pl-5">
                                                    <div className="text-[10px] font-mono text-slate-400 mb-2">
                                                        {new Date(task.created_at).toLocaleDateString()}
                                                    </div>
                                                    <h3 className="font-bold text-slate-800 leading-tight mb-2 text-sm">{task.descricao_acao}</h3>
                                                    <div className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded inline-block">
                                                        {task.areas_fabrica?.nome_area || 'Global'}
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </TabsContent>"""

content = content[:start_idx] + new_tabs_content + content[end_idx:]

with open(file_path, "w", encoding="utf-8") as f:
    f.write(content)
