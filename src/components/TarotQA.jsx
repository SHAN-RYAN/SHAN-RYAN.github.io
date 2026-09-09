import { apiFetch } from "../lib/api";
import { useState, useRef } from "react";
import { useLang } from "../contexts/LangContext";
import { zh, en } from "../i18n/translations";

export default function TarotQA() {
  const { lang } = useLang();
  const t = lang === "zh" ? zh : en;
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [streamingText, setStreamingText] = useState("");
  const messagesEndRef = useRef(null);
  const streamTextRef = useRef("");
  const rafRef = useRef(null);
  const abortRef = useRef(null);

  const handleSubmit = async () => {
    const q = input.trim();
    if (!q || isLoading) return;

    const userMsg = { role: "user", content: q, timestamp: new Date().toISOString() };
    const newHistory = [...history, userMsg];
    setHistory(newHistory);
    setInput("");
    setIsLoading(true);
    setStreamingText("");

    const controller = new AbortController();
    abortRef.current = controller;
    streamTextRef.current = "";

    try {
      const res = await apiFetch("/api/tarot_ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data === "[DONE]") continue;
            try {
              const parsed = JSON.parse(data);
              if (parsed.text) {
                streamTextRef.current += parsed.text;
                if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(() => {
                    setStreamingText(streamTextRef.current);
                    rafRef.current = null;
                  });
                }
              }
            } catch { /* skip */ }
          }
        }
      }

      const finalText = streamTextRef.current;
      setHistory([...newHistory, { role: "assistant", content: finalText, timestamp: new Date().toISOString() }]);
    } catch (err) {
      if (err.name !== "AbortError") {
        setHistory([...newHistory, { role: "assistant", content: t.followUpError, timestamp: new Date().toISOString() }]);
      }
    } finally {
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setIsLoading(false);
      setStreamingText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const accent = "#c9a96e";

  return (
    <div className="tarot-qa-section">
      <div className="tarot-qa-header">
        <span className="tarot-qa-icon">📖</span>
        <span>塔罗牌义问答</span>
      </div>
      <p className="tarot-qa-hint">
        问任何塔罗牌的问题——牌义、牌阵、符号象征、组合解读。不限当前占卜。
      </p>

      {history.length > 0 && (
        <div className="tarot-qa-thread">
          {history.map((msg, i) => (
            <div key={i} className={`tarot-qa-msg ${msg.role}`}>
              <div className="tarot-qa-msg-role">
                {msg.role === "user" ? t.you : "🔮 解读者"}
              </div>
              <div className="tarot-qa-msg-content">
                {msg.content.split("\n").map((line, j) =>
                  line.trim() === "" ? <br key={j} /> : <p key={j}>{line}</p>
                )}
              </div>
            </div>
          ))}

          {isLoading && streamingText && (
            <div className="tarot-qa-msg assistant">
              <div className="tarot-qa-msg-role">🔮 解读者</div>
              <div className="tarot-qa-msg-content streaming">
                {streamingText.split("\n").map((line, j) =>
                  line.trim() === "" ? <br key={j} /> : <p key={j}>{line}</p>
                )}
                <span className="tarot-qa-cursor" />
              </div>
            </div>
          )}

          {isLoading && !streamingText && (
            <div className="tarot-qa-msg assistant">
              <div className="tarot-qa-msg-role">🔮 解读者</div>
              <div className="tarot-qa-msg-content">
                <span className="tarot-qa-loading-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      )}

      <div className="tarot-qa-input-area">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="比如：死神逆位是什么意思？权杖骑士配圣杯王后怎么解？"
          rows={2}
          disabled={isLoading}
        />
        <button
          onClick={handleSubmit}
          disabled={isLoading || !input.trim()}
          className="tarot-qa-send-btn"
        >
          {t.send}
        </button>
      </div>

      <style>{`
        .tarot-qa-section {
          margin-top: 32px; padding: 20px 24px;
          background: linear-gradient(135deg, rgba(180,140,200,0.04), rgba(200,160,100,0.03));
          border: 1px solid rgba(200,160,100,0.12); border-radius: 14px;
        }
        .tarot-qa-header {
          font-size: 16px; color: #c9a96e; margin-bottom: 6px;
          display: flex; align-items: center; gap: 8px;
          font-family: 'Georgia', serif; letter-spacing: 0.05em;
        }
        .tarot-qa-icon { font-size: 18px; }
        .tarot-qa-hint {
          font-size: 13px; color: rgba(200,180,160,0.4); margin: 0 0 16px; line-height: 1.6;
        }
        .tarot-qa-thread {
          display: flex; flex-direction: column; gap: 14px; margin-bottom: 18px;
        }
        .tarot-qa-msg { max-width: 90%; }
        .tarot-qa-msg.user { align-self: flex-end; }
        .tarot-qa-msg.assistant { align-self: flex-start; }
        .tarot-qa-msg-role {
          font-size: 11px; color: ${accent}88; margin-bottom: 4px; letter-spacing: 0.08em;
        }
        .tarot-qa-msg.user .tarot-qa-msg-role { text-align: right; }
        .tarot-qa-msg-content {
          padding: 10px 14px; border-radius: 10px; font-size: 14px;
          line-height: 1.8; color: rgba(220,210,190,0.85);
        }
        .tarot-qa-msg.user .tarot-qa-msg-content {
          background: ${accent}18; border: 1px solid ${accent}25;
          border-bottom-right-radius: 4px;
        }
        .tarot-qa-msg.assistant .tarot-qa-msg-content {
          background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.06);
          border-bottom-left-radius: 4px;
        }
        .tarot-qa-msg-content p { margin: 0 0 4px; }
        .tarot-qa-msg-content.streaming { border-color: ${accent}30; }
        .tarot-qa-cursor {
          display: inline-block; width: 6px; height: 14px; background: ${accent};
          margin-left: 2px; animation: blink 0.8s infinite; vertical-align: middle;
        }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        .tarot-qa-loading-dots span {
          animation: dotBounce 1.2s infinite; font-size: 20px; color: ${accent}88;
        }
        .tarot-qa-loading-dots span:nth-child(2) { animation-delay: 0.2s; }
        .tarot-qa-loading-dots span:nth-child(3) { animation-delay: 0.4s; }
        @keyframes dotBounce { 0%,100% { opacity: 0.2; } 50% { opacity: 1; } }
        .tarot-qa-input-area {
          display: flex; gap: 10px; align-items: flex-end;
        }
        .tarot-qa-input-area textarea {
          flex: 1; padding: 10px 14px; border-radius: 10px;
          background: rgba(0,0,0,0.25); border: 1px solid ${accent}25;
          color: #e8dcc8; font-size: 14px; font-family: inherit;
          resize: none; outline: none; line-height: 1.5;
          transition: border-color 0.2s;
        }
        .tarot-qa-input-area textarea:focus { border-color: ${accent}60; }
        .tarot-qa-input-area textarea:disabled { opacity: 0.5; }
        .tarot-qa-send-btn {
          padding: 10px 20px; border: 1px solid ${accent}50;
          border-radius: 10px; background: transparent; color: ${accent};
          font-size: 14px; cursor: pointer; letter-spacing: 0.05em;
          transition: all 0.2s; white-space: nowrap;
        }
        .tarot-qa-send-btn:hover:not(:disabled) { background: ${accent}18; }
        .tarot-qa-send-btn:disabled { opacity: 0.35; cursor: default; }
      `}</style>
    </div>
  );
}
