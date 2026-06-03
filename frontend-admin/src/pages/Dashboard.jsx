import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Users, Film, DollarSign, Coins, AlertTriangle, CreditCard, Wallet } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import api from '../services/api'

const PERIODS = ['Daily', 'Weekly', 'Monthly', 'Annual', 'All']

// 9 cards: Total Revenue, Membership Revenue, Top-Up Revenue, Total Users, Active Subscriptions, Dramas Uploaded, Coins Earned, Coins Spent, Check-ins
const metricIcons = [DollarSign, CreditCard, Wallet, Users, CreditCard, Film, Coins, Coins, AlertTriangle]

const alerts = []

// Format date label for X axis
function formatDateLabel(dateStr) {
  const d = new Date(dateStr)
  return `${d.getDate()}/${d.getMonth() + 1}`
}

// Custom tooltip for revenue chart
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--mono)' }}>₹{Number(p.value).toLocaleString('en-IN')}</span>
        </div>
      ))}
    </div>
  )
}

// Custom tooltip for top shows chart
function ShowsTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 12px', fontSize: 12 }}>
      <div style={{ color: 'var(--text2)', marginBottom: 4 }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ color: p.color, display: 'flex', gap: 8, justifyContent: 'space-between' }}>
          <span>{p.name}</span>
          <span style={{ fontFamily: 'var(--mono)' }}>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function Dashboard() {
  const [period, setPeriod] = useState('Daily')
  const [metrics, setMetrics] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revenueChart, setRevenueChart] = useState([])
  const [topShows, setTopShows] = useState([])
  const [chartsLoading, setChartsLoading] = useState(true)

  useEffect(() => {
    fetchMetrics(period)
    fetchCharts(period)
  }, [period])

  async function fetchMetrics(selectedPeriod) {
    setLoading(true)
    setError(null)
    try {
      const response = await api.get(`/v1/admin/dashboard/metrics?period=${selectedPeriod}`)
      setMetrics(response.data.data?.metrics || [])
    } catch (err) {
      setError(err.response?.data?.message || err.message)
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  async function fetchCharts(selectedPeriod) {
    setChartsLoading(true)
    try {
      const [revRes, showsRes] = await Promise.all([
        api.get(`/v1/admin/dashboard/revenue-chart?period=${selectedPeriod}`),
        api.get(`/v1/admin/dashboard/top-shows?period=${selectedPeriod}`),
      ])
      setRevenueChart(revRes.data.data?.chartData || [])
      setTopShows(showsRes.data.data?.chartData || [])
    } catch (err) {
      setRevenueChart([])
      setTopShows([])
    } finally {
      setChartsLoading(false)
    }
  }

  return (
    <div className="page-enter">
      {/* Alerts */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          display:'flex', alignItems:'center', gap:10, padding:'10px 14px', marginBottom:10,
          background: a.type==='error'?'var(--red-bg)':a.type==='warn'?'var(--amber-bg)':'var(--blue-bg)',
          border:`1px solid ${a.type==='error'?'rgba(255,92,106,0.25)':a.type==='warn'?'rgba(245,166,35,0.25)':'rgba(77,166,255,0.25)'}`,
          borderRadius:'var(--radius)', fontSize:12,
          color: a.type==='error'?'var(--red)':a.type==='warn'?'var(--amber)':'var(--blue)',
        }}>
          <AlertTriangle size={13}/>
          {a.msg}
          <button className="btn btn-ghost btn-sm" style={{ marginLeft:'auto', fontSize:11 }}>Review</button>
        </div>
      ))}

      {/* Period filter */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
        <div style={{ fontWeight:600, fontSize:14 }}>Platform overview</div>
        <div style={{ display:'flex', gap:6 }}>
          {PERIODS.map(p => (
            <button key={p} className={`btn btn-sm ${period===p?'btn-primary':'btn-ghost'}`} onClick={() => setPeriod(p)}>{p}</button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:'40px' }}>
          <div style={{ animation:'spin 1s linear infinite' }}>Loading...</div>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div style={{ padding:'20px', backgroundColor:'var(--red-bg)', borderRadius:'var(--radius)', color:'var(--red)', marginBottom:20 }}>
          Error: {error}
        </div>
      )}

      {/* Metrics grid */}
      {!loading && metrics.length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:20 }}>
          {metrics.map((m, i) => {
            const Icon = metricIcons[i] || Users
            return (
              <div key={m.label} className="metric-card" style={{ display:'flex', flexDirection:'column', gap:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                  <div className="metric-label">{m.label}</div>
                  <div style={{ width:28,height:28,borderRadius:6,background:'var(--bg4)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <Icon size={13} color="var(--text3)"/>
                  </div>
                </div>
                <div className="metric-value" style={{ fontSize:20 }}>{m.value}</div>
                <div className="metric-sub">
                  <span>{m.sub}</span>
                  {m.trend && (
                    <span style={{ marginLeft:'auto', display:'flex', alignItems:'center', gap:3, color:m.up===false?'var(--red)':m.up?'var(--green)':'var(--text3)', fontFamily:'var(--mono)', fontSize:11 }}>
                      {m.up===true?<TrendingUp size={10}/>:m.up===false?<TrendingDown size={10}/>:null}
                      {m.trend}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Empty state */}
      {!loading && metrics.length === 0 && !error && (
        <div style={{ padding:'40px', textAlign:'center', color:'var(--text3)' }}>
          No metrics available for this period
        </div>
      )}

      {/* Charts row */}
      {!loading && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:8 }}>

          {/* Revenue over time */}
          <div className="metric-card" style={{ padding:'16px 18px' }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:16, color:'var(--text)' }}>Revenue over time</div>
            {chartsLoading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220, color:'var(--text3)', fontSize:12 }}>Loading...</div>
            ) : revenueChart.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220, color:'var(--text3)', fontSize:12 }}>No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={revenueChart} margin={{ top:4, right:8, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDateLabel}
                    tick={{ fontSize:10, fill:'var(--text3)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize:10, fill:'var(--text3)' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => v >= 1000 ? `₹${(v/1000).toFixed(0)}k` : `₹${v}`}
                    width={45}
                  />
                  <Tooltip content={<RevenueTooltip />} />
                  <Legend wrapperStyle={{ fontSize:11, paddingTop:8 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke="var(--accent)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="membership" name="Membership" stroke="var(--green)" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="topup" name="Top-Up" stroke="var(--blue)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top 5 shows by unlocks */}
          <div className="metric-card" style={{ padding:'16px 18px' }}>
            <div style={{ fontWeight:600, fontSize:13, marginBottom:16, color:'var(--text)' }}>Top shows by unlocks</div>
            {chartsLoading ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220, color:'var(--text3)', fontSize:12 }}>Loading...</div>
            ) : topShows.length === 0 ? (
              <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:220, color:'var(--text3)', fontSize:12 }}>No data for this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={topShows} layout="vertical" margin={{ top:4, right:8, left:0, bottom:0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize:10, fill:'var(--text3)' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="show"
                    tick={{ fontSize:10, fill:'var(--text3)' }}
                    axisLine={false}
                    tickLine={false}
                    width={90}
                    tickFormatter={v => v.length > 12 ? v.slice(0, 12) + '…' : v}
                  />
                  <Tooltip content={<ShowsTooltip />} />
                  <Bar dataKey="unlocks" name="Unlocks" fill="var(--accent)" radius={[0, 3, 3, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

        </div>
      )}
    </div>
  )
}