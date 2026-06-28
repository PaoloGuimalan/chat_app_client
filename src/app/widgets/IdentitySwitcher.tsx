/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { Avatar, Card, Icon, IconBtn } from "@/reusables/design";
import Modal from "@/app/reusables/Modal";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import type { ActiveEntityState } from "@/redux/actions/states";
import { GetMyRealmsRequest } from "@/reusables/hooks/requests";
import { actAsRealm, actAsUser } from "@/reusables/hooks/activeentity";

interface IdentityOption {
  key: string;
  name: string;
  sub: string;
  profile?: string;
  isActive: boolean;
  onSelect: () => void;
}

// Themed modal to switch the active acting-as identity (the user themselves, or
// any realm they administer). Page realms are loaded first; other realm types
// can be added via `types`. Selecting an identity updates the global active
// entity (X-Acting-As) and re-contexts the profile view.
function IdentitySwitcher({
  onClose,
  types = ["page"],
}: {
  onClose: () => void;
  types?: string[];
}) {
  const authentication = useSelector((state: any) => state.authentication);
  const activeentity: ActiveEntityState = useSelector(
    (state: any) => state.activeentity,
  );

  const [realms, setRealms] = useState<IRealmProfileInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.allSettled(types.map((t) => GetMyRealmsRequest(1, 50, t)))
      .then((results) => {
        if (cancelled) return;
        const all = results
          .filter(
            (r): r is PromiseFulfilledResult<any> => r.status === "fulfilled",
          )
          .flatMap((r) => r.value?.results ?? [])
          .filter((r: IRealmProfileInfo) => r.is_admin);
        if (all.length === 0) return;
        const seen = new Set<string>();
        setRealms(
          all.filter((r) =>
            seen.has(r.realm_id) ? false : (seen.add(r.realm_id), true),
          ),
        );
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [types.join(",")]);

  const isUserActive = activeentity?.entityType !== "realm";
  const activeRealmId =
    activeentity?.entityType === "realm"
      ? activeentity?.display?.realm_id
      : null;

  const options: IdentityOption[] = useMemo(() => {
    const userName =
      `${authentication?.user?.fullName?.firstName ?? ""} ${
        authentication?.user?.fullName?.lastName ?? ""
      }`.trim() ||
      authentication?.user?.username ||
      "You";

    const list: IdentityOption[] = [
      {
        key: "user",
        name: userName,
        sub: `@${authentication?.user?.username ?? ""}`,
        profile:
          authentication?.user?.profile !== "none"
            ? authentication?.user?.profile
            : undefined,
        isActive: isUserActive,
        onSelect: () => {
          actAsUser();
          onClose();
        },
      },
    ];

    for (const realm of realms) {
      list.push({
        key: realm.realm_id,
        name: realm.name,
        sub: realm.type,
        profile:
          realm.profile && realm.profile !== "none" ? realm.profile : undefined,
        isActive: !isUserActive && activeRealmId === realm.realm_id,
        onSelect: () => {
          // Key the actor on realm_id (stable); slug is only for profile nav.
          actAsRealm(realm.realm_id, {
            name: realm.name,
            profile: realm.profile ?? "",
            realmType: realm.type,
            slug: realm.slug,
          });
          onClose();
        },
      });
    }
    return list;
  }, [authentication, realms, isUserActive, activeRealmId, onClose]);

  return (
    <Modal
      component={
        <Card
          pad={0}
          style={{
            width: "min(420px, 92vw)",
            maxHeight: "82vh",
            overflow: "hidden",
          }}
        >
          <div
            className="tw-flex tw-items-center tw-justify-between tw-px-[16px] tw-py-[12px]"
            style={{ borderBottom: "1px solid var(--border)" }}
          >
            <span
              className="tw-font-semibold tw-text-[15px]"
              style={{ color: "var(--text)" }}
            >
              Switch identity
            </span>
            <IconBtn n="close" size={32} title="Close" onClick={onClose} />
          </div>

          <div
            className="tw-flex tw-flex-col tw-p-[8px] tw-overflow-y-auto scroller"
            style={{ maxHeight: "calc(82vh - 52px)" }}
          >
            {options.map((opt) => (
              <button
                key={opt.key}
                onClick={opt.onSelect}
                className="tw-flex tw-items-center tw-gap-[12px] tw-w-full tw-text-left tw-bg-transparent tw-border-none tw-cursor-pointer tw-px-[10px] tw-py-[9px]"
                style={{
                  borderRadius: "var(--r-md)",
                  background: opt.isActive
                    ? "var(--surface-hover)"
                    : "transparent",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "var(--surface-hover)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = opt.isActive
                    ? "var(--surface-hover)"
                    : "transparent")
                }
              >
                <Avatar
                  id={opt.key}
                  name={opt.name}
                  src={opt.profile}
                  size={42}
                />
                <span className="tw-flex tw-flex-col tw-min-w-0 tw-flex-1">
                  <span
                    className="tw-truncate tw-text-[14px] tw-font-semibold"
                    style={{ color: "var(--text)" }}
                  >
                    {opt.name}
                  </span>
                  <span
                    className="tw-truncate tw-text-[12px] tw-capitalize"
                    style={{ color: "var(--text-2)" }}
                  >
                    {opt.key === "user" ? "You" : opt.sub}
                  </span>
                </span>
                {opt.isActive && (
                  <Icon n="check_circle" s={20} c="var(--brand)" />
                )}
              </button>
            ))}

            {loading && realms.length === 0 && (
              <span
                className="tw-text-[12px] tw-px-[10px] tw-py-[8px]"
                style={{ color: "var(--text-2)" }}
              >
                Loading your pages…
              </span>
            )}
          </div>
        </Card>
      }
    />
  );
}

export default IdentitySwitcher;

