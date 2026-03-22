'use client';

import { useState } from 'react';
import { BookOpen, Map, Settings, Users, Activity, Layers, Crosshair, Box, Target, CalendarDays, ShieldAlert, Cpu } from 'lucide-react';
import Image from 'next/image';

const STAGES = [
  {
    id: 'setup',
    title: 'Fase 1: Motor Fabril (Setup)',
    icon: <Settings size={20} />,
    description: 'A anatomia do Chão de Fábrica e do Calendário de Produção Central.',
    modules: [
      {
        name: 'Mapeamento de Linhas e Estações',
        desc: 'As fundações do APS. Define onde os barcos passam e onde os terminais HMI vão intercetar o operador.',
        img: '/manual/configuracao_fabrica_1774130535439.png',
        route: '/admin/fabrica'
      },
      {
        name: 'Calendário e Feriados Globais',
        desc: 'Para o motor de escalonamento ser exato, os Dias Não-Laborais e Feriados trancam a alocação do Gantt.',
        img: '/manual/configuracao_feriados_1774130580530.png',
        route: '/admin/configuracoes'
      }
    ]
  },
  {
    id: 'rh',
    title: 'Fase 2: Identidades & Talento',
    icon: <Users size={20} />,
    description: 'Não há produção sem capital humano. O M.E.S avalia e rastreia o rasto digital de cada operador.',
    modules: [
      {
        name: 'Cadastro & Cartões RFID',
        desc: 'Onboarding do operador. Vincula a pessoa à máquina e cria a identidade digital para login no Terminal.',
        img: '/manual/rh_cadastro_v2_1774130431206.png',
        route: '/admin/rh/cadastro'
      },
      {
        name: 'Floor Balancing (Tempo-Real)',
        desc: 'Cruzamento estético entre o Headcount Ativo e o SLA da linha. Identificação visual de gargalos por absentismo.',
        img: '/manual/rh_assiduidade_1774130363981.png',
        route: '/admin/rh/assiduidade'
      },
      {
        name: 'Radar de Skills e Avaliações',
        desc: 'Feedback de desempenho diário apurando a polivalência (ILUO) do laminador e polidor.',
        img: '/manual/rh_avaliacoes_1774130386560.png',
        route: '/admin/rh/avaliacoes'
      }
    ]
  },
  {
    id: 'eng',
    title: 'Fase 3: Engenharia B.O.M.',
    icon: <Cpu size={20} />,
    description: 'Transformar papel e designs CAD numa Árvore de Rastreabilidade exata para nascer um barco.',
    modules: [
      {
        name: 'Catálogo PDM (Modelos & Peças)',
        desc: 'O passaporte do Navio. Associa as Horas Ganhas (SLA Base) aos módulos encomendados.',
        img: '/manual/engenharia_modelos_1774130835439.png',
        route: '/admin/modelos'
      },
      {
        name: 'Gestor TPM de Moldes',
        desc: 'Tracking de Utilização. Quantos ciclos faltam até o molde rebentar? A manutenção preventiva ataca antes da quebra.',
        img: '/manual/molds_list_empty_1774124510241.png',
        route: '/admin/engenharia/moldes'
      },
      {
        name: 'O Cérebro APS (Regras de Trajeto)',
        desc: 'Nenhum barco vai para a Estufa antes de Laminar. As Regras fecham offsets de dias para o Master Planner.',
        img: '/manual/engenharia_regras_1774130887018.png',
        route: '/admin/engenharia/regras'
      },
      {
        name: 'Roteiros de Produção',
        desc: 'Acoplagem de uma "Peça" do B.O.M. a uma "Estação". Se não há roteiro, a Ordem de Fabrico recusa arrancar.',
        img: '/manual/eng_roteiros_1774131189331.png',
        route: '/admin/engenharia/roteiros'
      }
    ]
  },
  {
    id: 'aps',
    title: 'Fase 4: Torre de Controlo (APS)',
    icon: <Map size={20} />,
    description: 'O algoritmo em ação. Transformar o "Querer" num Plano Executável no tempo e no espaço.',
    modules: [
      {
        name: 'Gantt & Order Backlog',
        desc: 'Arrastamento visual (Drag-n-Drop). A inteligência artificial estica os Work-In-Progress evadindo os feriados.',
        img: '/manual/control_tower_gantt_chart_1774127925977.png',
        route: '/admin/producao/aps'
      }
    ]
  },
  {
    id: 'shopfloor',
    title: 'Fase 5: Chão de Fábrica J.I.T.',
    icon: <Box size={20} />,
    description: 'A mecânica Pull. Quando a Torre manda executar, o armazém desperta e as máquinas começam a rolar.',
    modules: [
      {
        name: 'Hub de Picking (Empilhador)',
        desc: 'O Kitting Logístico entra em pânico controlado. O ecrã dita os componentes a abastecer à estação certa.',
        img: '/manual/logistics_tablet_kitting_1774128038755.png',
        route: '/logistica/picking'
      },
      {
        name: 'Terminal HMI do Operador',
        desc: 'A visão do operário sem papel. Interface hiper-responsiva para bater pontos operacionais e disparar gatilhos Andon de problemas.',
        img: '/manual/shopfloor_hmi_operador_1774128185966.png',
        route: '/operador'
      }
    ]
  }
];

export default function ManualUtilizador() {
  const [activeStage, setActiveStage] = useState(STAGES[0].id);

  const stageData = STAGES.find(s => s.id === activeStage);

  return (
    <div className="animate-fade-in p-6 lg:p-10 max-w-[1600px] mx-auto min-h-[90vh] flex flex-col">
      {/* HEADER DE COMANDO */}
      <div className="mb-10 text-center lg:text-left flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-[rgba(255,255,255,0.05)] pb-6 relative">
        <div className="absolute top-[-50px] right-[-100px] w-96 h-96 bg-blue-500 rounded-full mix-blend-screen filter blur-[150px] opacity-10 pointer-events-none"></div>
        <div>
          <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-white to-blue-100 flex items-center gap-4 justify-center lg:justify-start">
            <BookOpen size={40} className="text-blue-400" />
            Manual de Bordo (M.E.S. Core)
          </h1>
          <p className="text-slate-400 mt-2 text-lg font-light tracking-wide">
            O Guia Galáctico da Brunswick. Do Nascimento do Molde à Linha de Água.
          </p>
        </div>
        <div className="flex gap-4">
            <div className="px-6 py-3 rounded-full bg-[rgba(15,23,42,0.6)] border border-[rgba(255,255,255,0.1)] text-cyan-300 font-mono text-sm shadow-[0_0_20px_rgba(34,211,238,0.05)]">
                /// PROTOCOLO 01-A
            </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 flex-1">
        {/* ESQUERDA: Timeline/Stepper Espacial */}
        <div className="w-full lg:w-80 shrink-0">
          <div className="glass-panel p-2 sticky top-[100px] rounded-2xl border border-[rgba(255,255,255,0.05)] overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none"></div>
            
            {STAGES.map((s, idx) => {
              const isActive = activeStage === s.id;
              return (
                <div 
                    key={s.id} 
                    onClick={() => setActiveStage(s.id)}
                    className={`
                      relative group cursor-pointer rounded-xl p-4 transition-all duration-300 mb-2 border
                      ${isActive 
                        ? 'bg-blue-900/40 border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' 
                        : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.02)] hover:border-[rgba(255,255,255,0.1)]'}
                    `}
                >
                  {/* Linha de Conexão Vertical */}
                  {idx !== STAGES.length -1 && (
                      <div className={`absolute left-[33px] top-[45px] bottom-[-20px] w-0.5 z-0 ${isActive || STAGES.findIndex(x => x.id === activeStage) > idx ? 'bg-blue-500/50' : 'bg-[rgba(255,255,255,0.05)]'}`}></div>
                  )}

                  <div className="relative z-10 flex items-center gap-4">
                    <div className={`
                        w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-all duration-500
                        ${isActive 
                            ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.6)]' 
                            : 'bg-[#0f172a] border-[rgba(255,255,255,0.1)] text-slate-400 group-hover:text-blue-200'}
                    `}>
                        {s.icon}
                    </div>
                    <div>
                        <div className={`font-bold tracking-tight transition-colors ${isActive ? 'text-blue-100' : 'text-slate-300'}`}>
                            {s.title}
                        </div>
                        <div className={`text-xs mt-1 transition-colors line-clamp-2 ${isActive ? 'text-blue-300/80' : 'text-slate-500'}`}>
                            {s.description}
                        </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* DIREITA: Display do Content (View Port Central) */}
        <div className="flex-1 min-w-0">
            {stageData && (
                <div key={stageData.id} className="animate-in fade-in slide-in-from-right-8 duration-700 ease-out flex flex-col gap-6">
                    <div className="glass-panel p-6 border-l-4 border-blue-500 rounded-xl bg-gradient-to-br from-[rgba(15,23,42,0.8)] to-[rgba(15,23,42,0.4)]">
                        <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-3">
                           {stageData.icon} Visão Detalhada: {stageData.title}
                        </h2>
                        <p className="text-slate-300 font-light text-lg">
                            {stageData.description}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-8">
                        {stageData.modules.map((mod, i) => (
                            <div key={i} className="glass-panel rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.08)] bg-[#0f172a] group hover:border-blue-500/30 transition-colors">
                                <div className="p-6 bg-gradient-to-b from-[rgba(255,255,255,0.03)] to-transparent border-b border-[rgba(255,255,255,0.05)]">
                                    <h3 className="text-2xl font-bold text-blue-100 mb-2 tracking-tight">
                                        {mod.name}
                                    </h3>
                                    <p className="text-slate-400">
                                        {mod.desc}
                                    </p>
                                </div>
                                <div className="relative w-full aspect-[16/9] bg-[#020617] p-4 flex items-center justify-center">
                                    {/* Efeito Inner Shadow Over the Image for the "Screen" feel */}
                                    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_50px_rgba(0,0,0,0.8)] z-10"></div>
                                    <Image 
                                        src={mod.img} 
                                        alt={mod.name} 
                                        fill
                                        style={{ objectFit: 'contain' }}
                                        className="rounded-lg shadow-[0_0_30px_rgba(0,0,0,0.5)] z-0 transition-transform duration-1000 group-hover:scale-[1.02]"
                                        unoptimized
                                    />
                                    
                                    {/* Rotação Fast Link Hover */}
                                    <div className="absolute bottom-6 right-6 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <a href={mod.route} target="_blank" className="flex items-center gap-2 px-4 py-2 bg-blue-600/90 backdrop-blur-md hover:bg-blue-500 text-white rounded-full font-medium text-sm shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                                           Aceder ao Módulo <Target size={14}/>
                                        </a>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
}
