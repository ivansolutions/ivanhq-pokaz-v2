// ivanhq v2 — поведение страницы. Ничего не отправляет в сеть: ни fetch, ни XHR, ни sendBeacon (форма — черновик).
(() => {
  'use strict';
  window.IVAN_APP = true;   // страховка заставки в head: app.js загрузился — снимать заставку не нужно
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

  // 19-10 №8: одна глава — одно окно. Высоты плашки черновика и шапки — по факту (при запуске плашку уберут):
  // --verh — сколько над первым экраном, --shapka-v — под чем встаёт глава при переходе из меню
  const verh = () => {
    const pl = $('.chernovik'), sh = shapka ? shapka.offsetHeight : 0, st = document.documentElement.style;
    st.setProperty('--verh', (pl && pl.isConnected ? pl.offsetHeight : 0) + sh + 'px');
    if (sh) st.setProperty('--shapka-v', sh + 'px');
  };
  verh(); addEventListener('resize', verh);
  if ('ResizeObserver' in window) new ResizeObserver(verh).observe(document.body);

  // переключатель темы (дополнение 18-10 №2): светлая ↔ синяя, выбор — в localStorage «ivan-tema» (без персональных данных)
  const tema = $('#tema');
  const htmT = document.documentElement;
  const pokazTemy = () => { const sin = htmT.getAttribute('data-tema') === 'sinyaya'; tema.setAttribute('aria-pressed', String(sin)); tema.setAttribute('aria-label', sin ? tema.dataset.svetlaya : tema.dataset.temnaya); tema.title = tema.getAttribute('aria-label'); };
  if (tema) {
    pokazTemy();
    tema.addEventListener('click', () => {
      const sin = htmT.getAttribute('data-tema') !== 'sinyaya';
      htmT.classList.add('tema-menyaetsya');
      if (sin) htmT.setAttribute('data-tema', 'sinyaya'); else htmT.removeAttribute('data-tema');
      try { localStorage.setItem('ivan-tema', sin ? 'sinyaya' : 'svetlaya'); } catch (e) {}
      pokazTemy(); dispatchEvent(new Event('ivan-tema'));
      setTimeout(() => htmT.classList.remove('tema-menyaetsya'), 400);
    });
  }

  if (!D) return;   // правовая страница: дальше только главная

  // Переход из заставки (задача 18-10): заставка кончается на IVAN с расшифровкой — этот же знак из шапки целиком уменьшается
  // и улетает в шапку, 1,2 с. Геометрия надписи в кадре 1920×1080 снята с последнего кадра ролика: IVAN — x 593…1312,
  // y 412…552. Совмещаются буквы знака с буквами кадра. «Меньше движения» — только затухание (заставки тогда нет вовсе).
  const DLIT = 1200, VOLNA = 1300;
  function perehod(rolik) {
    const cel = $('#znak'), bukvy = cel && $('.znak-b', cel); if (!bukvy) return 0;
    if (tiho) { const t = document.createElement('div'); t.className = 'temnyj-sloj'; document.body.appendChild(t);
      t.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 400, fill: 'both' }).finished.then(() => t.remove()); return 400; }
    const r = rolik.getBoundingClientRect(), cover = getComputedStyle(rolik).objectFit !== 'contain';
    const m = (cover ? Math.max : Math.min)(r.width / 1920, r.height / 1080);
    const ox = r.left + (r.width - 1920 * m) / 2, oy = r.top + (r.height - 1080 * m) / 2;
    const sloj = document.createElement('div'); sloj.className = 'perehod'; sloj.setAttribute('aria-hidden', 'true');
    document.body.appendChild(sloj);
    const t = cel.getBoundingClientRect(), b = bukvy.getBoundingClientRect();
    const kopiya = cel.cloneNode(true); kopiya.removeAttribute('id'); kopiya.removeAttribute('href'); kopiya.className = 'znak perehod-znak';
    Object.assign(kopiya.style, { left: t.left + 'px', top: t.top + 'px', width: t.width + 'px', height: t.height + 'px' });
    sloj.appendChild(kopiya);
    const k = (1312 - 593) * m / b.width;
    // центр букв знака → центр букв в кадре; масштаб — от левого верхнего угла знака
    const bx = b.left - t.left + b.width / 2, by = b.top - t.top + b.height / 2;
    const dx = (593 + 1312) / 2 * m + ox - (t.left + bx * k), dy = (412 + 552) / 2 * m + oy - (t.top + by * k);
    const anim = kopiya.animate([{ transform: `translate(${dx}px, ${dy}px) scale(${k})` }, { transform: 'none' }],
                                { duration: DLIT, easing: 'cubic-bezier(.65, 0, .35, 1)', fill: 'both' });
    // слова у знака в шапке крупнее, чем строка в кадре: проявляются по ходу, чтобы не стоять двумя строками поверх ролика
    const slova = $('.znak-s', kopiya);
    if (slova) slova.animate([{ opacity: 0 }, { opacity: 0, offset: 0.45 }, { opacity: 1 }], { duration: DLIT, fill: 'both' });
    htm.classList.add('perehod-idyot');
    // тёмный слой под заставкой: пока знак летит, сайт ещё тёмный; знак встал — от него расходится свет (слово владельца 18-10)
    const temn = document.createElement('div'); temn.className = 'temnyj-sloj'; temn.setAttribute('aria-hidden', 'true');
    document.body.appendChild(temn);
    const svet = () => {
      htm.classList.remove('perehod-idyot'); sloj.remove();
      if (htm.getAttribute('data-tema') === 'sinyaya') { temn.remove(); return; }   // выбрана синяя — сайт остаётся синим
      const z = $('.znak-b', cel).getBoundingClientRect(), x = z.left + z.width / 2, y = z.top + z.height / 2;
      const R = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y)) + 160, t0 = performance.now();
      const shag = t => {
        const k = Math.min(1, (t - t0) / VOLNA), r = R * (1 - Math.pow(1 - k, 3));          // волна быстро расходится и мягко дотягивает
        const m = `radial-gradient(circle at ${x}px ${y}px, transparent ${r}px, #000 ${r + 140}px)`;
        temn.style.webkitMaskImage = m; temn.style.maskImage = m;
        if (k < 1) requestAnimationFrame(shag); else temn.remove();
      };
      requestAnimationFrame(shag);
    };
    anim.finished.then(svet, svet);
    return DLIT + VOLNA;
  }

  // интро IVAN (синий вариант): один раз за визит, звук выключен, «Пропустить» и Esc, плавный уход к первому экрану.
  // Класс intro-idyot ставит скрипт в head; без него (второй заход, «меньше движения», нет JS) интро нет вовсе.
  const htm = document.documentElement;
  const introKonec = new Promise(gotovo => {
    const intro = $('#intro'), rolik = $('#intro-rolik');
    if (!intro || !htm.classList.contains('intro-idyot')) return gotovo();
    const hod = $('#intro-hod'), zvuk = $('#intro-zvuk'), tajmery = [];
    let idyot = true;
    const konec = () => {
      if (!idyot) return; idyot = false;
      tajmery.forEach(clearTimeout);
      try { sessionStorage.setItem('ivan-intro', '1'); } catch (e) {}
      document.body.style.overflow = '';
      const posle = () => { htm.classList.remove('intro-idyot'); intro.classList.remove('gasnet'); try { rolik.pause(); } catch (e) {} };
      let dlit = 0;
      try { dlit = perehod(rolik); } catch (e) { dlit = 0; }      // переход — украшение: сбой не держит человека на заставке
      intro.classList.add('gasnet');
      setTimeout(gotovo, dlit);
      setTimeout(posle, Math.max(900, dlit));
    };
    document.body.style.overflow = 'hidden';
    rolik.src = rolik.dataset.src; rolik.muted = true;
    let poshel = false;
    rolik.addEventListener('playing', () => { poshel = true; });
    rolik.addEventListener('ended', konec);
    rolik.addEventListener('error', konec);
    rolik.addEventListener('timeupdate', () => { if (rolik.duration) hod.style.transform = `scaleX(${Math.min(1, rolik.currentTime / rolik.duration)})`; });
    $('#intro-mimo').addEventListener('click', konec);
    zvuk.addEventListener('click', () => {
      rolik.muted = !rolik.muted;
      zvuk.setAttribute('aria-pressed', String(!rolik.muted));
      zvuk.textContent = rolik.muted ? D.intro.zvuk_vykl : D.intro.zvuk_vkl;
    });
    addEventListener('keydown', e => { if (idyot && e.key === 'Escape') { e.preventDefault(); konec(); } });
    // в фоновой вкладке заставка не «сгорает»: ролик и часы-страховки стартуют, только когда вкладку открыли
    const start = () => {
      const igraet = rolik.play();
      if (igraet && igraet.catch) igraet.catch(() => tajmery.push(setTimeout(konec, 1200)));
      tajmery.push(setTimeout(() => { if (!poshel) konec(); }, 4000));   // ролик не пошёл — не держим человека
      tajmery.push(setTimeout(konec, 12000));                               // ролик 8 с; страховка
    };
    if (document.hidden) { const vid = () => { if (!document.hidden) { removeEventListener('visibilitychange', vid); start(); } }; addEventListener('visibilitychange', vid); }
    else start();
    try { $('#intro-mimo').focus({ preventScroll: true }); } catch (e) {}
  });

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
    // 18-10: две темы — светлая (основа, палитра белого v2.1) и синяя (дополнение №2); экран телефона светлый в обеих
    const OBSHCHEE = { korpus: '#1C3358', ekran: '#FFFFFF', chern: '#14171C', et2: '#4B515B', elin: '#EEECE6', avatar: '#EEF3FA', ok: '#1A7F45', klient: '#EFEEEA' };
    const TEMY = { svetlaya: { fon: '#F6F5F1', tekst: '#14171C', t2: '#4B515B', lin: '#D9D6CD', akc: '#1E56D6', naAkc: '#FFFFFF', akcS: '#E6EDFC' },
                   sinyaya: { fon: '#081427', tekst: '#F6FAFF', t2: '#B4C4DA', lin: '#2E4A74', akc: '#8FD0FF', naAkc: '#061226', akcS: '#E3F2FF' } };
    const C = {};
    const palitra = () => Object.assign(C, OBSHCHEE, TEMY[htm.getAttribute('data-tema') === 'sinyaya' ? 'sinyaya' : 'svetlaya']);
    palitra();
    addEventListener('ivan-tema', () => { palitra(); if (!raf) kadr(99); });
    const shr = (v, r) => `${v} ${r}px Manrope, system-ui, sans-serif`;
    let t0 = 0, raf = 0;
    const POKAZ = [0.4, 1.5, 2.6, 3.7], RELS = [0.9, 2.0, 3.1, 4.2], KONEC = 4.9;
    function rr(x, y, w, h, r) { cx.beginPath(); cx.moveTo(x + r, y); cx.arcTo(x + w, y, x + w, y + h, r); cx.arcTo(x + w, y + h, x, y + h, r); cx.arcTo(x, y + h, x, y, r); cx.arcTo(x, y, x + w, y, r); cx.closePath(); }
    function stroki(t, max) { const out = []; let s = ''; for (const w of t.split(' ')) { const p = s ? s + ' ' + w : w; if (cx.measureText(p).width > max && s) { out.push(s); s = w; } else s = p; } if (s) out.push(s); return out; }
    // раскладка подписи кружка: термин и строки смысла. ПК — справа от кружка, по центру блока; телефон — под кружком (от cyr).
    function podpisi(i, ryad, W, cxr, tw = 290) {
      cx.font = shr(650, ryad ? 12 : 14);
      // 19-10 №10: на телефоне — сетка 2×2, подпись справа от кружка (в ряд по четыре длинные термины слипались)
      const A = ryad ? stroki(H.schritte[i], tw / 2 - 40 - 4) : stroki(H.schritte[i], W - (cxr + 32) - 4);
      if (ryad) return { stroki: A, yTermina: -12, yStrok: 4 };
      const cyr = 20 + 140 + i * 78, vys = 14 + A.length * 18, verh = cyr - vys / 2;
      return { stroki: A, yTermina: verh + 10, yStrok: verh + 14 + 14 };
    }
    // 19-10 №8: на ПК сцена уменьшается целиком под место в первом экране (раскладка канвы — по-прежнему 560×560)
    const mesto = cv.parentElement, masshtab = () => {
      const k = Math.min(1, mesto.clientHeight / 560, mesto.clientWidth / 560);
      mesto.style.setProperty('--scena-k', k > 0 ? k.toFixed(3) : 1);
    };
    masshtab(); if ('ResizeObserver' in window) new ResizeObserver(masshtab).observe(mesto);
    function kadr(sek) {
      const W = cv.clientWidth, Hh = cv.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(Hh * dpr); }
      cx.setTransform(dpr, 0, 0, dpr, 0, 0); cx.clearRect(0, 0, W, Hh);
      const ryad = W < 480;                       // телефон: рельс строкой под телефоном
      const tw = ryad ? Math.min(290, W - 48) : 290, th = ryad ? Hh - 170 : 500;
      const tx = ryad ? (W - tw) / 2 : 40, ty = 20;
      // корпус
      cx.save(); cx.shadowColor = 'rgba(2,6,14,.55)'; cx.shadowBlur = 24; cx.shadowOffsetY = 10;
      rr(tx, ty, tw, th, 44); cx.fillStyle = C.korpus; cx.fill(); cx.restore();
      rr(tx + 10, ty + 10, tw - 20, th - 20, 35); cx.fillStyle = C.ekran; cx.fill();
      // шапка чата
      const ix = tx + 26, iy = ty + 30;
      cx.fillStyle = C.avatar; cx.beginPath(); cx.arc(ix + 18, iy + 18, 18, 0, 7); cx.fill();
      cx.fillStyle = C.chern; cx.font = shr(800, 15); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText(H.salon.trim()[0] || 'S', ix + 18, iy + 19);
      cx.textAlign = 'left'; cx.textBaseline = 'alphabetic';
      cx.font = shr(700, 14); cx.fillText(H.salon, ix + 46, iy + 15);
      cx.fillStyle = C.ok; cx.font = shr(500, 12); cx.fillText(H.online, ix + 46, iy + 33);
      cx.fillStyle = C.elin; cx.fillRect(tx + 10, iy + 50, tw - 20, 1);
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
      cx.fillStyle = C.et2; cx.font = shr(500, 12); cx.textAlign = 'center'; cx.fillText(H.beispiel, tx + tw / 2, ty + th - 22); cx.textAlign = 'left';
      // рельс I · V · A · N
      const n = 4;
      for (let i = 0; i < n; i++) {
        const gor = sek >= RELS[i];
        const [cxr, cyr] = ryad ? [tx + (i % 2) * tw / 2 + 18, ty + th + 38 + Math.floor(i / 2) * 68] : [tx + tw + 48, ty + 140 + i * 78];
        cx.beginPath(); cx.arc(cxr, cyr, ryad ? 17 : 22, 0, 7); cx.fillStyle = gor ? C.akc : C.fon; cx.fill();
        cx.lineWidth = 2; cx.strokeStyle = gor ? C.akc : C.lin; cx.stroke();
        cx.fillStyle = gor ? C.naAkc : C.tekst; cx.font = shr(800, 17); cx.textAlign = 'center'; cx.textBaseline = 'middle'; cx.fillText('IVAN'[i], cxr, cyr + 1);
        cx.textBaseline = 'alphabetic';
        const L = podpisi(i, ryad, W, cxr, tw);
        cx.textAlign = 'left';
        const tx2 = ryad ? cxr + 26 : cxr + 32;
        cx.fillStyle = C.akc; cx.font = shr(750, ryad ? 10 : 11); try { cx.letterSpacing = '0.06em'; } catch (e) {}
        // термины теперь на языке страницы и бывают длинными («BENACHRICHTIGUNG»): не шире места — иначе уменьшить
        const termin = D.termy[i].toUpperCase(), mesto = ryad ? tw / 2 - 40 - 4 : W - (cxr + 32) - 4, shir = cx.measureText(termin).width;
        if (shir > mesto) cx.font = shr(750, Math.max(8, Math.floor((ryad ? 10 : 11) * mesto / shir * 10) / 10));
        cx.fillText(termin, tx2, (ryad ? cyr : 0) + L.yTermina);
        try { cx.letterSpacing = '0px'; } catch (e) {}
        cx.fillStyle = gor ? C.tekst : C.t2; cx.font = shr(650, ryad ? 12 : 14);
        L.stroki.forEach((s, j) => cx.fillText(s, tx2, (ryad ? cyr : 0) + L.yStrok + j * (ryad ? 15 : 18)));
      }
    }
    function igrat(ts) { if (!t0) t0 = ts; const sek = (ts - t0) / 1000; kadr(sek); if (sek < KONEC) raf = requestAnimationFrame(igrat); else { raf = 0; cv.setAttribute('aria-busy', 'false'); } }
    const zapusk = () => { cancelAnimationFrame(raf); t0 = 0; if (tiho) { kadr(99); cv.setAttribute('aria-busy', 'false'); } else { cv.setAttribute('aria-busy', 'true'); raf = requestAnimationFrame(igrat); } };
    (document.fonts ? document.fonts.ready : Promise.resolve()).then(() => { if (!raf) kadr(0); });
    Promise.all([document.fonts ? document.fonts.ready : null, introKonec]).then(zapusk);
    $('#snova').addEventListener('click', zapusk);
    addEventListener('resize', () => { if (!raf) kadr(99); });
  }

  // живые цифры внизу первого экрана (как у Cuma Gün): бегут от 0 до значения ≈1,2 с один раз, когда полоса видна и заставка
  // кончилась. В HTML стоят итоговые числа — без JS и при «меньше движения» они просто стоят.
  const polosa = $('#schet');
  if (polosa && !tiho && 'IntersectionObserver' in window) {
    const chisla = $$('b[data-do]', polosa);
    const begi = () => {
      const t0 = performance.now();
      const shag = t => { const k = Math.min(1, (t - t0) / 1200), e = 1 - Math.pow(1 - k, 3);
        chisla.forEach(b => { b.textContent = Math.round(+b.dataset.do * e) + (k === 1 ? b.dataset.hvost : ''); });
        if (k < 1) requestAnimationFrame(shag); };
      requestAnimationFrame(shag);
    };
    chisla.forEach(b => { b.textContent = '0'; });
    introKonec.then(() => {
      const io = new IntersectionObserver(z => { if (z.some(x => x.isIntersecting)) { io.disconnect(); begi(); } }, { threshold: 0 });   // 18-10 №3: на низком окне полоса видна краем — счёт идёт сразу, нулей человек не видит
      io.observe(polosa);
    });
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
  const ZH = K.zhurnal;   // журнал примера — простыми словами на языке страницы (texte/*.json)
  const ol = $('#uzly'), znak = $('#znak');
  // эффект «а»: линия между кружками заполняется шаг за шагом; «б»: в знаке IVAN подсвечена буква текущего шага
  const liniya = z => ol.style.setProperty('--z', z);
  const bukva = i => { if (znak) { if (i === null) delete znak.dataset.shag; else znak.dataset.shag = i; } };
  let sl = 0, idyot = 0;
  $$('.sluchaj').forEach(b => b.addEventListener('click', () => {
    sl = +b.dataset.s; $$('.sluchaj').forEach(x => x.setAttribute('aria-pressed', x === b)); pusk();   // клик по случаю — сразу запуск
  }));
  function sbros() { idyot++; uzly.forEach(u => u.classList.remove('gor', 'stop', 'gas')); ol.classList.remove('obryv'); liniya(0); bukva(null); zh.textContent = ''; tg.hidden = true; shag.innerHTML = '&nbsp;'; }
  async function pusk() {
    sbros(); const moj = idyot;
    for (let i = 0; i < 4; i++) {
      await zhdat(i ? 900 : 150); if (moj !== idyot) return;
      const stop = sl === 3 && i === 1;
      uzly[i].classList.add(stop ? 'stop' : 'gor'); liniya(i / 3); bukva(i);
      shag.textContent = `${K.schritt} ${i + 1} ${K.von} 4 · ${K.buchstaben[i]}: ${K.texte[sl][i]}`;
      const st = document.createElement('span'); st.className = ZH[sl][i].startsWith('✓') ? 'ok' : ZH[sl][i].startsWith('✕') ? 'st' : '';
      st.textContent = ZH[sl][i] + '\n'; zh.appendChild(st);
      if (stop) { ol.classList.add('obryv'); uzly[2].classList.add('gas');   // линия обрывается на проверке, «A» гаснет: ничего не проводится
        await zhdat(900); if (moj !== idyot) return; bukva(3); shag.textContent = `${K.schritt} 4 ${K.von} 4 · ${K.buchstaben[3]}: ${K.texte[sl][3]}`; zh.appendChild(Object.assign(document.createElement('span'), { textContent: ZH[sl][3] + '\n', className: 'ok' })); uzly[3].classList.add('gor'); break; }
    }
    $('#tg-t').textContent = K.telegram[sl]; tg.hidden = false;
    await zhdat(1600); if (moj === idyot) bukva(null);
  }
  $('#pusk').addEventListener('click', pusk);
  // один показ, когда глава впервые видна — чтобы она не стояла пустой; дальше только по кнопке
  if ('IntersectionObserver' in window) { const io2 = new IntersectionObserver(z => { if (z[0].isIntersecting) { io2.disconnect(); pusk(); } }, { threshold: .4 }); io2.observe($('#uzly')); }

  // 19-10 №11 п. 3: содержимое глав при первом показе мягко проявляется — один раз. Прячется только то, что при загрузке
  // ниже окна (видимое сразу не мигает); «меньше движения» и браузер без IntersectionObserver — без проявления.
  if (!tiho && 'IntersectionObserver' in window) {
    const io5 = new IntersectionObserver(z => z.forEach(x => { if (x.isIntersecting) { x.target.classList.add('vidno'); io5.unobserve(x.target); } }), { rootMargin: '0px 0px -6% 0px' });
    $$('main section:not(#geroj) .ramka > *').forEach(el => { if (el.getBoundingClientRect().top > innerHeight) { el.classList.add('poyav'); io5.observe(el); } });
  }

  // глава 5: шаблоны по нишам — крупный снимок в диалоге, не уходя со страницы. Без JS ссылка открывает сам снимок.
  // Esc и «Закрыть» закрывают, щелчок мимо снимка — тоже; фокус возвращается на карточку, с которой открыли.
  const lupa = $('#lupa');
  if (lupa && lupa.showModal) {
    const vse = $$('.otkr-cuma, .shablon'), img = $('#lupa-img'), skrol = $('#lupa-skrol');   // 19-10 №11 п. 6: Cuma — в том же окне
    let otkuda = null, tek = 0;
    // показать шаблон n: старый снимок сбрасывается сразу, новый появляется, когда загрузился (не старый под новым названием)
    const pokazat = n => {
      tek = (n + vse.length) % vse.length; const a = vse[tek];
      img.removeAttribute('src'); img.classList.add('gruzitsya');
      img.onload = () => img.classList.remove('gruzitsya');
      img.src = a.dataset.cel || a.getAttribute('href'); $('#lupa-n').textContent = a.dataset.n; skrol.scrollTop = 0;
      $('#lupa-pr').hidden = a.classList.contains('otkr-cuma');   // «имена и цифры — примеры» — у шаблонов, не у сайта клиента
    };
    vse.forEach((a, n) => a.addEventListener('click', ev => {
      ev.preventDefault(); otkuda = a; pokazat(n);
      lupa.showModal(); $('#lupa-x').focus();
    }));
    $('#lupa-nazad').addEventListener('click', () => pokazat(tek - 1));
    $('#lupa-dalshe').addEventListener('click', () => pokazat(tek + 1));
    lupa.addEventListener('keydown', ev => { if (ev.key === 'ArrowLeft') { ev.preventDefault(); pokazat(tek - 1); } else if (ev.key === 'ArrowRight') { ev.preventDefault(); pokazat(tek + 1); } });
    $('#lupa-x').addEventListener('click', () => lupa.close());
    lupa.addEventListener('click', ev => { if (ev.target === lupa) lupa.close(); });
    // лента шаблонов: кнопки ← → листают на ширину видимого, у краёв гаснут; пальцем и колесом — как обычно
    const lenta = $('#lenta-sp');
    if (lenta) {
      const [kl, kp] = [$('.lenta-l'), $('.lenta-p')];
      const kraya = () => { const est = lenta.scrollWidth > lenta.clientWidth + 2; kl.hidden = kp.hidden = !est;
        kl.disabled = lenta.scrollLeft < 6; kp.disabled = lenta.scrollLeft + lenta.clientWidth > lenta.scrollWidth - 6; };
      kl.addEventListener('click', () => lenta.scrollBy({ left: -lenta.clientWidth * .8, behavior: tiho ? 'auto' : 'smooth' }));
      kp.addEventListener('click', () => lenta.scrollBy({ left: lenta.clientWidth * .8, behavior: tiho ? 'auto' : 'smooth' }));
      lenta.addEventListener('scroll', kraya, { passive: true }); addEventListener('resize', kraya); kraya();
    }
    // фокус возвращается на карточку того шаблона, что был открыт последним (если она в свёрнутом — на ту, с которой открыли)
    lupa.addEventListener('close', () => { const k = vse[tek]; (k && k.checkVisibility && k.checkVisibility() ? k : otkuda)?.focus(); });
  }

  // эффект «в»: длинный снимок шаблона медленно проезжает внутри карточки — при наведении (ПК) или при появлении (телефон).
  // Длинный снимок грузится только тогда — первая загрузка страницы не тяжелеет. «Меньше движения» — без проезда.
  if (!tiho) {
    const dl = a => { const i = $('img[data-dl]', a); if (i && !i.dataset.dlOk) { i.dataset.dlOk = '1'; const n = new Image(); n.onload = () => { i.src = i.dataset.dl; a.classList.add('dlinnyj'); }; n.src = i.dataset.dl; } };
    const naveshivaetsya = matchMedia('(hover: hover)').matches;
    $$('.shablon').forEach(a => {
      if (naveshivaetsya) { a.addEventListener('mouseenter', () => dl(a)); a.addEventListener('focus', () => dl(a)); }
    });
    if (!naveshivaetsya && 'IntersectionObserver' in window) {
      const io4 = new IntersectionObserver(z => z.forEach(x => { if (x.isIntersecting) { dl(x.target); x.target.classList.add('edet'); io4.unobserve(x.target); } }), { threshold: .7 });
      $$('.shablon').forEach(a => io4.observe(a));
    }
  }

  // 20-10 №12: эффекты заметные. Телефон (< 768) и «меньше движения» — без пятна и без самоходной ленты; заголовки — просто видны.
  const shiroko = matchMedia('(min-width: 768px)').matches, mysh = matchMedia('(hover: hover) and (pointer: fine)').matches;
  // п. 1 · свет из логотипа: пятно идёт за курсором с запаздыванием (12 % пути за 1/60 с); курсор ушёл — возвращается к сцене IVAN
  // и дышит (в тёмных главах — к заголовку, без дыхания: одна вечная анимация на странице, не три). Двигается только transform, кадры — пока пятно не догнало цель.
  if (!tiho && shiroko) {
    $$('#geroj, .glava-temn, .forma-gl').forEach(sek => {
      const sloj = document.createElement('div'), p = document.createElement('div');
      sloj.className = 'svet-sloj'; sloj.setAttribute('aria-hidden', 'true'); p.className = 'svet-pyatno'; sloj.appendChild(p);
      const dysh = sek.id === 'geroj';   // дышит только у сцены IVAN; в тёмных главах без курсора — стоит у заголовка
      sek.classList.add('svet'); if (dysh) sek.classList.add('dyshit'); sek.prepend(sloj);
      const doma = () => { const z = sek.id === 'geroj' ? $('#scena') : $('h2', sek), r = (z || sek).getBoundingClientRect(), s = sek.getBoundingClientRect();
        return [r.left - s.left + r.width / 2, r.top - s.top + r.height / 2]; };
      let [x, y] = doma(), [cx, cy] = [x, y], raf = 0, nad = false, pred = 0;
      const stavit = () => { p.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`; };
      // догоняет по времени, не по кадрам: 12 % пути за 1/60 с — и на медленной машине пятно не вязнет (proba-vid12 под нагрузкой: отстало на 77 px)
      const shag = t => { const d = 1 - Math.pow(.88, Math.min(t - (pred || t - 16.7), 100) / 16.7); pred = t;
        x += (cx - x) * d; y += (cy - y) * d; stavit(); raf = Math.abs(cx - x) + Math.abs(cy - y) > .5 ? requestAnimationFrame(shag) : (pred = 0); };
      const k = () => { if (!raf) raf = requestAnimationFrame(shag); };
      stavit();
      if (mysh) {
        sek.addEventListener('pointermove', e => { const s = sek.getBoundingClientRect(); cx = e.clientX - s.left; cy = e.clientY - s.top;
          if (!nad) { nad = true; sek.classList.remove('dyshit'); } k(); }, { passive: true });
        sek.addEventListener('pointerleave', () => { nad = false; [cx, cy] = doma(); if (dysh) sek.classList.add('dyshit'); k(); });
      }
      addEventListener('resize', () => { if (!nad) { [cx, cy] = doma(); k(); } });
      addEventListener('load', () => { if (!nad) { [cx, cy] = doma(); k(); } });   // шрифты и сцена могли сдвинуть место «дома»
    });
  }
  // п. 2 · заголовки глав — по словам. Читалка экрана слышит заголовок целиком (aria-label), слова-кусочки ей не видны.
  $$('main section:not(#geroj) h2').forEach(h => {
    const t = h.textContent.trim().replace(/\s+/g, ' '), slova = t.split(' ');
    h.setAttribute('aria-label', t); h.textContent = '';
    slova.forEach((w, i) => { if (i) h.append(' '); const s = document.createElement('span'); s.className = 'slovo'; s.setAttribute('aria-hidden', 'true');
      s.style.setProperty('--i', i); s.textContent = w; h.append(s); });
    h.style.setProperty('--n', slova.length); h.classList.add('zagl-slova');
  });
  if (!tiho && shiroko && 'IntersectionObserver' in window) {
    const io6 = new IntersectionObserver(z => z.forEach(x => { if (x.isIntersecting) { io6.unobserve(x.target); x.target.classList.remove('zhdyot'); } }), { rootMargin: '0px 0px -10% 0px' });
    $$('.zagl-slova').forEach(h => { if (h.getBoundingClientRect().top > innerHeight) { h.classList.add('zhdyot', 'idyot'); io6.observe(h); } });
  }
  // п. 3 · лента шаблонов едет сама: до конца, пауза, обратно (круг туда-обратно ≈ 30 с) — без копий карточек (их 15, и читалке
  // экрана повторы не нужны). Стоит, пока над ней мышь, фокус или палец; после касания едет через 4 с, после колеса и ← → — через 3 с.
  const lentaS = $('#lenta-sp');
  if (lentaS && !tiho && shiroko && 'IntersectionObserver' in window) {
    const obr = lentaS.closest('.lenta') || lentaS, KRUG = 30000;
    let pos = lentaS.scrollLeft, napr = 1, stoit = false, pauza = 0, vidna = false, raf = 0, pred = 0;
    const kadr = t => {
      raf = 0; if (!vidna) return;
      const dt = pred ? Math.min(t - pred, 64) : 16, put = lentaS.scrollWidth - lentaS.clientWidth; pred = t;
      if (!stoit && put > 4 && t > pauza) {
        if (Math.abs(lentaS.scrollLeft - pos) > 3) pos = lentaS.scrollLeft;   // листали рукой — едем оттуда
        pos += napr * put * 2 / KRUG * dt;
        if (pos >= put) { pos = put; napr = -1; pauza = t + 1500; } else if (pos <= 0) { pos = 0; napr = 1; pauza = t + 1500; }
        lentaS.classList.add('edet-sama'); lentaS.scrollLeft = pos;
      }
      raf = requestAnimationFrame(kadr);
    };
    const stop = () => { stoit = true; lentaS.classList.remove('edet-sama'); };
    const dalshe = ms => { stoit = false; pauza = performance.now() + ms; pos = lentaS.scrollLeft; };
    obr.addEventListener('mouseenter', stop); obr.addEventListener('mouseleave', () => dalshe(600));
    obr.addEventListener('focusin', stop); obr.addEventListener('focusout', () => dalshe(600));
    lentaS.addEventListener('touchstart', stop, { passive: true }); lentaS.addEventListener('touchend', () => dalshe(4000), { passive: true });
    lentaS.addEventListener('wheel', () => { pauza = performance.now() + 3000; }, { passive: true });
    // лента сама вывозит карточки на виду — их миниатюры грузятся сразу, как только лента видна (иначе ленивая загрузка
    // не всегда успевала: proba-raboty 2560 — 2 раза из 3 friseur-de-mal.jpg не загрузился)
    new IntersectionObserver(z => { vidna = z[0].isIntersecting;
      if (vidna) $$('img[loading=lazy]', lentaS).forEach(i => { i.loading = 'eager'; });
      if (vidna && !raf) { pred = 0; raf = requestAnimationFrame(kadr); } }).observe(lentaS);
  }

  // смена языка — тот же раздел: к ссылке языка дописывается якорь раздела, который сейчас на экране
  $$('.yazyki a[hreflang]').forEach(a => a.addEventListener('click', () => {
    if (a.getAttribute('aria-current')) return;
    const r = $$('main section[id]').find(x => { const b = x.getBoundingClientRect(); return b.top <= innerHeight * .4 && b.bottom > innerHeight * .4; });
    if (r) a.href = a.getAttribute('href').split('#')[0] + '#' + r.id;
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
