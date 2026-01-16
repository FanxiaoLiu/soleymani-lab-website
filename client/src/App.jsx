import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
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
        <main className="max-w-7xl mx-auto py-8 px-4">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/people" element={<People />} />
            <Route path="/alumni" element={<Alumni />} />
            <Route path="/publications" element={<Publications />} />
            <Route path="/positions" element={<Positions />} />
            <Route path="/contact" element={<Contact />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;