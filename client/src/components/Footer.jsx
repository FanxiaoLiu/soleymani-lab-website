import { Link } from 'react-router-dom';
import { Mail, MapPin, Twitter, Linkedin, ExternalLink } from 'lucide-react';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-white border-t-4 border-mcmaster-gold">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          
          {/* Column 1: Contact Info */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-mcmaster-gold">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start">
                <MapPin className="w-5 h-5 mr-3 text-gray-400 mt-1 flex-shrink-0" />
                <span className="text-gray-300 text-sm leading-relaxed">
                  John Hodgins Engineering Building (JHE)<br />
                  Room A315<br />
                  1280 Main Street West<br />
                  Hamilton, Ontario, L8S 4L7
                </span>
              </li>
              <li className="flex items-center">
                <Mail className="w-5 h-5 mr-3 text-gray-400 flex-shrink-0" />
                <a href="mailto:soleyml@mcmaster.ca" className="text-gray-300 hover:text-white transition-colors text-sm">
                  soleyml@mcmaster.ca
                </a>
              </li>
            </ul>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-mcmaster-gold">Quick Links</h3>
            <ul className="space-y-2 text-sm text-gray-300">
              <li>
                <Link to="/people" className="hover:text-white hover:translate-x-1 inline-block transition-transform">
                  Our Team
                </Link>
              </li>
              <li>
                <Link to="/publications" className="hover:text-white hover:translate-x-1 inline-block transition-transform">
                  Publications
                </Link>
              </li>
              <li>
                <Link to="/news" className="hover:text-white hover:translate-x-1 inline-block transition-transform">
                  News & Press
                </Link>
              </li>
              <li>
                <Link to="/positions" className="hover:text-white hover:translate-x-1 inline-block transition-transform">
                  Open Positions
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Affiliations */}
          <div>
            <h3 className="text-xl font-bold mb-6 text-mcmaster-gold">Affiliations</h3>
            <div className="flex flex-col space-y-3">
              <a 
                href="https://www.eng.mcmaster.ca/engphys/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center text-gray-300 hover:text-white transition-colors text-sm"
              >
                Department of Engineering Physics
                <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              <a 
                href="https://www.eng.mcmaster.ca/msbe/" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center text-gray-300 hover:text-white transition-colors text-sm"
              >
                School of Biomedical Engineering
                <ExternalLink className="w-3 h-3 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
              
              {/* Social Icons */}
              <div className="pt-6 flex space-x-4">
                <a href="https://x.com/SoleymaniLab" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-mcmaster-maroon transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
                <a href="https://www.linkedin.com/in/leyla-soleymani-0151b115b/?originalSubdomain=ca" target="_blank" rel="noopener noreferrer" className="p-2 bg-gray-800 rounded-full hover:bg-mcmaster-maroon transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Copyright Bar */}
      <div className="bg-black py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center text-xs text-gray-500">
          <p>© {currentYear} Soleymani Lab. All rights reserved.</p>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span className="hover:text-gray-300 cursor-pointer">Privacy Policy</span>
            <span className="hover:text-gray-300 cursor-pointer">Accessibility</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;