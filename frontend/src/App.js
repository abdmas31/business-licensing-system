import React, { useState } from "react";
import { getReport } from "./api";

function App() {
  const [form, setForm] = useState({
    size_m2: "",
    seats: "",
    delivery: false,
    hazardous: false
  });
  const [report, setReport] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = {
      size_m2: Number(form.size_m2),
      seats: Number(form.seats),
      delivery: form.delivery,
      hazardous: form.hazardous
    };
    const result = await getReport(data);
    setReport(result);
  };

  return (
    <div style={{ maxWidth: "700px", margin: "auto", padding: "20px" }}>
      <h1>Business Licensing System</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>שטח (מ"ר):</label>
          <input
            type="number"
            name="size_m2"
            value={form.size_m2}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>מספר מקומות ישיבה:</label>
          <input
            type="number"
            name="seats"
            value={form.seats}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="delivery"
              checked={form.delivery}
              onChange={handleChange}
            />
            משלוחים
          </label>
        </div>
        <div>
          <label>
            <input
              type="checkbox"
              name="hazardous"
              checked={form.hazardous}
              onChange={handleChange}
            />
            חומרים מסוכנים
          </label>
        </div>
        <button type="submit">קבל דוח</button>
      </form>

      {report && (
        <div style={{ marginTop: "30px" }}>
          <h2>📋 דוח מותאם</h2>
          {report.summary && <p><b>סיכום:</b> {report.summary}</p>}

          {report.details && (
            <ul>
              {report.details.map((r, i) => (
                <li key={i}>
                  <b>{r.title}</b>
                  <ul>
                    {r.rules.map((rule, j) => (
                      <li key={j}>{rule}</li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {report.report && (
            <>
              <h3>🧠 ניסוח AI:</h3>
              <pre style={{ whiteSpace: "pre-wrap" }}>{report.report}</pre>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default App;
