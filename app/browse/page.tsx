'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import {
  BadgeCheck, ChevronDown, Compass, Filter, GraduationCap, Heart,
  MapPin, MessageSquare, Plus, Search, ShieldCheck, SlidersHorizontal,
  Sparkles, UserRound, Wifi, Wind, Utensils, X, ArrowUpRight,
} from 'lucide-react';

interface Listing {
  _id: string; roomDetails: string; price: number; listingType: 'handover' | 'pg' | 'roommate';
  pgName?: string; address?: string; images?: string[]; coordinates?: { lat: number; lng: number };
  userId: { name: string; hostelName?: string };
}

const fallbackListings = [
  { _id: '1', pgName: 'The Nest — Vaishali Nagar', roomDetails: 'Private room with attached bath', price: 9200, address: '350m from JECRC University', images: ['/logo image.png'], listingType: 'pg' as const, userId: { name: 'Aarav Mehta' } },
  { _id: '2', pgName: 'Urban Hive Student Living', roomDetails: 'Double sharing, south-facing', price: 7800, address: '620m from JECRC University', images: ['/logo image short.png'], listingType: 'pg' as const, userId: { name: 'Isha Sharma' } },
  { _id: '3', pgName: 'Blue Door Residency', roomDetails: 'Single room with study desk', price: 11000, address: '1.1km from JECRC University', images: ['/logo image.png'], listingType: 'pg' as const, userId: { name: 'Kabir Singh' } },
];

const amenities = [{ label: 'Wi-Fi', icon: Wifi }, { label: 'AC', icon: Wind }, { label: 'Mess', icon: Utensils }];

export default function BrowsePage() {
  const router = useRouter();
  const [listings, setListings] = useState<Listing[]>(fallbackListings);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Listing | null>(fallbackListings[0]);
  const [composerOpen, setComposerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('review');

  useEffect(() => {
    fetch('/api/listings?limit=12').then((r) => r.json()).then((data) => {
      if (data.data?.length) setListings(data.data);
    }).catch(() => undefined);
  }, []);

  const filtered = useMemo(() => listings.filter((listing) =>
    `${listing.pgName} ${listing.address} ${listing.roomDetails}`.toLowerCase().includes(query.toLowerCase())
  ), [listings, query]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="flex h-16 items-center gap-6 border-b border-border px-5 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-8 place-items-center rounded-lg bg-foreground text-background"><ShieldCheck className="size-4" /></span>
          Verisite
        </Link>
        <div className="hidden h-8 w-px bg-border md:block" />
        <div className="relative min-w-0 flex-1 md:max-w-xl">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input aria-label="Search listings" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by campus, area, or property" className="h-9 w-full rounded-lg border border-border bg-muted/40 pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus:border-emerald-500" />
        </div>
        <button className="hidden items-center gap-2 text-sm text-muted-foreground md:flex"><MapPin className="size-4 text-emerald-500" />JECRC University<ChevronDown className="size-3.5" /></button>
        <ThemeToggle />
        <button onClick={() => router.push('/profile')} className="grid size-9 place-items-center rounded-lg border border-border hover:bg-muted" aria-label="Open profile"><UserRound className="size-4" /></button>
      </header>

      <div className="flex h-[calc(100vh-4rem)] flex-col lg:flex-row">
        <section className="relative min-h-[360px] flex-1 overflow-hidden border-b border-border bg-[#dfe7e1] dark:bg-[#15201d] lg:order-1 lg:min-h-0 lg:border-b-0 lg:border-r">
          <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(32deg,transparent_48%,rgba(16,185,129,.16)_49%,transparent_51%),linear-gradient(120deg,transparent_48%,rgba(100,116,139,.12)_49%,transparent_51%)] [background-size:150px_150px,220px_220px]" />
          <div className="absolute left-[20%] top-[33%] h-32 w-2/3 rotate-[-12deg] rounded-full bg-emerald-500/10" />
          <div className="absolute right-8 top-6 rounded-lg border border-border bg-background/90 p-3 text-xs shadow-sm backdrop-blur-sm"><div className="mb-1 font-medium">Map area</div><div className="text-muted-foreground">12 verified places nearby</div></div>
          {filtered.map((listing, index) => <button key={listing._id} onClick={() => setSelected(listing)} className={`absolute grid size-10 place-items-center rounded-full border-4 border-background bg-emerald-500 text-xs font-bold text-white shadow-lg transition-transform hover:scale-110 ${selected?._id === listing._id ? 'scale-125 ring-4 ring-emerald-500/20' : ''}`} style={{ left: `${24 + index * 22}%`, top: `${48 - index * 11}%` }} aria-label={`View ${listing.pgName}`}>₹</button>)}
          <div className="absolute bottom-5 left-5 flex items-center gap-2 rounded-lg border border-border bg-background/95 px-3 py-2 text-xs shadow-sm"><Compass className="size-4 text-emerald-500" />Verified campus radius: 2.5km</div>
        </section>

        <section className="flex w-full flex-col lg:order-2 lg:w-[40%] lg:min-w-[430px] xl:w-[38%]">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Discovery</p><h1 className="text-lg font-semibold tracking-tight">Student homes near campus</h1></div><button className="rounded-lg border border-border p-2 hover:bg-muted" aria-label="Filter listings"><SlidersHorizontal className="size-4" /></button></div>
          <div className="flex items-center gap-2 border-b border-border px-5 py-3 text-xs text-muted-foreground"><span className="font-medium text-foreground">{filtered.length} verified listings</span><span>·</span><span>Updated moments ago</span><button onClick={() => setComposerOpen(true)} className="ml-auto inline-flex items-center gap-1 rounded-md bg-foreground px-2.5 py-1.5 font-medium text-background"><Plus className="size-3.5" />Post</button></div>
          <div className="flex-1 overflow-y-auto p-4">
            <div className="flex flex-col gap-3">{filtered.map((listing) => <ListingCard key={listing._id} listing={listing} selected={selected?._id === listing._id} onClick={() => setSelected(listing)} />)}</div>
          </div>
        </section>
      </div>

      {composerOpen && <Composer onClose={() => setComposerOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} />}
    </main>
  );
}

function ListingCard({ listing, selected, onClick }: { listing: Listing; selected: boolean; onClick: () => void }) {
  return <article onClick={onClick} className={`cursor-pointer overflow-hidden rounded-xl border bg-card transition-colors hover:border-emerald-500/60 ${selected ? 'border-emerald-500 ring-1 ring-emerald-500/20' : 'border-border'}`}><div className="flex gap-3 p-3"><div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-lg bg-muted"><img src={listing.images?.[0] || '/logo image.png'} alt="" className="size-full object-cover opacity-80" /></div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div><h2 className="truncate text-sm font-semibold">{listing.pgName || 'Verified student home'}</h2><p className="mt-0.5 truncate text-xs text-muted-foreground">{listing.roomDetails}</p></div><Heart className="size-4 shrink-0 text-muted-foreground" /></div><p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="size-3 text-emerald-500" />{listing.address || 'Near campus'}</p><div className="mt-2 flex items-center justify-between"><div className="flex gap-1.5">{amenities.map(({ label, icon: Icon }) => <span key={label} className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-1 text-[10px] text-muted-foreground"><Icon className="size-3" />{label}</span>)}</div><span className="text-sm font-semibold">₹{listing.price.toLocaleString()}<span className="text-[10px] font-normal text-muted-foreground">/mo</span></span></div></div></div><div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-2 text-xs"><span className="inline-flex items-center gap-1 font-medium text-emerald-600"><BadgeCheck className="size-3.5" />Truth Ledger 4.8 <span className="font-normal text-muted-foreground">(24 reviews)</span></span><ArrowUpRight className="size-3.5 text-muted-foreground" /></div></article>;
}

function Composer({ onClose, activeTab, setActiveTab }: { onClose: () => void; activeTab: string; setActiveTab: (tab: string) => void }) {
  const tabs = [{ id: 'review', label: 'PG rating' }, { id: 'handover', label: 'Room handover' }, { id: 'roommate', label: 'Roommate finder' }];
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4"><div role="dialog" aria-modal="true" aria-labelledby="composer-title" className="w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-background shadow-2xl"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><p className="text-xs font-medium uppercase tracking-widest text-emerald-600">Student contribution</p><h2 id="composer-title" className="text-lg font-semibold">Keep the ledger honest</h2></div><button onClick={onClose} className="rounded-md p-2 hover:bg-muted" aria-label="Close"><X className="size-4" /></button></div><div className="flex gap-1 border-b border-border px-5 pt-3">{tabs.map((tab) => <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`border-b-2 px-3 pb-3 text-xs font-medium ${activeTab === tab.id ? 'border-emerald-500 text-foreground' : 'border-transparent text-muted-foreground'}`}>{tab.label}</button>)}</div><div className="flex flex-col gap-5 p-5"><div className="flex items-center gap-3 rounded-lg border border-emerald-500/25 bg-emerald-500/5 p-3 text-sm"><BadgeCheck className="size-5 text-emerald-500" /><div><p className="font-medium">Geofence verified</p><p className="text-xs text-muted-foreground">You are 12m from The Nest · within the 50m review radius</p></div></div><label className="flex flex-col gap-2 text-sm font-medium">{activeTab === 'review' ? 'Your honest experience' : activeTab === 'handover' ? 'What are you handing over?' : 'Tell students who you are looking for'}<textarea className="min-h-28 resize-none rounded-lg border border-border bg-muted/30 p-3 text-sm outline-none focus:border-emerald-500" placeholder="Keep it specific — pros, cons, hidden costs, lease details..." /></label><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground"><Plus className="mx-auto mb-2 size-5" />Drop authentic photos here</div><div className="flex flex-col justify-center gap-2 rounded-lg border border-border p-4 text-xs"><span className="inline-flex items-center gap-2 font-medium"><Sparkles className="size-4 text-emerald-500" />Sharp optimization ready</span><span className="text-muted-foreground">Images are compressed without losing detail.</span></div></div><div className="flex items-center justify-between border-t border-border pt-4"><label className="flex items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" className="accent-emerald-500" />Post anonymously</label><button onClick={onClose} className="rounded-lg bg-foreground px-4 py-2 text-sm font-medium text-background">Submit to ledger</button></div></div></div></div>;
}

