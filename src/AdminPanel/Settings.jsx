import React, { useState, useEffect } from "react";
import axiosInstance from "../utiles/axiosInstance";

const Settings = () => {

  const [points, setPoints] = useState("");
  const [ratio, setRatio] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await axiosInstance.get("/admin/settings");
      if (res.data?.success) {
        const settings = res.data.data;
        const pointsSetting = settings.find(s => s.key === "points_per_action");
        const ratioSetting = settings.find(s => s.key === "point_to_inr_ratio");
        if (pointsSetting) setPoints(pointsSetting.value);
        if (ratioSetting) setRatio(ratioSetting.value);
      }
    } catch (error) {
      console.log("Failed to load settings", error);
    }
  };

  // =========================
  // SUBMIT SETTINGS
  // =========================
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setMessage("");

      const payload = {
        settings: [
          {
            key: "points_per_action",
            value: points
          },
          {
            key: "point_to_inr_ratio",
            value: ratio
          }
        ]
      };

      const res = await axiosInstance.post(
        "/admin/settings/store",
        payload
      );

      if (res.data) {
        setMessage("? Settings updated successfully!");
      }

    } catch (error) {
      console.log(error);
      setMessage("? Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container-fluid p-4" style={{ minHeight: "100vh" }}>

      {/* HEADER */}
      <div className="mb-4">
        <h2 className="fw-bold">Settings</h2>
      </div>

      {/* CARD */}
      <div className="card p-4" style={{ maxWidth: "500px" }}>

        <form onSubmit={handleSubmit}>

          {/* INPUT 1 */}
          <div className="mb-3">
            <label className="form-label fw-semibold">
              Points Per Referral Invite
            </label>
            <input
              type="number"
              className="form-control"
              placeholder="e.g. 10"
              value={points}
              onChange={(e) => setPoints(e.target.value)}
              required
            />
          </div>

          {/* INPUT 2 */}
          <div className="mb-4">
            <label className="form-label fw-semibold">
              1 Point = How many INR?
            </label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="e.g. 1 or 0.5"
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              required
            />
            <small className="text-muted">If a user earns 10 points and this is 1, they get ?10 discount. If this is 0.5, they get ?5 discount.</small>
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Settings"}
          </button>

        </form>

        {/* MESSAGE */}
        {message && (
          <div className="mt-3 text-center fw-semibold">
            {message}
          </div>
        )}

      </div>
    </div>
  );
};

export default Settings;
