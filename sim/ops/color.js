// 조작: 색 지정(UC-03). 캔버스에서 도형을 누르고, 색을 골라 world 노드의 color로 바꾼다.
(function () {
  'use strict';
  const UCV = window.UCV;

  // 흑백 포함 6색(FR-7 "흑백 + 컬러 최소 4", UC-03 "흑백 포함 최소 4개" 둘 다 채움 · 논의할 점 2)
  const COLORS = [
    { name: '검정', value: '#1a1a1a' },
    { name: '흰색', value: '#ffffff' },
    { name: '빨강', value: '#d64545' },
    { name: '파랑', value: '#3b6fd4' },
    { name: '초록', value: '#3a9a5b' },
    { name: '노랑', value: '#f2c94c' }
  ];
  const SAVE_TEXT = '색을 저장하는 단계는 비어 있음 · 논의할 점 1';
  const NO_SEL_TEXT = '선택한 도형이 없어 색을 적용하지 않음. 캔버스에서 도형을 먼저 누르세요 · 논의할 점 4';

  const rec = (title, lines) => ({ uc: 'UC-03', op: 'color', flow: 'main', title, lines });
  const colorOf = name => COLORS.find(c => c.name === name);
  const exists = (world, id) => world.state().nodes.some(n => n.id === id);

  function select(ctx, id) {
    ctx.emit(rec(`도형 선택 · ${id}`, [{ msg: 'select', text: `사용자가 ${id} 도형을 선택함` }]));
  }

  function apply(ctx, id, name) {
    const c = colorOf(name);
    if (!c) throw new Error(`color: 없는 색 ${name}`);
    if (!id || !exists(ctx.world, id)) {
      ctx.emit(rec(`색 지정 · ${name}`, [
        { msg: 'pick', text: `사용자가 팔레트에서 ${name}을 고름` },
        { text: NO_SEL_TEXT, level: 'warn' }
      ]));
      return;
    }
    painting = true;
    try { ctx.world.setColor(id, c.value); } finally { painting = false; }
    ctx.emit(rec(`색 지정 · ${id}`, [
      { msg: 'select', text: `사용자가 ${id} 도형을 선택해 둠` },
      { msg: 'pick', text: `사용자가 팔레트에서 ${name}을 고름` },
      { msg: 'applyColor', text: `팔레트가 선택 도구에 ${name} 적용을 맡김` },
      { msg: 'render', text: `선택 도구가 ${id}에 ${name}을 칠하고 캔버스에 다시 그리라고 함` },
      { msg: 'shown', text: `캔버스가 ${name}으로 바뀐 ${id}를 보여 줌` },
      { text: SAVE_TEXT }
    ]));
  }

  let selected = null;
  let painting = false; // 이 조작의 setColor로 생긴 change인지

  UCV.ops.register({
    name: 'color',
    uc: 'UC-03',
    label: '색 지정',
    attach(ctx) {
      selected = null;
      // 이 조작이 칠한 것 말고 world가 바뀌면(처음으로) 선택을 지운다.
      ctx.world.on('change', () => { if (!painting) selected = null; });
      // 누르기(click)만 선택으로 본다. 끌기는 도형을 제자리에 두고(move에서 시작 자리를 돌려줌), 기록도 내지 않는다.
      let press = null; // {id, x, y, moved}
      ctx.ui.onCanvasDrag(ev => {
        if (ev.type === 'start') { press = { id: ev.id, x: ev.x, y: ev.y, moved: false }; return undefined; }
        if (ev.type === 'move' && press && press.id === ev.id) {
          if (Math.hypot(ev.x - press.x, ev.y - press.y) > 3) press.moved = true;
          return { x: press.x, y: press.y };
        }
        if (ev.type !== 'click') { if (ev.type !== 'move') press = null; return undefined; }
        const dragged = press && press.id === ev.id && press.moved;
        press = null;
        if (dragged) return undefined;
        selected = ev.id;
        select(ctx, ev.id);
        return undefined;
      });
      ctx.ui.choice('색', COLORS.map(c => ({ value: c.name, label: c.name })), name => apply(ctx, selected, name));
    },
    // 버튼: {id, color}. 그 도형을 선택한 것으로 두고 색을 칠한다.
    run(ctx, args) {
      const a = args || {};
      selected = a.id;
      apply(ctx, a.id, a.color);
    }
  });
})();
