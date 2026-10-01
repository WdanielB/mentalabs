(() => {
  const deck = document.getElementById("deck");
  const slides = [...deck.querySelectorAll(".slide")];
  const bar = document.getElementById("bar");
  const count = document.getElementById("count");
  const notes = document.getElementById("notes");
  const notesBtn = document.getElementById("notesBtn");
  let i = Math.max(0, Math.min(slides.length - 1, (parseInt(location.hash.slice(1), 10) || 1) - 1));

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

  const show = (n) => {
    i = Math.max(0, Math.min(slides.length - 1, n));
    slides.forEach((s, k) => {
      // Reinicia las animaciones cada vez que se entra a una diapositiva.
      if (k === i) { s.classList.remove("active"); void s.offsetWidth; s.classList.add("active"); }
      else s.classList.remove("active");
      s.setAttribute("aria-hidden", k !== i);
    });
    runCounters(slides[i]);
    bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    count.textContent = `${i + 1} / ${slides.length}`;
    const sp = slides[i].querySelector("aside.speaker");
    notes.innerHTML = `<b>${i + 1}. ${slides[i].dataset.title}</b><br>${sp ? sp.innerHTML : ""}`;
    history.replaceState(null, "", `#${i + 1}`);
  };

  const toggleNotes = () => {
    const open = notes.classList.toggle("open");
    notesBtn.setAttribute("aria-pressed", open);
  };

  addEventListener("keydown", (e) => {
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(e.key)) { e.preventDefault(); show(i + 1); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(e.key)) { e.preventDefault(); show(i - 1); }
    else if (e.key === "Home") show(0);
    else if (e.key === "End") show(slides.length - 1);
    else if (e.key.toLowerCase() === "n") toggleNotes();
    else if (e.key.toLowerCase() === "f") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
    else if (e.key.toLowerCase() === "p") print();
  });
  document.getElementById("next").onclick = () => show(i + 1);
  document.getElementById("prev").onclick = () => show(i - 1);
  notesBtn.onclick = toggleNotes;

  // Deslizar en tablet o celular.
  let x0 = null;
  addEventListener("touchstart", (e) => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", (e) => {
    if (x0 === null) return;
    const dx = e.changedTouches[0].clientX - x0;
    if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    x0 = null;
  });

  addEventListener("resize", fit);
  addEventListener("hashchange", () => show((parseInt(location.hash.slice(1), 10) || 1) - 1));
  setTimeout(() => document.getElementById("help").style.opacity = "0", 6000);
  fit();
  show(i);
})();
