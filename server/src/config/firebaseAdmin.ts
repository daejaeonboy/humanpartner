import * as admin from 'firebase-admin';
import dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Firebase Admin SDK 초기화
if (!admin.apps.length) {
    try {
        // 방법 1: 서비스 계정 JSON 파일 사용
        const serviceAccountPath = path.join(__dirname, '../../serviceAccountKey.json');
        if (fs.existsSync(serviceAccountPath)) {
            const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf-8'));
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('[Firebase Admin] 서비스 계정 파일로 초기화됨');
        }
        // 방법 2: 환경변수에서 서비스 계정 정보
        else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
            const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
            admin.initializeApp({
                credential: admin.credential.cert(serviceAccount)
            });
            console.log('[Firebase Admin] 환경변수(JSON)로 초기화됨');
        }
        // 방법 3: 개별 환경변수
        else if (process.env.FIREBASE_PROJECT_ID) {
            admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: process.env.FIREBASE_PROJECT_ID,
                    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
                    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
                })
            });
            console.log('[Firebase Admin] 개별 환경변수로 초기화됨');
        }
        // 기본 자격증명
        else {
            admin.initializeApp();
            console.log('[Firebase Admin] 기본 자격증명으로 초기화됨');
        }
    } catch (error) {
        console.error('[Firebase Admin] 초기화 실패:', error);
    }
}

export const firebaseAdmin = admin;
export const auth = admin.auth();

