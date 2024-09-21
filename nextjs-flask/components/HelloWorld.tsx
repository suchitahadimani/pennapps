import {
  AbsoluteFill,

} from "remotion";
import { Audio, staticFile } from "remotion";
import { Video } from "remotion";


export const RemotionRoot: React.FC = () => {
  return (
    <AbsoluteFill>
      {/* Video component */}
      <Video src={staticFile("latest_video_fixed.mp4")} />

      {/* Audio component */}
      <Audio src={staticFile("hiphop.mp3")} />
    </AbsoluteFill>
  );

};


