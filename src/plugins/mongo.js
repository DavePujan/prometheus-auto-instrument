function instrumentMongo(mongoose) {
  if (!mongoose || typeof mongoose.set !== "function") {
    throw new Error("A valid mongoose instance is required");
  }

  if (mongoose.__promAutoMongoInstrumented) {
    return;
  }

  mongoose.set("debug", function (collection, method, query, doc) {
    console.log(`[Mongo] ${collection}.${method}`, query, doc || {});
  });

  mongoose.__promAutoMongoInstrumented = true;
}

module.exports = { instrumentMongo };