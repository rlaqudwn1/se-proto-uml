// 흉내 층: 다이어그램 모델과 배치 상태 (견본 v2 applyResult·arrange에서 옮김). DOM을 만지지 않는다.
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.sim = UCV.sim || {};

  const TOP = 20, ROWGAP = 86, GAP = 22, PAD = 12, BASE_W = 440, BASE_H = 300, NODE_H = 46;

  const widthOf = id => Math.max(84, Math.round(id.length * 7.6 + 28));

  // 위층 → 아래층 짝. 실체화(..|>)는 방향을 뒤집는다.
  const upperPairs = model => model.rels
    .map(r => (r.op === '..|>' ? [r.to, r.from] : [r.from, r.to]))
    .filter(([a, b]) => a !== b);

  function depthsOf(model) {
    const d = new Map(model.order.map(id => [id, 0]));
    const pairs = upperPairs(model), cap = Math.max(0, model.order.length - 1);
    for (let k = 0; k < model.order.length; k++) {
      let changed = false;
      pairs.forEach(([a, b]) => {
        const nd = Math.min(cap, d.get(a) + 1);
        if (d.get(b) < nd) { d.set(b, nd); changed = true; }
      });
      if (!changed) break;
    }
    return d;
  }

  const hits = (x, y, w, h, b, m) => x < b.x + b.w + m && x + w + m > b.x && y < b.y + b.h + m && y + h + m > b.y;

  function clearOf(x, y, w, h, fixed) {
    for (let i = 0; i < 40; i++) {
      const hit = fixed.find(p => hits(x, y, w, h, p, 10));
      if (!hit) return x;
      x = hit.x + hit.w + GAP;
    }
    return x;
  }

  function placeNew(model, n, placed) {
    const parents = upperPairs(model).filter(([, b]) => b === n.id)
      .map(([a]) => model.nodes.get(a)).filter(p => p && p.x != null);
    let y = parents.length ? Math.max(...parents.map(p => p.y)) + ROWGAP : TOP;
    const cx = parents.length ? parents.reduce((s, p) => s + p.x + p.w / 2, 0) / parents.length : BASE_W / 2;
    for (let row = 0; row < 8; row++, y += ROWGAP) {
      for (let k = 0; k < 40; k++) {
        const off = (k % 2 ? 1 : -1) * Math.ceil(k / 2) * 24;
        const x = Math.max(PAD, cx - n.w / 2 + off);
        if (!placed.some(p => hits(x, y, n.w, n.h, p, 10))) { n.x = Math.round(x); n.y = y; return; }
      }
    }
    n.x = PAD; n.y = y;
  }

  function applyResult(model, r) {
    const removed = [...model.nodes.keys()].filter(id => !r.classes.includes(id));
    removed.forEach(id => model.nodes.delete(id));
    const added = [];
    r.classes.forEach(id => {
      if (!model.nodes.has(id)) {
        model.nodes.set(id, { id, w: widthOf(id), h: NODE_H, x: null, y: null, pinned: false, color: null });
        added.push(id);
      }
    });
    model.rels = r.rels.map(x => Object.assign({}, x));
    model.order = r.classes.slice();
    return { added, removed };
  }

  // mode "all": 고정 안 된 노드를 층별로 다시 정렬. mode "new": 좌표 없는 새 노드만 빈자리에 둔다.
  function arrange(model, mode) {
    const before = new Map();
    model.nodes.forEach((n, id) => before.set(id, n.x == null ? null : { x: n.x, y: n.y }));
    const nodes = model.order.map(id => model.nodes.get(id));
    const fixed = nodes.filter(n => n.pinned);
    if (mode === 'all') {
      const depth = depthsOf(model), rows = new Map();
      nodes.forEach(n => {
        if (n.pinned) return;
        const d = depth.get(n.id);
        if (!rows.has(d)) rows.set(d, []);
        rows.get(d).push(n);
      });
      [...rows.keys()].sort((a, b) => a - b).forEach(d => {
        const row = rows.get(d), y = TOP + d * ROWGAP;
        const total = row.reduce((s, n) => s + n.w, 0) + GAP * (row.length - 1);
        let x = Math.max(PAD, BASE_W / 2 - total / 2);
        row.forEach(n => { x = clearOf(x, y, n.w, n.h, fixed); n.x = Math.round(x); n.y = y; x += n.w + GAP; });
      });
    } else {
      const placed = nodes.filter(n => n.x != null);
      nodes.filter(n => n.x == null).forEach(n => { placeNew(model, n, placed); placed.push(n); });
    }
    const placedIds = [], shifted = [];
    nodes.forEach(n => {
      const b = before.get(n.id);
      if (!b) placedIds.push(n.id);
      else if (b.x !== n.x || b.y !== n.y) shifted.push(n.id);
    });
    return { placed: placedIds, shifted, fixed: fixed.map(n => n.id) };
  }

  function fitSize(model) {
    let w = BASE_W, h = BASE_H;
    model.nodes.forEach(n => {
      if (n.x == null) return;
      w = Math.max(w, n.x + n.w + PAD);
      h = Math.max(h, n.y + n.h + PAD);
    });
    return { w, h };
  }

  const clone = v => (v == null ? v : JSON.parse(JSON.stringify(v)));

  // opts: { start: 시작 코드, layoutMode?: "all" | "new" }
  function createWorld(opts) {
    const o = opts || {};
    const listeners = {};
    let model, size, view, seqPreview, fresh;
    let layoutMode = o.layoutMode === 'new' ? 'new' : 'all';

    const emit = ev => (listeners[ev] || []).slice().forEach(fn => fn());
    const node = id => {
      const n = model.nodes.get(id);
      if (!n) throw new Error(`world: 없는 노드 ${id}`);
      return n;
    };

    function reset() {
      model = { nodes: new Map(), rels: [], order: [] };
      view = 'class';
      seqPreview = null;
      fresh = [];
      const r = UCV.sim.parseClass(o.start || 'classDiagram');
      if (r.ok) { applyResult(model, r); arrange(model, layoutMode); }
      size = fitSize(model);
      emit('change');
    }

    // 해석하고 layoutMode대로 반영한다. 실패하면 상태를 그대로 둔다.
    function applyCode(code) {
      fresh = [];
      const r = UCV.sim.parseClass(code);
      if (!r.ok) { emit('change'); return r; }
      const diff = applyResult(model, r);
      const res = arrange(model, layoutMode);
      view = 'class';
      seqPreview = null;
      fresh = diff.added.slice();
      size = fitSize(model);
      emit('change');
      return Object.assign({}, r, diff, res);
    }

    function move(id, x, y) { fresh = []; const n = node(id); n.x = Math.round(x); n.y = Math.round(y); emit('change'); }
    function pin(id) { fresh = []; node(id).pinned = true; emit('change'); }
    function setColor(id, color) { fresh = []; node(id).color = color || null; emit('change'); }
    function showSequence(seq) { fresh = []; view = 'sequence'; seqPreview = clone(seq); emit('change'); }
    function showClass() { fresh = []; view = 'class'; seqPreview = null; emit('change'); }
    function setLayoutMode(mode) { fresh = []; layoutMode = mode === 'new' ? 'new' : 'all'; emit('change'); }

    function state() {
      const nodes = model.order.map(id => model.nodes.get(id)).filter(n => n.x != null).map(n => {
        const s = { id: n.id, x: n.x, y: n.y, w: n.w, h: n.h };
        if (n.color) s.color = n.color;
        return s;
      });
      return {
        nodes,
        edges: model.rels.map(r => Object.assign({}, r)),
        pinned: model.order.filter(id => model.nodes.get(id).pinned),
        layoutMode,
        view,
        seqPreview: clone(seqPreview),
        size: Object.assign({}, size),
        fresh: fresh.slice()
      };
    }

    function on(ev, fn) { (listeners[ev] = listeners[ev] || []).push(fn); }

    reset();
    return { state, applyCode, move, pin, setColor, showSequence, showClass, setLayoutMode, reset, on };
  }

  UCV.sim.createWorld = createWorld;
})();
