import React, { useEffect, useRef, useState } from 'react';

interface VideoPlayerProps {
  audioSrc: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ audioSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [videoSrc, setVideoSrc] = useState<string>('');

  useEffect(() => {
    // Fetch the video URL from the backend
    fetch('/api/video')
      .then(response => {
        if (response.ok) {
          return response.blob();
        }
        throw new Error('Network response was not ok');
      })
      .then(blob => {
        const videoUrl = URL.createObjectURL(blob);
        setVideoSrc(videoUrl);
      })
      .catch(error => console.error('Error fetching video:', error));

    const video = videoRef.current;
    if (video) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioContext = audioContextRef.current;

      const loadAudio = async () => {
        const response = await fetch(audioSrc);
        if (!response.ok) throw new Error('Network response was not ok');
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

        let source: AudioBufferSourceNode | null = null;

        const playAudio = () => {
          if (source) {
            source.stop(); // Stop previous source if it exists
          }
          source = audioContext.createBufferSource();
          source.buffer = audioBuffer;
          source.connect(audioContext.destination);
          source.start(0, video.currentTime); // Start from current video time
        };

        video.onplay = playAudio;

        video.onpause = () => {
          if (source) {
            source.stop();
          }
        };

        video.onended = () => {
          video.currentTime = 0; // Reset video to the beginning
          if (source) {
            source.stop();
          }
        };
      };

      loadAudio().catch(error => console.error('Error loading audio:', error));
    }

    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [audioSrc]);

  return (
    <video ref={videoRef} src={videoSrc} controls />
  );
};

export default VideoPlayer;