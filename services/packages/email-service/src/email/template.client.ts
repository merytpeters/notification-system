import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { EmailTemplate } from './email.interface';

/**
 * Template client handles communication with the template service
 * Fetches email templates for rendering and sending emails
 */
@Injectable()
export class TemplateClient {
  private readonly logger = new Logger(TemplateClient.name);
  private readonly templateServiceUrl = process.env.TEMPLATE_SERVICE_URL || 'http://template-service:3003';
  private readonly cache = new Map<string, { template: EmailTemplate; timestamp: number }>();
  private readonly cacheTtl = 5 * 60 * 1000; // 5 minutes cache TTL

  constructor(private readonly http: HttpService) {}

  /**
   * Fetch email template from template service
   * Implements caching to reduce service calls
   * @param templateId Template identifier
   * @returns Email template object
   */
  async getTemplate(templateId: string): Promise<EmailTemplate> {
    // Check cache first
    const cached = this.cache.get(templateId);
    if (cached && Date.now() - cached.timestamp < this.cacheTtl) {
      this.logger.debug(`Template ${templateId} retrieved from cache`);
      return cached.template;
    }

    try {
      this.logger.log(`Fetching template ${templateId} from template service`);
      
      const response = await lastValueFrom(
        this.http.get(`${this.templateServiceUrl}/api/v1/templates/${templateId}`, {
          timeout: 5000, // 5 second timeout
          headers: {
            'Content-Type': 'application/json',
          },
        }),
      );

      const template: EmailTemplate = response.data;
      
      // Validate template structure
      if (!template.id || !template.subject || !template.content) {
        throw new Error(`Invalid template structure for ${templateId}`);
      }

      // Cache the template
      this.cache.set(templateId, {
        template,
        timestamp: Date.now(),
      });

      this.logger.log(`Template ${templateId} fetched and cached successfully`);
      return template;
    } catch (error: any) {
      this.logger.warn(`Template service unavailable, using fallback template for ${templateId}`);
      return this.getFallbackTemplate(templateId);
    }
  }

  /**
   * Clear template cache
   * Useful for testing or when templates are updated
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.log('Template cache cleared');
  }

  /**
   * Get cache statistics for monitoring
   */
  getCacheStats(): { size: number; ttl: number } {
    return {
      size: this.cache.size,
      ttl: this.cacheTtl,
    };
  }

  /**
   * Fallback template for when template service is unavailable
   * @param templateId Template identifier
   * @returns Basic fallback template
   */
  private getFallbackTemplate(templateId: string): EmailTemplate {
    this.logger.warn(`Using fallback template for ${templateId}`);
    
    return {
      id: templateId,
      subject: 'Notification',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>{{title}}</h2>
          <p>{{message}}</p>
          <p>Thank you,<br>The Notification System Team</p>
        </div>
      `,
      textContent: `
        {{title}}
        
        {{message}}
        
        Thank you,
        The Notification System Team
      `,
    };
  }
}



// import { Injectable } from '@nestjs/common';

// @Injectable()
// export class TemplateClient {
//   async getTemplate(templateId: string) {
//     // Simulate fetching template from Template Service
//     const templates = {
//       welcome: {
//         subject: 'Welcome to MyApp!',
//         content: '<h1>Hello {{username}}</h1><p>Click here to verify: {{link}}</p>',
//       },
//     };
//     return templates[templateId];
//   }
// }
