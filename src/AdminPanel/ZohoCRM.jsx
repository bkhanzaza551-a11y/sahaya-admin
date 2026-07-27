import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const TABS = ["Leads", "Contacts", "Deals"];

const STATUS_COLORS = {
  Contacted: "#17a2b8",
  Qualified: "#28a745",
  Unqualified: "#dc3545",
  "Need Assessment": "#fd7e14",
  "Attempted to Contact": "#6f42c1",
  "Not Contacted": "#6c757d",
};

const DEAL_STAGES = [
  "Qualification",
  "Needs Analysis",
  "Value Proposition",
  "Id. Decision Makers",
  "Perception Analysis",
  "Proposal/Price Quote",
  "Negotiation/Review",
  "Closed Won",
  "Closed Lost",
];

const ZohoCRM = () => {
  const [activeTab, setActiveTab] = useState("Leads");
  const [authStatus, setAuthStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [deals, setDeals] = useState([]);
  const [summary, setSummary] = useState({ leads: 0, contacts: 0, deals: 0 });
  const [showForm, setShowForm] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [formData, setFormData] = useState({});

  const fetchAuthStatus = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/status");
      setAuthStatus(data.data);
    } catch {
      setAuthStatus({ crm: { authorized: false }, desk: { authorized: false } });
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const { data } = await axiosInstance.get("/zoho/crm/summary");
      if (data.success) setSummary(data.data);
    } catch {}
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/leads");
      setLeads(data.data?.data || []);
    } catch (e) {
      toast.error("Failed to fetch leads");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchContacts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/contacts");
      setContacts(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch contacts");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDeals = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await axiosInstance.get("/zoho/crm/deals");
      setDeals(data.data?.data || []);
    } catch {
      toast.error("Failed to fetch deals");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuthStatus();
    fetchSummary();
  }, [fetchAuthStatus, fetchSummary]);

  useEffect(() => {
    if (activeTab === "Leads") fetchLeads();
    else if (activeTab === "Contacts") fetchContacts();
    else if (activeTab === "Deals") fetchDeals();
  }, [activeTab, fetchLeads, fetchContacts, fetchDeals]);

  const handleConnect = async (service) => {
    try {
      const { data } = await axiosInstance.get(`/zoho/auth-url?service=${service}`);
      if (data.success && data.data.url) {
        window.location.href = data.data.url;
      }
    } catch {
      toast.error("Failed to generate auth URL");
    }
  };

  const handleSync = async (type) => {
    setSyncing(true);
    try {
      const endpoint = type === "staff" ? "/zoho/crm/sync/staff" : "/zoho/crm/sync/owners";
      const { data } = await axiosInstance.post(endpoint);
      toast.success(data.message || "Sync completed");
      fetchSummary();
    } catch {
      toast.error("Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  const handleCreateRecord = async () => {
    try {
      const endpoint = activeTab === "Leads"
        ? "/zoho/crm/leads"
        : activeTab === "Contacts"
          ? "/zoho/crm/contacts"
          : "/zoho/crm/deals";
      const { data } = await axiosInstance.post(endpoint, formData);
      if (data.success) {
        toast.success(`${activeTab.slice(0, -1)} created successfully`);
        setShowForm(false);
        setFormData({});
        if (activeTab === "Leads") fetchLeads();
        else if (activeTab === "Contacts") fetchContacts();
        else fetchDeals();
      } else {
        toast.error("Failed to create record");
      }
    } catch (e) {
      toast.error(e?.response?.data?.message || "Failed to create record");
    }
  };

  const isAuthorized = authStatus?.crm?.authorized;

  const renderLeadForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Lead</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input className="form-control" required value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Company</label>
          <input className="form-control" value={formData.Company || ""} onChange={(e) => setFormData({ ...formData, Company: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Lead Source</label>
          <select className="form-select" value={formData.Lead_Source || ""} onChange={(e) => setFormData({ ...formData, Lead_Source: e.target.value })}>
            <option value="">Select</option>
            <option value="Sahayya App">Sahayya App</option>
            <option value="Website">Website</option>
            <option value="Referral">Referral</option>
            <option value="Social Media">Social Media</option>
            <option value="Other">Other</option>
          </select>
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Lead</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderContactForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Contact</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">First Name</label>
          <input className="form-control" value={formData.First_Name || ""} onChange={(e) => setFormData({ ...formData, First_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Last Name *</label>
          <input className="form-control" required value={formData.Last_Name || ""} onChange={(e) => setFormData({ ...formData, Last_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input className="form-control" type="email" value={formData.Email || ""} onChange={(e) => setFormData({ ...formData, Email: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input className="form-control" value={formData.Phone || ""} onChange={(e) => setFormData({ ...formData, Phone: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Contact</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  const renderDealForm = () => (
    <div className="card sahayya-card p-4 mb-4">
      <h6 className="fw-bold mb-3">Create New Deal</h6>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Deal Name *</label>
          <input className="form-control" required value={formData.Deal_Name || ""} onChange={(e) => setFormData({ ...formData, Deal_Name: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Amount</label>
          <input className="form-control" type="number" value={formData.Amount || ""} onChange={(e) => setFormData({ ...formData, Amount: e.target.value })} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Stage</label>
          <select className="form-select" value={formData.Stage || ""} onChange={(e) => setFormData({ ...formData, Stage: e.target.value })}>
            <option value="">Select</option>
            {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Closing Date</label>
          <input className="form-control" type="date" value={formData.Closing_Date || ""} onChange={(e) => setFormData({ ...formData, Closing_Date: e.target.value })} />
        </div>
      </div>
      <div className="mt-3 d-flex gap-2">
        <button className="btn sahayya-btn-primary" onClick={handleCreateRecord}>Create Deal</button>
        <button className="btn btn-outline-secondary" onClick={() => { setShowForm(false); setFormData({}); }}>Cancel</button>
      </div>
    </div>
  );

  return (
    <div className="container-fluid p-4">
      <style>{`
        .sahayya-card { border-radius: 12px; border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .sahayya-btn-primary { background: #D98C7A; color: #fff; border: none; }
        .sahayya-btn-primary:hover { background: #c47b6a; color: #fff; }
        .crm-tab { padding: 8px 20px; border-radius: 8px; cursor: pointer; border: none; font-weight: 500; }
        .crm-tab.active { background: #D98C7A; color: white; }
        .crm-tab:not(.active) { background: #f0f0f0; color: #333; }
        .crm-tab:not(.active):hover { background: #e0e0e0; }
        .stat-card { border-radius: 12px; border: none; box-shadow: 0 2px 8px rgba(0,0,0,0.05); padding: 20px; text-align: center; }
        .stat-number { font-size: 28px; font-weight: 700; color: #D98C7A; }
        .stat-label { font-size: 13px; color: #888; margin-top: 4px; }
        .status-badge { padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; color: white; }
        .connect-btn { background: #1a73e8; color: white; border: none; padding: 8px 20px; border-radius: 8px; font-weight: 500; }
        .connect-btn:hover { background: #1557b0; }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold">Zoho CRM</h4>
          <p className="text-muted mb-0" style={{ fontSize: 13 }}>Manage leads, contacts and deals from Sahayya</p>
        </div>
        <div className="d-flex gap-2">
          {!isAuthorized ? (
            <button className="connect-btn" onClick={() => handleConnect("crm")}>
              <i className="fas fa-link me-2"></i>Connect Zoho CRM
            </button>
          ) : (
            <>
              <button className="btn btn-outline-success btn-sm" onClick={() => handleSync("staff")} disabled={syncing}>
                {syncing ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-sync me-1"></i>}
                Sync Staff ({summary.leads})
              </button>
              <button className="btn btn-outline-primary btn-sm" onClick={() => handleSync("owners")} disabled={syncing}>
                {syncing ? <i className="fas fa-spinner fa-spin me-1"></i> : <i className="fas fa-sync me-1"></i>}
                Sync Owners ({summary.contacts})
              </button>
            </>
          )}
        </div>
      </div>

      {/* NOT AUTHORIZED */}
      {!isAuthorized && authStatus && (
        <div className="card sahayya-card p-5 text-center">
          <i className="fas fa-plug fa-3x text-muted mb-3"></i>
          <h5>Connect Your Zoho CRM</h5>
          <p className="text-muted mb-3" style={{ maxWidth: 500, margin: "0 auto" }}>
            Authorize Sahayya to access your Zoho CRM data. You'll be redirected to Zoho for authentication.
          </p>
          <button className="connect-btn" onClick={() => handleConnect("crm")}>
            <i className="fas fa-link me-2"></i>Authorize Zoho CRM
          </button>
        </div>
      )}

      {isAuthorized && (
        <>
          {/* STATS */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">{summary.leads}</div>
                <div className="stat-label">Total Leads</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">{summary.contacts}</div>
                <div className="stat-label">Total Contacts</div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="stat-card">
                <div className="stat-number">{summary.deals}</div>
                <div className="stat-label">Total Deals</div>
              </div>
            </div>
          </div>

          {/* TABS */}
          <div className="d-flex gap-2 mb-4">
            {TABS.map((tab) => (
              <button key={tab} className={`crm-tab ${activeTab === tab ? "active" : ""}`} onClick={() => { setActiveTab(tab); setShowForm(false); setFormData({}); }}>
                {tab}
              </button>
            ))}
          </div>

          {/* CREATE BUTTON */}
          <div className="mb-3">
            <button className="btn sahayya-btn-primary" onClick={() => setShowForm(!showForm)}>
              <i className="fas fa-plus me-1"></i>Create {activeTab.slice(0, -1)}
            </button>
          </div>

          {/* FORMS */}
          {showForm && activeTab === "Leads" && renderLeadForm()}
          {showForm && activeTab === "Contacts" && renderContactForm()}
          {showForm && activeTab === "Deals" && renderDealForm()}

          {/* DATA TABLE */}
          <div className="card sahayya-card p-4">
            {loading ? (
              <div className="text-center py-5">
                <i className="fas fa-spinner fa-spin fa-2x" style={{ color: "#D98C7A" }}></i>
                <p className="mt-2 text-muted">Loading data from Zoho...</p>
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-hover align-middle">
                  <thead>
                    <tr>
                      {activeTab === "Leads" && (
                        <>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Company</th>
                          <th>Source</th>
                          <th>Status</th>
                        </>
                      )}
                      {activeTab === "Contacts" && (
                        <>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Phone</th>
                          <th>Account</th>
                          <th>Created</th>
                        </>
                      )}
                      {activeTab === "Deals" && (
                        <>
                          <th>Deal Name</th>
                          <th>Amount</th>
                          <th>Stage</th>
                          <th>Closing Date</th>
                          <th>Contact</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {activeTab === "Leads" && leads.length === 0 && (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No leads found</td></tr>
                    )}
                    {activeTab === "Leads" && leads.map((lead, i) => (
                      <tr key={lead.id || i}>
                        <td className="fw-semibold">{lead.First_Name} {lead.Last_Name}</td>
                        <td>{lead.Email}</td>
                        <td>{lead.Phone}</td>
                        <td>{lead.Company}</td>
                        <td><span className="badge bg-light text-dark">{lead.Lead_Source}</span></td>
                        <td>
                          <span className="status-badge" style={{ background: STATUS_COLORS[lead.Lead_Status] || "#6c757d" }}>
                            {lead.Lead_Status || "New"}
                          </span>
                        </td>
                      </tr>
                    ))}

                    {activeTab === "Contacts" && contacts.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No contacts found</td></tr>
                    )}
                    {activeTab === "Contacts" && contacts.map((contact, i) => (
                      <tr key={contact.id || i}>
                        <td className="fw-semibold">{contact.First_Name} {contact.Last_Name}</td>
                        <td>{contact.Email}</td>
                        <td>{contact.Phone}</td>
                        <td>{contact.Account_Name?.name}</td>
                        <td>{contact.Created_Time}</td>
                      </tr>
                    ))}

                    {activeTab === "Deals" && deals.length === 0 && (
                      <tr><td colSpan="5" className="text-center py-4 text-muted">No deals found</td></tr>
                    )}
                    {activeTab === "Deals" && deals.map((deal, i) => (
                      <tr key={deal.id || i}>
                        <td className="fw-semibold">{deal.Deal_Name}</td>
                        <td>{deal.Amount ? `₹${Number(deal.Amount).toLocaleString()}` : "-"}</td>
                        <td><span className="badge bg-info">{deal.Stage}</span></td>
                        <td>{deal.Closing_Date}</td>
                        <td>{deal.Contact_Name?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default ZohoCRM;
