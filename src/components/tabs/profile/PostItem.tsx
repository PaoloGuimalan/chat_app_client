// import React from 'react'

function PostItem({ mp }: any) {
  return (
    <div className=" tw-bg-white tw-border-solid tw-border-[0px] tw-border-[1px] tw-border-[#d2d2d2] tw-rounded-[7px] tw-flex tw-w-[calc(100%-40px)] tw-p-[20px]">
        <span>{mp.content.data}</span>
    </div>
  )
}

export default PostItem