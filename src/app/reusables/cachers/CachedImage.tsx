// import { persistAndReturnImage } from "@/reusables/hooks/localforagehelper";
import { CachedImageProp } from "@/reusables/vars/props";
import { forwardRef, LegacyRef, useEffect, useState } from "react";

const CachedImage = forwardRef(
  (
    { src, className, id, onLoad, onClick }: CachedImageProp,
    ref?: LegacyRef<HTMLImageElement>,
  ) => {
    const [workingURL, setworkingURL] = useState<string | null | undefined>(
      null,
    );
    const [onError, setonError] = useState<boolean>(false);

    useEffect(() => {
      setworkingURL(src);
      // persistAndReturnImage("resources", src!)
      //   .then((value: string) => {
      //     setworkingURL(value);
      //   })
      //   .catch(() => {
      //     setworkingURL(src);
      //   });
    }, [src]);

    return (
      workingURL &&
      (onError ? (
        <div
          id={id}
          title="Tap to Refresh"
          className={`${className} img-placeholder`}
          onLoad={onLoad}
          onClick={() => {
            setonError(false);
          }}
        />
      ) : (
        <img
          ref={ref || null}
          id={id}
          className={className}
          src={workingURL}
          onLoad={onLoad}
          onClick={onClick}
          onError={() => {
            setonError(true);
          }}
        />
      ))
    );
  },
);

export default CachedImage;
