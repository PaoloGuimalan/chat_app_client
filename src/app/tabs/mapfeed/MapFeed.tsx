/* eslint-disable react-hooks/exhaustive-deps */
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
  IUserSettings,
  ProfileUserInfoInterface,
} from "@/reusables/vars/interfaces";
import { useDispatch, useSelector } from "react-redux";
import ProfilePopup from "./partials/ProfilePopup";
import { distance2D, motion, Point } from "framer-motion";
import {
  FaAngleDown,
  FaAnglesUp,
  FaAngleUp,
  FaLocationCrosshairs,
  FaRegCopy,
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
import {
  // BroadcastCoordinatesRequest,
  GetProfileInfo,
  // SnapCoordinatesOpenRoute,
} from "@/reusables/hooks/requests";
import { useSearchParams } from "react-router-dom";
import { HiOutlineSquare3Stack3D } from "react-icons/hi2";
import { SET_COORDINATES, SET_USER_SETTINGS } from "@/redux/types";
import { persistSettings } from "@/reusables/hooks/localforagehelper";
import { useWakeLock } from "react-screen-wake-lock";

function MapFeed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication,
  );

  const usersettings: IUserSettings = useSelector(
    (state: any) => state.usersettings,
  );

  // const activeuserslist = useSelector((state: any) => state.activeuserslist);

  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const isMobileView = useMemo(
    () => screensizelistener.W < 800,
    [screensizelistener],
  );

  const dispatch = useDispatch();

  // const [coordinates, setcoordinates] = useState<ICoordinatesAnchor[]>([
  //   {
  //     referenceID: authentication.user.userID,
  //     longitude: 120.9842,
  //     latitude: 14.5995,
  //     heading: -17.6,
  //     speed: 0,
  //     mode: null,
  //     type: "profile",
  //   },
  // ]);

  const coordinates: ICoordinatesAnchor[] = useSelector(
    (state: any) => state.coordinates,
  );

  // const [rawCoordinates, setrawCoordinates] = useState<ICoordinatesAnchor>({
  //   referenceID: authentication.user.userID,
  //   longitude: 120.9842,
  //   latitude: 14.5995,
  //   heading: -17.6,
  //   speed: 0,
  //   mode: null,
  //   type: "profile",
  // });

  const rawCoordinates: ICoordinatesAnchor = useSelector(
    (state: any) => state.rawcoordinates,
  );

  const [followLocation, setFollowLocation] = useState<string | null>(
    authentication.user.userID,
  );

  // const [isLocationSharing, setisLocationSharing] = useState<boolean>(false);
  const isLocationSharing = useMemo(() => {
    return usersettings.map_feed_access.share_location;
  }, [usersettings]);

  const setisLocationSharing = (value: boolean) => {
    const newSettings = {
      ...usersettings,
      map_feed_access: {
        ...usersettings.map_feed_access,
        share_location: value,
      },
    };

    persistSettings(authentication.user.entity_id, newSettings);

    dispatch({
      type: SET_USER_SETTINGS,
      payload: { usersettings: newSettings },
    });
  };

  const [toggleProfileView, settoggleProfileView] = useState<boolean>(true);

  const [toggleLevel, settoggleLevel] = useState<number>(0);

  // const [toggleSpeed, settoggleSpeed] = useState<boolean>(false);
  const toggleSpeed = useMemo(
    () => usersettings.map_feed_access.toggleSpeed,
    [usersettings],
  );

  const settoggleSpeed = (value: boolean) => {
    const newSettings = {
      ...usersettings,
      map_feed_access: {
        ...usersettings.map_feed_access,
        toggleSpeed: value,
      },
    };

    persistSettings(authentication.user.entity_id, newSettings);

    dispatch({
      type: SET_USER_SETTINGS,
      payload: { usersettings: newSettings },
    });
  };

  const [isDarkMode, setisDarkMode] = useState<boolean>(false);

  const [toggle3Drenders, settoggle3Drenders] = useState<boolean>(false);

  useEffect(() => {
    const checkLocalTime = () => {
      const hour = new Date().getHours();

      // PH typical pattern: Dark 6PM-6AM, Light 6AM-6PM
      const isNight = hour >= 18 || hour < 6;

      setisDarkMode(isNight);
    };

    // Check immediately + every hour
    checkLocalTime();
    const interval = setInterval(checkLocalTime, 60 * 60 * 1000); // Hourly check

    return () => clearInterval(interval);
  }, []);

  const myLocation = useMemo<ICoordinatesAnchor>(() => {
    if (authentication.user.userID) {
      const currentCoordinates = coordinates.filter(
        (flt: ICoordinatesAnchor) =>
          flt.referenceID === authentication.user.userID,
      );

      if (currentCoordinates.length > 0) {
        const finalCoordinates = currentCoordinates[0];

        return finalCoordinates;
      }

      return {
        referenceID: authentication.user.userID,
        label: authentication.user.username,
        longitude: 120.9842,
        latitude: 14.5995,
        heading: -17.6,
        speed: 0,
        mode: null,
        type: "profile",
      };
    }

    return {
      referenceID: authentication.user.userID,
      label: authentication.user.username,
      longitude: 120.9842,
      latitude: 14.5995,
      heading: -17.6,
      speed: 0,
      mode: null,
      type: "profile",
    };
  }, [authentication.user.userID, coordinates]);

  const othersLocation = useMemo<ICoordinatesAnchor[]>(() => {
    if (authentication.user.userID) {
      const currentCoordinates = coordinates.filter(
        (flt: ICoordinatesAnchor) =>
          flt.referenceID !== authentication.user.userID &&
          flt.type === "profile",
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

  // const [currentMode, setcurrentMode] = useState<number>(0);
  const currentMode = useMemo(
    () => usersettings.map_feed_access.current_mode,
    [usersettings],
  );
  const setcurrentMode = (value: number) => {
    const newSettings = {
      ...usersettings,
      map_feed_access: {
        ...usersettings.map_feed_access,
        current_mode: value,
      },
    };

    persistSettings(authentication.user.entity_id, newSettings);

    dispatch({
      type: SET_USER_SETTINGS,
      payload: { usersettings: newSettings },
    });
  };

  const [searchParams] = useSearchParams();
  const [isAnchorLoaded, setisAnchorLoaded] = useState<boolean>(false);

  useEffect(() => {
    const query = searchParams.get("anchor");

    if (query) {
      const fetchToAnchor = coordinates.filter((flt) => flt.label === query);
      if (fetchToAnchor.length > 0) {
        if (!isAnchorLoaded) {
          setFollowLocation(fetchToAnchor[0].referenceID);
          setisAnchorLoaded(true);
        }
        // setFollowLocation(query);
      }
    }
  }, [searchParams, othersLocation, isAnchorLoaded]);

  // useEffect(() => {
  //   if (isLocationSharing) {
  //     const toShareCoordinates = myLocation;
  //     if (toShareCoordinates) {
  //       toShareCoordinates.mode = {
  //         currentMode,
  //         ifSpeedShown: toggleSpeed,
  //       };

  //       const filteredActiveContacts = activeuserslist
  //         .filter((flt: any) => flt.sessionStatus)
  //         .map((item: any) => item._id);

  //       const payload = {
  //         coordinates: toShareCoordinates,
  //         receivers: filteredActiveContacts,
  //       };

  //       if (filteredActiveContacts.length > 0) {
  //         BroadcastCoordinatesRequest(payload).catch((err) => {
  //           console.log(err);
  //         });
  //       }
  //     }
  //   }
  // }, [
  //   isLocationSharing,
  //   myLocation,
  //   currentMode,
  //   toggleSpeed,
  //   activeuserslist,
  // ]);

  const setSettingsAndPersist = (newSettings: IUserSettings) => {
    if (authentication.user.userID) {
      dispatch({
        type: SET_USER_SETTINGS,
        payload: { usersettings: newSettings },
      });
      persistSettings(authentication.user.entity_id, newSettings);
    }
  };

  useEffect(() => {
    setSettingsAndPersist({
      ...usersettings,
      map_feed_access: {
        ...usersettings.map_feed_access,
        enable_location: true,
      },
    });
  }, []);

  const getRoadsAround = () => {
    if (!mapRef.current) return [];

    const delta = 0.0009;
    const bounds = {
      minLng: rawCoordinates.longitude - delta,
      minLat: rawCoordinates.latitude - delta,
      maxLng: rawCoordinates.longitude + delta,
      maxLat: rawCoordinates.latitude + delta,
    };

    // Convert to screen pixels
    const map = mapRef.current;
    const sw = map.project([bounds.minLng, bounds.minLat]);
    const ne = map.project([bounds.maxLng, bounds.maxLat]);

    const bbox = [
      [sw.x, sw.y],
      [ne.x, ne.y],
    ];

    const features = map.queryRenderedFeatures(bbox);
    // console.log("Raw features:", features); // Check this!

    const roadLineStrings = features
      .filter(
        (f: any) =>
          f.layer.type === "line" ||
          (f.properties?.class &&
            [
              "primary",
              "secondary",
              "tertiary",
              "residential",
              "service",
              "track",
              "unclassified",
              "living_street",
              "pedestrian",
              "path",
              "living_street",
              "minor",
              "transit",
            ].includes(f.properties.class)) ||
          f.layer.id?.includes("road") ||
          f.layer.id?.includes("highway"),
      )
      .slice(0, 30) // Limit processing
      .map((f: any) => ({
        type: "Feature",
        properties: f.properties,
        geometry: {
          type: "LineString",
          coordinates: f.geometry.coordinates[0] || f.geometry.coordinates,
        },
      }));

    // console.log("LineStrings:", roadLineStrings);
    return roadLineStrings;
  };

  const projectToLineSegment = (
    point: Point | number[],
    a: number[],
    b: number[],
  ): Point => {
    const px = "x" in point ? point.x : point[0];
    const py = "y" in point ? point.y : point[1];
    const ax = a[0],
      ay = a[1];
    const bx = b[0],
      by = b[1];
    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
    t = Math.max(0, Math.min(1, t));
    return { x: ax + t * dx, y: ay + t * dy };
  };

  useEffect(() => {
    if (currentMode === 2) {
      const roads = getRoadsAround();

      if (roads.length > 0) {
        const gpsPoint = {
          x: rawCoordinates.longitude,
          y: rawCoordinates.latitude,
        };

        let snappedLng = rawCoordinates.longitude;
        let snappedLat = rawCoordinates.latitude;
        let minDistance = Infinity;

        roads.forEach((road: any) => {
          road.geometry.coordinates.forEach((coord: any, i: any) => {
            if (i < road.geometry.coordinates.length - 1) {
              const nextCoord = road.geometry.coordinates[i + 1];
              const closest = projectToLineSegment(gpsPoint, coord, nextCoord);
              const dist = distance2D(gpsPoint, closest);
              if (dist < minDistance && dist < 0.00018) {
                // ~20m
                minDistance = dist;
                snappedLng = closest.x;
                snappedLat = closest.y;
              }
            }
          });
        });

        dispatch({
          type: SET_COORDINATES,
          payload: {
            coordinates: {
              referenceID: authentication.user.userID,
              label: authentication.user.username,
              longitude: snappedLng,
              latitude: snappedLat,
              heading: rawCoordinates.heading,
              speed: rawCoordinates.speed ?? 0,
              mode: null,
              type: "profile",
            },
          },
        });
        return;
      }
    } else {
      dispatch({
        type: SET_COORDINATES,
        payload: {
          coordinates: {
            referenceID: authentication.user.userID,
            label: authentication.user.username,
            longitude: rawCoordinates.longitude,
            latitude: rawCoordinates.latitude,
            heading: rawCoordinates.heading,
            speed: rawCoordinates.speed ?? 0,
            mode: null,
            type: "profile",
          },
        },
      });
    }
  }, [rawCoordinates, currentMode]);

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

  const generalToggleOptions = [
    {
      label: <span className="tw-text-[12px] tw-font-Inter">3D Visuals</span>,
      icon: (
        <HiOutlineSquare3Stack3D
          size={50}
          style={{ color: toggle3Drenders ? "#00ff88" : "#ffffff" }}
        />
      ),
      click: () => {
        settoggle3Drenders((prev) => !prev);
      },
    },
    {
      label: (
        <span className="tw-text-[12px] tw-font-Inter">Share Location</span>
      ),
      icon: (
        <MdShareLocation
          size={50}
          style={{ color: isLocationSharing ? "#00ff88" : "#ffffff" }}
        />
      ),
      click: () => {
        setisLocationSharing(!usersettings.map_feed_access.share_location);
      },
    },
  ];

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
      items: [...generalToggleOptions],
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
      items: [...generalToggleOptions],
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
        ...generalToggleOptions,
        {
          label: <span className="tw-text-[12px] tw-font-Inter">Speed</span>,
          icon: (
            <SlSpeedometer
              size={50}
              style={{ color: toggleSpeed ? "#00ff88" : "#ffffff" }}
            />
          ),
          click: () => {
            settoggleSpeed(!toggleSpeed);
          },
        },
      ],
    },
  ];

  const { isSupported, released, request, release } = useWakeLock({
    onRequest: () => {},
    onError: () => {},
    onRelease: () => {},
  });

  useEffect(() => {
    if (isSupported) {
      request();
    }

    return () => {
      if (!released) {
        release();
      }
    };
  }, [isSupported, request, release]);

  const handleClick = useCallback(
    (event: any) => {
      request();
      const coordinatesCircle = coordinates
        .filter((flt) => flt.referenceID !== authentication.user.userID)
        .map((mp) => `gps-circle-${mp.referenceID}`);
      const features = mapRef.current.queryRenderedFeatures(event.point, {
        layers: ["gps-circle", ...coordinatesCircle], // Your layer ID
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
    [authentication.user.userID, coordinates, followLocation],
  );

  const [UsersInMap, setUsersInMap] = useState<ProfileUserInfoInterface[]>([]);

  const GetProfileInfoProcess = (userID: string) => {
    GetProfileInfo({
      userID: userID,
    })
      .then((response) => {
        const existingUserInfo = UsersInMap.filter(
          (flt) => flt.userID === response.data.data.userID,
        ).length;
        if (existingUserInfo === 0) {
          setUsersInMap((prev) => [...prev, response.data.data]);
        }
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    const toGetUsersInMap = othersLocation.map((mp) => mp.label);

    toGetUsersInMap.forEach((username) => {
      if (UsersInMap.findIndex((usr) => usr.userID === username) === -1) {
        GetProfileInfoProcess(username);
      }
    });
  }, [UsersInMap, othersLocation]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        longitude: toFollowLocation?.longitude ?? 120.9842,
        latitude: toFollowLocation?.latitude ?? 14.5995,
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
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        overflowY: "hidden",
      }}
      mapStyle={
        isDarkMode
          ? "https://api.maptiler.com/maps/basic-v2-dark/style.json?key=AqtwgEiGiqzjVxuM07x4"
          : "https://api.maptiler.com/maps/basic-v2/style.json?key=AqtwgEiGiqzjVxuM07x4"
      }
      onClick={handleClick}
    >
      {toggleProfileView && (
        <ProfilePopup coordinates={myLocation!} user={authentication.user} />
      )}

      {toggleSpeed && currentMode === 2 && (
        <SpeedPopup coordinates={myLocation!} maxSpeed={200} />
      )}

      {othersLocation.map((mp: ICoordinatesAnchor, i: number) => {
        const userInfo = UsersInMap.find((usr) => usr.id === mp.referenceID);
        if (userInfo) {
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
                    ...userInfo,
                    username: userInfo.userID,
                    fullName: userInfo.fullname,
                  }}
                />
              )}
              <Source
                id={`gps-marker-${mp.referenceID}`}
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
                  id={`gps-circle-${mp.referenceID}`}
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
        }
      })}

      <Source
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
      </Source>

      {toggle3Drenders && (
        <>
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
              "fill-extrusion-color": isDarkMode
                ? [
                    "interpolate",
                    ["linear"],
                    ["get", "render_height"],
                    0,
                    "gray",
                    200,
                    "#4d4d4d",
                    400,
                    "lightblue",
                  ]
                : [
                    "interpolate",
                    ["linear"],
                    ["get", "render_height"],
                    0,
                    "#f8f4f0",
                    100,
                    "#e0d7c8",
                    300,
                    "#b8a896",
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
              "fill-extrusion-base": ["get", "render_min_height"],
            }}
          />
        </>
      )}

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
                        color: followLocation ? "#00ff88" : "#ffaa00",
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
                    {!followLocation ? "Follow" : "Unfollow"}
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
            </motion.div>
          </div>
          <motion.div
            initial={{
              paddingBottom: toggleLevel > 0 ? "10px" : "0px",
              overflowY: toggleLevel > 0 ? "auto" : "hidden",
            }}
            animate={{
              paddingBottom: toggleLevel > 0 ? "10px" : "0px",
              overflowY: toggleLevel > 0 ? "auto" : "hidden",
            }}
            className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-h-full tw-overflow-y-auto t-scroll"
          >
            <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
              <motion.div
                initial={{
                  height: "0px",
                }}
                animate={{
                  height: isLocationSharing ? "auto" : "0px",
                }}
                className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-md tw-flex"
              >
                <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-items-center tw-gap-[5px]">
                  <span className="tw-whitespace-nowrap tw-text-ellipsis tw-truncate tw-text-[12px] tw-font-Inter tw-flex-1">
                    {window.location.href}?anchor={authentication.user.username}
                  </span>
                  <button
                    className="tw-h-[25px] tw-w-[40px] tw-cursor-pointer tw-border-none tw-bg-transparent"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        window.location.href +
                          "?anchor=" +
                          authentication.user.username,
                      )
                    }
                  >
                    <FaRegCopy size={17} />
                  </button>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{
                marginTop: "-10px",
              }}
              animate={{
                marginTop: isLocationSharing ? "0px" : "-10px",
              }}
              className="tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-pl-[10px] tw-pr-[10px]"
            >
              <motion.div className="tw-bg-[#eaecef] tw-w-full tw-h-auto tw-min-h-[194px] tw-rounded-md tw-flex">
                <div
                  className={`tw-w-[calc(100%-20px)] tw-h-[calc(100%-20px)] tw-p-[10px] tw-flex tw-gap-[6px] tw-flex-wrap ${toggleSwitchOptions[currentMode].items.length > 2 ? "tw-justify-center" : "tw-justify-start"}`}
                >
                  {toggleSwitchOptions[currentMode].items.map(
                    (mp, i: number) => {
                      return (
                        <button
                          key={i}
                          className="tw-w-[92px] tw-h-[100px] tw-bg-[#cccccc] tw-text-white tw-flex tw-flex-col tw-items-center tw-justify-evenly tw-rounded-md tw-border-none"
                          onClick={mp.click}
                        >
                          {mp.icon}
                          {mp.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </motion.div>
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
                        color: followLocation ? "#00ff88" : "#ffaa00",
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
                    {!followLocation ? "Follow" : "Unfollow"}
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
            </motion.div>
          </div>
          <motion.div
            initial={{
              paddingBottom: toggleLevel > 0 ? "10px" : "0px",
              overflowY: toggleLevel > 0 ? "auto" : "hidden",
            }}
            animate={{
              paddingBottom: toggleLevel > 0 ? "10px" : "0px",
              overflowY: toggleLevel > 0 ? "auto" : "hidden",
            }}
            className="tw-w-full tw-flex tw-flex-col tw-gap-[10px] tw-h-full tw-overflow-y-auto t-scroll"
          >
            <div className="tw-w-full tw-flex tw-flex-col tw-items-center">
              <motion.div
                initial={{
                  height: "0px",
                }}
                animate={{
                  height: isLocationSharing ? "auto" : "0px",
                }}
                className="tw-bg-[#eaecef] tw-w-[calc(100%-20px)] tw-rounded-md tw-flex"
              >
                <div className="tw-w-[calc(100%-20px)] tw-p-[10px] tw-flex tw-items-center tw-gap-[5px]">
                  <span className="tw-whitespace-nowrap tw-text-ellipsis tw-truncate tw-text-[12px] tw-font-Inter tw-flex-1">
                    {window.location.href}?anchor={authentication.user.username}
                  </span>
                  <button
                    className="tw-h-[25px] tw-w-[40px] tw-cursor-pointer tw-border-none tw-bg-transparent"
                    onClick={() =>
                      navigator.clipboard.writeText(
                        window.location.href +
                          "?anchor=" +
                          authentication.user.username,
                      )
                    }
                  >
                    <FaRegCopy size={17} />
                  </button>
                </div>
              </motion.div>
            </div>
            <motion.div
              initial={{
                marginTop: "-10px",
              }}
              animate={{
                marginTop: isLocationSharing ? "0px" : "-10px",
              }}
              className="tw-w-[calc(100%-20px)] tw-flex tw-flex-col tw-pl-[10px] tw-pr-[10px]"
            >
              <motion.div className="tw-bg-[#eaecef] tw-w-full tw-h-auto tw-min-h-[194px] tw-rounded-md tw-flex">
                <div
                  className={`tw-w-[calc(100%-20px)] tw-h-[calc(100%-20px)] tw-p-[10px] tw-flex tw-gap-[6px] tw-flex-wrap ${toggleSwitchOptions[currentMode].items.length > 2 ? "tw-justify-center" : "tw-justify-start"}`}
                >
                  {toggleSwitchOptions[currentMode].items.map(
                    (mp, i: number) => {
                      return (
                        <button
                          key={i}
                          className="tw-w-[92px] tw-h-[100px] tw-bg-[#cccccc] tw-text-white tw-flex tw-flex-col tw-items-center tw-justify-evenly tw-rounded-md tw-border-none"
                          onClick={mp.click}
                        >
                          {mp.icon}
                          {mp.label}
                        </button>
                      );
                    },
                  )}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </Map>
  );
}

export default MapFeed;
