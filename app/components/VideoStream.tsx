'use client';

import Hls from 'hls.js';
import { useEffect, useRef } from 'react';

interface VideoStreamProps {
  url: string
}


async function runVideoPlayer(videoElement: HTMLVideoElement) {
  if (!Hls.isSupported()) throw new Error('HLS is not supported.');

  const hls = new Hls();
  hls.attachMedia(videoElement);

  hls.on(Hls.Events.ERROR, (event, data) => {
    console.error('HLS.js error:', event, data);
  });

  // Use the API route as the playlist source
  hls.loadSource('http://localhost:3000/api/playlist?fileKey=hls/output.m3u8');

  hls.on(Hls.Events.MANIFEST_PARSED, () => {
    videoElement.play();
  });
}

const VideoStream: React.FC<VideoStreamProps> = ({ url }) => {

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    runVideoPlayer(video);

    return () => {
      if (video && video.src) {
        video.src = '';
      }
    };
  }, [url]);

  return (
    <div>
      <video
        ref={videoRef}
        width="600"
        controls
        preload="auto"
        // poster="path/to/your/poster-image.jpg" // Optional: Add a poster image for preview
      >
        <p>Your browser does not support the video tag.</p>
      </video>
    </div>
  );
  
};

export default VideoStream;