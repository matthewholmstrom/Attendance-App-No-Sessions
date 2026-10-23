import React from "react";

export default function Dashboard({
  filteredRecords,
  players,
  range,
  setRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  chart,
  renderChart,
  openPlayer,
  setPage,
  notice,
  setNotice,
  formatDate,
  uniquePlayers,
  StatCard,
  Avatar,
  PlayerCell,
}) {
  const activeDates = new Set(
    filteredRecords.map((record) => record.date).filter(Boolean)
  ).size;

  const playersInPeriod = uniquePlayers(filteredRecords).length;

  const frequentPlayers = uniquePlayers(filteredRecords)
    .map((player) => ({
      ...player,
      attendanceDays: new Set(
        player.records.map((record) => record.date).filter(Boolean)
      ).size,
    }))
    .sort(
      (a, b) =>
        b.attendanceDays - a.attendanceDays ||
        (a.realName || a.username).localeCompare(b.realName || b.username)
    )
    .slice(0, 5);

  const ranges = [
    ["7", "7 days"],
    ["14", "14 days"],
    ["30", "30 days"],
    ["90", "90 days"],
    ["6months", "6 months"],
    ["12months", "12 months"],
    ["year", "This year"],
    ["lastyear", "Last year"],
    ["all", "All dates"],
    ["custom", "Custom"],
  ];

  const recentRecords = [
    ...filteredRecords,
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">CLUB OVERVIEW</p>
          <h1>Attendance</h1>
          <p className="page-description">
            A clear view of who attended and when.
          </p>
        </div>
      </div>

      {notice && (
        <div className="notice">
          <span>{notice}</span>
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}

      <div className="filter-row">
        <div className="range-buttons" aria-label="Attendance date range">
          {ranges.map(([value, label]) => (
            <button
              key={value}
              className={`range-button ${range === value ? "active" : ""}`}
              onClick={() => setRange(value)}
            >
              {label}
            </button>
          ))}
        </div>

        {range === "custom" && (
          <div className="custom-date-fields">
            <label>
              From
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => setCustomStart(event.target.value)}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => setCustomEnd(event.target.value)}
              />
            </label>
          </div>
        )}
      </div>

      <div className="stats-grid">
        <StatCard
          label="Player-attendance days"
          value={filteredRecords.length}
          detail="One record per player per date"
          icon="▤"
        />
        <StatCard
          label="Players"
          value={playersInPeriod}
          detail="Distinct player accounts"
          icon="♙"
        />
        <StatCard
          label="Attendance dates"
          value={activeDates}
          detail="Days with at least one attendee"
          icon="▦"
        />
        <StatCard
          label="Average attendance"
          value={
            activeDates
              ? (
                  filteredRecords.length / activeDates
                ).toFixed(1)
              : "—"
          }
          detail="Players per attendance date"
          icon="◷"
        />
      </div>

      <section className="panel chart-panel">
        <div className="panel-heading">
          <div>
            <h2>Attendance Over Time</h2>
            <p>
              {chart.useMonthly
                ? "Player-attendance days per month."
                : "Unique players attending each day."}
            </p>
          </div>
          <span className="subtle-tag">
            {chart.useMonthly ? "Monthly view" : "Daily view"}
          </span>
        </div>
        {renderChart()}
      </section>

      <div className="content-grid">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent attendance</h2>
              <p>Latest attendance dates in the selected period.</p>
            </div>
            <button
              className="text-button"
              onClick={() => setPage("attendance")}
            >
              View all <span>→</span>
            </button>
          </div>

          {recentRecords.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Player</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentRecords.map((record) => (
                    <tr key={record.id}>
                      <td>
                        <PlayerCell
                          record={record}
                          onClick={() => {
                            const key =
                              (record.username || "").trim().toLowerCase() ||
                              (record.realName || "").trim().toLowerCase();

                            const player = players.find(
                              (item) => item.key === key
                            );

                            if (player) openPlayer(player);
                          }}
                        />
                      </td>
                      <td>
                        {formatDate(record.date, {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state compact">
              No records found for these dates.
            </div>
          )}
        </section>

        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Frequent Attendees</h2>
              <p>
                Players who attended on the most days during the selected
                period.
              </p>
            </div>
          </div>

          {frequentPlayers.length ? (
            <div className="frequent-list">
              {frequentPlayers.map((player) => (
                <button
                  className="frequent-item"
                  key={player.key}
                  onClick={() => openPlayer(player)}
                >
                  <Avatar name={player.realName || player.username} />
                  <span className="frequent-name">
                    <strong>{player.realName || player.username}</strong>
                    <small>{player.username || "Username not provided"}</small>
                  </span>
                  <span
                    className="attendance-count"
                    title="Distinct dates attended"
                  >
                    {player.attendanceDays}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              No players in this period.
            </div>
          )}
        </section>
      </div>
    </>
  );
}