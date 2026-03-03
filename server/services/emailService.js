const nodemailer = require('nodemailer');

/**
 * Handle Gmail SMTP using explicit host and port configuration
 */
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // true for 465
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error("SMTP Connection Failed:", error);
    } else {
        console.log("SMTP Server is ready");
    }
});

/**
 * Send OTP via Gmail SMTP
 * @param {string} toEmail - Recipient email
 * @param {string} otp - 6-digit OTP code 
 */
const sendOTPEmail = async (toEmail, otp) => {
    const htmlTemplate = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #0f172a; border-radius: 16px; color: #e2e8f0;">
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; width: 10px; height: 10px; background: #10b981; border-radius: 50%; margin-right: 8px;"></div>
                <span style="font-size: 20px; font-weight: 700; color: #ffffff;">CRM Portal</span>
            </div>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 16px 0;" />
            <h2 style="text-align: center; color: #ffffff; font-size: 22px; margin-bottom: 8px;">Admin Login Verification</h2>
            <p style="text-align: center; color: #94a3b8; font-size: 14px; margin-bottom: 24px;">Use the code below to complete your login. It expires in <strong>5 minutes</strong>.</p>
            <div style="text-align: center; background: #1e293b; border: 1px solid #334155; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <span style="font-size: 36px; font-weight: 800; letter-spacing: 12px; color: #10b981;">${otp}</span>
            </div>
            <p style="text-align: center; color: #64748b; font-size: 12px;">Security Warning: Do not share this code with anyone.</p>
            <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
            <p style="text-align: center; color: #475569; font-size: 11px;">CRM Portal &bull; Secure Access</p>
        </div>
    `;

    try {
        await transporter.sendMail({
            from: `"CRM Portal" <${process.env.EMAIL_USER}>`,
            to: toEmail,
            subject: 'Your CRM Admin Login OTP',
            html: htmlTemplate,
        });
        return { success: true };
    } catch (error) {
        console.error("SMTP ERROR:", error);
        throw error;
    }
};

module.exports = { sendOTPEmail };
