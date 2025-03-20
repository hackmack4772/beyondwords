import { useEffect, useState } from 'react';
import styles from './IncomingCall.module.css';
import { FaPhone, FaPhoneSlash, FaVideo } from 'react-icons/fa';

const IncomingCall = ({ caller, onAccept, onReject, isVideoCall = true }) => {
  const [visible, setVisible] = useState(true);
  const [ringtone] = useState(new Audio('/ringtone.mp3'));

  useEffect(() => {
    if (visible) {
      // Play ringtone when call is incoming
      ringtone.loop = true;
      ringtone.play().catch(err => console.error("Couldn't play ringtone:", err));
    }
    
    // Auto-reject call after 30 seconds if no action
    const timer = setTimeout(() => {
      if (visible) handleReject();
    }, 30000);

    return () => {
      clearTimeout(timer);
      ringtone.pause();
      ringtone.currentTime = 0;
    };
  }, [visible]);

  const handleAccept = () => {
    setVisible(false);
    onAccept && onAccept();
  };

  const handleReject = () => {
    setVisible(false);
    onReject && onReject();
  };

  if (!visible) return null;

  return (
    <div className={styles.overlay}>
      <div className={styles.incomingCall}>
        <div className={styles.callInfo}>
          <div className={styles.callType}>
            <FaVideo />
            <span>Incoming {isVideoCall ? 'Video' : 'Audio'} Call</span>
          </div>
          
          <div className={styles.callerInfo}>
            <img 
              src={caller?.avatar || './avatar.png'} 
              alt={caller?.username || 'Caller'} 
              className={styles.callerAvatar} 
            />
            <h3 className={styles.callerName}>{caller?.username || 'Unknown Caller'}</h3>
          </div>
        </div>
        
        <div className={styles.callActions}>
          <button 
            className={`${styles.callButton} ${styles.rejectButton}`} 
            onClick={handleReject}
            aria-label="Reject call"
          >
            <FaPhoneSlash />
          </button>
          
          <button 
            className={`${styles.callButton} ${styles.acceptButton}`} 
            onClick={handleAccept}
            aria-label="Accept call"
          >
            <FaPhone />
          </button>
        </div>
      </div>
    </div>
  );
};

export default IncomingCall; 