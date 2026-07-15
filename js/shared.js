/* ==========================================================================
   ValDEV — comportamiento compartido por todas las páginas:
   tema claro/oscuro, idioma ES/EN, menú móvil, reveals y footer.
   Requiere que i18n.js se cargue antes (define window.I18N).
   ========================================================================== */

/* ---------- Tema claro / oscuro ---------- */
(function initTheme() {
  const btn = document.getElementById("themeToggle");
  const KEY = "valdev-theme";

  const SUN =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4.2" fill="currentColor" stroke="none"/><path d="M12 2.5V5M12 19v2.5M2.5 12H5M19 12h2.5M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M19.1 4.9l-1.8 1.8M6.7 17.3l-1.8 1.8"/></svg>';
  const MOON =
    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.6 13.8A8.5 8.5 0 1 1 10.2 3.4a7 7 0 0 0 10.4 10.4z"/></svg>';

  function paintIcon() {
    if (!btn) return;
    const t = document.documentElement.dataset.theme;
    btn.innerHTML = t === "dark" ? SUN : MOON;
  }

  if (btn) {
    btn.addEventListener("click", () => {
      const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      document.documentElement.dataset.theme = next;
      localStorage.setItem(KEY, next);
      paintIcon();
    });
  }
  paintIcon();
})();

/* ---------- Idioma ES / EN ---------- */
(function initLang() {
  const toggle = document.getElementById("langToggle");
  const KEY = "valdev-lang";

  function applyLang(lang) {
    const dict = (window.I18N && window.I18N[lang]) || {};
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const key = el.getAttribute("data-i18n");
      if (dict[key] !== undefined) el.textContent = dict[key];
    });
    document.documentElement.lang = lang;
    document.querySelectorAll(".lang-opt").forEach((o) => {
      o.classList.toggle("active", o.dataset.lang === lang);
    });
    localStorage.setItem(KEY, lang);
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const cur = localStorage.getItem(KEY) || "es";
      applyLang(cur === "es" ? "en" : "es");
    });
  }
  applyLang(localStorage.getItem(KEY) || "es");
})();

/* ---------- Menú móvil ---------- */
(function initMenu() {
  const btn = document.getElementById("menuBtn");
  const links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", () => links.classList.toggle("open"));
  }
})();

/* ---------- Link activo en la nav ---------- */
(function markActive() {
  const here = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === here) a.classList.add("active");
  });
})();

/* ---------- Aparición al hacer scroll ---------- */
(function initReveal() {
  const obs = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add("visible");
          obs.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1 }
  );
  document.querySelectorAll(".reveal").forEach((el) => obs.observe(el));
})();

/* ---------- Dock: magnificación y página actual ---------- */
(function initDock() {
  const dock = document.getElementById("dock");
  if (!dock) return;
  const items = [...dock.querySelectorAll(".dock-item")];

  const here = location.pathname.split("/").pop() || "index.html";
  items.forEach((it) => {
    if (it.getAttribute("href") === here) it.classList.add("current");
  });

  const RANGE = 95;   // px de influencia alrededor del cursor
  const BOOST = 0.45; // cuánto crece el ícono bajo el cursor (con el gap actual no llegan a tocarse)

  dock.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return; // en táctil no hay hover
    items.forEach((it) => {
      const r = it.getBoundingClientRect();
      const d = Math.abs(e.clientX - (r.left + r.width / 2));
      const s = 1 + BOOST * Math.max(0, 1 - d / RANGE);
      it.style.setProperty("--s", s.toFixed(3));
    });
  });

  dock.addEventListener("pointerleave", () => {
    items.forEach((it) => it.style.setProperty("--s", 1));
  });
})();

/* ---------- Año en el footer ---------- */
document.querySelectorAll(".year").forEach((el) => {
  el.textContent = new Date().getFullYear();
});
