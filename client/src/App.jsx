import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';

// Pages
import Home from './pages/Home';
import People from './pages/People';
import Alumni from './pages/Alumni'; // Ensure this file exists
import Publications from './pages/Publications';
import Contact from './pages/Contact';
import Positions from './pages/Positions';
import News from './pages/News';         // <--- NEW
import Research from './pages/Research'; // <--- NEW

import './index.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-mcmaster-grey flex flex-col">
        <Navbar />
        
        <main className="w-full flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            
            {/* Research Tab */}
            <Route path="/research" element={<Research />} />

            {/* People & Alumni Routes */}
            <Route path="/people" element={<People />} />
            <Route path="/people/alumni" element={<Alumni />} />

            <Route path="/publications" element={<Publications />} />
            
            {/* News Tab */}
            <Route path="/news" element={<News />} />

            <Route path="/positions" element={<Positions />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>

        <Footer />
      </div>
    </Router>
  );
}

export default App;