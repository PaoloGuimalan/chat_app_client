import { createContext, useContext, useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loadConfigurations, type EncryptionSettings } from '@/reusables/encryption/api';
import { configurationSupportsPurpose, isPurposeActive, verifyConfiguration, type Configuration } from '@/reusables/encryption/crypto';
import { deriveKey } from '@/reusables/encryption/derive';
import PassphraseUnlockDialog from '@/reusables/encryption/PassphraseUnlockDialog';
import type { AuthenticationInterface } from '@/reusables/vars/interfaces';

const Access = createContext(false);
interface ProtectionProps { children: ReactNode; active?: boolean; routeActive?: boolean; onCancel?: () => void }

export function MessagesProtectionContent({children}: {children: ReactNode}) {
  return useContext(Access) ? <>{children}</> : null;
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
  return <Access.Provider value={visitActive && phase === 'ready'}>{children}{visitActive && phase === 'loading' && <div className="passphrase-overlay"><div className="passphrase-dialog" role="status">Loading Messages protection…</div></div>}{visitActive && phase === 'error' && <div className="passphrase-overlay"><div className="passphrase-dialog" role="alert">{error}<div className="passphrase-actions"><button onClick={() => setRetry(value => value + 1)}>Retry</button><button onClick={exit}>Cancel</button></div></div></div>}{visitActive && phase === 'locked' && <PassphraseUnlockDialog title="Unlock your Messages" description="Enter your active passphrase to open this visit." name={active?.name || 'Passphrase'} phrase={phrase} busy={busy} error={error} onPhraseChange={value => {setPhrase(value); setError('');}} onSubmit={event => void unlock(event)} onCancel={exit}/>}</Access.Provider>;
}
