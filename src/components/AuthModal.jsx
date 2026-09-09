import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import { zh, en } from "../i18n/translations";

export default function AuthModal({ onClose }) {
  const { register, login, loading, error, clearError } = useAuth();
  const { lang } = useLang();
  const t = lang === "zh" ? zh : en;
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const name = nickname.trim();
    if (!name || !password) return;

    if (!isLogin && password !== confirmPassword) return;

    try {
      if (isLogin) {
        await login(name, password);
      } else {
        await register(name, password);
      }
      onClose();
    } catch {
      // error is set in AuthContext
    }
  }

  function toggleMode() {
    setIsLogin(!isLogin);
    setConfirmPassword("");
    clearError();
  }

  return createPortal(
    <div className="auth-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="auth-modal">
        <button className="auth-close" onClick={onClose}>✕</button>

        <h2 className="auth-title">{isLogin ? t.login : t.register}</h2>
        <p className="auth-sub">账户数据通过本地后端同步，多设备可共享同一账号</p>

        <form onSubmit={handleSubmit}>
          <input
            className="auth-input"
            type="text"
            value={nickname}
            onChange={(e) => { setNickname(e.target.value); clearError(); }}
            placeholder={t.nickname}
            maxLength={20}
            autoFocus
          />

          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(e) => { setPassword(e.target.value); clearError(); }}
            placeholder={t.passwordPlaceholder}
            maxLength={50}
            style={{ marginBottom: isLogin ? 20 : 8 }}
          />

          {!isLogin && (
            <input
              className="auth-input"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder={t.confirmPassword}
              maxLength={50}
            />
          )}

          {!isLogin && password && confirmPassword && password !== confirmPassword && (
            <p style={{ color: "#d48060", fontSize: 12, textAlign: "center", margin: "0 0 8px" }}>
              {t.passwordMismatch}
            </p>
          )}

          {error && (
            <p style={{ color: "#d48060", fontSize: 12, textAlign: "center", margin: "0 0 8px" }}>
              {error}
            </p>
          )}

          <button
            className="auth-submit"
            type="submit"
            disabled={!nickname.trim() || !password || loading}
          >
            {loading ? (isLogin ? t.loggingIn : t.registering) : (isLogin ? t.enter : t.register)}
          </button>
        </form>

        <button className="auth-toggle" type="button" onClick={toggleMode} disabled={loading}>
          {isLogin ? t.registerBtn : t.loginBtn}
        </button>

        <button className="auth-skip" type="button" onClick={onClose} disabled={loading}>
          {t.skipLogin}
        </button>
      </div>

      <style>{`
        .auth-overlay {
          position: fixed; inset: 0; z-index: 9999;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(6px);
        }
        .auth-modal {
          position: fixed;
          top: 50%; left: 50%;
          transform: translate(-50%, -50%);
          width: calc(100vw - 48px); max-width: 380px; max-height: 85vh;
          overflow-y: auto;
          background: #1a1a24;
          border: 1px solid rgba(200,160,100,0.2);
          border-radius: 16px;
          padding: 28px 24px 24px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: authFadeIn 0.2s ease;
          z-index: 10000;
        }
        @keyframes authFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) translateY(-10px); }
          to { opacity: 1; transform: translate(-50%, -50%) translateY(0); }
        }
        .auth-close {
          position: absolute; top: 10px; right: 14px;
          background: none; border: none;
          color: rgba(200,180,160,0.4);
          font-size: 22px; cursor: pointer;
          line-height: 1; padding: 4px;
        }
        .auth-close:hover { color: rgba(200,180,160,0.8); }
        .auth-title {
          font-family: 'Georgia', serif;
          font-size: 22px; color: #e8dcc8;
          text-align: center; margin: 0 0 4px;
          font-weight: 400; letter-spacing: 0.08em;
        }
        .auth-sub {
          text-align: center; color: rgba(200,180,160,0.4);
          font-size: 13px; margin: 0 0 18px;
        }
        .auth-input {
          width: 100%; padding: 14px 16px;
          margin-bottom: 12px; border-radius: 10px;
          background: rgba(0,0,0,0.3);
          border: 2px solid rgba(200,160,100,0.15);
          color: #e8dcc8; font-size: 17px;
          outline: none; font-family: inherit;
          box-sizing: border-box; text-align: center;
          -webkit-appearance: none;
        }
        .auth-input:focus { border-color: rgba(200,160,100,0.5); background: rgba(0,0,0,0.4); }
        .auth-submit {
          width: 100%; padding: 14px;
          border: 2px solid #c9a96e; border-radius: 10px;
          background: transparent; color: #c9a96e;
          font-size: 17px; cursor: pointer;
          font-family: inherit; letter-spacing: 0.08em;
          transition: all 0.2s; margin-bottom: 8px;
        }
        .auth-submit:hover:not(:disabled) { background: #c9a96e; color: #0a0a14; }
        .auth-submit:disabled { opacity: 0.25; cursor: default; }
        .auth-toggle {
          width: 100%; padding: 8px;
          background: none; border: none;
          color: rgba(200,180,160,0.5); font-size: 14px;
          cursor: pointer; font-family: inherit;
          transition: color 0.2s; margin-bottom: 2px;
        }
        .auth-toggle:hover { color: rgba(200,180,160,0.9); }
        .auth-skip {
          width: 100%; padding: 8px;
          background: none; border: none;
          color: rgba(200,180,160,0.3); font-size: 13px;
          cursor: pointer; font-family: inherit;
          transition: color 0.2s;
        }
        .auth-skip:hover { color: rgba(200,180,160,0.7); }
      `}</style>
    </div>,
    document.body
  );
}
