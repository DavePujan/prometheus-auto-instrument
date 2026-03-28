function normalizeRoute(req) {
  if (req.route && req.route.path) {
    return req.baseUrl ? `${req.baseUrl}${req.route.path}` : req.route.path;
  }

  const path = req.path || req.url || "unknown";
  if (typeof path !== "string") {
    return "unknown";
  }

  return path
    .replace(/\/\d+/g, "/:id")
    .replace(/[0-9a-fA-F]{24}/g, ":objectId")
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27}/gi, ":uuid");
}

function shouldIgnoreRoute(route, ignoreRoutes) {
  if (!Array.isArray(ignoreRoutes) || ignoreRoutes.length === 0) {
    return false;
  }

  return ignoreRoutes.some((item) => {
    if (typeof item === "string") {
      return route === item;
    }

    if (item instanceof RegExp) {
      return item.test(route);
    }

    return false;
  });
}

module.exports = {
  normalizeRoute,
  shouldIgnoreRoute
};