import { useEffect, useRef, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import Modal from "@/app/reusables/Modal";
import "./postEdit.css";

export default function PostEditLayout({ title, onClose, children, footer, asPage = false, audience = false }: {
  title: string; onClose: () => void; children: ReactNode; footer?: ReactNode;
  asPage?: boolean; audience?: boolean;
}) {
  const shell = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  close.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    shell.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); close.current(); }
      if (event.key !== "Tab") return;
      const controls = [...(shell.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), textarea:not(:disabled), input:not(:disabled), [tabindex="0"]',
      ) || [])].filter(element => element.getClientRects().length);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) return;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === shell.current)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === shell.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.body.style.overflow = overflow;
      if (previous?.isConnected) previous.focus();
    };
  }, []);
  return <Modal component={<div className={`cl-post-edit-stage ${asPage ? "cl-post-edit-stage--page" : ""} ${audience ? "cl-post-edit-stage--audience" : ""}`}
    onMouseDown={event => { if (event.target === event.currentTarget) close.current(); }}>
    <div ref={shell} tabIndex={-1} className="cl-post-edit" role="dialog" aria-modal="true" aria-label={title}>
      <header className="cl-post-edit__header">
        {asPage && <button type="button" className="cl-post-edit__icon" onClick={onClose} aria-label="Back"><ArrowLeft size={20}/></button>}
        <h1>{title}</h1>
        {!asPage && <button type="button" className="cl-post-edit__icon" onClick={onClose} aria-label="Close"><X size={20}/></button>}
      </header>
      <div className="cl-post-edit__body">{children}</div>
      {footer && <footer className="cl-post-edit__footer">{footer}</footer>}
    </div>
  </div>}/>;
}
