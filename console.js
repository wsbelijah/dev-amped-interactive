/* DEV BUILD — Build Your Session console + Work card deep dives.
   All rates are the studio's published rates. Nothing here submits
   anything; the receipt button only carries the build to the
   booking page as a query string. */
(function () {
  'use strict';

  var RATE = 40;        // recording, $/hr with engineer
  var DEPOSIT = 40;     // first hour, via Zelle
  var PRICES = { recording: null, twotrack: 100, stem: 150 };
  var NAMES = {
    recording: 'Recording — with engineer',
    twotrack: '2-Track Mix',
    stem: 'Full Stem Mix'
  };

  var state = { service: 'recording', hours: 2 };

  var picker = document.getElementById('consolePicker');
  if (!picker) return;

  var pickBtns = Array.prototype.slice.call(picker.querySelectorAll('.pick-btn'));
  var faderBlock = document.getElementById('faderBlock');
  var mixDetail = document.getElementById('mixDetail');
  var mixDetailText = document.getElementById('mixDetailText');
  var fader = document.getElementById('hoursFader');
  var hoursOut = document.getElementById('hoursOut');
  var linesEl = document.getElementById('consoleLines');
  var receipt = document.getElementById('receipt');
  var receiptLines = document.getElementById('receiptLines');
  var receiptBook = document.getElementById('receiptBook');
  var receiptFine = document.getElementById('receiptFine');
  var liveEl = document.getElementById('consoleLive');

  var MIX_COPY = {
    twotrack: 'Your two-track, mixed and finished. Send the track, get back a record. One flat rate — no hourly clock running.',
    stem: 'Full stems, full control. Every element balanced into the final record. One flat rate — no hourly clock running.'
  };

  function money(n) { return '$' + n; }

  function compute() {
    if (state.service === 'recording') {
      var total = state.hours * RATE;
      return { total: total, deposit: DEPOSIT, balance: total - DEPOSIT };
    }
    return { total: PRICES[state.service], deposit: null, balance: null };
  }

  function line(label, value, cls) {
    return '<div class="console-line' + (cls ? ' ' + cls : '') + '">' +
      '<span class="cl-label">' + label + '</span>' +
      '<span class="cl-value">' + value + '</span></div>';
  }
  function rline(label, value, cls) {
    return '<div class="receipt-line' + (cls ? ' ' + cls : '') + '">' +
      '<span class="rl-label">' + label + '</span>' +
      '<span class="rl-value">' + value + '</span></div>';
  }

  function render(feed) {
    var c = compute();
    var isRec = state.service === 'recording';

    // picker state
    pickBtns.forEach(function (b) {
      var on = b.getAttribute('data-service') === state.service;
      b.setAttribute('aria-checked', on ? 'true' : 'false');
      b.tabIndex = on ? 0 : -1;
    });

    // control panels
    faderBlock.hidden = !isRec;
    mixDetail.hidden = isRec;
    if (!isRec) mixDetailText.textContent = MIX_COPY[state.service];
    if (isRec) {
      fader.value = state.hours;
      fader.style.setProperty('--fill', ((state.hours - 1) / 7 * 100) + '%');
      fader.setAttribute('aria-valuetext', state.hours + (state.hours === 1 ? ' hour' : ' hours'));
      hoursOut.innerHTML = state.hours + ' <small>' + (state.hours === 1 ? 'hour' : 'hours') + '</small>';
    }

    // console math lines
    var html = '';
    if (isRec) {
      html += line('Recording', state.hours + ' hr × ' + money(RATE) + '/hr');
      html += line('Total', money(c.total), 'is-total');
      html += line('Deposit due (Zelle)', money(c.deposit) + ' — your first hour');
      html += line('Due at the session', money(c.balance));
    } else {
      html += line(NAMES[state.service], 'flat rate');
      html += line('Total', money(c.total), 'is-total');
      html += line('Deposit', 'Details come with your confirmation');
    }
    linesEl.innerHTML = html;

    // receipt lines
    var r = '';
    r += rline('Service', NAMES[state.service]);
    if (isRec) {
      r += rline('Length', state.hours + (state.hours === 1 ? ' hour' : ' hours'));
      r += rline('Rate', money(RATE) + '/hr · engineer included');
    }
    r += '<div class="receipt-rule"></div>';
    r += rline('Total', money(c.total), 'is-total');
    if (isRec) {
      r += rline('Deposit (Zelle)', money(c.deposit));
      r += rline('Due at session', money(c.balance));
    }
    receiptLines.innerHTML = r;

    receiptFine.textContent = isRec
      ? 'A $40 deposit via Zelle — your first hour — locks the session once your time is confirmed. Running late? You get a 20-minute grace period, then a $20 late fee applies.'
      : 'The studio follows up with availability and deposit details. This is a request — not a confirmed appointment.';

    // book link carries the build
    var q = 'service=' + state.service + '&total=' + c.total;
    if (isRec) q += '&hours=' + state.hours + '&deposit=' + c.deposit;
    receiptBook.href = 'book-a-call.html?' + q;

    liveEl.textContent = NAMES[state.service] +
      (isRec ? ', ' + state.hours + ' hours' : '') +
      '. Total ' + money(c.total) + '.';

    if (feed && receipt) {
      receipt.classList.remove('feed');
      void receipt.offsetWidth;
      receipt.classList.add('feed');
    }
  }

  // picker events (click + roving-tabindex arrow keys, radio pattern)
  pickBtns.forEach(function (btn, i) {
    btn.addEventListener('click', function () {
      state.service = btn.getAttribute('data-service');
      render(true);
    });
    btn.addEventListener('keydown', function (e) {
      var j = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % pickBtns.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') j = (i + pickBtns.length - 1) % pickBtns.length;
      if (j !== null) {
        e.preventDefault();
        state.service = pickBtns[j].getAttribute('data-service');
        render(true);
        pickBtns[j].focus();
      }
    });
  });

  // fader events
  fader.addEventListener('input', function () {
    state.hours = parseInt(fader.value, 10) || 1;
    render(false);
  });
  fader.addEventListener('change', function () { render(true); });
  document.getElementById('hoursMinus').addEventListener('click', function () {
    state.hours = Math.max(1, state.hours - 1);
    render(true);
  });
  document.getElementById('hoursPlus').addEventListener('click', function () {
    state.hours = Math.min(8, state.hours + 1);
    render(true);
  });

  render(false);

  /* ---------- work cards: tap to open ---------- */
  var heads = document.querySelectorAll('.work-card-head');
  Array.prototype.forEach.call(heads, function (head) {
    var panel = document.getElementById(head.getAttribute('aria-controls'));
    var toggleLabel = head.querySelector('.wc-toggle-text');
    head.addEventListener('click', function () {
      var open = head.getAttribute('aria-expanded') === 'true';
      head.setAttribute('aria-expanded', open ? 'false' : 'true');
      if (panel) panel.classList.toggle('open', !open);
      if (toggleLabel) toggleLabel.textContent = open ? 'Open the details' : 'Close';
    });
  });
})();
