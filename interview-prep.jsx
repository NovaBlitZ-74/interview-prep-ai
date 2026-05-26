import { useState } from "react";

const typeStyles = {
  behavioral: { bg: "#FFF8E6", color: "#92620A", label: "Behavioral" },
  technical:  { bg: "#E8F0FE", color: "#1A56A0", label: "Technical"  },
  situational:{ bg: "#E8F8F1", color: "#1A7A4A", label: "Situational"},
  general:    { bg: "#F3F4F6", color: "#4B5563", label: "General"    },
};

function Badge({ type }) {
  const s = typeStyles[type] || typeStyles.general;
  return (
    <span style={{
      fontSize: 10, fontWeight: 600, textTransform: "uppercase",
      letterSpacing: "0.07em", padding: "3px 9px", borderRadius: 20,
      background: s.bg, color: s.color, whiteSpace: "nowrap", flexShrink: 0
    }}>{s.label}</span>
  );
}

function QACard({ item, index }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: "1px solid #E5E7EB", borderRadius: 12, overflow: "hidden",
      background: "#fff", transition: "box-shadow 0.2s",
    }}>
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "14px 16px", display: "flex", alignItems: "flex-start",
          gap: 12, cursor: "pointer",
          background: open ? "#F9FAFB" : "#fff",
        }}
      >
        <div style={{
          minWidth: 24, height: 24, borderRadius: "50%",
          background: "#EFF6FF", color: "#1D4ED8",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 11, fontWeight: 700, marginTop: 1
        }}>{index + 1}</div>
        <div style={{ flex: 1, fontSize: 14, fontWeight: 500, lineHeight: 1.5, color: "#111827" }}>
          {item.q}
        </div>
        <Badge type={item.type} />
        <div style={{
          marginTop: 3, color: "#9CA3AF", fontSize: 18,
          transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s"
        }}>⌄</div>
      </div>
      {open && (
        <div style={{
          padding: "14px 16px 16px 52px",
          borderTop: "1px solid #F3F4F6",
          background: "#FAFAFA"
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, textTransform: "uppercase",
            letterSpacing: "0.08em", color: "#059669", marginBottom: 8,
            display: "flex", alignItems: "center", gap: 5
          }}>✓ Model Answer</div>
          <div style={{ fontSize: 14, lineHeight: 1.75, color: "#374151" }}>
            {item.answer}
          </div>
        </div>
      )}
    </div>
  );
}

function SnapshotCard({ label, value }) {
  return (
    <div style={{
      background: "#F9FAFB", borderRadius: 10, padding: "12px 14px"
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.07em", color: "#9CA3AF", marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 500, color: "#111827", lineHeight: 1.4 }}>{value}</div>
    </div>
  );
}

export default function App() {
  const [jd, setJd] = useState("");
  const [bg, setBg] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  async function generate() {
    if (!jd.trim()) { setError("Please paste a job description first."); return; }
    setError(""); setLoading(true);

    const prompt = `You are an expert career coach. Analyse this job description${bg ? ` and candidate background: "${bg}"` : ""}.

Job Description:
${jd}

Respond ONLY with a valid JSON object, no markdown, no backticks:
{
  "snapshot": {
    "role": "Job title in 3-4 words",
    "industry": "Industry sector",
    "level": "Entry / Mid / Senior / Lead",
    "keySkill": "Most critical skill required"
  },
  "questions": [
    {
      "q": "The interview question",
      "type": "behavioral|technical|situational|general",
      "answer": "A strong 3-5 sentence model answer that would impress an interviewer. Be concrete, specific and practical."
    }
  ]
}

Generate exactly 8 questions. Mix: 3 behavioral, 2 technical, 2 situational, 1 general. Make every question specific to this exact role.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1500,
          messages: [{ role: "user", content: prompt }]
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      const raw = (data.content || []).map(i => i.text || "").join("");
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setResult(parsed);
    } catch (e) {
      setError("Error: " + (e.message || "Something went wrong. Please try again."));
    } finally {
      setLoading(false);
    }
  }

  function reset() { setResult(null); setJd(""); setBg(""); setError(""); }

  if (result) {
    const s = result.snapshot;
    return (
      <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 680, padding: "1.5rem 0" }}>
        <button onClick={reset} style={{
          fontSize: 13, color: "#6B7280", background: "none",
          border: "1px solid #E5E7EB", borderRadius: 8, padding: "7px 14px",
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          marginBottom: "1.5rem", fontFamily: "inherit"
        }}>← New job description</button>

        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 12 }}>Role snapshot</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, marginBottom: "2rem" }}>
          <SnapshotCard label="Role" value={s.role} />
          <SnapshotCard label="Industry" value={s.industry} />
          <SnapshotCard label="Level" value={s.level} />
          <SnapshotCard label="Key skill" value={s.keySkill} />
        </div>

        <div style={{ fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", color: "#9CA3AF", marginBottom: 12, paddingBottom: 8, borderBottom: "1px solid #F3F4F6" }}>
          Interview questions &amp; model answers
        </div>
        <div style={{ display: "grid", gap: 10 }}>
          {result.questions.map((item, i) => <QACard key={i} item={item} index={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", maxWidth: 680, padding: "1.5rem 0" }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em",
        background: "#EFF6FF", color: "#1D4ED8", padding: "4px 12px", borderRadius: 20, marginBottom: 12
      }}>✦ AI-Powered</div>

      <h1 style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2, color: "#111827", marginBottom: 6 }}>
        Your personal interview coach
      </h1>
      <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6, marginBottom: "1.8rem" }}>
        Paste a job description and get 8 tailored interview questions with model answers — instantly.
      </p>

      <div style={{ marginBottom: 14 }}>
        <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", display: "block", marginBottom: 6 }}>
          Job Description <span style={{ color: "#EF4444" }}>*</span>
        </label>
        <textarea
          value={jd}
          onChange={e => setJd(e.target.value)}
          rows={7}
          placeholder="Paste the job description here — role, responsibilities, requirements..."
          style={{
            width: "100%", border: "1px solid #E5E7EB", borderRadius: 8,
            padding: "12px 14px", fontFamily: "inherit", fontSize: 14,
            lineHeight: 1.6, color: "#111827", resize: "vertical",
            outline: "none"
          }}
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", color: "#6B7280", display: "block", marginBottom: 6 }}>
          Your background <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0, color: "#9CA3AF" }}>(optional)</span>
        </label>
        <textarea
          value={bg}
          onChange={e => setBg(e.target.value)}
          rows={3}
          placeholder="e.g. 3 years in sales, MBA from DU, career switch from teaching..."
          style={{
            width: "100%", border: "1px solid #E5E7EB", borderRadius: 8,
            padding: "12px 14px", fontFamily: "inherit", fontSize: 14,
            lineHeight: 1.6, color: "#111827", resize: "vertical", outline: "none"
          }}
        />
      </div>

      <button
        onClick={generate}
        disabled={loading}
        style={{
          width: "100%", padding: "14px", background: loading ? "#9CA3AF" : "#111827",
          color: "#fff", border: "none", borderRadius: 8, fontFamily: "inherit",
          fontSize: 15, fontWeight: 500, cursor: loading ? "not-allowed" : "pointer",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 8
        }}
      >
        {loading ? (
          <>
            <span style={{ display: "inline-block", animation: "spin 1s linear infinite" }}>⟳</span>
            Analysing the role…
          </>
        ) : "✦ Generate My Prep Kit"}
      </button>

      {error && (
        <div style={{
          marginTop: 12, padding: "10px 14px", background: "#FEF2F2",
          border: "1px solid #FECACA", borderRadius: 8, color: "#DC2626", fontSize: 14
        }}>{error}</div>
      )}

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
}
