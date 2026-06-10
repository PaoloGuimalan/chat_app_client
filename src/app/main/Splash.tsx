/* eslint-disable @typescript-eslint/no-explicit-any */
import ChatterLoopGif from "../../assets/imgs/chatterloop.gif";
import { useSelector } from "react-redux";
import { useTheme } from "@/reusables/design";

function Splash() {
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );
  const { theme } = useTheme();
  const isMobile = screensizelistener.W <= 900;

  return (
    <div
      className="cl-redesign"
      data-theme={theme}
      style={{
        position: "fixed",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 18,
        background:
          "radial-gradient(1200px 600px at 70% -10%, var(--bg-grad-a), var(--bg-grad-b))",
      }}
    >
      <img
        src={ChatterLoopGif}
        alt="ChatterLoop"
        style={{
          width: isMobile ? 110 : 150,
          height: isMobile ? 110 : 150,
          objectFit: "contain",
        }}
      />
      <div style={{ textAlign: "center" }}>
        <div
          style={{
            fontSize: isMobile ? 28 : 34,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "var(--text)",
          }}
        >
          Chatterloop
        </div>
        <div
          style={{
            marginTop: 6,
            fontSize: isMobile ? 13 : 15,
            color: "var(--text-2)",
            fontWeight: 500,
            letterSpacing: "0.02em",
          }}
        >
          Link · Share · Explore
        </div>
      </div>
    </div>
  );
}

export default Splash;
