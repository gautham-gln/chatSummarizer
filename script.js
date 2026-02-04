// let finalClean = "";
// let isCleanReady = false;
// function parseWhatsAppDate(dateStr, timeStr) {
//   const [day, month, year] = dateStr.split("/");
//   const fullYear = "20" + year;

//   return new Date(`${fullYear}-${month}-${day} ${timeStr}`);
// }

// function openDB(callback) {
//   const request = indexedDB.open("FileStorageDB", 1);

//   request.onupgradeneeded = function (event) {
//     const db = event.target.result;

//     if (!db.objectStoreNames.contains("files")) {
//       db.createObjectStore("files", { keyPath: "id" });
//     }
//   };

//   request.onsuccess = function (event) {
//     callback(event.target.result);
//   };

//   request.onerror = function (event) {
//     console.error("DB error:", event.target.error);
//   };
// }

// function saveFileToDB(content) {
//   openDB((db) => {
//     const transaction = db.transaction("files", "readwrite");
//     const store = transaction.objectStore("files");

//     const data = {
//       id: 1,
//       content: content,
//       timestamp: Date.now(),
//     };

//     store.put(data);

//     transaction.oncomplete = () => {
//       console.log("File saved to IndexedDB");
//     };

//     transaction.onerror = (e) => {
//       console.error("Transaction error:", e.target.error);
//     };
//   });
// }

// function handleFileSelect(event) {
//   const file = event.target.files[0];
//   if (file && file.type.match("text.*")) {
//     const reader = new FileReader();

//     reader.onload = function (e) {
//       const contents = e.target.result;
//       //document.getElementById("output").innerText = contents;
//       saveFileToDB(contents);
//       setTimeout(cleanStoredChatData, 100);
//     };

//     reader.onerror = function (e) {
//       console.error("Error reading file:", e.target.error);
//     };

//     reader.readAsText(file);
//   } else {
//     alert("Please select a valid text file.");
//   }
// }

// function loadFileFromDB() {
//   openDB((db) => {
//     const transaction = db.transaction("files", "readonly");
//     const store = transaction.objectStore("files");

//     const request = store.get(1);

//     request.onsuccess = () => {
//       if (request.result) {
//         document.getElementById("output").innerText = request.result.content;
//       }
//     };
//   });
// }

// function cleanWhatsAppText(rawText) {
//   return rawText
//     .split("\n")
//     .filter((line) => !/end-to-end encrypted/i.test(line))
//     .join("\n");
// }

// function cleanStoredChatData() {
//   openDB((db) => {
//     const readTx = db.transaction("files", "readonly");
//     const store = readTx.objectStore("files");

//     const getRequest = store.get(1);

//     getRequest.onsuccess = () => {
//       if (!getRequest.result) {
//         console.warn("No data found in DB");
//         return;
//       }

//       const rawText = getRequest.result.content;
//       const cleanedText = cleanWhatsAppText(rawText);
//       finalClean = cleanedText;

//       const writeTx = db.transaction("files", "readwrite");
//       const writeStore = writeTx.objectStore("files");

//       writeStore.put({
//         ...getRequest.result,
//         content: cleanedText,
//         cleanedAt: Date.now(),
//       });

//       writeTx.oncomplete = () => {
//         console.log("Chat data cleaned and updated in IndexedDB");
//       };

//       runAnalytics();

//       writeTx.onerror = (e) => {
//         console.error("Write error:", e.target.error);
//       };
//     };

//     getRequest.onerror = (e) => {
//       console.error("Read error:", e.target.error);
//     };
//   });
// }

// function calculateAverageResponseTime(cleanedText) {
//   const lines = cleanedText.split("\n");

//   let prevSender = null;
//   let prevTime = null;

//   const stats = {};
//   // { name: { totalTime: ms, count: n } }

//   for (const line of lines) {
//     const match = line.match(
//       /^(\d{2}\/\d{2}\/\d{2}),\s([\d:]+\s(?:am|pm))\s-\s([^:]+):/,
//     );

//     if (!match) continue;

//     const [, date, time, sender] = match;
//     const currentTime = parseWhatsAppDate(date, time);

//     if (prevSender && sender !== prevSender) {
//       const diff = currentTime - prevTime;

//       if (!stats[sender]) {
//         stats[sender] = { totalTime: 0, count: 0 };
//       }

//       stats[sender].totalTime += diff;
//       stats[sender].count += 1;
//     }

//     prevSender = sender;
//     prevTime = currentTime;
//   }

//   // Convert to readable output
//   let result = "Average Response Time:\n";

//   for (const person in stats) {
//     const avgMs = stats[person].totalTime / stats[person].count;
//     const avgMinutes = Math.round(avgMs / 60000);

//     result += `${person}: ${avgMinutes} minutes\n`;
//   }

//   return result.trim();
// }

// function runAnalytics() {
//   if (!isCleanReady) {
//     console.warn("Cleaned data not ready yet");
//     return;
//   }

//   const summary = calculateAverageResponseTime(finalClean);

//   console.log(summary);
// }

// document.addEventListener("DOMContentLoaded", () => {
//   loadFileFromDB(); // optional display
//   cleanStoredChatData(); // 🔥 START FLOW
// });

// // document
// //   .getElementById("fileInput")
// //   .addEventListener("change", handleFileSelect, false);
