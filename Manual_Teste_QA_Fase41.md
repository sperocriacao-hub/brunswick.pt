# M.E.S. BRUNSWICK - MANUAL DE TESTE QA (FASE 41)
## Rastreabilidade B.O.M. e Genealogia (Plano 10)

A fundação para um M.E.S de Indústria 4.0 está assente. A Brunswick consegue agora invocar mecânicas automáticas de contenção em peças defeituosas, extinguindo os recortes de papel logísticos.

---

### PREPARAÇÃO DA FÁBRICA
1. **Ativar O.P.**
   Garanta que tem uma **Ordem de Produção (Barco)** ativa no painel Live/RH da fábrica. O estado tem que estar `PLANNED` ou `IN_PROGRESS`.
2. **Memorizar HIN**
   Copie ou aponte mentalmente o Número de Casco (HIN) desse barco (ex: *HIN-V12A*).

---

### TESTE 1: INSERÇÃO LOGÍSTICA (Chão de Fábrica)
*Simula o Operador a agarrar num Rolo de Fibra e pregar o Número de Lote às costas do Barco.*

1. **Aceder ao HMI**
   No Tablet do Operador (`/operador`), clique no topo direito do Ecrã: **[ Scanner B.O.M. ]**
   *(Em alternativa aceda direto a `/operador/rastreabilidade`)*
2. **Definir Terminal**
   No canto superior direito, selecione a "Sua Estação" para desbloquear o Layout.
3. **Casar o Casco**
   Na aba **(1)** *Ler Cadastro de Casco*, digite `HIN-V12A` (o HIN real) e pressione Localizar. As barras laterais vão ficar a azul.
4. **O Scanner Laser**
   Na aba **(2)** *Casar Lote à Embarcação*:
   - Credencial Operador: *João Teste*
   - Nome Componente: *Resina V2*
   - N.º Série / Lote: *TESTE-RECALL-99*
5. **Gravação**
   Prima "GRAVAR PEÇA NO SISTEMA". Vai notar que a peça entra imediatamente na caixa de Memória de Peças à Direita do ecrã.

---

### TESTE 2: RECALL & GENEALOGIA (Engenheiros Back-Office)
*Simula o Gestor Administrativo a receber um e-mail do Fornecedor e procurar onde meteu esse Lote estragado.*

1. **Aceder à Genealogia**
   Navegue no computador do Escritório até ao Painel de Engenharia (Sidebar Esquerda da Web-App -> `/admin/engenharia/genealogia`).
2. **Motor de Busca**
   No Ecrã de Recall, pesquise na Barra Mestra pelo Pedaço do lote instalado no passo anterior: `TESTE-RECALL`. Pressione Investigar.
3. **Resultado 4.0**
   O Ecrã vai gerar a "Árvore" explodindo listado instantaneamente que a Brunswick instalou a peça `TESTE-RECALL-99` precisamente dentro do Casco `HIN-V12A`.
4. **O Resgate**
   No Canto Superior Direito prima **"Gerar Relatório de Recall (Excel)"**. Vai descarregar automaticamente a grelha de Excel provando o Match, data de instalação e utilizador para o Pós-Venda faturar a quem for culpado.

> **Teste de QA Bem Sucedido!** 🚀 O M.E.S. está vivo.
