import { useEffect, useMemo, useState } from "react";
import "./chatList.css";
import AddUser from "./addUser/addUser";
import { useUserStore } from "../../../lib/userStore";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import { useChatStore } from "../../../lib/chatStore";

const ChatList = () => {
  const [chats, setChats] = useState([]);
  const [addMode, setAddMode] = useState(false);
  const [input, setInput] = useState("");

  const { currentUser } = useUserStore();
  const { chatId, changeChat } = useChatStore();

  useEffect(() => {
    console.log("Fetching chats for user:", currentUser.id);

    const unSub = onSnapshot(
      doc(db, "userchats", currentUser.id),
      async (res) => {
        console.log("Snapshot received:", res.data());

        const items = res.data()?.chats || [];

        const promises = items.map(async (item) => {
          console.log("Fetching user data for:", item.receiverId);

          try {
            const userDocRef = doc(db, "users", item.receiverId);
            const userDocSnap = await getDoc(userDocRef);

            if (!userDocSnap.exists()) {
              console.warn("User document not found:", item.receiverId);
              return { ...item, user: { username: "Unknown", avatar: "./avatar.png", blocked: [] } };
            }

            return { ...item, user: userDocSnap.data() };
          } catch (error) {
            console.error("Error fetching user document:", error);
            return { ...item, user: { username: "Error", avatar: "./avatar.png", blocked: [] } };
          }
        });

        const chatData = await Promise.all(promises);
        console.log("Final chat data:", chatData);

        setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
      }
    );

    return () => {
      unSub();
    };
  }, [currentUser.id]);

  const handleSelect = async (chat) => {
    const userChats = chats.map((item) => {
      const { user, ...rest } = item;
      return rest;
    });

    const chatIndex = userChats.findIndex(
      (item) => item.chatId === chat.chatId
    );

    userChats[chatIndex].isSeen = true;

    const userChatsRef = doc(db, "userchats", currentUser.id);

    try {
      await updateDoc(userChatsRef, {
        chats: userChats,
      });
      changeChat(chat.chatId, chat.user);
    } catch (err) {
      console.log(err);
    }
  };

  const filteredChats = useMemo(() => {
    return chats.filter((c) =>
      c.user.username.toLowerCase().includes(input.toLowerCase())
    );
  }, [chats, input]);

  return (
    <div className="chatList">
      <div className="search">
        <div className="searchBar">
          <img src="./search.png" alt="" />
          <input
            type="text"
            placeholder="Search"
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
        <img
          src={addMode ? "./minus.png" : "./plus.png"}
          alt=""
          className="add"
          onClick={() => setAddMode((prev) => !prev)}
        />
      </div>
      {filteredChats.map((chat) => (
        <div
          className={`item ${chatId === chat.chatId ? "selected" : ""}`}
          key={chat.chatId}
          onClick={() => handleSelect(chat)}
        >
          <img
            src={
              chat.user.blocked.includes(currentUser.id)
                ? "./avatar.png"
                : chat.user.avatar || "./avatar.png"
            }
            alt=""
          />
          <div className="texts">
            <span>
              {chat.user.blocked.includes(currentUser.id)
                ? "User"
                : chat.user.username}
            </span>
            <p>{chat.lastMessage}</p>
          </div>
        </div>
      ))}

      {addMode && <AddUser />}
    </div>
  );
};

export default ChatList;
