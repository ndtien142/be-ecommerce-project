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

    // Order-related email methods
    async sendOrderConfirmationEmail(
        email,
        username,
        order,
        isConfirmed = false,
    ) {
        console.log('Sending order confirmation email for order:', order);
        const orderDetailsHtml = order.lineItems
            .map(
                (item) => `
            <tr style="border-bottom: 1px solid #eee;">
                <td style="padding: 10px;">
                    <img src="${item.product.thumbnail_url}" alt="${item.product.name}" width="60" style="border-radius: 4px; margin-right: 10px; vertical-align: middle;">
                    ${item.product.name}
                </td>
                <td style="padding: 10px; text-align: center;">${item.quantity}</td>
                <td style="padding: 10px; text-align: right;">${(item.price * item.quantity).toLocaleString('vi-VN')} VND</td>
            </tr>
        `,
            )
            .join('');

        const orderUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/orders/${order.id}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: `${isConfirmed ? 'Xác nhận đơn hàng' : 'Đặt hàng thành công'} #${order.id}`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif; border: 1px solid #ddd; border-radius: 8px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h1 style="color: #4CAF50;">${isConfirmed ? 'Xác nhận đơn hàng' : 'Đặt hàng thành công'}</h1>
                    </div>
                    <p>Xin chào <strong>${username}</strong>,</p>
                    <p>Cảm ơn bạn đã đặt hàng tại cửa hàng của chúng tôi. ${isConfirmed ? 'Chúng tôi đã xác nhận đơn hàng củ bạn, đơn hàng của bạn đang được xử lý và sẽ được giao đến bạn trong thời gian sớm nhất' : 'Đơn hàng của bạn đã được ghi nhận và đang được xử lý.'}</p>
                    
                    <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="margin-top: 0; color: #333;">Chi tiết đơn hàng #${order.id}</h3>
                        <table style="width: 100%; border-collapse: collapse;">
                            <thead>
                                <tr style="background: #eee;">
                                    <th style="padding: 10px; text-align: left;">Sản phẩm</th>
                                    <th style="padding: 10px; text-align: center;">Số lượng</th>
                                    <th style="padding: 10px; text-align: right;">Thành tiền</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${orderDetailsHtml}
                            </tbody>
                        </table>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 15px 0;">
                        <table style="width: 100%;">
                            <tr>
                                <td style="text-align: right;">Phí vận chuyển:</td>
                                <td style="text-align: right; font-weight: bold;">${order.shipping_fee.toLocaleString('vi-VN')} VND</td>
                            </tr>
                            <tr>
                                <td style="text-align: right; font-size: 18px; font-weight: bold;">Tổng cộng:</td>
                                <td style="text-align: right; font-size: 18px; font-weight: bold; color: #d9534f;">${order.total_amount.toLocaleString('vi-VN')} VND</td>
                            </tr>
                        </table>
                    </div>

                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${orderUrl}" 
                           style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                            Theo dõi đơn hàng
                        </a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Chúng tôi sẽ thông báo cho bạn khi đơn hàng được vận chuyển.</p>
                </div>
            `,
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            if (process.env.NODE_ENV === 'development') {
                console.log(
                    'Order confirmation email sent. Preview URL:',
                    nodemailer.getTestMessageUrl(info),
                );
            }
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('Order confirmation email sending failed:', error);
            return { success: false, error: error.message };
        }
    }

    async sendOrderStatusUpdateEmail(email, username, order, newStatus) {
        const statusText = this.getOrderStatusText(newStatus);
        const statusColor = this.getOrderStatusColor(newStatus);

        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: `Cập nhật đơn hàng #${order.id} - ${statusText}`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Cập nhật đơn hàng</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Đơn hàng #${order.id} của bạn đã được cập nhật trạng thái.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <div style="background: ${statusColor}; color: white; padding: 15px; border-radius: 8px; display: inline-block; font-size: 18px; font-weight: bold;">
                                ${statusText}
                            </div>
                        </div>

                        <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                            <h3 style="color: #333; margin-top: 0;">Thông tin đơn hàng</h3>
                            <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                            <p><strong>Tổng tiền:</strong> ${(order.totalAmount || order.total_amount).toLocaleString('vi-VN')} VND</p>
                            ${order.trackingNumber ? `<p><strong>Mã vận đơn:</strong> ${order.trackingNumber}</p>` : ''}
                        </div>

                        ${this.getStatusSpecificMessage(newStatus)}

                        <div style="text-align: center; margin: 20px 0;">
                            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}" 
                               style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                                Xem chi tiết đơn hàng
                            </a>
                        </div>
                    </div>
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
            console.error('Order status update email sending failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    async sendOrderCancellationEmail(email, username, order, reason = '') {
        const mailOptions = {
            from: process.env.EMAIL_FROM || 'noreply@yourapp.com',
            to: email,
            subject: `Đơn hàng #${order.id} đã được hủy`,
            html: `
                <div style="max-width: 600px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
                    <h2 style="color: #333; text-align: center;">Đơn hàng đã được hủy</h2>
                    <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <p>Xin chào <strong>${username}</strong>,</p>
                        <p>Đơn hàng #${order.id} của bạn đã được hủy thành công.</p>
                        
                        <div style="background: #ffebee; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #f44336;">
                            <h3 style="color: #d32f2f; margin-top: 0;">Thông tin hủy đơn</h3>
                            <p><strong>Mã đơn hàng:</strong> #${order.id}</p>
                            <p><strong>Tổng tiền:</strong> ${(order.totalAmount || order.total_amount).toLocaleString('vi-VN')} VND</p>
                            <p><strong>Thời gian hủy:</strong> ${new Date().toLocaleString('vi-VN')}</p>
                            ${reason ? `<p><strong>Lý do:</strong> ${reason}</p>` : ''}
                        </div>

                        <div style="background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #4caf50;">
                            <h4 style="color: #388e3c; margin-top: 0;">Thông tin hoàn tiền</h4>
                            <p>Nếu bạn đã thanh toán cho đơn hàng này, số tiền sẽ được hoàn lại trong vòng 3-5 ngày làm việc.</p>
                            <p>Chúng tôi sẽ gửi thông báo khi việc hoàn tiền được hoàn tất.</p>
                        </div>

                        <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
                    </div>
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
            console.error('Order cancellation email sending failed:', error);
            return {
                success: false,
                error: error.message,
            };
        }
    }

    // Helper methods for order emails
    getOrderStatusText(status) {
        const statusMap = {
            pending_confirmation: 'Chờ xác nhận',
            pending_pickup: 'Chờ lấy hàng',
            shipping: 'Đang giao hàng',
            delivered: 'Đã giao hàng',
            returned: 'Đã trả hàng',
            cancelled: 'Đã hủy',
        };
        return statusMap[status] || status;
    }

    getOrderStatusColor(status) {
        const colorMap = {
            pending_confirmation: '#ff9800',
            pending_pickup: '#2196f3',
            shipping: '#9c27b0',
            delivered: '#4caf50',
            returned: '#f44336',
            cancelled: '#9e9e9e',
        };
        return colorMap[status] || '#666';
    }

    getStatusSpecificMessage(status) {
        const messages = {
            pending_confirmation:
                '<p>Đơn hàng của bạn đang chờ xác nhận từ cửa hàng.</p>',
            pending_pickup:
                '<p>Đơn hàng đã được xác nhận và đang chờ lấy hàng.</p>',
            shipping:
                '<p>Đơn hàng đang trên đường giao đến bạn. Vui lòng chú ý điện thoại!</p>',
            delivered:
                '<p>Đơn hàng đã được giao thành công. Cảm ơn bạn đã mua hàng!</p>',
            returned:
                '<p>Đơn hàng đã được trả lại. Chúng tôi sẽ xử lý hoàn tiền sớm nhất.</p>',
            cancelled: '<p>Đơn hàng đã được hủy thành công.</p>',
        };
        return messages[status] || '';
    }

    formatOrderItems(lineItems) {
        if (!lineItems || !Array.isArray(lineItems)) return '';

        const itemsHtml = lineItems
            .map(
                (item) => `
            <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee;">
                <div>
                    <strong>${item.product?.name || 'Sản phẩm'}</strong><br>
                    <small>Số lượng: ${item.quantity}</small>
                </div>
                <div style="text-align: right;">
                    <strong>${(item.total || item.price * item.quantity).toLocaleString('vi-VN')} VND</strong>
                </div>
            </div>
        `,
            )
            .join('');

        return `
            <div style="background: white; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">Sản phẩm đã đặt</h3>
                ${itemsHtml}
            </div>
        `;
    }
}

module.exports = new EmailService();
