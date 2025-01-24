import VideoStream from './components/VideoStream';

export default function Home() {
  return (
    <VideoStream url={'https://sports-stream-api.s3.us-east-1.amazonaws.com/hls/output.m3u8'} />
  );
}
