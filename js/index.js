/* ==========================================================================
   Inicio — físicas del gafete y parallax de tarjetas flotantes.
   (El dock vive en js/shared.js porque aparece en todas las páginas.)
   ========================================================================== */

/* ---------- 1) Gafete con físicas de resorte reales ----------
   En vez de una transición CSS, se integra un resorte amortiguado en
   requestAnimationFrame usando la velocidad real del arrastre, de modo
   que el gafete conserva la inercia de tu mano al soltarlo y oscila
   como un péndulo antes de asentarse.

   ⚙️ AJUSTES DE LA FÍSICA:
   - STIFFNESS: rigidez del resorte. Más alto = regresa más rápido.
   - DAMPING: fricción. Más bajo = oscila más veces antes de parar.
   - FOLLOW: qué tan pegado sigue el gafete a tu mano (1 = instantáneo).
   - SWING: cuánto se inclina el gafete con la velocidad horizontal. */

(function initBadge() {
  const scene = document.getElementById("badgeScene");
  const badge = document.getElementById("badge");
  const lanyard = document.getElementById("lanyard");
  const hint = document.querySelector(".badge-hint");
  if (!badge || !lanyard) return;

  /* El cordón nace fuera de la pantalla: su largo en reposo se calcula para
     que el punto de anclaje quede siempre por encima del viewport y no se
     vea de dónde cuelga el gafete. */
  let REST_LANYARD = 350;   // largo del cordón en reposo (px) — se recalcula abajo
  const MIN_STRETCH = 15;   // evita que el cordón colapse al jalar hacia arriba

  function layoutCord() {
    const sceneRect = scene.getBoundingClientRect();
    const badgeRect = badge.getBoundingClientRect();
    const scale = sceneRect.height / scene.offsetHeight || 1; // la escena se escala en móvil
    const badgeTopLocal = (badgeRect.top - sceneRect.top - y * scale) / scale;
    REST_LANYARD = Math.max(300, (badgeRect.top - y * scale + 120) / scale);
    lanyard.style.top = `${badgeTopLocal - REST_LANYARD}px`;
    lanyard.style.height = `${REST_LANYARD}px`;
    const text = lanyard.querySelector(".lanyard-text");
    if (text) text.textContent = "VALDEV • ".repeat(Math.max(4, Math.ceil(REST_LANYARD / 68)));
  }

  const STIFFNESS = 130;    // rigidez del resorte (1/s²)
  const DAMPING = 7;        // amortiguación (1/s) — subamortiguado: rebota
  const FOLLOW = 0.38;      // suavizado del arrastre (sensación de peso)
  const SWING = 0.045;      // inclinación por velocidad horizontal (deg por px/s)
  const MAX_SWING = 16;     // inclinación máxima (deg)

  let mode = "idle";        // idle | drag | spring
  let x = 0, y = 0;         // posición actual del gafete (offset desde reposo)
  let vx = 0, vy = 0;       // velocidad (px/s)
  let tx = 0, ty = 0;       // posición del puntero (objetivo durante drag)
  let grabX = 0, grabY = 0; // dónde se agarró
  let lastT = 0;
  let rafId = null;

  layoutCord();
  addEventListener("resize", () => { if (mode === "idle") layoutCord(); });

  function render() {
    // Geometría del cordón: del ancla al gancho del gafete
    const vyLen = Math.max(REST_LANYARD + y, MIN_STRETCH);
    const length = Math.hypot(x, vyLen);
    const hangDeg = (-Math.atan2(x, vyLen) * 180) / Math.PI;

    // Inclinación extra según la velocidad horizontal (sensación de vaivén)
    const swingDeg = Math.max(-MAX_SWING, Math.min(MAX_SWING, -vx * SWING));

    lanyard.style.height = `${length}px`;
    lanyard.style.transform = `rotate(${hangDeg}deg)`;
    badge.style.transform = `translate(${x}px, ${y}px) rotate(${hangDeg + swingDeg * 0.6}deg)`;
  }

  function tick(t) {
    const dt = Math.min((t - lastT) / 1000, 1 / 30) || 1 / 60;
    lastT = t;

    if (mode === "drag") {
      // El gafete persigue al puntero con un poco de retraso (peso)
      const nx = x + (tx - x) * FOLLOW;
      const ny = y + (ty - y) * FOLLOW;
      vx = (nx - x) / dt;
      vy = (ny - y) / dt;
      x = nx;
      y = ny;
    } else if (mode === "spring") {
      // Resorte amortiguado hacia el punto de reposo (0, 0)
      vx += (-STIFFNESS * x - DAMPING * vx) * dt;
      vy += (-STIFFNESS * y - DAMPING * vy) * dt;
      x += vx * dt;
      y += vy * dt;

      // ¿Ya se asentó? Detiene el bucle para no gastar CPU
      if (Math.abs(x) < 0.4 && Math.abs(y) < 0.4 && Math.abs(vx) < 4 && Math.abs(vy) < 4) {
        x = y = vx = vy = 0;
        mode = "idle";
        render();
        rafId = null;
        return;
      }
    }

    render();
    rafId = requestAnimationFrame(tick);
  }

  function startLoop() {
    if (rafId === null) {
      lastT = performance.now();
      rafId = requestAnimationFrame(tick);
    }
  }

  badge.addEventListener("pointerdown", (e) => {
    mode = "drag";
    grabX = e.clientX - x;
    grabY = e.clientY - y;
    tx = x;
    ty = y;
    scene.classList.remove("idle-sway");
    if (hint) hint.style.display = "none";
    badge.setPointerCapture(e.pointerId);
    startLoop();
    e.preventDefault();
  });

  badge.addEventListener("pointermove", (e) => {
    if (mode !== "drag") return;
    tx = e.clientX - grabX;
    ty = e.clientY - grabY;
  });

  function release() {
    if (mode !== "drag") return;
    mode = "spring"; // conserva vx/vy: el gafete sale disparado con tu inercia
    startLoop();
  }

  badge.addEventListener("pointerup", release);
  badge.addEventListener("pointercancel", release);
})();

/* ---------- 2) Parallax sutil de las tarjetas flotantes ---------- */

(function initParallax() {
  const stage = document.getElementById("heroStage");
  const cards = document.querySelectorAll(".float-card");
  if (!stage || !cards.length || matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  stage.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    const mx = (e.clientX - r.left) / r.width - 0.5;
    const my = (e.clientY - r.top) / r.height - 0.5;
    cards.forEach((c) => {
      const depth = parseFloat(getComputedStyle(c).getPropertyValue("--fd")) || 0.5;
      c.style.translate = `${mx * depth * -26}px ${my * depth * -18}px`;
    });
  });
})();
