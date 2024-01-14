import { AuthenticationInterface, ProfileUserInfoInterface } from "@/reusables/vars/interfaces";
import { useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom"
import DefaultProfile from '../../../assets/imgs/default.png'
import { IoArrowBack } from "react-icons/io5";
import { useEffect, useState } from "react";
import { GetProfileInfo } from "@/reusables/hooks/requests";
import jwtDecode from "jwt-decode";

function Profile() {

  const authentication : AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();
  const params = useParams();

  const [profileInfo, setprofileInfo] = useState<ProfileUserInfoInterface | null>(null);

  useEffect(() => {
    GetProfileInfo({
        userID: params.userID
    }).then((response) => {
        if(response.data.status){
            const result: any = jwtDecode(response.data.result);
            setprofileInfo(result.data);
        }
    }).catch((err) => {
        console.log(err);
    })
  },[])
    
  return (
    profileInfo ? (
        <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]">
            <button onClick={() => { navigate("/"); }} className="tw-bg-[#d2d2d2] tw-absolute tw-top-[10px] tw-left-[10px] sm:tw-left-[20px] tw-h-full tw-max-h-[50px] tw-w-full tw-max-w-[50px] tw-rounded-[50px] tw-border-none tw-flex tw-items-center tw-justify-center tw-text-white tw-cursor-pointer">
                <IoArrowBack style={{ fontSize: "20px" }} />
            </button>
            <div className="tw-bg-white tw-w-full tw-h-[60%] tw-min-h-[200px] tw-border-solid tw-border-[0px] tw-border-b-[1px] tw-border-[#d2d2d2] tw-flex tw-flex-col tw-justify-center tw-items-center">
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
            <div className="tw-bg-green-500 tw-max-w-[1500px] tw-w-full">
                {/* Profile {params.userID} */}
            </div>
        </div>
    ) : (
        <div className="tw-bg-[#f0f2f5] tw-w-full tw-h-full tw-absolute tw-flex tw-flex-col tw-items-center tw-z-[2] tw-gap-[10px]"></div>
    )
  )
}

export default Profile