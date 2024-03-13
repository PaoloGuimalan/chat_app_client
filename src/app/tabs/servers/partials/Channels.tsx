import { useMemo } from "react";
import { Route, Routes, useParams } from "react-router-dom"
import NoChannel from "./NoChannel";
import ServerConversation from "./ServerConversation";

function Channels() {

  const params = useParams();

  const serverID = useMemo(() => params.serverID, [params]);

  return (
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-start">
        <div className="tw-bg-[#f1f1f2] tw-flex tw-flex-1 tw-flex-col tw-h-full tw-max-w-[250px]">
            {serverID}
        </div>
        <Routes>
            <Route path="/" element={<NoChannel />} />
            <Route path="/:conversationID" element={<ServerConversation />} />
        </Routes>
    </div>
  )
}

export default Channels