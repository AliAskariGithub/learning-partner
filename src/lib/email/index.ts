import { Resend } from 'resend';
import { siteConfig } from '@/config/site';

export interface SendNotificationParams {
  type: 'contact' | 'feedback';
  name?: string;
  email: string;
  topicOrCategory: string;
  subjectTitle?: string;
  message: string;
  adminInboxUrl: string;
  metadata?: Record<string, string | number | null | undefined>;
}

export interface EmailDeliveryResult {
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

/**
 * Escapes raw user text before rendering inside HTML emails
 * to neutralize HTML/script injection vectors.
 */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailProvider {
  sendAdminNotification(params: SendNotificationParams): Promise<EmailDeliveryResult>;
  sendSenderConfirmation(toEmail: string, name?: string, topic?: string): Promise<EmailDeliveryResult>;
}

export class ResendEmailProvider implements EmailProvider {
  private resend: Resend | null = null;
  private fromEmail: string;
  private toEmail: string;

  constructor() {
    const apiKey = process.env.RESEND_API_KEY;
    if (apiKey) {
      this.resend = new Resend(apiKey);
    }
    this.fromEmail = process.env.EMAIL_FROM || 'Learning Partner <onboarding@resend.dev>';
    this.toEmail = process.env.CONTACT_TO_EMAIL || '';
  }

  async sendAdminNotification(params: SendNotificationParams): Promise<EmailDeliveryResult> {
    if (!this.resend || !this.toEmail) {
      return { status: 'skipped' };
    }

    try {
      const isBug = params.type === 'feedback';
      const safeName = escapeHtml(params.name || 'Anonymous Learner');
      const safeEmail = escapeHtml(params.email);
      const safeTopic = escapeHtml(params.topicOrCategory);
      const safeTitle = params.subjectTitle ? escapeHtml(params.subjectTitle) : '';
      const safeBody = escapeHtml(params.message).replace(/\n/g, '<br />');

      const subject = isBug
        ? `[Feedback: ${params.topicOrCategory.toUpperCase()}] ${safeTitle || 'New Report'}`
        : `[Contact: ${params.topicOrCategory}] Message from ${safeName}`;

      let metaHtml = '';
      if (params.metadata && Object.keys(params.metadata).length > 0) {
        metaHtml = `<div style="margin-top: 16px; padding: 12px; background: #f4f4f5; border-radius: 8px; font-size: 12px; font-family: monospace;">` +
          `<strong>Context Details:</strong><br />` +
          Object.entries(params.metadata)
            .filter(([, v]) => v != null && v !== '')
            .map(([k, v]) => `<div>${escapeHtml(k)}: ${escapeHtml(String(v))}</div>`)
            .join('') +
          `</div>`;
      }

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
          <h2 style="color: #6366f1; margin-bottom: 8px;">Learning Partner Notification</h2>
          <p style="margin-top: 0; color: #71717a; font-size: 14px;">A new ${params.type} submission was recorded in your workspace database.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 16px; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #71717a; width: 100px;"><strong>From:</strong></td>
              <td style="padding: 6px 0;">${safeName} &lt;<a href="mailto:${safeEmail}">${safeEmail}</a>&gt;</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #71717a;"><strong>Topic / Type:</strong></td>
              <td style="padding: 6px 0;">${safeTopic}</td>
            </tr>
            ${safeTitle ? `
            <tr>
              <td style="padding: 6px 0; color: #71717a;"><strong>Title:</strong></td>
              <td style="padding: 6px 0;">${safeTitle}</td>
            </tr>` : ''}
          </table>

          <div style="margin-top: 20px; padding: 16px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; font-size: 14px;">
            ${safeBody}
          </div>

          ${metaHtml}

          <div style="margin-top: 24px;">
            <a href="${params.adminInboxUrl}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 6px; font-weight: 600; font-size: 14px;">
              Open Admin Inbox &rarr;
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 30px 0 16px;" />
          <p style="font-size: 11px; color: #a1a1aa;">This is an automated notification from your Learning Partner instance. Reply directly to this email to contact the sender.</p>
        </div>
      `;

      await this.resend.emails.send({
        from: this.fromEmail,
        to: this.toEmail,
        replyTo: params.email,
        subject,
        html: htmlContent,
      });

      return { status: 'sent' };
    } catch (err: any) {
      console.error('[ResendEmailProvider] Error delivering notification:', err);
      return { status: 'failed', error: err.message || 'Resend API error' };
    }
  }

  async sendSenderConfirmation(toEmail: string, name?: string, topic?: string): Promise<EmailDeliveryResult> {
    if (!this.resend || !siteConfig.features.confirmationEmailEnabled) {
      return { status: 'skipped' };
    }

    try {
      const safeName = escapeHtml(name || 'there');
      const safeTopic = topic ? escapeHtml(topic) : 'inquiry';

      const htmlContent = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; color: #18181b; line-height: 1.6;">
          <h2 style="color: #6366f1;">Thank you for contacting Learning Partner</h2>
          <p>Hi ${safeName},</p>
          <p>We received your message regarding <strong>${safeTopic}</strong>. A maintainer will review your inquiry shortly.</p>
          <p style="color: #52525b; font-size: 14px;"><strong>Expected response:</strong> ${siteConfig.owner.expectedResponseTime}.</p>
          <p style="font-size: 14px; margin-top: 20px;">In the meantime, you can continue exploring the workspace and documentation at <a href="${siteConfig.url}">${siteConfig.url}</a>.</p>
          <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px;" />
          <p style="font-size: 11px; color: #a1a1aa;">Learning Partner — Grounded AI Study Workspace</p>
        </div>
      `;

      await this.resend.emails.send({
        from: this.fromEmail,
        to: toEmail,
        subject: `We received your message — Learning Partner`,
        html: htmlContent,
      });

      return { status: 'sent' };
    } catch (err: any) {
      return { status: 'failed', error: err.message };
    }
  }
}

// Global Singleton
let emailProviderInstance: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (!emailProviderInstance) {
    emailProviderInstance = new ResendEmailProvider();
  }
  return emailProviderInstance;
}

