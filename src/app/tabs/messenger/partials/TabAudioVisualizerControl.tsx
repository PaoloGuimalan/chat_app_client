import { useEffect, useState } from "react";
import { MdGraphicEq } from "react-icons/md";
import {
  startTabAudioCapture,
  stopTabAudioCapture,
  subscribeCapturing,
} from "@/reusables/hooks/mediaVisualizerBus";

const TabAudioVisualizerControl = () => {
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => subscribeCapturing(setCapturing), []);

  const handleStart = async () => {
    setError(null);
    try {
      await startTabAudioCapture();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Tab audio capture was cancelled.",
      );
    }
  };

  const handleStop = () => {
    stopTabAudioCapture();
  };

  return (
    <div
      id="div_tab_audio_visualizer_control"
      className="tw-absolute tw-top-[8px] tw-right-[8px] tw-z-10 tw-flex tw-flex-col tw-items-end tw-gap-[4px]"
    >
      <button
        onClick={capturing ? handleStop : handleStart}
        className={`tw-flex tw-items-center tw-gap-[5px] tw-rounded-[20px] tw-px-[10px] tw-py-[5px] tw-text-[11px] tw-font-Inter tw-cursor-pointer tw-border-none ${
          capturing
            ? "cl-tab-audio-visualizer-btn--active"
            : "cl-tab-audio-visualizer-btn"
        }`}
      >
        <MdGraphicEq />
        {capturing ? "Stop tab audio visualizer" : "Capture tab audio"}
      </button>
      {error && (
        <span className="tw-text-[10px] tw-text-red-500 tw-bg-white tw-px-[6px] tw-py-[2px] tw-rounded-[4px]">
          {error}
        </span>
      )}
    </div>
  );
};

export default TabAudioVisualizerControl;
