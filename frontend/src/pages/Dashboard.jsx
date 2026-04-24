import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getHistory } from '../config/api';

const SEV = {
  high:    { color: '#f07070', bg: 'rgba(217,64,64,0.1)',   border: 'rgba(217,64,64,0.25)'   },
  medium:  { color: '#f0b84a', bg: 'rgba(232,184,75,0.1)',  border: 'rgba(232,184,75,0.25)'  },
  low:     { color: '#6ad18a', bg: 'rgba(63,166,96,0.1)',   border: 'rgba(63,166,96,0.25)'   },
  unknown: { color: '#aaa',    bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
};

const DOMAIN_COLORS = {
  lending: '#0d6f73', hiring: '#7c5cbf',
  healthcare: '#c07830', insurance: '#3fa660',
};

export default function Dashboard() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getHistory()
      .then(r => { setHistory(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const counts = { high: 0, medium: 0, low: 0 };
  history.forEach(a => { if (counts[a.severity] !== undefined) counts[a.severity]++; });

  return (
    <div style={{ minHeight: '100vh', background: 'var(--ink-900)', paddingTop: '4.5rem' }}>

      {/* Header band */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(13,111,115,0.1) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '3rem 1.5rem 2rem',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <span className="badge badge-teal" style={{ marginBottom: '0.75rem', display: 'inline-flex' }}>
            Audit History
          </span>
          <h1 style={{
            fontFamily: 'var(--font-display)', fontWeight: 900,
            fontSize: 'clamp(2rem, 4vw, 3rem)', letterSpacing: '-0.04em', color: '#fff',
          }}>
            Fairness Dashboard
          </h1>
          <p style={{ color: 'var(--ink-400)', marginTop: '0.5rem' }}>
            {history.length === 0 ? 'No audits yet — run your first audit below.' : `${history.length} audit${history.length > 1 ? 's' : ''} completed`}
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 1.5rem' }}>

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {[
            { label: 'Total Audits',   value: history.length, color: 'var(--teal-300)' },
            { label: 'High Risk',      value: counts.high,    color: '#f07070' },
            { label: 'Medium Risk',    value: counts.medium,  color: '#f0b84a' },
            { label: 'Low Risk',       value: counts.low,     color: '#6ad18a' },
          ].map((card, i) => (
            <div key={i} className="stat-card" style={{ textAlign: 'center' }}>
              <div style={{
                fontFamily: 'var(--font-display)', fontWeight: 900,
                fontSize: '2.5rem', color: card.color,
                letterSpacing: '-0.04em',
              }}>{card.value}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--ink-400)', fontWeight: 600, marginTop: 4 }}>
                {card.label}
              </div>
            </div>
          ))}
        </div>

        {/* Audit list */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--ink-500)' }}>
            <div style={{
              width: 40, height: 40, border: '3px solid rgba(13,111,115,0.2)',
              borderTopColor: 'var(--teal-400)', borderRadius: '50%',
              animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem',
            }} />
            Loading audits…
          </div>
        ) : history.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '5rem 2rem',
            background: 'rgba(255,255,255,0.02)',
            border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 'var(--r-xl)',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔍</div>
            <h3 style={{ color: '#fff', fontWeight: 700, marginBottom: '0.5rem' }}>No audits yet</h3>
            <p style={{ color: 'var(--ink-500)', marginBottom: '1.5rem' }}>Run your first fairness audit to see results here.</p>
            <Link to="/audit/new" className="btn-primary">Start First Audit</Link>
          </div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderRadius: 'var(--r-xl)', overflow: 'hidden',
          }}>
            <table className="fc-table">
              <thead>
                <tr>
                  <th>Audit ID</th>
                  <th>Domain</th>
                  <th>Sensitive Attribute</th>
                  <th>Risk Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((a, i) => {
                  const s = SEV[a.severity] || SEV.unknown;
                  return (
                    <tr key={i} style={{ cursor: 'pointer' }}>
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--teal-300)' }}>
                          #{a.audit_id}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                            background: DOMAIN_COLORS[a.domain] || 'var(--teal-400)',
                          }} />
                          <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#fff' }}>
                            {a.domain}
                          </span>
                        </div>
                      </td>
                      <td>
                        <code style={{
                          fontSize: '0.82rem', padding: '0.2rem 0.6rem',
                          background: 'rgba(255,255,255,0.06)',
                          borderRadius: 'var(--r-sm)', color: 'var(--ink-200)',
                        }}>
                          {a.sensitive_column}
                        </code>
                      </td>
                      <td>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.3rem 0.85rem', borderRadius: 'var(--r-full)',
                          fontSize: '0.75rem', fontWeight: 700,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          background: s.bg, color: s.color, border: `1px solid ${s.border}`,
                        }}>
                          {a.severity || 'unknown'}
                        </span>
                      </td>
                      <td>
                        <Link to={`/audit/${a.audit_id}`} style={{
                          color: 'var(--teal-300)', fontSize: '0.875rem',
                          textDecoration: 'none', fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}>
                          View
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                          </svg>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CTA */}
        <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'center' }}>
          <Link to="/audit/new" className="btn-primary">
            Run New Audit
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M5 12h14M12 5l7 7-7 7"/>
            </svg>
          </Link>
        </div>
      </div>
    </div>
  );
}