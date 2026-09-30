// 시퀀스 그림: 흐름 그림과 캔버스(UC-05 시퀀스 예시)에서 같이 쓴다. 견본 v2 buildViewer의 그림 부분.
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const NS = 'http://www.w3.org/2000/svg';
  const COL = 140, M0 = 14, BAND = 42;
  let serial = 0; // marker id 접두사용

  const el = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    Object.keys(attrs).forEach(k => e.setAttribute(k, attrs[k]));
    if (parent) parent.appendChild(e);
    return e;
  };
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  UCV.view.seqDraw = function (host, opts) {
    const parts = opts.participants || [];
    const seq = opts.seq || [];
    const hasSteps = Array.isArray(opts.steps);
    const pre = 'ucv-seq' + (++serial) + '-';

    // 'constructor' 같은 이름이 Object 원형에 걸리지 않게 원형 없는 객체를 쓴다
    const partIndex = Object.create(null), partById = Object.create(null);
    parts.forEach((p, i) => { partIndex[p.id] = i; partById[p.id] = p; });

    // 메시지만 골라 순서 번호를 매긴다(FR-024)
    const msgs = [], order = Object.create(null);
    seq.forEach(it => {
      if (it && !it.frame && it.id) {
        if (!(it.from in partIndex) || !(it.to in partIndex)) {
          UCV.bug("흐름 메시지 '" + it.id + "'의 참여자가 목록에 없습니다");
          return;
        }
        order[it.id] = msgs.length;
        msgs.push(it);
      }
    });
    const numberOf = id => (id in order ? order[id] + 1 : 0);
    const kindOf = m => (m.from === m.to ? 'self' : (m.from === m.owner ? 'return' : 'call'));

    // 단계 띠 열: 시작 순서로 정렬해 겹치지 않는 가장 왼쪽 열에 놓는다
    const bands = [];
    if (hasSteps) {
      opts.steps.forEach(s => {
        if (!s.msgs) return;
        const a = order[s.msgs[0]], b = order[s.msgs[1]];
        if (a === undefined || b === undefined) {
          UCV.bug('단계 ' + s.no + '의 msgs id가 흐름에 없습니다');
          return;
        }
        bands.push({ s, from: Math.min(a, b), to: Math.max(a, b), col: 0 });
      });
      const cols = [];
      bands.slice().sort((x, y) => x.from - y.from).forEach(bd => {
        let c = 0;
        while (cols[c] && cols[c].some(o => !(bd.to < o.from || bd.from > o.to))) c++;
        (cols[c] = cols[c] || []).push(bd);
        bd.col = c;
      });
    }
    const nCols = bands.reduce((n, bd) => Math.max(n, bd.col + 1), 0);
    const GUT = hasSteps ? 12 + BAND * Math.max(nCols, 1) : 0;
    const W = GUT + M0 * 2 + COL * parts.length;
    const cx = id => GUT + M0 + COL / 2 + partIndex[id] * COL;

    host.innerHTML = '';
    const svg = el('svg', {
      class: 'seq' + (opts.mini ? ' seq-mini' : ''), role: 'img',
      'aria-label': opts.ariaLabel || '부품끼리 주고받는 메시지'
    });
    const defs = el('defs', {}, svg);
    const marker = (id, cls, open) => {
      const m = el('marker', { id: pre + id, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '9', markerHeight: '9', markerUnits: 'userSpaceOnUse', orient: 'auto' }, defs);
      el('path', { d: open ? 'M1,1 L9,5 L1,9' : 'M0,0 L10,5 L0,10 z', class: cls + (open ? ' mk-open' : '') }, m);
    };
    marker('ah-ink', 'mk-ink', false);
    marker('ah-sel', 'mk-sel', false);
    marker('ao-ink', 'mk-ink', true);
    marker('ao-sel', 'mk-sel', true);
    const mref = (ret, sel) => 'url(#' + pre + (ret ? 'ao' : 'ah') + '-' + (sel ? 'sel' : 'ink') + ')';

    const layerLife = el('g', {}, svg), layerFrag = el('g', {}, svg), layerGut = el('g', {}, svg);
    const layerMsg = el('g', {}, svg), layerHead = el('g', {}, svg);
    let y = 84;
    const msgEls = [], msgPos = {}, frags = [], stack = [];

    const label = (g, x, yy, n, text, anchor) => {
      const t = el('text', { x, y: yy, 'text-anchor': anchor, class: 'halo' }, g);
      el('tspan', { class: 'num' }, t).textContent = n + '  ';
      el('tspan', { class: 'lbl' }, t).textContent = text;
    };

    seq.forEach(it => {
      if (!it) return;
      if (it.frame === 'alt') {
        const f = { top: y - 6, guard: it.label || '', elses: [], depth: stack.length };
        stack.push(f); frags.push(f);
        y += 24;
      } else if (it.frame === 'else') {
        const f = stack[stack.length - 1];
        if (!f) { UCV.bug('흐름의 else 앞에 alt가 없습니다'); return; }
        f.elses.push({ y: y - 4, guard: it.label || '' });
        y += 22;
      } else if (it.frame === 'end') {
        const f = stack.pop();
        if (!f) { UCV.bug('흐름의 end 앞에 alt가 없습니다'); return; }
        f.bottom = y - 2;
        y += 12;
      } else if (it.id in order) {
        const n = numberOf(it.id), kind = kindOf(it), ret = kind === 'return';
        const g = el('g', { class: 'msg', 'data-id': it.id }, layerMsg);
        const x1 = cx(it.from), x2 = cx(it.to);
        let path;
        if (kind === 'self') {
          el('rect', { class: 'msghit', x: x1 - 6, y: y - 2, width: 240, height: 30, rx: 4 }, g);
          path = el('path', { d: `M${x1 + 1},${y + 4} H${x1 + 34} V${y + 20} H${x1 + 3}`, class: 'ln2' }, g);
          label(g, x1 + 42, y + 17, n, it.text, 'start');
          msgPos[it.id] = { top: y - 2, bottom: y + 28 };
          y += 36;
        } else {
          const lo = Math.min(x1, x2), hi = Math.max(x1, x2);
          el('rect', { class: 'msghit', x: lo - 6, y: y - 4, width: hi - lo + 12, height: 32, rx: 4 }, g);
          label(g, (x1 + x2) / 2, y + 11, n, it.text, 'middle');
          const dir = x2 > x1 ? -1 : 1;
          path = el('path', { d: `M${x1},${y + 20} H${x2 + dir}`, class: 'ln2' + (ret ? ' ret' : '') }, g);
          msgPos[it.id] = { top: y - 4, bottom: y + 28 };
          y += 38;
        }
        path.setAttribute('marker-end', mref(ret, false));
        g.addEventListener('click', () => { if (opts.onPart) opts.onPart(it.owner, it.op); });
        msgEls.push({ g, path, m: it, ret });
      }
    });
    if (stack.length) {
      UCV.bug('흐름의 alt가 end로 닫히지 않았습니다');
      while (stack.length) stack.pop().bottom = y - 2;
    }

    const H = y + 8;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);

    // 틀(alt/else). 안쪽 틀은 조금씩 들여 그린다
    frags.forEach(f => {
      const fx = GUT + 6 + f.depth * 6, fw = W - GUT - 12 - f.depth * 12;
      el('rect', { class: 'frag', x: fx, y: f.top, width: fw, height: f.bottom - f.top }, layerFrag);
      el('path', { class: 'fragtag', d: `M${fx},${f.top} h40 v14 l-7,7 h-33 z` }, layerFrag);
      el('text', { x: fx + 8, y: f.top + 15, class: 'fragkw', 'text-anchor': 'start' }, layerFrag).textContent = 'alt';
      el('text', { x: fx + 50, y: f.top + 15, class: 'guard', 'text-anchor': 'start' }, layerFrag).textContent = f.guard;
      f.elses.forEach(e => {
        el('line', { class: 'elsel', x1: fx, x2: fx + fw, y1: e.y, y2: e.y }, layerFrag);
        el('text', { x: fx + 8, y: e.y + 15, class: 'guard', 'text-anchor': 'start' }, layerFrag).textContent = e.guard;
      });
    });

    // 왼쪽 띠: 본문 단계
    const bandEls = {};
    if (hasSteps) {
      el('line', { class: 'gut-sep', x1: GUT - 4, x2: GUT - 4, y1: 66, y2: H - 6 }, layerGut);
      el('text', { class: 'gut-head', x: 8, y: 72 }, layerGut).textContent = (opts.uc ? opts.uc + ' ' : '') + '단계';
      bands.forEach(bd => {
        const s = bd.s, no = String(s.no), alt = s.flow === 'alt';
        const text = alt ? no : '기본 ' + no;
        const x = 10 + BAND * bd.col;
        const top = msgPos[msgs[bd.from].id].top + 2, bottom = msgPos[msgs[bd.to].id].bottom - 2;
        const g = el('g', { class: 'ucb' + (alt ? ' alt' : ''), 'data-step': no, tabindex: '0', role: 'button', 'aria-label': `본문 ${text} 단계 표시` }, layerGut);
        el('rect', { class: 'ucb-hit', x: x - 4, y: top, width: BAND, height: bottom - top }, g);
        el('path', { d: `M${x + 9},${top} H${x} V${bottom} H${x + 9}` }, g);
        el('text', { x: x + 6, y: top + 14 }, g).textContent = text;
        const fire = () => { if (opts.onStep) opts.onStep(s.no); };
        g.addEventListener('click', fire);
        g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
        bandEls[no] = { g, bd };
      });
    }

    // 참여자 머리와 생명선
    const partEls = {}, lifeEls = {};
    parts.forEach(p => {
      const x = cx(p.id);
      lifeEls[p.id] = el('line', { class: 'life', x1: x, x2: x, y1: p.actor ? 64 : 52, y2: H - 6 }, layerLife);
      const g = el('g', { class: 'part', tabindex: '0', role: 'button', 'aria-label': p.name + ' 클래스 보기', 'data-p': p.id }, layerHead);
      if (p.actor) {
        el('rect', { class: 'hit', x: x - 40, y: 2, width: 80, height: 62, rx: 4 }, g);
        el('circle', { class: 'fig', cx: x, cy: 12, r: 7 }, g);
        el('path', { class: 'fig', d: `M${x},19 V34 M${x - 11},25 H${x + 11} M${x},34 L${x - 9},46 M${x},34 L${x + 9},46` }, g);
        el('text', { x, y: 60, 'text-anchor': 'middle', class: 'pname' }, g).textContent = p.name;
      } else {
        el('rect', { class: 'box' + (p.prop ? ' prop' : ''), x: x - 62, y: 8, width: 124, height: 44, rx: 4 }, g);
        el('text', { x, y: 35, 'text-anchor': 'middle', class: 'pname' }, g).textContent = p.name;
      }
      const fire = () => { if (opts.onPart) opts.onPart(p.id); };
      g.addEventListener('click', fire);
      g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fire(); } });
      partEls[p.id] = g;
    });

    host.appendChild(svg);

    function markRan(ids) {
      const set = new Set(ids || []);
      msgEls.forEach(x => x.g.classList.toggle('ran', set.has(x.m.id)));
    }

    function setLit(nos) {
      const set = new Set(Array.from(nos || [], String));
      Object.keys(bandEls).forEach(k => bandEls[k].g.classList.toggle('lit', set.has(k)));
    }

    // 단계 구간의 메시지 순서 번호 집합. 기본 흐름이면 대안 흐름 구간은 뺀다
    function rangeOf(step) {
      const set = new Set();
      if (!step || !step.msgs) return set;
      const a = order[step.msgs[0]], b = order[step.msgs[1]];
      if (a === undefined || b === undefined) return set;
      for (let i = Math.min(a, b); i <= Math.max(a, b); i++) set.add(i);
      if (step.flow === 'main') {
        (opts.steps || []).forEach(o => {
          if (o.flow !== 'alt' || !o.msgs) return;
          const oa = order[o.msgs[0]], ob = order[o.msgs[1]];
          if (oa === undefined || ob === undefined) return;
          for (let i = Math.min(oa, ob); i <= Math.max(oa, ob); i++) set.delete(i);
        });
      }
      return set;
    }

    function focusStep(no) {
      const key = no === null || no === undefined ? null : String(no);
      Object.keys(bandEls).forEach(k => bandEls[k].g.classList.toggle('focus', k === key));
      const step = key === null ? null : (opts.steps || []).find(s => String(s.no) === key);
      const set = rangeOf(step);
      msgEls.forEach(x => x.g.classList.toggle('sf', set.has(order[x.m.id])));
    }

    // v2 paintSelection 규칙
    function highlight(id, focusOp) {
      parts.forEach(p => {
        const on = p.id === id;
        partEls[p.id].classList.toggle('sel', on);
        partEls[p.id].setAttribute('aria-pressed', on ? 'true' : 'false');
        lifeEls[p.id].classList.toggle('sel', on);
      });
      const isActor = !!(id && partById[id] && partById[id].actor);
      msgEls.forEach(x => {
        const m = x.m;
        let hi = false, dim = false;
        if (id) {
          let out;
          if (isActor) { hi = m.from === id || m.to === id; out = false; } else { hi = m.owner === id; out = !hi && m.from === id; }
          if (focusOp && hi) hi = m.op === focusOp;
          dim = !hi && !out && !(focusOp && m.owner === id);
        }
        x.g.classList.toggle('hi', hi);
        x.g.classList.toggle('dim', dim);
        x.path.setAttribute('marker-end', mref(x.ret, hi));
      });
    }

    // 가로(.diagram)와 세로(페이지) 스크롤을 함께 맞춘다. 긴 화살표는 상자보다 넓을 수 있어 번호·글을 기준으로 한다
    function scrollToMsg(id) {
      const x = msgEls.find(e => e.m.id === id);
      if (!x) return;
      const target = x.g.querySelector('text') || x.g;
      target.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth', block: 'center', inline: 'nearest' });
    }

    return { svg, numberOf, markRan, setLit, focusStep, highlight, scrollToMsg };
  };
})();
