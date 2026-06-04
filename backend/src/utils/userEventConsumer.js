const UserNotification = require("../models/UserNotification");
const { USER_ACTIVITY_QUEUE, getRabbitChannel } = require("./rabbitmq");

function buildNotificationFromEvent(event) {
  const type = String(event?.type || "").trim();
  const payload = event?.payload || {};
  const occurredAt = event?.occurredAt || new Date().toISOString();
  const userId = String(payload.userId || "").trim();

  if (!userId || !type) return null;

  const maps = {
    "user.registered": {
      notificationType: "rabbitmq_user_registered",
      title: "RabbitMQ: Kullanici kaydi",
      message: `${payload.username || "Kullanici"} kayit oldu.`,
    },
    "user.logged_in": {
      notificationType: "rabbitmq_user_login",
      title: "RabbitMQ: Kullanici girisi",
      message: `${payload.username || "Kullanici"} giris yapti.`,
    },
    "user.logged_out": {
      notificationType: "rabbitmq_user_logout",
      title: "RabbitMQ: Kullanici cikisi",
      message: `${payload.username || "Kullanici"} cikis yapti.`,
    },
    "user.password_changed": {
      notificationType: "rabbitmq_password_changed",
      title: "RabbitMQ: Sifre degisikligi",
      message: `${payload.username || "Kullanici"} sifresini guncelledi.`,
    },
    "user.favorite_added": {
      notificationType: "rabbitmq_favorite_added",
      title: "RabbitMQ: Favori takim eklendi",
      message: `Favorilere ${payload.teamName || payload.teamId || "takim"} eklendi.`,
    },
    "user.favorite_player_added": {
      notificationType: "rabbitmq_favorite_player_added",
      title: "RabbitMQ: Favori oyuncu eklendi",
      message: `Favorilere ${payload.playerName || payload.playerId || "oyuncu"} eklendi.`,
    },
    "user.notification_prefs_updated": {
      notificationType: "rabbitmq_notification_prefs_updated",
      title: "RabbitMQ: Bildirim tercihleri guncellendi",
      message: `${payload.username || "Kullanici"} bildirim tercihlerini guncelledi.`,
    },
  };

  const matched = maps[type];
  if (!matched) return null;

  return {
    userId,
    key: `rabbitmq:${type}:${event.id}`,
    type: matched.notificationType,
    title: matched.title,
    message: matched.message,
    matchId: "",
    read: false,
    dismissed: false,
    createdAt: new Date(occurredAt),
  };
}

async function startUserEventConsumer() {
  const channel = await getRabbitChannel();
  if (!channel) return false;

  await channel.consume(USER_ACTIVITY_QUEUE, async (message) => {
    if (!message) return;

    try {
      const event = JSON.parse(message.content.toString("utf8"));
      const notification = buildNotificationFromEvent(event);

      if (notification) {
        await UserNotification.updateOne(
          { userId: notification.userId, key: notification.key },
          { $setOnInsert: notification },
          { upsert: true },
        );
      }

      channel.ack(message);
    } catch (error) {
      console.error("RabbitMQ olay isleme hatasi:", error.message);
      channel.nack(message, false, false);
    }
  });

  console.log("RabbitMQ user event consumer dinliyor.");
  return true;
}

module.exports = {
  startUserEventConsumer,
};
