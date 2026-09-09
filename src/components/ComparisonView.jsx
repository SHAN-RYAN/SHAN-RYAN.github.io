import { useLang } from "../contexts/LangContext";
import { zh, en } from "../i18n/translations";

function renderHighlights(text, maxLen = 200) {
  if (!text) return null;
  const clean = text.replace(/###\s|##\s|\*\*/g, "").replace(/---/g, "");
  const snippet = clean.length > maxLen ? clean.slice(0, maxLen) + "..." : clean;
  return snippet;
}

export default function ComparisonView({ readings, onClose }) {
  const { lang } = useLang();
  const t = lang === "zh" ? zh : en;

  if (!readings || readings.length < 2) {
    return (
      <div style={{ maxWidth: 700, margin: "40px auto", textAlign: "center", padding: "0 20px" }}>
        <h2 style={{
          fontFamily: "'Georgia', serif", fontSize: 24, color: "#e8dcc8",
          fontWeight: 400, margin: "0 0 20px",
        }}>
          {t.comparisonTitle}
        </h2>
        <p style={{ color: "rgba(200,180,160,0.5)", fontSize: 14 }}>
          {t.comparisonEmpty}
        </p>
        <button onClick={onClose} style={{
          marginTop: 24, padding: "10px 28px", borderRadius: 8,
          background: "transparent", border: "1px solid rgba(200,160,100,0.3)",
          color: "#c9a96e", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>
          {t.back}
        </button>
      </div>
    );
  }

  const spreadsDiffer = new Set(readings.map((r) => r.spread_id)).size > 1;

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "20px 16px 40px" }}>
      <h2 style={{
        fontFamily: "'Georgia', serif", fontSize: 24, color: "#e8dcc8",
        textAlign: "center", fontWeight: 400, letterSpacing: "0.1em",
        margin: "0 0 8px",
      }}>
        {t.comparisonTitle}
      </h2>
      <p style={{
        textAlign: "center", color: "rgba(200,180,160,0.5)", fontSize: 14, margin: "0 0 28px",
      }}>
        {readings[0]?.question ? `"${readings[0].question}"` : ""}
      </p>

      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${Math.min(readings.length, 3)}, 1fr)`,
        gap: 20,
      }}>
        {readings.slice(0, 3).map((reading, idx) => {
          const dateStr = reading.createdAt
            ? new Date(reading.createdAt).toLocaleDateString("zh-CN", {
                month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
              })
            : "";

          return (
            <div key={reading.id || idx} style={{
              background: "linear-gradient(135deg, rgba(200,160,100,0.04), rgba(180,140,200,0.03))",
              border: "1px solid rgba(200,160,100,0.12)",
              borderRadius: 14, padding: 20,
            }}>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(200,180,160,0.4)", marginBottom: 2 }}>
                  {t.comparisonDate}
                </div>
                <div style={{ fontSize: 14, color: "#e8dcc8" }}>{dateStr}</div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(200,180,160,0.4)", marginBottom: 2 }}>
                  {t.comparisonSpread}
                </div>
                <div style={{ fontSize: 14, color: "#c9a96e" }}>
                  {lang === "en" && reading.spread_name?.includes?.(" ") ? reading.spread_name : reading.spread_name}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: "rgba(200,180,160,0.4)", marginBottom: 4 }}>
                  {t.comparisonCards}
                </div>
                {reading.cards?.slice(0, 4).map((card, ci) => (
                  <div key={ci} style={{
                    fontSize: 12, color: "rgba(200,180,160,0.7)",
                    marginBottom: 2, lineHeight: 1.5,
                  }}>
                    {card.position}: {card.nameZh}
                    {card.isReversed ? (
                      <span style={{
                        marginLeft: 4, padding: "0 4px", borderRadius: 3,
                        background: "#6b3420", color: "#e8dcc8", fontSize: 10,
                      }}>{t.reversedShort}</span>
                    ) : null}
                  </div>
                ))}
              </div>

              <div>
                <div style={{ fontSize: 11, color: "rgba(200,180,160,0.4)", marginBottom: 4 }}>
                  {t.comparisonHighlights}
                </div>
                <div style={{
                  fontSize: 12, color: "rgba(200,180,160,0.6)", lineHeight: 1.7,
                }}>
                  {renderHighlights(reading.interpretation_text)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 解释为什么不同 */}
      <div style={{
        marginTop: 32, padding: "20px 24px",
        background: "rgba(200,160,100,0.03)",
        border: "1px solid rgba(200,160,100,0.08)",
        borderRadius: 12,
      }}>
        <h4 style={{
          fontSize: 14, color: "#c9a96e", margin: "0 0 12px", fontWeight: 500,
        }}>
          {t.comparisonWhy}
        </h4>
        {spreadsDiffer && (
          <p style={{
            fontSize: 13, color: "rgba(200,180,160,0.55)", lineHeight: 1.8, margin: "0 0 10px",
          }}>
            {t.comparisonExplainDiffSpread}
          </p>
        )}
        <p style={{
          fontSize: 13, color: "rgba(200,180,160,0.55)", lineHeight: 1.8, margin: 0,
        }}>
          {t.comparisonExplainDiffCards}
        </p>
      </div>

      <div style={{ textAlign: "center", marginTop: 28 }}>
        <button onClick={onClose} style={{
          padding: "10px 28px", borderRadius: 8,
          background: "transparent", border: "1px solid rgba(200,160,100,0.3)",
          color: "#c9a96e", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
        }}>
          {t.back}
        </button>
      </div>

      <style>{`
        @media (max-width: 700px) {
          .comp-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
