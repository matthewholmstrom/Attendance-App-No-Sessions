import React from "react";

export default function Attendance({
  attendanceRows,
  attendancePage,
  setAttendancePage,
  pageSize,
  search,
  setSearch,
  range,
  setRange,
  customStart,
  setCustomStart,
  customEnd,
  setCustomEnd,
  exportAttendance,
  openPlayer,
  players,
  formatDate,
  PlayerCell,
}) {
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

  const query = search.trim().toLowerCase();
  const searchedRows = attendanceRows.filter((record) =>
    `${record.username || ""} ${record.realName || ""}`
      .toLowerCase()
      .includes(query)
  );

  const filteredPageCount = Math.max(
    1,
    Math.ceil(searchedRows.length / pageSize)
  );
  const currentPage = Math.min(attendancePage, filteredPageCount);
  const visibleRows = searchedRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">RECORDS</p>
          <h1>Attendance history</h1>
          <p className="page-description">
            Browse, search, and export attendance by player and date.
          </p>
        </div>
        <div className="heading-actions">
          <button
            className="button button-secondary"
            onClick={exportAttendance}
          >
            Export CSV
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="table-toolbar">
          <div className="search-box">
            <span>⌕</span>
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setAttendancePage(1);
              }}
              placeholder="Search players by name or username"
            />
          </div>

          <label className="inline-filter">
            Date range
            <select
              value={range}
              onChange={(event) => {
                setRange(event.target.value);
                setAttendancePage(1);
              }}
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
                  setAttendancePage(1);
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
                  setAttendancePage(1);
                }}
              />
            </label>
          </div>
        )}

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Player</th>
                <th>Date</th>
                <th>Notes</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((record) => (
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
                  <td className="notes-cell">{record.notes || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {!visibleRows.length && (
            <div className="empty-state compact">
              No attendance records match these filters.
            </div>
          )}
        </div>

        <div className="table-footer">
          <span>
            {searchedRows.length
              ? `${(currentPage - 1) * pageSize + 1}–${Math.min(
                  currentPage * pageSize,
                  searchedRows.length
                )} of ${searchedRows.length} records`
              : "0 records"}
          </span>
          <div className="pagination">
            <button
              disabled={currentPage <= 1}
              onClick={() => setAttendancePage(currentPage - 1)}
            >
              Previous
            </button>
            <span>
              Page {currentPage} of {filteredPageCount}
            </span>
            <button
              disabled={currentPage >= filteredPageCount}
              onClick={() => setAttendancePage(currentPage + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  );
}