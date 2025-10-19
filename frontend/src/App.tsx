import ProposalGenerator from './components/ProposalGenerator'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <div className="flex-1 py-6 sm:py-8">
        <div className="container mx-auto px-3 sm:px-4">
          <div className="text-center mb-6 sm:mb-8 animate-fade-in-up">
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              Project Scope Catalyst
            </h1>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Transform your ideas into structured, professional project proposals
            </p>
          </div>
          <ProposalGenerator />
        </div>
      </div>
      <Footer />
    </div>
  )
}

export default App