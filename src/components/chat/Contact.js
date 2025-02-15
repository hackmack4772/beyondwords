import { useState, useEffect } from "react";
import { getUser } from "../../services/ChatService";
import UserLayout from "../layouts/UserLayout";

export default function Contact({ chatRoom, onlineUsersId, currentUser }) {
  const [contact, setContact] = useState();

  useEffect(() => {
    if (!chatRoom || !Array.isArray(chatRoom.members)) {
      console.warn("Skipping because chatRoom or members is invalid:", chatRoom);
      return; // Avoid executing the rest of the effect
    }

    const contactId = chatRoom.members.find(
      (member) => member !== currentUser.uid
    );

    if (!contactId) {
      console.warn("No valid contactId found in chatRoom:", chatRoom);
      return;
    }

    const fetchData = async () => {
      try {
        const res = await getUser(contactId);
        setContact(res);
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchData();
  }, [chatRoom, currentUser]);

  return <UserLayout user={contact} onlineUsersId={onlineUsersId} />;
}
