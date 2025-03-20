import React, { useEffect, useRef } from "react";

const Video = ({ stream, muted, className }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return <video ref={videoRef} autoPlay playsInline muted={muted} className={className} />;
};

export default Video;
