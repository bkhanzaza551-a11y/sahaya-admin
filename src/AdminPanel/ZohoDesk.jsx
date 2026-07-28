import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const PRIORITY_COLORS = {
  High: "#dc3545",
  Medium: "#fd7e14",
  Low: "#28a745",
  Urgent: "#dc3545",
};

const STATUS_COLORS = {
  Open: "#17a2b8",
  "In Progress": "#fd7e14",
  Closed: "#28a745",
  "On Hold": "#6c757d",
  Escalated: "#dc3545",
};

const TABS = ["Tickets", "Knowledge Base", "Canned Responses"];

const ZohoDesk = () => {
  const [activeTab, setActiveTab] = useState("Tickets");
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [agents, setAgents] = useState([]);
  const [counts, setCounts] = useState({ open: 0, in_progress: 0, closed: 0 });
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [ticketDetail, setTicketDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comment, setComment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ subject: "", description: "", priority: "Medium", departmentId: "" });
  const [updating, setUpdating] = useState(false);
  const [commentsHistory, setCommentsHistory] = useState([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [reassignId, setReassignId] = useState("");
  const [showReassign, setShowReassign] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [kbCategories, setKbCategories] = useState([]);
  const [kbArticles, setKbArticles] = useState([]);
  const [kbLoading, setKbLoading] = useState(false);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [cannedLoading, setCannedLoading] = useState(false);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/status");
      setAuthStatus(data.data);
    } catch {
      setAuthStatus({ crm: { authorized: false }, desk: { authorized: false } });
    }
  }, []);

  const fetchCounts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/desk/tickets/counts");
      if (data.success) setCounts(data.data);
    } catch {}
  }, []);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append("status", filterStatus);
      const { data } = await axiosInstance.get(`/zoho/desk/tickets?${params.toString()}`);
      setTickets(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch tickets");
    } finally {
      setLoading(false);
    }
  }, [filterStatus]);

  const fetchDepartments = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/desk/departments");
      setDepartments(data.data?.data || []);
    } catch {}
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/desk/agents");
      setAgents(data.data?.data || []);
    } catch {}
  }, []);

  const fetchKBCategories = useCallback(async () => {
    setKbLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/desk/knowledgebase/categories");
      setKbCategories(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch knowledge base categories");
    } finally {
      setKbLoading(false);
    }
  }, []);

  const fetchKBArticles = useCallback(async () => {
    setKbLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/desk/knowledgebase/articles");
      setKbArticles(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch knowledge base articles");
    } finally {
      setKbLoading(false);
    }
  }, []);

  const fetchCannedResponses = useCallback(async () => {
    setCannedLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/desk/cannedresponses");
      setCannedResponses(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch canned responses");
    } finally {
      setCannedLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    if (authStatus?.desk?.authorized) {
      fetchCounts();
      fetchDepartments();
      fetchAgents();
    }
  }, [authStatus, fetchCounts, fetchDepartments, fetchAgents]);

  useEffect(() => {
    if (authStatus?.desk?.authorized) {
      if (activeTab === "Tickets") fetchTickets();
      else if (activeTab === "Knowledge Base") { fetchKBCategories(); fetchKBArticles(); }
      else if (activeTab === "Canned Responses") fetchCannedResponses();
    }
  }, [authStatus, activeTab, fetchKBCategories, fetchKBArticles, fetchCannedResponses]);

  useEffect(() => {
    if (authStatus?.desk?.authorized && activeTab === "Tickets") fetchTickets();
  }, [filterStatus]);

  const handleConnect = async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/auth-url?service=desk");
      if (data.success && data.data.url) window.location.href = data.data.url;
    } catch {
      toast.error("Failed to generate auth URL");
    }
  };

  const handleViewTicket = async (ticketId) => {
    setSelectedTicket(ticketId);
    setDetailLoading(true);
    try {
      const { data } = await axiosInstance.get(`/zoho/desk/tickets/${ticketId}`);
      setTicketDetail(data.data?.data || data.data);
      // Also fetch comments history
      fetchCommentsHistory(ticketId);
    } catch {
      toast.error("Failed to load ticket details");
    } finally {
      setDetailLoading(false);
    }
  };

  const fetchCommentsHistory = async (ticketId) => {
    setCommentsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/zoho/desk/tickets/${ticketId}/comments`);
      setCommentsHistory(data.data?.data || []);
    } catch {
      toast.error("Failed to load comments history");
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim() || !selectedTicket) return;
    try {
      await axiosInstance.post(`/zoho/desk/tickets/${selectedTicket}/comments`, { content: comment });
      toast.success("Comment added");
      setComment("");
      handleViewTicket(selectedTicket);
    } catch {
      toast.error("Failed to add comment");
    }
  };

  const handleUpdateTicket = async (field, value) => {
    setUpdating(true);
    try {
      await axiosInstance.put(`/zoho/desk/tickets/${selectedTicket}`, { [field]: value });
      toast.success("Ticket updated");
      handleViewTicket(selectedTicket);
      fetchTickets();
      fetchCounts();
    } catch {
      toast.error("Failed to update ticket");
    } finally {
      setUpdating(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!createForm.subject || !createForm.departmentId) {
      toast.error("Subject and department are required");
      return;
    }
    try {
      const { data } = await axiosInstance.post("/zoho/desk/tickets", createForm);
      if (data.success) {
        toast.success("Ticket created");
        setShowCreate(false);
        setCreateForm({ subject: "", description: "", priority: "Medium", departmentId: "" });
        fetchTickets();
        fetchCounts();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create ticket");
    }
  };

  const handleDeleteTicket = async (ticketId) => {
    if (!window.confirm("Are you sure you want to delete this ticket?")) return;
    setDeleting(true);
    try {
      const { data } = await axiosInstance.delete(`/zoho/desk/tickets/${ticketId}`);
      if (data.success) {
        toast.success("Ticket deleted");
        setSelectedTicket(null);
        setTicketDetail(null);
        fetchTickets();
        fetchCounts();
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to delete ticket");
    } finally {
      setDeleting(false);
    }
  };

  const handleReassign = async () => {
    if (!reassignId || !selectedTicket) return;
    try {
      const { data } = await axiosInstance.put(`/zoho/desk/tickets/${selectedTicket}/reassign`, { assigneeId: reassignId });
      if (data.success) {
        toast.success("Ticket reassigned");
        setShowReassign(false);
        setReassignId("");
        handleViewTicket(selectedTicket);
      } else {
        toast.error("Failed to reassign ticket");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to reassign ticket");
    }
  };

  const isAuthorized = authStatus?.desk?.authorized;

  return (
    <div className="container-fluid p-4">
      <style>{`
        .sahayya-card { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .sahayya-btn-primary { background: #D98C7A; color: #fff; border: none; }
        .sahayya-btn-primary:hover { background: #c47b6a; color: #fff; }
        .connect-btn { background: #1a73e8; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 500; }
        .connect-btn:hover { background: #1557b0; }
        .ticket-card { border: 1px solid #eee; border-radius: 10px; padding: 14px 16px; cursor: pointer; transition: all 0.2s; }
        .ticket-card:hover { border-color: #D98C7A; box-shadow: 0 2px 8px rgba(217,140,122,0.15); }
        .ticket-card.active { border-color: #D98C7A; background: #fef7f5; }
        .stat-pill { display: inline-flex; align-items: center; gap: 8px; padding: 12px 20px; border-radius: 10px; background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .stat-pill .num { font-size: 22px; font-weight: 700; }
        .stat-pill .lbl { font-size: 12px; color: #888; }
        .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }
        .priority-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; margin-right: 6px; }
        .ticket-detail-panel { background: #fafafa; border-radius: 12px; padding: 24px; border: 1px solid #eee; }
        .comment-box { border: 1px solid #ddd; border-radius: 8px; padding: 10px; resize: vertical; width: 100%; min-height: 60px; }
        .filter-btn { padding: 6px 14px; border-radius: 8px; border: 1px solid #ddd; background: white; font-size: 13px; cursor: pointer; }
        .filter-btn.active { background: #D98C7A; color: white; border-color: #D98C7A; }
        .desk-tab { padding: 8px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 500; }
        .desk-tab.active { background: #D98C7A; color: white; }
        .desk-tab:not(.active) { background: #f0f0f0; color: #333; }
        .desk-tab:not(.active):hover { background: #e0e0e0; }
        .action-btn { padding: 4px 8px; border-radius: 6px; border: none; font-size: 12px; cursor: pointer; }
        .action-btn.edit { background: #e3f2fd; color: #1976d2; }
        .action-btn.edit:hover { background: #bbdefb; }
        .action-btn.delete { background: #fce4ec; color: #c62828; }
        .action-btn.delete:hover { background: #f8bbd0; }
        .action-btn.reassign { background: #fff3e0; color: #e65100; }
        .action-btn.reassign:hover { background: #ffe0b2; }
        .comment-history-item { background: white; border-radius: 8px; padding: 12px; border: 1px solid #eee; margin-bottom: 8px; }
        .kb-card { background: white; border-radius: 10px; padding: 16px; border: 1px solid #eee; transition: all 0.2s; }
        .kb-card:hover { border-color: #D98C7A; box-shadow: 0 2px 8px rgba(217,140,122,0.15); }
        .canned-card { background: white; border-radius: 10px; padding: 14px; border: 1px solid #eee; margin-bottom: 8px; }
        .canned-card:hover { border-color: #D98C7A; }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Zoho Desk - Support</h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Manage customer support tickets via Zoho Desk</p>
        </div>
        <div>
          {!isAuthorized ? (
            <button className="connect-btn" onClick={handleConnect}>
              <i className="fas fa-link me-2"></i>Connect Zoho Desk
            </button>
          ) : (
            <button className="btn sahayya-btn-primary" onClick={() => setShowCreate(!showCreate)}>
              <i className="fas fa-plus me-1"></i>New Ticket
            </button>
          )}
        </div>
      </div>

      {/* NOT AUTHORIZED */}
      {!isAuthorized && authStatus && (
        <div className="card sahayya-card p-5 text-center">
          <i className="fas fa-headset fa-3x text-muted mb-3"></i>
          <h5>Connect Your Zoho Desk</h5>
          <p className="text-muted mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
            Authorize Sahayya to access your Zoho Desk portal for support ticket management.
          </p>
          <button className="connect-btn" onClick={handleConnect}>
            <i className="fas fa-link me-2"></i>Authorize Zoho Desk
          </button>
        </div>
      )}

      {isAuthorized && (
        <>
          {/* TABS */}
          <div className="d-flex gap-2 mb-4">
            {TABS.map((tab) => (
              <button key={tab} className={`desk-tab ${activeTab === tab ? "active" : ""}`} onClick={() => { setActiveTab(tab); setSelectedTicket(null); setTicketDetail(null); }}>
                {tab}
              </button>
            ))}
          </div>

          {/* TICKETS TAB */}
          {activeTab === "Tickets" && (
            <>
              {/* STATS */}
              <div className="d-flex gap-3 mb-4">
                <div className="stat-pill">
                  <div className="num" style={{ color: "#17a2b8" }}>{counts.open}</div>
                  <div className="lbl">Open</div>
                </div>
                <div className="stat-pill">
                  <div className="num" style={{ color: "#fd7e14" }}>{counts.in_progress}</div>
                  <div className="lbl">In Progress</div>
                </div>
                <div className="stat-pill">
                  <div className="num" style={{ color: "#28a745" }}>{counts.closed}</div>
                  <div className="lbl">Closed</div>
                </div>
              </div>

              {/* FILTERS */}
              <div className="d-flex gap-2 mb-3">
                {["", "Open", "In Progress", "Closed", "On Hold", "Escalated"].map((s) => (
                  <button key={s} className={`filter-btn ${filterStatus === s ? "active" : ""}`} onClick={() => setFilterStatus(s)}>
                    {s || "All"}
                  </button>
                ))}
              </div>

              {/* CREATE FORM */}
              {showCreate && (
                <div className="card sahayya-card p-4 mb-4">
                  <h6 className="fw-bold mb-3">Create New Ticket</h6>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Subject *</label>
                      <input className="form-control" value={createForm.subject} onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })} />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Department *</label>
                      <select className="form-select" value={createForm.departmentId} onChange={(e) => setCreateForm({ ...createForm, departmentId: e.target.value })}>
                        <option value="">Select Department</option>
                        {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Priority</label>
                      <select className="form-select" value={createForm.priority} onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}>
                        <option value="Low">Low</option>
                        <option value="Medium">Medium</option>
                        <option value="High">High</option>
                        <option value="Urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Assign To</label>
                      <select className="form-select" value={createForm.assigneeId || ""} onChange={(e) => setCreateForm({ ...createForm, assigneeId: e.target.value })}>
                        <option value="">Auto-assign</option>
                        {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                      </select>
                    </div>
                    <div className="col-12">
                      <label className="form-label">Description</label>
                      <textarea className="form-control" rows="3" value={createForm.description} onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })} />
                    </div>
                  </div>
                  <div className="mt-3 d-flex gap-2">
                    <button className="btn sahayya-btn-primary" onClick={handleCreateTicket}>Create Ticket</button>
                    <button className="btn btn-outline-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                  </div>
                </div>
              )}

              {/* TICKETS + DETAIL */}
              <div className="row g-4">
                {/* TICKETS LIST */}
                <div className={selectedTicket ? "col-md-5" : "col-md-12"}>
                  <div className="card sahayya-card p-3">
                    {loading ? (
                      <div className="text-center py-5">
                        <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                      </div>
                    ) : tickets.length === 0 ? (
                      <div className="text-center py-5 text-muted">
                        <i className="fas fa-inbox fa-2x mb-2"></i>
                        <p>No tickets found</p>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: 600, overflowY: "auto" }}>
                        {tickets.map((t) => (
                          <div key={t.id} className={`ticket-card ${selectedTicket === t.id ? "active" : ""}`} onClick={() => handleViewTicket(t.id)}>
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <span className="priority-dot" style={{ background: PRIORITY_COLORS[t.priority] || "#6c757d" }}></span>
                                <span className="fw-semibold" style={{ fontSize: 14 }}>{t.subject}</span>
                                <div className="text-muted mt-1" style={{ fontSize: 12 }}>
                                  #{t.ticketNumber} &middot; {t.contact?.firstName} {t.contact?.lastName}
                                </div>
                              </div>
                              <span className="status-badge" style={{ background: STATUS_COLORS[t.status] || "#6c757d" }}>
                                {t.status}
                              </span>
                            </div>
                            <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                              {t.department?.name} &middot; {t.createdTime?.split("T")[0]}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* TICKET DETAIL */}
                {selectedTicket && (
                  <div className="col-md-7">
                    <div className="ticket-detail-panel">
                      {detailLoading ? (
                        <div className="text-center py-5">
                          <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                        </div>
                      ) : ticketDetail ? (
                        <>
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h5 className="fw-bold mb-1">{ticketDetail.subject}</h5>
                              <span className="text-muted" style={{ fontSize: 13 }}>#{ticketDetail.ticketNumber}</span>
                            </div>
                            <div className="d-flex gap-2">
                              <button className="btn btn-sm btn-outline-warning" onClick={() => setShowReassign(!showReassign)} title="Reassign">
                                <i className="fas fa-user-friends"></i>
                              </button>
                              <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteTicket(selectedTicket)} disabled={deleting} title="Delete">
                                {deleting ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-trash"></i>}
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedTicket(null); setTicketDetail(null); setCommentsHistory([]); }}>
                                <i className="fas fa-times"></i>
                              </button>
                            </div>
                          </div>

                          {/* REASSIGN FORM */}
                          {showReassign && (
                            <div className="card p-3 mb-3" style={{ background: "#fff3e0", border: "1px solid #ffe0b2" }}>
                              <h6 className="fw-bold mb-2" style={{ fontSize: 13 }}>Reassign Ticket</h6>
                              <div className="d-flex gap-2">
                                <select className="form-select form-select-sm" value={reassignId} onChange={(e) => setReassignId(e.target.value)} style={{ flex: 1 }}>
                                  <option value="">Select Agent</option>
                                  {agents.map((a) => <option key={a.id} value={a.id}>{a.firstName} {a.lastName}</option>)}
                                </select>
                                <button className="btn btn-sm sahayya-btn-primary" onClick={handleReassign} disabled={!reassignId}>Reassign</button>
                                <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowReassign(false)}>Cancel</button>
                              </div>
                            </div>
                          )}

                          {/* STATUS + PRIORITY */}
                          <div className="row g-3 mb-4">
                            <div className="col-md-4">
                              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Status</label>
                              <select className="form-select form-select-sm" value={ticketDetail.status || ""} onChange={(e) => handleUpdateTicket("status", e.target.value)} disabled={updating}>
                                {["Open", "In Progress", "Closed", "On Hold", "Escalated"].map((s) => <option key={s} value={s}>{s}</option>)}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Priority</label>
                              <select className="form-select form-select-sm" value={ticketDetail.priority || ""} onChange={(e) => handleUpdateTicket("priority", e.target.value)} disabled={updating}>
                                {["Low", "Medium", "High", "Urgent"].map((p) => <option key={p} value={p}>{p}</option>)}
                              </select>
                            </div>
                            <div className="col-md-4">
                              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Assigned To</label>
                              <div className="form-control form-control-sm" style={{ fontSize: 13 }}>
                                {ticketDetail.assignee?.firstName && ticketDetail.assignee?.lastName
                                  ? `${ticketDetail.assignee.firstName} ${ticketDetail.assignee.lastName}`
                                  : ticketDetail.assignee?.firstName || ticketDetail.assignee?.lastName || "Unassigned"}
                              </div>
                            </div>
                          </div>

                          {/* INFO */}
                          <div className="row g-2 mb-4" style={{ fontSize: 13 }}>
                            <div className="col-6"><strong>Contact:</strong> {ticketDetail.contact?.firstName} {ticketDetail.contact?.lastName}</div>
                            <div className="col-6"><strong>Email:</strong> {ticketDetail.contact?.email}</div>
                            <div className="col-6"><strong>Department:</strong> {ticketDetail.department?.name}</div>
                            <div className="col-6"><strong>Channel:</strong> {ticketDetail.channel}</div>
                            <div className="col-6"><strong>Created:</strong> {ticketDetail.createdTime?.split("T")[0]}</div>
                            <div className="col-6"><strong>Modified:</strong> {ticketDetail.modifiedTime?.split("T")[0]}</div>
                          </div>

                          {/* DESCRIPTION */}
                          {ticketDetail.description && (
                            <div className="mb-4">
                              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Description</label>
                              <div className="p-3" style={{ background: "white", borderRadius: 8, border: "1px solid #eee", fontSize: 13 }}>
                                {ticketDetail.description}
                              </div>
                            </div>
                          )}

                          {/* COMMENTS HISTORY */}
                          <div className="mb-4">
                            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Comments History</label>
                            {commentsLoading ? (
                              <div className="text-center py-2"><i className="fas fa-spinner fa-spin"></i> Loading comments...</div>
                            ) : commentsHistory.length > 0 ? (
                              commentsHistory.map((c, i) => (
                                <div key={i} className="comment-history-item">
                                  <div className="d-flex justify-content-between align-items-start">
                                    <div className="fw-semibold" style={{ fontSize: 13 }}>{c.author?.firstName} {c.author?.lastName}</div>
                                    <span className="text-muted" style={{ fontSize: 11 }}>{c.createdTime?.split("T")[0]}</span>
                                  </div>
                                  <div className="mt-1" style={{ fontSize: 13 }}>{c.content}</div>
                                </div>
                              ))
                            ) : (
                              <div className="text-muted" style={{ fontSize: 13 }}>No comments yet</div>
                            )}
                          </div>

                          {/* ADD COMMENT */}
                          <div>
                            <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Add Comment</label>
                            <textarea className="comment-box" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Type your comment..." />
                            <button className="btn sahayya-btn-primary btn-sm mt-2" onClick={handleAddComment} disabled={!comment.trim()}>
                              <i className="fas fa-paper-plane me-1"></i>Send
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-5 text-muted">Select a ticket to view details</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* KNOWLEDGE BASE TAB */}
          {activeTab === "Knowledge Base" && (
            <div className="card sahayya-card p-4">
              <h6 className="fw-bold mb-3"><i className="fas fa-book me-2"></i>Knowledge Base</h6>
              {kbLoading ? (
                <div className="text-center py-5">
                  <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                </div>
              ) : (
                <>
                  {kbCategories.length > 0 && (
                    <div className="mb-4">
                      <h6 className="fw-semibold mb-2">Categories</h6>
                      <div className="row g-3">
                        {kbCategories.map((cat, i) => (
                          <div key={i} className="col-md-4">
                            <div className="kb-card">
                              <div className="fw-semibold">{cat.name || cat.categoryName}</div>
                              <div className="text-muted" style={{ fontSize: 12 }}>{cat.description || "No description"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {kbArticles.length > 0 && (
                    <div>
                      <h6 className="fw-semibold mb-2">Articles</h6>
                      <div className="row g-3">
                        {kbArticles.map((article, i) => (
                          <div key={i} className="col-md-6">
                            <div className="kb-card">
                              <div className="fw-semibold">{article.title || article.articleTitle}</div>
                              <div className="text-muted mt-1" style={{ fontSize: 12 }}>{article.summary || article.description?.substring(0, 100)}...</div>
                              <div className="text-muted mt-1" style={{ fontSize: 11 }}>
                                Status: <span className="badge bg-success">{article.status || "Published"}</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {kbCategories.length === 0 && kbArticles.length === 0 && (
                    <div className="text-center py-5 text-muted">
                      <i className="fas fa-book-open fa-2x mb-2"></i>
                      <p>No knowledge base content available</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* CANNED RESPONSES TAB */}
          {activeTab === "Canned Responses" && (
            <div className="card sahayya-card p-4">
              <h6 className="fw-bold mb-3"><i className="fas fa-reply me-2"></i>Canned Responses</h6>
              {cannedLoading ? (
                <div className="text-center py-5">
                  <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                </div>
              ) : cannedResponses.length > 0 ? (
                <div className="row g-3">
                  {cannedResponses.map((resp, i) => (
                    <div key={i} className="col-md-6">
                      <div className="canned-card">
                        <div className="d-flex justify-content-between align-items-start">
                          <div className="fw-semibold">{resp.name || resp.title}</div>
                          <span className="badge bg-light text-dark" style={{ fontSize: 11 }}>{resp.category || "General"}</span>
                        </div>
                        <div className="mt-2" style={{ fontSize: 13, color: "#555" }}>
                          {resp.content || resp.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-5 text-muted">
                  <i className="fas fa-inbox fa-2x mb-2"></i>
                  <p>No canned responses available</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ZohoDesk;
