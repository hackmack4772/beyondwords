import { useDispatch, useSelector } from "react-redux";
import "./userInfo.css";
import { signOut } from "firebase/auth";
import { resetChat } from "../../../features/use-chat-store/chatStore";
import { auth } from "../../../config/firebase";
import { useNavigate } from "react-router-dom";
import EditProfile from "./EditProfile/EditProfile";
import { useState } from "react";

const Userinfo = () => {
  const currentUser = useSelector((state) => state?.user?.currentUser);
  const dispatch = useDispatch();
  const navigate = useNavigate(); 
  const [showEditMode, setShowEditMode] = useState(false)
  

  const handleLogout = async () => {
    try {
      if(auth.currentUser){
        auth.signOut();
      }
      dispatch(resetChat());
    } catch (error) {
      console.error("Logout Error:", error);
    }
  };

  return (
    <div className="userInfo">
      <div className="user">
        <img src={currentUser?.avatar || "./avatar.png"} alt="User Avatar" />
        <h2>{currentUser?.username}</h2>
      </div>
      <div className="icons">
        {/* <img src="./more.png" alt="More" /> */}
        <img src="./edit.png" alt="Edit"  onClick={() => setShowEditMode((prev) => !prev)}/>
        <img src="./logout.svg" alt="Logout" onClick={handleLogout} />
      </div>
      {showEditMode && <EditProfile setShowEditMode={setShowEditMode}/>}

    </div>
  );
};

export default Userinfo;
