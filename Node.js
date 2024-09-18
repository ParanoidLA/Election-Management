const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");

const serviceAccount = require("/Users/lakshyaagrawal/voters-registration-f4b9c-firebase-adminsdk-ky1ni-9b1b6ae796.json");


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://voters-registration-f4b9c.firebaseio.com"
});

const db = admin.firestore();
const app = express();

// Enable CORS for all routes
app.use(cors());

app.use(express.json()); // to parse JSON bodies

app.post("/add-candidate", async (req, res) => {
  const { candidateName, constituencyID, party } = req.body;

  try {
    const constituencyDoc = await db.collection("constituency").doc(constituencyID).get();

    if (!constituencyDoc.exists) {
      return res.status(404).send(`Error: ConstituencyID ${constituencyID} does not exist.`);
    }

    const constituencyName = constituencyDoc.data().ConstituencyName;

    await db.collection("candidate").add({
      CandidateName: candidateName,
      ConstituencyID: constituencyID,
      Party: party,
      ConstituencyName: constituencyName
    });

    res.status(200).send(`Candidate ${candidateName} added successfully for constituency: ${constituencyName}.`);
  } catch (error) {
    console.error("Error adding candidate:", error);
    res.status(500).send("Error adding candidate.");
  }
});
// Route to fetch candidates
// Route to fetch candidates based on Constituency ID
app.get("/get-candidates/:constituencyId", async (req, res) => {
    const { constituencyId } = req.params;

    try {
        // Fetch constituency document by ID (ConstituencyID)
        const constituencyDoc = await db.collection("constituency").doc(constituencyId).get();

        if (!constituencyDoc.exists) {
            return res.status(404).send(`Constituency with ID ${constituencyId} not found.`);
        }

        const constituencyName = constituencyDoc.data().ConstituencyName;

        // Fetch candidates linked to this constituency
        const candidatesSnapshot = await db.collection("candidate")
            .where("ConstituencyID", "==", constituencyId)
            .get();

        const candidates = [];
        candidatesSnapshot.forEach(doc => {
            candidates.push({
                id: doc.id,
                name: doc.data().CandidateName
            });
        });

        if (candidates.length === 0) {
            return res.status(404).send(`No candidates found for constituency: ${constituencyName}.`);
        }

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (error) {
        console.error("Error fetching candidates:", error);
        res.status(500).send("Error fetching candidates.");
    }
});

// Schedule election route
app.post("/schedule-election", async (req, res) => {
    const { constituencyId, startDate, endDate, candidates } = req.body;

    try {
        // Check if the constituency exists
        const constituencyDoc = await db.collection("constituency").doc(constituencyId).get();
        if (!constituencyDoc.exists) {
            return res.status(404).send(`Error: ConstituencyID ${constituencyId} does not exist.`);
        }

        // Add the election document to the "election" collection with auto-generated ID
        const electionRef = await db.collection("election").add({
            ConstituencyID: constituencyId,
            StartDate: startDate,
            EndDate: endDate,
            CandidateIDs: candidates
        });

        // Create a "votes" collection for the election and add fields for each candidate's vote count
        const votesData = candidates.reduce((acc, candidateId) => {
            acc[candidateId] = 0; // Initialize each candidate's vote count to 0
            return acc;
        }, {});

        await db.collection("votes").doc(electionRef.id).set({
            ElectionID: electionRef.id,
            ...votesData
        });

        res.status(200).send(`Election scheduled successfully with Election ID: ${electionRef.id}`);
    } catch (error) {
        console.error("Error scheduling election:", error);
        res.status(500).send("Error scheduling election.");
    }
});
// Route for the root URL to display a simple message
app.get("/", (req, res) => {
    res.send("Election webserver is running");
});

// Route to fetch election results by Election ID
app.get("/get-results/:electionId", async (req, res) => {
    const { electionId } = req.params;

    try {
        // Fetch the election document by ElectionID
        const electionDoc = await db.collection("election").doc(electionId).get();

        if (!electionDoc.exists) {
            return res.status(404).send(`Election with ID ${electionId} not found.`);
        }

        const electionData = electionDoc.data();
        const constituencyId = electionData.ConstituencyID;
        
        // Fetch the constituency name
        const constituencyDoc = await db.collection("constituency").doc(constituencyId).get();
        if (!constituencyDoc.exists) {
            return res.status(404).send(`Constituency with ID ${constituencyId} not found.`);
        }
        const constituencyName = constituencyDoc.data().ConstituencyName;

        // Fetch the votes document for the election
        const votesDoc = await db.collection("votes").doc(electionId).get();
        if (!votesDoc.exists) {
            return res.status(404).send(`No vote results found for Election ID ${electionId}.`);
        }

        const votesData = votesDoc.data();
        delete votesData.ElectionID; // Remove ElectionID from the results

        const candidateResults = [];

        // Fetch candidate names and their vote counts
        for (const candidateId in votesData) {
            const candidateDoc = await db.collection("candidate").doc(candidateId).get();
            if (candidateDoc.exists) {
                candidateResults.push({
                    candidateId: candidateId,
                    candidateName: candidateDoc.data().CandidateName,
                    party: candidateDoc.data().Party,
                    votes: votesData[candidateId]
                });
            }
        }

        // Send the results
        res.status(200).json({
            constituencyName,
            electionId,
            candidates: candidateResults
        });

    } catch (error) {
        console.error("Error fetching election results:", error);
        res.status(500).send("Error fetching election results.");
    }
});


// Start server
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});