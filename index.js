// Initializing player list
let players = [];

const specialCards = [
  "Queen", // runner up (2nd)
  "Jack", // Trailer (Last)
  "Joker", // Choice
  "King", // First
  "Ace", // Pass to next player
  "Mirror", // Reverse
  "Bomb"
];

const specialCardsRules = [
  {
    card: "Queen: <i>Patience</i>",
    description: `
        <p>Place player behind the first player</p>
    `,
  },
  {
    card: "Jack: <i>Trailer</i>",
    description: `
        <p>
          Place player behind the last place player. If that would cause
          collision, place them in spot 1.
        </p>
    `,
  },
  {
    card: "Joker: <i>Choice</i>",
    description: `
        <p>Player chooses the draft position they would like.</p>
    `,
  },
  {
    card: "King: <i>Coup</i>",
    description: `
        <p>
          Place player in spot 1. If that would cause a collision, remove the
          existing player from the board.
        </p>
    `,
  },
  {
    card: "Ace: <i>Pass</i>",
    description: `
        <p>Skip the player's turn.</p>
    `,
  },
  {
    card: "Mirror: <i>Reverse</i>",
    description: `
        <p>Reverse the order of the players. Player who drew draws again.</p>
    `,
  },
  {
    card: "Bomb: <i>Boom</i>",
    description: `
        <p>
          Remove all players from the board and place them back in the queue.
        </p>
    `,
  },
];

document.getElementById("rulesList").innerHTML = specialCardsRules
  .map((card) => `<li><h4>${card.card}</h4>${card.description}</li>`)
  .join("");

let movedPlayers = [];
let cards = [];
let playerSlots = Array(players.length).fill(null);
let ledger = [];

function shuffle() {
  cards = [...specialCards];
  for (let i = 1; i <= players.length; i++) {
    cards.push(i);
  }
}
shuffle();

function addPlayer() {
  const playerNameInput = document.getElementById("playerNameInput");
  const playerName = playerNameInput.value.trim();
  if (playerName) {
    players.push(playerName);
    playerNameInput.value = ""; // Clear the input field
    populateLists(); // Update the player list display
    createTableSpaces(players.length); // Update the table spaces
    shuffle();
    playerSlots = Array(players.length).fill(null);
  }
}
// Populate the initial list of players
function populateLists() {
  document.getElementById("remainingPlayersList").innerHTML = players
    .map((player) => `<li>${player}</li>`)
    .join("");
  document.getElementById("movedPlayersList").innerHTML = movedPlayers
    .map((player) => `<li>${player}</li>`)
    .join("");
  if (players.length === 0) {
    document.querySelector(".active-player").textContent = `✨ Finished ✨`;
  } else {
    document.querySelector(".active-player").textContent = `Active Player: ✨${
      players[0] || "None"
    }✨`;
  }
  document.getElementById("ledger").innerHTML = ledger
    .map((entry) => `<li>${entry}</li>`)
    .join("");
}

// Randomize players list
function randomizePlayers() {
  players.sort(() => Math.random() - 0.5);
  populateLists();
}

function drawCard() {
  if (players.length === 0) return;
  if (cards.length === 0) {
    alert("No more cards left in the deck. Shuffling...");
    shuffle();
  }

  const randomIndex = Math.floor(Math.random() * cards.length);
  const drawnCard = cards[randomIndex];
  cards.splice(randomIndex, 1); // Remove the drawn card from deck
  // Get active player and move them to moved list
  let activePlayer = players.shift();
  ledger.push(`${activePlayer} drew ${drawnCard}`);
  movedPlayers.push(activePlayer);

  document.getElementById("mostRecentCard").textContent = `${drawnCard}`;
  if (typeof drawnCard !== "number") {
    document.getElementById("card").classList.add("specialCard");
  } else {
    document.getElementById("card").classList.remove("specialCard");
  }

  handleCard(drawnCard, activePlayer);

  populateLists();
}

function handleCard(card, player) {
  // check if card is a number or a string
  if (typeof card === "number") {
    bumpAndAssign(card - 1, player);
  } else {
    handleSpecialCard(card, player);
  }
  updateTable();
}

// Bump function to handle placement collisions
function bumpAndAssign(index, player) {
  if (index >= playerSlots.length) {
    index = 0;
  }
  if (index < 0) {
    index = playerSlots.length - 1;
  }
  let currentIndex = index;
  while (true) {
    if (!playerSlots[currentIndex]) {
      // Spot is empty
      playerSlots[currentIndex] = player;
      break;
    } else {
      let tempPlayer = playerSlots[currentIndex];
      playerSlots[currentIndex] = player;

      // Move onto next spot (consider wrapping)
      currentIndex--;
      if (currentIndex < 0) currentIndex = playerSlots.length - 1;

      if (currentIndex === index) break; // Full cycle completed

      player = tempPlayer; // Continue with bumped-out player.
    }
  }
}

function handleSpecialCard(card, player) {
  let index = 0;
  switch (card) {
    case "Queen":
      // put player behind the first player
      index = 0;
      while (index < playerSlots.length) {
        if (playerSlots[index] === null) {
          index++;
        } else {
          index++;
          bumpAndAssign(index, player);
          return;
        }
      }
      // it didn't find any player in the list. So, it will place the player in the first spot
      bumpAndAssign(0, player);
      return;
    case "Jack":
      // Place player behind the last player
      index = playerSlots.length - 1;
      while (index >= 0) {
        if (playerSlots[index] === null) {
          index--;
        } else {
          index++;
          bumpAndAssign(index, player);
          return;
        }
      }
      // it didn't find any player in the list. So, it will place the player in the first spot
      bumpAndAssign(0, player);
      return;
    case "Joker":
      while (true) {
        // Prompt the user to enter a number between 1 and playerSlots.length
        let choice = parseInt(
          prompt(`${player} pick a position (1 - ${playerSlots.length})`),
          10
        );
        // Validate the input to ensure it's within the correct range
        if (choice >= 1 && choice <= playerSlots.length) {
          bumpAndAssign(choice - 1, player);
          ledger.push(`${player} chose spot ${choice}`);
          return;
        } else {
          alert(
            "Invalid choice. Please enter a number within the specified range."
          );
        }
      }
    case "King":
      // Place player in first spot
      // Bump the existing player to the queue
      if (playerSlots[0]) {
        removeFromChillList(playerSlots[0]);
      }
      playerSlots[0] = player;
      return;
    case "Ace":
      removeFromChillList(player);
      return;
    case "Mirror":
      // Reverse the order of the players
      playerSlots.reverse();
      // Add the player back to the front of the queue
      takeAnotherTurn(player);
      return;
    case "Bomb":
      // Remove all players from the board and place them back in the queue
      takeAnotherTurn(player);
      players = [...players, ...movedPlayers];
      playerSlots = Array(playerSlots.length).fill(null);
      updateTable();
      return;
    default:
      alert("Invalid card, ", card);
      return;
  }
}

function removeFromChillList(player) {
  players.push(player);
  let indexOfCollisionPlayer = movedPlayers.indexOf(player);
  if (indexOfCollisionPlayer !== -1) {
    movedPlayers.splice(indexOfCollisionPlayer, 1);
  }
}

function takeAnotherTurn(player) {
  players.unshift(player);
  let indexOfCollisionPlayer = movedPlayers.indexOf(player);
  if (indexOfCollisionPlayer !== -1) {
    movedPlayers.splice(indexOfCollisionPlayer, 1);
  }
}

// Update table slots display
function updateTable() {
  const rowCells = document.querySelectorAll("#playerTable tbody tr td");
  rowCells.forEach((cell, idx) => {
    const existingNameDiv = cell.querySelector(".name-div"); // Find the existing name div
    if (existingNameDiv) {
      cell.removeChild(existingNameDiv); // Remove the existing name div if it exists
    }
    const nameDiv = document.createElement("div"); // Create a new div for the name
    nameDiv.className = "name-div"; // Add a class name to the new div
    nameDiv.textContent = `${playerSlots[idx] || ""}`; // Set the text content of the name div
    cell.appendChild(nameDiv); // Append the name div to the td
    if (playerSlots[idx]) {
      cell.classList.add("filled");
    } else {
      cell.classList.remove("filled");
    }
  });
}

function createTableSpaces(number) {
  // update the table header width
  var thElement = document.getElementById("draft-order");
  thElement.setAttribute("colspan", number);

  var trElement = document.getElementById("draftersRow");
  trElement.innerHTML = "";

  for (let i = 1; i <= number; i++) {
    const td = document.createElement("td");
    const div = document.createElement("div"); // Create a div for the number label
    div.textContent = i; // Set the text content of the div to the number
    td.appendChild(div); // Append the text node to the td
    trElement.appendChild(td);
  }

  // set the width of each cell
  const width = 100 / number + "%";

  let elements = document.querySelectorAll("th"); // Replace with your actual class or selector
  elements = [...elements, ...document.querySelectorAll("td")]; // Replace with your actual class or selector

  elements.forEach((element) => {
    element.style.width = width;
  });
}

createTableSpaces(players.length); // Creating spaces for number range you mentioned (1 to number)
populateLists(); // Populate lists initially
