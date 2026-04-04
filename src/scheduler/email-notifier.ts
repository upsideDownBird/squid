import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface EmailNotification {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export class EmailNotifier {
  private transporter: Transporter;

  constructor(config: EmailConfig) {
    this.transporter = nodemailer.createTransport(config);
  }

  async send(notification: EmailNotification): Promise<void> {
    await this.transporter.sendMail({
      from: (this.transporter.options as any).auth?.user,
      to: notification.to,
      subject: notification.subject,
      text: notification.text,
      html: notification.html
    });
  }

  async sendTaskResult(taskName: string, status: 'success' | 'failed', result: string, to: string): Promise<void> {
    const subject = `定时任务 ${taskName} - ${status === 'success' ? '执行成功' : '执行失败'}`;
    const text = `任务: ${taskName}\n状态: ${status}\n\n结果:\n${result}`;

    await this.send({ to, subject, text });
  }
}
