import * as admin from "firebase-admin";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import * as https from "https";

if (!admin.apps.length) {
    admin.initializeApp();
}

const corsHandler = cors({ origin: true });
dotenv.config();

const SITE_URL = "https://miceday.co.kr";
const SUPABASE_REST_URL = "https://zwxvjlnzhjmsuwjnwvqv.supabase.co/rest/v1";
const SUPABASE_ANON_KEY =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp3eHZqbG56aGptc3V3am53dnF2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk1ODcwNjIsImV4cCI6MjA4NTE2MzA2Mn0.GA0nRGSMr9XxXHc1VhpSeSB2hnaZknO2ojedpsTWrw4";

const normalizeEnvValue = (value?: string) => {
    if (!value) {
        return "";
    }
    return value.trim().replace(/^['"]|['"]$/g, "");
};

type ResendEnvironment = {
    apiKey: string;
    fromEmail: string;
    fromName: string;
    replyTo: string;
};

type MailPayload = {
    to: string | string[];
    subject: string;
    html: string;
};

type SitemapProduct = {
    id: string;
    created_at?: string | null;
};

type SitemapContentEntry = {
    id: string;
    created_at?: string | null;
    updated_at?: string | null;
    published_at?: string | null;
};

type SitemapAllianceMember = {
    id: string;
    created_at?: string | null;
};

type BookingEmailItem = {
    name: string;
    quantity: number;
    price?: number;
    model_name?: string;
};

type BookingNotificationRequest = {
    bookingId: string;
    productName: string;
    requesterName: string;
    companyName?: string;
    phone?: string;
    userEmail?: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    basicComponents?: BookingEmailItem[];
    selectedOptions?: BookingEmailItem[];
};

type SupabaseBookingEmailSettingsRow = {
    notifications_enabled?: boolean | null;
};

type SupabaseBookingEmailRecipientRow = {
    email?: string | null;
};

type BookingEmailLogStatus = "sent" | "failed" | "skipped";

type BookingEmailLogPayload = {
    bookingId?: string;
    productName?: string;
    requesterEmail?: string;
    recipientEmails?: string[];
    status: BookingEmailLogStatus;
    errorMessage?: string;
};

const xmlEscape = (value: string) =>
    value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&apos;");

const getErrorMessage = (error: unknown) =>
    error instanceof Error ? error.message : "Unknown error";

const toSitemapDate = (...values: Array<string | null | undefined>) => {
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

const getOptionalText = (value: unknown) =>
    typeof value === "string" && value.trim().length > 0 ? value.trim() : "";

const getNumericValue = (value: unknown) => {
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

const formatCurrency = (value: number) => `${value.toLocaleString("ko-KR")}원`;
const getSupabaseHeaders = (extraHeaders: Record<string, string> = {}) => ({
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    "Content-Type": "application/json",
    ...extraHeaders,
});

const getResendEnvironment = (): ResendEnvironment => {
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

const sendHtmlEmail = async ({ to, subject, html }: MailPayload) => {
    const env = getResendEnvironment();
    const response = await requestJson<{ id?: string }>("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${env.apiKey}`,
            "Content-Type": "application/json",
        },
        body: {
            from: `"${env.fromName}" <${env.fromEmail}>`,
            to: Array.isArray(to) ? to : [to],
            subject,
            html,
            ...(env.replyTo ? { reply_to: env.replyTo } : {}),
        },
    });

    return {
        id: response?.id || null,
        provider: "resend",
    };
};

const getEnvBookingAlertRecipients = () =>
    Array.from(
        new Set(
            normalizeEnvValue(process.env.BOOKING_ALERT_RECIPIENTS)
                .split(/[;,]/)
                .map((value) => value.trim())
                .filter(Boolean)
        )
    );

const loadBookingEmailRuntimeConfig = async () => {
    const envRecipients = getEnvBookingAlertRecipients();

    try {
        const [settingsRows, recipientRows] = await Promise.all([
            requestJson<SupabaseBookingEmailSettingsRow[]>(
                `${SUPABASE_REST_URL}/booking_email_settings?select=notifications_enabled&id=eq.default`,
                { headers: getSupabaseHeaders() }
            ),
            requestJson<SupabaseBookingEmailRecipientRow[]>(
                `${SUPABASE_REST_URL}/booking_email_recipients?select=email&is_active=eq.true&order=created_at.asc`,
                { headers: getSupabaseHeaders() }
            ),
        ]);

        return {
            notificationsEnabled: settingsRows?.[0]?.notifications_enabled ?? true,
            recipients: (recipientRows || []).map((row) => row.email || "").filter(Boolean),
        };
    } catch (error) {
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

const getBearerToken = (authorizationHeader?: string) => {
    if (!authorizationHeader) {
        return "";
    }

    const match = authorizationHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : "";
};

const sanitizeBookingItems = (value: unknown): BookingEmailItem[] => {
    if (!Array.isArray(value)) {
        return [];
    }

    return value.reduce<BookingEmailItem[]>((accumulator, item) => {
        if (!item || typeof item !== "object") {
            return accumulator;
        }

        const source = item as Record<string, unknown>;
        const name = getOptionalText(source.name);
        const quantity = getNumericValue(source.quantity);

        if (!name || quantity === null || quantity <= 0) {
            return accumulator;
        }

        const normalizedItem: BookingEmailItem = {
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

const renderBookingItems = (items: BookingEmailItem[], showSubtotal: boolean) => {
    if (items.length === 0) {
        return '<p style="margin:0;color:#94a3b8;font-size:13px;">선택된 항목이 없습니다.</p>';
    }

    return `
        <ul style="margin:0;padding-left:18px;color:#334155;font-size:14px;line-height:1.7;">
            ${items
                .map((item) => {
                    const modelName = item.model_name ? ` (${xmlEscape(item.model_name)})` : "";
                    const quantityText = `${item.quantity}개`;
                    const subtotalText =
                        showSubtotal && typeof item.price === "number"
                            ? ` · ${formatCurrency(item.price)} x ${item.quantity} = ${formatCurrency(item.price * item.quantity)}`
                            : ` · ${quantityText}`;

                    return `<li style="margin-bottom:6px;"><strong>${xmlEscape(item.name)}</strong>${modelName}${subtotalText}</li>`;
                })
                .join("")}
        </ul>
    `;
};

const buildBookingRequestEmailHtml = (payload: BookingNotificationRequest) => {
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

const requestJson = <T>(
    url: string,
    {
        method = "GET",
        headers = {},
        body,
    }: {
        method?: string;
        headers?: Record<string, string>;
        body?: unknown;
    } = {}
): Promise<T> =>
    new Promise((resolve, reject) => {
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
                    resolve(undefined as T);
                    return;
                }

                try {
                    resolve(JSON.parse(rawData) as T);
                } catch (error) {
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

const persistBookingEmailLog = async (payload: BookingEmailLogPayload) => {
    try {
        await requestJson(
            `${SUPABASE_REST_URL}/booking_email_logs`,
            {
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
            }
        );
    } catch (error) {
        console.error("Failed to persist booking email log:", error);
    }
};

const sitemapEntry = (
    loc: string,
    changefreq: string,
    priority: string,
    lastmod?: string | null
) => `  <url>
    <loc>${xmlEscape(loc)}</loc>
${lastmod ? `    <lastmod>${lastmod}</lastmod>\n` : ""}    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;

export const sitemapXml = functions.https.onRequest(async (req, res) => {
    if (req.method !== "GET") {
        res.status(405).send("Method Not Allowed");
        return;
    }

    try {
        const today = new Date().toISOString().slice(0, 10);
        const [products, notices, installationCases, allianceMembers] = await Promise.all([
            requestJson<SitemapProduct[]>(
                `${SUPABASE_REST_URL}/products?select=id,created_at&product_type=eq.basic&order=created_at.desc`,
                { headers: getSupabaseHeaders() }
            ),
            requestJson<SitemapContentEntry[]>(
                `${SUPABASE_REST_URL}/notices?select=id,published_at,updated_at,created_at&is_active=eq.true&order=published_at.desc.nullslast,created_at.desc`,
                { headers: getSupabaseHeaders() }
            ),
            requestJson<SitemapContentEntry[]>(
                `${SUPABASE_REST_URL}/installation_cases?select=id,published_at,updated_at,created_at&is_active=eq.true&order=published_at.desc.nullslast,created_at.desc`,
                { headers: getSupabaseHeaders() }
            ),
            requestJson<SitemapAllianceMember[]>(
                `${SUPABASE_REST_URL}/alliance_members?select=id,created_at&is_active=eq.true&order=display_order.asc`,
                { headers: getSupabaseHeaders() }
            ),
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
            .map((product) =>
                sitemapEntry(
                    `${SITE_URL}/products/${product.id}`,
                    "weekly",
                    "0.7",
                    toSitemapDate(product.created_at)
                )
            );

        const noticeEntries = notices
            .filter((notice) => Boolean(notice.id))
            .map((notice) =>
                sitemapEntry(
                    `${SITE_URL}/notices/${notice.id}`,
                    "weekly",
                    "0.7",
                    toSitemapDate(notice.updated_at, notice.published_at, notice.created_at)
                )
            );

        const installationCaseEntries = installationCases
            .filter((item) => Boolean(item.id))
            .map((item) =>
                sitemapEntry(
                    `${SITE_URL}/cases/${item.id}`,
                    "weekly",
                    "0.7",
                    toSitemapDate(item.updated_at, item.published_at, item.created_at)
                )
            );

        const allianceEntries = allianceMembers
            .filter((member) => Boolean(member.id))
            .map((member) =>
                sitemapEntry(
                    `${SITE_URL}/alliance/${member.id}`,
                    "monthly",
                    "0.6",
                    toSitemapDate(member.created_at)
                )
            );

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
    } catch (error) {
        console.error("Failed to generate sitemap.xml", error);
        res.status(500).send("Failed to generate sitemap.xml");
    }
});

export const sendEmailVerification = functions.https.onRequest((req, res) => {
    corsHandler(req, res, async () => {
        if (req.method === "OPTIONS") {
            res.status(204).send("");
            return;
        }

        if (req.method !== "POST") {
            res.status(405).send("Method Not Allowed");
            return;
        }

        const { to, subject, html } = req.body as Record<string, unknown>;

        if (
            typeof to !== "string" ||
            typeof subject !== "string" ||
            typeof html !== "string" ||
            !to ||
            !subject ||
            !html
        ) {
            res.status(400).json({ error: "Missing required fields (to, subject, html)" });
            return;
        }

        try {
            const info = await sendHtmlEmail({ to, subject, html });
            console.log("Email sent successfully:", info);
            res.status(200).json({ message: "Email sent successfully", info });
        } catch (error) {
            console.error("Error sending email:", error);
            res.status(500).json({ error: "Failed to send email", details: getErrorMessage(error) });
        }
    });
});

export const sendBookingRequestNotification = functions.https.onRequest((req, res) => {
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
            let decodedToken: admin.auth.DecodedIdToken;
            try {
                decodedToken = await admin.auth().verifyIdToken(bearerToken);
            } catch (error) {
                console.error("Invalid booking notification token:", error);
                res.status(401).json({ error: "Invalid authorization token" });
                return;
            }

            const payload = req.body as Record<string, unknown>;
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

            const notificationPayload: BookingNotificationRequest = {
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
        } catch (error) {
            console.error("Error sending booking notification email:", error);
            const payload = req.body as Record<string, unknown>;
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
