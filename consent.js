/* AMPED UP AUDIO — analytics consent gate (Oct 27, 2026).
   Google Analytics (GA4, G-FNSE1P0D35) never loads on its own.
   The inline stub in each page <head> sets Consent Mode v2 defaults to
   denied before any gtag call. This script loads gtag.js only after the
   visitor clicks Accept, or on later visits when a stored Accept exists.
   A stored Decline means analytics never loads. Choice lives in
   localStorage under "amped-analytics-consent" ("granted" / "denied"). */
(function () {
  var GA_ID = "G-FNSE1P0D35";
  var KEY = "amped-analytics-consent";
  var loaded = false;

  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag !== "function") {
    window.gtag = function () { window.dataLayer.push(arguments); };
  }

  function getChoice() {
    try { return localStorage.getItem(KEY); } catch (e) { return null; }
  }
  function setChoice(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }

  function loadGA() {
    if (loaded) return;
    loaded = true;
    window.gtag("consent", "update", { analytics_storage: "granted" });
    var s = document.createElement("script");
    s.async = true;
    s.src = "https://www.googletagmanager.com/gtag/js?id=" + GA_ID;
    document.head.appendChild(s);
    window.gtag("js", new Date());
    window.gtag("config", GA_ID);
  }

  function hideBar(bar) {
    if (bar && bar.parentNode) bar.parentNode.removeChild(bar);
  }

  function showBar() {
    if (document.getElementById("consentBar")) return;
    var bar = document.createElement("div");
    bar.className = "consent-bar";
    bar.id = "consentBar";
    bar.setAttribute("role", "region");
    bar.setAttribute("aria-label", "Analytics consent");
    bar.innerHTML =
      '<div class="consent-bar__inner">' +
        '<p class="consent-bar__text"><strong>Analytics?</strong> ' +
        'Google Analytics only loads if you accept. It counts pages viewed and general location — it does not identify you personally. ' +
        '<a href="privacy.html">Privacy policy</a></p>' +
        '<div class="consent-bar__actions">' +
          '<button type="button" class="consent-btn consent-btn--accept" id="consentAccept">Accept</button>' +
          '<button type="button" class="consent-btn consent-btn--decline" id="consentDecline">Decline</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(bar);
    /* Entrance: ease-out, fires once, no loop (DESIGN.md motion rule). */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { bar.classList.add("is-in"); });
    });
    document.getElementById("consentAccept").addEventListener("click", function () {
      setChoice("granted");
      loadGA();
      hideBar(bar);
    });
    document.getElementById("consentDecline").addEventListener("click", function () {
      setChoice("denied");
      window.gtag("consent", "update", { analytics_storage: "denied" });
      hideBar(bar);
    });
  }

  /* Footer "Cookie settings" re-opens the banner so the choice can change. */
  var openers = document.querySelectorAll("[data-cookie-settings]");
  openers.forEach(function (el) {
    el.addEventListener("click", function () { showBar(); });
  });
  window.AmpedConsent = { open: showBar };

  var choice = getChoice();
  if (choice === "granted") {
    loadGA();
  } else if (choice !== "denied") {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", showBar);
    } else {
      showBar();
    }
  }
})();
