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
  button.innerHTML = "💬"; // Changed to chat icon

  const modal = document.createElement("div");
  modal.id = "cbw-modal";
  modal.innerHTML = `
    <div id="cbw-header">
      AI Assistant
      <button id="cbw-close">×</button>
    </div>
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
  const sendBtn = modal.querySelector<HTMLButtonElement>("#cbw-input button")!;
  const closeBtn = modal.querySelector<HTMLButtonElement>("#cbw-close")!;

  let open = false;

  button.onclick = () => {
    open = !open;
    if (open) {
      modal.classList.add("open");
      button.classList.add("cbw-bounce");
      setTimeout(() => button.classList.remove("cbw-bounce"), 600);
    } else {
      modal.classList.remove("open");
    }
  };

  closeBtn.onclick = () => {
    open = false;
    modal.classList.remove("open");
  };

  function addMessage(text: string, type: "user" | "bot") {
    const div = document.createElement("div");
    div.className = `cbw-msg cbw-${type}`;
    div.textContent = text;
    messagesEl.appendChild(div);
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
  }

  function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "user");
    inputEl.value = "";

    // Add typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "cbw-msg cbw-typing";
    typingDiv.innerHTML = 'Typing<span class="cbw-dot"></span><span class="cbw-dot"></span><span class="cbw-dot"></span>';
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });

    setTimeout(() => {
      // Remove typing indicator
      messagesEl.removeChild(typingDiv);

      // Typewriter effect for response
      const response = "This is a placeholder response 🤖";
      const botDiv = document.createElement("div");
      botDiv.className = "cbw-msg cbw-bot";
      messagesEl.appendChild(botDiv);
      messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });

      let i = 0;
      const typeInterval = setInterval(() => {
        botDiv.textContent += response[i];
        i++;
        messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });
        if (i >= response.length) {
          clearInterval(typeInterval);
        }
      }, 50); // 50ms per character
    }, 1500); // Typing delay
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  });

  addMessage("Hi! How can I help you today?", "bot");
})();
