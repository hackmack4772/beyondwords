import React, { useState } from 'react';
import { format } from 'timeago.js';
import { FaEdit, FaTrash } from 'react-icons/fa';
import styles from './Chat.module.css';

const Message = ({ message, isOwn, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(message.text);

  const handleSaveEdit = () => {
    onEdit(editText);
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit();
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditText(message.text);
    }
  };

  return (
    <div className={`${styles.message} ${isOwn ? styles.owner : ''}`}>
      <div className={styles.messageInfo}>
        <img 
          src={message.senderAvatar || "/default-avatar.png"} 
          alt="avatar" 
          className={styles.messageAvatar}
        />
      </div>
      
      <div className={styles.messageContent}>
        {message.deleted ? (
          <div className={styles.deletedMessage}>
            <span>This message has been deleted</span>
          </div>
        ) : isEditing ? (
          <div className={styles.messageEditing}>
            <textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
            <div className={styles.messageActions}>
              <button onClick={() => setIsEditing(false)}>Cancel</button>
              <button onClick={handleSaveEdit}>Save</button>
            </div>
          </div>
        ) : (
          <>
            {message.img && (
              <img src={message.img} alt="attachment" className={styles.messageImage} />
            )}
            {message.audio && (
              <audio controls src={message.audio} className={styles.messageAudio} />
            )}
            {message.text && (
              <div className={styles.messageText}>
                {message.text}
                {message.edited && <span className={styles.editedBadge}> (edited)</span>}
              </div>
            )}
            <span className={styles.messageTime}>
              {format(message.createdAt)}
            </span>
          </>
        )}
      </div>

      {isOwn && !message.deleted && !isEditing && (
        <div className={styles.messageActions}>
          <button 
            className={styles.messageActionButton} 
            onClick={() => setIsEditing(true)}
            title="Edit message"
          >
            <FaEdit />
          </button>
          <button 
            className={styles.messageActionButton} 
            onClick={() => onDelete(message)}
            title="Delete message"
          >
            <FaTrash />
          </button>
        </div>
      )}
    </div>
  );
};

export default Message; 