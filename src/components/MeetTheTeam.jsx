import { Link } from 'react-router-dom';
import { SiteIcon } from './Icons.jsx';

const GUIDES = [
  {
    name: 'Joshua Ryan Ainembabazi',
    role: 'Co-Founder & Lead Expedition Planner',
    experience: '8+ Years in African Wilderness',
    languages: 'English, Swahili',
    bio: 'Passionate wildlife conservationist and logistics architect. Joshua designs custom routes ensuring travelers maximize wildlife hours and avoid mass-tourism bottlenecks.',
    specialty: 'Migration Corridors & Private Custom Safaris',
  },
  {
    name: 'Lowasa Gibson',
    role: 'Co-Founder & Head Safari Guide',
    experience: '12+ Years in Northern Circuit',
    languages: 'English, Swahili, Maa',
    bio: 'Born in Arusha with Maasai roots, Gibson reads tracks and savanna scent like an open book. Known for spotting leopards resting in high acacia canopies from hundreds of meters away.',
    specialty: 'Predator Tracking & Cultural Immersion',
  },
  {
    name: 'Lekule Gibson',
    role: 'Head of Bush Operations',
    experience: '15+ Years across Tanzania & Kenya',
    languages: 'English, Swahili',
    bio: 'Lekule turns careful planning into calm, expertly delivered days in the field, drawing on deep experience across Tanzania and Kenya.',
    specialty: 'Bush Logistics & Safari Operations',
  },
];

const FLEET_FEATURES = [
  { icon: 'seat', title: 'Guaranteed Window Seat', desc: 'Max 6 guests per vehicle. No one gets squeezed in a middle seat.' },
  { icon: 'roof', title: 'Full Pop-Up Roof', desc: 'Complete 360-degree unobstructed height for wildlife photography.' },
  { icon: 'bolt', title: '220V & USB Charging', desc: 'Charge DSLR batteries, cameras, and phones while on game drives.' },
  { icon: 'fridge', title: 'Onboard Electric Fridge', desc: 'Cold mineral water, sodas, and safari snacks always chilled.' },
  { icon: 'radio', title: 'Long-Range Bush Radio', desc: 'Direct communications with rangers & guides for real-time sightings.' },
  { icon: 'binoculars', title: 'Nikon Binoculars Provided', desc: 'High-powered optics onboard for distant predator & bird spotting.' },
];

export default function MeetTheTeam() {
  return (
    <div className="py-16 sm:py-20 bg-cream-100/50">
      <div className="container-x">
        {/* Guides Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="eyebrow">Local Tanzanian Expertise</span>
          <h2 className="section-title mt-2">Meet Your Safari Guides</h2>
          <p className="mt-3 text-teal-700/80 text-sm sm:text-base">
            A great safari isn't just about where you go—it’s who is behind the wheel. Our guides are born-and-raised Tanzanians with deep local knowledge and decades of bush experience.
          </p>
        </div>

        {/* Guides Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {GUIDES.map((guide) => (
            <div
              key={guide.name}
              className="bg-cream-50 border border-savanna-200/80 rounded-2xl overflow-hidden shadow-card hover:shadow-cardHover transition-all duration-300 flex flex-col"
            >
              <div className="p-6 flex-1 flex flex-col justify-between">
                <div>
                  <div className="inline-flex bg-teal-900 text-cream-50 text-[11px] font-semibold px-3 py-1 rounded-full">
                  {guide.experience}
                  </div>
                  <h3 className="font-display text-xl font-bold text-teal-900">{guide.name}</h3>
                  <div className="text-xs font-semibold text-terracotta-500 mt-0.5">{guide.role}</div>
                  <div className="text-[11px] text-teal-600 mt-1 flex items-center gap-1"><SiteIcon name="speech" /> {guide.languages}</div>
                  <p className="mt-3 text-xs sm:text-sm text-teal-700/85 leading-relaxed">
                    {guide.bio}
                  </p>
                </div>
                <div className="mt-4 pt-3 border-t border-savanna-100 text-[11px] font-semibold text-teal-800">
                  <span className="text-terracotta-500">Specialty:</span> {guide.specialty}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 4x4 Fleet Showcase */}
        <div className="bg-teal-900 text-cream-50 rounded-3xl p-8 sm:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-terracotta-500/10 blur-3xl pointer-events-none" />
          <div className="grid lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-6">
              <span className="eyebrow text-terracotta-300">Custom Built for the Savanna</span>
              <h3 className="font-display text-3xl sm:text-4xl font-bold mt-2 text-cream-50">
                Our Custom 4x4 Safari Land Cruisers
              </h3>
              <p className="mt-4 text-cream-100/85 text-sm sm:text-base leading-relaxed">
                We never outsource our vehicles. Every Jebri Safaris journey travels in modified, heavy-duty Toyota Land Cruisers engineered with heavy-duty coil suspension, oversized windows, and high-clearance 4WD systems to navigate muddy riverbanks and rugged caldera terrain comfortably.
              </p>

              <div className="grid sm:grid-cols-2 gap-4 mt-6 text-xs sm:text-sm">
                {FLEET_FEATURES.map((f) => (
                  <div key={f.title} className="flex items-start gap-2.5">
                    <SiteIcon name={f.icon} className="text-xl text-terracotta-300 mt-0.5" />
                    <div>
                      <div className="font-bold text-cream-50">{f.title}</div>
                      <div className="text-cream-100/70 text-[11px] leading-snug">{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex flex-wrap gap-4 items-center">
                <Link to="/booking" className="btn-primary bg-terracotta-500 hover:bg-terracotta-600 border border-terracotta-400 text-xs sm:text-sm">
                  Plan Safari in Our 4x4 Land Cruiser <SiteIcon name="arrow-right" />
                </Link>
                <span className="text-xs text-cream-100/70">
                  Strictly 6 travelers max per vehicle
                </span>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <img
                  src="/assets/uploads/jeep.jpeg"
                  alt="Safari cruiser used for game drives"
                  className="w-full h-80 sm:h-96 object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-linen text-teal-900 px-4 py-2.5 rounded-xl shadow-card border border-savanna-200 text-xs font-bold flex items-center gap-2">
                <SiteIcon name="shield-check" className="text-terracotta-500 text-base" />
                <span>Locally operated safari team</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
