(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* split hero name into animated characters */
  let n = 0;
  $$("[data-split]").forEach((el) => {
    const em = el.querySelector("em");
    const text = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join("");
    el.textContent = "";
    el.setAttribute("aria-hidden", "true");
    [...text].forEach((c) => {
      const s = document.createElement("span");
      s.className = "ch"; s.style.setProperty("--i", n++); s.textContent = c;
      el.appendChild(s);
    });
    if (em) { const s = document.createElement("span"); s.className = "ch"; s.style.setProperty("--i", n++); s.appendChild(em); el.appendChild(s); }
  });

  /* manifesto: words light up with scroll progress */
  const st = $("#statement");
  const words = st.textContent.trim().split(/\s+/);
  st.innerHTML = words.map((w) => `<span class="w">${w}</span>`).join(" ");
  const ws = $$(".w", st);
  const paint = () => {
    const r = st.getBoundingClientRect();
    const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.3)));
    const k = Math.round(p * ws.length);
    ws.forEach((w, i) => w.classList.toggle("on", i < k));
  };

  /* generic reveal on enter */
  $$(".section-head, .card, .values li, .contact .cta-row").forEach((el, i) => {
    el.setAttribute("data-reveal", ""); el.style.setProperty("--rd", `${(i % 4) * 80}ms`);
  });
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.15 });
  $$("[data-reveal]").forEach((el) => io.observe(el));

  /* scroll spy for the rail */
  const spy = new IntersectionObserver((es) => es.forEach((e) => {
    if (!e.isIntersecting) return;
    $$("[data-spy]").forEach((a) => a.classList.toggle("active", a.dataset.spy === e.target.id));
  }), { rootMargin: "-45% 0px -50% 0px" });
  $$("main section[id]").forEach((s) => spy.observe(s));

  /* spotlight borders follow the pointer */
  $$(".spot").forEach((el) => el.addEventListener("pointermove", (e) => {
    const r = el.getBoundingClientRect();
    el.style.setProperty("--sx", `${e.clientX - r.left}px`);
    el.style.setProperty("--sy", `${e.clientY - r.top}px`);
  }));

  /* touch devices: everything that reaches the middle of the screen plays its hover animation */
  if (!fine) {
    document.documentElement.classList.add("touch");
    const lit = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("lit", e.isIntersecting)), { rootMargin: "-38% 0px -38% 0px" });
    $$(".spot, .values li, .sl-col").forEach((el) => lit.observe(el));
  }

  /* local clock */
  const clock = $("#clock");
  const tick = () => { clock.textContent = new Date().toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "America/La_Paz" }) + " LPB"; };
  tick(); setInterval(tick, 20000);

  /* copy email */
  const copy = $("#copy-mail");
  const copyStatus = $("small", copy);
  let copyTimer;
  copy.setAttribute("aria-label", `Copy email address ${copy.dataset.email}`);
  copyStatus.setAttribute("role", "status");
  copyStatus.setAttribute("aria-live", "polite");
  copy.addEventListener("click", async () => {
    clearTimeout(copyTimer);
    try { await navigator.clipboard.writeText(copy.dataset.email); copyStatus.textContent = "copied ✓"; }
    catch { copyStatus.textContent = "opening mail"; location.href = "mailto:" + copy.dataset.email; }
    copyTimer = setTimeout(() => (copyStatus.textContent = "copy"), 1600);
  });
  $$(".project .link").forEach((l) => l.setAttribute("aria-label", `View ${$("h3", l.closest(".project")).textContent.trim()} on GitHub (opens in a new tab)`));

  /* scroll handlers */
  let tick2 = false;
  addEventListener("scroll", () => { if (tick2) return; tick2 = true; requestAnimationFrame(() => { paint(); tick2 = false; }); }, { passive: true });
  /* process: pinned journey on desktop, in-view animation on mobile */
  const proc = $("#process"), psteps = $$(".pstep"), tbtns = $$(".p-track button"), pfill = $("#pfill");
  const mqM = matchMedia("(max-width: 860px)");
  let curStep = -1;
  const setStep = (i) => {
    if (i === curStep) return; curStep = i;
    psteps.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("past", k < i); });
    tbtns.forEach((b, k) => { b.classList.toggle("on", k === i); b.classList.toggle("done", k < i); });
  };
  const paintProc = () => {
    if (mqM.matches) return;
    const span = proc.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -proc.getBoundingClientRect().top / span));
    pfill.parentElement.style.setProperty("--pp", p.toFixed(3));
    setStep(Math.min(psteps.length - 1, Math.floor(p * psteps.length)));
  };
  tbtns.forEach((b) => b.addEventListener("click", () => {
    const span = proc.offsetHeight - innerHeight;
    scrollTo({ top: proc.offsetTop + ((+b.dataset.go + 0.5) / psteps.length) * span });
  }));
  const procIO = new IntersectionObserver((es) => es.forEach((e) => { if (mqM.matches) e.target.classList.toggle("on", e.isIntersecting); }), { rootMargin: "-20% 0px -20% 0px" });
  psteps.forEach((s) => procIO.observe(s));
  addEventListener("scroll", () => requestAnimationFrame(paintProc), { passive: true });
  addEventListener("resize", () => { curStep = -1; if (mqM.matches) psteps.forEach((s) => s.classList.remove("past")); paintProc(); });
  paintProc();
  addEventListener("resize", paint);
  paint();

  if (!fine || reduced) return;

  /* custom cursor + dot-grid glow */
  document.documentElement.classList.add("custom-cursor");
  const cur = $(".cursor"), dots = $(".dots-glow");
  let x = 0, y = 0, cx = 0, cy = 0, started = false;
  addEventListener("pointermove", (e) => {
    x = e.clientX; y = e.clientY;
    if (!started) { cx = x; cy = y; started = true; }
    cur.classList.add("on");
    dots.style.setProperty("--mx", x + "px"); dots.style.setProperty("--my", y + "px");
  }, { passive: true });
  document.addEventListener("pointerleave", () => cur.classList.remove("on"));
  addEventListener("blur", () => cur.classList.remove("on"));
  (function loop() { cx += (x - cx) * 0.2; cy += (y - cy) * 0.2; cur.style.transform = `translate(${cx}px,${cy}px)`; requestAnimationFrame(loop); })();
  $$("a, button, .card, .project").forEach((el) => {
    el.addEventListener("pointerenter", () => cur.classList.add("big"));
    el.addEventListener("pointerleave", () => cur.classList.remove("big"));
  });

  /* magnetic buttons */
  $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });

  /* card tilt */
  $$("[data-tilt]").forEach((el) => {
    let frame;
    el.addEventListener("pointerenter", () => el.classList.add("is-tilting"));
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => { el.style.transform = `perspective(900px) rotateY(${px * 6}deg) rotateX(${-py * 6}deg) translateY(-3px)`; });
    });
    el.addEventListener("pointerleave", () => { cancelAnimationFrame(frame); el.classList.remove("is-tilting"); el.style.transform = ""; });
  });
})();
