import TelegramBot from "node-telegram-bot-api";

let bot: TelegramBot | null = null;

function getBot(): TelegramBot {
  if (!bot) {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not set");
    bot = new TelegramBot(token);
  }
  return bot;
}

export async function sendTelegram(chatId: string, text: string): Promise<void> {
  await getBot().sendMessage(chatId, text, { parse_mode: "HTML" });
}
