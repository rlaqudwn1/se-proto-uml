// 흉내 층: 편집기 첫 줄 나누기와 classDiagram 부분집합 해석 (견본 v2 parse에서 옮김)
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.sim = UCV.sim || {};

  const REL_OPS = '(<\\|--|\\*--|o--|-->|\\.\\.\\|>|\\.\\.>|--|\\.\\.)';
  const REL_RE = new RegExp('^([A-Za-z_]\\w*)\\s*' + REL_OPS + '\\s*([A-Za-z_]\\w*)\\s*(?::\\s*(.*))?$');
  const REL_TAIL_RE = new RegExp('^([A-Za-z_]\\w*)\\s*' + REL_OPS + '\\s*$');
  const REL_HEAD_RE = new RegExp('^' + REL_OPS);
  const CLASS_RE = /^class\s+([A-Za-z_]\w*)\s*(\{)?\s*(\})?\s*$/;
  // 알려진 classDiagram 문법이지만 견본이 흉내 내지 않는 줄 (노란 "건너뜀" 안내)
  const SKIP_RES = [
    /^note\b/,
    /^(classDef|style|cssClass)\b/,
    /^direction\b/,
    /^(click|link|callback)\b/,
    /^<<.*>>/,
    /^[A-Za-z_]\w*\s*:\s*\S/ // 멤버 줄: A : +m()
  ];
  const MAX_CLASSES = 30;

  // 주석과 빈 줄을 건너뛴 첫 줄
  function firstLine(code) {
    const lines = String(code).split('\n');
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t && !t.startsWith('%%')) return t;
    }
    return '';
  }

  // "class" | "sequence" | "other". 빈 코드는 classDiagram 해석으로 보내 2A 오류가 되게 한다.
  function route(code) {
    const t = firstLine(code);
    if (!t || /^classDiagram(-v2)?\b/.test(t)) return 'class';
    if (/^sequenceDiagram\b/.test(t)) return 'sequence';
    return 'other';
  }

  const fail = (line, msg) => ({ ok: false, line, msg });

  function parseClass(code) {
    const lines = String(code).split('\n');
    const classes = [], seen = new Set(), rels = [], skipped = [];
    const add = id => { if (!seen.has(id)) { seen.add(id); classes.push(id); } };
    let header = false, inBlock = 0;
    for (let i = 0; i < lines.length; i++) {
      const t = lines[i].trim(), ln = i + 1;
      if (!t || t.startsWith('%%')) continue;
      if (inBlock) {
        if (t === '}') inBlock = 0; else skipped.push({ line: ln, text: t });
        continue;
      }
      if (!header) {
        if (/^classDiagram(-v2)?$/.test(t)) { header = true; continue; }
        return fail(ln, '첫 줄에 classDiagram이 있어야 합니다.');
      }
      let m;
      if ((m = t.match(CLASS_RE))) { add(m[1]); if (m[2] && !m[3]) inBlock = ln; continue; }
      if ((m = t.match(REL_RE))) {
        add(m[1]); add(m[3]);
        const rel = { from: m[1], op: m[2], to: m[3] };
        if (m[4] && m[4].trim()) rel.label = m[4].trim();
        rels.push(rel);
        continue;
      }
      if ((m = t.match(REL_TAIL_RE))) return fail(ln, `관계 기호 ${m[2]} 뒤에 클래스 이름이 없습니다.`);
      if (REL_HEAD_RE.test(t)) return fail(ln, '관계 기호 앞에 클래스 이름이 없습니다.');
      if (SKIP_RES.some(re => re.test(t))) { skipped.push({ line: ln, text: t }); continue; }
      return fail(ln, '읽을 수 없는 줄입니다. A --> B나 class A 형식으로 써 주세요.');
    }
    if (!header) return fail(1, '첫 줄에 classDiagram이 있어야 합니다.');
    if (inBlock) return fail(inBlock, '{ 로 연 클래스 본문이 } 로 닫히지 않았습니다.');
    if (classes.length > MAX_CLASSES) {
      return fail(lines.length, `클래스가 ${classes.length}개입니다. 캔버스 객체는 ${MAX_CLASSES}개까지입니다.`);
    }
    return { ok: true, classes, rels, skipped };
  }

  UCV.sim.route = route;
  UCV.sim.parseClass = parseClass;
})();
