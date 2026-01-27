import { Mail, ArrowRight, Calendar, FlaskConical, Linkedin } from 'lucide-react';
import { Link } from 'react-router-dom';
import teamData from '../data/team.json';

const People = () => {
  // 1. Extract the PI (Dr. Soleymani) separately
  const pi = teamData.find(person => person.group === 'PI');

  // 2. Define the order you want the groups to appear
  const groupOrder = [
    "Post-Doctoral Fellows",
    "Research Staff",
    "PhD Candidates",
    "Master's Candidates",
    "Undergraduate Students"
  ];

  // 3. Helper to get members for a specific group
  const getMembersByGroup = (groupName) => 
    teamData.filter(person => person.group === groupName);

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      
      {/* =======================
          SECTION 1: THE PI
      ======================= */}
      <div className="bg-gray-900 text-white py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-12">
          
          {/* PI Image with Gold Border */}
          <div className="w-64 h-64 md:w-80 md:h-80 flex-shrink-0 relative">
            <div className="absolute inset-0 border-4 border-mcmaster-gold rounded-full transform rotate-6 translate-x-2 translate-y-2"></div>
            <img 
              src={pi?.image} 
              alt={pi?.name} 
              className="w-full h-full object-cover rounded-full border-4 border-white shadow-2xl relative z-10"
            />
          </div>

          {/* PI Details */}
          <div className="text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold mb-2">{pi?.name}</h1>
            <p className="text-mcmaster-gold font-medium text-lg mb-6">{pi?.degrees}</p>
            
            <div className="space-y-2 text-gray-300 text-lg leading-relaxed">
              {pi?.titles.map((title, index) => (
                <p key={index}>{title}</p>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4 justify-center md:justify-start">
              <a 
                href={`mailto:${pi?.email}`} 
                className="inline-flex items-center px-6 py-3 border border-white rounded-full hover:bg-white hover:text-mcmaster-maroon transition-colors font-bold uppercase tracking-wide text-sm"
              >
                <Mail className="mr-2 w-4 h-4" /> Email
              </a>
              
              {/* PI LinkedIn (Only shows if added to JSON) */}
              {pi?.linkedin && (
                <a 
                  href={pi.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-mcmaster-gold text-mcmaster-maroon border border-mcmaster-gold rounded-full hover:bg-white hover:border-white transition-colors font-bold uppercase tracking-wide text-sm"
                >
                  <Linkedin className="mr-2 w-4 h-4" /> LinkedIn
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =======================
          SECTION 2: THE TEAM
      ======================= */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-16 relative z-10">
        
        {groupOrder.map((group) => {
          const members = getMembersByGroup(group);
          if (members.length === 0) return null;

          return (
            <div key={group} className="mb-16">
              
              {/* Group Title with Divider */}
              <div className="flex items-center mb-8">
                <h2 className="text-3xl font-bold text-mcmaster-maroon mr-6">{group}</h2>
                <div className="h-px bg-gray-200 flex-grow"></div>
              </div>

              {/* Grid of Members */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                {members.map((member) => (
                  <div key={member.id} className="group relative bg-white rounded-xl shadow-lg overflow-hidden h-96 w-full cursor-pointer">
                    
                    {/* --- IMAGE --- */}
                    <img 
                      src={member.image} 
                      alt={member.name} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />

                    {/* --- NAME TAG (Visible by default) --- */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 pt-20 transition-all duration-300 group-hover:opacity-0">
                      <h3 className="text-white text-xl font-bold">{member.name}</h3>
                      <p className="text-mcmaster-gold text-sm font-medium uppercase tracking-wider">{member.role}</p>
                    </div>

                    {/* --- HOVER OVERLAY --- */}
                    <div className="absolute inset-0 bg-mcmaster-maroon/95 p-6 flex flex-col justify-center items-center text-center opacity-0 translate-y-10 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
                      
                      <h3 className="text-white text-2xl font-bold mb-1">{member.name}</h3>
                      <p className="text-mcmaster-gold text-sm font-bold uppercase tracking-wider mb-6">{member.role}</p>

                      <div className="space-y-4 w-full text-left pl-4 border-l-2 border-white/20">
                        <div className="flex items-center text-gray-200">
                          <Calendar className="w-4 h-4 mr-3 flex-shrink-0 text-mcmaster-gold" />
                          <span className="text-sm">Joined {member.joined}</span>
                        </div>

                        <div className="flex items-start text-gray-200">
                          <FlaskConical className="w-4 h-4 mr-3 mt-1 flex-shrink-0 text-mcmaster-gold" />
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-white">Focus Area:</span>
                            <span className="text-sm opacity-90">{member.research_focus}</span>
                          </div>
                        </div>

                        {/* --- NEW: Contact Icons Row --- */}
                        <div className="flex items-center gap-4 pt-2">
                          {member.email && (
                            <a 
                              href={`mailto:${member.email}`} 
                              className="text-white hover:text-mcmaster-gold transition-colors"
                              title="Email"
                            >
                              <Mail className="w-5 h-5" />
                            </a>
                          )}
                          {member.linkedin && (
                            <a 
                              href={member.linkedin} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-white hover:text-mcmaster-gold transition-colors"
                              title="LinkedIn"
                            >
                              <Linkedin className="w-5 h-5" />
                            </a>
                          )}
                        </div>
                      </div>

                      <Link 
                        to={member.research_link} 
                        className="mt-8 inline-flex items-center text-sm font-bold text-white hover:text-mcmaster-gold transition-colors"
                      >
                        View Research <ArrowRight className="ml-2 w-4 h-4" />
                      </Link>

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

export default People;