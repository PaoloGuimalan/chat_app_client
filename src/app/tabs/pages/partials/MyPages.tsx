/* eslint-disable @typescript-eslint/no-unused-vars */
import { Route, Routes } from "react-router-dom";
import MyPagesList from "./MyPagesList";
import CreatePage from "./CreatePage";

/* eslint-disable @typescript-eslint/no-explicit-any */
function MyPages() {
  return (
    <Routes>
      <Route path="/" element={<MyPagesList />} />
      <Route path="/create" element={<CreatePage />} />
    </Routes>
  );
}

export default MyPages;
