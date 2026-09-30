// 클래스 패널: 부품 목록과 부품 상세(UML 상자, 논의할 점). 견본 v2 renderList/renderPanel.
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  UCV.view.panel = function (host, opts) {
    const keys = opts.keys || [];
    const parts = opts.parts || {};
    // 이 페이지 흐름에서 쓰는 기능(owner/op 조합)
    const used = new Set((opts.used || []).map(u => u.owner + '\u0000' + u.op));
    const select = key => { if (opts.onSelect) opts.onSelect(key); };

    function list() {
      const items = keys.filter(k => {
        if (parts[k]) return true;
        UCV.bug("부품 '" + k + "'이 부품 목록(parts.js)에 없습니다");
        return false;
      }).map(k => {
        const p = parts[k];
        return `
        <li><button type="button" class="${p.proposed ? 'prop' : ''}" data-go="${esc(k)}">
          <span class="pn">${esc(p.name)}${p.proposed ? '<span class="prop-mark">제안</span>' : ''}</span>
          <span class="ps">${esc(p.short)}</span></button></li>`;
      }).join('');
      host.innerHTML = `<h4>부품 ${keys.length}개</h4><ul class="parts">${items}</ul>`;
      host.querySelectorAll('[data-go]').forEach(b => b.addEventListener('click', () => {
        show(b.dataset.go);
        select(b.dataset.go);
      }));
    }

    function show(key, focusOp) {
      const p = parts[key];
      if (!p) { UCV.bug("부품 '" + key + "'이 부품 목록(parts.js)에 없습니다"); return; }
      let html = `<button type="button" class="btn back" data-back>← 부품 목록</button>
        <div class="cls-head">
          <div class="cls-title"><h3>${esc(p.name)}</h3><span class="mono">${esc(p.code)}</span>${p.proposed ? '<span class="prop-mark">제안</span>' : ''}</div>
          <p class="small">${esc(p.summary)}</p></div>`;
      if (!p.actor) {
        const attrs = p.attrs || [], ops = p.ops || [];
        html += `<div class="umlbox${p.proposed ? ' prop' : ''}" aria-label="UML 클래스 표기">
          <div class="uml-name">${p.proposed ? '<span class="stereo">«제안»</span>' : ''}${esc(p.code)}</div>
          ${attrs.length ? `<div>${attrs.map(a => `<span class="uml-line">- ${esc(a)}</span>`).join('')}</div>` : ''}
          <div>${ops.map(o => {
            const cls = 'uml-line op' + (used.has(key + '\u0000' + o.key) ? ' used' : '') + (focusOp && o.key === focusOp ? ' hi' : '');
            return `<span class="${cls}">+ <code>${esc(o.sig)}</code><span class="d">${esc(o.desc)}</span></span>`;
          }).join('')}</div></div>`;
      }
      const discuss = p.discuss || [];
      if (discuss.length) {
        html += `<div class="discuss"><h4>논의할 점</h4><ul>${discuss.map(d => `<li>${esc(d)}</li>`).join('')}</ul></div>`;
      }
      host.innerHTML = html;
      host.querySelector('[data-back]').addEventListener('click', () => {
        list();
        select(null);
      });
    }

    return { list, show };
  };
})();
