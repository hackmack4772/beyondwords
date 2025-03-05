import { useEffect, useState } from "react"
import "./chatList.css"
import { useSelector } from "react-redux"
import { doc, onSnapshot } from "firebase/firestore"
import { db } from "../../../config/firebase"


const ChatList = () => {
    const [input, setInput] = useState('')
    const [addMode, setAddMode] = useState('')
    const [chats, setChats] = useState([])
    const currentUser=useSelector((state)=>state.user.currentUser)
    
    useEffect(()=>{
        onSnapshot(doc(db,'userchats',currentUser.id),async(res)=>{
            const items=res.data()?.chats||[];
            // const promises=items.map(async )



            

            
        })


    },[currentUser.id])

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
        </div>
    )


}

export default ChatList
