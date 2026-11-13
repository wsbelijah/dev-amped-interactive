/* AMPED UP AUDIO — max-motion build (client override, Oct 4 2026) */
(function () {
  "use strict";

  document.documentElement.classList.add("js");
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ================= nav ================= */
  var nav = document.getElementById("nav");
  var navToggle = document.getElementById("navToggle");
  var navLinks = document.getElementById("navLinks");

  function onScrollNav() {
    nav.classList.toggle("scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", onScrollNav, { passive: true });
  onScrollNav();

  navToggle.addEventListener("click", function () {
    var open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });
  navLinks.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  /* ================= diegetic loader: console boot ================= */
  var loader = document.getElementById("loader");
  var bootLines = Array.prototype.slice.call(loader.querySelectorAll(".boot-line"));
  var vu = loader.querySelector(".vu");
  var loaderDone = false;
  var heroEntered = false;

  function staggerHero() {
    if (heroEntered || reduceMotion) return;
    heroEntered = true;
    var items = document.querySelectorAll(".hero-reveal");
    items.forEach(function (el, i) {
      el.style.transitionDelay = (i * 70) + "ms";
      void el.offsetWidth; // reflow so the delay applies
      el.classList.add("in");
    });
  }

  function finishLoader() {
    if (loaderDone) return;
    loaderDone = true;
    loader.classList.add("done"); // eases away, no hard cut
    setTimeout(function () {
      if (loader.parentNode) loader.parentNode.removeChild(loader);
      document.body.classList.remove("is-loading");
      staggerHero();
    }, 700);
  }

  if (!reduceMotion) {
    loader.hidden = false;
    document.body.classList.add("is-loading");
    var bootTimes = [150, 550, 950, 1350];
    bootLines.forEach(function (line, i) {
      setTimeout(function () {
        line.classList.add("on");
        if (line.contains(vu)) vu.classList.add("on");
      }, bootTimes[i] || 1500);
    });
    var minTime = new Promise(function (res) { setTimeout(res, 1750); });
    var pageLoaded = new Promise(function (res) {
      if (document.readyState === "complete") res();
      else window.addEventListener("load", res, { once: true });
      setTimeout(res, 3500); // never trap the visitor
    });
    Promise.all([minTime, pageLoaded]).then(finishLoader);
  }

  /* ================= hero scroll-scrub: image sequence =================
     Apple-style frame sequence (the reel's recipe, Nov 1 2026): a generated
     macro start frame + full-record end frame were interpolated into a clip,
     split into WebP frames, and scroll position scrubs the canvas frame by
     frame. Pure drawImage of preloaded images — no video seeking, so the
     iOS problem that killed the 2025 canvas scrub does not apply here. */
  var pin = document.getElementById("hero");
  var stage = document.getElementById("heroStage");
  var spacer = document.getElementById("scrubSpacer");
  var canvas = document.getElementById("heroCanvas");
  var poster = document.getElementById("heroPoster");
  var heroContent = document.getElementById("heroContent");
  var scrollHint = document.getElementById("scrollHint");
  var progress = document.getElementById("progress");

  var fallbackShown = false;

  function showFallback() {
    if (fallbackShown) return;
    fallbackShown = true;
    canvas.style.display = "none";
    var dustEl = document.getElementById("dust");
    if (dustEl) dustEl.style.display = "none";
    staggerHero();
  }

  var SEQ_COUNT = 63;
  var seqActive = false;
  var seqFrames = [];
  var seqTarget = 0;
  var seqCurrent = 0;
  var seqDrawn = -1;

  function seqDir() {
    return window.matchMedia("(max-width: 820px)").matches ? "m" : "d";
  }
  function seqPath(i) {
    var n = ("00" + (i + 1)).slice(-3);
    return "assets/hero-seq/" + seqDir() + "/f" + n + ".webp";
  }
  function sizeSeqCanvas() {
    if (!canvas || !stage) return;
    var dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    canvas.width = Math.round(stage.clientWidth * dpr);
    canvas.height = Math.round(stage.clientHeight * dpr);
  }
  function drawSeq() {
    if (fallbackShown || !canvas) return;
    var idx = Math.round(seqCurrent);
    if (idx === seqDrawn) return;
    var img = seqFrames[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    var ctx = canvas.getContext("2d");
    var cw = canvas.width, ch = canvas.height;
    var sc = Math.max(cw / img.naturalWidth, ch / img.naturalHeight);
    var w = img.naturalWidth * sc, h = img.naturalHeight * sc;
    ctx.drawImage(img, (cw - w) / 2, (ch - h) / 2, w, h);
    seqDrawn = idx;
    if (poster) poster.classList.add("is-hidden");
  }
  function seqLoop() {
    if (!seqActive) return;
    var d = seqTarget - seqCurrent;
    if (Math.abs(d) > 0.01) {
      seqCurrent += d * 0.16;
      if (Math.abs(seqTarget - seqCurrent) <= 0.01) seqCurrent = seqTarget;
      drawSeq();
    }
    requestAnimationFrame(seqLoop);
  }
  function heroSeqTarget(p) { seqTarget = p * (SEQ_COUNT - 1); }

  function setupSeqHero() {
    if (!canvas || !stage) { showFallback(); return; }
    sizeSeqCanvas();
    for (var i = 0; i < SEQ_COUNT; i++) {
      (function (i) {
        var img = new Image();
        img.onload = function () {
          if (i === 0 && !seqActive) {
            seqActive = true;
            drawSeq();
            requestAnimationFrame(seqLoop);
          } else if (Math.round(seqCurrent) === i) {
            seqDrawn = -1;
            drawSeq();
          }
        };
        img.onerror = function () {
          if (i === 0) showFallback();
        };
        img.src = seqPath(i);
        seqFrames[i] = img;
      })(i);
    }
    staggerHero();
  }

  if (reduceMotion) {
    if (poster) poster.src = seqPath(SEQ_COUNT - 1);
    showFallback();
  } else {
    setupSeqHero();
  }
  window.addEventListener("resize", function () {
    sizeSeqCanvas();
    seqDrawn = -1;
    drawSeq();
  });

  /* ================= manifesto: scrubbed heading fill ================= */
  var manPin = document.getElementById("manifesto");
  var manWords = [];
  (function splitManifesto() {
    var line = document.getElementById("manifestoLine");
    if (!line) return;
    var words = line.textContent.trim().split(/\s+/);
    line.innerHTML = words.map(function (w) {
      return '<span class="w">' + w + "</span>";
    }).join(" ");
    manWords = Array.prototype.slice.call(line.querySelectorAll(".w"));
    if (reduceMotion) manWords.forEach(function (w) { w.style.opacity = 1; });
  })();

  function updateManifesto() {
    if (reduceMotion || !manWords.length || !manPin) return;
    var r = manPin.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    var p = total > 0 ? Math.min(Math.max(-r.top / total, 0), 1) : 1;
    var n = manWords.length;
    for (var i = 0; i < n; i++) {
      var local = Math.min(Math.max(p * (n + 1) - i, 0), 1);
      var e = 1 - Math.pow(1 - local, 3);
      manWords[i].style.opacity = (0.13 + 0.87 * e).toFixed(3);
    }
  }

  /* ================= scroll-upgrade helpers ================= */
  function clamp01(v) { return Math.min(Math.max(v, 0), 1); }
  /* 0→1 while a tall wrapper's sticky child is pinned */
  function pinProgress(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var total = r.height - window.innerHeight;
    return total > 0 ? clamp01(-r.top / total) : 1;
  }
  /* 0→1 as any element travels through the viewport */
  function sectionProgress(el) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return clamp01((vh - r.top) / (r.height + vh));
  }

  /* ================= listen: before/after scrub ================= */
  var baPin = document.getElementById("baPin");
  var baRaw = document.getElementById("baRaw");
  var baMixed = document.getElementById("baMixed");
  var baDivider = document.getElementById("baDivider");
  var baLabel = document.getElementById("baLabel");
  function buildBars(el, seed, lo, hi) {
    if (!el) return;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < 44; i++) {
      var s = document.createElement("i");
      var h = lo + (hi - lo) *
        (0.5 + 0.5 * Math.sin(i * 1.7 + seed)) *
        (0.55 + 0.45 * Math.sin(i * 0.53 + seed * 2.3));
      s.style.height = Math.max(4, Math.min(100, h)).toFixed(1) + "%";
      frag.appendChild(s);
    }
    el.appendChild(frag);
  }
  buildBars(baRaw, 1.3, 6, 34);
  buildBars(baMixed, 4.1, 30, 96);
  function updateBA() {
    if (!baPin) return;
    if (reduceMotion) {
      baRaw.style.opacity = 0;
      baMixed.style.opacity = 1;
      baDivider.style.display = "none";
      baLabel.textContent = "Finished mix";
      return;
    }
    var q = clamp01((pinProgress(baPin) - 0.12) / 0.76);
    var e = q * q * (3 - 2 * q); /* smoothstep */
    baRaw.style.opacity = (1 - e).toFixed(3);
    baMixed.style.opacity = e.toFixed(3);
    baDivider.style.left = (e * 100).toFixed(2) + "%";
    var txt = e < 0.5 ? "Raw take" : "Finished mix";
    if (baLabel.textContent !== txt) baLabel.textContent = txt;
  }

  /* ================= engineer: parallax facts + drifting word ================= */
  var engSec = document.getElementById("engineer");
  var engFacts = engSec ? engSec.querySelector(".engineer-facts") : null;
  var engWord = engSec ? engSec.querySelector(".eng-word") : null;
  function updateEngineer() {
    if (reduceMotion || !engSec) return;
    var p = sectionProgress(engSec);
    if (engWord) engWord.style.transform = "translateX(" + (-p * 24).toFixed(2) + "%)";
    if (engFacts && engFacts.classList.contains("in")) {
      engFacts.style.transform = "translateY(" + ((0.5 - p) * 90).toFixed(1) + "px)";
    }
  }

  /* ================= hours: scroll-illuminated rows ================= */
  var hoursRows = Array.prototype.slice.call(document.querySelectorAll(".hours-row"));
  function updateHours() {
    if (!hoursRows.length) return;
    if (reduceMotion) {
      hoursRows.forEach(function (row) { row.classList.add("is-lit"); });
      return;
    }
    var mid = window.innerHeight / 2;
    var best = null, bd = Infinity;
    hoursRows.forEach(function (row) {
      var r = row.getBoundingClientRect();
      var dc = Math.abs(r.top + r.height / 2 - mid);
      var d = dc / mid;
      row.style.setProperty("--hr-o", Math.max(0.22, 1 - d * 1.1).toFixed(3));
      if (dc < bd) { bd = dc; best = row; }
    });
    hoursRows.forEach(function (row) { row.classList.toggle("is-lit", row === best); });
  }

  /* ================= footer: giant type reveal ================= */
  var footEl = document.querySelector("footer");
  var footGiant = document.getElementById("footGiant");
  var footGiantInner = footGiant ? footGiant.querySelector("span") : null;
  function updateFooter() {
    if (reduceMotion || !footEl || !footGiantInner) return;
    var p = sectionProgress(footEl);
    footGiant.style.opacity = (0.25 + 0.75 * p).toFixed(3);
    footGiantInner.style.transform = "translateY(" + ((1 - p) * 70).toFixed(1) + "px)";
  }

  /* ================= unified scroll tick ================= */
  var ticking = false;
  function tick() {
    ticking = false;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.transform = "scaleX(" + (max > 0 ? window.scrollY / max : 0).toFixed(4) + ")";

    if (!reduceMotion && !fallbackShown && seqActive && spacer) {
      /* Scroll scrubs the frame sequence through the pinned hero; the
         hero copy fades and drifts out as the record pulls back. */
      var sd = spacer.offsetHeight || window.innerHeight * 2;
      var p = Math.min(Math.max(window.scrollY / sd, 0), 1);
      heroSeqTarget(p);
      var fade = 1 - Math.min(p / 0.45, 1);
      heroContent.style.opacity = fade.toFixed(3);
      heroContent.style.visibility = fade <= 0.01 ? "hidden" : "visible";
      heroContent.style.transform = "translateY(" + (-p * 80).toFixed(1) + "px)";
      if (scrollHint) scrollHint.style.opacity = fade.toFixed(3);
    }
    updateManifesto();
    updateBA();
    updateEngineer();
    updateHours();
    updateRoom();
    updateFooter();
  }
  function requestTick() {
    if (!ticking) { ticking = true; requestAnimationFrame(tick); }
  }
  window.addEventListener("scroll", requestTick, { passive: true });
  tick();

  /* ================= dust drift (hero only, ambient) ================= */
  var dust = document.getElementById("dust");
  if (dust && !reduceMotion) {
    var dctx = dust.getContext("2d");
    var parts = [], DW = 0, DH = 0, heroVisible = true;
    function sizeDust() {
      var r = stage.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      DW = r.width; DH = r.height;
      dust.width = Math.round(DW * dpr);
      dust.height = Math.round(DH * dpr);
      dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function initParts() {
      parts = [];
      for (var i = 0; i < 16; i++) {
        parts.push({
          x: Math.random() * DW,
          y: Math.random() * DH,
          r: 1 + Math.random() * 2.2,
          s: 0.12 + Math.random() * 0.3,
          ph: Math.random() * 6.283,
          a: 0.04 + Math.random() * 0.1
        });
      }
    }
    sizeDust();
    initParts();
    window.addEventListener("resize", function () { sizeDust(); initParts(); });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        heroVisible = entries[0].isIntersecting;
      }, { threshold: 0 }).observe(stage);
    }
    var t0 = performance.now();
    (function dustLoop() {
      requestAnimationFrame(dustLoop);
      if (!heroVisible || document.hidden) return;
      var t = (performance.now() - t0) / 1000;
      dctx.clearRect(0, 0, DW, DH);
      for (var i = 0; i < parts.length; i++) {
        var pt = parts[i];
        pt.y -= pt.s;
        pt.x += Math.sin(t * 0.6 + pt.ph) * 0.18;
        if (pt.y < -4) { pt.y = DH + 4; pt.x = Math.random() * DW; }
        dctx.beginPath();
        dctx.arc(pt.x, pt.y, pt.r, 0, 6.283);
        dctx.fillStyle = "rgba(217,164,65," + pt.a.toFixed(3) + ")";
        dctx.fill();
      }
    })();
  }

  /* ============ room: pinned horizontal scroll (desktop) / native swipe (mobile) ============ */
  var roomWrap = document.getElementById("roomWrap");
  var strip = document.getElementById("roomStrip");
  var roomMQ = window.matchMedia("(min-width: 900px)");
  var cards = [];
  var roomLayout = [];
  var roomX = 0, roomXT = 0;
  function roomPinned() { return roomMQ.matches && !reduceMotion; }
  if (strip) {
    cards = Array.prototype.slice.call(strip.querySelectorAll(".strip-card"));
  }
  function measureRoom() {
    roomLayout = cards.map(function (c) {
      var left = c.offsetLeft;
      if (c.offsetParent !== strip) left -= strip.offsetLeft;
      return { left: left, width: c.offsetWidth };
    });
  }
  function roomMaxX() {
    if (!roomLayout.length) return 0;
    var last = roomLayout[roomLayout.length - 1];
    return Math.max(0, last.left + last.width - window.innerWidth + 64);
  }
  function updateRoomCards() {
    if (!strip || !cards.length || !roomLayout.length) return;
    var pinned = roomPinned();
    var centerLocal = pinned
      ? window.innerWidth / 2 - roomX
      : strip.scrollLeft + strip.clientWidth / 2;
    var span = pinned ? window.innerWidth : strip.clientWidth;
    var best = null, bd = Infinity;
    cards.forEach(function (c, i) {
      var L = roomLayout[i];
      var cc = L.left + L.width / 2;
      var d = Math.abs(cc - centerLocal);
      var off = Math.max(-1, Math.min(1, (cc - centerLocal) / Math.max(span, 1)));
      var img = c.querySelector("img");
      if (img) img.style.transform = "translateX(" + (-off * 26).toFixed(1) + "px) scale(1.14)";
      if (d < bd) { bd = d; best = c; }
    });
    cards.forEach(function (c) { c.classList.toggle("is-active", c === best); });
  }
  function updateRoom() {
    if (!strip || !roomWrap || !cards.length) return;
    if (roomPinned()) {
      roomXT = -pinProgress(roomWrap) * roomMaxX();
      roomX += (roomXT - roomX) * 0.12;
      if (Math.abs(roomXT - roomX) < 0.5) roomX = roomXT;
      strip.style.transform = "translate3d(" + roomX.toFixed(1) + "px,0,0)";
    } else if (strip.style.transform) {
      roomX = 0; roomXT = 0;
      strip.style.transform = "";
    }
    updateRoomCards();
  }
  if (strip && cards.length) {
    var stripTick = false;
    strip.addEventListener("scroll", function () {
      if (roomPinned()) return;
      if (!stripTick) {
        stripTick = true;
        requestAnimationFrame(function () { stripTick = false; updateRoomCards(); });
      }
    }, { passive: true });
    window.addEventListener("resize", function () { measureRoom(); updateRoom(); });
    window.addEventListener("load", function () { measureRoom(); updateRoom(); });
    measureRoom();
    updateRoom();
    var prev = document.getElementById("stripPrev");
    var next = document.getElementById("stripNext");
    function stepStrip(dir) {
      if (roomPinned()) {
        window.scrollBy({ top: dir * window.innerHeight * 0.55, behavior: reduceMotion ? "auto" : "smooth" });
      } else {
        var w = cards[0] ? cards[0].offsetWidth + 20 : 320;
        strip.scrollBy({ left: dir * w, behavior: reduceMotion ? "auto" : "smooth" });
      }
    }
    if (prev) prev.addEventListener("click", function () { stepStrip(-1); });
    if (next) next.addEventListener("click", function () { stepStrip(1); });
  }

  /* ================= count-ups (real numbers only) ================= */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        cio.unobserve(en.target);
        var el = en.target;
        var target = parseFloat(el.getAttribute("data-count"));
        var prefix = el.getAttribute("data-prefix") || "";
        var start = performance.now(), dur = 1200;
        (function stepCount(now) {
          var p = Math.min((now - start) / dur, 1);
          var e = 1 - Math.pow(1 - p, 3);
          el.textContent = prefix + Math.round(target * e);
          if (p < 1) requestAnimationFrame(stepCount);
        })(start);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  /* ================= quiet scroll reveals (opacity + translateY only) ================= */
  var revealEls = document.querySelectorAll("main .reveal, .slideover .reveal, footer .reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  }

  /* ================= custom cursor (fine pointers, no reduced motion) ================= */
  (function initCursor() {
    var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    if (!fine || reduceMotion) return;
    var dot = document.getElementById("cursorDot");
    var ring = document.getElementById("cursorRing");
    var label = document.getElementById("cursorLabel");
    if (!dot || !ring) return;
    document.body.classList.add("cursor-on");

    var mx = -100, my = -100, dx = -100, dy = -100, rx = -100, ry = -100;
    var seen = false;
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX; my = e.clientY;
      if (!seen) { seen = true; document.body.classList.add("cursor-live"); }
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      document.body.classList.add("cursor-fade");
    });
    document.documentElement.addEventListener("mouseenter", function () {
      document.body.classList.remove("cursor-fade");
    });
    (function cursorLoop() {
      requestAnimationFrame(cursorLoop);
      if (document.hidden) return;
      dx += (mx - dx) * 0.4; dy += (my - dy) * 0.4;
      rx += (mx - rx) * 0.16; ry += (my - ry) * 0.16;
      dot.style.transform = "translate3d(" + dx.toFixed(1) + "px," + dy.toFixed(1) + "px,0)";
      ring.style.transform = "translate3d(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px,0)";
    })();

    /* contextual states, delegated */
    var stripEl = document.getElementById("roomStrip");
    document.addEventListener("mouseover", function (e) {
      var t = e.target;
      if (t.closest && t.closest("input, textarea, select")) {
        document.body.classList.add("cursor-fade");
        return;
      }
      document.body.classList.remove("cursor-fade");
      if (t.closest && t.closest("#roomStrip")) {
        ring.classList.remove("is-hover");
        ring.classList.add("is-drag");
        label.textContent = (typeof roomPinned === "function" && roomPinned()) ? "Scroll" : "Swipe";
        return;
      }
      ring.classList.remove("is-drag");
      if (t.closest && t.closest("a, button, summary, .strip-nav button")) {
        ring.classList.add("is-hover");
      } else {
        ring.classList.remove("is-hover");
      }
    }, { passive: true });
  })();

  /* ================= booking: hours-aware time slots + live summary ================= */
  (function bookingTimes() {
    var dateEl = document.getElementById("fDate");
    var startEl = document.getElementById("fStart");
    var endEl = document.getElementById("fEnd");
    var serviceEl = document.getElementById("fService");
    var sumService = document.getElementById("sumService");
    var sumWhen = document.getElementById("sumWhen");
    var sumTotal = document.getElementById("sumTotal");
    if (!dateEl || !startEl || !endEl) return;

    /* open windows per weekday (0 = Sunday). Close may pass 24 = after midnight. */
    var HOURS = {
      0: [[9, 15], [21, 26]],
      1: [[12, 26]],
      2: [[17, 26]],
      3: [[19, 26]],
      4: [[19, 26]],
      5: [[9, 15], [21, 26]],
      6: [[9, 15], [21, 26]]
    };

    function fmtTime(t) {
      var hh = Math.floor(t) % 24;
      var ap = hh < 12 ? "AM" : "PM";
      var h12 = hh % 12; if (h12 === 0) h12 = 12;
      var label = h12 + ":" + (t % 1 ? "30" : "00") + " " + ap;
      return t >= 24 ? label + " (next day)" : label;
    }
    function dayOf(dateStr) { return new Date(dateStr + "T12:00:00").getDay(); }
    function startSlots(day) {
      var out = [];
      HOURS[day].forEach(function (w) {
        for (var t = w[0]; t <= w[1] - 1; t += 0.5) out.push(t);
      });
      return out;
    }
    function endSlots(day, start) {
      var w = null;
      HOURS[day].forEach(function (win) { if (start >= win[0] && start < win[1]) w = win; });
      if (!w) return [];
      var out = [];
      for (var t = start + 1; t <= w[1]; t += 0.5) out.push(t);
      return out;
    }
    function fillSelect(el, slots, placeholder) {
      el.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = ""; ph.disabled = true; ph.selected = true; ph.textContent = placeholder;
      el.appendChild(ph);
      slots.forEach(function (t) {
        var o = document.createElement("option");
        o.value = fmtTime(t);
        o.textContent = fmtTime(t);
        o.setAttribute("data-t", t);
        el.appendChild(o);
      });
    }
    function selectedT(el) {
      var o = el.options[el.selectedIndex];
      var v = o && o.getAttribute ? o.getAttribute("data-t") : null;
      return v === null ? null : parseFloat(v);
    }
    function resetStart() {
      startEl.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = ""; ph.disabled = true; ph.selected = true;
      ph.textContent = "Pick a date first";
      startEl.appendChild(ph);
      startEl.disabled = true;
    }
    function resetEnd(msg) {
      endEl.innerHTML = "";
      var ph = document.createElement("option");
      ph.value = ""; ph.disabled = true; ph.selected = true;
      ph.textContent = msg || "Pick a start time first";
      endEl.appendChild(ph);
      endEl.disabled = true;
    }
    function fmtDate(dateStr) {
      return new Date(dateStr + "T12:00:00")
        .toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    }
    function updateSummary() {
      if (!sumService) return;
      var svc = serviceEl ? serviceEl.value : "";
      sumService.textContent = svc || "—";
      var d = dateEl.value, s = selectedT(startEl), e = selectedT(endEl);
      if (d && s !== null && e !== null) {
        sumWhen.textContent = fmtDate(d) + " · " + fmtTime(s) + " – " + fmtTime(e);
        var isRec = svc.indexOf("Recording") === 0;
        var total = null;
        if (svc.indexOf("2-Track") === 0) total = 100;
        else if (svc.indexOf("Full Stem") === 0) total = 150;
        else if (isRec) total = Math.round((e - s) * 40);
        sumTotal.textContent = total === null ? "—"
          : "$" + total + (isRec ? " (" + (e - s) + " hrs)" : "");
      } else if (d && s !== null) {
        sumWhen.textContent = fmtDate(d) + " · from " + fmtTime(s);
        sumTotal.textContent = "—";
      } else {
        sumWhen.textContent = "—";
        sumTotal.textContent = "—";
      }
    }

    dateEl.addEventListener("change", function () {
      if (!dateEl.value) { resetStart(); resetEnd(); updateSummary(); return; }
      fillSelect(startEl, startSlots(dayOf(dateEl.value)), "Choose a start time");
      startEl.disabled = false;
      resetEnd();
      updateSummary();
    });
    startEl.addEventListener("change", function () {
      var s = selectedT(startEl);
      if (s === null || !dateEl.value) { resetEnd(); updateSummary(); return; }
      fillSelect(endEl, endSlots(dayOf(dateEl.value), s), "Choose an end time");
      endEl.disabled = false;
      updateSummary();
    });
    endEl.addEventListener("change", updateSummary);
    if (serviceEl) serviceEl.addEventListener("change", updateSummary);

    resetStart(); resetEnd(); updateSummary();
    window.__resetBookingTimes = function () {
      resetStart(); resetEnd("Pick a start time first"); updateSummary();
    };
  })();

  /* ================= magnetic CTA (Motion Primitives recipe, MIT — Oct 4 2026) ================= */
(function magneticCTA() {
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (!fine || reduceMotion) return;
  var els = document.querySelectorAll(".magnetic");
  if (!els.length) return;
  var STIFF = 26.7, DAMP = 4.1, MASS = 0.2, DT = 1 / 60;
  var INTENSITY = 0.6, RANGE = 100;
  Array.prototype.forEach.call(els, function (el) {
    var tx = 0, ty = 0, cx = 0, cy = 0, vx = 0, vy = 0, raf = 0;
    function step() {
      var ax = (-STIFF * (cx - tx) - DAMP * vx) / MASS;
      var ay = (-STIFF * (cy - ty) - DAMP * vy) / MASS;
      vx += ax * DT; vy += ay * DT;
      cx += vx * DT; cy += vy * DT;
      var settled = Math.abs(cx - tx) < 0.05 && Math.abs(cy - ty) < 0.05 &&
                    Math.abs(vx) < 0.05 && Math.abs(vy) < 0.05;
      if (settled) {
        cx = tx; cy = ty; vx = 0; vy = 0; raf = 0;
        el.style.transform = (tx || ty)
          ? "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)" : "";
        return;
      }
      el.style.transform = "translate3d(" + cx.toFixed(2) + "px," + cy.toFixed(2) + "px,0)";
      raf = requestAnimationFrame(step);
    }
    function kick() { if (!raf) raf = requestAnimationFrame(step); }
    document.addEventListener("mousemove", function (e) {
      var r = el.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= RANGE) {
        var s = 1 - dist / RANGE;
        tx = dx * INTENSITY * s;
        ty = dy * INTENSITY * s;
      } else { tx = 0; ty = 0; }
      kick();
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () {
      tx = 0; ty = 0; kick();
    });
  });
})();

/* ================= booking form -> FormSubmit ================= */
  var form = document.getElementById("bookingForm");
  var submitBtn = document.getElementById("submitBtn");
  var status = document.getElementById("formStatus");

  var dateInput = document.getElementById("fDate");
  if (dateInput) {
    var today = new Date();
    dateInput.min =
      today.getFullYear() + "-" +
      String(today.getMonth() + 1).padStart(2, "0") + "-" +
      String(today.getDate()).padStart(2, "0");
  }

  function setStatus(kind, msg) {
    status.className = "form-status show " + kind;
    status.textContent = msg;
  }

  if (form) form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }

    submitBtn.disabled = true;
    submitBtn.textContent = "Sending…";

    var data = {};
    new FormData(form).forEach(function (v, k) { data[k] = v; });
    data._subject = "New Booking Request — AMPED UP AUDIO";
    data._template = "table";

    fetch("https://formsubmit.co/ajax/Eli.otl.music@gmail.com", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify(data)
    })
      .then(function (res) {
        if (!res.ok) throw new Error("bad response");
        return res.json();
      })
      .then(function () {
        setStatus("success", "Request received. The studio will confirm your time — your $40 Zelle deposit locks it in.");
        form.reset();
        if (window.__resetBookingTimes) window.__resetBookingTimes();
      })
      .catch(function () {
        setStatus("error", "Something went wrong sending that. Please try again, or reach the studio on Instagram @amped_up_audio.");
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send booking request";
      });
  });
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
