import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- DATA IMPORTS ---
import featuredPubs from '../data/publications.json';
import newsData from '../data/news.json';

// Images
import slide1 from '../assets/hero/slide1.webp';
import slide2 from '../assets/hero/slide2.webp';
import slide3 from '../assets/hero/slide3.webp';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  // --- CONFIGURATION: SELECT YOUR PAPERS HERE ---
  // List the IDs of the papers you want to show, in the order you want them.
  // IDs change when you run the update script (Newest = 1).
  const FEATURED_IDS = [1, 2, 3]; 

  // LOGIC: Filter and Sort papers based on your list
  const selectedPubs = FEATURED_IDS.map(id => 
    featuredPubs.find(pub => pub.id === id)
  ).filter(Boolean); // Removes undefined items if an ID doesn't exist

  const slides = [
    { id: 1, image: slide1, alt: "Lab Members working" },
    { id: 2, image: slide2, alt: "Device closeup" },
    { id: 3, image: slide3, alt: "Group Photo" },
  ];

  // --- CAROUSEL LOGIC ---
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => setCurrentSlide((prev) => (prev === slides.length - 1 ? 0 : prev + 1));
  const prevSlide = () => setCurrentSlide((prev) => (prev === 0 ? slides.length - 1 : prev - 1));

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      
      {/* =======================
          SECTION 1: CAROUSEL 
         ======================= */}
      <div className="relative w-full h-[70vh] min-h-[500px] overflow-hidden bg-gray-900 group pb-24">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out
              ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'}
            `}
          >
            <img 
              src={slide.image} 
              alt={slide.alt} 
              loading={index === 0 ? "eager" : "lazy"}
              className="w-full h-full object-cover" 
            />
            <div className="absolute inset-0 bg-gray-900/60" />
          </div>
        ))}

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 pb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg max-w-4xl leading-tight">
            Electrochemical Biosensing
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 font-light max-w-2xl mb-10 drop-shadow-md">
            Engineering Biosensors and Bio-Interfaces to Improve Health and Combat Disease
          </p>
          <div className="flex space-x-4">
            <Link to="/contact" className="px-8 py-3 bg-mcmaster-maroon text-white font-bold uppercase tracking-wider rounded-full hover:bg-red-900 transition-colors shadow-lg border-2 border-transparent">
              About Us
            </Link>
            <Link to="/research" className="px-8 py-3 bg-transparent border-2 border-white text-white font-bold uppercase tracking-wider rounded-full hover:bg-white hover:text-mcmaster-maroon transition-colors shadow-lg">
              Our Research
            </Link>
          </div>
        </div>

        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-mcmaster-gold z-30 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={48} /></button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-mcmaster-gold z-30 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={48} /></button>
      </div>

      {/* ==============================================
          SECTION 2: DYNAMIC CONTENT
         ============================================== */}
      
      <div className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        {/* Added 'pb-16' to allow the container to stretch if you add more papers */}
        <div className="bg-white rounded-t-[2.5rem] shadow-2xl p-8 md:p-12 min-h-[400px]">
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* --- COLUMN 1: Featured Publications (Custom Selection) --- */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
                <h2 className="text-3xl font-bold text-mcmaster-maroon">Featured Publications</h2>
                <Link to="/publications" className="text-mcmaster-maroon font-bold text-sm uppercase flex items-center hover:text-mcmaster-gold transition-colors">
                  View All <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              {/* MAPPED from your custom 'selectedPubs' list */}
              <div className="space-y-8 flex-grow">
                {selectedPubs.map((pub) => (
                  <div key={pub.id} className="flex flex-col sm:flex-row gap-6 items-start group cursor-pointer">
                    <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                      <img 
                        src={pub.image} 
                        alt="Publication Graphic" 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-mcmaster-maroon mb-2 group-hover:text-mcmaster-gold transition-colors leading-snug">
                        {pub.title}
                      </h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-2 line-clamp-2">
                        {pub.authors}
                      </p>
                      <span className="inline-block bg-gray-100 text-mcmaster-grey text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">
                        {pub.journal} ({pub.year})
                      </span>
                    </div>
                  </div>
                ))}
                
                {/* Fallback if list is empty */}
                {selectedPubs.length === 0 && (
                  <p className="text-gray-400 italic">No publications selected. Update FEATURED_IDS in Home.jsx</p>
                )}
              </div>
            </div>

            {/* --- COLUMN 2: News & Press (Top 6 Only) --- */}
            <div>
              <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
                <h2 className="text-3xl font-bold text-mcmaster-maroon">News & Press</h2>
                <Link to="/news" className="text-mcmaster-maroon font-bold text-sm uppercase flex items-center hover:text-mcmaster-gold transition-colors">
                  Archive <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>

              <ul className="space-y-6">
                {newsData.slice(0, 6).map((item) => (
                  <li key={item.id} className="flex gap-4 items-start group">
                    <span className="mt-2 w-2 h-2 bg-mcmaster-maroon rounded-full flex-shrink-0 group-hover:bg-mcmaster-gold transition-colors" />
                    <div>
                      <p className="text-gray-800 text-base leading-relaxed">
                        <span className="font-bold text-mcmaster-grey block mb-1 text-xs uppercase tracking-wide opacity-80">
                          {item.date}
                        </span>
                        {item.content}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
      
      {/* Footer Spacer */}
      <div className="h-24 bg-gray-50"></div>

    </div>
  );
};

export default Home;