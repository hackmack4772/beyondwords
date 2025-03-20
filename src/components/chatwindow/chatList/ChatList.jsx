import { useEffect, useMemo, useState } from "react"
import "./chatList.css"
import { useDispatch, useSelector } from "react-redux"
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore"
import { db } from "../../../config/firebase"
import { changeChat } from "../../../features/use-chat-store/chatStore"
import AddUser from "./adduser/AddUser"

const ChatList = () => {
    const [input, setInput] = useState('')
    const [addMode, setAddMode] = useState('')
    const [chats, setChats] = useState([])
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const currentUser = useSelector((state) => state.user.currentUser)
    const {chatId}= useSelector((state) => state.chat)    
    const dispatch=useDispatch()

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
        return chats.filter((c) =>
            c.user.username.toLowerCase().includes(input.toLowerCase())
        );

    }, [chats, input])

    const handleSelect = async (chat) => {
        try {
            const userChats = chats.map((item) => {
                const { user, ...rest} = item;
                return rest
            })
            const chatIndex=userChats.findIndex((item)=>(item.chatId ==chat.chatId))
            userChats[chatIndex].isSeen=true;
            const userChatsRef=doc(db,"userchats",currentUser.id);
            await updateDoc(userChatsRef,{
                chats:userChats
            });
            dispatch(changeChat({currentUser,chatId:chat.chatId,user:chat.user}))
            
            // In mobile view, after selecting a chat, make the chat component visible
            if (isMobile) {
                // Find and update the chat component visibility
                const chatElement = document.querySelector('.chat');
                if (chatElement) {
                    chatElement.classList.add('visible');
                }
            }

        } catch (error) {
            console.log(error)
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
            {filteredChats.map((chat) => (

                <div key={
                    chat.chatId}
                    onClick={() => {handleSelect(chat)}}
                    className={`item ${chatId === chat.chatId ? "selected" : ""}`}
                    >
                    <img
                        src={
                            chat.user.blocked.includes(currentUser.id)
                                ? "./avatar.png"
                            : chat.user.avatar || "./avatar.png"}
                    />
                    <div className="texts">
                        <span>
                            {chat.user.blocked.includes(currentUser.id)
                                ? "User" : chat.user.username
                            }
                        </span>
                        <p>{chat.lastMessage}</p>
                    </div>
                </div>))}
                {addMode && <AddUser/>}
        </div>
    )
}
export default ChatList
