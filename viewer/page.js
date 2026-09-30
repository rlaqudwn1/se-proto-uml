// 뷰 층: 페이지 시작. data를 읽고 영역을 잇는다(불빛 규칙, 번호 이동, 논의할 점, 바닥 줄, 제목).
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const div = (cls, html) => { const e = document.createElement('div'); if (cls) e.className = cls; if (html) e.innerHTML = html; return e; };
  // 영역 하나가 멈춰도 나머지는 그린다. 파일을 못 읽은 영역은 boot.js가 이미 알렸으므로 조용히 건너뛴다.
  function part(name, fnName, fn, fallback) {
    if (typeof UCV.view[fnName] !== 'function') return fallback;
    try { return fn(); } catch (e) { UCV.bug(`'${name}'을 그리다 멈췄습니다`, e); return fallback; }
  }
  const noop = () => {};
  const NO_SEQ = { markRan: noop, setLit: noop, focusStep: noop, highlight: noop, scrollToMsg: noop, numberOf: () => 0 };
  const NO_PANEL = { list: noop, show: noop };
  const NO_CARD = { setNow: noop, setOther: noop, setFocus: noop, setLive: noop };

  function start() {
    const D = window.UC_DATA, P = window.UC_PARTS || {}, SRC = window.UC_SOURCE || {};
    const V = UCV.view;
    document.title = D.uc + ' ' + D.title;

    const wrap = div('wrap');
    document.body.appendChild(wrap);

    // 1. 제목과 요약 두 줄: 한 문장 + 부품이 이어지는 순서
    const chainParts = D.parts.filter(k => P[k] && !P[k].actor);
    const anyProp = chainParts.some(k => P[k].proposed);
    const head = document.createElement('header');
    head.className = 'page-head';
    head.innerHTML = `<h1>${esc(D.uc)} ${esc(D.title)}</h1><p class="summary">${esc(D.summary)}</p>
      <div class="chain" aria-label="안에서 이어지는 부품">${chainParts.map(k =>
        `<span class="part-chip${P[k].proposed ? ' prop' : ''}">${esc(P[k].name)}</span>`).join('<span class="arrow">→</span>')}
        ${anyProp ? '<span class="note">점선은 원문에 없는 제안 분할입니다.</span>' : ''}</div>`;
    wrap.appendChild(head);

    // 2. 본문 카드와 직접 해 보기
    const secA = div('sec-a');
    const bleedA = div('bleed');
    bleedA.appendChild(secA);
    wrap.appendChild(bleedA);

    // 3. 안에서 주고받는 흐름
    const bleedV = div('bleed');
    bleedV.id = 'viewer-anchor';
    bleedV.innerHTML = `<section class="viewer" aria-labelledby="viewer-title">
      <div class="viewer-head"><h2 id="viewer-title">안에서 주고받는 흐름</h2>
        <span class="muted small">부품을 누르면 클래스 초안이 열립니다. 왼쪽 띠는 본문의 단계입니다.</span></div>
      <div class="viewer-grid"><div class="diagram"></div><aside class="cls-panel" aria-live="polite"></aside></div>
      <div class="seq-legend"><span><span class="sw dash"></span>원문에 없는 제안 부품</span>
        <span><span class="sw ran"></span>“직접 해 보기”에서 방금 지나간 메시지</span></div></section>`;
    wrap.appendChild(bleedV);

    // 4. 논의할 점: 제목만 보이고 본문은 접힘. 본문 끝에 근거를 붙인다(FR-006).
    const dec = document.createElement('section');
    dec.className = 'block';
    dec.setAttribute('aria-labelledby', 'dec-title');
    dec.innerHTML = `<h2 id="dec-title">논의할 점</h2><div class="decisions">${D.discuss.map((d, i) =>
      `<details id="${esc(d.id)}"><summary><span class="dn">${i + 1}</span>${esc(d.title)}</summary>
        <p>${esc(d.body)} (근거: ${esc(d.basis)})</p></details>`).join('')}</div>`;
    wrap.appendChild(dec);

    // 5. 바닥 한 줄(FR-008). 창 폭 표시는 폭 재기용이며 UC-02 게시 때 뺀다(plan 결정 2).
    const foot = document.createElement('footer');
    const date = String(SRC.folder || '').slice(0, 10);
    foot.innerHTML = `<p><span class="foot-text">${esc(date)} 노션 기준. 이후 노션 수정은 다음 주간 갱신 때 반영됩니다. '직접 해 보기'는 설명용 시뮬레이션이며 제품 코드가 아닙니다.</span><span class="vw-probe"></span></p>`;
    wrap.appendChild(foot);
    const probe = foot.querySelector('.vw-probe');
    const showWidth = () => { probe.textContent = ` · 창 폭 ${window.innerWidth}px`; };
    showWidth();
    window.addEventListener('resize', showWidth);

    // ---------- 흐름 그림과 클래스 패널 ----------
    const msgs = D.seq.filter(m => !m.frame);
    const msgById = {};
    msgs.forEach(m => { msgById[m.id] = m; });
    const participants = D.parts.filter(k => P[k]).map(k => ({ id: k, name: P[k].name, actor: !!P[k].actor, prop: !!P[k].proposed }));

    let panel = NO_PANEL;
    const select = (key, op) => { seq.highlight(key, op); panel.show(key, op); };
    const seq = part('흐름 그림', 'seqDraw', () => V.seqDraw(bleedV.querySelector('.diagram'), {
      participants, seq: D.seq, steps: D.steps, uc: D.uc,
      ariaLabel: `${D.uc} 안에서 부품끼리 주고받는 메시지. 부품을 눌러 클래스 초안을 볼 수 있습니다.`,
      onPart: (key, op) => select(key, op),
      onStep: no => setFocus(no, false)
    }), NO_SEQ) || NO_SEQ;
    panel = part('클래스 패널', 'panel', () => V.panel(bleedV.querySelector('.cls-panel'), {
      keys: D.parts, parts: P, used: msgs.map(m => ({ owner: m.owner, op: m.op })),
      onSelect: key => seq.highlight(key)
    }), NO_PANEL) || NO_PANEL;
    panel.list();

    // ---------- 본문 카드: 단계를 누르면 흐름 그림의 그 구간으로(FR-003) ----------
    let focused = null;
    const stepOf = no => D.steps.find(s => s.no === no);
    function setFocus(no, fromCard) {
      focused = focused === no && !fromCard ? null : no;
      card.setFocus(focused);
      seq.focusStep(focused);
      const s = focused && stepOf(focused);
      if (fromCard && s && s.msgs) seq.scrollToMsg(s.msgs[0]);
    }
    const card = part('본문 카드', 'card', () => V.card(secA, { data: D, onStep: no => setFocus(no, true) }), NO_CARD) || NO_CARD;

    // ---------- 불빛 규칙(FR-015)과 기록 ----------
    let logv = null, last = null;
    function onRecord(rec) {
      last = rec;
      if (!rec) {
        card.setNow([]); card.setOther(null); seq.markRan([]); seq.setLit([]);
        if (logv) logv.show(null);
        return;
      }
      const same = rec.uc === D.uc;
      const ids = new Set(rec.lines.map(l => l.msg).filter(Boolean));
      // 빈 lightBy는 켜짐 조건으로 치지 않는다(plan "메시지 없는 원문 단계").
      const lit = same ? D.steps.filter(s => s.lightBy.length && s.lightBy.every(id => ids.has(id))).map(s => s.no) : [];
      card.setNow(lit);
      card.setOther(same ? null : rec.uc);
      seq.markRan(same ? [...ids] : []);
      seq.setLit(lit);
      const litAlt = D.steps.filter(s => s.flow === 'alt' && lit.includes(s.no)).map(s => s.no);
      if (logv) logv.show(rec, litAlt);
    }
    const tp = part('직접 해 보기', 'tryPane', () => V.tryPane(secA, { data: D, uc: D.uc, onRecord }), null);
    if (tp) {
      logv = part('기록', 'log', () => V.log(tp.logHost, {
        uc: D.uc,
        numberOf: id => seq.numberOf(id),
        discussId: n => (D.discuss[n - 1] ? D.discuss[n - 1].id : null),
        // 번호 이동(FR-016): 그 메시지를 고르고 화면 안으로
        onMsg: id => { const m = msgById[id]; if (!m) return; select(m.owner, m.op); seq.scrollToMsg(id); }
      }), null);
      onRecord(last);
    }

    // 접힌 논의할 점으로 가는 링크는 그 항목을 펼친다.
    document.addEventListener('click', e => {
      const a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      const d = document.getElementById(a.getAttribute('href').slice(1));
      if (d && d.tagName === 'DETAILS') d.open = true;
    });

    // ---------- FR-019: UC-01 전용 두 곳 (3단계 아래 문장, d3 배치 방식 토글) ----------
    if (D.uc === 'UC-01' && tp) uc01(tp, card);
  }

  function uc01(tp, card) {
    const w = tp.world;
    const live = () => {
      const p = w.state().pinned;
      card.setLive('3', p.length ? `지금 수동 조정한 객체: ${p.join(', ')}. 코드를 고쳐도 그 자리에 남습니다.` : null);
    };
    w.on('change', live);
    live();
    const d3 = document.getElementById('d3');
    if (!d3) return;
    const box = div('', `<fieldset class="seg"><legend>견본의 배치 방식</legend>
        <label><input type="radio" name="layout-mode" value="all" checked> 옮기지 않은 노드는 다시 정렬</label>
        <label><input type="radio" name="layout-mode" value="new"> 새 노드만 배치</label></fieldset>
      <p class="mode-note" role="status">바꾸면 “직접 해 보기”가 처음 상태로 돌아갑니다.</p>`);
    d3.appendChild(box);
    const note = box.querySelector('.mode-note');
    box.querySelectorAll('input[name="layout-mode"]').forEach(r => r.addEventListener('change', () => {
      if (!r.checked) return;
      w.setLayoutMode(r.value);
      tp.reset();
      note.textContent = r.value === 'all'
        ? '“옮기지 않은 노드는 다시 정렬”로 바꾸고 “직접 해 보기”를 처음 상태로 돌렸습니다.'
        : '“새 노드만 배치”로 바꾸고 “직접 해 보기”를 처음 상태로 돌렸습니다.';
    }));
  }

  UCV.view.page = { start };
})();
