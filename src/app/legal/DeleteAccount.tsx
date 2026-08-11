import { useEffect } from "react";
import PublicPageShell from "./PublicPageShell";

const SUPPORT_EMAIL = "support@chatterloop.app";

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
  useEffect(() => {
    document.title = "Delete your account · Chatterloop";
  }, []);

  return (
    <PublicPageShell
      title="Delete your account"
      subtitle="How to permanently delete your Chatterloop account and erase the personal data attached to it."
    >
      <div
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 12px",
          borderRadius: "var(--r-sm)",
          background: "var(--gold-soft)",
          color: "var(--text)",
          fontSize: 13,
          fontWeight: 650,
          marginBottom: 22,
        }}
      >
        Web deletion form — coming soon
      </div>

      <div className="cl-public-doc cl-policy-content">
        <p>
          A self-serve deletion request form will live on this page. Until it is
          ready, you can delete your account in either of the ways below.
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

