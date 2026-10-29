"use client";

import { useMemo, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import { useStoredValue } from '../../lib/use-stored-value';

type GroceryItem = { id: number; name: string; qty: string };
type Category = { id: string; title: string; items: GroceryItem[] };
type Owner = { id: string; label: string; categories: Category[] };

// Gli id sono unici su tutte le liste: servono per salvare le spunte
const OWNERS: Owner[] = [
  {
    id: 'simone',
    label: 'Simone',
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
        ],
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
        ],
      },
      {
        id: 'frutta_verdura',
        title: 'Frutta & Verdura',
        items: [
          { id: 14, name: "Verdure Fresche & Carote", qty: "1.5 kg" },
          { id: 15, name: "Banane o Mele", qty: "10 Frutti" },
          { id: 16, name: "Frutta alternativa (Fragole, Ananas...)", qty: "A scelta" },
        ],
      },
      {
        id: 'condimenti_simone',
        title: 'Salse Personali',
        items: [{ id: 17, name: "Salsa Barbecue (Biffi/Heinz)", qty: "1 Conf. (ogni 3 sett.)" }],
      },
    ],
  },
  {
    id: 'nonna',
    label: 'Nonna Maria',
    categories: [
      {
        id: 'cena',
        title: 'Cena',
        items: [
          { id: 18, name: "Petto di Pollo", qty: "600g" },
          { id: 19, name: "Rana pescatrice (o Sogliola, Palombo, Insalata mare, Salmone aff.)", qty: "600g" },
          { id: 20, name: "Vitellone magro", qty: "300g" },
        ],
      },
      {
        id: 'condimenti_nonna',
        title: 'Condimenti & Salse (Scorte)',
        items: [
          { id: 21, name: "Olio Extra Vergine di Oliva", qty: "Scorta in litri" },
          { id: 22, name: "Sugo Pomodoro, Tonno, Melanzane, Salsiccia", qty: "Vari" },
          { id: 23, name: "Crema di Zucchine", qty: "1 Conf." },
        ],
      },
    ],
  },
];

const STORAGE_KEY = 'dietos-spesa-v1';

function parseIds(raw: string): Set<number> {
  try {
    const data: unknown = JSON.parse(raw);
    if (Array.isArray(data)) return new Set(data.filter((n): n is number => typeof n === 'number'));
  } catch {
    // valore vuoto o rovinato: si riparte da zero
  }
  return new Set();
}

function ItemRow({
  item,
  checked,
  onToggle,
}: {
  item: GroceryItem;
  checked: boolean;
  onToggle: (id: number) => void;
}) {
  return (
    <label className="flex min-h-14 cursor-pointer items-center gap-3.5 border-t border-line py-2">
      <input
        type="checkbox"
        checked={checked}
        onChange={() => onToggle(item.id)}
        className="size-6 shrink-0 accent-brand"
      />
      <span
        className={`flex-1 text-base font-medium ${checked ? 'text-muted line-through' : ''}`}
      >
        {item.name}
      </span>
      <span
        className={`text-right text-sm whitespace-nowrap ${
          checked ? 'font-semibold text-muted' : 'font-bold'
        }`}
      >
        {item.qty}
      </span>
    </label>
  );
}

export default function ListaSpesa() {
  const [raw, setRaw] = useStoredValue(STORAGE_KEY);
  const [ownerIndex, setOwnerIndex] = useState(0);
  const checked = useMemo(() => parseIds(raw), [raw]);

  const owner = OWNERS[ownerIndex];
  const allItems = owner.categories.flatMap((c) => c.items);
  const doneItems = allItems.filter((i) => checked.has(i.id));
  const progress = allItems.length === 0 ? 0 : Math.round((doneItems.length / allItems.length) * 100);

  function toggle(id: number) {
    const next = new Set(checked);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setRaw(JSON.stringify([...next]));
  }

  // Svuota solo la lista che stai guardando
  function resetOwner() {
    const next = new Set(checked);
    for (const item of allItems) next.delete(item.id);
    setRaw(JSON.stringify([...next]));
  }

  return (
    <div className="min-h-dvh bg-white pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl">
        <header className="sticky top-0 z-10 border-b border-line bg-white px-5 pt-[calc(env(safe-area-inset-top)+1.5rem)] pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">Spesa</h1>
            <p className="text-[15px] font-semibold text-brand-ink">
              {doneItems.length} di {allItems.length} presi
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Articoli presi"
            aria-valuemin={0}
            aria-valuemax={allItems.length}
            aria-valuenow={doneItems.length}
            className="mt-3 h-2 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex gap-1 rounded-2xl bg-surface p-1">
            {OWNERS.map((o, i) => (
              <button
                key={o.id}
                type="button"
                aria-pressed={i === ownerIndex}
                onClick={() => setOwnerIndex(i)}
                className={`min-h-11 flex-1 rounded-xl text-[15px] ${
                  i === ownerIndex ? 'bg-brand font-bold text-white' : 'font-semibold text-muted'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </header>

        <main className="px-5">
          {owner.categories.map((category) => {
            const remaining = category.items.filter((i) => !checked.has(i.id));
            if (remaining.length === 0) return null;
            return (
              <section key={category.id} aria-label={category.title} className="pt-6">
                <h2 className="pb-1 text-lg font-bold">{category.title}</h2>
                {remaining.map((item) => (
                  <ItemRow key={item.id} item={item} checked={false} onToggle={toggle} />
                ))}
              </section>
            );
          })}

          {doneItems.length > 0 && (
            <section aria-label="Articoli presi" className="pt-6">
              <h2 className="pb-1 text-lg font-bold text-muted">Presi ({doneItems.length})</h2>
              {doneItems.map((item) => (
                <ItemRow key={item.id} item={item} checked onToggle={toggle} />
              ))}
              <button
                type="button"
                onClick={resetOwner}
                className="mt-2 min-h-12 w-full border-t border-line text-[15px] font-semibold text-brand"
              >
                Azzera la lista di {owner.label}
              </button>
            </section>
          )}

          {doneItems.length === allItems.length && allItems.length > 0 && (
            <p className="pt-6 text-center text-base font-medium text-brand-ink">
              Hai preso tutto.
            </p>
          )}
        </main>
      </div>

      <BottomNav active="spesa" />
    </div>
  );
}
