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
  parseDjangoDate,
  extractFirstUrlFromHtml,
} from "@/reusables/hooks/reusable";
import { pickFiles } from "@/reusables/hooks/pickFiles";
import { useDragAndDrop } from "@/reusables/hooks/useDragAndDrop";
import { useLinkPreview } from "@/reusables/hooks/useLinkPreview";
import LinkPreviewCard from "@/app/reusables/LinkPreviewCard";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { motion } from "framer-motion";
import { SET_MUTATE_ALERTS } from "@/redux/types";
import PendingAttachmentItem from "./PendingAttachmentItem";
import { MAX_UPLOAD_BYTES, MAX_UPLOAD_LABEL } from "@/reusables/vars/uploads";

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

  const linkPreviewComposerText = useMemo(
    () => extractFirstUrlFromHtml(newEntryData.content) || "",
    [newEntryData.content],
  );

  const linkPreview = useLinkPreview({
    text: linkPreviewComposerText,
    enabled: !isSaving,
  });

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

      UploadMediaRequest(
        medialist.map((mp) => ({
          file: mp.file,
          caption: mp.caption,
          referenceMediaType: mp.referenceMediaType,
        })),
      )
        .then((response) => {
          if (response.data.status) {
            const uploadedAttachments: IEntryAttachment[] =
              response.data.result.map((mp: any) => {
                return {
                  file_id: mp.fileID,
                  file_type: mp.fileType,
                  file_name: mp.fileName,
                  url: mp.fileDetails.data,
                };
              });

            pendingNewEntry.attachments = uploadedAttachments;
            medialist.forEach((mp) => URL.revokeObjectURL(mp.reference));
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
      minHeight: "48px",
      borderRadius: "var(--r-md)",
      backgroundColor: "var(--surface-2)",
      cursor: "pointer",
      border: "none",
      boxShadow: "none",
      paddingLeft: "2px",
      paddingRight: "2px",
    }),

    // Bonus: Single value inside selection
    singleValue: (base: any, _: any) => ({
      ...base,
      color: "var(--text)",
      fontWeight: 500,
      backgroundColor: "var(--surface-2)",
    }),

    menu: (base: any, _: any) => ({
      ...base,
      backgroundColor: "var(--surface)",
      border: "1px solid var(--border)",
      boxShadow: "var(--shadow-sm)",
      borderRadius: "var(--r-md)",
      overflow: "hidden",
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
        backgroundColor: "var(--surface-2)",
      },
      "::-webkit-scrollbar-thumb": {
        backgroundColor: "var(--border-2)",
      },
    }),
  };


  const addAttachmentFiles = (files: File[]) => {
    const oversized = files.some((file) => file.size > MAX_UPLOAD_BYTES);
    if (oversized) {
      dispatch({
        type: SET_MUTATE_ALERTS,
        payload: {
          alerts: {
            type: "warning",
            content: `Cannot upload files greater than ${MAX_UPLOAD_LABEL}`,
          },
        },
      });
    }

    files
      .filter((file) => file.size <= MAX_UPLOAD_BYTES)
      .forEach((file) => {
        setmedialist((prev: any) => [
          ...prev,
          {
            id: prev.length + 1,
            name: file.name,
            reference: URL.createObjectURL(file),
            caption: "",
            referenceMediaType: file.type.includes("image")
              ? "image"
              : file.type.includes("video")
                ? "video"
                : file.type,
            file,
          },
        ]);
      });
  };

  const sendNonImageFilesProcess = async () => {
    const files = await pickFiles({});
    addAttachmentFiles(files);
  };

  const {
    isDragging: isDraggingAttachments,
    dragHandlers: attachmentDragHandlers,
  } = useDragAndDrop({
    onFiles: addAttachmentFiles,
    disabled: isSaving,
  });

  return (
    <div className="tw-flex tw-flex-col tw-gap-[16px] tw-h-auto tw-w-full tw-bg-[var(--surface)] tw-rounded-[var(--r-md)] tw-items-center tw-relative tw-min-h-0">
      {isSaving && (
        <div
          className={`tw-absolute tw-inset-0 tw-bg-[var(--surface)] tw-opacity-[0.8] tw-flex tw-items-center tw-justify-center tw-z-[100]`}
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
      <div className="tw-w-full tw-flex tw-items-center tw-min-h-[56px] tw-gap-[8px] tw-px-[20px] tw-py-[14px] tw-border-b tw-border-[var(--border)]">
        {isMobileView && (
          <button
            onClick={() => {
              navigate(`/${params.userID}/diary`);
            }}
            className="tw-flex tw-items-center tw-justify-center tw-border-none tw-bg-transparent tw-h-[40px] tw-w-[40px] tw-rounded-full tw-text-[var(--text)]"
          >
            <IoArrowBack style={{ fontSize: "20px", color: "var(--text)" }} />
          </button>
        )}
        <span className="cl-text-body tw-font-Inter tw-font-semibold tw-text-[var(--text)]">
          Create New Entry
        </span>
        <div className="tw-flex tw-flex-1 tw-justify-end">
          {isNewEntryDataComplete && (
            <button
              disabled={isSaving}
              onClick={SaveNewEntry}
              className="tw-cursor-pointer tw-h-[38px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-rounded-[var(--r-md)] tw-pl-[12px] tw-pr-[12px] tw-items-center tw-flex tw-gap-[6px] tw-text-[var(--text)]"
            >
              <FaSave size={18} color="var(--text)" />
              <span className="cl-text-caption tw-font-Inter tw-font-semibold tw-text-[var(--text)]">
                Save
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-px-[20px] tw-gap-[12px]">
        <input
          disabled={isSaving}
          id="input_title_name"
          type="text"
          className="tw-h-[50px] tw-rounded-xl"
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
            className="tw-w-[200px] cl-text-caption tw-font-Inter tw-text-left t-scroll"
          />
        )}
      </div>
      <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-flex-col tw-px-[20px] tw-gap-[12px]">
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
            className="cl-text-caption tw-font-Inter tw-text-left t-scroll tw-flex-1"
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
          className="cl-text-caption tw-font-Inter tw-text-left t-scroll tw-flex-1"
        />
      </div>
      <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-px-[20px]">
        <div className="tw-w-full tw-min-h-[300px] tw-bg-[var(--surface-2)] tw-rounded-[var(--r-md)] my-editor-wrapper tw-border tw-border-[var(--border)]">
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
            className="tw-w-full tw-rounded-[var(--r-md)] tw-h-[calc(100%-42px)]"
          />
        </div>
      </div>
      {linkPreview.status === "ok" && linkPreview.preview && (
        <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-px-[20px]">
          <LinkPreviewCard
            preview={linkPreview.preview}
            variant="composer"
            onRemove={linkPreview.dismiss}
          />
        </div>
      )}
      <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-flex-row tw-px-[20px] tw-gap-[12px]">
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
            calendarClassName="cl-diary-datepicker"
            className="tw-font-Inter tw-h-[50px]"
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
            className="cl-text-caption tw-font-Inter tw-text-left t-scroll tw-flex-1"
          />
        </div>
      </div>
      <div className="tw-w-full tw-max-w-[1200px] tw-flex tw-flex-col tw-px-[20px] tw-py-[10px] tw-gap-[12px]">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <span className="cl-text-body tw-font-semibold tw-font-Inter tw-text-[var(--text)]">
            Attachments
          </span>
          <button
            disabled={isSaving}
            onClick={sendNonImageFilesProcess}
            className="tw-cursor-pointer tw-h-[38px] tw-border tw-border-[var(--border)] tw-bg-[var(--surface-2)] tw-rounded-[var(--r-md)] tw-pl-[12px] tw-pr-[12px] tw-items-center tw-flex tw-gap-[6px] tw-text-[var(--text)]"
          >
            <BiSolidImageAdd size={18} color="var(--text)" />
            <span className="cl-text-caption tw-font-Inter tw-font-semibold tw-text-[var(--text)]">
              Add Attachments
            </span>
          </button>
        </div>
        <div
          {...attachmentDragHandlers}
          className={`tw-bg-[var(--surface-2)] tw-border tw-border-dashed tw-w-full tw-flex tw-min-h-[300px] tw-rounded-[var(--r-md)] tw-items-center tw-justify-center tw-p-[12px] ${
            isDraggingAttachments
              ? "tw-border-[var(--brand)]"
              : "tw-border-[var(--border)]"
          }`}
        >
          {isDraggingAttachments ? (
            <div className="tw-flex tw-gap-[10px] tw-flex-col tw-items-center">
              <MdImageNotSupported size={70} color="var(--text-2)" />
              <span className="cl-text-caption tw-font-Inter tw-font-normal tw-text-[var(--text-2)]">
                Drop files to attach
              </span>
            </div>
          ) : medialist.length === 0 ? (
            <div className="tw-flex tw-gap-[10px] tw-flex-col tw-items-center">
              <MdImageNotSupported size={70} color="var(--text-2)" />
              <span className="cl-text-caption tw-font-Inter tw-font-semibold tw-text-[var(--text-2)]">
                Drag & drop files here
              </span>
              <span className="cl-text-caption tw-font-Inter tw-font-normal tw-text-[var(--text-2)]">
                or click Add Attachments above
              </span>
            </div>
          ) : (
            <div className="tw-flex tw-gap-[10px] tw-flex-row tw-flex-wrap tw-items-center tw-justify-center tw-w-full">
              {medialist.map((attachment: IPendingEntryAttachment) => {
                return (
                  <PendingAttachmentItem
                    key={attachment.id}
                    attachment={attachment}
                    onRemove={(id: number) => {
                      const removed = medialist.find((att) => att.id === id);
                      if (removed?.reference)
                        URL.revokeObjectURL(removed.reference);
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
