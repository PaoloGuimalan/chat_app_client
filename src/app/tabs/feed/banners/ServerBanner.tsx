import ServerItemLoader from "@/app/reusables/loaders/ServerItemLoader";
import PublicServerItem from "@/app/widgets/items/PublicServerItem";
import { genericpaginationstate } from "@/redux/actions/states";
import { GetTopRealmsRequest } from "@/reusables/hooks/requests";
import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { PaginationProp } from "@/reusables/vars/props";
import { useEffect, useState } from "react";
import { RiPagesLine } from "react-icons/ri";
import { TbServer2 } from "react-icons/tb";

function ServerBanner() {
  const [pages, setpages] = useState<PaginationProp<IRealmProfileInfo>>(
    genericpaginationstate,
  );
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  const GetTopRealmsProcess = () => {
    GetTopRealmsRequest(1, 3, "server", null)
      .then((response) => {
        setpages((prev) => {
          const prevIds = new Set(prev.results.map((item) => item.id));
          const newItems = response.results.filter(
            (item: IRealmProfileInfo) => !prevIds.has(item.id),
          );

          return {
            ...response,
            results: [...prev.results, ...newItems],
          };
        });
        setisLoaded(true);
      })
      .catch((err) => {
        setisLoaded(true);
        console.log(err);
      });
  };

  useEffect(() => {
    GetTopRealmsProcess();
  }, []);

  return (
    <div className="div_feed_post_container tw-gap-[30px] tw-pb-[25px]">
      <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[4px]">
        <div className="tw-flex tw-w-full tw-items-center tw-gap-[4px]">
          <TbServer2 style={{ fontSize: "25px", color: "var(--text-2)" }} />
          <span className="tw-text-[16px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
            Servers
          </span>
        </div>
        <span className="tw-text-[12px] tw-text-left tw-text-[var(--text-2)]">
          Check out some of these servers, or start your own realm.
        </span>
      </div>
      <div className="tw-w-full tw-flex tw-flex-1 tw-items-center tw-gap-[10px]">
        {isLoaded ? (
          pages.results.length === 0 ? (
            <div className="tw-w-full tw-flex tw-flex-col tw-justify-center tw-items-center tw-gap-[10px] tw-pb-[20px] tw-pt-[80px]">
              <RiPagesLine
                style={{
                  fontSize: "80px",
                  color: "var(--text-2)",
                }}
              />
              <div className="tw-flex tw-flex-col tw-gap-[5px]">
                <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text-2)]">
                  No servers yet
                </span>
                <span className="tw-text-[14px] tw-font-Inter tw-text-[var(--text-2)]">
                  Create your server and start building a community.
                </span>
              </div>
            </div>
          ) : (
            <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
              {pages.results.map((mp: IRealmProfileInfo) => {
                return <PublicServerItem key={mp.id} mp={mp} flexed={true} />;
              })}
            </div>
          )
        ) : (
          <div className="tw-w-full tw-flex tw-flex-wrap tw-gap-[10px]">
            {Array.from({ length: 20 }).map((_, i) => {
              return <ServerItemLoader key={i} flexed={true} />;
            })}
          </div>
        )}
      </div>
      <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[4px]">
        <span className="tw-text-[12px]">
          Explore the servers realm <a href={`/servers`}>here</a>
        </span>
      </div>
    </div>
  );
}

export default ServerBanner;
