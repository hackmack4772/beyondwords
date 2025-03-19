import React, { useState, useEffect, useRef } from "react";
import { collection, doc, setDoc, onSnapshot, deleteDoc, updateDoc, getDoc, arrayUnion } from "firebase/firestore";
import Video from "./Video";
import { db } from "../../config/firebase";

const Call = ({ currentUser, receiverId }) => {
  const [peerConnection, setPeerConnection] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [callId, setCallId] = useState(null);
  const [isCalling, setIsCalling] = useState(false);
  const [isReceivingCall, setIsReceivingCall] = useState(false);

  useEffect(() => {
    const fetchIncomingCall = () => {
      const callQuery = collection(db, "calls");
      const unsubscribe = onSnapshot(callQuery, (snapshot) => {
        snapshot.forEach((doc) => {
          const data = doc.data();
          if (data.receiverId === currentUser.id && !data.answer) {
            console.log("Incoming call detected:", doc.id, data);
            setIsReceivingCall(true);
            setCallId(doc.id);
          }
        });
      });

      return () => {
        console.log("Unsubscribing from incoming calls");
        unsubscribe();
      };
    };

    fetchIncomingCall();
  }, [currentUser.id]);

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setLocalStream(stream);
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

  const startCall = async () => {
    setIsCalling(true);
    console.log("Starting call to:", receiverId);
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
      iceCandidates: [], // Fixed: Initialize iceCandidates as an empty array
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
      const iceCandidates = data?.iceCandidates || []; // Fixed: Default to an empty array
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
          const iceCandidates = data?.iceCandidates || []; // Fixed: Default to an empty array
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
        // Optionally handle this case, maybe end the call
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

  return (
    <div>
      {isCalling && <p>Calling...</p>}
      {isReceivingCall && (
        <div>
          <p>Incoming Call...</p>
          <button onClick={acceptCall}>Accept</button>
          <button onClick={endCall}>Reject</button>
        </div>
      )}
      {!isCalling && !isReceivingCall && (
        <button onClick={startCall} disabled={!receiverId}>
          Call
        </button>
      )}
      {(isCalling || isReceivingCall) && (
        <button onClick={endCall}>End Call</button>
      )}

      {localStream && <Video stream={localStream} muted />}
      {remoteStream && <Video stream={remoteStream} />}
    </div>
  );
};

export default Call;