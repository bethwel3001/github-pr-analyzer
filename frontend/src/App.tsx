import ProposalGenerator from './components/ProposalGenerator'
import Footer from './components/Footer'

function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex-1 py-8">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8 animate-fade-in-up">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Project Scope Catalyst
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Transform your raw ideas into structured, professional project proposals in seconds
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