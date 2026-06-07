import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import { toast } from "react-toastify";

const Addrole = () => {
  const [roleList, setRoleList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
  });

  // ✅ Default Image URL
  const DEFAULT_IMAGE =
    "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTPQHstFutlfl8tgZAtY8nDWucSWEvFM5AETQ&s";

  /* ================= FETCH ROLES ================= */
  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get("/category");

      if (res?.data?.success) {
        setRoleList(res.data.data || []);
      }
    } catch (error) {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, []);

  /* ================= HANDLE INPUT ================= */
  const handleChange = (e) => {
    setFormData({ ...formData, name: e.target.value });
  };

  /* ================= SAVE ROLE ================= */
  const handleSaveRole = async () => {
    if (!formData.name) {
      toast.warning("Role name required");
      return;
    }

    setSubmitting(true);

    try {
      const payload = new FormData();
      payload.append("name", formData.name);

      // ✅ Convert default image URL → File
      const response = await fetch(DEFAULT_IMAGE);
      const blob = await response.blob();

      payload.append("image", blob, "default.jpg");

      await axiosInstance.post("/category/save", payload, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      toast.success("Role added successfully");

      setFormData({ name: "" });

      // Close modal
      const modal = window.bootstrap.Modal.getInstance(
        document.getElementById("addRoleModal")
      );
      modal.hide();

      fetchRoles();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save role");
    } finally {
      setSubmitting(false);
    }
  };

  /* ================= DELETE ROLE ================= */
  const handleDeleteRole = async (id) => {
    if (!window.confirm("Are you sure you want to delete this role?")) return;

    try {
      await axiosInstance.delete(`/category/${id}`);

      toast.success("Role deleted successfully");

      fetchRoles();
    } catch (error) {
      toast.error("Failed to delete role");
    }
  };

  return (
    <div className="container-fluid p-4" style={{ height: "100vh" }}>
      <style>{`
        .sahayya-btn-primary {
          background-color: #D98C7A !important;
          border-color: #D98C7A !important;
          color: white !important;
        }
        .sahayya-btn-primary:hover {
          background-color: #c77d6d !important;
          border-color: #c77d6d !important;
        }
        .role-add-btn {
          min-width: 180px;
          min-height: 52px;
          border-radius: 14px !important;
          font-size: 1rem;
          font-weight: 700;
          box-shadow: 0 10px 24px rgba(217, 140, 122, 0.24);
        }
      `}</style>

      {/* HEADER */}
      <div className="d-flex justify-content-between mb-4">
        <h2 className="fw-bold">Role Management</h2>

        <button
          className="btn sahayya-btn-primary role-add-btn px-4"
          data-bs-toggle="modal"
          data-bs-target="#addRoleModal"
        >
          + Add Role
        </button>
      </div>

      {/* TABLE */}
      <div className="card p-4">
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border"></div>
          </div>
        ) : (
          <table className="table align-middle">
            <thead className="table-light">
              <tr>
                <th>Sr.</th>
                <th>Role Name</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {roleList.map((role, index) => (
                <tr key={role.id}>
                  <td>{index + 1}</td>

                  <td>
                    <strong>{role.name}</strong>
                  </td>

                  <td>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDeleteRole(role.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ADD MODAL */}
      <div className="modal fade" id="addRoleModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content rounded-4">
            <div className="modal-header">
              <h5 className="fw-bold">Add New Role</h5>
              <button className="btn-close" data-bs-dismiss="modal"></button>
            </div>

            <div className="modal-body">
              <label className="fw-bold">Role Name</label>
              <input
                className="form-control mb-3"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter role name"
              />
            </div>

            <div className="modal-footer">
              <button className="btn btn-light" data-bs-dismiss="modal">
                Cancel
              </button>

              <button
                className="btn sahayya-btn-primary"
                onClick={handleSaveRole}
                disabled={submitting}
              >
                {submitting ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Addrole;
