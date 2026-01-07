/* eslint-disable @typescript-eslint/no-explicit-any */
// import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import { AiOutlineHome } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
// import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { TypeAnimation } from 'react-type-animation';

function Diary(){
    // const authentication: AuthenticationInterface = useSelector(
    //     (state: any) => state.authentication
    //   );
    const navigate = useNavigate();
    return(
        <div
            className="tw-bg-[#d8d8da] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll"
        >
            <div className="tw-flex tw-items-center tw-gap-[5px] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-w-full tw-max-w-[50px] tw-h-full tw-max-h-[50px]">
                <button
                    onClick={() => {
                        navigate(-1);
                    }}
                    className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
                >
                    <IoArrowBack style={{ fontSize: "20px" }} className="tw-text-[#7f7f85]" />
                </button>
                <button
                    onClick={() => {
                        navigate("/");
                    }}
                    className="tw-z-[10] tw-shadow-lg tw-bg-[#f0f2f5] tw-h-full tw-min-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer"
                >
                    <AiOutlineHome style={{ fontSize: "22px" }} className="tw-text-[#7f7f85]" />
                </button>
                <TypeAnimation
                    sequence={[
                        // Same substring at the start will only be typed out once, initially
                        'Chaterloop Diary 🖊️',
                        1000, // wait 1s before replacing "Mice" with "Hamsters"
                        'Your Untold Stories 📖',
                        1000,
                        'Your Crazy Thoughts 🌀',
                        1000,
                        "Dive Into Your Fun Vault 🎉",
                        1000,
                        "We wont read it, We swear! 🤫",
                        1000,
                        "Unless you Share it 😉",
                        1000,
                        'Chaterloop Diary 🖊️',
                        1000,
                    ]}
                    preRenderFirstString={false}
                    wrapper="span"
                    speed={80}
                    style={{ fontSize: '14px', width: "fit" }}
                    className="tw-whitespace-nowrap tw-font-semibold tw-font-Inter tw-pl-[5px]"
                    cursor={false}
                    // repeat={Infinity}
                />
            </div>
            <div className="tw-w-[calc(100%-40px)] tw-h-[calc(100%-70px)] tw-flex tw-items-end tw-p-[20px] tw-pt-[70px]">
                <div className="tw-bg-white tw-w-full tw-h-full tw-rounded-xl">
                    <span>Hello World</span>
                </div>
            </div>
        </div>
    )
}

export default Diary;