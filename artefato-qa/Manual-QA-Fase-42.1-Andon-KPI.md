# Manual QA: Fase 42.1 - Andon por Área e KPIs

## Pré-Requisitos
- Ter pelo menos um Barco ativo (`IN_PROGRESS`) na linha de produção (na Área correta que vai monitorizar).
- Garantir que não existe ainda nenhum alerta Andon pendente para essa mesma área.

## Passo 1: A TV da Área (O "Destino")
1. Cópia Prática: Abra uma nova tab do browser.
2. Navegue para a Área pretendida (onde os barcos estão a sofrer montagem).
   - URI: `http://localhost:3000/tv/area/[ID_DA_AREA_A_MONITORIZAR]`
   - Dica: Encontra os IDs das Áreas em Configurações > Base de Dados > `areas_fabrica`.
3. Resultado Esperado: Um relógio digital gigantesco ao lado e 4 barcos ativos dessa área a deslizar no Dashboard num fundo escuro pacífico.

## Passo 2: O Operador HMI (O "Gatilho")
1. Numa outra janela, simule o posto do Operador: aceda a `http://localhost:3000/operador`.
2. No canto superior direito, escolha a sua **Estação Física** (crucial: esta estação tem de pertencer à Área que introduziu na TV).
3. No painel superior do meio, encontra o Botão Vermelho Gigante **"ANDON / SUPORTE URGENTE"**. Clique nele.
4. Vai ser interceptado por um Modal UI Contextual a pedir a Causa e as Notas Adicionais.
5. Seleciona "Scrap", digita "Motor vitrificado" e confirma Alarme!

## Passo 3: Magia Visível & Motor OEE (A "Ação")
1. Troque de ecrã para a aba do **Passo 1 (TV)**. Num segundo, ela tem de estar ofuscante a pulsar Vermelho alertando todos na Fábrica de que existe SCRAP no seu posto.
2. Troque para o Administrador em `http://localhost:3000/admin/producao/andon`.
3. Vai constatar que essa aba registou a hora, gerando um relógio **OEE de Tempo Perdido** e exibindo o que escreveste no Operador.
4. Clica rapidamente no botão verde "Resolver" da Tabela.
5. Regressa finalmente à aba do **Passo 1 (TV)**: a TV escureceu novamente para o normal, barcos à vista, confirmando a retoma.

Fim do Teste QA.
