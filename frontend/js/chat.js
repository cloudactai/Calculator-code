// ── Config ────────────────────────────────────────────────────────────────────
// Leave empty to prompt for a backend URL at startup (dev/local use).
// Set to your deployed server URL for production, e.g.:
//   const CHAT_API_URL = "https://your-app.onrender.com";
const CHAT_API_URL = "";

let apiUrl = CHAT_API_URL || localStorage.getItem("cloudact_api_url") || "";
let messages = [];
let isLoading = false;

// ── Init ──────────────────────────────────────────────────────────────────────
(function init() {
  if (!apiUrl) {
    document.getElementById("config-banner").style.display = "block";
    document.getElementById("api-url-input").value = "http://localhost:5050";
  }
})();

function saveApiUrl() {
  const val = document.getElementById("api-url-input").value.trim().replace(/\/$/, "");
  if (!val) return;
  apiUrl = val + "/chat";
  localStorage.setItem("cloudact_api_url", val);
  document.getElementById("config-banner").style.display = "none";
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 140) + "px";
}

function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function scrollToBottom() {
  const w = document.getElementById("chat-window");
  w.scrollTop = w.scrollHeight;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.style.display = "block";
  setTimeout(() => { t.style.display = "none"; }, 4000);
}

// ── Rendering ─────────────────────────────────────────────────────────────────
function hideWelcome() {
  const w = document.getElementById("welcome");
  if (w) w.remove();
}

function appendBubble(role, text) {
  const win = document.getElementById("chat-window");
  const row = document.createElement("div");
  row.className = `msg-row ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  row.appendChild(bubble);
  win.appendChild(row);
  scrollToBottom();
  return bubble;
}

function showTyping() {
  const win = document.getElementById("chat-window");
  const row = document.createElement("div");
  row.className = "msg-row assistant";
  row.id = "typing-row";
  row.innerHTML = `<div class="bubble typing-bubble">
    <div class="dot"></div><div class="dot"></div><div class="dot"></div>
  </div>`;
  win.appendChild(row);
  scrollToBottom();
}

function removeTyping() {
  const t = document.getElementById("typing-row");
  if (t) t.remove();
}

// ── Core send ─────────────────────────────────────────────────────────────────
async function sendMessage(text) {
  const input = document.getElementById("msg-input");
  const userText = (text || input.value).trim();
  if (!userText || isLoading) return;

  if (!apiUrl) {
    showToast("Please set your backend URL in the banner above.");
    return;
  }

  hideWelcome();
  input.value = "";
  input.style.height = "auto";

  appendBubble("user", userText);
  messages.push({ role: "user", content: userText });

  isLoading = true;
  document.getElementById("send-btn").disabled = true;
  showTyping();

  try {
    const res = await fetch(apiUrl.endsWith("/chat") ? apiUrl : apiUrl + "/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages }),
    });

    const data = await res.json();
    removeTyping();

    if (data.error) {
      showToast("Error: " + data.error);
    } else {
      messages = data.messages;
      appendBubble("assistant", data.reply);
    }
  } catch (err) {
    removeTyping();
    showToast("Could not reach the server. Is it running?");
    messages.pop();
  } finally {
    isLoading = false;
    document.getElementById("send-btn").disabled = false;
    document.getElementById("msg-input").focus();
  }
}

function sendStarter(btn) {
  sendMessage(btn.textContent);
}

function resetChat() {
  messages = [];
  const win = document.getElementById("chat-window");
  win.innerHTML = `
    <div id="welcome">
      <h1>Ontario Child Support Calculator</h1>
      <p>
        I'll walk you through a few questions and calculate child support under
        Ontario's Federal Child Support Guidelines. Everything stays in this
        session — nothing is stored.
      </p>
      <div class="starter-chips">
        <button class="chip" onclick="sendStarter(this)">I need to calculate child support</button>
        <button class="chip" onclick="sendStarter(this)">How does shared custody affect support?</button>
        <button class="chip" onclick="sendStarter(this)">What info do you need from me?</button>
      </div>
    </div>`;
}
