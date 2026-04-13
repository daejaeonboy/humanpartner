"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBookingRequestNotification = exports.sendEmailVerification = exports.userManagementApi = exports.sitemapXml = void 0;
const admin = require("firebase-admin");
const cors = require("cors");
const dotenv = require("dotenv");
const functions = require("firebase-functions");
const https = require("https");
if (!admin.apps.length) {
    admin.initializeApp();
}
const corsHandler = cors({ origin: true });
dotenv.config();
const SITE_URL = "https://miceday.co.kr";
const SUPABASE_REST_URL = "https://zwxvjlnzhjmsuwjnwvqv.supabase.co/rest/v1";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eHZqbG56aGptc3V3am53dnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODcwNjIsImV4cCI6MjA4NTE2MzA2Mn0.GA0nRGSMr9XxXHc1VhpSeSB2hnaZknO2ojedpsTWrw4";
const normalizeEnvValue = (value) => {
    if (!value) {
        return "";
    }
    return value.trim().replace(/^['"]|['"]$/g, "");
};
const xmlEscape = (value) => value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
const getErrorMessage = (error) => error instanceof Error ? error.message : "Unknown error";
const toSitemapDate = (...values) => {
    for (const value of values) {
        if (!value) {
            continue;
        }
        const date = new Date(value);
        if (!Number.isNaN(date.getTime())) {
            return date.toISOString().slice(0, 10);
        }
    }
    return null;
};
const getOptionalText = (value) => typeof value === "string" && value.trim().length > 0 ? value.trim() : "";
const getNumericValue = (value) => {
    if (typeof value === "number" && Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" && value.trim()) {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }
    return null;
};
const formatCurrency = (value) => `${value.toLocaleString("ko-KR")}원`;
const getSupabaseHeaders = (extraHeaders = {}) => (Object.assign({ apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}`, "Content-Type": "application/json" }, extraHeaders));
const getResendEnvironment = () => {
    const apiKey = normalizeEnvValue(process.env.RESEND_API_KEY);
    const fromEmail = normalizeEnvValue(process.env.RESEND_FROM_EMAIL);
    const fromName = normalizeEnvValue(process.env.RESEND_FROM_NAME) || "행사어때";
    const replyTo = normalizeEnvValue(process.env.RESEND_REPLY_TO);
    if (!apiKey || !fromEmail) {
        throw new Error("Missing Resend configuration");
    }
    return {
        apiKey,
        fromEmail,
        fromName,
        replyTo,
    };
};
const sendHtmlEmail = async ({ to, subject, html }) => {
    const env = getResendEnvironment();
    const response = await requestJson("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.apiKey}`,
            "Content-Type": "application/json",
        },
        body: Object.assign({ from: `"${env.fromName}" <${env.fromEmail}>`, to: Array.isArray(to) ? to : [to], subject,
            html }, (env.replyTo ? { reply_to: env.replyTo } : {})),
    });
    return {
        id: (response === null || response === void 0 ? void 0 : response.id) || null,
        provider: "resend",
    };
};
const getEnvBookingAlertRecipients = () => Array.from(new Set(normalizeEnvValue(process.env.BOOKING_ALERT_RECIPIENTS)
    .split(/[;,]/)
    .map((value) => value.trim())
    .filter(Boolean)));
const loadBookingEmailRuntimeConfig = async () => {
    var _a, _b;
    const envRecipients = getEnvBookingAlertRecipients();
    try {
        const [settingsRows, recipientRows] = await Promise.all([
            requestJson(`${SUPABASE_REST_URL}/booking_email_settings?select=notifications_enabled&id=eq.default`, { headers: getSupabaseHeaders() }),
            requestJson(`${SUPABASE_REST_URL}/booking_email_recipients?select=email&is_active=eq.true&order=created_at.asc`, { headers: getSupabaseHeaders() }),
        ]);
        return {
            notificationsEnabled: (_b = (_a = settingsRows === null || settingsRows === void 0 ? void 0 : settingsRows[0]) === null || _a === void 0 ? void 0 : _a.notifications_enabled) !== null && _b !== void 0 ? _b : true,
            recipients: (recipientRows || []).map((row) => row.email || "").filter(Boolean),
        };
    }
    catch (error) {
        if (envRecipients.length > 0) {
            console.warn("Falling back to BOOKING_ALERT_RECIPIENTS because booking email settings could not be loaded.", error);
            return {
                notificationsEnabled: true,
                recipients: envRecipients,
            };
        }
        throw error;
    }
};
const getBearerToken = (authorizationHeader) => {
    if (!authorizationHeader) {
        return "";
    }
    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : "";
};
const normalizeUserManagementPath = (pathValue) => {
    const withoutQuery = pathValue.split("?")[0] || "/";
    const normalized = withoutQuery.replace(/^\/?api\/users/, "");
    return normalized || "/";
};
const getUserProfileAdminRow = async (firebaseUid) => {
    const rows = await requestJson(`${SUPABASE_REST_URL}/user_profiles?select=firebase_uid,is_admin&firebase_uid=eq.${encodeURIComponent(firebaseUid)}&limit=1`, { headers: getSupabaseHeaders() });
    return (rows === null || rows === void 0 ? void 0 : rows[0]) || null;
};
const verifyUserManagementRequest = async (req) => {
    const bearerToken = getBearerToken(req.headers.authorization);
    if (!bearerToken) {
        throw new Error("Missing authorization token");
    }
    const decodedToken = await admin.auth().verifyIdToken(bearerToken);
    const profile = await getUserProfileAdminRow(decodedToken.uid);
    return {
        decodedToken,
        isAdmin: (profile === null || profile === void 0 ? void 0 : profile.is_admin) === true,
    };
};
const sanitizeBookingItems = (value) => {
    if (!Array.isArray(value)) {
        return [];
    }
    return value.reduce((accumulator, item) => {
        if (!item || typeof item !== "object") {
            return accumulator;
        }
        const source = item;
        const name = getOptionalText(source.name);
        const quantity = getNumericValue(source.quantity);
        if (!name || quantity === null || quantity <= 0) {
            return accumulator;
        }
        const normalizedItem = {
            name,
            quantity,
        };
        const price = getNumericValue(source.price);
        if (price !== null) {
            normalizedItem.price = price;
        }
        const modelName = getOptionalText(source.model_name);
        if (modelName) {
            normalizedItem.model_name = modelName;
        }
        accumulator.push(normalizedItem);
        return accumulator;
    }, []);
};
const renderBookingItems = (items, showSubtotal) => {
    if (items.length === 0) {
        return '<p style="margin:0;color:#94a3b8;font-size:13px;">선택된 항목이 없습니다.</p>';
    }
    return `
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
            ${items
        .map((item) => {
        const modelName = item.model_name ? ` (${xmlEscape(item.model_name)})` : "";
        const quantityText = `${item.quantity}개`;
        const subtotalText = showSubtotal && typeof item.price === "number"
            ? ` · ${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.price * item.quantity)}`
            : ` · ${quantityText}`;
        return `<li style="margin-bottom:6px;"><strong>${xmlEscape(item.name)}</strong>${modelName}${subtotalText}</li>`;
    })
        .join("")}
        </ul>
    `;
};
const buildBookingRequestEmailHtml = (payload) => {
    const companyName = payload.companyName || "(미기재)";
    const phone = payload.phone || "(미기재)";
    const userEmail = payload.userEmail || "(미기재)";
    const adminUrl = `${SITE_URL}/admin/bookings`;
    return `
        <div style="font-family:Arial,sans-serif;max-width:720px;margin:0 auto;padding:24px;background:#f8fafc;color:#0f172a;">
            <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:18px;overflow:hidden;">
                <div style="padding:24px 24px 18px;background:linear-gradient(135deg,#39B54A 0%,#2F9A3F 100%);color:#ffffff;">
                    <p style="margin:0 0 8px;font-size:13px;opacity:0.9;">행사어때 관리자 알림</p>
                    <h1 style="margin:0;font-size:24px;line-height:1.4;">신규 예약 요청이 접수되었습니다.</h1>
                </div>
                <div style="padding:24px;">
                    <table style="width:100%;border-collapse:collapse;font-size:14px;line-height:1.7;">
                        <tbody>
                            <tr>
                                <td style="width:140px;padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">예약번호</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;"><strong>${xmlEscape(payload.bookingId)}</strong></td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">상품명</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;"><strong>${xmlEscape(payload.productName)}</strong></td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">예약자명</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${xmlEscape(payload.requesterName)}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">회사/기관명</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${xmlEscape(companyName)}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">연락처</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${xmlEscape(phone)}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">이메일</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${xmlEscape(userEmail)}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;border-bottom:1px solid #e2e8f0;">대여 기간</td>
                                <td style="padding:10px 0;border-bottom:1px solid #e2e8f0;">${xmlEscape(payload.startDate)} ~ ${xmlEscape(payload.endDate)}</td>
                            </tr>
                            <tr>
                                <td style="padding:10px 0;color:#64748b;">예상 견적 비용</td>
                                <td style="padding:10px 0;"><strong style="font-size:18px;color:#39B54A;">${formatCurrency(payload.totalPrice)}</strong></td>
                            </tr>
                        </tbody>
                    </table>

                    <div style="margin-top:28px;padding:20px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;">
                        <h2 style="margin:0 0 14px;font-size:16px;">기본 구성 품목</h2>
                        ${renderBookingItems(payload.basicComponents || [], false)}
                    </div>

                    <div style="margin-top:16px;padding:20px;border:1px solid #e2e8f0;border-radius:14px;background:#f8fafc;">
                        <h2 style="margin:0 0 14px;font-size:16px;">추가 선택 옵션</h2>
                        ${renderBookingItems(payload.selectedOptions || [], true)}
                    </div>

                    <div style="margin-top:28px;text-align:center;">
                        <a href="${adminUrl}" style="display:inline-block;padding:14px 22px;border-radius:10px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;">
                            관리자 예약 목록 바로가기
                        </a>
                    </div>
                </div>
            </div>
        </div>
    `;
};
const requestJson = (url, { method = "GET", headers = {}, body, } = {}) => new Promise((resolve, reject) => {
    const request = https.request(url, { method, headers }, (response) => {
        let rawData = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
            rawData += chunk;
        });
        response.on("end", () => {
            const statusCode = response.statusCode || 500;
            if (statusCode >= 400) {
                reject(new Error(`Request failed with status ${statusCode}: ${rawData}`));
                return;
            }
            if (!rawData.trim()) {
                resolve(undefined);
                return;
            }
            try {
                resolve(JSON.parse(rawData));
            }
            catch (error) {
                reject(error);
            }
        });
    });
    if (body !== undefined) {
        request.write(JSON.stringify(body));
    }
    request.end();
    request.on("error", reject);
});
const persistBookingEmailLog = async (payload) => {
    try {
        await requestJson(`${SUPABASE_REST_URL}/booking_email_logs`, {
            method: "POST",
            headers: getSupabaseHeaders({
                Prefer: "return=minimal",
            }),
            body: {
                booking_id: payload.bookingId || null,
                product_name: payload.productName || null,
                requester_email: payload.requesterEmail || null,
                recipient_emails: payload.recipientEmails || [],
                status: payload.status,
                error_message: payload.errorMessage || null,
            },
        });
    }
    catch (error) {
        console.error("Failed to persist booking email log:", error);
    }
};
const sitemapEntry = (loc, changefreq, priority, lastmod) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
exports.sitemapXml = functions.https.onRequest(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
    }
    try {
        const today = new Date().toISOString().slice(0, 10);
        const [products, notices, installationCases, allianceMembers] = await Promise.all([
            requestJson(`${SUPABASE_REST_URL}/products?select=id,created_at&product_type=eq.basic&order=created_at.desc`, { headers: getSupabaseHeaders() }),
            requestJson(`${SUPABASE_REST_URL}/notices?select=id,published_at,updated_at,created_at&is_active=eq.true&order=published_at.desc.nullslast,created_at.desc`, { headers: getSupabaseHeaders() }),
            requestJson(`${SUPABASE_REST_URL}/installation_cases?select=id,published_at,updated_at,created_at&is_active=eq.true&order=published_at.desc.nullslast,created_at.desc`, { headers: getSupabaseHeaders() }),
            requestJson(`${SUPABASE_REST_URL}/alliance_members?select=id,created_at&is_active=eq.true&order=display_order.asc`, { headers: getSupabaseHeaders() }),
        ]);
        const staticEntries = [
            sitemapEntry(`${SITE_URL}/`, "daily", "1.0", today),
            sitemapEntry(`${SITE_URL}/products`, "daily", "0.8", today),
            sitemapEntry(`${SITE_URL}/alliance`, "monthly", "0.7", today),
            sitemapEntry(`${SITE_URL}/cases`, "monthly", "0.6", today),
            sitemapEntry(`${SITE_URL}/notices`, "monthly", "0.6", today),
            sitemapEntry(`${SITE_URL}/cs`, "monthly", "0.6", today),
            sitemapEntry(`${SITE_URL}/terms`, "yearly", "0.3", today),
            sitemapEntry(`${SITE_URL}/privacy`, "yearly", "0.3", today),
        ];
        const productEntries = products
            .filter((product) => Boolean(product.id))
            .map((product) => sitemapEntry(`${SITE_URL}/products/${product.id}`, "weekly", "0.7", toSitemapDate(product.created_at)));
        const noticeEntries = notices
            .filter((notice) => Boolean(notice.id))
            .map((notice) => sitemapEntry(`${SITE_URL}/notices/${notice.id}`, "weekly", "0.7", toSitemapDate(notice.updated_at, notice.published_at, notice.created_at)));
        const installationCaseEntries = installationCases
            .filter((item) => Boolean(item.id))
            .map((item) => sitemapEntry(`${SITE_URL}/cases/${item.id}`, "weekly", "0.7", toSitemapDate(item.updated_at, item.published_at, item.created_at)));
        const allianceEntries = allianceMembers
            .filter((member) => Boolean(member.id))
            .map((member) => sitemapEntry(`${SITE_URL}/alliance/${member.id}`, "monthly", "0.6", toSitemapDate(member.created_at)));
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${[
            ...staticEntries,
            ...productEntries,
            ...noticeEntries,
            ...installationCaseEntries,
            ...allianceEntries,
        ].join("\n")}
</urlset>
`;
        res.set("Content-Type", "application/xml; charset=utf-8");
        res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
        res.status(200).send(xml);
    }
    catch (error) {
        console.error("Failed to generate sitemap.xml", error);
        res.status(500).send("Failed to generate sitemap.xml");
    }
});
exports.userManagementApi = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        const path = normalizeUserManagementPath(req.path || req.url || "/");
        try {
            if (req.method === "PUT" && path === "/update-email") {
                const payload = req.body;
                const firebaseUid = getOptionalText(payload.firebaseUid);
                const newEmail = getOptionalText(payload.newEmail);
                if (!firebaseUid || !newEmail) {
                    res.status(400).json({ error: "firebaseUid와 newEmail이 필요합니다." });
                    return;
                }
                const { decodedToken, isAdmin } = await verifyUserManagementRequest(req);
                if (!isAdmin && decodedToken.uid !== firebaseUid) {
                    res.status(403).json({ error: "본인 또는 관리자만 이메일을 변경할 수 있습니다." });
                    return;
                }
                await admin.auth().updateUser(firebaseUid, { email: newEmail });
                res.status(200).json({
                    success: true,
                    message: "이메일이 변경되었습니다.",
                });
                return;
            }
            if (req.method === "PUT" && path === "/update-password") {
                const payload = req.body;
                const firebaseUid = getOptionalText(payload.firebaseUid);
                const newPassword = getOptionalText(payload.newPassword);
                if (!firebaseUid || !newPassword) {
                    res.status(400).json({ error: "firebaseUid와 newPassword가 필요합니다." });
                    return;
                }
                if (newPassword.length < 6) {
                    res.status(400).json({ error: "비밀번호는 최소 6자 이상이어야 합니다." });
                    return;
                }
                const { decodedToken, isAdmin } = await verifyUserManagementRequest(req);
                if (!isAdmin && decodedToken.uid !== firebaseUid) {
                    res.status(403).json({ error: "본인 또는 관리자만 비밀번호를 변경할 수 있습니다." });
                    return;
                }
                await admin.auth().updateUser(firebaseUid, { password: newPassword });
                res.status(200).json({
                    success: true,
                    message: "비밀번호가 변경되었습니다.",
                });
                return;
            }
            const uidMatch = path.match(/^\/([^/]+)$/);
            if (uidMatch) {
                const firebaseUid = uidMatch[1];
                const { decodedToken, isAdmin } = await verifyUserManagementRequest(req);
                const isSelf = decodedToken.uid === firebaseUid;
                if (req.method === "GET") {
                    if (!isAdmin && !isSelf) {
                        res.status(403).json({ error: "본인 또는 관리자만 조회할 수 있습니다." });
                        return;
                    }
                    const userRecord = await admin.auth().getUser(firebaseUid);
                    res.status(200).json({
                        uid: userRecord.uid,
                        email: userRecord.email || "",
                        displayName: userRecord.displayName || "",
                        disabled: userRecord.disabled,
                        emailVerified: userRecord.emailVerified,
                        providers: userRecord.providerData.map((provider) => provider.providerId).filter(Boolean),
                    });
                    return;
                }
                if (req.method === "DELETE") {
                    if (!isAdmin) {
                        res.status(403).json({ error: "관리자만 삭제할 수 있습니다." });
                        return;
                    }
                    await admin.auth().deleteUser(firebaseUid);
                    console.log("Firebase user deleted by uid:", { requesterUid: decodedToken.uid, firebaseUid });
                    res.status(200).json({
                        success: true,
                        message: "Firebase 계정이 삭제되었습니다.",
                    });
                    return;
                }
            }
            res.status(404).json({ error: "지원하지 않는 사용자 관리 경로입니다." });
        }
        catch (error) {
            console.error("User management API failed:", error);
            if (error instanceof Error) {
                if (error.message === "Missing authorization token") {
                    res.status(401).json({ error: "인증 토큰이 필요합니다." });
                    return;
                }
                if (error.code === "auth/user-not-found") {
                    res.status(404).json({ error: "해당 Firebase 계정을 찾을 수 없습니다." });
                    return;
                }
            }
            res.status(500).json({ error: getErrorMessage(error) });
        }
    });
});
exports.sendEmailVerification = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const { to, subject, html } = req.body;
        if (typeof to !== "string" ||
            typeof subject !== "string" ||
            typeof html !== "string" ||
            !to ||
            !subject ||
            !html) {
            res.status(400).json({ error: "Missing required fields (to, subject, html)" });
            return;
        }
        try {
            const info = await sendHtmlEmail({ to, subject, html });
            console.log("Email sent successfully:", info);
            res.status(200).json({ message: "Email sent successfully", info });
        }
        catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ error: "Failed to send email", details: getErrorMessage(error) });
        }
    });
});
exports.sendBookingRequestNotification = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }
        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }
        const bearerToken = getBearerToken(req.headers.authorization);
        if (!bearerToken) {
            res.status(401).json({ error: "Missing authorization token" });
            return;
        }
        try {
            let decodedToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(bearerToken);
            }
            catch (error) {
                console.error("Invalid booking notification token:", error);
                res.status(401).json({ error: "Invalid authorization token" });
                return;
            }
            const payload = req.body;
            const bookingId = getOptionalText(payload.bookingId);
            const productName = getOptionalText(payload.productName);
            const requesterName = getOptionalText(payload.requesterName);
            const startDate = getOptionalText(payload.startDate);
            const endDate = getOptionalText(payload.endDate);
            const totalPrice = getNumericValue(payload.totalPrice);
            if (!bookingId || !productName || !requesterName || !startDate || !endDate || totalPrice === null) {
                res.status(400).json({
                    error: "Missing required fields (bookingId, productName, requesterName, startDate, endDate, totalPrice)",
                });
                return;
            }
            const notificationPayload = {
                bookingId,
                productName,
                requesterName,
                companyName: getOptionalText(payload.companyName),
                phone: getOptionalText(payload.phone),
                userEmail: decodedToken.email || getOptionalText(payload.userEmail),
                startDate,
                endDate,
                totalPrice,
                basicComponents: sanitizeBookingItems(payload.basicComponents),
                selectedOptions: sanitizeBookingItems(payload.selectedOptions),
            };
            const runtimeConfig = await loadBookingEmailRuntimeConfig();
            if (!runtimeConfig.notificationsEnabled) {
                await persistBookingEmailLog({
                    bookingId: notificationPayload.bookingId,
                    productName: notificationPayload.productName,
                    requesterEmail: notificationPayload.userEmail,
                    status: "skipped",
                    errorMessage: "관리자 메일 알림이 비활성화되어 있습니다.",
                });
                res.status(200).json({
                    message: "Booking notification skipped because notifications are disabled",
                    skipped: true,
                });
                return;
            }
            if (runtimeConfig.recipients.length === 0) {
                await persistBookingEmailLog({
                    bookingId: notificationPayload.bookingId,
                    productName: notificationPayload.productName,
                    requesterEmail: notificationPayload.userEmail,
                    status: "failed",
                    errorMessage: "수신 이메일이 설정되지 않았습니다.",
                });
                res.status(500).json({ error: "Missing booking alert recipients" });
                return;
            }
            const info = await sendHtmlEmail({
                to: runtimeConfig.recipients,
                subject: `[행사어때] 신규 예약 요청 - ${notificationPayload.productName}`,
                html: buildBookingRequestEmailHtml(notificationPayload),
            });
            await persistBookingEmailLog({
                bookingId: notificationPayload.bookingId,
                productName: notificationPayload.productName,
                requesterEmail: notificationPayload.userEmail,
                recipientEmails: runtimeConfig.recipients,
                status: "sent",
            });
            console.log("Booking request email sent successfully:", {
                bookingId: notificationPayload.bookingId,
                recipients: runtimeConfig.recipients,
                requesterUid: decodedToken.uid,
                emailId: info.id,
            });
            res.status(200).json({
                message: "Booking notification email sent successfully",
                recipientCount: runtimeConfig.recipients.length,
            });
        }
        catch (error) {
            console.error("Error sending booking notification email:", error);
            const payload = req.body;
            await persistBookingEmailLog({
                bookingId: getOptionalText(payload.bookingId),
                productName: getOptionalText(payload.productName),
                requesterEmail: getOptionalText(payload.userEmail),
                status: "failed",
                errorMessage: getErrorMessage(error),
            });
            res.status(500).json({ error: "Failed to send booking notification email", details: getErrorMessage(error) });
        }
    });
});
//# sourceMappingURL=index.js.map