import { useState, useRef, useEffect } from 'react'
import { Download, Sparkles, X, AlertCircle, CheckCircle, RefreshCw, Edit3, FileText, HelpCircle } from 'lucide-react'

interface Proposal {
  title: string
  objective: string
  features: string[]
  targetAudience: string
  considerations: string[]
}

interface Alert {
  id: string
  type: 'success' | 'error' | 'info'
  message: string
  details?: string
  autoHide?: boolean
}

export default function ProposalGenerator() {
  const [idea, setIdea] = useState('')
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [usingFallback, setUsingFallback] = useState(false)
  const [editing, setEditing] = useState(false)
  const [editedProposal, setEditedProposal] = useState<Proposal | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const getFallbackProposal = (userIdea: string): Proposal => {
    return {
      title: `Project: ${userIdea.substring(0, 50)}${userIdea.length > 50 ? '...' : ''}`,
      objective: `This project addresses: "${userIdea}". We will develop a comprehensive solution that delivers value through modern technology and user-centric design principles.`,
      features: [
        "Core functionality implementation",
        "User-friendly interface design",
        "Scalable architecture foundation",
        "Security and data protection",
        "Performance optimization"
      ],
      targetAudience: "Primary users and stakeholders who will benefit from this solution",
      considerations: [
        "Technical architecture planning",
        "Development timeline and milestones",
        "Resource allocation and team structure",
        "Budget planning and cost management",
        "Risk assessment and mitigation strategies"
      ]
    }
  }

  const analyzeApiError = (error: any): { type: 'error' | 'info', message: string, details: string, autoHide: boolean } => {
    const errorMessage = error.message || 'Unknown error occurred'
    
    if (errorMessage.includes('MODEL_NOT_FOUND')) {
      return {
        type: 'error',
        message: 'AI Service Configuration Issue',
        details: 'The AI model is currently unavailable. Using demo data. Please check backend configuration.',
        autoHide: false
      }
    }
    
    if (errorMessage.includes('QUOTA_EXCEEDED')) {
      return {
        type: 'error',
        message: 'API Quota Exceeded',
        details: 'The AI service quota has been reached. Using demo data. Please try again later or check API billing.',
        autoHide: false
      }
    }
    
    if (errorMessage.includes('AUTH_ERROR')) {
      return {
        type: 'error',
        message: 'Authentication Failed',
        details: 'API authentication issue. Using demo data. Please check API key configuration.',
        autoHide: false
      }
    }
    
    if (errorMessage.includes('timeout') || errorMessage.includes('Network')) {
      return {
        type: 'error',
        message: 'Connection Issue',
        details: 'Unable to connect to the service. Using demo data. Please check your internet connection.',
        autoHide: true
      }
    }
    
    return {
      type: 'error',
      message: 'Service Temporarily Unavailable',
      details: 'The AI service is currently unavailable. Showing demo data based on your idea.',
      autoHide: true
    }
  }

  const addAlert = (type: 'success' | 'error' | 'info', message: string, details?: string, autoHide: boolean = true) => {
    const id = Date.now().toString()
    setAlerts(prev => [...prev, { id, type, message, details, autoHide }])
    
    if (autoHide) {
      setTimeout(() => {
        setAlerts(prev => prev.filter(alert => alert.id !== id))
      }, 5000)
    }
  }

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

const generateProposal = async () => {
  if (!idea.trim()) {
    addAlert('error', 'Please enter your project idea', 'A project idea is required to generate a proposal')
    textareaRef.current?.focus()
    return
  }

  if (idea.length > 2000) {
    addAlert('error', 'Project idea is too long', 'Please keep your idea under 2000 characters')
    return
  }

  setLoading(true)
  setProposal(null)
  setUsingFallback(false)
  setEditing(false)

  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 15000)

    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ idea }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    const data = await response.json()

    if (!response.ok) {
      throw new Error(data.userMessage || data.error?.message || `Request failed with status ${response.status}`)
    }

    if (!data.success) {
      throw new Error(data.userMessage || data.error?.message || 'Generation failed')
    }

    // Handle the new response structure
    setProposal(data.data)
    setEditedProposal(data.data)
    
    // Check if we're using fallback data or if there was an error
    if (data.source === 'fallback') {
      setUsingFallback(true)
      if (data.error) {
        addAlert('info', 'Demo Mode Active', data.error.message)
      } else {
        addAlert('info', 'Demo Data Used', 'AI service unavailable. Showing sample proposal.')
      }
    } else {
      addAlert('success', 'Proposal generated successfully')
    }
    
  } catch (error: any) {
    console.error('Error generating proposal:', error)
    
    const errorInfo = analyzeApiError(error)
    addAlert(errorInfo.type, errorInfo.message, errorInfo.details, errorInfo.autoHide)

    // Use fallback data
    const fallbackProposal = getFallbackProposal(idea)
    setProposal(fallbackProposal)
    setEditedProposal(fallbackProposal)
    setUsingFallback(true)
    
  } finally {
    setLoading(false)
  }
}

  const downloadPDF = async () => {
    if (!proposal) return

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000)

      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proposal: editedProposal || proposal }),
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error('Failed to generate PDF')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${(editedProposal || proposal).title.replace(/[^a-z0-9]/gi, '_')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      
      addAlert('success', 'PDF downloaded successfully')
    } catch (error: any) {
      console.error('Error downloading PDF:', error)
      addAlert('error', 'Failed to download PDF', 'Please try again or copy the content manually')
    }
  }

  const clearForm = () => {
    setIdea('')
    setProposal(null)
    setEditedProposal(null)
    setUsingFallback(false)
    setEditing(false)
    textareaRef.current?.focus()
  }

  const startEditing = () => {
    setEditing(true)
    setEditedProposal(proposal ? { ...proposal } : null)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditedProposal(proposal ? { ...proposal } : null)
  }

  const saveEditing = () => {
    if (editedProposal) {
      setProposal(editedProposal)
      setEditing(false)
      addAlert('success', 'Proposal updated successfully')
    }
  }

  const updateProposalField = (field: keyof Proposal, value: string | string[]) => {
    if (editedProposal) {
      setEditedProposal({
        ...editedProposal,
        [field]: value
      })
    }
  }

  const updateFeature = (index: number, value: string) => {
    if (editedProposal) {
      const newFeatures = [...editedProposal.features]
      newFeatures[index] = value
      updateProposalField('features', newFeatures)
    }
  }

  const updateConsideration = (index: number, value: string) => {
    if (editedProposal) {
      const newConsiderations = [...editedProposal.considerations]
      newConsiderations[index] = value
      updateProposalField('considerations', newConsiderations)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-4 px-3 sm:px-4">
      {/* Alert Container */}
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start justify-between p-3 sm:p-4 rounded-lg border animate-slide-in ${
              alert.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : alert.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            <div className="flex items-start space-x-3 flex-1">
              {alert.type === 'success' ? (
                <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
              ) : alert.type === 'info' ? (
                <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 mt-0.5 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm sm:text-base">{alert.message}</p>
                {alert.details && (
                  <p className="text-xs sm:text-sm opacity-90 mt-1 break-words">{alert.details}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="ml-2 sm:ml-4 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="animate-fade-in-up">
        <div className="mb-4 sm:mb-6">
          <label htmlFor="idea" className="block text-lg sm:text-xl font-semibold text-gray-900 mb-3">
            Describe Your Project Idea
          </label>
          <textarea
            ref={textareaRef}
            id="idea"
            rows={4}
            className="w-full px-3 sm:px-4 py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all resize-none custom-scrollbar text-gray-700 placeholder-gray-500"
            placeholder="Example: We need a mobile app for our coffee shop that lets customers order ahead, pay digitally, and earn loyalty points..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-2">
            <span className={`text-xs ${idea.length > 1800 ? 'text-red-500' : 'text-gray-500'}`}>
              {idea.length}/2000
            </span>
            {idea && (
              <button
                onClick={clearForm}
                className="text-xs text-gray-500 hover:text-gray-700 transition-colors font-medium"
              >
                Clear
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={generateProposal}
          disabled={loading || !idea.trim()}
          className="w-full bg-blue-600 text-white py-3 sm:py-4 px-4 sm:px-6 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm sm:text-base flex items-center justify-center space-x-2 shadow-sm hover:shadow-md"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Generating Proposal...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>Generate Proposal</span>
            </>
          )}
        </button>

        {usingFallback && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
            <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-blue-800 font-medium text-sm">Demo Mode Active</p>
              <p className="text-blue-700 text-xs sm:text-sm mt-1">Showing sample proposal. AI features will resume when available.</p>
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {proposal && (
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 animate-fade-in-up">
          {/* Header with Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-6 pb-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={editedProposal?.title || ''}
                  onChange={(e) => updateProposalField('title', e.target.value)}
                  className="w-full text-xl sm:text-2xl font-bold text-gray-900 bg-white border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 pb-1"
                />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 break-words">{proposal.title}</h2>
              )}
              
              {editing ? (
                <textarea
                  value={editedProposal?.objective || ''}
                  onChange={(e) => updateProposalField('objective', e.target.value)}
                  rows={2}
                  className="w-full mt-3 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 leading-relaxed resize-none"
                />
              ) : (
                <p className="text-gray-600 leading-relaxed mt-3 text-sm sm:text-base break-words">{proposal.objective}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 sm:gap-3 shrink-0">
              {!editing ? (
                <>
                  <button
                    onClick={startEditing}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium text-sm flex items-center justify-center space-x-2 order-2 sm:order-1"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium text-sm flex items-center justify-center space-x-2 order-1 sm:order-2"
                  >
                    <FileText className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveEditing}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all font-medium text-sm flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Save</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all font-medium text-sm flex items-center justify-center space-x-2"
                  >
                    <X className="w-4 h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Proposal Content */}
          <div className="grid lg:grid-cols-2 gap-6 sm:gap-8">
            {/* Key Features */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 mr-2" />
                Key Features
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {(editing ? editedProposal?.features : proposal.features)?.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 shrink-0" />
                    {editing ? (
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white"
                      />
                    ) : (
                      <span className="text-gray-700 text-sm sm:text-base leading-relaxed flex-1 break-words">{feature}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Target Audience</h3>
              {editing ? (
                <textarea
                  value={editedProposal?.targetAudience || ''}
                  onChange={(e) => updateProposalField('targetAudience', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white resize-none"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed text-sm sm:text-base bg-gray-50 p-3 rounded-lg border border-gray-200 break-words">
                  {proposal.targetAudience}
                </p>
              )}
            </div>

            {/* Initial Considerations */}
            <div className="lg:col-span-2 space-y-3 sm:space-y-4">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Initial Considerations</h3>
              <div className="grid sm:grid-cols-2 gap-3">
                {(editing ? editedProposal?.considerations : proposal.considerations)?.map((consideration, index) => (
                  <div key={index} className="flex items-start space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="w-2 h-2 bg-gray-600 rounded-full mt-1.5 shrink-0" />
                    {editing ? (
                      <input
                        type="text"
                        value={consideration}
                        onChange={(e) => updateConsideration(index, e.target.value)}
                        className="flex-1 px-2 py-1 text-xs sm:text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white"
                      />
                    ) : (
                      <span className="text-gray-700 text-xs sm:text-sm flex-1 break-words">{consideration}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          {!editing && (
            <div className="mt-6 sm:mt-8 pt-6 border-t border-gray-200">
              <button
                onClick={generateProposal}
                disabled={loading}
                className="w-full bg-gray-600 text-white py-2 sm:py-3 px-4 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium text-sm flex items-center justify-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Regenerate Proposal</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}