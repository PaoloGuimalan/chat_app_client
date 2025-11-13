/* eslint-disable react-hooks/exhaustive-deps */
import { commentsliststate } from "@/redux/actions/states";
import { GetCommentsRequest } from "@/reusables/hooks/requests";
import { IPostComment } from "@/reusables/vars/interfaces";
import { PaginationProp, PostCommentProp } from "@/reusables/vars/props";
import DefaultProfile from "../../../assets/imgs/default.png";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

function PostComment({ post_id, parent_id }: PostCommentProp) {
    const [comments, setComments] = useState<PaginationProp<IPostComment>>(commentsliststate);
    const [isLoaded, setIsLoaded] = useState<boolean>(false);
    const [isError, setIsError] = useState<boolean>(false);
    const [page, setPage] = useState<number>(1);
    // const [range, setRange] = useState<number>(20);

    const navigate = useNavigate();

    useEffect(() => {
        GetPostCommentProcess(page, 20);
    }, [post_id, parent_id, page])

    const GetPostCommentProcess = (to_page: number, to_range: number) => {
        setIsLoaded(false);
        setIsError(false);
        GetCommentsRequest(post_id, parent_id, to_page, to_range).then((response) => {
            setComments(response);
            setIsLoaded(true);
            setIsError(false);
        }).catch((err) => {
            setIsLoaded(true);
            setIsError(true);
            console.log(err);
        })
    }

    return (
        <div className="tw-p-[25px] tw-w-[calc(100%-50px)] tw-min-h-[350px] tw-flex tw-flex-1 tw-flex-col tw-justify-between">
            <div className="tw-flex tw-flex-col tw-gap-[10px]">
                {
                    isError ? (
                        <span>Error</span>
                    ) : (
                        comments.results.length === 0 ? (
                            isLoaded && (
                                <span className="tw-text-[12px]">No Comments yet</span>
                            )
                        ) : (
                            <div className="tw-flex tw-flex-col tw-gap-[20px] tw-items-start">
                                {
                                    comments.results.map((mp: IPostComment) => {
                                        return (
                                            <div key={mp.comment_id} className="tw-flex tw-gap-[10px] tw-w-full">
                                                <div id="div_img_cncts_container">
                                                    <div id="div_img_search_profiles_container_cncts">
                                                        <img
                                                            src={
                                                                mp.user.profile == "none"
                                                                    ? DefaultProfile
                                                                    : mp.user.profile
                                                            }
                                                            className="img_search_profiles_ntfs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="tw-w-fit tw-flex tw-flex-col tw-items-start tw-gap-[5px]">
                                                    <span
                                                        className="tw-break-keep tw-text-[12px] tw-font-semibold tw-select-none tw-cursor-pointer tw-border-b tw-border-solid tw-border-transparent tw-border-[0px] tw-border-b-[1px] hover:tw-border-[#808080]"
                                                        onClick={() => {
                                                            navigate(`/${mp.user.username}`);
                                                        }}
                                                    >
                                                        {mp.user.first_name}
                                                        {mp.user.middle_name == "N/A"
                                                            ? ""
                                                            : ` ${mp.user.middle_name}`}{" "}
                                                        {mp.user.last_name}
                                                    </span>
                                                    <div style={{ backgroundColor: "rgb(222, 222, 222)" }} className="tw-p-[10px] tw-rounded-[10px]">
                                                        <span className="tw-text-[14px]">{mp.text}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })
                                }
                                {comments.next && isLoaded && (
                                    <button className="tw-text-[12px]" onClick={() => { setPage((prev) => prev + 1) }}>See more comments...</button>
                                )}
                            </div>
                        )
                    )
                }
                {!isLoaded && (
                    <span className="tw-text-[12px]">Loading...</span>
                )}
            </div>
            <div>
                <span className="tw-text-[12px]">Comment Inputs section</span>
            </div>
        </div>
    )
}

export default PostComment;