const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();

app.use(express.json());

const databasePath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Started");
    });
  } catch (error) {
    console.log(`DB Error ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertDbObjectToPlayerObject = (dbObject) => {
  return {
    playerId: dbObject.player_id,
    playerName: dbObject.player_name,
  };
};

const convertDbObjectToMatchDetailsObject = (dbObject) => {
  return {
    matchId: dbObject.match_id,
    match: dbObject.match,
    year: dbObject.year,
  };
};

app.get("/players/", async (request, response) => {
  const getPlayersFromDb = `
    SELECT
        * 
    FROM
        player_details;
    `;

  const allPlayersArray = await db.all(getPlayersFromDb);
  response.send(
    allPlayersArray.map((eachArray) => convertDbObjectToPlayerObject(eachArray))
  );
});

app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerFromDb = `
    SELECT
        * 
    FROM
        player_details
    WHERE
        player_id = ${playerId};
    `;

  const getPlayerArray = await db.get(getPlayerFromDb);
  response.send(convertDbObjectToPlayerObject(getPlayerArray));
});

app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updatePlayerFromDb = `
    UPDATE
        player_details
    SET
        player_name = '${playerName}'
    WHERE
        player_id = ${playerId};
    `;

  await db.run(updatePlayerFromDb);
  response.send("Player Details Updated");
});

app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getMatchFromDb = `
    SELECT
        * 
    FROM
        match_details
    WHERE
        match_id = ${matchId};
    `;

  const getMatchArray = await db.get(getMatchFromDb);
  response.send(convertDbObjectToMatchDetailsObject(getMatchArray));
});

app.get("/players/:playerId/matches/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerMatchesQuery = `
    SELECT
      *
    FROM player_match_score 
      NATURAL JOIN match_details
    WHERE
      player_id = ${playerId};`;
  const playerMatches = await db.all(getPlayerMatchesQuery);
  response.send(
    playerMatches.map((eachMatch) =>
      convertDbObjectToMatchDetailsObject(eachMatch)
    )
  );
});

app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getMatchPlayersQuery = `
    SELECT
      *
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      match_id = ${matchId};`;
  const playersArray = await db.all(getMatchPlayersQuery);
  response.send(
    playersArray.map((eachPlayer) => convertDbObjectToPlayerObject(eachPlayer))
  );
});

app.get("/players/:playerId/playerScores/", async (request, response) => {
  const { playerId } = request.params;
  const getmatchPlayersQuery = `
    SELECT
      player_id AS playerId,
      player_name AS playerName,
      SUM(score) AS totalScore,
      SUM(fours) AS totalFours,
      SUM(sixes) AS totalSixes
    FROM player_match_score
      NATURAL JOIN player_details
    WHERE
      player_id = ${playerId};`;
  const playersMatchDetails = await db.get(getmatchPlayersQuery);
  response.send(playersMatchDetails);
});

module.exports = app;
