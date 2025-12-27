"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase 初始化 ---
const supabase = createClient(
  'https://oqfysuuoxduginkfgggg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnlzdXVveGR1Z2lua2ZnZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDUxNjgsImV4cCI6MjA4MjIyMTE2OH0.igtMj90ihFLc3RIP0UGzXcUBxx4E16xMa9_HQcSfju8'
);

// --- 型別定義 ---
interface Member { id: string; name: string; avatar: string; loginCode: string; editLogs: string[]; }
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

// --- 輔助組件：圖片上傳 ---
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
      <button onClick={() => fileInput.current?.click()} className="text-[10px] bg-gray-100 px-3 py-2 rounded-xl font-black text-black shadow-sm active:scale-95 transition-all">📷 {label}</button>
      <input type="file" ref={fileInput} onChange={handleFile} accept="image/*" className="hidden" />
    </div>
  );
}

// 1. 登錄頁面
function LoginPage({ onLogin, allMembers }: { onLogin: (m: Member) => void, allMembers: Member[] }) {
  const [input, setInput] = useState('');
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] mb-8 flex items-center justify-center text-4xl shadow-xl animate-bounce">❄️</div>
      <h1 className="text-3xl font-black text-black mb-2 italic uppercase tracking-tighter">Dupi Travel</h1>
      <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ENTER CODE..." className="w-full max-w-xs p-5 bg-white rounded-[24px] mb-4 font-black text-black outline-none shadow-sm border border-gray-100 focus:border-[#86A760] transition-colors" />
      <button onClick={() => {
        const found = allMembers.find(m => m.loginCode === input);
        if (found) onLogin(found); else alert('❌ 查無代碼');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg active:scale-95 transition-transform">LOGIN</button>
    </div>
  );
}

// 2. 行政管理
function TripSelector({ user, onSelect, allTrips, onAddTrip, onDeleteTrip, allMembers, onUpdateMembers }: { user: Member, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: any, onDeleteTrip: any, allMembers: Member[], onUpdateMembers: any }) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newTrip, setNewTrip] = useState<Trip>({ id: '', title: '', startDate: '2026-01-10', endDate: '2026-01-17', emoji: '☃️', memberIds: [user.id] });

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32">
      <div className="flex justify-between items-center mb-12">
        <div className="font-black">
          <p className="text-xs text-gray-400 uppercase tracking-widest">Admin Mode,</p>
          <h2 className="text-2xl text-black">{user.name}</h2>
        </div>
        <div onClick={() => setShowUserAdmin(true)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer active:scale-90 transition-transform">
          <img src={user.avatar} className="w-full h-full object-cover" />
        </div>
      </div>

      <div className="flex justify-between items-center mb-6 font-black">
        <h3 className="text-sm text-[#5E9E8E] uppercase italic">My Trips</h3>
        {user.loginCode === 'wayne' && (
          <button onClick={() => setShowAddTrip(true)} className="text-[10px] bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">+ NEW TRIP</button>
        )}
      </div>

      <div className="space-y-6">
        {allTrips.map(trip => (
          <div key={trip.id} className="relative font-black">
            <button onClick={() => onSelect(trip)} className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-95 transition-all">
              <div className="w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl">{trip.emoji}</div>
              <div className="flex-1"><h4 className="text-lg text-black">{trip.title}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{trip.startDate} ~ {trip.endDate}</p></div>
            </button>
            {user.loginCode === 'wayne' && <button onClick={() => { if(confirm('確定刪除？')) onDeleteTrip(trip.id); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg font-black">✕</button>}
          </div>
        ))}
      </div>

      {showAddTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
             <h3 className="text-xl mb-6 italic uppercase tracking-tighter">Setup New Trip</h3>
             <input placeholder="Trip Title (e.g. 2026 Tokyo)" value={newTrip.title} onChange={e=>setNewTrip({...newTrip, title:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-100" />
             <div className="grid grid-cols-2 gap-4 mb-4">
               <input type="date" value={newTrip.startDate} onChange={e=>setNewTrip({...newTrip, startDate:e.target.value})} className="p-4 bg-gray-50 rounded-2xl text-xs outline-none" />
               <input type="date" value={newTrip.endDate} onChange={e=>setNewTrip({...newTrip, endDate:e.target.value})} className="p-4 bg-gray-50 rounded-2xl text-xs outline-none" />
             </div>
             <p className="text-[10px] opacity-30 mb-2">PARTICIPANTS</p>
             <div className="flex flex-wrap gap-2 mb-8">
                {allMembers.map(m => (
                  <button key={m.id} onClick={()=>{
                    const ids = newTrip.memberIds.includes(m.id) ? newTrip.memberIds.filter(id=>id!==m.id) : [...newTrip.memberIds, m.id];
                    setNewTrip({...newTrip, memberIds: ids});
                  }} className={`px-4 py-2 rounded-full text-[10px] transition-all ${newTrip.memberIds.includes(m.id) ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}>{m.name}</button>
                ))}
             </div>
             <div className="flex gap-4">
                <button onClick={()=>setShowAddTrip(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl">Cancel</button>
                <button onClick={()=>{
                  if(!newTrip.title) return alert("Please enter trip title");
                  onAddTrip({...newTrip, id: Date.now().toString()});
                  setShowAddTrip(false);
                  setNewTrip({id:'', title:'', startDate:'2026-01-10', endDate:'2026-01-17', emoji:'☃️', memberIds:[user.id]});
                }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic">Create Trip</button>
             </div>
          </div>
        </div>
      )}

      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <div className="flex justify-between items-center mb-8 italic"><h3 className="text-xl">USER ADMIN</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar:'', editLogs:[]})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300">+ NEW USER</button>
            <div className="space-y-4">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl shadow-sm">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1 font-black">{m.name}<p className="text-[9px] opacity-30 tracking-widest uppercase">Logs: {m.editLogs?.length || 0}</p></div>
                  <button onClick={()=>setEditingMember(m)} className="text-xs text-blue-500">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. 主程式元件
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

  const [weatherData, setWeatherData] = useState({ temp: -8, pop: 15, precip: 0.8, advice: "極寒！請備好發熱衣與暖暖包。" });
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [payMethod, setPayMethod] = useState('現金'); 
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [newJournal, setNewJournal] = useState({ content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', assigneeIds: [] as string[] });
  
  // 編輯狀態
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });

  const [showFlightModal, setShowFlightModal] = useState<{show: boolean, type: 'add'|'edit', data?: Flight | null}>({show: false, type: 'add', data: null});
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '', arrTime: '', duration: '', date: '', baggage: '', aircraft: '' });

  useEffect(() => {
    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data?.content) {
        const c = data.content;
        setRecords(c.records || []); 
        setSchedules(c.schedules || {1:[],2:[],3:[],4:[],5:[],6:[],7:[],8:[]});
        setTodos(c.todos || []); 
        setJournals(c.journals || []);
        setFlights(c.flights || []); 
        setBookings(c.bookings || []);
      }
    };
    loadCloudData();
  }, [tripData.id]);

  useEffect(() => {
    const temps = [-8, -5, -2, 0, -3, -6, -4, -1];
    const pops = [15, 80, 45, 20, 95, 30, 10, 65];
    const t = temps[activeDay-1] || 0;
    const p = pops[activeDay-1] || 0;
    setWeatherData({
      temp: t, pop: p, precip: Number((p/20).toFixed(1)),
      advice: t < 0 ? "極寒！請備好發熱衣與暖暖包。" : "氣溫較低，建議穿著保暖外套並注意防風。"
    });
  }, [activeDay]);

  const sync = async (update: any) => {
    const full = { records, schedules, todos, journals, flights, bookings, ...update };
    await supabase.from('trips').upsert({ id: tripData.id, content: full });
  };

  const getMember = (id: string) => allMembers.find(m => m.id === id) || allMembers[0];

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      {/* 頂部導航 */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">←</div>
          <h1 className="text-xl italic uppercase text-[#5E9E8E] tracking-tighter">DUPI TRAVEL</h1>
        </div>
        <div className="flex -space-x-2">
          {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
            <div key={m.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-md">
              <img src={m.avatar} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4 mt-4">
        {activeTab === '行程' && (
          <div className="animate-in fade-in">
            <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden">
                <h2 className="text-5xl font-mono tracking-tighter">{weatherData.temp}°C</h2>
                <div className="flex justify-between items-end mt-2">
                    <p className="text-[10px] uppercase opacity-60 font-black">Rain: {weatherData.pop}% | {weatherData.precip}mm</p>
                    <p className="text-[10px] bg-white/20 px-3 py-1 rounded-full italic shadow-sm">💡 {weatherData.advice}</p>
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {[1,2,3,4,5,6,7,8].map(d=>(
                  <button key={d} onClick={()=>setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105':'bg-white text-gray-400 border border-gray-100'}`}>
                    <span className="text-[10px]">{tripDates[d-1]}</span>
                    <span className="text-xl">{d}</span>
                  </button>
                ))}
            </div>
            <div className="mt-8 space-y-8 relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
                {(schedules[activeDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(item=>(
                    <div key={item.id} className="flex gap-4 relative">
                        <div className="w-10 flex flex-col items-center shrink-0">
                            <div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm"></div>
                            <span className="text-[10px] text-gray-400 mt-2 font-mono">{item.time}</span>
                        </div>
                        <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 relative group">
                            <h4 className="font-black text-sm">{item.icon} {item.title}</h4>
                            <p className="text-[10px] opacity-40 mt-1 leading-relaxed">{item.desc}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`, '_blank'); }} className="text-[10px] bg-gray-50 text-[#5E9E8E] px-3 py-1.5 rounded-full font-black shadow-inner active:scale-95">📍 GOOGLE MAP</button>
                                {user.loginCode==='wayne' && (
                                    <div className="flex gap-3 z-20">
                                        <button onClick={(e)=>{e.stopPropagation(); setPlanForm(item); setShowPlanModal({show:true,type:'edit',data:item});}} className="text-xs text-blue-400 bg-blue-50 p-2 rounded-xl active:scale-90 transition-transform">🖋️</button>
                                        <button onClick={(e)=>{e.stopPropagation(); if(confirm('確定刪除？')){const n=(schedules[activeDay]||[]).filter(p=>p.id!==item.id); const up={...schedules,[activeDay]:n}; setSchedules(up); sync({schedules:up});}}} className="text-xs text-red-400 bg-red-50 p-2 rounded-xl active:scale-90 transition-transform">🗑️</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
                {user.loginCode==='wayne' && (
                  <button onClick={()=> setShowPlanModal({show:true,type:'add'})} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black active:bg-gray-50">+ ADD NEW STOP</button>
                )}
            </div>
          </div>
        )}

        {activeTab === '預訂' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
                {['機票','憑證'].map(t=>(
                    <button key={t} onClick={()=>setBookSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${bookSubTab===t?'bg-[#E9C46A] text-white shadow-md scale-105':'text-gray-300'}`}>{t}</button>
                ))}
            </div>
            {bookSubTab === '機票' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center"><h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Flight Info</h3>{user.loginCode==='wayne' && <button onClick={()=>setShowFlightModal({show:true, type:'add', data:null})} className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full">+ ADD</button>}</div>
                {flights.map(f => (
                  <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50 relative p-6 font-black">
                    <div className="flex justify-between mb-4 border-b border-dashed pb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{f.airline}</span>
                      <h2 className="text-2xl font-black italic font-black">{f.flightNo}</h2>
                    </div>
                    <div className="flex justify-between text-center items-center font-black">
                      <div><p className="text-3xl font-black font-black">{f.fromCode}</p><p className="text-blue-600 font-mono text-sm font-black font-black">{f.depTime}</p></div>
                      <div className="flex-1 flex flex-col items-center opacity-30 font-black"><span className="text-[10px] uppercase font-black font-black font-black">{f.duration}</span><div className="w-full h-px bg-blue-100 my-1 relative font-black"><span className="absolute -top-2 left-1/2 -translate-x-1/2 font-black">✈️</span></div><p className="text-[10px] font-black">{f.date}</p></div>
                      <div><p className="text-3xl font-black font-black">{f.toCode}</p><p className="text-blue-600 font-mono text-sm font-black font-black">{f.arrTime}</p></div>
                    </div>
                    {user.loginCode==='wayne' && (
                      <div className="flex gap-3 justify-end mt-4">
                        <button onClick={()=>{setFlightForm(f); setShowFlightModal({show:true, type:'edit', data:f});}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('Delete?')){const n=flights.filter(i=>i.id!==f.id); setFlights(n); sync({flights:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Vouchers</h3>
                {bookings.map(b=>(
                  <div key={b.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-50 group relative">
                    <div className="flex justify-between mb-4"><h4 className="text-xs italic bg-orange-50 px-3 py-1 rounded-full font-black">🎫 {b.title}</h4>
                    {user.loginCode==='wayne' && (
                      <div className="flex gap-2">
                        <button onClick={()=>{const nt=prompt("Name:", b.title); if(nt){const n=bookings.map(i=>i.id===b.id?{...i, title:nt}:i); setBookings(n); sync({bookings:n});}}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('Delete?')){const n=bookings.filter(i=>i.id!==b.id); setBookings(n); sync({bookings:n});}}} className="text-red-300 text-xs">✕</button>
                      </div>
                    )}</div>
                    {b.image && <img src={b.image} className="w-full rounded-[24px] shadow-lg" />}
                  </div>
                ))}
                <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center font-black">
                  <ImageUploader label="UPLOAD VOUCHER" onUpload={(b64)=>{const title=prompt("Name:"); if(title){const n=[{id:Date.now(), type:'憑證', title, image:b64}, ...bookings]; setBookings(n); sync({bookings:n});}}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 記帳] - 需求 1 修正按鈕顏色 --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in pb-20 font-black">
            <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md italic">
                <p className="text-sm opacity-90 uppercase tracking-widest font-black">Total Spent</p>
                <h2 className="text-4xl font-mono font-black font-black">NT$ {records.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h2>
                {amount && <p className="text-[10px] mt-2 opacity-50 font-black tracking-widest">Converting: {amount} JPY ≈ NT$ {(Number(amount)*JPY_TO_TWD).toFixed(0)} TWD</p>}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black">
                <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容..." className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none font-black shadow-inner" />
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  {['早餐','午餐','晚餐','交通','娛樂'].map(q=>(<button key={q} onClick={()=>setCategory(q)} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-500 font-black shrink-0 active:bg-gray-200">{q}</button>))}
                </div>
                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="金額 (JPY)" className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black shadow-inner mb-4" />
                
                <p className="text-[10px] opacity-30 mb-2 ml-2">PAY METHOD</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['現金','信用卡','Suica','PayPay'].map(p=>(
                    <button key={p} onClick={()=>setPayMethod(p)} className={`py-2 rounded-xl text-[10px] font-black transition-all ${payMethod===p?'bg-[#5E9E8E] text-white shadow-md':'bg-gray-100 text-gray-400'}`}>{p}</button>
                  ))}
                </div>

                <p className="text-[10px] opacity-30 mb-2 ml-2">PAYER</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 font-black">
                  {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
                    <button key={m.id} onClick={()=>setExpensePayerId(m.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 ${expensePayerId===m.id?'bg-blue-500 text-white shadow-md':'bg-gray-100 text-gray-400'}`}>
                      <img src={m.avatar} className="w-4 h-4 rounded-full font-black" /> {m.name}
                    </button>
                  ))}
                </div>

                <button onClick={()=>{
                    if(!category || !amount) return;
                    const rec = {id:editingRecordId || Date.now(), category, amount, currency:'JPY', twdAmount:(Number(amount)*JPY_TO_TWD).toFixed(0), payMethod, payerId:expensePayerId, date:tripDates[activeDay-1]};
                    const n = editingRecordId ? records.map(r=>r.id===editingRecordId?rec:r) : [rec, ...records]; 
                    setRecords(n); sync({records:n}); setAmount(''); setCategory(''); setEditingRecordId(null);
                }} className={`w-full py-4 rounded-2xl font-black shadow-lg uppercase italic font-black text-white ${editingRecordId ? 'bg-orange-500' : 'bg-[#86A760]'}`}>
                  {editingRecordId ? 'UPDATE' : 'SAVE'}
                </button>
                {editingRecordId && <button onClick={()=>{setEditingRecordId(null); setCategory(''); setAmount('');}} className="w-full mt-2 text-[10px] opacity-30 font-black">Cancel</button>}
            </div>

            <div className="space-y-3 font-black">
                {records.map(r=>(
                    <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border pr-12 relative group font-black">
                        <div className="flex items-center gap-3 font-black">
                            <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full shadow-sm font-black" />
                            <div className="text-xs font-black font-black">{r.category}<p className="text-[8px] opacity-40 font-mono italic font-black">{r.payMethod} · {getMember(r.payerId).name}</p></div>
                        </div>
                        <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black font-black">{r.amount} JPY<p className="text-[9px] text-gray-300 font-black">≈ NT$ {r.twdAmount}</p></div>
                        <div className="absolute right-4 flex flex-col gap-2 font-black">
                          <button onClick={()=>{setEditingRecordId(r.id); setCategory(r.category); setAmount(r.amount); setPayMethod(r.payMethod); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-300 text-[10px] font-black">🖋️</button>
                          <button onClick={()=>{if(confirm('Delete?')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="text-red-300 text-sm font-black font-black">✕</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === '日誌' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-orange-50 font-black">
                <textarea value={newJournal.content} onChange={e=>setNewJournal({...newJournal, content:e.target.value})} placeholder="記錄此刻的心情..." className="w-full bg-gray-50 p-4 rounded-2xl mb-4 outline-none min-h-[100px] font-black border-none shadow-inner font-black" />
                <div className="flex justify-between items-center">
                    <ImageUploader label="上傳照片" onUpload={img => setNewJournal({...newJournal, image: img})} />
                    <button onClick={()=>{
                        if(!newJournal.content) return;
                        const n = [{id:Date.now(), authorId:user.id, content:newJournal.content, image:newJournal.image, date:new Date().toLocaleString()}, ...journals];
                        setJournals(n); sync({journals:n}); setNewJournal({content:'', image:''});
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg italic font-black font-black">Share</button>
                </div>
            </div>
            <div className="space-y-6 font-black font-black">
              {journals.map(j => (
                  <div key={j.id} className="bg-white p-6 rounded-[32px] shadow-md border border-gray-50 animate-in slide-in-from-bottom-2 relative font-black font-black">
                      <div className="absolute top-6 right-6 flex gap-3 font-black">
                        <button onClick={()=>{const nt=prompt("Edit Content:", j.content); if(nt){const n=journals.map(i=>i.id===j.id?{...i, content:nt}:i); setJournals(n); sync({journals:n});}}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('Delete Log?')){const n=journals.filter(i=>i.id!==j.id); setJournals(n); sync({journals:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                      <div className="flex items-center gap-3 mb-4 font-black">
                          <img src={getMember(j.authorId).avatar} className="w-10 h-10 rounded-full border border-gray-100 font-black font-black" />
                          <div><p className="text-sm font-black text-black font-black font-black font-black font-black">{getMember(j.authorId).name}</p><p className="text-[9px] opacity-30 italic font-mono uppercase tracking-widest font-black font-black">{j.date}</p></div>
                      </div>
                      <p className="text-sm mb-4 leading-relaxed font-black text-gray-700 font-black">{j.content}</p>
                      {j.image && <img src={j.image} className="w-full rounded-[24px] shadow-sm border border-gray-100" />}
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 準備] - 需求 2 修正編輯邏輯 --- */}
        {activeTab === '準備' && (
          <div className="animate-in fade-in pb-20 font-black">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black font-black">
                {['待辦','行李','採購'].map(t=>(
                    <button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${prepSubTab===t?'bg-[#86A760] text-white shadow-md scale-105':'text-gray-300'}`}>{t}</button>
                ))}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black font-black">
                <input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput,task:e.target.value})} placeholder={`新增事項...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner border-none font-black" />
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2 font-black">
                    {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
                        <button key={m.id} onClick={()=>{
                            const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i=>i!==m.id) : [...newTodoInput.assigneeIds, m.id];
                            setNewTodoInput({...newTodoInput, assigneeIds: ids});
                        }} className={`p-2 px-4 rounded-xl border text-[10px] font-black transition-all font-black ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-inner scale-110 font-black':'bg-gray-100 text-gray-400'}`}>{m.name}</button>
                    ))}
                </div>
                <button onClick={()=>{
                    if(!newTodoInput.task || newTodoInput.assigneeIds.length === 0) return alert("Task and assignee required");
                    const nTodo = {id:editingTodoId || Date.now(), task:newTodoInput.task, assigneeIds:newTodoInput.assigneeIds, completedAssigneeIds:[], category:prepSubTab};
                    const n = editingTodoId ? todos.map(t=>t.id===editingTodoId ? nTodo : t) : [nTodo, ...todos];
                    setTodos(n); sync({todos:n}); setNewTodoInput({task:'', assigneeIds:[]}); setEditingTodoId(null);
                }} className={`w-full py-4 rounded-2xl font-black shadow-lg italic font-black text-white ${editingTodoId ? 'bg-orange-500' : 'bg-[#86A760]'}`}>
                  {editingTodoId ? 'UPDATE ITEM' : 'ADD ITEM'}
                </button>
                {editingTodoId && <button onClick={()=>{setEditingTodoId(null); setNewTodoInput({task:'', assigneeIds:[]});}} className="w-full mt-2 text-[10px] opacity-30 font-black">Cancel</button>}
            </div>

            <div className="space-y-4 font-black">
                {todos.filter(t=>t.category===prepSubTab).map(todo => (
                    <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-md border border-gray-100 flex justify-between items-center group font-black">
                        <div className="flex flex-col flex-1 pr-4 font-black">
                            <h4 className={`text-sm font-black transition-all font-black ${todo.completedAssigneeIds.length === todo.assigneeIds.length ? 'line-through opacity-20 text-gray-400' : 'text-black'}`}>{todo.task}</h4>
                            <div className="flex gap-2 mt-3 flex-wrap font-black">
                                {todo.assigneeIds.map(id => {
                                    const m = getMember(id);
                                    const isDone = todo.completedAssigneeIds.includes(id);
                                    return (
                                        <button key={id} onClick={() => {
                                            const question = isDone ? `Cancel ${m.name}'s finish?` : `Mark ${m.name} finished?`;
                                            if(!confirm(question)) return;
                                            const nComp = isDone ? todo.completedAssigneeIds.filter(cid=>cid!==id) : [...todo.completedAssigneeIds, id];
                                            const n = todos.map(t=>t.id===todo.id ? {...t, completedAssigneeIds: nComp} : t);
                                            setTodos(n); sync({todos:n});
                                        }} className={`text-[8px] px-3 py-1.5 rounded-full font-black shadow-sm transition-all font-black ${isDone ? 'bg-green-600 text-white font-black' : 'bg-gray-100 text-gray-500 font-black'}`}>{m?.name} {isDone && "✅"}</button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3 font-black font-black">
                            <button onClick={()=>{setEditingTodoId(todo.id); setNewTodoInput({task:todo.task, assigneeIds:todo.assigneeIds}); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-200 text-lg active:text-blue-400">🖋️</button>
                            <button onClick={()=>{if(confirm('Remove?')){const n=todos.filter(t=>t.id!==todo.id); setTodos(n); sync({todos:n});}}} className="text-red-200 text-lg active:text-red-400 font-black font-black">✕</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 成員] (完全不動) --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 pb-20 font-black font-black">
            <h3 className="text-[#5E9E8E] italic uppercase text-xs font-black mb-4 tracking-widest font-black">Trip Members</h3>
            {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => (
              <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-gray-50 font-black font-black font-black">
                <img src={m.avatar} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-md font-black" />
                <div className="flex-1 font-black">
                    <h4 className="text-lg text-black font-black font-black">{m.name}</h4>
                    <div className="mt-3 space-y-1.5 font-black">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black font-black">History Logs:</p>
                        {(m.editLogs || []).slice(-3).reverse().map((log, i) => (
                            <p key={i} className="text-[9px] opacity-40 italic tracking-tighter font-black">· {log}</p>
                        ))}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 行程編輯彈窗 (完全不動) */}
      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
            <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom font-black">
                <h3 className="text-2xl mb-8 italic text-[#5E9E8E] uppercase tracking-tighter font-black">Edit Travel Stop</h3>
                <div className="flex gap-3 mb-6 bg-gray-50 rounded-2xl p-2 shadow-inner">
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl font-black" value={planForm.time.split(':')[0]} onChange={e=>setPlanForm({...planForm,time:`${e.target.value}:${planForm.time.split(':')[1]}`})}>
                        {Array.from({length: 24}).map((_,i)=><option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} 點</option>)}
                    </select>
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl font-black" value={planForm.time.split(':')[1]} onChange={e=>setPlanForm({...planForm,time:`${planForm.time.split(':')[0]}:${e.target.value}`})}>
                        {['00','10','20','30','40','50'].map(m=><option key={m} value={m}>{m} 分</option>)}
                    </select>
                </div>
                <input placeholder="要去哪裡？" value={planForm.title} onChange={e=>setPlanForm({...planForm,title:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-4 outline-none text-xl shadow-inner border-none font-black font-black" />
                <textarea placeholder="備註或細節..." value={planForm.desc} onChange={e=>setPlanForm({...planForm,desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm h-32 leading-relaxed shadow-inner border-none font-black font-black" />
                <div className="flex gap-4">
                    <button onClick={()=>setShowPlanModal({show:false,type:'add'})} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black uppercase font-black">Cancel</button>
                    <button onClick={()=>{
                        if(!planForm.title) return alert("地點必填");
                        const dPlans = schedules[activeDay] || [];
                        const n = showPlanModal.type === 'add' ? [...dPlans, {...planForm, id: Date.now()}] : dPlans.map(p=>p.id===showPlanModal.data?.id ? {...planForm, id:p.id} : p);
                        const up = { ...schedules, [activeDay]: n };
                        setSchedules(up); sync({schedules:up}); 
                        setShowPlanModal({show:false,type:'add'}); 
                        setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'});
                    }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-xl italic uppercase font-black font-black">Save Stop</button>
                </div>
            </div>
        </div>
      )}

      {/* 底部 TabBar (完全不動) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50">
        {[{id:'行程',icon:'📅'},{id:'預訂',icon:'📔'},{id:'記帳',icon:'👛'},{id:'日誌',icon:'🖋️'},{id:'準備',icon:'💼'},{id:'成員',icon:'👥'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 font-black font-black ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1 font-black':'opacity-20 font-black'}`}>
            <span className="text-2xl font-black">{tab.icon}</span>
            <span className="text-[10px] uppercase font-black tracking-tighter font-black">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* 機票編輯彈窗 (完全不動) */}
      {showFlightModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl overflow-y-auto max-h-[90vh] font-black font-black">
            <h3 className="text-2xl mb-6 italic text-[#5E9E8E] uppercase tracking-tighter font-black font-black">{showFlightModal.type === 'add' ? 'Add' : 'Edit'} Flight</h3>
            <div className="space-y-4 font-black">
              <input placeholder="Airline" value={flightForm.airline} onChange={e=>setFlightForm({...flightForm, airline:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
              <input placeholder="Flight No." value={flightForm.flightNo} onChange={e=>setFlightForm({...flightForm, flightNo:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
              <div className="grid grid-cols-2 gap-4 font-black">
                <input placeholder="From" value={flightForm.fromCode} onChange={e=>setFlightForm({...flightForm, fromCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
                <input placeholder="To" value={flightForm.toCode} onChange={e=>setFlightForm({...flightForm, toCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
              </div>
              <div className="grid grid-cols-2 gap-4 font-black">
                <div><label className="text-[10px] ml-2 opacity-30">Dep Time</label><input type="time" value={flightForm.depTime} onChange={e=>setFlightForm({...flightForm, depTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black" /></div>
                <div><label className="text-[10px] ml-2 opacity-30">Arr Time</label><input type="time" value={flightForm.arrTime} onChange={e=>setFlightForm({...flightForm, arrTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black" /></div>
              </div>
              <input placeholder="Date (e.g. 01/10)" value={flightForm.date} onChange={e=>setFlightForm({...flightForm, date:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
              <input placeholder="Duration" value={flightForm.duration} onChange={e=>setFlightForm({...flightForm, duration:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-black" />
            </div>
            <div className="flex gap-4 mt-8">
              <button onClick={()=>setShowFlightModal({show:false, type:'add', data:null})} className="flex-1 py-4 bg-gray-100 rounded-3xl uppercase font-black font-black font-black">Cancel</button>
              <button onClick={()=>{
                const n = showFlightModal.type === 'add' ? [flightForm, ...flights] : flights.map(f=>f.id===showFlightModal.data?.id ? flightForm : f);
                setFlights(n); sync({flights:n}); setShowFlightModal({show:false, type:'add', data:null});
              }} className="flex-1 py-4 bg-blue-600 text-white rounded-3xl shadow-lg italic uppercase font-black font-black font-black">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. 入口點 (完全不動)
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const m = localStorage.getItem('members_v43'); 
    const t = localStorage.getItem('trips_v43');
    if (m) setAllMembers(JSON.parse(m)); 
    else setAllMembers([
      {id:'1',name:'肚皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=wayne',loginCode:'wayne', editLogs:['Account created']},
      {id:'2',name:'豆豆皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=elvina',loginCode:'Elvina', editLogs:['Account created']}
    ]);
    if (t) setSelectedTrips(JSON.parse(t)); 
    else setSelectedTrips([{id:'hokkaido2026',title:'2026 北海道之旅',startDate:'2026-01-10',endDate:'2026-01-17',emoji:'☃️',memberIds:['1','2']}]);
  }, []);

  useEffect(() => { 
    if(allMembers.length > 0) localStorage.setItem('members_v43', JSON.stringify(allMembers)); 
    if(selectedTrips.length > 0) localStorage.setItem('trips_v43', JSON.stringify(selectedTrips)); 
  }, [allMembers, selectedTrips]);

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  
  if (!selectedTrip) return (
    <TripSelector 
      user={user} 
      allTrips={selectedTrips} 
      allMembers={allMembers} 
      onSelect={setSelectedTrip} 
      onAddTrip={(t: Trip)=>setSelectedTrips([...selectedTrips, t])} 
      onDeleteTrip={(id: string)=>setSelectedTrips(selectedTrips.filter(t=>t.id!==id))} 
      onUpdateMembers={setAllMembers} 
    />
  );

  return (
    <MainApp 
      user={user} 
      tripData={selectedTrip} 
      allMembers={allMembers} 
      onUpdateMembers={setAllMembers} 
      onBack={() => setSelectedTrip(null)} 
    />
  );
}