import {
  FormEvent,
  useMemo,
  useState,
} from "react";
import "./SuperAdminCommunicationPage.css";

type AnnouncementType =
  | "GENERAL"
  | "MAINTENANCE"
  | "SECURITY"
  | "SUBSCRIPTION"
  | "PAYMENT"
  | "SYSTEM_UPDATE";

type AnnouncementStatus =
  | "DRAFT"
  | "PUBLISHED"
  | "ARCHIVED";

type AnnouncementPriority =
  | "LOW"
  | "NORMAL"
  | "HIGH"
  | "URGENT";

type Audience =
  | "ALL"
  | "SUPER_ADMINS"
  | "PRINCIPALS"
  | "TEACHERS"
  | "SCHOOLS";

interface Announcement {
  announcementId: string;
  title: string;
  message: string;
  type: AnnouncementType;
  priority: AnnouncementPriority;
  audience: Audience;
  status: AnnouncementStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
}

const STORAGE_KEY =
  "ultra-platform-announcements";

const TYPE_LABELS: Record<
  AnnouncementType,
  string
> = {
  GENERAL: "General",
  MAINTENANCE: "Maintenance",
  SECURITY: "Security",
  SUBSCRIPTION: "Subscription",
  PAYMENT: "Payment",
  SYSTEM_UPDATE: "System Update",
};

const STATUS_LABELS: Record<
  AnnouncementStatus,
  string
> = {
  DRAFT: "Draft",
  PUBLISHED: "Published",
  ARCHIVED: "Archived",
};

const PRIORITY_LABELS: Record<
  AnnouncementPriority,
  string
> = {
  LOW: "Low",
  NORMAL: "Normal",
  HIGH: "High",
  URGENT: "Urgent",
};

const AUDIENCE_LABELS: Record<
  Audience,
  string
> = {
  ALL: "Everyone",
  SUPER_ADMINS: "Super Admins",
  PRINCIPALS: "Principals",
  TEACHERS: "Teachers",
  SCHOOLS: "Schools",
};

function loadAnnouncements(): Announcement[] {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY,
    );

    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed;
  } catch {
    return [];
  }
}

function saveAnnouncements(
  announcements: Announcement[],
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(announcements),
  );
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

function statusClass(
  status: AnnouncementStatus,
) {
  return `communication-status communication-status-${status.toLowerCase()}`;
}

function priorityClass(
  priority: AnnouncementPriority,
) {
  return `communication-priority communication-priority-${priority.toLowerCase()}`;
}

function typeClass(type: AnnouncementType) {
  return `communication-type communication-type-${type.toLowerCase()}`;
}

export default function SuperAdminCommunicationPage() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>(
      loadAnnouncements,
    );

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<
      "ALL" | AnnouncementStatus
    >("ALL");

  const [typeFilter, setTypeFilter] =
    useState<
      "ALL" | AnnouncementType
    >("ALL");

  const [priorityFilter, setPriorityFilter] =
    useState<
      "ALL" | AnnouncementPriority
    >("ALL");

  const [selectedAnnouncement, setSelectedAnnouncement] =
    useState<Announcement | null>(null);

  const [showComposer, setShowComposer] =
    useState(false);

  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);

  const [title, setTitle] = useState("");
  const [message, setMessage] =
    useState("");

  const [type, setType] =
    useState<AnnouncementType>("GENERAL");

  const [priority, setPriority] =
    useState<AnnouncementPriority>("NORMAL");

  const [audience, setAudience] =
    useState<Audience>("ALL");

  const [formMessage, setFormMessage] =
    useState("");

  const statistics = useMemo(() => {
    const total = announcements.length;

    const drafts = announcements.filter(
      (item) => item.status === "DRAFT",
    ).length;

    const published = announcements.filter(
      (item) => item.status === "PUBLISHED",
    ).length;

    const archived = announcements.filter(
      (item) => item.status === "ARCHIVED",
    ).length;

    const urgent = announcements.filter(
      (item) =>
        item.priority === "URGENT" &&
        item.status !== "ARCHIVED",
    ).length;

    const security = announcements.filter(
      (item) => item.type === "SECURITY",
    ).length;

    return {
      total,
      drafts,
      published,
      archived,
      urgent,
      security,
    };
  }, [announcements]);

  const filteredAnnouncements = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    return announcements
      .filter((item) => {
        if (
          statusFilter !== "ALL" &&
          item.status !== statusFilter
        ) {
          return false;
        }

        if (
          typeFilter !== "ALL" &&
          item.type !== typeFilter
        ) {
          return false;
        }

        if (
          priorityFilter !== "ALL" &&
          item.priority !== priorityFilter
        ) {
          return false;
        }

        if (!query) {
          return true;
        }

        return (
          item.title
            .toLowerCase()
            .includes(query) ||
          item.message
            .toLowerCase()
            .includes(query) ||
          item.createdBy
            .toLowerCase()
            .includes(query)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() -
          new Date(a.updatedAt).getTime(),
      );
  }, [
    announcements,
    search,
    statusFilter,
    typeFilter,
    priorityFilter,
  ]);

  function resetComposer() {
    setTitle("");
    setMessage("");
    setType("GENERAL");
    setPriority("NORMAL");
    setAudience("ALL");
    setEditingAnnouncement(null);
    setFormMessage("");
  }

  function openCreateForm() {
    resetComposer();
    setShowComposer(true);
  }

  function openEditForm(
    announcement: Announcement,
  ) {
    setEditingAnnouncement(announcement);
    setTitle(announcement.title);
    setMessage(announcement.message);
    setType(announcement.type);
    setPriority(announcement.priority);
    setAudience(announcement.audience);
    setFormMessage("");
    setShowComposer(true);
  }

  function closeComposer() {
    setShowComposer(false);
    resetComposer();
  }

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setFormMessage("");

    const trimmedTitle = title.trim();
    const trimmedMessage = message.trim();

    if (!trimmedTitle) {
      setFormMessage(
        "Announcement title is required.",
      );
      return;
    }

    if (!trimmedMessage) {
      setFormMessage(
        "Announcement message is required.",
      );
      return;
    }

    const now = new Date().toISOString();

    if (editingAnnouncement) {
      const updated: Announcement = {
        ...editingAnnouncement,
        title: trimmedTitle,
        message: trimmedMessage,
        type,
        priority,
        audience,
        updatedAt: now,
      };

      const next = announcements.map(
        (item) =>
          item.announcementId ===
          editingAnnouncement.announcementId
            ? updated
            : item,
      );

      setAnnouncements(next);
      saveAnnouncements(next);

      setSelectedAnnouncement(updated);
      closeComposer();
      return;
    }

    const newAnnouncement: Announcement = {
      announcementId:
        `ANN-${Date.now()}`,
      title: trimmedTitle,
      message: trimmedMessage,
      type,
      priority,
      audience,
      status: "DRAFT",
      createdBy: "Super Admin",
      createdAt: now,
      updatedAt: now,
    };

    const next = [
      newAnnouncement,
      ...announcements,
    ];

    setAnnouncements(next);
    saveAnnouncements(next);

    setSelectedAnnouncement(
      newAnnouncement,
    );

    closeComposer();
  }

  function updateStatus(
    announcement: Announcement,
    status: AnnouncementStatus,
  ) {
    const now = new Date().toISOString();

    const updated: Announcement = {
      ...announcement,
      status,
      updatedAt: now,
      publishedAt:
        status === "PUBLISHED"
          ? announcement.publishedAt ??
            now
          : announcement.publishedAt,
    };

    const next = announcements.map(
      (item) =>
        item.announcementId ===
        announcement.announcementId
          ? updated
          : item,
    );

    setAnnouncements(next);
    saveAnnouncements(next);
    setSelectedAnnouncement(updated);
  }

  function deleteAnnouncement(
    announcement: Announcement,
  ) {
    const confirmed = window.confirm(
      `Delete "${announcement.title}"?`,
    );

    if (!confirmed) {
      return;
    }

    const next = announcements.filter(
      (item) =>
        item.announcementId !==
        announcement.announcementId,
    );

    setAnnouncements(next);
    saveAnnouncements(next);
    setSelectedAnnouncement(null);
  }

  function clearFilters() {
    setSearch("");
    setStatusFilter("ALL");
    setTypeFilter("ALL");
    setPriorityFilter("ALL");
  }

  return (
    <main className="communication-page">
      <section className="communication-header">
        <div>
          <span className="communication-eyebrow">
            SUPER ADMIN
          </span>

          <h1>
            Communication & Announcements
          </h1>

          <p>
            Create, publish, manage, and
            archive platform-wide
            communications.
          </p>
        </div>

        <button
          type="button"
          className="communication-primary-button"
          onClick={openCreateForm}
        >
          + New Announcement
        </button>
      </section>

      <section className="communication-stats">
        <article className="communication-stat-card">
          <span>Total</span>
          <strong>{statistics.total}</strong>
        </article>

        <article className="communication-stat-card">
          <span>Published</span>
          <strong>
            {statistics.published}
          </strong>
        </article>

        <article className="communication-stat-card">
          <span>Drafts</span>
          <strong>{statistics.drafts}</strong>
        </article>

        <article className="communication-stat-card">
          <span>Archived</span>
          <strong>
            {statistics.archived}
          </strong>
        </article>

        <article className="communication-stat-card">
          <span>Urgent</span>
          <strong>
            {statistics.urgent}
          </strong>
        </article>

        <article className="communication-stat-card">
          <span>Security</span>
          <strong>
            {statistics.security}
          </strong>
        </article>
      </section>

      <section className="communication-overview">
        <div>
          <h2>
            Platform communications
          </h2>

          <p>
            Keep schools and platform
            administrators informed about
            important system events,
            maintenance, security,
            subscriptions, and updates.
          </p>
        </div>
      </section>

      <section className="communication-toolbar">
        <input
          type="search"
          placeholder="Search announcements..."
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />

        <select
          value={statusFilter}
          onChange={(event) =>
            setStatusFilter(
              event.target.value as
                | "ALL"
                | AnnouncementStatus,
            )
          }
        >
          <option value="ALL">
            All statuses
          </option>
          <option value="DRAFT">
            Draft
          </option>
          <option value="PUBLISHED">
            Published
          </option>
          <option value="ARCHIVED">
            Archived
          </option>
        </select>

        <select
          value={typeFilter}
          onChange={(event) =>
            setTypeFilter(
              event.target.value as
                | "ALL"
                | AnnouncementType,
            )
          }
        >
          <option value="ALL">
            All types
          </option>
          <option value="GENERAL">
            General
          </option>
          <option value="MAINTENANCE">
            Maintenance
          </option>
          <option value="SECURITY">
            Security
          </option>
          <option value="SUBSCRIPTION">
            Subscription
          </option>
          <option value="PAYMENT">
            Payment
          </option>
          <option value="SYSTEM_UPDATE">
            System Update
          </option>
        </select>

        <select
          value={priorityFilter}
          onChange={(event) =>
            setPriorityFilter(
              event.target.value as
                | "ALL"
                | AnnouncementPriority,
            )
          }
        >
          <option value="ALL">
            All priorities
          </option>
          <option value="LOW">Low</option>
          <option value="NORMAL">
            Normal
          </option>
          <option value="HIGH">High</option>
          <option value="URGENT">
            Urgent
          </option>
        </select>

        <button
          type="button"
          className="communication-secondary-button"
          onClick={clearFilters}
        >
          Clear
        </button>
      </section>

      <section className="communication-table-card">
        <div className="communication-table-header">
          <div>
            <h2>Announcements</h2>
            <span>
              {filteredAnnouncements.length}{" "}
              result
              {filteredAnnouncements.length ===
              1
                ? ""
                : "s"}
            </span>
          </div>
        </div>

        {filteredAnnouncements.length ===
        0 ? (
          <div className="communication-empty">
            <strong>
              No announcements found
            </strong>

            <p>
              Create a new announcement or
              adjust your filters.
            </p>
          </div>
        ) : (
          <div className="communication-table-wrapper">
            <table className="communication-table">
              <thead>
                <tr>
                  <th>Announcement</th>
                  <th>Type</th>
                  <th>Priority</th>
                  <th>Audience</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredAnnouncements.map(
                  (announcement) => (
                    <tr
                      key={
                        announcement.announcementId
                      }
                    >
                      <td>
                        <button
                          type="button"
                          className="communication-title-button"
                          onClick={() =>
                            setSelectedAnnouncement(
                              announcement,
                            )
                          }
                        >
                          {announcement.title}
                        </button>

                        <small>
                          {
                            announcement.announcementId
                          }
                        </small>
                      </td>

                      <td>
                        <span
                          className={typeClass(
                            announcement.type,
                          )}
                        >
                          {
                            TYPE_LABELS[
                              announcement.type
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        <span
                          className={priorityClass(
                            announcement.priority,
                          )}
                        >
                          {
                            PRIORITY_LABELS[
                              announcement.priority
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {
                          AUDIENCE_LABELS[
                            announcement.audience
                          ]
                        }
                      </td>

                      <td>
                        <span
                          className={statusClass(
                            announcement.status,
                          )}
                        >
                          {
                            STATUS_LABELS[
                              announcement.status
                            ]
                          }
                        </span>
                      </td>

                      <td>
                        {formatDate(
                          announcement.updatedAt,
                        )}
                      </td>

                      <td>
                        <button
                          type="button"
                          className="communication-action-button"
                          onClick={() =>
                            setSelectedAnnouncement(
                              announcement,
                            )
                          }
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showComposer && (
        <div className="communication-modal-backdrop">
          <div className="communication-modal">
            <div className="communication-modal-header">
              <div>
                <span className="communication-eyebrow">
                  {editingAnnouncement
                    ? "EDIT"
                    : "CREATE"}
                </span>

                <h2>
                  {editingAnnouncement
                    ? "Edit Announcement"
                    : "New Announcement"}
                </h2>
              </div>

              <button
                type="button"
                className="communication-close-button"
                onClick={closeComposer}
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <form
              className="communication-form"
              onSubmit={handleSubmit}
            >
              <label>
                Title
                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Enter announcement title"
                  maxLength={160}
                />
              </label>

              <label>
                Message
                <textarea
                  value={message}
                  onChange={(event) =>
                    setMessage(
                      event.target.value,
                    )
                  }
                  placeholder="Write the announcement message..."
                  rows={7}
                  maxLength={5000}
                />
              </label>

              <div className="communication-form-grid">
                <label>
                  Type
                  <select
                    value={type}
                    onChange={(event) =>
                      setType(
                        event.target.value as AnnouncementType,
                      )
                    }
                  >
                    <option value="GENERAL">
                      General
                    </option>
                    <option value="MAINTENANCE">
                      Maintenance
                    </option>
                    <option value="SECURITY">
                      Security
                    </option>
                    <option value="SUBSCRIPTION">
                      Subscription
                    </option>
                    <option value="PAYMENT">
                      Payment
                    </option>
                    <option value="SYSTEM_UPDATE">
                      System Update
                    </option>
                  </select>
                </label>

                <label>
                  Priority
                  <select
                    value={priority}
                    onChange={(event) =>
                      setPriority(
                        event.target.value as AnnouncementPriority,
                      )
                    }
                  >
                    <option value="LOW">
                      Low
                    </option>
                    <option value="NORMAL">
                      Normal
                    </option>
                    <option value="HIGH">
                      High
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>
                </label>

                <label>
                  Audience
                  <select
                    value={audience}
                    onChange={(event) =>
                      setAudience(
                        event.target.value as Audience,
                      )
                    }
                  >
                    <option value="ALL">
                      Everyone
                    </option>
                    <option value="SUPER_ADMINS">
                      Super Admins
                    </option>
                    <option value="PRINCIPALS">
                      Principals
                    </option>
                    <option value="TEACHERS">
                      Teachers
                    </option>
                    <option value="SCHOOLS">
                      Schools
                    </option>
                  </select>
                </label>
              </div>

              {formMessage && (
                <div className="communication-form-message">
                  {formMessage}
                </div>
              )}

              <div className="communication-form-actions">
                <button
                  type="button"
                  className="communication-secondary-button"
                  onClick={closeComposer}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="communication-primary-button"
                >
                  {editingAnnouncement
                    ? "Save Changes"
                    : "Create Draft"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {selectedAnnouncement && (
        <div className="communication-modal-backdrop">
          <div className="communication-modal communication-detail-modal">
            <div className="communication-modal-header">
              <div>
                <span className="communication-eyebrow">
                  ANNOUNCEMENT
                </span>

                <h2>
                  {
                    selectedAnnouncement.title
                  }
                </h2>
              </div>

              <button
                type="button"
                className="communication-close-button"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="communication-detail">
              <div className="communication-detail-badges">
                <span
                  className={statusClass(
                    selectedAnnouncement.status,
                  )}
                >
                  {
                    STATUS_LABELS[
                      selectedAnnouncement.status
                    ]
                  }
                </span>

                <span
                  className={priorityClass(
                    selectedAnnouncement.priority,
                  )}
                >
                  {
                    PRIORITY_LABELS[
                      selectedAnnouncement.priority
                    ]
                  }
                </span>

                <span
                  className={typeClass(
                    selectedAnnouncement.type,
                  )}
                >
                  {
                    TYPE_LABELS[
                      selectedAnnouncement.type
                    ]
                  }
                </span>
              </div>

              <p className="communication-detail-message">
                {
                  selectedAnnouncement.message
                }
              </p>

              <dl className="communication-detail-grid">
                <div>
                  <dt>Audience</dt>
                  <dd>
                    {
                      AUDIENCE_LABELS[
                        selectedAnnouncement
                          .audience
                      ]
                    }
                  </dd>
                </div>

                <div>
                  <dt>Created By</dt>
                  <dd>
                    {
                      selectedAnnouncement.createdBy
                    }
                  </dd>
                </div>

                <div>
                  <dt>Created</dt>
                  <dd>
                    {formatDate(
                      selectedAnnouncement.createdAt,
                    )}
                  </dd>
                </div>

                <div>
                  <dt>Updated</dt>
                  <dd>
                    {formatDate(
                      selectedAnnouncement.updatedAt,
                    )}
                  </dd>
                </div>

                {selectedAnnouncement.publishedAt && (
                  <div>
                    <dt>Published</dt>
                    <dd>
                      {formatDate(
                        selectedAnnouncement.publishedAt,
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="communication-modal-actions">
              <button
                type="button"
                className="communication-secondary-button"
                onClick={() =>
                  openEditForm(
                    selectedAnnouncement,
                  )
                }
              >
                Edit
              </button>

              {selectedAnnouncement.status ===
                "DRAFT" && (
                <button
                  type="button"
                  className="communication-primary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAnnouncement,
                      "PUBLISHED",
                    )
                  }
                >
                  Publish
                </button>
              )}

              {selectedAnnouncement.status ===
                "PUBLISHED" && (
                <button
                  type="button"
                  className="communication-secondary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAnnouncement,
                      "ARCHIVED",
                    )
                  }
                >
                  Archive
                </button>
              )}

              {selectedAnnouncement.status ===
                "ARCHIVED" && (
                <button
                  type="button"
                  className="communication-primary-button"
                  onClick={() =>
                    updateStatus(
                      selectedAnnouncement,
                      "PUBLISHED",
                    )
                  }
                >
                  Republish
                </button>
              )}

              <button
                type="button"
                className="communication-danger-button"
                onClick={() =>
                  deleteAnnouncement(
                    selectedAnnouncement,
                  )
                }
              >
                Delete
              </button>

              <button
                type="button"
                className="communication-secondary-button"
                onClick={() =>
                  setSelectedAnnouncement(null)
                }
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
