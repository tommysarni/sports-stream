import { NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
  }
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const bucketName = process.env.AWS_BUCKET_NAME!;
  const fileKey = searchParams.get('fileKey');

  if (!fileKey) {
    return new NextResponse(JSON.stringify({ error: 'Missing fileKey parameter' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*'
      }
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

    // Update segment paths to point to S3
    const s3BaseUrl = `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/hls/`;
    const updatedPlaylist = originalPlaylist.replace(
      /^(?!http)(.+\.ts)$/gm,
      `${s3BaseUrl}$1`
    );

    return new NextResponse(updatedPlaylist, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-store',  // Prevent caching
        Pragma: 'no-cache',         // Disable caching for older browsers
        Expires: '0'               // Expire immediately
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
