import "./chatbot.css";

(() => {
  const w = window as any;
  if (w.__CHATBOT_WIDGET_LOADED__) return;
  w.__CHATBOT_WIDGET_LOADED__ = true;

  let messageHistory: { role: 'user' | 'assistant', content: string }[] = [];
  const env = (import.meta as any).env;
  const API_BASE_URL =
    env?.VITE_API_BASE_URL ||
    (env?.DEV
      ? "http://localhost:3000"
      : "https://ragchatbot-production-f204.up.railway.app");
  const PUBLIC_KEY = env?.VITE_PUBLIC_KEY || w.__CHATBOT_PUBLIC_KEY__ || "";

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
      <button id="cbw-mic">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
          <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
        </svg>
      </button>
      <button id="cbw-send">Send</button>
    </div>
  `;

  document.body.appendChild(button);
  document.body.appendChild(modal);

  const messagesEl = modal.querySelector<HTMLDivElement>("#cbw-messages")!;
  const inputEl = modal.querySelector<HTMLInputElement>("input")!;
  const sendBtn = modal.querySelector<HTMLButtonElement>("#cbw-send")!;
  const micBtn = modal.querySelector<HTMLButtonElement>("#cbw-mic")!;
  const closeBtn = modal.querySelector<HTMLButtonElement>("#cbw-close")!;

  const SpeechRecognition = w.SpeechRecognition || w.webkitSpeechRecognition;
  let recognition: any = null;
  let isListening = false;
  let autoSendTimer: number | null = null;
  const hasSpeech = "SpeechRecognition" in w || "webkitSpeechRecognition" in w;

  function setListeningState(listening: boolean) {
    isListening = listening;
    micBtn.classList.toggle("cbw-mic-listening", listening);
    micBtn.setAttribute("aria-pressed", listening ? "true" : "false");
    micBtn.title = listening ? "Stop voice input" : "Start voice input";
  }

  if (!hasSpeech) {
    micBtn.style.display = "none";
  } else {
    setListeningState(false);
  }

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

  function escapeHtml(text: string) {
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatBotMessage(text: string) {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(
        /(https?:\/\/[^\s<]+)/g,
        '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
      )
      .replace(/\n/g, "<br>");
  }

  function addMessage(text: string, type: "user" | "bot") {
    const div = document.createElement("div");
    div.className = `cbw-msg cbw-${type}`;
    if (type === "bot") {
      div.innerHTML = formatBotMessage(text);
    } else {
      div.textContent = text;
    }
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
      if (!PUBLIC_KEY) {
        if (typingDiv.parentNode) messagesEl.removeChild(typingDiv);
        addMessage("Configuration error: missing tenant public key.", "bot");
        return;
      }

      const res = await fetch(`${API_BASE_URL.replace(/\/$/, "")}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: text, 
          history: messageHistory,
          public_key: PUBLIC_KEY
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
        i++;
        botDiv.innerHTML = formatBotMessage(response.slice(0, i));
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

  function startRecognition(onText: (text: string) => void) {
    if (!SpeechRecognition) {
      alert("Speech recognition not supported in this browser");
      return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      onText(transcript);
    };

    recognition.onend = () => {
      setListeningState(false);
    };

    recognition.onerror = () => {
      setListeningState(false);
    };

    recognition.start();
    setListeningState(true);
  }

  function scheduleVoiceAutoSend() {
    if (autoSendTimer !== null) {
      window.clearTimeout(autoSendTimer);
    }

    autoSendTimer = window.setTimeout(() => {
      autoSendTimer = null;
      const text = inputEl.value.trim();
      if (!text) return;
      stopRecognition();
      void sendMessage();
    }, 1000);
  }

  function stopRecognition() {
    if (recognition) {
      recognition.stop();
    }
    if (autoSendTimer !== null) {
      window.clearTimeout(autoSendTimer);
      autoSendTimer = null;
    }
    setListeningState(false);
  }

  micBtn.onclick = () => {
    if (!hasSpeech) return;

    if (isListening) {
      stopRecognition();
      return;
    }

    startRecognition((text) => {
      inputEl.value = text;
      inputEl.focus();
      scheduleVoiceAutoSend();
    });
  };

  sendBtn.onclick = sendMessage;
  inputEl.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  });

  addMessage("Hi! How can I help you today?", "bot");
})();
