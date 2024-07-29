import { SQLiteDatabase } from "expo-sqlite";

export const loadDatabaseSchema = async (db: SQLiteDatabase) => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS contact (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        imageURL TEXT
    );

    CREATE TABLE IF NOT EXISTS private_chat (
        id TEXT PRIMARY KEY,
        contactId TEXT NOT NULL,
        lastMessageId INTEGER,
        lastMessageValue TEXT,
        lastMessageTimestamp INTEGER,
        notificationCount INTEGER
    );
    
    CREATE TABLE IF NOT EXISTS message (
        id INTEGER PRIMARY KEY,
        senderId TEXT NOT NULL,
        receiverId TEXT NOT NULL,

        value TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        type INTEGER NOT NULL,
        status INTEGER NOT NULL,

        receiverType INTEGER NOT NULL,
        chatId TEXT NOT NULL,
        senderReferenceId NOT NULL,
        condition INTEGER NOT NULL
    );
    `);
};

export const addMessageTableIndexes = async (db: SQLiteDatabase) => {
  await db.execAsync(`
        CREATE INDEX idx_status ON message(status);
        CREATE INDEX idx_timestamp ON message(timestamp);
        CREATE INDEX idx_chatId ON message(chatId);
    `);
};
