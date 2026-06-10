/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { useNavigate } from "react-router-dom";
import ServerAvatar from "@/reusables/design/ServerAvatar";

function NoChannel({ server }: any) {
  const navigate = useNavigate();

  return !server ? (
    <div className="tw-bg-[var(--surface-2)] tw-h-full tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center">
      <div className="tw-rounded-[10px] tw-bg-[var(--surface)] tw-flex tw-items-center tw-justify-center tw-w-full tw-h-full tw-border tw-border-[var(--border)]">
        <motion.div
          animate={{
            rotate: -360,
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
          }}
          id="div_loader_request_conv"
        >
          <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
        </motion.div>
      </div>
    </div>
  ) : (
    <div className="tw-bg-[var(--surface-2)] tw-h-full tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center">
      <div
        // id="div_server_conversation_list"
        className="tw-rounded-[10px] tw-bg-[var(--surface)] tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-gap-[20px] tw-border tw-border-[var(--border)] tw-overflow-hidden"
      >
        <div className="tw-bg-[var(--surface)] tw-w-full tw-h-[40%] tw-min-h-[400px] tw-border-solid tw-border-[0px] tw-border-b tw-border-[var(--border)] tw-flex tw-flex-col tw-justify-center tw-items-center">
          {server.cover_photo ? (
            <CachedImage
              src={server.cover_photo}
              className="tw-bg-[var(--surface-3)] tw-object-cover tw-w-full tw-h-full tw-max-h-[250px] tw-flex tw-flex-1 tw-max-w-full"
            />
          ) : (
            <div className="tw-bg-[var(--surface-3)] tw-w-full tw-flex tw-flex-1 tw-max-w-[1500px] tw-rounded-b-[10px]" />
          )}
          <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1500px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
              <div className="tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center">
                <div className="tw-cursor-pointer tw-bg-[var(--surface)] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[140px] sm:tw-h-[140px] tw-border-solid tw-border-[5px] tw-border-[var(--surface)] tw-flex tw-items-center tw-justify-center tw-rounded-[20px] tw-relative tw--mt-[80px]">
                  <ServerAvatar
                    name={server.serverName}
                    src={server.profile && server.profile !== "N/A" ? server.profile : null}
                    size={server.profile && server.profile !== "N/A" ? 120 : 108}
                    shape="rounded"
                    style={{ boxShadow: "none" }}
                  />
                </div>
              </div>
            <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
              <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-start tw-h-full tw-p-[20px] tw-sm:p-[0px]">
                <span className="tw-text-[25px] tw-font-bold tw-pt-[30px] tw-text-[var(--text)]">
                  {server.serverName}
                </span>
                <span className="tw-text-[12px] tw-break-all tw-mb-[20px] tw-text-[var(--text-2)]">
                  {server.members.length} people are in this server
                </span>
              </div>
              <div className="tw-flex sm:tw-w-auto tw-w-full sm:tw-pb-[0px] tw-pb-[20px] tw-gap-[4px] tw-justify-center">
                {server.is_admin && (
                  <button
                    onClick={() => {
                      navigate(`/realms/${server.serverID}`);
                    }}
                    className="cl-server-accent-button tw-min-w-[80px] tw-cursor-pointer tw-font-semibold tw-font-Inter tw-p-[8px] tw-pl-[10px] tw-pr-[10px] tw-rounded-[6px] tw-text-[12px]"
                  >
                    Manage
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{ textAlign: server.description ? "left" : "center" }}
          className="tw-w-[80%] tw-max-[1500px] tw-pb-[20px]"
        >
          <span className="tw-text-[13px] tw-text-left tw-w-full tw-text-[var(--text-2)]">
            {server.description ?? "No descriptions to display"}
          </span>
        </div>
      </div>
    </div>
  );
}

export default NoChannel;
