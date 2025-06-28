import amqplib from "amqplib";
import dotenv from "dotenv";

dotenv.config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;

if (!RABBITMQ_URL) {
  throw new Error("RABBITMQ_URL is not defined in environment variables");
}

export const sendToQueue = async (queueName: string, message: any) => {
  let connection;
  let channel;

  try {
    // Create connection to RabbitMQ
    connection = await amqplib.connect(RABBITMQ_URL);
    channel = await connection.createChannel();

    // Ensure queue exists
    await channel.assertQueue(queueName, { durable: true });

    // Send message to queue
    const messageBuffer = Buffer.from(JSON.stringify(message));
    const sent = channel.sendToQueue(queueName, messageBuffer, {
      persistent: true,
    });

    if (sent) {
      return { success: true, message: "Message sent successfully" };
    } else {
      return { success: false, message: "Failed to send message to queue" };
    }
  } catch (error) {
    console.error("RabbitMQ Error:", error);
    return { success: false, message: "Failed to send message", error };
  } finally {
    // Close channel and connection
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch (closeError) {
      console.error("Error closing RabbitMQ connection:", closeError);
    }
  }
};
