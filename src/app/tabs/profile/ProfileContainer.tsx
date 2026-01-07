import { Route, Routes } from "react-router-dom";
import Profile from "./user/Profile";
import Diary from "./diary/Diary";

function ProfileContainer(){
    return(
        <Routes>
            <Route path="/" element={<Profile />} />
            <Route path="/diary" element={<Diary />} />
        </Routes>
    )
}

export default ProfileContainer;