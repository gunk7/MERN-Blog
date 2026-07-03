
// ============================================================================
// 1. TAXONOMY
// ============================================================================
const CATEGORY_SUBTYPES = {
  AUTH: ["AUTH_LOGIN", "AUTH_SIGNUP", "AUTH_OTP", "AUTH_JWT", "AUTH_SESSION"],
  ACCESS: ["ACCESS_UNAUTHORIZED", "ACCESS_FORBIDDEN", "ACCESS_ROLE", "ACCESS_OWNER_MISMATCH"],
  VALIDATION: ["VALIDATION_INPUT", "VALIDATION_SCHEMA", "VALIDATION_MONGOOSE", "VALIDATION_FILE"],
  RESOURCE: ["RESOURCE_NOT_FOUND", "RESOURCE_CONFLICT", "RESOURCE_STATE", "RESOURCE_UPDATE"],
  DATABASE: ["DB_CONNECTION", "DB_QUERY", "DB_TRANSACTION", "DB_DUPLICATE_KEY"],
  FILES: ["FILE_UPLOAD", "FILE_DELETE", "FILE_PROCESSING", "FILE_STORAGE"],
  PAYMENT: ["PAYMENT_STRIPE", "PAYMENT_WEBHOOK", "PAYMENT_REFUND", "SUBSCRIPTION_SYNC"],
  EXTERNAL_SERVICE: ["SERVICE_AI", "SERVICE_EMAIL", "SERVICE_TIMEOUT", "SERVICE_API"],
  SCHEDULER: ["JOB_CRON", "JOB_SCHEDULE", "JOB_RETRY"],
  SYSTEM: ["SYSTEM_ENV", "SYSTEM_CONFIG", "SYSTEM_STARTUP", "SYSTEM_UNKNOWN"],
};

const ERROR_CATEGORIES = Object.keys(CATEGORY_SUBTYPES);
const ERROR_SUBTYPES = Object.values(CATEGORY_SUBTYPES).flat();
const ERROR_LEVELS = ["fatal", "error", "warning"];
const ERROR_SOURCES = [
  "middleware", "manual", "uncaughtException", "unhandledRejection",
  "client-runtime", "client-promise", "client-resource", "client-react-boundary",
];
const ENVIRONMENTS = ["development", "staging", "production"];

function isValidSubtypeForCategory(category, subtype) {
  const allowed = CATEGORY_SUBTYPES[category];
  return Array.isArray(allowed) && allowed.includes(subtype);
}

// ============================================================================
// 2. APP ERROR CLASS
// ============================================================================
class AppError extends Error {
  constructor(message, { category, errorCode, statusCode = 500 } = {}) {
    super(message);
    this.name = "AppError";
    this.isAppError = true;

    if (!category || !errorCode) {
      throw new Error(`AppError requires both "category" and "errorCode" (got category=${JSON.stringify(category)}, errorCode=${JSON.stringify(errorCode)})`);
    }

    if (!isValidSubtypeForCategory(category, errorCode)) {
      throw new Error(`AppError: "${errorCode}" is not a valid errorCode for category "${category}".`);
    }

    this.category = category;
    this.errorCode = errorCode;
    this.statusCode = statusCode;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// ============================================================================
// 3. CLASSIFIER
// ============================================================================
const CLASSIFICATION_MAP = {
  JsonWebTokenError: { errorCode: "AUTH_JWT", category: "AUTH", statusCode: 401 },
  TokenExpiredError: { errorCode: "AUTH_JWT", category: "AUTH", statusCode: 401 },
  NotBeforeError: { errorCode: "AUTH_JWT", category: "AUTH", statusCode: 401 },
  ValidationError: { errorCode: "VALIDATION_MONGOOSE", category: "VALIDATION", statusCode: 400 },
  CastError: { errorCode: "VALIDATION_MONGOOSE", category: "VALIDATION", statusCode: 400 },
  StrictModeError: { errorCode: "VALIDATION_MONGOOSE", category: "VALIDATION", statusCode: 400 },
  SyntaxError: { errorCode: "VALIDATION_INPUT", category: "VALIDATION", statusCode: 400 },
  MongoServerError: { errorCode: "DB_QUERY", category: "DATABASE", statusCode: 500 },
  MongoNetworkError: { errorCode: "DB_CONNECTION", category: "DATABASE", statusCode: 500 },
  MongooseServerSelectionError: { errorCode: "DB_CONNECTION", category: "DATABASE", statusCode: 500 },
  MongoTimeoutError: { errorCode: "DB_CONNECTION", category: "DATABASE", statusCode: 500 },
  MulterError: { errorCode: "FILE_UPLOAD", category: "FILES", statusCode: 400 },
  StripeCardError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 402 },
  StripeInvalidRequestError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 400 },
  StripeAPIError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 502 },
  StripeConnectionError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 502 },
  StripeAuthenticationError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 401 },
  StripeRateLimitError: { errorCode: "PAYMENT_STRIPE", category: "PAYMENT", statusCode: 429 },
};

const DEFAULT_CLASSIFICATION = { errorCode: "SYSTEM_UNKNOWN", category: "SYSTEM", statusCode: 500 };

function classifyError(err) {
  if (err && err.isAppError) {
    return { errorCode: err.errorCode, category: err.category, statusCode: err.statusCode };
  }
  if (err && err.code === 11000) {
    return { errorCode: "DB_DUPLICATE_KEY", category: "DATABASE", statusCode: 409 };
  }
  const match = err && CLASSIFICATION_MAP[err.name];
  if (match) return match;

  return DEFAULT_CLASSIFICATION;
}

// ============================================================================
// 4. LOGGER
// ============================================================================
function resolveEnvironment(explicit) {
  if (explicit && ENVIRONMENTS.includes(explicit)) return explicit;
  const fromEnv = process.env.NODE_ENV;
  if (fromEnv && ENVIRONMENTS.includes(fromEnv)) return fromEnv;
  return "development";
}

function extractFileLine(stack) {
  if (!stack || typeof stack !== "string") return { file: null, line: null, column: null };
  const frames = stack.split("\n").slice(1);
  for (const frame of frames) {
    const parenMatch = frame.match(/\((.+):(\d+):(\d+)\)\s*$/);
    const bareMatch = frame.match(/^\s+at (.+):(\d+):(\d+)\s*$/);
    const match = parenMatch || bareMatch;
    if (!match) continue;
    const filePath = match[1];
    if (filePath.startsWith("node:") || filePath.includes("node_modules")) continue;
    return { file: filePath, line: Number(match[2]), column: Number(match[3]) };
  }
  return { file: null, line: null, column: null };
}

function buildOccurrenceUpdate(existingDoc, payload, seenAt = new Date()) {
  return {
    $inc: { occurrenceCount: 1 },
    $set: {
      category: payload.category,
      subtype: payload.subtype,
      name: payload.name,
      message: payload.message,
      stack: payload.stack,
      environment: payload.environment,
      file: payload.file,
      line: payload.line,
      column: payload.column,
      level: payload.level,
      source: payload.source,
      endpoint: payload.endpoint,
      method: payload.method,
      requestId: payload.requestId,
      jobRunId: payload.jobRunId,
      lastSeenAt: seenAt,
      isResolved: false,
      firstSeenAt: existingDoc?.firstSeenAt || seenAt,
    },
    $unset: {
      resolvedAt: "",
      resolvedBy: "",
      resolvedNote: "",
    },
  };
}

function buildResolutionUpdate(existingDoc, { resolvedBy, resolvedNote }, resolvedAt = new Date()) {
  return {
    $set: {
      isResolved: true,
      resolvedAt,
      resolvedBy,
      resolvedNote,
      lastSeenAt: existingDoc?.lastSeenAt || resolvedAt,
    },
  };
}

async function persistError(err, options = {}) {
  const ErrorLog = require("../models/errorLog");
  const {
    level = "error", source = "manual", requestId = null, jobRunId = null,
    endpoint = null, method = null, environment,
  } = options;

  const classification = classifyError(err);
  const { file, line, column } = extractFileLine(err && err.stack);
  const payload = {
    category: classification.category,
    subtype: classification.errorCode,
    name: (err && err.name) || "UnknownError",
    message: (err && err.message) || "No message",
    stack: err && err.stack,
    environment: resolveEnvironment(environment),
    file,
    line,
    column,
    level,
    source,
    endpoint,
    method,
    requestId,
    jobRunId,
  };

  try {
    const fingerprintComponents = [
      payload.name,
      payload.message,
      payload.file || "",
      payload.line || "",
      payload.endpoint || "",
    ].join("|");
    const fingerprint = require("crypto")
      .createHash("sha256")
      .update(fingerprintComponents)
      .digest("hex");

    const existingDoc = await ErrorLog.findOne({ fingerprint }).lean();

    if (existingDoc) {
      await ErrorLog.updateOne(
        { _id: existingDoc._id },
        buildOccurrenceUpdate(existingDoc, payload),
      );
      return;
    }

    await ErrorLog.create({
      fingerprint,
      ...payload,
      occurrenceCount: 1,
      firstSeenAt: new Date(),
      lastSeenAt: new Date(),
      isResolved: false,
      resolvedAt: null,
      resolvedBy: null,
      resolvedNote: null,
    });
  } catch (persistErr) {
    console.error("[logger] Failed to persist ErrorLog:", persistErr.message);
    console.error("[logger] Original error was:", err);
  }
}

const logger = {
  fatal: (err, options) => persistError(err, { ...options, level: "fatal" }),
  error: (err, options) => persistError(err, { ...options, level: "error" }),
  warning: (err, options) => persistError(err, { ...options, level: "warning" }),
};

// ============================================================================
// EXPORTS
// ============================================================================
module.exports = {
  CATEGORY_SUBTYPES,
  ERROR_CATEGORIES,
  ERROR_SUBTYPES,
  ERROR_LEVELS,
  ERROR_SOURCES,
  ENVIRONMENTS,
  isValidSubtypeForCategory,
  AppError,
  classifyError,
  CLASSIFICATION_MAP,
  DEFAULT_CLASSIFICATION,
  buildOccurrenceUpdate,
  buildResolutionUpdate,
  logger,
};
