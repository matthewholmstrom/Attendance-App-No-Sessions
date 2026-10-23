import React from "react";

export default function Players({
  players,
  filteredPlayers,
  search,
  setSearch,
  openPlayer,
  formatDate,
  Avatar,
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PLAYER DIRECTORY</p>
          <h1>Players</h1>
          <p className="page-description">
            Find a player and review their attendance history.
          </p>
        </div>
        <span className="subtle-tag">{players.length} players</span>
      </div>

      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name or username"
            />
          </div>
        </div>

        {filteredPlayers.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Username</th>
                  <th>Attendance days</th>
                  <th>Last attended</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filteredPlayers.map((player) => {
                  const dates = [
                    ...new Set(
                      player.records
                        .map((record) => record.date)
                        .filter(Boolean)
                    ),
                  ].sort();

                  return (
                    <tr key={player.key}>
                      <td>
                        <div className="player-cell">
                          <Avatar name={player.realName || player.username} />
                          <strong>
                            {player.realName || "Name not provided"}
                          </strong>
                        </div>
                      </td>
                      <td>{player.username || "—"}</td>
                      <td>{dates.length.toLocaleString()}</td>
                      <td>
                        {dates.length
                          ? formatDate(dates[dates.length - 1], {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td>
                        <button
                          className="text-button"
                          onClick={() => openPlayer(player)}
                        >
                          View profile →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            No players found. Import a CSV to add attendance data.
          </div>
        )}
      </div>
    </>
  );
}