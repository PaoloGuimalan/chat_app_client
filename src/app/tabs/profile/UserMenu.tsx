import AppMenu from "@/app/widgets/desktopwidgets/AppMenu"
import { AuthenticationInterface } from "@/reusables/vars/interfaces"
import { BsPersonFill } from "react-icons/bs"
import { useSelector } from "react-redux"
import DefaultProfile from '../../../assets/imgs/default.png'
import { useNavigate } from "react-router-dom"

function UserMenu() {

  const authentication: AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();

  return (
    <div className='tw-w-[calc(100%-20px)] tw-max-w-[calc(600px-20px)] tw-bg-transparent tw-flex-1 tw-flex tw-flex-col tw-items-center tw-p-[10px] tw-pt-[0px] tw-overflow-y-auto scroller'>
        <div className="tw-w-full tw-flex tw-flex-col">
            <div id='div_app_menu_label_container' className="tw-items-center">
                <BsPersonFill style={{fontSize: "22px", color: "#1c7DEF"}} />
                <span className='span_contacts_label'>Profile</span>
            </div>
            <div className="tw-w-full tw-bg-transparent tw-flex tw-flex-col tw-items-center">
                <div
                onClick={() => {
                    navigate(`/${authentication.user.userID}`);
                }}
                className="tw-select-none tw-cursor-pointer tw-w-[calc(85%-20px)] tw-bg-white tw-max-w-[550px] tw-min-h-[55px] tw-shadow-sm tw-p-[10px] tw-rounded-[5px] tw-flex tw-flex-row tw-items-center tw-gap-[10px]">
                    <div id='img_default_profile_container'>
                        <img src={DefaultProfile} id='img_default_profile' />
                    </div>
                    <span id='span_user_firstname_label'>{authentication.user.fullName.firstName}{authentication.user.fullName.middleName == "N/A"? "" : ` ${authentication.user.fullName.middleName}`} {authentication.user.fullName.lastName}</span>
                </div>
            </div>
        </div>
        <AppMenu />
    </div>
  )
}

export default UserMenu