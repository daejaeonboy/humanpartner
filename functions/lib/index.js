"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmailVerification = void 0;
const functions = require("firebase-functions");
const nodemailer = require("nodemailer");
const cors = require("cors");
const dotenv = require("dotenv");
const corsHandler = cors({ origin: true });
dotenv.config();
// 이메일 발송을 위한 Transporter 생성
// Firebase Functions (.env 사용)
const normalizeEnvValue = (value) => {
    if (!value) {
        return "";
    }
    return value.trim().replace(/^['"]|['"]$/g, "");
};
exports.sendEmailVerification = functions.https.onRequest((req, res) => {
    // CORS 처리
    corsHandler(req, res, async () => {
        // POST 요청만 허용
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const { to, subject, html } = req.body;
        if (!to || !subject || !html) {
            res.status(400).json({ error: "Missing required fields (to, subject, html)" });
            return;
        }
        // 설정 확인
        const emailUser = normalizeEnvValue(process.env.EMAIL_USER);
        const emailPass = normalizeEnvValue(process.env.EMAIL_PASS);
        const emailFromName = normalizeEnvValue(process.env.EMAIL_FROM_NAME) || "휴먼파트너";
        // 커스텀 SMTP 설정 (옵션)
        const smtpHost = normalizeEnvValue(process.env.SMTP_HOST);
        const smtpPort = parseInt(normalizeEnvValue(process.env.SMTP_PORT) || "587", 10);
        const smtpSecure = normalizeEnvValue(process.env.SMTP_SECURE) === "true";
        if (!emailUser || !emailPass) {
            console.error("Missing SMTP credentials. Check EMAIL_USER/EMAIL_PASS.");
            res.status(500).json({ error: "Missing SMTP credentials" });
            return;
        }
        let transporterConfig;
        // SMTP 호스트가 설정되어 있으면 해당 설정 사용, 아니면 Gmail 서비스 사용
        if (smtpHost) {
            transporterConfig = {
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure, // true for 465, false for other ports
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            };
        }
        else {
            transporterConfig = {
                service: "gmail",
                auth: {
                    user: emailUser,
                    pass: emailPass,
                },
            };
        }
        const transporter = nodemailer.createTransport(transporterConfig);
        const mailOptions = {
            from: `"${emailFromName}" <${emailUser}>`,
            to,
            subject,
            html,
        };
        try {
            const info = await transporter.sendMail(mailOptions);
            console.log("Email sent successfully:", info.response);
            res.status(200).json({ message: "Email sent successfully", info });
        }
        catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ error: "Failed to send email", details: error.message });
        }
    });
});
//# sourceMappingURL=index.js.map