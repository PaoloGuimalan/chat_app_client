import { IPendingEntryAttachment } from "@/reusables/vars/interfaces";
import {
  FaImage,
  FaVideo,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileArchive,
  FaQuestionCircle,
  FaPlay,
  FaPause,
  FaTimes,
} from "react-icons/fa";
import { useState, useRef, useEffect } from "react";

function PendingAttachmentItem({
  attachment,
  onRemove,
}: {
  attachment: IPendingEntryAttachment;
  onRemove: (id: number) => void;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState("0:00");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const audioRef = useRef<HTMLAudioElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const getFileIcon = (mediaType: string) => {
    if (mediaType.startsWith("image"))
      return <FaImage className="tw-w-12 tw-h-12 tw-text-blue-500" />;
    if (mediaType.startsWith("video"))
      return <FaVideo className="tw-w-12 tw-h-12 tw-text-purple-500" />;
    if (mediaType.includes("pdf"))
      return <FaFilePdf className="tw-w-12 tw-h-12 tw-text-red-500" />;
    if (
      mediaType.includes("msword") ||
      mediaType.includes("officedocument.wordprocessing")
    )
      return <FaFileWord className="tw-w-12 tw-h-12 tw-text-blue-500" />;
    if (
      mediaType.includes("sheet") ||
      mediaType.includes("officedocument.spreadsheet")
    )
      return <FaFileExcel className="tw-w-12 tw-h-12 tw-text-green-500" />;
    if (
      mediaType.includes("presentation") ||
      mediaType.includes("officedocument.presentation")
    )
      return (
        <FaFilePowerpoint className="tw-w-12 tw-h-12 tw-text-orange-500" />
      );
    if (
      mediaType.includes("zip") ||
      mediaType.includes("rar") ||
      mediaType.includes("7z")
    )
      return <FaFileArchive className="tw-w-12 tw-h-12 tw-text-yellow-500" />;
    return <FaQuestionCircle className="tw-w-12 tw-h-12 tw-text-gray-400" />;
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const toggleAudio = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
  };

  const getDimensions = () => {
    return dimensions.width > 0 && dimensions.height > 0
      ? { width: dimensions.width, height: dimensions.height }
      : { width: 150, height: 150 };
  };

  const getMediaSize = () => {
    const dims = getDimensions();
    const aspectRatio = dims.width / dims.height;
    let width = 150;
    let height = 150;
    if (aspectRatio > 1) {
      height = 150;
      width = Math.max(150, height * aspectRatio);
    } else if (aspectRatio < 1) {
      width = 150;
      height = Math.max(150, width / aspectRatio);
    }
    return { width: Math.round(width), height: Math.round(height) };
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const updateDuration = () => {
      setDuration(formatDuration(audio.duration || 0));
    };
    audio.addEventListener("loadedmetadata", updateDuration);
    return () => {
      audio.removeEventListener("loadedmetadata", updateDuration);
    };
  }, []);

  useEffect(() => {
    if (imgRef.current && attachment.referenceMediaType.startsWith("image")) {
      const img = imgRef.current;
      const updateDimensions = () => {
        setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
      };
      if (img.naturalWidth > 0 && img.naturalHeight > 0) {
        updateDimensions();
      } else {
        img.onload = updateDimensions;
      }
    }
  }, [attachment.reference, attachment.referenceMediaType]);

  useEffect(() => {
    if (videoRef.current && attachment.referenceMediaType.startsWith("video")) {
      const video = videoRef.current;
      const updateDimensions = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          setDimensions({ width: video.videoWidth, height: video.videoHeight });
        }
      };
      video.addEventListener("loadedmetadata", updateDimensions);
      return () => {
        video.removeEventListener("loadedmetadata", updateDimensions);
      };
    }
  }, [attachment.reference, attachment.referenceMediaType]);

  const renderMediaPreview = () => {
    if (attachment.referenceMediaType.startsWith("image")) {
      const size = getMediaSize();
      return (
        <div
          className="tw-relative tw-rounded-[5px] tw-border tw-border-gray-200 tw-bg-gray-50 hover:tw-bg-gray-100 tw-transition-colors"
          style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
          <img
            ref={imgRef}
            src={attachment.reference}
            alt={attachment.caption || ""}
            className="tw-w-full tw-h-full tw-object-cover tw-rounded-[5px]"
          />
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              className="tw-rounded-[50px] tw-absolute -tw-top-1 -tw-right-1 tw-w-[25px] tw-h-[25px] tw-border-none tw-cursor-pointer"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
      );
    }

    if (attachment.referenceMediaType.startsWith("video")) {
      const size = getMediaSize();
      return (
        <div
          className="tw-relative tw-rounded-[5px] tw-border tw-border-gray-200 tw-bg-gray-50 hover:tw-bg-gray-100 tw-transition-colors"
          style={{ width: `${size.width}px`, height: `${size.height}px` }}
        >
          <video
            ref={videoRef}
            controls
            className="tw-w-full tw-h-full tw-object-cover tw-rounded-[5px]"
            preload="metadata"
          >
            <source src={attachment.reference} type="video/mp4" />
            <source src={attachment.reference} type="video/webm" />
            <source src={attachment.reference} type="video/ogg" />
          </video>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              className="tw-rounded-[50px] tw-absolute -tw-top-1 -tw-right-1 tw-w-[25px] tw-h-[25px] tw-border-none tw-cursor-pointer"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
      );
    }

    const cardClass =
      "tw-relative tw-rounded-[5px] tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-border tw-border-gray-200 tw-bg-gray-50 hover:tw-bg-gray-100 tw-transition-colors tw-w-[150px] tw-h-[150px]";

    if (attachment.referenceMediaType.startsWith("audio")) {
      return (
        <div className={`${cardClass} tw-gap-4`}>
          <div
            className="tw-w-14 tw-h-14 tw-rounded-full tw-bg-gradient-to-br tw-from-green-400 tw-to-emerald-500 tw-flex tw-items-center tw-justify-center tw-cursor-pointer tw-shadow-lg hover:tw-scale-105 tw-transition-all"
            onClick={toggleAudio}
          >
            {isPlaying ? (
              <FaPause className="tw-w-5 tw-h-5 tw-text-black" />
            ) : (
              <FaPlay className="tw-w-5 tw-h-5 tw-text-black" />
            )}
          </div>
          <div className="tw-flex tw-flex-col tw-items-center tw-gap-1">
            <span className="tw-text-xs tw-text-gray-600 tw-truncate tw-max-w-[110px] tw-text-center">
              {attachment.name || "Audio file"}
            </span>
            <span className="tw-text-xs tw-text-gray-500 tw-text-center">
              {duration}
            </span>
          </div>
          <audio
            ref={audioRef}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            preload="metadata"
            className="tw-hidden"
          >
            <source src={attachment.reference} type="audio/mpeg" />
            <source src={attachment.reference} type="audio/wav" />
            <source src={attachment.reference} type="audio/ogg" />
            <source src={attachment.reference} type="audio/mp3" />
          </audio>
          {onRemove && (
            <button
              type="button"
              onClick={() => onRemove(attachment.id)}
              className="tw-rounded-[50px] tw-absolute -tw-top-1 -tw-right-1 tw-w-[25px] tw-h-[25px] tw-border-none tw-cursor-pointer"
            >
              <FaTimes size={11} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className={`${cardClass} tw-gap-3`}>
        {getFileIcon(attachment.referenceMediaType)}
        <span className="tw-text-xs tw-text-gray-700 tw-text-center tw-px-2 tw-truncate tw-max-w-[130px]">
          {attachment.name || "Preview not available"}
        </span>
        {onRemove && (
          <button
            type="button"
            onClick={() => onRemove(attachment.id)}
            className="tw-rounded-[50px] tw-absolute -tw-top-1 -tw-right-1 tw-w-[25px] tw-h-[25px] tw-border-none tw-cursor-pointer"
          >
            <FaTimes size={11} />
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-2 tw-items-center tw-p-2">
      {renderMediaPreview()}
    </div>
  );
}

export default PendingAttachmentItem;
