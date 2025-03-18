import { useEffect, useRef, useState } from "react";
import "./chat.css";
import { useDispatch, useSelector } from "react-redux";
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { FaMicrophone, FaStop, FaTrash, FaPaperPlane, FaUser, FaUserSlash } from "react-icons/fa";
import { changeBlock } from "../../../features/use-chat-store/chatStore";
import upload from "../../../utils/upload";

const Chat = () => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useSelector((state) => state.chat);
  const [chat, setChat] = useState([]);
  const [img, setImg] = useState({ file: null, url: "" });
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data() ?? []);
    });
    return () => unSub();
  }, [chatId]);

  const handleSend = async () => {
    if (!text && !img.file && !audioURL) return;
    let imgUrl = null;
    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }
      await updateDoc(doc(db, "chats", chatId), {
        messages: arrayUnion({
          senderId: currentUser.id,
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
          ...(audioURL && { audio: audioURL })
        })
      });
      setImg({ file: null, url: "" });
      setText("");
      setAudioURL(null);
      deleteRecording();
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
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const cloudinaryURL = await upload(audioBlob);
        if (cloudinaryURL) {
          setAudioBlob(audioBlob);
          setAudioURL(cloudinaryURL);
        }
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

  const deleteRecording = () => {
    setAudioBlob(null);
    setAudioURL(null);
  };
  const handleBlockUser = async () => {

    if (!user) return;
    const updateDocRef = doc(db, "users", currentUser.id);
    try {
      await updateDoc(updateDocRef, {
        blocked: isReceiverBlocked ? arrayRemove(user.id) : arrayUnion(user.id)
      })
      dispatch(changeBlock());


    } catch (error) {
      console.log(error);

    }
  }

  return (
    <>
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
          <button onClick={handleBlockUser} className="bg-transparent border-none p-0">
            {isReceiverBlocked ? <FaUserSlash color="red" /> : <FaUser />}
          </button>      
          </div>
      </div>

      <div className="center">
        {chat?.messages?.map((message, index) => (
          <div key={index} className={message.senderId === currentUser?.id ? "message own" : "message"}>
            <div className="texts">
              {message.img && <img src={message.img} alt="Attachment" />}
              {message.audio && <audio controls src={message.audio} />}
              {message.text && <p>{message.text}</p>
              }              <span>{format(message.createdAt.toDate())}</span>
            </div>
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="Upload" />
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={(e) => e.target.files[0] && setImg({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) })} />
          <button onClick={recording ? stopRecording : startRecording} style={{ background: "none", border: "none", padding: 0 }}
          >
            {recording ? <FaStop /> : <FaMicrophone />}
          </button>
          {audioBlob && <button onClick={deleteRecording} style={{ background: "none", border: "none", padding: 0 }}
          ><FaTrash /></button>}
        </div>

        <input
          type="text"
          placeholder={isCurrentUserBlocked || isReceiverBlocked ? "You cannot send a message" : "Type a message..."}
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />

        {/* {audioBlob && <audio controls src={audioURL} />} */}

        <button className="sendButton" onClick={handleSend} disabled={isCurrentUserBlocked || isReceiverBlocked}>
          <FaPaperPlane />
        </button>
      </div>
    </>
  );
};

export default Chat;