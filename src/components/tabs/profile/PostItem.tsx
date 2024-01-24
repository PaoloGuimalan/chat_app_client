// import React from 'react'
import { useRef } from 'react';
import DefaultProfile from '../../../assets/imgs/default.png'
import { BiLike } from 'react-icons/bi';
import { LiaComment } from "react-icons/lia";
import { PiShareFat } from "react-icons/pi";
import { BsPinMap } from 'react-icons/bs';
import { AuthenticationInterface } from '@/reusables/vars/interfaces';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

function PostItem({ mp }: any) {

  const authentication : AuthenticationInterface = useSelector((state: any) => state.authentication);
  const navigate = useNavigate();

  const dateposted = new Date(mp.dateposted * 1000);
  const textRef = useRef<HTMLSpanElement | null>(null);
  const textContainerRef = useRef<HTMLDivElement | null>(null);

  const postOwnerUserID = mp.post_owner.userID;

  return (
    <div className=" tw-bg-white tw-border-solid tw-border-[0px] tw-border-[1px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex tw-w-[calc(100%-40px)] tw-p-[20px] tw-pb-[7px] tw-flex tw-flex-col tw-gap-[10px]">
        <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px]">
          <div id='div_img_feed_post_container'>
              <img src={DefaultProfile} id='img_feed_header' />
          </div>
          <div className='tw-flex tw-flex-col tw-items-start tw-gap-[2px]'>
            <div className='tw-flex tw-flex-row tw-gap-[5px]'>
              <span className='tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]'
                onClick={() => {
                  navigate(`/${mp.post_owner.userID}`)
                }}
              >{mp.post_owner.fullname.firstName}{mp.post_owner.fullname.middleName == "N/A"? "" : ` ${mp.post_owner.fullname.middleName}`} {mp.post_owner.fullname.lastName}</span>
              {mp.tagged_users.length > 0 && (
                <span className='tw-text-[14px]'>is with</span>
              )}
              {mp.tagged_users.length > 0 && (
                mp.tagged_users.map((mptg: any, i: number) => {
                  return(
                    <span className='tw-text-[14px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]'
                      onClick={() => {
                        navigate(`/${mptg.userID}`)
                      }}
                    key={i}>{mptg.fullname.firstName}{mptg.fullname.middleName == "N/A"? "" : ` ${mptg.fullname.middleName}`} {mptg.fullname.lastName}</span>
                  )
                })
              )}
            </div>
            <span className='tw-text-[12px]'>{dateposted.toUTCString().split(" ").splice(0, 4).join(" ")}</span>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-items-center tw-gap-[7px] tw-min-h-[35px] tw-justify-center">
          <div ref={textContainerRef} className={`tw-w-full tw-flex tw-justify-center`}>
            <span ref={textRef} className='tw-text-[14px] tw-text-left c1'>{mp.content.data}</span>
          </div>
        </div>
        <div className="tw-w-full tw-flex tw-flex-col tw-items-center tw-gap-[0px] tw-justify-center">
          <hr className='tw-w-full tw-text-[#666666] tw-border-white tw-opacity-[0.4] tw-mb-[5px]' />
          <div className='tw-flex tw-flex-row tw-flex-wrap tw-w-full tw-justify-evenly tw-items-center'>
            <button className='tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]'>
              <BiLike style={{ fontSize: "25px", color: "#666666" }} />
            </button>
            <button className='tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]'>
              <LiaComment style={{ fontSize: "25px", color: "#666666" }} />
            </button>
            <button className='tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]'>
              <PiShareFat style={{ fontSize: "25px", color: "#666666" }} />
            </button>
            {postOwnerUserID === authentication.user.userID && (
              <button className='tw-bg-transparent tw-flex tw-flex-1 tw-justify-center tw-items-center tw-border-0 tw-w-[40px] tw-h-[30px] tw-cursor-pointer hover:tw-bg-gray-200 tw-rounded-[5px]'>
                <BsPinMap style={{ fontSize: "22px", color: "#666666" }} />
              </button>
            )}
          </div>
        </div>
    </div>
  )
}

export default PostItem