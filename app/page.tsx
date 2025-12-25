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

// ==========================================
// 1. 登錄頁面
// ==========================================
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

// ==========================================
// 2. 行政管理 (TripSelector)
// ==========================================
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

      {/* 使用者管理彈窗 */}
      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <div className="flex justify-between items-center mb-8 italic"><h3 className="text-xl">USER ADMIN</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar:'', editLogs:[]})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300">+ NEW USER</button>
            <div className="space-y-4">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl shadow-sm">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover" />
                  <div className="flex-1">{m.name}<p className="text-[9px] opacity-30 tracking-widest uppercase">Logs: {m.editLogs?.length || 0}</p></div>
                  <button onClick={()=>setEditingMember(m)} className="text-xs text-blue-500">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 編輯/新增使用者彈窗 (核心修復：含日誌功能) */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <h3 className="text-center italic mb-8 uppercase">Setup User</h3>
            <div className="flex flex-col items-center gap-6 mb-8">
              <img src={editingMember.avatar || 'https://via.placeholder.com/100'} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-md" />
              <ImageUploader label="上傳相片" onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
            </div>
            <input placeholder="Name" value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-100" />
            <input placeholder="Login Code" value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none border border-gray-100" />
            <div className="flex gap-4">
              <button onClick={()=>setEditingMember(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl">Cancel</button>
              <button onClick={()=>{
                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMember.editLogs || []), `Updated by Admin at ${timestamp}`];
                const finalMember = { ...editingMember, editLogs: newLogs };
                // 確保數組更新邏輯不丟失資料
                const up = allMembers.map(m=>m.id===finalMember.id ? finalMember : m);
                const isNew = !allMembers.some(m=>m.id===finalMember.id);
                onUpdateMembers(isNew ? [...allMembers, finalMember] : up); 
                setEditingMember(null);
              }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ==========================================
// 3. 主程式元件 (MainApp)
// ==========================================
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: any }) {
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  
  // 資料狀態
  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({ 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [], 8: [] });
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);

  // 介面狀態
  const [weatherData, setWeatherData] = useState({ temp: -8, pop: 15, precip: 0.8, advice: "極寒！請備好發熱衣與暖暖包。" });
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [newJournal, setNewJournal] = useState({ content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', assigneeIds: [] as string[] });

  // 編輯視窗
  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });

  // 1. 初始化資料同步 (Cloud to Local)
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

  // 2. 天氣連動日期邏輯 (核心功能)
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

  // 3. 同步至雲端 (Local to Cloud)
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
        {/* --- [Tab: 行程] --- */}
        {activeTab === '行程' && (
          <div className="animate-in fade-in">
            {/* 天氣建議區塊 */}
            <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden">
                <h2 className="text-5xl font-mono tracking-tighter">{weatherData.temp}°C</h2>
                <div className="flex justify-between items-end mt-2">
                    <p className="text-[10px] uppercase opacity-60 font-black">Rain: {weatherData.pop}% | {weatherData.precip}mm</p>
                    <p className="text-[10px] bg-white/20 px-3 py-1 rounded-full italic shadow-sm">💡 {weatherData.advice}</p>
                </div>
            </div>
            
            {/* 日期切換按鈕 */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {[1,2,3,4,5,6,7,8].map(d=>(
                  <button key={d} onClick={()=>setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105':'bg-white text-gray-400 border border-gray-100'}`}>
                    <span className="text-[10px]">{tripDates[d-1]}</span>
                    <span className="text-xl">{d}</span>
                  </button>
                ))}
            </div>

            {/* 時間軸行程列表 */}
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
                            {/* 行程編輯功能 (限 Wayne) */}
                            {/* 行程編輯功能 (限 Wayne) */}
{user.loginCode === 'wayne' && (
    <div className="absolute top-4 right-4 flex gap-4 z-30 transition-opacity">
        <button 
            onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                setPlanForm(item); 
                setShowPlanModal({show:true, type:'edit', data:item});
            }} 
            className="text-sm p-1 active:scale-90 transition-transform"
        >
            🖋️
        </button>
        <button 
            onClick={(e) => {
                e.stopPropagation(); // 防止事件冒泡
                if(confirm('確定要刪除嗎？')){
                    const n = (schedules[activeDay] || []).filter(p => p.id !== item.id); 
                    const up = { ...schedules, [activeDay]: n }; 
                    setSchedules(up); 
                    sync({schedules: up});
                }
            }} 
            className="text-sm p-1 active:scale-90 transition-transform"
        >
            🗑️
        </button>
    </div>
)}
                        </div>
                    </div>
                ))}
                {user.loginCode==='wayne' && (
                  <button onClick={()=> setShowPlanModal({show:true,type:'add'})} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black active:bg-gray-50">+ ADD NEW STOP</button>
                )}
            </div>
          </div>
        )}

        {/* --- [Tab: 預訂] --- */}
        {activeTab === '預訂' && (
          <div className="animate-in fade-in space-y-6">
            <h3 className="text-[#5E9E8E] italic uppercase text-xs mb-4">Flights & Accommodation</h3>
            {flights.map(f => (
                <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50">
                    <div className="bg-[#f8faff] p-8 border-b border-dashed border-blue-100 flex justify-between items-center">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] italic shadow-sm">{f.airline}</span>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase">{f.flightNo}</h2>
                    </div>
                    <div className="p-8 flex justify-between items-center text-center">
                        <div><p className="text-4xl font-black">{f.fromCode}</p><p className="text-blue-600 text-xl font-mono">{f.depTime}</p></div>
                        <div className="flex-1 px-4 flex flex-col items-center">
                            <p className="text-[9px] opacity-30 italic uppercase tracking-tighter">{f.duration}</p>
                            <div className="w-full h-[2px] bg-blue-50 my-3 relative"><span className="absolute -top-2 left-1/2 -translate-x-1/2 text-xl">✈️</span></div>
                            <p className="text-[10px] opacity-40">{f.date}</p>
                        </div>
                        <div><p className="text-4xl font-black">{f.toCode}</p><p className="text-blue-600 text-xl font-mono">{f.arrTime}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 p-8 pt-0 font-black">
                        <div className="bg-gray-50 p-4 rounded-[24px] text-center"><p className="text-[9px] text-gray-300 uppercase italic">Baggage: {f.baggage}</p></div>
                        <div className="bg-gray-50 p-4 rounded-[24px] text-center"><p className="text-[9px] text-gray-300 uppercase italic">{f.aircraft}</p></div>
                    </div>
                </div>
            ))}
            {/* 憑證預訂顯示 */}
            <div className="space-y-4">
              {bookings.map(b=>(
                <div key={b.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-50">
                  <div className="flex justify-between items-center mb-4"><h4 className="text-xs italic bg-orange-50 px-3 py-1 rounded-full">🎫 {b.title}</h4></div>
                  {b.image && <img src={b.image} className="w-full rounded-[24px] shadow-lg border border-gray-100" />}
                </div>
              ))}
              <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center font-black">
                <p className="text-xs opacity-30 mb-4">拍照上傳憑證照片</p>
                <ImageUploader label="上傳相片" onUpload={(b64)=>{const title=prompt("名稱:"); if(title){const n=[{id:Date.now(),type:'憑證',title,image:b64},...bookings];setBookings(n);sync({bookings:n});}}} />
              </div>
            </div>
          </div>
        )}

        {/* --- [Tab: 記帳] (核心修復：個人統計與預覽) --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in">
            {/* 1. 個人代墊統計 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => (
                <div key={m.id} className="bg-white p-4 rounded-3xl shadow-sm border border-[#E0F2F1] relative">
                  <div className="flex items-center gap-2 mb-1">
                    <img src={m.avatar} className="w-4 h-4 rounded-full" />
                    <p className="text-[10px] text-gray-400 font-black uppercase italic">{m.name}</p>
                  </div>
                  <p className="text-lg text-[#5E9E8E] font-mono tracking-tighter font-black">NT$ {records.filter(r=>r.payerId===m.id).reduce((s,r)=>s+Number(r.twdAmount),0).toLocaleString()}</p>
                </div>
              ))}
            </div>

            {/* 2. 總池與即時預覽 */}
            <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md italic">
                <p className="text-sm opacity-90 uppercase tracking-widest font-black">Total Spent</p>
                <h2 className="text-4xl font-mono font-black">NT$ {records.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h2>
                {amount && <p className="text-[10px] mt-2 opacity-50 font-black tracking-widest">Converting: {amount} JPY ≈ NT$ {(Number(amount)*JPY_TO_TWD).toFixed(0)} TWD</p>}
            </div>

            {/* 3. 新增消費紀錄 */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8">
                <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容..." className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner border-none" />
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="JPY金額" className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black shadow-inner border-none" />
                    <select value={expensePayerId} onChange={e=>setExpensePayerId(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black shadow-inner border-none">
                        {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                </div>
                <button onClick={()=>{
                    if(!category || !amount) return;
                    const rec = {id:Date.now(), category, amount, currency:'JPY', twdAmount:(Number(amount)*JPY_TO_TWD).toFixed(0), payMethod:'現金', payerId:expensePayerId, date:tripDates[activeDay-1]};
                    const n = [rec, ...records]; setRecords(n); sync({records:n}); setAmount(''); setCategory('');
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic tracking-widest">Save Record</button>
            </div>

            {/* 4. 歷史紀錄 */}
            <div className="space-y-3 pb-10">
                {records.map(r=>(
                    <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border pr-12 relative group">
                        <div className="flex items-center gap-3">
                            <img src={allMembers.find(m=>m.id===r.payerId)?.avatar} className="w-6 h-6 rounded-full shadow-sm" />
                            <div className="text-xs font-black">{r.category}<p className="text-[9px] opacity-40 font-mono italic tracking-tighter">{getMember(r.payerId).name} · {r.date}</p></div>
                        </div>
                        <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">{r.amount} JPY<p className="text-[9px] text-gray-300">≈ NT$ {r.twdAmount}</p></div>
                        <button onClick={()=>{if(confirm('刪除？')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="absolute right-4 text-red-300 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 日誌] (社交流功能) --- */}
        {activeTab === '日誌' && (
          <div className="animate-in fade-in space-y-6">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-orange-50">
                <textarea value={newJournal.content} onChange={e=>setNewJournal({...newJournal, content:e.target.value})} placeholder="記錄此刻的心情..." className="w-full bg-gray-50 p-4 rounded-2xl mb-4 outline-none min-h-[100px] font-black border-none shadow-inner" />
                <div className="flex justify-between items-center">
                    <ImageUploader label="上傳照片" onUpload={img => setNewJournal({...newJournal, image: img})} />
                    <button onClick={()=>{
                        if(!newJournal.content) return;
                        const n = [{id:Date.now(), authorId:user.id, content:newJournal.content, image:newJournal.image, date:new Date().toLocaleString()}, ...journals];
                        setJournals(n); sync({journals:n}); setNewJournal({content:'', image:''});
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg italic font-black">Share</button>
                </div>
            </div>
            <div className="space-y-6 pb-20">
              {journals.map(j => (
                  <div key={j.id} className="bg-white p-6 rounded-[32px] shadow-md border border-gray-50 animate-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-3 mb-4">
                          <img src={allMembers.find(m=>m.id===j.authorId)?.avatar} className="w-10 h-10 rounded-full border border-gray-100" />
                          <div><p className="text-sm font-black text-black">{allMembers.find(m=>m.id===j.authorId)?.name}</p><p className="text-[9px] opacity-30 italic font-mono uppercase tracking-widest">{j.date}</p></div>
                      </div>
                      <p className="text-sm mb-4 leading-relaxed font-black text-gray-700">{j.content}</p>
                      {j.image && <img src={j.image} className="w-full rounded-[24px] shadow-sm border border-gray-100" />}
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 準備] (核心修復：CRUD 操作) --- */}
        {activeTab === '準備' && (
          <div className="animate-in fade-in">
            {/* 分類切換 */}
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
                {['待辦','行李','採購'].map(t=>(
                    <button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic ${prepSubTab===t?'bg-[#86A760] text-white shadow-md scale-105':'text-gray-300'}`}>{t}</button>
                ))}
            </div>

            {/* 新增待辦事項區塊 */}
            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8">
                <input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput,task:e.target.value})} placeholder={`新增${prepSubTab}事項...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner border-none" />
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
                        <button key={m.id} onClick={()=>{
                            const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i=>i!==m.id) : [...newTodoInput.assigneeIds, m.id];
                            setNewTodoInput({...newTodoInput, assigneeIds: ids});
                        }} className={`p-2 px-4 rounded-xl border text-[10px] font-black transition-all ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-inner scale-110':'bg-gray-100 text-gray-400 border-transparent'}`}>{m.name}</button>
                    ))}
                </div>
                <button onClick={()=>{
                    if(!newTodoInput.task || newTodoInput.assigneeIds.length === 0) return alert("請填內容並指派旅伴");
                    const n = [{id:Date.now(), task:newTodoInput.task, assigneeIds:newTodoInput.assigneeIds, completedAssigneeIds:[], category:prepSubTab}, ...todos];
                    setTodos(n); sync({todos:n}); setNewTodoInput({task:'', assigneeIds:[]});
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg italic">ADD TO {prepSubTab}</button>
            </div>

            {/* 事項清單 (含指派與刪除) */}
            <div className="space-y-4 pb-20">
                {todos.filter(t=>t.category===prepSubTab).map(todo => (
                    <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-md border border-gray-100 flex justify-between items-center group animate-in slide-in-from-left-2">
                        <div className="flex flex-col flex-1 pr-4">
                            <h4 className={`text-sm font-black transition-all ${todo.completedAssigneeIds.length === todo.assigneeIds.length ? 'line-through opacity-20 text-gray-400' : 'text-black'}`}>{todo.task}</h4>
                            <div className="flex gap-2 mt-3 flex-wrap">
                                {todo.assigneeIds.map(id => {
                                    const m = getMember(id);
                                    const isDone = todo.completedAssigneeIds.includes(id);
                                    return (
                                        <button key={id} onClick={() => {
                                            const nComp = isDone ? todo.completedAssigneeIds.filter(cid=>cid!==id) : [...todo.completedAssigneeIds, id];
                                            const n = todos.map(t=>t.id===todo.id ? {...t, completedAssigneeIds: nComp} : t);
                                            setTodos(n); sync({todos:n});
                                        }} className={`text-[8px] px-3 py-1.5 rounded-full font-black shadow-sm transition-all ${isDone ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{m?.name} {isDone && "✅"}</button>
                                    );
                                })}
                            </div>
                        </div>
                        <button onClick={()=>{if(confirm('確認移除事項？')){const n=todos.filter(t=>t.id!==todo.id); setTodos(n); sync({todos:n});}}} className="text-red-300 hover:text-red-500 text-lg opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 成員] (日誌顯示) --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 pb-20">
            <h3 className="text-[#5E9E8E] italic uppercase text-xs font-black mb-4 tracking-widest">Trip Members</h3>
            {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => (
              <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-gray-50">
                <img src={m.avatar} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-md" />
                <div className="flex-1 font-black">
                    <h4 className="text-lg text-black">{m.name}</h4>
                    <div className="mt-3 space-y-1.5">
                        <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">History Logs:</p>
                        {(m.editLogs || []).slice(-3).reverse().map((log, i) => (
                            <p key={i} className="text-[9px] opacity-40 italic tracking-tighter">· {log}</p>
                        ))}
                        {(!m.editLogs || m.editLogs.length === 0) && <p className="text-[9px] opacity-20 italic font-black">尚無異動紀錄</p>}
                    </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 行程編輯彈窗 (限 Wayne) */}
      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
            <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom font-black">
                <h3 className="text-2xl mb-8 italic text-[#5E9E8E] uppercase tracking-tighter">Edit Travel Stop</h3>
                <div className="flex gap-3 mb-6 bg-gray-50 rounded-2xl p-2 shadow-inner">
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl" value={planForm.time.split(':')[0]} onChange={e=>setPlanForm({...planForm,time:`${e.target.value}:${planForm.time.split(':')[1]}`})}>
                        {Array.from({length: 24}).map((_,i)=><option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} 點</option>)}
                    </select>
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl" value={planForm.time.split(':')[1]} onChange={e=>setPlanForm({...planForm,time:`${planForm.time.split(':')[0]}:${e.target.value}`})}>
                        {['00','10','20','30','40','50'].map(m=><option key={m} value={m}>{m} 分</option>)}
                    </select>
                </div>
                <input placeholder="要去哪裡？" value={planForm.title} onChange={e=>setPlanForm({...planForm,title:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-4 outline-none text-xl shadow-inner border-none" />
                <textarea placeholder="備註或細節..." value={planForm.desc} onChange={e=>setPlanForm({...planForm,desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm h-32 leading-relaxed shadow-inner border-none" />
                <div className="flex gap-4">
                    <button onClick={()=>setShowPlanModal({show:false,type:'add'})} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black uppercase">Cancel</button>
                    <button onClick={()=>{
                        if(!planForm.title) return alert("地點必填");
                        const dPlans = schedules[activeDay] || [];
                        const n = showPlanModal.type === 'add' ? [...dPlans, {...planForm, id: Date.now()}] : dPlans.map(p=>p.id===showPlanModal.data?.id ? {...planForm, id:p.id} : p);
                        const up = { ...schedules, [activeDay]: n };
                        setSchedules(up); sync({schedules:up}); 
                        setShowPlanModal({show:false,type:'add'}); 
                        setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'});
                    }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-xl italic uppercase font-black">Save Stop</button>
                </div>
            </div>
        </div>
      )}

      {/* 底部 TabBar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50">
        {[{id:'行程',icon:'📅'},{id:'預訂',icon:'📔'},{id:'記帳',icon:'👛'},{id:'日誌',icon:'🖋️'},{id:'準備',icon:'💼'},{id:'成員',icon:'👥'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1':'opacity-20'}`}>
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[10px] uppercase font-black tracking-tighter">{tab.id}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 4. 入口點元件 (AppEntry)
// ==========================================
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [allTrips, setAllTrips] = useState<Trip[]>([]);

  useEffect(() => {
    const m = localStorage.getItem('members_v43'); 
    const t = localStorage.getItem('trips_v43');
    if (m) setAllMembers(JSON.parse(m)); 
    else setAllMembers([
      {id:'1',name:'肚皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=wayne',loginCode:'wayne', editLogs:['Account created']},
      {id:'2',name:'豆豆皮',avatar:'https://api.dicebear.com/7.x/bottts-neutral/svg?seed=elvina',loginCode:'Elvina', editLogs:['Account created']}
    ]);
    if (t) setAllTrips(JSON.parse(t)); 
    else setAllTrips([{id:'hokkaido2026',title:'2026 北海道之旅',startDate:'2026-01-10',endDate:'2026-01-17',emoji:'☃️',memberIds:['1','2']}]);
  }, []);

  useEffect(() => { 
    if(allMembers.length > 0) localStorage.setItem('members_v43', JSON.stringify(allMembers)); 
    if(allTrips.length > 0) localStorage.setItem('trips_v43', JSON.stringify(allTrips)); 
  }, [allMembers, allTrips]);

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  
  if (!selectedTrip) return (
    <TripSelector 
      user={user} 
      allTrips={allTrips} 
      allMembers={allMembers} 
      onSelect={setSelectedTrip} 
      onAddTrip={(t: Trip)=>setAllTrips([...allTrips, t])} 
      onDeleteTrip={(id: string)=>setAllTrips(allTrips.filter(t=>t.id!==id))} 
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