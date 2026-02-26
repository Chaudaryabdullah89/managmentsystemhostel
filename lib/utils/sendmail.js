import transporter from "./transpoter";

export async function sendEmail({ to, subject, html }) {
    // console.log("Attempting to send email...");
    try {
        // if (!transporter) {
        //     console.log("Email transporter not configured. Skipping email.");
        //     return;
        // }

        // if (!process.env.EMAIL_USER) {
        //     console.log("EMAIL_USER environment variable not set. Skipping email.");
        //     return;
        // }

        // console.log(`Sending email to: ${to}, subject: ${subject}`);
        const info = await transporter.sendMail({
            from: `"GreenView Hostels" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            html,
        });

        // console.log("Email sent successfully:", info);
        return info;
    } catch (error) {
        console.error("Error sending email:", error);
    }
}