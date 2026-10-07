"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase 初始化 ---
const supabase = createClient(
  'https://oqfysuuoxduginkfgggg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnlzdXVveGR1Z2lua2ZnZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDUxNjgsImV4cCI6MjA4MjIyMTE2OH0.igtMj90ihFLc3RIP0UGzXcUBxx4E16xMa9_HQcSfju8'
);

// --- 型別定義 ---
interface Member { id: string; name: string; avatar: string; loginCode: string; editLogs: string[]; }
interface ExpenseRecord { id: number; category: string; amount: string; currency: 'JPY' | 'TWD' | 'CNY'; twdAmount: string; payMethod: string; payerId: string; date: string; note?: string; lastUpdatedById?: string; }
interface Plan { id: number; time: string; title: string; desc: string; icon: string; lastUpdatedById?: string; }
interface TodoItem { id: number; task: string; note?: string; assigneeIds: string[]; completedAssigneeIds: string[]; category: string; lastUpdatedById?: string; }
interface JournalEntry { id: number; authorId: string; content: string; date: string; image?: string; lastUpdatedById?: string; }
interface Flight { id: number; airline: string; flightNo: string; fromCode: string; toCode: string; depTime: string; arrTime: string; duration: string; date: string; baggage: string; aircraft: string; lastUpdatedById?: string; }
interface BookingDoc { id: number; type: string; title: string; image?: string; lastUpdatedById?: string; }
interface Trip { id: string; title: string; startDate: string; endDate: string; emoji: string; memberIds: string[]; }
interface ScheduleData { [key: number]: Plan[]; }
interface CityWeatherConfig { id: string; name: string; dayIndexes: number[]; }

const PRESET_ANIMAL_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bear&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Panda&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Cat&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Dog&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Fox&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Rabbit&backgroundColor=c1f0c8'
];

function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getTodayShortDateString(): string {
  const today = new Date();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${m}/${d}`;
}

function getDatesList(startStr: string, endStr: string): string[] {
  if (!startStr || !endStr) return [];
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    return [startStr.slice(5).replace('-', '/')];
  }
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    dates.push(`${m}/${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function getDateObj(startStr: string, dayIndex: number): Date {
  const start = new Date(startStr);
  const target = new Date(start);
  target.setDate(start.getDate() + (dayIndex - 1));
  return target;
}

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
        const found = allMembers.find(m => m.loginCode === input.trim());
        if (found) onLogin(found); else alert('❌ 查無登入代碼');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg active:scale-95 transition-transform">LOGIN</button>
    </div>
  );
}

// 2. 主畫面
function TripSelector({ user, onLogout, onSelect, allTrips, onAddTrip, onDeleteTrip, allMembers, onUpdateMembers, notice, onUpdateNotice }: { user: Member, onLogout: () => void, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: any, onDeleteTrip: any, allMembers: Member[], onUpdateMembers: any, notice: string, onUpdateNotice: (n: string) => void }) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  const todayStr = useMemo(() => getTodayDateString(), []);
  const [newTrip, setNewTrip] = useState<Trip>({ 
    id: '', 
    title: '', 
    startDate: todayStr, 
    endDate: todayStr, 
    emoji: '☃️', 
    memberIds: [user.id] 
  });

  const visibleTrips = useMemo(() => {
    if (user.loginCode === 'wayne') return allTrips;
    return allTrips.filter(t => t.memberIds.includes(user.id));
  }, [allTrips, user]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32">
      <div className="flex justify-between items-center mb-6 relative">
        <div className="font-black">
          <p className="text-xs text-gray-400 uppercase tracking-widest">{user.loginCode === 'wayne' ? 'Admin Mode,' : 'User Mode,'}</p>
          <h2 className="text-2xl text-black">{user.name}</h2>
        </div>
        
        <div className="relative">
          <div onClick={() => setShowUserDropdown(!showUserDropdown)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer active:scale-90 transition-transform">
            <img src={user.avatar} className="w-full h-full object-cover" />
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100 font-black animate-in fade-in">
              <div className="p-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-black font-black truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">Code: {user.loginCode}</p>
              </div>
              {user.loginCode === 'wayne' && (
                <button onClick={() => { setShowUserDropdown(false); setShowUserAdmin(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2">
                  ⚙️ 成員管理名冊
                </button>
              )}
              <button onClick={() => { setShowUserDropdown(false); onLogout(); }} className="w-full text-left p-2.5 rounded-xl text-xs text-red-500 hover:bg-red-50 flex items-center gap-2">
                🚪 登出帳號
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#E9C46A]/20 border border-[#E9C46A]/40 rounded-2xl p-4 mb-8 flex justify-between items-center font-black">
        <div className="flex items-center gap-3 overflow-hidden">
          <span className="text-lg">📢</span>
          <p className="text-xs text-amber-900 truncate">{notice || '歡迎使用 Dupi Travel！祝旅途愉快～'}</p>
        </div>
        {user.loginCode === 'wayne' && (
          <button onClick={() => {
            const nextNotice = prompt("修改首頁公告內容：", notice);
            if (nextNotice !== null) onUpdateNotice(nextNotice);
          }} className="text-[10px] bg-white px-3 py-1.5 rounded-xl shadow-sm hover:bg-amber-50 shrink-0 ml-2">
            🖋️ 編輯公告
          </button>
        )}
      </div>

      <div className="flex justify-between items-center mb-6 font-black">
        <h3 className="text-sm text-[#5E9E8E] uppercase italic">My Trips</h3>
        {user.loginCode === 'wayne' && (
          <button onClick={() => {
            const today = getTodayDateString();
            setNewTrip({ id: '', title: '', startDate: today, endDate: today, emoji: '☃️', memberIds: [user.id] });
            setShowAddTrip(true);
          }} className="text-[10px] bg-blue-500 text-white px-4 py-2 rounded-full shadow-lg">+ NEW TRIP</button>
        )}
      </div>

      <div className="space-y-6">
        {visibleTrips.length === 0 && (
          <div className="bg-white p-8 rounded-3xl text-center text-gray-300 font-black">
            目前尚無你有權限查看的旅行計劃
          </div>
        )}
        {visibleTrips.map(trip => (
          <div key={trip.id} className="relative font-black">
            <button onClick={() => onSelect(trip)} className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-95 transition-all">
              <div className="w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl">{trip.emoji}</div>
              <div className="flex-1"><h4 className="text-lg text-black">{trip.title}</h4><p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter">{trip.startDate} ~ {trip.endDate}</p></div>
            </button>
            {user.loginCode === 'wayne' && <button onClick={() => { if(confirm('確定刪除此行程？')) onDeleteTrip(trip.id); }} className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg font-black">✕</button>}
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
                <button onClick={()=>setShowAddTrip(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button>
                <button onClick={()=>{
                  if(!newTrip.title.trim()) return alert("請輸入旅行名稱！");
                  onAddTrip({...newTrip, id: Date.now().toString()});
                  setShowAddTrip(false);
                  const today = getTodayDateString();
                  setNewTrip({id:'', title:'', startDate: today, endDate: today, emoji:'☃️', memberIds:[user.id]});
                }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic">Create Trip</button>
             </div>
          </div>
        </div>
      )}

      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <div className="flex justify-between items-center mb-8 italic"><h3 className="text-xl">USER ADMIN (WAYNE ONLY)</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar: PRESET_ANIMAL_AVATARS[0], editLogs:['Account created']})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300">+ NEW USER</button>
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

      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black font-black">
            <h3 className="text-center italic mb-8 uppercase">Setup User</h3>
            <div className="flex flex-col items-center gap-4 mb-4">
              <img src={editingMember.avatar || PRESET_ANIMAL_AVATARS[0]} className="w-24 h-24 rounded-full border-4 border-gray-100 object-cover shadow-md" />
              <div className="flex gap-2">
                {PRESET_ANIMAL_AVATARS.map((av, idx) => (
                  <img key={idx} src={av} onClick={() => setEditingMember({...editingMember, avatar: av})} className="w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border border-gray-200" />
                ))}
              </div>
              <ImageUploader label="上傳相片" onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
            </div>
            <input placeholder="Name" value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-100" />
            <input placeholder="Login Code" value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none border border-gray-100" />
            <div className="flex gap-4">
              <button onClick={()=>setEditingMember(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl">Cancel</button>
              <button onClick={()=>{
                if (!editingMember.name.trim()) return alert("請輸入姓名！");
                const nameConflict = allMembers.some(m => m.id !== editingMember.id && m.name === editingMember.name.trim());
                if (nameConflict) return alert("該名字有人使用，請更換名字");

                const codeConflict = allMembers.some(m => m.id !== editingMember.id && m.loginCode === editingMember.loginCode.trim());
                if (codeConflict) return alert("該CODE有人使用，請更換CODE");

                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMember.editLogs || []), `Updated by Admin at ${timestamp}`];
                const finalMember = { ...editingMember, name: editingMember.name.trim(), loginCode: editingMember.loginCode.trim(), editLogs: newLogs };
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

// 3. 主程式元件
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers, onUpdateTrip }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: any, onUpdateTrip: (updated: Trip) => void }) {
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  const [bookSubTab, setBookSubTab] = useState('機票'); 

  const [expenseSubTab, setExpenseSubTab] = useState<'明細' | '查帳'>('明細');
  const [filterPayerIds, setFilterPayerIds] = useState<string[]>([]);

  // 💥 解決畫面不同步：在 MainApp 內部建立成員清單的即時 State
  const [currentMemberIds, setCurrentMemberIds] = useState<string[]>(tripData.memberIds || [user.id]);

  const dynamicTripDates = useMemo(() => {
    return getDatesList(tripData.startDate, tripData.endDate);
  }, [tripData.startDate, tripData.endDate]);

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [cityConfigs, setCityConfigs] = useState<CityWeatherConfig[]>([]);

  const stateRef = useRef({
    records,
    schedules,
    todos,
    journals,
    flights,
    bookings,
    cityConfigs
  });

  useEffect(() => {
    stateRef.current = {
      records,
      schedules,
      todos,
      journals,
      flights,
      bookings,
      cityConfigs
    };
  }, [records, schedules, todos, journals, flights, bookings, cityConfigs]);

  const [newCityName, setNewCityName] = useState('');
  const [showCityEditor, setShowCityEditor] = useState(false);

  const [weatherStatus, setWeatherStatus] = useState<{
    hasConfig: boolean;
    cityName: string;
    isTooFar: boolean;
    daysUntil: number;
    temp?: number;
    pop?: number;
    precip?: number;
    advice: string;
  }>({
    hasConfig: false,
    cityName: '',
    isTooFar: false,
    daysUntil: 0,
    advice: '請先在下方新增城市並勾選日期以獲取即時天氣'
  });

  const [showAddExistingModal, setShowAddExistingModal] = useState(false);
  const [editingMemberModal, setEditingMemberModal] = useState<Member | null>(null);

  const [exchangeRates, setExchangeRates] = useState({ JPY: 0.22, TWD: 1.0, CNY: 4.5 });
  const [currency, setCurrency] = useState<'JPY' | 'TWD' | 'CNY'>('JPY');

  const defaultExpenseDate = useMemo(() => {
    const todayShort = getTodayShortDateString();
    if (dynamicTripDates.includes(todayShort)) return todayShort;
    return dynamicTripDates[0] || todayShort;
  }, [dynamicTripDates]);

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [payMethod, setPayMethod] = useState('現金'); 
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [expenseDate, setExpenseDate] = useState(defaultExpenseDate);
  const [customOtherDate, setCustomOtherDate] = useState(getTodayDateString());

  const [newJournal, setNewJournal] = useState({ content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', note: '', assigneeIds: [user.id] as string[] });
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });

  const [showFlightModal, setShowFlightModal] = useState<{show: boolean, type: 'add'|'edit', data?: Flight | null}>({show: false, type: 'add', data: null});
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '10:00', arrTime: '14:00', duration: '', date: dynamicTripDates[0] || '10/07', baggage: '', aircraft: '' });

  const getMember = (id?: string) => {
    if (!id) return { id: '', name: '未定', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: '', editLogs: [] };
    const found = allMembers.find(m => m.id === id);
    return found || { id, name: '未知成員', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: '', editLogs: [] };
  };

  useEffect(() => {
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/TWD');
        const data = await res.json();
        if (data && data.rates) {
          setExchangeRates({
            JPY: Number((1 / data.rates.JPY).toFixed(4)),
            TWD: 1.0,
            CNY: Number((1 / data.rates.CNY).toFixed(4))
          });
        }
      } catch (e) {
        console.log('Using fallback exchange rates');
      }
    };
    fetchRates();
  }, []);

  const updateLocalState = (c: any) => {
    if (!c) return;
    setRecords(c.records || []);
    setSchedules(c.schedules || {});
    setTodos(c.todos || []);
    setJournals(c.journals || []);
    setFlights(c.flights || []);
    setBookings(c.bookings || []);
    if (c.cityConfigs) setCityConfigs(c.cityConfigs);
    localStorage.setItem(`trip_cache_${tripData.id}`, JSON.stringify(c));
  };

  useEffect(() => {
    const cached = localStorage.getItem(`trip_cache_${tripData.id}`);
    if (cached) {
      try { updateLocalState(JSON.parse(cached)); } catch(e){}
    }

    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data?.content) {
        updateLocalState(data.content);
      }
    };
    loadCloudData();

    const tripChannel = supabase
      .channel(`sync-trip-${tripData.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: `id=eq.${tripData.id}` },
        (payload) => {
          if (payload.new && (payload.new as any).content) {
            updateLocalState((payload.new as any).content);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tripChannel);
    };
  }, [tripData.id]);

  // 天氣預報讀取
  useEffect(() => {
    const activeCityObj = cityConfigs.find(c => c.dayIndexes.includes(activeDay));
    if (!activeCityObj) {
      setWeatherStatus({
        hasConfig: false,
        cityName: '',
        isTooFar: false,
        daysUntil: 0,
        advice: '尚未設定此日城市，請點選右上角 🖋️ 新增城市並勾選對應旅遊日。'
      });
      return;
    }

    const targetDate = getDateObj(tripData.startDate, activeDay);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffDays = Math.ceil((targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays > 7) {
      setWeatherStatus({
        hasConfig: true,
        cityName: activeCityObj.name,
        isTooFar: true,
        daysUntil: diffDays,
        advice: `距離出發日還有 ${diffDays} 天，還沒辦法提供天氣預報，建議出發前 5 天查看喔！`
      });
      return;
    }

    let isCancelled = false;
    const fetchWeather = async () => {
      try {
        const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(activeCityObj.name)}&count=1&language=zh&format=json`);
        const geoData = await geoRes.json();
        if (!geoData.results || geoData.results.length === 0) {
          if (!isCancelled) {
            setWeatherStatus({
              hasConfig: true,
              cityName: activeCityObj.name,
              isTooFar: false,
              daysUntil: diffDays,
              temp: 24,
              pop: 15,
              precip: 0.2,
              advice: `已設定 ${activeCityObj.name}，氣候宜人，早晚溫差大請備妥薄外套。`
            });
          }
          return;
        }

        const { latitude, longitude } = geoData.results[0];
        const weatherRes = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=temperature_2m_max,precipitation_probability_max,precipitation_sum&timezone=auto`
        );
        const wData = await weatherRes.json();

        if (wData.daily && !isCancelled) {
          const targetIso = targetDate.toISOString().split('T')[0];
          const dateIdx = wData.daily.time.indexOf(targetIso);
          const idx = dateIdx !== -1 ? dateIdx : 0;

          const temp = Math.round(wData.daily.temperature_2m_max[idx] ?? 24);
          const pop = wData.daily.precipitation_probability_max ? Math.round(wData.daily.precipitation_probability_max[idx] ?? 10) : 10;
          const precip = Number((wData.daily.precipitation_sum ? wData.daily.precipitation_sum[idx] ?? 0 : 0).toFixed(1));

          let customAdvice = "晴時多雲，氣候舒適！";
          if (temp < 10) customAdvice = "極冷低溫！請穿著防寒大衣、發熱衣與圍巾手套。";
          else if (temp < 20) customAdvice = "早晚微涼，建議穿長袖上衣並隨身攜帶夾克。";
          if (pop >= 50) customAdvice += " 降雨機率高，出門請備妥雨具！";

          setWeatherStatus({
            hasConfig: true,
            cityName: activeCityObj.name,
            isTooFar: false,
            daysUntil: diffDays,
            temp,
            pop,
            precip,
            advice: customAdvice
          });
        }
      } catch (err) {
        if (!isCancelled) {
          setWeatherStatus({
            hasConfig: true,
            cityName: activeCityObj.name,
            isTooFar: false,
            daysUntil: diffDays,
            temp: 24,
            pop: 10,
            precip: 0.1,
            advice: `已設定 ${activeCityObj.name}，請依日常氣溫注意穿搭。`
          });
        }
      }
    };

    fetchWeather();
    return () => { isCancelled = true; };
  }, [activeDay, cityConfigs, tripData.startDate]);

  // 安全同步函式
  const sync = async (update: any) => {
    const full = { ...stateRef.current, ...update };
    stateRef.current = full;
    localStorage.setItem(`trip_cache_${tripData.id}`, JSON.stringify(full));
    try {
      await supabase.from('trips').upsert({ id: tripData.id, content: full });
    } catch(e) {
      console.warn("Sync warning", e);
    }
  };

  // 💥 解決成員變更即時反應的專用函式
  const handleUpdateTripMembers = (newMemberIds: string[]) => {
    setCurrentMemberIds(newMemberIds);
    const updatedTrip = { ...tripData, memberIds: newMemberIds };
    onUpdateTrip(updatedTrip);
  };

  const sortedFlights = useMemo(() => {
    return [...flights].sort((a, b) => {
      const compDate = a.date.localeCompare(b.date);
      if (compDate !== 0) return compDate;
      return a.depTime.localeCompare(b.depTime);
    });
  }, [flights]);

  const filteredRecords = useMemo(() => {
    if (filterPayerIds.length === 0) return records;
    return records.filter(r => filterPayerIds.includes(r.payerId));
  }, [records, filterPayerIds]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      {/* 頂部導航 */}
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">←</div>
          <h1 className="text-xl italic uppercase text-[#5E9E8E] tracking-tighter">DUPI TRAVEL</h1>
        </div>
        <div className="flex -space-x-2">
          {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m=>(
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
            {/* 天氣看板 */}
            <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden transition-all">
                <button 
                  onClick={() => setShowCityEditor(!showCityEditor)}
                  className="absolute top-5 right-5 bg-white/20 hover:bg-white/30 p-2.5 rounded-2xl active:scale-95 transition-all text-sm z-10"
                  title="編輯城市排程"
                >
                  {showCityEditor ? '✓' : '🖋️'}
                </button>

                {!weatherStatus.hasConfig ? (
                  <div className="py-2 pr-10">
                    <p className="text-xs uppercase opacity-70 tracking-widest font-black">WEATHER FORECAST</p>
                    <h3 className="text-xl mt-2 mb-1">尚未設定城市天氣</h3>
                    <p className="text-[11px] opacity-80 leading-relaxed font-normal">💡 {weatherStatus.advice}</p>
                  </div>
                ) : weatherStatus.isTooFar ? (
                  <div className="py-2 pr-10">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-wider">📍 {weatherStatus.cityName}</span>
                      <span className="text-[10px] opacity-75 font-mono">D{activeDay} ({dynamicTripDates[activeDay - 1]})</span>
                    </div>
                    <h3 className="text-lg font-black mt-2">距離出發日還有 {weatherStatus.daysUntil} 天</h3>
                    <p className="text-[11px] opacity-85 mt-1 italic">💡 還沒辦法提供即時天氣預報，建議出發前 5 天查看喔！</p>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start pr-12">
                      <h2 className="text-5xl font-mono tracking-tighter">{weatherStatus.temp}°C</h2>
                      <span className="text-xs bg-white/20 px-3 py-1 rounded-full uppercase tracking-widest">📍 {weatherStatus.cityName}</span>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                        <p className="text-[10px] uppercase opacity-70 font-black">Rain/Snow: {weatherStatus.pop}% | {weatherStatus.precip}mm</p>
                        <p className="text-[10px] bg-white/20 px-3 py-1 rounded-full italic shadow-sm max-w-[65%] truncate">💡 {weatherStatus.advice}</p>
                    </div>
                  </div>
                )}
            </div>

            {/* 展開之城市與排程編輯器 */}
            {showCityEditor && (
              <div className="bg-white p-5 rounded-[28px] mb-6 shadow-sm border border-gray-100 animate-in slide-in-from-top-3">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs text-[#5E9E8E] uppercase tracking-wider font-black">🏙️ 城市與天氣排程</h4>
                  <div className="flex gap-2">
                    <input 
                      placeholder="輸入城市 (如: 台北、大阪)..." 
                      value={newCityName} 
                      onChange={e => setNewCityName(e.target.value)} 
                      className="p-2 px-3 bg-gray-50 rounded-xl text-xs outline-none border border-gray-100 font-black"
                    />
                    <button 
                      onClick={() => {
                        if (!newCityName.trim()) return alert("請輸入城市名稱！");
                        const next = [...cityConfigs, { id: Date.now().toString(), name: newCityName.trim(), dayIndexes: [activeDay] }];
                        setCityConfigs(next);
                        sync({ cityConfigs: next });
                        setNewCityName('');
                      }}
                      className="bg-[#5E9E8E] text-white text-[10px] px-3 py-2 rounded-xl shadow-sm active:scale-95"
                    >
                      + 新增
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  {cityConfigs.length === 0 && (
                    <p className="text-xs opacity-30 text-center py-3">尚未加入任何城市，請在上方輸入新增</p>
                  )}
                  {cityConfigs.map(c => (
                    <div key={c.id} className="p-3 bg-gray-50 rounded-2xl flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-black text-black">📍 {c.name}</span>
                        <button 
                          onClick={() => {
                            const next = cityConfigs.filter(item => item.id !== c.id);
                            setCityConfigs(next);
                            sync({ cityConfigs: next });
                          }}
                          className="text-red-400 text-xs font-black"
                        >
                          ✕ 刪除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] text-gray-400 font-black">待在此處的日期：</span>
                        {dynamicTripDates.map((dStr, idx) => {
                          const dayNum = idx + 1;
                          const isChecked = c.dayIndexes.includes(dayNum);
                          return (
                            <label key={dayNum} className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-xl cursor-pointer transition-all font-black ${isChecked ? 'bg-[#5E9E8E] text-white shadow-sm' : 'bg-white text-gray-400 border border-gray-200'}`}>
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => {
                                  const newDays = isChecked 
                                    ? c.dayIndexes.filter(d => d !== dayNum) 
                                    : [...c.dayIndexes, dayNum];
                                  const next = cityConfigs.map(item => item.id === c.id ? { ...item, dayIndexes: newDays } : item);
                                  setCityConfigs(next);
                                  sync({ cityConfigs: next });
                                }}
                                className="hidden"
                              />
                              {dStr} (D{dayNum})
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <button 
                  onClick={() => setShowCityEditor(false)}
                  className="w-full mt-4 py-3 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md active:scale-98 transition-transform"
                >
                  ✓ 確認完成編輯
                </button>
              </div>
            )}
            
            {/* 動態日期切換按鈕列 */}
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
                {dynamicTripDates.map((dateStr, idx) => {
                  const d = idx + 1;
                  return (
                    <button key={d} onClick={()=>setActiveDay(d)} className={`flex-shrink-0 w-14 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105':'bg-white text-gray-400 border border-gray-100'}`}>
                      <span className="text-[10px]">{dateStr}</span>
                      <span className="text-xl">{d}</span>
                    </button>
                  );
                })}
            </div>

            {/* 行程景點項目 */}
            <div className="mt-8 space-y-8 relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
                {(schedules[activeDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(item=>(
                    <div key={item.id} className="flex gap-4 relative">
                        <div className="w-10 flex flex-col items-center shrink-0">
                            <div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm"></div>
                            <span className="text-[10px] text-gray-400 mt-2 font-mono">{item.time}</span>
                        </div>
                        <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 relative group">
                            <div className="flex justify-between items-start">
                              <h4 className="font-black text-sm">{item.icon} {item.title}</h4>
                              {item.lastUpdatedById && (
                                <span className="text-[9px] text-[#5E9E8E] bg-green-50 px-2 py-0.5 rounded-full font-black">
                                  最後編輯: {getMember(item.lastUpdatedById).name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] opacity-40 mt-1 leading-relaxed">{item.desc}</p>
                            <div className="mt-4 flex justify-between items-center">
                                <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`, '_blank'); }} className="text-[10px] bg-gray-50 text-[#5E9E8E] px-3 py-1.5 rounded-full font-black shadow-inner active:scale-95">📍 GOOGLE MAP</button>
                                <div className="flex gap-3 z-20">
                                    <button onClick={(e)=>{e.stopPropagation(); setPlanForm(item); setShowPlanModal({show:true,type:'edit',data:item});}} className="text-xs text-blue-400 bg-blue-50 p-2 rounded-xl active:scale-90 transition-transform">🖋️</button>
                                    <button onClick={(e)=>{e.stopPropagation(); if(confirm('確定刪除此行程？')){const n=(schedules[activeDay]||[]).filter(p=>p.id!==item.id); const up={...schedules,[activeDay]:n}; setSchedules(up); sync({schedules:up});}}} className="text-xs text-red-400 bg-red-50 p-2 rounded-xl active:scale-90 transition-transform">🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={()=> setShowPlanModal({show:true,type:'add'})} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black active:bg-gray-50">+ ADD NEW STOP</button>
            </div>
          </div>
        )}

        {/* --- [Tab: 預訂] --- */}
        {activeTab === '預訂' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
                {['機票','憑證'].map(t=>(
                    <button key={t} onClick={()=>setBookSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${bookSubTab===t?'bg-[#E9C46A] text-white shadow-md scale-105':'text-gray-300'}`}>{t}</button>
                ))}
            </div>

            {bookSubTab === '機票' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Flight Info</h3>
                  <button onClick={()=>{setFlightForm({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '10:00', arrTime: '14:00', duration: '', date: dynamicTripDates[0] || '10/07', baggage: '', aircraft: '' }); setShowFlightModal({show:true, type:'add', data:null});}} className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full">+ ADD</button>
                </div>
                {sortedFlights.map(f => (
                  <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50 relative p-6 font-black">
                    <div className="flex justify-between mb-4 border-b border-dashed pb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{f.airline}</span>
                      <h2 className="text-2xl font-black italic">{f.flightNo}</h2>
                    </div>
                    <div className="flex justify-between text-center items-center">
                      <div><p className="text-3xl font-black">{f.fromCode}</p><p className="text-blue-500 font-mono text-sm">{f.depTime}</p></div>
                      <div className="flex-1 flex flex-col items-center opacity-30"><span className="text-[10px] uppercase font-black">{f.duration}</span><div className="w-full h-px bg-blue-100 my-1 relative"><span className="absolute -top-2 left-1/2 -translate-x-1/2">✈️</span></div><p className="text-[10px] font-bold text-black">{f.date}</p></div>
                      <div><p className="text-3xl font-black">{f.toCode}</p><p className="text-blue-600 font-mono text-sm">{f.arrTime}</p></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[9px] text-gray-400">最後編輯: {getMember(f.lastUpdatedById).name}</span>
                      <div className="flex gap-3">
                        <button onClick={()=>{setFlightForm(f); setShowFlightModal({show:true, type:'edit', data:f});}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('確定刪除此機票？')){const n=flights.filter(i=>i.id!==f.id); setFlights(n); sync({flights:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Vouchers</h3>
                {bookings.map(b=>(
                  <div key={b.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-50 group relative">
                    <div className="flex justify-between mb-2">
                      <h4 className="text-xs italic bg-orange-50 px-3 py-1 rounded-full font-black">🎫 {b.title}</h4>
                      <div className="flex gap-2">
                        <button onClick={()=>{const nt=prompt("憑證名稱:", b.title); if(nt){const n=bookings.map(i=>i.id===b.id?{...i, title:nt, lastUpdatedById: user.id}:i); setBookings(n); sync({bookings:n});}}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('確定刪除此憑證？')){const n=bookings.filter(i=>i.id!==b.id); setBookings(n); sync({bookings:n});}}} className="text-red-300 text-xs">✕</button>
                      </div>
                    </div>
                    <p className="text-[9px] text-gray-400 mb-3">最後編輯: {getMember(b.lastUpdatedById).name}</p>
                    {b.image && <img src={b.image} className="w-full rounded-[24px] shadow-lg" />}
                  </div>
                ))}
                <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center">
                  <ImageUploader label="UPLOAD VOUCHER" onUpload={(b64)=>{const title=prompt("請輸入憑證名稱:"); if(title){const n=[{id:Date.now(), type:'憑證', title, image:b64, lastUpdatedById: user.id}, ...bookings]; setBookings(n); sync({bookings:n});}}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 記帳] --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in pb-20 font-black">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
              <button onClick={() => setExpenseSubTab('明細')} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${expenseSubTab === '明細' ? 'bg-[#E9C46A] text-white shadow-md scale-105' : 'text-gray-300'}`}>記帳明細</button>
              <button onClick={() => setExpenseSubTab('查帳')} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${expenseSubTab === '查帳' ? 'bg-[#5E9E8E] text-white shadow-md scale-105' : 'text-gray-300'}`}>📊 查帳統計</button>
            </div>

            {expenseSubTab === '明細' ? (
              <>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black">
                    <div className="flex gap-2 mb-4">
                      {(['JPY', 'TWD', 'CNY'] as const).map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setCurrency(c)}
                          className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currency === c ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {c} ({c === 'JPY' ? '日幣' : c === 'TWD' ? '台幣' : '人民幣'})
                        </button>
                      ))}
                    </div>

                    <p className="text-[10px] opacity-40 mb-2 ml-1">消費日期 (行程日與旅行外自訂)</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4 items-center">
                      {dynamicTripDates.map((dStr, idx) => (
                        <button
                          key={dStr}
                          type="button"
                          onClick={() => setExpenseDate(dStr)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${expenseDate === dStr ? 'bg-[#5E9E8E] text-white shadow-md scale-105' : 'bg-gray-100 text-gray-500'}`}
                        >
                          D{idx + 1}: {dStr}
                        </button>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const formatted = customOtherDate.slice(5).replace('-', '/') + ' (旅行外)';
                          setExpenseDate(formatted);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black shrink-0 transition-all ${expenseDate.includes('旅行外') ? 'bg-[#E9C46A] text-white shadow-md scale-105' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}
                      >
                        🗓️ {expenseDate.includes('旅行外') ? expenseDate : '其他日期(旅行外)'}
                      </button>
                    </div>

                    {expenseDate.includes('旅行外') && (
                      <div className="flex items-center gap-2 mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                        <span className="text-[10px] text-gray-400">選擇旅行外具體日期：</span>
                        <input 
                          type="date" 
                          value={customOtherDate}
                          onChange={(e) => {
                            setCustomOtherDate(e.target.value);
                            setExpenseDate(e.target.value.slice(5).replace('-', '/') + ' (旅行外)');
                          }}
                          className="bg-white p-1.5 px-3 rounded-xl text-xs font-black outline-none border border-gray-200"
                        />
                      </div>
                    )}

                    <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容 (項目)..." className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none font-black shadow-inner" />
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                      {['早餐','午餐','晚餐','交通','娛樂','購物'].map(q=>(<button key={q} onClick={()=>setCategory(q)} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-500 font-black shrink-0 active:bg-gray-200">{q}</button>))}
                    </div>
                    
                    <input value={expenseNote} onChange={e=>setExpenseNote(e.target.value)} placeholder="備註說明 (選填)..." className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-xs outline-none font-black shadow-inner border border-gray-100" />
                    
                    <input 
                      type="number" 
                      min="0"
                      value={amount} 
                      onChange={e => {
                        const val = e.target.value.replace('-', '');
                        setAmount(val);
                      }} 
                      placeholder={`金額 (${currency}) - 請輸入大於 0 的正整數`} 
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black shadow-inner mb-4" 
                    />
                    
                    <p className="text-[10px] opacity-30 mb-2 ml-2">PAY METHOD</p>
                    <div className="grid grid-cols-4 gap-2 mb-4">
                      {['現金','信用卡','Suica','PayPay'].map(p=>(
                        <button key={p} onClick={()=>setPayMethod(p)} className={`py-2 rounded-xl text-[10px] font-black transition-all ${payMethod===p?'bg-[#5E9E8E] text-white shadow-md':'bg-gray-100 text-gray-400'}`}>{p}</button>
                      ))}
                    </div>

                    <p className="text-[10px] opacity-30 mb-2 ml-2">PAYER (付款人)</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                      {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m=>(
                        <button key={m.id} onClick={()=>setExpensePayerId(m.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 ${expensePayerId===m.id?'bg-blue-500 text-white shadow-md':'bg-gray-100 text-gray-400'}`}>
                          <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" /> {m.name}
                        </button>
                      ))}
                    </div>

                    <button onClick={()=>{
                        if(!category.trim()) return alert("請輸入消費內容！");
                        if(!amount || Number(amount) <= 0) return alert("金額必須大於 0，不能為負數或空白！");
                        if(!expensePayerId) return alert("請選擇付款人！");

                        const twdVal = (Number(amount) * exchangeRates[currency]).toFixed(0);
                        const rec: ExpenseRecord = {
                          id: editingRecordId || Date.now(), 
                          category: category.trim(), 
                          amount, 
                          currency, 
                          twdAmount: twdVal, 
                          payMethod, 
                          payerId: expensePayerId, 
                          date: expenseDate,
                          note: expenseNote.trim(),
                          lastUpdatedById: user.id
                        };
                        const n = editingRecordId ? records.map(r=>r.id===editingRecordId?rec:r) : [rec, ...records]; 
                        setRecords(n); sync({records:n}); setAmount(''); setCategory(''); setExpenseNote(''); setEditingRecordId(null);
                    }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic">{editingRecordId?'UPDATE':'SAVE'}</button>
                </div>

                <div className="space-y-3 font-black">
                    {records.map(r=>(
                        <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border pr-12 relative group">
                            <div className="flex items-center gap-3">
                                <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full shadow-sm object-cover" />
                                <div className="text-xs font-black">
                                  {r.category} <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-1">{r.date}</span>
                                  {r.note && <p className="text-[10px] text-gray-500 font-normal mt-0.5">💬 {r.note}</p>}
                                  <p className="text-[8px] opacity-40 font-mono italic">{r.payMethod} · {getMember(r.payerId).name} (最後編輯: {getMember(r.lastUpdatedById).name})</p>
                                </div>
                            </div>
                            <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">
                              {r.amount} {r.currency || 'JPY'}
                              <p className="text-[9px] text-gray-300 font-black">≈ NT$ {r.twdAmount}</p>
                            </div>
                            <div className="absolute right-4 flex flex-col gap-2">
                              <button onClick={()=>{setEditingRecordId(r.id); setCategory(r.category); setAmount(r.amount); setExpenseNote(r.note || ''); setPayMethod(r.payMethod); setExpenseDate(r.date); setCurrency(r.currency || 'JPY'); setExpensePayerId(r.payerId); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-300 text-[10px]">🖋️</button>
                              <button onClick={()=>{if(confirm('確定刪除此記帳記錄？')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="text-red-300 text-sm">✕</button>
                            </div>
                        </div>
                    ))}
                </div>
              </>
            ) : (
              /* --- 查帳統計頁面 --- */
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                  <h4 className="text-xs text-[#5E9E8E] uppercase tracking-wider mb-3">選擇成員查帳 (可複選)</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <button 
                      onClick={() => setFilterPayerIds([])}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filterPayerIds.length === 0 ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                    >
                      全部成員
                    </button>
                    {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m => {
                      const isSel = filterPayerIds.includes(m.id);
                      return (
                        <button
                          key={m.id}
                          onClick={() => {
                            const next = isSel ? filterPayerIds.filter(id => id !== m.id) : [...filterPayerIds, m.id];
                            setFilterPayerIds(next);
                          }}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${isSel ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-400'}`}
                        >
                          <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" />
                          {m.name}
                        </button>
                      );
                    })}
                  </div>

                  <div className="bg-[#5E9E8E]/10 p-5 rounded-2xl border border-[#5E9E8E]/20">
                    <p className="text-xs opacity-60 uppercase">篩選統計總額 (折合台幣)</p>
                    <h3 className="text-3xl font-mono mt-1 text-[#5E9E8E]">NT$ {filteredRecords.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h3>
                    <p className="text-[10px] text-gray-400 mt-1">共 {filteredRecords.length} 筆支出紀錄</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-xs text-gray-400 uppercase tracking-wider ml-1">支出明細列表</h4>
                  {filteredRecords.map(r => (
                    <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-gray-50">
                      <div className="flex items-center gap-3">
                        <img src={getMember(r.payerId).avatar} className="w-8 h-8 rounded-full object-cover" />
                        <div>
                          <p className="text-xs font-black">{r.category} <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-1">{r.date}</span></p>
                          {r.note && <p className="text-[10px] text-gray-500 font-normal">💬 {r.note}</p>}
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">{r.payMethod} · 付款人: {getMember(r.payerId).name}</p>
                        </div>
                      </div>
                      <div className="text-right font-mono text-[#5E9E8E]">
                        {r.amount} {r.currency || 'JPY'}
                        <p className="text-[9px] text-gray-300">≈ NT$ {r.twdAmount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 日誌] --- */}
        {activeTab === '日誌' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-orange-50 font-black">
                <textarea value={newJournal.content} onChange={e=>setNewJournal({...newJournal, content:e.target.value})} placeholder="記錄此刻的心情..." className="w-full bg-gray-50 p-4 rounded-2xl mb-4 outline-none min-h-[100px] font-black border-none shadow-inner" />
                <div className="flex justify-between items-center">
                    <ImageUploader label="上傳照片" onUpload={img => setNewJournal({...newJournal, image: img})} />
                    <button onClick={()=>{
                        if(!newJournal.content.trim()) return alert("請輸入日誌內容！");
                        const n: JournalEntry[] = [{id:Date.now(), authorId:user.id, content:newJournal.content.trim(), image:newJournal.image, date:new Date().toLocaleString(), lastUpdatedById: user.id}, ...journals];
                        setJournals(n); sync({journals:n}); setNewJournal({content:'', image:''});
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg italic font-black">Share</button>
                </div>
            </div>
            <div className="space-y-6">
              {journals.map(j => (
                  <div key={j.id} className="bg-white p-6 rounded-[32px] shadow-md border border-gray-100 animate-in slide-in-from-bottom-2 relative font-black">
                      <div className="absolute top-6 right-6 flex gap-3">
                        <button onClick={()=>{const nt=prompt("編輯日誌內容:", j.content); if(nt){const n=journals.map(i=>i.id===j.id?{...i, content:nt, lastUpdatedById: user.id}:i); setJournals(n); sync({journals:n});}}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('確定刪除此日誌？')){const n=journals.filter(i=>i.id!==j.id); setJournals(n); sync({journals:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                          <img src={getMember(j.authorId).avatar} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                          <div>
                            <p className="text-sm font-black text-black">{getMember(j.authorId).name}</p>
                            <p className="text-[9px] opacity-30 italic font-mono uppercase tracking-widest">{j.date} · 最後編輯: {getMember(j.lastUpdatedById).name}</p>
                          </div>
                      </div>
                      <p className="text-sm mb-4 leading-relaxed font-black text-gray-700">{j.content}</p>
                      {j.image && <img src={j.image} className="w-full rounded-[24px] shadow-sm border border-gray-100" />}
                  </div>
              ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 準備] --- */}
        {activeTab === '準備' && (
          <div className="animate-in fade-in pb-20">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
                {['待辦','行李','採購'].map(t=>(
                    <button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${prepSubTab===t?'bg-[#86A760] text-white shadow-md scale-105':'text-gray-300'}`}>{t}</button>
                ))}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black font-black">
                <input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput,task:e.target.value})} placeholder={`新增事項 (${prepSubTab})...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-3 outline-none font-black shadow-inner border-none" />
                
                <input value={newTodoInput.note} onChange={e=>setNewTodoInput({...newTodoInput,note:e.target.value})} placeholder={`備註或詳細說明 (選填)...`} className="w-full p-3 bg-gray-50 rounded-xl mb-4 text-xs outline-none font-black shadow-inner border-none" />
                
                <p className="text-[10px] opacity-30 mb-2 ml-1">指派人員 (預選自己，可點選切換或複選)</p>
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m=>(
                        <button key={m.id} onClick={()=>{
                            const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i=>i!==m.id) : [...newTodoInput.assigneeIds, m.id];
                            setNewTodoInput({...newTodoInput, assigneeIds: ids});
                        }} className={`p-2 px-4 rounded-xl border text-[10px] font-black transition-all flex items-center gap-1.5 ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-inner scale-105':'bg-gray-100 text-gray-400 border-transparent'}`}>
                          <img src={m.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                          {m.name}
                        </button>
                    ))}
                </div>
                <button onClick={()=>{
                    if(!newTodoInput.task.trim()) return alert("請輸入事項名稱！");
                    if(newTodoInput.assigneeIds.length === 0) return alert("請至少選擇一位指派人員！");

                    const newItem: TodoItem = { id: editingTodoId || Date.now(), task: newTodoInput.task.trim(), note: newTodoInput.note.trim(), assigneeIds: newTodoInput.assigneeIds, completedAssigneeIds: [], category: prepSubTab, lastUpdatedById: user.id };
                    const n = editingTodoId ? todos.map(t => t.id === editingTodoId ? newItem : t) : [newItem, ...todos];
                    setTodos(n); sync({todos:n}); setNewTodoInput({task:'', note:'', assigneeIds:[user.id]}); setEditingTodoId(null);
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg italic">{editingTodoId ? 'UPDATE' : 'ADD'}</button>
                {editingTodoId && <button onClick={()=>{setEditingTodoId(null); setNewTodoInput({task:'', note:'', assigneeIds:[user.id]});}} className="w-full mt-2 text-xs opacity-30 font-black">Cancel Edit</button>}
            </div>

            <div className="space-y-4">
                {todos.filter(t=>t.category===prepSubTab).map(todo => (
                    <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-md border border-gray-100 flex justify-between items-center group font-black">
                        <div className="flex flex-col flex-1 pr-4">
                            <h4 className={`text-sm font-black transition-all ${todo.completedAssigneeIds.length === todo.assigneeIds.length ? 'line-through opacity-20 text-gray-400' : 'text-black'}`}>{todo.task}</h4>
                            {todo.note && <p className="text-[10px] text-gray-500 font-normal mt-0.5">💬 {todo.note}</p>}
                            <p className="text-[9px] text-gray-300 mt-1">最後編輯: {getMember(todo.lastUpdatedById).name}</p>
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {todo.assigneeIds.map(id => {
                                    const m = getMember(id);
                                    const isDone = todo.completedAssigneeIds.includes(id);
                                    return (
                                        <button key={id} onClick={() => {
                                            const question = isDone ? `取消 ${m.name} 的完成狀態？` : `標記 ${m.name} 已完成？`;
                                            if(!confirm(question)) return;
                                            const nComp = isDone ? todo.completedAssigneeIds.filter(cid=>cid!==id) : [...todo.completedAssigneeIds, id];
                                            const n = todos.map(t=>t.id===todo.id ? {...t, completedAssigneeIds: nComp, lastUpdatedById: user.id} : t);
                                            setTodos(n); sync({todos:n});
                                        }} className={`text-[8px] px-3 py-1.5 rounded-full font-black shadow-sm transition-all flex items-center gap-1 ${isDone ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                          <img src={m.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                                          {m?.name} {isDone && "✅"}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={()=>{setEditingTodoId(todo.id); setNewTodoInput({task: todo.task, note: todo.note || '', assigneeIds: todo.assigneeIds});}} className="text-blue-200 text-lg active:text-blue-400">🖋️</button>
                            <button onClick={()=>{if(confirm('確定刪除此事項？')){const n=todos.filter(t=>t.id!==todo.id); setTodos(n); sync({todos:n});}}} className="text-red-200 text-lg active:text-red-400">✕</button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {/* --- [Tab: 成員] (加入與移除旅伴秒級響應) --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 pb-20 font-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#5E9E8E] italic uppercase text-xs font-black tracking-widest">Trip Members</h3>
              {user.loginCode === 'wayne' && (
                <button 
                  onClick={() => setShowAddExistingModal(true)}
                  className="text-[10px] bg-[#86A760] text-white px-3 py-1.5 rounded-full shadow-md active:scale-95 transition-transform"
                >
                  + 加入現有成員
                </button>
              )}
            </div>

            {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m => {
              const canEditThisMember = user.loginCode === 'wayne' || user.id === m.id;
              return (
                <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-gray-50 font-black relative">
                  <img src={m.avatar} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-md font-black" />
                  <div className="flex-1">
                      <h4 className="text-lg text-black font-black">{m.name}</h4>
                      {user.loginCode === 'wayne' && (
                        <div className="mt-3 space-y-1.5">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">History Logs:</p>
                            {(m.editLogs || []).slice(-3).reverse().map((log, i) => (
                                <p key={i} className="text-[9px] opacity-40 italic tracking-tighter font-black">· {log}</p>
                            ))}
                        </div>
                      )}
                  </div>
                  
                  <div className="flex gap-2">
                    {canEditThisMember && (
                      <button 
                        onClick={() => setEditingMemberModal(m)} 
                        className="bg-gray-100 hover:bg-gray-200 text-xs px-3 py-2 rounded-2xl text-blue-500 font-black"
                      >
                        🖋️ 編輯
                      </button>
                    )}
                    {/* 移除旅伴即時消失 */}
                    {user.loginCode === 'wayne' && m.loginCode !== 'wayne' && (
                      <button 
                        onClick={() => {
                          if (confirm(`確定將 ${m.name} 從此行程移除？其建立的記錄仍會完整保留。`)) {
                            const nextIds = currentMemberIds.filter(id => id !== m.id);
                            handleUpdateTripMembers(nextIds);
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-xs px-3 py-2 rounded-2xl text-red-500 font-black"
                      >
                        ✕ 移除旅伴
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 💥 加入現有成員彈窗（含確認提示與即時畫面切換） */}
      {showAddExistingModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-4 uppercase text-lg">選擇要加入行程的既有成員</h3>
            <p className="text-[10px] text-gray-400 text-center mb-6">新增全新用戶請回到最開始的主畫面 ADMIN MODE</p>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6">
              {allMembers.map(m => {
                const isSelected = currentMemberIds.includes(m.id);
                return (
                  <div 
                    key={m.id} 
                    onClick={() => {
                      if (isSelected) {
                        if (confirm(`確定要將「${m.name}」從本行程移除嗎？`)) {
                          const nextIds = currentMemberIds.filter(id => id !== m.id);
                          handleUpdateTripMembers(nextIds);
                        }
                      } else {
                        if (confirm(`確定要將「${m.name}」加入本行程嗎？`)) {
                          const nextIds = [...currentMemberIds, m.id];
                          handleUpdateTripMembers(nextIds);
                        }
                      }
                    }} 
                    className={`p-4 rounded-2xl flex items-center gap-4 cursor-pointer transition-all ${isSelected ? 'bg-green-50 border border-[#86A760]' : 'bg-gray-50'}`}
                  >
                    <img src={m.avatar} className="w-10 h-10 rounded-full object-cover" />
                    <span className="flex-1 text-sm font-black">{m.name}</span>
                    <span className="text-xs font-black">{isSelected ? '✓ 已在行程中 (點擊移除)' : '+ 點擊加入'}</span>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowAddExistingModal(false)} className="w-full py-4 bg-[#86A760] text-white rounded-3xl font-black">完成</button>
          </div>
        </div>
      )}

      {/* 成員編輯 Modal */}
      {editingMemberModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-6 uppercase text-xl">成員設定與頭像更新</h3>
            <div className="flex flex-col items-center gap-3 mb-6">
              <img src={editingMemberModal.avatar || PRESET_ANIMAL_AVATARS[0]} className="w-20 h-20 rounded-full border-4 border-gray-100 object-cover shadow-md" />
              
              <div className="flex gap-2">
                {PRESET_ANIMAL_AVATARS.map((av, idx) => (
                  <img 
                    key={idx} 
                    src={av} 
                    onClick={() => setEditingMemberModal({...editingMemberModal, avatar: av})} 
                    className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 ${editingMemberModal.avatar === av ? 'border-[#5E9E8E] scale-105' : 'border-gray-200'}`} 
                  />
                ))}
              </div>

              <ImageUploader label="上傳自訂頭像" onUpload={(b64)=>setEditingMemberModal({...editingMemberModal, avatar:b64})} />
            </div>

            <label className="text-[10px] text-gray-400 ml-2">姓名</label>
            <input placeholder="Name" value={editingMemberModal.name} onChange={e=>setEditingMemberModal({...editingMemberModal, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-100 font-black" />
            
            {user.loginCode === 'wayne' && (
              <>
                <label className="text-[10px] text-gray-400 ml-2">登入代碼 (Code)</label>
                <input placeholder="Login Code" value={editingMemberModal.loginCode} onChange={e=>setEditingMemberModal({...editingMemberModal, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none border border-gray-100 font-black" />
              </>
            )}
            
            <div className="flex gap-4">
              <button onClick={()=>setEditingMemberModal(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">取消</button>
              <button onClick={()=>{
                const trimmedName = editingMemberModal.name.trim();
                if (!trimmedName) return alert("請輸入姓名！");

                const nameConflict = allMembers.some(m => m.id !== editingMemberModal.id && m.name === trimmedName);
                if (nameConflict) return alert("該名字有人使用，請更換名字");

                if (user.loginCode === 'wayne') {
                  const trimmedCode = editingMemberModal.loginCode.trim();
                  if (!trimmedCode) return alert("請輸入登入代碼！");
                  const codeConflict = allMembers.some(m => m.id !== editingMemberModal.id && m.loginCode === trimmedCode);
                  if (codeConflict) return alert("該CODE有人使用，請更換CODE");
                  editingMemberModal.loginCode = trimmedCode;
                }

                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMemberModal.editLogs || []), `${user.name} modified at ${timestamp}`];
                const finalMember = { ...editingMemberModal, name: trimmedName, editLogs: newLogs };
                
                const nextMembers = allMembers.map(m => m.id === finalMember.id ? finalMember : m);

                onUpdateMembers(nextMembers);
                sync({});
                setEditingMemberModal(null);
              }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic font-black">儲存成員</button>
            </div>
          </div>
        </div>
      )}

      {/* 行程編輯彈窗 */}
      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
            <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom font-black">
                <h3 className="text-2xl mb-8 italic text-[#5E9E8E] uppercase tracking-tighter">Edit Travel Stop</h3>
                <div className="flex gap-3 mb-6 bg-gray-50 rounded-2xl p-2 shadow-inner">
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl font-black" value={planForm.time.split(':')[0]} onChange={e=>setPlanForm({...planForm,time:`${e.target.value}:${planForm.time.split(':')[1]}`})}>
                        {Array.from({length: 24}).map((_,i)=><option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} 點</option>)}
                    </select>
                    <select className="flex-1 p-4 bg-transparent outline-none text-xl font-black" value={planForm.time.split(':')[1]} onChange={e=>setPlanForm({...planForm,time:`${planForm.time.split(':')[0]}:${e.target.value}`})}>
                        {['00','10','20','30','40','50'].map(m=><option key={m} value={m}>{m} 分</option>)}
                    </select>
                </div>
                <input placeholder="要去哪裡？" value={planForm.title} onChange={e=>setPlanForm({...planForm,title:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-4 outline-none text-xl shadow-inner border-none font-black" />
                <textarea placeholder="備註或細節..." value={planForm.desc} onChange={e=>setPlanForm({...planForm,desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm h-32 leading-relaxed shadow-inner border-none font-black" />
                <div className="flex gap-4">
                    <button onClick={()=>setShowPlanModal({show:false,type:'add'})} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black uppercase">Cancel</button>
                    <button onClick={()=>{
                        if(!planForm.title.trim()) return alert("請輸入地點或活動標題！");
                        const dPlans = schedules[activeDay] || [];
                        const updatedPlan = { ...planForm, title: planForm.title.trim(), lastUpdatedById: user.id };
                        const n = showPlanModal.type === 'add' ? [...dPlans, {...updatedPlan, id: Date.now()}] : dPlans.map(p=>p.id===showPlanModal.data?.id ? {...updatedPlan, id:p.id} : p);
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
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 font-black ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1':'opacity-20'}`}>
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[10px] uppercase font-black tracking-tighter">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* 機票編輯彈窗 */}
      {showFlightModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl overflow-y-auto max-h-[90vh]">
            <h3 className="text-2xl mb-6 italic text-[#5E9E8E] uppercase tracking-tighter">{showFlightModal.type === 'add' ? 'Add' : 'Edit'} Flight</h3>
            <div className="space-y-4">
              <input placeholder="Airline (如: 長榮航空)" value={flightForm.airline} onChange={e=>setFlightForm({...flightForm, airline:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black" />
              <input placeholder="Flight No. (如: BR198)" value={flightForm.flightNo} onChange={e=>setFlightForm({...flightForm, flightNo:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black" />
              
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="From (如: TPE)" value={flightForm.fromCode} onChange={e=>setFlightForm({...flightForm, fromCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black" />
                <input placeholder="To (如: NRT)" value={flightForm.toCode} onChange={e=>setFlightForm({...flightForm, toCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] ml-2 opacity-40">起飛時間 (Dep Time)</label><input type="time" value={flightForm.depTime} onChange={e=>setFlightForm({...flightForm, depTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-mono" /></div>
                <div><label className="text-[10px] ml-2 opacity-40">抵達時間 (Arr Time)</label><input type="time" value={flightForm.arrTime} onChange={e=>setFlightForm({...flightForm, arrTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black font-mono" /></div>
              </div>

              <div>
                <label className="text-[10px] ml-2 opacity-40">搭乘日期 (選取行程日)</label>
                <select 
                  value={flightForm.date} 
                  onChange={e=>setFlightForm({...flightForm, date: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black"
                >
                  {dynamicTripDates.map((dStr, idx) => (
                    <option key={dStr} value={dStr}>D{idx + 1} ({dStr})</option>
                  ))}
                </select>
              </div>

              <input placeholder="飛行時長 (如: 3h 15m)" value={flightForm.duration} onChange={e=>setFlightForm({...flightForm, duration:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black" />
            </div>
            
            <div className="flex gap-4 mt-8">
              <button onClick={()=>setShowFlightModal({show:false, type:'add', data:null})} className="flex-1 py-4 bg-gray-100 rounded-3xl uppercase font-black">Cancel</button>
              <button onClick={()=>{
                if(!flightForm.airline.trim()) return alert("請輸入航空公司！");
                if(!flightForm.flightNo.trim()) return alert("請輸入航班編號！");
                if(!flightForm.fromCode.trim() || !flightForm.toCode.trim()) return alert("請輸入起訖機場代碼！");

                const updatedFlight = { ...flightForm, airline: flightForm.airline.trim(), flightNo: flightForm.flightNo.trim(), lastUpdatedById: user.id };
                const n = showFlightModal.type === 'add' ? [{...updatedFlight, id: Date.now()}, ...flights] : flights.map(f=>f.id===showFlightModal.data?.id ? updatedFlight : f);
                setFlights(n); sync({flights:n}); setShowFlightModal({show:false, type:'add', data:null});
              }} className="flex-1 py-4 bg-blue-600 text-white rounded-3xl shadow-lg italic uppercase font-black">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. 入口點
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);
  const [notice, setNotice] = useState<string>('');

  const fetchCloudData = async () => {
    // 1. 同步成員
    const { data: mData } = await supabase.from('trips').select('content').eq('id', '__app_members__').single();
    if (mData?.content && Array.isArray(mData.content)) {
      setAllMembers(mData.content);
      localStorage.setItem('app_members_v8', JSON.stringify(mData.content));
    } else {
      const cachedM = localStorage.getItem('app_members_v8');
      if (cachedM) {
        setAllMembers(JSON.parse(cachedM));
      } else {
        const defaultM: Member[] = [
          { id:'1', name:'肚皮', avatar: PRESET_ANIMAL_AVATARS[0], loginCode:'wayne', editLogs:['Account created'] },
          { id:'2', name:'豆豆皮', avatar: PRESET_ANIMAL_AVATARS[1], loginCode:'Elvina', editLogs:['Account created'] }
        ];
        setAllMembers(defaultM);
        localStorage.setItem('app_members_v8', JSON.stringify(defaultM));
        await supabase.from('trips').upsert({ id: '__app_members__', content: defaultM });
      }
    }

    // 2. 同步行程
    const { data: tData } = await supabase.from('trips').select('content').eq('id', '__app_trips__').single();
    if (tData?.content && Array.isArray(tData.content)) {
      setSelectedTrips(tData.content);
      localStorage.setItem('app_trips_v8', JSON.stringify(tData.content));
    } else {
      const cachedT = localStorage.getItem('app_trips_v8');
      if (cachedT) {
        setSelectedTrips(JSON.parse(cachedT));
      } else {
        const today = getTodayDateString();
        const defaultT: Trip[] = [{ id:'hokkaido2026', title:'2026 日本之旅', startDate: today, endDate: today, emoji:'☃️', memberIds:['1','2'] }];
        setSelectedTrips(defaultT);
        localStorage.setItem('app_trips_v8', JSON.stringify(defaultT));
        await supabase.from('trips').upsert({ id: '__app_trips__', content: defaultT });
      }
    }

    // 3. 同步公告
    const { data: nData } = await supabase.from('trips').select('content').eq('id', '__app_notice__').single();
    if (nData?.content && typeof nData.content === 'string') {
      setNotice(nData.content);
      localStorage.setItem('app_notice_v8', nData.content);
    }
  };

  useEffect(() => {
    const localM = localStorage.getItem('app_members_v8');
    const localT = localStorage.getItem('app_trips_v8');
    const localN = localStorage.getItem('app_notice_v8');
    if (localM) setAllMembers(JSON.parse(localM));
    if (localT) setSelectedTrips(JSON.parse(localT));
    if (localN) setNotice(localN);

    fetchCloudData();

    const appChannel = supabase
      .channel('app-global-sync-v8')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: 'id=in.(__app_members__,__app_trips__,__app_notice__)' },
        (payload) => {
          if (payload.new) {
            const p = payload.new as any;
            if (p.id === '__app_members__' && Array.isArray(p.content)) {
              setAllMembers(p.content);
              localStorage.setItem('app_members_v8', JSON.stringify(p.content));
            }
            if (p.id === '__app_trips__' && Array.isArray(p.content)) {
              setSelectedTrips(p.content);
              localStorage.setItem('app_trips_v8', JSON.stringify(p.content));
            }
            if (p.id === '__app_notice__' && typeof p.content === 'string') {
              setNotice(p.content);
              localStorage.setItem('app_notice_v8', p.content);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(appChannel);
    };
  }, []);

  const handleUpdateMembers = async (newM: Member[]) => {
    setAllMembers(newM);
    localStorage.setItem('app_members_v8', JSON.stringify(newM));
    await supabase.from('trips').upsert({ id: '__app_members__', content: newM });
  };

  const handleAddTrip = async (t: Trip) => {
    const next = [...selectedTrips, t];
    setSelectedTrips(next);
    localStorage.setItem('app_trips_v8', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  const handleDeleteTrip = async (id: string) => {
    const next = selectedTrips.filter(t => t.id !== id);
    setSelectedTrips(next);
    localStorage.setItem('app_trips_v8', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  // 💥 解決行程成員更新即時同步到 __app_trips__
  const handleUpdateTrip = async (updated: Trip) => {
    const next = selectedTrips.map(t => t.id === updated.id ? updated : t);
    setSelectedTrips(next);
    setSelectedTrip(updated);
    localStorage.setItem('app_trips_v8', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  const handleUpdateNotice = async (n: string) => {
    setNotice(n);
    localStorage.setItem('app_notice_v8', n);
    await supabase.from('trips').upsert({ id: '__app_notice__', content: n });
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTrip(null);
    fetchCloudData();
  };

  if (!user) return <LoginPage onLogin={(loggedUser) => {
    setUser(loggedUser);
    fetchCloudData();
  }} allMembers={allMembers} />;
  
  if (!selectedTrip) return (
    <TripSelector 
      user={user} 
      onLogout={handleLogout}
      allTrips={selectedTrips} 
      allMembers={allMembers} 
      onSelect={setSelectedTrip} 
      onAddTrip={handleAddTrip} 
      onDeleteTrip={handleDeleteTrip} 
      onUpdateMembers={handleUpdateMembers} 
      notice={notice}
      onUpdateNotice={handleUpdateNotice}
    />
  );

  return (
    <MainApp 
      user={user} 
      tripData={selectedTrip} 
      allMembers={allMembers} 
      onUpdateMembers={handleUpdateMembers} 
      onUpdateTrip={handleUpdateTrip}
      onBack={() => setSelectedTrip(null)} 
    />
  );
}