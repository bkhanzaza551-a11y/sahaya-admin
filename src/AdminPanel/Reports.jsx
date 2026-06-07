import React, { useEffect, useState } from "react";
import axiosInstance from "../utiles/axiosInstance";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const formatCurrency = (value) => `₹${Number(value || 0).toFixed(2)}`;

const Reports = () => {
  const [filter, setFilter] = useState("monthly");
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = async (type) => {
    try {
      setLoading(true);
      const res = await axiosInstance.post("/admin/report", { type });

      if (res.data.status === "success") {
        setReportData(res.data.data);
      }
    } catch (error) {
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport(filter);
  }, [filter]);

  const revenuePoints = reportData?.chartdata?.revenue_overview || [];

  const chartData = {
    labels:
      revenuePoints.length > 0
        ? revenuePoints.map((item) => item.label)
        : filter === "monthly"
          ? ["Week 1", "Week 2", "Week 3", "Week 4"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Revenue (₹)",
        data:
          revenuePoints.length > 0
            ? revenuePoints.map((item) => item.revenue ?? item.amount ?? 0)
            : [0, 0, 0, 0],
        backgroundColor: "#D98C7A",
        borderRadius: 6,
      },
    ],
  };

  return (
    <div className="container-fluid p-4">
      <style>{`
        .sahayya-card {
          border: none;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        }
      `}</style>

      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="fw-bold mb-0">Reports</h2>
          <small className="text-muted">
            Business overview based on staff, jobs and revenue
          </small>
        </div>

        <select
          className="form-select w-auto"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-5">Loading Report...</div>
      ) : reportData ? (
        <>
          <div className="row g-4 mb-4">
            <div className="col-md-3">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Total House Owners</small>
                <h4 className="fw-bold mt-2">{reportData.house_owner_count}</h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Total Staff</small>
                <h4 className="fw-bold mt-2">{reportData.staff_count}</h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Total Jobs</small>
                <h4 className="fw-bold mt-2">{reportData.job_count}</h4>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Membership Revenue</small>
                <h4 className="fw-bold mt-2">
                  {formatCurrency(reportData.member_subscription_revenue)}
                </h4>
              </div>
            </div>
          </div>

          <div className="row g-4 mb-4">
            <div className="col-md-4">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Salary Paid</small>
                <h5 className="fw-bold mt-2">{formatCurrency(reportData.member_salary_paid)}</h5>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Present Attendance</small>
                <h5 className="fw-bold mt-2">{reportData.present_attendance_count}</h5>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card sahayya-card p-3">
                <small className="text-muted">Overall Attendance Rate</small>
                <h5 className="fw-bold mt-2">{reportData.overall_attendance_rate}%</h5>
              </div>
            </div>
          </div>

          <div className="card sahayya-card p-4">
            <h6 className="fw-bold mb-3">
              {filter === "monthly" ? "Monthly Revenue Overview" : "Yearly Revenue Overview"}
            </h6>
            <Bar data={chartData} />
          </div>
        </>
      ) : (
        <div className="text-center py-5">No Data Available</div>
      )}
    </div>
  );
};

export default Reports;
