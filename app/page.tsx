"use client";

import { useState } from "react";

export default function Home() {
  const [message, setMessage] = useState("");

  return (
    <main className="min-h-screen bg-[#f7f7f8] text-gray-900">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        <header className="border-b bg-white px-6 py-4">
          <h1 className="text-xl font-semibold">Islamic AI Chatbot</h1>
          <p className="text-sm text-gray-500">
            Ask questions about Islam with source-aware answers.
          </p>
        </header>

        <section className="flex flex-1 flex-col items-center justify-center px-6 py-12">
          <div className="w-full max-w-3xl">
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-semibold">
                How can I help you?
              </h2>
              <p className="mt-2 text-gray-500">
                Ask about Qur’an, Hadith, Fiqh, Seerah and Islamic scholarship.
              </p>
            </div>

            <div className="rounded-2xl border bg-white p-3 shadow-sm">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask an Islamic question..."
                className="min-h-32 w-full resize-none border-0 p-3 text-base outline-none"
              />

              <div className="flex items-center justify-between border-t pt-3">
                <select className="rounded-lg border px-3 py-2 text-sm">
                  <option>All Sources</option>
                  <option>Qur’an</option>
                  <option>Hadith</option>
                  <option>Hanafi</option>
                  <option>Maliki</option>
                  <option>Shafi‘i</option>
                  <option>Hanbali</option>
                  <option>Ja‘fari</option>
                  <option>Zaydi</option>
                  <option>Ismaili</option>
                  <option>Ahl-e-Hadith</option>
                  <option>Deobandi</option>
                  <option>Barelvi</option>
                  <option>Wahhabi / Najdi reform tradition</option>
                  <option>Ibadi</option>
                </select>

                <button
                  type="button"
                  className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white"
                >
                  Send
                </button>
              </div>
            </div>

            <p className="mt-4 text-center text-xs text-gray-400">
              Islamic information should be checked against reliable sources.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
