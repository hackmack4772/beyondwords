import { useEffect, useMemo, useState } from "react"
import "./chatList.css"
import { useDispatch, useSelector } from "react-redux"
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"
import { changeUser } from "../../../features/use-chat-store/chatStore"
import AddUser from "./adduser/AddUser"
import { FaPlus, FaMinus, FaEdit, FaSearch } from "react-icons/fa";
import EditProfile from "../userInfo/EditProfile/EditProfile"

const ChatList = ({ onChatSelect }) => {
    const [input, setInput] = useState('')
    const [addMode, setAddMode] = useState('')
    const [chats, setChats] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const currentUser = useSelector((state) => state.user.currentUser)
    const { chatId } = useSelector((state) => state.chat)

    const dispatch = useDispatch()
    const [showEditMode, setShowEditMode] = useState(false)


    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        const unSub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
            const items = res.data()?.chats || [];
            const promises = items.map(async (item) => {
                try {
                    const { receiverId } = item
                    const userDocRef = doc(db, "users", receiverId)
                    const userDocSnap = await getDoc(userDocRef)
                    if (!userDocSnap.exists) {
                        console.warn("User Document Not found:", receiverId)
                        return {
                            ...item, user: {
                                username: "Unknown",
                                avatar: "./avatar.png", blocked: []
                            }
                        }
                    }

                    return { ...item, user: userDocSnap.data() }

                } catch (error) {
                    console.error("Error fetching user document:", error);
                    return { ...item, user: { username: "Error", avatar: "./avatar.png", blocked: [] } };
                }
            })

            const chatData = await Promise.all(promises)
            setChats(chatData.sort((a, b) => b.updatedAt - a.updatedAt));
        })

        return () => {
            unSub()
        }

    }, [currentUser.id])

    const filteredChats = useMemo(() => {
        console.log(chats, "filteredChats");

        return chats.filter((c) =>
            c.user?.username?.toLowerCase().includes(input.toLowerCase())
        );
    }, [chats, input]);

    const handleSelect = (chat) => {
        if (!chat || !chat.user) {
            console.error('Invalid chat data:', chat);
            return;
        }

        // Create a clean user object with required fields
        const userData = {
            id: chat.user.id,
            username: chat.user.username,
            avatar: chat.user.avatar,
            blocked: chat.user.blocked || [],
            about: chat.user.about || ''
        };

        dispatch(changeUser({ chatId: chat.chatId, user: userData }));
        if (onChatSelect) {
            onChatSelect();
        }
    }

    return (
        <div className={`chatList ${isMobile && chatId ? 'hidden' : ''}`}>
            <div className="search">
                <div className="searchBar">
                    <FaSearch className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                    />
                </div>
                <div className="actions d-flex align-items-center gap-3">
                    {addMode ? (
                        <FaMinus className="icon add" color="black" onClick={() => 
                        {
                            setAddMode((prev) => !prev)
                            setShowEditMode(false)
                        }

                         } />
                    ) : (
                        <FaPlus className="icon add" color="black" onClick={() => 

                            {
                                setAddMode((prev) => !prev)
                                setShowEditMode(false)
                            }
                        } />
                    )}
                    <FaEdit className="icon edit" color="black" onClick={() => 
                    {
                        setShowEditMode((prev) => !prev)
                        setAddMode(false)
                    }


                    } />
                </div>

            </div>
            <div className="chatItemsContainer">
                {filteredChats.length && filteredChats.map((chat) => (
                    <div
                        key={chat.updatedAt}
                        className={`item ${chat.id === chatId ? "selected" : ""}`}
                        onClick={() => handleSelect(chat)}
                    >
                        <img
                            src={
                                chat.user?.blocked?.includes(currentUser.id)
                                    ? "./avatar.png"
                                    : chat.user?.avatar || "./avatar.png"
                            }
                            alt={chat.user?.username}
                        />
                        <div className="texts">
                            <span>
                                {chat.user?.blocked?.includes(currentUser.id)
                                    ? "User"
                                    : chat.user?.username || "Unknown User"
                                }
                            </span>
                            <p>{chat.lastMessage || "No messages yet"}</p>
                        </div>

                    </div>
                ))}
            </div>
            {addMode && <AddUser />}
            {showEditMode && <EditProfile show={showEditMode} setShowEditMode={setShowEditMode} />}

        </div>
    )
}

export default ChatList
