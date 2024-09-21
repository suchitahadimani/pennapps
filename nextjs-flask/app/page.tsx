// app/page.tsx\
"use client"
import VideoPlayer from '@/components/VideoPlayer';
import WebcamRecorder from '../components/WebcamRecorder';


export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <VideoPlayer 
        videoSrc="/latest_video.mp4"
        audioSrc="/hiphop.mp3"
        
      />
    </main>
  );
}