import { Fragment } from "react";
import Skeleton from "react-loading-skeleton";

function PostCommentLoader() {
    return (
        <Fragment>
            <div className="tw-flex tw-flex-col tw-gap-[15px] tw-items-start">
                <div
                    className="tw-flex tw-gap-[10px] tw-w-full"
                >
                    <div id="div_img_comments_container">
                        <div id="div_img_search_profiles_container_cncts">
                            <Skeleton
                                circle
                                height="40px"
                                width="40px"
                                className="img_search_profiles_ntfs"
                                baseColor="rgb(210, 210, 210)"
                            />
                        </div>
                    </div>
                    <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-text-left">
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[100px]"
                            //   width="100%"
                            height="15px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[180px]"
                            //   width="100%"
                            height="40px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                    </div>
                </div>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-[15px] tw-items-start tw-w-full">
                <div
                    className="tw-flex tw-gap-[10px] tw-w-full"
                >
                    <div id="div_img_comments_container">
                        <div id="div_img_search_profiles_container_cncts">
                            <Skeleton
                                circle
                                height="40px"
                                width="40px"
                                className="img_search_profiles_ntfs"
                                baseColor="rgb(210, 210, 210)"
                            />
                        </div>
                    </div>
                    <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-text-left">
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[100px]"
                            //   width="100%"
                            height="15px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-full"
                            //   width="100%"
                            height="40px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                    </div>
                </div>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-[15px] tw-items-start tw-w-full">
                <div
                    className="tw-flex tw-gap-[10px] tw-w-full"
                >
                    <div id="div_img_comments_container">
                        <div id="div_img_search_profiles_container_cncts">
                            <Skeleton
                                circle
                                height="40px"
                                width="40px"
                                className="img_search_profiles_ntfs"
                                baseColor="rgb(210, 210, 210)"
                            />
                        </div>
                    </div>
                    <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-text-left">
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[100px]"
                            //   width="100%"
                            height="15px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-full"
                            //   width="100%"
                            height="70px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                    </div>
                </div>
            </div>
            <div className="tw-flex tw-flex-col tw-gap-[15px] tw-items-start">
                <div
                    className="tw-flex tw-gap-[10px] tw-w-full"
                >
                    <div id="div_img_comments_container">
                        <div id="div_img_search_profiles_container_cncts">
                            <Skeleton
                                circle
                                height="40px"
                                width="40px"
                                className="img_search_profiles_ntfs"
                                baseColor="rgb(210, 210, 210)"
                            />
                        </div>
                    </div>
                    <div className="tw-w-full tw-flex tw-flex-col tw-items-start tw-gap-[5px] tw-text-left">
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[100px]"
                            //   width="100%"
                            height="15px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                        <Skeleton
                            className="tw-max-w-full"
                            containerClassName="tw-w-[200px]"
                            //   width="100%"
                            height="40px"
                            baseColor="rgb(210, 210, 210)"
                            count={1}
                        />
                    </div>
                </div>
            </div>
        </Fragment>
    )
}

export default PostCommentLoader;