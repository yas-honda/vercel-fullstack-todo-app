
import { sql } from '@vercel/postgres';
import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse,
) {
  if (request.method !== 'GET') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { rows } = await sql`SELECT * FROM tasks ORDER BY created_at DESC;`;
    return response.status(200).json({ tasks: rows });
  } catch (error) {
    console.error('Database Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown database error';
    return response.status(500).json({ error: 'Failed to retrieve tasks', details: errorMessage });
  }
}
