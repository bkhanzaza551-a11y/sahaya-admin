import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const AllStaff = () => {
  const [staffList, setStaffList] = useState([]);
  const [pagination, setPagination] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  const fetchStaff = async (page = 1, searchTerm = "") => {
    try {
      setLoading(true);
      const res = await axiosInstance.get("/admin/stafflist", {
        params: { page, search: searchTerm },
      });

      if (res.data.success) {
        setStaffList(res.data.data.data);
        setPagination(res.data.data);
        setCurrentPage(res.data.data.current_page);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearch(value);
    fetchStaff(1, value);
  };

  const getStaffName = (staff) =>
    staff?.first_name && staff?.last_name
      ? `${staff.first_name} ${staff.last_name}`
      : staff?.name || "-";

  const getPrimaryAddress = (staff) => {
    const address = staff?.addresses?.[0] || {};
    return {
      street: address.street || address.locality || staff?.current_street || staff?.permanent_street || "-",
      city: address.city || staff?.current_city || staff?.permanent_city || "-",
      state: address.state || staff?.current_state || staff?.permanent_state || "-",
      pincode: address.pincode || staff?.current_pincode || staff?.permanent_pincode || "-",
    };
  };

  const getWorkInfo = (staff) => staff?.user_work_info || staff?.userWorkInfo || {};
  const getKycInfo = (staff) => staff?.kyc_information || staff?.kycInformation || {};
  const getLastExperience = (staff) => staff?.last_exp || staff?.lastExp || {};

  const formatValue = (value) => {
    if (Array.isArray(value)) {
      const cleaned = value.filter(Boolean);
      return cleaned.length ? cleaned.join(", ") : "-";
    }

    if (value === null || value === undefined || value === "") {
      return "-";
    }

    return value;
  };

  const getPhone = (staff) => {
    const prefix = staff?.phone_number_country_code || staff?.phone_number_prefix || staff?.country_code || "";
    const number =
      staff?.phone_number ||
      staff?.mobile_number ||
      staff?.mobile ||
      staff?.contact_number ||
      staff?.emergency_contact_number ||
      "";
    const combined = `${prefix}${number}`.trim();
    return combined || "-";
  };

  const getGenderLabel = (staff) => {
    const raw = String(staff?.gender || "").trim().toLowerCase();
    if (raw === "m") return "Male";
    if (raw === "f") return "Female";
    if (raw === "o") return "Other";
    return formatValue(staff?.gender);
  };

  const getPrimaryRole = (staff) => {
    const workInfo = getWorkInfo(staff);
    return (
      workInfo?.primary_role ||
      staff?.occupation ||
      staff?.service_category ||
      staff?.role ||
      getLastExperience(staff)?.role ||
      "-"
    );
  };

  const getPreferredLocation = (staff) => {
    const workInfo = getWorkInfo(staff);
    return (
      workInfo?.preferred_work_location ||
      staff?.preferred_work_location ||
      staff?.exact_location ||
      staff?.current_city ||
      "-"
    );
  };

  const getSalaryFrequency = (staff) => {
    const workInfo = getWorkInfo(staff);
    return {
      salary: workInfo?.salary || staff?.salary || "-",
      payFrequency: workInfo?.pay_frequency || staff?.pay_frequency || "-",
    };
  };

  const getSkills = (staff) => {
    const workInfo = getWorkInfo(staff);
    return workInfo?.skills || staff?.skills || staff?.service_category || "-";
  };

  const getLanguages = (staff) => {
    const workInfo = getWorkInfo(staff);
    return workInfo?.languages_spoken || staff?.languages_spoken || staff?.language || "-";
  };

  const getDocumentItems = (staff) => {
    const kyc = getKycInfo(staff);
    const workInfo = getWorkInfo(staff);

    return [
      {
        label: "Aadhaar Front",
        url: kyc?.aadhaar_front_path || staff?.aadhar_front || workInfo?.aadhar_front,
      },
      {
        label: "Aadhaar Back",
        url: kyc?.aadhaar_back_path || staff?.aadhar_back || workInfo?.aadhar_back,
      },
      {
        label: "Police Verification",
        url:
          kyc?.police_verification_path ||
          staff?.verification_certificate ||
          workInfo?.verification_certificate,
      },
      {
        label: "Staff Photo",
        url: staff?.image,
      },
    ].filter((item) => item.url);
  };

  const openStaffDetails = async (staff) => {
    try {
      setViewLoading(true);
      setSelectedStaff(staff);
      const res = await axiosInstance.get(`/admin/staff/${staff.id}`);

      if (res.data.success) {
        setSelectedStaff(res.data.data);
      }
    } catch (error) {
      console.log(error);
      toast.error("Failed to load full staff profile");
    } finally {
      setViewLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTargetId) return;
    try {
      await axiosInstance.delete(`/admin/staff/${deleteTargetId}`);
      toast.success("Staff deleted successfully");
      setDeleteTargetId(null);
      fetchStaff(currentPage, search);
      const modal = window.bootstrap?.Modal?.getInstance(document.getElementById("deleteModal"));
      modal?.hide();
    } catch (error) {
      console.log("Delete error:", error);
      toast.error("Delete failed: " + (error?.response?.data?.message || "Server error"));
    }
  };

  const changeStatus = async (staff) => {
    const newStatus = staff.status === "active" ? "block" : "active";
    try {
      await axiosInstance.put(`/admin/staff/${staff.id}/status`, { status: newStatus });
      toast.success("Status updated");
      fetchStaff(currentPage, search);
    } catch (error) {
      toast.error("Status update failed");
    }
  };

  const renderDocumentCard = (item) => {
    const isPdf = String(item.url).toLowerCase().includes(".pdf");

    return (
      <div className="col-md-6 mb-3" key={item.label}>
        <div className="border rounded-3 p-3 h-100">
          <strong className="d-block mb-2">{item.label}</strong>
          {isPdf ? (
            <a href={item.url} target="_blank" rel="noreferrer">
              View Document
            </a>
          ) : (
            <img src={item.url} className="img-fluid border rounded d-block" alt={item.label} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid p-4">
      <h2 className="fw-bold mb-4">All Staff</h2>

      <div className="row mb-3">
        <div className="col-md-4">
          <input
            className="form-control"
            placeholder="Search by name, phone, Aadhaar or role..."
            value={search}
            onChange={handleSearch}
          />
        </div>
      </div>

      <div className="card p-4">
        <div className="table-responsive">
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>Aadhaar</th>
                <th>Aadhaar Verified</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="text-center">Loading...</td>
                </tr>
              ) : staffList.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center">No Staff Found</td>
                </tr>
              ) : (
                staffList.map((staff) => (
                  <tr key={staff.id}>
                    <td>
                      <img
                        src={staff.image || "https://via.placeholder.com/40"}
                        width="40"
                        height="40"
                        className="rounded-circle border"
                        alt=""
                        onError={(e) => { e.target.src = "https://via.placeholder.com/40"; }}
                      />
                    </td>
                    <td>{getStaffName(staff)}</td>
                    <td>{staff.email || "-"}</td>
                    <td>{(staff.phone_number_country_code || "") + (staff.phone_number || "-")}</td>
                    <td>{staff.aadhar_number || "-"}</td>
                    <td>
                      <span className={`badge ${staff.aadhar__verify ? "bg-success" : "bg-danger"}`}>
                        {staff.aadhar__verify ? "Verified" : "Not Verified"}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${staff.status === "active" ? "bg-success" : "bg-danger"}`}>
                        {staff.status || "active"}
                      </span>
                    </td>
                    <td className="text-end">
                      <button
                        className="btn btn-sm btn-outline-secondary me-2"
                        data-bs-toggle="modal"
                        data-bs-target="#viewModal"
                        onClick={() => openStaffDetails(staff)}
                      >
                        View
                      </button>

                      <button
                        className="btn btn-sm btn-outline-warning me-2"
                        onClick={() => changeStatus(staff)}
                      >
                        {staff.status === "active" ? "Block" : "Activate"}
                      </button>

                      <button
                        className="btn btn-sm btn-outline-danger"
                        data-bs-toggle="modal"
                        data-bs-target="#deleteModal"
                        onClick={() => setDeleteTargetId(staff.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {pagination.last_page > 1 && (
          <div className="d-flex justify-content-end mt-3">
            <ul className="pagination mb-0">
              {[...Array(pagination.last_page)].map((_, i) => (
                <li key={i} className={`page-item ${currentPage === i + 1 && "active"}`}>
                  <button className="page-link" onClick={() => fetchStaff(i + 1, search)}>
                    {i + 1}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="modal fade admin-detail-modal" id="viewModal" tabIndex="-1">
        <div className="modal-dialog modal-xl modal-dialog-scrollable admin-detail-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Staff Profile</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            {selectedStaff && (
              <div className="modal-body">
                {viewLoading ? (
                  <div className="text-center py-4">Loading full staff details...</div>
                ) : (
                  <>
                    <div className="row mb-4 align-items-center">
                      <div className="col-md-2 text-center">
                        <img
                          src={selectedStaff.image || "https://via.placeholder.com/90"}
                          width="90"
                          height="90"
                          className="rounded-circle border"
                          alt=""
                          onError={(e) => { e.target.src = "https://via.placeholder.com/90"; }}
                        />
                      </div>
                      <div className="col-md-10">
                        <h4 className="mb-1">{getStaffName(selectedStaff)}</h4>
                        <p className="text-muted mb-1">{selectedStaff.email || "No email"}</p>
                        <p className="text-muted mb-0">Phone: {getPhone(selectedStaff)}</p>
                      </div>
                    </div>

                    <div className="row g-4">
                      <div className="col-lg-6">
                        <table className="table table-sm table-bordered">
                          <tbody>
                            <tr>
                              <th>Aadhaar No.</th>
                              <td>{selectedStaff.aadhar_number || "-"}</td>
                            </tr>
                            <tr>
                              <th>Aadhaar Verified</th>
                              <td>
                                <span className={`badge ${selectedStaff.aadhar__verify ? "bg-success" : "bg-danger"}`}>
                                  {selectedStaff.aadhar__verify ? "Verified" : "Not Verified"}
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <th>Gender</th>
                              <td>{getGenderLabel(selectedStaff)}</td>
                            </tr>
                            <tr>
                              <th>Date of Birth</th>
                              <td>{formatValue(selectedStaff.date_of_birth || selectedStaff.dob)}</td>
                            </tr>
                            <tr>
                              <th>Status</th>
                              <td className="text-capitalize">{formatValue(selectedStaff.status || "active")}</td>
                            </tr>
                            <tr>
                              <th>About</th>
                              <td>{formatValue(selectedStaff.about_me)}</td>
                            </tr>
                            <tr>
                              <th>Emergency Contact</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.emergency_contact_name)} / {formatValue(getWorkInfo(selectedStaff)?.emergency_contact_number)}</td>
                            </tr>
                            <tr>
                              <th>UPI ID</th>
                              <td>{formatValue(selectedStaff.upi_id)}</td>
                            </tr>
                            <tr>
                              <th>Education</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.education)}</td>
                            </tr>
                            <tr>
                              <th>Additional Info</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.additional_info)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="col-lg-6">
                        <table className="table table-sm table-bordered">
                          <tbody>
                            <tr>
                              <th>City / State</th>
                              <td>{formatValue(getPrimaryAddress(selectedStaff).city)} / {formatValue(getPrimaryAddress(selectedStaff).state)}</td>
                            </tr>
                            <tr>
                              <th>Street / Pincode</th>
                              <td>{formatValue(getPrimaryAddress(selectedStaff).street)} / {formatValue(getPrimaryAddress(selectedStaff).pincode)}</td>
                            </tr>
                            <tr>
                              <th>Primary Role</th>
                              <td>{formatValue(getPrimaryRole(selectedStaff))}</td>
                            </tr>
                            <tr>
                              <th>Preferred Work Location</th>
                              <td>{formatValue(getPreferredLocation(selectedStaff))}</td>
                            </tr>
                            <tr>
                              <th>Salary / Pay Frequency</th>
                              <td>{formatValue(getSalaryFrequency(selectedStaff).salary)} / {formatValue(getSalaryFrequency(selectedStaff).payFrequency)}</td>
                            </tr>
                            <tr>
                              <th>Experience</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.total_experience || selectedStaff?.years_of_experience)}</td>
                            </tr>
                            <tr>
                              <th>Skills</th>
                              <td>{formatValue(getSkills(selectedStaff))}</td>
                            </tr>
                            <tr>
                              <th>Languages</th>
                              <td>{formatValue(getLanguages(selectedStaff))}</td>
                            </tr>
                            <tr>
                              <th>Working Days</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.working_days || selectedStaff?.working_days)}</td>
                            </tr>
                            <tr>
                              <th>Joining Date</th>
                              <td>{formatValue(getWorkInfo(selectedStaff)?.joining_date)}</td>
                            </tr>
                            <tr>
                              <th>Voice Note</th>
                              <td>
                                {getWorkInfo(selectedStaff)?.voice_note ? (
                                  <a href={getWorkInfo(selectedStaff).voice_note} target="_blank" rel="noreferrer">
                                    Open Voice Note
                                  </a>
                                ) : (
                                  "-"
                                )}
                              </td>
                            </tr>
                            <tr>
                              <th>Last Experience</th>
                              <td>
                                {formatValue(getLastExperience(selectedStaff)?.role)}
                                {getLastExperience(selectedStaff)?.owner_name ? ` with ${getLastExperience(selectedStaff).owner_name}` : ""}
                                {getLastExperience(selectedStaff)?.city ? `, ${getLastExperience(selectedStaff).city}` : ""}
                                {getLastExperience(selectedStaff)?.state ? `, ${getLastExperience(selectedStaff).state}` : ""}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <h6 className="mt-4 mb-3 fw-bold">Uploaded Documents</h6>
                    {getDocumentItems(selectedStaff).length === 0 ? (
                      <div className="alert alert-warning py-2 mb-0">
                        No documents uploaded by this staff member.
                      </div>
                    ) : (
                      <div className="row">
                        {getDocumentItems(selectedStaff).map(renderDocumentCard)}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="modal fade" id="deleteModal" tabIndex="-1">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header bg-danger text-white">
              <h5 className="modal-title">Confirm Delete</h5>
              <button className="btn-close btn-close-white" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <p className="mb-0">
                Are you sure you want to <strong>permanently delete</strong> this staff member?
                This cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AllStaff;
