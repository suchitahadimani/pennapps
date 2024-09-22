import React, { useState, useRef, useEffect } from 'react';
import VideoPlayer from './VideoPlayer';

const WebcamRecorder: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

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
      // Simulate a recording API call
      const response = await fetch('/api/record', { method: 'GET' });
      const data = await response.json();
      console.log(data);

      // After recording is complete, show the video player
      setShowPlayer(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      textAlign: 'center'
    }}>
      {!showPlayer ? (
        <>
          <h1>Click on "Start Recording" to record your dance moves!</h1>
          <video ref={videoRef} autoPlay muted style={{ width: '100%', maxWidth: '640px', border: '1px solid black' }} />
          <button 
            onClick={startRecording} 
            disabled={isRecording} 
            style={{ 
              marginTop: '10px', 
              backgroundColor: 'black', 
              color: 'white', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              fontSize: '16px' 
            }}
          >
            {isRecording ? 'Recording...' : 'Start Recording'}
          </button>
        </>
      ) : (
        <main className="flex min-h-screen flex-col items-center justify-between p-24">
          <VideoPlayer 
            audioSrc="/hiphop.mp3"
          />
        </main>
      )}
    </div>
  );
};




export default WebcamRecorder;
