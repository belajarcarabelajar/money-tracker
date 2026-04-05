import { query } from '../db/index.js';

const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const MODEL = process.env.OLLAMA_MODEL || 'gemma4:31b-cloud';
const EMBEDDING_MODEL = process.env.OLLAMA_EMBEDDING_MODEL || 'nomic-embed-text';

export async function chatWithOllama(prompt, imageBase64 = null) {
  try {
    const parts = [{ text: prompt }];

    if (imageBase64) {
      const base64Data = imageBase64.includes(',')
        ? imageBase64.split(',')[1]
        : imageBase64;
      const mimeType = imageBase64.includes(';')
        ? imageBase64.split(';')[0].split(':')[1]
        : 'image/jpeg';

      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    const response = await fetch(`${OLLAMA_HOST}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt, images: imageBase64 ? [base64Data] : undefined }],
        stream: false
      })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Ollama error: ${err}`);
    }

    const data = await response.json();
    return data.message?.content || 'No response from AI';
  } catch (error) {
    console.error('Ollama chat error:', error);
    throw error;
  }
}

export async function getEmbedding(text) {
  try {
    const response = await fetch(`${OLLAMA_HOST}/api/embed`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: text
      })
    });

    if (!response.ok) {
      throw new Error(`Embedding error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.embeddings[0];
  } catch (error) {
    console.error('Embedding error:', error);
    throw error;
  }
}

export async function findSimilarTransactions(userId, queryEmbedding, limit = 10) {
  try {
    const result = await query(
      `SELECT id, description, category, type, amount, date,
              1 - (embedding <=> $2::vector) as similarity
       FROM transaction_embeddings
       WHERE user_id = $1
       ORDER BY embedding <=> $2::vector
       LIMIT $3`,
      [userId, queryEmbedding, limit]
    );
    return result.rows;
  } catch (error) {
    console.error('Similarity search error:', error);
    return [];
  }
}

export async function analyzeImage(imageBase64) {
  const prompt = `
    Analyze this receipt/image and extract transaction information.
    If this is a receipt, extract:
    - Total amount (in the local currency)
    - Description (merchant name or items purchased)
    - Date (if visible)

    Return ONLY a JSON object with this exact format:
    {"amount": number, "description": "string", "date": "YYYY-MM-DD", "category": "string"}

    If this is NOT a receipt, return:
    {"error": "Not a receipt", "description": "what you see"}
  `;

  try {
    const response = await chatWithOllama(prompt, imageBase64);

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: 'Could not parse receipt', raw: response };
  } catch (error) {
    console.error('Image analysis error:', error);
    throw error;
  }
}

export default { chatWithOllama, getEmbedding, findSimilarTransactions, analyzeImage };
