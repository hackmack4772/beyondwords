import { useEffect, useMemo, useState } from "react"
import "./chatList.css"
import { useSelector } from "react-redux"
import { doc, getDoc, onSnapshot } from "firebase/firestore"
import { db } from "../../../config/firebase"


const ChatList = () => {
    const [input, setInput] = useState('')
    const [addMode, setAddMode] = useState('')
    const [chats, setChats] = useState([])
    const currentUser = useSelector((state) => state.user.currentUser)

    useEffect(() => {
        const unSub = onSnapshot(doc(db, 'userchats', currentUser.id), async (res) => {
            const items = res.data()?.chats || [];
            const promises = items.map(async (item) => {
                try {
                    const { receiverId } = item
                    console.log(receiverId, "receiverId");
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
            // const promises=items.map(async )
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


    
    return (
        <div className="chatList">
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
                    
                    <div key={chat.chatId}>
                        <img
                            src={
                                chat.user.blocked.includes(currentUser.id)
                                    ? "./avatar.png"
                                    : chat.user.avatar || "./avatar.png"

                            }
                        />
                        <div className="texts">
                            <span>
                                {chat.user.blocked.includes(currentUser.id)
                                    ? "User" : chat.user.username
                                }
                            </span>
                            <p>{chat.lastMessage}</p>
                        </div>
                    </div>
            ))
            }
        </div>
    )


}

export default ChatList
