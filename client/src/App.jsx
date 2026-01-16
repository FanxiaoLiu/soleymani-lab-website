import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import './index.css';

// Import Pages
import Home from './pages/Home';
import People from './pages/People';
import Alumni from './pages/Alumni';
import Publications from './pages/Publications';
import Positions from './pages/Positions';
import Contact from './pages/Contact';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50 font-sans text-mcmaster-grey">
        <Navbar />
        
        {/* UPDATED: Removed 'max-w-7xl', 'py-8', and 'px-4' */}
        {/* Now it allows pages to decide their own width */}
        <main className="w-full">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/people" element={<People />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/publications" element={<Publications />} />
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