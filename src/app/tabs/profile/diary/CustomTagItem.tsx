/* eslint-disable @typescript-eslint/no-explicit-any */
import { components } from "react-select";

function CustomTagItem(props: any) {
  const { data, ...rest } = props;

  return (
    <components.Option {...rest} className="tw-rounded-[7px]">
      <div className="tw-w-full tw-flex tw-flex-col tw-gap-[5px] tw-rounded-[7px]">
        <span
          className={`cl-text-caption !tw-font-Inter ${
            data.is_new && "tw-font-semibold"
          }`}
        >
          {data.label}
        </span>
        {data.is_new && (
          <span className="cl-text-caption !w-font-Inter">+ Add Tag</span>
        )}
      </div>
    </components.Option>
  );
}

export default CustomTagItem;
