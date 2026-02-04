const DB_NAME = "ChatInsightsDB";
const DB_VERSION = 1;
const STORE_NAME = "messages";

let db = null;

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject("Failed to open DB");

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (e) => {
      const db = e.target.result;

      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, {
          keyPath: "id",
          autoIncrement: true,
        });

        store.createIndex("sender", "sender", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
}

function cleanChatText(rawText) {
  return rawText
    .split("\n")
    .filter(
      (line) => !line.includes("Messages and calls are end-to-end encrypted"),
    )
    .join("\n");
}

function parseWhatsAppChat(text) {
  const lines = text.split("\n");
  const messages = [];

  const messageRegex =
    /^(\d{1,2}\/\d{1,2}\/\d{2}), (\d{1,2}:\d{2}\s?(?:am|pm)) - ([^:]+): (.*)$/i;

  let currentMessage = null;

  for (const line of lines) {
    const match = line.match(messageRegex);

    if (match) {
      if (currentMessage) {
        messages.push(currentMessage);
      }

      const [, date, time, sender, message] = match;
      const timestamp = parseWhatsAppDate(date, time);

      currentMessage = {
        sender: sender.trim(),
        message: message.trim(),
        timestamp,
        length: message.trim().length,
      };
    } else if (currentMessage) {
      // Multiline continuation
      currentMessage.message += "\n" + line;
      currentMessage.length = currentMessage.message.length;
    }
  }

  if (currentMessage) {
    messages.push(currentMessage);
  }

  return messages;
}

function parseWhatsAppDate(dateStr, timeStr) {
  // date: DD/MM/YY
  const [day, month, year] = dateStr.split("/").map(Number);
  const fullYear = year < 50 ? 2000 + year : 1900 + year;

  return new Date(`${fullYear}-${month}-${day} ${timeStr}`);
}

function saveMessages(messages) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);

    messages.forEach((msg) => store.add(msg));

    tx.oncomplete = () => resolve();
    tx.onerror = () => reject("Failed to save messages");
  });
}

function deleteDatabase() {
  if (db) db.close();

  const request = indexedDB.deleteDatabase(DB_NAME);

  request.onsuccess = () => {
    document.getElementById("status").textContent =
      "Database deleted successfully.";
  };

  request.onerror = () => {
    document.getElementById("status").textContent =
      "Failed to delete database.";
  };
}

function getAllMessages() {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject("Failed to fetch messages");
  });
}

// insight functions

function getMessageCountPerPerson(messages) {
  const counts = {};

  for (const msg of messages) {
    counts[msg.sender] = (counts[msg.sender] || 0) + 1;
  }

  return counts;
}

async function calculateMessageCounts() {
  await openDB();
  const messages = await getAllMessages();
  return getMessageCountPerPerson(messages);
}

async function showMessageCounts() {
  const counts = await calculateMessageCounts();

  let output = "Message count per person:\n\n";
  for (const person in counts) {
    output += `${person}: ${counts[person]}\n`;
  }

  document.getElementById("status").textContent = output;
}

document.getElementById("fileInput").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const text = await file.text();
  const cleanedText = cleanChatText(text);
  const messages = parseWhatsAppChat(cleanedText);

  await openDB();
  await saveMessages(messages);

  document.getElementById("status").textContent =
    `Stored ${messages.length} messages successfully.`;
  showMessageCounts();
});

document.getElementById("deleteDbBtn").addEventListener("click", () => {
  deleteDatabase();
});
