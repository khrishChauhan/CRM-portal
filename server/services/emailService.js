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
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 10px; height: 10px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
                <span style="font-size: 20px; font-weight: 700; color: #ffffff;">CRM Portal</span>
            </div>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 16px 0;" />
            <h2 style="text-align: center; color: #ffffff; font-size: 22px; margin-bottom: 8px;">Admin Login Verification</h2>
            <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Your login OTP is:</p>
            <div style="text-align: center; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #10b981;">${otp}</span>
            </div>
            <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 24px;">This OTP is valid for 5 minutes.</p>
            <p style="text-align: center; color: #64748b; font-size: 12px;">Security Warning: Do not share this code with anyone. If you did not request this, please ignore.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="text-align: center; color: #475569; font-size: 11px;">CRM Portal &bull; Secure Access</p>
        </div>
    `;

    const payload = {
        sender: {
            name: "CRM Portal",
            email: "khrishchauhan@gmail.com"
        },
        to: [
            {
                email: toEmail
            }
        ],
        subject: "Your CRM Admin Login OTP",
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
