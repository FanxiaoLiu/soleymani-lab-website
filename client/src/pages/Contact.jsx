import { Mail, MapPin, Phone, Clock, ExternalLink } from 'lucide-react';

const Contact = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* =======================
          HEADER
      ======================= */}
      <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Contact Us</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Interested in joining the lab or collaborating? We’d love to hear from you.
          </p>
        </div>
      </div>

      {/* =======================
          MAIN CONTENT
      ======================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
          
          {/* --- LEFT COLUMN: Contact Info --- */}
          <div className="w-full lg:w-1/3 p-10 bg-white flex flex-col justify-between">
            
            <div>
              <h2 className="text-2xl font-bold text-mcmaster-maroon mb-8">Get in Touch</h2>
              
              <div className="space-y-8">
                {/* Address */}
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                    <MapPin className="w-5 h-5 text-mcmaster-maroon" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Lab Location</h3>
                    <p className="text-gray-600 leading-relaxed mt-1">
                      Engineering Technology Building (ETB)<br />
                      Room 428/429<br />
                      1280 Main Street West<br />
                      Hamilton, Ontario, L8S 4L8
                    </p>
                  </div>
                </div>

                {/* Email */}
                <div className="flex items-start">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 mr-4">
                    <Mail className="w-5 h-5 text-mcmaster-maroon" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">Email</h3>
                    <p className="text-gray-600 mt-1 mb-2">
                      For inquiries regarding research or positions:
                    </p>
                    <a 
                      href="mailto:soleyml@mcmaster.ca" 
                      className="text-mcmaster-maroon font-bold hover:underline"
                    >
                      soleyml@mcmaster.ca
                    </a>
                  </div>
                </div>

                
              </div>
            </div>

            {/* Department Links Footer */}
            <div className="mt-12 pt-8 border-t border-gray-100">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Affiliations</p>
              <div className="space-y-2">
                <a href="https://www.eng.mcmaster.ca/engphys/" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-mcmaster-maroon transition-colors text-sm">
                  <ExternalLink className="w-4 h-4 mr-2" /> School of Biomedical Engineering
                </a>
                <a href="https://www.eng.mcmaster.ca/msbe/" target="_blank" rel="noopener noreferrer" className="flex items-center text-gray-600 hover:text-mcmaster-maroon transition-colors text-sm">
                  <ExternalLink className="w-4 h-4 mr-2" /> Dept. of Engineering Physics
                </a>
              </div>
            </div>

          </div>

          {/* --- RIGHT COLUMN: Map --- */}
          <div className="w-full lg:w-2/3 bg-gray-200 relative h-96 lg:h-auto">
            {/* Google Maps Embed (Pointing to McMaster ETB) */}
            <iframe 
              src="https://maps.google.com/maps?width=100%25&amp;height=600&amp;hl=en&amp;q=McMaster%20University,%20Engineering%20Technology%20Bldg,%201280%20Main%20St%20W,%20Hamilton,%20ON%20L8S%204L8+(McMaster%20University)&amp;t=&amp;z=14&amp;ie=UTF8&amp;iwloc=B&amp;output=embed"
              width="100%" 
              height="100%" 
              style={{ border: 0 }} 
              allowFullScreen="" 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="McMaster Lab Location"
              className="absolute inset-0"
            ></iframe>
          </div>

        </div>
      </div>

    </div>
  );
};

export default Contact;