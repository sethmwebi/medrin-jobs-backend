import sgMail from '@sendgrid/mail';
import 'dotenv/config';

// Type for the email sender
interface Sender {
  email: string;
  name: string;
}

// Ensure the environment variable is defined
const sendGridApiKey = process.env.SENDGRID_API_KEY;
if (!sendGridApiKey) {
  throw new Error('SENDGRID_API_KEY is not defined in the environment variables');
}

// Set the SendGrid API key
sgMail.setApiKey(sendGridApiKey);

// Default sender
export const sender: Sender = {
  email: 'nathan.mwai@student.moringaschool.com',
  name: 'Medrin Jobs',
};

// Type for the function parameter
interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  from?: string;  // `from` is optional, as it defaults to `sender.email`
  text?: string;
}

// Function to send email
export const sendEmail = async ({
  to,
  subject,
  html,
  from,
  text,
}: SendEmailParams): Promise<void> => {
  try {
    const msg = {
      to, // Recipient's email
      from: from || sender.email, // Sender email (use default if not provided)
      subject,
      html, // HTML content
      text, // Optional plain-text content (fallback)
    };

    const response = await sgMail.send(msg);
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw new Error('Failed to send email');
  }
};
