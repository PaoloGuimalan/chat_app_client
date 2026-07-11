let audioCtx: AudioContext | null = null;
let analyser: AnalyserNode | null = null;
let captureStream: MediaStream | null = null;
let capturingState = false;

type DisplayMediaOptionsWithCurrentTab = DisplayMediaStreamOptions & {
  preferCurrentTab?: boolean;
};

type CapturingListener = (capturing: boolean) => void;
let capturingListeners: CapturingListener[] = [];

const setCapturingState = (value: boolean) => {
  capturingState = value;
  capturingListeners.forEach((listener) => listener(value));
};

// Lets the canvas (inside the scrolling message list) and the start/stop
// button (outside it) stay in sync without sharing a React tree.
const subscribeCapturing = (listener: CapturingListener) => {
  capturingListeners.push(listener);
  listener(capturingState);
  return () => {
    capturingListeners = capturingListeners.filter((l) => l !== listener);
  };
};

const ensureContext = () => {
  if (!audioCtx) {
    const Ctor: typeof AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    audioCtx = new Ctor();
    analyser = audioCtx.createAnalyser();
    // Enough distinct frequency bins that wide screens (lots of bars) don't
    // end up sampling the same bin for many adjacent bars, which read as
    // "dead"/unmoving once sorted. Lower smoothing so bars react visibly
    // frame to frame instead of crawling toward new values.
    analyser.fftSize = 2048;
    analyser.smoothingTimeConstant = 0.6;
  }
  return { audioCtx, analyser: analyser as AnalyserNode };
};

const stopTabAudioCapture = () => {
  captureStream?.getTracks().forEach((track) => track.stop());
  captureStream = null;
  setCapturingState(false);
};

// Captures this browser tab's actual audio output (any media element,
// cross-origin iframe embeds like YouTube, anything the tab plays) via the
// browser's own screen/tab-share picker - there is no way to skip that
// consent step from a webpage, so this must be called from a user gesture.
const startTabAudioCapture = async (): Promise<void> => {
  const { audioCtx: ctx, analyser: node } = ensureContext();

  if (ctx.state === "suspended") {
    await ctx.resume().catch(() => {});
  }

  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: true,
    preferCurrentTab: true,
  } as DisplayMediaOptionsWithCurrentTab);

  const audioTracks = stream.getAudioTracks();
  if (audioTracks.length === 0) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error(
      'No tab audio was shared - check "Share tab audio" in the picker.',
    );
  }

  // Only audio is needed; release the video track immediately.
  stream.getVideoTracks().forEach((track) => track.stop());

  captureStream = stream;
  const source = ctx.createMediaStreamSource(stream);
  // Feed the analyser only - the tab's own audio is already playing through
  // the normal browser pipeline, so connecting to ctx.destination here would
  // play it a second time.
  source.connect(node);

  audioTracks[0].addEventListener("ended", () => {
    stopTabAudioCapture();
  });

  setCapturingState(true);
};

const isCapturing = () => captureStream !== null;

const getAnalyser = (): AnalyserNode | null => analyser;

export {
  startTabAudioCapture,
  stopTabAudioCapture,
  subscribeCapturing,
  isCapturing,
  getAnalyser,
};
