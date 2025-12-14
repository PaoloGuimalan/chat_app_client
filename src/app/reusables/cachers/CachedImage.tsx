import { persistAndReturnImage } from "@/reusables/hooks/localforagehelper";
import { CachedImageProp } from "@/reusables/vars/props";
import { useEffect, useState } from "react";

function CachedImage({ src, className, id, onLoad, onClick }: CachedImageProp) {
  const [workingURL, setworkingURL] = useState<string | null | undefined>(null);

  useEffect(() => {
    persistAndReturnImage("resources", src!)
      .then((value: string) => {
        setworkingURL(value);
      })
      .catch(() => {
        setworkingURL(src);
      });
  }, [src]);

  return (
    workingURL && (
      <img
        id={id}
        className={className}
        src={workingURL}
        onLoad={onLoad}
        onClick={onClick}
      />
    )
  );
}

export default CachedImage;
