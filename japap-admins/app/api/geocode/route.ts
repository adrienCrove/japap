import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get('address');

  if (!address) {
    return NextResponse.json({ error: 'L\'adresse est requise' }, { status: 400 });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    console.error('La clé API Google Maps est manquante.');
    return NextResponse.json({ error: 'Erreur de configuration du serveur' }, { status: 500 });
  }

  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
    address
  )}&key=${apiKey}&language=fr&region=CM`; // Priorise les résultats pour le Cameroun

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('Erreur de geocoding:', data.error_message);
      return NextResponse.json(
        { error: 'Erreur lors de la récupération des coordonnées', details: data.status },
        { status: 500 }
      );
    }

    if (data.results.length === 0) {
      return NextResponse.json({ error: 'Aucun résultat trouvé' }, { status: 404 });
    }

    const { lat, lng } = data.results[0].geometry.location;
    const formatted_address = data.results[0].formatted_address;

    return NextResponse.json({ lat, lng, formatted_address });
  } catch (error) {
    console.error('Erreur lors de la récupération des coordonnées:', error);
    return NextResponse.json({ error: 'Erreur interne du serveur' }, { status: 500 });
  }
}
