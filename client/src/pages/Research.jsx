import { useState, useEffect } from 'react';
import { ArrowRight, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';
import researchAreas from '../data/research_areas.json';
import allPubs from '../data/publications.json';

const Research = () => {
  const [openDropdownId, setOpenDropdownId] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const toggleDropdown = (id) => {
    setOpenDropdownId(openDropdownId === id ? null : id);
  };

  const getAreaPapers = (ids) => {
    if (!ids) return [];
    return ids.map(id => allPubs.find(p => p.id === id)).filter(Boolean);
  };

  return (
    <div className="min-h-screen bg-white">
      
      {/* HEADER */}
      <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Our Research</h1>
        </div>
      </div>

      {/* ZIG-ZAG SECTIONS */}
      <div className="flex flex-col w-full">
        {researchAreas.map((area, index) => {
          const areaPapers = getAreaPapers(area.publication_ids);
          const isOpen = openDropdownId === area.id;

          return (
            <div 
              key={area.id} 
              id={area.link.replace('/research/', '')}
              // --- FIX 1: Removed 'bg-gray-50' from the conditional ---
              // Now only the direction flips (row-reverse), but the background stays white.
              className={`flex flex-col md:flex-row w-full items-stretch
                ${index % 2 === 1 ? 'md:flex-row-reverse' : ''} 
              `}
            >
              
              {/* --- IMAGE HALF --- */}
              {/* --- FIX 2: Changed 'bg-gray-100/50' to 'bg-gray-50' --- 
                  This makes the side panel much lighter (subtle grey) instead of dark grey. 
              */}
              <div className="w-full md:w-1/2 p-8 md:p-12 flex items-center justify-center bg-gray-50">
                
                {/* Image Card */}
                <div className="relative w-full max-w-2xl h-[400px] md:h-[500px] bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                  <img 
                    src={area.image} 
                    alt={area.title} 
                    className="w-full h-full object-contain p-4 transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-mcmaster-maroon/0 group-hover:bg-mcmaster-maroon/5 transition-colors duration-500 pointer-events-none"></div>
                </div>

              </div>

              {/* --- TEXT HALF --- */}
              {/* Always white background now */}
              <div className="w-full md:w-1/2 p-10 lg:p-24 flex flex-col justify-center bg-white">
                
                <span className="text-6xl font-bold text-gray-100 mb-4 select-none">
                  0{index + 1}
                </span>

                <h2 className="text-3xl md:text-4xl font-bold text-mcmaster-maroon mb-6 relative">
                  {area.title}
                  <span className="block h-1.5 w-24 bg-mcmaster-gold mt-4 rounded-full"></span>
                </h2>

                <div className="prose prose-lg text-gray-600 leading-relaxed mb-8">
                  <p>{area.description_detailed}</p>
                </div>

                {/* DROPDOWN */}
                {areaPapers.length > 0 && (
                  <div className="mt-6 border-t border-gray-200 pt-6">
                    <button 
                      onClick={() => toggleDropdown(area.id)}
                      className="flex items-center text-lg font-bold text-gray-900 hover:text-mcmaster-maroon transition-colors focus:outline-none"
                    >
                      {isOpen ? <ChevronUp className="mr-2" /> : <ChevronDown className="mr-2" />}
                      Key Publications
                    </button>

                    <div 
                      className={`overflow-hidden transition-all duration-300 ease-in-out
                        ${isOpen ? 'max-h-[500px] opacity-100 mt-4' : 'max-h-0 opacity-0'}
                      `}
                    >
                      <ul className="space-y-4">
                        {areaPapers.map(pub => (
                          <li key={pub.id} className="bg-white/50 p-4 rounded-lg border-l-4 border-mcmaster-gold shadow-sm">
                            <a 
                              href={pub.link} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="group block"
                            >
                              <h4 className="font-bold text-gray-800 text-sm group-hover:text-mcmaster-maroon transition-colors leading-tight mb-1">
                                <FileText className="inline w-4 h-4 mr-2 -mt-1 text-gray-400" />
                                {pub.title}
                              </h4>
                              <div className="flex justify-between items-center mt-2 text-xs text-gray-500">
                                <span className="font-medium">{pub.journal}</span>
                                <span>{pub.year}</span>
                              </div>
                            </a>
                          </li>
                        ))}
                      </ul>
                      
                      <div className="mt-4 text-right">
                         <Link to="/publications" className="text-xs font-bold text-mcmaster-maroon uppercase hover:text-mcmaster-gold">
                           View Full List <ArrowRight className="inline w-3 h-3 ml-1" />
                         </Link>
                      </div>
                    </div>
                  </div>
                )}

              </div>

            </div>
          );
        })}
      </div>

      {/* BOTTOM CTA */}
      <div className="bg-mcmaster-maroon text-white py-16 text-center px-4">
        <h2 className="text-3xl font-bold mb-4">Interested in collaborating?</h2>
        <p className="text-gray-200 mb-8 max-w-2xl mx-auto">
          We are always open to new partnerships with industry and clinical collaborators.
        </p>
        <Link 
          to="/contact" 
          className="inline-block px-8 py-3 bg-mcmaster-gold text-mcmaster-maroon font-bold rounded-full hover:bg-white transition-colors shadow-lg"
        >
          Get in Touch
        </Link>
      </div>

    </div>
  );
};

export default Research;