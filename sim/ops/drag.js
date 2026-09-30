// 조작: 노드 끌기(UC-02). 스냅과 고정을 거쳐 기록을 낸다(견본 v2 snapTo·commitMove에서 옮김).
(function () {
  'use strict';
  const UCV = window.UCV;

  const SNAP = 9;

  // 다른 노드 중심선과 가로·세로 맞춤
  function snapTo(nodes, id, x, y) {
    const n = nodes.find(o => o.id === id);
    if (!n) return null;
    let sx = null, sy = null;
    const cx = x + n.w / 2, cy = y + n.h / 2;
    nodes.forEach(o => {
      if (o.id === id) return;
      const ocx = o.x + o.w / 2, ocy = o.y + o.h / 2;
      if (!sx && Math.abs(cx - ocx) < SNAP) { x = ocx - n.w / 2; sx = o; }
      if (!sy && Math.abs(cy - ocy) < SNAP) { y = ocy - n.h / 2; sy = o; }
    });
    const guides = [];
    if (sx) {
      const gx = sx.x + sx.w / 2;
      guides.push({ x1: gx, y1: Math.min(y, sx.y) - 8, x2: gx, y2: Math.max(y + n.h, sx.y + sx.h) + 8 });
    }
    if (sy) {
      const gy = sy.y + sy.h / 2;
      guides.push({ x1: Math.min(x, sy.x) - 8, y1: gy, x2: Math.max(x + n.w, sy.x + sy.w) + 8, y2: gy });
    }
    return { x, y, sx, sy, guides };
  }

  function snapText(s) {
    if (!s || (!s.sx && !s.sy)) return '가까운 노드가 없어 스냅하지 않음';
    const parts = [];
    if (s.sx) parts.push(`${s.sx.id} 기준 세로 중심선`);
    if (s.sy) parts.push(`${s.sy.id} 기준 가로 중심선`);
    return parts.join(', ') + '에 맞춤';
  }

  UCV.ops.register({
    name: 'drag',
    uc: 'UC-02',
    label: '노드 끌기',
    attach(ctx) {
      let last = null; // 이번 끌기의 마지막 스냅 {id, sx, sy}
      ctx.ui.onCanvasDrag(ev => {
        if (ev.type === 'start') { last = null; return undefined; }
        if (ev.type === 'move') {
          const s = snapTo(ctx.world.state().nodes, ev.id, ev.x, ev.y);
          if (!s) return undefined;
          last = { id: ev.id, sx: s.sx, sy: s.sy };
          return { x: s.x, y: s.y, guides: s.guides };
        }
        if (ev.type !== 'end') return undefined; // click, cancel
        const snap = ev.via === 'key' || !last || last.id !== ev.id ? null : last;
        last = null;
        const id = ev.id;
        ctx.world.move(id, ev.x, ev.y);
        ctx.world.pin(id);
        // msg는 UC-02 seq의 id다. 스냅 줄은 실제로 붙었을 때만 snap을 달아, 붙지 않은 끌기는 2단계를 켜지 않는다.
        // 코드 반영 줄은 msg가 없다(UC-02 3단계는 msgs: null, lightBy: []).
        const snapped = !!(snap && (snap.sx || snap.sy));
        const snapLine = { text: `캔버스가 스냅을 확인함: ${snapText(snap)}` };
        if (snapped) snapLine.msg = 'snap';
        ctx.emit({
          uc: 'UC-02', op: 'drag', flow: 'main', title: `노드 끌기 · ${id}`,
          lines: [
            { text: `사용자가 ${id} 노드를 끌어 놓음`, msg: 'drag' },
            snapLine,
            { text: '캔버스가 모델에 새 위치를 알림', msg: 'move' },
            { text: `모델이 ${id} 노드를 “옮긴 노드”로 고정함`, msg: 'pin' },
            { text: '코드에 위치를 반영하는 단계는 비어 있음 · 논의할 점 2' },
            { text: '캔버스가 다시 그림', msg: 'render' }
          ]
        });
        return undefined;
      });
    }
  });
})();
