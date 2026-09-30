// 조작: 코드 수정(UC-01). 편집기 글을 첫 줄로 나눠 기록을 낸다(plan "code.js 기록 규칙").
(function () {
  'use strict';
  const UCV = window.UCV;

  const SEQ_TEXT = "견본은 시퀀스 입력을 그리지 않습니다. 제품은 지원합니다(FR-5). UC-05 '시퀀스 불러오기' 예시를 눌러 보세요.";
  const OTHER_TEXT = '클래스·시퀀스 외 문법입니다. 제품에서 어떻게 처리할지는 아직 정하지 않았습니다';
  const SKIP_TEXT = '견본이 흉내 내지 않는 문법이라 건너뜀: ';

  const HEAD = [
    { msg: 'input', text: '사용자가 코드를 고침' },
    { msg: 'startParse', text: '편집기가 입력이 멈춘 것을 보고 해석을 시작함' },
    { msg: 'parse', text: '편집기가 파서에게 코드 해석을 맡김' }
  ];
  const head = () => HEAD.map(l => Object.assign({}, l));
  const rec = (flow, lines, notice) => ({ uc: 'UC-01', op: 'code', flow, title: '코드 수정', lines, notice });

  // v2 placeText: 배치 결과를 한 문장으로
  function placeText(r) {
    const parts = [];
    if (r.placed.length) parts.push(`${r.placed.join(', ')} 새로 놓음`);
    if (r.shifted.length) parts.push(`${r.shifted.join(', ')} 자리 옮김`);
    if (r.fixed.length) parts.push(`${r.fixed.join(', ')} 그대로`);
    return parts.join(', ') || '바뀐 곳 없음';
  }

  function handle(ctx, code) {
    const kind = UCV.sim.route(code);

    if (kind === 'sequence') {
      ctx.emit(rec('main', [head()[0], { text: SEQ_TEXT, level: 'warn' }],
        { level: 'warn', text: SEQ_TEXT, status: '그림은 그대로' }));
      return;
    }
    if (kind === 'other') {
      ctx.emit(rec('main', [head()[0], { text: OTHER_TEXT + ' · UC-05 2A (미정)', level: 'err' }],
        { level: 'err', text: OTHER_TEXT + ' (UC-05 2A (미정))', status: '그림은 그대로' }));
      return;
    }

    const r = ctx.world.applyCode(code);
    if (!r.ok) {
      ctx.emit(rec('alt', head().concat([
        { msg: 'parseResult', text: `파서가 오류를 돌려줌: ${r.line}번째 줄, ${r.msg}`, level: 'err' },
        { msg: 'showError', text: '편집기가 오류를 표시하고, 그림은 그대로 둠', level: 'err' }
      ]), {
        level: 'err', line: r.line,
        text: `${r.line}번째 줄: ${r.msg} 그림은 마지막으로 해석에 성공한 상태 그대로입니다.`,
        status: `${r.line}번째 줄 오류 · 그림은 그대로`
      }));
      return;
    }

    const fixed = ctx.world.state().pinned;
    const skipped = r.skipped || [];
    const skipText = skipped.length ? SKIP_TEXT + skipped.map(s => `${s.line}번째 줄 ${s.text}`).join(', ') : '';
    const lines = head().concat([
      { msg: 'parseResult', text: `파서가 결과를 돌려줌: 클래스 ${r.classes.length}개, 관계 ${r.rels.length}개` }
    ]);
    if (skipped.length) lines.push({ text: skipText, level: 'warn' });
    lines.push(
      { msg: 'apply', text: '편집기가 결과를 모델에 넘김' },
      { msg: 'findNew', text: `모델이 새 클래스를 찾음: ${r.added.join(', ') || '없음'}${r.removed.length ? ` (사라진 클래스: ${r.removed.join(', ')})` : ''}` },
      { msg: 'arrange', text: `모델이 배치 엔진에 자리를 맡김${fixed.length ? ` (고정: ${fixed.join(', ')})` : ''}` },
      { msg: 'coords', text: `배치 엔진이 자리를 정함: ${placeText(r)}` },
      { msg: 'render', text: '모델이 캔버스에 다시 그리라고 함' },
      { msg: 'shown', text: '캔버스가 바뀐 그림을 보여 줌' }
    );
    ctx.emit(rec('main', lines, skipped.length
      ? { level: 'warn', text: skipText, status: '반영됨 · 건너뛴 줄 있음' }
      : { level: 'ok', status: '반영됨' }));
  }

  UCV.ops.register({
    name: 'code',
    uc: 'UC-01',
    label: '코드 수정',
    attach(ctx) { ctx.ui.onCodeInput(code => handle(ctx, code)); },
    // 버튼(줄 넣기): setCode는 onCodeInput을 부르지 않으므로 바로 해석한다.
    run(ctx, args) {
      const a = args || {};
      if (a.append) ctx.ui.setCode(ctx.ui.code().replace(/\s+$/, '') + '\n  ' + a.append);
      handle(ctx, ctx.ui.code());
    }
  });
})();
