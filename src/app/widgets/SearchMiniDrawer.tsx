/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import "../../styles/styles.css";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import { BiUserMinus, BiUserPlus, BiUserX, BiUserCheck } from "react-icons/bi";
import { TbInputSearch } from "react-icons/tb";
import {
  AcceptContactRequest,
  ContactRequest,
  DeclineContactRequest,
  EntitySearchRequest,
} from "../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { EntitySearchResult } from "@/reusables/vars/interfaces";
// import { SET_MUTATE_ALERTS } from "@/redux/types";
import { useNavigate } from "react-router-dom";
import { Avatar } from "@/reusables/design";

function SearchMiniDrawer({
  searchbox,
  setsearchBoxFocus,
}: {
  searchbox: string;
  setsearchBoxFocus: any;
}) {
  const [isLoading, setisLoading] = useState(false);
  const [searchresults, setsearchresults] = useState<EntitySearchResult[]>([]);
  const [isDisabledByRequest, setisDisabledByRequest] = useState(false);

  const alerts = useSelector((state: any) => state.alerts);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const timeoutRequest = setTimeout(() => {
      if (searchbox.trim() != "") {
        if (searchbox.split("@")[1] != "") {
          // Entity search (v2): people AND pages in one normalized shape.
          EntitySearchRequest(
            {
              searchdata: searchbox,
              types: "user,realm",
              realmTypes: "page",
            },
            dispatch,
            setisLoading,
            alerts,
            setsearchresults,
          );
        } else {
          setisLoading(false);
        }
      }
    }, 1500);

    if (searchbox.trim() != "") {
      setisLoading(true);
    } else {
      setisLoading(false);
    }

    return () => {
      clearTimeout(timeoutRequest);
    };
  }, [searchbox]);

  const acceptContactRequestProcess = (
    connection_id: string,
    entity_id: string,
  ) => {
    setisDisabledByRequest(true);
    AcceptContactRequest(
      {
        connection_id,
        entity_id,
      },
      dispatch,
      alerts,
      setisDisabledByRequest,
    );
  };

  // All three send entity_id - the canonical key the contacts endpoints key
  // on, so the backend never translates an account id into an entity.
  const contactRequestProcess = (entity_id: string) => {
    setisDisabledByRequest(true);
    ContactRequest({ entity_id }, dispatch, alerts, setisDisabledByRequest);
  };

  const declineRequestProcess = (
    connection_id: any,
    entity_id: string,
    action: string,
  ) => {
    setisDisabledByRequest(true);
    DeclineContactRequest(
      {
        connection_id,
        entity_id,
        action,
      },
      dispatch,
      alerts,
      setisDisabledByRequest,
    );
  };

  return (
    <div id="div_searchminidrawer">
      <div id="div_searchminidrawer_header">
        <span id="span_searchminidrawer_label">
          Searching for "
          <span id="span_ellipsis_searchlabel_content">{searchbox}</span>"
        </span>
      </div>
      {isLoading ? (
        <div id="div_searchminidrawer_isLoading">
          <motion.div
            animate={{
              rotate: -360,
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
            }}
            id="div_loader_request"
          >
            <AiOutlineLoading3Quarters style={{ fontSize: "25px" }} />
          </motion.div>
        </div>
      ) : searchresults.length > 0 ? (
        <div id="div_searchminidrawer_content">
          {searchresults.map((srch: EntitySearchResult) => {
            const isRealm = srch.type === "realm";
            // Contact actions key on the entity id, present for both kinds.
            const targetEntityID = srch.entity_id;
            return (
              <motion.div
                key={srch.entity_id}
                initial={{
                  rotate: 0,
                }}
                animate={{
                  rotate: 0,
                }}
                transition={{
                  duration: 0,
                }}
                whileHover={{
                  backgroundColor: "#e6e6e6",
                }}
                className="div_search_profiles_results"
              >
                <div id="div_img_search_profiles_container">
                  <Avatar
                    id={srch.entity_id}
                    name={srch.display_name}
                    // v2 normalizes both "none" and "N/A" to null.
                    src={srch.profile ?? undefined}
                    size={40}
                  />
                </div>
                <div
                  onClick={() => {
                    setsearchBoxFocus(false);
                    navigate(`/${srch.handle}`);
                  }}
                  id="div_fullname_container"
                >
                  <span className="span_fullname">{srch.display_name}</span>
                  <span className="span_userID">
                    @{srch.handle}
                    {isRealm ? " · Page" : ""}
                  </span>
                </div>
                <div id="div_add_button">
                  {/* Pages are not connection targets - open the page and
                      follow from there, so no action button here. */}
                  {/* Order matters: settled first, then WHO asked.
                      is_action_by_entity true = I sent the request, so I
                      withdraw it; false = they sent it, so I answer it.
                      These were previously inverted, which showed
                      Accept/Decline to the requester. */}
                  {isRealm ? null : srch.has_connection ? (
                    srch.connection_accomplished ? null : srch.is_action_by_entity ? (
                      <motion.button
                        whileHover={{
                          backgroundColor: "#909090",
                          color: "white",
                        }}
                        onClick={() => {
                          declineRequestProcess(
                            srch.connection_id,
                            targetEntityID,
                            "remove",
                          );
                        }}
                        disabled={isDisabledByRequest}
                        title="Cancel Request"
                        id="btn_add_user"
                      >
                        <BiUserMinus style={{ fontSize: "23px" }} />
                      </motion.button>
                    ) : (
                      <>
                        <motion.button
                          whileHover={{
                            backgroundColor: "#909090",
                            color: "white",
                          }}
                          onClick={() => {
                            if (srch.connection_id) {
                              acceptContactRequestProcess(
                                srch.connection_id,
                                targetEntityID,
                              );
                            }
                          }}
                          disabled={isDisabledByRequest}
                          title="Accept Request"
                          id="btn_add_user"
                        >
                          <BiUserCheck style={{ fontSize: "23px" }} />
                        </motion.button>
                        <motion.button
                          whileHover={{
                            backgroundColor: "#909090",
                            color: "white",
                          }}
                          onClick={() => {
                            declineRequestProcess(
                              srch.connection_id,
                              targetEntityID,
                              "decline",
                            );
                          }}
                          disabled={isDisabledByRequest}
                          title="Decline Request"
                          id="btn_add_user"
                        >
                          <BiUserX style={{ fontSize: "23px" }} />
                        </motion.button>
                      </>
                    )
                  ) : (
                    <motion.button
                      whileHover={{
                        backgroundColor: "#909090",
                        color: "white",
                      }}
                      onClick={() => {
                        contactRequestProcess(targetEntityID);
                      }}
                      disabled={isDisabledByRequest}
                      title="Add Contact"
                      id="btn_add_user"
                    >
                      <BiUserPlus style={{ fontSize: "23px" }} />
                    </motion.button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div id="div_searchminidrawer_empty_content">
          <div id="div_icon_label_empty_content">
            <TbInputSearch style={{ fontSize: "100px" }} />
            <span id="span_no_result_label">No Results</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchMiniDrawer;
