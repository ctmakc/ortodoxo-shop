/* ============================================================
   Ortodoxo Shop — lead intake (Vercel serverless function)
   Forwards form submissions to a Telegram chat via Bot API.
   Required env vars (Vercel → Project → Settings → Environment Variables):
     TELEGRAM_BOT_TOKEN — bot token from @BotFather
     TELEGRAM_CHAT_ID   — chat/channel id that receives the leads
   ============================================================ */
var LABELS = {
  form: "Form",
  name: "Nombre",
  contact: "Contacto",
  city: "Ciudad",
  purpose: "Para qué",
  qty: "Paquetes",
  comment: "Comentario",
  lang: "Idioma"
};

function clean(v) {
  return String(v == null ? "" : v).replace(/\s+/g, " ").trim().slice(0, 300);
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ ok: false, error: "method_not_allowed" });
  }

  var token = process.env.TELEGRAM_BOT_TOKEN;
  var chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) {
    // Not configured yet — fail loudly so the client shows its fallback contacts.
    return res.status(503).json({ ok: false, error: "not_configured" });
  }

  var data = req.body || {};
  if (typeof data === "string") {
    try { data = JSON.parse(data); } catch (e) { data = {}; }
  }

  var contact = clean(data.contact);
  if (!contact) {
    return res.status(400).json({ ok: false, error: "missing_contact" });
  }

  var lines = ["🕯 Nueva solicitud — Ortodoxo Shop"];
  Object.keys(LABELS).forEach(function (key) {
    var v = clean(data[key]);
    if (v) lines.push(LABELS[key] + ": " + v);
  });

  try {
    var tg = await fetch("https://api.telegram.org/bot" + token + "/sendMessage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: lines.join("\n").slice(0, 3500),
        disable_web_page_preview: true
      })
    });
    if (!tg.ok) {
      return res.status(502).json({ ok: false, error: "telegram_error" });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(502).json({ ok: false, error: "telegram_unreachable" });
  }
};
