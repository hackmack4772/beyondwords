import auth,{ db } from "../config/firebase";
import { collection, doc, getDoc, getDocs, query, where, addDoc } from "firebase/firestore";


const getUserToken = async () => {
  const user = auth.currentUser;
  if (user) {
    return await user.getIdToken();
  }
  return null;
};

// Get all users from Firestore
export const getAllUsers = async () => {
  try {
    const usersCollection = await getDocs(collection(db, "users"));
    return usersCollection.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching users:", e);
  }
};

// Get a single user by ID
export const getUser = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    return userSnap.exists() ? userSnap.data() : null;
  } catch (e) {
    console.error("Error fetching user:", e);
  }
};

// Get chat rooms for a user
export const getChatRooms = async (userId) => {
  try {
    const chatRoomsQuery = query(
      collection(db, "chatRooms"),
      where("members", "array-contains", userId)
    );
    const chatRoomsSnapshot = await getDocs(chatRoomsQuery);
    return chatRoomsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (e) {
    console.error("Error fetching chat rooms:", e);
  }
};

// Get a specific chat room between two users
export const getChatRoomOfUsers = async (firstUserId, secondUserId) => {
  try {
    const chatRoomsQuery = query(
      collection(db, "chatRooms"),
      where("members", "array-contains-any", [firstUserId, secondUserId])
    );
    const chatRoomsSnapshot = await getDocs(chatRoomsQuery);
    return chatRoomsSnapshot.docs.length ? chatRoomsSnapshot.docs[0].data() : null;
  } catch (e) {
    console.error("Error fetching chat room:", e);
  }
};

// Create a new chat room
export const createChatRoom = async (members) => {
  try {
    const newChatRoom = await addDoc(collection(db, "chatRooms"), {
      members,
      createdAt: new Date(),
    });
    return { id: newChatRoom.id, members };
  } catch (e) {
    console.error("Error creating chat room:", e);
  }
};

// Get messages from a chat room
export const getMessagesOfChatRoom = async (chatRoomId) => {
  try {
    const messagesQuery = query(collection(db, "messages"), where("chatRoomId", "==", chatRoomId));
    const messagesSnapshot = await getDocs(messagesQuery);
    return messagesSnapshot.docs.map((doc) => doc.data());
  } catch (e) {
    console.error("Error fetching messages:", e);
  }
};

// Send a new message
export const sendMessage = async (messageBody) => {
  try {
    const newMessage = await addDoc(collection(db, "messages"), {
      ...messageBody,
      createdAt: new Date(),
    });
    return { id: newMessage.id, ...messageBody };
  } catch (e) {
    console.error("Error sending message:", e);
  }
};
