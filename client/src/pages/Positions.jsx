import { Mail, FileText, GraduationCap, ArrowRight } from 'lucide-react';

const Positions = () => {
  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* =======================
          HEADER
      ======================= */}
      <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8 shadow-lg">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Join Our Team</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            We are always looking for passionate researchers to join us.
          </p>
        </div>
      </div>

      {/* =======================
          MAIN CONTENT
      ======================= */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
        
        {/* Status Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-12">
          <div className="bg-mcmaster-maroon/5 border-b border-mcmaster-maroon/10 p-6 md:p-8 text-center">
            <span className="inline-block bg-gray-100 text-gray-600 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-3">
              Current Status
            </span>
            <h2 className="text-2xl font-bold text-gray-900">No Specific Openings at This Time</h2>
            <p className="text-gray-600 mt-2 max-w-2xl mx-auto">
              While we don't have any active job postings right now, our lab is dynamic and new opportunities can arise quickly.
            </p>
          </div>

          <div className="p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              
              {/* Left: General Application Info */}
              <div>
                <h3 className="text-xl font-bold text-mcmaster-maroon mb-4 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2" />
                  Prospective Students
                </h3>
                <p className="text-gray-600 leading-relaxed mb-6">
                  We welcome inquiries from highly motivated undergraduate and graduate students interested in biosensing, materials science, and diagnostic technologies.
                </p>
                <p className="text-gray-600 leading-relaxed">
                  If you have a strong background in <b>Engineering Physics, Biomedical Engineering, Chemistry</b>, or related fields, we encourage you to reach out.
                </p>
              </div>

              {/* Right: How to Apply */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <FileText className="w-5 h-5 mr-2 text-gray-500" />
                  How to Express Interest
                </h3>
                <ul className="space-y-4 text-sm text-gray-600 mb-6">
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-mcmaster-gold rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Prepare your CV / Resume
                  </li>
                  <li className="flex items-start">
                    <span className="w-1.5 h-1.5 bg-mcmaster-gold rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    Include a brief cover letter or statement of research interests
                  </li>
                </ul>
                
                <a
                  href="mailto:soleymanipositions@gmail.com"
                  className="block w-full text-center bg-mcmaster-maroon text-white font-bold py-3 rounded-lg hover:bg-red-900 transition-colors shadow-md uppercase tracking-wide text-xs"
                >
                  Email the Lab About Positions
                </a>
                <p className="text-xs text-gray-500 mt-3 text-center">
                  soleymanipositions@gmail.com
                </p>
              </div>

            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default Positions;