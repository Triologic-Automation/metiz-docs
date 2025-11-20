document.addEventListener("DOMContentLoaded", () => {
  console.log("RAG CHAT: DOMContentLoaded fired");

  // Create chat toggle button
  const toggleBtn = document.createElement("button");
  toggleBtn.id = "rag-chat-toggle";
  toggleBtn.textContent = "💬";
  document.body.appendChild(toggleBtn);

  // Create chat container (initially hidden)
  const container = document.createElement("div");
  container.id = "rag-chat-container";
  container.innerHTML = `
    <div id="rag-chat" class="rag-chat hidden">
      <div id="rag-chat-header" class="rag-chat-header">
        <span>MetizBot 🤖</span>
        <button id="rag-chat-close">✖</button>
      </div>
      <div id="rag-chat-messages" class="rag-chat-messages"></div>
      <div class="rag-chat-input-container">
        <input id="rag-chat-input" class="rag-chat-input" placeholder="Ask a question..." />
        <button id="rag-chat-send" class="rag-chat-send">Send</button>
      </div>
    </div>
  `;
  document.body.appendChild(container);

  // Docusaurus-friendly CSS
  const style = document.createElement("style");
  style.innerHTML = `
    #rag-chat-toggle {
      position: fixed; bottom: 20px; right: 20px;
      z-index: 1001;
      background: var(--ifm-color-primary);
      color: white; border: none; border-radius: 50%;
      width: 50px; height: 50px; font-size: 1.5rem;
      cursor: pointer;
    }
    #rag-chat-container { position: fixed; bottom: 80px; right: 20px; width: 350px; font-family: var(--ifm-font-family-base); z-index: 1000; }
    .rag-chat.hidden { display: none; }
    .rag-chat { background: var(--ifm-background-color); border: 1px solid #ccc; border-radius: 8px; display: flex; flex-direction: column; max-height: 500px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
    .rag-chat-header { display: flex; justify-content: space-between; padding: 8px 10px; background: var(--ifm-color-primary); color: white; font-weight: bold; }
    #rag-chat-close { background: none; border: none; color: white; cursor: pointer; font-size: 1rem; }
    .rag-chat-messages { flex: 1; overflow-y: auto; padding: 10px; background: white;}
    .rag-chat-message { margin-bottom: 10px; line-height: 1.5; }
    .rag-chat-message.user { font-weight: bold; color: var(--ifm-color-primary); }
    .rag-chat-message.bot { color: #444; background: #f7f7f7; padding: 8px 10px; border-radius: 5px; }
    .rag-chat-message .rag-chat-sources { margin-top: 5px; font-size: 0.85em; color: #666; cursor: pointer; }
    .rag-chat-message .rag-chat-sources ul { display: none; padding-left: 18px; margin-top: 5px; }
    .rag-chat-message .rag-chat-sources.open ul { display: block; }
    .rag-chat-input-container { display: flex; border-top: 1px solid #ccc; }
    .rag-chat-input { flex: 1; padding: 8px; border: none; outline: none; }
    .rag-chat-send { padding: 8px 12px; border: none; background: var(--ifm-color-primary); color: white; cursor: pointer; }
    .rag-chat-send:hover { background: var(--ifm-color-primary-dark); }
  `;
  document.head.appendChild(style);

  const chatInput = document.getElementById("rag-chat-input");
  const chatSend = document.getElementById("rag-chat-send");
  const chatMessages = document.getElementById("rag-chat-messages");
  const chatBox = document.getElementById("rag-chat");

  // Toggle open/close
  toggleBtn.addEventListener("click", () => chatBox.classList.toggle("hidden"));
  document
    .getElementById("rag-chat-close")
    .addEventListener("click", () => chatBox.classList.add("hidden"));

  function getCurrentLanguage() {
    const path = window.location.pathname;
    const match = path.match(/^\/metiz-docs\/([^/]+)/);
    if (!match) return "en";
    const lang = match[1];
    return ["en", "de", "sl", "pl"].includes(lang) ? lang : "en";
  }

  chatSend.addEventListener("click", async () => {
    const query = chatInput.value.trim();
    if (!query) return;

    addMessage(query, "user");
    chatInput.value = "";

    const lang = getCurrentLanguage();

    try {
      // 1️⃣ Embed query
      const embedRes = await fetch("http://localhost:1234/v1/embeddings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: query,
          model: "embeddinggemma-300M-GGUF",
        }),
      });
      const embedData = await embedRes.json();
      const queryEmbedding = embedData.data[0].embedding;

      // 2️⃣ Load precomputed rag_index.json
      const docsRes = await fetch("/metiz-docs/js/rag_index.json");
      let allDocs = await docsRes.json();

      allDocs = allDocs.filter((d) =>
        lang === "en"
          ? !d.url.match(/\/0\.\d+|\/next|\/de\/|\/pl\/|\/fr\//)
          : d.url.startsWith(`/metiz-docs/${lang}/`) &&
            !d.url.match(/\/0\.\d+|\/next/)
      );

      function cosineSimilarity(a, b) {
        let dot = 0,
          normA = 0,
          normB = 0;
        for (let i = 0; i < a.length; i++) {
          dot += a[i] * b[i];
          normA += a[i] * a[i];
          normB += b[i] * b[i];
        }
        return dot / (Math.sqrt(normA) * Math.sqrt(normB));
      }

      const topDocs = allDocs
        .map((d) => ({
          ...d,
          score: cosineSimilarity(queryEmbedding, d.embedding),
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 5);

      const context = topDocs.map((d) => d.text).join("\n\n---\n\n");
      const sources = Array.from(new Set(topDocs.map((d) => d.url))); // remove duplicates

      // 3️⃣ Ask LM Studio chat model
      const chatRes = await fetch("http://localhost:1234/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "gemma-3-12b",
          messages: [
            {
              role: "system",
              content:
                "You are a professional technical assistant. Summarize context professionally. Include Sources at end.",
            },
            {
              role: "system",
              content: `Context (language: ${lang}):\n${context}`,
            },
            { role: "user", content: query },
          ],
        }),
      });
      const chatData = await chatRes.json();
      const answer = chatData.choices[0].message.content;

      addMessage(answer, "bot", sources);
    } catch (err) {
      console.error(err);
      addMessage("❌ Error fetching answer. Please try again.", "bot");
    }
  });

  function addMessage(text, type, sources = []) {
    const msg = document.createElement("div");
    msg.className = `rag-chat-message ${type}`;
    msg.innerHTML = `<strong>${
      type === "user" ? "You" : "Bot"
    }:</strong> <span>${text.replace(/\n/g, "<br>")}</span>`;

    if (type === "bot" && sources.length) {
      const sourceDiv = document.createElement("div");
      sourceDiv.className = "rag-chat-sources";
      sourceDiv.innerHTML = `<span>Sources ▼</span><ul>${sources
        .map((s) => `<li><a href="${s}" target="_blank">${s}</a></li>`)
        .join("")}</ul>`;
      sourceDiv.addEventListener("click", () =>
        sourceDiv.classList.toggle("open")
      );
      msg.appendChild(sourceDiv);
    }

    chatMessages.appendChild(msg);
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }
});
