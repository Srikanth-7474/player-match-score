const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const dbPath = path.join(__dirname, "cricketMatchDetails.db");
const app = express();
app.use(express.json());

let db = null;
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//get players API
app.get("/players/", async (request, response) => {
  const getPlayersQuery = `
    SELECT 
      player_id AS playerId,
      player_name AS playerName
    FROM 
      player_details;`;
  const playersArray = await db.all(getPlayersQuery);
  response.send(playersArray);
});

//get player API
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName
    FROM 
      player_details
    WHERE player_id = ${playerId};`;
  const player = await db.get(getPlayerQuery);
  response.send(player);
});

//update player API
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerQuery = `
    UPDATE
      player_details
    SET 
      player_name = '${playerName}'
    WHERE player_id = ${playerId};`;
  await db.run(updatePlayerQuery);
  response.send("Player Details Updated");
});

//get match API
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchQuery = `
    SELECT
      match_id AS matchId,
      match,
      year
    FROM match_details
    WHERE match_id = ${matchId};`;
  const match = await db.get(getMatchQuery);
  response.send(match);
});

//get list of all matches of a player API
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getAllMatchesOfPlayerQuery = `
    SELECT 
      match_id AS matchId,
      match,
      year
    FROM match_details 
        NATURAL JOIN 
      player_match_score
    WHERE player_id = ${playerId};`;
  const allMatches = await db.all(getAllMatchesOfPlayerQuery);
  response.send(allMatches);
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayersOfMatchQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName
    FROM player_details
       NATURAL JOIN
      player_match_score
    WHERE match_id = ${matchId};`;

  const players = await db.all(getPlayersOfMatchQuery);
  response.send(players);
});

//get statistics API
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getStatsQuery = `
    SELECT
        player_id AS playerId,
        player_name AS playerName,
        SUM(score) AS totalScore,
        SUM(fours) AS totalFours,
        SUM(sixes) AS totalSixes
    FROM player_details
            NATURAL JOIN
         player_match_score
    WHERE player_id = ${playerId};`;

  const stats = await db.get(getStatsQuery);
  response.send(stats);
});

module.exports = app;
