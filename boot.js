// 공용 시작 파일: UCV와 견본 문제 상자, 조작 등록부, 부를 파일 목록과 순서
(function () {
  'use strict';
  const UCV = window.UCV = window.UCV || {};

  // 부를 파일(껍데기 기준 ../). 새 조작을 더할 때는 sim/ops 줄만 더한다.
  const FILES = [
    'data/parts.js',
    'data/source.js',
    'sim/diagrams/class.js',
    'sim/world.js',
    'sim/ops/code.js',
    'sim/ops/drag.js',
    'sim/ops/import.js',
    'sim/ops/color.js',
    'sim/ops/export.js',
    'viewer/seq-draw.js',
    'viewer/panel.js',
    'viewer/card.js',
    'viewer/log.js',
    'viewer/try.js',
    'viewer/page.js'
  ];

  // 견본 문제: 회색 점선 상자. 자세한 내용은 콘솔에만 남긴다.
  const pending = [];
  function showBug(msg) {
    let box = document.getElementById('ucv-bugs');
    if (!box) {
      box = document.createElement('div');
      box.id = 'ucv-bugs';
      box.setAttribute('role', 'status');
      document.body.insertBefore(box, document.body.firstChild);
    }
    const p = document.createElement('p');
    p.className = 'ucv-bug';
    p.textContent = '견본 문제: ' + msg;
    box.appendChild(p);
  }
  UCV.bug = function (msg, detail) {
    console.error('[견본 문제] ' + msg, detail === undefined ? '' : detail);
    if (document.body) showBug(msg); else pending.push(msg);
  };

  // 조작 파일이 스스로 등록한다: {name, uc, label, attach(ctx), run(ctx, args)}
  const ops = [];
  UCV.ops = {
    register(op) { ops.push(op); },
    list() { return ops.slice(); }
  };

  function load(i, done) {
    if (i >= FILES.length) { done(); return; }
    const s = document.createElement('script');
    s.src = '../' + FILES[i];
    s.onload = () => load(i + 1, done);
    s.onerror = () => { UCV.bug('site/' + FILES[i] + '를 읽지 못했습니다'); load(i + 1, done); };
    document.head.appendChild(s);
  }

  function start() {
    pending.splice(0).forEach(showBug);
    if (!window.UC_DATA) { UCV.bug('이 페이지의 data.js를 읽지 못했습니다'); return; }
    if (!UCV.view || !UCV.view.page) { UCV.bug('site/viewer/page.js를 읽지 못해 페이지를 그리지 못했습니다'); return; }
    try {
      UCV.view.page.start();
    } catch (e) {
      UCV.bug('페이지를 그리다 멈췄습니다', e);
    }
  }

  load(0, () => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  });
})();
