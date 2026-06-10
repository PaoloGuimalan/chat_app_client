import { SET_MUTATE_ALERTS } from "@/redux/types";
import { UpdateRealmRequest } from "@/reusables/hooks/requests";
import { getDifferentValues } from "@/reusables/hooks/reusable";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { motion } from "framer-motion";

function Details({ realm }: { realm: IRealmProfileInfo }) {
  const [realmState, setrealmState] = useState<IRealmProfileInfo>(realm);
  const [isSaving, setisSaving] = useState<boolean>(false);
  const [errorFields, seterrorFields] = useState<string[]>([]);

  const currentPreset = useMemo(() => {
    const formPreset: Record<string, string[]> = {
      group: ["name", "privacy"],
      channel: ["name"], // "privacy" for future, need add every user in server when set to public
      voice: ["name"], // "privacy" for future, need add every user in server when set to public
      page: ["name", "description", "email", "slug"],
      server: ["name", "description", "privacy"],
    };

    const isChannel = realmState.type === "group" && realmState.parent;

    return formPreset[isChannel ? "channel" : realmState.type];
  }, [realmState]);

  const stateDifference = useMemo(
    () => getDifferentValues(realm, realmState),
    [realm, realmState],
  );

  const dispatch = useDispatch();

  const SaveDetailsProcess = () => {
    seterrorFields([]);
    setisSaving(true);
    UpdateRealmRequest(realmState.realm_id, stateDifference)
      .then((response) => {
        console.log(response);
        window.location.reload();
      })
      .catch((err) => {
        setisSaving(false);
        console.log(err);

        if (err.message.includes("Slug already exists")) {
          seterrorFields((prev) => {
            const uniqueArray = [...new Set(prev), "slug"];

            return uniqueArray;
          });
          dispatch({
            type: SET_MUTATE_ALERTS,
            payload: {
              alerts: {
                type: "error",
                content: "Slug provided already exist",
              },
            },
          });
        }
      });
  };

  return (
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[18px] sm:tw-p-[24px] tw-gap-[18px] tw-bg-[var(--background)] tw-min-h-0">
      <div className="tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
        <span className="tw-text-[var(--text)] tw-text-[20px] tw-font-semibold tw-font-Inter">
          Profile Details
        </span>
        <span className="tw-text-[var(--text-2)] tw-text-[14px] tw-font-Inter tw-max-w-[760px]">
          Manage your{" "}
          {realmState.type === "group" && realmState.parent
            ? "channel"
            : realmState.type}{" "}
          details. Keep information up to date.
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[16px] tw-pb-[20px] tw-min-h-0">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
          <span className="tw-text-[var(--text)] tw-text-[16px] tw-font-semibold tw-font-Inter">
            Basic Details
          </span>
          <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-full tw-max-w-[860px] tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-items-center tw-justify-start tw-rounded-[var(--r-md)] tw-p-[18px] sm:tw-p-[24px]">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-w-full tw-gap-[12px]">
              {currentPreset.includes("name") && (
                <div className="tw-flex tw-flex-col tw-w-full tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[var(--text)] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Name
                  </span>
                  <input
                    disabled={isSaving}
                    value={realmState.name}
                    onChange={(e) => {
                      setrealmState((prev) => {
                        return {
                          ...prev,
                          name: e.target.value,
                        };
                      });
                    }}
                    type="text"
                    placeholder="Name"
                    className="tw-w-full tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px] tw-font-Inter tw-text-[var(--text)] tw-outline-none focus:tw-border-[var(--brand)]"
                  />
                </div>
              )}
              {currentPreset.includes("slug") && (
                <div className="tw-flex tw-flex-col tw-w-full tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[var(--text)] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Slug
                  </span>
                  <motion.input
                    initial={{
                      borderColor: errorFields.includes("slug")
                        ? "var(--red)"
                        : "var(--border)",
                    }}
                    animate={{
                      borderColor: errorFields.includes("slug")
                        ? "var(--red)"
                        : "var(--border)",
                    }}
                    disabled={isSaving}
                    onChange={(e) => {
                      setrealmState((prev) => {
                        return {
                          ...prev,
                          slug: e.target.value,
                        };
                      });
                    }}
                    value={realmState.slug ?? ""}
                    type="text"
                    placeholder="Slug"
                    className="tw-w-full tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-bg-[var(--input)] tw-px-[12px] tw-font-Inter tw-text-[var(--text)] tw-outline-none focus:tw-border-[var(--brand)]"
                  />
                </div>
              )}
              {currentPreset.includes("description") && (
                <div className="tw-flex tw-flex-col tw-w-full tw-items-start tw-gap-[6px] md:tw-col-span-2">
                  <span className="tw-text-[var(--text)] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Description
                  </span>
                  <textarea
                    disabled={isSaving}
                    value={realmState.description ?? ""}
                    onChange={(e) => {
                      setrealmState((prev) => {
                        return {
                          ...prev,
                          description: e.target.value,
                        };
                    });
                    }}
                    placeholder="Description"
                    className="tw-w-full tw-min-h-[150px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-p-[12px] tw-font-Inter tw-text-[var(--text)] tw-outline-none focus:tw-border-[var(--brand)]"
                  />
                </div>
              )}
              {currentPreset.includes("email") && (
                <div className="tw-flex tw-flex-col tw-w-full tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[var(--text)] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Email
                  </span>
                  <input
                    disabled={isSaving}
                    value={realmState.email ?? ""}
                    onChange={(e) => {
                      setrealmState((prev) => {
                        return {
                          ...prev,
                          email: e.target.value,
                        };
                      });
                    }}
                    type="text"
                    placeholder="Email"
                    className="tw-w-full tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px] tw-font-Inter tw-text-[var(--text)] tw-outline-none focus:tw-border-[var(--brand)]"
                  />
                </div>
              )}
              {currentPreset.includes("privacy") && (
                <div className="tw-flex tw-flex-col tw-w-full tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[var(--text)] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Privacy
                  </span>
                  <select
                    disabled={isSaving}
                    value={realmState.is_private.toString()}
                    onChange={(e) => {
                      setrealmState((prev) => {
                        return {
                          ...prev,
                          is_private: JSON.parse(e.target.value),
                        };
                      });
                    }}
                    className="tw-w-full tw-h-[42px] tw-rounded-[var(--r-md)] tw-border tw-border-[var(--border)] tw-bg-[var(--input)] tw-px-[12px] tw-font-Inter tw-text-[var(--text)] tw-outline-none focus:tw-border-[var(--brand)]"
                  >
                    <option value={"false"}>Public</option>
                    <option value={"true"}>Private</option>
                  </select>
                </div>
              )}
              <div className="tw-flex tw-justify-end tw-gap-[10px] tw-w-full tw-pt-[8px]">
                <button
                  disabled={isSaving}
                  onClick={() => {
                    setrealmState(realm);
                  }}
                  className="tw-min-w-[92px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--surface-2)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[13px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors"
                >
                  Reset
                </button>
                <button
                  onClick={SaveDetailsProcess}
                  disabled={
                    Object.keys(stateDifference).length === 0 || isSaving
                  }
                  className="tw-min-w-[92px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[14px] tw-py-[10px] tw-bg-[var(--brand)] tw-text-white tw-rounded-[var(--r-md)] tw-text-[13px] disabled:tw-opacity-[0.65] tw-transition-colors"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Details;
