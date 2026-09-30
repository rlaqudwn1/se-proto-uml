// 조작: 이미지로 내보내기(UC-04). 형식을 고르는 모습까지만 흉내 내고 파일은 만들지 않는다(FR-018).
(function () {
  'use strict';
  const UCV = window.UCV;

  const FORMATS = { PNG: 'png', JPG: 'jpg' };
  const LAST = '견본은 파일을 만들지 않습니다';

  function exportAs(ctx, format) {
    const F = FORMATS[format] ? format : 'PNG';
    const st = ctx.world.state();
    const name = 'diagram.' + FORMATS[F];
    ctx.emit({
      uc: 'UC-04', op: 'export', flow: 'main', title: `이미지로 내보내기 · ${F}`,
      lines: [
        { msg: 'run', text: '사용자가 내보내기를 실행함' },
        { msg: 'askFormat', text: '내보내기 창이 형식을 물음: PNG 또는 JPG' },
        { msg: 'choose', text: `사용자가 ${F}를 고름` },
        { msg: 'encode', text: `내보내기 창이 이미지 변환기에 지금 그림을 ${F}로 바꾸라고 맡김 (클래스 ${st.nodes.length}개, 관계 ${st.edges.length}개)` },
        { msg: 'image', text: `이미지 변환기가 ${F} 이미지를 돌려줌`, value: `${st.size.w}×${st.size.h}` },
        { msg: 'save', text: '내보내기 창이 파일 저장기에 저장을 맡김', value: name },
        { text: '파일 이름과 저장 위치를 정하는 단계는 비어 있음 · 논의할 점 3' },
        { text: LAST }
      ]
    });
  }

  UCV.ops.register({
    name: 'export',
    uc: 'UC-04',
    label: '이미지로 내보내기',
    // 버튼(PNG로 내보내기, JPG로 내보내기): args.format은 "PNG" 또는 "JPG"
    run(ctx, args) { exportAs(ctx, (args || {}).format); }
  });
})();
