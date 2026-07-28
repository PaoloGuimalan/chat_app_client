/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { IoClose } from "react-icons/io5";
import { FiExternalLink } from "react-icons/fi";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import DOMPurify from "dompurify";

/**
 * A self-contained modal that renders a policy/legal document in-place instead
 * of redirecting or opening a new tab. It renders, in order of preference:
 *   1. `content` — rich-text (HTML) stored in the DB, sanitized and shown inline.
 *      This is the primary source; policy documents live entirely in the DB.
 *   2. `url` — a fallback for an externally hosted document (e.g. a full
 *      cross-origin PDF URL), shown in an iframe.
 * If neither is available (e.g. the policies request failed), a short
 * "unavailable" message is shown instead of a broken frame.
 */
function DocumentViewerModal({
  url,
  content,
  title,
  onClose,
}: {
  url?: string;
  content?: string;
  title: string;
  onClose: () => void;
}) {
  const [isLoading, setisLoading] = useState<boolean>(true);

  const hasContent = !!content && content.trim().length > 0;
  const hasUrl = !!url && url.trim().length > 0;
  const safeContent = useMemo(
    () => (hasContent ? DOMPurify.sanitize(content as string) : ""),
    [content, hasContent],
  );

  // Close on Escape and lock background scroll while the modal is open.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="cl-modal-overlay tw-fixed tw-z-[60] tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-top-0 tw-left-0 tw-p-[10px]"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.18 }}
        onClick={(e) => e.stopPropagation()}
        className="tw-relative tw-flex tw-flex-col tw-w-full tw-max-w-[860px] tw-h-full tw-max-h-[90vh] tw-rounded-[12px] tw-overflow-hidden"
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {/* Header */}
        <div
          className="tw-flex tw-items-center tw-justify-between tw-gap-[10px] tw-px-[16px] tw-py-[12px]"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <span
            className="cl-text-section tw-font-Inter tw-font-semibold tw-truncate"
            style={{ color: "var(--text)" }}
          >
            {title}
          </span>
          <div className="tw-flex tw-items-center tw-gap-[6px]">
            {/* Only useful when the document is an external file/PDF, not inline text. */}
            {!hasContent && hasUrl && (
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                title="Open in new tab"
                className="tw-flex tw-items-center tw-justify-center tw-w-[34px] tw-h-[34px] tw-rounded-[8px]"
                style={{ color: "var(--text-2)" }}
              >
                <FiExternalLink style={{ fontSize: "18px" }} />
              </a>
            )}
            <button
              onClick={onClose}
              title="Close"
              className="tw-flex tw-items-center tw-justify-center tw-w-[34px] tw-h-[34px] tw-rounded-[8px]"
              style={{ color: "var(--text-2)" }}
            >
              <IoClose style={{ fontSize: "20px" }} />
            </button>
          </div>
        </div>

        {/* Body */}
        {hasContent ? (
          <div
            className="cl-policy-content scroller tw-flex-1 tw-w-full tw-overflow-y-auto tw-px-[20px] tw-py-[16px] tw-text-left"
            style={{ color: "var(--text)" }}
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />
        ) : hasUrl ? (
          <div className="tw-relative tw-flex-1 tw-w-full tw-bg-white">
            {isLoading && (
              <div
                className="tw-absolute tw-inset-0 tw-z-[2] tw-flex tw-items-center tw-justify-center"
                style={{ background: "var(--surface)" }}
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
            )}
            <iframe
              src={url}
              title={title}
              onLoad={() => setisLoading(false)}
              className="tw-w-full tw-h-full tw-border-0"
            />
          </div>
        ) : (
          <div
            className="tw-flex-1 tw-w-full tw-flex tw-items-center tw-justify-center tw-px-[24px] tw-text-center"
            style={{ color: "var(--text-2)" }}
          >
            <span className="cl-text-body">
              This document is currently unavailable. Please try again later.
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default DocumentViewerModal;
