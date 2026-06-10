/* eslint-disable @typescript-eslint/no-explicit-any */
import { ReactNode } from "react";
import ChatterLoopLogo from "../../assets/imgs/chatterloop.png";
import { FiMoon, FiSun } from "react-icons/fi";

type AuthShellProps = {
  title: string;
  subtitle: string;
  theme?: string;
  onToggleTheme?: () => void;
  children: ReactNode;
};

function AuthShell({
  title,
  subtitle,
  theme,
  onToggleTheme,
  children,
}: AuthShellProps) {
  return (
    <div className="cl-auth-shell">
      <aside className="cl-auth-brand">
        <div className="cl-auth-brand-card cl-pop">
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 36 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: "rgba(255,255,255,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flex: "none",
              }}
            >
              <img
                src={ChatterLoopLogo}
                alt="ChatterLoop"
                style={{ width: 32, height: 32, filter: "brightness(0) invert(1)" }}
              />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.78 }}>ChatterLoop</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                Link · Share · Explore
              </div>
            </div>
          </div>

          <div style={{ maxWidth: 420 }}>
            <div style={{ fontSize: 42, fontWeight: 800, lineHeight: 1.08, letterSpacing: "-0.03em" }}>
              {title}
            </div>
            <div style={{ marginTop: 18, fontSize: 16, opacity: 0.88, fontWeight: 500 }}>
              {subtitle}
            </div>
          </div>

          <div style={{ display: "flex", gap: 26, marginTop: 34, flexWrap: "wrap" }}>
            {[
              ["12.4k", "people nearby"],
              ["live", "map sharing"],
              ["240+", "active loops"],
            ].map(([value, label]) => (
              <div key={label}>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{value}</div>
                <div style={{ fontSize: 12.5, opacity: 0.78 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </aside>

      <main className="cl-auth-form">
        {onToggleTheme ? (
          <button
            type="button"
            className="cl-shell-icon-btn"
            onClick={onToggleTheme}
            style={{ position: "absolute", top: 18, right: 18, zIndex: 2 }}
            title="Toggle theme"
          >
            {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        ) : null}

        <div className="cl-auth-form-card cl-pop">{children}</div>
      </main>
    </div>
  );
}

export default AuthShell;
