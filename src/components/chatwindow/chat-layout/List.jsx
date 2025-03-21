import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth, db } from "../../../config/firebase";
import ChatList from "../chatList/ChatList";
import Chat from "../chat/Chat";
import Userinfo from "../userInfo/Userinfo";
import { useSelector, useDispatch } from "react-redux";
import { doc, onSnapshot, updateDoc } from "firebase/firestore";
import { FaSignOutAlt, FaUser, FaCog } from "react-icons/fa";
import styled from "styled-components";
import "./list.css";

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: var(--bg-color);
  border-bottom: 1px solid var(--border-color);
`;

const UserSection = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const Avatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
`;

const Username = styled.span`
  font-weight: 600;
  color: var(--text-primary);
`;

const IconButton = styled.button`
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: all 0.2s;

  &:hover {
    background: var(--surface-color);
    color: var(--primary-color);
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const List = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.user);
  const { chat, chatId: chatID } = useSelector((state) => state.chat);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatList, setShowChatList] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const [showProfileEdit, setShowProfileEdit] = useState(false);

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Handle profile edit
  const handleProfileEdit = () => {
    setShowProfileEdit(true);
  };

  // Check if mobile and set up resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      if (!mobile) {
        setShowChatList(true);
        setShowChat(!!chatID);
      } else {
        setShowChatList(!chatID);
        setShowChat(!!chatID);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();
    
    return () => window.removeEventListener("resize", handleResize);
  }, [chatID]);

  // Check for unread messages
  useEffect(() => {
    if (!currentUser?.id) return;

    const unsub = onSnapshot(doc(db, "userchats", currentUser.id), (doc) => {
      const data = doc.data();
      if (!data) return;
      
      Object.entries(data).forEach(([id, chat]) => {
        if (chat.unreadCount > 0) {
          console.log(`Chat ${id} has ${chat.unreadCount} unread messages`);
        }
      });
    });

    return () => unsub();
  }, [currentUser?.id]);

  // Handle chat selection
  const handleChatSelect = () => {
    if (isMobile) {
      setShowChatList(false);
      setShowChat(true);
    }
  };

  // Handle back button press on mobile
  const handleBackToList = () => {
    if (isMobile) {
      setShowChatList(true);
      setShowChat(false);
    }
  };

  return (
    <div className="chat-layout-container">
      <div className={`chat-list-container ${isMobile && !showChatList ? 'hidden' : ''}`}>
        <Header>
          <UserSection>
            <Avatar src={currentUser?.avatar || "/default-avatar.png"} alt="Profile" />
            <Username>{currentUser?.username}</Username>
          </UserSection>
          <ActionButtons>
            <IconButton onClick={handleProfileEdit} title="Edit Profile">
              <FaUser />
            </IconButton>
            <IconButton onClick={() => setShowProfileEdit(false)} title="Settings">
              <FaCog />
            </IconButton>
            <IconButton onClick={handleLogout} title="Logout">
              <FaSignOutAlt />
            </IconButton>
          </ActionButtons>
        </Header>
        <ChatList onChatSelect={handleChatSelect} />
      </div>
      
      <div className={`chat-or-user-container ${isMobile && !showChat ? 'hidden' : ''}`}>
        {chatID ? (
          <Chat onBackClick={handleBackToList} />
        ) : showProfileEdit ? (
          <Userinfo setShowEditMode={setShowProfileEdit} showEditMode={showProfileEdit} />
        ) : (
          <div className="no-chat">
            <p>Select a chat to start messaging</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default List;
