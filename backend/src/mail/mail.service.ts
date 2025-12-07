/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: this.configService.get<string>('EMAIL_USER'),
        pass: this.configService.get<string>('EMAIL_PASSWORD'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    text: string,
    htmlContent: string,
  ) {
    try {
      const mailOptions = {
        to,
        subject,
        text,
        html: htmlContent,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Email sent: ' + info.response);
    } catch (error) {
      console.error('Error sending email: ', error);
    }
  }

  async verifyEmail(email: string, verifyLink: string) {
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px;">
  <div style="text-align: center; padding-bottom: 20px;">
    <h2 style="color: #4a90e2;">🎓 ThetaHouse</h2>
    <p style="color: #333;">Thanks for register! Please verfiy your email.</p>
  </div>
  
  <div style="text-align: center; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
    <p style="font-size: 16px; color: #555;">Click the button below to verify.</p>
    <a href="${verifyLink}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
      Vefify
    </a>
  </div>
</div>
`;
    try {
      await this.sendEmail(email, 'Verify Email', '', htmlContent);
    } catch (error) {
      console.log(error);
    }
  }

  async resetPasswordEmail(email: string, resetLink: string) {
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; padding-bottom: 20px;">
        <h2 style="color: #4a90e2;">BDS</h2>
        <p style="color: #333;">You requested to reset your password.</p>
      </div>
  
      <div style="text-align: center; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #555;">Click the button below to reset your password.</p>
        <p style="font-size: 16px; color: #555;"> The reset is only effective for 5 minutes.</p>
        <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Reset Password
        </a>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>`;

    try {
      await this.sendEmail(email, 'Reset Your Password', '', htmlContent);
    } catch (error) {
      console.error('Error sending Reset password email:', error);
    }
  }

  async setupPasswordEmail(email: string, setupLink: string) {
    const htmlContent = `<div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; background-color: #f9f9f9; border-radius: 10px;">
      <div style="text-align: center; padding-bottom: 20px;">
        <h2 style="color: #4a90e2;">BDS</h2>
        <p style="color: #333;">You requested to setup your password.</p>
      </div>
  
      <div style="text-align: center; padding: 20px; background-color: #ffffff; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
        <p style="font-size: 16px; color: #555;">Click the button below to setup your password.</p>
        <p style="font-size: 16px; color: #555;"> The setup is only effective for 5 minutes.</p>
        <a href="${setupLink}" style="display: inline-block; padding: 12px 24px; margin-top: 20px; background-color: #4a90e2; color: white; text-decoration: none; border-radius: 6px; font-weight: bold;">
          Setup Password
        </a>
        <p style="font-size: 12px; color: #888; margin-top: 20px;">If you did not request this, please ignore this email.</p>
      </div>
    </div>`;

    try {
      await this.sendEmail(email, 'Setup Your Password', '', htmlContent);
    } catch (error) {
      console.error('Error sending setup password email:', error);
    }
  }
}
