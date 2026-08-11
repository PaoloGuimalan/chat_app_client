import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DOMPurify from "dompurify";
import { GetCurrentPoliciesRequest } from "@/reusables/hooks/requests";
import PublicPageShell from "./PublicPageShell";

/**
 * The privacy policy and the terms, as PUBLIC pages at stable URLs.
 *
 * Same source as the signup/setup modal - `/api/user/policies`, which is
 * AllowAny server side - and the same `cl-policy-content` styling and DOMPurify
 * pass. Deliberately a separate component rather than a change to
 * DocumentViewerModal: that modal is part of the consent flow, where the
 * document is something you agree to inside a dialog. This is a document you
 * link to from a store listing. Sharing the fetch is the right amount of
 * sharing; sharing the component would put a store requirement and a signup
 * step in the same file.
 *
 * One page, two documents, chosen by `documentType` - they are the same shape
 * and the same fetch, so two files would be one file and a copy of it.
 */
function PolicyPage({ documentType }: { documentType: "privacy" | "terms" }) {
  const title =
    documentType === "privacy" ? "Privacy Policy" : "Terms and Conditions";

  const [content, setcontent] = useState<string>("");
  const [documentUrl, setdocumentUrl] = useState<string>("");
  const [effectiveDate, seteffectiveDate] = useState<string>("");
  const [version, setversion] = useState<string>("");
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  useEffect(() => {
    document.title = `${title} · Chatterloop`;
  }, [title]);

  useEffect(() => {
    let cancelled = false;

    setisLoaded(false);
    GetCurrentPoliciesRequest()
      .then((docs) => {
        if (cancelled) return;
        const doc = docs.find((d) => d.document_type === documentType);
        setcontent(doc?.content ?? "");
        setdocumentUrl(doc?.document_url ?? "");
        seteffectiveDate(doc?.effective_date ?? "");
        setversion(doc?.version ?? "");
        setisLoaded(true);
      })
      .catch((err) => {
        if (cancelled) return;
        // An unreachable policy service must not leave a store reviewer on a
        // spinner - the fallback below says so and offers the support page.
        console.log(err);
        setisLoaded(true);
      });

    return () => {
      cancelled = true;
    };
  }, [documentType]);

  const safeContent = useMemo(
    () => (content.trim().length > 0 ? DOMPurify.sanitize(content) : ""),
    [content],
  );

  const hasContent = safeContent.length > 0;
  const hasUrl = documentUrl.trim().length > 0;

  const effectiveLabel = useMemo(() => {
    if (!effectiveDate) return "";
    const parsed = new Date(effectiveDate);
    if (Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [effectiveDate]);

  const subtitleParts = [
    version ? `Version ${version}` : "",
    effectiveLabel ? `Effective ${effectiveLabel}` : "",
  ].filter(Boolean);

  return (
    <PublicPageShell
      title={title}
      subtitle={isLoaded && subtitleParts.length > 0 ? subtitleParts.join(" · ") : undefined}
    >
      {!isLoaded ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "60px 0",
          }}
        >
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <AiOutlineLoading3Quarters
              style={{ fontSize: "28px", color: "var(--text-2)" }}
            />
          </motion.div>
        </div>
      ) : hasContent ? (
        <div
          // cl-public-doc: makes links inside the document actually look like
          // links here - see the rule in styles.css. The modal keeps the plain
          // cl-policy-content it has always had.
          className="cl-public-doc cl-policy-content"
          dangerouslySetInnerHTML={{ __html: safeContent }}
        />
      ) : hasUrl ? (
        // An externally hosted document (e.g. a PDF). Linked rather than framed:
        // this page IS the canonical URL now, and an iframe that a browser
        // refuses to render would look like the policy is missing.
        <p style={{ fontSize: 14, lineHeight: 1.6 }}>
          This document is hosted separately.{" "}
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "var(--brand)" }}
          >
            Open the {title.toLowerCase()}
          </a>
          .
        </p>
      ) : (
        <p style={{ fontSize: 14, lineHeight: 1.6, color: "var(--text-2)" }}>
          This document is currently unavailable. Please try again later, or
          contact us at{" "}
          <a
            href="mailto:support@chatterloop.app"
            style={{ color: "var(--brand)" }}
          >
            support@chatterloop.app
          </a>
          .
        </p>
      )}
    </PublicPageShell>
  );
}

export default PolicyPage;
