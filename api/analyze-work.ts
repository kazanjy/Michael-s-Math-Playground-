import type { VercelRequest, VercelResponse } from '@vercel/node';

interface AnalyzeWorkRequest {
  questionText: string;
  correctAnswer: string;
  userAnswer: string;
  genre: string;
  gradeLevel: string;
  scratchpadImage: string; // base64 data URL
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const {
      questionText,
      correctAnswer,
      userAnswer,
      genre,
      gradeLevel,
      scratchpadImage,
    } = req.body as AnalyzeWorkRequest;

    if (!scratchpadImage || !questionText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const gradeDesc = gradeLevel === 'K' ? 'Kindergarten' : `${gradeLevel}th grade`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a kind, encouraging math tutor analyzing a ${gradeDesc} student's scratch work on a math word problem. The student got the answer WRONG. Your job is to look at their handwritten work in the image and figure out exactly where they went off track.

Be specific about what you see in their work. Point out:
1. What they did right (always start positive)
2. The specific step or calculation where the mistake happened
3. A gentle explanation of what they should have done differently

Keep your tone warm and encouraging — this is a kid. Use simple language appropriate for their grade level. Be concise (3-5 sentences max).

If the scratchpad is blank or you can't read the work, say so and just explain the correct approach instead.

Respond with valid JSON only: {"whatYouDidWell": "...", "whereYouWentWrong": "...", "howToFixIt": "..."}`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Question: ${questionText}\nCorrect answer: ${correctAnswer}\nStudent's answer: ${userAnswer}\nMath concept: ${genre}`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: scratchpadImage,
                  detail: 'low',
                },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 400,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to analyze work' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No content in response' });
    }

    let parsed;
    try {
      const clean = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(clean);
    } catch {
      console.error('Failed to parse analysis response:', content);
      return res.status(500).json({ error: 'Failed to parse analysis' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error analyzing work:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
