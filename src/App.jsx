
import { useState } from 'react'
import './App.css'
import BarcodeScanner from './BarcodeScanner'

const students = [
  { rollNo: '24eg106b01', name: 'Varshini', branch: 'Artificial Intelligence ', year: '3rd Year' },
  { rollNo: '24eg106b02', name: 'Rahul', branch: 'Computer Science', year: '1rd Year' },
  { rollNo: '24eg106b03', name: 'Priya', branch: 'EEE', year: '4rd Year' },
  { rollNo: '24eg106b04', name: 'ajay', branch: 'ECE', year: '2rd Year' },
  { rollNo: '23eg105a03', name: 'pranay', branch: 'aiml', year: '4rd Year' },
]

const initialEquipment = [
  { id: 1, name: 'Badminton Racket', game: 'Badminton', total: 10, available: 10 },
  { id: 2, name: 'Shuttlecock Set', game: 'Badminton', total: 15, available: 15 },
  { id: 3, name: 'Basketball', game: 'Basketball', total: 8, available: 8 },
  { id: 4, name: 'Football', game: 'Football', total: 8, available: 8 },
  { id: 5, name: 'Chess Set', game: 'Chess', total: 6, available: 6 },
  { id: 6, name: 'Carrom board', game: 'coins', total: 5, available: 5 },
  { id: 7, name: 'volly ball', game: 'vollyball', total: 4, available: 4 },
]

function currentTime() {
  return new Date().toLocaleString()
}

export default function App() {
  const [showScanner, setShowScanner] = useState(false)
  const [rollNo, setRollNo] = useState('')
  const [student, setStudent] = useState(null)
  const [equipment, setEquipment] = useState(initialEquipment)
  const [selectedItem, setSelectedItem] = useState('1')
  const [issues, setIssues] = useState([])
  const [message, setMessage] = useState('')
  const [page, setPage] = useState('Issue Equipment')

  function searchStudent(e) {
    e.preventDefault()
    const found = students.find(
      s => s.rollNo.toLowerCase() === rollNo.trim().toLowerCase()
    )
    setStudent(found || null)
    setMessage(found ? `Student found: ${found.name}` : 'Student not found. Try 24eg106b01, 24wg106b02 or 24eg106b03.')
  }

function handleBarcodeDetected(code) {
  const scannedCode = code.trim().toLowerCase()

  const found = students.find(
    s =>
      s.rollNo.toLowerCase() === scannedCode ||
      (s.barcode &&
        s.barcode.trim().toLowerCase() === scannedCode)
  )

  setRollNo(code.trim())
  setStudent(found || null)
  setShowScanner(false)

  setMessage(
    found
      ? `Student found: ${found.name}`
      : `Barcode scanned: ${code}. No matching student record was found.`
  )
}

  function issueEquipment(e) {
    e.preventDefault()
    if (!student) {
      setMessage('Search for a student first.')
      return
    }

    const item = equipment.find(x => x.id === Number(selectedItem))
    if (!item || item.available < 1) {
      setMessage('This equipment is not available.')
      return
    }

    const newIssue = {
      id: Date.now(),
      rollNo: student.rollNo,
      studentName: student.name,
      branch: student.branch,
      itemName: item.name,
      game: item.game,
      issueTime: currentTime(),
      returnTime: '',
      status: 'Issued',
    }

    setIssues(prev => [newIssue, ...prev])
    setEquipment(prev => prev.map(x =>
      x.id === item.id ? { ...x, available: x.available - 1 } : x
    ))
    setMessage(`${item.name} issued to ${student.name}.`)
  }

  function returnEquipment(id) {
    const issue = issues.find(x => x.id === id)
    if (!issue || issue.status === 'Returned') return

    setIssues(prev => prev.map(x =>
      x.id === id
        ? { ...x, returnTime: currentTime(), status: 'Returned' }
        : x
    ))
    setEquipment(prev => prev.map(x =>
      x.name === issue.itemName
        ? { ...x, available: Math.min(x.total, x.available + 1) }
        : x
    ))
    setMessage(`${issue.itemName} marked as returned.`)
  }

  const activeIssues = issues.filter(x => x.status === 'Issued')

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">S</div>
          <div>
            <h2>SportSpace</h2>
            <span>FACILITY MANAGER</span>
          </div>
        </div>

        <p className="nav-heading">WORKSPACE</p>
        {['Dashboard', 'Issue Equipment', 'Return Equipment', 'Inventory', 'Records'].map(item => (
          <button
            key={item}
            className={`nav-link ${page === item ? 'active' : ''}`}
            onClick={() => setPage(item)}
          >
            <span>{{
              Dashboard: '▦',
              'Issue Equipment': '＋',
              'Return Equipment': '↩',
              Inventory: '▤',
              Records: '◷',
            }[item]}</span>
            {item}
          </button>
        ))}

        <div className="sidebar-footer">
          <div className="avatar">SF</div>
          <div>
            <strong>Sports Faculty</strong>
            <span>Administrator</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">SPORTS FACILITY MANAGEMENT</p>
            <h1>{page}</h1>
          </div>
          <div className="today-badge">● System ready</div>
        </header>

        {message && (
          <div className="message">
            <span>{message}</span>
            <button onClick={() => setMessage('')} aria-label="Dismiss message">×</button>
          </div>
        )}

        {(page === 'Dashboard' || page === 'Issue Equipment') && (
          <>
            <section className="stats-grid">
              <div className="stat-card">
                <span className="stat-label">Total Equipment</span>
                <strong>{equipment.reduce((sum, x) => sum + x.total, 0)}</strong>
                <span className="stat-note">Across all sports</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Available Items</span>
                <strong>{equipment.reduce((sum, x) => sum + x.available, 0)}</strong>
                <span className="stat-note">Ready to issue</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Currently Issued</span>
                <strong>{activeIssues.length}</strong>
                <span className="stat-note">Awaiting return</span>
              </div>
              <div className="stat-card">
                <span className="stat-label">Total Transactions</span>
                <strong>{issues.length}</strong>
                <span className="stat-note">This session</span>
              </div>
            </section>

            <section className="content-card">
              <div className="section-title">
                <div>
                  <h2>Student identification</h2>
                  <p>Enter the student's college roll number to continue.</p>
                </div>
                <span className="step-tag">STEP 01</span>
              </div>

              <form className="search-form" onSubmit={searchStudent}>
                <label htmlFor="rollNo">College roll number</label>
                <div className="search-row">
                  <input
                    id="rollNo"
                    value={rollNo}
                    onChange={e => setRollNo(e.target.value)}
                    placeholder="e.g. 23AI001"
                    autoComplete="off"
                  />
                  
<button className="primary-button" type="submit">Find Student</button>

<button
  className="scan-button"
  type="button"
  onClick={() => setShowScanner(true)}
>
  Scan ID
</button>

</div>
<span className="helper-text">
  Demo roll numbers: 24eg106b01, 24eg106b02, 24eg106b03, 24eg106b04, 23eg105a03
</span>
</form>


              {student && (
                <div className="student-card">
                  <div className="student-avatar">{student.name.charAt(0)}</div>
                  <div className="student-info">
                    <span className="success-label">STUDENT VERIFIED</span>
                    <h3>{student.name}</h3>
                    <p>{student.branch}</p>
                  </div>
                  <div className="student-meta">
                    <span>ROLL NUMBER</span>
                    <strong>{student.rollNo}</strong>
                    <span>{student.year}</span>
                  </div>
                </div>
              )}
            </section>

            <section className="content-card">
              <div className="section-title">
                <div>
                  <h2>Issue sports equipment</h2>
                  <p>Choose an available item for the identified student.</p>
                </div>
                <span className="step-tag">STEP 02</span>
              </div>

              <form className="issue-form" onSubmit={issueEquipment}>
                <label htmlFor="equipment">Select equipment</label>
                <select id="equipment" value={selectedItem} onChange={e => setSelectedItem(e.target.value)}>
                  {equipment.map(item => (
                    <option key={item.id} value={item.id} disabled={item.available === 0}>
                      {item.game} — {item.name} ({item.available} available)
                    </option>
                  ))}
                </select>
                <button className="primary-button issue-button" type="submit">Issue Equipment →</button>
              </form>
              <p className="helper-text">The issue date and time are recorded automatically when you issue an item.</p>
            </section>
          </>
        )}

        {page === 'Return Equipment' && (
          <section className="content-card">
            <div className="section-title">
              <div>
                <h2>Active equipment issues</h2>
                <p>Mark an item as returned when the student brings it back.</p>
              </div>
            </div>
            {activeIssues.length === 0 ? (
              <p className="empty-state">No equipment is currently issued.</p>
            ) : activeIssues.map(item => (
              <div className="return-row" key={item.id}>
                <div>
                  <strong>{item.itemName}</strong>
                  <p>{item.studentName} · {item.rollNo}</p>
                  <span className="helper-text">Issued: {item.issueTime}</span>
                </div>
                <button className="primary-button" onClick={() => returnEquipment(item.id)}>Mark Returned</button>
              </div>
            ))}
          </section>
        )}

        {page === 'Inventory' && (
          <section className="content-card">
            <div className="section-title">
              <div>
                <h2>Equipment inventory</h2>
                <p>Check total stock and current availability.</p>
              </div>
            </div>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Equipment</th><th>Game</th><th>Total</th><th>Available</th><th>Status</th></tr></thead>
                <tbody>
                  {equipment.map(item => (
                    <tr key={item.id}>
                      <td>{item.name}</td><td>{item.game}</td><td>{item.total}</td><td>{item.available}</td>
                      <td><span className={`status ${item.available ? 'available' : 'unavailable'}`}>{item.available ? 'Available' : 'Out of stock'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {page === 'Records' && (
          <section className="content-card">
            <div className="section-title">
              <div>
                <h2>Issue and return history</h2>
                <p>View student, equipment and recorded timestamps.</p>
              </div>
            </div>
            {issues.length === 0 ? (
              <p className="empty-state">No transactions yet. Issue equipment to see records here.</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Student</th><th>Roll No.</th><th>Equipment</th><th>Issue Time</th><th>Return Time</th><th>Status</th></tr></thead>
                  <tbody>
                    {issues.map(item => (
                      <tr key={item.id}>
                        <td>{item.studentName}</td><td>{item.rollNo}</td><td>{item.itemName}</td>
                        <td>{item.issueTime}</td><td>{item.returnTime || '—'}</td>
                        <td><span className={`status ${item.status === 'Returned' ? 'available' : 'issued'}`}>{item.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        <footer className="page-footer">Smart Sports Facility & Equipment Management System <span>•</span> Faculty Portal</footer>
      </main>
      
{showScanner && (
  <BarcodeScanner
    onDetected={handleBarcodeDetected}
    onClose={() => setShowScanner(false)}
  />
)}


    </div>
  )
}
