# Changelog — Utilitários de Investimento (Calc Juros)

Todas as alterações notáveis, novas features e melhorias estruturais deste projeto são documentadas neste arquivo.

O formato baseia-se nas convenções de [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

> **Aos agentes de IA:** Consulte este arquivo obrigatoriamente antes de qualquer desenvolvimento para compreender o histórico e o estado atual do repositório. Lembre-se de registrar novas alterações e features aqui após a conclusão.

---

## [1.2.0] - 2026-10-22

### Modificado
- **Cor de Destaque para Ganho de Capital / Lucro**:
  - Introduzido token `--profit: #2cd182` (verde claro estilo Uniswap/DeFi) e `--profit-glow: rgba(44, 209, 130, 0.35)`.
  - Aplicada a cor verde claro nos números de lucro/juros:
    - Card **Total em juros** do topo (valor principal abreviado `+ 0,00` e subvalor monetário `R$ 0,00`).
    - Aba **Tabela**: coluna **Total Juros** estilizada em verde claro com peso semibold.
    - Aba **Composição**: valores em R$ de juros da legenda patrimonial (`#leg-juros-full` e `#leg-investido-juros`).
    - Gráfico Donut: segmento de juros (`.donut-juros`) e marcador da legenda (`.dot-juros`) atualizados com a cor verde claro e glow para coerência visual.
- **Estrutura de Pastas**:
  - Reorganização dos arquivos do projeto em `frontend/` (`index.html`, `styles.css`) e `src/` (`app.js`).

---

## [1.1.0] - 2026-10-22

### Adicionado
- **Configuração de Diretrizes para Agentes de IA (`AGENTS.md`)**:
  - Documento de referência obrigatório com regras de conduta, arquitetura, checklist de entrega e design system.
  - Regra mandatória de leitura prévia de `AGENTS.md` e `CHANGELOG.md` antes de qualquer alteração no projeto para economia de tokens e contexto.
  - Instrução rigorosa para questionar o usuário diante de qualquer dúvida em vez de realizar suposições.
  - Definição estrita da paleta Uniswap Dark e consistência visual da interface.

---

## [1.0.0] - 2026-10-22

### Adicionado
- **Lançamento Inicial da Calculadora de Juros Compostos**:
  - Formulário completo para simulação de investimentos:
    - Campo de **Valor Inicial** com máscara de moeda brasileira (R$).
    - Campo de **Aporte Mensal** com máscara monetária.
    - Campo de **Taxa de Juros** com seletor de periodicidade (Anual vs Mensal, com cálculo exato de equivalência `(1+i)^(1/12) - 1`).
    - Campo de **Período** com seletor de unidade (Meses vs Anos).
    - Botões para calcular e limpar filtros.
  - **Cards de Resumo de Resultados**:
    - Valor total final (com versão abreviada em K/M/B e valor por extenso).
    - Valor total investido.
    - Total acumulado em juros (com destaque na cor acento Uniswap).
  - **Abas de Visualização**:
    - **Aba Composição**: Gráfico donut SVG dinâmico, legendas percentuais e fator multiplicador patrimonial.
    - **Aba Tabela**: Detalhamento mês a mês (Juros do Mês, Total Investido, Total Juros, Total Acumulado) com paginação inteligente de 12 itens por página.
  - **Identidade Visual e Design System**:
    - Tema escuro inspirado na paleta da **Uniswap** (fundos escuros, acentos `#fc72ff` / `#ff37c7`, foco suave, tipografia Inter).
    - Acessibilidade semântica com ARIA attributes e navegação por teclado.
