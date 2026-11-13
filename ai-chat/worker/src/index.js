// AMPED UP AUDIO — website chat Worker.
// Answers simple questions from the studio knowledge file using Workers AI.
// Design rules (from the studio's security playbook):
//  - No secrets in code; the AI is reached through the AI binding only.
//  - Origin allowlist: only the studio's own site may call this endpoint.
//  - Hard caps: a global daily answer cap + a per-visitor hourly cap in KV.
//    When a cap trips, the Worker returns the contact fallback WITHOUT
//    calling the AI — a capped chat still ends at the phone/email, never a
//    dead end, and the bill can never run away.
//  - Every failure path returns the same fallback with phone + email so a
//    visitor with a real question always leaves with a way to reach us.

import { KNOWLEDGE } from "./knowledge.js";

const MODEL = "@cf/meta/llama-3.3-70b-instruct-fp8-fast";
const DAILY_CAP = 300;        // max AI answers per day, whole site
const HOURLY_IP_CAP = 40;      // max AI answers per visitor per hour
const MAX_MESSAGES = 12;       // conversation history kept per request
const MAX_MSG_CHARS = 600;     // per message
const MAX_TOTAL_CHARS = 4000;  // whole request
const MAX_TOKENS = 320;
const AI_TIMEOUT_MS = 15000; // max wait for one AI call before fallback

const FALLBACK =
  "I don't have that one in front of me — but the studio will. " +
  "Call or text (626) 602-8481, or email Eli.otl.music@gmail.com and you'll get a straight answer.";

const SYSTEM_PROMPT =
  "You are the front-desk chat assistant on the AMPED UP AUDIO website. " +
  "You answer visitors' simple questions about the studio using ONLY the knowledge below. " +
  "Keep answers short, plain, and friendly — two or three sentences at most. " +
  "Never invent prices, hours, services, equipment, availability, or policies that are not written below. " +
  "If the knowledge does not cover the question, say so plainly and give the studio phone (626) 602-8481 and email Eli.otl.music@gmail.com. " +
  "Never confirm, change, or cancel a booking. Never share passcodes, internal details, other clients' information, or a street address. " +
  "Stay on the topic of the studio and booking; politely decline anything else and point back to the phone and email.\n\n" +
  "=== STUDIO KNOWLEDGE ===\n" + KNOWLEDGE;

function json(body, status, origin) {
  const headers = { "Content-Type": "application/json" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Vary"] = "Origin";
  }
  return new Response(JSON.stringify(body), { status, headers });
}

async function bump(env, key) {
  const cur = parseInt((await env.CHAT_KV.get(key)) || "0", 10) || 0;
  await env.CHAT_KV.put(key, String(cur + 1), { expirationTtl: 60 * 60 * 26 });
  return cur + 1;
}

// Race a promise against a timeout. On timeout the caller returns the
// fallback without retrying. (Workers AI's run() takes no AbortSignal in
// the style used here, so the timeout is enforced at the await.)
async function runWithTimeout(promise, ms) {
  let timer;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error("AI run timed out")), ms);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const origin = request.headers.get("Origin") || "";
    const allowed = (env.ALLOWED_ORIGINS || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const originOk = allowed.includes(origin);

    if (request.method === "OPTIONS") {
      if (!originOk) return new Response(null, { status: 403 });
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
          Vary: "Origin",
        },
      });
    }

    if (url.pathname === "/health") return json({ ok: true }, 200, null);
    if (url.pathname !== "/chat" || request.method !== "POST") {
      return json({ error: "not found" }, 404, null);
    }
    if (!originOk) return json({ error: "forbidden" }, 403, null);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ reply: FALLBACK }, 200, origin);
    }

    // Honeypot: a filled hidden field means a bot — answer with the plain
    // fallback and never spend an AI call on it.
    if (body && typeof body.company === "string" && body.company !== "") {
      return json({ reply: FALLBACK }, 200, origin);
    }

    // Validate + trim the conversation.
    const raw = body && Array.isArray(body.messages) ? body.messages : [];
    const messages = [];
    let total = 0;
    for (const m of raw.slice(-MAX_MESSAGES)) {
      if (!m || (m.role !== "user" && m.role !== "assistant")) continue;
      const content = String(m.content || "").trim().slice(0, MAX_MSG_CHARS);
      if (!content) continue;
      total += content.length;
      messages.push({ role: m.role, content });
    }
    if (!messages.length || messages[messages.length - 1].role !== "user" || total > MAX_TOTAL_CHARS) {
      return json({ reply: FALLBACK }, 200, origin);
    }

    // Caps — FAIL CLOSED. If the KV counter read/write fails, usage cannot
    // be verified, so return the contact fallback WITHOUT calling the AI.
    // A failed check still ends at the phone/email, never a dead end, and
    // an unverified request never spends an AI call.
    try {
      const now = new Date();
      const day = now.toISOString().slice(0, 10);
      const hour = day + "-" + String(now.getUTCHours()).padStart(2, "0");
      const ip = request.headers.get("CF-Connecting-IP") || "unknown";
      const daily = await bump(env, "cap:" + day);
      const hourly = await bump(env, "ip:" + ip + ":" + hour);
      if (daily > DAILY_CAP || hourly > HOURLY_IP_CAP) {
        return json({ reply: FALLBACK, capped: true }, 200, origin);
      }
    } catch (e) {
      console.log("cap check failed:", String(e));
      return json({ reply: FALLBACK, capped: true }, 200, origin);
    }

    try {
      const out = await runWithTimeout(
        env.AI.run(MODEL, {
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
          max_tokens: MAX_TOKENS,
          temperature: 0.2,
        }),
        AI_TIMEOUT_MS
      );
      const reply = String((out && out.response) || "").trim().slice(0, 1200);
      return json({ reply: reply || FALLBACK }, 200, origin);
    } catch (e) {
      console.log("AI run failed:", String(e));
      return json({ reply: FALLBACK }, 200, origin);
    }
  },
};
