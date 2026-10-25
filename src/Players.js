import React, { useEffect, useState } from "react";

export default function Players({
  players,
  filteredPlayers,
  search,
  setSearch,
  openPlayer,
  formatDate,
  Avatar,
}) {
  const [playersPage, setPlayersPage] = useState(1);
  const pageSize = 10;

  const pageCount = Math.max(
    1,
    Math.ceil(filteredPlayers.length / pageSize)
  );

  const currentPage = Math.min(playersPage, pageCount);

  const visiblePlayers = filteredPlayers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    setPlayersPage(1);
  }, [search]);

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

        {visiblePlayers.length ? (
          <>
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
                  {visiblePlayers.map((player) => {
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

            <div className="table-footer">
              <span>
                {`${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  filteredPlayers.length
                )} of ${filteredPlayers.length} players`}
              </span>

              <div className="pagination">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setPlayersPage(currentPage - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {currentPage} of {pageCount}
                </span>
                <button
                  disabled={currentPage >= pageCount}
                  onClick={() => setPlayersPage(currentPage + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="empty-state">
            No players found. Import a CSV to add attendance data.
          </div>
        )}
      </div>
    </>
  );
}