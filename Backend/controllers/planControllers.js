const { AppError } = require("../utils/errorUtils");
const catchAsync = require("../utils/catchAsync");
const Plan = require("../models/planModel");

exports.getPlans = catchAsync(async (req, res) => {
    const loggedInUser = req.user;
    const isAdmin = loggedInUser?.role === "admin";

    const filter = isAdmin
      ? {}
      : { isActive: true, isDeleted: false, type: "base" };

    const plans = await Plan.find(filter).sort({ price: 1 }).lean();
    res.status(200).json({
      success: true,
      data: plans,
      message: isAdmin
        ? "All plans fetched (Admin View)"
        : "Plans fetched successfully",
    });
  });;

exports.getPlanById = catchAsync(async (req, res) => {
    const { id } = req.params;
    const loggedInUser = req.user;
    const isAdmin = loggedInUser?.role === "admin";

    const filter = isAdmin
      ? { _id: id }
      : { _id: id, isActive: true, isDeleted: false };

    const plan = await Plan.findById(filter).lean();

    if (!plan) {
      return res.status(400).json({
        success: false,
        data: false,
        message: "Plan not found or no longer available",
      });
    }

    return res.status(200).json({
      success: true,
      data: plan,
      message: "Plan detials fetched successfully",
    });
  });;

exports.createPlan = catchAsync(async (req, res) => {
    console.log("req.body", req.body); // ← add this
    const plan = await Plan.create(req.body);
    res.status(201).json({
      success: true,
      data: plan,
      message: "Plan Created Successfully",
    });
  });;

exports.updatePlan = catchAsync(async (req, res) => {
    delete req.body.slug;

    const plan = await Plan.findById(req.params.id);
    if (!plan) {
      return res.status(404).json({
        success: false,
        data: false,
        message: "Plan Not Found",
      });
    }
    Object.assign(plan, req.body);
    await plan.save();
    res.status(200).json({
      success: true,
      data: plan,
      message: "Plan Updated Successfully",
    });
  });;

exports.deletePlan = catchAsync(async (req, res) => {
    const plan = await Plan.findById(req.params.id);
    if (!plan || plan.isDeleted) {
      return res.status(404).json({
        success: false,
        message: "Plan Not Found",
      });
    }
    await plan.softDelete();

    res.status(200).json({
      success: true,
      data: false,
      message: "Plan Deactivated Successfully",
    });
  });;

exports.getPlanStats = catchAsync(async (req, res) => {
    const [
      overviewStats,
      statusBreakdown,
      intervalBreakdown,
      featureAdoption,
      revenueInsights,
      recentActivity,
      topPlans,
    ] = await Promise.all([
      // 1. Overview counts
      Plan.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalActive: {
              $sum: { $cond: [{ $eq: ["$isDeleted", false] }, 1, 0] },
            },
            totalDeleted: {
              $sum: { $cond: [{ $eq: ["$isDeleted", true] }, 1, 0] },
            },
            totalFree: {
              $sum: { $cond: [{ $eq: ["$price", 0] }, 1, 0] },
            },
            totalPaid: {
              $sum: { $cond: [{ $gt: ["$price", 0] }, 1, 0] },
            },
            avgPrice: { $avg: "$price" },
            minPrice: { $min: "$price" },
            maxPrice: { $max: "$price" },
            avgDurationDays: { $avg: "$durationDays" },
          },
        },
        { $project: { _id: 0 } },
      ]),

      // 2. Breakdown by status (active / archived / draft), excluding deleted
      Plan.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: "$status",
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 3. Breakdown by billing interval, excluding deleted
      Plan.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: "$interval",
            count: { $sum: 1 },
            avgPrice: { $avg: "$price" },
          },
        },
        { $sort: { count: -1 } },
      ]),

      // 4. Feature adoption rates across non-deleted plans
      Plan.aggregate([
        { $match: { isDeleted: false } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            aiChat: { $sum: { $cond: ["$features.aiChat", 1, 0] } },
            aiSummary: { $sum: { $cond: ["$features.aiSummary", 1, 0] } },
            writingAssist: {
              $sum: { $cond: ["$features.writingAssist", 1, 0] },
            },
            tagsGeneration: {
              $sum: { $cond: ["$features.tagsGeneration", 1, 0] },
            },
            analyticsAccess: {
              $sum: { $cond: ["$features.analyticsAccess", 1, 0] },
            },
          },
        },
        {
          $project: {
            _id: 0,
            total: 1,
            features: {
              aiChat: {
                count: "$aiChat",
                rate: {
                  $round: [
                    { $multiply: [{ $divide: ["$aiChat", "$total"] }, 100] },
                    1,
                  ],
                },
              },
              aiSummary: {
                count: "$aiSummary",
                rate: {
                  $round: [
                    { $multiply: [{ $divide: ["$aiSummary", "$total"] }, 100] },
                    1,
                  ],
                },
              },
              writingAssist: {
                count: "$writingAssist",
                rate: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$writingAssist", "$total"] },
                        100,
                      ],
                    },
                    1,
                  ],
                },
              },
              tagsGeneration: {
                count: "$tagsGeneration",
                rate: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$tagsGeneration", "$total"] },
                        100,
                      ],
                    },
                    1,
                  ],
                },
              },
              analyticsAccess: {
                count: "$analyticsAccess",
                rate: {
                  $round: [
                    {
                      $multiply: [
                        { $divide: ["$analyticsAccess", "$total"] },
                        100,
                      ],
                    },
                    1,
                  ],
                },
              },
            },
          },
        },
      ]),

      // 5. Revenue insights (paid plans only, non-deleted)
      Plan.aggregate([
        { $match: { isDeleted: false, price: { $gt: 0 } } },
        {
          $group: {
            _id: "$interval",
            planCount: { $sum: 1 },
            totalPrice: { $sum: "$price" },
            avgPrice: { $avg: "$price" },
            avgMonthlyTokens: { $avg: "$limit.monthlyTokens" },
          },
        },
        { $sort: { avgPrice: -1 } },
      ]),

      // 6. Recently created / updated plans (last 30 days)
      Plan.aggregate([
        {
          $match: {
            isDeleted: false,
            createdAt: {
              $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
              day: { $dayOfMonth: "$createdAt" },
            },
            newPlans: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": -1, "_id.month": -1, "_id.day": -1 } },
        { $limit: 30 },
      ]),

      // 7. Top 5 most feature-rich paid plans
      Plan.find({ isDeleted: false, price: { $gt: 0 } })
        .select("name slug price interval status features limit")
        .sort({ price: -1 })
        .limit(5)
        .lean(),
    ]);

    // Shape statusBreakdown into a readable object
    const statusMap = statusBreakdown.reduce((acc, { _id, count }) => {
      acc[_id] = count;
      return acc;
    }, {});

    // Shape intervalBreakdown into a readable object
    const intervalMap = intervalBreakdown.reduce(
      (acc, { _id, count, avgPrice }) => {
        acc[_id] = { count, avgPrice: Math.round(avgPrice * 100) / 100 };
        return acc;
      },
      {},
    );

    return res.status(200).json({
      success: true,
      data: {
        overview: overviewStats[0] ?? {
          total: 0,
          totalActive: 0,
          totalDeleted: 0,
          totalFree: 0,
          totalPaid: 0,
          avgPrice: 0,
          minPrice: 0,
          maxPrice: 0,
          avgDurationDays: 0,
        },
        statusBreakdown: statusMap,
        intervalBreakdown: intervalMap,
        featureAdoption: featureAdoption[0] ?? {},
        revenueInsights,
        recentActivity: recentActivity.map(({ _id, newPlans }) => ({
          date: `${_id.year}-${String(_id.month).padStart(2, "0")}-${String(_id.day).padStart(2, "0")}`,
          newPlans,
        })),
        topPlans,
      },
    });
  });;
