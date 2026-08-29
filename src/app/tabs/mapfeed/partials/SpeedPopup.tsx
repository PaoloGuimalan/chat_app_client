import { SpeedPopupProp } from "@/reusables/vars/props";
import { Popup } from "@vis.gl/react-maplibre";
import { SemiCircleProgress } from "react-semicircle-progressbar";
import { motion } from "framer-motion";
import { useTheme } from "@/reusables/design";

function SpeedPopup({ coordinates, maxSpeed }: SpeedPopupProp) {
  /* react-semicircle-progressbar paints SVG strokes, which cannot read a CSS
   * variable off the popup, so the track colour is resolved here instead.
   * Both values are --surface-3. */
  const { theme } = useTheme();
  const trackColor = theme === "dark" ? "#222a3a" : "#eceff3";

  const speedPercentage =
    (+((coordinates.speed ?? 0) * 3.6).toFixed(2) / maxSpeed) * 100;

  return (
    <Popup
      longitude={coordinates.longitude}
      latitude={coordinates.latitude}
      anchor="bottom-right"
      style={{
        width: "auto",
        minWidth: "120px",
        paddingBottom: "10px",
        paddingLeft: "0px",
        // paddingBottom: "10px",
        // paddingLeft: "10px",
        // backgroundColor: "transparent",
      }}
      closeOnClick={false}
      closeButton={false}
    >
      <div className="tw-flex tw-flex-row tw-items-center tw-h-[35px]">
        <motion.div
          initial={{
            rotate: -90,
          }}
          className="tw-absolute"
        >
          <SemiCircleProgress
            percentage={speedPercentage}
            size={{
              width: 50,
              height: 40,
            }}
            strokeWidth={15}
            fontStyle={{
              fontSize: "0px",
              fontWeight: "normal",
              fill: "transparent",
            }}
            hasBackground={true}
            bgStrokeColor={trackColor}
            strokeColor="#e69500" /* --gold */
          />
        </motion.div>
        <span className="tw-text-[12px] tw-font-Inter tw-font-semibold tw-absolute tw-ml-[30px]">
          {((coordinates.speed ?? 0) * 3.6).toFixed(0)} km/h
        </span>
      </div>
    </Popup>
  );
}

export default SpeedPopup;
