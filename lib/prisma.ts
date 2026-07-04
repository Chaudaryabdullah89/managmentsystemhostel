import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

// Override Decimal serialization globally so they serialize as numbers instead of strings
Decimal.prototype.toJSON = function () {
    return this.toNumber() as any;
};

// ── Logging flags ──────────────────────────────────────────────────────────
const IS_DEV = process.env.NODE_ENV !== "production";
const ENABLE_LOGS = process.env.ENABLE_API_LOGS === "false";
const SHOULD_LOG = IS_DEV || ENABLE_LOGS;

// ANSI colours
const C = {
    reset: "\x1b[0m",
    dim: "\x1b[2m",
    bold: "\x1b[1m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    gray: "\x1b[90m",
    green: "\x1b[32m",
};

function ts() { return new Date().toTimeString().slice(0, 8); }

// ── Prisma client factory ──────────────────────────────────────────────────
const prismaClientSingleton = () => {
    const client = new PrismaClient({
        // log: SHOULD_LOG
        //     ? [
        //         { level: "query", emit: "event" },
        //         { level: "warn", emit: "event" },
        //         { level: "error", emit: "event" },
        //     ]
        //     : [{ level: "error", emit: "stdout" }],
    });

    // if (SHOULD_LOG) {
    //     // 🔵 Query log — model name + action + duration
    //     (client as any).$on("query", (e: {
    //         query: string;
    //         params: string;
    //         duration: number;
    //         target: string;
    //     }) => {
    //         const dur = e.duration > 500
    //             ? `${C.red}${e.duration}ms${C.reset}`
    //             : e.duration > 100
    //                 ? `${C.yellow}${e.duration}ms${C.reset}`
    //                 : `${C.gray}${e.duration}ms${C.reset}`;

    //         // Extract model and action from the raw query string
    //         const match = e.query.match(/(?:SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER)/i);
    //         const op = match ? match[0].toUpperCase() : "QUERY";
    //         const opColor = op === "SELECT" ? C.cyan
    //             : op === "INSERT" ? C.green
    //                 : op === "UPDATE" ? C.yellow
    //                     : op === "DELETE" ? C.red
    //                         : C.magenta;

    //         // Shorten query for readability (first 120 chars)
    //         const q = e.query.length > 120 ? e.query.slice(0, 120) + "…" : e.query;

    //         console.log(
    //             `${C.gray}${ts()}${C.reset} ` +
    //             `${C.dim}DB ${C.reset}${C.bold}${opColor}${op.padEnd(7)}${C.reset} ` +
    //             `${C.dim}${q}${C.reset} ` +
    //             dur
    //         );
    //     });

    //     // 🟡 Prisma warnings
    //     (client as any).$on("warn", (e: { message: string }) => {
    //         console.warn(`${C.gray}${ts()}${C.reset} ${C.yellow}⚠  Prisma WARN${C.reset} ${e.message}`);
    //     });

    //     // 🔴 Prisma errors
    //     (client as any).$on("error", (e: { message: string }) => {
    //         console.error(`${C.gray}${ts()}${C.reset} ${C.red}✖  Prisma ERROR${C.reset} ${e.message}`);
    //     });
    // }

    return client;
};

const globalForPrisma = globalThis as unknown as {
    prisma: ReturnType<typeof prismaClientSingleton> | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;