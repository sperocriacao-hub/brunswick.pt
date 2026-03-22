'use client';

import { useState } from 'react';
import { 
  BookOpen, Map, Settings, Users, Activity, Layers, Crosshair, Box, 
  Target, CalendarDays, ShieldAlert, Cpu, CheckCircle2, Info, ArrowRight,
  Monitor, Tv, ListTodo, ShieldCheck, History, Award, Lightbulb, Footprints, AlertTriangle
} from 'lucide-react';
import Image from 'next/image';

//
// DATABASE DO MANUAL - Cobre TODOS os links do Sidebar
//
const MANUAL_DATA = [
  {
    id: "visao_geral",
    title: "Visão Geral & Finanças",
    icon: <Activity size={18} />,
    color: "text-blue-400",
    modules: [
        {
            name: "Dashboard (C-Level)",
            route: "/admin",
            description: "A central de comando para diretores e gestores. Resume o estado vital de toda a fábrica em tempo real.",
            steps: [
                { title: "Passo 1: Leitura do Ecrã", text: "Ao abrir, visualiza-se de imediato o número de O.P.s ativas, eficiência global e alertas graves." },
                { title: "Passo 2: Navegação OEE", text: "Gráficos de disponibilidades e paragens de máquina. Clique nos gráficos para filtrar." }
            ]
        },
        {
            name: "Eficiência H/H",
            route: "/admin/dashboard/eficiencia",
            description: "Análise profunda da performance dos operadores em rácio à estimativa do modelo.",
            steps: [
                { title: "Passo 1: Visualizar Horas", text: "Os gráficos comparam horas estimadas de engenharia (SLA) com as horas reais captadas pelos HMI no chão de fábrica." }
            ]
        },
        {
            name: "Desperdício OEE",
            route: "/admin/engenharia/oee",
            description: "Mapeamento das perdas de material (Ex: metros de fibra deitada ao lixo).",
            steps: [
                { title: "Passo 1: Inserir Filtros", text: "Escolha o mês e o turno para identificar que estações estão a gerar mais desperdício." }
            ]
        },
        {
            name: "OEE Ledger (Finanças)",
            route: "/admin/producao/financeiro",
            description: "Cruzamento entre os tempos de máquina/HMI e o custo por hora, resultando no Custo Real de Produção OEE ($).",
            steps: [
                { title: "Passo 1: Ver Margens de SLA", text: "Para cada modelo, a tabela financeira exibe o buraco financeiro resultante dos atrasos na linha." }
            ]
        }
    ]
  },
  {
    id: "planeamento",
    title: "Planeamento",
    icon: <CalendarDays size={18} />,
    color: "text-cyan-400",
    modules: [
        {
            name: "Ordens de Produção",
            route: "/admin/producao/ordens",
            description: "Onde nascem os pedidos encomendados para fabrik.',",
            steps: [
                { title: "Passo 1: Criar O.P.", text: "Clique em 'Emitir Nova Ordem'. Selecione o Casco/Barco alvo, defina as quantidades e aloque o Modle físico a utilizar." },
                { title: "Passo 2: Aprovação", text: "Uma O.P. nasce em Draft (Rascunho). Apenas O.P.s ativas serão visíveis no planeamento Gantt." }
            ]
        },
        {
            name: "Control Tower (APS)",
            route: "/admin/producao/aps",
            description: "A obra-prima Visual. O Motor Drag and Drop que estica Ordens no Tempo, evadindo feriados.",
            image: "/manual/control_tower_gantt_chart_1774127925977.png",
            steps: [
                { title: "Passo 1: Visualização do Gantt", text: "Observe as barras que representam Barcos ao longo do tempo. O sistema respeita as 'Regras de Sequência' que Engineeria desenhou." },
                { title: "Passo 2: Re-escalonamento Interativo", text: "Se um casco atrasar, pegue na barra da Operação e arraste para a frente. O sistema empurra automaticamente todos os barcos seguintes!" }
            ]
        },
        {
            name: "Monitorização Live",
            route: "/admin/producao/live",
            description: "A vista Top-Down 2D da fábrica.",
            steps: [
                { title: "Passo 1: Acompanhar BarcosFísicos", text: "As 'bolas' na tela mostram as posições reais dos barcos na linha neste exato minuto." }
            ]
        }
    ]
  },
  {
    id: "producao",
    title: "Produção",
    icon: <Box size={18} />,
    color: "text-blue-300",
    modules: [
        {
            name: "Terminal HMI (Operador)",
            route: "/operador",
            description: "A Interface tátil que fica em cada posto de trabalho, para os operadores registarem os seus tempos e materiais.",
            image: "/manual/shopfloor_hmi_operador_1774128185966.png",
            steps: [
                { title: "Passo 1: Iniciar Sessão/Passar Crachá", text: "O terminal exige que um funcionário passe o seu cartão RFID ou introduza o pin de RH." },
                { title: "Passo 2: Iniciar Tarefa", text: "No ecrã verde, o operador marca o arranque da operação. A partir desse segundo, o OEE Financeiro começa a contabilizar os custos!" },
                { title: "Passo 3: Reportar Anomalia/Andon", text: "Se faltar resina, o operador prime o botão central laranja Andon. A chefia é notificada instantaneamente." }
            ]
        },
        {
            name: "Saúde OEE do Andon",
            route: "/admin/producao/andon",
            description: "A televisão dos Diretores de Fábrica que exibe os alertas Andon a piscar.",
            steps: [
                { title: "Passo 1: Reagindo a um Alerta", text: "O supervisor desloca-se, resolve o problema mecânico ou de abastecimento, e dá o alarme como 'Resolvido'." }
            ]
        }
    ]
  },
  {
    id: "equipa_talento",
    title: "Equipa e Talento",
    icon: <Users size={18} />,
    color: "text-emerald-400",
    modules: [
        {
            name: "Gerir Operadores (Cadastro)",
            route: "/admin/rh",
            description: "O centro de identidades.",
            image: "/manual/rh_cadastro_v2_1774130431206.png",
            steps: [
                { title: "Passo 1: Novo Colaborador", text: "Defina o Nome, Nível Académico, Categoria e associe a Tag RFID física que o colaborador usará nos terminais HMI." }
            ]
        },
        {
            name: "Avaliações Diárias",
            route: "/admin/rh/avaliacoes",
            description: "A Matriz ILUO para feedback ágil do Operador.",
            image: "/manual/rh_avaliacoes_1774130386560.png",
            steps: [
                { title: "Passo 1: Preencher Feedback", text: "No fim de um turno, o Líder avalia comportamentos, organização (5S) e autonomia do operário na tarefa." }
            ]
        },
        {
            name: "Assiduidade Ativa & Balancing",
            route: "/admin/rh/assiduidade",
            description: "O Floor Balancing. Onde está a faltar gente?",
            image: "/manual/rh_assiduidade_1774130363981.png",
            steps: [
                { title: "Passo 1: Cruzamento SLA vs Real", text: "Este painel deteta se uma estação exige 5 Técnicos mas hoje só lá picaram ponto 2. Um alerta vermelho de gargalo laboral piscará." }
            ]
        }
    ]
  },
  {
    id: "warehouse",
    title: "Warehouse",
    icon: <Layers size={18} />,
    color: "text-indigo-400",
    modules: [
        {
            name: "Tablet Armazém (Picking / Kitting)",
            route: "/logistica/picking",
            description: "A visão do empilhador e do Responsável de Almoxarifado.",
            image: "/manual/logistics_tablet_kitting_1774128038755.png",
            steps: [
                { title: "Passo 1: Receção Automática J.I.T.", text: "A Logística não tem de caçar as O.P.s. Quando um Barco avança no HMI, o tablet de Picking recebe instantaneamente uma Campainha para aviar os materiais para o próximo passo." },
                { title: "Passo 2: Despachar Carga", text: "Depois da aranha com as Fibras ser despachada, o logística clica em Finalizar. A Linha arranca." }
            ]
        },
        {
            name: "Rastreabilidade B.O.M (Genealogia)",
            route: "/admin/engenharia/genealogia",
            description: "O Google Inverso para Lotes Defeituosos.",
            steps: [
                { title: "Passo 1: Combate a Recalls", text: "Insira o Lote do Fornecedor de uma resina corrompida. O sistema mostrará a Árvore de Cascos exata que levou aquela resina." }
            ]
        }
    ]
  },
  {
    id: "engenharia",
    title: "Engenharia",
    icon: <Cpu size={18} />,
    color: "text-purple-400",
    modules: [
        {
            name: "Modelos & Produtos (Catálogo)",
            route: "/admin/modelos",
            description: "A raiz do sistema. Define que Barcos ou Cascos a empresa produz.",
            image: "/manual/eng_modelos_1774130963421.png",
            steps: [
                { title: "Passo 1: Associar Opções Standard", text: "Crie o Modelo, coloque o seu Year Date, e associe-lhe características fixas de Gestão Visual." }
            ]
        },
        {
            name: "Cadastro de Moldes",
            route: "/admin/engenharia/moldes",
            description: "A catalogação dos 'Fornos' ou Ferramentas físicas.",
            image: "/manual/molds_list_empty_1774124510241.png",
            steps: [
                { title: "Passo 1: Status de Ciclos", text: "Registe o Molde X. Especifique quantos ciclos (tiragens) aguenta antes de necessitar de polimento na Manutenção." }
            ]
        },
        {
            name: "Regras Sequenciais",
            route: "/admin/engenharia/regras",
            description: "Workflow Base Universal. O Roteiro padrão que os modelos de boat adotam.",
            image: "/manual/engenharia_regras_1774130887018.png",
            steps: [
                { title: "Passo 1: Offsets APS", text: "Configure se a Laminação só permite a Preparação avançar 5 dias depois, estabelecendo um Gap de SLA obrigatório para o Gantt acatar." }
            ]
        },
        {
            name: "Tempos Roteiro OEE",
            route: "/admin/engenharia/roteiros",
            description: "A amarração entre Peça B.O.M, Molde e as Estações Físicas onde esse par flui.",
            image: "/manual/eng_roteiros_1774131189331.png",
            steps: [
                { title: "Passo 1: Nova Peça Básica", text: "Se o barco estiver vazio, clique em 'Nova Peça' e introduza por ex: 'Casco Principal'." },
                { title: "Passo 2: Adicionar Passo", text: "Ligue esse 'Casco Principal' à Estação X, indicando SLA técnico. Apenas roteiros definidos aqui aparecerão com instruções no HMI Operador." }
            ]
        },
        {
            name: "Fábrica & Estações (Setup)",
            route: "/admin/fabrica",
            description: "A infraestrutura Topológica virtual (Mapeamento espacial).",
            image: "/manual/configuracao_fabrica_1774130535439.png",
            steps: [
                { title: "Passo 1: Criar Linhas e Estações", text: "Assegure-se que o chão de fábrica desenhado aqui bate 1:1 com a realidade das vossas baías de produção." }
            ]
        }
    ]
  },
  {
    id: "qualidade",
    title: "Qualidade & Lean",
    icon: <ShieldCheck size={18} />,
    color: "text-amber-500",
    modules: [
        {
            name: "Gestão RNC (8D / A3)",
            route: "/admin/qualidade/rnc",
            description: "Relatórios de Não Conformidade e Problem Solving formatado (Iso9001).",
            steps: [
                { title: "Passo 1: Submeter Relatório", text: "Sempre que o Controlo Final chumba um casco, abre-se uma RNC. As causas são forçadas num framework 5-Why's ou Ishikawa." }
            ]
        },
        {
            name: "Ideias Kaizen & Gemba",
            route: "/admin/lean/kaizen",
            description: "O portal da Cultura Lean.",
            steps: [
                { title: "Passo 1: Kaizen de Operador", text: "Através da democratização, Operadores propõem poupanças ou truques nas bancadas. O comité avalia a recompensa (€)." }
            ]
        }
    ]
  },
  {
    id: "sst",
    title: "Saúde, Seg. e Ambiente (HST)",
    icon: <ShieldAlert size={18} />,
    color: "text-rose-500",
    modules: [
        {
            name: "Cruz de Segurança (Dashboard)",
            route: "/admin/hst/dashboard",
            description: "O Calendário Visual da Sinistralidade Laboral.",
            steps: [
                { title: "Passo 1: Leitura Visual", text: "Dias a Verde: Zero Acidentes. O objetivo é manter o quadro mensal impecável sem reportes de primeiros-socorros." }
            ]
        },
        {
            name: "Matriz Ocupacional e EPIs",
            route: "/admin/hst/epis",
            description: "Gestão dos exames médicos e requisitos de proteção.",
            steps: [
                { title: "Passo 1: Vincular Operacional", text: "Verificar se as máscaras de poeiras orgânicas e luvas de kevlar estão em uso no turno, e cruzar registos médicos de exposição." }
            ]
        }
    ]
  },
  {
    id: "sistema",
    title: "Sistema & Hardware",
    icon: <Settings size={18} />,
    color: "text-slate-400",
    modules: [
        {
            name: "Configurações Globais (Feriados)",
            route: "/admin/configuracoes",
            description: "A área estrita dos Overlords. Dias que corrompem planeamentos.",
            image: "/manual/configuracao_feriados_1774130580530.png",
            steps: [
                { title: "Passo 1: Feriados", text: "Introduza os Nacionais ou Globais da empresa. A máquina de Gantt saltará estes dias nos cálculos temporais." }
            ]
        },
        {
            name: "Hardware & Displays (TVs)",
            route: "/admin/configuracoes/tvs",
            description: "Gerir Ecrãs Públicos remotos por toda a fábrica.",
            steps: [
                { title: "Passo 1: TV Cast", text: "Força o reencaminhamento de rotas numa SmartTV pendurada no refeitório para exibir OEE Livetime." }
            ]
        }
    ]
  }
];

export default function ManualUtilizador() {
  const [activeCategory, setActiveCategory] = useState(MANUAL_DATA[0].id);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  const catData = MANUAL_DATA.find(c => c.id === activeCategory);
  if (!catData) return null;
  const modData = catData.modules[activeModuleIndex];

  return (
    <div className="min-h-[90vh] bg-[#0a0f1d] text-slate-200">
      {/* HEADER NASA */}
      <div className="border-b border-[rgba(255,255,255,0.08)] bg-[rgba(15,23,42,0.9)] sticky top-[-1px] z-50 backdrop-blur-md px-6 py-6 lg:px-10 flex flex-col md:flex-row justify-between items-center shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-full bg-blue-500/10 mix-blend-screen filter blur-[100px] z-0 pointer-events-none"></div>
        <div className="z-10 flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] border border-blue-400">
            <BookOpen size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                M.E.S. Training Protocol
            </h1>
            <p className="text-blue-300 font-medium text-sm mt-1 uppercase tracking-widest flex items-center gap-2">
                <CheckCircle2 size={14}/> Manual Interativo de Utilizador e Operação Passo-A-Passo
            </p>
          </div>
        </div>
        <div className="mt-4 md:mt-0 z-10">
          <div className="px-4 py-2 border border-blue-500/50 rounded-lg bg-blue-900/40 text-blue-200 font-mono text-xs flex items-center gap-2 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-green-400"></span> SYSTEMS NOMINAL
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-130px)] max-w-[1800px] mx-auto">
        
        {/* BARRA LATERAL ESQUERDA: CATEGORIAS DO SISTEMA */}
        <aside className="w-full lg:w-72 shrink-0 border-r border-[rgba(255,255,255,0.05)] bg-[rgba(0,0,0,0.1)] p-4 overflow-y-auto">
          <p className="px-4 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-4">Núcleo Central</p>
          <div className="space-y-1">
            {MANUAL_DATA.map(categoria => {
              const isActive = categoria.id === activeCategory;
              return (
                <button
                  key={categoria.id}
                  onClick={() => { setActiveCategory(categoria.id); setActiveModuleIndex(0); }}
                  className={`
                    w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all duration-300
                    ${isActive 
                        ? 'bg-blue-600/20 text-blue-100 border border-blue-500/40 shadow-[inset_0_0_10px_rgba(37,99,235,0.2)]' 
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[rgba(255,255,255,0.03)] border border-transparent'}
                  `}
                >
                  <span className={`${isActive ? categoria.color : 'text-slate-500'}`}>
                      {categoria.icon}
                  </span>
                  {categoria.title}
                </button>
              )
            })}
          </div>
        </aside>

        {/* ECRÃ PRINCIPAL DIVIDIDO EM 2: Modulos da Categoria | Corpo Interativo */}
        <div className="flex-1 flex flex-col md:flex-row bg-[#080d19] overflow-hidden">
            
            {/* MINI-SIDEBAR: Lista de Módulos Específicos daquela categoria */}
            <div className="w-full md:w-80 border-r border-[rgba(255,255,255,0.05)] bg-[rgba(15,23,42,0.3)] p-4 overflow-y-auto flex flex-col gap-2 relative">
                <p className="px-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest mb-2 border-b border-[rgba(255,255,255,0.05)] pb-2 flex items-center justify-between">
                    Módulos em {catData.title}
                    <span className="bg-slate-800 text-white rounded-full px-2 py-0.5 text-[9px]">{catData.modules.length}</span>
                </p>
                
                {catData.modules.map((m, idx) => {
                    const isModActive = idx === activeModuleIndex;
                    return (
                        <div 
                            key={idx}
                            onClick={() => setActiveModuleIndex(idx)}
                            className={`
                                cursor-pointer group rounded-xl p-3 border transition-colors 
                                ${isModActive ? 'bg-slate-800 border-slate-600 shadow-lg' : 'bg-transparent border-transparent hover:bg-slate-800/50'}
                            `}
                        >
                            <div className="font-bold text-[14px] text-white flex justify-between items-center tracking-tight leading-tight">
                                {m.name}
                                {isModActive && <ArrowRight size={14} className="text-blue-400 animate-pulse" />}
                            </div>
                            <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                                {m.description}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* VISOR CENTRAL: Detalhe do Módulo (Passo-a-passo) */}
            <div className="flex-1 overflow-y-auto bg-[rgba(0,0,0,0.2)] p-6 lg:p-10 relative">
                
                {modData ? (
                    <div className="max-w-[1100px] mx-auto animate-fade-in flex flex-col gap-8 pb-32">
                        
                        {/* Cabecalho Módulo */}
                        <div className="border-b border-[#1e293b] pb-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-3xl font-extrabold text-white mb-2">{modData.name}</h2>
                                <p className="text-slate-400 text-xl font-light">{modData.description}</p>
                            </div>
                            <div className="shrink-0 flex items-center">
                                <a 
                                    href={modData.route} 
                                    target="_blank" 
                                    className="px-5 py-2.5 bg-white text-slate-900 font-bold rounded-lg shadow-xl hover:bg-blue-100 transition-colors flex items-center gap-2"
                                >
                                    <Target size={16} /> Abrir Módulo Real
                                </a>
                            </div>
                        </div>

                        {/* PASSO A PASSO EXPLICATIVO */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                            <div className="flex flex-col gap-6">
                                <h3 className="text-lg font-bold text-slate-300 uppercase tracking-widest border-l-2 border-blue-500 pl-3">Guia Operacional Passo a Passo</h3>
                                {modData.steps.map((step, sIdx) => (
                                    <div key={sIdx} className="bg-slate-800/80 border border-slate-700 p-6 rounded-2xl shadow-md hover:border-slate-500 transition-colors relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-[30px] group-hover:bg-blue-500/10 transition-colors"></div>
                                        <h4 className="text-xl font-bold text-blue-100 mb-3 flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center text-sm ring-1 ring-blue-500/50">
                                                {sIdx + 1}
                                            </div>
                                            {step.title}
                                        </h4>
                                        <p className="text-slate-300 leading-relaxed text-[15px] ml-11">
                                            {step.text}
                                        </p>
                                    </div>
                                ))}

                                {modData.steps.length === 0 && (
                                    <div className="text-slate-500 italic p-4 bg-slate-900/50 rounded-xl border border-slate-800">
                                        Este módulo é autoexplicativo na sua interação central. Navegue até à rota associada para operar.
                                    </div>
                                )}
                            </div>

                            {/* FOTO DESCOMPRIMIDA / UNCOMPRESSED / UNCROPPED */}
                            <div className="bg-[#0b1121] border border-slate-700/80 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col sticky top-10 w-full animate-in fade-in slide-in-from-bottom-5 duration-700">
                                <div className="bg-[#1e293b] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-2 text-xs font-mono text-slate-400 truncate opacity-70">
                                        brunswick-pt.vercel.app{modData.route}
                                    </span>
                                </div>
                                <div className="relative w-full overflow-y-auto nasa-scrollbar bg-black" style={{ maxHeight: 'calc(100vh - 300px)'}}>
                                    {modData.image ? (
                                        <img 
                                            src={modData.image} 
                                            alt={modData.name} 
                                            className="w-full h-auto object-cover opacity-90 hover:opacity-100 transition-opacity"
                                            style={{ display: 'block' }}
                                        />
                                    ) : (
                                        <div className="w-full aspect-[4/3] flex flex-col items-center justify-center gap-4 text-slate-600 font-mono text-sm bg-slate-900">
                                            <Info size={40} className="text-slate-700" />
                                            <span>Foto de Sistema Não Acoplada.</span>
                                            <span className="text-xs opacity-50">Siga as instruções diretas.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center p-20 text-slate-500 border border-dashed border-slate-700 rounded-3xl">
                        Nenhum detalhe encontrado para o módulo selecionado.
                    </div>
                )}
            </div>
        </div>

      </div>
    </div>
  );
}
