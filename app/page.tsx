"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

type Lang = "en" | "roman" | "ur";

const TEXTS: Record<
  Lang,
  {
    subtitle: string;
    welcomeTitle: string;
    welcomeText: string;
    placeholder: string;
    disclaimer: string;
    recents: string;
    noChats: string;
    chatsNote: string;
    newChat: string;
    sourceLabel: string;
    chips: string[];
  }
> = {
  en: {
    subtitle: "Ask about the Qur'an, Hadith, Fiqh and Seerah",
    welcomeTitle: "Assalamu Alaikum",
    welcomeText:
      "Ask anything about the Qur'an, Hadith, Fiqh and Seerah — answers come with authentic references. You can write in English, Roman Urdu, اردو, Arabic, or any language you prefer.",
    placeholder: "Type your question here... (Enter = send)",
    disclaimer:
      "This chatbot is for Islamic information only — it is not a substitute for guidance from a qualified scholar or a formal fatwa.",
    recents: "Recents",
    noChats: "No chats yet. Your first conversation will be saved here automatically.",
    chatsNote: "Chats are saved only in this browser.",
    newChat: "New Chat",
    sourceLabel: "Answer according to:",
    chips: [
      "How many verses are in the Qur'an?",
      "Where was the first revelation received?",
      "What are the five pillars of Islam?",
      "What is the correct way to perform wudu?",
    ],
  },
  roman: {
    subtitle: "Qur'an, Hadith, Fiqh aur Seerah se mutaliq sawalat poochiye",
    welcomeTitle: "Assalamu Alaikum",
    welcomeText:
      "Qur'an, Hadith, Fiqh aur Seerah ke bare mein koi bhi sawal poochiye — jawab asal hawalon ke saath milega. Aap Roman Urdu, اردو, Arabic ya English — kisi bhi zuban mein likh sakte hain.",
    placeholder: "Apna sawal yahan likhiye... (Enter = bhejein)",
    disclaimer:
      "Ye chatbot islami maloomat ke liye hai — ye kisi mustanad aalim ki rahnumai ya baqaida fatwe ka badal nahi hai.",
    recents: "Recents",
    noChats: "Abhi koi purani chat nahi hai. Pehli guftagu yahan khud save ho jayegi.",
    chatsNote: "Chats sirf aap ke is browser mein save hoti hain.",
    newChat: "New Chat",
    sourceLabel: "Jawab kis ke mutabiq:",
    chips: [
      "Qur'an mein kul kitni ayatein hain?",
      "Pehli wahi kahan nazil hui?",
      "Namaz ki farz rak'atein kitni hain?",
      "وضو کا صحیح طریقہ کیا ہے؟",
    ],
  },
  ur: {
    subtitle: "قرآن، حدیث، فقہ اور سیرت سے متعلق سوالات پوچھیے",
    welcomeTitle: "السلام علیکم",
    welcomeText:
      "قرآن، حدیث، فقہ اور سیرت کے بارے میں کوئی بھی سوال پوچھیے — جواب اصل حوالوں کے ساتھ ملے گا۔ آپ اردو، Roman Urdu، عربی یا انگریزی — کسی بھی زبان میں لکھ سکتے ہیں۔",
    placeholder: "اپنا سوال یہاں لکھیے... (Enter = بھیجیں)",
    disclaimer:
      "یہ چیٹ بوٹ اسلامی معلومات کے لیے ہے — یہ کسی مستند عالم کی رہنمائی یا باقاعدہ فتوے کا بدل نہیں ہے۔",
    recents: "پچھلی چیٹس",
    noChats: "ابھی کوئی پرانی چیٹ نہیں ہے۔ پہلی گفتگو یہاں خود محفوظ ہو جائے گی۔",
    chatsNote: "چیٹس صرف آپ کے اسی براؤزر میں محفوظ ہوتی ہیں۔",
    newChat: "نئی چیٹ",
    sourceLabel: "جواب کس کے مطابق:",
    chips: [
      "قرآن میں کل کتنی آیات ہیں؟",
      "پہلی وحی کہاں نازل ہوئی؟",
      "وضو کا صحیح طریقہ کیا ہے؟",
      "اسلام کے ارکان کون سے ہیں؟",
    ],
  },
};

const GREEN = "#0b6e4f";
const GREEN_DARK = "#065f46";
const GOLD = "#c9a227";
const SIDEBAR_BG = "#0a2e23";
const STORAGE_KEY = "islamic-chat-sessions";
const LANG_KEY = "islamic-chat-lang";
const MAX_SESSIONS = 30;

function makeId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function titleFrom(messages: ChatMessage[]) {
  const first = messages.find((m) => m.role === "user");
  const text = (first?.content || "New chat").trim().replace(/\s+/g, " ");
  return text.length > 34 ? text.slice(0, 34) + "…" : text;
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState("All Sources");
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [lang, setLang] = useState<Lang>("en");
  const scrollRef = useRef<HTMLDivElement>(null);

  const t = TEXTS[lang];

  // Load saved chats and language from this browser
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSessions(parsed);
      }
      const savedLang = localStorage.getItem(LANG_KEY);
      if (savedLang === "roman" || savedLang === "ur" || savedLang === "en") {
        setLang(savedLang);
      }
    } catch {
      // ignore broken storage
    }
    setLoaded(true);
  }, []);

  function pickLang(l: Lang) {
    setLang(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      // ignore
    }
  }

  // Save the current conversation into the sessions list
  useEffect(() => {
    if (!loaded || chat.length === 0) return;
    setSessions((prev) => {
      const id = activeId ?? makeId();
      if (!activeId) setActiveId(id);
      const existing = prev.find((s) => s.id === id);
      const session: ChatSession = {
        id,
        title: existing?.title ?? titleFrom(chat),
        messages: chat,
        updatedAt: Date.now(),
      };
      const next = [session, ...prev.filter((s) => s.id !== id)]
        .sort((a, b) => b.updatedAt - a.updatedAt)
        .slice(0, MAX_SESSIONS);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // storage full — keep the in-memory list only
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat, loaded]);

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
    setActiveId(null);
    setSidebarOpen(false);
  }

  function openSession(session: ChatSession) {
    setChat(session.messages);
    setActiveId(session.id);
    setMessage("");
    setSidebarOpen(false);
  }

  function deleteSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
    if (id === activeId) {
      setChat([]);
      setActiveId(null);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        fontFamily: "'Segoe UI', system-ui, -apple-system, Arial, sans-serif",
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
        .menu-btn {
          display: none; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0;
          border: 1px solid rgba(255,255,255,.5); background: rgba(255,255,255,.12);
          color: #fff; font-size: 19px; cursor: pointer;
        }
        .lang-btn {
          padding: 6px 12px; border-radius: 999px; cursor: pointer;
          border: 1px solid #c8d2c9; background: #ffffff; color: #44524a;
          font-size: 13px; font-weight: 600; transition: all .15s ease;
        }
        .lang-btn:hover { border-color: ${GREEN}; color: ${GREEN_DARK}; }
        .lang-btn.active { background: ${GREEN}; border-color: ${GREEN}; color: #fff; }
        .chat-scroll::-webkit-scrollbar { width: 8px; }
        .chat-scroll::-webkit-scrollbar-thumb { background: #c3cec6; border-radius: 8px; }
        .side-scroll::-webkit-scrollbar { width: 6px; }
        .side-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,.25); border-radius: 6px; }
        textarea.chat-input:focus { border-color: ${GREEN} !important; box-shadow: 0 0 0 3px rgba(11,110,79,.15); }
        select.source-select:focus { border-color: ${GREEN} !important; outline: none; }
        .side-new {
          display: flex; align-items: center; gap: 10px; width: 100%;
          padding: 12px 14px; border-radius: 12px; cursor: pointer;
          border: 1px solid ${GOLD}; background: rgba(201,162,39,.13);
          color: #fff; font-size: 15px; font-weight: 600; transition: background .15s ease;
        }
        .side-new:hover { background: rgba(201,162,39,.28); }
        .side-item {
          display: flex; align-items: center; gap: 8px; width: 100%;
          padding: 10px 12px; border-radius: 10px; cursor: pointer;
          border: none; background: transparent; color: #dce8de;
          font-size: 14px; text-align: left; transition: background .15s ease;
        }
        .side-item:hover { background: rgba(255,255,255,.09); }
        .side-item.active { background: rgba(201,162,39,.20); color: #fff; }
        .side-del {
          margin-left: auto; flex-shrink: 0; border: none; background: transparent;
          color: #9fb8a6; font-size: 14px; cursor: pointer; padding: 3px 6px;
          border-radius: 6px; line-height: 1;
        }
        .side-del:hover { color: #ff9c9c; background: rgba(255,255,255,.10); }
        .backdrop { display: none; }
        .sidebar {
          width: 264px; flex-shrink: 0; display: flex; flex-direction: column;
          background: ${SIDEBAR_BG}; color: #fff; z-index: 60;
        }
        @media (max-width: 900px) {
          .menu-btn { display: flex; }
          .sidebar {
            position: fixed; top: 0; bottom: 0; left: 0;
            transform: translateX(-106%); transition: transform .25s ease;
            box-shadow: 4px 0 24px rgba(0,0,0,.35);
          }
          .sidebar.open { transform: none; }
          .backdrop {
            display: block; position: fixed; inset: 0; z-index: 55;
            background: rgba(0,0,0,.45);
          }
        }
      `}</style>

      {/* Sidebar backdrop (mobile) */}
      {sidebarOpen && (
        <div className="backdrop" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        <div style={{ padding: "16px 14px 10px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "9px",
              marginBottom: "14px",
              padding: "0 2px",
            }}
          >
            <span style={{ fontSize: "20px", color: GOLD }}>☪</span>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: "16.5px",
                fontWeight: 700,
              }}
            >
              Islamic AI Chatbot
            </span>
          </div>
          <button className="side-new" onClick={startNewChat}>
            <span style={{ fontSize: "17px" }}>✎</span>{" "}
            <span dir="auto">{t.newChat}</span>
          </button>
        </div>

        <div
          dir="auto"
          style={{
            padding: "8px 16px 6px",
            fontSize: "12px",
            letterSpacing: "1.2px",
            textTransform: "uppercase",
            color: "#9fb8a6",
            fontWeight: 700,
          }}
        >
          {t.recents}
        </div>

        <div
          className="side-scroll"
          style={{ flex: 1, overflowY: "auto", padding: "0 8px 12px" }}
        >
          {sessions.length === 0 && (
            <p
              dir="auto"
              style={{
                padding: "6px 10px",
                fontSize: "13.5px",
                color: "#8fae97",
                lineHeight: 1.5,
              }}
            >
              {t.noChats}
            </p>
          )}
          {sessions.map((s) => (
            <div key={s.id} style={{ marginBottom: "2px" }}>
              <button
                className={`side-item${s.id === activeId ? " active" : ""}`}
                onClick={() => openSession(s)}
              >
                <span style={{ fontSize: "13px", opacity: 0.75 }}>💬</span>
                <span
                  dir="auto"
                  style={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {s.title}
                </span>
                <span
                  className="side-del"
                  title="Delete chat"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(s.id);
                  }}
                >
                  ✕
                </span>
              </button>
            </div>
          ))}
        </div>

        <div
          dir="auto"
          style={{
            padding: "11px 16px",
            borderTop: "1px solid rgba(255,255,255,.12)",
            fontSize: "12px",
            color: "#8fae97",
            lineHeight: 1.5,
          }}
        >
          {t.chatsNote}
        </div>
      </aside>

      {/* Main column */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minWidth: 0,
        }}
      >
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
            <button
              className="menu-btn"
              onClick={() => setSidebarOpen(true)}
              title="Chats"
            >
              ☰
            </button>
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
              <p
                dir="auto"
                style={{ margin: "2px 0 0", fontSize: "13px", opacity: 0.88 }}
              >
                {t.subtitle}
              </p>
            </div>
            {chat.length > 0 && (
              <button
                className="newchat-btn"
                onClick={startNewChat}
                disabled={loading}
              >
                ⟳ <span dir="auto">{t.newChat}</span>
              </button>
            )}
          </div>
        </header>

        {/* Source + language bar */}
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
            <span
              dir="auto"
              style={{ fontSize: "13.5px", color: "#44524a", fontWeight: 600 }}
            >
              {t.sourceLabel}
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
            <div
              style={{
                marginLeft: "auto",
                display: "flex",
                gap: "6px",
                alignItems: "center",
              }}
            >
              <button
                className={`lang-btn${lang === "en" ? " active" : ""}`}
                onClick={() => pickLang("en")}
              >
                English
              </button>
              <button
                className={`lang-btn${lang === "roman" ? " active" : ""}`}
                onClick={() => pickLang("roman")}
              >
                Roman Urdu
              </button>
              <button
                className={`lang-btn${lang === "ur" ? " active" : ""}`}
                onClick={() => pickLang("ur")}
              >
                اردو
              </button>
            </div>
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
                  dir="auto"
                  style={{
                    margin: "0 0 8px",
                    fontSize: "26px",
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    color: GREEN_DARK,
                  }}
                >
                  {t.welcomeTitle}
                </h2>
                <p
                  dir="auto"
                  style={{
                    margin: "0 auto 26px",
                    maxWidth: "520px",
                    fontSize: "15px",
                    lineHeight: 1.6,
                    color: "#4a584e",
                  }}
                >
                  {t.welcomeText}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    justifyContent: "center",
                  }}
                >
                  {t.chips.map((s) => (
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
            <div
              style={{ display: "flex", gap: "10px", alignItems: "flex-end" }}
            >
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
                placeholder={t.placeholder}
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
              dir="auto"
              style={{
                margin: "9px 2px 3px",
                fontSize: "12px",
                color: "#7a877c",
                textAlign: "center",
              }}
            >
              {t.disclaimer}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
