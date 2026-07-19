import { Router, Response } from 'express'
import { authMiddleware, requireAdmin, AuthedRequest } from '../middleware/auth'
import { Soc2ControlModel } from '../models/Soc2Control'
import { notifyAdmins } from '../utils/email'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// GET /api/soc2 — get all controls with status summary
router.get('/', authMiddleware, asyncHandler(async (req: AuthedRequest, res: Response) => {
  try {
    const controls = await Soc2ControlModel.find().sort({ controlId: 1 }).lean()
    
    const summary = {
      total: controls.length,
      implemented: controls.filter(c => c.status === 'implemented').length,
      partial: controls.filter(c => c.status === 'partial').length,
      not_implemented: controls.filter(c => c.status === 'not_implemented').length,
    }
    
    res.json({ controls, summary })
  } catch (error) {
    console.error('Error fetching SOC 2 controls:', error)
    res.status(500).json({ error: 'Failed to fetch SOC 2 controls' })
  }
}))

// GET /api/soc2/summary — count of implemented/partial/not_implemented
router.get('/summary', authMiddleware, asyncHandler(async (req: AuthedRequest, res: Response) => {
  try {
    const controls = await Soc2ControlModel.find().lean()
    
    const summary = {
      total: controls.length,
      implemented: controls.filter(c => c.status === 'implemented').length,
      partial: controls.filter(c => c.status === 'partial').length,
      not_implemented: controls.filter(c => c.status === 'not_implemented').length,
    }
    
    res.json(summary)
  } catch (error) {
    console.error('Error fetching SOC 2 summary:', error)
    res.status(500).json({ error: 'Failed to fetch SOC 2 summary' })
  }
}))

// GET /api/soc2/:controlId — get single control detail
router.get('/:controlId', authMiddleware, asyncHandler(async (req: AuthedRequest, res: Response) => {
  try {
    const control = await Soc2ControlModel.findOne({ controlId: (req.params as any).controlId }).lean()
    if (!control) {
      return res.status(404).json({ error: 'SOC 2 control not found' })
    }
    res.json(control)
  } catch (error) {
    console.error('Error fetching SOC 2 control:', error)
    res.status(500).json({ error: 'Failed to fetch SOC 2 control' })
  }
}))

// PUT /api/soc2/:controlId — update control status and notes (admin only)
router.put('/:controlId', authMiddleware, requireAdmin, asyncHandler(async (req: AuthedRequest, res: Response) => {
  try {
    const controlId = (req.params as any).controlId
    const { status, notes, evidence, owner } = (req.body as any)
    
    const updateData: any = { lastReviewed: new Date() }
    if (status !== undefined) updateData.status = status
    if (notes !== undefined) updateData.notes = notes
    if (evidence !== undefined) updateData.evidence = evidence
    if (owner !== undefined) updateData.owner = owner
    
    const control = await Soc2ControlModel.findOneAndUpdate(
      { controlId },
      updateData,
      { new: true }
    ).lean()
    
    if (!control) {
      return res.status(404).json({ error: 'SOC 2 control not found' })
    }
    
    // Send alert if control is marked as not_implemented
    if (updateData.status === 'not_implemented') {
      notifyAdmins('SOC2_CONTROL_FAILING', {
        controlId: control.controlId,
        title: control.title,
        category: control.category,
      })
    }
    
    res.json(control)
  } catch (error) {
    console.error('Error updating SOC 2 control:', error)
    res.status(500).json({ error: 'Failed to update SOC 2 control' })
  }
}))

export default router
