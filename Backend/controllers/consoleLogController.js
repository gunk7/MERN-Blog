const ConsoleLog = require("../models/consoleLogModel");

exports.getConsoleLogs = async (req, res) => {
  try {
    console.log("hit");
    const { level, search, startDate, endDate, environment } = req.query;

    const filter = {};

    if (level) {
      filter.level = level.toLowerCase();
    }

    if (environment) {
      filter.environment = environment.toLowerCase();
    }

    if (search) {
      filter.message = { $regex: search, $options: "i" };
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const skip = (page - 1) * limit;

    const [logs, total] = await Promise.all([
      ConsoleLog.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ConsoleLog.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
      message: "Console logs fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Failed to fetch console logs",
      error: err.message,
    });
  }
};

exports.getConsoleLogStats = async (req, res) => {
  try {
    const stats = await ConsoleLog.aggregate([
      {
        $group: {
          _id: "$level",
          count: { $sum: 1 },
        },
      },
    ]);

    const formattedStats = {
      info: 0,
      warn: 0,
      error: 0,
      debug: 0,
      http: 0,
    };

    stats.forEach((item) => {
      const level = item._id ? item._id.toLowerCase() : "";
      if (level in formattedStats) {
        formattedStats[level] = item.count;
      }
    });

    return res.status(200).json({
      success: true,
      data: formattedStats,
      message: "Console log stats fetched successfully",
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      data: null,
      message: "Failed to fetch console log stats",
      error: err.message,
    });
  }
};

// Delete a single console log by ID
exports.deleteConsoleLog = async (req, res) => {
  try {
    const { id } = req.params;
    const log = await ConsoleLog.findByIdAndDelete(id);
    if (!log) {
      return res.status(404).json({ success: false, message: "Log not found" });
    }
    return res.status(200).json({ success: true, message: "Log deleted successfully" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete log", error: err.message });
  }
};

// Bulk delete console logs matching query filters (level, date range, environment, search)
exports.deleteConsoleLogs = async (req, res) => {
  try {
    const { level, search, startDate, endDate, environment, amount, keep } = req.query;

    const filter = {};

    if (level) filter.level = level.toLowerCase();
    if (environment) filter.environment = environment.toLowerCase();
    if (search) filter.message = { $regex: search, $options: "i" };
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // If `amount` provided: delete the oldest `amount` logs matching the filter
    if (amount) {
      const n = parseInt(amount, 10);
      if (isNaN(n) || n <= 0) {
        return res.status(400).json({ success: false, message: "Invalid amount parameter" });
      }

      const toDelete = await ConsoleLog.find(filter).sort({ timestamp: 1 }).limit(n).select("_id").lean();
      if (!toDelete || toDelete.length === 0) {
        return res.status(200).json({ success: true, deletedCount: 0, message: "No logs matched the filter" });
      }
      const ids = toDelete.map((d) => d._id);
      const result = await ConsoleLog.deleteMany({ _id: { $in: ids } });

      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount || 0,
        message: `Deleted ${result.deletedCount || 0} oldest logs matching filter`,
      });
    }

    // If `keep` provided: keep only the latest `keep` logs, delete the rest matching filter
    if (keep) {
      const k = parseInt(keep, 10);
      if (isNaN(k) || k < 0) {
        return res.status(400).json({ success: false, message: "Invalid keep parameter" });
      }

      const total = await ConsoleLog.countDocuments(filter);
      if (total <= k) {
        return res.status(200).json({ success: true, deletedCount: 0, message: "No logs deleted; total less than or equal to keep" });
      }
      const toDeleteCount = total - k;
      const toDelete = await ConsoleLog.find(filter).sort({ timestamp: 1 }).limit(toDeleteCount).select("_id").lean();
      const ids = toDelete.map((d) => d._id);
      const result = await ConsoleLog.deleteMany({ _id: { $in: ids } });

      return res.status(200).json({
        success: true,
        deletedCount: result.deletedCount || 0,
        message: `Deleted ${result.deletedCount || 0} oldest logs to keep latest ${k}`,
      });
    }

    // Fallback: delete all matching filter
    const result = await ConsoleLog.deleteMany(filter);

    return res.status(200).json({
      success: true,
      deletedCount: result.deletedCount || 0,
      message: `Deleted ${result.deletedCount || 0} console logs`,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Failed to delete logs", error: err.message });
  }
};
