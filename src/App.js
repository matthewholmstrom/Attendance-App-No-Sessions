import React, { useEffect, useMemo, useState } from "react";
import "./App.css";
import Dashboard from "./Dashboard";
import Attendance from "./Attendance";
import Players from "./Players";
import PlayerProfile from "./PlayerProfile";

const RECORDS_KEY = "club-attendance-app-v2";
const HISTORY_KEY = "club-attendance-import-history-v1";
const PAGE_SIZE = 10;

const FIELD_LABELS = {
  username: "Username",
  realName: "Real name",
  date: "Attendance date",
  notes: "Notes",
};

const DEMO_RECORDS = [
  { id: "demo-1", username: "mgarcia", realName: "Maria Garcia", date: "2026-10-12", notes: "" },
  { id: "demo-2", username: "jlee", realName: "Jordan Lee", date: "2026-10-12", notes: "" },
  { id: "demo-3", username: "rpatel", realName: "Ravi Patel", date: "2026-10-13", notes: "" },
  { id: "demo-4", username: "awilson", realName: "Alex Wilson", date: "2026-10-13", notes: "" },
  { id: "demo-5", username: "mgarcia", realName: "Maria Garcia", date: "2026-10-15", notes: "" },
  { id: "demo-6", username: "jlee", realName: "Jordan Lee", date: "2026-10-16", notes: "" },
  { id: "demo-7", username: "rpatel", realName: "Ravi Patel", date: "2026-10-17", notes: "" },
  { id: "demo-8", username: "awilson", realName: "Alex Wilson", date: "2026-10-17", notes: "" },
];

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function normalizeHeader(value) {
  return String(value || "")
    .replace(/^\uFEFF/, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function normalizeValue(value) {
  return String(value || "").trim();
}

function normalizeDate(value) {
  const text = normalizeValue(value);
  if (!text) return "";

  const iso = text.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (iso) {
    return `${iso[1]}-${String(iso[2]).padStart(2, "0")}-${String(
      iso[3]
    ).padStart(2, "0")}`;
  }

  const us = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (us) {
    return `${us[3]}-${String(us[1]).padStart(2, "0")}-${String(
      us[2]
    ).padStart(2, "0")}`;
  }

  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return "";

  return [
    parsed.getFullYear(),
    String(parsed.getMonth() + 1).padStart(2, "0"),
    String(parsed.getDate()).padStart(2, "0"),
  ].join("-");
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let value = "";
  let inQuotes = false;
  const source = String(text || "").replace(/^\uFEFF/, "");

  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    const next = source[i + 1];

    if (char === '"' && inQuotes && next === '"') {
      value += '"';
      i += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(value);
      if (row.some((cell) => cell.trim() !== "")) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.trim() !== "")) rows.push(row);

  if (!rows.length) return { headers: [], rows: [] };



  const headers = rows[0].map((header) => normalizeValue(header));

 const nonemptyHeaders = headers.filter(
    (header) => header !== ""
  );

  if (nonemptyHeaders.length < 2) {
    throw new Error(
      "The first row of the CSV must contain at least two nonempty column headers separated by commas."
    );
  }

  const dataRows = rows.slice(1).map((cells) =>
    headers.map((_, index) => normalizeValue(cells[index]))
  );

  return { headers, rows: dataRows };
}

function guessMapping(headers) {
  const normalized = headers.map(normalizeHeader);

  function findIndex(terms) {
    return normalized.findIndex((header) =>
      terms.some((term) => header === term || header.includes(term))
    );

  }
    function findNameIndex() {
    return (
      findIndex(["realname", "fullname", "playername", "displayname"]) !== -1
        ? findIndex(["realname", "fullname", "playername", "displayname"])
        : findIndex(["name"])
    );
  }


  return {
    username: findIndex(["username", "userid", "user", "playerusername", "account"]),
    realName: findNameIndex(),
    date: findIndex(["attendancedate", "date", "day", "attendedon"]),
    notes: findIndex(["notes", "note", "comments", "comment"]),
  };
}

function formatDate(value, options = {}) {
  if (!value) return "—";
  const date = new Date(`${value}T12:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", options);
}

function getToday() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
}

function shiftDate(dateString, amount) {
  const date = new Date(`${dateString}T12:00:00`);
  date.setDate(date.getDate() + amount);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function getRangeBounds(range, customStart, customEnd, records) {
  const today = getToday();
  const datedRecords = records
    .map((record) => record.date)
    .filter(Boolean)
    .sort();

  let start = datedRecords[0] || today;
  let end = today;

  if (["7", "14", "30", "90"].includes(range)) {
    start = shiftDate(today, -(Number(range) - 1));
  } else if (range === "6months" || range === "12months") {
    const date = new Date(`${today}T12:00:00`);
    date.setMonth(date.getMonth() - (range === "6months" ? 6 : 12));
    start = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0"),
    ].join("-");
  } else if (range === "year") {
    start = `${today.slice(0, 4)}-01-01`;
  } else if (range === "lastyear") {
    const year = Number(today.slice(0, 4)) - 1;
    start = `${year}-01-01`;
    end = `${year}-12-31`;
  } else if (range === "custom") {
    start = customStart || datedRecords[0] || today;
    end = customEnd || today;
  } else if (range === "all") {
    start = datedRecords[0] || today;
  }

  if (start > end) [start, end] = [end, start];

  return { start, end };
}

function getPlayerKey(record) {
  return (
    normalizeValue(record.username).toLowerCase() ||
    normalizeValue(record.realName).toLowerCase()
  );
}

function deduplicateRecords(records) {
  const grouped = new Map();

  records.forEach((record) => {
    const username = normalizeValue(record.username);
    const realName = normalizeValue(record.realName);
    const date = normalizeDate(record.date);
    if ((!username && !realName) || !date) return;

    const key = `${username.toLowerCase() || realName.toLowerCase()}|${date}`;
    const existing = grouped.get(key);

    if (!existing) {
      grouped.set(key, {
        id: record.id || makeId(),
        username,
        realName,
        date,
        notes: normalizeValue(record.notes),
      });
    } else {
      if (!existing.username && username) existing.username = username;
      if (!existing.realName && realName) existing.realName = realName;
      if (!existing.notes && record.notes) {
        existing.notes = normalizeValue(record.notes);
      }
    }
  });

  return [...grouped.values()].sort((a, b) =>
    `${b.date}${b.username}`.localeCompare(`${a.date}${a.username}`)
  );
}

function uniquePlayers(records) {
  const grouped = new Map();

  records.forEach((record) => {
    const key = getPlayerKey(record);
    if (!key) return;

    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        username: record.username || "",
        realName: record.realName || "",
        records: [],
      });
    }

    const player = grouped.get(key);
    if (!player.username && record.username) player.username = record.username;
    if (!player.realName && record.realName) player.realName = record.realName;
    player.records.push(record);
  });

  return [...grouped.values()].sort((a, b) =>
    (a.realName || a.username).localeCompare(b.realName || b.username)
  );
}

function escapeCSV(value) {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function makeChartBuckets(records, start, end) {
  const first = new Date(`${start}T12:00:00`);
  const last = new Date(`${end}T12:00:00`);
  const days = Math.max(
    1,
    Math.round((last.getTime() - first.getTime()) / 86400000) + 1
  );
  const useMonthly = days > 45;
  const buckets = new Map();

  if (useMonthly) {
    const cursor = new Date(first.getFullYear(), first.getMonth(), 1);
    const finalMonth = new Date(last.getFullYear(), last.getMonth(), 1);

    while (cursor <= finalMonth) {
      const key = `${cursor.getFullYear()}-${String(
        cursor.getMonth() + 1
      ).padStart(2, "0")}`;
      buckets.set(key, {
        key,
        count: 0,
        label: cursor.toLocaleDateString("en-US", { month: "short" }),
        fullLabel: cursor.toLocaleDateString("en-US", {
          month: "long",
          year: "numeric",
        }),
        players: new Set(),
      });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  } else {
    const cursor = new Date(first);
    while (cursor <= last) {
      const key = [
        cursor.getFullYear(),
        String(cursor.getMonth() + 1).padStart(2, "0"),
        String(cursor.getDate()).padStart(2, "0"),
      ].join("-");
      buckets.set(key, {
        key,
        count: 0,
        label: String(cursor.getDate()),
        fullLabel: cursor.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        players: new Set(),
      });
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  records.forEach((record) => {
    const key = useMonthly ? record.date.slice(0, 7) : record.date;
    const bucket = buckets.get(key);
    const playerKey = getPlayerKey(record);
    if (bucket && playerKey) bucket.players.add(playerKey);
  });

  const result = [...buckets.values()].map((bucket) => ({
    ...bucket,
    count: bucket.players.size,
  }));

  return { buckets: result, start, end, useMonthly };
}

function StatCard({ label, value, detail, icon }) {
  return (
    <div className="stat-card">
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-detail">{detail}</span>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }) {
  return (
    <button
      className={`nav-item ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

function Avatar({ name, large = false }) {
  const initials = normalizeValue(name)
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  return (
    <span className={`avatar ${large ? "avatar-large" : ""}`}>
      {initials || "?"}
    </span>
  );
}

function PlayerCell({ record, onClick }) {
  return (
    <button className="player-cell player-cell-button" onClick={onClick}>
      <Avatar name={record.realName || record.username} />
      <span>
        <strong>{record.realName || "Name not provided"}</strong>
        <small>{record.username || "Username not provided"}</small>
      </span>
    </button>
  );
}

function App() {
  const [records, setRecords] = useState(() =>
    deduplicateRecords(
      readStorage(RECORDS_KEY, DEMO_RECORDS).map((record) => ({
        ...record,
        date: normalizeDate(record.date),
        notes: record.notes || "",
      }))
    )
  );
  const [importHistory, setImportHistory] = useState(() =>
    readStorage(HISTORY_KEY, [])
  );
  const [page, setPage] = useState("dashboard");
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [search, setSearch] = useState("");
  const [range, setRange] = useState("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [fileData, setFileData] = useState(null);
  const [mapping, setMapping] = useState({});
  const [importMode, setImportMode] = useState("replace");
  const [importError, setImportError] = useState("");
  const [notice, setNotice] = useState("");
  const [attendancePage, setAttendancePage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [importRange, setImportRange] = useState("all");
  const [importCustomStart, setImportCustomStart] = useState("");
  const [importCustomEnd, setImportCustomEnd] = useState("");
  const [importPage, setImportPage] = useState(1);

  useEffect(() => {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(importHistory));
  }, [importHistory]);

  const players = useMemo(() => uniquePlayers(records), [records]);

  const filteredRecords = useMemo(() => {
    const bounds = getRangeBounds(range, customStart, customEnd, records);
    if (range === "all") return records;

    return records.filter(
      (record) =>
        record.date &&
        record.date >= bounds.start &&
        record.date <= bounds.end
    );
  }, [records, range, customStart, customEnd]);

  const chart = useMemo(() => {
    const bounds = getRangeBounds(range, customStart, customEnd, records);
    return makeChartBuckets(filteredRecords, bounds.start, bounds.end);
  }, [filteredRecords, range, customStart, customEnd, records]);

  const filteredPlayers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players.filter((player) =>
      `${player.username} ${player.realName}`.toLowerCase().includes(query)
    );
  }, [players, search]);

  const attendanceRows = useMemo(
    () =>
      [...filteredRecords].sort((a, b) =>
        `${b.date}${b.username}`.localeCompare(`${a.date}${a.username}`)
      ),
    [filteredRecords]
  );

  const selectedPlayerData = selectedPlayer
    ? players.find((player) => player.key === selectedPlayer) || null
    : null;

  useEffect(() => {
    setAttendancePage(1);
  }, [range, customStart, customEnd, search]);

  function openPlayer(player) {
    setSelectedPlayer(player.key);
    setHistoryPage(1);
    setPage("player");
  }


async function handleFile(event) {
  const file = event.target.files?.[0];
  event.target.value = "";

  if (!file) return;

  setImportError("");
  setFileData(null);

  try {
    const text = await file.text();
    const parsed = parseCSV(text);

    if (!parsed.headers.length) {
      setImportError(
        "The selected CSV file appears to be empty."
      );
      return;
    }

    setFileData({
      name: file.name,
      originalCSV: text,
      headers: parsed.headers,
      rows: parsed.rows,
    });

    setMapping(guessMapping(parsed.headers));
  } catch (error) {
    setImportError(
      error.message ||
        "Could not read this file. Please select a properly formatted CSV file."
    );
  }
}


  function commitImport() {
    if (!fileData) return;

    const hasUsername = Number.isInteger(mapping.username) && mapping.username >= 0;
    const hasRealName = Number.isInteger(mapping.realName) && mapping.realName >= 0;
    const hasDate = Number.isInteger(mapping.date) && mapping.date >= 0;

    if ((!hasUsername && !hasRealName) || !hasDate) {
      setImportError(
        "Choose a date column and at least one player identifier: username or real name."
      );
      return;
    }

    const imported = [];
    let skippedCount = 0;

    fileData.rows.forEach((row) => {
      const username = hasUsername
        ? normalizeValue(row[mapping.username])
        : "";
      const realName = hasRealName
        ? normalizeValue(row[mapping.realName])
        : "";
      const date = normalizeDate(row[mapping.date]);
      const notes =
        Number.isInteger(mapping.notes) && mapping.notes >= 0
          ? normalizeValue(row[mapping.notes])
          : "";

      if ((!username && !realName) || !date) {
        skippedCount += 1;
        return;
      }

      imported.push({
        id: makeId(),
        username,
        realName,
        date,
        notes,
      });
    });

    if (!imported.length) {
      setImportError(
        "No usable rows were found. Check the player and date column mappings."
      );
      return;
    }

    const deduplicatedImport = deduplicateRecords(imported);

    setRecords((previous) =>
      deduplicateRecords(
        importMode === "append"
          ? [...previous, ...deduplicatedImport]
          : deduplicatedImport
      )
    );

    setImportHistory((previous) => [
      {
        id: makeId(),
        fileName: fileData.name,
        importedAt: new Date().toISOString(),
        rowCount: deduplicatedImport.length,
        skippedCount,
        mode: importMode,
        originalCSV: fileData.originalCSV,
      },
      ...previous,
    ]);

    setNotice(
      `Imported ${deduplicatedImport.length} attendance records${
        skippedCount ? `; skipped ${skippedCount} unusable rows` : ""
      }.`
    );
    setFileData(null);
    setImportError("");
    setRange("all");
    setSearch("");
    setPage("dashboard");
  }

  function exportAttendance() {
    const header = ["Username", "Real Name", "Date", "Notes"];
    const rows = attendanceRows.map((record) => [
      record.username,
      record.realName,
      record.date,
      record.notes,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map(escapeCSV).join(","))
      .join("\r\n");

    downloadText("attendance.csv", csv);
  }

  function removeImport(id) {
    const confirmed = window.confirm(
      "Delete this import from the import history? This does not change attendance records."
    );
    if (!confirmed) return;
    setImportHistory((previous) => previous.filter((item) => item.id !== id));
  }

  function clearAttendance() {
    const confirmed = window.confirm(
      "Clear all attendance records from this browser? This cannot be undone."
    );
    if (!confirmed) return;
    setRecords([]);
    setNotice("Attendance records cleared.");
  }

  function renderChart() {
    const { buckets, start, end, useMonthly } = chart;
    const max = Math.max(1, ...buckets.map((bucket) => bucket.count));
    const labelEvery =
      buckets.length > 24 ? Math.ceil(buckets.length / 8) : buckets.length > 14 ? 3 : 1;

    if (!filteredRecords.length) {
      return (
        <div className="empty-state">
          <span className="empty-icon">▥</span>
          <strong>No attendance in this period</strong>
          <span>Choose another date range or import an attendance CSV.</span>
        </div>
      );
    }

    const totalPlayerDays = buckets.reduce(
      (sum, bucket) => sum + bucket.count,
      0
    );

    return (
      <>
        <div className="chart-summary">
          <div>
            <span className="eyebrow">
              {useMonthly ? "TOTAL ATTENDANCE" : "TOTAL ATTENDANCE"}
            </span>
            <strong>{totalPlayerDays.toLocaleString()}</strong>
          </div>
          <span className="chart-period">
            {formatDate(start, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}{" "}
            –{" "}
            {formatDate(end, {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </span>
        </div>

        <div className={`bar-chart ${useMonthly ? "monthly-chart" : "daily-chart"}`}>
          {buckets.map((bucket, index) => (
            <div
              className="bar-column"
              key={bucket.key}
              title={`${bucket.fullLabel}: ${bucket.count} ${
                bucket.count === 1 ? "player-attendance day" : "player-attendance days"
              }`}
            >
              <span className="bar-value">{bucket.count || ""}</span>
              <div className="bar-track">
                <div
                  className={`bar ${bucket.count === 0 ? "bar-empty" : ""}`}
                  style={{
                    height: `${
                      bucket.count ? Math.max(5, (bucket.count / max) * 100) : 0
                    }%`,
                  }}
                />
              </div>
              <span
                className={`bar-label ${
                  index % labelEvery !== 0 && index !== buckets.length - 1
                    ? "label-hidden"
                    : ""
                }`}
              >
                {bucket.label}
              </span>
            </div>
          ))}
        </div>

        <div className="chart-footnote"> 
          Hover over a bar to see the date and attendance count.
        </div>
      </>
    );
  }

  function renderImports() {
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

    const importRecords = importHistory.map((item) => ({
      ...item,
      date: normalizeDate(item.importedAt),
    }));
    const bounds = getRangeBounds(
      importRange,
      importCustomStart,
      importCustomEnd,
      importRecords
    );
    const filteredImports =
      importRange === "all"
        ? importHistory
        : importHistory.filter((item) => {
            const date = normalizeDate(item.importedAt);
            return date && date >= bounds.start && date <= bounds.end;
          });

    const importPageCount = Math.max(
      1,
      Math.ceil(filteredImports.length / PAGE_SIZE)
    );
    const currentImportPage = Math.min(importPage, importPageCount);
    const visibleImports = filteredImports.slice(
      (currentImportPage - 1) * PAGE_SIZE,
      currentImportPage * PAGE_SIZE
    );

    return (
      <>
        <div className="page-heading">
          <div>
            <p className="eyebrow">DATA MANAGEMENT</p>
            <h1>CSV imports</h1>
            <p className="page-description">
              Import attendance records and keep a history of original files.
            </p>
          </div>
          <label className="button button-primary file-button">
            Choose CSV file
            <input type="file" accept=".csv,text/csv" onChange={handleFile} />
          </label>
        </div>

        {importError && (
          <div className="error-notice">
            {importError}
            <button onClick={() => setImportError("")}>×</button>
          </div>
        )}

        {fileData && (
          <section className="panel import-wizard">
            <div className="panel-heading import-review">
              <div>
                <h2>Review import</h2>
                <p>
                  File: <strong>{fileData.name}</strong> · {fileData.rows.length} data
                  rows detected
                </p>
              </div>
              <button className="text-button" onClick={() => setFileData(null)}>
                Cancel
              </button>
            </div>

            <div className="mapping-grid">
              {Object.entries(FIELD_LABELS).map(([field, label]) => (
                <label className="mapping-field" key={field}>
                  <span>
                    {label}
                    {["username", "realName", "date"].includes(field) ? " *" : ""}
                  </span>
                  <select
                    value={Number.isInteger(mapping[field]) ? mapping[field] : -1}
                    onChange={(event) =>
                      setMapping((previous) => ({
                        ...previous,
                        [field]: Number(event.target.value),
                      }))
                    }
                  >
                    <option value={-1}>Do not import</option>
                    {fileData.headers.map((header, index) => (
                      <option value={index} key={`${header}-${index}`}>
                        {header}
                      </option>
                    ))}
                  </select>
                </label>
              ))}
            </div>

            <div className="import-mode">
              <span className="field-title">
                How should these records be imported?
              </span>
              <label>
                <input
                  type="radio"
                  checked={importMode === "replace"}
                  onChange={() => setImportMode("replace")}
                />
                Replace existing attendance records
              </label>
              <label>
                <input
                  type="radio"
                  checked={importMode === "append"}
                  onChange={() => setImportMode("append")}
                />
                Add these rows to existing records
              </label>
            </div>

            <div className="preview-heading">
              <strong>Preview</strong>
              <span>First 5 rows</span>
            </div>

            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    {fileData.headers.map((header, index) => (
                      <th key={`${header}-${index}`}>{header}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fileData.rows.slice(0, 5).map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {fileData.headers.map((header, index) => (
                        <td key={`${rowIndex}-${index}`}>{row[index] || "—"}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="wizard-footer">
              <span>
                Rows without a usable player name/username or date will be skipped.
              </span>
              <button className="button button-primary" onClick={commitImport}>
                Import {fileData.rows.length} rows
              </button>
            </div>
          </section>
        )}

        <section className="panel">
          <div className="panel-heading csv">
            <div>
              <h2>Import history</h2>
              <p>Original CSV files and details of previous imports.</p>
            </div>
            <span className="subtle-tag">{filteredImports.length} imports</span>
          </div>

          <div className="table-toolbar">
            <label className="inline-filter">
              Date range
              <select
                value={importRange}
                onChange={(event) => {
                  setImportRange(event.target.value);
                  setImportPage(1);
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

          {importRange === "custom" && (
            <div className="custom-date-fields table-custom-dates">
              <label>
                From
                <input
                  type="date"
                  value={importCustomStart}
                  max={importCustomEnd || undefined}
                  onChange={(event) => {
                    setImportCustomStart(event.target.value);
                    setImportPage(1);
                  }}
                />
              </label>
              <label>
                To
                <input
                  type="date"
                  value={importCustomEnd}
                  min={importCustomStart || undefined}
                  onChange={(event) => {
                    setImportCustomEnd(event.target.value);
                    setImportPage(1);
                  }}
                />
              </label>
            </div>
          )}

          {filteredImports.length ? (
            <>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>File</th>
                      <th>Imported</th>
                      <th>Records imported</th>
                      <th>Skipped</th>
                      <th>Mode</th>
                      <th>Original file</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleImports.map((item) => (
                      <tr key={item.id}>
                        <td>
                          <div className="file-name-cell">
                            <span className="file-icon">CSV</span>
                            <strong>{item.fileName}</strong>
                          </div>
                        </td>
                        <td>{new Date(item.importedAt).toLocaleString()}</td>
                        <td>{item.rowCount}</td>
                        <td>{item.skippedCount}</td>
                        <td>
                          <span className="mode-pill">
                            {item.mode === "append" ? "Appended" : "Replaced"}
                          </span>
                        </td>
                        <td>
                          <button
                            className="text-button"
                            onClick={() =>
                              downloadText(
                                item.fileName || "original.csv",
                                item.originalCSV || ""
                              )
                            }
                          >
                            Download CSV
                          </button>
                        </td>
                        <td>
                          <button
                            className="icon-button danger-text"
                            title="Remove from import history"
                            onClick={() => removeImport(item.id)}
                          >
                            ×
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="table-footer">
                <span>
                  {(currentImportPage - 1) * PAGE_SIZE + 1}–
                  {Math.min(currentImportPage * PAGE_SIZE, filteredImports.length)} of{" "}
                  {filteredImports.length} imports
                </span>
                <div className="pagination">
                  <button
                    disabled={currentImportPage <= 1}
                    onClick={() => setImportPage(currentImportPage - 1)}
                  >
                    Previous
                  </button>
                  <span>
                    Page {currentImportPage} of {importPageCount}
                  </span>
                  <button
                    disabled={currentImportPage >= importPageCount}
                    onClick={() => setImportPage(currentImportPage + 1)}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">⇧</span>
              <strong>No imports found</strong>
              <span>Choose a CSV file or change the selected date range.</span>
            </div>
          )}
        </section>

        <section className="panel data-settings">
          <div>
            <h2>Attendance data</h2>
            <p>
              {records.length.toLocaleString()} attendance records currently stored
              in this browser.
            </p>
            <small>
              Import history and attendance records are stored separately.
            </small>
          </div>
          <button
            className="button button-danger-outline"
            onClick={clearAttendance}
          >
            Clear attendance data
          </button>
        </section>
      </>
    );
  }

  const pageTitles = {
    dashboard: "Dashboard",
    attendance: "Attendance",
    players: "Players",
    imports: "CSV imports",
    player: "Player profile",
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div>
            <strong>Clubhouse</strong>
            <span>Attendance manager</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>

        <nav className="side-nav">
          <NavItem
            icon="▦"
            label="Dashboard"
            active={page === "dashboard"}
            onClick={() => setPage("dashboard")}
          />
          <NavItem
            icon="☷"
            label="Attendance"
            active={page === "attendance"}
            onClick={() => setPage("attendance")}
          />
          <NavItem
            icon="♙"
            label="Players"
            active={page === "players" || page === "player"}
            onClick={() => setPage("players")}
          />
          <NavItem
            icon="⇧"
            label="CSV imports"
            active={page === "imports"}
            onClick={() => setPage("imports")}
          />
        </nav>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace <span>/</span> {pageTitles[page]}
          </div>
          <div className="topbar-right">
            <span className="today-label">
              {formatDate(getToday(), {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </span>
            <div className="admin-avatar">A</div>
          </div>
        </header>

        <div className="page-content">
          {page === "dashboard" && (
            <Dashboard
              filteredRecords={filteredRecords}
              players={players}
              range={range}
              setRange={setRange}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              chart={chart}
              renderChart={renderChart}
              openPlayer={openPlayer}
              setPage={setPage}
              notice={notice}
              setNotice={setNotice}
              formatDate={formatDate}
              uniquePlayers={uniquePlayers}
              StatCard={StatCard}
              Avatar={Avatar}
              PlayerCell={PlayerCell}
            />
          )}

          {page === "attendance" && (
            <Attendance
              attendanceRows={attendanceRows}
              attendancePage={attendancePage}
              setAttendancePage={setAttendancePage}
              pageSize={PAGE_SIZE}
              search={search}
              setSearch={setSearch}
              range={range}
              setRange={setRange}
              customStart={customStart}
              setCustomStart={setCustomStart}
              customEnd={customEnd}
              setCustomEnd={setCustomEnd}
              exportAttendance={exportAttendance}
              openPlayer={openPlayer}
              players={players}
              formatDate={formatDate}
              PlayerCell={PlayerCell}
            />
          )}

          {page === "players" && (
            <Players
              players={players}
              filteredPlayers={filteredPlayers}
              search={search}
              setSearch={setSearch}
              openPlayer={openPlayer}
              formatDate={formatDate}
              Avatar={Avatar}
            />
          )}

          {page === "player" && (
            <>
              <button className="back-link" onClick={() => setPage("players")}>
                ← Back to players
              </button>
              <PlayerProfile
                player={selectedPlayerData}
                historyPage={historyPage}
                setHistoryPage={setHistoryPage}
                formatDate={formatDate}
                StatCard={StatCard}
                Avatar={Avatar}
              />
            </>
          )}

          {page === "imports" && renderImports()}
        </div>
      </main>
    </div>
  );
}

export default App;