/* Corebuilt Stats — event beacon + lead capture.
   Counts: pageviews, form submits, call taps (chat events come from the
   chat widgets via window.CBStats.track()).
   Lead forms (booking / quote) also send the submitted details as a "lead"
   record — that record is the confirmed lead in the business's tracker.
   No tracking cookies, no fingerprinting: just what the visitor submitted. */
(function () {
  var EP = "https://corebuilt-stats.wsbelijah.workers.dev/e";
  var me = document.currentScript;
  var SITE = (me && me.getAttribute("data-site")) || "";
  if (!SITE) return;
  var LEAD_FORMS = { "booking-form": 1, "quote-form": 1, "aua-booking-form": 1 };

  function send(obj) {
    try {
      var body = JSON.stringify(obj);
      if (navigator.sendBeacon) {
        navigator.sendBeacon(EP, new Blob([body], { type: "text/plain" }));
      } else {
        fetch(EP, { method: "POST", body: body, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(function () {});
      }
    } catch (e) {}
  }
  function track(event, form) {
    send({ site: SITE, event: event, page: location.pathname, form: form || "" });
  }
  window.CBStats = { track: track };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { track("pageview"); });
  } else { track("pageview"); }

  document.addEventListener("click", function (e) {
    var t = e.target;
    var a = t && t.closest ? t.closest('a[href^="tel:"]') : null;
    if (a) track("call_click");
  }, true);

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (!f || !f.id) return;
    if (LEAD_FORMS[f.id]) {
      try {
        var fd = new FormData(f);
        var g = function (k) { var v = fd.get(k); return v == null ? "" : String(v); };
        var service = g("service");
        if (g("session_length")) service = (service ? service + " " : "") + "(" + g("session_length") + ")";
        send({
          site: SITE, event: "lead", page: location.pathname, form: f.id,
          lead: {
            name: g("full_name") || g("name"),
            phone: g("phone"),
            email: g("email"),
            vehicle: g("vehicle"),
            service: service,
            shop: g("shop"),
            date: g("preferred_date") || g("date"),
            time: g("preferred_time") || g("preferred_start_time") || g("time"),
            message: g("message") || g("notes")
          }
        });
        return; // the worker counts the form from the lead event itself
      } catch (err) { /* fall through to plain count */ }
    }
    track("form_submit", f.id);
  }, true);
})();
