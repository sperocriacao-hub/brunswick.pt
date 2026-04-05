"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Star, Send, Handshake, AlertTriangle, MessageSquare, ShieldCheck, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface BottomUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    operadoresAtivos: any[]; // Os operadores picados no posto
    onSubmitAvaliacao: (rfid: string, liderNome: string, scores: any, feedback: string) => Promise<void>;
}

export function BottomUpModal({ isOpen, onClose, operadoresAtivos, onSubmitAvaliacao }: BottomUpModalProps) {
    const [selectedOperador, setSelectedOperador] = useState<any | null>(null);
    const [scores, setScores] = useState<Record<string, number>>({
        seguranca: 0,
        justica: 0,
        comunicacao: 0,
        autonomia: 0
    });
    const [feedback, setFeedback] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successMode, setSuccessMode] = useState(false);

    // Encontre operadores que tenham um Líder ou Supervisor
    const operadoresComChefe = operadoresAtivos.filter(op => op.lider_nome || op.supervisor_nome);

    const handleStarClick = (category: string, value: number) => {
        setScores(prev => ({ ...prev, [category]: value }));
    };

    const isFormValid = scores.seguranca > 0 && scores.justica > 0 && scores.comunicacao > 0 && scores.autonomia > 0;

    const handleSubmit = async () => {
        if (!selectedOperador || !isFormValid) return;
        setIsSubmitting(true);
        const liderAlvo = selectedOperador.lider_nome || selectedOperador.supervisor_nome;
        
        try {
            await onSubmitAvaliacao(selectedOperador.rfid, liderAlvo, scores, feedback);
            setSuccessMode(true);
            setTimeout(() => {
                setSuccessMode(false);
                setSelectedOperador(null);
                setScores({ seguranca: 0, justica: 0, comunicacao: 0, autonomia: 0 });
                setFeedback('');
                onClose();
            }, 3000);
        } catch (error) {
            console.error("Erro", error);
            alert("Erro ao submeter avaliação");
        } finally {
            setIsSubmitting(false);
        }
    };

    const criteria = [
        { id: 'seguranca', title: 'Segurança & Ambiente', icon: ShieldCheck, desc: 'O teu chefe garante que não corres riscos na linha?' },
        { id: 'justica', title: 'Respeito & Justiça', icon: Handshake, desc: 'Sentes que és tratado com justiça e sem favoritismos?' },
        { id: 'comunicacao', title: 'Comunicação', icon: MessageSquare, desc: 'O teu chefe explica bem os objetivos diários (OEE, Qualidade)?' },
        { id: 'autonomia', title: 'Apoio (Autonomia)', icon: User, desc: 'Dão-te ouvidos quando sugeres uma melhoria no posto?' },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[700px] bg-slate-900 border-slate-800 text-slate-200 shadow-2xl">
                {!successMode ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                                <Star className="text-emerald-500 fill-emerald-500" size={28} />
                                Avaliação de Chefia (Mentoria)
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 text-lg">
                                Confidencial e anónimo no Chão de Fábrica. A tua voz ajuda a melhorar quem te lidera.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="py-2">
                            {!selectedOperador ? (
                                <div className="space-y-4">
                                    <h3 className="text-sm font-bold uppercase text-slate-500 tracking-widest">
                                        Quem és tu? (Seleciona o teu perfil)
                                    </h3>
                                    {operadoresComChefe.length === 0 ? (
                                        <div className="p-8 text-center text-red-400 bg-red-950/20 rounded-xl border border-red-900/50">
                                            <AlertTriangle size={32} className="mx-auto mb-3 opacity-50" />
                                            Nenhum operador com chefia atribuída picou ponto nesta Estação!
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-4">
                                            {operadoresComChefe.map(op => (
                                                <button
                                                    key={op.rfid}
                                                    onClick={() => setSelectedOperador(op)}
                                                    className="flex items-center gap-3 p-4 bg-slate-800 border border-slate-700 hover:border-emerald-500 rounded-xl transition-all hover:bg-slate-800/80 text-left"
                                                >
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center font-bold text-slate-300">
                                                        {op.nome?.substring(0,2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-200">{op.nome}</p>
                                                        <p className="text-[10px] text-slate-500 uppercase tracking-widest">
                                                            Avalia: <strong className="text-emerald-500">{op.lider_nome || op.supervisor_nome}</strong>
                                                        </p>
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-6 slide-in-from-right-4 animate-in duration-300">
                                    <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <div>
                                            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">A avaliar Líder/Supervisor:</p>
                                            <p className="text-lg font-bold text-emerald-400">
                                                {selectedOperador.lider_nome || selectedOperador.supervisor_nome}
                                            </p>
                                        </div>
                                        <button onClick={() => setSelectedOperador(null)} className="text-xs text-slate-500 hover:text-white underline">
                                            Trocar Operário
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {criteria.map(crit => {
                                            const Icon = crit.icon;
                                            return (
                                                <div key={crit.id} className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/50">
                                                    <div className="flex items-start gap-4">
                                                        <div className="mt-1 p-2 bg-slate-900 rounded-lg text-emerald-500"><Icon size={20} /></div>
                                                        <div className="flex-1">
                                                            <div className="flex justify-between items-center mb-2">
                                                                <h4 className="font-bold text-slate-200 uppercase tracking-wider text-sm">{crit.title}</h4>
                                                                <div className="flex gap-1">
                                                                    {[1,2,3,4,5].map(star => (
                                                                        <button 
                                                                            key={star}
                                                                            onClick={() => handleStarClick(crit.id, star)}
                                                                            className={`p-1 transition-all hover:scale-125 ${
                                                                                // @ts-ignore
                                                                                (scores[crit.id] >= star) ? 'text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]' : 'text-slate-600'
                                                                            }`}
                                                                        >
                                                                            <Star size={24} className={/* @ts-ignore */ scores[crit.id] >= star ? "fill-amber-400" : ""} />
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <p className="text-xs text-slate-400">{crit.desc}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    <div className="pt-2 border-t border-slate-800">
                                        <Label className="uppercase text-xs font-bold text-slate-500 tracking-widest mb-2 block">Tens algo mais a dizer? (Opcional)</Label>
                                        <Textarea 
                                            value={feedback}
                                            onChange={(e) => setFeedback(e.target.value)}
                                            placeholder="Gosto muito quando o chefe nos elogia. Acho que deviamos..."
                                            className="bg-slate-950 border-slate-800 text-slate-300 resize-none"
                                            rows={2}
                                        />
                                    </div>

                                    <Button 
                                        disabled={!isFormValid || isSubmitting}
                                        onClick={handleSubmit}
                                        className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-[0_0_20px_rgba(5,150,105,0.4)] transition-all disabled:opacity-50 disabled:shadow-none"
                                    >
                                        {isSubmitting ? 'A carregar para Nuvem...' : 'Submeter Avaliação Anónima'}
                                        {!isSubmitting && <Send size={18} className="ml-2" />}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="p-12 flex flex-col items-center justify-center text-center space-y-6 animate-in zoom-in-95 duration-500">
                        <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center border-4 border-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.5)]">
                            <Star className="text-emerald-400 fill-emerald-400 w-12 h-12" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-emerald-400 uppercase tracking-widest mb-2">Sucesso!</h2>
                            <p className="text-slate-400 text-lg">A tua opinião foi enviada para a Mentoria de Gestão.<br/>Obrigado pelo teu rigor Lean!</p>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
