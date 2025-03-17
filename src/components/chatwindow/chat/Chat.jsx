import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { useDispatch, useSelector } from "react-redux";
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { changeBlock } from "../../../features/use-chat-store/chatStore";
import upload from "../../../utils/upload";

const Chat = () => {
  const [recording, setRecording] = useState(false);
  const [typing, setTyping] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const endRef = useRef(null);

  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useSelector((state) => state.chat);
  const [chat, setChat] = useState([]);
  const [img, setImg] = useState({ file: null, url: "" });
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data() ?? []);
    });
    return () => unSub();
  }, [chatId]);

  useEffect(() => {
    if (user?.id) {
      const userStatusRef = doc(db, "users", user.id);
      const unSub = onSnapshot(userStatusRef, (docSnap) => {
        if (docSnap.exists()) {
          const lastSeen = docSnap.data().lastSeen;
          setIsOnline(Date.now() - lastSeen?.toMillis() < 60000);
          setIsTyping(docSnap.data().typing || false);
        }
      });
      return () => unSub();
    }
  }, [user]);

  const updateTypingStatus = async (status) => {
    setTyping(status);
    await updateDoc(doc(db, "users", currentUser.id), { typing: status });
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleSend = async () => {
    if (!text && !img.file) return;
    let imgUrl = null;
    try {
      if (img.file) imgUrl = await upload(img.file);
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({ senderId: currentUser.id, text, createdAt: new Date(), ...(imgUrl && { img: imgUrl }) })
      });
      setText("");
      setImg({ file: null, url: "" });
      await updateTypingStatus(false);
    } catch (error) {
      console.log(error);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
        if (audioChunksRef.current.length === 0) return;
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current.mimeType });
        const cloudinaryURL = await upload(audioBlob);
        if (cloudinaryURL) setAudioURL(cloudinaryURL);
      };
      mediaRecorderRef.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  return (
    <>
      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="User Avatar" />
          <div className="texts">
            <span>{user?.username} {isOnline ? "(Online)" : "(Offline)"}</span>
            <p>{isTyping ? "Typing..." : ""}</p>
          </div>
        </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message) => (
          <div key={message.createdAt} className={message.senderId === currentUser.id ? "message own" : "message"}>
            <div className="texts">
              {message.img && <img src={message.img} alt="Message Attachment" />}
              {message.text && <p>{message.text}</p>}
              <span>{format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file"><img src="./img.png" alt="Upload" /></label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          <button onClick={recording ? stopRecording : startRecording}>
            <img src={recording ? "./stop.png" : "./mic.png"} alt="Mic" />
          </button>
        </div>
        <input
          type="text"
          placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You cannot send a message" : "Type a message..."}
          value={text}
          onChange={(e) => { setText(e.target.value); updateTypingStatus(true); }}
          onKeyDown={(e) => { if (e.key === "Enter") handleSend(); }}
          onBlur={() => updateTypingStatus(false)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
          <img src="./send.png" alt="Send" />
        </button>
      </div>
    </>
  );
};

export default Chat;
