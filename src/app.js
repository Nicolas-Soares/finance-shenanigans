(() => {
  'use strict';

  /* ---------- Elementos ---------- */
  const $ = (id) => document.getElementById(id);

  const form = $('sim-form');
  const inValorInicial = $('valor-inicial');
  const inAporte = $('aporte-mensal');
  const inTaxa = $('taxa-juros');
  const selTaxaTipo = $('taxa-tipo');
  const inPeriodo = $('periodo');
  const selPeriodoTipo = $('periodo-tipo');
  const formError = $('form-error');
  const btnLimpar = $('btn-limpar');

  const out = {
    finalAbrev: $('final-abrev'),
    finalFull: $('final-full'),
    investidoAbrev: $('investido-abrev'),
    investidoFull: $('investido-full'),
    jurosAbrev: $('juros-abrev'),
    jurosFull: $('juros-full'),
    legInvestidoAbrev: $('leg-investido-abrev'),
    legInvestidoJuros: $('leg-investido-juros'),
    legInvestidoPct: $('leg-investido-pct'),
    legJurosFull: $('leg-juros-full'),
    legJurosPct: $('leg-juros-pct'),
    legFator: $('leg-fator'),
    legFatorDesc: $('leg-fator-desc'),
    segInvestido: $('seg-investido'),
    segJuros: $('seg-juros'),
  };

  /* ---------- Formatação ---------- */
  const brlNumber = new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const fmtBRL = (v) => `R$ ${brlNumber.format(v)}`;

  /** Abrevia valores grandes: K (mil), M (milhão), B (bilhão) com 1 casa decimal. */
  function abrev(v) {
    const abs = Math.abs(v);
    if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`;
    if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`;
    if (abs >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
    return brlNumber.format(v);
  }

  /* ---------- Máscaras de entrada ---------- */
  /** Máscara monetária: os dígitos digitados preenchem a partir dos centavos. */
  function maskCurrency(input) {
    input.addEventListener('input', () => {
      const digits = input.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 15);
      input.value = digits ? brlNumber.format(Number(digits) / 100) : '';
      clearError(input);
    });
  }

  /** Taxa: aceita dígitos e um separador decimal (vírgula ou ponto). */
  inTaxa.addEventListener('input', () => {
    let v = inTaxa.value.replace(/[^\d.,]/g, '');
    const firstSep = v.search(/[.,]/);
    if (firstSep !== -1) {
      v = v.slice(0, firstSep + 1) + v.slice(firstSep + 1).replace(/[.,]/g, '');
    }
    inTaxa.value = v;
    clearError(inTaxa);
  });

  /** Período: somente números inteiros. */
  inPeriodo.addEventListener('input', () => {
    inPeriodo.value = inPeriodo.value.replace(/\D/g, '').slice(0, 4);
    clearError(inPeriodo);
  });

  maskCurrency(inValorInicial);
  maskCurrency(inAporte);

  const parseCurrency = (s) => (s ? Number(s.replace(/\./g, '').replace(',', '.')) : 0);
  const parseDecimal = (s) => (s ? Number(s.replace(',', '.')) : NaN);

  /* ---------- Validação ---------- */
  function setError(input, msg) {
    input.setAttribute('aria-invalid', 'true');
    input.setAttribute('aria-errormessage', 'form-error');
    formError.textContent = msg;
    input.focus();
  }

  function clearError(input) {
    if (input.getAttribute('aria-invalid') === 'true') {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-errormessage');
      formError.textContent = '';
    }
  }

  /* ---------- Cálculo ---------- */
  /**
   * Juros compostos com aporte no FINAL de cada mês.
   * Taxa anual é convertida para a mensal equivalente: (1 + i)^(1/12) − 1.
   */
  function calcular({ valorInicial, aporte, taxaPct, taxaTipo, periodo, periodoTipo }) {
    const i = taxaPct / 100;
    const taxaMensal = taxaTipo === 'anual' ? Math.pow(1 + i, 1 / 12) - 1 : i;
    const meses = periodoTipo === 'anos' ? periodo * 12 : periodo;

    let montante = valorInicial;
    let jurosAcum = 0;
    const linhas = [];
    for (let m = 1; m <= meses; m++) {
      const jurosMes = montante * taxaMensal;
      montante = montante + jurosMes + aporte;
      jurosAcum += jurosMes;
      linhas.push({
        mes: m,
        jurosMes,
        investido: valorInicial + aporte * m,
        jurosAcum,
        acumulado: montante,
      });
    }

    const investido = valorInicial + aporte * meses;
    const juros = montante - investido;
    return { montante, investido, juros, linhas };
  }

  /* ---------- Renderização ---------- */
  function flash(el) {
    el.classList.remove('flash');
    void el.offsetWidth; // reinicia a animação
    el.classList.add('flash');
  }

  /* ---------- Tabela (acumulado mês a mês) ---------- */
  const POR_PAGINA = 12;
  const tableBody = $('table-body');
  const pagination = $('pagination');
  const paginationInfo = $('pagination-info');
  const pageList = $('page-list');
  const pagePrev = $('page-prev');
  const pageNext = $('page-next');

  let linhasTabela = [];
  let paginaAtual = 1;

  const totalPaginas = () => Math.max(1, Math.ceil(linhasTabela.length / POR_PAGINA));

  /** Lista de páginas com reticências: 1 … 4 5 6 … 30 */
  function paginasVisiveis(atual, total) {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const set = new Set([1, total, atual - 1, atual, atual + 1]);
    if (atual <= 3) [2, 3, 4].forEach((p) => set.add(p));
    if (atual >= total - 2) [total - 3, total - 2, total - 1].forEach((p) => set.add(p));
    const nums = [...set].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
    const result = [];
    nums.forEach((p, idx) => {
      if (idx > 0 && p - nums[idx - 1] > 1) result.push('…');
      result.push(p);
    });
    return result;
  }

  function celula(texto, classe) {
    const td = document.createElement('td');
    td.textContent = texto;
    if (classe) td.className = classe;
    return td;
  }

  function renderTabela() {
    tableBody.replaceChildren();

    if (!linhasTabela.length) {
      const tr = document.createElement('tr');
      tr.className = 'empty-row';
      const td = celula('Preencha os dados e clique em Calcular');
      td.colSpan = 5;
      tr.append(td);
      tableBody.append(tr);
      pagination.hidden = true;
      return;
    }

    const total = totalPaginas();
    const inicio = (paginaAtual - 1) * POR_PAGINA;
    const pagina = linhasTabela.slice(inicio, inicio + POR_PAGINA);

    const frag = document.createDocumentFragment();
    pagina.forEach((l) => {
      const tr = document.createElement('tr');
      tr.append(
        celula(String(l.mes)),
        celula(fmtBRL(l.jurosMes)),
        celula(fmtBRL(l.investido)),
        celula(fmtBRL(l.jurosAcum), 'col-juros'),
        celula(fmtBRL(l.acumulado), 'col-total'),
      );
      frag.append(tr);
    });
    tableBody.append(frag);
    flash(tableBody);

    // Paginação: escondida quando há apenas 1 página
    pagination.hidden = total <= 1;
    if (total <= 1) return;

    paginationInfo.textContent =
      `Mostrando ${inicio + 1}–${inicio + pagina.length} de ${linhasTabela.length}`;
    pagePrev.disabled = paginaAtual === 1;
    pageNext.disabled = paginaAtual === total;

    pageList.replaceChildren(...paginasVisiveis(paginaAtual, total).map((p) => {
      const li = document.createElement('li');
      if (p === '…') {
        li.className = 'page-ellipsis';
        li.textContent = '…';
        li.setAttribute('aria-hidden', 'true');
      } else {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'page-btn';
        btn.textContent = String(p);
        btn.dataset.page = String(p);
        btn.setAttribute('aria-label', `Página ${p}`);
        if (p === paginaAtual) btn.setAttribute('aria-current', 'page');
        li.append(btn);
      }
      return li;
    }));
  }

  function irParaPagina(p) {
    paginaAtual = Math.min(Math.max(1, p), totalPaginas());
    renderTabela();
  }

  pagePrev.addEventListener('click', () => irParaPagina(paginaAtual - 1));
  pageNext.addEventListener('click', () => irParaPagina(paginaAtual + 1));
  pageList.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-page]');
    if (btn) irParaPagina(Number(btn.dataset.page));
  });

  /* ---------- Gráfico de Evolução ---------- */
  const chartSvg = $('chart-svg');
  const chartContainer = $('chart-container');
  const chartEmpty = $('chart-empty');
  const chartYAxis = $('chart-y-axis');
  const chartXAxis = $('chart-x-axis');
  const pathAportado = $('path-aportado');
  const pathJuros = $('path-juros');
  const pathAcumulado = $('path-acumulado');
  const chartHoverIndicator = $('chart-hover-indicator');
  const hoverLine = $('hover-line');
  const hoverDotAcumulado = $('hover-dot-acumulado');
  const hoverDotAportado = $('hover-dot-aportado');
  const hoverDotJuros = $('hover-dot-juros');
  const chartTooltip = $('chart-tooltip');
  const tooltipTitle = $('tooltip-title');
  const tooltipAcumulado = $('tooltip-acumulado');
  const tooltipAportado = $('tooltip-aportado');
  const tooltipJuros = $('tooltip-juros');
  const chartFooterLeft = $('chart-footer-left');
  const filterButtons = [...document.querySelectorAll('.filter-btn')];

  const svgNS = 'http://www.w3.org/2000/svg';
  const createSvgEl = (tag, attrs = {}) => {
    const el = document.createElementNS(svgNS, tag);
    for (const [k, v] of Object.entries(attrs)) {
      el.setAttribute(k, String(v));
    }
    return el;
  };

  let chartPontosCompletos = [];
  let chartPontosAtuais = [];
  let filtroPeriodoAtual = 'all';

  function niceMax(val) {
    if (val <= 0) return 1000;
    const exp = Math.floor(Math.log10(val));
    const base = Math.pow(10, exp);
    const frac = val / base;
    let mult = 1;
    if (frac <= 1.2) mult = 1.2;
    else if (frac <= 1.5) mult = 1.5;
    else if (frac <= 2) mult = 2;
    else if (frac <= 2.5) mult = 2.5;
    else if (frac <= 3) mult = 3;
    else if (frac <= 4) mult = 4;
    else if (frac <= 5) mult = 5;
    else if (frac <= 6) mult = 6;
    else if (frac <= 8) mult = 8;
    else mult = 10;
    return mult * base;
  }

  function renderGrafico() {
    chartYAxis.replaceChildren();
    chartXAxis.replaceChildren();
    chartHoverIndicator.hidden = true;
    chartTooltip.hidden = true;

    if (!chartPontosCompletos.length || chartPontosCompletos.length <= 1) {
      chartEmpty.hidden = false;
      pathAcumulado.setAttribute('d', '');
      pathAportado.setAttribute('d', '');
      pathJuros.setAttribute('d', '');
      chartFooterLeft.textContent = 'Visualização mensal • 0 meses analisados';
      filterButtons.forEach((btn) => (btn.disabled = true));
      return;
    }

    chartEmpty.hidden = true;
    const totalMesesSimulados = chartPontosCompletos.length - 1;

    // Atualiza estado de habilitação dos botões de filtro
    const mesesYTD = Math.min(totalMesesSimulados, new Date().getMonth() + 1);
    const limitesFiltros = {
      'ytd': mesesYTD,
      '6m': 6,
      '1y': 12,
      '5y': 60,
      'all': totalMesesSimulados,
    };

    filterButtons.forEach((btn) => {
      const p = btn.dataset.period;
      if (p === 'all') {
        btn.disabled = false;
      } else if (p === 'ytd') {
        btn.disabled = totalMesesSimulados < 1;
      } else {
        btn.disabled = totalMesesSimulados < limitesFiltros[p];
      }
    });

    const botaoAtivo = filterButtons.find((b) => b.dataset.period === filtroPeriodoAtual);
    if (!botaoAtivo || botaoAtivo.disabled) {
      filtroPeriodoAtual = 'all';
      filterButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.period === 'all'));
    }

    let limite = totalMesesSimulados;
    if (filtroPeriodoAtual === '6m') limite = Math.min(totalMesesSimulados, 6);
    else if (filtroPeriodoAtual === 'ytd') limite = Math.min(totalMesesSimulados, mesesYTD);
    else if (filtroPeriodoAtual === '1y') limite = Math.min(totalMesesSimulados, 12);
    else if (filtroPeriodoAtual === '5y') limite = Math.min(totalMesesSimulados, 60);

    chartPontosAtuais = chartPontosCompletos.slice(0, limite + 1);
    const nMeses = chartPontosAtuais.length - 1;

    chartFooterLeft.textContent = `Visualização mensal • ${nMeses} ${nMeses === 1 ? 'mês analisado' : 'meses analisados'}`;

    const padLeft = 70;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 48;
    const chartW = 800 - padLeft - padRight;
    const chartH = 360 - padTop - padBottom;

    const maxValRaw = Math.max(...chartPontosAtuais.map((p) => p.acumulado), 100);
    const maxVal = niceMax(maxValRaw);

    // Eixo Y: 5 linhas horizontais
    const passosY = 4;
    for (let s = 0; s <= passosY; s++) {
      const val = (maxVal / passosY) * s;
      const y = padTop + chartH - (val / maxVal) * chartH;

      chartYAxis.append(
        createSvgEl('line', {
          x1: padLeft,
          y1: y,
          x2: 800 - padRight,
          y2: y,
          stroke: 'rgba(255, 255, 255, 0.10)',
          'stroke-dasharray': '4 4',
          'stroke-width': 1,
        })
      );

      const textY = createSvgEl('text', {
        x: padLeft - 10,
        y: y + 4,
        'text-anchor': 'end',
        fill: 'var(--text-2)',
        'font-size': '11',
        'font-family': 'var(--font)',
      });
      textY.textContent = val === 0 ? 'R$ 0,00' : `R$ ${abrev(val)}`;
      chartYAxis.append(textY);
    }

    // Eixo X: marcas de meses
    const marcas = [0];
    if (nMeses > 0) {
      let passoMes = 1;
      if (nMeses <= 6) passoMes = 1;
      else if (nMeses <= 12) passoMes = 3;
      else if (nMeses <= 24) passoMes = 6;
      else if (nMeses <= 60) passoMes = 12;
      else if (nMeses <= 120) passoMes = 24;
      else passoMes = Math.ceil(nMeses / 5 / 12) * 12;

      for (let m = passoMes; m < nMeses; m += passoMes) {
        marcas.push(m);
      }
      if (!marcas.includes(nMeses)) marcas.push(nMeses);
    }

    marcas.forEach((m) => {
      const x = padLeft + (m / (nMeses || 1)) * chartW;
      const textX = createSvgEl('text', {
        x,
        y: padTop + chartH + 20,
        'text-anchor': 'middle',
        fill: 'var(--text-2)',
        'font-size': '11',
        'font-family': 'var(--font)',
      });
      textX.textContent = String(m);
      chartXAxis.append(textX);
    });

    const labelMeses = createSvgEl('text', {
      x: padLeft + chartW / 2,
      y: 350,
      'text-anchor': 'middle',
      fill: 'var(--text-3)',
      'font-size': '11',
      'font-family': 'var(--font)',
    });
    labelMeses.textContent = 'Meses';
    chartXAxis.append(labelMeses);

    // Linhas das 3 séries
    const coordX = (m) => padLeft + (m / (nMeses || 1)) * chartW;
    const coordY = (v) => padTop + chartH - (v / maxVal) * chartH;

    let dAcumulado = '';
    let dAportado = '';
    let dJuros = '';

    chartPontosAtuais.forEach((p, idx) => {
      const x = coordX(p.mes).toFixed(1);
      const yAcum = coordY(p.acumulado).toFixed(1);
      const yAport = coordY(p.investido).toFixed(1);
      const yJur = coordY(p.juros).toFixed(1);

      const cmd = idx === 0 ? 'M' : 'L';
      dAcumulado += `${cmd} ${x} ${yAcum} `;
      dAportado += `${cmd} ${x} ${yAport} `;
      dJuros += `${cmd} ${x} ${yJur} `;
    });

    pathAcumulado.setAttribute('d', dAcumulado.trim());
    pathAportado.setAttribute('d', dAportado.trim());
    pathJuros.setAttribute('d', dJuros.trim());
  }

  function aplicarFiltro(periodoId) {
    filtroPeriodoAtual = periodoId;
    filterButtons.forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.period === periodoId);
    });
    renderGrafico();
  }

  filterButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      if (!btn.disabled) aplicarFiltro(btn.dataset.period);
    });
  });

  function atualizarTooltip(e) {
    if (!chartPontosAtuais.length || chartPontosAtuais.length <= 1) return;

    const rect = chartSvg.getBoundingClientRect();
    const clientX = e.clientX - rect.left;
    const scaleX = 800 / rect.width;
    const svgX = clientX * scaleX;

    const padLeft = 70;
    const padRight = 24;
    const padTop = 24;
    const padBottom = 48;
    const chartW = 800 - padLeft - padRight;
    const chartH = 360 - padTop - padBottom;
    const nMeses = chartPontosAtuais.length - 1;

    if (svgX < padLeft - 10 || svgX > 800 - padRight + 10) {
      chartHoverIndicator.hidden = true;
      chartTooltip.hidden = true;
      return;
    }

    const relX = Math.max(0, Math.min(chartW, svgX - padLeft));
    const targetIdx = Math.round((relX / chartW) * nMeses);
    const ponto = chartPontosAtuais[targetIdx];
    if (!ponto) return;

    const curX = padLeft + (ponto.mes / nMeses) * chartW;
    const maxValRaw = Math.max(...chartPontosAtuais.map((p) => p.acumulado), 100);
    const maxVal = niceMax(maxValRaw);

    const curYAcum = padTop + chartH - (ponto.acumulado / maxVal) * chartH;
    const curYAport = padTop + chartH - (ponto.investido / maxVal) * chartH;
    const curYJur = padTop + chartH - (ponto.juros / maxVal) * chartH;

    hoverLine.setAttribute('x1', curX);
    hoverLine.setAttribute('x2', curX);
    hoverLine.setAttribute('y1', padTop);
    hoverLine.setAttribute('y2', padTop + chartH);

    hoverDotAcumulado.setAttribute('cx', curX);
    hoverDotAcumulado.setAttribute('cy', curYAcum);

    hoverDotAportado.setAttribute('cx', curX);
    hoverDotAportado.setAttribute('cy', curYAport);

    hoverDotJuros.setAttribute('cx', curX);
    hoverDotJuros.setAttribute('cy', curYJur);

    chartHoverIndicator.hidden = false;

    let titulo = '';
    if (ponto.mes === 0) {
      titulo = 'Início (Mês 0)';
    } else if (ponto.mes % 12 === 0) {
      titulo = `${ponto.mes / 12} ${ponto.mes === 12 ? 'ano' : 'anos'}`;
    } else if (ponto.mes < 12) {
      titulo = `${ponto.mes} ${ponto.mes === 1 ? 'mês' : 'meses'}`;
    } else {
      titulo = `${Math.floor(ponto.mes / 12)}a ${ponto.mes % 12}m (${ponto.mes} meses)`;
    }

    tooltipTitle.textContent = titulo;
    tooltipAcumulado.textContent = fmtBRL(ponto.acumulado);
    tooltipAportado.textContent = fmtBRL(ponto.investido);
    tooltipJuros.textContent = fmtBRL(ponto.juros);

    const pctX = (curX / 800) * 100;
    const pctY = (curYAcum / 360) * 100;

    chartTooltip.style.left = `${pctX}%`;
    chartTooltip.style.top = `${Math.max(12, pctY)}%`;

    if (pctX > 75) {
      chartTooltip.style.transform = 'translate(-98%, -35%)';
    } else if (pctX < 25) {
      chartTooltip.style.transform = 'translate(-2%, -35%)';
    } else {
      chartTooltip.style.transform = 'translate(-50%, -115%)';
    }

    chartTooltip.hidden = false;
  }

  function esconderTooltip() {
    chartHoverIndicator.hidden = true;
    chartTooltip.hidden = true;
  }

  chartContainer.addEventListener('pointermove', atualizarTooltip);
  chartContainer.addEventListener('pointerleave', esconderTooltip);

  /* ---------- Abas ---------- */
  const tabs = [...document.querySelectorAll('.tabs [role="tab"]')];

  function ativarAba(tab) {
    tabs.forEach((t) => {
      const ativa = t === tab;
      t.classList.toggle('is-active', ativa);
      t.setAttribute('aria-selected', String(ativa));
      t.tabIndex = ativa ? 0 : -1;
      const painelId = t.getAttribute('aria-controls');
      if (painelId) $(painelId).hidden = !ativa;
    });
  }

  tabs.forEach((t) => t.addEventListener('click', () => ativarAba(t)));

  // Navegação por setas entre abas habilitadas
  document.querySelector('.tabs').addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    const habilitadas = tabs.filter((t) => !t.disabled);
    const idx = habilitadas.indexOf(document.activeElement);
    if (idx === -1) return;
    const prox = habilitadas[(idx + (e.key === 'ArrowRight' ? 1 : -1) + habilitadas.length) % habilitadas.length];
    prox.focus();
    ativarAba(prox);
  });

  function render({ montante, investido, juros, linhas = [], valorInicial = 0 }) {
    linhasTabela = linhas;
    paginaAtual = 1;
    renderTabela();

    if (linhas.length > 0) {
      chartPontosCompletos = [
        { mes: 0, jurosMes: 0, investido: valorInicial, jurosAcum: 0, acumulado: valorInicial },
        ...linhas.map((l) => ({
          mes: l.mes,
          jurosMes: l.jurosMes,
          investido: l.investido,
          juros: l.jurosAcum,
          acumulado: l.acumulado,
        })),
      ];
    } else {
      chartPontosCompletos = [];
    }

    filtroPeriodoAtual = 'all';
    filterButtons.forEach((b) => b.classList.toggle('is-active', b.dataset.period === 'all'));
    renderGrafico();
    const pctInvestido = montante > 0 ? (investido / montante) * 100 : 0;
    const pctJuros = montante > 0 ? (juros / montante) * 100 : 0;
    const fator = investido > 0 ? montante / investido : 0;

    out.finalAbrev.textContent = abrev(montante);
    out.finalFull.textContent = fmtBRL(montante);

    out.investidoAbrev.textContent = abrev(investido);
    out.investidoFull.textContent = fmtBRL(investido);

    out.jurosAbrev.textContent = `+ ${abrev(juros)}`;
    out.jurosFull.textContent = brlNumber.format(juros);

    // "Total Investido": total investido (grande), total de juros (R$) e % do total aplicado
    out.legInvestidoAbrev.textContent = abrev(investido);
    out.legInvestidoJuros.textContent = fmtBRL(juros);
    out.legInvestidoPct.textContent = `${pctInvestido.toFixed(1)}% do total`;

    out.legJurosFull.textContent = fmtBRL(juros);
    out.legJurosPct.textContent = `${pctJuros.toFixed(1)}% do total`;

    out.legFator.textContent = `${fator.toFixed(1)}x`;
    out.legFatorDesc.textContent = `Seu dinheiro multiplicou ${fator.toFixed(1)} vezes`;

    // Donut (pathLength = 100)
    out.segInvestido.style.strokeDasharray = `${pctInvestido} ${100 - pctInvestido}`;
    out.segInvestido.style.strokeDashoffset = '0';
    out.segJuros.style.strokeDasharray = `${pctJuros} ${100 - pctJuros}`;
    out.segJuros.style.strokeDashoffset = `${-pctInvestido}`;

    document.querySelectorAll('.card-value, .legend-big').forEach(flash);
  }

  /* ---------- Eventos ---------- */
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const valorInicial = parseCurrency(inValorInicial.value);
    const aporte = parseCurrency(inAporte.value);
    const taxaPct = parseDecimal(inTaxa.value);
    const periodo = Number(inPeriodo.value);

    if (valorInicial <= 0 && aporte <= 0) {
      return setError(inValorInicial, 'Informe um valor inicial ou um aporte mensal maior que zero.');
    }
    if (!Number.isFinite(taxaPct)) {
      return setError(inTaxa, 'Informe a taxa de juros.');
    }
    if (!inPeriodo.value || periodo <= 0) {
      return setError(inPeriodo, 'Informe um período maior que zero.');
    }

    formError.textContent = '';
    render({
      ...calcular({
        valorInicial,
        aporte,
        taxaPct,
        taxaTipo: selTaxaTipo.value,
        periodo,
        periodoTipo: selPeriodoTipo.value,
      }),
      valorInicial,
    });
  });

  btnLimpar.addEventListener('click', () => {
    form.reset();
    [inValorInicial, inAporte, inTaxa, inPeriodo].forEach(clearError);
    formError.textContent = '';
    render({ montante: 0, investido: 0, juros: 0, linhas: [], valorInicial: 0 });
    inValorInicial.focus();
  });

  // Estado inicial: campos vazios e resultados zerados
  render({ montante: 0, investido: 0, juros: 0, linhas: [], valorInicial: 0 });
})();
