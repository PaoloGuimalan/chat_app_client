import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import Skeleton, { SkeletonTheme } from "react-loading-skeleton";
import { Btn, Card } from "@/reusables/design";
import Modal from "@/app/reusables/Modal";
import ConfirmModal from "@/app/widgets/modals/ConfirmModal";
import { GetRoleDefinitionsRequest } from "@/reusables/hooks/requests";
import {
  createRealmRole,
  deleteRealmRole,
  getRealmPermissions,
  saveRealmPermissions,
  updateRealmRole,
} from "@/reusables/hooks/communityRequests";
import { notify, notifyRequestError } from "@/reusables/hooks/errormessages";
import type { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import type { RealmPermissionSettings } from "@/reusables/vars/realmApprovals";
import type { RoleDefinition } from "@/reusables/vars/roles";

export default function Permissions({ realm }: { realm: IRealmProfileInfo }) {
  const actor = useSelector(
    (s: {
      authentication: {
        active_entity_context?: { id?: string };
        user: { entity_id: string };
      };
    }) =>
      s.authentication.active_entity_context?.id ??
      s.authentication.user.entity_id,
  );
  const token = localStorage.getItem("authtoken");
  const scope = `${actor}:${token}:${realm.id}:${JSON.stringify(realm.capabilities)}`;
  const live = useRef(scope);
  live.current = scope;
  const [revision, setRevision] = useState(0);
  const [loaded, setLoaded] = useState<{
    scope: string;
    data: RealmPermissionSettings | null;
    busy: boolean;
  }>({ scope, data: null, busy: true });
  const [selected, setSelected] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string[]>>({});
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState<{
    role?: RoleDefinition;
    name: string;
  } | null>(null);
  const [removing, setRemoving] = useState<RoleDefinition | null>(null);
  const data = loaded.scope === scope ? loaded.data : null;
  const busy = loaded.scope !== scope || loaded.busy;
  const role =
    data?.roles.find((item) => item.id === selected) ?? data?.roles[0];
  const owner = role?.is_default && role.code === "owner";
  const canEditGrants = Boolean(role?.permissions_editable && !owner);

  useEffect(() => {
    let active = true;
    setLoaded({ scope, data: null, busy: true });
    setDrafts({});
    setEditing(null);
    setRemoving(null);
    setSaving(false);
    const request = realm.capabilities?.can_manage_permissions
      ? getRealmPermissions(realm.id)
      : GetRoleDefinitionsRequest(realm.id).then((roles) => ({
          roles,
          catalog: [],
          features: realm.features ?? {},
          capabilities: realm.capabilities ?? {},
        }));
    request
      .then((result) => {
        if (
          !active ||
          live.current !== scope ||
          token !== localStorage.getItem("authtoken")
        )
          return;
        setLoaded({ scope, data: result, busy: false });
        setSelected((previous) =>
          result.roles.some((item) => item.id === previous)
            ? previous
            : (result.roles[0]?.id ?? null),
        );
      })
      .catch((error) => {
        if (!active || live.current !== scope) return;
        setLoaded({ scope, data: null, busy: false });
        notifyRequestError(
          error,
          "We couldn’t load the community permissions.",
        );
      });
    return () => {
      active = false;
    };
  }, [scope, revision, realm.id, realm.capabilities, realm.features, token]);

  useEffect(() => {
    const changed = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (
        detail?.realm_id &&
        ![realm.id, realm.realm_id].includes(String(detail.realm_id))
      )
        return;
      if (
        detail?.event &&
        ![
          "reconnected",
          "community_access_changed",
          "community_members_changed",
          "realm_access_changed",
          "realm_members_changed",
        ].includes(detail.event)
      )
        return;
      setRevision((value) => value + 1);
    };
    document.addEventListener("community-changed", changed);
    document.addEventListener("reload-realm-members", changed);
    return () => {
      document.removeEventListener("community-changed", changed);
      document.removeEventListener("reload-realm-members", changed);
    };
  }, [realm.id, realm.realm_id]);

  const current = () =>
    live.current === scope && token === localStorage.getItem("authtoken");
  const announce = () =>
    document.dispatchEvent(
      new CustomEvent("reload-realm-members", {
        detail: { realm_id: realm.id },
      }),
    );
  const save = async () => {
    if (saving || !data) return;
    const changes = Object.entries(drafts).map(([id, permissions]) => ({
      role_id: Number(id),
      permissions,
    }));
    if (!changes.length) return;
    setSaving(true);
    try {
      await saveRealmPermissions(realm.id, changes);
      if (!current()) return;
      notify("success", "Permissions saved.");
      setDrafts({});
      announce();
    } catch (error) {
      if (current())
        notifyRequestError(error, "We couldn’t save these permissions.");
    } finally {
      if (current()) setSaving(false);
    }
  };
  const saveName = async () => {
    if (!editing?.name.trim() || saving) return;
    setSaving(true);
    try {
      if (editing.role)
        await updateRealmRole(realm.id, editing.role.id, {
          name: editing.name.trim(),
        });
      else await createRealmRole(realm.id, editing.name.trim());
      if (!current()) return;
      setEditing(null);
      notify("success", editing.role ? "Role updated." : "Role created.");
      announce();
    } catch (error) {
      if (current()) notifyRequestError(error, "We couldn’t save this role.");
    } finally {
      if (current()) setSaving(false);
    }
  };
  const remove = async () => {
    if (!removing || saving) return;
    setSaving(true);
    try {
      await deleteRealmRole(realm.id, removing.id);
      if (!current()) return;
      setRemoving(null);
      notify("success", "Role deleted.");
      announce();
    } catch (error) {
      if (current()) notifyRequestError(error, "We couldn’t delete this role.");
    } finally {
      if (current()) setSaving(false);
    }
  };
  const grants = role ? (drafts[role.id] ?? role.permissions) : [];
  return (
    <section className="cl-realm-policy tw-w-full tw-min-w-0 tw-p-[16px] md:tw-p-[20px] tw-text-left">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-[12px] tw-mb-[18px]">
        <div>
          <h2 className="tw-m-0 tw-text-left tw-text-[20px] tw-font-semibold">
            Permissions
          </h2>
          <p className="tw-mb-0 tw-text-[13px] tw-text-[var(--text-2)]">
            Choose what each role can do in the community.
          </p>
        </div>
        {realm.capabilities?.can_manage_roles && (
          <Btn
            disabled={busy || saving}
            onClick={() => setEditing({ name: "" })}
          >
            Create role
          </Btn>
        )}
      </div>
      {busy ? (
        <div role="status" aria-label="Loading permissions">
          <SkeletonTheme
            baseColor="var(--surface-2)"
            highlightColor="var(--surface-hover)"
          >
            <Skeleton count={5} height={42} />
          </SkeletonTheme>
        </div>
      ) : !data ? (
        <Btn
          variant="outline"
          onClick={() => setRevision((value) => value + 1)}
        >
          Retry
        </Btn>
      ) : (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-[220px_minmax(0,1fr)] tw-gap-[16px] tw-items-start">
          <Card className="tw-min-w-0">
            <div className="tw-flex tw-flex-col tw-gap-[6px]">
              {data.roles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={role?.id === item.id}
                  onClick={() => setSelected(item.id)}
                  className="tw-w-full tw-break-words tw-cursor-pointer tw-rounded-[8px] tw-border-0 tw-p-[10px] tw-text-left tw-font-semibold"
                  style={{
                    background:
                      role?.id === item.id
                        ? "var(--brand-soft)"
                        : "transparent",
                    color:
                      role?.id === item.id ? "var(--brand)" : "var(--text)",
                  }}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </Card>
          <Card className="tw-min-w-0">
            {role ? (
              <>
                <div className="tw-flex tw-flex-wrap tw-justify-between tw-items-center tw-gap-[8px] tw-mb-[12px]">
                  <h3 className="tw-m-0 tw-min-w-0 tw-break-words tw-font-semibold tw-text-[16px]">
                    {role.name}
                  </h3>
                  <div className="tw-flex tw-flex-wrap tw-gap-[6px]">
                    {role.editable && !owner && (
                      <Btn
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => setEditing({ role, name: role.name })}
                      >
                        Rename
                      </Btn>
                    )}
                    {role.editable && !role.is_default && (
                      <Btn
                        variant="outline"
                        size="sm"
                        disabled={saving}
                        onClick={() => setRemoving(role)}
                      >
                        Delete role
                      </Btn>
                    )}
                  </div>
                </div>
                {owner && (
                  <p className="tw-text-[13px] tw-text-[var(--text-2)]">
                    Owner always has all active realm permissions and cannot be
                    changed.
                  </p>
                )}
                <div className="tw-flex tw-flex-col">
                  {data.catalog.map((entry) => (
                    <label
                      key={entry.permission}
                      className="tw-flex tw-items-start tw-gap-[10px] tw-py-[12px] tw-border-0 tw-border-b tw-border-solid tw-border-[var(--border)] tw-text-left tw-text-[13px]"
                    >
                      <input
                        type="checkbox"
                        className="tw-mt-[2px] tw-accent-[var(--brand)]"
                        checked={grants.includes(entry.permission)}
                        disabled={
                          saving ||
                          !canEditGrants ||
                          (entry.grantable !== true &&
                            !grants.includes(entry.permission))
                        }
                        onChange={(event) =>
                          setDrafts((previous) => ({
                            ...previous,
                            [role.id]: event.target.checked
                              ? [...new Set([...grants, entry.permission])]
                              : grants.filter(
                                  (code) => code !== entry.permission,
                                ),
                          }))
                        }
                      />
                      <span className="tw-min-w-0 tw-break-words">
                        {entry.description ||
                          entry.permission.split(".").slice(1).join(" ")}
                      </span>
                    </label>
                  ))}
                </div>
                {data.catalog.length > 0 && (
                  <div className="tw-flex tw-justify-end tw-pt-[16px]">
                    <Btn
                      disabled={saving || !Object.keys(drafts).length}
                      onClick={() => void save()}
                    >
                      {saving ? "Saving…" : "Save permissions"}
                    </Btn>
                  </div>
                )}
              </>
            ) : (
              <p>No roles available.</p>
            )}
          </Card>
        </div>
      )}
      {editing && (
        <Modal
          component={
            <form
              role="dialog"
              aria-modal="true"
              aria-label={editing.role ? "Rename role" : "Create role"}
              onSubmit={(event) => {
                event.preventDefault();
                void saveName();
              }}
              className="cl-profile-surface tw-w-[calc(100%-24px)] tw-max-w-[420px] tw-rounded-[14px] tw-p-[20px] tw-text-left"
            >
              <h3 className="tw-mt-0">
                {editing.role ? "Rename role" : "Create role"}
              </h3>
              <label className="tw-flex tw-flex-col tw-gap-[6px] tw-text-[13px]">
                Role name
                <input
                  autoFocus
                  required
                  maxLength={150}
                  value={editing.name}
                  className="tw-rounded-[8px] tw-border tw-border-solid tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-p-[10px] tw-text-[var(--text)]"
                  onChange={(event) =>
                    setEditing({ ...editing, name: event.target.value })
                  }
                />
              </label>
              <div className="tw-flex tw-justify-end tw-gap-[8px] tw-mt-[16px]">
                <Btn
                  type="button"
                  variant="outline"
                  disabled={saving}
                  onClick={() => setEditing(null)}
                >
                  Cancel
                </Btn>
                <Btn type="submit" disabled={saving || !editing.name.trim()}>
                  {saving ? "Saving…" : "Save role"}
                </Btn>
              </div>
            </form>
          }
        />
      )}
      {removing && (
        <ConfirmModal
          title="Delete role?"
          message={`Delete ${removing.name}? Roles referenced by members or invitations cannot be deleted.`}
          confirmLabel="Delete role"
          onClose={() => setRemoving(null)}
          onConfirm={() => void remove()}
          isBusy={saving}
        />
      )}
    </section>
  );
}
