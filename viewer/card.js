// 뷰 층: 본문 카드(원문 사전조건·기본 흐름·대안 흐름·사후조건)와 otherOps 상자
(function () {
  'use strict';
  const UCV = window.UCV;
  UCV.view = UCV.view || {};

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // opts: { data, onStep(no) }
  // 돌려줌: { el, setNow(nos), setOther(uc|null), setFocus(no|null), setLive(no, text|null) }
  function card(host, opts) {
    const D = opts.data;
    const stepLi = s => {
      const live = s.msgs ? ' tabindex="0" role="button"' : '';
      return `<li class="uc-step${s.flow === 'alt' ? ' alt' : ''}${s.msgs ? '' : ' static'}" data-step="${esc(s.no)}"${live}>` +
        `<span class="uc-no">${esc(s.no)}</span><div><p>${esc(s.text)}</p>` +
        `<p class="uc-live" data-live="${esc(s.no)}" hidden></p></div></li>`;
    };
    const group = (title, list) => (list.length
      ? `<div class="uc-group"><h4>${title}</h4><ol class="uc-steps">${list.map(stepLi).join('')}</ol></div>` : '');
    const main = D.steps.filter(s => s.flow !== 'alt'), alt = D.steps.filter(s => s.flow === 'alt');

    const el = document.createElement('aside');
    el.className = 'uc-card';
    el.setAttribute('aria-labelledby', 'uc-title');
    el.innerHTML = `<div class="uc-head"><h2 id="uc-title">유스케이스 본문</h2>
        <p class="muted small">노션 원문입니다. 단계를 누르면 아래 그림에서 그 단계의 메시지를 보여 줍니다.</p></div>
      <p class="small"><span class="muted">사전조건</span> ${esc(D.pre)}</p>
      ${group('기본 흐름', main)}${group('대안 흐름', alt)}
      <p class="small"><span class="muted">사후조건</span> ${esc(D.post)}</p>
      ${(D.otherOps || []).map(o => `<div class="uc-other" data-uc="${esc(o.uc)}"><span class="tag other">${esc(o.uc)}</span><p>${esc(o.note)}</p></div>`).join('')}`;
    host.appendChild(el);

    const steps = {};
    el.querySelectorAll('.uc-step').forEach(li => {
      steps[li.dataset.step] = li;
      if (li.classList.contains('static')) return;
      li.addEventListener('click', () => opts.onStep(li.dataset.step));
      li.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); opts.onStep(li.dataset.step); }
      });
    });

    return {
      el,
      setNow(nos) {
        const set = new Set(nos);
        Object.keys(steps).forEach(no => steps[no].classList.toggle('now', set.has(no)));
      },
      setOther(uc) {
        el.querySelectorAll('.uc-other').forEach(b => b.classList.toggle('now', b.dataset.uc === uc));
      },
      setFocus(no) {
        Object.keys(steps).forEach(k => steps[k].classList.toggle('focus', k === no));
      },
      setLive(no, text) {
        const p = el.querySelector(`.uc-live[data-live="${no}"]`);
        if (!p) return;
        p.hidden = !text;
        p.textContent = text || '';
      }
    };
  }

  UCV.view.card = card;
})();
