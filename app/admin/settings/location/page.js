"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Globe, 
  Plus, 
  Search, 
  Trash2, 
  Edit3, 
  ChevronRight, 
  MapPin, 
  ArrowLeft,
  Loader2,
  AlertCircle
} from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LocationManagementPage() {
  const [view, setView] = useState("countries"); // countries, states, districts, cities
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  
  const [selectedCountry, setSelectedCountry] = useState(null);
  const [selectedState, setSelectedState] = useState(null);
  const [selectedDistrict, setSelectedDistrict] = useState(null);
  
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemExtra, setNewItemExtra] = useState(""); // code/flag/pincode

  useEffect(() => {
    fetchItems();
  }, [view, selectedCountry, selectedState, selectedDistrict]);

  const fetchItems = async () => {
    setLoading(true);
    let query = supabase.from(view).select("*").order("name");
    
    if (view === "states" && selectedCountry) {
      query = query.eq("country_id", selectedCountry.id);
    } else if (view === "districts" && selectedState) {
      query = query.eq("state_id", selectedState.id);
    } else if (view === "cities" && selectedDistrict) {
      query = query.eq("district_id", selectedDistrict.id);
    }
    
    const { data, error } = await query;
    if (data) setItems(data);
    setLoading(false);
  };

  const handleAddItem = async () => {
    if (!newItemName) return;
    setLoading(true);
    
    let insertData = { name: newItemName };
    if (view === "countries") {
      insertData.code = newItemExtra.toUpperCase() || newItemName.substring(0, 2).toUpperCase();
    } else if (view === "states") {
      insertData.country_id = selectedCountry.id;
    } else if (view === "districts") {
      insertData.state_id = selectedState.id;
    } else if (view === "cities") {
      insertData.district_id = selectedDistrict.id;
      insertData.pincode = newItemExtra;
    }
    
    const { error } = await supabase.from(view).insert(insertData);
    if (!error) {
      setIsAddModalOpen(false);
      setNewItemName("");
      setNewItemExtra("");
      fetchItems();
    }
    setLoading(false);
  };

  const handleDeleteItem = async (id) => {
    if (!confirm("Are you sure? This will delete all children locations as well.")) return;
    const { error } = await supabase.from(view).delete().eq("id", id);
    if (!error) fetchItems();
  };

  const breadcrumbs = () => (
    <div className="flex items-center gap-2 mb-8 bg-white p-4 rounded-2xl border border-slate-100 w-fit shadow-sm">
      <button onClick={() => { setView("countries"); setSelectedCountry(null); setSelectedState(null); setSelectedDistrict(null); }} className={`text-sm font-bold ${view === 'countries' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>Global</button>
      {selectedCountry && (
        <>
          <ChevronRight size={16} className="text-slate-300" />
          <button onClick={() => { setView("states"); setSelectedState(null); setSelectedDistrict(null); }} className={`text-sm font-bold ${view === 'states' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>{selectedCountry.name}</button>
        </>
      )}
      {selectedState && (
        <>
          <ChevronRight size={16} className="text-slate-300" />
          <button onClick={() => { setView("districts"); setSelectedDistrict(null); }} className={`text-sm font-bold ${view === 'districts' ? 'text-pink-500' : 'text-slate-400 hover:text-slate-600'}`}>{selectedState.name}</button>
        </>
      )}
      {selectedDistrict && (
        <>
          <ChevronRight size={16} className="text-slate-300" />
          <span className="text-sm font-bold text-pink-500">{selectedDistrict.name}</span>
        </>
      )}
    </div>
  );

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-slate-50/50">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <Globe className="text-pink-500" size={32} />
            Location Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">Manage global hierarchy: Countries, States, Districts, and Cities.</p>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200"
        >
          <Plus size={20} />
          Add {view.slice(0, -1)}
        </button>
      </div>

      {breadcrumbs()}

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${view}...`}
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:border-pink-500/30 transition-all font-semibold text-slate-600"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Name</th>
                {view === "countries" && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Code</th>}
                {view === "cities" && <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Pincode</th>}
                <th className="px-6 py-4 text-xs font-black text-slate-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center">
                    <Loader2 className="animate-spin text-pink-500 mx-auto" size={32} />
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-12 text-center text-slate-400 font-bold">No {view} found.</td>
                </tr>
              ) : items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())).map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <button 
                      onClick={() => {
                        if (view === "countries") { setSelectedCountry(item); setView("states"); }
                        else if (view === "states") { setSelectedState(item); setView("districts"); }
                        else if (view === "districts") { setSelectedDistrict(item); setView("cities"); }
                      }}
                      className="font-bold text-slate-700 hover:text-pink-500 flex items-center gap-2 group"
                    >
                      <MapPin size={16} className="text-slate-300 group-hover:text-pink-400" />
                      {item.name}
                    </button>
                  </td>
                  {view === "countries" && <td className="px-6 py-4 text-slate-500 font-mono font-bold uppercase">{item.code}</td>}
                  {view === "cities" && <td className="px-6 py-4 text-slate-500 font-bold">{item.pincode || "—"}</td>}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button className="p-2 text-slate-400 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDeleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden p-8">
              <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-2">
                <Plus className="text-pink-500" size={24} />
                Add New {view.slice(0, -1)}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Name</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500/30 transition-all font-bold text-slate-700"
                    placeholder={`e.g. ${view === 'countries' ? 'India' : view === 'states' ? 'Tamil Nadu' : 'Chennai'}`}
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>

                {(view === "countries" || view === "cities") && (
                  <div>
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">{view === 'countries' ? 'Country Code' : 'Pincode'}</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-pink-500/30 transition-all font-bold text-slate-700"
                      placeholder={view === 'countries' ? 'e.g. IN' : 'e.g. 641001'}
                      value={newItemExtra}
                      onChange={(e) => setNewItemExtra(e.target.value)}
                    />
                  </div>
                )}
              </div>

              <div className="flex gap-3 mt-8">
                <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-all">Cancel</button>
                <button 
                  onClick={handleAddItem}
                  disabled={loading}
                  className="flex-1 py-3 bg-pink-500 text-white font-bold rounded-xl hover:bg-pink-600 transition-all shadow-lg shadow-pink-100 flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : "Save"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
