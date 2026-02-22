"use client";

import React, { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserCheck, HelpCircle, Save, AlertTriangle, UserCircle2 } from 'lucide-react';
import { AvaliacaoDTO, submeterAvaliacaoDiaria } from './actions';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";

type Operador = {
    id: string;
    numero_operador: string;
    nome_operador: string;
    funcao: string;
};

export default function PaginaAvaliacaoDiaria() {
    const supabase = createClient();
    const [operadores, setOperadores] = useState<Operador[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const [editingOp, setEditingOp] = useState<Operador | null>(null);

    const [grades, setGrades] = useState({
        hst: 4.0, epi: 4.0, limpeza: 4.0, qualidade: 4.0,
        eficiencia: 4.0, objetivos: 4.0, atitude: 4.0
    });

    const [justificacoes, setJustificacoes] = useState<Record<string, string>>({});

    useEffect(() => {
        carregarLista();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [supabase]);

    const carregarLista = async () => {
        setIsLoading(true);
        const { data } = await supabase
            .from('operadores')
            .select('id, numero_operador, nome_operador, funcao')
            .eq('status', 'Ativo')
            .order('nome_operador');

        if (data) setOperadores(data as Operador[]);
        setIsLoading(false);
    };

    const abrirAvaliacao = (op: Operador) => {
        setEditingOp(op);
        setGrades({ hst: 4.0, epi: 4.0, limpeza: 4.0, qualidade: 4.0, eficiencia: 4.0, objetivos: 4.0, atitude: 4.0 });
        setJustificacoes({});
    };

    const fecharAvaliacao = () => setEditingOp(null);

    const handleGradeChange = (key: keyof typeof grades, value: number) => {
        setGrades(prev => ({ ...prev, [key]: value }));
        if (value >= 2.0) {
            setJustificacoes(prev => {
                const next = { ...prev };
                delete next[key];
                return next;
            });
        }
    };

    const getEixosCriticos = () => {
        return Object.keys(grades).filter(k => grades[k as keyof typeof grades] < 2.0);
    };

    const submeter = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingOp) return;

        const criticos = getEixosCriticos();
        const justificacoesFalta = criticos.filter(ch => !justificacoes[ch] || justificacoes[ch].trim() === '');
        if (justificacoesFalta.length > 0) {
            alert("Precisa de justificar todas as notas inferiores a 2.0 antes de submeter a avaliação.");
            return;
        }

        const dto: AvaliacaoDTO = {
            funcionario_id: editingOp.id,
            nomeFuncionario: editingOp.nome_operador,
            ...grades,
            justificacoes
        };

        const res = await submeterAvaliacaoDiaria(dto, "Supervisor Brunswick");

        if (res.success) {
            alert(`Avaliação de ${editingOp.nome_operador} gravada com sucesso!`);
            fecharAvaliacao();
        } else {
            alert(`Erro na Submissão: ${res.error}`);
        }
    };

    return (
        <div className="container mx-auto py-6 max-w-6xl animate-fade-in">
            <header className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <UserCheck className="text-primary" size={32} />
                    <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Avaliações Diárias</h1>
                </div>
                <p className="text-muted-foreground mt-2 font-medium">
                    Registo Contínuo de Desempenho (Matriz ILUO) para Técnicos e Operadores Ativos.
                </p>
            </header>

            <Card className="shadow-sm border-muted/60">
                <CardHeader className="bg-muted/30 border-b pb-4">
                    <CardTitle className="text-lg text-foreground">A Minha Equipa</CardTitle>
                    <CardDescription>
                        Selecione um operador na tabela abaixo para iniciar o processo de avaliação de turno.
                    </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="text-center py-12 text-muted-foreground animate-pulse">A carregar registos ativos da fábrica...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/10 hover:bg-muted/10">
                                        <TableHead className="w-[300px] font-semibold">Colaborador</TableHead>
                                        <TableHead className="font-semibold">Nº Mecanográfico</TableHead>
                                        <TableHead className="font-semibold">Cargo / Função</TableHead>
                                        <TableHead className="text-right font-semibold pr-6">Ação</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {operadores.map(op => (
                                        <TableRow key={op.id} className="transition-colors hover:bg-muted/50 group">
                                            <TableCell className="py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                        <UserCircle2 size={20} className="text-primary" />
                                                    </div>
                                                    <span className="font-bold text-foreground">{op.nome_operador}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="font-mono text-sm text-muted-foreground">{op.numero_operador}</TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className="font-normal tracking-wide text-xs">{op.funcao || 'N/A'}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-6">
                                                <Button variant="default" size="sm" onClick={() => abrirAvaliacao(op)} className="opacity-80 group-hover:opacity-100 transition-opacity">
                                                    Atribuir Classificação
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={!!editingOp} onOpenChange={(open) => !open && fecharAvaliacao()}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 gap-0">
                    <div className="p-6 border-b bg-muted/20">
                        <DialogHeader>
                            <DialogTitle className="text-xl flex gap-2 items-center">
                                <UserCheck className="text-primary" size={20} />
                                Avaliação de Desempenho
                            </DialogTitle>
                            <DialogDescription className="text-sm">
                                Registo de Atividade do Turno para <span className="font-bold text-foreground">{editingOp?.nome_operador}</span>
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <form onSubmit={submeter} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="border-b pb-2 mb-4">
                                    <h4 className="text-sm font-bold text-muted-foreground tracking-wider uppercase">Dimensões de Avaliação</h4>
                                </div>
                                {[
                                    { key: 'hst', label: 'Segurança (HST)' },
                                    { key: 'epi', label: 'Uso de EPI' },
                                    { key: 'limpeza', label: 'Limpeza e 5S' },
                                    { key: 'qualidade', label: 'Qualidade do Registo' },
                                    { key: 'eficiencia', label: 'Eficiência de Ciclo' },
                                    { key: 'objetivos', label: 'Metas / Objetivos Diários' },
                                    { key: 'atitude', label: 'Atitude / Trabalho Equipa' },
                                ].map((item) => (
                                    <div key={item.key} className="p-4 rounded-xl border bg-card shadow-sm hover:border-primary/40 transition-colors">
                                        <div className="flex justify-between items-center mb-3">
                                            <label className="text-sm font-bold text-foreground">{item.label}</label>
                                            <Badge variant={grades[item.key as keyof typeof grades] < 2.0 ? 'destructive' : 'default'} className="font-mono shadow-sm">
                                                {grades[item.key as keyof typeof grades].toFixed(1)}
                                            </Badge>
                                        </div>
                                        <input
                                            type="range" min="0" max="4" step="0.5"
                                            className="w-full accent-primary h-2 bg-muted rounded-lg appearance-none cursor-pointer"
                                            value={grades[item.key as keyof typeof grades]}
                                            onChange={(e) => handleGradeChange(item.key as keyof typeof grades, parseFloat(e.target.value))}
                                        />
                                        <div className="flex justify-between mt-2 text-[11px] text-muted-foreground font-mono font-medium">
                                            <span>Critico (0)</span>
                                            <span>Alvo (2)</span>
                                            <span>Excelência (4)</span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div className="border-b pb-2 mb-4">
                                    <h4 className="text-sm font-bold text-destructive tracking-wider uppercase flex items-center gap-2">
                                        <AlertTriangle size={16} /> Apontamentos Obrigatórios
                                    </h4>
                                </div>

                                {getEixosCriticos().length === 0 ? (
                                    <div className="h-full min-h-[300px] flex flex-col items-center justify-center text-center p-8 bg-muted/40 rounded-xl border border-dashed text-muted-foreground">
                                        <HelpCircle size={48} className="mb-4 opacity-40" />
                                        <p className="text-sm font-semibold text-foreground/70">Métricas Saudáveis</p>
                                        <p className="text-xs mt-1 max-w-xs">Nenhum parâmetro inferior a <span className="font-mono">2.0</span>. As Justificações Extraordinárias não são exigidas neste turno.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {getEixosCriticos().map(k => (
                                            <div key={k} className="p-4 rounded-xl bg-destructive/5 border border-destructive/20 animate-fade-in shadow-sm">
                                                <label className="text-xs text-destructive font-bold mb-3 block uppercase tracking-wide">
                                                    Contexto Requerido para: {k}
                                                </label>
                                                <Textarea
                                                    className="w-full bg-background border-destructive/30 resize-none h-24 text-sm shadow-inner"
                                                    placeholder={`Detalhe minuciosamente o motivo da quebra pontual neste KPI...`}
                                                    required
                                                    value={justificacoes[k] || ''}
                                                    onChange={(e) => setJustificacoes(prev => ({ ...prev, [k]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-8 pt-6 border-t border-border gap-4 sm:gap-0">
                            <Button type="button" variant="outline" onClick={fecharAvaliacao}>Descartar Matriz</Button>
                            <Button type="submit" className="gap-2 shadow-sm font-bold">
                                <Save size={16} /> Gravar e Fechar Turno
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
