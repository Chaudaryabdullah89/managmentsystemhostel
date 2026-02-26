import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || "info@hms.com",
        pass: process.env.EMAIL_PASS || "tqit ydjx xjjq tmib",
    },
});

export default transporter;