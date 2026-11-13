/* AMPED UP AUDIO — shared subpage behavior: nav, reveals, count-ups, cursor */
(function () {
  document.documentElement.classList.add("js");

  var nav = document.getElementById("nav");
  var progress = document.getElementById("progress");
  function onScroll() {
    if (nav) nav.classList.toggle("scrolled", window.scrollY > 24);
    if (progress) {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0) + ")";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  var revealEls = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* Count-ups (service prices) */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        var end = parseFloat(e.target.getAttribute("data-count"));
        var prefix = e.target.getAttribute("data-prefix") || "";
        var t0 = null;
        function step(ts) {
          if (!t0) t0 = ts;
          var p = Math.min((ts - t0) / 900, 1);
          e.target.textContent = prefix + Math.round(end * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* Custom cursor (fine pointers only) */
  if (window.matchMedia && window.matchMedia("(pointer: fine)").matches) {
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    if (dot && ring) {
      var mx = -100, my = -100, rx = -100, ry = -100;
      document.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; });
      (function loop() {
        rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
        dot.style.transform = "translate(" + mx + "px," + my + "px)";
        ring.style.transform = "translate(" + rx + "px," + ry + "px)";
        requestAnimationFrame(loop);
      })();
      document.querySelectorAll("a, button, summary").forEach(function (el) {
        el.addEventListener("mouseenter", function () { ring.classList.add("is-hover"); });
        el.addEventListener("mouseleave", function () { ring.classList.remove("is-hover"); });
      });
    }
  }
})();

/* site-wide ambient shimmer tracker — background glow follows the pointer, eased */
(function () {
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var tx = 0.5, ty = -0.2, cx = tx, cy = ty, last = 0;
  window.addEventListener('pointermove', function (e) {
    tx = e.clientX / window.innerWidth; ty = e.clientY / window.innerHeight; last = performance.now();
  }, { passive: true });
  window.addEventListener('pointerdown', function (e) {
    tx = e.clientX / window.innerWidth; ty = e.clientY / window.innerHeight; last = performance.now();
  }, { passive: true });
  (function loop(t) {
    if (t - last > 2500) { tx = 0.5 + 0.36 * Math.sin(t * 0.00019); ty = 0.3 + 0.24 * Math.cos(t * 0.00014); }
    cx += (tx - cx) * 0.045; cy += (ty - cy) * 0.045;
    document.body.style.setProperty('--gmx', (cx * 100).toFixed(2) + '%');
    document.body.style.setProperty('--gmy', (cy * 100).toFixed(2) + '%');
    requestAnimationFrame(loop);
  })(performance.now());
})();
