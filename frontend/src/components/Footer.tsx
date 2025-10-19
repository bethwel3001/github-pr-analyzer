import { Github, Mail, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white/10 backdrop-blur-sm border-t border-white/20 mt-12">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-white/80">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-400 fill-current" />
            <span>by the open source community</span>
          </div>
          
          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/bethwel3001/github-pr-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors flex items-center space-x-2"
            >
              <Github className="w-5 h-5" />
              <span>GitHub</span>
            </a>
            
            <a
              href="mailto:kiplagatbethwelk@gmail.com"
              className="text-white/70 hover:text-white transition-colors flex items-center space-x-2"
            >
              <Mail className="w-5 h-5" />
              <span>Contact</span>
            </a>
          </div>
        </div>
        
        <div className="text-center mt-6 pt-6 border-t border-white/20">
          <p className="text-white/60 text-sm">
            © {new Date().getFullYear()} Project Scope Catalyst. Open source under MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}