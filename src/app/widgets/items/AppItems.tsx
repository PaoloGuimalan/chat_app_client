import { AppItemProp } from '@/reusables/vars/props'

function AppItems({ mp }: AppItemProp) {
  return (
    <div className='tw-pl-[5px] tw-pr-[5px] tw-pt-[10px] tw-pb-[5px] tw-flex tw-flex-col tw-w-[60px] tw-cursor-pointer tw-select-none tw-items-center tw-gap-[2px] hover:tw-bg-[#e6e6e6]'> {/**#9cc2ff */}
        <div className='tw-w-full tw-transparent tw-h-[40px] tw-flex tw-justify-center tw-items-center'>
            {mp.icon}
        </div>
        <span className='tw-text-[12px] tw-font-Inter'>{mp.appname}</span>
    </div>
  )
}

export default AppItems