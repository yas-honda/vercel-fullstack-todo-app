
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { text } = request.body;

    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return response.status(400).json({ error: 'Task text is required and cannot be empty.' });
    }
    
    // Basic sanitation
    const sanitizedText = text.trim();
    if (sanitizedText.length > 255) {
      return response.status(400).json({ error: 'Task text cannot exceed 255 characters.' });
    }

    await sql`INSERT INTO tasks (text) VALUES (${sanitizedText});`;
    return response.status(201).json({ message: 'Task added successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return response.status(500).json({ error: 'Failed to add task', details: errorMessage });
  }
}
