/* AMPED UP AUDIO — AI studio chat widget.
   Answers simple questions instantly via the amped-chat Worker (Workers AI,
   knowledge-file only). Anything it can't answer leads back to the studio
   phone/email, and the original "message the studio" lead form lives one tap
   away inside the same panel — a missed answer still becomes a lead. */
(function () {
  if (document.querySelector(".aua-chat")) return;

  var CHAT_ENDPOINT = "https://amped-chat.wsbelijah.workers.dev/chat";
  var FORM_ENDPOINT = "https://formsubmit.co/ajax/Eli.otl.music@gmail.com";
  var SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycbyVQ0IWJ0U1IXKyTG86UXuxpxg11nq9YLEhtItTydK1eJXDpMUpzSIBKrmTs3nu356Wkw/exec";
  var PHONE_DISPLAY = "(626) 602-8481";
  var PHONE_TEL = "tel:+16266028481";
  var EMAIL = "Eli.otl.music@gmail.com";
  var FALLBACK_TEXT = "I don't have that one in front of me \u2014 but the studio will. Call or text " + PHONE_DISPLAY + ", or email " + EMAIL + " and you'll get a straight answer.";
  var SUCCESS_TEXT = "Got it \u2014 your message just hit the studio's inbox. We'll get back to you shortly.";
  var GREETING = "Hey \u2014 this is the studio chat. Ask me about prices, hours, or how booking works and I'll answer right here.";

  var wrap = document.createElement("div");
  wrap.className = "aua-chat";
  wrap.innerHTML =
    '<div class="aua-chat__panel" id="aua-ai-panel" role="dialog" aria-modal="false" aria-label="Studio chat" hidden>' +
      '<div class="aua-chat__head">' +
        '<p class="aua-chat__title">Studio chat</p>' +
        '<button type="button" class="aua-chat__close" id="aua-ai-close" aria-label="Close chat panel">&times;</button>' +
      "</div>" +
      '<div class="aua-chat__contactbar">' +
        '<a class="aua-chat__contact" href="' + PHONE_TEL + '">Call or text ' + PHONE_DISPLAY + "</a>" +
        '<a class="aua-chat__contact" href="mailto:' + EMAIL + '">Email the studio</a>' +
      "</div>" +

      '<div class="aua-chat__view" id="aua-ai-view-chat">' +
        '<div class="aua-chat__msgs" id="aua-ai-msgs" aria-live="polite"></div>' +
        '<div class="aua-chat__chips" id="aua-ai-chips">' +
          '<button type="button" class="aua-chat__chip" data-q="How much does recording cost?">Prices</button>' +
          '<button type="button" class="aua-chat__chip" data-q="What are your hours?">Hours</button>' +
          '<button type="button" class="aua-chat__chip" data-q="How do I book a session?">How booking works</button>' +
          '<button type="button" class="aua-chat__chip" data-q="Where is the studio located?">Location</button>' +
        "</div>" +
        '<form class="aua-chat__composer" id="aua-ai-composer">' +
          '<label class="aua-chat__sr" for="aua-ai-input">Ask the studio a question</label>' +
          '<input id="aua-ai-input" type="text" autocomplete="off" maxlength="600" placeholder="Ask about prices, hours, booking\u2026">' +
          '<div class="aua-chat__hp" aria-hidden="true"><label for="aua-ai-company">Company</label><input id="aua-ai-company" type="text" tabindex="-1" autocomplete="off"></div>' +
          '<button type="submit" class="aua-chat__send" id="aua-ai-send">Send</button>' +
        "</form>" +
        '<button type="button" class="aua-chat__swap" id="aua-ai-to-form">Rather leave a message for the studio? Tap here</button>' +
      "</div>" +

      '<div class="aua-chat__view" id="aua-ai-view-form" hidden>' +
        '<p class="aua-chat__intro">This goes straight to the studio\'s inbox.</p>' +
        '<form class="aua-chat__form" id="aua-ai-form">' +
          '<div class="aua-chat__field">' +
            '<label for="aua-ai-name">Name *</label>' +
            '<input id="aua-ai-name" name="full_name" type="text" autocomplete="name" placeholder="Your name" required>' +
          "</div>" +
          '<div class="aua-chat__field">' +
            '<label for="aua-ai-phone">Phone *</label>' +
            '<input id="aua-ai-phone" name="phone" type="tel" autocomplete="tel" placeholder="(555) 555-5555" required>' +
          "</div>" +
          '<div class="aua-chat__field">' +
            '<label for="aua-ai-message">Message *</label>' +
            '<textarea id="aua-ai-message" name="message" rows="4" placeholder="What do you need? Dates, questions, anything." required></textarea>' +
          "</div>" +
          '<div class="aua-chat__field aua-chat__consent">' +
            '<label class="aua-chat__consent-label" for="aua-ai-consent">' +
              '<input class="aua-chat__check" id="aua-ai-consent" name="sms_consent" type="checkbox" value="yes">' +
              "<span>Yes \u2014 text me back about this message. Elistudios LLC will text this number about your inquiry.</span>" +
            "</label>" +
            '<p class="aua-chat__helper">Optional. Leave it unchecked and we will not text you. Elistudios LLC will text the number above about your inquiry only — replies to your message and, if you book, session confirmations, reminders, and follow-ups. Message frequency varies. Message and data rates may apply. Reply STOP to end or HELP for help. Consent is not a condition of service. <a href="/privacy">Privacy policy</a> &middot; <a href="/terms">Terms of service</a></p>' +
          "</div>" +
          '<div class="aua-chat__hp" aria-hidden="true">' +
            '<label for="aua-ai-form-company">Company</label>' +
            '<input id="aua-ai-form-company" name="_honey" type="text" tabindex="-1" autocomplete="off">' +
          "</div>" +
          '<p class="aua-chat__status" id="aua-ai-status" role="status" aria-live="polite"></p>' +
          '<button type="submit" class="aua-chat__submit" id="aua-ai-form-submit">Send message</button>' +
        "</form>" +
        '<div class="aua-chat__done" id="aua-ai-done" hidden>' +
          '<p class="aua-chat__done-text">' + SUCCESS_TEXT + "</p>" +
        "</div>" +
        '<button type="button" class="aua-chat__swap" id="aua-ai-to-chat">\u2190 Back to chat</button>' +
      "</div>" +
    "</div>" +
    '<button type="button" class="aua-chat__launcher" id="aua-ai-launcher" aria-haspopup="dialog" aria-expanded="false" aria-controls="aua-ai-panel">Chat with the studio</button>';

  document.body.appendChild(wrap);

  var launcher = document.getElementById("aua-ai-launcher");
  var panel = document.getElementById("aua-ai-panel");
  var closeBtn = document.getElementById("aua-ai-close");
  var msgs = document.getElementById("aua-ai-msgs");
  var chips = document.getElementById("aua-ai-chips");
  var composer = document.getElementById("aua-ai-composer");
  var input = document.getElementById("aua-ai-input");
  var sendBtn = document.getElementById("aua-ai-send");
  var honey = document.getElementById("aua-ai-company");
  var viewChat = document.getElementById("aua-ai-view-chat");
  var viewForm = document.getElementById("aua-ai-view-form");
  var isOpen = false;
  var greeted = false;
  var chatBusy = false;
  var history = [];

  function openPanel() {
    try { if (!window.__auaOpened) { window.__auaOpened = 1; if (window.CBStats) CBStats.track("chat_open"); } } catch (e) {}
    isOpen = true;
    panel.hidden = false;
    requestAnimationFrame(function () { panel.classList.add("is-open"); });
    launcher.setAttribute("aria-expanded", "true");
    if (!greeted) {
      greeted = true;
      addMsg("assistant", GREETING);
      history.push({ role: "assistant", content: GREETING });
    }
    if (window.matchMedia("(pointer: fine)").matches) { input.focus(); }
  }

  function closePanel() {
    isOpen = false;
    panel.classList.remove("is-open");
    panel.hidden = true;
    launcher.setAttribute("aria-expanded", "false");
    launcher.focus();
  }

  launcher.addEventListener("click", function () { isOpen ? closePanel() : openPanel(); });
  closeBtn.addEventListener("click", closePanel);
  document.addEventListener("keydown", function (e) {
    if (isOpen && e.key === "Escape") closePanel();
  });

  function addMsg(role, text) {
    var el = document.createElement("div");
    el.className = "aua-chat__msg aua-chat__msg--" + role;
    el.textContent = text;
    msgs.appendChild(el);
    msgs.scrollTop = msgs.scrollHeight;
    return el;
  }

  function sendChat(text) {
    var q = (text || "").trim();
    if (!q || chatBusy) return;
    try { if (window.CBStats) { CBStats.track("chat_message"); if (!history.some(function (m) { return m.role === "user"; })) CBStats.track("chat_start"); } } catch (e) {}
    addMsg("user", q);
    history.push({ role: "user", content: q });
    input.value = "";
    chatBusy = true;
    sendBtn.disabled = true;
    var typing = addMsg("assistant", "\u2026");
    typing.classList.add("aua-chat__msg--typing");

    /* Honeypot filled = bot: never call the Worker, show the fallback. */
    if (honey && honey.value) {
      typing.textContent = FALLBACK_TEXT;
      typing.classList.remove("aua-chat__msg--typing");
      history.push({ role: "assistant", content: FALLBACK_TEXT });
      chatBusy = false;
      sendBtn.disabled = false;
      return;
    }

    fetch(CHAT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: history.slice(-10), company: "" })
    }).then(function (r) {
      if (!r.ok) throw new Error("bad status");
      return r.json();
    }).then(function (data) {
      var reply = (data && data.reply ? String(data.reply) : "").trim() || FALLBACK_TEXT;
      typing.textContent = reply;
      history.push({ role: "assistant", content: reply });
    }).catch(function () {
      typing.textContent = FALLBACK_TEXT;
      history.push({ role: "assistant", content: FALLBACK_TEXT });
    }).finally(function () {
      typing.classList.remove("aua-chat__msg--typing");
      chatBusy = false;
      sendBtn.disabled = false;
      msgs.scrollTop = msgs.scrollHeight;
    });
  }

  composer.addEventListener("submit", function (e) {
    e.preventDefault();
    sendChat(input.value);
  });

  chips.addEventListener("click", function (e) {
    var btn = e.target.closest(".aua-chat__chip");
    if (btn) sendChat(btn.getAttribute("data-q"));
  });

  /* ---- view swap: chat <-> lead form ---- */
  document.getElementById("aua-ai-to-form").addEventListener("click", function () {
    viewChat.hidden = true;
    viewForm.hidden = false;
    document.getElementById("aua-ai-name").focus();
  });
  document.getElementById("aua-ai-to-chat").addEventListener("click", function () {
    viewForm.hidden = true;
    viewChat.hidden = false;
    input.focus();
  });

  /* ---- lead form (same payload as the previous widget) ---- */
  var form = document.getElementById("aua-ai-form");
  var status = document.getElementById("aua-ai-status");
  var formSubmit = document.getElementById("aua-ai-form-submit");
  var done = document.getElementById("aua-ai-done");
  var formHoney = document.getElementById("aua-ai-form-company");
  var formBusy = false;

  function showSuccess() {
    form.hidden = true;
    done.hidden = false;
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (formBusy) return;
    if (formHoney && formHoney.value) { showSuccess(); return; }
    formBusy = true;
    formSubmit.disabled = true;
    formSubmit.textContent = "Sending\u2026";
    status.removeAttribute("data-state");
    status.textContent = "";

    var payload = {
      full_name: document.getElementById("aua-ai-name").value.trim(),
      phone: document.getElementById("aua-ai-phone").value.trim(),
      message: document.getElementById("aua-ai-message").value.trim(),
      sms_consent: document.getElementById("aua-ai-consent").checked ? "yes" : "",
      source: "Website Chat Widget (AI)",
      _subject: "New Website Chat Lead \u2014 AMPED UP AUDIO",
      _captcha: "false",
      _honey: ""
    };

    payload.action = "chat_message";

    function sendViaFormSubmit() {
      return fetch(FORM_ENDPOINT, {
        method: "POST",
        headers: { "Accept": "application/json", "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }).then(function (response) {
        if (!response.ok) throw new Error("Request failed");
        return response.json().catch(function () { return null; });
      }).then(function (data) {
        if (data && data.success === "false") throw new Error("Request failed");
      });
    }

    fetch(SCRIPT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "text/plain" },
      body: JSON.stringify(payload)
    }).then(function (response) {
      return response.json().catch(function () { return null; });
    }).then(function (data) {
      if (!data || !data.ok) throw new Error("Script send failed");
    }).catch(function () {
      return sendViaFormSubmit();
    }).then(function () {
      showSuccess();
    }).catch(function () {
      status.dataset.state = "error";
      status.textContent = "That did not go through. Call or text " + PHONE_DISPLAY + " instead \u2014 or check your connection and try again.";
    }).finally(function () {
      formBusy = false;
      formSubmit.disabled = false;
      formSubmit.textContent = "Send message";
    });
  });
})();
