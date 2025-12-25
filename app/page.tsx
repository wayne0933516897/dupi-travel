"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- 1. Supabase 連線 ---
const supabase = createClient(
  'https://oqfysuuoxduginkfgggg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnlzdXVveGR1Z2lua2ZnZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDUxNjgsImV4cCI6MjA4MjIyMTE2OH0.igtMj90ihFLc3RIP0UGzXcUBxx4E16xMa9_HQcSfju8'
);

// --- 型別定義 ---
interface Member { id: string; name: string; avatar: string; loginCode: string; }
interface ExpenseRecord { id: number; category: string; amount: string; currency: string; twdAmount: string; payMethod: string; payerId: string; date: string; }
interface Plan { id: number; time: string; title: string; desc: string; icon: string; }
interface TodoItem { id: number; task: string; assigneeIds: string[]; completedAssigneeIds: string[]; category: string; }
interface JournalEntry { id: number; authorId: string; content: string; date: string; image?: string; }
interface Flight { id: number; airline: string; flightNo: string; from: string; fromCode: string; to: string; toCode: string; depTime: string; arrTime: string; duration: string; date: string; baggage: string; aircraft: string; }
interface BookingDoc { id: number; type: string; title: string; content: string; image?: string; }
interface Trip { id: string; title: string; startDate: string; endDate: string; emoji: string; }
interface ScheduleData { [key: number]: Plan[]; }

const JPY_TO_TWD = 0.22;
const hokkaidoWeather: any = { 1: { date: "01/10", temp: "-5°C" }, 2: { date: "01/11", temp: "-7°C" }, 3: { date: "01/12", temp: "-3°C" }, 4: { date: "01/13", temp: "-4°C" }, 5: { date: "01/14", temp: "-6°C" }, 6: { date: "01/15", temp: "-8°C" }, 7: { date: "01/16", temp: "-2°C" }, 8: { date: "01/17", temp: "0°C" } };

// --- 照片上傳組件 ---
function ImageUploader({ onUpload, label }: { onUpload: (base64: string) => void, label: string }) {
  const fileInput = useRef<HTMLInputElement>(null);
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onUpload(reader.result as string);
      reader.readAsDataURL(file);
    }
  };
  return (
    <div>
      <button onClick={() => fileInput.current?.click()} className="text-[10px] bg-gray-100 px-3 py-2 rounded-xl font-black text-black">📷 {label}</button>
      <input type="file" ref={fileInput} onChange={handleFile} accept="image/*" className="hidden" />
    </div>
  );
}

// --- 登錄頁面 ---
function LoginPage({ onLogin, allMembers }: { onLogin: (m: Member) => void, allMembers: Member[] }) {
  const [input, setInput] = useState('');
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] mb-8 flex items-center justify-center text-4xl shadow-xl">❄️</div>
      <h1 className="text-3xl font-black text-black mb-2 italic uppercase">Dupi Travel</h1>
      <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ENTER CODE..." className="w-full max-w-xs p-5 bg-white rounded-[24px] mb-4 font-black text-black outline-none shadow-sm" />
      <button onClick={() => {
        const found = allMembers.find(m => m.loginCode === input);
        if (found) onLogin(found); else alert('❌ 查無旅客');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg">START TRIP</button>
    </div>
  );
}

// --- 旅行選擇頁面 ---
function TripSelector({ user, onSelect, allTrips, onAddTrip, onDeleteTrip }: { user: Member, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: (t: Trip) => void, onDeleteTrip: (id: string) => void }) {
  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans">
      <div className="flex justify-between items-center mb-12">
        <div><p className="text-xs text-gray-400 font-black tracking-widest uppercase">Traveler,</p><h2 className="text-2xl font-black text-black">{user.name}</h2></div>
        <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-sm"><img src={user.avatar} className="w-full h-full object-cover" /></div>
      </div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-black text-[#5E9E8E] uppercase italic">My Trips</h3>
        {user.loginCode === 'wayne' && (
          <button onClick={() => {
            const title = prompt("旅程名稱:");
            if(title) onAddTrip({ id: Date.now().toString(), title, startDate: '2026-01-10', endDate: '2026-01-17', emoji: '✈️' });
          }} className="text-[10px] bg-blue-500 text-white px-3 py-1 rounded-full font-black">＋ NEW TRIP</button>
        )}
      </div>
      <div className="space-y-6">
        {allTrips.map(trip => (
          <div key={trip.id} className="relative group">
            <button onClick={() => onSelect(trip)} className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-95 transition-all">
              <div className="w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl">{trip.emoji}</div>
              <div className="flex-1 font-black text-black"><h4 className="text-lg">{trip.title}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase">{trip.startDate} ~ {trip.endDate}</p></div>
            </button>
            {user.loginCode === 'wayne' && (
              <button onClick={() => { if(confirm('確定刪除整趟旅程？')) onDeleteTrip(trip.id); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg">✕</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// --- 主程序 ---
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: (m: Member[]) => void }) {
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  const [bookSubTab, setBookSubTab] = useState('機票');

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);

  const getMember = (id: string) => allMembers.find(m => m.id === id) || allMembers[0];

  // 雲端連線
  useEffect(() => {
    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data) {
        const c = data.content;
        setRecords(c.records || []); setSchedules(c.schedules || { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] }); 
        setTodos(c.todos || []); setJournals(c.journals || []); setFlights(c.flights || []); setBookings(c.bookings || []);
      }
    };
    loadCloudData();
    const channel = supabase.channel(`trip-${tripData.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripData.id}` }, (payload) => {
      const c = payload.new.content;
      setRecords(c.records || []); setSchedules(c.schedules || {}); setTodos(c.todos || []); setJournals(c.journals || []); setFlights(c.flights || []); setBookings(c.bookings || []);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [tripData.id]);

  const syncToCloud = async (updatedFields: any) => {
    const fullData = { records, schedules, todos, journals, flights, bookings, ...updatedFields };
    await supabase.from('trips').upsert({ id: tripData.id, content: fullData });
  };

  // 狀態管理
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [payMethod, setPayMethod] = useState('現金');
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });
  const [showFlightModal, setShowFlightModal] = useState(false);
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: '長榮航空', flightNo: 'BR 116', from: '桃園', fromCode: 'TPE', to: '新千歲', toCode: 'CTS', depTime: '09:30', arrTime: '14:20', duration: '3h 50m', date: '2026-01-10', baggage: '23kg', aircraft: 'B787-10' });
  const [newJournal, setNewJournal] = useState({ id: null as number | null, content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', assigneeIds: [] as string[] });

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      {/* 頂部標題 */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-gray-100 text-xl font-black">←</div>
          <h1 className="text-xl font-black text-[#5E9E8E] tracking-tighter italic uppercase">Dupi Travel</h1>
        </div>
        <div className="flex -space-x-2">
          {allMembers.map(m => (
            <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white bg-white overflow-hidden shadow-sm"><img src={m.avatar} className="w-full h-full object-cover" /></div>
          ))}
        </div>
      </div>

      {/* --- 行程分頁 (含權限與完整 UI) --- */}
      {activeTab === '行程' && (
        <div className="px-4">
          <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden">
            <h2 className="text-4xl font-black font-mono tracking-tighter">{hokkaidoWeather[activeDay]?.temp || '-5°C'}</h2>
            <p className="text-sm font-bold uppercase tracking-widest italic">Day {activeDay} · {tripData.title}</p>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(d => (
              <button key={d} onClick={() => setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDay === d ? 'bg-[#E9C46A] text-white shadow-lg' : 'bg-white text-gray-400 border'}`}>
                <span className="text-[10px] font-bold">{d}日</span><span className="text-xl font-black">{d}</span>
              </button>
            ))}
          </div>
          <div className="mt-6 relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
            {(schedules[activeDay] || []).sort((a,b)=>a.time.localeCompare(b.time)).map(item => (
              <div key={item.id} className="flex gap-4 mb-8 relative">
                <div className="w-10 flex flex-col items-center shrink-0"><div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1"></div><span className="text-[10px] text-gray-400 mt-2 font-mono">{item.time}</span></div>
                <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm relative min-h-[100px] border border-orange-50">
                  <h4 className="font-bold text-sm mb-1">{item.icon} {item.title}</h4>
                  <p className="text-[10px] leading-relaxed mb-6 whitespace-pre-wrap">{item.desc}</p>
                  <div className="absolute bottom-3 right-4 flex gap-4">
                    <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`)} className="text-[#5E9E8E] text-[10px] font-black italic">MAP</button>
                    {user.loginCode === 'wayne' && (
                      <div className="flex gap-2">
                        <button onClick={() => { setPlanForm(item); setShowPlanModal({show:true, type:'edit', data:item}); }} className="text-xs">🖋️</button>
                        <button onClick={() => { if(confirm('刪除行程？')) { const n = schedules[activeDay].filter(p=>p.id!==item.id); const up = {...schedules, [activeDay]:n}; setSchedules(up); syncToCloud({schedules:up}); } }} className="text-xs">🗑️</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {user.loginCode === 'wayne' && <button onClick={() => setShowPlanModal({show:true, type:'add'})} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 font-bold">+ ADD PLAN</button>}
          </div>
        </div>
      )}

      {/* --- 記帳分頁 (含 ID 關聯編輯) --- */}
      {activeTab === '記帳' && (
        <div className="px-4">
          <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md font-black italic">
            <p className="text-sm opacity-90 uppercase tracking-widest">Total Expenses</p>
            <h2 className="text-4xl font-mono">NT$ {records.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h2>
          </div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8">
            <h3 className="text-xs mb-4 text-[#5E9E8E] font-black uppercase italic">{editingExpenseId ? 'Edit Record' : 'New Expense'}</h3>
            <input value={category} onChange={e => setCategory(e.target.value)} placeholder="消費項目..." className="w-full p-4 bg-[#F2F1EB] rounded-2xl mb-4 outline-none font-black" />
            <div className="grid grid-cols-2 gap-4 mb-4">
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="JPY" className="p-4 bg-[#F2F1EB] rounded-2xl outline-none font-mono" />
              <select value={expensePayerId} onChange={e => setExpensePayerId(e.target.value)} className="p-4 bg-[#F2F1EB] rounded-2xl outline-none">
                {allMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </div>
            <div className="flex gap-1 mb-4 overflow-x-auto no-scrollbar">
              {['現金', '信用卡', 'PayPay', 'Suica'].map(p => <button key={p} onClick={() => setPayMethod(p)} className={`px-3 py-2 rounded-lg text-[10px] border font-black ${payMethod === p ? 'border-[#E9C46A] text-[#E9C46A]' : 'text-gray-300'}`}>{p}</button>)}
            </div>
            <button onClick={() => {
              if(!category || !amount) return;
              const rec = { id: editingExpenseId || Date.now(), category, amount, currency: 'JPY', twdAmount: (Number(amount)*JPY_TO_TWD).toFixed(0), payMethod, payerId: expensePayerId, date: '今日' };
              const n = editingExpenseId ? records.map(r => r.id === editingExpenseId ? rec : r) : [rec, ...records];
              setRecords(n); syncToCloud({records: n}); setAmount(''); setCategory(''); setEditingExpenseId(null);
            }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic tracking-widest">{editingExpenseId ? 'Update' : 'Save'}</button>
          </div>
          <div className="space-y-3">
             {records.map(r => (
               <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50 relative pr-20">
                 <div className="flex items-center gap-3">
                    <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full border" />
                    <div className="text-xs font-black">{r.category} <span className="opacity-30 font-normal">({r.payMethod})</span><p className="text-[9px] opacity-40 font-mono italic">{getMember(r.payerId).name}</p></div>
                 </div>
                 <div className="text-right text-[#5E9E8E] font-mono tracking-tighter">{r.amount} JPY</div>
                 <div className="absolute right-3 flex gap-3">
                   <button onClick={() => { setEditingExpenseId(r.id); setCategory(r.category); setAmount(r.amount); setPayMethod(r.payMethod); setExpensePayerId(r.payerId); window.scrollTo(0,0); }} className="text-xs opacity-20">🖋️</button>
                   <button onClick={() => { if(confirm('刪除？')) { const n = records.filter(i=>i.id!==r.id); setRecords(n); syncToCloud({records:n}); } }} className="text-xs opacity-20">🗑️</button>
                 </div>
               </div>
             ))}
          </div>
        </div>
      )}

      {/* --- 預訂分頁 (撕線機票 UI) --- */}
      {activeTab === '預訂' && (
        <div className="px-4">
          <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border">
            {['機票', '憑證'].map(t => (
              <button key={t} onClick={() => setBookSubTab(t as any)} className={`flex-1 py-2 rounded-full text-sm font-black ${bookSubTab === t ? 'bg-[#86A760] text-white' : 'text-gray-300'}`}>{t}</button>
            ))}
          </div>
          {bookSubTab === '機票' && (
            <div className="space-y-10">
              {user.loginCode === 'wayne' && <button onClick={() => setShowFlightModal(true)} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[32px] text-gray-400 font-black">+ ADD FLIGHT</button>}
              {flights.map(f => (
                <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50">
                  <div className="bg-[#f8faff] p-8 pb-10 border-b border-dashed border-blue-100 relative text-center">
                    <div className="flex justify-between items-center mb-6"><span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black">{f.airline}</span>{user.loginCode === 'wayne' && <button onClick={()=>{if(confirm('刪除？')){const n=flights.filter(i=>i.id!==f.id); setFlights(n); syncToCloud({flights:n});}}} className="text-xs opacity-20">🗑️</button>}</div>
                    <h2 className="text-6xl text-black font-black tracking-tighter uppercase">{f.flightNo}</h2>
                    <div className="absolute -left-4 bottom-[-16px] w-8 h-8 bg-[#F9F8F3] rounded-full z-10 border border-blue-50"></div>
                    <div className="absolute -right-4 bottom-[-16px] w-8 h-8 bg-[#F9F8F3] rounded-full z-10 border border-blue-50"></div>
                  </div>
                  <div className="p-8 pt-12 text-center font-black">
                    <div className="flex justify-between items-center mb-10"><div className="text-left font-mono tracking-tighter"><p className="text-4xl">{f.fromCode}</p><p className="text-blue-600 text-xl">{f.depTime}</p></div><div className="flex-1 px-4"><p className="text-[9px] text-gray-300 italic mb-1">{f.duration}</p><div className="w-full h-[2px] bg-blue-50 relative flex items-center justify-center"><span className="text-blue-400 text-xl transform rotate-90">✈️</span></div><p className="text-[10px] text-gray-400 mt-3">{f.date}</p></div><div className="text-right font-mono tracking-tighter"><p className="text-4xl">{f.toCode}</p><p className="text-blue-600 text-xl">{f.arrTime}</p></div></div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {bookSubTab === '憑證' && (
            <div className="space-y-6">
               <button onClick={() => { const title = prompt("憑證名稱:"); if(title) { const n = [{id: Date.now(), type:'憑證', title, content:'', image: prompt("照片網址:") || undefined}, ...bookings]; setBookings(n); syncToCloud({bookings:n}); } }} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[32px] text-gray-400 font-black">+ ADD VOUCHER</button>
               {bookings.map(b => (
                <div key={b.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 relative">
                  <div className="flex justify-between items-start mb-4"><h4 className="font-black text-black bg-orange-50 px-3 py-1 rounded-full text-xs">🎫 {b.title}</h4><button onClick={()=>{if(confirm('刪除？')){const n=bookings.filter(i=>i.id!==b.id); setBookings(n); syncToCloud({bookings:n});}}} className="text-xs opacity-20">🗑️</button></div>
                  {b.image && <img src={b.image} className="w-full rounded-[24px]" />}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- 日誌分頁 (ID 關聯) --- */}
      {activeTab === '日誌' && (
        <div className="px-4">
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8">
            <h3 className="text-xs font-black mb-4 text-[#5E9E8E] uppercase italic">New Journal</h3>
            <textarea value={newJournal.content} onChange={e => setNewJournal({...newJournal, content: e.target.value})} placeholder="記錄精彩瞬間..." className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none text-sm h-32 font-black shadow-inner" />
            <div className="flex justify-between items-center">
              <ImageUploader label="上傳照片" onUpload={(b64) => setNewJournal({...newJournal, image: b64})} />
              <button onClick={() => {
                if(!newJournal.content) return;
                const n = newJournal.id ? journals.map(j => j.id === newJournal.id ? {...j, content: newJournal.content, image: newJournal.image} : j) : [{ id: Date.now(), authorId: user.id, content: newJournal.content, date: "2026/01/10", image: newJournal.image }, ...journals];
                setJournals(n); syncToCloud({journals: n}); setNewJournal({id: null, content:'', image:''});
              }} className="px-8 py-3 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic">Publish</button>
            </div>
          </div>
          {journals.map(j => (
            <div key={j.id} className="bg-white p-8 rounded-[32px] shadow-sm mb-6 border border-gray-50 relative">
              <div className="flex items-center gap-3 mb-4 text-xs">
                <img src={getMember(j.authorId).avatar} className="w-6 h-6 rounded-full shadow-sm" />
                <span className="text-black font-black">{getMember(j.authorId).name} · {j.date}</span>
                <div className="ml-auto flex gap-4">
                   <button onClick={() => { setNewJournal({id: j.id, content: j.content, image: j.image || ''}); window.scrollTo(0,0); }} className="opacity-20">🖋️</button>
                   <button onClick={() => { if(confirm('要刪除嗎？')) { const n = journals.filter(i=>i.id!==j.id); setJournals(n); syncToCloud({journals:n}); } }} className="opacity-20">🗑️</button>
                </div>
              </div>
              <p className="text-sm leading-loose whitespace-pre-wrap font-bold">{j.content}</p>
              {j.image && <img src={j.image} className="w-full rounded-[24px] shadow-lg mt-4" />}
            </div>
          ))}
        </div>
      )}

      {/* --- 準備分頁 --- */}
      {activeTab === '準備' && (
        <div className="px-4">
          <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border">
            {['待辦', '行李', '採購'].map(t => (
              <button key={t} onClick={() => setPrepSubTab(t)} className={`flex-1 py-2 rounded-full text-sm font-black ${prepSubTab === t ? 'bg-[#86A760] text-white shadow-md' : 'text-gray-300'}`}>{t}</button>
            ))}
          </div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm mb-8 border relative">
            <input value={newTodoInput.task} onChange={e => setNewTodoInput({...newTodoInput, task: e.target.value})} placeholder={`新增${prepSubTab}...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner" />
            <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
                {allMembers.map(m => (
                  <button key={m.id} onClick={() => { const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i => i !== m.id) : [...newTodoInput.assigneeIds, m.id]; setNewTodoInput({...newTodoInput, assigneeIds: ids}); }} className={`p-2 px-3 rounded-xl border text-[10px] font-black ${newTodoInput.assigneeIds.includes(m.id) ? 'bg-green-50 border-green-200 text-[#86A760]' : 'border-gray-50 text-gray-300'}`}>{m.name}</button>
                ))}
            </div>
            <button onClick={() => {
              if(!newTodoInput.task || newTodoInput.assigneeIds.length === 0) return alert("請輸入內容並指派成員");
              const n = [{ id: Date.now(), task: newTodoInput.task, assigneeIds: newTodoInput.assigneeIds, completedAssigneeIds: [], category: prepSubTab }, ...todos];
              setTodos(n); syncToCloud({todos: n}); setNewTodoInput({task:'', assigneeIds:[]});
            }} className="w-full py-3 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic tracking-widest">Add List</button>
          </div>
          <div className="space-y-4">
            {todos.filter(t => t.category === prepSubTab).map(todo => (
              <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 relative">
                <div className="flex gap-2 mb-4">
                  {todo.assigneeIds.map(id => {
                    const m = getMember(id);
                    const isDone = todo.completedAssigneeIds.includes(id);
                    return (
                      <button key={id} onClick={() => { const newComp = isDone ? todo.completedAssigneeIds.filter(cid => cid !== id) : [...todo.completedAssigneeIds, id]; const n = todos.map(t => t.id === todo.id ? {...t, completedAssigneeIds: newComp} : t); setTodos(n); syncToCloud({todos: n}); }} className={`px-4 py-1.5 rounded-full text-[10px] font-black ${isDone ? 'bg-[#86A760] text-white' : 'bg-gray-50 text-gray-300'}`}>
                        {m.name} {isDone && "✅"}
                      </button>
                    );
                  })}
                </div>
                <h4 className={`text-sm ${todo.completedAssigneeIds.length === todo.assigneeIds.length ? 'line-through text-gray-200' : 'font-black'}`}>{todo.task}</h4>
                <button onClick={() => { if(confirm('要刪除嗎？')) { const n = todos.filter(t => t.id !== todo.id); setTodos(n); syncToCloud({todos: n}); } }} className="absolute top-6 right-6 text-xs text-gray-100 hover:text-red-400">🗑️</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- 成員分頁 (肚皮專屬管理) --- */}
      {activeTab === '成員' && (
        <div className="px-4">
          <h2 className="text-center text-xl font-black mb-12 text-[#5E9E8E] italic uppercase">The Squad</h2>
          <div className="grid grid-cols-1 gap-6">
            {allMembers.map(m => (
              <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-sm border flex items-center gap-6 relative overflow-hidden">
                <img src={m.avatar} className="w-20 h-20 rounded-3xl object-cover shadow-md border-2 border-white" />
                <div className="flex-1">
                  <h4 className="text-xl font-black">{m.name}</h4>
                  <p className="text-xs text-gray-300 font-mono tracking-widest uppercase">Code: {m.loginCode}</p>
                </div>
                {user.loginCode === 'wayne' && (
                  <button onClick={() => {
                    const newName = prompt("成員名稱:", m.name);
                    const newCode = prompt("Login Code:", m.loginCode);
                    const newAvatar = prompt("頭貼網址:", m.avatar);
                    if(newName && newCode && newAvatar) {
                      const updated = allMembers.map(item => item.id === m.id ? { ...item, name: newName, loginCode: newCode, avatar: newAvatar } : item);
                      onUpdateMembers(updated);
                    }
                  }} className="bg-gray-50 p-3 rounded-2xl text-xs font-black shadow-inner">🖋️ EDIT</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 底部導航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50">
        {[ {id:'行程', icon:'📅'}, {id:'預訂', icon:'📔'}, {id:'記帳', icon:'👛'}, {id:'日誌', icon:'🖋️'}, {id:'準備', icon:'💼'}, {id:'成員', icon:'👥'} ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all ${activeTab === tab.id ? 'text-[#86A760] scale-125 font-black -translate-y-1' : 'opacity-25'}`}>
            <span className="text-2xl">{tab.icon}</span><span className="text-[10px] font-black uppercase tracking-tighter">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* 編輯彈窗 (行程、航班等) */}
      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
          <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom">
            <h3 className="text-2xl font-black mb-8 text-[#5E9E8E] italic uppercase">{showPlanModal.type === 'edit' ? 'Edit Plan' : 'New Plan'}</h3>
            <div className="flex gap-3 mb-4"><input type="time" value={planForm.time} onChange={e=>setPlanForm({...planForm, time:e.target.value})} className="flex-1 p-4 bg-gray-50 rounded-2xl font-black text-xl" /></div>
            <input placeholder="地點..." value={planForm.title} onChange={e=>setPlanForm({...planForm, title:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-4 outline-none font-black text-xl shadow-inner" />
            <textarea placeholder="備註..." value={planForm.desc} onChange={e=>setPlanForm({...planForm, desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm font-black h-32 shadow-inner" />
            <div className="flex gap-4"><button onClick={() => setShowPlanModal({show:false, type:'add'})} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-3xl font-black">Cancel</button><button onClick={() => {
              const dPlans = schedules[activeDay] || [];
              const n = showPlanModal.type === 'add' ? [...dPlans, {...planForm, id: Date.now()}] : dPlans.map(p => p.id === showPlanModal.data?.id ? {...planForm, id: p.id} : p);
              const up = {...schedules, [activeDay]: n}; setSchedules(up); syncToCloud({schedules: up}); setShowPlanModal({show:false, type:'add'});
            }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl font-black shadow-xl">Save</button></div>
          </div>
        </div>
      )}

      {showFlightModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
          <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl max-h-[80vh] overflow-y-auto">
             <h3 className="text-2xl font-black mb-8 text-blue-500 uppercase italic">Flight Setup</h3>
             <input placeholder="航班號 (如: BR116)" value={flightForm.flightNo} onChange={e=>setFlightForm({...flightForm, flightNo:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 font-black" />
             <div className="grid grid-cols-2 gap-4 mb-4"><input placeholder="從 (TPE)" value={flightForm.fromCode} onChange={e=>setFlightForm({...flightForm, fromCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl font-black" /><input placeholder="到 (CTS)" value={flightForm.toCode} onChange={e=>setFlightForm({...flightForm, toCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl font-black" /></div>
             <div className="grid grid-cols-2 gap-4 mb-8"><input type="time" value={flightForm.depTime} onChange={e=>setFlightForm({...flightForm, depTime:e.target.value})} className="p-4 bg-gray-50 rounded-2xl font-black" /><input type="time" value={flightForm.arrTime} onChange={e=>setFlightForm({...flightForm, arrTime:e.target.value})} className="p-4 bg-gray-50 rounded-2xl font-black" /></div>
             <div className="flex gap-4"><button onClick={()=>setShowFlightModal(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button><button onClick={()=>{const n=[{...flightForm, id:Date.now()}, ...flights]; setFlights(n); syncToCloud({flights:n}); setShowFlightModal(false);}} className="flex-1 py-4 bg-blue-500 text-white rounded-3xl font-black shadow-xl">Confirm</button></div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- 總進入點 ---
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const sm = localStorage.getItem('members_v35');
    const st = localStorage.getItem('trips_v35');
    if (sm) setAllMembers(JSON.parse(sm));
    else setAllMembers([
      { id: '1', name: '肚皮', avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=1', loginCode: 'wayne' },
      { id: '2', name: '豆豆皮', avatar: 'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=2', loginCode: 'Elvina' }
    ]);
    if (st) setAllTrips(JSON.parse(st));
    else setAllTrips([{ id: 'hokkaido2026', title: '2026 北海道之旅', startDate: '2026-01-10', endDate: '2026-01-17', emoji: '☃️' }]);
  }, []);

  useEffect(() => { localStorage.setItem('members_v35', JSON.stringify(allMembers)); }, [allMembers]);
  useEffect(() => { localStorage.setItem('trips_v35', JSON.stringify(allTrips)); }, [allTrips]);

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  if (!selectedTrip) return <TripSelector user={user} allTrips={allTrips} onSelect={setSelectedTrip} onAddTrip={(t)=>setAllTrips([...allTrips, t])} onDeleteTrip={(id)=>setAllTrips(allTrips.filter(x=>x.id!==id))} />;
  return <MainApp user={user} tripData={selectedTrip} allMembers={allMembers} onUpdateMembers={setAllMembers} onBack={() => setSelectedTrip(null)} />;
}