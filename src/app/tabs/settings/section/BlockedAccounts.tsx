/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ListBlockedUsersRequest,
  UnblockUserRequest,
} from "@/reusables/hooks/requests";
import { Avatar } from "@/reusables/design";

interface IBlockedAccount {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  profile: string;
  created_at: string;
}

function BlockedAccounts() {
  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();

  const [isLoading, setisLoading] = useState<boolean>(true);
  const [blockedAccounts, setblockedAccounts] = useState<IBlockedAccount[]>(
    [],
  );
  const [unblockingId, setunblockingId] = useState<string | null>(null);

  const loadBlockedAccounts = () => {
    setisLoading(true);
    ListBlockedUsersRequest()
      .then((data) => {
        setblockedAccounts(data);
        setisLoading(false);
      })
      .catch(() => setisLoading(false));
  };

  useEffect(() => {
    loadBlockedAccounts();
  }, []);

  const unblockProcess = (id: string) => {
    setunblockingId(id);
    UnblockUserRequest(id, dispatch, alerts, () => {
      setunblockingId(null);
    }).then((success) => {
      if (success) {
        setblockedAccounts((prev) => prev.filter((acc) => acc.id !== id));
      }
    });
  };

  return (
    <div className="tw-w-full tw-h-full tw-flex tw-gap-[10px] tw-flex-col tw-items-start tw-font-Inter">
      <div className="tw-w-full tw-flex tw-items-start">
        <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
          Blocked Accounts
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
        <span className="tw-text-[14px] tw-text-left tw-text-[#6b6b6d]">
          Accounts you've blocked can't contact you, see your posts, or find
          your profile in search.
        </span>
        {isLoading ? (
          <span className="tw-text-[13px] tw-text-[#6b6b6d]">Loading…</span>
        ) : blockedAccounts.length === 0 ? (
          <span className="tw-text-[13px] tw-text-[#6b6b6d]">
            You haven't blocked anyone.
          </span>
        ) : (
          <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px]">
            {blockedAccounts.map((acc) => (
              <div
                key={acc.id}
                className="tw-w-full tw-flex tw-items-center tw-gap-[10px] tw-p-[8px] tw-rounded-[var(--r-md)] tw-bg-[var(--surface-2)]"
              >
                <Avatar
                  id={acc.username}
                  name={acc.first_name}
                  src={acc.profile !== "none" ? acc.profile : undefined}
                  size={36}
                />
                <div className="tw-flex tw-flex-col tw-flex-1 tw-min-w-0">
                  <span className="tw-text-[13px] tw-font-semibold">
                    {acc.first_name} {acc.last_name}
                  </span>
                  <span className="tw-text-[12px] tw-text-[#6b6b6d]">
                    @{acc.username}
                  </span>
                </div>
                <button
                  disabled={unblockingId === acc.id}
                  onClick={() => unblockProcess(acc.id)}
                  className="tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-border-none tw-px-[12px] tw-py-[8px] tw-bg-[var(--surface)] tw-text-[var(--text)] tw-rounded-[var(--r-md)] tw-text-[12px] hover:tw-bg-[var(--surface-hover)] tw-transition-colors disabled:tw-opacity-[0.65]"
                >
                  {unblockingId === acc.id ? "Unblocking…" : "Unblock"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BlockedAccounts;
