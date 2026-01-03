import { motion } from "framer-motion";
import { ReactNode, useState } from "react";

const DynamicToggleSwitch = ({
  list,
  mode,
  setMode,
}: {
  list: { icon: ReactNode; label: string; lottie: ReactNode }[];
  mode: number;
  setMode: (mode: number) => void;
}) => {
  const [currentSelection, setcurrentSelection] = useState<number>(mode);

  const options = list;

  const currentIndex = currentSelection + 1;
  const leftMargin = currentIndex - 1;
  const rightMargin = options.length - currentIndex;

  return (
    <div className="tw-p-[10px] tw--mt-[10px] tw-relative">
      <div className="tw-bg-[#eaecef] tw-flex tw-justify-between tw-rounded-md tw-min-h-[35px] tw-z-[2] tw-absolute tw-w-[calc(100%-20px)]"></div>
      <div className="tw-bg-transparent tw-flex tw-justify-between tw-rounded-md tw-min-h-[35px] tw-z-[10] tw-absolute tw-w-[calc(100%-20px)]">
        {options.map((mp: { icon: ReactNode; label: string }, i: number) => {
          return (
            <button
              key={i}
              className="tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-none tw-bg-transparent tw-h-[35px]"
              onClick={() => {
                setcurrentSelection(
                  options.findIndex(
                    (ind: { icon: ReactNode; label: string }) => ind === mp
                  )
                );
                setMode(
                  options.findIndex(
                    (ind: { icon: ReactNode; label: string }) => ind === mp
                  )
                );
              }}
            >
              <span
                className={`tw-text-[12px] tw-font-Inter tw-text-center ${
                  currentSelection === i && "tw-text-white tw-font-semibold"
                }`}
              >
                {mp.icon} {mp.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="tw-bg-transparent tw-flex tw-justify-between tw-rounded-md tw-min-h-[35px] tw-absolute tw-top-[10px] tw-w-[calc(100%-20px)] tw-z-[5]">
        {Array.from({ length: leftMargin }).map((__, i: number) => {
          return (
            <motion.button
              key={i + 1}
              initial={{
                flex: 0,
              }}
              animate={{
                flex: 1,
              }}
              className="tw-flex tw-justify-center tw-items-center tw-border-none tw-transparent tw-h-[35px] tw-rounded-md"
            ></motion.button>
          );
        })}
        <button className="tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-none tw-bg-[#99a3b2] tw-h-[35px] tw-rounded-md"></button>
        {Array.from({ length: rightMargin }).map((__, i: number) => {
          return (
            <motion.button
              key={i + 0.1}
              initial={{
                flex: 0,
              }}
              animate={{
                flex: 1,
              }}
              className="tw-flex tw-justify-center tw-items-center tw-border-none tw-transparent tw-h-[35px] tw-rounded-md"
            ></motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default DynamicToggleSwitch;
