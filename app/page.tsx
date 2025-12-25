"use client";

import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

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

// 1. 登錄頁面
function LoginPage({ onLogin, allMembers }: { onLogin: (m: Member) => void, allMembers: Member[] }) {
  const [input, setInput] = useState('');
  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-8 text-center font-sans">
      <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] mb-8 flex items-center justify-center text-4xl shadow-xl">❄️</div>
      <h1 className="text-3xl font-black text-black mb-2 italic uppercase tracking-tighter">Dupi Travel</h1>
      <input type="password" value={input} onChange={(e) => setInput(e.target.value)} placeholder="ENTER CODE..." className="w-full max-w-xs p-5 bg-white rounded-[24px] mb-4 font-black text-black outline-none shadow-sm" />
      <button onClick={() => {
        const found = allMembers.find(m => m.loginCode === input);
        if (found) onLogin(found); else alert('❌ 查無代碼');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg">LOGIN</button>
    </div>
  );
}

// 2. 旅行管理 (Admin)
function TripSelector({ user, onSelect, allTrips, onAddTrip, onDeleteTrip, allMembers, onUpdateMembers }: { user: Member, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: any, onDeleteTrip: any, allMembers: Member[], onUpdateMembers: any }) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [newTrip, setNewTrip] = useState<Trip>({ id: '', title: '', startDate: '2026-01-10', endDate: '2026-01-17', emoji: '☃️', memberIds: [user.id] });

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32">
      <div className="flex justify-between items-center mb-12">
        <div><p className="text-xs text-gray-400 font-black tracking-widest uppercase tracking-widest">Admin Mode,</p><h2 className="text-2xl font-black text-black">{user.name}</h2></div>
        <div onClick={() => setShowUserAdmin(true)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer"><img src={user.avatar} className="w-full h-full object-cover" /></div>
      </div>

      <div className="flex justify-between items-center mb-6 font-black">
        <h3 className="text-sm font-black text-[#5E9E8E] uppercase italic">My Trips</h3>
        {user.loginCode === 'wayne' && <button onClick={() => setShowAddTrip(true)} className="text-[10px] bg-blue-500 text-white px-4 py-2 rounded-full font-black shadow-lg">+ NEW TRIP</button>}
      </div>

      <div className="space-y-6">
        {allTrips.map(trip => (
          <div key={trip.id} className="relative font-black">
            <button onClick={() => onSelect(trip)} className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-95 transition-all">
              <div className="w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl">{trip.emoji}</div>
              <div className="flex-1 font-black text-black"><h4 className="text-lg font-black">{trip.title}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{trip.startDate} ~ {trip.endDate}</p></div>
            </button>
            {user.loginCode === 'wayne' && <button onClick={() => { if(confirm('確定刪除？')) onDeleteTrip(trip.id); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg font-black">✕</button>}
          </div>
        ))}
      </div>

      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <div className="flex justify-between items-center mb-8 font-black"><h3 className="text-xl italic font-black">USER ADMIN</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300 font-black">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar:'', editLogs:[]})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300 font-black">+ NEW USER</button>
            <div className="space-y-4 font-black">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl font-black">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover shadow-sm font-black" />
                  <div className="flex-1 font-black">{m.name}<p className="text-[9px] opacity-30 font-black tracking-widest uppercase font-black font-black">Logs: {m.editLogs?.length || 0}</p></div>
                  <button onClick={()=>setEditingMember(m)} className="text-xs text-blue-500 font-black">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <h3 className="text-center italic mb-8 uppercase font-black">Setup User</h3>
            <div className="flex flex-col items-center gap-6 mb-8 font-black">
              <img src={editingMember.avatar || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-md font-black" />
              <ImageUploader label="上傳相片" onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
            </div>
            <input placeholder="Name" value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black" />
            <input placeholder="Login Code" value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none font-black" />
            <div className="flex gap-4 font-black">
              <button onClick={()=>setEditingMember(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button>
              <button onClick={()=>{
                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMember.editLogs || []), `Modified at ${timestamp}`];
                const finalMember = { ...editingMember, editLogs: newLogs };
                const up = allMembers.map(m=>m.id===finalMember.id ? finalMember : m);
                onUpdateMembers(up); setEditingMember(null);
              }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg font-black italic">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 3. 主程式
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: any }) {
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);

  const [category, setCategory] = useState('');
  const [amount, setAmount] = useState('');
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [newJournal, setNewJournal] = useState({ content: '', image: '' });
  
  const [weatherData, setWeatherData] = useState({ temp: -5, pop: 20, precip: 0.2, advice: "" });

  const getMember = (id: string) => allMembers.find(m => m.id === id) || allMembers[0];

  useEffect(() => {
    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data?.content) {
        const c = data.content;
        setRecords(c.records || []); setSchedules(c.schedules || {});
        setTodos(c.todos || []); setJournals(c.journals || []);
        setFlights(c.flights || []); setBookings(c.bookings || []);
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
      advice: t < 0 ? "極寒！請備好發熱衣與暖暖包。" : "氣溫低，請注意保暖。"
    });
  }, [activeDay]);

  const sync = async (update: any) => {
    const full = { records, schedules, todos, journals, flights, bookings, ...update };
    await supabase.from('trips').upsert({ id: tripData.id, content: full });
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer"><div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl font-black">←</div><h1 className="text-xl italic uppercase font-black text-[#5E9E8E]">DUPI TRAVEL</h1></div>
        <div className="flex -space-x-2">
          {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(<div key={m.id} className="w-8 h-8 rounded-full border-2 border-white overflow-hidden shadow-md"><img src={m.avatar} className="w-full h-full object-cover" /></div>))}
        </div>
      </div>

      <div className="px-4 mt-4 font-black">
        {/* --- 1. 行程 --- */}
        {activeTab === '行程' && (
          <div className="animate-in fade-in font-black">
            <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden font-black">
                <h2 className="text-5xl font-mono tracking-tighter font-black">{weatherData.temp}°C</h2>
                <div className="flex justify-between items-end mt-2 font-black">
                    <p className="text-[10px] font-black uppercase opacity-60 font-black tracking-widest">Rain: {weatherData.pop}% | {weatherData.precip}mm</p>
                    <p className="text-[10px] bg-white/20 px-3 py-1 rounded-full italic font-black">💡 {weatherData.advice}</p>
                </div>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar font-black">
                {[1,2,3,4,5,6,7,8].map(d=>(<button key={d} onClick={()=>setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all font-black ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105 font-black':'bg-white text-gray-400 border font-black'}`}><span className="text-[10px] font-black">{tripDates[d-1]}</span><span className="text-xl font-black">{d}</span></button>))}
            </div>
            <div className="mt-8 space-y-8 relative font-black">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200 font-black"></div>
                {(schedules[activeDay]||[]).map(item=>(
                    <div key={item.id} className="flex gap-4 relative font-black">
                        <div className="w-10 flex flex-col items-center shrink-0 font-black">
                            <div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm font-black"></div>
                            <span className="text-[10px] text-gray-400 mt-2 font-mono font-black">{item.time}</span>
                        </div>
                        <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 font-black">
                            <h4 className="font-black text-sm font-black">{item.icon} {item.title}</h4>
                            <p className="text-[10px] opacity-40 mt-1 font-black">{item.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
        )}

        {/* --- 2. 預訂 --- */}
        {activeTab === '預訂' && (
          <div className="animate-in fade-in space-y-6 font-black">
            {flights.map(f => (
                <div key={f.id} className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-blue-50 font-black">
                    <div className="bg-[#f8faff] p-6 border-b border-dashed border-blue-100 flex justify-between items-center font-black">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black italic font-black">{f.airline}</span>
                        <h2 className="text-3xl font-black italic tracking-tighter font-black">{f.flightNo}</h2>
                    </div>
                    <div className="p-6 flex justify-between items-center text-center font-black">
                        <div><p className="text-3xl font-black font-black">{f.fromCode}</p><p className="text-blue-500 font-mono text-sm font-black">{f.depTime}</p></div>
                        <div className="flex-1 px-4 flex flex-col items-center font-black">
                            <p className="text-[9px] opacity-30 italic font-black font-black tracking-widest">{f.duration}</p>
                            <div className="w-full h-[1px] bg-blue-100 my-2 relative font-black"><span className="absolute -top-2 left-1/2 -translate-x-1/2 font-black">✈️</span></div>
                            <p className="text-[9px] font-black">{f.date}</p>
                        </div>
                        <div><p className="text-3xl font-black font-black">{f.toCode}</p><p className="text-blue-500 font-mono text-sm font-black">{f.arrTime}</p></div>
                    </div>
                </div>
            ))}
          </div>
        )}

        {/* --- 3. 記帳 --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in font-black">
            <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md italic font-black">
                <p className="text-sm opacity-90 uppercase tracking-widest font-black font-black">Total Pool</p>
                <h2 className="text-4xl font-mono font-black font-black">NT$ {records.reduce((s,r)=>s+Number(r.twdAmount),0).toLocaleString()}</h2>
                {amount && <p className="text-[10px] mt-2 opacity-50 font-black font-black tracking-widest uppercase">Converting: {amount} JPY ≈ NT$ {(Number(amount)*JPY_TO_TWD).toFixed(0)}</p>}
            </div>
            <div className="bg-white rounded-[32px] p-6 shadow-sm border mb-8 font-black">
                <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容..." className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black" />
                <div className="grid grid-cols-2 gap-4 mb-4 font-black">
                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="JPY金額" className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black" />
                    <select value={expensePayerId} onChange={e=>setExpensePayerId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black">{allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
                </div>
                <button onClick={()=>{
                    if(!category || !amount) return;
                    const rec = {id:Date.now(), category, amount, currency:'JPY', twdAmount:(Number(amount)*JPY_TO_TWD).toFixed(0), payMethod:'現金', payerId:expensePayerId, date:tripDates[activeDay-1]};
                    const n = [rec, ...records]; setRecords(n); sync({records:n}); setAmount(''); setCategory('');
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic font-black">Save</button>
            </div>
            <div className="space-y-3 font-black">
                {records.map(r=>(
                    <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border pr-12 relative font-black">
                        <div className="flex items-center gap-3 font-black"><img src={allMembers.find(m=>m.id===r.payerId)?.avatar} className="w-6 h-6 rounded-full font-black shadow-sm" /><div className="text-xs font-black">{r.category}<p className="text-[9px] opacity-40 font-mono font-black">{r.date}</p></div></div>
                        <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">{r.amount} JPY<p className="text-[9px] text-gray-300 font-black">≈ NT$ {r.twdAmount}</p></div>
                        <button onClick={()=>{const n=records.filter(i=>i.id!==r.id);setRecords(n);sync({records:n});}} className="absolute right-4 text-red-300 font-black">✕</button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- 4. 日誌 --- */}
        {activeTab === '日誌' && (
          <div className="animate-in fade-in space-y-6 font-black">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border font-black">
                <textarea value={newJournal.content} onChange={e=>setNewJournal({...newJournal, content:e.target.value})} placeholder="記錄當下心情..." className="w-full bg-gray-50 p-4 rounded-2xl mb-4 outline-none min-h-[100px] font-black font-black" />
                <div className="flex justify-between items-center font-black">
                    <ImageUploader label="上傳照片" onUpload={img => setNewJournal({...newJournal, image: img})} />
                    <button onClick={()=>{
                        if(!newJournal.content) return;
                        const n = [{id:Date.now(), authorId:user.id, content:newJournal.content, image:newJournal.image, date:new Date().toLocaleString()}, ...journals];
                        setJournals(n); sync({journals:n}); setNewJournal({content:'', image:''});
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg font-black italic font-black font-black">Share</button>
                </div>
            </div>
            {journals.map(j => (
                <div key={j.id} className="bg-white p-5 rounded-[32px] shadow-md border font-black font-black">
                    <div className="flex items-center gap-3 mb-4 font-black">
                        <img src={allMembers.find(m=>m.id===j.authorId)?.avatar} className="w-8 h-8 rounded-full font-black shadow-sm" />
                        <div className="font-black"><p className="text-xs font-black">{allMembers.find(m=>m.id===j.authorId)?.name}</p><p className="text-[9px] opacity-30 font-black">{j.date}</p></div>
                    </div>
                    <p className="text-sm mb-4 leading-relaxed font-black font-black">{j.content}</p>
                    {j.image && <img src={j.image} className="w-full rounded-2xl shadow-sm border border-gray-50 font-black" />}
                </div>
            ))}
          </div>
        )}

        {/* --- 5. 準備 --- */}
        {activeTab === '準備' && (
          <div className="animate-in fade-in font-black">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border font-black">{['待辦','行李','採購'].map(t=>(<button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-2 rounded-full text-xs font-black transition-all font-black ${prepSubTab===t?'bg-[#86A760] text-white shadow-md font-black':'text-gray-300 font-black'}`}>{t}</button>))}</div>
            <div className="space-y-4 font-black">
                {todos.filter(t=>t.category===prepSubTab).map(todo => (
                    <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-sm border border-gray-50 flex justify-between items-center font-black">
                        <h4 className="text-sm font-black font-black">{todo.task}</h4>
                        <div className="flex -space-x-1 font-black">
                            {todo.assigneeIds.map(id => <img key={id} src={getMember(id).avatar} className="w-5 h-5 rounded-full border border-white shadow-sm font-black" />)}
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- 6. 成員 --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 font-black">
            {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => (
              <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-gray-50 font-black">
                <img src={m.avatar} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-md font-black" />
                <div className="flex-1 font-black">
                    <h4 className="font-black text-lg font-black">{m.name}</h4>
                    <div className="mt-2 space-y-1 font-black">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">History Logs:</p>
                        {m.editLogs?.slice(-2).map((log, i) => <p key={i} className="text-[9px] opacity-40 italic font-black">· {log}</p>)}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50 font-black">
        {[{id:'行程',icon:'📅'},{id:'預訂',icon:'📔'},{id:'記帳',icon:'👛'},{id:'日誌',icon:'🖋️'},{id:'準備',icon:'💼'},{id:'成員',icon:'👥'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 font-black ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1':'opacity-20 font-black'}`}><span className="text-2xl font-black">{tab.icon}</span><span className="text-[10px] uppercase font-black">{tab.id}</span></button>
        ))}
      </div>
    </div>
  );
}

// 入口點
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const m = localStorage.getItem('members_v43'); const t = localStorage.getItem('trips_v43');
    if (m) setAllMembers(JSON.parse(m)); else setAllMembers([{id:'1',name:'肚皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=wayne',loginCode:'wayne', editLogs:[]},{id:'2',name:'豆豆皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=elvina',loginCode:'Elvina', editLogs:[]}]);
    if (t) setAllTrips(JSON.parse(t)); else setAllTrips([{id:'hokkaido2026',title:'2026 北海道之旅',startDate:'2026-01-10',endDate:'2026-01-17',emoji:'☃️',memberIds:['1','2']}]);
  }, []);

  useEffect(() => { 
    if(allMembers.length > 0) localStorage.setItem('members_v43', JSON.stringify(allMembers)); 
    if(allTrips.length > 0) localStorage.setItem('trips_v43', JSON.stringify(allTrips)); 
  }, [allMembers, allTrips]);

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  if (!selectedTrip) return <TripSelector user={user} allTrips={allTrips} allMembers={allMembers} onSelect={setSelectedTrip} onAddTrip={(t: Trip)=>setAllTrips([...allTrips, t])} onDeleteTrip={(id: string)=>setAllTrips(allTrips.filter(t=>t.id!==id))} onUpdateMembers={setAllMembers} />;
  return <MainApp user={user} tripData={selectedTrip} allMembers={allMembers} onUpdateMembers={setAllMembers} onBack={() => setSelectedTrip(null)} />;
}