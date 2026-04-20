import Link from "next/link";
import { Search, ChevronDown, Video, MapPin, Star, Calendar, Building2, HelpCircle } from "lucide-react";

export default function MarketplacePage() {
  return (
    <div className="bg-slate-50 dark:bg-[#111822] text-slate-900 dark:text-slate-100 min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 px-10 py-4 bg-white dark:bg-[#111822] sticky top-0 z-50">
        <div className="flex items-center gap-4 text-slate-900 dark:text-white">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#136dec] text-white">
            <span className="font-bold">M</span>
          </div>
          <h2 className="text-xl font-bold leading-tight">MentaLabs</h2>
        </div>
        <div className="flex flex-1 justify-end gap-8">
          <nav className="hidden md:flex items-center gap-9">
            <Link className="text-slate-600 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#0bda5e] text-sm font-medium transition-colors" href="/marketplace">Find Specialists</Link>
            <Link className="text-slate-600 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#0bda5e] text-sm font-medium transition-colors" href="#">Assessments</Link>
            <Link className="text-slate-600 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#0bda5e] text-sm font-medium transition-colors" href="#">Resources</Link>
            <Link className="text-slate-600 dark:text-slate-300 hover:text-[#136dec] dark:hover:text-[#0bda5e] text-sm font-medium transition-colors" href="#">For Clinicians</Link>
          </nav>
          <div className="flex gap-3">
            <button className="h-10 px-5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-[#1a2432] text-sm font-bold transition-colors">
              Sign In
            </button>
            <button className="h-10 px-5 rounded-lg bg-[#136dec] hover:bg-blue-600 text-white text-sm font-bold shadow-lg shadow-[#136dec]/20 transition-colors">
              Join as Specialist
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center w-full px-4 md:px-10 py-8 max-w-[1440px] mx-auto">
        
        {/* Search Section */}
        <div className="w-full max-w-5xl flex flex-col gap-6 mb-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-5xl font-black leading-tight tracking-tight text-slate-900 dark:text-white">Find a Specialist</h1>
            <p className="text-slate-500 dark:text-slate-400 text-lg font-normal">Connect with experts in ASD, ADHD, and BPD diagnosis and treatment.</p>
          </div>

          {/* Search Input */}
          <div className="w-full">
            <div className="flex w-full items-center rounded-xl h-14 bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 shadow-lg shadow-slate-200/50 dark:shadow-none focus-within:border-[#136dec] focus-within:ring-1 focus-within:ring-[#136dec] transition-all overflow-hidden">
              <div className="pl-5 text-slate-400">
                <Search className="h-6 w-6" />
              </div>
              <input 
                className="flex-1 bg-transparent border-none focus:outline-none text-slate-900 dark:text-white px-4 placeholder:text-slate-400 h-full" 
                placeholder="Search by name, keyword, or insurance..." 
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 items-center">
            {['Psychology', 'Psychiatry', 'Occupational Therapy'].map(filter => (
              <button key={filter} className="flex h-9 items-center gap-2 rounded-full bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 hover:border-[#136dec] transition-all px-4">
                <span className="text-sm font-medium">{filter}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            ))}
            <div className="w-px h-6 bg-slate-300 dark:bg-slate-700 mx-1"></div>
            {['Virtual', 'In-person Arequipa'].map(filter => (
              <button key={filter} className="flex h-9 items-center gap-2 rounded-full bg-white dark:bg-[#1a2432] border border-slate-200 dark:border-slate-700 hover:border-[#136dec] transition-all px-4">
                <span className="text-sm font-medium">{filter}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            ))}
            <button className="ml-auto text-[#136dec] text-sm font-semibold hover:underline flex items-center gap-1">
              More Filters
            </button>
          </div>
        </div>

        {/* Content Grid */}
        <div className="w-full grid grid-cols-1 lg:grid-cols-12 gap-8 max-w-[1400px]">
          
          {/* Left Column: Specialists */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="flex justify-between items-end">
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Showing 24 specialists</p>
              <div className="flex items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 text-sm">Sort by:</span>
                <select className="bg-transparent border-none text-slate-900 dark:text-white text-sm font-semibold focus:ring-0 cursor-pointer">
                  <option>Recommended</option>
                  <option>Price: Low to High</option>
                  <option>Rating</option>
                </select>
              </div>
            </div>

            {/* Specialist Card 1 */}
            <div className="flex flex-col md:flex-row bg-white dark:bg-[#1a2432] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-[#136dec] transition-all shadow-sm hover:shadow-md">
              <div className="md:w-48 h-48 md:h-auto shrink-0 relative bg-slate-100 dark:bg-slate-800">
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">Image</div>
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <Video className="h-3 w-3 text-[#0bda5e]" />
                  Virtual Available
                </div>
              </div>
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">Dr. Sarah Chen, PhD</h3>
                    <p className="text-[#136dec] text-sm font-medium mb-1">Clinical Psychologist</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Arequipa, Peru (In-person & Virtual)
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-sm">4.9</span>
                      <span className="text-slate-400 text-xs">(128)</span>
                    </div>
                    <p className="font-bold mt-2">$150<span className="text-slate-400 text-sm font-normal">/session</span></p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 mb-4">
                  Specializing in adult ADHD and Autism assessments. I use a neuro-affirming approach to help individuals understand their unique brain wiring.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['ADHD', 'ASD', 'CBT', 'English/Spanish'].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">{tag}</span>
                  ))}
                </div>
                <div className="mt-auto flex gap-3">
                  <button className="flex-1 bg-[#136dec] hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" /> Book Now
                  </button>
                  <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>

            {/* Specialist Card 2 */}
            <div className="flex flex-col md:flex-row bg-white dark:bg-[#1a2432] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:border-[#136dec] transition-all shadow-sm hover:shadow-md">
              <div className="md:w-48 h-48 md:h-auto shrink-0 relative bg-slate-100 dark:bg-slate-800">
                <div className="w-full h-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400">Image</div>
                <div className="absolute top-3 left-3 bg-white/90 dark:bg-black/70 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-blue-500" />
                  In-Person Only
                </div>
              </div>
              <div className="flex-1 p-5 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-xl font-bold">Dr. Marcus Rivera, MD</h3>
                    <p className="text-[#136dec] text-sm font-medium mb-1">Psychiatrist</p>
                    <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                      <MapPin className="h-4 w-4" /> Lima, Peru
                    </p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-yellow-400/10 px-2 py-1 rounded-lg">
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                      <span className="font-bold text-sm">4.7</span>
                      <span className="text-slate-400 text-xs">(84)</span>
                    </div>
                    <p className="font-bold mt-2">$200<span className="text-slate-400 text-sm font-normal">/session</span></p>
                  </div>
                </div>
                <p className="text-slate-600 dark:text-slate-300 text-sm line-clamp-2 mb-4">
                  Experienced psychiatrist focusing on medication management for BPD and severe anxiety disorders. Compassionate and patient-centered care.
                </p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {['BPD', 'Anxiety', 'Medication Mgmt'].map(tag => (
                    <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-xs font-medium">{tag}</span>
                  ))}
                </div>
                <div className="mt-auto flex gap-3">
                  <button className="flex-1 bg-[#136dec] hover:bg-blue-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors flex items-center justify-center gap-2">
                    <Calendar className="h-4 w-4" /> Book Now
                  </button>
                  <button className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 font-medium py-2.5 px-4 rounded-lg text-sm transition-colors">
                    View Profile
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Calendar Widget */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white dark:bg-[#1a2432] rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg">Availability</h3>
                <div className="flex gap-2">
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">{'<'}</button>
                  <button className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded">{'>'}</button>
                </div>
              </div>
              
              <div className="mb-4">
                <h4 className="text-sm font-bold mb-4">October 2023</h4>
                <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d} className="font-medium text-slate-400">{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-sm">
                  <div className="py-1"></div><div className="py-1"></div><div className="py-1"></div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">1</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">2</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">3</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">4</div>
                  <div className="py-1 bg-[#136dec] text-white rounded-full cursor-pointer font-bold">5</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">6</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">7</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">8</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">9</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">10</div>
                  <div className="py-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded cursor-pointer">11</div>
                </div>
              </div>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-3 uppercase tracking-wider">Available Times (Oct 5)</p>
                <div className="grid grid-cols-2 gap-2">
                  <button className="py-2 text-sm text-[#136dec] dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors">09:00 AM</button>
                  <button className="py-2 text-sm text-[#136dec] dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors">11:30 AM</button>
                  <button className="py-2 text-sm text-[#136dec] dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors">02:00 PM</button>
                  <button className="py-2 text-sm text-[#136dec] dark:text-blue-400 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 rounded-lg transition-colors">04:15 PM</button>
                </div>
              </div>
            </div>

            {/* Assessment Call to action */}
            <div className="bg-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
              <div className="absolute -right-4 -top-4 text-blue-500/20">
                <HelpCircle className="h-24 w-24" />
              </div>
              <div className="relative z-10">
                <div className="bg-[#136dec] h-10 w-10 rounded-lg flex items-center justify-center mb-4">
                  <HelpCircle className="h-6 w-6 text-white" />
                </div>
                <h4 className="font-bold text-lg mb-2">Need help choosing?</h4>
                <p className="text-slate-300 text-sm mb-4">Take our 2-minute assessment to get matched with the right specialist for your needs.</p>
                <Link href="#" className="text-[#0bda5e] hover:text-green-400 text-sm font-bold flex items-center">
                  Start Assessment &rarr;
                </Link>
              </div>
            </div>

          </div>

        </div>
      </main>
    </div>
  );
}