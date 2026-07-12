import OpenAI from 'openai';

export interface ImageAsset {
  url: string;
  altText: string;
  caption: string;
  position: string;
}

export interface BlogPost {
  title: string;
  outline: string[];
  content: string;
  metaDescription: string;
  keywords: string[];
  images: ImageAsset[];
  externalSources: string[];
}

export class AIBlogEngine {
  private openai: OpenAI;

  constructor(apiKey: string) {
    this.openai = new OpenAI({ apiKey });
  }

  async generateBlog(keyword: string, cluster: any[] = []): Promise<BlogPost> {
    console.log(`🚀 Starting Authority-Grade generation for: ${keyword}`);

    // 1. Generate Title & Strategy
    const title = await this.generateTitle(keyword);
    
    // 2. Generate Outline + Image Map + Table Requirements
    const { outline, imageMap, tableRequirements } = await this.generateStructure(title);

    // 3. Generate Content with a "Reviewer" mindset
    const content = await this.generateAuthorityContent(title, outline, cluster, tableRequirements);

    // 4. Generate Visuals
    const images = await this.generateAllImages(imageMap, title);

    // 5. Final Assembly (Injecting Images & External Links)
    const finalContent = this.assembleFinalPost(content, images);

    // 6. SEO Finalization
    const { metaDescription, keywords } = await this.optimizeSEO(finalContent);

    return {
      title,
      outline,
      content: finalContent,
      metaDescription,
      keywords,
      images,
      externalSources: [] // In a real system, this would be a list of cited URLs
    };
  }

  private async generateTitle(keyword: string): Promise<string> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: `Create a high-authority, click-worthy SEO title for: ${keyword}. Focus on "Review," "Guide," or "Comparison" angles. Return ONLY the title.` }],
    });
    return response.choices[0].message.content?.trim() || 'Untitled';
  }

  private async generateStructure(title: string): Promise<{ outline: string[], imageMap: any[], tableRequirements: string }> {
    const prompt = `Create a high-authority blog structure for "${title}". 
    1. Detailed outline (H2s and H3s).
    2. Image map: Which sections need a visual and what is the prompt?
    3. Table Requirement: Identify a point where a comparison table (Pros/Cons or Feature list) would add massive value.
    Return as JSON: { "outline": [], "imageMap": [], "tableRequirements": "Describe the table to be built" }`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: 'Return ONLY valid JSON.' }, { role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    });

    const data = JSON.parse(response.choices[0].message.content || '{}');
    return {
      outline: data.outline || [],
      imageMap: data.imageMap || [],
      tableRequirements: data.tableRequirements || 'None'
    };
  }

  private async generateAuthorityContent(title: string, outline: string[], cluster: any[], tableReqs: string): Promise<string> {
    const clusterTitles = cluster.map((t: any) => t.title).join(', ');
    const prompt = `Write an authority-grade blog post.
    Title: ${title}
    Outline: ${outline.join('\n')}
    Related Cluster Topics: ${clusterTitles}
    Table Requirement: ${tableReqs}
    
    STRICT GUIDELINES:
    - Use HTML: <h2>, <h3>, <p>, <ul>, <li>, <strong>.
    - Build a Professional HTML Table for the comparison section using <table style="width:100%; border-collapse:collapse; border:1px solid #e2e8f0;">.
    - Insert external links to high-authority sources (e.g., Wikipedia, Official Docs) using <a href="..." target="_blank" rel="nofollow">.
    - Implement an "Executive Summary" box at the top and "Pro-Tips" throughout.
    - Use the la- la- la structure: Hook -> Evidence -> Conclusion.
    - Insert [IMAGE_PLACEHOLDER: section_name] where visuals belong.
    - Use a a an internal link to one of the cluster topics every 300 words.
    
    Return ONLY the HTML.`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'system', content: 'You are a top 1% SEO content creator.' }, { role: 'user', content: prompt }],
    });
    return response.choices[0].message.content || '';
  }

  private async generateAllImages(imageMap: any[], title: string): Promise<ImageAsset[]> {
    const images: ImageAsset[] = [];
    const heroPrompt = `Professional, high-resolution featured image for "${title}". SaaS aesthetic, 8k, highly detailed.`;
    images.push(await this.generateSingleImage(heroPrompt, 'Hero Image', 'hero'));

    for (const item of imageMap) {
      images.push(await this.generateSingleImage(item.prompt, item.caption, item.section));
    }
    return images;
  }

  private async generateSingleImage(prompt: string, caption: string, position: string): Promise<ImageAsset> {
    try {
      const response = await this.openai.images.generate({
        model: 'dall-e-3',
        prompt: prompt,
        n: 1,
        size: '1024x1024',
      });
      return { url: response.data[0].url, altText: prompt.substring(0, 100), caption, position };
    } catch (e) {
      return { url: 'https://via.placeholder.com/1024', altText: 'Image', caption, position };
    }
  }

  private assembleFinalPost(content: string, images: ImageAsset[]): string {
    let finalHtml = content;
    const hero = images.find(img => img.position === 'hero');
    if (hero) {
      finalHtml = `<img src="${hero.url}" alt="${hero.altText}" style="width:100%; border-radius:24px; margin-bottom:10px;"><p style="text-align:center; font-size:14px; color:#64748b; margin-bottom:30px; font-style:italic;">${hero.caption}</p>` + finalHtml;
    }
    images.forEach(img => {
      if (img.position !== 'hero') {
        const imgHtml = `<div style="margin: 40px 0; text-align:center;"><img src="${img.url}" alt="${img.altText}" style="width:100%; border-radius:24px; box-shadow: 0 10px 15px rgba(0,0,0,0.1);"><p style="font-size:14px; color:#64748b; margin-top:10px; font-style:italic;">${img.caption}</p></div>`;
        finalHtml = finalHtml.replace(`[IMAGE_PLACEHOLDER: ${img.position}]`, imgHtml);
      }
    });
    return finalHtml;
  }

  private async optimizeSEO(content: string): Promise<{ metaDescription: string, keywords: string[] }> {
    const prompt = `Analyze and provide: Meta: [max 160 chars], Keywords: [comma separated]. Content: ${content.substring(0, 4000)}`;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
    });
    const text = response.choices[0].message.content || '';
    const metaMatch = text.match(/Meta: (.*)/);
    const keywordsMatch = text.match(/Keywords: (.*)/);
    return {
      metaDescription: metaMatch ? metaMatch[1].trim() : '',
      keywords: keywordsMatch ? keywordsMatch[1].split(',').map(k => k.trim()) : [],
    };
  }
}
