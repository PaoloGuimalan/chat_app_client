import { AuthenticationInterface, ProfilePostState, ProfileUserInfoInterface } from "@/reusables/vars/interfaces";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom"
import DefaultProfile from '../../../assets/imgs/default.png'
import { IoArrowBack } from "react-icons/io5";
import { useEffect, useRef, useState } from "react";
import { CreatePostRequest, GetPostRequest, GetProfileInfo } from "@/reusables/hooks/requests";
import jwtDecode from "jwt-decode";
import { FaLinkSlash } from "react-icons/fa6";
import { AiOutlineLoading3Quarters } from 'react-icons/ai'
import { FaTransgender, FaFileAlt } from "react-icons/fa";
import { IoMale, IoFemale, IoTime } from "react-icons/io5";
// import { IoMdCheckmark } from "react-icons/io";
import { FcAddImage } from 'react-icons/fc'
import { MdCake } from "react-icons/md";
import { motion } from "framer-motion";
import { formattedDateToWords, ordinal_suffix_of } from "@/reusables/hooks/reusable";
import { SET_MUTATE_ALERTS } from "../../../redux/types/index";
import PostItem from "./PostItem";

function Profile() {

  const authentication : AuthenticationInterface = useSelector((state: any) => state.authentication);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const params = useParams();

  const postsstate = {
    posts: [],
    totalposts: 0
  }

  const [profileInfo, setprofileInfo] = useState<ProfileUserInfoInterface | null>(null);
  const [posts, setposts] = useState<ProfilePostState>(postsstate);
  const [isloaded, setisloaded] = useState<boolean>(true);
  const [createposttext, setcreateposttext] = useState<string>("");

  const [range, _] = useState<number>(20);
  const [taggedList, __] = useState<string[]>([]);

  const divlazyloaderRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    GetProfileInfo({
        userID: params.userID
    }).then((response) => {
        if(response.data.status){
            const result: any = jwtDecode(response.data.result);
            setposts(postsstate) //temporary
            if(result.data){
                setisloaded(true);
                setprofileInfo(result.data);
            }
            else{
                setisloaded(false);
                setprofileInfo(null);
            }
        }
        else{
            setprofileInfo(null);
            setisloaded(false);
        }
    }).catch((err) => {
        setprofileInfo(null);
        setisloaded(false);
        console.log(err);
    })
  },[])

  const genderIcons: any = {
    "Male": <IoMale style={{ fontSize: "20px", color: "#666666" }} />,
    "Female": <IoFemale style={{ fontSize: "17px", color: "#666666" }} />,
    "Others": <FaTransgender style={{ fontSize: "17px", color: "#666666" }} />
  }

  const GetPostProcess = () => {
    GetPostRequest({
        userID: params.userID,
        range: range
    }).then((response) => {
        const decodedResult: any = jwtDecode(response.data.result);
        // console.log(decodedResult.data.posts)
        setposts({
            posts: decodedResult.data.posts,
            totalposts: decodedResult.data.total
        })
    }).catch((err) => {
        console.log(err);
    })
  }

  useEffect(() => {
    GetPostProcess()
  }, [params.userID, range, profileInfo])

  const CreatePostProcess = () => {
    const validatedTaggedList = authentication.user.userID == profileInfo?.userID ? [] : [profileInfo?.userID, ...taggedList]

    CreatePostRequest({
        content: {
            isShared: false,
            references: [],
            data: createposttext
        },
        type: {
            fileType: "text", //text, image, video, file
            contentType: "text" //text, image, video
        },
        tagging: {
            isTagged: validatedTaggedList.length > 0 ? true : false,
            users: validatedTaggedList
        },
        privacy: {
            status: "public",
            users: [], //userID for filteration depending on status
        }, //public, friends, filtered
        onfeed: "feed",
    }).then((response) => {
        if(response.data.status){
            // console.log(response.data);
            setcreateposttext("");
            dispatch({ 
                type: SET_MUTATE_ALERTS, 
                payload:{
                    alerts: {
                        type: "success",
                        content: "Your post has been saved"
                    }
                }
            })
            GetPostProcess();
        }
    }).catch((err) => {
        console.log(err);
    })
  }
    
  return (
    isloaded ? (
        profileInfo ? (
            <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px] tw-overflow-y-scroll x-scroll">
                <button onClick={() => { navigate("/"); }} className="tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer">
                    <IoArrowBack style={{ fontSize: "20px" }} />
                </button>
                <div className="tw-bg-white tw-w-full tw-h-[60%] tw-min-h-[60%] tw-border-solid tw-border-[0px] tw-border-b-[1px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
                    {authentication.user.coverphoto !== ""? (
                        <img src={authentication.user.coverphoto} className="tw-bg-black tw-full tw-flex tw-flex-1 tw-max-w-[1500px]" />
                    ) : (
                        <div className="tw-bg-black tw-w-full tw-flex tw-flex-1 tw-max-w-[1500px] tw-rounded-b-[10px]" />
                    )}
                    <div className="tw-w-[calc(100%-80px)] tw-h-auto sm:tw-h-[150px] tw-bg-transparent tw-max-w-[calc(1500px-80px)] tw-flex tw-flex-col sm:tw-flex-row tw-items-center tw-justify-center tw-flex-wrap tw-pl-[40px] tw-pr-[40px]">
                        <div className="tw-bg-transparent tw-w-full tw-max-w-[180px] tw-flex tw-justify-center">
                            <div className="tw-cursor-pointer tw-bg-[#d2d2d2] tw-w-full tw-max-w-[120px] tw-h-[120px] sm:tw-max-w-[160px] sm:tw-h-[160px] tw-border-solid tw-border-[5px] tw-border-white tw-flex tw-items-center tw-justify-center tw-rounded-[160px] tw-relative tw--mt-[80px]">
                                <img src={DefaultProfile} id='img_default_profile' />
                            </div>
                        </div>
                        <div className="tw-bg-transparent tw-flex tw-flex-col sm:tw-flex-row tw-flex-1 tw-h-auto sm:tw-h-full tw-items-center">
                            <div className="tw-flex tw-flex-1 tw-flex-col tw-items-center sm:tw-items-start tw-justify-center tw-h-full tw-p-[20px] tw-sm:p-[0px]">
                                <span className="tw-text-[25px] tw-font-bold">{profileInfo.fullname.firstName}{profileInfo.fullname.middleName == "N/A"? "" : ` ${profileInfo.fullname.middleName}`} {profileInfo.fullname.lastName}</span>
                                <span className="tw-text-[14px] tw-break-all tw-mb-[20px]">{profileInfo.email}</span>
                                <span className="tw-text-[14px] tw-break-all">@{profileInfo.userID}</span>
                            </div>
                            <div>
                                {/* for add friend button */}
                            </div>
                        </div>
                    </div>
                </div>
                <div className="tw-bg-transparent tw-max-w-[1200px] tw-w-[98%] tw-flex tw-flex-col md:tw-flex-row tw-gap-[10px] tw-items-center md:tw-items-start">
                    <div className="tw-w-full tw-h-fit md:tw-sticky tw-top-[10px] tw-max-w-[100%] md:tw-max-w-[400px] tw-bg-white tw-border-solid tw-border-[0px] tw-border-[1px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex">
                        <div className="tw-w-full tw-p-[20px] tw-flex tw-flex-col tw-items-start tw-gap-[15px]">
                            <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                                {genderIcons[profileInfo.gender]}
                                <span className="tw-text-[14px] tw-font-semibold">{profileInfo.gender}</span>
                            </div>
                            <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center">
                                <IoTime style={{ fontSize: "20px", color: "#666666" }} />
                                <span className="tw-text-[14px]">Joined </span>
                                <span className="tw-text-[14px] tw-font-semibold tw-text-left">{formattedDateToWords(profileInfo.dateCreated.date)}</span>
                            </div>
                            <div className="tw-flex tw-flex-row tw-gap-[5px] tw-items-center tw-mt-[2px]">
                                <MdCake style={{ fontSize: "20px", color: "#666666", marginTop: "-4px" }} />
                                <span className="tw-text-[14px]">Born in </span>
                                <span className="tw-text-[14px] tw-font-semibold tw-text-left">{ordinal_suffix_of(parseInt(profileInfo.birthdate.day))} of {profileInfo.birthdate.month} {profileInfo.birthdate.year}</span>
                            </div>
                        </div>
                    </div>
                    <div className="tw-w-full tw-pb-[20px] tw-flex tw-flex-col tw-items-center">
                        <div id='div_feed_header_post_input_profile'>
                            <div id='div_img_feed_header_container'>
                                <img src={DefaultProfile} id='img_feed_header' />
                            </div>
                            <div id='div_input_feed_flex'>
                                <input type='text' value={createposttext} onChange={(e) => { setcreateposttext(e.target.value) }} onKeyDown={(e) => {
                                    if(createposttext.trim() !== ""){
                                        if(e.key == "Enter"){
                                            CreatePostProcess()
                                        }
                                    }
                                }} className="tw-font-Inter" placeholder={profileInfo.userID === authentication.user.userID ? "Share your thoughts..." : `Write on ${profileInfo.fullname.firstName}'s wall...`} id='input_feed_box' />
                            </div>
                            <div id='div_btn_image_container'>
                                <button id='btn_image_feed' disabled={true}>
                                    <FcAddImage style={{fontSize: "35px"}} />
                                </button>
                            </div>
                        </div>
                        {posts.totalposts > 0 ? (
                            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[10px] tw-mt-[20px]">
                                {posts.posts.map((mp: any, i: number) => {
                                    return(
                                        <PostItem key={i} mp={mp} />
                                    )
                                })}
                                {posts.posts.length > 0 && posts.totalposts > range && (
                                    <div ref={divlazyloaderRef} id='divlazyloader' className='tw-bg-transparent tw-w-full tw-flex tw-items-center tw-justify-center tw-mt-[5px] tw-mb-[5px]'>
                                        <motion.div
                                        animate={{
                                            rotate: -360
                                        }}
                                        transition={{
                                            duration: 1,
                                            repeat: Infinity
                                        }}
                                        id='div_loader_request_conv'>
                                            <AiOutlineLoading3Quarters style={{fontSize: "20px"}} />
                                        </motion.div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="tw-w-full tw-h-[300px] tw-bg-transparent tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-[15px]">
                                <FaFileAlt style={{ fontSize: "60px", color: "#333333" }} />
                                <div className="tw-flex tw-flex-col tw-gap-[0px] tw-text-[#333333]">
                                    <span className="tw-font-semibold tw-text-[14px]">No Posts yet</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        ) : (
            <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
                <button onClick={() => { navigate("/"); }} className="tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer">
                    <IoArrowBack style={{ fontSize: "20px" }} />
                </button>
                <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
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
            </div>
        )
    ) : (
        <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
            <button onClick={() => { navigate("/"); }} className="tw-bg-[#d2d2d2] tw-fixed tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer">
                <IoArrowBack style={{ fontSize: "20px" }} />
            </button>
            <div className="tw-w-full tw-h-full tw-flex tw-flex-col tw-gap-[15px] tw-items-center tw-justify-center">
                <FaLinkSlash style={{ fontSize: "100px", color: "#333333" }} />
                <div className="tw-flex tw-flex-col tw-gap-[5px] tw-text-[#333333]">
                    <span className="tw-font-semibold tw-text-[16px]">Link is broken.</span>
                    <span className="tw-font-normal tw-text-[14px]">Please check and try again.</span>
                </div>
            </div>
        </div>
    )
  )
}

export default Profile