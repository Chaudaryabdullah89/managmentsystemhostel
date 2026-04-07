function safeMessage(error) {
    if (!error) return "Unknown notification error";
    if (typeof error === "string") return error;
    return error.message || "Unknown notification error";
}

export async function logNotificationDelivery({
    channel,
    event,
    recipient,
    status,
    actorId = null,
    metadata = {},
    error = null,
}) {
    const payload = {
        timestamp: new Date().toISOString(),
        channel,
        event,
        recipient,
        status,
        actorId,
        metadata,
        error: error ? safeMessage(error) : null,
    };

    console.info("[NOTIFY_TELEMETRY]", JSON.stringify(payload));
}
