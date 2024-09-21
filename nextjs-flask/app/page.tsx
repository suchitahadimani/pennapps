// app/page.tsx\
"use client"
import WebcamRecorder from '../components/WebcamRecorder';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Click on "Start Recording" to record your dance moves!</h1>
      <WebcamRecorder />
      {/* Your existing content */}
    </main>
  );
}