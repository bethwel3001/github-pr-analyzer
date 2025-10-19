import { Router } from 'express';
import { generateProposal } from '../services/proposalService.js';
import { generatePDF } from '../services/pdfService.js';

const router = Router();

// Timeout configuration (10 seconds)
const TIMEOUT_MS = 10000;

const timeout = (ms: number) => 
  new Promise((_, reject) => 
    setTimeout(() => reject(new Error('Request timeout')), ms)
  );

router.post('/generate', async (req, res) => {
  try {
    const { idea } = req.body;
    
    if (!idea || typeof idea !== 'string') {
      return res.status(400).json({ 
        success: false,
        error: 'Valid project idea is required' 
      });
    }

    if (idea.length > 2000) {
      return res.status(400).json({
        success: false,
        error: 'Project idea too long. Please keep it under 2000 characters.'
      });
    }

    // Execute with timeout
    const proposal = await Promise.race([
      generateProposal(idea),
      timeout(TIMEOUT_MS)
    ]);

    res.json({
      success: true,
      data: proposal
    });
  } catch (error: any) {
    console.error('Error in /generate:', error);
    
    if (error.message === 'Request timeout') {
      return res.status(408).json({
        success: false,
        error: 'Request timeout. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate proposal. Please try again.'
    });
  }
});

router.post('/generate-pdf', async (req, res) => {
  try {
    const { proposal } = req.body;
    
    if (!proposal || !proposal.title) {
      return res.status(400).json({ 
        success: false,
        error: 'Valid proposal data is required' 
      });
    }

    // Execute with timeout
    const pdfBuffer = await Promise.race([
      generatePDF(proposal),
      timeout(TIMEOUT_MS)
    ]);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${proposal.title.replace(/[^a-z0-9]/gi, '_')}.pdf"`);
    res.send(pdfBuffer);
  } catch (error: any) {
    console.error('Error in /generate-pdf:', error);
    
    if (error.message === 'Request timeout') {
      return res.status(408).json({
        success: false,
        error: 'PDF generation timeout. Please try again.'
      });
    }

    res.status(500).json({
      success: false,
      error: 'Failed to generate PDF. Please try again.'
    });
  }
});

export default router;