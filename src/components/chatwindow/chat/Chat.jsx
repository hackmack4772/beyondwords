import { useEffect, useRef, useState } from "react";
import "./chat.css"
import { useDispatch, useSelector } from "react-redux";
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { changeBlock } from "../../../features/use-chat-store/chatStore";
import upload from "../../../utils/upload";
const Chat = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  
  const currentUser = useSelector((state) => state.user.currentUser)
  const dispatch=useDispatch()
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useSelector((state) => state.chat)
  const [chat, setChat] = useState([])
  const [img, setImg] = useState({
    file: null,
    url: "",
  });
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);
  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), res => {
      setChat(res.data() ?? [])
    })

    return () => {
      unSub()
    }
  }, [chatId])

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({
        file: e.target.files[0],
        url: URL.createObjectURL(e.target.files[0]),
      });
    }
  };
  const handleEmoji = (e) => {
    setText((prev) => prev + e.emoji);
    setOpen(false);
  };

  const handleSend = async () => {
    console.log(text == "" && !img.file,"ge");
    
    if (text == "" && !img.file) return;
    let imgUrl = null;
    try {      
      if (img.file) {
        imgUrl = await upload(img.file)
      }
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl })
        })
      })

      const userIDs = [currentUser.id, user.id]
      userIDs.forEach(async id => {
        const userChatsRef = doc(db, "userchats", id)
        const userChatsSnapshot = await getDoc(userChatsRef);
        if (userChatsSnapshot.exists()) {
          const userChatsData = userChatsSnapshot.data()

          const chatIndex = userChatsData.chats.findIndex(
            (c) => c.chatId === chatId
          );

          userChatsData.chats[chatIndex].lastMessage = text;
          userChatsData.chats[chatIndex].isSeen = id == currentUser.id ? true : false;
          userChatsData.chats[chatIndex].updatedAt = Date.now();
          await updateDoc(userChatsRef, {
            chats: userChatsData.chats
          })
        }
      })
    } catch (error) {
      console.log(err);

    }
    finally {
      setImg({
        file: null,
        url: "",
      });

      setText("");
    }

  };
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  
      // Reset chunks before new recording
      audioChunksRef.current = [];  
  
      mediaRecorderRef.current = new MediaRecorder(stream);
  
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
  
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) {
          console.error("No audio data recorded!");
          return;
        }
  
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = await upload(audioBlob); // Make sure `upload` function is defined
  
        setAudioBlob(audioBlob);
        setAudioURL(URL.createObjectURL(audioBlob));
      };
  
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    } else {
      console.error("Recorder is not active");
    }
  };
  
    // const handleBlock = async () => {
    //   if (!user) return;
  
    //   const userDocRef = doc(db, "users", currentUser.id);
  
    //   try {
    //     await updateDoc(userDocRef, {
    //       blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id),
    //     });
    //   } catch (err) {
    //     console.log(err);
    //   }
    // };

  const handleBlockUser=async ()=>{

    if(!user) return ;
    const updateDocRef=doc(db,"users",currentUser.id);
    try {
      await updateDoc(updateDocRef,{
        blocked:isReceiverBlocked ?arrayRemove(user.id):arrayUnion(user.id)
      })
      dispatch(changeBlock());

      
    } catch (error) {
     console.log(error);

    }
  }
  return (
    <>
      {/* Top Section */}
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
          <div className="texts">
            <span>{user?.username}</span>
            <p>Lorem ipsum dolor, sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="Phone Icon" />
          <img src="./video.png" alt="Video Icon" />
          <img src={`${isReceiverBlocked?"./block-red.svg":"./block.svg"}`} alt="Info Icon"  onClick={handleBlockUser} />
        </div>
      </div>

      {/* Chat Messages */}
      <div className="center">
        {chat?.messages?.map((message) => (
          <div
            key={message?.createdAt}
            className={message.senderId === currentUser?.id ? "message own" : "message"}
          >
            <div className="texts">
              {message.img && <img src={message.img} alt="Message Attachment" />}
              <p>{message.text}</p>
              <span>{format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}

        {/* Display Selected Image Before Sending */}
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src={img.url} alt="Selected for Sending" />
            </div>
          </div>
        )}

        {/* Auto Scroll Reference */}
        <div ref={endRef}></div>
      </div>

      {/* Bottom (Input Section) */}
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Upload Image" />
          </label>
          <input
            type="file"
            id="file"
            style={{ display: "none" }}
            onChange={handleImg}
          />
          <img src="./camera.png" alt="Camera Icon" />
          <button onClick={recording ? stopRecording : startRecording}>
        {recording ? "Stop Recording" : <img src="./mic.png" alt="Microphone Icon" />}
      </button>
          
        </div>

        <input
          type="text"
          placeholder={
            isCurrentUserBlocked || isReceiverBlocked
              ? "You cannot send a message"
              : "Type a message..."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isCurrentUserBlocked && !isReceiverBlocked) {
              handleSend();
            }
          }}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />

        {/* Emoji Picker */}
        <div className="emoji">
          <img
            src="./emoji.png"
            alt="Emoji Picker"
            onClick={() => setOpen((prev) => !prev)}
          />
          {open && (
            <div className="picker">
              <EmojiPicker open={open} onEmojiClick={handleEmoji} />
            </div>
          )}
        </div>

        {/* Send Button */}
        <button
          className="sendButton"
          onClick={handleSend}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          Send
        </button>
      </div>
    </>


  )
};

export default Chat;
