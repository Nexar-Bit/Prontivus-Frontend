'use client'

import React, { useEffect, useState } from 'react'

type Job = {
  id: number
  type: string
  status: string
  input_format: string
  source_name?: string
  created_at: string
  stats?: any
  errors?: any
}

export default function MigrationPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [type, setType] = useState('patients')
  const [format, setFormat] = useState('csv')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const loadJobs = async () => {
    try {
      const res = await fetch('/api/migration/jobs', { credentials: 'include' })
      if (res.ok) {
        setJobs(await res.json())
      }
    } catch {}
  }

  useEffect(() => { loadJobs() }, [])

  const createJob = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/migration/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ type, input_format: format })
      })
      if (!res.ok) throw new Error('Failed to create job')
      const job = await res.json()
      if (file) {
        const fd = new FormData()
        fd.append('file', file)
        const up = await fetch(`/api/migration/jobs/${job.id}/upload`, { method: 'POST', body: fd, credentials: 'include' })
        if (!up.ok) throw new Error('Upload failed')
      }
      await loadJobs()
    } catch (e: any) {
      alert(e.message || 'Error')
    } finally {
      setLoading(false)
    }
  }

  const rollback = async (id: number) => {
    // Note: Migration rollback is a critical operation - keeping confirm for now
    if (!confirm('Rollback this migration?')) return
    await fetch(`/api/migration/jobs/${id}/rollback`, { method: 'POST', credentials: 'include' })
    await loadJobs()
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Migração de Dados</h1>
      <div className="flex gap-3 items-center mb-4">
        <select value={type} onChange={e => setType(e.target.value)} className="border px-3 py-2 rounded">
          <option value="patients">Patients</option>
          <option value="appointments">Appointments</option>
          <option value="clinical">Clinical</option>
          <option value="financial">Financial</option>
        </select>
        <select value={format} onChange={e => setFormat(e.target.value)} className="border px-3 py-2 rounded">
          <option value="csv">CSV</option>
          <option value="json">JSON</option>
        </select>
        <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} />
        <button onClick={createJob} disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded">
          {loading ? 'Processing...' : 'Start Migration'}
        </button>
      </div>
      <div className="mt-6">
        <h2 className="text-xl font-semibold mb-2">Jobs</h2>
        <div className="space-y-2">
          {jobs.map(j => (
            <div key={j.id} className="border rounded p-3">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-medium">#{j.id} • {j.type} • {j.status}</div>
                  <div className="text-sm text-gray-600">Created {new Date(j.created_at).toLocaleString()}</div>
                </div>
                <button onClick={() => rollback(j.id)} className="border px-3 py-1 rounded">Rollback</button>
              </div>
              {j.stats ? <pre className="text-xs mt-2 bg-gray-50 p-2 rounded">{JSON.stringify(j.stats, null, 2)}</pre> : null}
              {j.errors ? <pre className="text-xs mt-2 bg-red-50 p-2 rounded">{JSON.stringify(j.errors, null, 2)}</pre> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}


