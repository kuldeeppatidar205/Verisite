import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  const userAgent = 'CampusPassApp/1.0 (contact: support@campuspass.com)';

  try {
    // Search using Nominatim
    const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      throw new Error(`Nominatim API responded with status: ${res.status}`);
    }

    const data = await res.json();

    if (data && data.length > 0) {
      return NextResponse.json({
        name: data[0].display_name,
        lat: parseFloat(data[0].lat),
        lon: parseFloat(data[0].lon)
      });
    }

    return NextResponse.json({ error: 'Location not found' }, { status: 404 });
  } catch (error) {
    console.error('Search geocoding error:', error);
    return NextResponse.json(
      { error: 'The search service is temporarily unavailable. Please try again later.' }, 
      { status: 503 }
    );
  }
}
