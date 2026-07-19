import { z } from 'zod'

export type RiskLevel = 'Low' | 'Medium' | 'High'
export type ComplianceStatus = 'Compliant' | 'Pending' | 'Not Compliant'

export interface Vendor {
  id: string
  userId: string
  name: string
  serviceType?: string
  standards?: string[]
  riskLevel?: RiskLevel
  status?: ComplianceStatus
  lastAuditDate?: string // ISO date string (YYYY-MM-DD)
  notes?: string
  createdAt: string
  updatedAt: string
}

export const vendorCreateSchema = z.object({
  name: z.string().min(1),
  serviceType: z.string().optional(),
  standards: z.array(z.string()).optional(),
  riskLevel: z.enum(['Low', 'Medium', 'High']).optional(),
  status: z.enum(['Compliant', 'Pending', 'Not Compliant']).optional(),
  lastAuditDate: z.string().optional(),
  notes: z.string().optional(),
})

export const vendorUpdateSchema = vendorCreateSchema.partial()
