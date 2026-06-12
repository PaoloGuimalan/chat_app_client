import { motion } from "framer-motion";
import { ThreeDots } from "react-loader-spinner";

function IsTypingLoader() {
  return (
    <motion.div className="div_messages_result tw-items-center">
      <motion.div
        initial={{
          marginLeft: "0px",
          alignItems: "flex-start",
          scale: 0,
        }}
        animate={{
          marginLeft: "0px",
          alignItems: "flex-start",
          scale: 1,
        }}
        transition={{
          duration: 0.2,
        }}
        className="tw-flex tw-flex-col tw-w-fit tw-max-w-[70%]"
      >
        <motion.div
          initial={{
            backgroundColor: "var(--surface)",
            border: "solid 1px var(--surface)",
            color: "var(--text)",
          }}
          animate={{
            backgroundColor: "var(--surface)",
            border: "solid 1px var(--surface)",
            color: "var(--text)",
          }}
          className="span_messages_result c1 tw-h-[40px] tw-min-w-[70px] tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-justify-center"
        >
          <ThreeDots
            visible={true}
            height="30"
            width="30"
            color="var(--text)"
            radius="30"
            ariaLabel="three-dots-loading"
            wrapperStyle={{}}
            wrapperClass=""
          />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default IsTypingLoader;
