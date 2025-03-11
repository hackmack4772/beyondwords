import { useState } from "react";
import "./addUser.css";
import { useSelector } from "react-redux";
import { format } from "timeago.js";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "../../../../config/firebase";




const AddUser = () => {
    const [user, setUser] = useState(null);
    const currentUser = useSelector((state) => state.user.currentUser)


    const handleSearch =async (e) => {
        e.preventDefault()

        const formData = new FormData(e.target);
        const username = formData.get("username")
        try {
            const userRef=collection(db,"users")
            const q=query(userRef,where('username',"==",username))

            const querySnapShot=await getDocs(q)

            if(!querySnapShot.empty){
                setUser(querySnapShot.docs[0].data())
            }

        } catch (error) {
            console.log(error);

        }

    }
    const handleAdd = async () => {
        console.log("Starting chat creation process...");
      
        const chatRef = collection(db, "chats");
        const userChatsRef = collection(db, "userchats");
      
        try {
          console.log("Checking if a chat already exists...");
          const userChatsDoc = await getDoc(doc(userChatsRef, currentUser.id));
      
          if (userChatsDoc.exists()) {
            const existingChats = userChatsDoc.data().chats || [];
            const existingChat = existingChats.find(
              (chat) => chat.receiverId === user.id
            );
      
            if (existingChat) {
              console.log("Chat already exists with ID:", existingChat.chatId);
              return existingChat.chatId; // Return existing chat ID
            }
          }
      
          console.log("No existing chat found. Creating a new chat...");
      
          const newChatRef = doc(chatRef); // Generate a new chat ID
          console.log("New chat document ID:", newChatRef.id);
      
          // Step 1: Create a new chat document in "chats" collection
          await setDoc(newChatRef, {
            createdAt: serverTimestamp(),
            messages: [],
          });
          console.log("Chat created successfully in 'chats' collection.");
      
          // Step 2: Update userChats collection for the selected user
          await updateDoc(doc(userChatsRef, user.id), {
            chats: arrayUnion({
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: currentUser.id,
              updatedAt: Date.now(),
            }),
          });
          console.log("UserChats updated for the selected user.");
      
          // Step 3: Update userChats collection for the current user
          await updateDoc(doc(userChatsRef, currentUser.id), {
            chats: arrayUnion({
              chatId: newChatRef.id,
              lastMessage: "",
              receiverId: user.id,
              updatedAt: Date.now(),
            }),
          });
          console.log("UserChats updated for the current user.");
      
          console.log("Chat creation process completed successfully.");
          return newChatRef.id; // Return the new chat ID
        } catch (err) {
          console.error("Error during chat creation:", err);
        }
      };


    return (
        <div className="addUser">
            <form onSubmit={handleSearch}>
                <input type="text" placeholder="Username" name="username" />
                <button>Search</button>
            </form>
            {user && (
                <div className="user">
                    <div className="detail">
                        <img src={user.avatar || "./avatar.png"} alt="" />
                        <span>{user.username}</span>
                    </div>
                    <button onClick={handleAdd}>Add User</button>
                </div>
            )}
        </div>
    );



}

export default AddUser