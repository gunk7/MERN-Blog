const catchAsync = require("../utils/catchAsync");
const { AppError, buildResolutionUpdate } = require("../utils/errorUtils");
const ErrorLog = require("../models/errorLog");
const { getSourceContext } = require("../utils/sourceContext");

function buildDateFilter(query) {
  const { startDate, endDate } = query;
  if (!startDate && !endDate) return {};
  const createdAt = {};
  if (startDate) createdAt.$gte = new Date(startDate);
  if (endDate) createdAt.$lte = new Date(endDate);
  return { createdAt };
}

exports.getErrorLogs = catchAsync(async (req, res) => {
  const { category, level, source, environment, search } = req.query;

  const filter = { ...buildDateFilter(req.query) };
  if (category) filter.category = category;
  if (level) filter.level = level;
  if (source) filter.source = source;
  if (environment) filter.environment = environment;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { message: { $regex: search, $options: "i" } },
    ];
  }

  const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(req.query.limit, 10) || 25, 1),
    100,
  );
  const skip = (page - 1) * limit;

  const [errors, total] = await Promise.all([
    ErrorLog.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ErrorLog.countDocuments(filter),
  ]);

  return res.status(200).json({
    success: true,
    data: errors,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit) || 1,
    },
    message: "Error logs fetched successfully",
  });
});

exports.getErrorLogById = catchAsync(async (req, res) => {
  const error = await ErrorLog.findById(req.params.id).lean();
  if (!error) {
    throw new AppError("Error log not found", {
      category: "RESOURCE",
      errorCode: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  }
  return res.status(200).json({
    success: true,
    data: error,
    message: "Error log fetched successfully",
  });
});

exports.getErrorsByCategory = catchAsync(async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const pipeline = [
    ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
    { $group: { _id: "$category", count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ];
  const results = await ErrorLog.aggregate(pipeline);
  return res.status(200).json({
    success: true,
    data: results.map((r) => ({ category: r._id, count: r.count })),
    message: "Error counts by category fetched successfully",
  });
});

exports.getErrorsByErrorCode = catchAsync(async (req, res) => {
  const dateFilter = buildDateFilter(req.query);
  const pipeline = [
    ...(Object.keys(dateFilter).length ? [{ $match: dateFilter }] : []),
    {
      $group: {
        _id: { category: "$category", subtype: "$subtype" },
        count: { $sum: 1 },
      },
    },
    { $sort: { count: -1 } },
    { $limit: 20 },
  ];
  const results = await ErrorLog.aggregate(pipeline);
  return res.status(200).json({
    success: true,
    data: results.map((r) => ({
      category: r._id.category,
      errorCode: r._id.subtype,
      count: r.count,
    })),
    message: "Error counts by error code fetched successfully",
  });
});

exports.updateErrorResolution = catchAsync(async (req, res) => {
  const { resolved, note } = req.body;

  if (typeof resolved !== "boolean") {
    throw new AppError("resolved must be a boolean", {
      category: "VALIDATION",
      errorCode: "VALIDATION_INPUT",
      statusCode: 400,
    });
  }

  const errorLog = await ErrorLog.findById(req.params.id);
  if (!errorLog) {
    throw new AppError("Error log not found", {
      category: "RESOURCE",
      errorCode: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  }

  const resolvedAt = resolved ? new Date() : null;
  const resolvedBy = resolved ? req.user?._id || null : null;
  const resolvedNote = resolved ? note || null : null;

  const updatedError = await ErrorLog.findByIdAndUpdate(
    req.params.id,
    resolved
      ? buildResolutionUpdate(errorLog, { resolvedBy, resolvedNote }, resolvedAt)
      : {
          $set: {
            isResolved: false,
            resolvedAt: null,
            resolvedBy: null,
            resolvedNote: null,
            lastSeenAt: errorLog.lastSeenAt || new Date(),
          },
        },
    { new: true, runValidators: true },
  ).lean();

  return res.status(200).json({
    success: true,
    data: updatedError,
    message: resolved ? "Error marked as resolved" : "Error marked as unresolved",
  });
});

exports.getErrorSourceContext = catchAsync(async (req, res) => {
  const errorDoc = await ErrorLog.findById(req.params.id).lean();
  if (!errorDoc) {
    throw new AppError("Error log not found", {
      category: "RESOURCE",
      errorCode: "RESOURCE_NOT_FOUND",
      statusCode: 404,
    });
  }

  const result = getSourceContext(
    errorDoc.file,
    errorDoc.line,
    errorDoc.column,
  );

  console.log("[sourceContext] raw file path:", errorDoc.file);

  const ageMs = Date.now() - new Date(errorDoc.createdAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  return res.status(200).json({
    success: true,
    data: { ...result, ageDays: Math.round(ageDays * 10) / 10 },
    message: "Error source context fetched successfully",
  });
});
