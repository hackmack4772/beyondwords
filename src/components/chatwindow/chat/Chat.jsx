import { useEffect, useRef, useState } from "react";
import styles from "./Chat.module.css";
import { useDispatch, useSelector } from "react-redux";
import { arrayRemove, arrayUnion, doc, getDoc, onSnapshot, updateDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../config/firebase";
import { format } from "timeago.js";
import EmojiPicker from "emoji-picker-react";
import { FaMicrophone, FaStop, FaTrash, FaPaperPlane, FaUser, FaUserSlash, FaArrowLeft, FaPaperclip, FaSmile } from "react-icons/fa";
import { changeBlock } from "../../../features/use-chat-store/chatStore";
import upload from "../../../utils/upload";
import Call from "../../call/Call";
import NotificationManager from "../../../utils/NotificationManager";


const Chat = ({ onBackClick }) => {
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioURL, setAudioURL] = useState(null);
  const [editingMessage, setEditingMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [typing, setTyping] = useState(false);
  const currentUser = useSelector((state) => state.user.currentUser);
  const dispatch = useDispatch();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useSelector((state) => state.chat);
  const [chat, setChat] = useState([]);
  const [img, setImg] = useState({ file: null, url: "" });
  const [text, setText] = useState("");
  const [open, setOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [isVisible, setIsVisible] = useState(true);
  const messagesContainerRef = useRef(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat?.messages]);

  useEffect(() => {
    if (!chatId || !user) {
      console.log('No chat or user selected');
      return;
    }

    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      if (res.exists()) {
        const newChatData = res.data();
        console.log(newChatData,"newChatData");
        
        setChat(newChatData);
        
        // Check for new messages to show notifications
        if (newChatData.messages?.length > 0 && chat?.messages?.length > 0) {
          const lastMessage = newChatData.messages[newChatData.messages.length - 1];
          const prevMessagesCount = chat.messages.length;
          
          // If there's a new message and it's not from the current user
          if (newChatData.messages.length > prevMessagesCount && 
              lastMessage.senderId !== currentUser.id) {
            // Show notification for new message
            NotificationManager.showMessageNotification(lastMessage, user, chatId);
          }
        }
      } else {
        // If chat doesn't exist, create it
        setDoc(doc(db, "chats", chatId), {
          messages: [],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        setChat({ messages: [] });
      }
    });

    return () => unSub();
  }, [chatId, currentUser.id, chat?.messages?.length, user]);

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

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages arrive
    if (messagesContainerRef.current) {
      const { scrollHeight, clientHeight } = messagesContainerRef.current;
      messagesContainerRef.current.scrollTop = scrollHeight - clientHeight;
    }
  }, [chat?.messages]);

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
          ...(audioURL && { audio: audioURL }),
          edited: false,
          deleted: false
        })
      });
      setImg({ file: null, url: "" });
      setText("");
      await updateTypingStatus(false);
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

  const updateTypingStatus = async (status) => {
    setTyping(status);
    await updateDoc(doc(db, "users", currentUser.id), { typing: status });
  };

  const handleImg = (e) => {
    if (e.target.files[0]) {
      setImg({ file: e.target.files[0], url: URL.createObjectURL(e.target.files[0]) });
    }
  };

  const handleEditMessage = (message) => {
    setEditingMessage(message);
    setEditText(message.text);
  };

  const handleSaveEdit = async () => {
    if (!editText.trim()) return;
    try {
      const updatedMessages = chat.messages.map(msg => {
        if (msg === editingMessage) {
          return { ...msg, text: editText, edited: true };
        }
        return msg;
      });

      await updateDoc(doc(db, "chats", chatId), {
        messages: updatedMessages
      });
      setEditingMessage(null);
      setEditText("");
    } catch (error) {
      console.log(error);
    }
  };

  const handleDeleteMessage = async (message) => {
    try {
      const updatedMessages = chat.messages.map(msg => {
        if (msg === message) {
          return { ...msg, deleted: true, text: "This message has been deleted" };
        }
        return msg;
      });

      await updateDoc(doc(db, "chats", chatId), {
        messages: updatedMessages
      });
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className={`${styles.container} ${isMobile && isVisible ? styles.visible : ''}`}>
      <div className={styles.header}>
        {isMobile && (
          <button className={styles.backButton} onClick={onBackClick}>
            ←
          </button>
        )}
        <div className={styles.userInfo}>
          <img 
            src={user?.avatar || "./avatar.png"} 
            alt={user?.username || "User"} 
            className={styles.avatar} 
          />
          <div className={styles.userTexts}>
            <span className={styles.username}>{user?.username || "Unknown User"}</span>
            <p className={styles.status}>{isTyping ? "Typing..." : ""}</p>
            <p className={styles.status}>{user?.about || ""}</p>
          </div>
        </div>
        <div className={styles.headerIcons}>
          <div className={styles.callIcons}>
            <Call currentUser={currentUser} receiverId={user?.id} />
          </div>
          <button onClick={handleBlockUser} className={styles.iconButton}>
            {isReceiverBlocked ? <FaUserSlash color="red" size={22} /> : <FaUser color="#128C7E" size={22} />}
          </button>
        </div>
      </div>

      <div className={styles.messagesContainer} ref={messagesContainerRef}>
        {chat?.messages?.map((message, index) => (
          <div key={index} className={`${styles.message} ${message.senderId === currentUser?.id ? styles.messageOwn : ""}`}>
            <img 
              src={message.senderId === currentUser?.id ? currentUser?.avatar : user?.avatar || "./avatar.png"} 
              alt="Avatar" 
              className={styles.messageAvatar}
            />
            <div className={styles.messageContent}>
              {message.deleted ? (
                <div className={styles.deletedMessage}>
                  <span className={styles.deletedIcon}>🗑️</span> 
                  <span>{message.text}</span>
                </div>
              ) : editingMessage === message ? (
                <div className={styles.messageEditing}>
                  <input
                    type="text"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className={styles.messageInput}
                    autoFocus
                  />
                  <div className={styles.messageEditingActions}>
                    <button className={styles.cancelEdit} onClick={() => setEditingMessage(null)}>
                      Cancel
                    </button>
                    <button className={styles.saveEdit} onClick={handleSaveEdit}>
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {message.img && <img  src={message.img} alt="Attachment" className={styles.messageImage} />}
                  {message.audio && <audio controls src={message.audio} className={styles.messageAudio} />}
                  {message.text && (
                    <div className={styles.messageText}>
                      {message.text}
                      {message.edited && <span className={styles.editedBadge}> (edited)</span>}
                    </div>
                  )}
                  <span className={styles.messageTime}>{format(message.createdAt.toDate())}</span>
                </>
              )}
            </div>
            
            {message.senderId === currentUser?.id && !message.deleted && !editingMessage && (
              <div className={styles.messageActions}>
                <button className={`${styles.messageActionButton} ${styles.edit}`} onClick={() => handleEditMessage(message)}>
                  ✏️
                </button>
                <button className={`${styles.messageActionButton} ${styles.delete}`} onClick={() => handleDeleteMessage(message)}>
                  🗑️
                </button>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef}></div>
      </div>

      <div className={styles.inputContainer}>
        <div className={styles.inputIcons}>
          <label htmlFor="file">
            {/* <button className={styles.inputButton}> */}
            <FaPaperclip color="black" />
            {/* </button> */}
          </label>
          <input type="file" id="file" style={{ display: "none" }} onChange={handleImg} />
          <button 
            className={styles.inputButton} 
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? <FaStop color="black" /> : <FaMicrophone  color="black"/>}
          </button>
          {audioURL && (
            <button className={styles.inputButton} onClick={deleteRecording}>
              <FaTrash />
            </button>
          )}
          <button className={styles.inputButton} onClick={() => setOpen(!open)}>
          <FaSmile color="black" />
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
          className={styles.messageInput}
        />
        
        <button 
          className={styles.sendButton} 
          onClick={handleSend} 
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >
          <FaPaperPlane />
        </button>
      </div>
      
      {open && (
        <div className={styles.emojiPicker}>
          <EmojiPicker onEmojiClick={(emoji) => setText(text + emoji.emoji)} />
        </div>
      )}
    </div>
  );
};

export default Chat;