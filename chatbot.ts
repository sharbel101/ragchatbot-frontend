(() => {
  const w = window as any;
  if (w.__CHATBOT_WIDGET_LOADED__) return;
  w.__CHATBOT_WIDGET_LOADED__ = true;

  let messageHistory: { role: 'user' | 'assistant', content: string }[] = [];

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

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;

    addMessage(text, "user");
    inputEl.value = "";
    
    // Add to history (keep last 10 messages)
    messageHistory.push({ role: 'user', content: text });
    if (messageHistory.length > 10) messageHistory = messageHistory.slice(-10);

    // Add typing indicator
    const typingDiv = document.createElement("div");
    typingDiv.className = "cbw-msg cbw-typing";
    typingDiv.innerHTML = 'Typing<span class="cbw-dot"></span><span class="cbw-dot"></span><span class="cbw-dot"></span>';
    messagesEl.appendChild(typingDiv);
    messagesEl.scrollTo({ top: messagesEl.scrollHeight, behavior: 'smooth' });

    try {
      // TODO: In production, this ID should be configured by the embedding script or config
      const CLIENT_ID = "76e475d8-adcf-425e-8c6e-7c77eabc50fa";

      const res = await fetch("http://localhost:3000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          history: messageHistory,
          clientId: CLIENT_ID 
        })
      });

      const data = await res.json();
      const response = data.answer || "Sorry, I encountered an error.";

      // Remove typing indicator
      if (typingDiv.parentNode) messagesEl.removeChild(typingDiv);

      // Add to history
      messageHistory.push({ role: 'assistant', content: response });

      // Typewriter effect for response
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
      }, 20); // Faster typing speed
    } catch (err) {
      if (typingDiv.parentNode) messagesEl.removeChild(typingDiv);
      addMessage("Error connecting to server.", "bot");
      console.error(err);
    }
  }

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  });

  addMessage("Hi! How can I help you today?", "bot");
})();
