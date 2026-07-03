const test = require("node:test");
const assert = require("node:assert/strict");
const {
  buildOccurrenceUpdate,
  buildResolutionUpdate,
} = require("../utils/errorUtils");

test("buildOccurrenceUpdate increments occurrence count and clears resolved state", () => {
  const existing = {
    _id: "error-1",
    isResolved: true,
    resolvedAt: new Date("2024-01-01T00:00:00.000Z"),
    resolvedBy: "user-1",
    resolvedNote: "Handled",
    occurrenceCount: 2,
  };

  const update = buildOccurrenceUpdate(
    existing,
    {
      category: "SYSTEM",
      subtype: "SYSTEM_UNKNOWN",
      name: "Error",
      message: "boom",
      stack: "stack",
      environment: "production",
      file: "/app/index.js",
      line: 42,
      column: 7,
      level: "error",
      source: "middleware",
      endpoint: "/api/test",
      method: "GET",
      requestId: "req-1",
      jobRunId: "job-1",
    },
    new Date("2024-02-01T00:00:00.000Z"),
  );

  assert.equal(update.$inc.occurrenceCount, 1);
  assert.equal(update.$set.isResolved, false);
  assert.equal(update.$unset.resolvedAt, "");
  assert.equal(update.$unset.resolvedBy, "");
  assert.equal(update.$unset.resolvedNote, "");
  assert.equal(update.$set.lastSeenAt.toISOString(), "2024-02-01T00:00:00.000Z");
});

test("buildResolutionUpdate marks an error as resolved with metadata", () => {
  const update = buildResolutionUpdate(
    { _id: "error-1" },
    {
      resolvedBy: "user-1",
      resolvedNote: "Handled in deployment",
    },
    new Date("2024-02-02T00:00:00.000Z"),
  );

  assert.equal(update.$set.isResolved, true);
  assert.equal(update.$set.resolvedAt.toISOString(), "2024-02-02T00:00:00.000Z");
  assert.equal(update.$set.resolvedBy, "user-1");
  assert.equal(update.$set.resolvedNote, "Handled in deployment");
});
