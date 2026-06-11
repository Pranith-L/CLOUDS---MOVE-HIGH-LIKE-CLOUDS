import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './Support.css'

export default function Support() {
  const { user, token } = useAuth()
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })
  const [sent, setSent] = useState('')
  const [err, setErr] = useState('')
  const [loading, setLoading] = useState(false)
  const [list, setList] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [thread, setThread] = useState(null)
  const [reply, setReply] = useState('')
  const [replyBusy, setReplyBusy] = useState(false)

  const isAdmin = user?.role === 'admin'

  useEffect(() => {
    if (!token) return
    axios
      .get('/api/support/requests')
      .then((r) => setList(r.data))
      .catch(() => setList([]))
  }, [token, sent])

  useEffect(() => {
    if (user?.name) setForm((f) => ({ ...f, name: user.name }))
    if (user?.email) setForm((f) => ({ ...f, email: user.email }))
  }, [user?.name, user?.email])

  useEffect(() => {
    if (!selectedId || !token) {
      setThread(null)
      return
    }
    axios
      .get(`/api/support/requests/${selectedId}`)
      .then((r) => setThread(r.data))
      .catch(() => setThread(null))
  }, [selectedId, token, replyBusy])

  const submit = async (e) => {
    e.preventDefault()
    setErr('')
    setSent('')
    setLoading(true)
    try {
      await axios.post('/api/support/requests', form)
      setSent('Your message was sent. We will get back to you by email.')
      setForm((f) => ({ ...f, subject: '', message: '' }))
      if (token) {
        const r = await axios.get('/api/support/requests')
        setList(r.data)
      }
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not send request.')
    } finally {
      setLoading(false)
    }
  }

  const sendReply = async (e) => {
    e.preventDefault()
    if (!selectedId || !reply.trim()) return
    setReplyBusy(true)
    setErr('')
    try {
      const { data } = await axios.post(`/api/support/requests/${selectedId}/replies`, { message: reply })
      setReply('')
      setSent(data.mail === 'sent' ? 'Reply saved and emailed to the customer.' : 'Reply saved. (SMTP not configured — email was not sent.)')
      const r = await axios.get(`/api/support/requests/${selectedId}`)
      setThread(r.data)
      const lr = await axios.get('/api/support/requests')
      setList(lr.data)
    } catch (e2) {
      setErr(e2.response?.data?.message || 'Could not send reply.')
    } finally {
      setReplyBusy(false)
    }
  }

  return (
    <main className="support-page">
      <div className="container support-inner">
        <header className="support-header">
          <p className="subheading text-gradient">Help</p>
          <h1 className="display-md">Contact support</h1>
          <p className="support-lead">
            Send a request — we store it in your account and email you when we reply. Admins can answer from this page
            and the customer receives the reply by email when SMTP is configured.
          </p>
        </header>

        <div className="support-grid">
          <section className="support-card glass">
            <h2 className="support-h2">New request</h2>
            {sent && <div className="support-banner support-banner--ok">{sent}</div>}
            {err && <div className="support-banner support-banner--err">{err}</div>}
            <form className="support-form" onSubmit={submit}>
              <label className="support-field">
                <span>Name</span>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                />
              </label>
              <label className="support-field">
                <span>Email</span>
                <input
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  required
                />
              </label>
              <label className="support-field">
                <span>Subject</span>
                <input
                  className="input"
                  value={form.subject}
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  required
                />
              </label>
              <label className="support-field">
                <span>Message</span>
                <textarea
                  className="input support-textarea"
                  rows={5}
                  value={form.message}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  required
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? 'Sending…' : 'Send request'}
              </button>
            </form>
          </section>

          {token && (
            <section className="support-card glass support-inbox">
              <h2 className="support-h2">{isAdmin ? 'Inbox (all)' : 'Your requests'}</h2>
              {list.length === 0 ? (
                <p className="support-empty">No messages yet.</p>
              ) : (
                <ul className="support-list">
                  {list.map((row) => (
                    <li key={row._id}>
                      <button
                        type="button"
                        className={`support-thread-btn ${selectedId === row._id ? 'active' : ''}`}
                        onClick={() => setSelectedId(row._id)}
                      >
                        <span className="support-thread-subj">{row.subject}</span>
                        <span className="support-thread-meta">
                          {row.status} · {new Date(row.createdAt).toLocaleString()}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {thread && (
                <div className="support-thread">
                  <h3 className="support-h3">Thread</h3>
                  <div className="support-bubble support-bubble--user">
                    <strong>{thread.request.name}</strong>
                    <p>{thread.request.message}</p>
                  </div>
                  {thread.replies.map((r) => (
                    <div
                      key={r._id}
                      className={`support-bubble ${r.fromStaff ? 'support-bubble--staff' : 'support-bubble--user'}`}
                    >
                      <strong>{r.fromStaff ? 'CLOUDS' : 'You'}</strong>
                      <p>{r.body}</p>
                      <time className="support-time">{new Date(r.createdAt).toLocaleString()}</time>
                    </div>
                  ))}

                  {isAdmin && (
                    <form className="support-reply-form" onSubmit={sendReply}>
                      <label className="support-field">
                        <span>Staff reply (emails customer if SMTP is set)</span>
                        <textarea
                          className="input support-textarea"
                          rows={4}
                          value={reply}
                          onChange={(e) => setReply(e.target.value)}
                          placeholder="Type your reply…"
                          required
                        />
                      </label>
                      <button type="submit" className="btn btn-primary" disabled={replyBusy}>
                        {replyBusy ? 'Sending…' : 'Send reply'}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </section>
          )}
        </div>

        {!token && (
          <p className="support-foot">
            <Link to="/login">Sign in</Link> to see your past requests and thread history on this page.
          </p>
        )}
      </div>
    </main>
  )
}
