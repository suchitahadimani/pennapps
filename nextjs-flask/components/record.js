import { useState, useRef, useEffect } from 'react';

export default function RecordPage() {
  const videoRef = useRef(null);
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
      const response = await fetch('/api/start-recording');
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
}


const startRecording = async () => {
    setIsRecording(true);
    const stream = videoRef.current.srcObject;
    const mediaRecorder = new MediaRecorder(stream);
    const chunks = [];
  
    mediaRecorder.ondataavailable = (e) => chunks.push(e.data);
    mediaRecorder.onstop = async () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const formData = new FormData();
      formData.append('video', blob, 'recording.webm');
  
      try {
        const response = await fetch('/api/record', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        console.log(data);
      } catch (error) {
        console.error("Error sending video:", error);
      }
      setIsRecording(false);
    };
  
    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), 5000); // Stop after 5 seconds
  };