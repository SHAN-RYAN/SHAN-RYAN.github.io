import { useLang } from "../contexts/LangContext";
import { zh, en } from "../i18n/translations";

export default function SimilarQuestionModal({ matchedReading, onContinue, onViewLast, onCompare, onDismiss }) {
  const { lang } = useLang();
  const t = lang === "zh" ? zh : en;

  const dateStr = matchedReading?.createdAt
    ? new Date(matchedReading.createdAt).toLocaleDateString("zh-CN", {
        month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "";

  const cardNames = matchedReading?.cards
    ?.slice(0, 3)
    .map((c) => `${c.nameZh}${c.isReversed ? " 逆" : ""}`)
    .join(" · ") || "";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 2000,
      display: "flex", justifyContent: "center", alignItems: "center",
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
    }}>
      <div style={{
        background: "#1a1a2e", borderRadius: 16,
        border: "1px solid rgba(200,160,100,0.2)",
        padding: "32px 28px 24px",
        maxWidth: 420, width: "90%",
        boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 36, marginBottom: 16 }}>🃏</div>

        <h3 style={{
          fontFamily: "'Georgia', serif", fontSize: 16,
          color: "#c9a96e", margin: "0 0 16px", fontWeight: 400,
          lineHeight: 1.7,
        }}>
          {t.similarQuestionDetected}
        </h3>

        {matchedReading && (
          <div style={{
            marginBottom: 20, padding: "12px 16px",
            borderRadius: 8,
            background: "rgba(200,160,100,0.06)",
            border: "1px solid rgba(200,160,100,0.1)",
            fontSize: 13, color: "rgba(200,180,160,0.55)",
            lineHeight: 1.6,
          }}>
            <div style={{ marginBottom: 4 }}>
              {dateStr} · {lang === "en" && matchedReading.spread_name?.includes?.(" ") ? matchedReading.spread_name : matchedReading.spread_name}
            </div>
            {cardNames && <div style={{ color: "rgba(200,180,160,0.4)" }}>{cardNames}</div>}
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={onContinue} style={{
            padding: "12px 24px", borderRadius: 8,
            background: "transparent",
            border: "1px solid rgba(200,160,100,0.4)",
            color: "#c9a96e", fontSize: 15, cursor: "pointer",
            fontFamily: "inherit", letterSpacing: "0.05em",
          }}>
            {t.similarQuestionContinue}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={onViewLast} style={{
              flex: 1, padding: "10px 16px", borderRadius: 8,
              background: "rgba(200,180,160,0.05)",
              border: "1px solid rgba(200,180,160,0.15)",
              color: "rgba(200,180,160,0.7)", fontSize: 14, cursor: "pointer",
              fontFamily: "inherit",
            }}>
              {t.similarQuestionViewLast}
            </button>
            <button onClick={onCompare} style={{
              flex: 1, padding: "10px 16px", borderRadius: 8,
              background: "rgba(200,180,160,0.05)",
              border: "1px solid rgba(200,180,160,0.15)",
              color: "rgba(200,180,160,0.7)", fontSize: 14, cursor: "pointer",
              fontFamily: "inherit",
            }}>
              {t.comparisonView}
            </button>
          </div>
        </div>

        <button onClick={onDismiss} style={{
          marginTop: 16,
          background: "transparent", border: "none",
          color: "rgba(200,180,160,0.3)", fontSize: 12, cursor: "pointer",
          fontFamily: "inherit",
        }}>
          {t.similarQuestionDismiss}
        </button>
      </div>
    </div>
  );
}
