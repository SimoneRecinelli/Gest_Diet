"use client";

import React, { useState, useEffect } from 'react';

// Funzione helper per assegnare l'icona in base al nome o alla categoria del cibo
const getFoodIcon = (category: string, name: string) => {
  const lowerName = name.toLowerCase();
  
  if (lowerName.includes('banana') || lowerName.includes('banane')) return '🍌';
  if (lowerName.includes('fragola') || lowerName.includes('fragole')) return '🍓';
  if (lowerName.includes('mela')) return '🍎';
  if (lowerName.includes('ananas')) return '🍍';
  if (lowerName.includes('uva')) return '🍇';

  if (lowerName.includes('latte')) return '🥛';
  if (lowerName.includes('yogurt') || lowerName.includes('fruyo')) return '🍧'; 
  if (lowerName.includes('muesli') || lowerName.includes('cereali') || lowerName.includes('avena')) return '🥣';
  if (lowerName.includes('pasta') || lowerName.includes('tortellini') || lowerName.includes('gnocchi')) return '🍝';
  if (lowerName.includes('verdure') || lowerName.includes('carote') || lowerName.includes('zucchine')) return '🥬';
  if (lowerName.includes('parmigiano') || lowerName.includes('grana') || lowerName.includes('pecorino') || lowerName.includes('mozzarella') || lowerName.includes('sottilette')) return '🧀';
  if (lowerName.includes('pollo') || lowerName.includes('tacchino')) return '🍗';
  if (lowerName.includes('vitellone') || lowerName.includes('maiale') || lowerName.includes('bresaola')) return '🥩';
  if (lowerName.includes('pesce') || lowerName.includes('rospo') || lowerName.includes('salmone') || lowerName.includes('tonno') || lowerName.includes('polpo')) return '🐟';
  if (lowerName.includes('uova')) return '🥚';
  if (lowerName.includes('olio')) return '🫒';
  if (lowerName.includes('nutella')) return '🍫';
  if (lowerName.includes('cornetto')) return '🥐';
  if (lowerName.includes('pane')) return '🍞';
  if (lowerName.includes('sugo') || lowerName.includes('salsa') || lowerName.includes('ketchup')) return '🍅';
  if (lowerName.includes('fagioli') || lowerName.includes('lenticchie')) return '🫘';

  if (category === 'Frutta') return '🍎';
  if (category === 'Carboidrati') return '🌾';
  if (category === 'Proteine') return '🥩';
  if (category === 'Verdure') return '🥗';
  
  return '🍽️'; 
};

export default function Dashboard() {
  const [selectedDay, setSelectedDay] = useState(1);
  const [diet, setDiet] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  
  // Stato per gestire l'apertura/chiusura delle alternative
  const [expandedItems, setExpandedItems] = useState<Record<number, boolean>>({});

  const days = [
    { id: 1, name: 'Lunedì', short: 'Lun' },
    { id: 2, name: 'Martedì', short: 'Mar' },
    { id: 3, name: 'Mercoledì', short: 'Mer' },
    { id: 4, name: 'Giovedì', short: 'Gio' },
    { id: 5, name: 'Venerdì', short: 'Ven' },
    { id: 6, name: 'Sabato', short: 'Sab' },
    { id: 7, name: 'Domenica', short: 'Dom' },
  ];

  useEffect(() => {
    const fetchDiet = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/diet?day=${selectedDay}`);
        const data = await res.json();
        
        const grouped = data.reduce((acc: any, curr: any) => {
          if (!acc[curr.meal_name]) acc[curr.meal_name] = [];
          acc[curr.meal_name].push(curr);
          return acc;
        }, {});
        
        setDiet(grouped);
        // Resetta le tendine aperte quando si cambia giorno
        setExpandedItems({});
      } catch (error) {
        console.error("Errore nel caricamento della dieta", error);
      }
      setLoading(false);
    };

    fetchDiet();
  }, [selectedDay]);

  // Funzione per alternare la visibilità delle alternative
  const toggleAlternatives = (itemId: number) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      
      {/* Top Navbar */}
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-10 shadow-sm">
        <div className="max-w-3xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">DietOS</h1>
            <p className="text-xs font-semibold text-teal-600 uppercase tracking-wider mt-1">Piano Nutrizionale</p>
          </div>
          <div className="flex gap-3">
            <a href="/spesa" className="h-10 w-10 bg-white border border-slate-200 text-slate-700 rounded-full flex items-center justify-center hover:bg-teal-50 hover:text-teal-600 hover:border-teal-200 shadow-sm transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
            </a>
            <div className="h-10 w-10 bg-teal-500 text-white rounded-full flex items-center justify-center font-bold shadow-md ring-2 ring-white">
              SR
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 mt-8 space-y-8">
        
        {/* Selettore Giorni a larghezza intera */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h2 className="text-lg font-bold text-slate-800">Seleziona Giorno</h2>
          </div>
          {/* Utilizziamo flex-1 per far occupare a ogni bottone la stessa porzione dello spazio totale */}
          <div className="flex w-full gap-1.5 sm:gap-2 md:gap-3 pb-2">
            {days.map((day) => (
              <button
                key={day.id}
                onClick={() => setSelectedDay(day.id)}
                className={`flex-1 flex flex-col items-center justify-center h-[72px] sm:h-20 rounded-xl sm:rounded-2xl border transition-all shadow-sm ${
                  selectedDay === day.id
                    ? 'bg-teal-500 border-teal-500 text-white scale-[1.02] shadow-teal-500/30'
                    : 'bg-white border-slate-200 text-slate-500 hover:border-teal-300 hover:bg-teal-50 hover:text-teal-700'
                }`}
              >
                <span className="text-[10px] sm:text-xs font-medium mb-0.5 sm:mb-1">{day.short}</span>
                <span className={`text-lg sm:text-xl font-bold ${selectedDay === day.id ? 'text-white' : 'text-slate-800'}`}>
                  {day.id}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Timeline dei Pasti Dinamica */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-white flex justify-between items-center">
            <h2 className="text-xl font-extrabold text-slate-800">
              Pasti di {days.find(d => d.id === selectedDay)?.name}
            </h2>
          </div>
          
          <div className="p-5 md:p-6 space-y-10">
            
            {loading ? (
              <div className="animate-pulse flex flex-col gap-6">
                <div className="h-20 bg-slate-100 rounded-xl w-full"></div>
                <div className="h-32 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ) : (
              Object.entries(diet).map(([mealName, items], index) => (
                <div key={mealName} className="relative pl-6 border-l-[3px] border-slate-100">
                  <div className="absolute -left-[11px] top-0.5 w-5 h-5 rounded-full bg-white border-4 border-teal-400 shadow-sm"></div>
                  
                  <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-900 tracking-tight">{mealName}</h3>
                  </div>
                  
                  <div className="space-y-3">
                    {items.map((item, idx) => (
                      <React.Fragment key={item.item_id}>
                        
                        {item.is_cheat_meal ? (
                          <div className="bg-gradient-to-r from-teal-50 to-white border border-teal-100 rounded-2xl p-4 text-center shadow-sm">
                            <span className="text-3xl block mb-2">🍕</span>
                            <span className="font-extrabold text-teal-700 block text-lg">{item.food_name}</span>
                            <span className="text-xs font-semibold text-teal-500 uppercase tracking-wider">Goditi il pasto libero!</span>
                          </div>
                        ) : (
                          <div className="bg-slate-50 border border-slate-100 hover:border-teal-100 transition-colors rounded-2xl p-4 shadow-sm flex flex-col gap-3">
                            
                            {/* Alimento Principale */}
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="text-2xl drop-shadow-sm">{getFoodIcon(item.food_category, item.food_name)}</span>
                                <span className="text-base font-bold text-slate-800">{item.food_name}</span>
                              </div>
                              <span className="text-sm font-black text-slate-900 bg-white px-2 py-1 rounded-lg border border-slate-200 shadow-sm">
                                {item.quantity_numeric}{item.quantity_unit}
                              </span>
                            </div>
                            
                            {/* Box Alternative a Scomparsa */}
                            {item.alternatives && item.alternatives.length > 0 && (
                              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm mt-1 transition-all">
                                <button 
                                  onClick={() => toggleAlternatives(item.item_id)}
                                  className="w-full flex items-center justify-between p-3 hover:bg-slate-50 transition-colors focus:outline-none"
                                >
                                  <span className="text-[10px] uppercase font-bold text-teal-600 flex items-center gap-1.5">
                                    <svg className="w-3.5 h-3.5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                                    Alternative ({item.alternatives.length})
                                  </span>
                                  <svg 
                                    className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${expandedItems[item.item_id] ? 'rotate-180' : ''}`} 
                                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                  >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </button>
                                
                                {expandedItems[item.item_id] && (
                                <div className="p-3 flex flex-col gap-2.5 border-t border-slate-100 bg-slate-50/50">
                                  {item.alternatives.map((alt: any, altIdx: number) => (
                                    <div key={altIdx} className="flex justify-between items-center pl-1">
                                      <span className="text-xs font-medium text-slate-600">{alt.name}</span>
                                      <span className="text-xs font-bold text-slate-800">{alt.qty}{alt.unit}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              </div>
                            )}
                          </div>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))
            )}

          </div>
        </section>

      </main>
    </div>
  );
}