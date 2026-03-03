const { Resend } = require('resend');

// ── Validate API key at startup ──
if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is missing. Set it in your environment variables.');
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_ADDRESS = 'CRM Portal <onboarding@resend.dev>';

/**
 * Send OTP email to admin
 * @param {string} email - Recipient email
 * @param {string} otp - 6-digit OTP code
 * @throws {Error} Structured error with message (never raw stack trace)
 */
const sendAdminOTP = async (email, otp) => {
    try {
        const { data, error } = await resend.emails.send({
            from: FROM_ADDRESS,
            to: email,
            subject: 'Your CRM Admin Login OTP',
            html: `
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
                    <p style="text-align: center; color: #64748b; font-size: 12px;">If you didn't request this, please ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #1e293b; margin: 24px 0;" />
                    <p style="text-align: center; color: #475569; font-size: 11px;">CRM Portal &bull; Secure Access</p>
                </div>
            `,
        });

        if (error) {
            console.error('[EmailService] Resend API error:', error.message);
            throw new Error('Email delivery failed');
        }

        return { success: true, messageId: data?.id };
    } catch (err) {
        // Re-throw our own structured error, not Resend internals
        if (err.message === 'Email delivery failed') throw err;
        console.error('[EmailService] Unexpected error:', err.message);
        throw new Error('Email service unavailable');
    }
};

/**
 * Health check — verify Resend API is reachable
 * @returns {Promise<boolean>}
 */
const checkHealth = async () => {
    try {
        await resend.apiKeys.list();
        return true;
    } catch {
        return false;
    }
};

module.exports = { sendAdminOTP, checkHealth };
