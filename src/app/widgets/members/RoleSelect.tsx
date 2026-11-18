import { roleLabel, roleSummary, type RoleDefinition } from "@/reusables/vars/roles";

export default function RoleSelect({ roles, value, onChange, disabled = false, loading = false, error = false, onRetry }: {
  roles: RoleDefinition[];
  value?: number | null;
  onChange: (role: RoleDefinition) => void;
  disabled?: boolean;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}) {
  return <label className="tw-flex tw-flex-col tw-gap-[8px] tw-text-[var(--text)] tw-text-[12px]">
    Role
    <select aria-label="Role" value={roles.some((role) => role.id === value) ? value! : ""}
      disabled={disabled || loading || error || !roles.length}
      className="tw-bg-[var(--surface)] tw-text-[var(--text)] tw-border tw-border-[var(--border)] tw-rounded-[10px] tw-px-[12px] tw-py-[10px] tw-min-h-[42px] tw-w-full tw-min-w-0 tw-max-w-full tw-cursor-pointer tw-transition-colors tw-duration-150 focus:tw-outline-none focus:tw-border-[var(--brand)] focus:tw-ring-2 focus:tw-ring-[var(--brand-soft)] disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
      onChange={(event) => {
        const role = roles.find((row) => row.id === Number(event.target.value));
        if (role && role.assignable !== false) onChange(role);
      }}>
      <option value="" disabled>{loading ? "Loading roles…" : "Choose a role"}</option>
      {roles.map((role) => <option key={role.id} value={role.id} disabled={role.assignable === false}
        title={role.disabled_reason || roleSummary(role)}>{roleLabel(role)}</option>)}
    </select>
    {error && <span role="alert">Couldn’t load roles. <button type="button" onClick={onRetry}>Retry</button></span>}
    {!loading && !error && !roles.length && <span>No assignable roles are available.</span>}
  </label>;
}
