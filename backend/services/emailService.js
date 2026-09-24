const nodemailer = require('nodemailer');

// Email configuration
const transporter = nodemailer.createTransporter({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const emailService = {
  // Send reservation confirmation
  sendReservationConfirmation: async (userEmail, reservationDetails) => {
    const { restaurant, date, time, partySize, table, confirmationCode } = reservationDetails;
    
    const mailOptions = {
      from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '预订确认',
      html: `
        <h1>您的预订已确认！</h1>
        <p><strong>餐厅：</strong> ${restaurant}</p>
        <p><strong>日期：</strong> ${date}</p>
        <p><strong>时间：</strong> ${time}</p>
        <p><strong>桌台：</strong> ${table}</p>
        <p><strong>人数：</strong> ${partySize}</p>
        <p><strong>确认码：</strong> ${confirmationCode}</p>
        <p>感谢您使用我们的预订服务。</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email de confirmación enviado');
    } catch (error) {
      console.error('❌ Error enviando email:', error);
    }
  },

  // Send reservation reminder
  sendReservationReminder: async (userEmail, reservationDetails) => {
    const { restaurant, date, time } = reservationDetails;
    
    const mailOptions = {
      from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '预订提醒',
      html: `
        <h1>您的预订提醒</h1>
        <p>您明天有一个预订：</p>
        <p><strong>餐厅：</strong> ${restaurant}</p>
        <p><strong>日期：</strong> ${date}</p>
        <p><strong>时间：</strong> ${time}</p>
        <p>期待您的光临！</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email de recordatorio enviado');
    } catch (error) {
      console.error('❌ Error enviando email:', error);
    }
  },

  // Send cancellation notification
  sendCancellationNotification: async (userEmail, reservationDetails) => {
    const { restaurant, date, time } = reservationDetails;
    
    const mailOptions = {
      from: `"Restaurant Booking" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: '预订已取消',
      html: `
        <h1>您的预订已取消</h1>
        <p><strong>餐厅：</strong> ${restaurant}</p>
        <p><strong>日期：</strong> ${date}</p>
        <p><strong>时间：</strong> ${time}</p>
        <p>期待很快再见到您。</p>
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('✅ Email de cancelación enviado');
    } catch (error) {
      console.error('❌ Error enviando email:', error);
    }
  },
};

module.exports = emailService;
