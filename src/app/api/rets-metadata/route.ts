import { NextRequest, NextResponse } from 'next/server';
import { retsGetMetadata } from '@/lib/rets-client';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get('type') || 'METADATA-CLASS';
  const id = searchParams.get('id') || 'Property';

  try {
    const metadata = await retsGetMetadata(type, id);
    return new NextResponse(metadata, {
      headers: { 'Content-Type': 'text/xml; charset=utf-8' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
