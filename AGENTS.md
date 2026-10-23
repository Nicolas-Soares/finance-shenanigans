# Diretrizes para Agentes de IA — Projeto Calc Juros & Utilitários de Investimento

> **Atenção:** Este documento contém as regras fundamentais e mandatórias de desenvolvimento, design e arquitetura deste repositório. Qualquer agente de inteligência artificial que interaja com este código **DEVE** seguir integralmente as instruções aqui dispostas.

---

## 1. Sobre o Projeto

Este projeto é um **conjunto de utilitários financeiros para investidores**, projetado para facilitar a visualização de dados, projeções e cálculos essenciais na tomada de decisão patrimonial e estratégica.

- **Foco atual:** Calculadora avançada de Juros Compostos (projeções com aportes mensais, cálculo de taxas anual/mensal equivalentes, visão gráfica de composição do patrimônio e tabela detalhada de evolução mês a mês).
- **Visão futura:** Expansão modular de novos utilitários de investimento mantendo alto padrão visual e técnico.

---

## 2. Regras Mandatórias de Conduta do Agente

### 2.1. Leitura Prévia Obrigatória
> 🚨 **REGRA INVIOLÁVEL:** **TODO E QUALQUER AGENTE DE IA DEVE OBRIGATORIAMENTE LER OS ARQUIVOS `AGENTS.md` E `CHANGELOG.md` ANTES DE PLANEJAR OU EXECUTAR QUALQUER ALTERAÇÃO NO PROJETO.**

- **Objetivo central:**
  - Evitar retrabalho e duplicação de lógica.
  - Reutilizar o contexto existente do sistema.
  - Economizar tokens e chamadas desnecessárias, aumentando drasticamente a eficiência do agente.

### 2.2. Dúvidas e Decisões: Nunca Pressuponha Nada
> ❓ **SEMPRE que houver qualquer dúvida, ambiguidade ou detalhe não especificado, PERGUNTE AO USUÁRIO ao invés de pressupor QUALQUER coisa.**
- Não invente requisitos, regras de negócio ou alterações de layout sem antes obter confirmação explícita do usuário.
- Se houver mais de uma abordagem plausível para implementar uma funcionalidade, apresente as alternativas ao usuário e solicite sua escolha.

### 2.3. Atualização Contínua do `CHANGELOG.md`
> 📝 **SEMPRE que houver uma nova feature ou alteração grande/importante, adicione um registro detalhado no arquivo `CHANGELOG.md`.**
- O `CHANGELOG.md` serve como a memória viva do projeto para que agentes subsequentes saibam o que já foi criado, o que foi modificado e como a aplicação evoluiu.
- Registre data, versão/título, descrição sucinta e arquivos impactados (usando **apenas** caminhos relativos ao projeto).

### 2.4. Privacidade, Segurança e Higiene de Caminhos (Zero Dados Pessoais)
> 🔒 **REGRA INVIOLÁVEL:** **NENHUM caminho de arquivo local (file path absoluto como `C:\Users\...` ou URLs `file:///`), nome de usuário do sistema ou dado pessoal do desenvolvedor deve ser incluído no `CHANGELOG.md` ou em qualquer outro arquivo do projeto.**
- **Caminhos de arquivo:** Ao referenciar arquivos no `CHANGELOG.md` ou na documentação, utilize **estritamente caminhos relativos à raiz do projeto** (ex.: `frontend/styles.css` ou `src/app.js`), sem esquemas de URL `file:///` e sem referências à estrutura de pastas do computador local.
- **Dados sensíveis:** Nunca versione caminhos contendo nomes de usuários do SO, tokens, segredos ou referências à máquina pessoal do usuário.

---

## 3. Diretrizes de Interface (UI/UX) & Design System

### 3.1. Consistência Visual
- **Seguir o estilo existente:** A interface deve respeitar fielmente a linguagem visual já estabelecida no projeto:
  - Layout limpo, responsivo e moderno com cards em grid.
  - Superfícies escuras com elevação gradual e bordas sutis (`--border: rgba(255, 255, 255, 0.08)`).
  - Tipografia moderna utilizando a fonte **Inter** (`font-family: var(--font)`).
  - Ícones SVG elegantes e semânticos (inline SVG, `stroke-width: 2`, `fill: none`).
  - Animações refinadas e microinterações de foco, hover e cálculo (ex.: efeito `flash`, transição de `stroke-dashoffset` no SVG donut).

### 3.2. Paleta de Cores Base da Uniswap (Dark Theme)
Toda a aplicação utiliza e **deve continuar utilizando** a paleta oficial inspirada na **Uniswap** em modo escuro:

| Token CSS | Valor Hex / RGBA | Uso Principal |
| :--- | :--- | :--- |
| `--bg` | `#131313` | Fundo principal da página |
| `--surface-1` | `#1b1b1b` | Fundo de painéis e cards primários |
| `--surface-2` | `#222222` | Superfície secundária (inputs, botões neutros) |
| `--surface-3` | `#2a2a2a` | Superfície de destaque em hover/focus |
| `--border` | `rgba(255, 255, 255, 0.08)` | Bordas sutis de separação |
| `--border-strong` | `rgba(255, 255, 255, 0.14)` | Bordas de foco ou cards destacados |
| `--accent` | `#fc72ff` | **Uniswap Pink** (cor de destaque primária) |
| `--accent-strong` | `#ff37c7` | Variação ativa/hover do rosa |
| `--accent-soft` | `#311c31` | Fundo de badges ou destaque de acento |
| `--accent-glow` | `rgba(252, 114, 255, 0.35)` | Efeitos de sombra/brilho no foco |
| `--neutral-seg` | `#e3e3e3` | Segmento neutro (ex: total investido no gráfico) |
| `--error` | `#ff593c` | Mensagens e estados de erro |
| `--profit` | `#2cd182` | **Uniswap / DeFi Green** (ganho de capital / juros) |
| `--profit-glow` | `rgba(44, 209, 130, 0.35)` | Efeitos de sombra/brilho no lucro/juros |
| `--chart-blue` | `#4c82fb` | **Uniswap / DeFi Blue** (total acumulado no gráfico de evolução) |
| `--chart-blue-glow` | `rgba(76, 130, 251, 0.35)` | Efeitos de sombra/brilho no total acumulado |
| `--text-1` | `#ffffff` | Texto primário de alto contraste |
| `--text-2` | `#9b9b9b` | Rótulos, legendas e textos secundários |
| `--text-3` | `#5e5e5e` | Textos terciários, placeholders e desabilitados |

> **Nota:** Não introduza cores fora da identidade visual sem prévia autorização.

---

## 4. Arquitetura e Estrutura Técnica

O projeto é construído intencionalmente de forma ágil, leve e performática com separação em diretórios:

- **`frontend/index.html`**: Estrutura semântica (HTML5, formulários acessíveis com WAI-ARIA, `role="tablist"`, `aria-live="polite"` para feedbacks dinâmicos).
- **`frontend/styles.css`**: Design tokens no `:root`, reset moderno, layout responsivo em Grid/Flexbox, animações CSS otimizadas.
- **`src/app.js`**: JavaScript Vanilla modular e estrito (`'use strict'`), com separação clara de responsabilidades:
  - Manipulação do DOM & elementos.
  - Formatação e máscaras monetárias/numéricas (Intl.NumberFormat `pt-BR`).
  - Motor matemático financeiro (ex.: equivalência de taxas `(1 + i)^(1/12) - 1`, aportes no final de período).
  - Renderização de componentes dinâmicos (gráfico donut SVG, paginação de tabela).
- **`AGENTS.md`**: Diretrizes, regras e contexto para agentes de IA (este arquivo).
- **`CHANGELOG.md`**: Histórico detalhado de versões e alterações importantes.

---

## 5. Checklist do Agente Antes de Finalizar Tarefas

1. [ ] Li e consultei `AGENTS.md` e `CHANGELOG.md` antes de iniciar?
2. [ ] Todas as dúvidas ou incertezas foram esclarecidas com o usuário?
3. [ ] A UI mantém o padrão de design existente e as cores oficiais Uniswap Dark?
4. [ ] O código é semântico, limpo e não quebrou nenhuma funcionalidade prévia?
5. [ ] Foi adicionado um registro descritivo no `CHANGELOG.md` caso a mudança seja relevante ou uma nova feature?
6. [ ] Garanti que nenhum caminho absoluto local (ex.: `C:\Users\...`, `file:///...`) ou dado pessoal do desenvolvedor foi inserido no `CHANGELOG.md` ou nos arquivos do projeto?
