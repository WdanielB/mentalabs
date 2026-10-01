(() => {
  const deck = document.getElementById("deck");
  const all = [...deck.querySelectorAll(".slide")];
  // Las sub-diapositivas (.sub) cuelgan de la diapositiva anterior y no cuentan en el recorrido.
  const slides = all.filter((s) => !s.classList.contains("sub"));
  const subs = slides.map(() => []);
  { let m = -1; all.forEach((s) => { if (s.classList.contains("sub")) subs[m]?.push(s); else m++; }); }
  const bar = document.getElementById("bar");
  const count = document.getElementById("count");
  const notes = document.getElementById("notes");
  const notesBtn = document.getElementById("notesBtn");
  const subBtn = document.getElementById("subBtn");
  let i = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));
  let j = -1; // sub-diapositiva abierta (-1: ninguna)

  // ?estudio: al imprimir se incluyen también las sub-diapositivas.
  if (new URLSearchParams(location.search).has("estudio")) document.documentElement.classList.add("study");

  const fit = () => {
    const s = Math.min(innerWidth / 1600, innerHeight / 900) * 0.96;
    deck.style.transform = `scale(${s})`;
  };

  // Contadores animados (respeta "reducir movimiento").
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fmt = (n) => n.toLocaleString("es-PE").replace(/,/g, " ");
  const runCounters = (slide) => {
    slide.querySelectorAll("[data-count]").forEach((el) => {
      const target = +el.dataset.count;
      if (reduce) { el.textContent = fmt(target); return; }
      const t0 = performance.now(), dur = 1600;
      const tick = (t) => {
        const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
        el.textContent = fmt(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  };

  // Guion con tiempos: cada <aside class="speaker" data-t="segundos"> suma al cronograma.
  const secs = slides.map((s) => +(s.querySelector("aside.speaker")?.dataset.t || 0));
  const total = secs.reduce((a, b) => a + b, 0);
  const until = (n) => secs.slice(0, n + 1).reduce((a, b) => a + b, 0);
  const mmss = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  notes.innerHTML = '<div class="notes-head"><b id="nTitle"></b><span id="nMeta"></span><span class="clock" id="nClock"></span></div><div id="nBody"></div>';
  const nTitle = notes.querySelector("#nTitle"), nMeta = notes.querySelector("#nMeta");
  const nClock = notes.querySelector("#nClock"), nBody = notes.querySelector("#nBody");
  let t0 = null;
  const tickClock = () => {
    if (t0 === null) { nClock.textContent = total ? "T inicia el cronómetro" : ""; return; }
    const el = (Date.now() - t0) / 1000;
    nClock.textContent = `⏱ ${mmss(el)}`;
    nClock.classList.toggle("late", el > until(i));
  };
  setInterval(tickClock, 500);

  const steps = (s) => +s.dataset.steps || 1;
  const cur = () => (j < 0 ? slides[i] : subs[i][j]);

  const paint = () => {
    const c = cur();
    all.forEach((s) => {
      // Reinicia las animaciones cada vez que se entra a una diapositiva.
      if (s === c) { s.classList.remove("active"); void s.offsetWidth; s.classList.add("active"); }
      else s.classList.remove("active");
      s.setAttribute("aria-hidden", s !== c);
    });
    runCounters(c);
    bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    count.textContent = j < 0 ? `${i + 1} / ${slides.length}` : `${i + 1}.${j + 1}`;
    if (subBtn) {
      subBtn.hidden = !subs[i].length;
      subBtn.textContent = j < 0 ? `+ Info ↓ (${subs[i].length})` : "Cerrar ↑";
    }
    const who = slides[i].querySelector("aside.speaker")?.dataset.who;
    const sp = c.querySelector("aside.speaker");
    nTitle.textContent = `${i + 1}${j < 0 ? "" : "." + (j + 1)}. ${c.dataset.title}`;
    nMeta.textContent = secs[i] ? `${secs[i]} s · termina en ${mmss(until(i))} de ${mmss(total)}${who ? " · habla " + who : ""}` : "";
    nBody.innerHTML = sp ? sp.innerHTML : "";
    tickClock();
    history.replaceState(null, "", `#${i + 1}${j < 0 ? "" : "." + (j + 1)}`);
  };

  const show = (n, back) => {
    i = Math.max(0, Math.min(slides.length - 1, n));
    j = -1;
    if (slides[i].dataset.steps) slides[i].dataset.step = back ? steps(slides[i]) : 1;
    paint();
  };
  const next = () => {
    if (t0 === null && total) t0 = Date.now();
    const s = slides[i];
    if (j < 0 && +s.dataset.step < steps(s)) { s.dataset.step = +s.dataset.step + 1; return; }
    if (j >= 0 || i < slides.length - 1) show(i + 1);
  };
  const prev = () => {
    const s = slides[i];
    if (j >= 0) { j = -1; paint(); }
    else if (+s.dataset.step > 1) s.dataset.step = +s.dataset.step - 1;
    else if (i > 0) show(i - 1, true);
  };
  const subDown = () => { if (j < subs[i].length - 1) { j++; paint(); } };
  const subUp = () => { if (j >= 0) { j--; paint(); } };

  const toggleNotes = () => {
    const open = notes.classList.toggle("open");
    notesBtn.setAttribute("aria-pressed", open);
  };

  // ── Compatibilidad con pasadores de diapositivas ──
  // Los pasadores (Logitech R400/R500 y genéricos) envían AvPág/RePág para
  // avanzar, F5/Mayús+F5 y Esc con el botón de "presentar", y "." o "B" con el
  // de pantalla negra. F5 no debe recargar la página.
  const toggleFullscreen = () =>
    document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  const blackout = Object.assign(document.createElement("div"), { id: "blackout" });
  blackout.style.cssText = "position:fixed;inset:0;background:#000;z-index:50;display:none;cursor:none";
  document.body.append(blackout);
  const isBlack = () => blackout.style.display === "block";
  const setBlack = (on) => { blackout.style.display = on ? "block" : "none"; };

  // El cursor se esconde mientras presentas y vuelve al mover el mouse.
  let cursorTimer;
  const wakeCursor = () => {
    document.body.style.cursor = "";
    clearTimeout(cursorTimer);
    cursorTimer = setTimeout(() => { document.body.style.cursor = "none"; }, 2500);
  };
  addEventListener("mousemove", wakeCursor);
  wakeCursor();

  addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    if (e.key === "F5") { e.preventDefault(); toggleFullscreen(); return; }
    if (k === "." || k === "b" || e.key === ">") { e.preventDefault(); setBlack(!isBlack()); return; }
    // Con la pantalla en negro, cualquier tecla solo la vuelve a mostrar.
    if (isBlack()) { e.preventDefault(); setBlack(false); return; }
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); next(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); prev(); }
    else if (e.key === "ArrowDown" || k === "d") { e.preventDefault(); subDown(); }
    else if (e.key === "ArrowUp" || e.key === "Escape") { e.preventDefault(); subUp(); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1, true);
    else if (k === "n") toggleNotes();
    else if (k === "t") { t0 = Date.now(); tickClock(); }
    else if (k === "f") toggleFullscreen();
    else if (k === "p") print();
  });
  document.getElementById("next").onclick = next;
  document.getElementById("prev").onclick = prev;
  notesBtn.onclick = toggleNotes;
  if (subBtn) subBtn.onclick = () => (j < 0 ? subDown() : (j = -1, paint()));

  // Al imprimir, las diapositivas con pasos muestran su estado final.
  addEventListener("beforeprint", () => slides.forEach((s) => { if (s.dataset.steps) s.dataset.step = steps(s); }));

  // Deslizar en tablet o celular.
  let x0 = null;
  addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    x0 = null;
  });

  addEventListener("resize", fit);
  // #7 abre la diapositiva 7; #7.2, su segunda sub-diapositiva.
  const fromHash = () => {
    const [a, b] = location.hash.slice(1).split(".").map((n) => parseInt(n, 10));
    show((a || 1) - 1);
    if (b >= 1 && b <= subs[i].length) { j = b - 1; paint(); }
  };
  addEventListener("hashchange", fromHash);
  setTimeout(() => document.getElementById("help").style.opacity = "0", 6000);
  fit();
  fromHash();
})();
