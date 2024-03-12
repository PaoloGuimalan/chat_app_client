import { motion } from "framer-motion"
import { useState } from "react";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { FcList, FcPuzzle, FcSettings } from "react-icons/fc";
import { useSelector } from "react-redux";
import AppItems from "../items/AppItems";

function AppMenu() {

  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);

  const [isLoading, _] = useState(false); //setisLoading

  const menulist: any[] = [
    {
        _id: 2,
        appname: "Settings",
        icon: <FcSettings style={{fontSize: "40px"}} />,
        description: "Organize you account settings.",
        navigation: ""
    },
    {
        _id: 1,
        appname: "Chatterloop Extension",
        icon: <FcPuzzle style={{fontSize: "40px"}} />,
        description: "Merge your contents from accross different platforms.",
        navigation: ""
    }
  ]

  return (
    <motion.div
    animate={{
      display: pathnamelistener.includes("contacts")? "flex" : screensizelistener.W <= 1100? "none" : "flex",
      maxWidth: pathnamelistener.includes("contacts")? "600px" : screensizelistener.W <= 900? "350px" : "350px"
    }}
    id='div_app_menu'>
        <div id='div_app_menu_label_container'>
          <FcList style={{fontSize: "28px"}} />
          <span className='span_contacts_label'>Menu</span>
        </div>
        {isLoading? (
          <div id='div_isLoading_notifications'>
            <motion.div
              animate={{
                rotate: -360
              }}
              transition={{
                duration: 1,
                repeat: Infinity
              }}
              id='div_loader_request'>
                  <AiOutlineLoading3Quarters style={{fontSize: "25px"}} />
              </motion.div>
          </div>
        ) : (
            <div id='div_contacts_list_container' className='scroller'>
                <div className="tw-flex tw-flex-row tw-gap-[5px] tw-w-full tw-flex-wrap">
                    {menulist.map((mp: any, i: number) => {
                        return(
                            <AppItems key={i} mp={mp} />
                        )
                    })}
                </div>
            </div>
        )}
    </motion.div>
  )
}

export default AppMenu