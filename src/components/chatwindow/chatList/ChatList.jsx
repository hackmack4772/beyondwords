import { useEffect, useMemo, useState } from "react"
import "./chatList.css"
import { useDispatch, useSelector } from "react-redux"
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"
import { changeUser } from "../../../features/use-chat-store/chatStore"
import AddUser from "./adduser/AddUser"

const ChatList = ({ onChatSelect }) => {
    const [input, setInput] = useState('')
    const [addMode, setAddMode] = useState('')
    const [chats, setChats] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const currentUser = useSelector((state) => state.user.currentUser)
    const { chatId } = useSelector((state) => state.chat)    
    const dispatch = useDispatch()

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const getChats = () => {
            const unsub = onSnapshot(doc(db, "userChats", currentUser.uid), async (doc) => {
                if (doc.exists()) {
                    const data = doc.data();
                    const chatArray = Object.entries(data).map(([id, chat]) => ({
                        id,
                        ...chat
                    }));
                    
                    // Sort chats by last message timestamp
                    chatArray.sort((a, b) => {
                        const aTime = a.lastMessage?.createdAt?.toMillis() || 0;
                        const bTime = b.lastMessage?.createdAt?.toMillis() || 0;
                        return bTime - aTime;
                    });
                    
                    setChats(chatArray);
                }
            });

            return () => {
                unsub();
            };
        };

        currentUser.uid && getChats();
    }, [currentUser.uid]);

    const filteredChats = useMemo(() => {
        return chats.filter((c) =>
            c.userInfo?.username?.toLowerCase().includes(input.toLowerCase())
        );
    }, [chats, input]);

    const handleSelect = (chat) => {
        if (!chat || !chat.userInfo) {
            console.error('Invalid chat data:', chat);
            return;
        }

        // Create a clean user object with required fields
        const userData = {
            id: chat.userInfo.id,
            username: chat.userInfo.username,
            avatar: chat.userInfo.avatar,
            blocked: chat.userInfo.blocked || [],
            about: chat.userInfo.about || ''
        };

        dispatch(changeUser({ chatId: chat.id, user: userData }));
        if (onChatSelect) {
            onChatSelect();
        }
    }

    return (
        <div className={`chatList ${isMobile && chatId ? 'hidden' : ''}`}>
            <div className="search">
                <div className="searchBar">
                    <img src="./search.png" alt="" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={input}
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
            <div className="chatItemsContainer">
                {filteredChats.map((chat) => (
                    <div
                        key={chat.id}
                        className={`item ${chat.id === chatId ? "selected" : ""}`}
                        onClick={() => handleSelect(chat)}
                    >
                        <img
                            src={
                                chat.userInfo?.blocked?.includes(currentUser.uid)
                                    ? "./avatar.png"
                                    : chat.userInfo?.avatar || "./avatar.png"
                            }
                            alt={chat.userInfo?.username}
                        />
                        <div className="texts">
                            <span>
                                {chat.userInfo?.blocked?.includes(currentUser.uid)
                                    ? "User" 
                                    : chat.userInfo?.username || "Unknown User"
                                }
                            </span>
                            <p>{chat.lastMessage?.text || "No messages yet"}</p>
                        </div>
                    </div>
                ))}
            </div>
            {addMode && <AddUser/>}
        </div>
    )
}

export default ChatList
