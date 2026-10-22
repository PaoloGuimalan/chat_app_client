import { useId, type FormEvent } from 'react';
import { AlertCircle, Lock } from 'lucide-react';
import { useModalFocus } from './useModalFocus';
import '@/app/tabs/settings/section/passphrases.css';

interface Props {
  title: string;
  description: string;
  name: string;
  phrase: string;
  busy: boolean;
  error: string;
  submitLabel?: string;
  onPhraseChange: (phrase: string) => void;
  onSubmit: (event: FormEvent) => void;
  onCancel: () => void;
}

/** Shared Diary and Messages prompt; secrets stay with the owning visit. */
export default function PassphraseUnlockDialog({title, description, name, phrase, busy, error, submitLabel = 'Unlock', onPhraseChange, onSubmit, onCancel}: Props) {
  const id = useId();
  const modal = useModalFocus<HTMLFormElement>(true, onCancel);
  return <div className="passphrase-overlay"><form ref={modal} className="passphrase-dialog" role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} onSubmit={onSubmit}>
    <div className="passphrase-dialog-heading"><Lock size={22} aria-hidden="true"/><h2 id={`${id}-title`}>{title}</h2></div>
    <p>{description}</p>
    <label>{name}<input autoFocus required type="password" autoComplete="off" value={phrase} disabled={busy} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} onChange={event => onPhraseChange(event.target.value)}/></label>
    {error && <p id={`${id}-error`} role="alert" className="passphrase-warning"><AlertCircle size={16} aria-hidden="true"/><span>{error}</span></p>}
    <div className="passphrase-actions"><button type="button" onClick={onCancel}>Cancel</button><button className="passphrase-primary" disabled={busy}>{busy ? 'Verifying…' : submitLabel}</button></div>
  </form></div>;
}
