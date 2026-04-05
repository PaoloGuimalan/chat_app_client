/* eslint-disable react-hooks/exhaustive-deps */
import { Navigate, Route, Routes } from "react-router-dom";
import ManageRealmContainer from "./manage/ManageRealmContainer";

function RealmContainer() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={"/"} />} />
      <Route path="/:realm_id" element={<ManageRealmContainer />} />
    </Routes>
  );
}

export default RealmContainer;
