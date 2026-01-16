import { useState, useMemo } from 'react';
import { Search, ExternalLink, Filter, Calendar } from 'lucide-react';
import pubData from '../data/publications.json';

const Publications = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');

  const years = useMemo(() => {
    const allYears = pubData.map(p => p.year);
    return ['All', ...new Set(allYears)].sort((a, b) => b - a);
  }, []);

  const filteredPubs = pubData.filter(pub => {
    const matchesSearch = 
      pub.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pub.journal.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'All' || pub.year === parseInt(selectedYear);

    return matchesSearch && matchesYear;
  });

  const pubsByYear = filteredPubs.reduce((acc, pub) => {
    (acc[pub.year] = acc[pub.year] || []).push(pub);
    return acc;
  }, {});

  const sortedYears = Object.keys(pubsByYear).sort((a, b) => b - a);

  // Helper to format date nicely (e.g., "2025-11-14" -> "Nov 14, 2025")
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      <div className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Publications</h1>
          <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
            A complete archive of our research contributions.
          </p>
        </div>
      </div>

      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by title, author, or keyword..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mcmaster-maroon focus:border-transparent outline-none transition-all"
            />
          </div>

          <div className="relative min-w-[150px]">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <select 
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mcmaster-maroon focus:border-transparent outline-none appearance-none bg-white cursor-pointer"
            >
              {years.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {filteredPubs.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No publications found matching your criteria.</p>
            <button onClick={() => {setSearchTerm(''); setSelectedYear('All');}} className="mt-4 text-mcmaster-maroon font-bold hover:underline">
              Clear Filters
            </button>
          </div>
        )}

        {sortedYears.map(year => (
          <div key={year} className="mb-12 animate-fade-in-up">
            
            <div className="flex items-center mb-6">
              <span className="text-3xl font-bold text-gray-200 mr-4">{year}</span>
              <div className="h-px bg-gray-200 flex-grow"></div>
            </div>

            <div className="space-y-4">
              {pubsByYear[year].map((pub) => (
                <div 
                  key={pub.id} 
                  className="bg-white p-6 rounded-lg border-l-4 border-transparent hover:border-mcmaster-maroon shadow-sm hover:shadow-md transition-all duration-200 group"
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    
                    <div className="flex-grow">
                      <h3 className="text-lg font-bold text-gray-900 leading-snug mb-2 group-hover:text-mcmaster-maroon transition-colors">
                        <a href={pub.link} target="_blank" rel="noopener noreferrer">
                          {pub.title}
                        </a>
                      </h3>
                      
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                        {pub.authors}
                      </p>
                      
                      <div className="flex flex-wrap items-center gap-3 text-xs font-bold text-mcmaster-grey uppercase tracking-wide">
                        {/* Journal Badge */}
                        <span className="bg-gray-100 px-2 py-1 rounded border border-gray-200">
                          {pub.journal}
                        </span>

                        {/* Date Badge (NEW) */}
                        {pub.date && (
                          <span className="flex items-center text-gray-500">
                            <Calendar className="w-3 h-3 mr-1" />
                            {formatDate(pub.date)}
                          </span>
                        )}

                        {/* Citations */}
                        {pub.citationCount > 0 && (
                          <span className="text-gray-400">
                            • {pub.citationCount} Citations
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex md:flex-col gap-2 pt-2 md:pt-0">
                      <a 
                        href={pub.link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-mcmaster-maroon hover:text-white hover:border-transparent transition-all min-w-[100px]"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" /> 
                        {pub.link.includes('doi.org') ? 'DOI' : 'View'}
                      </a>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

      </div>
    </div>
  );
};

export default Publications;