/* ============================================================
   Ortodoxo Shop — interactions
   ============================================================ */
(function () {
  "use strict";

  /* ---------- tracking stub (Facebook Pixel / dataLayer) ----------
     Replace track() body with real fbq / gtag calls on deploy.
     Goals: form_submit, lead_guide, click_telegram, click_whatsapp, request_wholesale
  ------------------------------------------------------------------ */
  window.dataLayer = window.dataLayer || [];
  function track(event, params) {
    var payload = Object.assign({ event: event, ts: Date.now() }, params || {});
    window.dataLayer.push(payload);
    // --- Facebook Pixel placeholder ---
    // if (window.fbq) fbq('trackCustom', event, params || {});
    // --- Conversions API would mirror this server-side ---
  }
  window.OrtoTrack = track;

  /* ---------- language ---------- */
  var UNITS = {
    es: { min: "min", cm: "cm" },
    en: { min: "min", cm: "cm" },
    ru: { min: "мин", cm: "см" },
    ro: { min: "min", cm: "cm" },
    uk: { min: "хв", cm: "см" }
  };
  var LS_KEY = "ortodoxo_lang";
  var SUPPORTED = (typeof LANGS !== "undefined") ? LANGS : ["es", "en", "ru", "ro", "uk"];
  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = "es";
    var dict = I18N[lang] || I18N.es;
    document.documentElement.setAttribute("lang", lang);
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n")];
      if (v != null) el.textContent = v;
    });
    document.querySelectorAll("[data-i18n-html]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-html")];
      if (v != null) el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-ph]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-ph")];
      if (v != null) el.setAttribute("placeholder", v);
    });
    document.querySelectorAll("[data-i18n-aria]").forEach(function (el) {
      var v = dict[el.getAttribute("data-i18n-aria")];
      if (v != null) el.setAttribute("aria-label", v);
    });
    // document metadata (title + meta description) per language
    if (dict.doc_title) document.title = dict.doc_title;
    var metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc && dict.doc_desc) metaDesc.setAttribute("content", dict.doc_desc);
    // units in specs table (min / cm differ by language)
    var u = UNITS[lang] || UNITS.es;
    document.querySelectorAll("[data-u]").forEach(function (el) {
      var k = el.getAttribute("data-u");
      if (u[k]) el.textContent = u[k];
    });
    // language switcher: current label + active state
    var label = (typeof LANG_LABEL !== "undefined" && LANG_LABEL[lang]) ? LANG_LABEL[lang] : lang.toUpperCase();
    var cur = document.querySelector(".lang-cur");
    if (cur) cur.textContent = label;
    document.querySelectorAll(".lang-list button").forEach(function (b) {
      b.classList.toggle("active", b.dataset.lang === lang);
    });
    try { localStorage.setItem(LS_KEY, lang); } catch (e) {}
    window.__lang = lang;
  }
  var startLang = "es";
  try { startLang = localStorage.getItem(LS_KEY) || "es"; } catch (e) {}
  if (SUPPORTED.indexOf(startLang) === -1) startLang = "es";

  /* ---------- language dropdown ---------- */
  var langWrap = document.querySelector(".lang");
  var langToggle = document.querySelector(".lang-toggle");
  function closeLang() { if (langWrap) langWrap.classList.remove("open"); if (langToggle) langToggle.setAttribute("aria-expanded", "false"); }
  if (langToggle) {
    langToggle.addEventListener("click", function (e) {
      e.stopPropagation();
      var open = langWrap.classList.toggle("open");
      langToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }
  document.querySelectorAll(".lang-list button").forEach(function (b) {
    b.addEventListener("click", function () {
      applyLang(b.dataset.lang);
      track("switch_lang", { lang: b.dataset.lang });
      closeLang();
    });
  });
  document.addEventListener("click", function (e) {
    if (langWrap && !langWrap.contains(e.target)) closeLang();
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeLang(); });

  /* ---------- header shadow on scroll ---------- */
  var header = document.querySelector(".site-header");
  function onScroll() {
    if (window.scrollY > 12) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---------- smooth anchor + focus first field ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - 76;
      window.scrollTo({ top: y, behavior: "smooth" });
      if (a.dataset.track) track(a.dataset.track, { to: id });
    });
  });

  /* ---------- generic CTA tracking ---------- */
  document.querySelectorAll("[data-track]").forEach(function (el) {
    if (el.tagName === "A" && el.getAttribute("href").charAt(0) === "#") return; // handled above
    el.addEventListener("click", function () {
      track(el.dataset.track, { label: (el.textContent || "").trim().slice(0, 40) });
    });
  });

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var q = item.querySelector(".faq-q");
    var a = item.querySelector(".faq-a");
    q.setAttribute("aria-expanded", "false");
    q.addEventListener("click", function () {
      var open = item.classList.contains("open");
      document.querySelectorAll(".faq-item.open").forEach(function (o) {
        if (o !== item) {
          o.classList.remove("open");
          o.querySelector(".faq-a").style.maxHeight = null;
          o.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("open", !open);
      q.setAttribute("aria-expanded", String(!open));
      a.style.maxHeight = open ? null : a.scrollHeight + "px";
      if (!open) track("faq_open", { q: q.textContent.trim().slice(0, 50) });
    });
  });

  /* ---------- reveal on scroll ---------- */
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (en) {
      if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });

  /* ---------- lazy video (load on view, keep first paint fast) ---------- */
  var vbox = document.querySelector(".video-frame");
  if (vbox) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var v = en.target.querySelector("video");
        if (v && !v.dataset.loaded) {
          var src = v.getAttribute("data-src");
          if (src) { v.src = src; v.load(); v.play().catch(function () {}); }
          v.dataset.loaded = "1";
        }
        vio.unobserve(en.target);
      });
    }, { threshold: 0.25 });
    vio.observe(vbox);
  }

  /* ---------- form validation ---------- */
  function showErr(field, on) { field.classList.toggle("invalid", !!on); }

  function validateField(field) {
    var input = field.querySelector("input, textarea, select");
    if (!input) return true;
    var required = input.hasAttribute("required");
    var val = (input.value || "").trim();
    if (required && !val) { showErr(field, true); return false; }
    if (input.dataset.kind === "contact" && val) {
      // accept email, @handle, phone, or wa.me / t.me links
      var ok = /@|\+?\d[\d\s().-]{6,}|t\.me|wa\.me|http/i.test(val);
      showErr(field, !ok); return ok;
    }
    showErr(field, false); return true;
  }

  function wireForm(formSel, eventName) {
    var form = document.querySelector(formSel);
    if (!form) return;
    var card = form.closest(".form-card") || form;
    form.querySelectorAll(".field").forEach(function (f) {
      var input = f.querySelector("input, textarea, select");
      if (!input) return;
      input.addEventListener("blur", function () { validateField(f); });
      input.addEventListener("input", function () { if (f.classList.contains("invalid")) validateField(f); });
    });
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var ok = true, firstBad = null;
      form.querySelectorAll(".field").forEach(function (f) {
        var v = validateField(f);
        if (!v && !firstBad) firstBad = f;
        ok = ok && v;
      });
      if (!ok) {
        if (firstBad) { var inp = firstBad.querySelector("input,textarea,select"); if (inp) inp.focus(); }
        track(eventName + "_invalid", {});
        return;
      }
      // gather fields (inputs carry name="" attributes)
      var data = { form: eventName, lang: window.__lang || "es" };
      form.querySelectorAll("input, textarea, select").forEach(function (inp) {
        if (!inp.name) return;
        if (inp.type === "radio" && !inp.checked) return;
        var v = (inp.value || "").trim();
        if (v) data[inp.name] = v;
      });
      var btn = form.querySelector('button[type="submit"]');
      if (btn) btn.disabled = true;
      var errEl = form.querySelector(".form-err");
      if (errEl) errEl.classList.remove("show");
      fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      }).then(function (res) {
        if (!res.ok) throw new Error("HTTP " + res.status);
        track(eventName, { purpose: data.purpose });
        // show thank-you state
        card.classList.add("sent");
        var thanks = card.querySelector(".thanks");
        if (thanks) thanks.classList.add("show");
        var y = card.getBoundingClientRect().top + window.scrollY - 90;
        window.scrollTo({ top: y, behavior: "smooth" });
      }).catch(function () {
        // submission failed — keep the form, offer direct contact instead
        track(eventName + "_error", {});
        if (btn) btn.disabled = false;
        if (!errEl) {
          errEl = document.createElement("p");
          errEl.className = "form-err";
          (form.querySelector(".form-body") || form).appendChild(errEl);
        }
        var dict = (typeof I18N !== "undefined" && (I18N[window.__lang] || I18N.es)) || {};
        errEl.textContent = dict.form_err || "No se pudo enviar la solicitud. Escríbenos directamente: ";
        var link = document.createElement("a");
        link.href = "https://t.me/ortodoxoshop";
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "Telegram";
        errEl.appendChild(document.createTextNode(" "));
        errEl.appendChild(link);
        errEl.classList.add("show");
      });
    });
  }

  /* ---------- init ---------- */
  applyLang(startLang);
  onScroll();
  wireForm("#order-form", "form_submit");
  wireForm("#guide-form", "lead_guide");
  wireForm("#callback-form", "lead_callback");
})();
