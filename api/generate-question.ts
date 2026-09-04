import type { VercelRequest, VercelResponse } from '@vercel/node';

// Types for request/response
interface GenerateQuestionRequest {
  theme: string;
  customTheme?: string;
  gradeLevel: string;
  previousQuestion?: string;
  recentQuestions?: string[];
  isRetry?: boolean;
  retryGenre?: string;
}

interface GeneratedQuestion {
  question: string;
  answer: string;
  explanation: string;
  genre: string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'OpenAI API key not configured' });
  }

  try {
    const {
      theme,
      customTheme,
      gradeLevel,
      previousQuestion,
      recentQuestions,
      isRetry,
      retryGenre,
    } = req.body as GenerateQuestionRequest;

    // Build the prompt
    const themeDescription = theme === 'custom' && customTheme
      ? customTheme
      : getThemeDescription(theme);

    const prompt = buildPrompt({
      themeDescription,
      gradeLevel,
      previousQuestion,
      recentQuestions,
      isRetry,
      retryGenre,
    });

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a math teacher creating word problems for students. Always respond with valid JSON only, no markdown formatting or code blocks. The response must be a JSON object with exactly these fields: "question" (the word problem), "answer" (the numeric answer as a string - can be a whole number, decimal, or fraction like "3/4"), "explanation" (step-by-step solution), and "genre" (the math concept being tested, e.g., "addition", "multiplication", "fractions", "percentages", "algebra").`,
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('OpenAI API error:', errorData);
      return res.status(response.status).json({ error: 'Failed to generate question' });
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;

    if (!content) {
      return res.status(500).json({ error: 'No content in response' });
    }

    // Parse the JSON response
    let parsed: GeneratedQuestion;
    try {
      // Remove any markdown code block formatting if present
      const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);
      return res.status(500).json({ error: 'Failed to parse question response' });
    }

    // Validate required fields
    if (!parsed.question || !parsed.answer || !parsed.explanation || !parsed.genre) {
      return res.status(500).json({ error: 'Invalid question format from AI' });
    }

    return res.status(200).json(parsed);
  } catch (error) {
    console.error('Error generating question:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

function getThemeDescription(theme: string): string {
  const themes: Record<string, string> = {
    football: 'American football - use players, touchdowns, yards, field goals, teams, stadiums, etc.',
    baseball: 'Baseball - use players, home runs, innings, bases, batting averages, teams, etc.',
    princesses: 'Fairy tale princesses - use castles, royal balls, jewels, magical creatures, kingdoms, etc.',
    pokemon: 'Pokemon - use Pokemon creatures, trainers, battles, pokeballs, gym badges, etc.',
    minecraft: 'Minecraft - use blocks, mining, crafting, mobs, diamonds, building, etc.',
    fighter_jets: 'Fighter jets and aviation - use pilots, jets (F-22, F-35, etc.), missions, altitude, speed (Mach), fuel, dogfights, aircraft carriers, squadrons, etc.',
    standard: 'Standard educational context - use everyday objects, people, and situations.',
  };
  return themes[theme] || themes.standard;
}

interface BuildPromptParams {
  themeDescription: string;
  gradeLevel: string;
  previousQuestion?: string;
  recentQuestions?: string[];
  isRetry?: boolean;
  retryGenre?: string;
}

function buildPrompt(params: BuildPromptParams): string {
  const { themeDescription, gradeLevel, previousQuestion, recentQuestions, isRetry, retryGenre } = params;

  const gradeGuidance = getGradeGuidance(gradeLevel);

  let prompt = `Create a math word problem for a ${gradeLevel === 'K' ? 'Kindergarten' : `${gradeLevel}th grade`} student.

Theme: ${themeDescription}

Grade Level Guidelines:
${gradeGuidance}

`;

  if (recentQuestions && recentQuestions.length > 0) {
    prompt += `
IMPORTANT - DO NOT REUSE NUMBERS OR SCENARIOS. Here are the recent questions from this session:
${recentQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')}

You MUST use completely different numbers, quantities, and scenarios than all of the above questions. Vary the numbers significantly - do not just change them by 1 or 2.
`;
  }

  if (isRetry && retryGenre) {
    prompt += `
The student struggled with this concept: "${retryGenre}"
Create a similar problem testing the SAME mathematical skill, but with ENTIRELY DIFFERENT numbers and a different scenario than any previous question.
`;
  } else if (previousQuestion) {
    prompt += `
The previous question was: "${previousQuestion}"
Create a DIFFERENT type of math problem - use a different operation or concept, AND completely different numbers.
`;
  }

  prompt += `
Respond with a JSON object containing:
- "question": The word problem text (make it engaging and themed, with fresh numbers not used in recent questions)
- "answer": The numeric answer (as a string - can be whole number, decimal like "3.5", or fraction like "3/4")
- "explanation": Step-by-step solution explanation (clear and educational)
- "genre": The math concept (e.g., "addition", "subtraction", "multiplication", "division", "fractions", "decimals", "percentages", "algebra", "geometry")
`;

  return prompt;
}

function getGradeGuidance(grade: string): string {
  const guidance: Record<string, string> = {
    'K': 'Simple counting, adding/subtracting within 10. Use single-digit numbers only. Very simple word problems.',
    '1': 'Addition and subtraction within 20. Simple word problems with single and small double-digit numbers.',
    '2': 'Addition and subtraction within 100. Introduction to place value. Simple multiplication concepts.',
    '3': 'Multiplication and division within 100. Introduction to fractions. Multi-step word problems.',
    '4': 'Multi-digit multiplication and division. Fractions with same denominators. Decimals introduction.',
    '5': 'Fraction operations. Decimal operations. Order of operations. Volume and area.',
    '6': 'Ratios and proportions. Negative numbers. Algebraic expressions. Statistical concepts.',
    '7': 'Proportional relationships. Linear equations. Geometry with angles. Probability.',
    '8': 'Linear functions. Systems of equations. Pythagorean theorem. Scientific notation.',
    '9': 'Advanced algebra. Quadratic equations. Functions. Geometry proofs.',
    '10': 'Geometry. Trigonometry introduction. Advanced functions.',
    '11': 'Advanced algebra 2. Trigonometry. Sequences and series.',
    '12': 'Pre-calculus. Limits. Advanced trigonometry. Mathematical modeling.',
  };
  return guidance[grade] || guidance['5'];
}
