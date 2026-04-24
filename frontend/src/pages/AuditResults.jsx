import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { getAudit } from '../config/api';
import {
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Cell
} from 'recharts';

const SEV = {
  high:   { color:'#f87171', bg:'rgba(239,68,68,0.1)',   border:'rgba(239,68,68,0.25)'  },
  medium: { color:'#fbbf24', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)' },
  low:    { color:'#4ade80', bg:'rgba(34,197,94,0.1)',   border:'rgba(34,197,94,0.25)'  },
};
const DOMAIN_COLORS = { lending:'#14b8a6', hiring:'#8b5cf6', healthcare:'#f59e0b', insurance:'#22c55e' };

const chartStyle = {
  contentStyle:{ background:'#1e1d1b', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, fontSize:12 },
  labelStyle:{ color:'#fff' },
};

export default function AuditResults() {
  const { id } = useParams();
  const loc     = useLocation();
  const nav     = useNavigate();
  const [audit, setAudit] = useState(loc.state?.audit || null);
  const [tab, setTab]     = useState('overview');

  useEffect(() => {
    if (!audit) getAudit(id).then(r => setAudit(r.data)).catch(console.error);
  }, []); // eslint-disable-line

  if (!audit) return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', display:'grid', placeItems:'center', paddingTop:'4rem' }}>
      <div style={{ textAlign:'center', color:'var(--text-3)' }}>
        <div style={{ width:40, height:40, border:'3px solid rgba(20,184,166,0.2)', borderTopColor:'#14b8a6', borderRadius:'50%', animation:'spin 0.8s linear infinite', margin:'0 auto 1rem' }} />
        Loading…
      </div>
    </div>
  );

  const bfm = audit.baseline?.fairness_metrics  || {};
  const mfm = audit.mitigated?.fairness_metrics || {};
  const sev = bfm.severity || 'medium';
  const s   = SEV[sev] || SEV.medium;
  const domColor = DOMAIN_COLORS[audit.domain] || '#14b8a6';

  /* Build chart data */
  const compareData = [
    { name:'Stat Parity Diff',  baseline: Math.abs((bfm.statistical_parity_diff||0)*100), mitigated: Math.abs((mfm.statistical_parity_diff||0)*100) },
    { name:'Equal Opp Diff',    baseline: Math.abs((bfm.equal_opportunity_diff||0)*100),   mitigated: Math.abs((mfm.equal_opportunity_diff||0)*100) },
    { name:'FP Rate Diff',      baseline: Math.abs((bfm.false_positive_rate_diff||0)*100), mitigated: Math.abs((mfm.false_positive_rate_diff||0)*100) },
  ];

  const radarData = [
    { metric:'Stat Parity',  baseline: 100 - Math.abs((bfm.statistical_parity_diff||0)*100), mitigated: 100 - Math.abs((mfm.statistical_parity_diff||0)*100) },
    { metric:'Equal Opp',    baseline: 100 - Math.abs((bfm.equal_opportunity_diff||0)*100),   mitigated: 100 - Math.abs((mfm.equal_opportunity_diff||0)*100) },
    { metric:'FP Rate',      baseline: 100 - Math.abs((bfm.false_positive_rate_diff||0)*100), mitigated: 100 - Math.abs((mfm.false_positive_rate_diff||0)*100) },
    { metric:'Accuracy',     baseline: (audit.baseline?.overall_accuracy||0)*100, mitigated: (audit.mitigated?.overall_accuracy||0)*100 },
  ];

  /* Group bar data */
  const gm  = audit.baseline?.group_metrics  || {};
  const mgm = audit.mitigated?.group_metrics || {};
  const groupData = Object.keys(gm).map(g => ({
    name: g,
    baseline:  parseFloat(((gm[g]?.positive_rate||0)*100).toFixed(1)),
    mitigated: parseFloat(((mgm[g]?.positive_rate||0)*100).toFixed(1)),
  }));

  const tabs = [
    { id:'overview',   label:'Overview'   },
    { id:'charts',     label:'Charts'     },
    { id:'data',       label:'Dataset'    },
    { id:'model',      label:'Model'      },
    { id:'mitigation', label:'Mitigation' },
  ];

  return (
    <div style={{ minHeight:'100vh', background:'#0a0a0a', paddingTop:'4.5rem' }}>

      {/* ── Header ── */}
      <div style={{
        background:`linear-gradient(180deg, ${domColor}12 0%, transparent 100%)`,
        borderBottom:'1px solid rgba(255,255,255,0.06)',
        padding:'2.5rem 1.5rem 0',
      }}>
        <div style={{ maxWidth:1200, margin:'0 auto' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:'1rem', marginBottom:'1.5rem' }}>
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:'0.6rem', flexWrap:'wrap' }}>
                <span style={{ fontFamily:'monospace', fontSize:'0.78rem', padding:'0.25rem 0.6rem', background:'rgba(255,255,255,0.06)', borderRadius:6, color:'#14b8a6' }}>
                  #{audit.audit_id}
                </span>
                <span style={{
                  padding:'0.28rem 0.8rem', borderRadius:'var(--r-full)',
                  fontSize:'0.7rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em',
                  background:s.bg, color:s.color, border:`1px solid ${s.border}`,
                }}>{sev} risk</span>
              </div>
              <h1 style={{
                fontFamily:"'Space Grotesk',sans-serif", fontWeight:700,
                fontSize:'clamp(1.5rem, 3vw, 2.5rem)', letterSpacing:'-0.03em', color:'#fff',
              }}>
                {audit.domain.charAt(0).toUpperCase()+audit.domain.slice(1)} Fairness Audit
                <span style={{ color:'var(--text-3)', fontWeight:400 }}> · </span>
                <span style={{ color:domColor }}>{audit.sensitive_column}</span>
              </h1>
            </div>
            <button onClick={() => nav('/report/'+audit.audit_id, { state:{ audit } })} className="btn-primary">
              View Full Report
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:2 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)} style={{
                padding:'0.65rem 1.1rem', fontSize:'0.875rem', fontWeight:600,
                background:'none', border:'none', cursor:'pointer',
                color: tab===t.id ? '#fff' : 'var(--text-3)',
                borderBottom: tab===t.id ? '2px solid #14b8a6' : '2px solid transparent',
                transition:'all 0.2s ease',
              }}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth:1200, margin:'0 auto', padding:'2rem 1.5rem' }}>

        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gap:'1.25rem' }}>
            {/* KPI row */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(200px,1fr))', gap:'1rem' }}>
              {[
                { label:'Stat. Parity Diff',  val:`${Math.abs((bfm.statistical_parity_diff||0)*100).toFixed(1)}%`,  sub:`after mitigation: ${Math.abs((mfm.statistical_parity_diff||0)*100).toFixed(1)}%` },
                { label:'Equal Opp. Diff',    val:`${Math.abs((bfm.equal_opportunity_diff||0)*100).toFixed(1)}%`,    sub:`after mitigation: ${Math.abs((mfm.equal_opportunity_diff||0)*100).toFixed(1)}%` },
                { label:'Model Accuracy',     val:`${((audit.baseline?.overall_accuracy||0)*100).toFixed(1)}%`,      sub:`mitigated: ${((audit.mitigated?.overall_accuracy||0)*100).toFixed(1)}%` },
                { label:'Groups Analyzed',    val: Object.keys(gm).length,                                           sub:`on: ${audit.sensitive_column}` },
              ].map((m, i) => (
                <div key={i} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.4rem' }}>
                  <div style={{ fontSize:'0.68rem', textTransform:'uppercase', letterSpacing:'0.12em', color:'var(--text-3)', fontWeight:700, marginBottom:6 }}>{m.label}</div>
                  <div style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'2rem', letterSpacing:'-0.03em', color:'#fff', marginBottom:4 }}>{m.val}</div>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-3)' }}>{m.sub}</div>
                </div>
              ))}
            </div>

            {/* Gemini summary */}
            {audit.explanation?.summary && (
              <div style={{ padding:'1.5rem', borderRadius:'var(--r-xl)', background:'rgba(20,184,166,0.05)', border:'1px solid rgba(20,184,166,0.18)' }}>
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:'0.75rem' }}>
                  <span>🧠</span>
                  <span style={{ fontSize:'0.7rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'#14b8a6' }}>Gemini AI Analysis</span>
                </div>
                <p style={{ color:'var(--text-2)', lineHeight:1.75, fontSize:'0.95rem' }}>{audit.explanation.summary}</p>
              </div>
            )}

            {/* Steps */}
            {audit.explanation?.recommended_steps?.length > 0 && (
              <div style={{ padding:'1.5rem', borderRadius:'var(--r-xl)', background:'var(--bg-2)', border:'1px solid var(--border)' }}>
                <h3 style={{ fontWeight:700, color:'#fff', marginBottom:'1rem', fontSize:'0.9rem', display:'flex', gap:8 }}>📋 Recommended Next Steps</h3>
                <ol style={{ paddingLeft:'1.2rem', display:'grid', gap:'0.55rem' }}>
                  {audit.explanation.recommended_steps.map((st, i) => (
                    <li key={i} style={{ color:'var(--text-2)', lineHeight:1.7, fontSize:'0.9rem' }}>{st}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {/* CHARTS */}
        {tab === 'charts' && (
          <div style={{ display:'grid', gap:'1.5rem' }}>

            {/* Row 1: group bar + radar */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'1.5rem' }}>
              {/* Group approval rate */}
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.5rem' }}>
                <div style={{ marginBottom:'1rem' }}>
                  <span style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)' }}>Group Approval Rate</span>
                  <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#fff', marginTop:3 }}>Baseline vs Mitigated</h3>
                </div>
                {groupData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={groupData} barGap={4}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} unit="%" domain={[0,100]} />
                      <Tooltip {...chartStyle} formatter={v=>[`${v}%`]} />
                      <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.45)' }} />
                      <Bar dataKey="baseline"  name="Baseline"  fill="#ef4444" radius={[4,4,0,0]} />
                      <Bar dataKey="mitigated" name="Mitigated" fill="#14b8a6" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <div style={{ color:'var(--text-3)', padding:'3rem 0', textAlign:'center', fontSize:'0.875rem' }}>No group data</div>}
              </div>

              {/* Fairness radar */}
              <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.5rem' }}>
                <div style={{ marginBottom:'1rem' }}>
                  <span style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)' }}>Fairness Score Radar</span>
                  <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#fff', marginTop:3 }}>Before vs After Mitigation</h3>
                </div>
                <ResponsiveContainer width="100%" height={230}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.07)" />
                    <PolarAngleAxis dataKey="metric" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:10 }} />
                    <Radar name="Baseline"  dataKey="baseline"  stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} strokeWidth={2} />
                    <Radar name="Mitigated" dataKey="mitigated" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.12} strokeWidth={2} />
                    <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.45)' }} />
                    <Tooltip {...chartStyle} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Row 2: before vs after bias metrics */}
            <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.5rem' }}>
              <div style={{ marginBottom:'1rem' }}>
                <span style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)' }}>Bias Metric Comparison</span>
                <h3 style={{ fontSize:'0.95rem', fontWeight:700, color:'#fff', marginTop:3 }}>Absolute gap values — lower is fairer</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={compareData} layout="vertical" barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                  <XAxis type="number" tick={{ fill:'rgba(255,255,255,0.4)', fontSize:11 }} axisLine={false} tickLine={false} unit="%" />
                  <YAxis dataKey="name" type="category" tick={{ fill:'rgba(255,255,255,0.5)', fontSize:11 }} axisLine={false} tickLine={false} width={110} />
                  <Tooltip {...chartStyle} formatter={v=>[`${v.toFixed(1)}%`]} />
                  <Legend wrapperStyle={{ fontSize:11, color:'rgba(255,255,255,0.45)' }} />
                  <Bar dataKey="baseline"  name="Baseline"  fill="#ef4444" radius={[0,4,4,0]} />
                  <Bar dataKey="mitigated" name="Mitigated" fill="#14b8a6" radius={[0,4,4,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Metric KPI cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'1rem' }}>
              {[
                { label:'SPD Reduction', val:`${((Math.abs(bfm.statistical_parity_diff||0) - Math.abs(mfm.statistical_parity_diff||0))*100).toFixed(1)}%`, good: (bfm.statistical_parity_diff||0) > (mfm.statistical_parity_diff||0) },
                { label:'EOD Change',    val:`${((Math.abs(bfm.equal_opportunity_diff||0)   - Math.abs(mfm.equal_opportunity_diff||0))*100).toFixed(1)}%`,   good: (bfm.equal_opportunity_diff||0) > (mfm.equal_opportunity_diff||0) },
                { label:'Acc. Change',   val:`${(((audit.mitigated?.overall_accuracy||0) - (audit.baseline?.overall_accuracy||0))*100).toFixed(1)}%`,          good: (audit.mitigated?.overall_accuracy||0) >= (audit.baseline?.overall_accuracy||0) },
              ].map((m, i) => (
                <div key={i} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.5rem', textAlign:'center' }}>
                  <div style={{ fontSize:'0.68rem', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:'var(--text-3)', marginBottom:8 }}>{m.label}</div>
                  <div style={{
                    fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, fontSize:'2rem',
                    letterSpacing:'-0.03em',
                    color: m.good ? '#4ade80' : '#f87171',
                  }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* DATA, MODEL, MITIGATION — simple text for now */}
        {tab === 'data' && <DataTab data={audit.data_audit || {}} />}
        {tab === 'model' && <ModelTab baseline={audit.baseline || {}} col={audit.sensitive_column} />}
        {tab === 'mitigation' && <MitigationTab baseline={audit.baseline || {}} mitigated={audit.mitigated || {}} improvement={audit.improvement || {}} />}
      </div>
    </div>
  );
}

/* ── Dataset tab ────────────────────────────────────────────── */
function DataTab({ data }) {
  const items = Object.entries(data);
  if (!items.length) return <Empty label="No dataset audit data" />;
  return (
    <div style={{ display:'grid', gap:'1rem' }}>
      {items.map(([key, val]) => (
        <div key={key} style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', padding:'1.25rem' }}>
          <div style={{ fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.1em', fontWeight:700, color:'var(--text-3)', marginBottom:8 }}>{key.replaceAll('_',' ')}</div>
          <pre style={{ fontSize:'0.82rem', color:'var(--text-2)', whiteSpace:'pre-wrap', lineHeight:1.7 }}>{JSON.stringify(val, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
}

function ModelTab({ baseline, col }) {
  const gm = baseline.group_metrics || {};
  return (
    <div style={{ display:'grid', gap:'1rem' }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden' }}>
        <table className="fc-table">
          <thead><tr><th>Group ({col})</th><th>Positive Rate</th><th>Accuracy</th><th>TP Rate</th><th>FP Rate</th></tr></thead>
          <tbody>
            {Object.entries(gm).map(([g, m]) => (
              <tr key={g}>
                <td><strong style={{ color:'#fff' }}>{g}</strong></td>
                <td>{((m.positive_rate||0)*100).toFixed(1)}%</td>
                <td>{((m.accuracy||0)*100).toFixed(1)}%</td>
                <td>{((m.true_positive_rate||0)*100).toFixed(1)}%</td>
                <td>{((m.false_positive_rate||0)*100).toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MitigationTab({ baseline, mitigated, improvement }) {
  const bfm = baseline.fairness_metrics  || {};
  const mfm = mitigated.fairness_metrics || {};
  const rows = [
    { label:'Statistical Parity Diff', before:`${((bfm.statistical_parity_diff||0)*100).toFixed(1)}%`, after:`${((mfm.statistical_parity_diff||0)*100).toFixed(1)}%` },
    { label:'Equal Opportunity Diff',  before:`${((bfm.equal_opportunity_diff||0)*100).toFixed(1)}%`,  after:`${((mfm.equal_opportunity_diff||0)*100).toFixed(1)}%` },
    { label:'False Positive Rate Diff',before:`${((bfm.false_positive_rate_diff||0)*100).toFixed(1)}%`,after:`${((mfm.false_positive_rate_diff||0)*100).toFixed(1)}%` },
    { label:'Overall Accuracy',        before:`${((baseline.overall_accuracy||0)*100).toFixed(1)}%`,   after:`${((mitigated.overall_accuracy||0)*100).toFixed(1)}%`  },
    { label:'Severity',                before: bfm.severity||'—', after: mfm.severity||'—'             },
  ];
  return (
    <div style={{ display:'grid', gap:'1rem' }}>
      <div style={{ background:'var(--bg-2)', border:'1px solid var(--border)', borderRadius:'var(--r-xl)', overflow:'hidden' }}>
        <table className="fc-table">
          <thead><tr><th>Metric</th><th>Baseline</th><th>After Mitigation</th></tr></thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i}>
                <td><strong style={{ color:'var(--text-2)' }}>{r.label}</strong></td>
                <td style={{ color:'#f87171' }}>{r.before}</td>
                <td style={{ color:'#4ade80' }}>{r.after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Empty({ label }) {
  return (
    <div style={{ textAlign:'center', padding:'4rem', color:'var(--text-3)' }}>
      <div style={{ fontSize:'2.5rem', marginBottom:'1rem' }}>📂</div>
      <p>{label}</p>
    </div>
  );
}