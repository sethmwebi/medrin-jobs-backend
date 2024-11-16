import { sendEmail } from './sendgrid.config'; // Updated SendGrid client (no .js extension in TypeScript)
import {
  PASSWORD_RESET_REQUEST_TEMPLATE,
  PASSWORD_RESET_SUCCESS_TEMPLATE,
  VERIFICATION_EMAIL_TEMPLATE,
  WELCOME_EMAIL_TEMPLATE
} from './emailTemplate'; // Updated import without .js extension

// // Type for the email-related parameters
// interface EmailParams {
//   email: string;
//   verificationToken?: string;
//   name?: string;
//   resetURL?: string;
// }

// Function to send the verification email
export const sendVerificationEmail = async (email: string, verificationToken:string): Promise<void> => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Email Verification',
      html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken || ''),
    });

    console.log("Email sent successfully", response);
  } catch (error) {
    console.error(`Failed to send verification email: ${(error as Error).message}`);
    throw new Error(`Failed to send verification email: ${(error as Error).message}`);
  }
};

// Function to send the welcome email
export const sendWelcomeEmail = async (email:string, name: string): Promise<void> => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Welcome!',
      html: WELCOME_EMAIL_TEMPLATE.replace("{name}", name || ''),
    });

    console.log("Welcome email sent successfully", response);
  } catch (error) {
    console.error(`Failed to send welcome email: ${(error as Error).message}`);
    throw new Error(`Failed to send welcome email: ${(error as Error).message}`);
  }
};

// Function to send the password reset request email
export const sendPasswordResetEmail = async ( email:string, resetURL:string): Promise<void> => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: PASSWORD_RESET_REQUEST_TEMPLATE.replace("{resetURL}", resetURL || ''),
    });

    console.log("Password reset email sent successfully", response);
  } catch (error) {
    console.error(`Failed to send password reset email: ${(error as Error).message}`);
    throw new Error(`Failed to send password reset email: ${(error as Error).message}`);
  }
};

// Function to send the password reset success email
export const sendResetSuccessEmail = async (email:string): Promise<void> => {
  try {
    const response = await sendEmail({
      to: email,
      subject: 'Password Reset Successful',
      html: PASSWORD_RESET_SUCCESS_TEMPLATE,
    });

    console.log("Password reset success email sent successfully", response);
  } catch (error) {
    console.error(`Failed to send password reset success email: ${(error as Error).message}`);
    throw new Error(`Failed to send password reset success email: ${(error as Error).message}`);
  }
};
