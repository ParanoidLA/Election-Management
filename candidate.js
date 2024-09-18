const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = require("/Users/lakshyaagrawal/voters-registration-f4b9c-firebase-adminsdk-ky1ni-9b1b6ae796.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://voters-registration-f4b9c.firebaseio.com"
});

const db = admin.firestore();

// Function to add a candidate and show constituency name
async function addCandidate(candidateName, constituencyID, party) {
  try {
    // Fetch constituency document
    const constituencyDoc = await db.collection("constituency").doc(constituencyID).get();
    
    if (!constituencyDoc.exists) {
      console.log(`Error: ConstituencyID ${constituencyID} does not exist.`);
      return;
    }

    // Get the constituency name
    const constituencyName = constituencyDoc.data().ConstituencyName;

    // Add candidate to Firestore
    await db.collection("candidate").add({
      CandidateName: candidateName,
      ConstituencyID: constituencyID,
      Party: party
    });
    
    console.log(`Candidate ${candidateName} added successfully for constituency: ${constituencyName}.`);
  } catch (error) {
    console.error("Error adding candidate:", error);
  }
}

// Example usage
addCandidate("John Doe", "114", "Example Party");