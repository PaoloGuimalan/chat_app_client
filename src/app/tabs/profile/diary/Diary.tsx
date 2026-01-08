/* eslint-disable @typescript-eslint/no-explicit-any */
import { AuthenticationInterface } from "@/reusables/vars/interfaces";
import CachedImage from "@/app/reusables/cachers/CachedImage";
import { AiOutlineHome } from "react-icons/ai";
import { IoArrowBack } from "react-icons/io5";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import { TypeAnimation } from 'react-type-animation';
import DefaultProfile from "../../../../assets/imgs/default.png";
import { useMemo } from "react";
import {motion} from 'framer-motion';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

function Diary(){
    const authentication: AuthenticationInterface = useSelector(
        (state: any) => state.authentication
    );

    const screensizelistener = useSelector(
        (state: any) => state.screensizelistener
    );

    const isMobileView = useMemo(
        () => screensizelistener.W < 800,
        [screensizelistener]
    );

    const [searchParams] = useSearchParams(); 

    const entry_id = searchParams.get('entry_id');

    const navigate = useNavigate();

    return(
        <div
            className="tw-bg-[#d8d8da] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll"
        >
            <div className="tw-flex tw-items-center tw-gap-[5px] tw-pt-[10px] tw-pl-[20px] tw-pr-[20px] sm:tw-left-[20px] tw-w-[calc(100%-40px)] tw-h-full tw-max-h-[50px]">
                <button
                    onClick={() => {
                        navigate(`/${authentication.user.userID}`);
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
                <div className="tw-flex tw-h-full tw-flex-1 tw-items-center tw-justify-end">
                    {authentication.user.profile === "none" ? (
                        <div id="img_default_profile_container" className="tw-shadow-lg tw-bg-[#f0f2f5] tw-w-[45px] tw-h-[45px] tw-max-w-[45px] tw-max-h-[45px]">
                            <CachedImage src={DefaultProfile} className="tw-w-[60%] tw-h-[60%]" />
                        </div>
                    ) : (
                        <CachedImage
                            src={authentication.user.profile}
                            className="tw-w-[45px] tw-h-[45px] tw-rounded-full tw-shadow-lg tw-bg-[#f0f2f5]"
                        />
                    )}
                </div>
            </div>
            <div className={`tw-h-[calc(100%-30px)] tw-flex tw-items-end tw-pb-[15px] ${isMobileView ? "tw-pl-[10px] tw-pr-[10px] tw-w-[calc(100%-20px)]" : "tw-w-[calc(100%-40px)]"} tw-pt-[10px]`}>
                <div className={`tw-bg-transparent ${isMobileView ? "tw-gap-[0px]" : "tw-gap-[7px]"} tw-w-full tw-h-full tw-rounded-xl tw-flex`}>
                    <motion.div 
                    initial={{
                        flex: isMobileView ? entry_id !== null || entry_id === "new" ? 0 : 1 : 1,
                        maxWidth: isMobileView ? entry_id !== null || entry_id === "new" ? "0px" : "100%" : "350px"
                    }}
                    animate={{
                        flex: isMobileView ? entry_id !== null || entry_id === "new" ? 0 : 1 : 1,
                        maxWidth: isMobileView ? entry_id !== null || entry_id === "new" ? "0px" : "100%" : "350px"
                    }}
                    className="tw-flex tw-flex-col tw-overflow-x-hidden tw-bg-white tw-rounded-[7px] tw-items-center">
                        <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[18px] tw-pl-[20px] tw-pr-[20px]">
                            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold tw-whitespace-nowrap">Your Entries</span>
                        </div>
                        <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
                            <input
                                id="input_gc_name"
                                type="text"
                                placeholder="Search an entry"
                            />
                        </div>
                    </motion.div>
                    <motion.div 
                    initial={{
                        flex: isMobileView ? entry_id !== null || entry_id === "new" ? 1 : 0 : 1,
                        maxWidth: isMobileView ? entry_id !== null || entry_id === "new" ? "100%" : "0px" : "none"
                    }}
                    animate={{
                        flex: isMobileView ? entry_id !== null || entry_id === "new" ? 1 : 0 : 1,
                        maxWidth: isMobileView ? entry_id !== null || entry_id === "new" ? "100%" : "0px" : "none"
                    }}
                    className="tw-flex tw-flex-col tw-gap-[15px] tw-overflow-x-hidden tw-bg-white tw-rounded-[7px] tw-items-center">
                        <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[18px] tw-pb-[2px] tw-pl-[20px] tw-pr-[20px]">
                            <span className="tw-text-[14px] tw-font-Inter tw-font-semibold">Create New Entry</span>
                        </div>
                        <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
                            <input
                                id="input_gc_name"
                                type="text"
                                placeholder="Title"
                            />
                        </div>
                        <div className="tw-w-[calc(100%-40px)] tw-flex tw-p-[0px] tw-pl-[20px] tw-pr-[20px]">
                            <div className="tw-w-full tw-min-h-[300px] tw-bg-[#eaecef] tw-rounded-[7px] my-editor-wrapper">
                                <ReactQuill onChange={() => {}} className="tw-w-full tw-rounded-[7px] tw-h-[calc(100%-42px)]" />
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}

export default Diary;