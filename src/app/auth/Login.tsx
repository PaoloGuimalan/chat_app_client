/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import "../../styles/styles.css";
import { motion } from "framer-motion";
import ChatterLoopImg from "../../assets/imgs/chatterloop.png";
import { useNavigate } from "react-router-dom";
import {
  LoginRequest,
  ThirdPartyAuthenticationRequest,
} from "../../reusables/hooks/requests";
import { useDispatch, useSelector } from "react-redux";
import { SET_ALERTS } from "../../redux/types";
import { AiOutlineLoading3Quarters } from "react-icons/ai";
import {
  CredentialResponse,
  GoogleLogin,
  GoogleOAuthProvider,
} from "@react-oauth/google";
import envs from "../../reusables/hooks/env_configs";

function Login() {
  const alerts = useSelector((state: any) => state.alerts);

  const [email_username, setemail_username] = useState("");
  const [password, setpassword] = useState("");
  const [isWaitingRequest, setisWaitingRequest] = useState(false);

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const verifyLogin = () => {
    setisWaitingRequest(true);
    if (email_username.trim() != "" && password.trim() != "") {
      LoginRequest(
        {
          email_username: email_username,
          password: password,
        },
        dispatch,
        alerts,
        setisWaitingRequest
      );
    } else {
      setisWaitingRequest(false);
      dispatch({
        type: SET_ALERTS,
        payload: {
          alerts: {
            id: alerts.length,
            type: "warning",
            content: "Please complete the field.",
          },
        },
      });
    }
  };

  const verifyTPAuthentication = (token: string) => {
    setisWaitingRequest(true);
    ThirdPartyAuthenticationRequest(
      {
        token,
      },
      dispatch,
      alerts,
      setisWaitingRequest
    );
  };

  return (
    <GoogleOAuthProvider clientId={envs.GOOGLE_CLIENT_ID}>
      <div id="div_login">
        <motion.div
          initial={{
            height: "0px",
            paddingTop: "0px",
            paddingBottom: "0px",
          }}
          animate={{
            height: "auto",
            paddingTop: "20px",
            paddingBottom: "0px",
            border: "solid 1px white",
          }}
          transition={{
            duration: 1,
            delay: 0.5,
          }}
          id="div_login_form"
        >
          <span id="span_login_label">Chatterloop</span>
          <div id="div_img_icon_login_container">
            <img src={ChatterLoopImg} id="img_icon_login" />
          </div>
          <div id="div_login_form_inputs">
            <div id="div_inputs_container">
              <input
                type="text"
                placeholder="Email or Username"
                className="inputs_login"
                value={email_username}
                onChange={(e) => {
                  setemail_username(e.target.value);
                }}
              />
              <input
                type="password"
                placeholder="Password"
                className="inputs_login"
                value={password}
                onChange={(e) => {
                  setpassword(e.target.value);
                }}
              />
              {isWaitingRequest ? (
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
              ) : (
                <div className="tw-flex tw-flex-col tw-w-full tw-gap-[10px] tw-items-center tw-pb-[20px]">
                  <button
                    id="btn_login"
                    onClick={() => {
                      verifyLogin();
                    }}
                  >
                    Log In
                  </button>
                  <div className="tw-flex tw-flex-col tw-w-[90%] tw-items-center">
                    <hr className="tw-w-full tw-border-white" />
                    <span className="tw-font-Inter tw-text-[#3a3a3a] tw-text-[14px] tw-p-[5px] tw-pl-[10px] tw-pr-[10px] tw--mt-[24px] tw-bg-[#dfdfdf] tw-w-fit tw-font-semibold">
                      OR
                    </span>
                  </div>
                  <GoogleLogin
                    onSuccess={(credentialResponse: CredentialResponse) => {
                      if (credentialResponse.credential) {
                        verifyTPAuthentication(credentialResponse.credential);
                      } else {
                        dispatch({
                          type: SET_ALERTS,
                          payload: {
                            alerts: {
                              id: alerts.length,
                              type: "warning",
                              content: "Unable to login using this account.",
                            },
                          },
                        });
                      }
                    }}
                    onError={() => {
                      dispatch({
                        type: SET_ALERTS,
                        payload: {
                          alerts: {
                            id: alerts.length,
                            type: "error",
                            content:
                              "There was a problem logging in with Google.",
                          },
                        },
                      });
                    }}
                  />
                </div>
              )}
            </div>
            <div id="div_question_label_login">
              <span id="span_question_label">Don't have an account yet?</span>
              <span
                id="span_sign_up_redirect"
                onClick={() => {
                  navigate("/register");
                }}
              >
                Sign Up
              </span>
            </div>
          </div>
        </motion.div>
        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 1.2,
            duration: 1.5,
          }}
          id="div_bubble1"
        />
        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 1.2,
            duration: 1.5,
          }}
          id="div_bubble2"
        />
        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 1.2,
            duration: 1.5,
          }}
          id="div_bubble3"
        />
        <motion.div
          initial={{
            scale: 0,
          }}
          animate={{
            scale: 1,
          }}
          transition={{
            delay: 1.2,
            duration: 1.5,
          }}
          id="div_bubble4"
        />
      </div>
    </GoogleOAuthProvider>
  );
}

export default Login;
