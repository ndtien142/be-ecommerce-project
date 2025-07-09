'use strict';

const nodemailer = require('nodemailer');
const crypto = require('crypto');

class EmailService {
    constructor() {
        // Configure your email transporter here
        // This is using Gmail as an example, but you can use any SMTP service
        this.transporter = nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE || 'gmail',
            host: process.env.EMAIL_HOST || 'smtp.gmail.com',
            port: process.env.EMAIL_PORT || 587,
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_APP_PASSWORD,
            },
        });
    }

    generateVerificationToken() {
        return crypto.randomBytes(32).toString('hex');
    }

    generateVerificationCode() {
        // Generate a 6-digit random code
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    async sendVerificationEmail(email, username, verificationCode) {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: 'Xác thực địa chỉ email của bạn',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Xác thực Email</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Cảm ơn bạn đã đăng ký tài khoản với ứng dụng của chúng tôi. Để hoàn tất quá trình đăng ký, vui lòng sử dụng mã xác thực bên dưới:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: #007bff; color: white; padding: 20px; border-radius: 8px; display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; font-family: monospace;">
                                ${verificationCode}
                            </div>
                        </div>
                        <p style="text-align: center; color: #666; font-size: 14px;">Nhập mã này vào form xác thực trên website của chúng tôi</p>
                        <p><strong>Mã này sẽ hết hạn trong 24 giờ.</strong></p>
                        <p style="color: #999; font-size: 12px;">Lưu ý bảo mật: Không bao giờ chia sẻ mã này với bất kỳ ai. Đội ngũ của chúng tôi sẽ không bao giờ yêu cầu mã này.</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">Nếu bạn không tạo tài khoản, bạn có thể bỏ qua email này.</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);

            // For development with Ethereal Email, log the preview URL
            if (process.env.NODE_ENV === 'development') {
                console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl:
                    process.env.NODE_ENV === 'development'
                        ? nodemailer.getTestMessageUrl(info)
                        : null,
            };
        } catch (error) {
            console.error('Email sending failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async sendWelcomeEmail(email, username) {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: 'Chào mừng bạn đến với ứng dụng của chúng tôi!',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Chào mừng!</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Chào mừng bạn đến với ứng dụng của chúng tôi! Email của bạn đã được xác thực thành công và tài khoản của bạn hiện đã được kích hoạt.</p>
                        <p>Bây giờ bạn có thể tận hưởng tất cả các tính năng của nền tảng của chúng tôi.</p>
                    </div>
                    <p style="color: #666; font-size: 14px;">Cảm ơn bạn đã tham gia cùng chúng tôi!</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: info.messageId,
            };
        } catch (error) {
            console.error('Welcome email sending failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async sendPasswordResetEmail(email, username, resetToken) {
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: 'Yêu cầu đặt lại mật khẩu',
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Đặt lại mật khẩu</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào nút bên dưới để thiết lập mật khẩu mới:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Đặt lại mật khẩu
                            </a>
                        </div>
                        <p>Nếu nút không hoạt động, bạn có thể sao chép và dán đường link sau vào trình duyệt:</p>
                        <p style="word-break: break-all; color: #666;">${resetUrl}</p>
                        <p><strong>Đường link này sẽ hết hạn trong 1 giờ.</strong></p>
                    </div>
                    <p style="color: #666; font-size: 14px;">Nếu bạn không yêu cầu đặt lại mật khẩu, bạn có thể bỏ qua email này.</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);

            if (process.env.NODE_ENV === 'development') {
                console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
            }

            return {
                success: true,
                messageId: info.messageId,
                previewUrl:
                    process.env.NODE_ENV === 'development'
                        ? nodemailer.getTestMessageUrl(info)
                        : null,
            };
        } catch (error) {
            console.error('Password reset email sending failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }
}

module.exports = new EmailService();
