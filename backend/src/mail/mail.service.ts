import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get('EMAIL_HOST'),
      port: this.configService.get('EMAIL_PORT'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  private getBaseTemplate(content: string, title: string) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f4f7f6; }
          .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
          .header { background-color: #059669; padding: 30px; text-align: center; }
          .header h1 { color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 0.5px; }
          .content { padding: 40px 30px; }
          .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; }
          .button { display: inline-block; padding: 12px 24px; background-color: #059669; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; margin-top: 20px; }
          .otp-box { background: #f0fdf4; border: 2px dashed #059669; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0; }
          .otp-code { font-size: 32px; font-weight: 800; color: #059669; letter-spacing: 4px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 12px; font-weight: 600; text-transform: uppercase; margin-bottom: 10px; }
          .status-approved { background-color: #d1fae5; color: #065f46; }
          .status-rejected { background-color: #fee2e2; color: #991b1b; }
          .status-pending { background-color: #fef3c7; color: #92400e; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>NutriGuard</h1>
          </div>
          <div class="content">
            ${content}
          </div>
          <div class="footer">
            &copy; ${new Date().getFullYear()} NutriGuard. All rights reserved.<br>
            Rwanda's platform for early detection of stunting in children.
          </div>
        </div>
      </body>
      </html>
    `;
  }

  async sendMail(to: string, subject: string, content: string) {
    try {
      await this.transporter.sendMail({
        from: `"NutriGuard Support" <${this.configService.get('SMTP_USER')}>`,
        to,
        subject,
        html: this.getBaseTemplate(content, subject),
      });
    } catch (error) {
      console.error('Email sending failed:', error);
    }
  }

  async sendRegistrationRequestEmail(email: string, name: string) {
    const content = `
      <div class="status-badge status-pending">Request Pending</div>
      <h2>Registration Request Received</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Thank you for requesting access to <strong>NutriGuard</strong>. Your request has been successfully submitted and is currently being reviewed by our administration team.</p>
      <p>You will receive another email once your account has been reviewed and access is granted.</p>
      <p>In the meantime, if you have any questions, feel free to contact your local health center administrator.</p>
    `;
    await this.sendMail(email, 'NutriGuard - Registration Request Submitted', content);
  }

  async sendAccountStatusEmail(email: string, name: string, status: 'APPROVED' | 'REJECTED') {
    const isApproved = status === 'APPROVED';
    const statusClass = isApproved ? 'status-approved' : 'status-rejected';
    const statusText = isApproved ? 'Approved' : 'Rejected';
    
    const content = `
      <div class="status-badge ${statusClass}">${statusText}</div>
      <h2>Account Status Update</h2>
      <p>Hello <strong>${name}</strong>,</p>
      <p>Your request for access to the <strong>NutriGuard</strong> system has been <strong>${status.toLowerCase()}</strong> by the administrator.</p>
      ${isApproved 
        ? `<p>You can now log in to the system using your email and the password you set during registration.</p>
           <a href="${this.configService.get('FRONTEND_URL')}/login" class="button">Log In Now</a>`
        : `<p>Unfortunately, your request could not be approved at this time. Please contact support if you believe this is an error.</p>`
      }
    `;
    await this.sendMail(email, `NutriGuard - Account ${statusText}`, content);
  }

  async sendOTPEmail(email: string, otp: string) {
    const content = `
      <h2>Verification Code</h2>
      <p>You requested a password reset for your NutriGuard account. Use the verification code below to proceed:</p>
      <div class="otp-box">
        <div class="otp-code">${otp}</div>
      </div>
      <p>This code will expire in <strong>10 minutes</strong>. If you did not request this, you can safely ignore this email.</p>
    `;
    await this.sendMail(email, 'NutriGuard - Password Reset Verification Code', content);
  }
}
