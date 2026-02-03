(() => {
  const w = window as any;
  if (w.__CHATBOT_WIDGET_LOADED__) return;
  w.__CHATBOT_WIDGET_LOADED__ = true;

  /* ---------- Load CSS ---------- */
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "./chatbot.css"; // later this will be CDN URL
  document.head.appendChild(link);

  /* ---------- Create UI ---------- */
  const button = document.createElement("button");
  button.id = "cbw-button";
  button.textContent = "🤖";

  const modal = document.createElement("div");
  modal.id = "cbw-modal";
  modal.innerHTML = `
    <div id="cbw-header">AI Assistant</div>
    <div id="cbw-messages"></div>
    <div id="cbw-input">
      <input type="text" placeholder="Type a message..." />
      <button>Send</button>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(modal);

  const messagesEl = modal.querySelector<HTMLDivElement>("#cbw-messages")!;
  const inputEl = modal.querySelector<HTMLInputElement>("input")!;
  const sendBtn = modal.querySelector<HTMLButtonElement>("button")!;

  let open = false;

  button.onclick = () => {
    open = !open;
    modal.style.display = open ? "flex" : "none";
  };

  function addMessage(text: string, type: "user" | "bot") {
    const div = document.createElement("div");
    div.className = `cbw-msg cbw-${type}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "user");
    inputEl.value = "";

    setTimeout(() => {
      addMessage("This is a placeholder response 🤖", "bot");
    }, 500);
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  });

  addMessage("Hi! How can I help you today?", "bot");
})();
