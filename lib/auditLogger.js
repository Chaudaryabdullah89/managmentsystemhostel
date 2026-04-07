function safeStringify(value) {
    try {
        return JSON.stringify(value);
    } catch {
        return JSON.stringify({ note: "unserializable_metadata" });
    }
}

export async function logAuditEvent({
    action,
    actorId,
    actorRole,
    targetType,
    targetId,
    result = "SUCCESS",
    metadata = {},
}) {
    const payload = {
        timestamp: new Date().toISOString(),
        action,
        actorId: actorId || null,
        actorRole: actorRole || null,
        targetType: targetType || null,
        targetId: targetId || null,
        result,
        metadata,
    };

    // Structured JSON log for SIEM/centralized ingestion.
    console.info("[AUDIT]", safeStringify(payload));
}
