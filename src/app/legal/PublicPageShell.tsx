import { ReactNode } from "react";
import { Link } from "react-router-dom";
// `cl-policy-content` (the rich-text rules the policy body and these pages'
// prose use) lives here. Imported by the shell rather than by each page: this
// component is the common ancestor of all four, and the codebase's convention
// is that whoever needs a class from this sheet imports it - see the call
// windows and Conversation.
import "../../styles/styles.css";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import ChatterLoopDarkImg from "../../assets/imgs/chatterloop-dark.png";
import { useTheme } from "@/reusables/design";

/**
 * Chrome for the PUBLIC, logged-out pages the app stores require us to host at
 * a stable URL: the privacy policy and terms (Play's Privacy Policy field, the
 * App Store Connect record), the account-deletion page (Play requires a web URL
 * for deletion requests alongside the in-app path), and support (Apple
 * guideline 1.2 wants a published way to contact us about user-generated
 * content).
 *
 * These pages live OUTSIDE the app shell on purpose. A reviewer opens them in a
 * clean browser with no session, so anything that reads authentication - the
 * gate in App.tsx, Home's layout, the SSE stream - must not be in the way. They
 * are registered above App.tsx's `/*` catch-all for exactly that reason; below
 * it they would redirect to /login and fail review.
 *
 * The theme is read but not toggled: there is no header control here, and these
 * pages should look like whatever the visitor last chose in the app rather than
 * flipping to a default of their own.
 */
function PublicPageShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { theme } = useTheme();
  const logo = theme === "dark" ? ChatterLoopDarkImg : ChatterLoopImg;

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        background: "var(--bg)",
        color: "var(--text)",
        // Column flex so <main> can absorb the slack and hold the footer against
        // the bottom of a SHORT page - /support and an unavailable policy are
        // both well under a screenful, and as a plain block scroller the footer
        // simply ended wherever the text did, with dead background under it.
        // Not `position: fixed` on the footer: the policy pages run to several
        // screens, and a pinned footer would sit on top of them.
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 2,
          // Never absorb or give up height - it is the fixed band at the top,
          // and the default `flex-shrink: 1` would squeeze it once the content
          // below overflows.
          flex: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          padding: "12px 20px",
          background: "var(--surface)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            textDecoration: "none",
            color: "var(--text)",
          }}
        >
          <img
            src={logo}
            alt="Chatterloop"
            style={{ width: 30, height: 30, objectFit: "contain" }}
          />
          <span style={{ fontWeight: 800, letterSpacing: "-0.02em" }}>
            Chatterloop
          </span>
        </Link>
        <Link
          to="/"
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--brand)",
            textDecoration: "none",
          }}
        >
          Open the app
        </Link>
      </header>

      <main
        style={{
          // grow 1 / shrink 0 / basis auto: fills whatever the header and footer
          // leave over on a short page, and is never compressed below its own
          // content on a long one - the container scrolls instead.
          flex: "1 0 auto",
          width: "100%",
          maxWidth: 860,
          // Still centred: auto side margins win over the column's cross-axis
          // stretch.
          margin: "0 auto",
          padding: "28px 20px 56px",
          textAlign: "left",
        }}
      >
        <h1
          style={{
            fontSize: 28,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            margin: "0 0 6px",
          }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            style={{
              margin: "0 0 24px",
              fontSize: 14,
              color: "var(--text-2)",
              lineHeight: 1.6,
            }}
          >
            {subtitle}
          </p>
        )}
        {children}
      </main>

      {/* Cross-links, so a reviewer who lands on any one of these can reach the
          rest without being handed four separate URLs. */}
      <footer
        style={{
          // Same reason as the header: it is sized by its content, not by what
          // is left over.
          flex: "none",
          borderTop: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "18px 20px 26px",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 860,
            margin: "0 auto",
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "10px 18px",
            fontSize: 13,
          }}
        >
          {[
            { to: "/privacy", label: "Privacy Policy" },
            { to: "/terms", label: "Terms and Conditions" },
            { to: "/delete-account", label: "Delete your account" },
            { to: "/support", label: "Support" },
          ].map((link) => (
            <Link
              key={link.to}
              to={link.to}
              style={{ color: "var(--text-2)", textDecoration: "none" }}
            >
              {link.label}
            </Link>
          ))}
          <span style={{ color: "var(--text-3)", marginLeft: "auto" }}>
            © {new Date().getFullYear()} Chatterloop
          </span>
        </div>
      </footer>
    </div>
  );
}

export default PublicPageShell;
