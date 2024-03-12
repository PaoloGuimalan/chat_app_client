import Contacts from "@/app/tabs/feed/Contacts";
import AppMenu from "@/app/widgets/desktopwidgets/AppMenu";
import { motion } from "framer-motion"
import { useSelector } from "react-redux"

function LeftContainers() {

  const pathnamelistener = useSelector((state: any) => state.pathnamelistener);
  const screensizelistener = useSelector((state: any) => state.screensizelistener);

  return (
    <motion.div
    animate={{
      display: pathnamelistener.includes("contacts")? "flex" : screensizelistener.W <= 1100? "none" : "flex",
      maxWidth: pathnamelistener.includes("contacts")? "600px" : screensizelistener.W <= 900? "350px" : "350px"
    }}
    id='div_contacts'>
        <AppMenu />
        <Contacts />
    </motion.div>
  )
}

export default LeftContainers