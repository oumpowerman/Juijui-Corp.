import { LINE_MESSAGING_API } from '../config.ts';

/**
 * Sends LINE push messages to single or multiple comma-separated destinations.
 */
export async function sendLineMessages(
  targetDestination: string,
  lineMessagePayload: any,
  lineAccessToken: string
): Promise<void> {
  const destinations = targetDestination.split(',').map((d: string) => d.trim()).filter(Boolean);
  if (destinations.length === 0) {
    throw new Error("No valid LINE destinations after splitting.");
  }

  const sendPromises = destinations.map(async (destination) => {
    const payload = {
      ...lineMessagePayload,
      to: destination
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout to prevent hanging

    try {
      const res = await fetch(LINE_MESSAGING_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${lineAccessToken}`
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`LINE API Error for ${destination} (${res.status}): ${errorText}`);
      }
    } catch (fetchErr: any) {
      clearTimeout(timeoutId);
      if (fetchErr.name === 'AbortError') {
        throw new Error(`LINE API request timed out after 15s for ${destination}`);
      }
      throw fetchErr;
    }
  });

  await Promise.all(sendPromises);
}
