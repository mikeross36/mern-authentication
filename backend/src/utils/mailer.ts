import nodemailer from "nodemailer";
import { User } from "../models/userModel";
import config from "config";
import pug from "pug";
import { convert } from "html-to-text";

export type SmtpTypes = {
  user: string;
  pass: string;
  host: string;
  port: number;
  secure: boolean;
};

class Email {
  to: string;
  firstName: string;
  url: string;
  from: string;
  constructor(user: User, url: string) {
    this.to = user.email;
    this.firstName = user.userName.split(" ")[0];
    this.url = url;
    this.from = `Vladimir Monarov <${config.get<string>("from")}>`;
  }

  transporter() {
    const smtp = config.get<SmtpTypes>("smtp");

    if (process.env.NODE_ENV === "production") {
      return nodemailer.createTransport({
        service: "Sendgrid",
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD,
        },
      });
    }
    return nodemailer.createTransport({
      ...smtp,
      auth: { user: smtp.user, pass: smtp.pass },
    });
  }

  async sendEmail(template: string, subject: string) {
    const html = pug.renderFile(
      `${__dirname}/../views/emails/${template}.pug`,
      {
        firstName: this.firstName,
        url: this.url,
        subject: subject,
      }
    );

    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html: html,
      text: convert(html),
    };

    await this.transporter().sendMail(mailOptions);
  }

  async sendWelcomeEmail(): Promise<void> {
    await this.sendEmail("welcomeEmail", "Welcome new user!");
  }

  async sendPasswordReset(): Promise<void> {
    await this.sendEmail("passwordReset", "Your password reset token");
  }
}

export default Email;
