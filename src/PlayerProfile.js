import React, { useEffect, useState } from "react";

export default function PlayerProfile({
  player,
  historyPage,
  setHistoryPage,
  formatDate,
  StatCard,
  Avatar,
}) {
  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const history = player
    ? [...player.records].sort((a, b) =>
        `${b.date}${b.id}`.localeCompare(`${a.date}${a.id}`)
      )
    : [];

  const dates = [
    ...new Set(history.map((record) => record.date).filter(Boolean)),
  ].sort();

  const pageSize = 10;
  const today = new Date();
  const todayString = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  function shiftDate(dateString, amount) {
    const date = new Date(`${dateString}T12:00:00`);
    date.setDate(date.getDate() + amount);
    return [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  }

  function resetHistoryPage(nextRange) {
    setRange(nextRange);
    setHistoryPage(1);
  }

  let start = dates[0] || "";
  let end = todayString;

  if (["7", "14", "30", "90"].includes(range)) {
    start = shiftDate(todayString, -(Number(range) - 1));
  } else if (range === "6months" || range === "12months") {
    const date = new Date(`${todayString}T12:00:00`);
    date.setMonth(date.getMonth() - (range === "6months" ? 6 : 12));
    start = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  } else if (range === "year") {
    start = `${todayString.slice(0, 4)}-01-01`;
  } else if (range === "lastyear") {
    const lastYear = Number(todayString.slice(0, 4)) - 1;
    start = `${lastYear}-01-01`;
    end = `${lastYear}-12-31`;
  } else if (range === "custom") {
    start = customStart || dates[0] || todayString;
    end = customEnd || todayString;
  }

  if (start && end && start > end) {
    [start, end] = [end, start];
  }

  const filteredHistory = history.filter((record) => {
    if (range === "all") return true;
    if (!record.date) return false;
    return record.date >= start && record.date <= end;
  });

  const pageCount = Math.max(
    1,
    Math.ceil(filteredHistory.length / pageSize)
  );
  const currentPage = Math.min(historyPage, pageCount);

  useEffect(() => {
    if (historyPage > pageCount) {
      setHistoryPage(pageCount);
    }
  }, [historyPage, pageCount, setHistoryPage]);

  if (!player) {
    return (
      <div className="panel empty-state">
        <strong>Player not found</strong>
      </div>
    );
  }

  const ranges = [
    ["7", "Last 7 days"],
    ["14", "Last 14 days"],
    ["30", "Last 30 days"],
    ["90", "Last 90 days"],
    ["6months", "Last 6 months"],
    ["12months", "Last 12 months"],
    ["year", "This year"],
    ["lastyear", "Last year"],
    ["all", "All dates"],
    ["custom", "Custom"],
  ];

  const visibleHistory = filteredHistory.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="player-profile-header">
        <Avatar name={player.realName || player.username} large />
        <div className="profile-name">
          <p className="eyebrow">PLAYER PROFILE</p>
          <h1>{player.realName || "Name not provided"}</h1>
          <p>
            {player.username ? `@${player.username}` : "Username not provided"}
          </p>
        </div>
      </div>

      <div className="stats-grid profile-stats">
        <StatCard
          label="Attendance days"
          value={dates.length}
          detail="Distinct dates attended · all time"
          icon="▦"
        />
        <StatCard
          label="Attendance records"
          value={dates.length}
          detail="One record per date · all time"
          icon="▤"
        />
        <StatCard
          label="First attended"
          value={
            dates.length
              ? formatDate(dates[0], {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          detail={dates.length ? dates[0].slice(0, 4) : "No attendance date"}
          icon="◷"
        />
        <StatCard
          label="Last attended"
          value={
            dates.length
              ? formatDate(dates[dates.length - 1], {
                  month: "short",
                  day: "numeric",
                })
              : "—"
          }
          detail={
            dates.length
              ? formatDate(dates[dates.length - 1], { year: "numeric" })
              : "No attendance date"
          }
          icon="◷"
        />
      </div>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Attendance history</h2>
            <p>
              Filter this player's attendance without changing the all-time
              summary cards or other pages.
            </p>
          </div>
        </div>

        <div className="table-toolbar">
          <label className="inline-filter">
            Date range
            <select
              value={range}
              onChange={(event) => resetHistoryPage(event.target.value)}
            >
              {ranges.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </label>
        </div>

        {range === "custom" && (
          <div className="custom-date-fields table-custom-dates">
            <label>
              From
              <input
                type="date"
                value={customStart}
                max={customEnd || undefined}
                onChange={(event) => {
                  setCustomStart(event.target.value);
                  setHistoryPage(1);
                }}
              />
            </label>
            <label>
              To
              <input
                type="date"
                value={customEnd}
                min={customStart || undefined}
                onChange={(event) => {
                  setCustomEnd(event.target.value);
                  setHistoryPage(1);
                }}
              />
            </label>
          </div>
        )}

        {visibleHistory.length ? (
          <div className="player-history">
            {visibleHistory.map((record) => (
              <div className="history-date-group" key={record.id}>
                <div className="history-date-heading">
                  <strong>
                    {formatDate(record.date, {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </strong>
                  <span>Attended</span>
                </div>
                {record.notes && (
                  <div className="history-row">
                    <span className="history-notes">{record.notes}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state compact">
            No attendance history matches this date range.
          </div>
        )}

        <div className="table-footer">
          <span>
            {filteredHistory.length
              ? `${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  filteredHistory.length
                )} of ${filteredHistory.length} records`
              : "0 records"}
          </span>
          <div className="pagination">
            <button
              disabled={currentPage <= 1}
              onClick={() => setHistoryPage(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {pageCount}
            </span>
            <button
              disabled={currentPage >= pageCount}
              onClick={() => setHistoryPage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </section>
    </>
  );
}