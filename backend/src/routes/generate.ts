import { Router } from 'express';
import { generateProposal, ProposalResult } from '../services/proposalService.js';

const router = Router();

// Timeout configuration (15 seconds)
const TIMEOUT_MS = 15000;

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
        error: 'Valid project idea is required',
        userMessage: 'Please provide a project idea to generate a proposal.'
      });
    }

    if (idea.length > 4000) {
      return res.status(400).json({
        success: false,
        error: 'Project idea too long',
        userMessage: 'Please keep your project idea under 4000 characters.'
      });
    }

    // Execute with timeout - explicitly type the result
    const result: ProposalResult = await Promise.race([
      generateProposal(idea),
      timeout(TIMEOUT_MS)
    ]) as ProposalResult;

    // Structure the response properly
    const response = {
      success: true, // Always true since we always return a proposal
      data: result.proposal,
      source: result.source,
      ...(result.error && {
        error: {
          type: result.error.type,
          message: result.error.userMessage,
          retryable: result.error.retryable,
          technicalDetails: result.error.message
        }
      })
    };

    res.json(response);

  } catch (error: any) {
    console.error('Error in /generate route:', error);
    
    if (error.message === 'Request timeout') {
      return res.status(408).json({
        success: false,
        error: {
          type: 'TIMEOUT_ERROR',
          message: 'The request took too long to process.',
          retryable: true,
          technicalDetails: 'Request timeout after 15 seconds'
        },
        userMessage: 'The request took too long. Please try again.'
      });
    }

    // Fallback for any unexpected errors
    const fallbackProposal = {
      title: 'Project Proposal',
      objective: 'We encountered an unexpected error while generating your proposal. Please try again with your project idea.',
      features: [
        'Error handling and recovery systems',
        'User-friendly error messaging',
        'Robust fallback mechanisms'
      ],
      targetAudience: 'Users experiencing technical difficulties',
      considerations: [
        'System stability and error recovery',
        'User experience during service interruptions',
        'Communication of technical issues'
      ]
    };

    res.status(500).json({
      success: false,
      data: fallbackProposal,
      source: 'fallback',
      error: {
        type: 'UNEXPECTED_ERROR',
        message: 'An unexpected error occurred in the server.',
        retryable: true,
        technicalDetails: error.message
      },
      userMessage: 'An unexpected error occurred. Showing a basic proposal template.'
    });
  }
});

export default router;