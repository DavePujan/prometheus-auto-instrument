function instrumentRedis(redisClient) {
  if (!redisClient || typeof redisClient.sendCommand !== "function") {
    throw new Error("A valid redis client with sendCommand is required");
  }

  if (redisClient.__promAutoRedisInstrumented) {
    return;
  }

  const originalSend = redisClient.sendCommand.bind(redisClient);

  redisClient.sendCommand = function patchedSendCommand(command) {
    const commandName =
      (command && command.name) ||
      (Array.isArray(command && command.args) && command.args[0]) ||
      "unknown";

    console.log("[Redis]", commandName);
    return originalSend(command);
  };

  redisClient.__promAutoRedisInstrumented = true;
}

module.exports = { instrumentRedis };