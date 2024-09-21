import React, { useEffect, useRef } from 'react';

interface VideoPlayerProps {
  videoSrc: string;
  audioSrc: string;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ videoSrc, audioSrc }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
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
          // Reset video and prepare for next play
          video.currentTime = 0; // Reset video to the beginning
          // Optionally, you can stop the audio here if you want
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
