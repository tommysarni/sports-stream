'use client';

import Hls from 'hls.js';
import { useEffect, useRef } from 'react';
import { reset } from '../api/playlist/route';

interface VideoStreamProps {
  url: string
}


async function runVideoPlayer(videoElement: HTMLVideoElement) {
  if (!Hls.isSupported()) throw new Error('HLS is not supported.');
  const hls = new Hls({
    startLevel: 0, 
    autoStartLoad: true, 
    startFragPrefetch: true 
  });
  hls.attachMedia(videoElement);

  hls.on(Hls.Events.MANIFEST_PARSED, function() {
    console.log('Manifest loaded');
    videoElement.play();
  });

  hls.on(Hls.Events.FRAG_LOADED, (event, data) => {
    console.log('Fragment loaded:', data.frag.relurl);

    if (videoElement.paused) {
      videoElement.play();
    }
  });
  
  hls.on(Hls.Events.ERROR, function(event, data) {
    console.error('HLS.js Error:', data);
    videoElement.pause();
  });

  let lastSegment = 0;  // Store the last segment URL or index

  async function loadNextSegment() {
    const url = true ? `http://localhost:3000/api/playlist?fileKey=hls/output.m3u8&lastSegment=${lastSegment}` : `https://sports-stream-nu.vercel.app/api/playlist?fileKey=hls/output.m3u8&lastSegment=${lastSegment}`;
    hls.loadSource(url);
    lastSegment++;
    
  }

  await loadNextSegment();

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
      <button onClick={() => reset()}>Reset</button>
    </div>
  );
  
};

export default VideoStream;