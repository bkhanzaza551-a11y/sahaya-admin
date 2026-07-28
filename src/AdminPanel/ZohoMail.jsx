import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const ZohoMail = () => {
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState("inbox");
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [messageDetail, setMessageDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [composeForm, setComposeForm] = useState({ toAddress: "", subject: "", content: "" });
  const [sending, setSending] = useState(false);
  const [page, setPage] = useState(1);

  const fetchAuthStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/status");
      setAuthStatus(data.data);
    } catch {
      setAuthStatus({ mail: { authorized: false } });
    }
  }, []);

  const fetchAccounts = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/mail/accounts");
      if (data.success) {
        const accs = data.data?.data || [];
        setAccounts(accs);
        if (accs.length > 0 && !selectedAccount) {
          setSelectedAccount(accs[0].accountId);
        }
      }
    } catch {
      toast.error("Failed to fetch mail accounts");
    }
  }, [selectedAccount]);

  const fetchFolders = useCallback(async () => {
    if (!selectedAccount) return;
    try {
      const { data } = await axiosInstance.get(`/zoho/mail/folders?accountId=${selectedAccount}`);
      if (data.success) setFolders(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch folders");
    }
  }, [selectedAccount]);

  const fetchMessages = useCallback(async () => {
    if (!selectedAccount) return;
    setLoading(true);
    try {
      const { data } = await axiosInstance.get(`/zoho/mail/messages?accountId=${selectedAccount}&folderId=${selectedFolder}&page=${page}`);
      if (data.success) setMessages(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch messages");
    } finally {
      setLoading(false);
    }
  }, [selectedAccount, selectedFolder, page]);

  useEffect(() => {
    fetchAuthStatus();
  }, [fetchAuthStatus]);

  useEffect(() => {
    if (authStatus?.mail?.authorized) fetchAccounts();
  }, [authStatus, fetchAccounts]);

  useEffect(() => {
    if (selectedAccount) fetchFolders();
  }, [selectedAccount, fetchFolders]);

  useEffect(() => {
    if (selectedAccount) fetchMessages();
  }, [selectedAccount, selectedFolder, page, fetchMessages]);

  const handleConnect = async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/auth-url?service=mail");
      if (data.success && data.data.url) window.location.href = data.data.url;
    } catch {
      toast.error("Failed to generate auth URL");
    }
  };

  const handleViewMessage = async (messageId) => {
    setSelectedMessage(messageId);
    setDetailLoading(true);
    try {
      const { data } = await axiosInstance.get(`/zoho/mail/messages/${selectedAccount}/${messageId}`);
      if (data.success) setMessageDetail(data.data?.data || data.data);
    } catch {
      toast.error("Failed to load message");
    } finally {
      setDetailLoading(false);
    }
  };

  const handleSend = async () => {
    if (!composeForm.toAddress || !composeForm.subject || !composeForm.content) {
      toast.error("To, Subject, and Content are required");
      return;
    }
    setSending(true);
    try {
      const fromAddress = accounts[0]?.emailAddress || "";
      const { data } = await axiosInstance.post("/zoho/mail/send", {
        accountId: selectedAccount,
        fromAddress,
        ...composeForm,
      });
      if (data.success) {
        toast.success("Email sent successfully");
        setShowCompose(false);
        setComposeForm({ toAddress: "", subject: "", content: "" });
      } else {
        toast.error("Failed to send email");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const handleReply = async () => {
    if (!composeForm.content) {
      toast.error("Reply content is required");
      return;
    }
    setSending(true);
    try {
      const fromAddress = accounts[0]?.emailAddress || "";
      const { data } = await axiosInstance.post(`/zoho/mail/reply/${selectedAccount}/${selectedMessage}`, {
        fromAddress,
        content: composeForm.content,
      });
      if (data.success) {
        toast.success("Reply sent");
        setComposeForm({ toAddress: "", subject: "", content: "" });
        setSelectedMessage(null);
        setMessageDetail(null);
      } else {
        toast.error("Failed to send reply");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to send reply");
    } finally {
      setSending(false);
    }
  };

  const isAuthorized = authStatus?.mail?.authorized;

  return (
    <div className="container-fluid p-4">
      <style>{`
        .sahayya-card { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .sahayya-btn-primary { background: #D98C7A; color: #fff; border: none; }
        .sahayya-btn-primary:hover { background: #c47b6a; color: #fff; }
        .connect-btn { background: #1a73e8; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 500; }
        .connect-btn:hover { background: #1557b0; }
        .mail-item { border: 1px solid #eee; border-radius: 8px; padding: 12px 16px; cursor: pointer; transition: all 0.2s; }
        .mail-item:hover { border-color: #D98C7A; background: #fef7f5; }
        .mail-item.active { border-color: #D98C7A; background: #fef7f5; }
        .mail-item.unread { border-left: 3px solid #D98C7A; font-weight: 600; }
        .folder-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #ddd; background: white; font-size: 13px; cursor: pointer; }
        .folder-btn.active { background: #D98C7A; color: white; border-color: #D98C7A; }
        .mail-detail-panel { background: #fafafa; border-radius: 12px; padding: 24px; border: 1px solid #eee; }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Zoho Mail</h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Send and manage emails via Zoho Mail</p>
        </div>
        <div>
          {!isAuthorized ? (
            <button className="connect-btn" onClick={handleConnect}>
              <i className="fas fa-link me-2"></i>Connect Zoho Mail
            </button>
          ) : (
            <button className="btn sahayya-btn-primary" onClick={() => setShowCompose(!showCompose)}>
              <i className="fas fa-pen me-1"></i>Compose
            </button>
          )}
        </div>
      </div>

      {/* NOT AUTHORIZED */}
      {!isAuthorized && authStatus && (
        <div className="card sahayya-card p-5 text-center">
          <i className="fas fa-envelope fa-3x text-muted mb-3"></i>
          <h5>Connect Your Zoho Mail</h5>
          <p className="text-muted mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
            Authorize Sahayya to access your Zoho Mail account for sending and receiving emails.
          </p>
          <button className="connect-btn" onClick={handleConnect}>
            <i className="fas fa-link me-2"></i>Authorize Zoho Mail
          </button>
        </div>
      )}

      {isAuthorized && (
        <>
          {/* ACCOUNT SELECTOR */}
          {accounts.length > 1 && (
            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Account</label>
              <select className="form-select form-select-sm" value={selectedAccount || ""} onChange={(e) => setSelectedAccount(e.target.value)}>
                {accounts.map((acc) => (
                  <option key={acc.accountId} value={acc.accountId}>{acc.emailAddress || acc.accountId}</option>
                ))}
              </select>
            </div>
          )}

          {/* COMPOSE FORM */}
          {showCompose && (
            <div className="card sahayya-card p-4 mb-4">
              <h6 className="fw-bold mb-3"><i className="fas fa-pen me-2"></i>Compose Email</h6>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label">To *</label>
                  <input className="form-control" type="email" value={composeForm.toAddress} onChange={(e) => setComposeForm({ ...composeForm, toAddress: e.target.value })} placeholder="recipient@email.com" />
                </div>
                <div className="col-md-12">
                  <label className="form-label">Subject *</label>
                  <input className="form-control" value={composeForm.subject} onChange={(e) => setComposeForm({ ...composeForm, subject: e.target.value })} />
                </div>
                <div className="col-12">
                  <label className="form-label">Content *</label>
                  <textarea className="form-control" rows="6" value={composeForm.content} onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })} />
                </div>
              </div>
              <div className="mt-3 d-flex gap-2">
                <button className="btn sahayya-btn-primary" onClick={handleSend} disabled={sending}>
                  {sending ? <><i className="fas fa-spinner fa-spin me-1"></i>Sending...</> : <><i className="fas fa-paper-plane me-1"></i>Send</>}
                </button>
                <button className="btn btn-outline-secondary" onClick={() => setShowCompose(false)}>Cancel</button>
              </div>
            </div>
          )}

          {/* FOLDERS */}
          <div className="d-flex gap-2 mb-3 flex-wrap">
            <button className={`folder-btn ${selectedFolder === "inbox" ? "active" : ""}`} onClick={() => { setSelectedFolder("inbox"); setPage(1); }}>
              <i className="fas fa-inbox me-1"></i>Inbox
            </button>
            <button className={`folder-btn ${selectedFolder === "sent" ? "active" : ""}`} onClick={() => { setSelectedFolder("sent"); setPage(1); }}>
              <i className="fas fa-paper-plane me-1"></i>Sent
            </button>
            <button className={`folder-btn ${selectedFolder === "drafts" ? "active" : ""}`} onClick={() => { setSelectedFolder("drafts"); setPage(1); }}>
              <i className="fas fa-file me-1"></i>Drafts
            </button>
            <button className={`folder-btn ${selectedFolder === "trash" ? "active" : ""}`} onClick={() => { setSelectedFolder("trash"); setPage(1); }}>
              <i className="fas fa-trash me-1"></i>Trash
            </button>
            {folders.filter(f => !["inbox", "sent", "drafts", "trash"].includes(f.folderName?.toLowerCase())).map((folder) => (
              <button key={folder.folderId} className={`folder-btn ${selectedFolder === folder.folderId ? "active" : ""}`} onClick={() => { setSelectedFolder(folder.folderId); setPage(1); }}>
                {folder.folderName}
              </button>
            ))}
          </div>

          {/* MESSAGES + DETAIL */}
          <div className="row g-4">
            {/* MESSAGES LIST */}
            <div className={selectedMessage ? "col-md-5" : "col-md-12"}>
              <div className="card sahayya-card p-3">
                {loading ? (
                  <div className="text-center py-5">
                    <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox fa-2x mb-2"></i>
                    <p>No messages</p>
                  </div>
                ) : (
                  <div className="d-flex flex-column gap-2" style={{ maxHeight: 600, overflowY: "auto" }}>
                    {messages.map((msg) => (
                      <div
                        key={msg.messageId}
                        className={`mail-item ${selectedMessage === msg.messageId ? "active" : ""} ${!msg.isRead ? "unread" : ""}`}
                        onClick={() => handleViewMessage(msg.messageId)}
                      >
                        <div className="d-flex justify-content-between align-items-start">
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div className="fw-semibold" style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {msg.fromAddress || msg.sender || "Unknown"}
                            </div>
                            <div style={{ fontSize: 13, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {msg.subject || "(No subject)"}
                            </div>
                            <div className="text-muted" style={{ fontSize: 11, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {msg.snippet || msg.summary || ""}
                            </div>
                          </div>
                          <div className="text-muted text-end ms-2" style={{ fontSize: 11, whiteSpace: "nowrap" }}>
                            {msg.receivedTime?.split("T")[0] || msg.sentTime?.split("T")[0] || ""}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* PAGINATION */}
                {messages.length > 0 && (
                  <div className="d-flex justify-content-between align-items-center mt-3 px-2">
                    <button className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                      <i className="fas fa-chevron-left me-1"></i>Prev
                    </button>
                    <span style={{ fontSize: 13 }}>Page {page}</span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => setPage(page + 1)}>
                      Next<i className="fas fa-chevron-right ms-1"></i>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* MESSAGE DETAIL */}
            {selectedMessage && (
              <div className="col-md-7">
                <div className="mail-detail-panel">
                  {detailLoading ? (
                    <div className="text-center py-5">
                      <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                    </div>
                  ) : messageDetail ? (
                    <>
                      <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                          <h5 className="fw-bold mb-1">{messageDetail.subject || "(No subject)"}</h5>
                          <div className="text-muted" style={{ fontSize: 13 }}>From: {messageDetail.fromAddress || messageDetail.sender}</div>
                        </div>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => { setSelectedMessage(null); setMessageDetail(null); }}>
                          <i className="fas fa-times"></i>
                        </button>
                      </div>

                      <div className="mb-3" style={{ fontSize: 13 }}>
                        <div><strong>To:</strong> {Array.isArray(messageDetail.toAddress) ? messageDetail.toAddress.join(", ") : messageDetail.toAddress}</div>
                        <div><strong>Date:</strong> {messageDetail.receivedTime || messageDetail.sentTime}</div>
                      </div>

                      <div className="p-3 mb-4" style={{ background: "white", borderRadius: 8, border: "1px solid #eee", fontSize: 13, minHeight: 200 }}>
                        {messageDetail.content ? (
                          <div dangerouslySetInnerHTML={{ __html: messageDetail.content }} />
                        ) : (
                          <div className="text-muted">{messageDetail.snippet || "No content"}</div>
                        )}
                      </div>

                      {/* REPLY */}
                      <div>
                        <label className="form-label fw-semibold" style={{ fontSize: 12 }}>Reply</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={composeForm.content}
                          onChange={(e) => setComposeForm({ ...composeForm, content: e.target.value })}
                          placeholder="Type your reply..."
                        />
                        <button className="btn sahayya-btn-primary btn-sm mt-2" onClick={handleReply} disabled={sending || !composeForm.content.trim()}>
                          {sending ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-reply me-1"></i>}
                          Reply
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-5 text-muted">Select a message to view</div>
                  )}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ZohoMail;
