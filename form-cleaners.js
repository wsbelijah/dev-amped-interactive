/* Form cleaners — intl-tel-input + mailchecker on the AMPED booking form.
   Live-validates phone (E.164 via libphonenumber utils) and email
   (disposable-domain list) with inline chips. The submit handler in
   book-a-call.html gates on window.__fcPhone / window.MailChecker and
   writes the clean E.164 number into the payload. */
(function () {
  var phone = document.getElementById("aua-phone");
  var email = document.getElementById("aua-email");
  if (!phone || !email || !window.intlTelInput) return;

  function chip(afterEl, id) {
    var c = document.createElement("div");
    c.id = id;
    c.style.cssText = "margin-top:6px;font:500 12.5px/1.45 Inter,system-ui,sans-serif;padding:6px 9px;border-radius:8px;display:none;";
    afterEl.parentNode.appendChild(c);
    return c;
  }
  function show(c, ok, text) {
    c.style.display = "block";
    c.style.background = ok ? "rgba(168,195,174,.16)" : "rgba(225,165,160,.16)";
    c.style.color = ok ? "#a8c3ae" : "#e1a5a0";
    c.style.border = "1px solid " + (ok ? "rgba(168,195,174,.45)" : "rgba(225,165,160,.45)");
    c.textContent = text;
  }

  var phoneChip = chip(phone, "fc-phone-state");
  var emailChip = chip(email, "fc-email-state");

  var iti = window.intlTelInput(phone, { initialCountry: "us" });
  window.__fcPhone = iti;

  function checkPhone() {
    if (!phone.value.trim()) { phoneChip.style.display = "none"; return; }
    if (iti.isValidNumber()) {
      show(phoneChip, true, "✓ Valid number — goes to the studio as " + iti.getNumber() + " (clean E.164 for texts/calls)");
    } else {
      show(phoneChip, false, "✗ Not a valid phone number — submit would be stopped with the message below the button");
    }
  }
  function checkEmail() {
    var v = email.value.trim();
    if (!v) { emailChip.style.display = "none"; return; }
    if (window.MailChecker && MailChecker.isValid(v)) {
      show(emailChip, true, "✓ Email domain looks real — deliverable");
    } else {
      var domain = v.split("@")[1] || "";
      show(emailChip, false, "✗ " + domain + " is on the disposable/temporary list — submit would be stopped");
    }
  }
  phone.addEventListener("blur", checkPhone);
  phone.addEventListener("input", checkPhone);
  email.addEventListener("blur", checkEmail);
  email.addEventListener("input", checkEmail);
  window.__fcCheck = { phone: checkPhone, email: checkEmail };
})();
