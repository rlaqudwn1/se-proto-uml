// 뷰 층: "방금 안에서 일어난 일" 기록. 가장 최근 한 번만 보인다(FR-017).
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const EMPTY = '아직 아무것도 하지 않았습니다. 위의 “직접 해 보기”에서 조작해 보세요.';

  // opts: { uc: 페이지 UC, numberOf(id), discussId(n) -> "d2" | null, onMsg(id) }
  // 돌려줌: { show(record|null, litAlt[]) }
  function log(host, opts) {
    const body = document.createElement('div');
    body.setAttribute('aria-live', 'polite');
    host.appendChild(body);

    body.addEventListener('click', e => {
      const b = e.target.closest('button.lno');
      if (b) opts.onMsg(b.dataset.msg);
    });

    // 머리 표시(명세 D4): uc가 다르면 "<uc> 조작", alt면 "대안 흐름 " + 켜진 대안 단계, 그 밖은 "기본 흐름"
    function badge(rec, litAlt) {
      if (rec.uc !== opts.uc) return { cls: 'other', text: `${rec.uc} 조작` };
      if (rec.flow === 'alt') return { cls: 'alt', text: ('대안 흐름 ' + (litAlt || []).join(', ')).trim() };
      return { cls: 'main', text: '기본 흐름' };
    }

    // 줄 끝의 "논의할 점 N"은 그 논의할 점으로 가는 링크로 바꾼다.
    function lineHtml(text) {
      const m = /논의할 점 (\d+)$/.exec(text);
      const id = m && opts.discussId(+m[1]);
      if (!id) return esc(text);
      return esc(text.slice(0, m.index)) + `<a href="#${esc(id)}">논의할 점 ${m[1]}</a>`;
    }

    function show(rec, litAlt) {
      if (!rec) { body.innerHTML = `<p class="log-empty">${EMPTY}</p>`; return; }
      const same = rec.uc === opts.uc, b = badge(rec, litAlt);
      body.innerHTML = `<article class="grp fresh">
        <header class="grp-head"><span class="grp-title">${esc(rec.title)}</span><span class="flow ${b.cls}">${esc(b.text)}</span></header>
        <ol class="lns">${rec.lines.map((l, i) => {
          const n = same && l.msg ? opts.numberOf(l.msg) : 0;
          const no = n
            ? `<button type="button" class="lno" data-msg="${esc(l.msg)}" title="아래 흐름 그림에서 ${n}번 메시지 보기">${n}</button>`
            : '<span class="lno">·</span>';
          const val = l.value ? ` <span class="lval mono">${esc(l.value)}</span>` : '';
          return `<li class="lline${l.level ? ' ' + esc(l.level) : ''}" style="--i:${i}">${no}<span>${lineHtml(l.text)}${val}</span></li>`;
        }).join('')}</ol></article>`;
    }

    show(null);
    return { show };
  }

  UCV.view.log = log;
})();
