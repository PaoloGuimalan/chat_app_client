
function Modal({ component }: any) {
  return (
    <div className='tw-fixed tw-z-[50] tw-w-full tw-h-full tw-flex tw-items-center tw-justify-center tw-top-0 tw-left-0'
        style={{
            backgroundColor: "rgba(0, 0, 0, 0.8)"
        }}
    >
        {component}
    </div>
  )
}

export default Modal