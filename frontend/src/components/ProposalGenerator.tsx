import { useState, useRef, useEffect } from 'react'
import { Download, Sparkles, X, AlertCircle, CheckCircle, RefreshCw, Edit3, FileText, Zap, Shield, Wifi, WifiOff, Key, Server } from 'lucide-react'

interface Proposal {
  title: string
  objective: string
  features: string[]
  targetAudience: string
  considerations: string[]
}

interface Alert {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  details?: string
  action?: string
  duration?: number
}

interface ApiError {
  type: 'quota' | 'billing' | 'network' | 'connection' | 'model' | 'configuration' | 'unknown'
  message: string
  action: string
  icon: React.ReactNode
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

  // Enhanced error analysis with specific handling for model errors
  const analyzeApiError = (error: any): ApiError => {
    console.error('API Error Analysis:', error)
    
    if (error.message?.includes('timeout') || error.message?.includes('Network') || error.message?.includes('Failed to fetch')) {
      return {
        type: 'network',
        message: 'Connection Issue',
        action: 'Check your internet connection and try again. If problem persists, the server might be temporarily unavailable.',
        icon: <WifiOff className="w-4 h-4" />
      }
    }
    
    if (error.message?.includes('quota') || error.message?.includes('429')) {
      return {
        type: 'quota',
        message: 'Service Limit Reached',
        action: 'AI service quota exceeded. You can still use the app with our enhanced demo data. Try again in a few hours or check your API billing.',
        icon: <Server className="w-4 h-4" />
      }
    }
    
    if (error.message?.includes('AUTH') || error.message?.includes('401') || error.message?.includes('403')) {
      return {
        type: 'billing',
        message: 'Authentication Failed',
        action: 'Invalid API configuration. Please check your API key and billing status. Using enhanced demo mode for now.',
        icon: <Key className="w-4 h-4" />
      }
    }
    
    if (error.message?.includes('MODEL_NOT_FOUND') || error.message?.includes('404')) {
      return {
        type: 'model',
        message: 'AI Model Unavailable',
        action: 'The AI service is currently experiencing technical difficulties. We\'re using our enhanced demo data to ensure you can continue working.',
        icon: <Server className="w-4 h-4" />
      }
    }
    
    if (error.message?.includes('API key not configured')) {
      return {
        type: 'configuration',
        message: 'Service Not Configured',
        action: 'AI service is not configured. No worries! We\'ve activated our enhanced demo mode with high-quality sample proposals.',
        icon: <Key className="w-4 h-4" />
      }
    }
    
    return {
      type: 'unknown',
      message: 'Temporary Service Issue',
      action: 'The AI service is temporarily unavailable. We\'ve activated enhanced demo mode so you can continue creating proposals.',
      icon: <Server className="w-4 h-4" />
    }
  }

  const addAlert = (type: 'success' | 'error' | 'warning' | 'info', message: string, details?: string, action?: string, duration?: number) => {
    const id = Date.now().toString()
    setAlerts(prev => [...prev, { id, type, message, details, action, duration }])
    
    // Auto remove after specified duration or default
    setTimeout(() => {
      setAlerts(prev => prev.filter(alert => alert.id !== id))
    }, duration || (type === 'error' ? 5000 : 4000))
  }

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id))
  }

  // Robust fallback data
  const getFallbackProposal = (userIdea: string): Proposal => {
    const fallbacks = [
      {
        title: `Project: ${userIdea.substring(0, 40)}${userIdea.length > 40 ? '...' : ''}`,
        objective: `This project aims to address the following need: ${userIdea}. We will develop a comprehensive solution that delivers exceptional value through modern technology, user-centric design, and scalable architecture.`,
        features: [
          "Core functionality implementation with robust error handling",
          "Intuitive user interface with responsive design",
          "Scalable cloud-native architecture",
          "Comprehensive security and data protection",
          "Performance optimization and monitoring",
          "API integration and third-party services"
        ],
        targetAudience: "Primary users including stakeholders, end-users, and administrators who will benefit from streamlined processes and enhanced capabilities.",
        considerations: [
          "Technical architecture selection and infrastructure planning",
          "Development timeline with agile milestone delivery",
          "Resource allocation and team structure optimization",
          "Budget planning with contingency allocation",
          "Risk assessment and mitigation strategy development",
          "Compliance and regulatory requirements analysis"
        ]
      }
    ]
    return fallbacks[Math.floor(Math.random() * fallbacks.length)]
  }

  const generateProposal = async () => {
    if (!idea.trim()) {
      addAlert('error', 'Please enter your project idea', 'A project idea is required to generate a proposal')
      textareaRef.current?.focus()
      return
    }

    if (idea.length > 2000) {
      addAlert('error', 'Project idea is too long', 'Please keep your idea under 2000 characters for optimal results')
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
        throw new Error(data.error || `HTTP ${response.status}: Failed to generate proposal`)
      }

      if (!data.success) {
        throw new Error(data.error || 'Generation failed')
      }

      setProposal(data.data)
      setEditedProposal(data.data)
      addAlert('success', 'Project proposal generated successfully!', 'Your proposal is ready for review and download')
      
    } catch (error: any) {
      console.error('Error generating proposal:', error)
      
      const apiError = analyzeApiError(error)
      
      // Show specific error alert for 3 seconds
      addAlert(
        'warning', 
        `${apiError.message} - Demo Mode Activated`, 
        apiError.action,
        'You can continue using the app with enhanced demo data',
        3000 // 3 seconds
      )

      // Use robust fallback data
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
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to generate PDF`)
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
      
      addAlert('success', 'PDF downloaded successfully!', 'Your professional proposal is ready to share')
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
      addAlert('success', 'Proposal updated successfully!', 'Your changes have been saved')
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
    <div className="max-w-6xl mx-auto space-y-4 md:space-y-6 px-3 sm:px-4">
      {/* Alert Container */}
      <div className="space-y-2 md:space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`flex items-start justify-between p-3 md:p-4 rounded-lg md:rounded-xl border animate-slide-in ${
              alert.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : alert.type === 'warning'
                ? 'bg-amber-50 border-amber-200 text-amber-800'
                : alert.type === 'error'
                ? 'bg-red-50 border-red-200 text-red-800'
                : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}
          >
            <div className="flex items-start space-x-2 md:space-x-3 flex-1">
              <div className="flex-shrink-0 mt-0.5">
                {alert.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                ) : alert.type === 'warning' ? (
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                ) : alert.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                ) : (
                  <AlertCircle className="w-4 h-4 md:w-5 md:h-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm md:text-base leading-tight">{alert.message}</p>
                {alert.details && (
                  <p className="text-xs md:text-sm opacity-90 mt-1 leading-relaxed">{alert.details}</p>
                )}
                {alert.action && (
                  <p className="text-xs md:text-sm font-medium mt-1 opacity-80">{alert.action}</p>
                )}
              </div>
            </div>
            <button
              onClick={() => removeAlert(alert.id)}
              className="ml-2 md:ml-4 hover:opacity-70 transition-opacity flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* Input Section */}
      <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-6 animate-fade-in-up border border-white/20">
        <div className="mb-4 md:mb-6">
          <label htmlFor="idea" className="block text-lg md:text-xl font-bold text-gray-800 mb-2 md:mb-3 font-['Playfair_Display']">
            Describe Your Project Vision
          </label>
          <textarea
            ref={textareaRef}
            id="idea"
            rows={4}
            className="w-full px-3 md:px-4 py-3 md:py-4 border-2 border-gray-200 rounded-lg md:rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none custom-scrollbar text-gray-700 placeholder-gray-400 text-sm md:text-base"
            placeholder="Example: We need a mobile app for our coffee shop that lets customers order ahead, pay digitally, and earn loyalty points..."
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            disabled={loading}
          />
          <div className="flex justify-between items-center mt-2 md:mt-3">
            <span className={`text-xs md:text-sm font-medium ${idea.length > 1800 ? 'text-red-500' : 'text-gray-500'}`}>
              {idea.length}/2000 characters
            </span>
            {idea && (
              <button
                onClick={clearForm}
                className="text-xs md:text-sm text-gray-500 hover:text-gray-700 transition-colors font-medium"
              >
                Clear all
              </button>
            )}
          </div>
        </div>
        
        <button
          onClick={generateProposal}
          disabled={loading || !idea.trim()}
          className="w-full bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 text-white py-3 md:py-4 px-4 md:px-6 rounded-lg md:rounded-xl hover:from-blue-700 hover:via-purple-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 font-semibold md:font-bold text-sm md:text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center space-x-2 md:space-x-3"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 md:w-6 md:h-6 border-2 md:border-3 border-white border-t-transparent rounded-full animate-spin" />
              <span className="text-sm md:text-base">Crafting Your Proposal...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 md:w-6 md:h-6" />
              <span className="text-sm md:text-base">Generate Professional Proposal</span>
            </>
          )}
        </button>

        {usingFallback && (
          <div className="mt-3 md:mt-4 p-3 md:p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 md:space-x-3">
            <Shield className="w-4 h-4 md:w-5 md:h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="text-amber-800 font-medium text-xs md:text-sm">Enhanced Demo Mode Active</p>
              <p className="text-amber-700 text-xs md:text-sm mt-1">Using high-quality sample proposals. AI features will resume automatically when available.</p>
            </div>
          </div>
        )}
      </div>

      {/* Result Section */}
      {proposal && (
        <div className="bg-white/95 backdrop-blur-sm rounded-xl md:rounded-2xl shadow-lg md:shadow-2xl p-4 md:p-6 animate-fade-in-up border border-white/20">
          {/* Header with Actions */}
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-3 md:gap-4 mb-4 md:mb-8 pb-4 md:pb-6 border-b border-gray-200">
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  type="text"
                  value={editedProposal?.title || ''}
                  onChange={(e) => updateProposalField('title', e.target.value)}
                  className="w-full text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 bg-transparent border-b-2 border-blue-500 focus:outline-none focus:border-blue-600 font-['Playfair_Display']"
                />
              ) : (
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 font-['Playfair_Display'] leading-tight">{proposal.title}</h2>
              )}
              
              {editing ? (
                <textarea
                  value={editedProposal?.objective || ''}
                  onChange={(e) => updateProposalField('objective', e.target.value)}
                  rows={2}
                  className="w-full mt-2 md:mt-4 px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-600 leading-relaxed resize-none text-sm md:text-base"
                />
              ) : (
                <p className="text-gray-600 leading-relaxed mt-2 md:mt-4 text-sm md:text-base lg:text-lg">{proposal.objective}</p>
              )}
            </div>
            
            <div className="flex flex-col sm:flex-row lg:flex-col gap-2 md:gap-3 shrink-0">
              {!editing ? (
                <>
                  <button
                    onClick={startEditing}
                    className="bg-blue-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 md:focus:ring-offset-2 transition-all duration-200 font-semibold flex items-center justify-center space-x-1 md:space-x-2 shadow-lg hover:shadow-xl text-xs md:text-sm"
                  >
                    <Edit3 className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Edit Proposal</span>
                  </button>
                  <button
                    onClick={downloadPDF}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:from-green-700 hover:to-emerald-700 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-green-500 focus:ring-offset-1 md:focus:ring-offset-2 transition-all duration-200 font-semibold flex items-center justify-center space-x-1 md:space-x-2 shadow-lg hover:shadow-xl text-xs md:text-sm"
                  >
                    <FileText className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Download PDF</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={saveEditing}
                    className="bg-green-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-green-700 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-green-500 focus:ring-offset-1 md:focus:ring-offset-2 transition-all duration-200 font-semibold flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm"
                  >
                    <CheckCircle className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="bg-gray-600 text-white px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl hover:bg-gray-700 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 md:focus:ring-offset-2 transition-all duration-200 font-semibold flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm"
                  >
                    <X className="w-3 h-3 md:w-4 md:h-4" />
                    <span>Cancel</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Proposal Content */}
          <div className="grid lg:grid-cols-2 gap-4 md:gap-6 lg:gap-8">
            {/* Key Features */}
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 flex items-center font-['Playfair_Display']">
                <Sparkles className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-blue-500 mr-2 md:mr-3" />
                Key Features
              </h3>
              <div className="space-y-1 md:space-y-2 lg:space-y-3">
                {(editing ? editedProposal?.features : proposal.features)?.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-2 group">
                    <div className="w-2 h-2 md:w-3 md:h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full mt-1.5 md:mt-2 shrink-0" />
                    {editing ? (
                      <input
                        type="text"
                        value={feature}
                        onChange={(e) => updateFeature(index, e.target.value)}
                        className="flex-1 px-2 md:px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white text-xs md:text-sm"
                      />
                    ) : (
                      <span className="text-gray-700 leading-relaxed flex-1 text-xs md:text-sm lg:text-base">{feature}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Target Audience */}
            <div className="space-y-2 md:space-y-4">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 font-['Playfair_Display']">Target Audience</h3>
              {editing ? (
                <textarea
                  value={editedProposal?.targetAudience || ''}
                  onChange={(e) => updateProposalField('targetAudience', e.target.value)}
                  rows={3}
                  className="w-full px-2 md:px-3 py-1 md:py-2 border border-gray-300 rounded-lg md:rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white resize-none text-xs md:text-sm"
                />
              ) : (
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-2 md:p-3 lg:p-4 rounded-lg md:rounded-xl border border-gray-200 text-xs md:text-sm lg:text-base">
                  {proposal.targetAudience}
                </p>
              )}
            </div>

            {/* Initial Considerations */}
            <div className="lg:col-span-2 space-y-2 md:space-y-4">
              <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 font-['Playfair_Display']">Initial Considerations</h3>
              <div className="grid sm:grid-cols-2 gap-2 md:gap-3 lg:gap-4">
                {(editing ? editedProposal?.considerations : proposal.considerations)?.map((consideration, index) => (
                  <div key={index} className="flex items-start space-x-2 group bg-gray-50 p-2 md:p-3 rounded-lg md:rounded-xl border border-gray-200">
                    <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full mt-1 md:mt-1.5 shrink-0" />
                    {editing ? (
                      <input
                        type="text"
                        value={consideration}
                        onChange={(e) => updateConsideration(index, e.target.value)}
                        className="flex-1 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 text-gray-700 bg-white text-xs"
                      />
                    ) : (
                      <span className="text-gray-700 flex-1 text-xs md:text-sm leading-relaxed">{consideration}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regenerate Button */}
          {!editing && (
            <div className="mt-4 md:mt-6 lg:mt-8 pt-3 md:pt-4 lg:pt-6 border-t border-gray-200">
              <button
                onClick={generateProposal}
                disabled={loading}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white py-2 md:py-3 px-4 md:px-6 rounded-lg md:rounded-xl hover:from-gray-700 hover:to-gray-800 focus:outline-none focus:ring-1 md:focus:ring-2 focus:ring-gray-500 focus:ring-offset-1 md:focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-semibold flex items-center justify-center space-x-1 md:space-x-2 text-xs md:text-sm"
              >
                <RefreshCw className="w-3 h-3 md:w-4 md:h-4" />
                <span>Regenerate Proposal</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}