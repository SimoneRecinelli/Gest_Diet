"use client";

import React, { useState } from 'react';
import Link from 'next/link';

export default function ListaSpesa() {
  const [checkedItems, setCheckedItems] = useState<Record<number, boolean>>({});

  const toggleItem = (id: number) => {
    setCheckedItems(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const groceryData = [
    {
      owner: 'Spesa di Simone',
      description: 'Colazioni, spuntini, pranzi e le tue salse',
      headerBg: 'bg-teal-500',
      badge: 'text-teal-700 bg-teal-50',
      categories: [
        {
          id: 'colazione_spuntini',
          title: 'Colazione & Spuntini',
          items: [
            { id: 1, name: "Latte Parzialmente Scremato Zymil", qty: "4 Litri" },
            { id: 2, name: "Yogurt Banana Zymil", qty: "7 Vasi" },
            { id: 3, name: "Yogurt Fruyo (Vaniglia/Stracciatella)", qty: "2 Vasi" },
            { id: 4, name: "Cereali Nesquik o Muesli", qty: "2 Conf." },
            { id: 5, name: "Pane comune & Cornetti", qty: "A consumo" },
            { id: 6, name: "Nutella", qty: "1 Vaso" },
          ]
        },
        {
          id: 'pranzo_freschi',
          title: 'Pranzo & Freschi',
          items: [
            { id: 7, name: "Pasta di Semola (De Cecco)", qty: "1 Pacco (500g)" },
            { id: 8, name: "Tortellini Freschi", qty: "1 Conf." },
            { id: 9, name: "Fagioli Borlotti in scatola", qty: "1 Barattolo" },
            { id: 10, name: "Uova", qty: "1 Conf. da 6" },
            { id: 11, name: "Bresaola", qty: "100g" },
            { id: 12, name: "Mozzarella senza lattosio / Sottilette", qty: "2 Conf." },
            { id: 13, name: "Parmigiano / Grana Grattugiato", qty: "200g" },
          ]
        },
        {
          id: 'frutta_verdura',
          title: 'Frutta & Verdura',
          items: [
            { id: 14, name: "Verdure Fresche & Carote", qty: "1.5 kg" },
            { id: 15, name: "Banane o Mele", qty: "10 Frutti" },
            { id: 16, name: "Frutta alternativa (Fragole, Ananas...)", qty: "A scelta" },
          ]
        },
        {
          id: 'condimenti_simone',
          title: 'Salse Personali',
          items: [
            { id: 17, name: "Salsa Barbecue (Biffi/Heinz)", qty: "1 Conf. (ogni 3 sett.)" },
          ]
        }
      ]
    },
    {
      owner: 'Spesa di Nonna Maria',
      description: 'Cena, pesce, carne, sughi e scorte d\'olio',
      headerBg: 'bg-indigo-500',
      badge: 'text-indigo-700 bg-indigo-50',
      categories: [
        {
          id: 'cena',
          title: 'Cena',
          items: [
            { id: 18, name: "Petto di Pollo", qty: "600g" },
            { id: 19, name: "Coda di Rospo (o altro pesce)", qty: "600g" },
            { id: 20, name: "Vitellone magro", qty: "300g" },
          ]
        },
        {
          id: 'condimenti_nonna',
          title: 'Condimenti & Salse (Scorte)',
          items: [
            { id: 21, name: "Olio Extra Vergine di Oliva", qty: "Scorta in litri" },
            { id: 22, name: "Sugo Pomodoro, Tonno, Melanzane, Salsiccia", qty: "Vari" },
            { id: 23, name: "Crema di Zucchine", qty: "1 Conf." },
          ]
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 pb-20">
      
      <header className="bg-white border-b border-slate-200 px-6 py-5 sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <Link href="/" className="h-10 w-10 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-full flex items-center justify-center transition-colors shadow-sm">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-slate-900">Lista della Spesa</h1>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mt-0.5">Gestione Separata</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 md:px-6 mt-6 space-y-10">
        
        {groceryData.map((section) => (
          <div key={section.owner} className="space-y-4">
            
            <div className="flex items-center gap-3 mb-2 px-1">
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-extrabold shadow-md ${section.headerBg}`}>
                {section.owner.includes('Simone') ? 'SR' : 'NM'}
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">{section.owner}</h2>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${section.badge}`}>
                  {section.description}
                </span>
              </div>
            </div>

            {section.categories.map((category) => (
              <section key={category.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50/80">
                  <h3 className="font-bold text-slate-800">{category.title}</h3>
                </div>
                
                <div className="p-2">
                  {category.items.map((item) => {
                    const isChecked = checkedItems[item.id] || false;
                    
                    return (
                      <div 
                        key={item.id}
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between p-3.5 cursor-pointer transition-all rounded-2xl hover:bg-slate-50 ${isChecked ? 'opacity-40 grayscale' : 'opacity-100'}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${isChecked ? `${section.headerBg} border-transparent` : 'border-slate-300'}`}>
                            {isChecked && (
                              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                            )}
                          </div>
                          <span className={`text-sm sm:text-base font-semibold ${isChecked ? 'text-slate-500 line-through' : 'text-slate-800'}`}>
                            {item.name}
                          </span>
                        </div>
                        <span className={`text-xs sm:text-sm font-extrabold whitespace-nowrap ml-4 ${isChecked ? 'text-slate-400' : 'text-slate-900'}`}>
                          {item.qty}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        ))}

      </main>
    </div>
  );
}