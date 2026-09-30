// 조작: 불러오기(UC-05). 버튼 args의 예시 코드를 첫 줄로 나눠 기록을 낸다.
// args: { code: 불러올 코드, preview?: 시퀀스 예시의 그림 {participants, seq} (world seqPreview 모양) }
(function () {
  'use strict';
  const UCV = window.UCV;

  const OTHER_TEXT = '클래스·시퀀스 외 문법입니다. 제품에서 어떻게 처리할지는 아직 정하지 않았습니다';
  const MARK = 'UC-05 2A (미정)';

  const rec = (flow, lines, notice) => ({ uc: 'UC-05', op: 'import', flow, title: '불러오기', lines, notice });
  const firstLine = code => (String(code).split('\n').find(l => l.trim()) || '').trim();
  const countLines = code => String(code).split('\n').filter(l => l.trim()).length;

  // 배치 결과를 한 문장으로 (code.js placeText와 같은 말투)
  function placeText(r) {
    const parts = [];
    if (r.placed.length) parts.push(`${r.placed.join(', ')} 새로 놓음`);
    if (r.shifted.length) parts.push(`${r.shifted.join(', ')} 자리 옮김`);
    return parts.join(', ') || '바뀐 곳 없음';
  }

  function run(ctx, args) {
    const a = args || {};
    const code = String(a.code || '');
    const kind = UCV.sim.route(code);
    const head = [
      { msg: 'open', text: '사용자가 불러오기를 실행함' },
      { msg: 'choose', text: `사용자가 코드를 고름: ${firstLine(code)} … ${countLines(code)}줄` },
      { msg: 'parse', text: '불러오기 창이 파서에게 코드 해석을 맡김' }
    ];

    // 2A: 클래스·시퀀스 외 문법. 편집기와 캔버스는 그대로 둔다(논의할 점 1).
    if (kind === 'other') {
      ctx.emit(rec('alt', head.concat([
        { msg: 'parseResult', text: `파서가 결과를 돌려줌: ${firstLine(code).split(/\s+/)[0]}는 클래스·시퀀스가 아님`, level: 'err' },
        { msg: 'unsupported', text: `${OTHER_TEXT} · ${MARK}`, level: 'err' },
        { text: '견본은 편집기와 캔버스를 그대로 둠 · 논의할 점 1' }
      ]), { level: 'err', text: `${OTHER_TEXT} · ${MARK}`, status: '불러오지 않음 · 그림은 그대로' }));
      return;
    }

    if (kind === 'sequence') {
      const pv = a.preview;
      if (!pv || !Array.isArray(pv.participants) || !Array.isArray(pv.seq)) {
        throw new Error('시퀀스 예시에 preview {participants, seq}가 없습니다');
      }
      const nMsg = pv.seq.filter(m => m && !m.frame).length;
      // setCode는 onCodeInput을 부르지 않으므로 코드 수정(UC-01) 기록이 뒤따르지 않는다.
      ctx.ui.setCode(code);
      ctx.world.reset();
      ctx.world.showSequence(pv);
      ctx.emit(rec('main', head.concat([
        { msg: 'parseResult', text: `파서가 결과를 돌려줌: 시퀀스, 참여자 ${pv.participants.length}개, 메시지 ${nMsg}개` },
        { msg: 'toEditor', text: '불러오기 창이 편집기에 코드를 넣음' },
        { msg: 'apply', text: '불러오기 창이 해석 결과를 모델에 넘김: 새 다이어그램' },
        { msg: 'arrange', text: '모델이 배치 엔진에 자리를 맡김' },
        { msg: 'coords', text: `배치 엔진이 참여자를 코드 순서대로 놓음: ${pv.participants.map(p => p.name).join(', ')}` },
        { msg: 'render', text: '모델이 캔버스에 그리라고 함' },
        { msg: 'shown', text: '캔버스가 불러온 시퀀스 그림을 보여 줌' }
      ]), { level: 'ok', status: '불러옴 · 시퀀스 그림' }));
      return;
    }

    // 클래스: 캔버스를 처음 상태로 비운 뒤 새 다이어그램으로 반영한다.
    const r = UCV.sim.parseClass(code);
    if (!r.ok) {
      // 사전조건(유효한 코드) 밖. 견본 예시에는 없는 경우다.
      ctx.emit(rec('main', head.concat([
        { msg: 'parseResult', text: `파서가 오류를 돌려줌: ${r.line}번째 줄, ${r.msg}`, level: 'err' },
        { text: '사전조건(유효한 Mermaid 코드) 밖이라 견본은 그대로 둠 · 논의할 점 4', level: 'err' }
      ]), { level: 'err', text: `${r.line}번째 줄: ${r.msg}`, status: '불러오지 않음' }));
      return;
    }
    ctx.ui.setCode(code);
    ctx.world.reset();
    const w = ctx.world.applyCode(code);
    ctx.emit(rec('main', head.concat([
      { msg: 'parseResult', text: `파서가 결과를 돌려줌: 클래스 ${w.classes.length}개, 관계 ${w.rels.length}개` },
      { msg: 'toEditor', text: '불러오기 창이 편집기에 코드를 넣음' },
      { msg: 'apply', text: '불러오기 창이 해석 결과를 모델에 넘김: 새 다이어그램' },
      { msg: 'arrange', text: '모델이 배치 엔진에 자리를 맡김 (좌표가 없어 모두 자동 배치)' },
      { msg: 'coords', text: `배치 엔진이 자리를 정함: ${placeText(w)}` },
      { msg: 'render', text: '모델이 캔버스에 그리라고 함' },
      { msg: 'shown', text: '캔버스가 불러온 클래스 그림을 보여 줌' }
    ]), { level: 'ok', status: '불러옴' }));
  }

  UCV.ops.register({
    name: 'import',
    uc: 'UC-05',
    label: '불러오기',
    run
  });
})();
