"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("All Sources");

  async function sendMessage() {
    if (!message.trim()) return;

    setLoading(true);
    setAnswer("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message,
          source,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setAnswer(data.error || "Something went wrong.");
      } else {
        setAnswer(data.answer);
      }
    } catch {
      setAnswer("Unable to connect to AI.");
    }

    setLoading(false);
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

      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Ask your Islamic question..."
        rows={6}
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

      {answer && (
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            border: "1px solid #ddd",
            borderRadius: "10px",
            whiteSpace: "pre-wrap",
          }}
        >
          <h2>Answer</h2>
          <p>{answer}</p>
        </div>
      )}

      <p style={{ marginTop: "40px", fontSize: "13px", color: "#666" }}>
        This chatbot provides Islamic information and is not a substitute for
        qualified scholarly advice or a formal fatwa.
      </p>
    </main>
  );
}
