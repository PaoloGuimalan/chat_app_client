/* eslint-disable @typescript-eslint/no-explicit-any */
import { PublicServersListRequest } from "@/reusables/hooks/requests";
import { useEffect, useState } from "react";
import { AiOutlineSearch } from "react-icons/ai";
import ServerItemLoader from "@/app/reusables/loaders/ServerItemLoader";
import PublicServerItem from "@/app/widgets/items/PublicServerItem";

function Default() {
  const [publicServers, setpublicServers] = useState<any[]>([]);
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  useEffect(() => {
    PublicServersListRequest()
      .then((response) => {
        setpublicServers(response.result);
        setisLoaded(true);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <div className="tw-bg-transparent tw-flex tw-flex-1 tw-flex-row tw-items-center tw-justify-center tw-pt-[15px] tw-pb-[10px] tw-pr-[7px]">
      <div
        id="div_server_list"
        className="tw-rounded-[10px] tw-shadow-lg tw-bg-white tw-flex tw-flex-col tw-items-center tw-justify-start tw-w-full tw-h-full tw-overflow-y-scroll x-scroll"
      >
        <div className="tw-w-full tw-flex tw-flex-col tw-pt-[40px] tw-h-[40%] tw-min-h-[40%] tw-items-center tw-justify-center">
          <span className="tw-text-[20px] tw-font-Inter tw-font-semibold tw-text-[#333333]">
            Welcome to Chatterloop Servers
          </span>
          <span className="tw-text-[14px] tw-font-Inter">
            Discover something new, explore the Realms of Chatterloop.
          </span>
          <div className="tw-w-full tw-max-w-[500px] tw-pt-[20px]">
            <div id="div_search_container">
              <div id="div_input_container">
                <AiOutlineSearch
                  style={{ fontSize: "20px", color: "#4A4A4A" }}
                />
                <input
                  // value={searchbox}
                  autoComplete="off"
                  onChange={() => {
                    // setsearchbox(e.target.value);
                  }}
                  type="text"
                  placeholder="Search something..."
                  id="input_search_box"
                />
              </div>
            </div>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-items-center">
          <div className="tw-w-full tw-flex tw-flex-col tw-max-w-[90%] tw-items-start tw-gap-[20px]">
            <span className="tw-text-[16px] tw-font-Inter tw-font-semibold">
              Top Servers
            </span>
            <div className="tw-w-full tw-flex tw-justify-evenly tw-gap-[10px] tw-flex-wrap tw-pb-[20px]">
              {isLoaded
                ? publicServers.map((mp: any, i: number) => {
                    return <PublicServerItem key={i} mp={mp} />;
                  })
                : Array.from({ length: 20 }).map((_, i) => {
                    return <ServerItemLoader key={i} />;
                  })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Default;
