import React, { useEffect, useState } from "react";
import ChatList from "../chatList/ChatList";
import Chat from "../chat/Chat";
import Userinfo from "../userInfo/Userinfo";
import { useDispatch, useSelector } from "react-redux";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../../../config/firebase";
import "./list.css";

const List = () => {
  const { currentUser } = useSelector((state) => state.user);
  const { chat, chatId:chatID } = useSelector((state) => state.chat);
  
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [showChatList, setShowChatList] = useState(true);
  const [showChat, setShowChat] = useState(false);
  const dispatch = useDispatch()

  // Check if mobile and set up resize listener
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      
      // On desktop, always show both
      if (!mobile) {
        setShowChatList(true);
        setShowChat(!!chatID);
      } else {
        // On mobile, show chat if selected, otherwise show chat list
        setShowChatList(!chatID);
        setShowChat(!!chatID);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Initial check
    
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [chatID]);

  // Check for unread messages when component loads
  useEffect(() => {
    const getChats = () => {
      
      const unsub = onSnapshot(doc(db, "userchats", currentUser.id), (doc) => {
        const data = doc.data();
        
        if (!data) return;
        
        // Check unread messages for each chat
        Object.entries(data).forEach(([id, chat]) => {
          if (chat.unreadCount > 0) {
            console.log(`Chat ${id} has ${chat.unreadCount} unread messages`);
          }
        });
      });

      return () => {
        unsub();
      };
    };

    currentUser.id && getChats();
  }, [currentUser.id]);

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
    dispatch(changeUser({ chatId: null, user: null }));

  };
  console.log(showChatList, isMobile,"isMobile");
  

  return (
    <div className="chat-layout-container">
      <div className={`chat-list-container ${isMobile && !showChatList ? 'hidden' : ''}`}>
        <ChatList onChatSelect={handleChatSelect} />
      </div>
      
      <div className={`chat-or-user-container ${isMobile && !showChat ? 'hidden' : ''}`}>
        {chatID ? (
          <Chat onBackClick={handleBackToList} />
        ) : (
          <Userinfo />
        )}
      </div>
    </div>
  );
};

export default List;
