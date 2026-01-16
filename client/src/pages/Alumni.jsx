import { Briefcase, GraduationCap, Building2 } from 'lucide-react';
import alumniData from '../data/alumni.json';

const Alumni = () => {
  // Define the order of groups
  const groupOrder = [
    "PhD Graduates",
    "Masters Graduates",
    "Undergraduate Alumni",
    "Former Staff"
  ];

  const getAlumniByGroup = (groupName) => 
    alumniData.filter(person => person.group === groupName);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* Header */}
      <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">Alumni</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
            Our lab has a strong track record of training the next generation of leaders in academia, industry, and medicine.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16">
        
        {groupOrder.map((group) => {
          const members = getAlumniByGroup(group);
          if (members.length === 0) return null;

          return (
            <div key={group} className="mb-16">
              
              {/* Group Title */}
              <div className="flex items-center mb-8">
                <h2 className="text-2xl font-bold text-mcmaster-maroon mr-4">{group}</h2>
                <div className="h-px bg-gray-200 flex-grow"></div>
              </div>

              {/* Grid of Alumni Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {members.map((alum) => (
                  <div 
                    key={alum.id} 
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden border-l-4 border-mcmaster-maroon p-6"
                  >
                    
                    {/* Name & Former Role */}
                    <div className="mb-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-1">{alum.name}</h3>
                      <div className="flex items-center text-sm text-gray-500 font-medium uppercase tracking-wide">
                        <GraduationCap className="w-4 h-4 mr-2 text-mcmaster-gold" />
                        {alum.former_role}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="h-px w-full bg-gray-100 mb-6"></div>

                    {/* Current Position */}
                    <div className="space-y-3">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Position</p>
                      
                      <div className="flex items-start">
                        <Briefcase className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-700 font-semibold">{alum.current_position}</span>
                      </div>
                      
                      <div className="flex items-start">
                        <Building2 className="w-4 h-4 mr-3 mt-1 text-gray-400 flex-shrink-0" />
                        <span className="text-gray-600">{alum.current_org}</span>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
};

export default Alumni;