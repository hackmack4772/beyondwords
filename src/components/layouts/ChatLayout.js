import { useEffect, useState } from "react";
import {
  getAllUsers,
  getChatRooms,
  getMessagesOfChatRoom,
} from "../../services/ChatService";
import { useAuth } from "../../contexts/AuthContext";
import { db } from "../../config/firebase";
import { onSnapshot, collection, doc } from "firebase/firestore";

import ChatRoom from "../chat/ChatRoom";
import Welcome from "../chat/Welcome";
import AllUsers from "../chat/AllUsers";
import SearchUsers from "../chat/SearchUsers";

export default function ChatLayout() {
  const [users, setUsers] = useState([]);
  const [chatRooms, setChatRooms] = useState([]);
  const [currentChat, setCurrentChat] = useState(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    // Fetch all users
    const fetchUsers = async () => {
      const res = await getAllUsers();
      console.log(res,"resresresres")
      setUsers(res);
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    if (currentUser?.uid) {
      // Firestore real-time listener for chat rooms
      const chatRoomsRef = collection(db, "chatRooms");
      const unsubscribe = onSnapshot(chatRoomsRef, (snapshot) => {
        const chatRoomsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setChatRooms(chatRoomsData);
      });

      return () => unsubscribe();
    }
  }, [currentUser?.uid]);

  useEffect(() => {
    if (currentChat?.id) {
      // Firestore real-time listener for messages
      const chatRoomRef = doc(db, "chatRooms", currentChat.id);
      const unsubscribe = onSnapshot(chatRoomRef, (snapshot) => {
        if (snapshot.exists()) {
          setCurrentChat({ id: snapshot.id, ...snapshot.data() });
        }
      });

      return () => unsubscribe();
    }
  }, [currentChat?.id]);

  return (
    <div className="container mx-auto">
      <div className="min-w-full bg-white border-x border-b border-gray-200 dark:bg-gray-900 dark:border-gray-700 rounded lg:grid lg:grid-cols-3">
        <div className="bg-white border-r border-gray-200 dark:bg-gray-900 dark:border-gray-700 lg:col-span-1">
          <SearchUsers />

          <AllUsers
            users={users}
            chatRooms={chatRooms}
            currentUser={currentUser}
            changeChat={setCurrentChat}
            setChatRooms={setChatRooms}
          />
        </div>

        {currentChat ? (
          <ChatRoom currentChat={currentChat} currentUser={currentUser} />
        ) : (
          <Welcome />
        )}
      </div>
    </div>
  );
}
