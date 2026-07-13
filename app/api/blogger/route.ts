import { NextResponse } from 'next/server';
import { AutomationController } from '@/lib/automation';

export async function POST(request: Request) {
  try {
    const { blogId, clientId, clientSecret, refreshToken, title, content, apiKey } = await request.json();

    if (!blogId || !clientId || !clientSecret || !refreshToken || !title || !content) {
      return NextResponse.json({ error: 'Missing required Blogger credentials or post data' }, { status: 400 });
    }

    if (!apiKey) {
      return NextResponse.json({ error: 'OpenAI API Key is required' }, { status: 400 });
    }

    // Use the Automation Controller to handle the token refresh and publishing
    const controller = new AutomationController(apiKey, {
      blogId,
      clientId,
      clientSecret,
      refreshToken
    });

    // We use a dummy keyword because the content is already provided
    const result = await controller.runFullAutomation(title);

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('Blogger Publish Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
