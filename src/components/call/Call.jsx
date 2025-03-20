import React, { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import Video from "./Video";
import IncomingCall from "./IncomingCall";
import { db } from "../../config/firebase";
import styles from "./Call.module.css";
import { FaPhone, FaPhoneSlash, FaVideo, FaMicrophone, FaMicrophoneSlash, FaVideoSlash } from "react-icons/fa";
import NotificationManager from "../../utils/NotificationManager";

const Call = ({ currentUser, receiverId }) => {
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callId, setCallId] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);
  const [caller, setCaller] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const durationTimerRef = useRef(null);
  const receiverInfoRef = useRef(null);

  useEffect(() => {
    // Fetch receiver info once when component mounts
    const fetchReceiverInfo = async () => {
      if (receiverId) {
        try {
          const receiverDoc = await getDoc(doc(db, "users", receiverId));
          if (receiverDoc.exists()) {
            receiverInfoRef.current = receiverDoc.data();
          }
        } catch (error) {
          console.error("Error fetching receiver info:", error);
        }
      }
    };
    
    fetchReceiverInfo();
  }, [receiverId]);

  useEffect(() => {
    const fetchIncomingCall = () => {
      const callQuery = collection(db, "calls");
      const unsubscribe = onSnapshot(callQuery, async (snapshot) => {
        for (const docChange of snapshot.docChanges()) {
          if (docChange.type === "added") {
            const data = docChange.doc.data();
            if (data.receiverId === currentUser.id && !data.answer) {
              console.log("Incoming call detected:", docChange.doc.id, data);
              
              // Fetch caller information
              try {
                const callerDoc = await getDoc(doc(db, "users", data.callerId));
                if (callerDoc.exists()) {
                  const callerData = callerDoc.data();
                  setCaller(callerData);
                  
                  // Show notification for incoming call
                  if (!document.hasFocus()) {
                    NotificationManager.showCallNotification(
                      callerData,
                      docChange.doc.id,
                      data.isVideo !== false
                    );
                  }
                }
              } catch (error) {
                console.error("Error fetching caller info:", error);
              }
              
              setIsReceivingCall(true);
              setCallId(docChange.doc.id);
              setIsVideoCall(data.isVideo !== false); // Default to video call if not specified
            }
          }
        }
      });

      return () => {
        console.log("Unsubscribing from incoming calls");
        unsubscribe();
      };
    };

    fetchIncomingCall();
  }, [currentUser.id]);

  useEffect(() => {
    // Start call duration timer when call is connected
    if (remoteStream && localStream) {
      durationTimerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
    };
  }, [remoteStream, localStream]);

  const formatCallDuration = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoCall, 
        audio: true 
      });
      setLocalStream(stream);
      setIsVideoEnabled(isVideoCall);
      return stream;
    } catch (error) {
      console.error("Error accessing media devices:", error);
      return null;
    }
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });

    pc.onicecandidate = async (event) => {
      if (event.candidate && callId) {
        try {
          const callRef = doc(db, "calls", callId);
          await updateDoc(callRef, {
            iceCandidates: arrayUnion(event.candidate.toJSON()),
          });
          console.log("Local ICE candidate sent:", event.candidate);
        } catch (error) {
          console.error("Error sending ICE candidate:", error);
        }
      }
    };

    pc.ontrack = (event) => {
      console.log("Track received:", event.track);
      setRemoteStream((prev) => {
        if (!prev) {
          const newStream = new MediaStream();
          newStream.addTrack(event.track);
          return newStream;
        }
        const existingTrack = prev.getTracks().find(t => t.kind === event.track.kind);
        if (!existingTrack) {
          prev.addTrack(event.track);
        }
        return prev;
      });
    };

    return pc;
  };

  const startCall = async (videoEnabled = true) => {
    setIsCalling(true);
    setIsVideoCall(videoEnabled);
    setCallDuration(0);
    console.log(`Starting ${videoEnabled ? 'video' : 'audio'} call to:`, receiverId);
    
    const stream = await getUserMedia();
    if (!stream) return;

    const callDoc = doc(collection(db, "calls"));
    setCallId(callDoc.id);
    console.log("Created call document with ID:", callDoc.id);

    const pc = createPeerConnection();
    setPeerConnection(pc);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    console.log("Offer created:", offer);

    await setDoc(callDoc, {
      offer: { type: offer.type, sdp: offer.sdp },
      callerId: currentUser.id,
      receiverId,
      isVideo: videoEnabled,
      timestamp: new Date(),
      iceCandidates: [],
    });

    onSnapshot(callDoc, async (snapshot) => {
      const data = snapshot.data();
      if (data?.answer && pc.signalingState !== "stable") {
        console.log("Answer received:", data.answer);
        try {
          await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        } catch (error) {
          console.error("Error setting remote description (answer):", error);
        }
      }
      const iceCandidates = data?.iceCandidates || [];
      for (const candidate of iceCandidates) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate));
          console.log("Remote ICE candidate added (caller):", candidate);
        } catch (error) {
          console.error("Error adding ICE candidate (caller):", error);
        }
      }
    });
  };

  const acceptCall = async () => {
    setIsReceivingCall(false);
    setCallDuration(0);
    console.log("Accepting call with ID:", callId);
    const stream = await getUserMedia();
    if (!stream) return;

    const pc = createPeerConnection();
    setPeerConnection(pc);

    stream.getTracks().forEach((track) => pc.addTrack(track, stream));

    const callDoc = doc(db, "calls", callId);
    try {
      const callData = (await getDoc(callDoc)).data();
      if (callData?.offer) {
        console.log("Offer received:", callData.offer);
        await pc.setRemoteDescription(new RTCSessionDescription(callData.offer));

        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        console.log("Answer created:", answer);

        await updateDoc(callDoc, { answer: { type: answer.type, sdp: answer.sdp } });

        onSnapshot(callDoc, (snapshot) => {
          const data = snapshot.data();
          const iceCandidates = data?.iceCandidates || [];
          for (const candidate of iceCandidates) {
            try {
              pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log("Remote ICE candidate added (receiver):", candidate);
            } catch (error) {
              console.error("Error adding ICE candidate (receiver):", error);
            }
          }
        });
      } else {
        console.error("Offer not found in call document:", callId);
      }
    } catch (error) {
      console.error("Error fetching call data:", error);
    }
  };

  const endCall = async () => {
    console.log("Ending call with ID:", callId);
    if (peerConnection) {
      peerConnection.close();
      console.log("Peer connection closed");
    }
    localStream?.getTracks().forEach((track) => {
      track.stop();
      console.log("Local track stopped:", track.kind);
    });
    setLocalStream(null);
    setRemoteStream(null);
    setPeerConnection(null);
    setCallDuration(0);

    if (callId) {
      try {
        await deleteDoc(doc(db, "calls", callId));
        console.log("Call document deleted:", callId);
      } catch (error) {
        console.error("Error deleting call document:", error);
      }
    }
    setCallId(null);
    setIsCalling(false);
    setIsReceivingCall(false);
  };

  const rejectCall = async () => {
    console.log("Rejecting call with ID:", callId);
    if (callId) {
      try {
        await updateDoc(doc(db, "calls", callId), {
          rejected: true
        });
        console.log("Call rejected:", callId);
        setIsReceivingCall(false);
      } catch (error) {
        console.error("Error rejecting call:", error);
      }
    }
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      if (audioTracks.length > 0) {
        const enabled = !isMuted;
        audioTracks[0].enabled = enabled;
        setIsMuted(!enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const enabled = !isVideoEnabled;
        videoTracks[0].enabled = enabled;
        setIsVideoEnabled(enabled);
      }
    }
  };

  return (
    <div className={styles.callContainer}>
      {/* Incoming call overlay */}
      {isReceivingCall && (
        <IncomingCall 
          caller={caller}
          onAccept={acceptCall}
          onReject={rejectCall}
          isVideoCall={isVideoCall}
        />
      )}
      
      {/* Call buttons */}
      {!isCalling && !isReceivingCall && (
        <div className={styles.callButtons}>
          <button 
            className={`${styles.callButton} ${styles.audioCall}`} 
            onClick={() => startCall(false)} 
            disabled={!receiverId}
            title="Audio Call"
          >
            <FaPhone />
          </button>
          <button 
            className={`${styles.callButton} ${styles.videoCall}`} 
            onClick={() => startCall(true)} 
            disabled={!receiverId}
            title="Video Call"
          >
            <FaVideo />
          </button>
        </div>
      )}
      
      {/* Active call interface */}
      {(localStream || remoteStream) && (
        <div className={styles.activeCall}>
          {/* Call duration */}
          <div className={styles.callDuration}>
            {formatCallDuration(callDuration)}
          </div>
          
          <div className={styles.videoContainer}>
            {/* Remote video or fallback */}
            {remoteStream ? (
              <Video stream={remoteStream} className={styles.remoteVideo} />
            ) : (
              <div className={styles.userInfo}>
                <img 
                  src={receiverInfoRef.current?.avatar || "./avatar.png"} 
                  alt="Contact" 
                />
                <span>{receiverInfoRef.current?.username || "Calling..."}</span>
              </div>
            )}
            
            {/* Local video */}
            {localStream && isVideoCall && (
              <Video stream={localStream} className={styles.localVideo} muted />
            )}
          </div>
          
          {/* Call controls */}
          <div className={styles.callControls}>
            <button 
              className={`${styles.callButton}`} 
              onClick={toggleMute}
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <FaMicrophoneSlash /> : <FaMicrophone />}
            </button>
            
            {isVideoCall && (
              <button 
                className={`${styles.callButton}`} 
                onClick={toggleVideo}
                title={isVideoEnabled ? "Turn off camera" : "Turn on camera"}
              >
                {isVideoEnabled ? <FaVideo /> : <FaVideoSlash />}
              </button>
            )}
            
            <button 
              className={`${styles.callButton} ${styles.endCall}`} 
              onClick={endCall}
              title="End call"
            >
              <FaPhoneSlash />
            </button>
          </div>
        </div>
      )}
      
      {/* Calling status */}
      {isCalling && !remoteStream && (
        <div className={styles.callingStatus}>
          <div className={styles.userInfo}>
            <img 
              src={receiverInfoRef.current?.avatar || "./avatar.png"} 
              alt="Contact" 
            />
            <span>{receiverInfoRef.current?.username || "Calling..."}</span>
          </div>
          
          <button 
            className={`${styles.callButton} ${styles.endCall}`} 
            onClick={endCall}
          >
            <FaPhoneSlash />
          </button>
        </div>
      )}
    </div>
  );
};

export default Call;