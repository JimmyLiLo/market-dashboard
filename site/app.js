(() => {
  const CFG = window.MK_CONFIG || {};
  const INDS = window.MK_INDICATORS;
  const GROUPS = window.MK_GROUPS;
  const state = {series: {}, updatedAt: null, months: 12};

  const $ = (sel) => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const fmt = (v, dp) => v.toLocaleString('en-US', {minimumFractionDigits: dp, maximumFractionDigits: dp});
  const sign = (x) => (x > 0 ? '+' : x < 0 ? '−' : '±');
  const tone = (x) => (x > 0 ? 'up' : x < 0 ? 'down' : '');

  // ---------- 頁面導覽 ----------
  const nav = $('#nav');
  for (const p of window.MK_PAGES) {
    const a = el('a', null, p.name);
    a.href = `#${p.id}`;
    nav.append(a);
  }
  const route = () => {
    const id = location.hash.slice(1) || window.MK_PAGES[0].id;
    for (const p of window.MK_PAGES) {
      const sec = document.getElementById(`page-${p.id}`);
      if (sec) sec.hidden = p.id !== id;
    }
    for (const a of nav.querySelectorAll('a')) {
      if (a.hash === `#${id}`) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  };
  addEventListener('hashchange', route);
  route();

  // ---------- 資料 ----------
  const parseCsv = (text) => text.trim().split(/\r?\n/).slice(1)
    .map((l) => l.split(','))
    .filter((c) => c.length >= 2 && c[0])
    .map((c) => [c[0].trim(), Number(c[1])]);

  async function load() {
    const bust = `t=${Date.now()}`;
    const src = CFG.api ? `${CFG.api.replace(/\/$/, '')}/market?${bust}` : `data/market.json?${bust}`;
    const [market, ...csvs] = await Promise.all([
      fetch(src).then((r) => (r.ok ? r.json() : Promise.reject(new Error(r.status)))),
      ...INDS.filter((i) => i.csv).map((i) => fetch(`${i.csv}?${bust}`).then((r) => r.text()).then((t) => [i.id, parseCsv(t)])),
    ]);
    const series = {};
    for (const [id, s] of Object.entries(market.series || {})) series[id] = {rows: s.rows, stale: !!s.stale};
    for (const [id, rows] of csvs) series[id] = {rows, manual: true};
    state.series = series;
    state.updatedAt = market.updatedAt;
    state.live = !!CFG.api;
  }

  const toPoints = (rows) => rows
    .map(([d, v]) => ({d: new Date(`${d}T00:00:00Z`), date: d, v: Number(v)}))
    .filter((p) => !isNaN(p.d) && Number.isFinite(p.v))
    .sort((a, b) => a.d - b.d);
  const lastMonths = (s, m) => {
    if (!s.length) return s;
    const cut = d3.utcMonth.offset(s[s.length - 1].d, -m);
    return s.filter((p) => p.d >= cut);
  };
  const summary = (ind) => {
    const s = toPoints(state.series[ind.id]?.rows || []);
    const last = s.at(-1), prev = s.at(-2);
    if (!last) return null;
    const change = prev ? last.v - prev.v : null;
    const pct = prev ? change / prev.v : null;
    let text = '—';
    if (change != null) {
      text = ind.changeIn === 'bp'
        ? `${sign(change)}${Math.abs(change * 100).toFixed(1)} bp`
        : `${sign(change)}${fmt(Math.abs(change), ind.dp)}（${sign(change)}${Math.abs(pct * 100).toFixed(2)}%）`;
    }
    return {s, last, change, pct, text};
  };

  // ---------- 圖 ----------
  let gradSeq = 0;
  const gradient = (svg, color) => {
    const id = `g${++gradSeq}`;
    const g = svg.append('defs').append('linearGradient').attr('id', id).attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 1);
    [[0, .24], [.5, .07], [1, 0]].forEach(([o, a]) => g.append('stop').attr('offset', o).attr('stop-color', color).attr('stop-opacity', a));
    return `url(#${id})`;
  };
  const accent = () => getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();

  function spark(box, s) {
    box.replaceChildren();
    if (s.length < 2) return;
    const W = Math.max(box.clientWidth, 120), H = 40, c = accent();
    const x = d3.scaleUtc(d3.extent(s, (p) => p.d), [2, W - 4]);
    const y = d3.scaleLinear(d3.extent(s, (p) => p.v), [H - 3, 3]);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('aria-hidden', 'true');
    svg.append('path').attr('d', d3.area().x((p) => x(p.d)).y0(H).y1((p) => y(p.v))(s)).attr('fill', gradient(svg, c));
    svg.append('path').attr('d', d3.line().x((p) => x(p.d)).y((p) => y(p.v))(s)).attr('fill', 'none').attr('stroke', c).attr('stroke-width', 1.5).attr('stroke-linejoin', 'round');
    const l = s.at(-1);
    svg.append('circle').attr('cx', x(l.d)).attr('cy', y(l.v)).attr('r', 2.5).attr('fill', c);
  }

  function chart(box, s, ind) {
    box.replaceChildren();
    if (s.length < 2) {
      box.append(el('div', 'empty', '這段期間沒有資料'));
      return;
    }
    const W = Math.max(box.clientWidth, 260), H = 230, mt = 12, mb = 26, c = accent();
    const fv = (v) => fmt(v, ind.dp);
    const y = d3.scaleLinear(d3.extent(s, (p) => p.v), [H - mb, mt]).nice(4);
    const svg = d3.select(box).append('svg').attr('width', '100%').attr('viewBox', `0 0 ${W} ${H}`).attr('role', 'img').attr('aria-label', `${ind.name}走勢圖`);
    const yt = y.ticks(4), yf = y.tickFormat(4, ',');
    const ylab = svg.append('g').selectAll('text').data(yt).join('text').attr('class', 'tick').text(yf);
    const ml = (d3.max(ylab.nodes(), (n) => n.getComputedTextLength()) || 0) + 10;
    const l = s.at(-1);
    const end = svg.append('text').attr('class', 'endlabel').text(fv(l.v));
    const mr = end.node().getComputedTextLength() + 12;
    const x = d3.scaleUtc(d3.extent(s, (p) => p.d), [ml, W - mr]);
    ylab.attr('x', ml - 8).attr('y', (v) => y(v)).attr('text-anchor', 'end').attr('dominant-baseline', 'middle');
    svg.insert('g', ':first-child').selectAll('line').data(yt).join('line')
      .attr('x1', ml).attr('x2', W - mr).attr('y1', (v) => y(v)).attr('y2', (v) => y(v)).attr('stroke', 'var(--grid)');
    const span = (l.d - s[0].d) / 864e5;
    const xf = d3.utcFormat(span <= 100 ? '%-m/%-d' : '%Y/%-m');
    svg.append('g').selectAll('text').data(x.ticks(Math.max(2, Math.floor((W - ml - mr) / 90)))).join('text')
      .attr('class', 'tick').attr('x', (d) => x(d)).attr('y', H - 6).attr('text-anchor', 'middle').text(xf);
    svg.append('line').attr('x1', ml).attr('x2', W - mr).attr('y1', H - mb).attr('y2', H - mb).attr('stroke', 'var(--line)');
    svg.append('path').attr('d', d3.area().x((p) => x(p.d)).y0(H - mb).y1((p) => y(p.v))(s)).attr('fill', gradient(svg, c));
    svg.append('path').attr('d', d3.line().x((p) => x(p.d)).y((p) => y(p.v))(s))
      .attr('fill', 'none').attr('stroke', c).attr('stroke-width', 2).attr('stroke-linejoin', 'round').attr('stroke-linecap', 'round');
    svg.append('circle').attr('cx', x(l.d)).attr('cy', y(l.v)).attr('r', 3.5).attr('fill', c);
    end.attr('x', x(l.d) + 7).attr('y', y(l.v)).attr('dominant-baseline', 'middle');

    const rule = svg.append('line').attr('y1', mt).attr('y2', H - mb).attr('stroke', 'var(--muted)').attr('stroke-dasharray', '3 3').attr('visibility', 'hidden');
    const dot = svg.append('circle').attr('r', 4).attr('fill', c).attr('stroke', 'var(--panel)').attr('stroke-width', 2).attr('visibility', 'hidden');
    const tip = el('div', 'tip');
    tip.hidden = true;
    const tD = el('div'), tV = el('div');
    tip.append(tD, tV);
    box.append(tip);
    const bis = d3.bisector((p) => p.d).center;
    const df = d3.utcFormat('%Y/%-m/%-d');
    svg.append('rect').attr('x', ml).attr('y', mt).attr('width', Math.max(0, W - mr - ml)).attr('height', H - mb - mt).attr('fill', 'transparent')
      .on('pointermove', (ev) => {
        const p = s[bis(s, x.invert(d3.pointer(ev)[0]))];
        const cx = x(p.d), cy = y(p.v);
        rule.attr('x1', cx).attr('x2', cx).attr('visibility', 'visible');
        dot.attr('cx', cx).attr('cy', cy).attr('visibility', 'visible');
        tD.textContent = df(p.d);
        tV.textContent = `${fv(p.v)} ${ind.unit}`;
        tip.hidden = false;
        const k = box.clientWidth / W;
        let left = cx * k + 10;
        if (left + tip.offsetWidth > box.clientWidth) left = cx * k - tip.offsetWidth - 10;
        tip.style.left = `${Math.max(0, left)}px`;
        tip.style.top = `${Math.max(0, cy * k - 40)}px`;
      })
      .on('pointerleave', () => {
        rule.attr('visibility', 'hidden');
        dot.attr('visibility', 'hidden');
        tip.hidden = true;
      });
  }

  // ---------- 畫面 ----------
  const tiles = $('#tiles'), groups = $('#groups');
  const tileEls = {}, chartEls = {};
  for (const ind of INDS) {
    const t = el('article', 'tile');
    const val = el('div', 'val');
    const chg = el('div', 'chg');
    const sp = el('div', 'spark');
    const asof = el('div', 'asof');
    t.append(el('h3', null, ind.name), val, chg, sp, asof);
    tiles.append(t);
    tileEls[ind.id] = {val, chg, sp, asof};
  }
  for (const g of GROUPS) {
    const items = INDS.filter((i) => i.group === g.id);
    if (!items.length) continue;
    const sec = el('section', 'group');
    const cards = el('div', 'cards');
    sec.append(el('h2', null, g.name), cards);
    for (const ind of items) {
      const c = el('article', 'card');
      const box = el('div', 'chart');
      c.append(el('h3', null, `${ind.name}（${ind.unit}）`), el('p', 'note', ind.note), box);
      cards.append(c);
      chartEls[ind.id] = box;
    }
    groups.append(sec);
  }

  function render() {
    let mover = null;
    for (const ind of INDS) {
      const e = tileEls[ind.id], sm = summary(ind), ser = state.series[ind.id];
      e.val.replaceChildren();
      if (!sm) {
        e.val.textContent = '—';
        e.chg.textContent = '';
        e.sp.replaceChildren();
        e.asof.textContent = '沒有資料';
        chart(chartEls[ind.id], [], ind);
        continue;
      }
      e.val.append(document.createTextNode(fmt(sm.last.v, ind.dp)), el('small', null, ind.unit));
      e.chg.className = `chg ${tone(sm.change)}`;
      e.chg.replaceChildren(document.createTextNode(sm.text), el('span', null, ' 較前一交易日'));
      spark(e.sp, lastMonths(sm.s, 3));
      e.asof.className = `asof${ser.stale ? ' stale' : ''}`;
      e.asof.textContent = `近3個月 · 截至 ${sm.last.date}${ser.stale ? ' · 這次沒抓到，顯示上次資料' : ser.manual ? ' · 手動更新' : ''}`;
      chart(chartEls[ind.id], lastMonths(sm.s, state.months), ind);
      if (Number.isFinite(sm.pct) && (!mover || Math.abs(sm.pct) > Math.abs(mover.pct))) mover = {ind, pct: sm.pct};
    }
    const lede = $('#lede');
    lede.replaceChildren();
    if (mover) {
      const b1 = el('b', null, mover.ind.short), b2 = el('b', tone(mover.pct), `${sign(mover.pct)}${Math.abs(mover.pct * 100).toFixed(2)}%`);
      lede.append('最近一個交易日變動最大的是 ', b1, '，', b2, '。');
    }
    if (state.updatedAt) {
      const t = new Date(state.updatedAt);
      $('#stamp').textContent = `${state.live ? '即時抓取' : '資料抓取'}於 ${t.toLocaleString('zh-TW', {hour12: false})}`;
    }
  }

  async function refresh() {
    const btn = $('#refresh');
    btn.disabled = true;
    btn.textContent = '更新中…';
    try {
      await load();
      render();
    } catch (e) {
      $('#lede').textContent = `數據載入失敗（${e.message}），請稍後再按「重新整理數據」。`;
    } finally {
      btn.disabled = false;
      btn.textContent = '重新整理數據';
    }
  }

  for (const b of document.querySelectorAll('.range [data-range]')) {
    b.addEventListener('click', () => {
      state.months = Number(b.dataset.range);
      for (const o of document.querySelectorAll('.range [data-range]')) o.setAttribute('aria-pressed', String(o === b));
      render();
    });
  }
  $('#refresh').addEventListener('click', refresh);
  let rt;
  addEventListener('resize', () => {
    clearTimeout(rt);
    rt = setTimeout(render, 150);
  });
  refresh();
})();
