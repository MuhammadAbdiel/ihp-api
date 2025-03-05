const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, verificationToken) => {
  const verificationUrl = `${process.env.BASE_URL}:${process.env.PORT}/api/auth/verify-email?token=${verificationToken}`;

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Email Verification",
    html: `Klik link berikut untuk verifikasi email: <a href="${verificationUrl}">${verificationUrl}</a>`,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };