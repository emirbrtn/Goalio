const amqp = require("amqplib");

const USER_EVENT_EXCHANGE = "goalio.user.events";
const USER_ACTIVITY_QUEUE = "goalio.user.activity.queue";

let connectionPromise;
let connectionInstance;
let channelPromise;
let channelInstance;

async function connectRabbitMq() {
  if (connectionPromise) return connectionPromise;

  const rabbitMqUrl = String(process.env.RABBITMQ_URL || "").trim();
  if (!rabbitMqUrl) {
    return null;
  }

  connectionPromise = amqp
    .connect(rabbitMqUrl)
    .then((connection) => {
      connectionInstance = connection;

      connection.on("error", (error) => {
        console.error("RabbitMQ baglanti hatasi:", error.message);
      });

      connection.on("close", () => {
        connectionPromise = null;
        connectionInstance = null;
        channelPromise = null;
        channelInstance = null;
      });

      console.log("RabbitMQ baglantisi hazir.");
      return connection;
    })
    .catch((error) => {
      connectionPromise = null;
      console.error("RabbitMQ baglantisi kurulurken hata olustu:", error.message);
      return null;
    });

  return connectionPromise;
}

async function getRabbitConnection() {
  if (connectionInstance) return connectionInstance;
  return connectRabbitMq();
}

async function getRabbitChannel() {
  if (channelInstance) return channelInstance;
  if (channelPromise) return channelPromise;

  channelPromise = (async () => {
    const connection = await getRabbitConnection();
    if (!connection) {
      channelPromise = null;
      return null;
    }

    const channel = await connection.createChannel();
    await channel.assertExchange(USER_EVENT_EXCHANGE, "topic", { durable: true });
    await channel.assertQueue(USER_ACTIVITY_QUEUE, { durable: true });
    await channel.bindQueue(USER_ACTIVITY_QUEUE, USER_EVENT_EXCHANGE, "user.*");

    channelInstance = channel;
    return channel;
  })().catch((error) => {
    channelPromise = null;
    channelInstance = null;
    console.error("RabbitMQ kanal hatasi:", error.message);
    return null;
  });

  return channelPromise;
}

module.exports = {
  USER_ACTIVITY_QUEUE,
  USER_EVENT_EXCHANGE,
  connectRabbitMq,
  getRabbitChannel,
};
