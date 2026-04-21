export async function extractTextFromImage(
  base64Image: string,
  googleApiKey: string,
): Promise<string> {
  const body = {
    requests: [
      {
        image: { content: base64Image },
        features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
      },
    ],
  };

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${googleApiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  if (!response.ok) throw new Error(`Vision API error: ${response.status}`);
  const data = await response.json();
  return data.responses?.[0]?.fullTextAnnotation?.text?.trim() ?? '';
}
