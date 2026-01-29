/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Map,
  Source,
  Layer,
  // GeolocateControl
} from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  AuthenticationInterface,
  ICoordinatesAnchor,
} from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import ProfilePopup from "./partials/ProfilePopup";
import { motion } from "framer-motion";
import {
  FaAngleDown,
  FaAnglesUp,
  FaAngleUp,
  FaLocationCrosshairs,
} from "react-icons/fa6";
import { GiCarWheel } from "react-icons/gi";
import { BsPersonCircle } from "react-icons/bs";
import DynamicToggleSwitch from "@/app/reusables/togglers/DynamicToggleSwitch";
import { FaWalking } from "react-icons/fa";
import { MdCardTravel, MdShareLocation } from "react-icons/md";
import { SlSpeedometer } from "react-icons/sl";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import WalkingLottie from "../../../assets/lotties/walking-lottie.json";
import SuitCaseLottie from "../../../assets/lotties/suitcase-lottie.json";
import SpeedPopup from "./partials/SpeedPopup";
import { BroadcastCoordinatesRequest } from "@/reusables/hooks/requests";
import { useSearchParams } from "react-router-dom";

function MapFeed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const activeuserslist = useSelector((state: any) => state.activeuserslist);

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const [coordinates, setcoordinates] = useState<ICoordinatesAnchor[]>([
    {
      referenceID: authentication.user.userID,
      longitude: 120.9842,
      latitude: 14.5995,
      heading: -17.6,
      speed: 0,
      mode: null,
    },
  ]);

  const [followLocation, setFollowLocation] = useState<string | null>(
    authentication.user.userID,
  );

  const [isLocationSharing, setisLocationSharing] = useState<boolean>(false);

  const [toggleProfileView, settoggleProfileView] = useState<boolean>(false);

  const [toggleLevel, settoggleLevel] = useState<number>(0);

  const [toggleSpeed, settoggleSpeed] = useState<boolean>(false);

  const myLocation = useMemo<ICoordinatesAnchor | null>(() => {
    if (authentication.user.userID) {
      const currentCoordinates = coordinates.filter(
        (flt: ICoordinatesAnchor) =>
          flt.referenceID === authentication.user.userID,
      );

      if (currentCoordinates.length > 0) {
        const finalCoordinates = currentCoordinates[0];

        return finalCoordinates;
      }

      return null;
    }

    return null;
  }, [authentication.user.userID, coordinates]);

  const othersLocation = useMemo<ICoordinatesAnchor[]>(() => {
    if (authentication.user.userID) {
      const currentCoordinates = coordinates.filter(
        (flt: ICoordinatesAnchor) =>
          flt.referenceID !== authentication.user.userID,
      );

      if (currentCoordinates.length > 0) {
        const finalCoordinates = currentCoordinates;

        return finalCoordinates;
      }

      return [];
    }

    return [];
  }, [authentication.user.userID, coordinates]);

  const toFollowLocation = useMemo<ICoordinatesAnchor | null>(() => {
    if (followLocation) {
      const currentCoordinates = coordinates.filter(
        (flt: ICoordinatesAnchor) => flt.referenceID === followLocation,
      );

      if (currentCoordinates.length > 0) {
        const finalCoordinates = currentCoordinates[0];

        return finalCoordinates;
      }

      return null;
    }

    return null;
  }, [followLocation, coordinates]);

  const mapRef = useRef<any>(null);

  const speedToZoom = (speedKmh: number | null): number => {
    if (speedKmh === null) return 17; // default walking zoom

    if (speedKmh < 5) return 18; // standing/very slow
    if (speedKmh < 15) return 17; // walking/jogging
    if (speedKmh < 40) return 16; // bike/slow car
    if (speedKmh < 80) return 15; // city driving
    return 14; // highway
  };

  const [currentMode, setcurrentMode] = useState<number>(0);

  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("anchor");

    if (query) {
      setFollowLocation(query);
    }

    window.addEventListener("broadcast_coordinates_listener", (e: any) => {
      if (e.detail) {
        const receivedCoordinates = e.detail as ICoordinatesAnchor;
        setcoordinates((prev: ICoordinatesAnchor[]) => {
          const prevNoUser = prev.filter(
            (flt: ICoordinatesAnchor) =>
              flt.referenceID !== receivedCoordinates.referenceID,
          );
          return [...prevNoUser, receivedCoordinates];
        });
      }
    });
  }, [searchParams]);

  useEffect(() => {
    if (isLocationSharing) {
      const toShareCoordinates = myLocation;
      if (toShareCoordinates) {
        toShareCoordinates.mode = {
          currentMode,
          ifSpeedShown: toggleSpeed,
        };

        const filteredActiveContacts = activeuserslist
          .filter((flt: any) => flt.sessionStatus)
          .map((item: any) => item._id);

        const payload = {
          coordinates: toShareCoordinates,
          receivers: filteredActiveContacts,
        };

        if (filteredActiveContacts.length > 0) {
          BroadcastCoordinatesRequest(payload).catch((err) => {
            console.log(err);
          });
        }
      }
    }
  }, [
    isLocationSharing,
    myLocation,
    currentMode,
    toggleSpeed,
    activeuserslist,
  ]);

  useEffect(() => {
    // window.locationiq.key = "pk.f9b59be5e6653ab04296d123446a4564"
    navigator.geolocation.getCurrentPosition(
      (position: GeolocationPosition) => {
        setcoordinates((prev: ICoordinatesAnchor[]) => {
          const prevNoUser = prev.filter(
            (flt: ICoordinatesAnchor) =>
              flt.referenceID !== authentication.user.userID,
          );
          return [
            ...prevNoUser,
            {
              referenceID: authentication.user.userID,
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
              heading: position.coords.heading,
              speed: position.coords.speed ?? 0,
              mode: null,
            },
          ];
        });
      },
      null,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
      },
    );

    navigator.geolocation.watchPosition(
      (position: GeolocationPosition) => {
        setcoordinates((prev: ICoordinatesAnchor[]) => {
          const prevNoUser = prev.filter(
            (flt: ICoordinatesAnchor) =>
              flt.referenceID !== authentication.user.userID,
          );
          return [
            ...prevNoUser,
            {
              referenceID: authentication.user.userID,
              longitude: position.coords.longitude,
              latitude: position.coords.latitude,
              heading: position.coords.heading,
              speed: position.coords.speed ?? 0,
              mode: null,
            },
          ];
        });
      },
      null,
      {
        enableHighAccuracy: true,
        maximumAge: 1000,
      },
    );
  }, [authentication.user.userID]);

  useEffect(() => {
    if (!mapRef.current || !toFollowLocation) return;

    mapRef.current.flyTo({
      center: [toFollowLocation.longitude, toFollowLocation.latitude],
      zoom: speedToZoom(toFollowLocation.speed) ?? 10,
      pitch: 60,
      bearing: toFollowLocation.heading ? toFollowLocation.heading * 1 : -17.6,
      duration: 800,
      padding: {
        left:
          toggleSpeed ||
          (followLocation !== authentication.user.userID &&
            followLocation !== null)
            ? 80
            : 0,
        right:
          toggleProfileView ||
          (followLocation !== authentication.user.userID &&
            followLocation !== null)
            ? 200
            : 0, // ✅ Marker LEFT side of screen
        // top: 80,
        // bottom: 250,
      },
    });
  }, [
    authentication.user.userID,
    coordinates,
    followLocation,
    toFollowLocation,
    toggleProfileView,
    toggleSpeed,
  ]);

  const toggleLevelHeight = ["80px", "40%", "calc(100% - 100px)"];

  const toggleSwitchOptions = [
    {
      icon: <FaWalking size={12} />,
      label: "Casual",
      lottie: (
        <div className="tw-w-[30px]">
          <DotLottieReact
            // src={mp.animated_preview!}
            data={WalkingLottie}
            loop
            autoplay
            width={30}
            height={27}
            style={{
              width: "auto",
              height: "100%",
              marginRight: "-5px",
            }}
            renderConfig={{
              devicePixelRatio: 2,
              autoResize: true,
            }}
            useFrameInterpolation
          />
        </div>
      ),
      items: [
        {
          label: "Share Location",
          icon: <MdShareLocation size={50} />,
          click: () => {
            setisLocationSharing((prev) => !prev);
          },
        },
      ],
    },
    {
      icon: <MdCardTravel size={13} style={{ marginBottom: "-2px" }} />,
      label: "Travel",
      lottie: (
        <div className="tw-w-[30px]">
          <DotLottieReact
            // src={mp.animated_preview!}
            data={SuitCaseLottie}
            loop
            autoplay
            width={20}
            height={15}
            style={{
              width: "auto",
              height: "100%",
            }}
            renderConfig={{
              devicePixelRatio: 2,
              autoResize: true,
            }}
            useFrameInterpolation
          />
        </div>
      ),
      items: [
        {
          label: "Share Location",
          icon: <MdShareLocation size={50} />,
          click: () => {
            setisLocationSharing((prev) => !prev);
          },
        },
      ],
    },
    {
      icon: <GiCarWheel size={14} style={{ marginBottom: "-2px" }} />,
      label: "Driving",
      lottie: (
        <div className="tw-w-[30px]">
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            className="tw-w-[30px] tw-h-[30px] tw-flex tw-items-center tw-justify-center tw-rounded-full"
          >
            <GiCarWheel size={25} />
          </motion.div>
        </div>
      ),
      items: [
        {
          label: "Share Location",
          icon: <MdShareLocation size={50} />,
          click: () => {
            setisLocationSharing((prev) => !prev);
          },
        },
        {
          label: "Speed",
          icon: <SlSpeedometer size={50} />,
          click: () => {
            settoggleSpeed((prev) => !prev);
          },
        },
      ],
    },
  ];

  const handleClick = useCallback(
    (event: any) => {
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ["gps-circle"], // Your layer ID
      });

      if (features.length > 0) {
        const clickedMp = features[0].properties; // Access mp.referenceID, etc.
        if (clickedMp) {
          if (followLocation === clickedMp.referenceID) {
            setFollowLocation(null);
            if (!mapRef.current) return;

            mapRef.current.flyTo({
              duration: 800,
              padding: {
                left: 0,
                right: 0, // ✅ Marker LEFT side of screen
                // top: 80,
                // bottom: 250,
              },
            });
          } else {
            setFollowLocation(clickedMp.referenceID);
          }
        }
      }
    },
    [followLocation],
  );

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: toFollowLocation?.longitude,
        latitude: toFollowLocation?.latitude,
        zoom: 17,
        pitch: 45,
        bearing: toFollowLocation?.heading
          ? toFollowLocation.heading * 1
          : -17.6,
      }}
      sky={false}
      antialias={true}
      scrollZoom={!followLocation}
      dragRotate={!followLocation}
      dragPan={!followLocation}
      doubleClickZoom={!followLocation}
      touchPitch={!followLocation}
      touchZoomRotate={!followLocation}
      // bearing={toFollowLocation?.heading ?? -17.6}
      // longitude={coordinates.longitude}
      // latitude={coordinates.latitude}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        overflowY: "hidden",
      }}
      mapStyle="https://api.maptiler.com/maps/basic-v2-dark/style.json?key=AqtwgEiGiqzjVxuM07x4"
      onClick={handleClick}
    >
      {toggleProfileView && (
        <ProfilePopup coordinates={myLocation!} user={authentication.user} />
      )}

      {toggleSpeed && <SpeedPopup coordinates={myLocation!} maxSpeed={200} />}

      {othersLocation.map((mp: ICoordinatesAnchor, i: number) => {
        return (
          <Fragment key={i}>
            {followLocation === mp.referenceID &&
              mp.mode.currentMode === 2 &&
              mp.mode.ifSpeedShown && (
                <SpeedPopup coordinates={mp} maxSpeed={200} />
              )}
            {followLocation === mp.referenceID && (
              <ProfilePopup
                coordinates={mp}
                user={{
                  userID: mp.referenceID,
                  fullName: {
                    firstName: "@" + mp.referenceID,
                    middleName: "",
                    lastName: "",
                  },
                  email: "",
                  isActivated: true,
                  isVerified: true,
                  profile: "",
                  coverphoto: "none",
                }}
              />
            )}
            <Source
              id="gps-marker"
              type="geojson"
              data={{
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [mp.longitude, mp.latitude],
                },
                properties: { referenceID: mp.referenceID },
              }}
            >
              <Layer
                id="gps-circle"
                type="circle"
                paint={{
                  "circle-radius": 8,
                  "circle-color":
                    followLocation === mp.referenceID ? "#2b35af" : "#727adc",
                  "circle-stroke-color": "white",
                  "circle-stroke-width": 2,
                  "circle-opacity": 0.9,
                }}
              />
            </Source>
          </Fragment>
        );
      })}

      {/* <Source
        id="gps-marker"
        type="geojson"
        data={{
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [myLocation!.longitude, myLocation!.latitude],
          },
        }}
      >
        <Layer
          id="gps-circle"
          type="circle"
          paint={{
            "circle-radius": 8,
            "circle-color":
              followLocation === authentication.user.userID
                ? "#00ff88"
                : "#ffaa00",
            "circle-stroke-color": "white",
            "circle-stroke-width": 2,
            "circle-opacity": 0.9,
          }}
        />
      </Source> */}

      <Source
        id="openmaptiles"
        type="vector"
        url="https://api.maptiler.com/tiles/v3/tiles.json?key=AqtwgEiGiqzjVxuM07x4"
      />
      <Layer
        id="3d-buildings"
        source="openmaptiles"
        source-layer="building"
        type="fill-extrusion"
        minzoom={15}
        paint={{
          "fill-extrusion-color": [
            "interpolate",
            ["linear"],
            ["get", "render_height"],
            0,
            "gray",
            200,
            "#4d4d4d",
            400,
            "lightblue",
          ],
          "fill-extrusion-height": [
            "interpolate",
            ["linear"],
            ["zoom"],
            15,
            0,
            16,
            ["get", "render_height"],
          ],
          // Fixed: Removed invalid zoom expression from case
          "fill-extrusion-base": ["get", "render_min_height"],
        }}
      />

      <Layer
        id="place-labels-top"
        source="openmaptiles"
        source-layer="place"
        type="symbol"
        minzoom={12}
        layout={{
          "text-field": [
            "coalesce",
            ["get", "name:en"],
            ["get", "name:fil"],
            ["get", "name"],
          ],
          "text-size": ["interpolate", ["linear"], ["zoom"], 12, 10, 18, 16],
          "text-anchor": "center",
        }}
        paint={{
          "text-color": "white",
          "text-halo-color": "#000",
          "text-halo-width": 2,
        }}
      />

      {/* <Layer
        id="local-labels-top"
        source="openmaptiles"
        source-layer="housenumber"
        type="symbol"
        minzoom={16}
        layout={{
          "text-field": ["get", "housenumber"],
          "text-size": 12,
        }}
        paint={{
          "text-color": "white",
          "text-halo-color": "#000",
          "text-halo-width": 1,
        }}
      /> */}

      {/* <Layer
        id="poi-labels"
        source="openmaptiles"
        source-layer="poi_label"
        type="symbol"
        minzoom={16}
        layout={{
          "text-field": ["get", "name"],
          "text-size": 12,
          "text-anchor": "top",
        }}
        paint={{
          "text-color": "white",
          "text-halo-color": "black",
          "text-halo-width": 1,
        }}
      />

      <Layer
        id="road-labels"
        source="openmaptiles"
        source-layer="transportation_name"
        type="symbol"
        layout={{
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 15, 10, 18, 14],
        }}
        paint={{
          "text-color": "white",
        }}
      /> */}

      {/* <GeolocateControl 
        position="bottom-right"
        // trackUserLocation={followLocation}
        showAccuracyCircle={true}
        showUserHeading={true}
        onTrackUserLocationStart={() => setFollowLocation(authentication.user.userID)}
        onTrackUserLocationEnd={() => setFollowLocation(null)}
      /> */}
      {!isMobileView ? (
        <motion.div
          initial={{
            width: "300px",
            height: "40px",
          }}
          animate={{
            width: toggleLevel > 0 ? "340px" : "300px",
            height: toggleLevelHeight[toggleLevel],
          }}
          className="tw-bg-white tw-absolute tw-bottom-0 tw-z-[10] tw-rounded-xl tw-flex tw-flex-col tw-mb-[15px] tw-ml-[15px]"
        >
          <div className="tw-w-full tw-bg-transparent tw-flex tw-gap-[5px] tw-justify-center tw--mt-[20px]">
            <button
              onClick={() => {
                if (toggleLevel === 0) {
                  settoggleLevel(1);
                  return;
                }

                settoggleLevel(0);
              }}
              className="tw-border-none tw-bg-white tw-p-[15px] tw-rounded-full"
            >
              {toggleLevel === 0 ? (
                <FaAngleUp size={15} />
              ) : (
                <FaAngleDown size={15} />
              )}
            </button>
            {toggleLevel === 1 && (
              <motion.button
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: toggleLevel === 1 ? 1 : 0,
                }}
                onClick={() => {
                  settoggleLevel(2);
                }}
                className="tw-border-none tw-bg-white tw-p-[15px] tw-rounded-full"
              >
                <FaAnglesUp size={15} />
              </motion.button>
            )}
          </div>
          <div className="tw-w-full tw-flex tw-flex-col">
            {toggleLevel > 0 && (
              <DynamicToggleSwitch
                list={toggleSwitchOptions}
                mode={currentMode}
                setMode={(mode: number) => {
                  setcurrentMode(mode);
                }}
              />
            )}
            <motion.div
              initial={{
                marginTop: "-10px",
                backgroundColor: "transparent",
                width: "calc(100% - 20px)",
                marginRight: "0px",
                marginLeft: "0px",
              }}
              animate={{
                marginTop: toggleLevel > 0 ? "35px" : "-10px",
                backgroundColor: toggleLevel > 0 ? "#eaecef" : "transparent",
                width:
                  toggleLevel > 0 ? "calc(100% - 40px)" : "calc(100% - 20px)",
                marginRight: toggleLevel > 0 ? "10px" : "0px",
                marginLeft: toggleLevel > 0 ? "10px" : "0px",
              }}
              className="tw-p-[10px] tw-mb-[10px] tw-flex tw-justify-center tw-rounded-xl"
            >
              {/* {toggleLevel > 0 && (
                <hr className="tw-w-full tw-border-[#ffffff] tw--mt-[2px]" />
              )} */}
              <motion.div
                initial={{ justifyItems: "left", gap: "5px" }}
                animate={{
                  justifyContent: "left",
                  gap: toggleLevel > 0 ? "7px" : "5px",
                }}
                className="tw-w-full tw-bg-transparent tw-flex"
              >
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() =>
                      setFollowLocation((prev: string | null) => {
                        if (!prev) {
                          return authentication.user.userID;
                        }

                        return null;
                      })
                    }
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <FaLocationCrosshairs
                      size={15}
                      style={{
                        color:
                          followLocation === authentication.user.userID
                            ? "#00ff88"
                            : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {followLocation === authentication.user.userID
                      ? "Follow"
                      : "Unfollow"}{" "}
                    Location
                  </motion.span>
                </div>
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div>
                {/* Testing Items */}
                {/* <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div>
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div> */}
                {/* END: Testing Items */}
                <motion.div className="tw-flex tw-flex-1 tw-h-[35px] tw-items-center tw-justify-end tw-overflow-hidden">
                  <motion.div className="tw-text-[12px] tw-font-semibold tw-font-Inter tw-overflow-hidden tw-text-right tw-whitespace-nowrap tw-flex tw-justify-end">
                    {toggleSwitchOptions[currentMode].lottie}
                  </motion.div>
                  <motion.div
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "0px" : "auto",
                    }}
                    className="tw-text-[12px] tw-font-semibold tw-font-Inter tw-overflow-hidden tw-text-right tw-whitespace-nowrap"
                  >
                    {toggleSwitchOptions[currentMode].label} Mode
                  </motion.div>
                </motion.div>
              </motion.div>
              {/* {toggleLevel > 0 && (
                <hr className="tw-w-full tw-border-[#ffffff] tw-mb-[0px]" />
              )} */}
            </motion.div>
          </div>
          <motion.div
            initial={{
              flex: toggleLevel > 0 ? 1 : 0,
              // minHeight: toggleLevel > 0 ? "none" : "0px",
            }}
            animate={{
              flex: toggleLevel > 0 ? 1 : 0,
              // minHeight: toggleLevel > 0 ? "none" : "0px",
            }}
            className="tw-w-[calc(100%-20px)] tw-max-h-[195px] tw-flex tw-flex-col tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-hidden"
          >
            <motion.div
              initial={{
                height: toggleLevel > 0 ? "100%" : "0px",
              }}
              animate={{
                height: toggleLevel > 0 ? "100%" : "0px",
              }}
              className="tw-bg-[#eaecef] tw-w-full tw-rounded-md tw-overflow-hidden tw-flex"
            >
              <div className="tw-w-[calc(100%-20px)] tw-h-[calc(100%-20px)] tw-p-[10px] tw-flex tw-gap-[6px]">
                {toggleSwitchOptions[currentMode].items.map((mp, i: number) => {
                  return (
                    <button
                      key={i}
                      className="tw-w-[100px] tw-h-[100px] tw-bg-[#cccccc] tw-text-white tw-flex tw-flex-col tw-items-center tw-justify-evenly tw-rounded-md tw-border-none"
                      onClick={mp.click}
                    >
                      {mp.icon}
                      <span className="tw-text-[12px] tw-font-Inter">
                        {mp.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : (
        <motion.div
          initial={{
            width: isMobileView ? "100%" : "300px",
            height: "40px",
          }}
          animate={{
            width: isMobileView ? "100%" : "300px",
            height: toggleLevelHeight[toggleLevel],
          }}
          className="tw-bg-white tw-absolute tw-bottom-0 tw-z-[10] tw-rounded-t-xl tw-flex tw-flex-col"
        >
          <div className="tw-w-full tw-bg-transparent tw-flex tw-gap-[5px] tw-justify-center tw--mt-[20px]">
            <button
              onClick={() => {
                if (toggleLevel === 0) {
                  settoggleLevel(1);
                  return;
                }

                settoggleLevel(0);
              }}
              className="tw-border-none tw-bg-white tw-p-[15px] tw-rounded-full"
            >
              {toggleLevel === 0 ? (
                <FaAngleUp size={15} />
              ) : (
                <FaAngleDown size={15} />
              )}
            </button>
            {toggleLevel === 1 && (
              <motion.button
                initial={{
                  scale: 0,
                }}
                animate={{
                  scale: toggleLevel === 1 ? 1 : 0,
                }}
                onClick={() => {
                  settoggleLevel(2);
                }}
                className="tw-border-none tw-bg-white tw-p-[15px] tw-rounded-full"
              >
                <FaAnglesUp size={15} />
              </motion.button>
            )}
          </div>
          <div className="tw-w-full tw-flex tw-flex-col">
            {toggleLevel > 0 && (
              <DynamicToggleSwitch
                list={toggleSwitchOptions}
                mode={currentMode}
                setMode={(mode: number) => {
                  setcurrentMode(mode);
                }}
              />
            )}
            <motion.div
              initial={{
                marginTop: "-10px",
                backgroundColor: "transparent",
                width: "calc(100% - 20px)",
                marginRight: "0px",
                marginLeft: "0px",
              }}
              animate={{
                marginTop: toggleLevel > 0 ? "35px" : "-10px",
                backgroundColor: toggleLevel > 0 ? "#eaecef" : "transparent",
                width:
                  toggleLevel > 0 ? "calc(100% - 40px)" : "calc(100% - 20px)",
                marginRight: toggleLevel > 0 ? "10px" : "0px",
                marginLeft: toggleLevel > 0 ? "10px" : "0px",
              }}
              className="tw-p-[10px] tw-mb-[10px] tw-flex tw-justify-center tw-rounded-xl"
            >
              {/* {toggleLevel > 0 && (
                <hr className="tw-w-full tw-border-[#ffffff] tw--mt-[2px]" />
              )} */}
              <motion.div
                initial={{ justifyItems: "left", gap: "5px" }}
                animate={{
                  justifyContent: "left",
                  gap: toggleLevel > 0 ? "7px" : "5px",
                }}
                className="tw-w-full tw-bg-transparent tw-flex"
              >
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() =>
                      setFollowLocation((prev: string | null) => {
                        if (!prev) {
                          return authentication.user.userID;
                        }

                        return null;
                      })
                    }
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <FaLocationCrosshairs
                      size={15}
                      style={{
                        color:
                          followLocation === authentication.user.userID
                            ? "#00ff88"
                            : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {followLocation === authentication.user.userID
                      ? "Follow"
                      : "Unfollow"}{" "}
                    Location
                  </motion.span>
                </div>
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div>
                {/* Testing Items */}
                {/* <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div>
                <div className="tw-flex tw-gap-[5px] tw-items-center">
                  <button
                    onClick={() => {
                      settoggleProfileView(!toggleProfileView);
                    }}
                    className="tw-cursor-pointer tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
                    style={{ pointerEvents: "auto" }}
                  >
                    <BsPersonCircle
                      size={15}
                      style={{
                        color: toggleProfileView ? "#00ff88" : "#ffaa00",
                      }}
                    />
                  </button>
                  <motion.span
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "auto" : "0px",
                    }}
                    className="tw-text-[12px] tw-font-Inter tw-overflow-x-hidden tw-whitespace-nowrap"
                  >
                    {toggleProfileView ? "Hide" : "Show"} Profile
                  </motion.span>
                </div> */}
                {/* END: Testing Items */}
                <motion.div className="tw-flex tw-flex-1 tw-h-[35px] tw-items-center tw-justify-end tw-overflow-hidden">
                  <motion.div className="tw-text-[12px] tw-font-semibold tw-font-Inter tw-overflow-hidden tw-text-right tw-whitespace-nowrap tw-flex tw-justify-end">
                    {toggleSwitchOptions[currentMode].lottie}
                  </motion.div>
                  <motion.div
                    initial={{
                      width: "0px",
                    }}
                    animate={{
                      width: toggleLevel > 0 ? "0px" : "auto",
                    }}
                    className="tw-text-[12px] tw-font-semibold tw-font-Inter tw-overflow-hidden tw-text-right tw-whitespace-nowrap"
                  >
                    {toggleSwitchOptions[currentMode].label} Mode
                  </motion.div>
                </motion.div>
              </motion.div>
              {/* {toggleLevel > 0 && (
                <hr className="tw-w-full tw-border-[#ffffff] tw-mb-[0px]" />
              )} */}
            </motion.div>
          </div>
          <motion.div
            initial={{
              flex: toggleLevel > 0 ? 1 : 0,
              // minHeight: toggleLevel > 0 ? "none" : "0px",
            }}
            animate={{
              flex: toggleLevel > 0 ? 1 : 0,
              // minHeight: toggleLevel > 0 ? "none" : "0px",
            }}
            className="tw-w-[calc(100%-20px)] tw-max-h-[195px] tw-flex tw-flex-col tw-flex-1 tw-pl-[10px] tw-pr-[10px] tw-overflow-hidden"
          >
            <motion.div
              initial={{
                height: toggleLevel > 0 ? "100%" : "0px",
              }}
              animate={{
                height: toggleLevel > 0 ? "100%" : "0px",
              }}
              className="tw-bg-[#eaecef] tw-w-full tw-rounded-md tw-overflow-hidden tw-flex"
            >
              <div className="tw-w-[calc(100%-20px)] tw-h-[calc(100%-20px)] tw-p-[10px] tw-flex">
                {toggleSwitchOptions[currentMode].items.map((mp, i: number) => {
                  return (
                    <button
                      key={i}
                      className="tw-w-[100px] tw-h-[100px] tw-bg-[#cccccc] tw-text-white tw-flex tw-flex-col tw-items-center tw-justify-evenly tw-rounded-md tw-border-none"
                      onClick={mp.click}
                    >
                      {mp.icon}
                      <span className="tw-text-[12px] tw-font-Inter">
                        {mp.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </Map>
  );
}

export default MapFeed;
