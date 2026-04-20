const { model } = require("mongoose");

const aggregatePaginate = async (model, pipeline, queryParams) => {
  const page = parseInt(queryParams.page) || 1;
  const limit = parseInt(queryParams.limit) || 5;
  const skip = (page - 1) * limit;

  const paginatedPipeline = [
    ...pipeline,
    {
      $facet: {
        metadata: [{ $count: "total" }],
        data: [{ $skip: skip }, { $limit: limit }],
      },
    },
  ];
  const result = await model.aggregate(paginatedPipeline);

  const data = result[0].data || [];
  const total = result[0].metadata[0] ? result[0].metadata[0].total : 0;

  return {
    data,
    pagination: {
      totalItems: total,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      pageSize: limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    },
  };
};

module.exports = aggregatePaginate;
