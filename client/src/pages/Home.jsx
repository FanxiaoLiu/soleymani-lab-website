import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- DATA IMPORTS ---
import featuredPubs from '../data/publications.json';
import newsData from '../data/news.json';
import researchAreas from '../data/research_areas.json';

// Images
import slide1 from '../assets/hero/slide1.webp';
import slide2 from '../assets/hero/slide2.webp';
import slide3 from '../assets/hero/slide3.webp';

const Home = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const FEATURED_IDS = [1, 22, 23]; 

  const selectedPubs = FEATURED_IDS.map(id => 
    featuredPubs.find(pub => pub.id === id)
  ).filter(Boolean);

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
          SECTION 1: HERO CAROUSEL 
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
        {/* Hero Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4 z-20 pb-12">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 drop-shadow-lg max-w-4xl leading-tight">
            Translational Chemistry for Biomedicine
          </h1>
          <p className="text-lg md:text-2xl text-gray-200 font-light max-w-2xl mb-10 drop-shadow-md">
            Developing new analytical technologies to combat disease and promote wellness & health
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
        {/* Arrows */}
        <button onClick={prevSlide} className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-mcmaster-gold z-30 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronLeft size={48} /></button>
        <button onClick={nextSlide} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-mcmaster-gold z-30 opacity-0 group-hover:opacity-100 transition-opacity"><ChevronRight size={48} /></button>
      </div>

      {/* ==============================================
          SECTION 2: NEWS & PUBS (Floating White Box 1)
         ============================================== */}
      <div className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12 min-h-[400px]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
            
            {/* Feat Pubs */}
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-end border-b border-gray-200 pb-4 mb-8">
                <h2 className="text-3xl font-bold text-mcmaster-maroon">Featured Publications</h2>
                <Link to="/publications" className="text-mcmaster-maroon font-bold text-sm uppercase flex items-center hover:text-mcmaster-gold transition-colors">
                  View All <ArrowRight size={16} className="ml-1" />
                </Link>
              </div>
              <div className="space-y-8 flex-grow">
                {selectedPubs.map((pub) => (
                  <div key={pub.id} className="flex flex-col sm:flex-row gap-6 items-start group cursor-pointer">
                    <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden border border-gray-200">
                      <img src={pub.image} alt="Publication Graphic" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"/>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-mcmaster-maroon mb-2 group-hover:text-mcmaster-gold transition-colors leading-snug">{pub.title}</h3>
                      <p className="text-gray-500 text-xs leading-relaxed mb-2 line-clamp-2">{pub.authors}</p>
                      <span className="inline-block bg-gray-100 text-mcmaster-grey text-[10px] font-bold px-2 py-1 rounded-full border border-gray-200">{pub.journal} ({pub.year})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* News */}
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
                        <span className="font-bold text-mcmaster-grey block mb-1 text-xs uppercase tracking-wide opacity-80">{item.date}</span>
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

      {/* ==============================================
          INTERLUDE: SPACER IMAGE (Parallax)
          This gives the next section something to float over.
         ============================================== */}
      <div 
        className="relative h-[600px] bg-fixed bg-cover bg-center flex items-center justify-center -mt-24 z-0"
        style={{ backgroundImage: `url('https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&q=80&w=2000')` }}
      >
        <div className="absolute inset-0 bg-mcmaster-maroon/80 mix-blend-multiply" />
        <div className="absolute inset-0 bg-black/40" />
        
        {/* Spacer Text */}
        <div className="relative z-10 text-center px-4 max-w-4xl pt-32">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 drop-shadow-xl">
            Innovating at the intersection of Science & Engineering
          </h2>
          <Link to="/research" className="inline-block px-8 py-3 border-2 border-white text-white font-bold uppercase tracking-wider rounded-full hover:bg-white hover:text-mcmaster-maroon transition-colors">
            Explore Our Methodology
          </Link>
        </div>
      </div>

      {/* ==============================================
          SECTION 3: RESEARCH AREAS (Floating White Box 2)
         ============================================== */}
      <div className="relative z-20 -mt-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full mb-24">
        <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 md:p-12">
          
          {/* Header */}
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-mcmaster-maroon mb-4">Research Areas</h2>
            <div className="h-1 w-24 bg-mcmaster-gold mx-auto rounded-full"></div>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mt-6">
              Our multidisciplinary approach bridges the gaps between material science, clinical needs, and engineering solutions.
            </p>
          </div>

          {/* Grid of Cards (Now inside the white box) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {researchAreas.map((area) => (
              <div 
                key={area.id} 
                // Using bg-gray-50 to contrast slightly against the white container
                className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-100 transform transition-all duration-300 hover:-translate-y-2 hover:shadow-lg flex flex-col h-full group"
              >
                
                {/* Card Image */}
                <div className="h-56 overflow-hidden relative">
                  <img 
                    src={area.image} 
                    alt={area.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-mcmaster-maroon/0 group-hover:bg-mcmaster-maroon/20 transition-colors duration-300" />
                </div>

                {/* Card Content */}
                <div className="p-8 flex flex-col flex-grow">
                  <h3 className="text-2xl font-bold text-gray-900 mb-4 group-hover:text-mcmaster-maroon transition-colors">
                    {area.title}
                  </h3>
                  
                  <p className="text-gray-600 leading-relaxed mb-6 flex-grow text-sm">
                    {area.description_brief}
                  </p>

                  <div className="pt-4 border-t border-gray-200">
                    <Link 
                      to={area.link} 
                      className="inline-flex items-center text-sm font-bold text-mcmaster-maroon uppercase tracking-wider hover:text-mcmaster-gold transition-colors"
                    >
                      Learn More <ArrowRight size={16} className="ml-2" />
                    </Link>
                  </div>
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

    </div>
  );
};

export default Home;