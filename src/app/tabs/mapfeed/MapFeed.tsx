/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useRef, useState } from "react";
import { Map, Source, Layer, 
  // GeolocateControl
 } from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import { AuthenticationInterface, ICoordinatesAnchor } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import ProfilePopup from "./partials/ProfilePopup";
import { FaLocationCrosshairs } from "react-icons/fa6";

function MapFeed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );

  const [coordinates, setcoordinates] = useState<ICoordinatesAnchor[]>([{ referenceID: authentication.user.userID, longitude: 120.9842, latitude: 14.5995 }]);

  const [followLocation, setFollowLocation] = useState<string | null>(authentication.user.userID);

  const myLocation = useMemo<ICoordinatesAnchor | null>(() => {
    if(authentication.user.userID){
      const currentCoordinates = coordinates.filter((flt: ICoordinatesAnchor) => flt.referenceID === authentication.user.userID);

      if(currentCoordinates.length > 0){
        const finalCoordinates = currentCoordinates[0];

        return finalCoordinates;
      }

      return null;
    }

    return null;
  }, [authentication.user.userID, coordinates]);

  const toFollowLocation = useMemo<ICoordinatesAnchor | null>(() => {
    if(followLocation){
      const currentCoordinates = coordinates.filter((flt: ICoordinatesAnchor) => flt.referenceID === followLocation);

      if(currentCoordinates.length > 0){
        const finalCoordinates = currentCoordinates[0];

        return finalCoordinates;
      }

      return null;
    }

    return null;
  }, [followLocation, coordinates]);

  const mapRef = useRef<any>(null);

  useEffect(() => {
    // window.locationiq.key = "pk.f9b59be5e6653ab04296d123446a4564"
    navigator.geolocation.watchPosition((position: GeolocationPosition) => {
      setcoordinates((prev: ICoordinatesAnchor[]) => {
        return [
          ...prev,
          { referenceID: authentication.user.userID,
            longitude: position.coords.longitude,
            latitude: position.coords.latitude,
          }
        ]
      });
    });
  }, [authentication.user.userID]);

  useEffect(() => {
    if (!mapRef.current || !toFollowLocation) return;

    mapRef.current.flyTo({
      center: [toFollowLocation.longitude, toFollowLocation.latitude],
      zoom: 15,
      pitch: 45,
      bearing: -17.6,
      duration: 800
    });
  }, [coordinates, toFollowLocation]);

  return (
    <Map
      ref={mapRef}
      initialViewState={{
        ...coordinates,
        zoom: 15,
        pitch: 45,
        bearing: -17.6,
      }}
      sky={false}
      antialias={true}
      scrollZoom={!followLocation}
      dragRotate={!followLocation}
      dragPan={!followLocation}
      doubleClickZoom={!followLocation}
      touchPitch={!followLocation}
      touchZoomRotate={!followLocation}
      // longitude={coordinates.longitude}
      // latitude={coordinates.latitude}
      style={{
        width: "100%",
        height: "100%",
        position: "absolute",
        overflowY: "hidden",
      }}
      mapStyle="https://api.maptiler.com/maps/basic-v2-dark/style.json?key=AqtwgEiGiqzjVxuM07x4"
    >
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

      <ProfilePopup coordinates={myLocation!} user={authentication.user} />

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
            "circle-color": followLocation === authentication.user.userID ? "#00ff88" : "#ffaa00",
            "circle-stroke-color": "white",
            "circle-stroke-width": 2,
            "circle-opacity": 0.9,
          }}
        />
      </Source>

      {/* <GeolocateControl 
        position="bottom-right"
        // trackUserLocation={followLocation}
        showAccuracyCircle={true}
        showUserHeading={true}
        onTrackUserLocationStart={() => setFollowLocation(authentication.user.userID)}
        onTrackUserLocationEnd={() => setFollowLocation(null)}
      /> */}
      <button
        onClick={() => setFollowLocation((prev: string | null) => {
          if (!prev) {
            return authentication.user.userID
          }

          return null;
        })}
        className="tw-cursor-pointer tw-absolute tw-bottom-6 tw-right-6 tw-z-[1000] tw-w-[35px] tw-h-[35px] tw-bg-white/90 hover:tw-bg-white tw-rounded-full tw-shadow-2xl tw-border-4 tw-border-white/50 tw-flex tw-items-center tw-justify-center tw-text-2xl tw-transition-all tw-duration-300 hover:tw-scale-110 active:tw-scale-95"
        style={{ pointerEvents: 'auto' }}
      >
        <FaLocationCrosshairs style={{
          color: followLocation === authentication.user.userID ? "#00ff88" : "#ffaa00"
        }} />
      </button>

    </Map>
  );
}

export default MapFeed;
