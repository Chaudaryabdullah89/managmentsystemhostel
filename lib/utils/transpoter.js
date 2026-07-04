import nodemailer from "nodemailer";
import { prisma } from "@/lib/prisma";

let cachedTransporter = null;
let cachedConfigHash = "";

function getConfigHash(config) {
    return `${config.host}:${config.port}:${config.secure}:${config.auth.user}:${config.auth.pass}`;
}

async function getDynamicTransporter(hostelId = null) {
    let host = process.env.EMAIL_HOST || "smtp.gmail.com";
    let port = Number(process.env.EMAIL_PORT) || 587;
    let secure = process.env.EMAIL_SECURE === "true";
    let user = process.env.EMAIL_USER || "";
    let pass = process.env.EMAIL_PASS || "";

    // 1. If hostelId is provided, try loading hostel-specific SMTP config
    if (hostelId) {
        try {
            const hostel = await prisma.hostel.findUnique({
                where: { id: hostelId },
                select: {
                    smtpHost: true,
                    smtpPort: true,
                    smtpSecure: true,
                    smtpUser: true,
                    smtpPass: true,
                }
            });

            if (hostel && hostel.smtpHost && hostel.smtpUser) {
                host = hostel.smtpHost;
                if (hostel.smtpPort !== null && hostel.smtpPort !== undefined) port = Number(hostel.smtpPort);
                if (hostel.smtpSecure !== null && hostel.smtpSecure !== undefined) secure = hostel.smtpSecure;
                user = hostel.smtpUser;
                pass = hostel.smtpPass || "";

                const config = { host, port, secure, auth: { user, pass } };
                const hash = `hostel:${hostelId}:${getConfigHash(config)}`;
                if (cachedTransporter && cachedConfigHash === hash) {
                    return cachedTransporter;
                }
                console.log(` 🔄 [Mailer] Re-creating Hostel SMTP Transporter for hostelId=${hostelId}`);
                const trans = nodemailer.createTransport(config);
                cachedTransporter = trans;
                cachedConfigHash = hash;
                return trans;
            }
        } catch (e) {
            console.warn(`[Mailer] Failed to load SMTP config for hostelId=${hostelId}, falling back:`, e.message);
        }
    }

    // 2. Global DB / Env fallback
    try {
        const settings = await prisma.systemSettings.findUnique({
            where: { id: "global" },
            select: {
                smtpHost: true,
                smtpPort: true,
                smtpSecure: true,
                smtpUser: true,
                smtpPass: true,
            }
        });

        if (settings) {
            if (settings.smtpHost) host = settings.smtpHost;
            if (settings.smtpPort !== null && settings.smtpPort !== undefined) port = Number(settings.smtpPort);
            if (settings.smtpSecure !== null && settings.smtpSecure !== undefined) secure = settings.smtpSecure;
            if (settings.smtpUser) user = settings.smtpUser;
            if (settings.smtpPass) pass = settings.smtpPass;
        }
    } catch (e) {
        console.warn("[Mailer] Failed to load SMTP config from database, falling back to environment variables:", e.message);
    }

    const config = {
        host,
        port,
        secure,
        auth: { user, pass },
    };

    const hash = `global:${getConfigHash(config)}`;
    if (cachedTransporter && cachedConfigHash === hash) {
        return cachedTransporter;
    }

    console.log(` 🔄 [Mailer] Re-creating Global SMTP Transporter for host=${host}, port=${port}, secure=${secure}, user=${user ? user.slice(0, 3) + "***" : "none"}`);
    cachedTransporter = nodemailer.createTransport(config);
    cachedConfigHash = hash;
    return cachedTransporter;
}

const transporter = {
    async sendMail(mailOptions) {
        const activeTransporter = await getDynamicTransporter(mailOptions.hostelId);
        const nodemailerOptions = { ...mailOptions };
        delete nodemailerOptions.hostelId;
        return await activeTransporter.sendMail(nodemailerOptions);
    },
    async verify(hostelId = null) {
        const activeTransporter = await getDynamicTransporter(hostelId);
        return await activeTransporter.verify();
    }
};

export default transporter;