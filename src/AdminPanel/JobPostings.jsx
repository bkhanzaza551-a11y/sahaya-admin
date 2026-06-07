import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const JobPostings = () => {
  const [jobs, setJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [owners, setOwners] = useState([]);
  const [jobDetailsLoading, setJobDetailsLoading] = useState(false);

  const fetchJobs = async () => {
    try {
      const res = await axiosInstance.get("/admin/jobs/list");

      if (res.data.status === "success") {
        setJobs(res.data.data.data);
        setFilteredJobs(res.data.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const fetchOwners = async () => {
    try {
      const res = await axiosInstance.get("/admin/houseowners");

      if (res.data.success) {
        setOwners(res.data.data.data);
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getOwnerName = (id) => {
    const owner = owners.find((item) => item.id === id);

    if (!owner) return "Unknown";

    return `${owner.first_name || ""} ${owner.last_name || ""}`.trim();
  };

  const formatCurrency = (value) => {
    if (value === null || value === undefined || value === "") {
      return "Not provided";
    }

    return `₹${Number(value).toFixed(2)}`;
  };

  const getCompensationValue = (job) =>
    job?.expected_compensation ?? job?.compensation ?? "";

  const formatScheduleDays = (days) => {
    if (Array.isArray(days)) {
      return days.join(", ");
    }

    if (typeof days === "string" && days.trim()) {
      return days;
    }

    return "";
  };

  const getRequirements = (job) => {
    const items = [];

    if (job?.required_skills) items.push(job.required_skills);
    if (job?.childcare_experience) items.push("Childcare experience");
    if (job?.cooking_required) items.push("Cooking required");
    if (job?.driving_license_required) items.push("Driving license required");
    if (job?.first_aid_certified) items.push("First aid certified");
    if (job?.pet_care_required) items.push("Pet care required");
    if (job?.additional_requirements) items.push(job.additional_requirements);

    return items.filter(Boolean);
  };

  const openJobDetails = async (jobId) => {
    try {
      setJobDetailsLoading(true);
      setSelectedJob(null);
      const response = await axiosInstance.get(`/admin/jobs/${jobId}`);

      if (response?.data?.status === "success") {
        setSelectedJob(response.data.data);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed to load job details");
    } finally {
      setJobDetailsLoading(false);
    }
  };

  const changeStatus = async (job) => {
    const newStatus = job.status === "active" ? "paused" : "active";

    try {
      await axiosInstance.post(`/admin/jobs/${job.id}/status`, {
        status: newStatus,
      });

      toast.success("Status Updated");
      fetchJobs();
    } catch (error) {
      toast.error(error?.response?.data?.message || "Failed");
    }
  };

  const deleteJob = async (jobId) => {
    try {
      await axiosInstance.delete(`/admin/jobs/${jobId}`);

      toast.success("Job deleted");
      fetchJobs();
    } catch (error) {
      toast.error("Delete failed");
    }
  };

  useEffect(() => {
    let data = [...jobs];

    if (search) {
      data = data.filter((job) =>
        job.title?.toLowerCase().includes(search.toLowerCase())
      );
    }

    setFilteredJobs(data);
  }, [search, jobs]);

  useEffect(() => {
    fetchJobs();
    fetchOwners();
  }, []);

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="fw-bold">Job Postings</h2>
      </div>

      <div className="card p-4">
        <div className="row g-3 mb-4">
          <div className="col-md-4">
            <input
              className="form-control"
              placeholder="Search by job title..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-responsive" style={{ overflowX: "auto", overflowY: "auto" }}>
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>House Owner</th>
                <th>Job Title</th>
                <th>Location</th>
                <th>Salary</th>
                <th>Commitment</th>
                <th>Status</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredJobs.map((job) => (
                <tr key={job.id}>
                  <td>{getOwnerName(job.created_by)}</td>
                  <td className="fw-bold">{job.title}</td>
                  <td>{[job.street_address, job.city].filter(Boolean).join(", ")}</td>
                  <td>{formatCurrency(getCompensationValue(job))}</td>
                  <td>
                    <span className="badge bg-light text-dark">{job.commitment_type || "Not provided"}</span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        job.status === "active"
                          ? "bg-success-subtle text-success"
                          : "bg-secondary-subtle text-secondary"
                      }`}
                    >
                      {job.status}
                    </span>
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-secondary me-2"
                      data-bs-toggle="modal"
                      data-bs-target="#viewJobModal"
                      onClick={() => openJobDetails(job.id)}
                    >
                      View
                    </button>

                    <button
                      className="btn btn-sm btn-outline-warning me-2"
                      onClick={() => changeStatus(job)}
                    >
                      {job.status === "active" ? "Pause" : "Activate"}
                    </button>

                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => deleteJob(job.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="modal fade" id="viewJobModal">
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content border-0 rounded-4">
              <div className="modal-header">
                <h5 className="modal-title fw-bold">Job Details</h5>
                <button className="btn-close" data-bs-dismiss="modal"></button>
              </div>

              {jobDetailsLoading ? (
                <div className="modal-body px-4">
                  <div className="text-center py-4">Loading job details...</div>
                </div>
              ) : selectedJob ? (
                <div className="modal-body px-4">
                  <h6 className="fw-bold">{selectedJob.title}</h6>
                  <p>{selectedJob.description || "No description provided."}</p>

                  <hr />

                  <h6 className="fw-bold">Compensation</h6>
                  <p>
                    {formatCurrency(getCompensationValue(selectedJob))}{" "}
                    ({selectedJob.compensation_type || "Not provided"})
                  </p>

                  <h6 className="fw-bold">Location</h6>
                  <p>
                    {[selectedJob.street_address, selectedJob.city, selectedJob.state, selectedJob.zip_code]
                      .filter(Boolean)
                      .join(", ") || "Not provided"}
                  </p>

                  <h6 className="fw-bold">Schedule</h6>
                  <p>
                    {[selectedJob.preferred_hours, formatScheduleDays(selectedJob.preferred_days)]
                      .filter(Boolean)
                      .join(" | ") || "Not provided"}
                  </p>

                  <h6 className="fw-bold">Skills</h6>
                  <p>{selectedJob.required_skills || "Not provided"}</p>

                  <h6 className="fw-bold">Requirements</h6>
                  {getRequirements(selectedJob).length > 0 ? (
                    <ul className="mb-0 ps-3">
                      {getRequirements(selectedJob).map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p>Not provided</p>
                  )}
                </div>
              ) : (
                <div className="modal-body px-4">
                  <div className="text-center py-4">No job details available.</div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobPostings;
