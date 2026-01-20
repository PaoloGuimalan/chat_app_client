/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetEntryRequest } from "@/reusables/hooks/requests";
import {
  AuthenticationInterface,
  IEntry,
  IEntryTag,
} from "@/reusables/vars/interfaces";
import { Fragment, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { formattedDateToWords } from "@/reusables/hooks/reusable";

function EntryView() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const [searchParams] = useSearchParams();

  const entry_id = searchParams.get("entry_id");

  const [currentEntry, setcurrentEntry] = useState<IEntry | null>(null);
  const [isLoaded, setisLoaded] = useState<boolean>(false);

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const isPreMobileView = useMemo(
    () => screensizelistener.W < 1160,
    [screensizelistener],
  );

  const navigate = useNavigate();

  const GetEntryProcess = () => {
    setisLoaded(false);
    GetEntryRequest(entry_id!)
      .then((response) => {
        setisLoaded(true);
        if (response) {
          setcurrentEntry(response);
        }
      })
      .catch((err) => {
        setisLoaded(true);
        console.log(err);
      });
  };

  useEffect(() => {
    if (entry_id) {
      if (!currentEntry) {
        GetEntryProcess();
      } else {
        if (currentEntry.id !== entry_id) {
          GetEntryProcess();
        }
      }
    }
  }, [entry_id, currentEntry]);

  return (
    <div className="tw-flex tw-flex-col tw-gap-[15px] tw-h-auto tw-w-full tw-bg-white tw-rounded-[7px] tw-items-center">
      {isLoaded && currentEntry && (
        <Fragment>
          <div className="tw-w-[calc(100%-40px)] tw-flex tw-items-center tw-h-[31px] tw-gap-[2px] tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
            {isMobileView && (
              <button
                onClick={() => {
                  navigate(`/${authentication.user.userID}/diary`);
                }}
                className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-h-[40px] tw-w-[40px]"
              >
                <IoArrowBack style={{ fontSize: "20px" }} />
              </button>
            )}
            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
              {currentEntry.title}
            </span>
          </div>
          <div className="tw-w-[calc(100%-40px)] tw-pl-[20px] tw-pr-[20px]">
            <motion.div
              initial={{
                flexDirection: isPreMobileView ? "column" : "row",
              }}
              animate={{
                flexDirection: isPreMobileView ? "column" : "row",
              }}
              className="tw-w-full tw-flex tw-gap-[10px]"
            >
              {isPreMobileView && (
                <div className="tw-bg-[#f0f0f0] tw-rounded-[7px] tw-p-[10px]">
                  <div className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[4px] tw-items-center">
                    <span className="tw-text-left">
                      Entry dated on{" "}
                      <span className="tw-font-semibold">
                        {formattedDateToWords(
                          currentEntry.entry_date,
                          "YYYY-MM-DD",
                        )}
                      </span>
                    </span>
                  </div>
                </div>
              )}
              <div className="tw-min-h-[300px] tw-w-[calc(100%-20px)] tw-flex-1 tw-bg-[#f0f0f0] tw-p-[10px] tw-pt-[0px] tw-rounded-[7px]">
                <div
                  className="tw-text-[14px] tw-text-left"
                  dangerouslySetInnerHTML={{ __html: currentEntry.content }}
                />
              </div>
              <motion.div
                initial={{
                  maxWidth: isPreMobileView ? "none" : "300px",
                }}
                animate={{
                  maxWidth: isPreMobileView ? "none" : "300px",
                }}
                className="tw-w-full tw-flex-1 tw-font-Inter tw-gap-[10px] tw-flex tw-flex-col tw-rounded-[7px]"
              >
                {currentEntry.mood && (
                  <div className="tw-bg-[#f0f0f0] tw-rounded-[7px] tw-p-[10px]">
                    <div className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[4px] tw-items-center">
                      <span className="tw-text-left">You were feeling</span>
                      <span className="tw-font-semibold tw-text-left">
                        {currentEntry.mood.emoji} {currentEntry.mood.name}
                      </span>
                    </div>
                  </div>
                )}
                {currentEntry.tag_objects.length > 0 && (
                  <div className="tw-bg-[#f0f0f0] tw-rounded-[7px] tw-p-[10px]">
                    <motion.div
                      initial={{
                        flexDirection: isPreMobileView ? "row" : "column",
                        alignItems: isPreMobileView ? "center" : "start",
                        flexWrap: isPreMobileView ? "wrap" : "nowrap",
                      }}
                      animate={{
                        flexDirection: isPreMobileView ? "row" : "column",
                        alignItems: isPreMobileView ? "center" : "start",
                        flexWrap: isPreMobileView ? "wrap" : "nowrap",
                      }}
                      className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[6px]"
                    >
                      <span className="tw-text-left">
                        You were talking about
                      </span>
                      {isPreMobileView ? (
                        currentEntry.tag_objects.map((mp: IEntryTag) => {
                          return (
                            <div
                              key={mp.id}
                              className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                            >
                              <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-white">
                                {mp.name}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <div className="tw-flex tw-flex-wrap tw-gap-[4px]">
                          {currentEntry.tag_objects.map((mp: IEntryTag) => {
                            return (
                              <div
                                key={mp.id}
                                className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[#c4c4c4] tw-rounded-[7px]"
                              >
                                <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-white">
                                  {mp.name}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  </div>
                )}
                {!isPreMobileView && (
                  <DatePicker
                    readOnly
                    selected={
                      currentEntry.entry_date
                        ? new Date(currentEntry.entry_date)
                        : null
                    }
                    inline
                    className="tw-font-Inter tw-w-full"
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
        </Fragment>
      )}
    </div>
  );
}

export default EntryView;
