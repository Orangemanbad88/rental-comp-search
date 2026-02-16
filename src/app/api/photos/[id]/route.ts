import { NextRequest, NextResponse } from 'next/server';
import { retsGetObject } from '@/lib/rets-client';

const PLACEHOLDER_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
  <rect width="400" height="300" fill="#e2e8f0"/>
  <g transform="translate(160,110)" fill="#94a3b8">
    <path d="M10 20v-6a2 2 0 0 1 2-2h56a2 2 0 0 1 2 2v40a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2v-6"/>
    <path d="M40 10 L20 35 L30 30 L45 45 L55 30 L60 35 L60 10Z" opacity="0.5"/>
    <circle cx="28" cy="20" r="4" opacity="0.5"/>
  </g>
  <text x="200" y="190" text-anchor="middle" fill="#64748b" font-family="sans-serif" font-size="14">No Photo Available</text>
</svg>`;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const idx = parseInt(request.nextUrl.searchParams.get('idx') || '0', 10);

  const result = await retsGetObject(id, idx);

  if (!result) {
    return new NextResponse(PLACEHOLDER_SVG, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  }

  return new NextResponse(result.data, {
    status: 200,
    headers: {
      'Content-Type': result.contentType,
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
