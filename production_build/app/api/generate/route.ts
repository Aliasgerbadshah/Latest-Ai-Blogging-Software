import { NextResponse } from 'next/server';
import { AIBlogAgency } from '@/lib/ai-engine';

export async function POST(request: Request) {
  try {
    const { keyword, apiKey } = await request.json();

    if (!keyword) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const finalApiKey = apiKey || process.env.OPENAI_API_KEY;
    if (!finalApiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is required' }, { status: 400 });
    }

    const agency = new AIBlogAgency(finalApiKey);
    const perfectPost = await agency.generatePerfectPost(keyword);

    return NextResponse.json(perfectPost);
  } catch (error: any) {
    console.error('Agency Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
