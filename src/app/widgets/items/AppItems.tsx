import { AppItemProp } from "@/reusables/vars/props";
import { useNavigate } from "react-router-dom";

function AppItems({ mp }: AppItemProp) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => {
        if (mp.navigation) {
          navigate(mp.navigation);

          return;
        }

        mp.click();
      }}
      className="tw-pl-[5px] tw-pr-[5px] tw-pt-[10px] tw-pb-[5px] tw-flex tw-flex-col tw-w-[60px] tw-cursor-pointer tw-select-none tw-items-center tw-gap-[2px] hover:tw-bg-[#e6e6e6] tw-rounded-[4px]"
    >
      {" "}
      {/**#9cc2ff */}
      <div className="tw-w-full tw-transparent tw-h-[40px] tw-flex tw-justify-center tw-items-center">
        {mp.icon}
      </div>
      <span className="cl-text-caption tw-font-Inter">{mp.appname}</span>
    </div>
  );
}

export default AppItems;
