/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import {
  Map,
  Source,
  Layer,
  GeolocateControl,
  Popup,
} from "@vis.gl/react-maplibre";
import "maplibre-gl/dist/maplibre-gl.css";
import DefaultProfile from "../../../assets/imgs/default.png";
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";

function MapFeed() {
  const authentication: AuthenticationInterface = useSelector(
    (state: any) => state.authentication
  );

  const [coordinates, setcoordinates] = useState<{
    longitude: number;
    latitude: number;
  }>({ longitude: 120.9842, latitude: 14.5995 });

  useEffect(() => {
    // window.locationiq.key = "pk.f9b59be5e6653ab04296d123446a4564"
    navigator.geolocation.watchPosition((position: GeolocationPosition) => {
      setcoordinates({
        longitude: position.coords.longitude,
        latitude: position.coords.latitude,
      });
    });
  }, []);

  return (
    <Map
      initialViewState={{
        ...coordinates,
        zoom: 15,
        pitch: 45,
        bearing: -17.6,
      }}
      antialias={true}
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

      <Popup
        longitude={coordinates.longitude}
        latitude={coordinates.latitude}
        anchor="bottom"
        style={{ width: "auto", minWidth: "250px", height: "auto" }}
        closeOnClick={false}
        closeButton={false}
      >
        <div className="tw-p-[2px] tw-flex tw-w-full tw-gap-[10px]">
          <div className="tw-bg-transparent tw-w-full tw-max-w-[40px] tw-flex tw-justify-center">
            <div className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-min-w-[40px] tw-max-w-[40px] tw-h-[40px] sm:tw-max-w-[40px] sm:tw-h-[40px] tw-border-solid tw-border-[0px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative">
              <img src={DefaultProfile} id="img_default_profile" />
            </div>
          </div>
          <div className="tw-flex tw-flex-1 tw-flex-col tw-items-start tw-font-Inter">
            <span className="tw-text-[14px] tw-font-semibold tw-text-left">
              {authentication.user.fullName.firstName}
              {authentication.user.fullName.middleName == "N/A"
                ? ""
                : ` ${authentication.user.fullName.middleName}`}{" "}
              {authentication.user.fullName.lastName}
            </span>
            <span>@{authentication.user.userID} (you)</span>
          </div>
        </div>
      </Popup>

      <Source
        id="gps-marker"
        type="geojson"
        data={{
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: [coordinates.longitude, coordinates.latitude],
          },
        }}
      >
        <Layer
          id="gps-circle"
          type="circle"
          paint={{
            "circle-radius": 8,
            "circle-color": "#00ff88",
            "circle-stroke-color": "white",
            "circle-stroke-width": 2,
            "circle-opacity": 0.9,
          }}
        />
      </Source>

      <GeolocateControl />
    </Map>
  );
}

export default MapFeed;
