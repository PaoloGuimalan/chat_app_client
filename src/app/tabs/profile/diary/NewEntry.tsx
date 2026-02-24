/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  GetMoodListRequest,
  GetTagsListRequest,
  PostNewEntryRequest,
  UploadMediaRequest,
} from "@/reusables/hooks/requests";
import {
  IEntry,
  IEntryAttachment,
  INewEntry,
  IPendingEntryAttachment,
} from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { BiSolidImageAdd } from "react-icons/bi";
import { FaSave } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { MdImageNotSupported } from "react-icons/md";
import ReactQuill from "react-quill";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import { AsyncPaginate } from "react-select-async-paginate";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CustomTagItem from "./CustomTagItem";
import {
  formatToDjangoDate,
  importNonImageData,
  parseDjangoDate,
} from "@/reusables/hooks/reusable";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import PendingAttachmentItem from "./PendingAttachmentItem";

function NewEntry({ reload }: { reload: (new_entry: IEntry) => void }) {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [medialist, setmedialist] = useState<IPendingEntryAttachment[]>([]);

  const params = useParams();
  const dispatch = useDispatch();

  const navigate = useNavigate();

  const toolbarOptions = useMemo(() => {
    return [
      [{ header: [1, 2, 3, 4, 5, 6, false] }],
      [{ font: [] }],
      ["bold", "italic", "underline", "strike"],
      ["blockquote", "code-block"],
      [{ list: "ordered" }, { list: "bullet" }],
      [{ script: "sub" }, { script: "super" }],
      [{ indent: "-1" }, { indent: "+1" }],
      [{ direction: "rtl" }],
      [{ color: [] }, { background: [] }],
      [{ align: [] }],
      ["clean"],
      [
        "link",
        // 'image',
        // 'video'
      ],
    ];
  }, []);

  const modules = useMemo(() => {
    return {
      toolbar: toolbarOptions,
    };
  }, [toolbarOptions]);

  const [newEntryData, setnewEntryData] = useState<INewEntry>({
    title: "",
    content: "",
    mood: null,
    tags: [],
    attachments: [],
    entry_date: null,
    is_private: true,
  });

  const [isSaving, setisSaving] = useState<boolean>(false);

  const isNewEntryDataComplete = useMemo(() => {
    if (
      newEntryData.title.trim() !== "" &&
      newEntryData.content.trim() !== ""
    ) {
      return true;
    }
    return false;
  }, [newEntryData]);

  const SaveNewEntry = () => {
    const pendingNewEntry = newEntryData;

    if (!pendingNewEntry.entry_date) {
      const dateWrap = new Date();
      const isoString = formatToDjangoDate(dateWrap);
      pendingNewEntry.entry_date = isoString;
    }

    if (medialist.length > 0) {
      setisSaving(true);

      UploadMediaRequest(medialist)
        .then((response) => {
          if (response.data.status) {
            const uploadedAttachments: IEntryAttachment[] =
              response.data.result.map((mp: any) => {
                return {
                  file_id: mp.fileID,
                  file_type: mp.fileType,
                  url: mp.fileDetails.data,
                };
              });

            pendingNewEntry.attachments = uploadedAttachments;
            setmedialist([]);
          }
        })
        .catch((err) => {
          setisSaving(false);
          console.log(err);
        })
        .finally(() => {
          PostNewEntryRequest(pendingNewEntry)
            .then((value) => {
              reload(value);
              navigate(`/${params.userID}/diary?entry_id=${value.id}`);
            })
            .catch((err) => {
              setisSaving(false);
              dispatch({
                type: SET_MUTATE_ALERTS,
                payload: {
                  alerts: {
                    type: "error",
                    content: "There was a problem saving your entry",
                  },
                },
              });
              console.log(err);
            });
        });

      return;
    }

    setisSaving(true);

    PostNewEntryRequest(pendingNewEntry)
      .then((value) => {
        reload(value);
        navigate(`/${params.userID}/diary?entry_id=${value.id}`);
      })
      .catch((err) => {
        setisSaving(false);
        dispatch({
          type: SET_MUTATE_ALERTS,
          payload: {
            alerts: {
              type: "error",
              content: "There was a problem saving your entry",
            },
          },
        });
        console.log(err);
      });
  };

  async function loadOptions(_: any, __: any, additional?: { page: any }) {
    let options: any[] = [];
    let hasMore: boolean = false;
    const page = (additional?.page ?? 1) as number;
    await GetMoodListRequest({ page: page, range: 10 }).then((value: any) => {
      options = value.results.map((mp: any) => ({
        ...mp,
        label: `${mp.emoji} ${mp.name}`,
        value: mp.id,
      }));
      hasMore = value.next ? true : false;
    });

    return {
      options: options,
      hasMore: hasMore,
      additional: {
        page: page + 1,
      },
    };
  }

  async function tagsLoadOptions(
    search: any,
    __: any,
    additional?: { page: any },
  ) {
    let options: any[] = [];
    let hasMore: boolean = false;
    const page = (additional?.page ?? 1) as number;
    await GetTagsListRequest({ search, page: page, range: 10 }).then(
      (value: any) => {
        let pendingOptions: any[] = [];

        if (page === 1 && value.results.is_new) {
          pendingOptions.push({
            id: Math.random(),
            name: search,
            label: search,
            value: Math.random(),
            is_new: true,
          });
        }

        pendingOptions = pendingOptions.concat(
          value.results.list.map((mp: any) => ({
            ...mp,
            label: mp.name,
            value: mp.id,
            is_new: false,
          })),
        );

        options = pendingOptions;
        hasMore = value.next ? true : false;
      },
    );

    return {
      options: options,
      hasMore: hasMore,
      additional: {
        page: page + 1,
      },
    };
  }

  const customStyles = {
    control: (base: any, _: any) => ({
      ...base,
      // Main selection box styles
      borderRadius: "7px",
      backgroundColor: "#eaecef",
      cursor: "pointer",
      border: "none",
    }),

    // Bonus: Single value inside selection
    singleValue: (base: any, _: any) => ({
      ...base,
      color: "#1f2937",
      fontWeight: 500,
      backgroundColor: "#eaecef",
    }),

    menu: (base: any, _: any) => ({
      ...base,
      backgroundColor: "#eaecef",
    }),

    menuList: (base: any) => ({
      ...base,
      padding: 0,
      maxHeight: "250px",
      "::-webkit-scrollbar": {
        width: "0.45rem",
        height: "0.45rem",
      },
      "::-webkit-scrollbar-track": {
        backgroundColor: "rgba(0, 0, 0, 0.123)",
      },
      "::-webkit-scrollbar-thumb": {
        backgroundColor: "grey",
      },
    }),
  };

  const sendNonImageFilesProcess = () => {
    importNonImageData(
      (arr: any) => {
        if (arr) {
          if (arr.type.includes("image")) {
            setmedialist((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                name: null,
                reference: arr.data,
                caption: "",
                referenceMediaType: "image",
              },
            ]);
          } else if (arr.type.includes("video")) {
            setmedialist((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                name: null,
                reference: arr.data,
                caption: "",
                referenceMediaType: "video",
              },
            ]);
          } else {
            setmedialist((prev: any) => [
              ...prev,
              {
                id: prev.length + 1,
                name: null,
                reference: arr.data,
                caption: "",
                referenceMediaType: arr.type,
              },
            ]);
          }
        } else {
          dispatch({
            type: SET_MUTATE_ALERTS,
            payload: {
              alerts: {
                type: "warning",
                content: "Cannot upload files greater than 25mb",
              },
            },
          });
        }
      },
      (rawFiles: any) => {
        if (rawFiles) {
          if (rawFiles.type.includes("image")) {
            // setrawmedialist({
            //   id: 1,
            //   name: null,
            //   reference: rawFiles.data,
            //   caption: "",
            //   referenceMediaType: "image",
            // });
          } else if (rawFiles.type.includes("video")) {
            // console.log(rawFiles)
            // setrawmedialist({
            //   id: 1,
            //   name: rawFiles.name,
            //   reference: rawFiles.data,
            //   caption: "",
            //   referenceMediaType: "video",
            // });
          }
        }
      },
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-[15px] tw-h-auto tw-w-full tw-bg-white tw-rounded-[7px] tw-items-center tw-relative">
      {isSaving && (
        <div
          className={`tw-absolute tw-h-full tw-w-full tw-bg-white tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center tw-z-[100]`}
        >
          <div id="div_conversation_content_loader">
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
              <AiOutlineLoading3Quarters style={{ fontSize: "28px" }} />
            </motion.div>
          </div>
        </div>
      )}
      <div className="tw-w-[calc(100%-40px)] tw-flex tw-items-center tw-h-[31px] tw-gap-[2px] tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
        {isMobileView && (
          <button
            onClick={() => {
              navigate(`/${params.userID}/diary`);
            }}
            className="tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-h-[40px] tw-w-[40px]"
          >
            <IoArrowBack style={{ fontSize: "20px" }} />
          </button>
        )}
        <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">
          Create New Entry
        </span>
        <div className="tw-flex tw-flex-1 tw-justify-end">
          {isNewEntryDataComplete && (
            <button
              disabled={isSaving}
              onClick={SaveNewEntry}
              className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]"
            >
              <FaSave size={18} />
              <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
                Save
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
        <input
          disabled={isSaving}
          id="input_title_name"
          type="text"
          value={newEntryData.title}
          onChange={(event) => {
            setnewEntryData((prev: INewEntry) => {
              return {
                ...prev,
                title: event.target.value,
              };
            });
          }}
          placeholder="Title"
        />
        {!isMobileView && (
          <AsyncPaginate
            isDisabled={isSaving}
            isSearchable={false}
            value={newEntryData.mood}
            loadOptions={loadOptions}
            onChange={(value: any) => {
              setnewEntryData((prev: INewEntry) => {
                return {
                  ...prev,
                  mood: value,
                };
              });
            }}
            additional={{
              page: 1,
            }}
            isClearable={true}
            placeholder="Select Mood"
            styles={customStyles}
            className="tw-w-[200px] tw-text-[12px] tw-font-Inter tw-text-left t-scroll"
          />
        )}
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-flex-col tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
        {isMobileView && (
          <AsyncPaginate
            isDisabled={isSaving}
            isSearchable={false}
            value={newEntryData.mood}
            loadOptions={loadOptions}
            onChange={(value: any) => {
              setnewEntryData((prev: INewEntry) => {
                return {
                  ...prev,
                  mood: value,
                };
              });
            }}
            additional={{
              page: 1,
            }}
            isClearable={true}
            placeholder="Select Mood"
            styles={customStyles}
            className="tw-text-[12px] tw-font-Inter tw-text-left t-scroll tw-flex-1"
          />
        )}
        <AsyncPaginate
          isDisabled={isSaving}
          isMulti
          value={newEntryData.tags}
          loadOptions={tagsLoadOptions}
          debounceTimeout={1000}
          onChange={(value: any) => {
            setnewEntryData((prev: INewEntry) => {
              return {
                ...prev,
                tags: value,
              };
            });
          }}
          components={{
            Option: CustomTagItem,
          }}
          additional={{
            page: 1,
          }}
          isClearable={true}
          placeholder="Select Tags"
          styles={customStyles}
          className="tw-text-[12px] tw-font-Inter tw-text-left t-scroll tw-flex-1"
        />
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
        <div className="tw-w-full tw-min-h-[300px] tw-bg-[#eaecef] tw-rounded-[7px] my-editor-wrapper">
          <ReactQuill
            readOnly={isSaving}
            modules={modules}
            value={newEntryData.content}
            onChange={(value: string) => {
              setnewEntryData((prev: INewEntry) => {
                return {
                  ...prev,
                  content: value,
                };
              });
            }}
            className="tw-w-full tw-rounded-[7px] tw-h-[calc(100%-42px)]"
          />
        </div>
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-flex-row tw-p-[0px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
        <div className="tw-flex tw-flex-1">
          <DatePicker
            autoComplete="off"
            disabled={isSaving}
            selected={
              newEntryData.entry_date
                ? parseDjangoDate(newEntryData.entry_date)
                : null
            }
            onChange={(date: any) => {
              const dateWrap = new Date(date);
              const isoString = formatToDjangoDate(dateWrap);
              setnewEntryData((prev: INewEntry) => {
                return {
                  ...prev,
                  entry_date: isoString,
                };
              });
            }}
            popperPlacement={isMobileView ? "bottom-end" : "bottom"}
            placeholderText="Select Entry Date"
            dateFormat="MMMM d, yyyy"
            id="input_entry_date"
            className="tw-font-Inter"
          />
        </div>
        <div className="tw-flex tw-flex-1">
          <AsyncPaginate
            isDisabled={isSaving}
            isSearchable={false}
            value={{
              value: newEntryData.is_private,
              label: newEntryData.is_private ? "Private" : "Public",
            }}
            loadOptions={() => {
              return {
                options: [
                  {
                    value: true,
                    label: "Private",
                  },
                  {
                    value: false,
                    label: "Public",
                  },
                ],
                hasMore: false,
              };
            }}
            onChange={(value: any) => {
              setnewEntryData((prev: INewEntry) => {
                return {
                  ...prev,
                  is_private: value.value,
                };
              });
            }}
            isClearable={false}
            placeholder="Select Privacy"
            styles={customStyles}
            className="tw-text-[12px] tw-font-Inter tw-text-left t-scroll tw-flex-1"
          />
        </div>
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-flex-col tw-p-[10px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <span className="tw-text-[14px] tw-font-semibold tw-font-Inter">
            Attachments
          </span>
          <button
            disabled={isSaving}
            onClick={sendNonImageFilesProcess}
            className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]"
          >
            <BiSolidImageAdd size={18} />
            <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
              Add Attachments
            </span>
          </button>
        </div>
        <div className="tw-bg-[#f7f7f9] tw-w-full tw-flex tw-min-h-[300px] tw-rounded-[7px] tw-items-center tw-justify-center">
          {medialist.length === 0 ? (
            <div className="tw-flex tw-gap-[10px] tw-flex-col tw-items-center">
              <MdImageNotSupported size={70} color="#808080" />
              <span className="tw-text-[12px] tw-font-Inter tw-font-normal tw-text-[#808080]">
                No Attachments Yet
              </span>
            </div>
          ) : (
            <div className="tw-flex tw-gap-[10px] tw-flex-row tw-flex-wrap tw-items-center tw-justify-center">
              {medialist.map((attachment: IPendingEntryAttachment) => {
                return (
                  <PendingAttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={(id: number) => {
                      setmedialist((prev) =>
                        prev.filter((att) => att.id !== id),
                      );
                    }}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NewEntry;
