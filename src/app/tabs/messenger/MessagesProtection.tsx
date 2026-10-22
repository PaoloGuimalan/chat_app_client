import { useEffect, useLayoutEffect, useRef, useState, useId, type FormEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadConfigurations, type EncryptionSettings } from '@/reusables/encryption/api';
import { configurationSupportsPurpose, isPurposeActive, verifyConfiguration, type Configuration } from '@/reusables/encryption/crypto';
import { deriveKey } from '@/reusables/encryption/derive';
import PassphraseUnlockDialog from '@/reusables/encryption/PassphraseUnlockDialog';
import { useModalFocus } from '@/reusables/encryption/useModalFocus';
import type { AuthenticationInterface } from '@/reusables/vars/interfaces';

interface ProtectionProps { children: ReactNode; active?: boolean; routeActive?: boolean; onCancel?: () => void }

export function MessagesProtectionContent({children}: {children: ReactNode}) {
  return <>{children}</>;
}

export default function MessagesProtection({children}: {children: ReactNode}) {
  return <MessagesProtectionProvider><MessagesProtectionContent>{children}</MessagesProtectionContent></MessagesProtectionProvider>;
}

/** One boundary covers the Messages routes and desktop conversation windows. */
export function MessagesProtectionProvider({children, active = true, routeActive = true, onCancel}: ProtectionProps) {
  const auth = useSelector((state: {authentication: AuthenticationInterface}) => state.authentication);
  const identity = `${auth.user.id}:${auth.user.userID}:${auth.user.entity_id}:${auth.active_entity_context?.id || ''}`;
  return <MessagesVisit key={identity} identity={identity} active={active} routeActive={routeActive} onCancel={onCancel}>{children}</MessagesVisit>;
}

function MessagesVisit({children, identity, active: visitActive = true, routeActive = true, onCancel}: ProtectionProps & {identity: string}) {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<'loading'|'locked'|'ready'|'error'>('loading');
  const [settings, setSettings] = useState<EncryptionSettings | null>(null);
  const [active, setActive] = useState<Configuration | null>(null);
  const [phrase, setPhrase] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [retry, setRetry] = useState(0);
  const generation = useRef(0);
  const controller = useRef(new AbortController());
  const running = useRef(false);
  const background = useRef<HTMLDivElement>(null);
  const blocked = visitActive && phase !== 'ready';
  useLayoutEffect(() => {
    const element = background.current;
    if (!element) return;
    element.toggleAttribute('inert', blocked);
    return () => element.removeAttribute('inert');
  }, [blocked]);
  // Only return through app history; a direct URL has no internal predecessor.
  const routeEntry = useRef<{canGoBack: boolean} | null>(null);
  if (!routeActive) routeEntry.current = null;
  else if (!routeEntry.current) routeEntry.current = {canGoBack: window.history.state?.idx > 0};
  const exit = () => {
    generation.current++;
    controller.current.abort();
    setPhrase('');
    onCancel?.();
    if (routeActive) {
      if (routeEntry.current?.canGoBack) navigate(-1);
      else navigate('/', {replace: true});
    }
  };

  useEffect(() => {
    const ticket = ++generation.current;
    const current = new AbortController();
    controller.current = current;
    setPhase('loading'); setSettings(null); setActive(null); setPhrase(''); setError(''); setBusy(false); running.current = false;
    if (!visitActive) return () => { generation.current++; current.abort(); };
    loadConfigurations('messages').then(value => {
      if (ticket !== generation.current || current.signal.aborted) return;
      const group = value.purposes.find(item => item.purpose === 'messages');
      if (!group) throw Error('Missing Messages protection');
      setSettings(value);
      const config = group.configurations.find(item => item.id === group.active_configuration_id && item.is_active && configurationSupportsPurpose(item, 'messages'));
      if (isPurposeActive(group) && group.active_configuration_id && !config) throw Error('Invalid Messages protection');
      setActive(config || null);
      setPhase(isPurposeActive(group) && config ? 'locked' : 'ready');
    }).catch(() => {
      if (ticket === generation.current && !current.signal.aborted) { setError('Could not load Messages protection. Please retry.'); setPhase('error'); }
    });
    const lock = () => {
      generation.current++; current.abort(); setPhrase(''); setActive(null); setPhase('loading'); setRetry(value => value + 1);
    };
    window.addEventListener('pagehide', lock);
    return () => { generation.current++; current.abort(); window.removeEventListener('pagehide', lock); };
  }, [retry, identity, visitActive]);

  const unlock = async (event: FormEvent) => {
    event.preventDefault();
    if (!active || !settings || running.current || controller.current.signal.aborted) return;
    const ticket = generation.current;
    const current = controller.current;
    running.current = true; setBusy(true); setError('');
    try {
      const key = await deriveKey(phrase, active, active.salt, current.signal);
      await verifyConfiguration(active, settings.owner, key);
      if (ticket !== generation.current || current.signal.aborted) return;
      // Only the access decision survives; Messages has no content encryption key.
      setPhrase(''); setActive(null); setSettings(null); setPhase('ready');
    } catch {
      if (ticket === generation.current && !current.signal.aborted) { setPhrase(''); setError('Could not unlock your Messages. Check your passphrase and try again.'); }
    } finally {
      if (ticket === generation.current && !current.signal.aborted) { running.current = false; setBusy(false); }
    }
  };
  return <>
    <div ref={background} style={{display: 'contents'}} aria-hidden={blocked || undefined}>{children}</div>
    {blocked && createPortal(phase === 'loading'
      ? <div className="passphrase-overlay" style={{background: 'transparent', backdropFilter: 'none'}} aria-hidden="true"/>
      : phase === 'error'
        ? <MessagesProtectionError error={error} retry={() => setRetry(value => value + 1)} cancel={exit}/>
        : <PassphraseUnlockDialog title="Unlock your Messages" description="Enter your active passphrase to open this visit." name={active?.name || 'Passphrase'} phrase={phrase} busy={busy} error={error} onPhraseChange={value => {setPhrase(value); setError('');}} onSubmit={event => void unlock(event)} onCancel={exit}/>, document.body)}
  </>;
}

function MessagesProtectionError({error, retry, cancel}: {error: string; retry: () => void; cancel: () => void}) {
  const id = useId();
  const modal = useModalFocus<HTMLDivElement>(true, cancel);
  return <div className="passphrase-overlay"><div ref={modal} className="passphrase-dialog" role="alertdialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-error`}>
    <h2 id={`${id}-title`}>Messages protection unavailable</h2>
    <p id={`${id}-error`}>{error}</p>
    <div className="passphrase-actions"><button onClick={retry}>Retry</button><button onClick={cancel}>Cancel</button></div>
  </div></div>;
}
