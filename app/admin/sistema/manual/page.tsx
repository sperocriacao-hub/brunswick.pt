'use client';

import { useState } from 'react';
import { 
  BookOpen, Map, Settings, Users, Activity, Layers, Crosshair, Box, 
  Target, CalendarDays, ShieldAlert, Cpu, CheckCircle2, ChevronRight,
  Database, Fingerprint, BarChart2, GitBranch, ArrowRightLeft, PenTool, LayoutTemplate, Link2, Monitor
} from 'lucide-react';

const MANUAL_DATA = [
  {
    id: "engenharia",
    title: "Engenharia & Foundation",
    icon: <Cpu size={18} />,
    color: "text-purple-400",
    modules: [
        {
            name: "Modelos & Produtos",
            route: "/admin/modelos",
            description: "O passaporte do Navio. A base estrutural do catálogo construído na Brunswick.",
            sections: [
                { title: "1. Criação Base", content: "Clique em 'Novo Modelo'. Defina o Código (ex: CS-25), Nome Comercial e a Família a que pertence (Cruiser, Sport, etc). Cada alteração ao ano/versão deve gerar um novo Modelo na DB para manter o histórico de SLA imutável." },
                { title: "2. Cadastro PDM", content: "Após criar a base, acesse a configuração Avançada para definir características como o Calado e Boca, atrelando os atributos técnicos que limitam o transporte ou alocação nas baías de montagem." },
                { title: "3. Variante de Lote", content: "Um modelo pode ser customizado. Se tiver Opcionais (ex: Tenda Bimini, Motor 250HP vs 300HP), as regras de negócio devem ser cimentadas no momento do lançamento do Roteiro Específico para essa versão." }
            ]
        },
        {
            name: "Fábrica & Topologia",
            route: "/admin/fabrica",
            description: "O esqueleto físico da unidade industrial.",
            sections: [
                { title: "1. Desenho do Chão", content: "A unidade divide-se em 'Áreas' (Lamination, Assembly, Setup). Crie a Área mestre primeiro." },
                { title: "2. Adicionar Linhas", content: "Cada Área pode ter N Linhas (Linha A, Linha B). O Balanceamento Laboral é medido por este funil." },
                { title: "3. Estações Táticas (Workcenters)", content: "O último grão. A estação é o limite onde o Terminal HMI opera. Associe IPs de Tablets estáticos a Stations específicas para evitar picagens fantasma." }
            ]
        },
        {
            name: "Cadastro de Moldes (Tooling)",
            route: "/admin/engenharia/moldes",
            description: "As ferramentas de injeção e cozedura do barco.",
            sections: [
                { title: "1. Mapeamento da Ferramenta", content: "Descreva o Número de Série do molde, as suas tolerâncias térmicas e a que Peças de B.O.M ele serve." },
                { title: "2. Limites de Engenharia (Preventiva)", content: "Crucial alertar o motor TPM: 'Este molde suporta N extrações antes de polimento obgiratório'. Se for ultrapassado, o APS recusa emitir O.P. para ele." },
                { title: "3. Estados Limitativos", content: "Mudar o estado de um molde para 'Bloqueado por RNC' interdita imediatamente o sequenciamento dessa peça no Gantt." }
            ]
        },
        {
            name: "Gestão B.O.M & Roteiros OEE",
            route: "/admin/engenharia/roteiros",
            description: "O cordão umbilical que liga Peças a Estações.",
            sections: [
                { title: "1. Injeção de Peças Básicas", content: "Dentro do módulo, selecione o Barco e adicione os Nodos Estruturais associados (ex: 'Convés Principal'). Isto cria o esqueleto Genealógico na DB." },
                { title: "2. Traçar Diagonais de Processo", content: "Para a Peça B.O.M acabada de criar, clique em 'Adicionar Passo'. Indique que esta peça vai cruzar a Estação X." },
                { title: "3. SLA de Ciclo", content: "O Segredo de Fátima do OEE Financeiro. Preencha o Target Estimado (SLA) em minutos para essa estação. Se colocar 120mins, o HMI exigirá esse *Pace*." },
                { title: "4. Sequência", content: "Múltiplos passos formam o Roteiro (Passo 1 -> Passo 2 -> Passo 3). O motor logístico usará esta cadeia matricial para engatilhar as entregas." }
            ]
        },
        {
            name: "Cérebro APS: Regras de Sequência",
            route: "/admin/engenharia/regras",
            description: "Lógica avançada de Precedências para Automatismos de Escalonamento.",
            sections: [
                { title: "1. Regras de Offsets", content: "Para evitar estrangulamento de O.P.s, estabeleça folgas: 'O Polimento nunca deve arrancar antes de 2 horas sobre o término da Cura'." },
                { title: "2. Tipos de Amarração", content: "Estações SS (Start-to-Start) ou FS (Finish-to-Start). Ao desenhar uma regra FS, o Gantt Board travará sempre que o Mestre tentar arrastar barras para a frente violando a física." }
            ]
        }
    ]
  },
  {
    id: "planeamento",
    title: "Planeamento Executivo (O.P. & APS)",
    icon: <CalendarDays size={18} />,
    color: "text-cyan-400",
    modules: [
        {
            name: "Emissão de Ordens de Produção",
            route: "/admin/producao/ordens",
            description: "O Epicentro onde os Navios Encomendados ganham um número de Chassi.",
            sections: [
                { title: "1. Lançamento da O.P.", content: "Selecione o Modelo base e emita uma nova Ordem. Um ID Único será gerado e ficará em modo 'Draft'." },
                { title: "2. Data Target & Client", content: "Insira a Data Prometida ao Cliente Final. O motor APS utilizará isto para o Cálculo de Atraso e Prioridades." },
                { title: "3. Associação de Moldes", content: "Alavanque a O.P. ao Molde X ou Y antes de passar a 'Ativa'. Sem vincular, não se gere genealogia." },
                { title: "4. Aprovação e Status", content: "Mudança state machine. Só Ordens formalmente Ativadas fluem para baixo, caindo na Torre de Controlo para agendamento temporal." }
            ]
        },
        {
            name: "Torre de Controlo: APS Gantt Chart",
            route: "/admin/producao/aps",
            description: "The God View. Onde os gestores de fluxo interagem com a cronologia.",
            image: "/manual/v2_aps_gantt.png",
            sections: [
                { title: "1. Visão Temporal (Time Scale)", content: "Navegue pelo painel Gantt interativo por Dia/Semana/Mês. Cada barra colorida representa o SLA de uma O.P. trancada naquela data." },
                { title: "2. Drag and Drop Dinâmico", content: "Apanhe uma barra (Barco A, Estação de Polimento) e arraste-a horizontalmente para um Novo Dia." },
                { title: "3. O Algoritmo de Evasão", content: "O drag&drop invoca cálculos heurísticos: se empurrar a data para um Sábado (Dia Feriado no Sistema), a barra salta e estica automaticamente para o dia útil seguinte." },
                { title: "4. Propagação em Cascata", content: "Mudar a Etapa #1 atrasará instantaneamente todas as Etapas supervenientes (2,3,4) vinculadas nesse barco pelo Engine de Regras de Sequenciamento." },
                { title: "5. Atualização Em Tempo Real", content: "As barras mudam de Cor quando o Operador faz 'Picagem' no chão de fábrica (ex: de Azul para Verde-Completed)." }
            ]
        },
        {
            name: "Monitorização Live 2D Overview",
            route: "/admin/producao/live",
            description: "Um quadro matricial vivo que reage às pulsações de produção.",
            sections: [
                { title: "1. Leitura de Matrix", content: "Os barcos são apresentados nos 'Slots' espaciais da fábrica. Identifica fisicamente a aglomeração e engarrafamento nas baías." }
            ]
        }
    ]
  },
  {
    id: "producao",
    title: "Chão de Fábrica & Logística",
    icon: <Box size={18} />,
    color: "text-blue-300",
    modules: [
        {
            name: "Tablet Armazém (Kitting)",
            route: "/logistica/picking",
            description: "O pull-system que avisa o Empilhador para entregar material.",
            image: "/manual/v2_picking.png",
            sections: [
                { title: "1. Receção do Call-to-Action", content: "O sistema não é Push. O operário de logística vê as Ordens de Sub-Tarefas surgirem apenas quando as precedências de O.P. a autorizam." },
                { title: "2. Ponto de Abastecimento", content: "Verifica-se qual a Estação que pede a fibra, localiza-se na Prateleira e avia-se a Carga Padrão associada na Engenharia de Opcionais." },
                { title: "3. Scan de Lotes", content: "Para Genealogia, o logística deve apontar (Scan/Teclado) o ID Único do Camião/Bidão de Resina entregue para selar a rastreabilidade da matéria prima final no casco." }
            ]
        },
        {
            name: "Terminal HMI (Operador Shopfloor)",
            route: "/operador",
            description: "A interface reativa sem papel dos laminadores e construtores.",
            image: "/manual/v2_operador.png",
            sections: [
                { title: "1. Autenticação Pessoal", content: "O operador escolhe a sua Estação de Trabalho e pica o RFID com o crachá Pessoal (ou introduz email) validando o Timestamp de Ponto Operativo." },
                { title: "2. Escalonamento Ativo", content: "O HMI mostra exclusivamente as Ordens planeadas pelo APS para *esta* estação neste *turno* e *data*. Os barcos surgem em Cards." },
                { title: "3. Picagem OEE (Play/Pause)", content: "O coração financeiro: O utilizador clica em INICIAR (Começa a faturar tempo). Se for à casa de banho ou jantar, crucia o PAUSA (Time-Tracker congela, protegendo métricas do SLA)." },
                { title: "4. Execução de Micro-Passos (Tarefas)", content: "Lista de checks gerada pela Engenharia. Se o passo obriga a 'Aplicar Gelcoat 4 camadas', só fica Completa quando o operador der o 'Visto' no check visual." },
                { title: "5. Falta de Peças / Defeitos (Andon)", content: "Um botão gigante Vermelho ou Laranja está presente. Ao invocá-lo, o terminal bloqueia ou avisa e dispara sirenes visuais para a chefia (Quebra de SLA ou Quebra Material)." },
                { title: "6. Declaração Final", content: "Quando tudo está OK, o botão 'Concluir OP' sela a picagem, empurra o Barco para fase seguinte no Gantt e liberta recursos laborais." }
            ]
        },
        {
            name: "Saúde OEE Andon Board",
            route: "/admin/producao/andon",
            description: "Ecrã partilhado para Supervisores gerirem Quebras (Luzes Vermelhas).",
            sections: [
                { title: "1. Visualizar Alarmes", content: "Alarmísticas como: Tempo Limite Estourado ou Quebra de Fresas." },
                { title: "2. Supressão / Intervenção", content: "O Líder clica e resolve ou escala o alerta como RNC." }
            ]
        }
    ]
  },
  {
    id: "rh",
    title: "Capital Humano (Talento)",
    icon: <Users size={18} />,
    color: "text-emerald-400",
    modules: [
        {
            name: "Cadastro Global SGH",
            route: "/admin/rh",
            description: "A Root base para os colaboradores operacionais.",
            sections: [
                { title: "1. Detalhes Biométricos Virtuais", content: "Insira Nomes, Idades e Cartões de Cidadão mas essencialmente o CÓDIGO DA TAG RFID para o operário conseguir 'Picar' nas máquinas Android/HMI." },
                { title: "2. Setores de Custos", content: "Alocar operários a Categorias salariais diferentes impacta de forma direta o Custo do Roteiro (OEE Finanças)." }
            ]
        },
        {
            name: "Avaliação Flexível 360",
            route: "/admin/rh/avaliacoes",
            description: "Tracking contínuo do potencial da equipa.",
            sections: [
                { title: "1. Parâmetros Qualitativos", content: "O líder regista feedback (Matriz Polivalência ILUO). Isto dita se um Técnico é classificado como O (Autónomo ensinador) ou I (Aprendiz)." }
            ]
        },
        {
            name: "Balanceamento em Tempo Real",
            route: "/admin/rh/assiduidade",
            description: "A defesa contra Falhas de Lotação.",
            sections: [
                { title: "1. Identificação de Fugas", content: "O sistema percebe que uma Estação de Assemblagem exige SLA = Homem/Hora de 4 pessoas, mas só duas picaram. Destaca a cor vermelha em falta Laboral viva." }
            ]
        }
    ]
  },
  {
    id: "qualidade",
    title: "Genealogia, Traceability & QA",
    icon: <Database size={18} />,
    color: "text-rose-400",
    modules: [
        {
            name: "Genealogia / Traceability Hub",
            route: "/admin/engenharia/genealogia",
            description: "A bíblia central anti-processos civis e avarias. Mapeamento 1:1 Físico-Virtual.",
            sections: [
                { title: "1. Modo Inspecção Descendente", content: "Procura pelo Número do Casco/O.P. e o portal descarrega a Árvore hierárquica completa: Todos os B.O.Ms absorvidos e o Operador que executou a inserção." },
                { title: "2. Modo Inspecção Ascendente", content: "Dado o Lote de uma Resina, desdobra para o TopLevel em que Navios os lotes defeituosos andam pelo oceano fora. Identifica de imediato a Frota de Call-Back." }
            ]
        },
        {
            name: "Problemas & RNC (A3/8D)",
            route: "/admin/qualidade/rnc",
            description: "O sistema Iso9001 das N-Conformidades.",
            sections: [
                { title: "1. Escalão Andon RNC", content: "Se no Chão o percalço foi gravíssimo, sobe a Relação de RNC. Aqui define-se ações de Limite Temporário e Plano de Prevenção." },
                { title: "2. Isolamento do Produto", content: "Uma RNC pode ditar o Barco como REJEITADO SCARP (Lixo) forçando reemissão de Gantt, ou como REWORK, pedindo nova passagem pelas estações base." }
            ]
        }
    ]
  },
  {
    id: "financas",
    title: "Finanças OEE & Analítica",
    icon: <BarChart2 size={18} />,
    color: "text-amber-400",
    modules: [
        {
            name: "C-Level Dashboards Aggregator",
            route: "/admin",
            description: "Widget hub.",
            image: "/manual/v2_dashboard.png",
            sections: [
                { title: "1. Live Metrics", content: "Mostra total de O.P. Ativas, Barcos Completos esta semana e Eficiência Média Fabril (OEE - Disponibilidade, Qualidade e Performance) de todas as máquinas." }
            ]
        },
        {
            name: "OEE Ledger Financeiro",
            route: "/admin/producao/financeiro",
            description: "A faturação secreta escondida entre SLA de tempo e Gasto Salarial.",
            sections: [
                { title: "1. Contabilidade Analítica Baseada no Tempo", content: "Se o Barco #55 esteve faturado 50 horas com 2 operadores Categoria A, a tabela converte para $$$ e deduz ao Total Prometido ao budget inicial de Engenheiro. Exibe Desvio (Ganhos vs Perdas OEE) negro no branco." }
            ]
        }
    ]
  },
  {
    id: "configuracoes",
    title: "Root & Sistemas Globais",
    icon: <Settings size={18} />,
    color: "text-slate-400",
    modules: [
        {
            name: "Feriados e Bloqueios Cíclicos",
            route: "/admin/configuracoes",
            description: "Proteções temporais extremas.",
            sections: [
                { title: "1. Adicionar Feriados", content: "Semana Santa na fábrica ou Sairias Municipais? Acrescente as datas no painel e grave. O APS varre todas as O.P.s esticando os atrasos provocados pela isenção laboral nesses dias." }
            ]
        },
        {
            name: "Broadcast Hardware (TV Live)",
            route: "/admin/configuracoes/tvs",
            description: "A força IOT - Injetores de URL",
            sections: [
                { title: "1. Registar um Ecrã Físico", content: "TV Samsung da Cantina instalada. Conecte-a à Web, adicione ID aqui e selecione 'Push Andon Report'. A TV muda magicamente num segundo." }
            ]
        }
    ]
  }
];

export default function ManualUtilizador() {
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);
  const [activeModuleIndex, setActiveModuleIndex] = useState(0);

  const catData = MANUAL_DATA[activeCategoryIndex];
  const modData = catData?.modules[activeModuleIndex];

  return (
    <div className="min-h-screen bg-[#060a12] text-slate-300 font-sans selection:bg-blue-500/30 selection:text-white flex flex-col">
      
      {/* 🚀 TOPO: COMMAND HEADER */}
      <header className="px-8 py-5 border-b border-[rgba(255,255,255,0.06)] bg-[rgba(10,15,30,0.85)] flex justify-between items-center z-50 sticky top-0 backdrop-blur-xl">
        <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-800 flex items-center justify-center shadow-[0_0_25px_rgba(37,99,235,0.3)] ring-1 ring-[rgba(255,255,255,0.2)]">
                <BookOpen size={24} className="text-blue-100" />
            </div>
            <div>
                <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400 uppercase tracking-widest flex items-center gap-2">
                    Guia Arquitetural M.E.S. <span className="text-xs font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded">V2.0</span>
                </h1>
                <p className="text-blue-300/80 font-mono text-[11px] tracking-widest mt-1">BRUNSWICK PROTOCOL / USER MANUAL SPACE-GRADE</p>
            </div>
        </div>
        
        <div className="hidden lg:flex gap-6 items-center">
             <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-full border border-emerald-500/20">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> FULL SYSTEM MAPPED
             </div>
             <a href="/" target="_blank" className="text-sm font-semibold text-white px-5 py-2.5 bg-white/5 hover:bg-white/10 rounded-full border border-white/10 transition-colors flex items-center gap-2">
                 Sair para Aplicação Real <Target size={14}/>
             </a>
        </div>
      </header>

      {/* 🌐 CORPO: 3-Pillars Layout */}
      <div className="flex-1 max-w-[1920px] w-full mx-auto flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-[rgba(255,255,255,0.05)] overflow-hidden">
          
          {/* PILLAR 1: ROOT CATEGORIES */}
          <div className="w-full lg:w-72 bg-[#090d18] flex flex-col items-stretch overflow-y-auto nasa-scrollbar py-6 shrink-0 relative">
             <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/5 filter blur-[100px] pointer-events-none rounded-full" />
             <p className="px-6 text-[10px] uppercase text-slate-500 font-extrabold tracking-[0.2em] mb-4">Módulos Globais</p>
             
             <div className="px-3 flex flex-col gap-1 z-10">
                 {MANUAL_DATA.map((cat, idx) => {
                     const isActive = idx === activeCategoryIndex;
                     return (
                         <button
                            key={cat.id}
                            onClick={() => { setActiveCategoryIndex(idx); setActiveModuleIndex(0); }}
                            className={`flex items-center gap-3 px-4 py-3 rounded-lg text-left font-semibold transition-all duration-300
                                ${isActive ? 'bg-blue-600/15 border border-blue-500/30' : 'hover:bg-white/5 border border-transparent'}
                            `}
                         >
                             <span className={`${isActive ? cat.color + ' drop-shadow-md' : 'text-slate-500'}`}>
                                 {cat.icon}
                             </span>
                             <span className={`text-[13px] tracking-wide ${isActive ? 'text-blue-100' : 'text-slate-400'}`}>
                                 {cat.title}
                             </span>
                         </button>
                     )
                 })}
             </div>
          </div>

          {/* PILLAR 2: SUB-MODULES SELECTOR */}
          <div className="w-full lg:w-[380px] bg-[rgba(15,20,35,0.4)] flex flex-col overflow-y-auto nasa-scrollbar py-6 shrink-0 border-r border-[rgba(255,255,255,0.02)]">
             <div className="px-6 flex items-center justify-between mb-4">
                <p className="text-[10px] uppercase text-blue-400 font-extrabold tracking-[0.2em]">Detalhes da Categoria</p>
                <div className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-bold">
                    {catData?.modules.length} Itens
                </div>
             </div>
             
             <div className="px-4 flex flex-col gap-3">
                 {catData?.modules.map((m, idx) => {
                     const isModActive = idx === activeModuleIndex;
                     return (
                         <div 
                            key={idx}
                            onClick={() => setActiveModuleIndex(idx)}
                            className={`
                               p-4 rounded-xl cursor-pointer group transition-all duration-300 relative overflow-hidden border
                               ${isModActive 
                                 ? 'bg-[rgba(255,255,255,0.05)] border-[rgba(255,255,255,0.1)] shadow-xl' 
                                 : 'bg-transparent border-transparent hover:bg-[rgba(255,255,255,0.02)]'}
                            `}
                         >
                             {isModActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-blue-500 rounded-r-md"></div>}
                             <div className="flex justify-between items-start mb-1.5 ml-1">
                                 <h3 className={`text-[14px] font-bold leading-tight ${isModActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                                     {m.name}
                                 </h3>
                                 {isModActive && <ChevronRight size={16} className="text-blue-400 animate-pulse shrink-0" />}
                             </div>
                             <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed ml-1">
                                 {m.description}
                             </p>
                         </div>
                     )
                 })}
             </div>
          </div>

          {/* PILLAR 3: THE HIGH-TECH WIREFRAME / DEEP DIVE ZONE */}
          <div className="flex-1 bg-gradient-to-br from-[#0c1221] to-[#04060b] overflow-y-auto nasa-scrollbar border-l border-[rgba(255,255,255,0.02)] relative">
              
              {/* Grid Background Effect */}
              <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.01) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
              
              {modData ? (
                  <div className="p-8 lg:p-14 relative z-10 animate-fade-in max-w-4xl mx-auto">
                      
                      {/* Título e Acesso Rápido */}
                      <div className="flex flex-col mb-10 border-b border-[rgba(255,255,255,0.1)] pb-8">
                          <div className="flex items-center gap-3 mb-4">
                             <div className={`p-2 rounded bg-opacity-10 text-opacity-80 ring-1 ring-opacity-20 ${catData.color.replace('text-','bg-')} ${catData.color.replace('text-','ring-')} ${catData.color}`}>
                                 {catData.icon}
                             </div>
                             <span className="text-slate-400 font-mono text-[11px] uppercase tracking-[0.2em]">{catData.title}</span>
                          </div>
                          
                          <div className="flex justify-between items-end gap-6 flex-wrap">
                              <div>
                                  <h2 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight mb-2">
                                      {modData.name}
                                  </h2>
                                  <p className="text-xl font-light text-slate-400 max-w-2xl">
                                      {modData.description}
                                  </p>
                              </div>
                              <a href={modData.route} target="_blank" className="px-5 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.2)] text-white font-bold tracking-wide flex items-center gap-2 transition-all">
                                  <Link2 size={16}/> Aceder ao Módulo
                              </a>
                          </div>
                      </div>

                      {/* FLUXO MACRO / DATA ARCHITECTURE (Wireframe Representation) */}
                      <div className="mb-14">
                           <h3 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                               <LayoutTemplate size={14}/> Topologia Estrutural
                           </h3>
                           <div className="bg-[rgba(15,25,45,0.6)] border border-slate-800 rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center relative overflow-hidden group hover:border-blue-900/50 transition-all">
                               
                               <div className="absolute inset-0 bg-gradient-to-t from-blue-900/5 to-transparent z-0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                               
                               {/* ABSTRACT GLOWING WIREFRAME DIAGRAM FOR REPLACEMENT OF IMAGES */}
                               <div className="w-full flex flex-col gap-6 z-10">
                                   <div className="flex items-center justify-between opacity-50 px-2 font-mono text-[10px] text-blue-300">
                                       <span>{`<DATA_IN_PROTO>`}</span>
                                       <span>PROCESS QUEUE ......................... ESTABLISHED</span>
                                   </div>
                                   
                                   <div className="flex flex-col md:flex-row items-stretch justify-center gap-4">
                                       <div className="flex-1 border border-dashed border-blue-500/30 rounded-xl p-6 bg-blue-950/20 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-center">
                                           <Database size={24} className="text-blue-400 opacity-80" />
                                           <div>
                                               <p className="font-bold text-blue-100 text-sm">PostgreSQL Core</p>
                                               <p className="font-mono text-[10px] text-slate-500 mt-1">Busca Registo Ativo</p>
                                           </div>
                                       </div>
                                       
                                       <div className="hidden md:flex flex-col justify-center items-center px-2">
                                           <ArrowRightLeft size={20} className="text-slate-600" />
                                       </div>
                                       
                                       <div className="flex-[2] border border-blue-500/30 rounded-xl p-6 bg-blue-900/10 backdrop-blur-sm flex items-center justify-between shadow-[inset_0_0_30px_rgba(37,99,235,0.05)]">
                                            <div className="flex flex-col gap-4 w-full">
                                                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden flex">
                                                    <div className="h-full bg-blue-500 w-[65%]"></div>
                                                </div>
                                                <div className="flex justify-between items-center text-xs">
                                                    <div className="flex items-center gap-2">
                                                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                                        <span className="text-emerald-400 font-mono">LIVE / {modData.name.substring(0,8).toUpperCase()}</span>
                                                    </div>
                                                    <span className="text-slate-500 font-mono">OK</span>
                                                </div>
                                            </div>
                                       </div>
                                   </div>
                               </div>

                           </div>
                      </div>

                      {/* CAPTURA DE ECRÃ DO MÓDULO (SE DISPONÍVEL) */}
                      {modData.image && (
                          <div className="mb-14 fade-in slide-in-from-bottom-5">
                             <h3 className="text-[12px] font-extrabold text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                 <Monitor size={14}/> Interface do Sistema M.E.S.
                             </h3>
                             <div className="bg-[#0b1121] border border-slate-700/80 rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
                                <div className="bg-[#1e293b] px-4 py-3 flex items-center gap-2 border-b border-slate-700">
                                    <div className="w-3 h-3 rounded-full bg-rose-500"></div><div className="w-3 h-3 rounded-full bg-amber-500"></div><div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                                    <span className="ml-2 text-xs font-mono text-slate-400 truncate opacity-70">
                                        brunswick-pt.vercel.app{modData.route}
                                    </span>
                                </div>
                                <img src={modData.image} alt="System Capture" className="w-full h-auto object-contain block opacity-90 hover:opacity-100 transition-opacity" />
                             </div>
                          </div>
                      )}

                      {/* TEXTO DETALHADO EXAUSTIVO */}
                      <div>
                           <h3 className="text-[12px] font-extrabold text-slate-500 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                               <PenTool size={14}/> Procedimentos Operacionais (Flow)
                           </h3>
                           
                           <div className="flex flex-col gap-8">
                               {modData.sections.map((sec, sIdx) => (
                                   <div key={sIdx} className="relative pl-10">
                                       {/* Connecting Line */}
                                       {sIdx !== modData.sections.length - 1 && (
                                           <div className="absolute left-[13px] top-[30px] bottom-[-45px] w-px bg-slate-800"></div>
                                       )}
                                       {/* Node */}
                                       <div className="absolute left-0 top-[2px] w-7 h-7 rounded-sm border border-slate-700 bg-[#0c1221] ring-4 ring-[#0c1221] flex items-center justify-center z-10 shadow-[0_0_10px_rgba(255,255,255,0.05)]">
                                           <span className="text-[10px] font-mono text-blue-400 font-bold">{sIdx + 1}</span>
                                       </div>
                                       
                                       <h4 className="text-xl font-bold text-slate-200 mb-3 tracking-tight">
                                           {sec.title}
                                       </h4>
                                       <p className="text-[15px] leading-relaxed text-slate-400 font-light max-w-3xl">
                                           {sec.content}
                                       </p>
                                   </div>
                               ))}
                           </div>
                      </div>

                  </div>
              ) : (
                  <div className="h-full flex flex-col items-center justify-center p-10 opacity-30">
                      <Layers size={60} className="mb-4 text-slate-700" />
                      <p className="text-xl font-bold font-mono tracking-widest text-slate-600">STANDBY . AWAITING SELECTION</p>
                  </div>
              )}
          </div>

      </div>

    </div>
  );
}
