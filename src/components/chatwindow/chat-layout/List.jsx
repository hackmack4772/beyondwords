import { useSelector } from "react-redux"
import ChatList from "../chatList/ChatList"
import Userinfo from "../userInfo/Userinfo"
import Chat from "../chat/Chat"



const List = () => {
    const {chatId}= useSelector((state) => state.chat)   
    console.log(chatId,"chatIdtheek hai ");
    
    return (
        <>
        <div className="list">
            <Userinfo />
            <ChatList />
        </div>
        {chatId&& <Chat/>}

        </>
    )


}

export default List
