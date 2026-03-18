const axios = require('axios');

/**
 * Send OTP via Brevo Transactional Email API (HTTPS)
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code 
 */
const sendOTPEmail = async (toEmail, otp) => {
    const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

    if (!process.env.BREVO_API_KEY) {
        console.error("Missing BREVO_API_KEY environment variable");
        throw new Error("Email service configuration error");
    }

    const htmlContent = `
        <div style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05); border: 1px solid #f0f2f5;">
            <!-- Header with Gradient Area -->
            <div style="background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); padding: 40px 20px; text-align: center;">
                <div style="width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 18px; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid rgba(255,255,255,0.3);">
                    <img src="https://cdn-icons-png.flaticon.com/512/2921/2921222.png" width="32" height="32" style="display: block; margin: 14px auto;" alt="Logo" />
                </div>
                <h1 style="color: #ffffff; font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.5px; margin-bottom: 4px;">Khushi Technology</h1>
                <p style="color: rgba(255,255,255,0.8); font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin: 0;">Management & Tracking System</p>
            </div>

            <!-- Content Area -->
            <div style="padding: 40px 32px; text-align: center;">
                <h2 style="color: #1a1a1b; font-size: 20px; font-weight: 700; margin-bottom: 12px; margin-top: 0;">Login Verification</h2>
                <p style="color: #6b7280; font-size: 15px; line-height: 1.6; margin-bottom: 32px;">Please use the following verification code to safely access your admin account.</p>
                
                <div style="background-color: #f8fafc; border: 2px dashed #e2e8f0; border-radius: 20px; padding: 24px 10px; margin-bottom: 32px;">
                    <span style="font-size: 42px; font-weight: 800; color: #2563eb; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace;">${otp}</span>
                </div>

                <div style="background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; padding: 14px; margin-bottom: 32px;">
                    <p style="color: #92400e; font-size: 13px; font-weight: 600; margin: 0;">Valid for 5 minutes only.</p>
                </div>
            </div>

            <!-- Footer Section -->
            <div style="background-color: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #f3f4f6;">
                <p style="color: #6b7280; font-size: 11px; margin: 0; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">&copy; 2024 Khushi Technology &bull; Secure Portal</p>
            </div>
        </div>
    `;

    const payload = {
        sender: {
            name: "Khushi Technology",
            email: "khrishchauhan@gmail.com"
        },
        to: [
            {
                email: toEmail
            }
        ],
        subject: `[Verification] ${otp} is your Khushi Technology Login OTP`,
        htmlContent: htmlContent
    };

    try {
        console.log("Sending OTP via Brevo to:", toEmail);

        await axios.post(BREVO_API_URL, payload, {
            headers: {
                'api-key': process.env.BREVO_API_KEY,
                'Content-Type': 'application/json'
            }
        });

        console.log("OTP email sent successfully");
        return { success: true };
    } catch (error) {
        console.error("Brevo API Error:", error.response?.data || error.message);
        throw new Error("Email delivery failed");
    }
};

module.exports = { sendOTPEmail };
