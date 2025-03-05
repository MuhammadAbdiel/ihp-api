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
    html: `
        <!DOCTYPE html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <title>Email Verification</title>
            <style>
              /* General Styles */
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                  "Helvetica Neue", Arial, sans-serif;
                background: linear-gradient(to bottom right, #f9fafb, #f3f4f6);
                min-height: 100vh;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                gap: 3rem;
                padding: 1rem;
              }

              /* Card Container */
              .card {
                max-width: 28rem;
                width: 100%;
                background: white;
                border-radius: 0.5rem;
                box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
                padding: 2rem;
                text-align: center;
              }

              .card h1 {
                font-size: 2rem;
                font-weight: 700;
                color: #1f2937;
                margin-bottom: 1.5rem;
              }

              .card p {
                font-size: 1rem;
                color: #4b5563;
                margin-bottom: 2rem;
              }

              .card a {
                display: inline-block;
                width: 100%;
                background: #1f2937;
                color: white;
                font-weight: 600;
                padding: 0.75rem 0rem;
                border-radius: 0.5rem;
                text-decoration: none;
                transition: background 0.3s ease;
              }

              .card a:hover {
                background: #374151;
              }

              /* Animation */
              @keyframes fade-up {
                0% {
                  opacity: 0;
                  transform: translateY(20px);
                }
                100% {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            </style>
          </head>
          <body>
            <!-- Card -->
            <div class="card">
              <h1>Verifikasi Email</h1>
              <p>
                Klik tombol di bawah ini untuk memverifikasi email Anda:
              </p>
              <a href="${verificationUrl}">Verifikasi Email</a>
            </div>
          </body>
        </html>
      `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };