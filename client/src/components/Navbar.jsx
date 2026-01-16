import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;
  const toggleMenu = () => setIsOpen(!isOpen);
  const toggleDropdown = (name) => {
    setActiveDropdown(activeDropdown === name ? null : name);
  };

  // --- STYLING LOGIC ---
  // Background is white, so text is dark gray.
  // Hover adds a light background + Maroon text + Shadow.
  const linkClasses = (path) => `
    px-3 py-2 rounded-md font-bold transition-all duration-200
    ${isActive(path) 
      ? 'bg-red-50 text-mcmaster-maroon shadow-sm' 
      : 'text-gray-600 hover:bg-gray-50 hover:text-mcmaster-maroon hover:shadow-md'}
  `;

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20">
          
          {/* --- LOGO SECTION --- */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center group">
              {/* Logo Image */}
              <img 
                src="/soleymani-lab-logo.webp" 
                alt="Lab Logo" 
                className="h-12 w-auto mr-3 rounded-full border border-gray-100 shadow-sm group-hover:scale-105 transition-transform" 
              />
              <div className="flex flex-col">
                <span className="font-bold text-xl text-gray-900 leading-none tracking-tight group-hover:text-mcmaster-maroon transition-colors">Soleymani Lab</span>
                <span className="text-xs text-mcmaster-maroon font-bold uppercase tracking-wider mt-1 opacity-90">McMaster University</span>
              </div>
            </Link>
          </div>

          {/* --- DESKTOP NAVIGATION --- */}
          <div className="hidden md:flex items-center space-x-2">
            <Link to="/" className={linkClasses('/')}>
              Home
            </Link>

            <Link to="/research" className={linkClasses('/research')}>
              Research
            </Link>

            {/* PEOPLE DROPDOWN */}
            <div className="relative group">
              <button 
                className={`flex items-center px-3 py-2 rounded-md font-bold transition-all duration-200 focus:outline-none
                  ${location.pathname.includes('/people') 
                    ? 'bg-red-50 text-mcmaster-maroon shadow-sm' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-mcmaster-maroon hover:shadow-md'}
                `}
              >
                People <ChevronDown className="ml-1 w-4 h-4" />
              </button>
              
              {/* Dropdown Menu */}
              <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-100 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 transform origin-top-left overflow-hidden">
                <div className="py-1">
                  <Link to="/people" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon border-b border-gray-50">
                    Current Team
                  </Link>
                  <Link to="/people/alumni" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">
                    Alumni
                  </Link>
                </div>
              </div>
            </div>

            <Link to="/publications" className={linkClasses('/publications')}>
              Publications
            </Link>

            <Link to="/news" className={linkClasses('/news')}>
              News
            </Link>

            <Link to="/positions" className={linkClasses('/positions')}>
              Open Positions
            </Link>

            {/* Contact Button (Solid Maroon for high contrast) */}
            <Link 
              to="/contact" 
              className="ml-4 px-6 py-2 bg-mcmaster-maroon text-white font-bold rounded-full hover:bg-gray-900 transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
            >
              Contact
            </Link>
          </div>

          {/* --- MOBILE MENU BUTTON --- */}
          <div className="flex md:hidden items-center">
            <button onClick={toggleMenu} className="text-gray-600 hover:text-mcmaster-maroon focus:outline-none transition-colors">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* --- MOBILE MENU --- */}
      {isOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 shadow-inner">
          <div className="px-4 pt-2 pb-6 space-y-2">
            <Link to="/" onClick={toggleMenu} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">Home</Link>
            
            <Link to="/research" onClick={toggleMenu} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">Research</Link>

            {/* Mobile Dropdown */}
            <div>
              <button 
                onClick={() => toggleDropdown('people')}
                className="w-full flex justify-between items-center px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon"
              >
                People <ChevronDown className={`w-4 h-4 transform transition-transform ${activeDropdown === 'people' ? 'rotate-180' : ''}`} />
              </button>
              {activeDropdown === 'people' && (
                <div className="pl-6 space-y-1 bg-gray-50 rounded-md my-1 border-l-2 border-mcmaster-maroon">
                  <Link to="/people" onClick={toggleMenu} className="block px-3 py-3 text-sm text-gray-600 hover:text-mcmaster-maroon">Current Team</Link>
                  <Link to="/people/alumni" onClick={toggleMenu} className="block px-3 py-3 text-sm text-gray-600 hover:text-mcmaster-maroon">Alumni</Link>
                </div>
              )}
            </div>

            <Link to="/publications" onClick={toggleMenu} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">Publications</Link>
            <Link to="/news" onClick={toggleMenu} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">News</Link>
            <Link to="/positions" onClick={toggleMenu} className="block px-3 py-3 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 hover:text-mcmaster-maroon">Positions</Link>
            
            <Link to="/contact" onClick={toggleMenu} className="block mt-4 text-center px-3 py-3 rounded-md text-base font-bold bg-mcmaster-maroon text-white shadow-lg">Contact Us</Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;