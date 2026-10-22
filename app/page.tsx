"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("All Sources");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage() {
    const text = message.trim();
    if (!text || loading) return;

    const historyToSend = chat.slice(-10);
    const userTurn: ChatMessage = { role: "user", content: text };

    setChat((prev) => [...prev, userTurn]);
    setMessage("");
    setLoading(true);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: text,
          source,
          history: historyToSend,
        }),
      });

      const data = await response.json();

      const reply: ChatMessage = {
        role: "assistant",
        content: response.ok
          ? data.answer
          : data.error || "Something went wrong.",
      };

      setChat((prev) => [...prev, reply]);
    } catch {
      setChat((prev) => [
        ...prev,
        { role: "assistant", content: "Unable to connect to AI." },
      ]);
    }

    setLoading(false);
  }

  function startNewChat() {
    setChat([]);
    setMessage("");
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1>Islamic AI Chatbot</h1>

      <p>
        Ask questions about Qur'an, Hadith, Fiqh and Islamic scholarship.
      </p>

      <label>
        Answer according to:
        <br />
        <select
          value={source}
          onChange={(e) => setSource(e.target.value)}
          style={{
            marginTop: "8px",
            padding: "10px",
            width: "100%",
            maxWidth: "400px",
          }}
        >
          <option>All Sources</option>
          <option>Qur'an</option>
          <option>Hadith</option>
          <option>Hanafi</option>
          <option>Maliki</option>
          <option>Shafi'i</option>
          <option>Hanbali</option>
          <option>Ja'fari</option>
          <option>Zaydi</option>
          <option>Ismaili</option>
          <option>Ahl-e-Hadith</option>
          <option>Deobandi</option>
          <option>Barelvi</option>
          <option>Wahhabi / Najdi reform tradition</option>
          <option>Ibadi</option>
        </select>
      </label>

      <br />
      <br />

      {chat.length > 0 && (
        <div style={{ marginBottom: "30px" }}>
          {chat.map((turn, index) =>
            turn.role === "user" ? (
              <div
                key={index}
                style={{
                  marginBottom: "15px",
                  padding: "15px",
                  background: "#f2f2f2",
                  borderRadius: "10px",
                  whiteSpace: "pre-wrap",
                }}
              >
                <strong>You:</strong>
                <p style={{ marginBottom: 0 }}>{turn.content}</p>
              </div>
            ) : (
              <div
                key={index}
                style={{
                  marginBottom: "15px",
                  padding: "20px",
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  whiteSpace: "pre-wrap",
                }}
              >
                <h2 style={{ marginTop: 0 }}>Answer</h2>
                <p style={{ marginBottom: 0 }}>{turn.content}</p>
              </div>
            )
          )}

          {loading && <p>Thinking...</p>}

          <div ref={bottomRef} />
        </div>
      )}

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
          }
        }}
        placeholder="Ask your Islamic question..."
        rows={4}
        style={{
          width: "100%",
          padding: "15px",
          fontSize: "16px",
        }}
      />

      <br />
      <br />

      <button
        onClick={sendMessage}
        disabled={loading}
        style={{
          padding: "12px 25px",
          fontSize: "16px",
          cursor: loading ? "wait" : "pointer",
        }}
      >
        {loading ? "Thinking..." : "Send"}
      </button>

      {chat.length > 0 && (
        <button
          onClick={startNewChat}
          disabled={loading}
          style={{
            padding: "12px 25px",
            fontSize: "16px",
            marginLeft: "10px",
            cursor: "pointer",
          }}
        >
          New Chat
        </button>
      )}

      <p style={{ marginTop: "40px", fontSize: "13px", color: "#666" }}>
        This chatbot provides Islamic information and is not a substitute for
        qualified scholarly advice or a formal fatwa.
      </p>
    </main>
  );
}
