import { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Tag, ArrowRight, ExternalLink } from 'lucide-react';
import newsData from '../data/news.json';

const News = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // --- 1. PREPARE FILTER OPTIONS ---
  const years = useMemo(() => {
    const allYears = newsData.map(item => item.date.split('-')[0]);
    return ['All', ...new Set(allYears)].sort((a, b) => b - a);
  }, []);

  const categories = useMemo(() => {
    const allCats = newsData.map(item => item.category);
    return ['All', ...new Set(allCats)].sort();
  }, []);

  // --- 2. FILTER LOGIC ---
  const filteredNews = newsData.filter(item => {
    const itemYear = item.date.split('-')[0];
    
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = selectedYear === 'All' || itemYear === selectedYear;
    const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;

    return matchesSearch && matchesYear && matchesCategory;
  });

  // Sort by Date Descending
  filteredNews.sort((a, b) => new Date(b.date) - new Date(a.date));

  // --- 3. HELPER: FORMAT DATE ---
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  // --- 4. HELPER: BADGE COLORS ---
  const getCategoryColor = (cat) => {
    switch (cat) {
      case 'Award': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Grant': return 'bg-green-100 text-green-800 border-green-200';
      case 'Publication': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Talk': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* HEADER */}
      <div className="bg-gray-900 text-white py-16 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">News & Updates</h1>
          <p className="text-xl text-gray-300 max-w-2xl leading-relaxed">
            The latest announcements, awards, and breakthroughs from the Soleymani Lab.
          </p>
        </div>
      </div>

      {/* CONTROLS BAR */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-4">
          
          {/* Search */}
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search news..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mcmaster-maroon focus:border-transparent outline-none transition-all"
            />
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            {/* Year Select */}
            <div className="relative min-w-[120px]">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mcmaster-maroon outline-none bg-white cursor-pointer"
              >
                {years.map(year => <option key={year} value={year}>{year}</option>)}
              </select>
            </div>

            {/* Category Select */}
            <div className="relative min-w-[140px]">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-mcmaster-maroon outline-none bg-white cursor-pointer"
              >
                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>
          </div>

        </div>
      </div>

      {/* MAIN GRID */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
        
        {filteredNews.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <p className="text-xl">No news found matching your criteria.</p>
            <button onClick={() => {setSearchTerm(''); setSelectedYear('All'); setSelectedCategory('All');}} className="mt-4 text-mcmaster-maroon font-bold hover:underline">
              Clear Filters
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredNews.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col border border-gray-100 group hover:-translate-y-1"
            >
              
              {/* Optional Image */}
              {item.image && (
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={item.image} 
                    alt={item.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-mcmaster-maroon/0 group-hover:bg-mcmaster-maroon/10 transition-colors"></div>
                </div>
              )}

              {/* Content */}
              <div className="p-6 flex flex-col flex-grow">
                
                {/* Meta Row */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded-full uppercase tracking-wide border ${getCategoryColor(item.category)}`}>
                    {item.category}
                  </span>
                  <span className="text-xs text-gray-400 font-medium">
                    {formatDate(item.date)}
                  </span>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-mcmaster-maroon transition-colors">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 leading-relaxed text-sm mb-6 flex-grow">
                  {item.content}
                </p>

                {/* Link (Only if provided) */}
                {item.link && (
                  <div className="pt-4 border-t border-gray-100">
                    <a 
                      href={item.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-bold text-mcmaster-maroon uppercase tracking-wider hover:text-mcmaster-gold transition-colors"
                    >
                      Read More <ExternalLink size={14} className="ml-2" />
                    </a>
                  </div>
                )}

              </div>

            </div>
          ))}
        </div>

      </div>
    </div>
  );
};

export default News;