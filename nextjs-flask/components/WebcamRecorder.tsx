// components/WebcamRecorder.tsx
import React, { useState, useRef, useEffect } from 'react';

const WebcamRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);

  useEffect(() => {
    if (typeof navigator !== 'undefined') {
      navigator.mediaDevices.getUserMedia({ video: true })
        .then(stream => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        })
        .catch(err => console.error("Error accessing webcam:", err));
    }
  }, []);

  const startRecording = async () => {
    setIsRecording(true);
    try {
      const response = await fetch('/api/record', { method: 'GET' });
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
    setIsRecording(false);
  };

  return (
    <div>
      <video ref={videoRef} autoPlay muted style={{ width: '100%', maxWidth: '640px' }} />
      <button onClick={startRecording} disabled={isRecording}>
        {isRecording ? 'Recording...' : 'Start Recording'}
      </button>
    </div>
  );
};

export default WebcamRecorder;