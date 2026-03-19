import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import BrandMarquee from "@/components/BrandMarquee";
import Steps from "@/components/Steps";
import EventsSection from "@/components/EventsSection";
import ScrollToTop from "@/components/ScrollToTop";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Hero />
        <BrandMarquee />
        <Steps />
        <EventsSection />
        
        {/* Additional CTA Section */}
        <section className="py-20 bg-brand-indigo overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
             <div className="absolute top-[10%] left-[10%] w-64 h-64 border-4 border-white rounded-full translate-x-1/2 translate-y-1/2" />
             <div className="absolute bottom-[20%] right-[15%] w-96 h-96 border-4 border-white rounded-full" />
          </div>
          
          <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
            <h2 className="text-3xl md:text-5xl font-extrabold text-white mb-8">
              Ready to elevate your ticketing brand?
            </h2>
            <p className="text-xl text-white/80 mb-10 leading-relaxed">
              Join thousands of organisers who trust BookMyTicket for their 
              branding and ticketing needs. Start your free trial today.
            </p>
            <button className="bg-white text-brand-indigo hover:bg-gray-100 font-bold py-4 px-10 rounded-full text-lg shadow-xl hover:shadow-white/20 transition-all">
              Create My Account
            </button>
          </div>
        </section>
      </main>

      <footer className="bg-white dark:bg-black py-12 border-t border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-brand-blue to-brand-pink flex items-center justify-center text-white text-[10px] font-bold">
                B
              </div>
              <span className="font-bold text-lg text-text-primary">
                BookMyTicket
              </span>
            </div>
            
            <div className="flex gap-8 text-sm text-text-secondary">
              <a href="#" className="hover:text-brand-pink transition-colors">Privacy</a>
              <a href="#" className="hover:text-brand-pink transition-colors">Terms</a>
              <a href="#" className="hover:text-brand-pink transition-colors">Contact</a>
            </div>
            
            <p className="text-xs text-text-secondary/60">
              © {new Date().getFullYear()} BookMyTicket. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
