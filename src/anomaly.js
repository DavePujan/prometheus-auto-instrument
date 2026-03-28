function createLatencyAnomalyDetector(options = {}) {
  const {
    minSamples = 20,
    multiplier = 2,
    maxHistory = 200
  } = options;

  const historyByRoute = new Map();

  function detect(route, value) {
    const history = historyByRoute.get(route) || [];
    const hasEnoughHistory = history.length >= minSamples;

    let isAnomaly = false;
    if (hasEnoughHistory) {
      const avg = history.reduce((sum, item) => sum + item, 0) / history.length;
      isAnomaly = value > avg * multiplier;
    }

    history.push(value);
    if (history.length > maxHistory) {
      history.shift();
    }

    historyByRoute.set(route, history);
    return isAnomaly;
  }

  return { detect };
}

module.exports = {
  createLatencyAnomalyDetector
};