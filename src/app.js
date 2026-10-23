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

  function render({ montante, investido, juros, linhas = [] }) {
    linhasTabela = linhas;
    paginaAtual = 1;
    renderTabela();
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
    render(calcular({
      valorInicial,
      aporte,
      taxaPct,
      taxaTipo: selTaxaTipo.value,
      periodo,
      periodoTipo: selPeriodoTipo.value,
    }));
  });

  btnLimpar.addEventListener('click', () => {
    form.reset();
    [inValorInicial, inAporte, inTaxa, inPeriodo].forEach(clearError);
    formError.textContent = '';
    render({ montante: 0, investido: 0, juros: 0 });
    inValorInicial.focus();
  });

  // Estado inicial: campos vazios e resultados zerados
  render({ montante: 0, investido: 0, juros: 0 });
})();
