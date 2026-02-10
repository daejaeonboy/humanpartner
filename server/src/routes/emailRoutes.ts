import express, { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// SMTP 전송 객체 생성
// 실제 운영 시에는 환경 변수로 관리해야 함 (process.env.EMAIL_USER, process.env.EMAIL_PASS)
const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // 기본값 Gmail
    auth: {
        user: process.env.EMAIL_USER, // 발신자 이메일
        pass: process.env.EMAIL_PASS  // 발신자 앱 비밀번호
    }
});

router.post('/send', async (req: Request, res: Response) => {
    const { to, subject, html } = req.body;

    if (!to || !subject || !html) {
        res.status(400).json({ error: '필수 파라미터가 누락되었습니다. (to, subject, html)' });
        return;
    }

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject,
        html
    };

    try {
        console.log(`Sending email to ${to}...`);

        // SMTP 설정이 없는 경우 (테스트 모드)
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.log('================================================');
            console.log('[MOCK EMAIL SENDER]');
            console.log(`To: ${to}`);
            console.log(`Subject: ${subject}`);
            console.log(`HTML: ${html}`);
            console.log('Environment variables EMAIL_USER or EMAIL_PASS not set.');
            console.log('================================================');
            res.status(200).json({ message: 'Email logged to console (Mock mode)', success: true });
            return;
        }

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent: ' + info.response);
        res.status(200).json({ message: 'Email sent successfully', info });
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

export default router;
