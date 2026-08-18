import { useEffect, useState } from "react";
import PublicPageShell from "./PublicPageShell";
import {
  ConfirmAccountDeletion,
  LookupAccountForDeletion,
  RequestAccountDeletionCode,
} from "../../reusables/hooks/requests";
import { Avatar } from "@/reusables/design";

const SUPPORT_EMAIL = "support@chatterloop.app";

// Matches DeletionChallenge.RESEND_COOLDOWN on the server. Shown as a countdown
// so the button explains itself rather than just failing quietly.
const RESEND_SECONDS = 60;

type Step = "email" | "found" | "code" | "done";

type DeletableAccount = {
  username: string;
  first_name: string;
  last_name: string;
  profile: string;
  date_created: string;
};

const fieldStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 13px",
  borderRadius: "var(--r-sm)",
  border: "1px solid var(--border)",
  background: "var(--bg)",
  color: "var(--text)",
  fontSize: 15,
  outline: "none",
};

const primaryButton = (disabled: boolean, danger = false): React.CSSProperties => ({
  padding: "11px 18px",
  borderRadius: "var(--r-sm)",
  border: "none",
  background: danger ? "var(--danger, #c0392b)" : "var(--brand)",
  color: "#fff",
  fontSize: 14,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  opacity: disabled ? 0.55 : 1,
});

// The API writes a missing photo as one of these sentinels rather than null,
// and both are in use across the codebase - "none" for accounts, "N/A" for
// realms. Passing either through as a src would render a broken image.
const avatarSrc = (profile?: string | null) =>
  profile && profile !== "none" && profile !== "N/A" ? profile : null;

// Two words so Avatar's initials() yields two letters. Falls back to the
// username when the name fields are empty, so the circle is never blank.
const avatarName = (account: DeletableAccount | null) => {
  const full = [account?.first_name, account?.last_name]
    .filter((part) => part && part !== "N/A")
    .join(" ")
    .trim();
  return full || account?.username || "";
};

const linkButton: React.CSSProperties = {
  background: "none",
  border: "none",
  padding: 0,
  color: "var(--brand)",
  fontSize: 13,
  fontWeight: 600,
  cursor: "pointer",
};

/**
 * The public account-deletion page.
 *
 * Google Play requires apps that create accounts to offer deletion BOTH in the
 * app and at a web URL a reviewer can open while logged out. The in-app path
 * already exists on both clients (webapp Settings -> Data & Privacy, and the
 * app's data_privacy_view) - this page is the web half.
 *
 * PLACEHOLDER, deliberately: the self-serve web request form is not built yet,
 * so rather than describe a flow that does not exist, this states what IS
 * available today and marks the form as coming. Play accepts a page that
 * documents the routes to deletion; it does not require the form.
 *
 * What the copy says about scope is taken from the actual implementation
 * (user_service's user/utils/account_deletion.py), not from what deletion
 * usually means. That module anonymizes the account row in place rather than
 * hard-deleting it - most owned content references it with on_delete=DO_NOTHING,
 * so a hard delete would orphan other people's threads and realms - and the
 * page has to be honest about that, because it is the thing a privacy-minded
 * reader is checking for.
 */
function DeleteAccount() {
  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [account, setAccount] = useState<DeletableAccount | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    document.title = "Delete your account · Chatterloop";
  }, []);

  // Re-armed each tick rather than run once for the whole window: depending on
  // `cooldown > 0` would be a computed dependency eslint cannot check, and the
  // interval is cleared on the very next render, so the churn is one timer a
  // second for a minute.
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((n) => Math.max(0, n - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  const submitEmail = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    const result = await LookupAccountForDeletion(email.trim().toLowerCase());
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }

    if (!result.data?.found) {
      setError(
        result.data?.message ??
          "No account is registered to that email address.",
      );
      return;
    }

    setAccount(result.data.account ?? null);
    setStep("found");
  };

  const sendCode = async () => {
    setError("");
    setBusy(true);
    const result = await RequestAccountDeletionCode(email.trim().toLowerCase());
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setCooldown(RESEND_SECONDS);
    setStep("code");
  };

  const resend = async () => {
    if (cooldown > 0 || busy) return;
    setError("");
    setBusy(true);
    const result = await RequestAccountDeletionCode(email.trim().toLowerCase());
    setBusy(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setNotice(result.message);
    setCooldown(RESEND_SECONDS);
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setBusy(true);

    const result = await ConfirmAccountDeletion(
      email.trim().toLowerCase(),
      code.trim(),
    );
    setBusy(false);

    if (!result.ok) {
      setError(result.message);
      // 429 means the code was burned by too many wrong guesses - there is
      // nothing left to type, so drop back to the card and let them resend.
      if (result.status === 429) {
        setCode("");
        setStep("found");
        setCooldown(0);
      }
      return;
    }

    setStep("done");
  };

  const restart = () => {
    setStep("email");
    setCode("");
    setAccount(null);
    setError("");
    setNotice("");
    setCooldown(0);
  };

  return (
    <PublicPageShell
      title="Delete your account"
      subtitle="How to permanently delete your Chatterloop account and erase the personal data attached to it."
    >
      <div
        style={{
          border: "1px solid var(--border)",
          borderRadius: "var(--r-md, 10px)",
          background: "var(--surface)",
          padding: 20,
          marginBottom: 26,
        }}
      >
        {step === "email" && (
          <form onSubmit={submitEmail}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 750 }}>
              Request deletion
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-2)" }}>
              Enter the email address on the account and we&apos;ll find it.
              Nothing is deleted until you confirm with a code sent to that
              address.
            </p>
            <label
              htmlFor="cl-del-email"
              style={{ display: "block", fontSize: 13, fontWeight: 650, marginBottom: 6 }}
            >
              Email address
            </label>
            <input
              id="cl-del-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={fieldStyle}
            />
            <button
              type="submit"
              disabled={busy || !email.trim()}
              style={{ ...primaryButton(busy || !email.trim()), marginTop: 14 }}
            >
              {busy ? "Searching…" : "Find my account"}
            </button>
          </form>
        )}

        {step === "found" && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 750 }}>
              Account found
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-2)" }}>
              Check this is the right account. Deleting it cannot be undone.
            </p>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: "var(--r-sm)",
                background: "var(--bg)",
                border: "1px solid var(--border)",
                marginBottom: 18,
              }}
            >
              {/* The shared Avatar rather than a bare <img>: it falls back to
                  the person's initials on a gradient keyed off their id, and
                  swaps to that fallback again if the image 404s. Hand-rolling
                  the placeholder here would drift from every other avatar in
                  the app. */}
              <Avatar
                id={account?.username}
                name={avatarName(account)}
                src={avatarSrc(account?.profile)}
                size={44}
              />
              <div>
                <div style={{ fontWeight: 700 }}>
                  {account?.first_name} {account?.last_name}
                </div>
                <div style={{ fontSize: 13, color: "var(--text-2)" }}>
                  @{account?.username}
                </div>
              </div>
            </div>

            <div
              style={{ display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}
            >
              <button
                type="button"
                onClick={sendCode}
                disabled={busy}
                style={primaryButton(busy, true)}
              >
                {busy ? "Sending…" : "Delete this account"}
              </button>
              <button type="button" onClick={restart} style={linkButton}>
                Use a different email
              </button>
            </div>
          </div>
        )}

        {step === "code" && (
          <form onSubmit={submitCode}>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 750 }}>
              Enter your code
            </h2>
            <p style={{ margin: "0 0 16px", fontSize: 14, color: "var(--text-2)" }}>
              {notice} The code expires in 15 minutes. Entering it deletes the
              account immediately.
            </p>
            <label
              htmlFor="cl-del-code"
              style={{ display: "block", fontSize: 13, fontWeight: 650, marginBottom: 6 }}
            >
              Confirmation code
            </label>
            <input
              id="cl-del-code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="000000"
              style={{ ...fieldStyle, letterSpacing: "0.3em", fontSize: 18 }}
            />
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
                marginTop: 14,
              }}
            >
              <button
                type="submit"
                disabled={busy || code.length < 6}
                style={primaryButton(busy || code.length < 6, true)}
              >
                {busy ? "Deleting…" : "Confirm and delete"}
              </button>
              <button
                type="button"
                onClick={resend}
                disabled={cooldown > 0 || busy}
                style={{
                  ...linkButton,
                  color: cooldown > 0 ? "var(--text-3)" : "var(--brand)",
                  cursor: cooldown > 0 ? "default" : "pointer",
                }}
              >
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
              <button type="button" onClick={restart} style={linkButton}>
                Use a different email
              </button>
            </div>
          </form>
        )}

        {step === "done" && (
          <div>
            <h2 style={{ margin: "0 0 6px", fontSize: 17, fontWeight: 750 }}>
              Account deleted
            </h2>
            <p style={{ margin: 0, fontSize: 14, color: "var(--text-2)" }}>
              The account for <strong>{email}</strong> has been deleted and its
              personal details erased. You can close this page.
            </p>
          </div>
        )}

        {error && (
          <p
            role="alert"
            style={{
              margin: "14px 0 0",
              fontSize: 13,
              fontWeight: 600,
              color: "var(--danger, #c0392b)",
            }}
          >
            {error}
          </p>
        )}
      </div>

      <div className="cl-public-doc cl-policy-content">
        <p>
          You can also delete your account from inside Chatterloop, or ask us to
          do it for you.
        </p>

        <h2>Delete it yourself, in the app</h2>
        <p>
          Open Chatterloop, go to <strong>Settings</strong> →{" "}
          <strong>Data &amp; Privacy</strong> →{" "}
          <strong>Delete my account</strong>, then confirm. This works in the
          mobile app and on the web app, and takes effect immediately — you are
          signed out as soon as it completes.
        </p>

        <h2>Ask us to delete it</h2>
        <p>
          If you cannot sign in, email{" "}
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=Account%20deletion%20request`}
          >
            {SUPPORT_EMAIL}
          </a>{" "}
          from the address on the account, with the subject{" "}
          <em>Account deletion request</em>. We will confirm once it is done.
        </p>

        <h2>What gets erased</h2>
        <p>Deleting your account:</p>
        <ul>
          <li>
            removes your name, username, email address, password, birthdate,
            gender, profile photo and cover photo, replacing them with anonymous
            placeholders;
          </li>
          <li>deactivates the account, so it can no longer be signed in to;</li>
          <li>takes down your posts and comments;</li>
          <li>
            deletes your diary entries and their attachments, your reactions,
            saved posts and tags;
          </li>
          <li>
            removes you from every group, server and page, and drops your
            contacts, follows and pending invites;
          </li>
          <li>
            marks the messages you have sent as deleted, and clears your
            notifications and signed-in sessions.
          </li>
        </ul>

        <h2>What is kept, and why</h2>
        <p>
          The underlying account record is anonymized rather than removed
          outright. Other people&apos;s content — a group you created that they
          are still using, a thread they took part in — refers to that record,
          and deleting it outright would break their data, not just yours. What
          it holds after deletion is placeholder values, with nothing that
          identifies you.
        </p>
        <p>
          Some records may also persist briefly in backups before they age out,
          and anything we are required to keep for legal or safety reasons — for
          example an abuse report filed about the account — may be retained.
        </p>
        <p>
          Deletion is permanent. There is no way to restore an account or its
          content once it has been deleted.
        </p>

        <h2>Get a copy first, if you want one</h2>
        <p>
          You can download your data before deleting, under{" "}
          <strong>Settings</strong> → <strong>Data &amp; Privacy</strong> →{" "}
          <strong>Download my data</strong>. It includes your profile, posts,
          comments, diary entries, realm memberships, messages and consent
          history.
        </p>
      </div>
    </PublicPageShell>
  );
}

export default DeleteAccount;

