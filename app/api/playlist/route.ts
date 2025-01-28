import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

async function getNextSegment(lastSegment: number, lines: string[], ip: string): Promise<string[]> {
  const results = [];
  let segmentCount = 0;
  let lineCount = 0;

  for (let line of lines) {

    if (lineCount < 4) {

      if (line.startsWith('#EXT-X-MEDIA-SEQUENCE')) {
        line = `#EXT-X-MEDIA-SEQUENCE:${lastSegment}`;
        line = line + '\n#EXT-X-PLAYLIST-TYPE:EVENT';
      }

      results.push(line);
      lineCount++;
    } else {
      if (segmentCount === lastSegment) {
        if (line.startsWith('#EXTINF')) {
          const delayStr = line.replace('#EXTINF:', '');
          const delayNum = Number(delayStr.slice(0, delayStr.length - 2)) || 0;
          const delayOffest = Math.max(0, delayNum - 1);
          idDict.set(ip, { segment: lastSegment, delay: delayOffest });
        }

        results.push(line);

        if (line.endsWith('.ts')) {

          results.push(`#EXT-X-PREFETCH:https://sports-stream-api.s3.us-east-1.amazonaws.com/hls/segment_${(segmentCount + 1).toString().padStart(3, '0')}.ts`);
        }
      }

      if (line.endsWith('.ts')) {
        segmentCount++;
      }
    }

    if (segmentCount > lastSegment) break;
  }

  return results;
}

let lastSegment = 0;
let timer: number = 0;
const idDict: Map<string, { segment: number, delay: number }> = new Map();

export const reset = () => {
  lastSegment = 0;
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const fileKey = searchParams.get('fileKey');
  const ip = request.headers.get('x-forwarded-for') || '';
  // const lastSegment = Number(searchParams.get('lastSegment'));

  if (!fileKey || isNaN(lastSegment)) {
    return new NextResponse(JSON.stringify({ error: 'Missing parameters' }), {
      status: 400
    });
  }

  try {
    const getObjectCommand = new GetObjectCommand({
      Bucket: bucketName,
      Key: fileKey
    });

    const { Body } = await s3Client.send(getObjectCommand);

    if (!Body) {
      return new NextResponse(JSON.stringify({ error: 'File not found in S3' }), {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*'
        }
      });
    }

    const originalPlaylist = await new Response(Body as ReadableStream).text();
    const s3BaseUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/hls/`;
    const updatedPlaylist = originalPlaylist.replace(
      /^(?!http)(.+\.ts)$/gm,
      `${s3BaseUrl}$1`
    );

    let lines = updatedPlaylist.split('\n');
    let prev = idDict.get(ip) || { delay: 0, segment: 0 };
    lastSegment =  Number(prev.segment) || 0;
    lines = await getNextSegment(lastSegment, lines, ip);
    prev = idDict.get(ip)|| { delay: 0, segment: 0 };
    idDict.set(ip, { ...prev, segment: lastSegment + 1 }); 
    prev = idDict.get(ip) || { delay: 0, segment: 0 };



    if (lastSegment === 127) {
      lines.push('#EXT-X-ENDLIST');
      idDict.delete(ip);
    }

    const manifest = lines.join('\n');

    if (timer) {

      await new Promise(resolve => setTimeout(resolve, timer * 1000));
    }

    if (prev.delay) {
      timer = prev.delay;
    } 

    return new NextResponse(manifest, {
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  } catch (error) {
    console.error('Error fetching file from S3:', error);

    return new NextResponse(JSON.stringify({ error: 'Failed to fetch file' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
    });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    }
  });
}
