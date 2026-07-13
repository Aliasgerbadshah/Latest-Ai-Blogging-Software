export class BloggerService {
  private baseUrl = 'https://www.googleapis.com/blogger/v3';
  private config: { blogId: string, clientId: string, clientSecret: string, refreshToken: string };

  constructor(config: { blogId: string, clientId: string, clientSecret: string, refreshToken: string }) {
    this.config = config;
  }

  async refreshAccessToken(): Promise<string> {
    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: this.config.refreshToken,
      grant_type: 'refresh_token',
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });

    if (!response.ok) {
      throw new Error('Failed to refresh Google Access Token');
    }

    const data = await response.json();
    return data.access_token;
  }

  async publishAutomatedPost(postData: { title: string, content: string }) {
    const accessToken = await this.refreshAccessToken();
    const url = `${this.baseUrl}/blogs/${this.config.blogId}/posts/`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        kind: 'blogger#post',
        blog: { id: this.config.blogId },
        title: postData.title,
        content: postData.content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Failed to publish to Blogger');
    }

    return await response.json();
  }
}
