/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { motion } from "framer-motion";
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FcPuzzle, FcSettings } from "react-icons/fc"; /**FcList */
import { TbServer2 } from "react-icons/tb";
import { useDispatch, useSelector } from "react-redux";
import AppItems from "../items/AppItems";
import { PiListBold } from "react-icons/pi";
import { SET_PAGE_MODAL } from "@/redux/types";
import Settings from "@/app/tabs/settings/Settings";
import { RiPagesFill } from "react-icons/ri";

function AppMenu() {
  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const screensizelistener = useSelector(
    (state: any) => state.screensizelistener,
  );

  const [isLoading, _] = useState(false); //setisLoading

  const dispatch = useDispatch();

  const menulist: any[] = [
    {
      _id: 1,
      appname: "Settings",
      icon: <FcSettings style={{ fontSize: "40px" }} />,
      description: "Organize you account settings.",
      navigation: screensizelistener.W <= 1100 ? "/settings" : null,
      click: () => {
        dispatch({
          type: SET_PAGE_MODAL,
          payload: {
            pagemodal: {
              name: "Settings",
              component: <Settings isModal={true} />,
            },
          },
        });
      },
    },
    {
      _id: 2,
      appname: "Servers",
      icon: <TbServer2 style={{ fontSize: "40px", color: "#e69500" }} />,
      description: "Browse and Socialize through servers.",
      navigation: "/servers",
      click: null,
    },
    {
      _id: 3,
      appname: "Pages",
      icon: <RiPagesFill style={{ fontSize: "37px", color: "#4997f2" }} />,
      description: "Browse pages you may be interested in.",
      navigation: "/pages",
      click: null,
    },
    {
      _id: 4,
      appname: "Chatterloop Extension",
      icon: <FcPuzzle style={{ fontSize: "40px" }} />,
      description: "Merge your contents from accross different platforms.",
      navigation: null,
      click: null,
    },
  ];

  return (
    <motion.div
      animate={{
        display:
          pathnamelistener.includes("contacts") ||
          pathnamelistener.includes("user")
            ? "flex"
            : screensizelistener.W <= 1100
              ? "none"
              : "flex",
        maxWidth:
          pathnamelistener.includes("contacts") ||
          pathnamelistener.includes("user")
            ? "600px"
            : screensizelistener.W <= 900
              ? "350px"
              : "350px",
      }}
      id="div_app_menu"
    >
      <div id="div_app_menu_label_container">
        <PiListBold style={{ fontSize: "27px", color: "#2196f3" }} />
        <span className="span_contacts_label">Menu</span>
      </div>
      {isLoading ? (
        <div id="div_isLoading_notifications">
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            id="div_loader_request"
          >
            <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
          </motion.div>
        </div>
      ) : (
        <div id="div_contacts_list_container" className="scroller">
          <div className="tw-flex tw-flex-row tw-gap-[5px] tw-w-full tw-flex-wrap">
            {menulist.map((mp: any, i: number) => {
              return <AppItems key={i} mp={mp} />;
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default AppMenu;
