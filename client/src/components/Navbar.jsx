import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import logo from '../assets/soleymani-lab-logo.webp'; // <--- Import the logo here

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { name: 'People', path: '/people' },
    { name: 'Alumni', path: '/alumni' },
    { name: 'Publications & News', path: '/publications' },
    { name: 'Positions', path: '/positions' },
    { name: 'Contact', path: '/contact' },
  ];

  const isActive = (path) => location.pathname === path;


  return (
    // Increased height to h-28 for a bigger navbar
    <nav className="bg-mcmaster-maroon text-white shadow-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-28 items-center">

          {/* Logo Section */}
          <div className="flex-shrink-0 flex items-center">
            <Link to="/">
              <img 
                src={logo} 
                alt="Soleymani Lab Logo" 
                className="h-20 w-auto object-contain hover:scale-105 transition-transform duration-300" 
              />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex space-x-6">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                className={`
                  text-lg font-bold px-5 py-3 rounded-lg transition-all duration-300 ease-out border-2
                  ${isActive(link.path) 
                    ? 'bg-mcmaster-gold text-mcmaster-maroon border-mcmaster-gold shadow-[0_0_15px_rgba(253,191,87,0.6)] scale-105 transform' 
                    : 'border-transparent text-white hover:bg-white/20 hover:text-mcmaster-gold hover:border-mcmaster-gold/50 hover:shadow-lg hover:-translate-y-1'
                  }
                `}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-white hover:text-mcmaster-gold focus:outline-none transition-transform duration-300 hover:scale-110">
              {isOpen ? <X size={36} /> : <Menu size={36} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-mcmaster-maroon border-t-2 border-mcmaster-gold/30 shadow-2xl">
          <div className="px-4 pt-4 pb-6 space-y-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-3 rounded-lg text-xl font-bold transition-all
                  ${isActive(link.path) 
                    ? 'bg-mcmaster-gold text-mcmaster-maroon shadow-md' 
                    : 'text-white hover:bg-white/20 hover:text-mcmaster-gold hover:pl-6'}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};
export default Navbar;