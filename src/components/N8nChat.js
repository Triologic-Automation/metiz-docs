import { createChat } from "@n8n/chat";
import "@n8n/chat/style.css";
import { useEffect } from "react";
import "../css/chat.css";

export default function N8nChat() {
  useEffect(() => {
    createChat({
      webhookUrl:
        "http://localhost:5678/webhook/4091fa09-fb9a-4039-9411-7104d213f601/chat",
      position: "bottom-right",
      mode: "window",
      defaultLanguage: "en",
      initialMessages: [
        "Hello there 👋🏼, I am an AI assistant trained on the Metiz documentation.",
        "I am ready to help.",
      ],
      enableStreaming: false,
      showWelcomeScreen: false,
      allowFileUploads: false,
      i18n: {
        en: {
          title: "Metiz Assistant 👋",
          subtitle: "",
          footer: "",
          getStarted: "New Conversation",
          //inputPlaceholder: "Type your question..",
        },
      },
    });
  }, []);

  return null;
}
