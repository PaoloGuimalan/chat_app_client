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
    <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-p-[20px] tw-gap-[20px]">
      <div className="tw-flex tw-flex-col tw-items-start">
        <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
          Profile Details
        </span>
        <span className="tw-text-[#383838] tw-text-[14px] tw-font-Inter">
          Manage your{" "}
          {realmState.type === "group" && realmState.parent
            ? "channel"
            : realmState.type}{" "}
          details. Keep information up to date.
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[20px] tw-pb-[20px]">
        <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[10px]">
          <span className="tw-text-[#383838] tw-text-[16px] tw-font-semibold tw-font-Inter">
            Basic Details
          </span>
          <div className="tw-flex tw-flex-col tw-gap-[20px] tw-w-[calc(100%-40px)] tw-bg-white tw-items-center tw-justify-start tw-rounded-md tw-p-[20px] tw-pb-[30px]">
            <div className="tw-flex tw-flex-wrap tw-w-full tw-max-w-[700px] tw-gap-[10px]">
              {currentPreset.includes("name") && (
                <div className="tw-flex tw-flex-col tw-w-[calc(50%-20px)] tw-p-[4px] tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[#383838] tw-text-[14px] tw-font-semibold tw-font-Inter">
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
                    className="tw-w-[calc(100%-14px)] tw-h-[35px] tw-rounded-md tw-border-[0px] tw-bg-[#ebebeb] tw-px-[7px] tw-font-Inter"
                  />
                </div>
              )}
              {currentPreset.includes("slug") && (
                <div className="tw-flex tw-flex-col tw-w-[calc(50%-20px)] tw-p-[4px] tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[#383838] tw-text-[14px] tw-font-semibold tw-font-Inter">
                    Slug
                  </span>
                  <motion.input
                    initial={{
                      border: errorFields.includes("slug")
                        ? "2px solid red"
                        : "0px",
                    }}
                    animate={{
                      border: errorFields.includes("slug")
                        ? "2px solid red"
                        : "0px",
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
                    className="tw-w-[calc(100%-14px)] tw-h-[35px] tw-rounded-md tw-bg-[#ebebeb] tw-px-[7px] tw-font-Inter"
                  />
                </div>
              )}
              {currentPreset.includes("description") && (
                <div className="tw-flex tw-flex-col tw-w-[calc(100%-20px)] tw-p-[4px] tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[#383838] tw-text-[14px] tw-font-semibold tw-font-Inter">
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
                    className="tw-w-[calc(100%-20px)] tw-h-[150px] tw-rounded-md tw-border-[0px] tw-bg-[#ebebeb] tw-p-[10px] tw-font-Inter"
                  />
                </div>
              )}
              {currentPreset.includes("email") && (
                <div className="tw-flex tw-flex-col tw-w-[calc(50%-20px)] tw-p-[4px] tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[#383838] tw-text-[14px] tw-font-semibold tw-font-Inter">
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
                    className="tw-w-[calc(100%-14px)] tw-h-[35px] tw-rounded-md tw-border-[0px] tw-bg-[#ebebeb] tw-px-[7px] tw-font-Inter"
                  />
                </div>
              )}
              {currentPreset.includes("privacy") && (
                <div className="tw-flex tw-flex-col tw-w-[calc(50%-20px)] tw-p-[4px] tw-items-start tw-gap-[6px]">
                  <span className="tw-text-[#383838] tw-text-[14px] tw-font-semibold tw-font-Inter">
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
                    className="tw-w-[calc(100%-0px)] tw-h-[35px] tw-rounded-md tw-border-[0px] tw-bg-[#ebebeb] tw-px-[10px] tw-font-Inter"
                  >
                    <option value={"false"}>Public</option>
                    <option value={"true"}>Private</option>
                  </select>
                </div>
              )}
              <div className="tw-flex tw-justify-center tw-gap-[5px] tw-w-full">
                <button
                  disabled={isSaving}
                  onClick={() => {
                    setrealmState(realm);
                  }}
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#acacac] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
                >
                  Reset
                </button>
                <button
                  onClick={SaveDetailsProcess}
                  disabled={
                    Object.keys(stateDifference).length === 0 || isSaving
                  }
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-bg-[#1c7def] tw-text-white tw-border-white tw-rounded-[6px] tw-text-[12px]"
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
