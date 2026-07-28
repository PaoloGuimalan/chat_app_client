import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MdGraphicEq } from "react-icons/md";
import {
  startTabAudioCapture,
  stopTabAudioCapture,
  subscribeCapturing,
} from "@/reusables/hooks/mediaVisualizerBus";

interface TabAudioVisualizerControlProp {
  iconSize?: number | string;
}

// Rendered as a plain row inside the conversation's options menu, next to
// the visualizer style picker, so both sound-related controls live in one
// place instead of one floating over the chat and one buried in the menu.
const TabAudioVisualizerControl = ({
  iconSize,
}: TabAudioVisualizerControlProp) => {
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
    <>
      <motion.button
        className={`cl-conversation-menu-action tw-flex tw-border-none tw-gap-[5px] tw-p-[5px] tw-items-center tw-w-auto tw-min-w-full tw-rounded-[4px] tw-cursor-pointer ${
          capturing
            ? "cl-conversation-menu-action--danger"
            : "cl-conversation-menu-action--accent cl-conversation-menu-action--server"
        }`}
        onClick={capturing ? handleStop : handleStart}
      >
        <MdGraphicEq style={{ fontSize: iconSize }} />
        <span className="cl-text-meta tw-font-Inter">
          {capturing ? "Stop Capturing Audio" : "Capture Tab Audio"}
        </span>
      </motion.button>
      {error && (
        <span className="cl-text-micro tw-text-red-500 tw-px-[5px] tw-pb-[3px] tw-block">
          {error}
        </span>
      )}
    </>
  );
};

export default TabAudioVisualizerControl;
