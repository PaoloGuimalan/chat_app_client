import { useEffect } from "react";
import { Link } from "react-router-dom";
import PublicPageShell from "./PublicPageShell";

const SUPPORT_EMAIL = "support@chatterloop.app";

/**
 * The public support page.
 *
 * Apple's guideline 1.2 (user-generated content) requires a published means of
 * contacting the developer, alongside the report and block mechanisms - both of
 * which exist in-app, on the profile screen of the person concerned (webapp
 * Profile.tsx, and the app's user_profile_view). This page publishes the
 * contact route and points at the other two, so a reviewer can verify all three
 * from one URL.
 *
 * A mailto rather than a form: the address has to be one that demonstrably
 * receives mail, and a form would need a backend endpoint that does not exist
 * yet - a broken form is worse than no form for exactly the audience this page
 * is for.
 */
function Support() {
  useEffect(() => {
    document.title = "Support · Chatterloop";
  }, []);

  return (
    <PublicPageShell
      title="Support"
      subtitle="Questions, bug reports, account problems, and reports about content or behaviour on Chatterloop."
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 10,
          padding: "18px 20px",
          borderRadius: "var(--r-md)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
          marginBottom: 26,
        }}
      >
        <span style={{ fontSize: 13, color: "var(--text-2)", fontWeight: 600 }}>
          Contact us
        </span>
        <a
          href={`mailto:${SUPPORT_EMAIL}`}
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: "var(--brand)",
            textDecoration: "none",
            wordBreak: "break-all",
          }}
        >
          {SUPPORT_EMAIL}
        </a>
        <span style={{ fontSize: 13, color: "var(--text-2)", lineHeight: 1.6 }}>
          We read every message and aim to reply within a few days.
        </span>
      </div>

      <div className="cl-public-doc cl-policy-content">
        <h2>Reporting content or someone&apos;s behaviour</h2>
        <p>
          Open the profile of the account concerned and use the menu in the top
          corner — <strong>Report</strong> sends it to us for review, and{" "}
          <strong>Block</strong> stops them contacting you or seeing your
          content. Both are available in the mobile app and on the web app.
        </p>
        <p>
          If something is urgent, or you cannot reach the profile, email{" "}
          <a href={`mailto:${SUPPORT_EMAIL}?subject=Urgent%20content%20report`}>
            {SUPPORT_EMAIL}
          </a>{" "}
          with a description and, if you have them, links or screenshots.
        </p>

        <h2>Accounts you have blocked</h2>
        <p>
          You can review and undo blocks under <strong>Settings</strong> →{" "}
          <strong>Blocked accounts</strong>.
        </p>

        <h2>Account and data requests</h2>
        <p>
          To download a copy of your data or delete your account, see{" "}
          {/* Link, not a bare <a>: a raw href reloads the whole SPA to reach a
              sibling route that is already in the bundle. */}
          <Link to="/delete-account">Delete your account</Link>, or write to us
          at the address above.
        </p>

        <h2>Trouble signing in</h2>
        <p>
          If you cannot sign in or did not receive a verification email, email
          us from the address on the account and we will help sort it out.
        </p>
      </div>
    </PublicPageShell>
  );
}

export default Support;

