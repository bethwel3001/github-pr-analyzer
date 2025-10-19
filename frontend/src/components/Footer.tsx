import { Github, Mail, Heart } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-8">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2 text-gray-600 text-sm">
            <span>Made with</span>
            <Heart className="w-4 h-4 text-red-500 fill-current" />
            <span>by the open source community</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <a
              href="https://github.com/bethwel3001/github-pr-analyzer"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Github className="w-4 h-4" />
              <span>GitHub</span>
            </a>
            
            <a
              href="mailto:kiplagatbethwelk@gmail.com"
              className="text-gray-500 hover:text-gray-700 transition-colors flex items-center space-x-2 text-sm"
            >
              <Mail className="w-4 h-4" />
              <span>Contact</span>
            </a>
          </div>
        </div>
        
        <div className="text-center mt-4 pt-4 border-t border-gray-200">
          <p className="text-gray-500 text-xs">
            © {new Date().getFullYear()} Project Scope Catalyst. Open source under MIT License.
          </p>
        </div>
      </div>
    </footer>
  )
}