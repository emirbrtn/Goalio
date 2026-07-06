const { randomUUID } = require("crypto");

const { USER_EVENT_EXCHANGE, getRabbitChannel } = require("./rabbitmq");

async function publishUserEvent(type, payload) {
  const channel = await getRabbitChannel();
  if (!channel) return false;

  const event = {
    id: randomUUID(),
    type,
    occurredAt: new Date().toISOString(),
    payload,
  };

  return channel.publish(
    USER_EVENT_EXCHANGE,
    type,
    Buffer.from(JSON.stringify(event)),
    {
      contentType: "application/json",
      persistent: true,
    },
  );
}

module.exports = {
  publishUserEvent,
};
