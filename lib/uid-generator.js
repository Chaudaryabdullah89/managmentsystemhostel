// Utility function to generate UID
export function generateUID(prefix, id) {
    const uniquePart = id.substring(0, 8).toUpperCase();
    return `${prefix}-${uniquePart}`;
}

// Middleware for generating UIDs when creating records
export function withUID(model, prefix) {
    return {
        ...model,
        create: async (args) => {
            const result = await model.create(args);
            // Generate UID after creation using the generated ID
            if (!result.uid) {
                await model.update({
                    where: { id: result.id },
                    data: { uid: generateUID(prefix, result.id) }
                });
            }
            return result;
        }
    };
}

// Export prefixes for consistency
export const UID_PREFIXES = {
    USER: 'USR',
    BOOKING: 'BKG',
    PAYMENT: 'PAY',
    COMPLAINT: 'CMP',
    MAINTENANCE: 'MNT',
    TASK: 'TSK',
    NOTICE: 'NTC'
};
