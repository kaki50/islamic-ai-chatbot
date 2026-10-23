"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

const SUGGESTIONS = [
  "Qur'an mein kul kitni ayatein hain?",
  "Pehli wahi kahan nazil hui?",
  "What are the five pillars of Islam?",
  "وضو کا صحیح طریقہ کیا ہے؟",
];

const GREEN = "#0b6e4f";
const GREEN_DARK = "#065f46";
const GOLD = "#c9a227";

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("All Sources");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [chat, loading]);

  async function sendMessage(overrideText?: string) {
    const text = (overrideText ?? message).trim();
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
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        fontFamily:
          "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
        background: "#eef2ee",
        color: "#1c2420",
      }}
    >
      <style>{`
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: .4; }
          40% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .msg-in { animation: fadeUp .25s ease both; }
        .chip {
          padding: 10px 16px; border-radius: 999px; cursor: pointer;
          border: 1px solid ${GREEN}; background: #ffffff; color: ${GREEN_DARK};
          font-size: 14px; transition: all .15s ease; text-align: left;
        }
        .chip:hover { background: ${GREEN}; color: #fff; }
        .chip:disabled { opacity: .5; cursor: wait; }
        .send-btn {
          width: 46px; height: 46px; border-radius: 50%; border: none;
          background: linear-gradient(135deg, ${GREEN_DARK}, ${GREEN});
          color: #fff; font-size: 19px; cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 2px 8px rgba(6,95,70,.35); transition: transform .1s ease;
        }
        .send-btn:hover:not(:disabled) { transform: scale(1.06); }
        .send-btn:disabled { opacity: .45; cursor: wait; box-shadow: none; }
        .newchat-btn {
          padding: 8px 14px; border-radius: 999px; cursor: pointer;
          border: 1px solid rgba(255,255,255,.65); background: rgba(255,255,255,.12);
          color: #fff; font-size: 13.5px; font-weight: 600; transition: background .15s ease;
          white-space: nowrap;
        }
        .newchat-btn:hover:not(:disabled) { background: rgba(255,255,255,.28); }
        .newchat-btn:disabled { opacity: .5; cursor: wait; }
        .chat-scroll::-webkit-scrollbar { width: 8px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #c3cec6; border-radius: 8px; }
        textarea.chat-input:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 3px rgba(11,110,79,.15); }
        select.source-select:focus { border-color: ${GREEN} !important; outline: none; }
      `}</style>

      {/* Header */}
      <header
        style={{
          background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN} 60%, #0f8560)`,
          color: "#fff",
          padding: "14px 18px",
          borderBottom: `3px solid ${GOLD}`,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "13px",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "rgba(255,255,255,.14)",
              border: `1.5px solid ${GOLD}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              flexShrink: 0,
            }}
          >
            ☪
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: 0,
                fontSize: "21px",
                fontFamily: "Georgia, 'Times New Roman', serif",
                letterSpacing: ".3px",
              }}
            >
              Islamic AI Chatbot
            </h1>
            <p style={{ margin: "2px 0 0", fontSize: "13px", opacity: 0.88 }}>
              Qur'an, Hadith, Fiqh aur Seerah se mutaliq sawalat poochiye
            </p>
          </div>
          {chat.length > 0 && (
            <button
              className="newchat-btn"
              onClick={startNewChat}
              disabled={loading}
            >
              ⟳ New Chat
            </button>
          )}
        </div>
      </header>

      {/* Source selector bar */}
      <div
        style={{
          background: "#ffffff",
          borderBottom: "1px solid #dde5de",
          padding: "9px 18px",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            maxWidth: "880px",
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <span style={{ fontSize: "13.5px", color: "#44524a", fontWeight: 600 }}>
            Answer according to:
          </span>
          <select
            className="source-select"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            style={{
              padding: "7px 10px",
              borderRadius: "8px",
              border: "1px solid #c8d2c9",
              fontSize: "14px",
              background: "#fbfdfb",
              cursor: "pointer",
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
        </div>
      </div>

      {/* Chat area */}
      <div
        ref={scrollRef}
        className="chat-scroll"
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "22px 14px",
          background:
            "radial-gradient(circle at 15% 20%, #e3ece4 0, transparent 45%), radial-gradient(circle at 85% 90%, #e7efe7 0, transparent 40%), #eef2ee",
        }}
      >
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          {chat.length === 0 && (
            <div
              className="msg-in"
              style={{ textAlign: "center", padding: "38px 10px 10px" }}
            >
              <div
                style={{
                  width: "84px",
                  height: "84px",
                  margin: "0 auto 16px",
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN})`,
                  border: `2.5px solid ${GOLD}`,
                  color: "#fff",
                  fontSize: "42px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 6px 20px rgba(6,95,70,.30)",
                }}
              >
                ☪
              </div>
              <h2
                style={{
                  margin: "0 0 8px",
                  fontSize: "26px",
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  color: GREEN_DARK,
                }}
              >
                Assalamu Alaikum
              </h2>
              <p
                style={{
                  margin: "0 auto 26px",
                  maxWidth: "520px",
                  fontSize: "15px",
                  lineHeight: 1.6,
                  color: "#4a584e",
                }}
              >
                Qur'an, Hadith, Fiqh aur Seerah ke bare mein koi bhi sawal
                poochiye — jawab asal hawalon ke saath milega. Aap Roman Urdu,
                اردو, Arabic ya English — kisi bhi zuban mein likh sakte hain.
              </p>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  justifyContent: "center",
                }}
              >
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    className="chip"
                    dir="auto"
                    disabled={loading}
                    onClick={() => sendMessage(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chat.map((turn, index) =>
            turn.role === "user" ? (
              <div
                key={index}
                className="msg-in"
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  marginBottom: "16px",
                }}
              >
                <div
                  dir="auto"
                  style={{
                    maxWidth: "82%",
                    padding: "12px 17px",
                    background: `linear-gradient(135deg, ${GREEN_DARK}, ${GREEN})`,
                    color: "#fff",
                    borderRadius: "19px 19px 5px 19px",
                    fontSize: "15.5px",
                    lineHeight: 1.55,
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 2px 8px rgba(6,95,70,.25)",
                  }}
                >
                  {turn.content}
                </div>
              </div>
            ) : (
              <div
                key={index}
                className="msg-in"
                style={{
                  display: "flex",
                  gap: "10px",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: `1.5px solid ${GOLD}`,
                    color: GREEN,
                    fontSize: "17px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}
                >
                  ☪
                </div>
                <div
                  dir="auto"
                  style={{
                    maxWidth: "82%",
                    padding: "13px 17px",
                    background: "#ffffff",
                    border: "1px solid #dfe7df",
                    borderRadius: "19px 19px 19px 5px",
                    fontSize: "15.5px",
                    lineHeight: 1.65,
                    whiteSpace: "pre-wrap",
                    boxShadow: "0 2px 8px rgba(28,36,32,.06)",
                  }}
                >
                  {turn.content}
                </div>
              </div>
            )
          )}

          {loading && (
            <div
              className="msg-in"
              style={{
                display: "flex",
                gap: "10px",
                alignItems: "center",
                marginBottom: "16px",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "#ffffff",
                  border: `1.5px solid ${GOLD}`,
                  color: GREEN,
                  fontSize: "17px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                ☪
              </div>
              <div
                style={{
                  padding: "14px 18px",
                  background: "#ffffff",
                  border: "1px solid #dfe7df",
                  borderRadius: "19px 19px 19px 5px",
                  display: "flex",
                  gap: "5px",
                }}
              >
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: GREEN,
                      animation: `dotBounce 1.2s ${i * 0.18}s infinite`,
                    }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input bar */}
      <div
        style={{
          background: "#ffffff",
          borderTop: "1px solid #dde5de",
          padding: "13px 14px 8px",
          flexShrink: 0,
        }}
      >
        <div style={{ maxWidth: "880px", margin: "0 auto" }}>
          <div style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}>
            <textarea
              className="chat-input"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder="Apna sawal yahan likhiye... (Enter = bhejein)"
              rows={2}
              dir="auto"
              style={{
                flex: 1,
                padding: "13px 17px",
                fontSize: "16px",
                borderRadius: "22px",
                border: "1.5px solid #ccd6cc",
                resize: "none",
                fontFamily: "inherit",
                outline: "none",
                lineHeight: 1.45,
                maxHeight: "130px",
              }}
            />
            <button
              className="send-btn"
              onClick={() => sendMessage()}
              disabled={loading || !message.trim()}
              title="Send"
            >
              ➤
            </button>
          </div>
          <p
            style={{
              margin: "9px 2px 3px",
              fontSize: "12px",
              color: "#7a877c",
              textAlign: "center",
            }}
          >
            Ye chatbot islami maloomat ke liye hai — ye kisi mustanad aalim ki
            rahnumai ya baqaida fatwe ka badal nahi hai.
          </p>
        </div>
      </div>
    </div>
  );
}
