import { promises as fs } from 'fs'
import path from 'path'
import { Vendor } from '../models/Vendor'

const dataDir = path.join(__dirname, '..', '..', 'data')
const dataFile = path.join(dataDir, 'vendors.json')

async function ensureFile() {
  try {
    await fs.mkdir(dataDir, { recursive: true })
    await fs.access(dataFile)
  } catch {
    await fs.writeFile(dataFile, '[]', 'utf8')
  }
}

export async function loadAll(): Promise<Vendor[]> {
  await ensureFile()
  const raw = await fs.readFile(dataFile, 'utf8')
  try {
    const arr = JSON.parse(raw) as Vendor[]
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

async function saveAll(items: Vendor[]) {
  await ensureFile()
  const tmp = dataFile + '.tmp'
  await fs.writeFile(tmp, JSON.stringify(items, null, 2), 'utf8')
  await fs.rename(tmp, dataFile)
}

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export async function listByUser(userId: string): Promise<Vendor[]> {
  const all = await loadAll()
  return all.filter(v => v.userId === userId)
}

export async function create(userId: string, input: Omit<Vendor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<string> {
  const all = await loadAll()
  const now = new Date().toISOString()
  const rec: Vendor = { id: uid(), userId, createdAt: now, updatedAt: now, ...input }
  all.push(rec)
  await saveAll(all)
  return rec.id
}

export async function update(userId: string, id: string, patch: Partial<Vendor>): Promise<boolean> {
  const all = await loadAll()
  const idx = all.findIndex(v => v.id === id && v.userId === userId)
  if (idx === -1) return false
  const now = new Date().toISOString()
  all[idx] = { ...all[idx], ...patch, id, userId, updatedAt: now }
  await saveAll(all)
  return true
}

export async function remove(userId: string, id: string): Promise<boolean> {
  const all = await loadAll()
  const next = all.filter(v => !(v.id === id && v.userId === userId))
  if (next.length === all.length) return false
  await saveAll(next)
  return true
}

export type UpsertResult = { created: number; updated: number; failed: number }

export async function upsertMany(userId: string, rows: Omit<Vendor, 'id' | 'userId' | 'createdAt' | 'updatedAt'>[], matchBy: 'id' | 'name' = 'name'): Promise<UpsertResult> {
  let created = 0, updated = 0, failed = 0
  const all = await loadAll()
  const now = new Date().toISOString()
  for (const r of rows) {
    try {
      if (matchBy === 'id') {
        const idx = all.findIndex(v => v.id === (r as any).id && v.userId === userId)
        if (idx >= 0) {
          all[idx] = { ...all[idx], ...r, updatedAt: now }
          updated++
        } else {
          const rec: Vendor = { id: uid(), userId, createdAt: now, updatedAt: now, ...r }
          all.push(rec); created++
        }
      } else {
        const idx = all.findIndex(v => v.userId === userId && v.name.trim().toLowerCase() === String(r.name).trim().toLowerCase())
        if (idx >= 0) { all[idx] = { ...all[idx], ...r, updatedAt: now }; updated++ }
        else { const rec: Vendor = { id: uid(), userId, createdAt: now, updatedAt: now, ...r }; all.push(rec); created++ }
      }
    } catch { failed++ }
  }
  await saveAll(all)
  return { created, updated, failed }
}
