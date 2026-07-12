import { BloggerService } from './blogger';
import { AIBlogAgency } from './ai-engine';

export class AutomationController {
  private blogger: BloggerService;
  private agency: AIBlogAgency;

  constructor(apiKey: string, bloggerConfig: { 
    blogId: string, 
    clientId: string, 
    clientSecret: string, 
    refreshToken: string 
  }) {
    this.blogger = new BloggerService(bloggerConfig);
    this.agency = new AIBlogAgency(apiKey);
  }

  async runFullAutomation(keyword: string) {
    console.log(`🚀 Starting Full Automation for: ${keyword}`);

    try {
      // 1. Generate the "Perfect" Post using the Agentic Agency
      console.log("✍️ Agents are writing the authority post...");
      const blogPost = await this.agency.generatePerfectPost(keyword);

      // 2. Publish to Blogger
      console.log("🌐 Publishing to Blogger...");
      const result = await this.blogger.publishAutomatedPost({
        title: blogPost.title,
        content: blogPost.content,
      });

      return {
        success: true,
        url: result.url,
        title: blogPost.title
      };
    } catch (error: any) {
      console.error("Automation Failed:", error);
      throw new Error(`Automation Error: ${error.message}`);
    }
  }
}
