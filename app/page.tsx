"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

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
interface Flight { id: number; airline: string; flightNo: string; fromCode: string; toCode: string; depTime: string; arrTime: string; duration: string; date: string; baggage: string; aircraft: string; }
interface BookingDoc { id: number; type: string; title: string; image?: string; }
interface Trip { id: string; title: string; startDate: string; endDate: string; emoji: string; memberIds: string[]; }
interface ScheduleData { [key: number]: Plan[]; }

const JPY_TO_TWD = 0.22;
const tripDates = ["01/10", "01/11", "01/12", "01/13", "01/14", "01/15", "01/16", "01/17"];

// --- 輔助組件 ---
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

// ==========================================
// 1. 登錄頁面
// ==========================================
function LoginPage({ onLogin, allMembers }: { onLogin: (m: Member) => void, allMembers: Member[] }) {
  const [input, setInput] = useState('');
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] mb-8 flex items-center justify-center text-4xl shadow-xl">❄️</div>
      <h1 className="text-3xl font-black text-black mb-2 italic uppercase">Dupi Travel</h1>
      <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ENTER CODE..." className="w-full max-w-xs p-5 bg-white rounded-[24px] mb-4 font-black text-black outline-none shadow-sm" />
      <button onClick={() => {
        const found = allMembers.find(m => m.loginCode === input);
        if (found) onLogin(found); else alert('❌ 查無代碼');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg">LOGIN</button>
    </div>
  );
}

// ==========================================
// 2. 使用者/旅行管理 (修正點1: 補齊新增使用者)
// ==========================================
function TripSelector({ user, onSelect, allTrips, onAddTrip, onDeleteTrip, allMembers, onUpdateMembers }: { user: Member, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: any, onDeleteTrip: any, allMembers: Member[], onUpdateMembers: any }) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newTrip, setNewTrip] = useState<Trip>({ id: '', title: '', startDate: '2026-01-10', endDate: '2026-01-17', emoji: '☃️', memberIds: [user.id] });

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32">
      <div className="flex justify-between items-center mb-12">
        <div><p className="text-xs text-gray-400 font-black tracking-widest uppercase font-black">Admin Mode,</p><h2 className="text-2xl font-black text-black">{user.name}</h2></div>
        <div onClick={() => setShowUserAdmin(true)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer"><img src={user.avatar} className="w-full h-full object-cover" /></div>
      </div>

      <div className="flex justify-between items-center mb-6 font-black">
        <h3 className="text-sm font-black text-[#5E9E8E] uppercase italic">My Trips</h3>
        {user.loginCode === 'wayne' && <button onClick={() => setShowAddTrip(true)} className="text-[10px] bg-blue-500 text-white px-4 py-2 rounded-full font-black shadow-lg font-black">+ NEW TRIP</button>}
      </div>

      <div className="space-y-6">
        {allTrips.map(trip => (
          <div key={trip.id} className="relative animate-in fade-in zoom-in font-black">
            <button onClick={() => onSelect(trip)} className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-95 transition-all">
              <div className="w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl font-black">{trip.emoji}</div>
              <div className="flex-1 font-black text-black font-black"><h4 className="text-lg font-black">{trip.title}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter font-black font-black font-black">{trip.startDate} ~ {trip.endDate}</p></div>
            </button>
            {user.loginCode === 'wayne' && <button onClick={() => { if(confirm('確定刪除？')) onDeleteTrip(trip.id); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg font-black font-black font-black">✕</button>}
          </div>
        ))}
      </div>

      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto font-black font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black font-black">
            <div className="flex justify-between items-center mb-8 font-black font-black"><h3 className="text-xl italic font-black font-black font-black">USER ADMIN</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar:''})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300 font-black font-black">+ NEW USER</button>
            <div className="space-y-4 font-black font-black font-black">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl font-black font-black">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm font-black font-black" />
                  <div className="flex-1 font-black font-black font-black">{m.name}<p className="text-[9px] opacity-30 font-black font-black">{m.loginCode}</p></div>
                  <button onClick={()=>setEditingMember(m)} className="text-xs text-blue-500 font-black font-black font-black">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <h3 className="text-center italic mb-8 uppercase font-black font-black font-black">Setup User</h3>
            <div className="flex flex-col items-center gap-6 mb-8 font-black">
              <img src={editingMember.avatar || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-md font-black" />
              <ImageUploader label="上傳相片" onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
            </div>
            <input placeholder="Name" value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black font-black font-black font-black" />
            <input placeholder="Login Code" value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none font-black font-black font-black font-black" />
            <div className="flex gap-4 font-black">
              <button onClick={()=>setEditingMember(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black font-black font-black">Cancel</button>
              <button onClick={()=>{
                const up = allMembers.some(m=>m.id===editingMember.id) ? allMembers.map(m=>m.id===editingMember.id?editingMember:m) : [...allMembers, editingMember];
                onUpdateMembers(up); setEditingMember(null);
              }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg font-black font-black italic">Save</button>
            </div>
            {editingMember.loginCode !== 'wayne' && allMembers.some(m=>m.id===editingMember.id) && (
              <button onClick={()=>{if(confirm('永久刪除？')){onUpdateMembers(allMembers.filter(m=>m.id!==editingMember.id));setEditingMember(null);}}} className="w-full mt-6 text-red-500 text-xs font-black font-black">✕ DELETE USER</button>
            )}
          </div>
        </div>
      )}

      {showAddTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[40px] shadow-2xl text-black font-black">
            <h3 className="text-xl mb-6 italic font-black font-black font-black font-black">SETUP NEW TRIP</h3>
            <input placeholder="旅程名稱" value={newTrip.title} onChange={e=>setNewTrip({...newTrip, title:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black border border-gray-100" />
            <div className="grid grid-cols-2 gap-4 mb-4 font-black font-black">
              <div><label className="text-[10px] text-gray-400 uppercase font-black">START</label><input type="date" value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none font-black" /></div>
              <div><label className="text-[10px] text-gray-400 uppercase font-black">END</label><input type="date" value={newTrip.endDate} onChange={e=>setNewTrip({...newTrip, endDate:e.target.value})} className="w-full p-3 bg-gray-50 rounded-xl text-xs outline-none font-black" /></div>
            </div>
            <label className="text-[10px] text-gray-400 block mb-2 font-black font-black">PARTICIPANTS</label>
            <div className="flex flex-wrap gap-2 mb-8 font-black font-black font-black font-black">
               {allMembers.map(m => (
                 <button key={m.id} onClick={() => {
                    const ids = newTrip.memberIds.includes(m.id) ? newTrip.memberIds.filter(id=>id!==m.id) : [...newTrip.memberIds, m.id];
                    setNewTrip({...newTrip, memberIds: ids});
                 }} className={`px-4 py-2 rounded-full text-xs transition-all font-black font-black ${newTrip.memberIds.includes(m.id) ? 'bg-[#5E9E8E] text-white' : 'bg-gray-100 text-gray-400'}`}>{m.name}</button>
               ))}
            </div>
            <div className="flex gap-4 font-black">
              <button onClick={() => setShowAddTrip(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button>
              <button onClick={() => { if(!newTrip.title) return alert('請填寫旅程名稱'); onAddTrip({...newTrip, id: Date.now().toString()}); setShowAddTrip(false); }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg font-black italic font-black font-black">Save Trip</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. 主程序 (補齊所有細節與編輯)
// ==========================================
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: any }) {
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

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [payMethod, setPayMethod] = useState('現金');
  const [editingExpenseId, setEditingExpenseId] = useState<number | null>(null);
  const [newJournal, setNewJournal] = useState({ id: null as number | null, content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', assigneeIds: [] as string[] });
  
  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });
  
  const [showFlightModal, setShowFlightModal] = useState<{show: boolean, type: 'add'|'edit', data?: Flight}>({show: false, type: 'add'});
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: 'EVA AIR', flightNo: 'BR116', fromCode: 'TPE', toCode: 'CTS', depTime: '09:30', arrTime: '14:20', duration: '3h 50m', date: '2026-01-10', baggage: '23kg', aircraft: 'B787-10' });
  const [editingBooking, setEditingBooking] = useState<BookingDoc | null>(null);

  const getMember = (id: string) => allMembers.find(m => m.id === id) || allMembers[0];

  useEffect(() => {
    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data) {
        const c = data.content;
        setRecords(c.records || []); setSchedules(c.schedules || {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[]});
        setTodos(c.todos || []); setJournals(c.journals || []); setFlights(c.flights || []); setBookings(c.bookings || []);
      }
    };
    loadCloudData();
  }, [tripData.id]);

  const syncToCloud = async (updatedFields: any) => {
    const fullData = { records, schedules, todos, journals, flights, bookings, ...updatedFields };
    await supabase.from('trips').upsert({ id: tripData.id, content: fullData });
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      {/* 頂部導航 */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer"><div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl font-black">←</div><h1 className="text-xl font-black text-[#5E9E8E] tracking-tighter italic uppercase">DUPI TRAVEL</h1></div>
        <div className="flex -space-x-2">
          {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(<div key={m.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-xl"><img src={m.avatar} className="w-full h-full object-cover" /></div>))}
        </div>
      </div>

      {/* 1. 行程 (修正點4: 儲存後清空) */}
      {activeTab === '行程' && (
        <div className="px-4 font-black">
          <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg"><h2 className="text-4xl font-black font-mono tracking-tighter">-5°C</h2><p className="text-sm italic uppercase tracking-widest text-black">Day {activeDay} · {tripDates[activeDay-1]}</p></div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar font-black">{[1,2,3,4,5,6,7,8].map(d=>(<button key={d} onClick={()=>setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all font-black ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105':'bg-white text-gray-400 border'}`}><span className="text-[10px] font-black">{tripDates[d-1]}</span><span className="text-xl font-black">{d}</span></button>))}</div>
          <div className="mt-6 relative">
            <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
            {(schedules[activeDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(item=>(
              <div key={item.id} className="flex gap-4 mb-8 relative group"><div className="w-10 flex flex-col items-center shrink-0"><div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm font-black"></div><span className="text-[10px] text-gray-400 mt-2 font-mono font-black font-black">{item.time}</span></div>
              <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 min-h-[100px] font-black"><h4 className="font-black text-sm mb-1">{item.icon} {item.title}</h4><p className="text-[10px] leading-relaxed opacity-60 mb-6 font-black font-black">{item.desc}</p>
              <div className="absolute bottom-3 right-4 flex gap-4 font-black">
                <button onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`)} className="text-[#5E9E8E] text-[10px] font-black italic tracking-tighter uppercase font-black">MAP</button>
                {user.loginCode==='wayne' && (<><button onClick={()=>{setPlanForm(item); setShowPlanModal({show:true,type:'edit',data:item});}} className="text-xs text-blue-400 font-black">🖋️</button><button onClick={()=>{if(confirm('刪除？')){const n=(schedules[activeDay]||[]).filter(p=>p.id!==item.id);const up:ScheduleData={...schedules,[activeDay]:n};setSchedules(up);syncToCloud({schedules:up});}}} className="text-xs text-red-500 font-black">🗑️</button></>)}
              </div></div></div>
            ))}
            {user.loginCode==='wayne' && (<button onClick={()=> { setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'}); setShowPlanModal({show:true,type:'add'}); }} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black bg-white/50 tracking-tighter font-black font-black">+ ADD NEW STOP</button>)}
          </div>
        </div>
      )}

      {/* 2. 預訂 (修正點3: 質感機票完整欄位 + 修正點2: 憑證編輯) */}
      {activeTab === '預訂' && (
        <div className="px-4 font-black">
          <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border text-black font-black font-black">{['機票','憑證'].map(t=>(<button key={t} onClick={()=>setBookSubTab(t as any)} className={`flex-1 py-2 rounded-full text-sm font-black transition-all font-black ${bookSubTab===t?'bg-[#86A760] text-white shadow-md':'text-gray-300'}`}>{t}</button>))}</div>
          {bookSubTab==='機票' && (
            <div className="space-y-10 font-black text-black font-black font-black font-black">{flights.map(f=>(
              <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50 relative font-black">
                <div className="bg-[#f8faff] p-8 pb-10 border-b border-dashed border-blue-100 relative text-center text-black font-black font-black font-black font-black font-black font-black"><div className="flex justify-between mb-6 font-black font-black font-black font-black font-black font-black"><span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[11px] font-black uppercase italic shadow-sm font-black">{f.airline}</span><button onClick={()=>{if(confirm('刪除？')){const n=flights.filter(i=>i.id!==f.id);setFlights(n);syncToCloud({flights:n});}}} className="text-xs opacity-20 font-black">🗑️</button></div><h2 className="text-6xl text-black font-black tracking-tighter uppercase italic font-black font-black">{f.flightNo}</h2><div className="absolute -left-4 bottom-[-16px] w-8 h-8 bg-[#F9F8F3] rounded-full z-10 border border-blue-50"></div><div className="absolute -right-4 bottom-[-16px] w-8 h-8 bg-[#F9F8F3] rounded-full z-10 border border-blue-50"></div></div>
                <div className="p-8 pt-12 text-center font-black text-black font-black font-black font-black font-black"><div className="flex justify-between mb-10 font-black font-black font-black"><div><p className="text-4xl font-black font-black font-black">{f.fromCode}</p><p className="text-blue-600 text-xl font-mono font-black font-black">{f.depTime}</p></div><div className="flex-1 px-4 flex flex-col items-center font-black font-black font-black"><p className="text-[9px] italic opacity-30 uppercase font-black font-black">{f.duration}</p><div className="w-full h-[2px] bg-blue-50 relative flex justify-center items-center font-black"><span className="text-blue-400 text-xl transform rotate-90 font-black font-black">✈️</span></div><p className="text-[10px] mt-3 font-black font-black">{f.date}</p></div><div><p className="text-4xl font-black font-black font-black">{f.toCode}</p><p className="text-blue-600 text-xl font-mono font-black font-black">{f.arrTime}</p></div></div><div className="grid grid-cols-2 gap-4 border-t border-dashed pt-8 border-gray-100 font-black font-black font-black font-black"><div className="bg-[#f0f4ff]/50 p-4 rounded-[24px] text-center shadow-inner font-black font-black"><p className="text-[9px] text-blue-300 uppercase italic mb-1 tracking-widest font-black font-black font-black font-black">Baggage: {f.baggage}</p></div><div className="bg-[#f0f4ff]/50 p-4 rounded-[24px] text-center shadow-inner font-black font-black font-black font-black"><p className="text-[9px] text-blue-300 uppercase italic mb-1 tracking-widest font-black font-black font-black font-black">Aircraft: {f.aircraft}</p></div></div></div>
              </div>
            ))}<button onClick={()=>setShowFlightModal({show:true,type:'add'})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-[32px] text-gray-400 font-black tracking-widest uppercase text-black font-black font-black font-black shadow-inner">+ ADD FLIGHT INFO</button></div>
          )}
          {bookSubTab==='憑證' && (
            <div className="space-y-6 font-black text-black font-black font-black">
              {bookings.map(b=>(<div key={b.id} className="bg-white rounded-[32px] p-6 shadow-xl border border-gray-50 mb-4 font-black font-black font-black"><div className="flex justify-between items-start mb-4 font-black font-black font-black font-black font-black"><h4 className="font-black text-black bg-orange-50 px-3 py-1 rounded-full text-xs italic font-black font-black font-black font-black font-black">🎫 {b.title}</h4><div className="flex gap-4 font-black font-black font-black"><button onClick={()=>setEditingBooking(b)} className="text-xs text-blue-400 font-black font-black">🖋️</button><button onClick={()=>{if(confirm('刪除？')){const n=bookings.filter(i=>i.id!==b.id);setBookings(n);syncToCloud({bookings:n});}}} className="text-xs text-red-400 font-black font-black font-black font-black font-black">🗑️</button></div></div>{b.image && <img src={b.image} className="w-full rounded-[24px] shadow-lg border border-gray-100 font-black font-black" />}</div>))}
              <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center font-black text-black font-black font-black font-black"><p className="text-xs opacity-30 mb-4 font-black">拍照上傳門票或電子憑證</p><ImageUploader label="上傳相片" onUpload={(b64)=>{const title=prompt("名稱:"); if(title){const n=[{id:Date.now(),type:'憑證',title,image:b64},...bookings];setBookings(n);syncToCloud({bookings:n});}}} /></div>
            </div>
          )}
        </div>
      )}

      {/* 3. 記帳 (含人名統計) */}
      {activeTab === '記帳' && (
        <div className="px-4 font-black">
          <div className="grid grid-cols-2 gap-3 mb-4 font-black text-black font-black font-black font-black">
            {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => (
              <div key={m.id} className="bg-white p-4 rounded-3xl shadow-sm border border-[#E0F2F1] font-black"><p className="text-[10px] text-black font-black uppercase italic font-black">{m.name} PAID</p><p className="text-lg text-[#5E9E8E] font-mono tracking-tighter font-black font-black">NT$ {records.filter(r=>r.payerId===m.id).reduce((s,r)=>s+Number(r.twdAmount),0).toLocaleString()}</p></div>
            ))}
          </div>
          <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md font-black italic font-black font-black font-black font-black"><p className="text-sm opacity-90 uppercase tracking-widest text-black font-black font-black">TOTAL POOL</p><h2 className="text-4xl font-mono text-black font-black font-black">NT$ {records.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h2></div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black font-black font-black font-black"><input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容..." className="w-full p-4 bg-[#F2F1EB] rounded-2xl mb-4 outline-none font-black text-black border-none shadow-inner font-black" /><div className="grid grid-cols-2 gap-4 mb-4 font-black font-black font-black"><input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="JPY" className="w-full p-4 bg-[#F2F1EB] rounded-2xl outline-none text-[#5E9E8E] font-black shadow-inner font-black font-black" /><select value={expensePayerId} onChange={e=>setExpensePayerId(e.target.value)} className="w-full p-4 bg-[#F2F1EB] rounded-2xl outline-none font-black shadow-inner font-black font-black">{allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select></div>
          <button onClick={()=>{if(!category||!amount)return;const rec={id:editingExpenseId||Date.now(),category,amount,currency:'JPY',twdAmount:(Number(amount)*JPY_TO_TWD).toFixed(0),payMethod,payerId:expensePayerId,date:tripDates[activeDay-1]};const n=editingExpenseId?records.map(r=>r.id===editingExpenseId?rec:r):[rec,...records];setRecords(n);syncToCloud({records:n});setAmount('');setCategory('');setEditingExpenseId(null);}} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic font-black font-black font-black">Save Record</button></div>
          <div className="space-y-3 pb-10 font-black font-black">{records.map(r=>(<div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50 pr-24 relative font-black font-black font-black"><div className="flex items-center gap-3 font-black font-black"><img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full object-cover shadow-sm font-black font-black" /><div className="text-xs font-black font-black font-black font-black">{r.category}<p className="text-[9px] opacity-40 font-mono italic font-black font-black font-black font-black">{getMember(r.payerId).name} · {r.date}</p></div></div><div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black font-black font-black font-black">{r.amount} JPY</div><div className="absolute right-3 flex gap-4 font-black font-black font-black font-black"><button onClick={()=>{setEditingExpenseId(r.id);setCategory(r.category);setAmount(r.amount);setExpensePayerId(r.payerId);window.scrollTo(0,0);}} className="text-xs text-blue-400 font-black">🖋️</button><button onClick={()=>{if(confirm('刪除？')){const n=records.filter(i=>i.id!==r.id);setRecords(n);syncToCloud({records:n});}}} className="text-xs text-red-400 font-black font-black font-black font-black font-black">🗑️</button></div></div>))}</div>
        </div>
      )}

      {/* 5. 準備事項 (修正點5: 顏色加強 + 確認視窗) */}
      {activeTab === '準備' && (
        <div className="px-4 font-black">
          <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border text-black font-black font-black font-black font-black">{['待辦','行李','採購'].map(t=>(<button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-2 rounded-full text-sm font-black transition-all font-black ${prepSubTab===t?'bg-[#86A760] text-white shadow-md scale-105 font-black':'text-gray-300 font-black'}`}>{t}</button>))}</div>
          <div className="bg-white rounded-[32px] p-6 shadow-sm mb-8 border relative font-black text-black shadow-lg font-black"><input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput,task:e.target.value})} placeholder={`新增事項...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner border-none font-black font-black" /><div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar font-black font-black font-black">{allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(<button key={m.id} onClick={()=>{const ids=newTodoInput.assigneeIds.includes(m.id)?newTodoInput.assigneeIds.filter(i=>i!==m.id):[...newTodoInput.assigneeIds,m.id];setNewTodoInput({...newTodoInput,assigneeIds:ids});}} className={`p-2 px-3 rounded-xl border text-[10px] font-black transition-all font-black ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-inner scale-110 font-black':'bg-gray-100 text-gray-400 font-black'}`}>{m.name}</button>))}</div><button onClick={()=>{if(!newTodoInput.task||newTodoInput.assigneeIds.length===0)return alert("請輸入內容並指派成員");const n=[{id:Date.now(),task:newTodoInput.task,assigneeIds:newTodoInput.assigneeIds,completedAssigneeIds:[],category:prepSubTab},...todos];setTodos(n);syncToCloud({todos:n});setNewTodoInput({task:'',assigneeIds:[]});}} className="w-full py-3 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic font-black font-black font-black font-black">Sync</button></div>
          <div className="space-y-4 font-black">{todos.filter(t=>t.category===prepSubTab).map(todo=>(<div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-100 relative font-black text-black shadow-md font-black font-black"><div className="flex gap-2 mb-4 font-black font-black font-black">{todo.assigneeIds.map(id=>{const m=getMember(id); const isDone=todo.completedAssigneeIds.includes(id); return(<button key={id} onClick={()=>{if(confirm(`確認「${m.name}」已完成「${todo.task}」？`)){const nComp=isDone?todo.completedAssigneeIds.filter(cid=>cid!==id):[...todo.completedAssigneeIds,id];const n=todos.map(t=>t.id===todo.id?{...t,completedAssigneeIds:nComp}:t);setTodos(n);syncToCloud({todos:n});}}} className={`px-4 py-1.5 rounded-full text-[10px] font-black transition-all font-black ${isDone?'bg-green-700 text-white shadow-inner':'bg-gray-200 text-gray-500 font-black font-black'}`}>{m?.name} {isDone&&"✅"}</button>);})}</div><div className="flex justify-between items-center font-black font-black"><h4 className={`text-sm ${todo.completedAssigneeIds.length===todo.assigneeIds.length?'line-through text-gray-300 opacity-40 font-black font-black':'font-black font-black font-black'}`}>{todo.task}</h4><div className="flex gap-4 font-black font-black"><button onClick={()=>{const n=prompt("編輯:", todo.task); if(n){const up=todos.map(t=>t.id===todo.id?{...t,task:n}:t);setTodos(up);syncToCloud({todos:up});}}} className="text-xs text-blue-600 font-black font-black font-black font-black font-black">🖋️</button><button onClick={()=>{if(confirm('移除？')){const n=todos.filter(t=>t.id!==todo.id);setTodos(n);syncToCloud({todos:n});}}} className="text-red-600 font-black text-sm font-black font-black font-black font-black font-black">🗑️</button></div></div></div>))}</div>
        </div>
      )}

      {/* 底部導航 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50 text-black font-black">
        {[{id:'行程',icon:'📅'},{id:'預訂',icon:'📔'},{id:'記帳',icon:'👛'},{id:'日誌',icon:'🖋️'},{id:'準備',icon:'💼'},{id:'成員',icon:'👥'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 font-black ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1':'opacity-25 font-black'}`}><span className="text-2xl font-black">{tab.icon}</span><span className="text-[10px] font-black uppercase font-black">{tab.id}</span></button>
        ))}
      </div>

      {/* 彈窗 Logic */}
      {editingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[110] p-8 flex items-center justify-center font-black"><div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black"><h3 className="text-xl mb-8 italic uppercase text-center font-black">Edit Voucher</h3><input value={editingBooking.title} onChange={e=>setEditingBooking({...editingBooking, title:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none font-black font-black font-black" /><div className="flex gap-4 font-black font-black"><button onClick={()=>setEditingBooking(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black font-black font-black font-black">Cancel</button><button onClick={()=>{const n=bookings.map(b=>b.id===editingBooking.id?editingBooking:b); setBookings(n); syncToCloud({bookings:n}); setEditingBooking(null);}} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg font-black italic font-black font-black">Update</button></div></div></div>
      )}

      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end font-black font-black"><div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom text-black font-black font-black"><h3 className="text-2xl mb-8 italic text-[#5E9E8E] uppercase tracking-tighter font-black font-black">Edit Stop</h3><div className="flex gap-3 mb-6 font-black shadow-inner bg-gray-50 rounded-2xl p-2 font-black font-black font-black font-black"><select className="flex-1 p-4 bg-transparent outline-none font-black text-xl font-black font-black" value={planForm.time.split(':')[0]} onChange={e=>setPlanForm({...planForm,time:`${e.target.value}:${planForm.time.split(':')[1]}`})}>{Array.from({length: 24}).map((_,i)=><option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} 點</option>)}</select><select className="flex-1 p-4 bg-transparent outline-none font-black text-xl font-black font-black" value={planForm.time.split(':')[1]} onChange={e=>setPlanForm({...planForm,time:`${planForm.time.split(':')[0]}:${e.target.value}`})}>{['00','10','20','30','40','50'].map(m=><option key={m} value={m}>{m} 分</option>)}</select></div><input placeholder="要去哪裡？" value={planForm.title} onChange={e=>setPlanForm({...planForm,title:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-4 outline-none text-xl shadow-inner border-none font-black font-black font-black" /><textarea placeholder="備註..." value={planForm.desc} onChange={e=>setPlanForm({...planForm,desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm h-32 leading-relaxed shadow-inner border-none font-black font-black font-black" /><div className="flex gap-4 font-black font-black"><button onClick={()=>setShowPlanModal({show:false,type:'add'})} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black font-black uppercase font-black">Cancel</button><button onClick={()=>{if(!planForm.title)return alert("必填");const dPlans=schedules[activeDay]||[];const n:Plan[]=showPlanModal.type==='add'?[...dPlans,{...planForm,id:Date.now()}]:dPlans.map(p=>p.id===showPlanModal.data?.id?{...planForm,id:p.id}:p);const up:ScheduleData={...schedules,[activeDay]:n};setSchedules(up);syncToCloud({schedules:up});setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'}); setShowPlanModal({show:false,type:'add'});}} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-xl italic uppercase tracking-widest font-black font-black font-black font-black">Save Stop</button></div></div></div>
      )}

      {showFlightModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end font-black font-black font-black"><div className="bg-white w-full p-8 rounded-t-[48px] max-h-[90vh] overflow-y-auto font-black font-black font-black font-black font-black font-black shadow-2xl font-black"><h3 className="text-2xl font-black mb-8 text-blue-500 italic uppercase font-black font-black font-black font-black font-black font-black font-black">Flight Setup</h3><input placeholder="航空" value={flightForm.airline} onChange={e=>setFlightForm({...flightForm,airline:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 border-none shadow-inner font-black font-black font-black font-black font-black" /><input placeholder="航班號" value={flightForm.flightNo} onChange={e=>setFlightForm({...flightForm,flightNo:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none text-2xl font-black shadow-inner font-black font-black font-black font-black font-black" /><div className="grid grid-cols-2 gap-4 mb-4 font-black font-black font-black font-black font-black font-black font-black"><div className="bg-gray-50 p-4 rounded-2xl shadow-inner font-black font-black font-black font-black font-black"><label className="text-[9px] text-gray-400 block mb-1 uppercase tracking-widest font-black font-black font-black font-black font-black">Dep Code</label><input placeholder="TPE" value={flightForm.fromCode} onChange={e=>setFlightForm({...flightForm,fromCode:e.target.value})} className="w-full bg-transparent text-2xl outline-none font-black font-black font-black font-black font-black font-black" /></div><div className="bg-gray-50 p-4 rounded-2xl shadow-inner font-black font-black font-black font-black font-black font-black font-black"><label className="text-[9px] text-gray-400 block mb-1 uppercase tracking-widest font-black font-black font-black font-black font-black">Arr Code</label><input placeholder="CTS" value={flightForm.toCode} onChange={e=>setFlightForm({...flightForm,toCode:e.target.value})} className="w-full bg-transparent text-2xl outline-none font-black font-black font-black font-black font-black font-black" /></div></div><div className="grid grid-cols-2 gap-4 mb-8 font-black font-black font-black font-black font-black font-black font-black"><div className="bg-gray-50 p-4 rounded-2xl shadow-inner font-black font-black font-black font-black font-black font-black font-black font-black"><label className="text-[9px] text-gray-400 block mb-1 uppercase tracking-widest font-black font-black font-black font-black font-black font-black font-black">Dep Time</label><input type="time" value={flightForm.depTime} onChange={e=>setFlightForm({...flightForm,depTime:e.target.value})} className="w-full bg-transparent text-xl outline-none font-black font-black font-black font-black font-black font-black" /></div><div className="bg-gray-50 p-4 rounded-2xl shadow-inner font-black font-black font-black font-black font-black font-black font-black font-black"><label className="text-[9px] text-gray-400 block mb-1 uppercase tracking-widest font-black font-black font-black font-black font-black font-black font-black">Arr Time</label><input type="time" value={flightForm.arrTime} onChange={e=>setFlightForm({...flightForm,arrTime:e.target.value})} className="w-full bg-transparent text-xl outline-none font-black font-black font-black font-black font-black font-black font-black font-black" /></div></div><div className="flex gap-4 pb-12 mt-4 font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black"><button onClick={()=>setShowFlightModal({show:false,type:'add'})} className="flex-1 py-4 bg-gray-100 text-gray-400 rounded-3xl uppercase font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black">Cancel</button><button onClick={()=>{const n=[{...flightForm,id:Date.now()},...flights];setFlights(n);syncToCloud({flights:n});setShowFlightModal({show:false,type:'add'});}} className="flex-1 py-4 bg-blue-500 text-white rounded-3xl shadow-xl italic uppercase tracking-widest font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black font-black">Confirm</button></div></div></div>
      )}
    </div>
  );
}

export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const m = localStorage.getItem('members_v43'); const t = localStorage.getItem('trips_v43');
    if (m) setAllMembers(JSON.parse(m)); else setAllMembers([{id:'1',name:'肚皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=wayne',loginCode:'wayne'},{id:'2',name:'豆豆皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=elvina',loginCode:'Elvina'}]);
    if (t) setAllTrips(JSON.parse(t)); else setAllTrips([{id:'hokkaido2026',title:'2026 北海道之旅',startDate:'2026-01-10',endDate:'2026-01-17',emoji:'☃️',memberIds:['1','2']}]);
  }, []);

  useEffect(() => { localStorage.setItem('members_v43', JSON.stringify(allMembers)); localStorage.setItem('trips_v43', JSON.stringify(allTrips)); }, [allMembers, allTrips]);

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  if (!selectedTrip) return <TripSelector user={user} allTrips={allTrips} allMembers={allMembers} onSelect={setSelectedTrip} onAddTrip={(t: Trip)=>setAllTrips([...allTrips, t])} onDeleteTrip={(id: string)=>setAllTrips(allTrips.filter(t=>t.id!==id))} onUpdateMembers={setAllMembers} />;
  return <MainApp user={user} tripData={selectedTrip} allMembers={allMembers} onUpdateMembers={setAllMembers} onBack={() => setSelectedTrip(null)} />;
}