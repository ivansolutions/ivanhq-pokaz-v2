// ivanhq v2 — поведение страницы. Ничего не отправляет в сеть: ни fetch, ни XHR, ни sendBeacon (форма — черновик).
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const tiho = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const D = (() => { try { return JSON.parse($('#dannye').textContent); } catch (e) { return null; } })();
  const zhdat = ms => new Promise(r => setTimeout(r, tiho ? 0 : ms));

  // шапка: меню на телефоне, черта при прокрутке, полоса прогресса
  const shapka = $('#shapka'), burger = $('#burger'), nav = $('#nav'), pr = $('#progress');
  if (burger) burger.addEventListener('click', () => {
    const otkr = nav.classList.toggle('otkr');
    burger.setAttribute('aria-expanded', otkr);
    burger.querySelector('.vh').textContent = otkr ? burger.dataset.zakr : burger.dataset.otkr;
  });
  if (nav) nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('otkr'); burger && burger.setAttribute('aria-expanded', 'false'); } });
  const prokrutka = () => {
    const y = scrollY, h = document.documentElement.scrollHeight - innerHeight;
    shapka && shapka.classList.toggle('s-tenyu', y > 8);
    if (pr) pr.style.width = (h > 0 ? Math.min(100, y / h * 100) : 0) + '%';
  };
  addEventListener('scroll', prokrutka, { passive: true }); prokrutka();

  if (!D) return;   // правовая страница: дальше только главная

  // указатель глав
  const ukaz = $('.ukazatel');
  if (ukaz && 'IntersectionObserver' in window) {
    const ssylki = $$('a', ukaz);
    const io = new IntersectionObserver(zap => zap.forEach(z => {
      if (!z.isIntersecting) return;
      ssylki.forEach(a => a.classList.toggle('tek', a.dataset.k === z.target.dataset.k));
      ukaz.classList.toggle('na-temnom', z.target.matches('.glava-temn, .forma-gl'));
    }), { rootMargin: '-45% 0px -50% 0px' });
    $$('section[data-k], #analyse').forEach(s => io.observe(s));
  }

  // первый экран: заявка салона проходит I → V → A → N один раз. Нарисовано на canvas — это картинка-пример,
  // текст сцены целиком лежит в aria-label. Движение ≈ 5 с и стоп; «меньше движения» — сразу конечный кадр.
  const cv = $('#scena');
  if (cv) {
    const H = D.hero, cx = cv.getContext('2d');
    const C = { fon: '#F6F5F1', bel: '#FFFFFF', chern: '#14171C', t2: '#4B515B', lin: '#D9D6CD', akc: '#1E56D6', akcS: '#E6EDFC', ok: '#1A7F45', klient: '#EFEEEA' };
    const shr = (v, r) => `${v} ${r}px Manrope, system-ui, sans-serif`;
    let t0 = 0, raf = 0;
    const POKAZ = [0.4, 1.5, 2.6, 3.7], RELS = [0.9, 2.0, 3.1, 4.2], KONEC = 4.9;
    function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    function stroki(t, max) { const out = []; let s = ''; for (const w of t.split(' ')) { const p = s ? s + ' ' + w : w; if (cx.measureText(p).width > max && s) { out.push(s); s = w; } else s = p; } if (s) out.push(s); return out; }
    function kadr(sek) {
      const W = cv.clientWidth, Hh = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, Hh);
      const ryad = W < 480;                       // телефон: рельс строкой под телефоном
      const tw = ryad ? Math.min(290, W - 48) : 290, th = ryad ? Hh - 150 : 500;
      const tx = ryad ? (W - tw) / 2 : 40, ty = 20;
      // корпус
      cx.save(); cx.shadowColor = 'rgba(20,23,28,.20)'; cx.shadowBlur = 24; cx.shadowOffsetY = 10;
      rr(tx, ty, tw, th, 44); cx.fillStyle = C.chern; cx.fill(); cx.restore();
      rr(tx + 10, ty + 10, tw - 20, th - 20, 35); cx.fillStyle = C.bel; cx.fill();
      // шапка чата
      const ix = tx + 26, iy = ty + 30;
      cx.fillStyle = C.fon; cx.beginPath(); cx.arc(ix + 18, iy + 18, 18, 0, 7); cx.fill();
      cx.fillStyle = C.chern; cx.font = shr(800, 15); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(H.salon.trim()[0] || 'S', ix + 18, iy + 19);
      cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
      cx.font = shr(700, 14); cx.fillText(H.salon, ix + 46, iy + 15);
      cx.fillStyle = C.ok; cx.font = shr(500, 12); cx.fillText(H.online, ix + 46, iy + 33);
      cx.fillStyle = '#EEECE6'; cx.fillRect(tx + 10, iy + 50, tw - 20, 1);
      // сообщения
      let y = iy + 68; const maxW = (tw - 20) * 0.78, pad = 11, lh = 19;
      cx.font = shr(500, 14);
      H.chat.forEach(([kto, txt], i) => {
        const a = Math.max(0, Math.min(1, (sek - POKAZ[i]) / 0.35)); if (!a) return;
        const L = stroki(txt, maxW - 2 * pad), bw = Math.min(maxW, Math.max(...L.map(s => cx.measureText(s).width)) + 2 * pad), bh = L.length * lh + 2 * pad - 4;
        const bx = kto === 'k' ? tx + 22 : tx + tw - 22 - bw, by = y + (1 - a) * 6;
        cx.globalAlpha = a; rr(bx, by, bw, bh, 15); cx.fillStyle = kto === 'k' ? C.klient : C.akcS; cx.fill();
        cx.fillStyle = C.chern; L.forEach((s, j) => cx.fillText(s, bx + pad, by + pad + 13 + j * lh)); cx.globalAlpha = 1;
        y += bh + 10;
      });
      // подпись «пример»
      cx.fillStyle = C.t2; cx.font = shr(500, 12); cx.textAlign = 'center'; cx.fillText(H.beispiel, tx + tw / 2, ty + th - 22); cx.textAlign = 'left';
      // рельс I · V · A · N
      const n = 4;
      for (let i = 0; i < n; i++) {
        const gor = sek >= RELS[i];
        const [cxr, cyr] = ryad ? [tx + tw * (i + 0.5) / n, ty + th + 34] : [tx + tw + 48, ty + 140 + i * 78];
        cx.beginPath(); cx.arc(cxr, cyr, 22, 0, 7); cx.fillStyle = gor ? C.akc : C.fon; cx.fill();
        cx.lineWidth = 2; cx.strokeStyle = gor ? C.akc : C.lin; cx.stroke();
        cx.fillStyle = gor ? '#FFFFFF' : C.chern; cx.font = shr(800, 17); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('IVAN'[i], cxr, cyr + 1);
        cx.textBaseline = 'alphabetic'; cx.fillStyle = gor ? C.chern : C.t2; cx.font = shr(650, ryad ? 12 : 14);
        if (ryad) { stroki(H.schritte[i], tw / n - 6).forEach((s, j) => cx.fillText(s, cxr, cyr + 42 + j * 15)); }
        else { cx.textAlign = 'left'; stroki(H.schritte[i], W - (cxr + 32) - 4).forEach((s, j, A) => cx.fillText(s, cxr + 32, cyr + 5 - (A.length - 1) * 9 + j * 18)); }
        cx.textAlign = 'left';
      }
    }
    function igrat(ts) { if (!t0) t0 = ts; const sek = (ts - t0) / 1000; kadr(sek); if (sek < KONEC) raf = requestAnimationFrame(igrat); else { raf = 0; cv.setAttribute('aria-busy', 'false'); } }
    const zapusk = () => { cancelAnimationFrame(raf); t0 = 0; if (tiho) { kadr(99); cv.setAttribute('aria-busy', 'false'); } else { cv.setAttribute('aria-busy', 'true'); raf = requestAnimationFrame(igrat); } };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(zapusk);
    $('#snova').addEventListener('click', zapusk);
    addEventListener('resize', () => { if (!raf) kadr(99); });
  }

  // липкая кнопка на телефоне: прячется, пока на экране первый экран или сама форма
  const lip = $('#lip');
  if (lip && 'IntersectionObserver' in window) {
    const vidno = new Set();
    const io3 = new IntersectionObserver(z => { z.forEach(x => x.isIntersecting ? vidno.add(x.target) : vidno.delete(x.target)); lip.classList.toggle('skryt', vidno.size > 0); });
    [$('.geroj'), $('#analyse')].forEach(x => x && io3.observe(x));
  }

  // глава 2: одна заявка
  const K = D.k2, uzly = $$('#uzly .uzel'), shag = $('#demo-shag'), zh = $('#zhurnal'), tg = $('#tg');
  const ZH = [
    ['→ webhook   shop/new-order #4821', '✓ verify    address, vat id, stock — ok', '→ crm       customer 3391 · invoice draft', '✓ notify    telegram · 0.84 s'],
    ['→ webhook   site/form #1077', '✓ verify    required fields, no duplicate — ok', '→ sheet     row 212 · confirmation sent', '✓ notify    telegram · 0.61 s'],
    ['→ mail      inbox/invoice #R-5530', '✓ verify    amount, iban = order — ok', '→ books     filed 2026-10/R-5530', '✓ notify    summary · 0.92 s'],
    ['→ webhook   shop/new-order #4822', '✕ verify    vat id ≠ country — STOP', '· —         nothing booked', '✓ notify    telegram · 0.55 s']
  ];
  let sl = 0, idyot = 0;
  $$('.sluchaj').forEach(b => b.addEventListener('click', () => {
    sl = +b.dataset.s; $$('.sluchaj').forEach(x => x.setAttribute('aria-pressed', x === b)); sbros();
  }));
  function sbros() { idyot++; uzly.forEach(u => u.classList.remove('gor', 'stop')); zh.textContent = ''; tg.hidden = true; shag.innerHTML = '&nbsp;'; }
  async function pusk() {
    sbros(); const moj = idyot;
    for (let i = 0; i < 4; i++) {
      await zhdat(i ? 900 : 150); if (moj !== idyot) return;
      const stop = sl === 3 && i === 1;
      uzly[i].classList.add(stop ? 'stop' : 'gor');
      shag.textContent = `${K.schritt} ${i + 1} ${K.von} 4 · ${K.buchstaben[i]}: ${K.texte[sl][i]}`;
      const st = document.createElement('span'); st.className = ZH[sl][i].startsWith('✓') ? 'ok' : ZH[sl][i].startsWith('✕') ? 'st' : '';
      st.textContent = ZH[sl][i] + '\n'; zh.appendChild(st);
      if (stop) { await zhdat(900); if (moj !== idyot) return; shag.textContent = `${K.schritt} 4 ${K.von} 4 · ${K.buchstaben[3]}: ${K.texte[sl][3]}`; zh.appendChild(Object.assign(document.createElement('span'), { textContent: ZH[sl][3] + '\n', className: 'ok' })); uzly[3].classList.add('gor'); break; }
    }
    $('#tg-t').textContent = K.telegram[sl]; tg.hidden = false;
  }
  $('#pusk').addEventListener('click', pusk);
  // один показ, когда глава впервые видна — чтобы она не стояла пустой; дальше только по кнопке
  if ('IntersectionObserver' in window) { const io2 = new IntersectionObserver(z => { if (z[0].isIntersecting) { io2.disconnect(); pusk(); } }, { threshold: .4 }); io2.observe($('#uzly')); }

  // глава 3: расчёт
  const P = n => $('#p-' + n), O = n => $('#o-' + n);
  let val = $('.val[aria-pressed="true"]').dataset.v;
  const chislo = (x, d = 0) => x.toLocaleString(document.documentElement.lang, { maximumFractionDigits: d, minimumFractionDigits: d });
  const dengi = x => { const s = chislo(Math.round(x)); return ['€', '$', '£'].includes(val) && D.yazyk === 'en' ? val + s : s + ' ' + val; };
  function schet() {
    const z = +P('zayavok').value, m = +P('minut').value, d = +P('dnej').value, c = +P('chas').value, dol = +P('dolya').value;
    O('zayavok').textContent = z; O('minut').textContent = m + ' min'; O('dnej').textContent = d; O('chas').textContent = dengi(c); O('dolya').textContent = dol + ' %';
    const chasy = z * m / 60 * d * 4.33;
    $('#r-chasy').textContent = chislo(chasy);
    $('#r-ivan').textContent = chislo(chasy * (1 - dol / 100)) + ' h';
    $('#r-mes').textContent = '≈ ' + dengi(chasy * c);
    $('#r-god').textContent = '≈ ' + dengi(chasy * c * 12);
  }
  $$('.kalk input[type=range]').forEach(i => i.addEventListener('input', schet));
  $$('.val').forEach(b => b.addEventListener('click', () => { val = b.dataset.v; $$('.val').forEach(x => x.setAttribute('aria-pressed', x === b)); schet(); }));
  schet();

  // глава 5: фильтр работ
  $$('.vkladka').forEach(b => b.addEventListener('click', () => {
    $$('.vkladka').forEach(x => x.setAttribute('aria-pressed', x === b));
    $$('.rabota').forEach(r => { r.hidden = !(b.dataset.f === 'vse' || r.dataset.st === b.dataset.f); });
  }));

  // форма: проверка на месте, ответ на странице, наружу — ничего
  const f = $('#forma'), itog = $('#itog'), t = f.elements.text;
  $$('.fraza').forEach(b => b.addEventListener('click', () => { t.value = (t.value.trim() ? t.value.trim() + '\n' : '') + b.textContent; t.focus(); }));
  f.addEventListener('submit', e => {
    e.preventDefault();
    const nado = [f.elements.name, f.elements.kontakt, f.elements.soglasie];
    let ploho = false;
    nado.forEach(p => { const net = p.type === 'checkbox' ? !p.checked : !p.value.trim(); p.setAttribute('aria-invalid', net); if (net) ploho = true; });
    $('#oshibka').hidden = !ploho;
    if (ploho) { nado.find(p => p.getAttribute('aria-invalid') === 'true').focus(); return; }
    // поле-ловушка (firma2) решит только отправку, когда форму подключат; сейчас не уходит ничего — ответ видят все
    const was = $$('input[name=was]:checked', f).map(x => x.value).join(', ');
    $('#itog-t').value = [f.elements.name.value, f.elements.kontakt.value, f.elements.website.value, was, t.value].filter(Boolean).join('\n');
    f.hidden = true; itog.hidden = false; itog.focus();
  });
  $('#kop').addEventListener('click', async () => {
    const tx = $('#itog-t');
    try { await navigator.clipboard.writeText(tx.value); } catch (e) { tx.select(); document.execCommand && document.execCommand('copy'); }
    $('#kop').textContent = D.kopiert; setTimeout(() => { $('#kop').textContent = D.kopieren; }, 2000);
  });
  $('#nazad').addEventListener('click', () => { itog.hidden = true; f.hidden = false; f.elements.name.focus(); });
})();
