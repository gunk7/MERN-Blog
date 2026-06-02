const fillMissingDates = (data, days) => {
  const map = new Map();
  data.forEach((item) => {
    map.set(item._id, item.count);
  });

  const result = [];

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    const formatted = date.toISOString().split("T")[0];

    result.push({
      date: formatted,
      count: map.get(formatted) || 0,
    });
  }

  return result;
};

module.exports = { fillMissingDates };
