/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AuthenticationInterface,
  INewEntry,
} from "@/reusables/vars/interfaces";
import { useMemo, useState } from "react";
import { BiSolidImageAdd } from "react-icons/bi";
import { FaSave } from "react-icons/fa";
import { IoArrowBack } from "react-icons/io5";
import { MdImageNotSupported } from "react-icons/md";
import ReactQuill from "react-quill";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

function NewEntry() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener]
  );

  const navigate = useNavigate();

  const toolbarOptions = [
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

  const modules = {
    toolbar: toolbarOptions,
  };

  const [newEntryData, setnewEntryData] = useState<INewEntry>({
    title: "",
    content: "",
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

  return (
    <div className="tw-flex tw-flex-col tw-gap-[15px] tw-h-auto tw-w-full tw-bg-white tw-rounded-[7px] tw-items-center">
      <div className="tw-w-[calc(100%-40px)] tw-flex tw-items-center tw-h-[31px] tw-gap-[2px] tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
        {isMobileView && (
          <button
            onClick={() => {
              navigate(`/${authentication.user.userID}/diary`);
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
            <button className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]">
              <FaSave size={18} />
              <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
                Save
              </span>
            </button>
          )}
        </div>
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
        <input
          id="input_gc_name"
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
      </div>
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
        <div className="tw-w-full tw-min-h-[300px] tw-bg-[#eaecef] tw-rounded-[7px] my-editor-wrapper">
          <ReactQuill
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
      <div className="tw-w-[calc(100%-40px)] tw-max-w-[1200px] tw-flex tw-flex-col tw-p-[10px] tw-pl-[20px] tw-pr-[20px] tw-gap-[10px]">
        <div className="tw-w-full tw-flex tw-items-center tw-justify-between">
          <span className="tw-text-[14px] tw-font-semibold tw-font-Inter">
            Attachments
          </span>
          <button
            disabled
            className="tw-cursor-pointer tw-h-[35px] tw-border-none tw-rounded-md tw-pl-[10px] tw-pr-[10px] tw-items-center tw-flex tw-gap-[6px]"
          >
            <BiSolidImageAdd size={18} />
            <span className="tw-text-[12px] tw-font-Inter tw-font-semibold">
              Add Attachments
            </span>
          </button>
        </div>
        <div className="tw-bg-[#f7f7f9] tw-w-full tw-flex tw-min-h-[300px] tw-rounded-[7px] tw-items-center tw-justify-center">
          <div className="tw-flex tw-gap-[10px] tw-flex-col tw-items-center">
            <MdImageNotSupported size={70} color="#808080" />
            <span className="tw-text-[12px] tw-font-Inter tw-font-normal tw-text-[#808080]">
              No Attachments Yet
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NewEntry;
