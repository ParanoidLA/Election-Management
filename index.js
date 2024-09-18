const admin = require("firebase-admin");
const fs = require("fs");
const csv = require("csv-parser");

// Initialize Firebase Admin SDK
const serviceAccount = require("/Users/lakshyaagrawal/voters-registration-f4b9c-firebase-adminsdk-ky1ni-9b1b6ae796.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://voters-registration-f4b9c.firebaseio.com"
});

const db = admin.firestore();

// Function to read CSV and upload to Firestore
function importConstituencyData() {
  const filePath = "/Users/lakshyaagrawal/Downloads/Sheet-1-Table-1.csv";
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on("data", async (row) => {
      const constituencyCode = row["Constituency no"].trim(); // Adjust field names if necessary
      const constituencyName = row["Name"].trim();

      console.log(`Processing: ${constituencyCode} - ${constituencyName}`); // Debugging line

      try {
        await db.collection("constituency").doc(constituencyCode).set({
          ConstituencyName: constituencyName
        });
        console.log(`Successfully added: ${constituencyCode}`);
      } catch (error) {
        console.error(`Error adding ${constituencyCode}:`, error);
      }
    })
    .on("end", () => {
      console.log("CSV file successfully processed.");
    });
}

importConstituencyData();