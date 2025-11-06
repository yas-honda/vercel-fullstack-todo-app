import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'PUT') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { id, text } = request.body;

    if (!id || typeof id !== 'number') {
      return response.status(400).json({ error: 'Task ID is required and must be a number.' });
    }
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return response.status(400).json({ error: 'Task text is required and cannot be empty.' });
    }
    
    const sanitizedText = text.trim();
    if (sanitizedText.length > 255) {
      return response.status(400).json({ error: 'Task text cannot exceed 255 characters.' });
    }

    const result = await sql`UPDATE tasks SET text = ${sanitizedText} WHERE id = ${id};`;

    if (result.rowCount === 0) {
      return response.status(404).json({ error: 'Task not found.' });
    }

    return response.status(200).json({ message: 'Task updated successfully' });
  } catch (error) {
    console.error('Database Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return response.status(500).json({ error: 'Failed to update task', details: errorMessage });
  }
}
