let candidateCount = 0;
let selectedCandidates = [];

// Function to fetch candidates based on constituency ID
async function fetchCandidates() {
    const constituencyId = document.getElementById("constituencyId").value;
    if (!constituencyId) {
        alert("Please enter a constituency ID.");
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/get-candidates/${constituencyId}`);
        const candidates = await response.json();

        if (candidates.length === 0) {
            alert("No candidates found for this constituency.");
            return;
        }

        document.getElementById("candidates-list").innerHTML = ""; // Clear previous candidates

        // Add candidates to the list
        candidates.forEach(candidate => {
            addCandidateField(candidate);
        });
    } catch (error) {
        console.error("Error fetching candidates:", error);
        alert("Error fetching candidates.");
    }
}

// Function to add a candidate field with "Add to Election" button
function addCandidateField(candidate) {
    candidateCount++;
    const candidateDiv = document.createElement("div");
    candidateDiv.className = "candidate-item";

    const candidateHTML = `
        <label for="candidate${candidateCount}">${candidate.name}</label>
        <select id="candidate${candidateCount}" name="candidate${candidateCount}" disabled>
            <option value="${candidate.id}">${candidate.name}</option>
        </select>
        <button type="button" id="addCandidate${candidateCount}" class="add-to-election-button">Add to Election</button>
    `;

    candidateDiv.innerHTML = candidateHTML;
    document.getElementById("candidates-list").appendChild(candidateDiv);

    // Add event listener to "Add to Election" button
    document.getElementById(`addCandidate${candidateCount}`).addEventListener("click", function () {
        addToElection(candidate.id);
    });
}

// Function to add a candidate to the election
function addToElection(candidateId) {
    if (!selectedCandidates.includes(candidateId)) {
        selectedCandidates.push(candidateId);
        alert(`Candidate with ID ${candidateId} added to the election.`);
    } else {
        alert("This candidate is already added to the election.");
    }
}

// Submit election form
document.getElementById("electionForm").addEventListener("submit", async function (event) {
    event.preventDefault();

    const constituencyId = document.getElementById("constituencyId").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    const electionData = {
        constituencyId,
        startDate,
        endDate,
        candidates: selectedCandidates
    };

    try {
        const response = await fetch("http://localhost:3000/schedule-election", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(electionData)
        });

        if (response.ok) {
            alert("Election scheduled successfully!");
        } else {
            alert("Error scheduling election.");
        }
    } catch (error) {
        console.error("Error submitting form:", error);
        alert("Error submitting form.");
    }
});

// Fetch candidates when "Fetch Candidates" button is clicked
document.getElementById("fetchCandidatesButton").addEventListener("click", fetchCandidates);