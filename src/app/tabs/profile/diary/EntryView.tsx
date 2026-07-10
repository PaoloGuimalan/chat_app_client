/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GetEntryRequest } from "@/reusables/hooks/requests";
import {
  IEntry,
  IEntryTag,
  IEntryViewAttachment,
} from "@/reusables/vars/interfaces";
import { Fragment, useEffect, useMemo, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { formattedDateToWords } from "@/reusables/hooks/reusable";
import UploadedAttachment from "./UploadedAttachment";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import DOMPurify from "dompurify";

function EntryView() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const [searchParams] = useSearchParams();

  const params = useParams();

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
    <div className="tw-flex tw-flex-col tw-gap-[16px] tw-h-auto tw-w-full tw-bg-[var(--surface)] tw-border tw-border-[var(--border)] tw-shadow-[var(--shadow-sm)] tw-rounded-[var(--r-md)] tw-items-center tw-pb-[12px] tw-min-h-0">
      {isLoaded && currentEntry && (
        <Fragment>
          <div className="tw-w-full tw-flex tw-items-center tw-min-h-[56px] tw-gap-[8px] tw-px-[20px] tw-py-[14px] tw-border-b tw-border-[var(--border)]">
            {isMobileView && (
              <button
                onClick={() => {
                  navigate(`/${params.userID}/diary`);
                }}
                className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-[var(--surface-2)] tw-h-[40px] tw-w-[40px] tw-rounded-full tw-text-[var(--text)]"
              >
                <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
              </button>
            )}
            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-text-[var(--text)]">
              {currentEntry.title}
            </span>
          </div>
          <div className="tw-w-full tw-px-[20px]">
            <motion.div
              initial={{
                flexDirection: isPreMobileView ? "column" : "row",
              }}
              animate={{
                flexDirection: isPreMobileView ? "column" : "row",
              }}
              className="tw-w-full tw-flex tw-gap-[12px]"
            >
              {isPreMobileView && (
                <div className="tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)] tw-p-[12px]">
                  <div className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[4px] tw-items-center tw-text-[var(--text)]">
                    <span className="tw-text-left tw-text-[var(--text)]">
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
              <div className="tw-min-h-[300px] tw-w-full tw-flex-1 tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-p-[12px] tw-pt-[0px] tw-rounded-[var(--r-md)] tw-flex tw-flex-col tw-gap-[12px]">
                <div
                  className="tw-text-[14px] tw-text-left tw-text-[var(--text)]"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(currentEntry.content),
                  }}
                />
                {currentEntry.link_preview && (
                  <LinkPreviewCard
                    preview={currentEntry.link_preview}
                    variant="display"
                  />
                )}
              </div>
              <motion.div
                initial={{
                  maxWidth: isPreMobileView ? "none" : "300px",
                }}
                animate={{
                  maxWidth: isPreMobileView ? "none" : "300px",
                }}
                className="tw-w-full tw-flex-1 tw-font-Inter tw-gap-[12px] tw-flex tw-flex-col tw-rounded-[var(--r-md)] tw-min-w-0"
              >
                {currentEntry.mood && (
                  <div className="tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)] tw-p-[12px]">
                    <div className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[4px] tw-items-center tw-text-[var(--text)]">
                      <span className="tw-text-left tw-text-[var(--text)]">You were feeling</span>
                      <span className="tw-font-semibold tw-text-left">
                        {currentEntry.mood.emoji} {currentEntry.mood.name}
                      </span>
                    </div>
                  </div>
                )}
                {currentEntry.tag_objects.length > 0 && (
                  <div className="tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-rounded-[var(--r-md)] tw-p-[12px]">
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
                      className="tw-flex tw-font-Inter tw-text-[14px] tw-gap-[6px] tw-text-[var(--text)]"
                    >
                      <span className="tw-text-left tw-text-[var(--text)]">
                        You were talking about
                      </span>
                      {isPreMobileView ? (
                        currentEntry.tag_objects.map((mp: IEntryTag) => {
                          return (
                            <div
                              key={mp.id}
                              className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[var(--brand-soft)] tw-rounded-[7px]"
                            >
                              <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[var(--brand)]">
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
                                className="tw-p-[4px] tw-pl-[7px] tw-pr-[7px] tw-bg-[var(--brand-soft)] tw-rounded-[7px]"
                              >
                                <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-text-[var(--brand)]">
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
                    calendarClassName="cl-diary-datepicker"
                    className="tw-font-Inter tw-w-full"
                  />
                )}
              </motion.div>
            </motion.div>
          </div>
          {currentEntry.attachments.length > 0 && (
            <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-flex-col tw-px-[20px] tw-py-[10px] tw-gap-[10px]">
              <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
                <span className="tw-text-[14px] tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
                  Attachments
                </span>
              </div>
              <div className="tw-bg-[var(--surface-2)] tw-border tw-border-[var(--border)] tw-w-full tw-flex tw-min-h-[300px] tw-rounded-[var(--r-md)] tw-items-center tw-justify-center tw-p-[12px]">
                <div className="tw-flex tw-gap-[10px] tw-flex-row tw-flex-wrap tw-items-center tw-justify-center tw-w-full">
                  {currentEntry.attachments.map(
                    (attachment: IEntryViewAttachment) => {
                      return (
                        <UploadedAttachment
                          key={attachment.id}
                          attachment={attachment}
                        />
                      );
                    },
                  )}
                </div>
              </div>
            </div>
          )}
        </Fragment>
      )}
    </div>
  );
}

export default EntryView;
