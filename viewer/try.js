// 뷰 층: 직접 해 보기(툴바, 편집기, 캔버스, 노란·빨간 안내). 조작 처리기는 모두 여기서 감싸 부른다.
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const NS = 'http://www.w3.org/2000/svg';
  const DEBOUNCE = 500;
  const CODE_OP = 'code';
  const reduceMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // 버튼 이름의 `코드`는 <code>로 보인다.
  const labelHtml = s => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

  const EDGE_STYLE = {
    '-->': { end: 'arrow' }, '..>': { end: 'arrow', dash: true }, '<|--': { start: 'tri' }, '..|>': { end: 'tri', dash: true },
    '*--': { start: 'dfill' }, 'o--': { start: 'dhol' }, '--': {}, '..': { dash: true }
  };

  // 노드 색이 어두우면 글자를 밝게
  function inkFor(color) {
    const m = /^#([0-9a-f]{6})$/i.exec(color || '');
    if (!m) return null;
    const v = parseInt(m[1], 16), r = v >> 16, g = (v >> 8) & 255, b = v & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) < 140 ? '#ffffff' : '#141413';
  }

  let seqNo = 0;

  // opts: { data, uc, onRecord(record|null) }
  // 돌려줌: { world, logHost, reset() }
  function tryPane(host, opts) {
    const D = opts.data, uc = opts.uc;
    const px = 'mw' + (++seqNo);
    const all = UCV.ops ? UCV.ops.list() : [];
    const otherNames = new Set((D.otherOps || []).map(o => o.op));
    const active = all.filter(op => op.uc === uc || otherNames.has(op.name));
    const codeOp = all.find(op => op.name === CODE_OP);
    const editable = active.some(op => op.name === CODE_OP);
    const dragOwner = active.find(op => op.name === 'drag');

    const el = document.createElement('section');
    el.className = 'mw-card';
    el.setAttribute('aria-labelledby', px + '-title');
    el.innerHTML = `<div class="mw-head"><h2 id="${px}-title">직접 해 보기</h2><span class="muted small">설명용 시뮬레이션입니다.</span></div>
      <div class="toolbar">${D.try.hint ? `<span class="hint">${labelHtml(D.try.hint)}</span>` : ''}</div>
      <div class="mw"><div class="mw-grid">
        <div class="pane">
          <div class="pane-top"><span class="pane-label">코드</span><span class="ed-status"></span></div>
          <div class="ed-body"><pre class="gutter" aria-hidden="true"></pre>
            <textarea class="code" spellcheck="false" autocapitalize="off" autocomplete="off" wrap="off" aria-label="Mermaid 코드"></textarea></div>
          <p class="ed-note" hidden></p>
          <p class="ed-err" role="alert" hidden></p>
          <p class="ed-warn" role="status" hidden></p>
        </div>
        <div class="pane">
          <div class="pane-top"><span class="pane-label">캔버스</span><span class="pane-hint"></span></div>
          <div class="stage">
            <svg class="mw-svg" viewBox="0 0 440 300" role="group" aria-label="캔버스">
              <defs>
                <marker id="${px}-arrow" viewBox="0 0 12 12" refX="11" refY="6" markerWidth="11" markerHeight="11" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="mk-line" d="M2,2 L11,6 L2,10"/></marker>
                <marker id="${px}-tri" viewBox="0 0 14 14" refX="13" refY="7" markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="mk-hollow" d="M1.5,1.5 L13,7 L1.5,12.5 Z"/></marker>
                <marker id="${px}-dfill" viewBox="0 0 16 10" refX="15.5" refY="5" markerWidth="16" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="mk-fill" d="M1,5 L8,1 L15,5 L8,9 Z"/></marker>
                <marker id="${px}-dhol" viewBox="0 0 16 10" refX="15.5" refY="5" markerWidth="16" markerHeight="10" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path class="mk-hollow" d="M1,5 L8,1 L15,5 L8,9 Z"/></marker>
              </defs>
              <g class="l-edges"></g><g class="l-nodes"></g><g class="l-guides"></g>
            </svg>
            <div class="seq-canvas" hidden></div>
          </div>
        </div>
      </div>
      <section class="log" aria-labelledby="${px}-log">
        <div class="log-head"><h4 id="${px}-log">방금 안에서 일어난 일</h4><span class="muted small">번호를 누르면 아래 흐름 그림에서 그 메시지로 이동합니다.</span></div>
      </section></div>`;
    host.appendChild(el);

    const q = s => el.querySelector(s);
    const toolbar = q('.toolbar'), ta = q('textarea.code'), gutter = q('.gutter'), statusEl = q('.ed-status');
    const noteEl = q('.ed-note'), errEl = q('.ed-err'), warnEl = q('.ed-warn');
    const svg = q('.mw-svg'), seqHost = q('.seq-canvas'), hintEl = q('.pane-hint');
    const edgesLayer = svg.querySelector('.l-edges'), nodesLayer = svg.querySelector('.l-nodes'), guidesLayer = svg.querySelector('.l-guides');

    const world = UCV.sim.createWorld({ start: D.try.start });
    let errLine = 0, timer = 0, keyTimer = 0, raf = 0, drag = null;
    let disp = new Map(), els = new Map(), shown = { nodes: [], edges: [] }, seqShown = null;
    const codeHandlers = [], dragHandlers = [];

    // ---------- 조작 처리기 감싸기: 예외가 나면 회색 상자, 기록은 내지 않는다 ----------
    function guarded(op, fn) {
      return function () {
        const buf = [];
        const prev = collecting;
        collecting = buf;
        let out;
        try {
          out = fn.apply(null, arguments);
        } catch (e) {
          collecting = prev;
          UCV.bug(`'${op.label}'을 처리하다 멈췄습니다`, e);
          return undefined;
        }
        collecting = prev;
        buf.forEach(deliver);
        return out;
      };
    }
    let collecting = null;
    function emit(rec) { if (collecting) collecting.push(rec); else deliver(rec); }
    function deliver(rec) {
      // notice: undefined면 편집기 안내를 그대로, null이면 지움, 객체면 보임
      if (rec.notice !== undefined) setNotice(rec.notice);
      opts.onRecord(rec);
    }

    // ---------- 편집기 ----------
    const setStatus = (kind, text) => { statusEl.className = 'ed-status' + (kind ? ' ' + kind : ''); statusEl.textContent = text; };
    function renderGutter() {
      const n = ta.value.split('\n').length;
      let s = '';
      for (let i = 1; i <= n; i++) s += (i === errLine ? `<span class="bad">${i}</span>` : i) + '\n';
      gutter.innerHTML = s;
      gutter.scrollTop = ta.scrollTop;
    }
    // nt: { level: "err" | "warn" | "ok", text?, line?, status? }. ok는 안내 상자 없이 상태 글만 바꾼다.
    function setNotice(nt) {
      errEl.hidden = true; warnEl.hidden = true; errLine = 0;
      if (nt) {
        const box = nt.level === 'err' ? errEl : nt.level === 'warn' ? warnEl : null;
        if (box && nt.text) { box.textContent = nt.text; box.hidden = false; }
        if (nt.level === 'err' && nt.line) errLine = nt.line;
        if (nt.status) setStatus(nt.level === 'warn' ? 'warn' : nt.level, nt.status);
      }
      renderGutter();
    }
    function setCode(text) {
      clearTimeout(timer); timer = 0;
      ta.value = text;
      ta.scrollTop = ta.scrollHeight;
      renderGutter();
    }
    ta.readOnly = !editable;
    if (!editable) {
      noteEl.hidden = false;
      noteEl.textContent = `코드 수정은 ${codeOp ? codeOp.uc : 'UC-01'} 페이지에서 해 볼 수 있습니다`;
    }
    ta.addEventListener('input', () => {
      errLine = 0;
      renderGutter();
      setStatus('', '입력 중… 멈추면 해석합니다');
      clearTimeout(timer);
      timer = setTimeout(() => { timer = 0; codeHandlers.forEach(h => h(ta.value)); }, DEBOUNCE);
    });
    ta.addEventListener('scroll', () => { gutter.scrollTop = ta.scrollTop; });

    // ---------- 캔버스 그리기 (world 상태만 보고 그린다) ----------
    function makeNode(n) {
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'node');
      g.setAttribute('data-id', n.id);
      g.setAttribute('tabindex', '0');
      g.setAttribute('role', 'button');
      g.setAttribute('aria-label', dragOwner ? `${n.id} 클래스. 끌거나 방향키로 옮길 수 있습니다` : `${n.id} 클래스`);
      g.innerHTML = `<rect class="n-halo" x="-5" y="-5" width="${n.w + 10}" height="${n.h + 10}" rx="6"/>
        <rect class="n-box" width="${n.w}" height="${n.h}" rx="2"/>
        <line class="n-div" x1="0" x2="${n.w}" y1="24" y2="24"/><line class="n-div" x1="0" x2="${n.w}" y1="35" y2="35"/>
        <text class="n-name" x="${n.w / 2}" y="16.5">${esc(n.id)}</text>
        <g class="n-pin" transform="translate(${n.w - 30} -9)"><rect width="36" height="16" rx="8"/><text x="18" y="11.5">고정</text></g>`;
      return g;
    }
    function clip(c, t, w, h) {
      const dx = t.x - c.x, dy = t.y - c.y;
      if (!dx && !dy) return c;
      const s = Math.min(dx ? (w / 2 + 2) / Math.abs(dx) : Infinity, dy ? (h / 2 + 2) / Math.abs(dy) : Infinity);
      return { x: c.x + dx * s, y: c.y + dy * s };
    }
    function edgeSVG(r) {
      const a = shown.byId[r.from], b = shown.byId[r.to];
      const pa = disp.get(r.from), pb = disp.get(r.to);
      if (!a || !b || a === b || !pa || !pb) return '';
      const ac = { x: pa.x + a.w / 2, y: pa.y + a.h / 2 }, bc = { x: pb.x + b.w / 2, y: pb.y + b.h / 2 };
      const s = clip(ac, bc, a.w, a.h), e = clip(bc, ac, b.w, b.h);
      const st = EDGE_STYLE[r.op] || {};
      return `<line class="edge${st.dash ? ' dash' : ''}" x1="${s.x.toFixed(1)}" y1="${s.y.toFixed(1)}" x2="${e.x.toFixed(1)}" y2="${e.y.toFixed(1)}"` +
        `${st.start ? ` marker-start="url(#${px}-${st.start})"` : ''}${st.end ? ` marker-end="url(#${px}-${st.end})"` : ''}/>`;
    }
    function paint() {
      els.forEach((g, id) => {
        const p = disp.get(id);
        if (p) g.setAttribute('transform', `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)})`);
      });
      edgesLayer.innerHTML = shown.edges.map(edgeSVG).join('');
    }
    function animate() {
      cancelAnimationFrame(raf);
      const target = new Map(shown.nodes.map(n => [n.id, { x: n.x, y: n.y }]));
      if (reduceMotion()) { disp = target; paint(); return; }
      const from = new Map(disp), t0 = performance.now(), dur = 450;
      const frame = now => {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        target.forEach((t, id) => {
          if (drag && drag.id === id) return;
          const f = from.get(id) || t;
          disp.set(id, { x: f.x + (t.x - f.x) * e, y: f.y + (t.y - f.y) * e });
        });
        paint();
        if (k < 1) raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    }
    function draw(instant) {
      const st = world.state();
      const isSeq = st.view === 'sequence' && st.seqPreview;
      svg.style.display = isSeq ? 'none' : '';
      seqHost.hidden = !isSeq;
      if (isSeq) {
        if (seqShown !== st.seqPreview && UCV.view.seqDraw) {
          const sp = st.seqPreview;
          UCV.view.seqDraw(seqHost, { participants: sp.participants || [], seq: sp.seq || [], mini: true, ariaLabel: '캔버스의 시퀀스 그림' });
        }
        seqShown = st.seqPreview;
        return;
      }
      seqShown = null;
      shown = { nodes: st.nodes, edges: st.edges, byId: {} };
      st.nodes.forEach(n => { shown.byId[n.id] = n; });
      svg.setAttribute('viewBox', `0 0 ${st.size.w} ${st.size.h}`);
      const pinned = new Set(st.pinned);
      els.forEach((g, id) => { if (!shown.byId[id]) { g.remove(); els.delete(id); disp.delete(id); } });
      st.nodes.forEach(n => {
        let g = els.get(n.id);
        if (!g) { g = makeNode(n); nodesLayer.appendChild(g); els.set(n.id, g); disp.set(n.id, { x: n.x, y: n.y }); }
        g.classList.toggle('pinned', pinned.has(n.id));
        g.classList.toggle('draggable', !!dragOwner);
        const box = g.querySelector('.n-box'), name = g.querySelector('.n-name');
        box.style.fill = n.color || '';
        name.style.fill = inkFor(n.color) || '';
      });
      st.fresh.forEach(id => {
        const g = els.get(id);
        if (!g) return;
        g.classList.add('fresh');
        setTimeout(() => g.classList.remove('fresh'), 2000);
      });
      if (instant) { disp = new Map(st.nodes.map(n => [n.id, { x: n.x, y: n.y }])); paint(); } else animate();
    }
    world.on('change', () => draw(false));

    // ---------- 끌기 입력: 처리기에 {type, id, x, y, via}를 넘긴다 ----------
    // move 처리기가 {x, y, guides:[{x1,y1,x2,y2}]}를 돌려주면 그 자리로 보인다.
    function callDrag(ev) {
      let out = null;
      dragHandlers.forEach(h => { const r = h(ev); if (r && typeof r === 'object') out = r; });
      return out;
    }
    function drawGuides(list) {
      guidesLayer.innerHTML = (list || []).map(l => `<line class="guide" x1="${l.x1}" y1="${l.y1}" x2="${l.x2}" y2="${l.y2}"/>`).join('');
    }
    function toSvg(e) {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX; pt.y = e.clientY;
      return pt.matrixTransform(svg.getScreenCTM().inverse());
    }
    const sizeNow = () => world.state().size;
    const clampX = (x, n) => Math.min(Math.max(0, x), sizeNow().w - n.w);
    const clampY = (y, n) => Math.min(Math.max(10, y), sizeNow().h - n.h);
    const canDrag = () => dragHandlers.length > 0 && world.state().view !== 'sequence'; // FR-020

    svg.addEventListener('pointerdown', e => {
      const g = e.target.closest('.node');
      if (!g || !canDrag()) return;
      e.preventDefault();
      cancelAnimationFrame(raf);
      draw(true);
      svg.setPointerCapture(e.pointerId);
      const id = g.getAttribute('data-id'), p = toSvg(e), d = disp.get(id);
      drag = { id, ox: p.x - d.x, oy: p.y - d.y, sx: d.x, sy: d.y, moved: false };
      g.classList.add('drag');
      callDrag({ type: 'start', id, x: d.x, y: d.y, via: 'pointer' });
    });
    svg.addEventListener('pointermove', e => {
      if (!drag) return;
      const n = shown.byId[drag.id], p = toSvg(e);
      let x = clampX(p.x - drag.ox, n), y = clampY(p.y - drag.oy, n);
      const r = callDrag({ type: 'move', id: drag.id, x, y, via: 'pointer' });
      if (r) { x = r.x; y = r.y; }
      disp.set(drag.id, { x, y });
      if (Math.hypot(x - drag.sx, y - drag.sy) > 3) drag.moved = true;
      paint();
      drawGuides(r && r.guides);
    });
    function endDrag(cancel) {
      if (!drag) return;
      const d = drag;
      drag = null;
      drawGuides(null);
      const g = els.get(d.id);
      if (g) g.classList.remove('drag');
      const p = disp.get(d.id);
      if (cancel) callDrag({ type: 'cancel', id: d.id, via: 'pointer' });
      else if (!d.moved) callDrag({ type: 'click', id: d.id, via: 'pointer' });
      else callDrag({ type: 'end', id: d.id, x: p.x, y: p.y, via: 'pointer' });
      draw(true);
    }
    svg.addEventListener('pointerup', () => endDrag(false));
    svg.addEventListener('pointercancel', () => endDrag(true));
    svg.addEventListener('keydown', e => {
      const g = e.target.closest && e.target.closest('.node');
      const dirs = { ArrowLeft: [-12, 0], ArrowRight: [12, 0], ArrowUp: [0, -12], ArrowDown: [0, 12] };
      if (!g || !dirs[e.key] || !canDrag()) return;
      e.preventDefault();
      const id = g.getAttribute('data-id'), n = shown.byId[id], p = disp.get(id), [dx, dy] = dirs[e.key];
      const x = clampX(p.x + dx, n), y = clampY(p.y + dy, n);
      disp.set(id, { x, y });
      paint();
      clearTimeout(keyTimer);
      keyTimer = setTimeout(() => { callDrag({ type: 'end', id, x, y, via: 'key' }); draw(true); }, 600);
    });

    // ---------- 조작 붙이기 ----------
    function addButton(label, fn, cls) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn' + (cls ? ' ' + cls : '');
      b.innerHTML = labelHtml(label);
      b.addEventListener('click', fn);
      toolbar.appendChild(b);
      return b;
    }
    function uiFor(op) {
      return {
        button(label, fn) { addButton(label, guarded(op, fn), 'ins'); },
        choice(label, options, fn) {
          const wrap = document.createElement('span');
          wrap.className = 'choice';
          wrap.setAttribute('role', 'group');
          wrap.setAttribute('aria-label', label);
          wrap.innerHTML = `<span class="hint">${labelHtml(label)}</span>`;
          const call = guarded(op, fn);
          options.forEach(o => {
            const v = typeof o === 'object' ? o.value : o, t = typeof o === 'object' ? o.label : o;
            const b = document.createElement('button');
            b.type = 'button';
            b.className = 'btn';
            b.innerHTML = labelHtml(t);
            b.addEventListener('click', () => {
              wrap.querySelectorAll('.btn').forEach(x => x.classList.toggle('on', x === b));
              call(v);
            });
            wrap.appendChild(b);
          });
          toolbar.appendChild(wrap);
        },
        code() { return ta.value; },
        setCode,
        onCodeInput(fn) { codeHandlers.push(guarded(op, fn)); },
        onCanvasDrag(fn) { dragHandlers.push(guarded(op, fn)); }
      };
    }
    const ctxs = new Map();
    active.forEach(op => {
      const ctx = { world, emit, ui: uiFor(op) };
      ctxs.set(op.name, ctx);
      if (typeof op.attach === 'function') guarded(op, op.attach)(ctx);
    });
    (D.try.buttons || []).forEach(b => {
      const op = active.find(o => o.name === b.op);
      if (!op || typeof op.run !== 'function') return;
      addButton(b.label, guarded(op, () => op.run(ctxs.get(op.name), b.args || {})), 'ins');
    });
    addButton('처음으로', () => reset());
    // 끌기 조작이 붙은 페이지에서만 안내한다(색 지정은 누르기만 받으려고 onCanvasDrag를 쓴다).
    if (dragOwner) hintEl.textContent = dragOwner.uc !== uc ? `노드를 끌 수 있습니다 (${dragOwner.uc} 조작)` : '노드를 끌 수 있습니다';

    function reset() {
      clearTimeout(timer); clearTimeout(keyTimer); cancelAnimationFrame(raf);
      timer = 0; drag = null;
      drawGuides(null);
      els.forEach(g => g.remove());
      els = new Map(); disp = new Map();
      world.reset();
      setCode(D.try.start);
      setNotice(null);
      setStatus('', '예시 코드');
      draw(true);
      opts.onRecord(null);
    }

    reset();
    return { world, logHost: q('.log'), reset };
  }

  UCV.view.tryPane = tryPane;
})();
