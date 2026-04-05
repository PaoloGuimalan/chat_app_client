import { IRealmProfileInfo } from "@/reusables/vars/interfaces";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

function ManageRealm({ realm }: { realm: IRealmProfileInfo }) {
  const navigate = useNavigate();

  return (
    <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll">
      <button
        onClick={() => {
          navigate("/");
        }}
        className="tw-z-[10] tw-shadow-lg tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
      >
        <IoArrowBack style={{ fontSize: "20px" }} />
      </button>
      <div className="tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center">
        <span className="tw-text-[#666666] tw-text-[14px]">
          Manage {realm.type} is currently unavailable.
        </span>
      </div>
    </div>
  );
}

export default ManageRealm;
