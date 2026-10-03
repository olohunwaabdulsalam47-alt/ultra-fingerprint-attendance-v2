import { useMemo, useState } from "react";
import "./SuperAdminAnalyticsToolsPage.css";

type SchoolStatus = "ACTIVE" | "INACTIVE" | "PENDING";
type SavedViewType = "SCHOOLS" | "USERS" | "PAYMENTS" | "APPLICATIONS";

interface PlatformRecord {
  id: string;
  name: string;
  category: "School" | "User" | "Application" | "Payment";
  status: SchoolStatus | "COMPLETED" | "PENDING" | "FAILED";
  detail: string;
}

interface SavedView {
  id: string;
  name: string;
  type: SavedViewType;
  createdAt: string;
}

const records: PlatformRecord[] = [
  {
    id: "SCH-001",
    name: "Demo Secondary School",
    category: "School",
    status: "ACTIVE",
    detail: "Lagos • 842 students",
  },
  {
    id: "SCH-002",
    name: "Example Academy",
    category: "School",
    status: "ACTIVE",
    detail: "Ogun • 516 students",
  },
  {
    id: "SCH-003",
    name: "Future Stars School",
    category: "School",
    status: "PENDING",
    detail: "Oyo • Application under review",
  },
  {
    id: "USR-001",
    name: "Demo Principal",
    category: "User",
    status: "ACTIVE",
    detail: "Principal • Demo Secondary School",
  },
  {
    id: "USR-002",
    name: "Example Teacher",
    category: "User",
    status: "ACTIVE",
    detail: "Teacher • Example Academy",
  },
  {
    id: "APP-001",
    name: "Future Stars School",
    category: "Application",
    status: "PENDING",
    detail: "Submitted for platform approval",
  },
  {
    id: "PAY-001",
    name: "Example Academy",
    category: "Payment",
    status: "COMPLETED",
    detail: "Annual subscription",
  },
];

const initialViews: SavedView[] = [
  {
    id: "VIEW-001",
    name: "Active Schools",
    type: "SCHOOLS",
    createdAt: new Date().toISOString(),
  },
  {
    id: "VIEW-002",
    name: "Pending Applications",
    type: "APPLICATIONS",
    createdAt: new Date().toISOString(),
  },
];

const savedViewsKey = "ultra-platform-saved-views";

function loadSavedViews(): SavedView[] {
  try {
    const stored = localStorage.getItem(savedViewsKey);

    if (!stored) {
      return initialViews;
    }

    return JSON.parse(stored) as SavedView[];
  } catch {
    return initialViews;
  }
}

function statusClass(status: PlatformRecord["status"]) {
  return `analytics-status analytics-status-${status.toLowerCase()}`;
}

function escapeCsv(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

export default function SuperAdminAnalyticsToolsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);
  const [message, setMessage] = useState("");

  const filteredRecords = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return records.filter((record) => {
      const matchesQuery =
        !normalizedQuery ||
        record.id.toLowerCase().includes(normalizedQuery) ||
        record.name.toLowerCase().includes(normalizedQuery) ||
        record.category.toLowerCase().includes(normalizedQuery) ||
        record.detail.toLowerCase().includes(normalizedQuery);

      const matchesCategory =
        category === "ALL" || record.category === category;

      return matchesQuery && matchesCategory;
    });
  }, [category, query]);

  const selectedCount = selectedIds.length;

  function toggleSelection(id: string) {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  function toggleSelectAll() {
    if (selectedIds.length === filteredRecords.length) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds(filteredRecords.map((record) => record.id));
  }

  function saveView() {
    const name = window.prompt("Enter a name for this saved view:");

    if (!name?.trim()) {
      return;
    }

    const type: SavedViewType =
      category === "SCHOOLS" ||
      category === "USERS" ||
      category === "PAYMENTS" ||
      category === "APPLICATIONS"
        ? category
        : "SCHOOLS";

    const view: SavedView = {
      id: `VIEW-${Date.now()}`,
      name: name.trim(),
      type,
      createdAt: new Date().toISOString(),
    };

    const nextViews = [view, ...savedViews];

    setSavedViews(nextViews);
    localStorage.setItem(savedViewsKey, JSON.stringify(nextViews));
    setMessage(`Saved view "${view.name}" created.`);
  }

  function deleteView(id: string) {
    const nextViews = savedViews.filter((view) => view.id !== id);

    setSavedViews(nextViews);
    localStorage.setItem(savedViewsKey, JSON.stringify(nextViews));
    setMessage("Saved view removed.");
  }

  function exportRecords() {
    const rows = filteredRecords.filter((record) =>
      selectedIds.length === 0 ? true : selectedIds.includes(record.id),
    );

    const csv = [
      ["ID", "Name", "Category", "Status", "Details"],
      ...rows.map((record) => [
        record.id,
        record.name,
        record.category,
        record.status,
        record.detail,
      ]),
    ]
      .map((row) => row.map(escapeCsv).join(","))
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = `ufa-platform-export-${Date.now()}.csv`;
    anchor.click();

    URL.revokeObjectURL(url);

    setMessage(`${rows.length} record(s) exported.`);
  }

  function performBulkAction(action: "ACTIVATE" | "DEACTIVATE" | "ARCHIVE") {
    if (selectedIds.length === 0) {
      setMessage("Select at least one record first.");
      return;
    }

    setMessage(
      `${action} action queued for ${selectedIds.length} selected record(s).`,
    );
  }

  return (
    <main className="analytics-tools-page">
      <header className="analytics-tools-header">
        <div>
          <p className="analytics-tools-eyebrow">SUPERADMIN PLATFORM TOOLS</p>
          <h1>Analytics, Search & Platform Tools</h1>
          <p>
            Search platform records, review key metrics, save useful views,
            export data, and prepare bulk administrative actions.
          </p>
        </div>

        <button
          type="button"
          className="analytics-primary-button"
          onClick={exportRecords}
        >
          Export Results
        </button>
      </header>

      {message && <div className="analytics-message">{message}</div>}

      <section className="analytics-stat-grid">
        <article>
          <span>Total Schools</span>
          <strong>128</strong>
          <small>Across active platform accounts</small>
        </article>

        <article>
          <span>Active Schools</span>
          <strong>117</strong>
          <small>91.4% of registered schools</small>
        </article>

        <article>
          <span>Monthly Attendance Events</span>
          <strong>248,640</strong>
          <small>Current development metric</small>
        </article>

        <article>
          <span>Platform Users</span>
          <strong>1,846</strong>
          <small>Principals, teachers and platform users</small>
        </article>
      </section>

      <section className="analytics-card">
        <div className="analytics-section-heading">
          <div>
            <h2>Global Search</h2>
            <p>
              Search across schools, users, applications and payment records.
            </p>
          </div>
        </div>

        <div className="analytics-search-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by ID, name, category or details..."
            aria-label="Global platform search"
          />

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            aria-label="Filter by category"
          >
            <option value="ALL">All Categories</option>
            <option value="School">Schools</option>
            <option value="User">Users</option>
            <option value="Application">Applications</option>
            <option value="Payment">Payments</option>
          </select>

          <button type="button" onClick={saveView}>
            Save View
          </button>
        </div>

        <div className="analytics-selection-bar">
          <span>
            {filteredRecords.length} result(s) • {selectedCount} selected
          </span>

          <div>
            <button type="button" onClick={toggleSelectAll}>
              {selectedIds.length === filteredRecords.length
                ? "Clear Selection"
                : "Select All"}
            </button>

            <button
              type="button"
              onClick={() => performBulkAction("ACTIVATE")}
            >
              Activate
            </button>

            <button
              type="button"
              onClick={() => performBulkAction("DEACTIVATE")}
            >
              Deactivate
            </button>

            <button
              type="button"
              onClick={() => performBulkAction("ARCHIVE")}
            >
              Archive
            </button>
          </div>
        </div>

        <div className="analytics-table-wrapper">
          <table>
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={
                      filteredRecords.length > 0 &&
                      selectedIds.length === filteredRecords.length
                    }
                    onChange={toggleSelectAll}
                    aria-label="Select all search results"
                  />
                </th>
                <th>ID</th>
                <th>Name</th>
                <th>Category</th>
                <th>Status</th>
                <th>Details</th>
              </tr>
            </thead>

            <tbody>
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="analytics-empty">
                    No matching records found.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(record.id)}
                        onChange={() => toggleSelection(record.id)}
                        aria-label={`Select ${record.name}`}
                      />
                    </td>
                    <td>{record.id}</td>
                    <td>{record.name}</td>
                    <td>{record.category}</td>
                    <td>
                      <span className={statusClass(record.status)}>
                        {record.status}
                      </span>
                    </td>
                    <td>{record.detail}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="analytics-bottom-grid">
        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>Platform Analytics</h2>
              <p>Development dashboard indicators.</p>
            </div>
          </div>

          <div className="analytics-metric-list">
            <div>
              <span>Attendance completion rate</span>
              <strong>94.8%</strong>
            </div>

            <div>
              <span>Offline synchronization success</span>
              <strong>98.2%</strong>
            </div>

            <div>
              <span>Biometric verification success</span>
              <strong>97.6%</strong>
            </div>

            <div>
              <span>System availability</span>
              <strong>99.9%</strong>
            </div>
          </div>
        </article>

        <article className="analytics-card">
          <div className="analytics-section-heading">
            <div>
              <h2>Saved Views</h2>
              <p>Quick access to frequently used platform searches.</p>
            </div>
          </div>

          <div className="saved-view-list">
            {savedViews.map((view) => (
              <div className="saved-view-item" key={view.id}>
                <div>
                  <strong>{view.name}</strong>
                  <span>
                    {view.type} • {new Date(view.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <button type="button" onClick={() => deleteView(view.id)}>
                  Remove
                </button>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  );
}
