import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const lat = searchParams.get('lat');
  const lon = searchParams.get('lon');

  if (!lat || !lon) {
    return NextResponse.json({ error: 'Latitude and longitude are required' }, { status: 400 });
  }

  const userAgent = 'VerisiteApp/1.0 (contact: support@verisite.com)';

  try {
    // Attempt 1: Photon API
    try {
      const photonRes = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`, {
        headers: {
          'User-Agent': userAgent,
          'Accept': 'application/json'
        },
        // Ensure we don't cache this indefinitely if we are moving around
        cache: 'no-store',
        signal: AbortSignal.timeout(5000) // 5 second timeout
      });

      if (photonRes.ok) {
        const data = await photonRes.json();
        if (data && data.features && data.features.length > 0) {
          const props = data.features[0].properties;
          
          let cleanedCity = props.city || props.district || '';
          let locality = props.locality || props.suburb || props.neighbourhood || '';

          return NextResponse.json({
            street: props.street || '',
            locality: locality,
            city: cleanedCity,
            state: props.state || '',
          });
        }
      }
    } catch (photonError) {
      console.warn('Photon API failed, falling back to Nominatim:', photonError);
    }

    // Attempt 2: Nominatim API (Fallback)
    const nominatimRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}&zoom=14`, {
      headers: {
        'User-Agent': userAgent,
        'Accept-Language': 'en-US,en;q=0.9'
      },
      cache: 'no-store',
      signal: AbortSignal.timeout(5000) // 5 second timeout
    });

    if (!nominatimRes.ok) {
      throw new Error(`Nominatim API responded with status: ${nominatimRes.status}`);
    }

    const nominatimData = await nominatimRes.json();

    if (nominatimData && nominatimData.address) {
      const addr = nominatimData.address;
      
      let cleanedCity = addr.city || addr.state_district || addr.town || addr.county || '';
      let locality = addr.suburb || addr.neighbourhood || addr.village || addr.residential || '';

      return NextResponse.json({
        street: addr.road || '',
        locality: locality,
        city: cleanedCity,
        state: addr.state || '',
      });
    }

    return NextResponse.json({ error: 'No address found for these coordinates' }, { status: 404 });
  } catch (error) {
    console.error('Geocoding error (both services failed):', error);
    return NextResponse.json(
      { error: 'The location service is temporarily unavailable. Please try again later or enter details manually.' }, 
      { status: 503 }
    );
  }
}
