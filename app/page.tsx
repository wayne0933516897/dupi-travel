"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase 初始化 ---
const supabase = createClient(
  'https://oqfysuuoxduginkfgggg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnlzdXVveGR1Z2lua2ZnZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDUxNjgsImV4cCI6MjA4MjIyMTE2OH0.igtMj90ihFLc3RIP0UGzXcUBxx4E16xMa9_HQcSfju8'
);

// --- 可愛動物預設頭像 ---
const PRESET_ANIMAL_AVATARS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=150&auto=format&fit=crop&q=80', // 小狗
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=150&auto=format&fit=crop&q=80', // 貓咪
  'https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?w=150&auto=format&fit=crop&q=80', // 小熊
  'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=150&auto=format&fit=crop&q=80', // 兔子
  'https://images.unsplash.com/photo-1516934024742-b461fba47600?w=150&auto=format&fit=crop&q=80', // 無尾熊
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?w=150&auto=format&fit=crop&q=80'  // 狐狸
];

// --- 型別定義 ---
interface Member { id: string; name: string; avatar: string; loginCode: string; editLogs: string[]; }
interface ExpenseRecord { id: number; category: string; amount: string; currency: 'JPY'|'TWD'|'CNY'; twdAmount: string; payMethod: string; payerId: string; date: string; note?: string; lastUpdatedById?: string; }
interface Plan { id: number; time: string; title: string; desc: string; icon: string; lastUpdatedById?: string; }
interface TodoItem { id: number; task: string; assigneeIds: string[]; completedAssigneeIds: string[]; category: string; lastUpdatedById?: string; }
interface JournalEntry { id: number; authorId: string; content: string; date: string; image?: string; lastUpdatedById?: string; }
interface Flight { id: number; airline: string; flightNo: string; fromCode: string; toCode: string; depTime: string; arrTime: string; duration: string; date: string; baggage: string; aircraft: string; lastUpdatedById?: string; }
interface BookingDoc { id: number; type: string; title: string; image?: string; lastUpdatedById?: string; }
interface Trip { id: string; title: string; startDate: string; endDate: string; emoji: string; memberIds: string[]; }
interface ScheduleData { [key: number]: Plan[]; }
interface CityWeatherConfig { id: string; name: string; dayIndexes: number[]; }

function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
        if (found) onLogin(found); else alert('❌ 查無代碼');
      }} className="w-full max-w-xs py-5 bg-[#86A760] text-white rounded-[24px] font-black shadow-lg active:scale-95 transition-transform">LOGIN</button>
    </div>
  );
}

// 2. 行程選擇與全域用戶管理
function TripSelector({ user, onSelect, allTrips, onAddTrip, onDeleteTrip, allMembers, onUpdateMembers }: { user: Member, onSelect: (trip: Trip) => void, allTrips: Trip[], onAddTrip: any, onDeleteTrip: any, allMembers: Member[], onUpdateMembers: any }) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showUserAdmin, setShowUserAdmin] = useState(false);
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

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32">
      <div className="flex justify-between items-center mb-12">
        <div className="font-black">
          <p className="text-xs text-gray-400 uppercase tracking-widest">{user.loginCode === 'wayne' ? 'Admin Mode,' : 'User Mode,'}</p>
          <h2 className="text-2xl text-black">{user.name}</h2>
        </div>
        {user.loginCode === 'wayne' && (
          <div onClick={() => setShowUserAdmin(true)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer active:scale-90 transition-transform">
            <img src={user.avatar} className="w-full h-full object-cover" />
          </div>
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
                <button onClick={()=>setShowAddTrip(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button>
                <button onClick={()=>{
                  if(!newTrip.title) return alert("Please enter trip title");
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
            <div className="flex justify-between items-center mb-8 italic"><h3 className="text-xl">USER ADMIN (全域用戶管理)</h3><button onClick={()=>setShowUserAdmin(false)} className="text-gray-300">✕</button></div>
            <button onClick={() => setEditingMember({id: Date.now().toString(), name:'', loginCode:'', avatar: PRESET_ANIMAL_AVATARS[0], editLogs:[]})} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl mb-8 text-gray-300">+ 新增系統用戶</button>
            <div className="space-y-4">
              {allMembers.map(m => (
                <div key={m.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-3xl shadow-sm">
                  <img src={m.avatar} className="w-10 h-10 rounded-full object-cover border" />
                  <div className="flex-1 font-black">{m.name}<p className="text-[9px] opacity-30 tracking-widest uppercase">Logs: {m.editLogs?.length || 0}</p></div>
                  <button onClick={()=>setEditingMember(m)} className="text-xs text-blue-500">Edit</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-6 uppercase text-xl">設定系統用戶</h3>
            <div className="flex flex-col items-center gap-3 mb-4">
              <img src={editingMember.avatar || PRESET_ANIMAL_AVATARS[0]} className="w-20 h-20 rounded-full border-4 border-gray-100 object-cover shadow-md" />
              <div className="flex gap-2">
                {PRESET_ANIMAL_AVATARS.map((av, idx) => (
                  <img key={idx} src={av} onClick={() => setEditingMember({...editingMember, avatar: av})} className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 object-cover ${editingMember.avatar === av ? 'border-[#5E9E8E]' : 'border-gray-200'}`} />
                ))}
              </div>
              <ImageUploader label="上傳相片" onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
            </div>
            <input placeholder="Name" value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-100 font-black" />
            <input placeholder="Login Code" value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none border border-gray-100 font-black" />
            <div className="flex gap-4">
              <button onClick={()=>setEditingMember(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl">Cancel</button>
              <button onClick={()=>{
                const trimmedName = editingMember.name.trim();
                const trimmedCode = editingMember.loginCode.trim();
                if (!trimmedName) return alert("請輸入姓名");
                if (!trimmedCode) return alert("請輸入登入代碼");

                if (allMembers.some(m => m.id !== editingMember.id && m.name === trimmedName)) return alert("該名字有人使用，請更換名字");
                if (allMembers.some(m => m.id !== editingMember.id && m.loginCode === trimmedCode)) return alert("該CODE有人使用，請更換CODE");

                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMember.editLogs || []), `Updated by Admin at ${timestamp}`];
                const finalMember = { ...editingMember, name: trimmedName, loginCode: trimmedCode, editLogs: newLogs };
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
function MainApp({ onBack, user, tripData, allMembers, onUpdateMembers }: { onBack: () => void, user: Member, tripData: Trip, allMembers: Member[], onUpdateMembers: any }) {
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  const [bookSubTab, setBookSubTab] = useState('機票'); 

  const dynamicTripDates = useMemo(() => {
    return getDatesList(tripData.startDate, tripData.endDate);
  }, [tripData.startDate, tripData.endDate]);

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);

  // 城市天氣設定
  const [cityConfigs, setCityConfigs] = useState<CityWeatherConfig[]>([]);
  const [newCityName, setNewCityName] = useState('');
  const [showCityEditor, setShowCityEditor] = useState(false);

  // 匯率匯入機制 (每日基準：1 JPY = 0.22 TWD, 1 CNY = 4.5 TWD)
  const [exchangeRates, setExchangeRates] = useState<{ JPY: number; CNY: number; TWD: number }>({ JPY: 0.22, CNY: 4.5, TWD: 1.0 });

  useEffect(() => {
    // 每日中午 12 點更新最新匯率 (抓取標準國際公開介面)
    const fetchRates = async () => {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/TWD');
        const data = await res.json();
        if (data && data.rates) {
          const twdPerJpy = 1 / data.rates.JPY;
          const twdPerCny = 1 / data.rates.CNY;
          setExchangeRates({ JPY: Number(twdPerJpy.toFixed(4)), CNY: Number(twdPerCny.toFixed(3)), TWD: 1.0 });
        }
      } catch (e) {
        // 預設備援
        setExchangeRates({ JPY: 0.22, CNY: 4.5, TWD: 1.0 });
      }
    };
    fetchRates();
  }, []);

  // 天氣狀態
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

  // Modal 狀態
  const [editingMemberModal, setEditingMemberModal] = useState<Member | null>(null);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);

  // 記帳輸入狀態
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'JPY'|'TWD'|'CNY'>('JPY');
  const [category, setCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [payMethod, setPayMethod] = useState('現金'); 
  const [expensePayerId, setExpensePayerId] = useState(user.id);
  const [expenseDate, setExpenseDate] = useState(dynamicTripDates[0] || '10/07');

  const [newJournal, setNewJournal] = useState({ content: '', image: '' });
  const [newTodoInput, setNewTodoInput] = useState({ task: '', assigneeIds: [] as string[] });
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);

  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });

  const [showFlightModal, setShowFlightModal] = useState<{show: boolean, type: 'add'|'edit', data?: Flight | null}>({show: false, type: 'add', data: null});
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '10:00', arrTime: '14:00', duration: '', date: dynamicTripDates[0] || '10/07', baggage: '', aircraft: '' });

  // 統一透過 ID 動態查成員 (確保改名、換頭像後全域所有歷史記錄一致更新)
  const getMember = (id: string) => {
    const found = allMembers.find(m => m.id === id);
    return found || { id, name: '未知成員', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: '', editLogs: [] };
  };

  const updateLocalState = (c: any) => {
    if (!c) return;
    setRecords(c.records || []);
    setSchedules(c.schedules || {});
    setTodos(c.todos || []);
    setJournals(c.journals || []);
    setFlights(c.flights || []);
    setBookings(c.bookings || []);
    if (c.cityConfigs) setCityConfigs(c.cityConfigs);
  };

  // 即時監聽與初始化讀取
  useEffect(() => {
    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data?.content) updateLocalState(data.content);
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

  // 天氣抓取邏輯 (快取在每日半夜 12 點自動失效重新向氣象伺服器抓取)
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

  const sync = async (update: any) => {
    const full = { records, schedules, todos, journals, flights, bookings, cityConfigs, ...update };
    await supabase.from('trips').upsert({ id: tripData.id, content: full });
  };

  const sortedFlights = useMemo(() => {
    return [...flights].sort((a, b) => {
      const compDate = a.date.localeCompare(b.date);
      if (compDate !== 0) return compDate;
      return a.depTime.localeCompare(b.depTime);
    });
  }, [flights]);

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
                        if (!newCityName.trim()) return;
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

            {/* 行程景點項目 (顯示最後編輯者) */}
            <div className="mt-8 space-y-8 relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
                {(schedules[activeDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(item=>{
                    const editor = item.lastUpdatedById ? getMember(item.lastUpdatedById) : null;
                    return (
                      <div key={item.id} className="flex gap-4 relative">
                          <div className="w-10 flex flex-col items-center shrink-0">
                              <div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm"></div>
                              <span className="text-[10px] text-gray-400 mt-2 font-mono">{item.time}</span>
                          </div>
                          <div className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 relative group">
                              <div className="flex justify-between items-start">
                                <h4 className="font-black text-sm">{item.icon} {item.title}</h4>
                                {editor && (
                                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                                    <img src={editor.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                                    <span className="text-[9px] text-[#5E9E8E] font-black">
                                      最後編輯: {editor.name}
                                    </span>
                                  </div>
                                )}
                              </div>
                              <p className="text-[10px] opacity-40 mt-1 leading-relaxed">{item.desc}</p>
                              <div className="mt-4 flex justify-between items-center">
                                  <button onClick={(e) => { e.stopPropagation(); window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`, '_blank'); }} className="text-[10px] bg-gray-50 text-[#5E9E8E] px-3 py-1.5 rounded-full font-black shadow-inner active:scale-95">📍 GOOGLE MAP</button>
                                  <div className="flex gap-3 z-20">
                                      <button onClick={(e)=>{e.stopPropagation(); setPlanForm(item); setShowPlanModal({show:true,type:'edit',data:item});}} className="text-xs text-blue-400 bg-blue-50 p-2 rounded-xl active:scale-90 transition-transform">🖋️</button>
                                      <button onClick={(e)=>{e.stopPropagation(); if(confirm('確定刪除？')){const n=(schedules[activeDay]||[]).filter(p=>p.id!==item.id); const up={...schedules,[activeDay]:n}; setSchedules(up); sync({schedules:up});}}} className="text-xs text-red-400 bg-red-50 p-2 rounded-xl active:scale-90 transition-transform">🗑️</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                    );
                })}
                <button onClick={()=> setShowPlanModal({show:true,type:'add'})} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black active:bg-gray-50">+ ADD NEW STOP</button>
            </div>
          </div>
        )}

        {/* --- [Tab: 預訂] (機票與憑證顯示最後編輯者) --- */}
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
                {sortedFlights.map(f => {
                  const editor = f.lastUpdatedById ? getMember(f.lastUpdatedById) : null;
                  return (
                    <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50 relative p-6 font-black">
                      <div className="flex justify-between mb-4 border-b border-dashed pb-4 items-center">
                        <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{f.airline}</span>
                        <h2 className="text-2xl font-black italic">{f.flightNo}</h2>
                        {editor && (
                          <div className="flex items-center gap-1 bg-gray-50 px-2 py-0.5 rounded-full">
                            <img src={editor.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                            <span className="text-[9px] text-gray-400 font-black">最後編輯: {editor.name}</span>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between text-center items-center">
                        <div><p className="text-3xl font-black">{f.fromCode}</p><p className="text-blue-500 font-mono text-sm">{f.depTime}</p></div>
                        <div className="flex-1 flex flex-col items-center opacity-30"><span className="text-[10px] uppercase font-black">{f.duration}</span><div className="w-full h-px bg-blue-100 my-1 relative"><span className="absolute -top-2 left-1/2 -translate-x-1/2">✈️</span></div><p className="text-[10px] font-bold text-black">{f.date}</p></div>
                        <div><p className="text-3xl font-black">{f.toCode}</p><p className="text-blue-600 font-mono text-sm">{f.arrTime}</p></div>
                      </div>
                      <div className="flex gap-3 justify-end mt-4">
                        <button onClick={()=>{setFlightForm(f); setShowFlightModal({show:true, type:'edit', data:f});}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('Delete?')){const n=flights.filter(i=>i.id!==f.id); setFlights(n); sync({flights:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Vouchers</h3>
                {bookings.map(b=>{
                  const editor = b.lastUpdatedById ? getMember(b.lastUpdatedById) : null;
                  return (
                    <div key={b.id} className="bg-white p-6 rounded-[32px] shadow-xl border border-gray-50 group relative">
                      <div className="flex justify-between mb-4 items-center">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs italic bg-orange-50 px-3 py-1 rounded-full font-black">🎫 {b.title}</h4>
                          {editor && (
                            <span className="text-[9px] text-gray-400">最後編輯: {editor.name}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button onClick={()=>{const nt=prompt("Name:", b.title); if(nt){const n=bookings.map(i=>i.id===b.id?{...i, title:nt, lastUpdatedById: user.id}:i); setBookings(n); sync({bookings:n});}}} className="text-blue-400 text-xs">🖋️</button>
                          <button onClick={()=>{if(confirm('Delete?')){const n=bookings.filter(i=>i.id!==b.id); setBookings(n); sync({bookings:n});}}} className="text-red-300 text-xs">✕</button>
                        </div>
                      </div>
                      {b.image && <img src={b.image} className="w-full rounded-[24px] shadow-lg" />}
                    </div>
                  );
                })}
                <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center">
                  <ImageUploader label="UPLOAD VOUCHER" onUpload={(b64)=>{const title=prompt("Name:"); if(title){const n=[{id:Date.now(), type:'憑證', title, image:b64, lastUpdatedById: user.id}, ...bookings]; setBookings(n); sync({bookings:n});}}} />
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 記帳] (多幣別 JPY/TWD/CNY、備註功能、最後編輯者) --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in pb-20 font-black">
            <div className="bg-[#E9C46A] rounded-[24px] p-6 mb-6 text-black shadow-md italic font-black">
                <p className="text-sm opacity-90 uppercase tracking-widest font-black">Total Spent</p>
                <h2 className="text-4xl font-mono font-black">NT$ {records.reduce((sum, r) => sum + Number(r.twdAmount), 0).toLocaleString()}</h2>
                {amount && (
                  <p className="text-[10px] mt-2 opacity-50 font-black tracking-widest">
                    換算: {amount} {currency} ≈ NT$ {
                      currency === 'TWD' ? Number(amount).toFixed(0) :
                      currency === 'JPY' ? (Number(amount) * exchangeRates.JPY).toFixed(0) :
                      (Number(amount) * exchangeRates.CNY).toFixed(0)
                    } TWD (依最新牌告匯率)
                  </p>
                )}
            </div>

            <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black">
                <p className="text-[10px] opacity-40 mb-2 ml-1">消費日期 (點擊行程日快速切換)</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
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
                </div>

                {/* 貨幣切換快速按鈕 */}
                <p className="text-[10px] opacity-40 mb-2 ml-1">計價幣別</p>
                <div className="flex gap-2 mb-4">
                  {(['JPY', 'TWD', 'CNY'] as const).map(curr => (
                    <button
                      key={curr}
                      type="button"
                      onClick={() => setCurrency(curr)}
                      className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${currency === curr ? 'bg-[#5E9E8E] text-white shadow-sm' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {curr === 'JPY' ? 'JPY (日圓)' : curr === 'TWD' ? 'TWD (新台幣)' : 'CNY (人民幣)'}
                    </button>
                  ))}
                </div>

                <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容..." className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none font-black shadow-inner" />
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-4">
                  {['早餐','午餐','晚餐','交通','娛樂','購物'].map(q=>(<button key={q} onClick={()=>setCategory(q)} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-500 font-black shrink-0 active:bg-gray-200">{q}</button>))}
                </div>

                <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder={`金額 (${currency})`} className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black shadow-inner mb-4" />
                
                {/* 備註 (非必填) */}
                <input value={expenseNote} onChange={e=>setExpenseNote(e.target.value)} placeholder="備註細節 (選填)..." className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-xs font-black shadow-inner mb-4" />

                <p className="text-[10px] opacity-30 mb-2 ml-2">PAY METHOD</p>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {['現金','信用卡','Suica','PayPay'].map(p=>(
                    <button key={p} onClick={()=>setPayMethod(p)} className={`py-2 rounded-xl text-[10px] font-black transition-all ${payMethod===p?'bg-[#5E9E8E] text-white shadow-md':'bg-gray-100 text-gray-400'}`}>{p}</button>
                  ))}
                </div>

                <p className="text-[10px] opacity-30 mb-2 ml-2">PAYER</p>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
                  {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
                    <button key={m.id} onClick={()=>setExpensePayerId(m.id)} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 ${expensePayerId===m.id?'bg-blue-500 text-white shadow-md':'bg-gray-100 text-gray-400'}`}>
                      <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" /> {m.name}
                    </button>
                  ))}
                </div>

                <button onClick={()=>{
                    if(!category || !amount) return;
                    let twd = Number(amount);
                    if (currency === 'JPY') twd = Number(amount) * exchangeRates.JPY;
                    if (currency === 'CNY') twd = Number(amount) * exchangeRates.CNY;

                    const rec: ExpenseRecord = {
                      id: editingRecordId || Date.now(), 
                      category, 
                      amount, 
                      currency, 
                      twdAmount: twd.toFixed(0), 
                      payMethod, 
                      payerId: expensePayerId, 
                      date: expenseDate,
                      note: expenseNote.trim() || undefined,
                      lastUpdatedById: user.id
                    };
                    const n = editingRecordId ? records.map(r=>r.id===editingRecordId?rec:r) : [rec, ...records]; 
                    setRecords(n); sync({records:n}); setAmount(''); setCategory(''); setExpenseNote(''); setEditingRecordId(null);
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic">{editingRecordId?'UPDATE':'SAVE'}</button>
            </div>

            <div className="space-y-3 font-black">
                {records.map(r=>{
                  const editor = r.lastUpdatedById ? getMember(r.lastUpdatedById) : null;
                  return (
                    <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border pr-12 relative group">
                        <div className="flex items-center gap-3">
                            <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full shadow-sm object-cover" />
                            <div className="text-xs font-black">
                              {r.category} <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 ml-1">{r.date}</span>
                              {r.note && <p className="text-[9px] text-gray-500 font-normal mt-0.5">📝 {r.note}</p>}
                              <p className="text-[8px] opacity-40 font-mono italic">
                                {r.payMethod} · {getMember(r.payerId).name} 
                                {editor && ` (最後編輯: ${editor.name})`}
                              </p>
                            </div>
                        </div>
                        <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">{r.amount} {r.currency || 'JPY'}<p className="text-[9px] text-gray-300 font-black">≈ NT$ {r.twdAmount}</p></div>
                        <div className="absolute right-4 flex flex-col gap-2">
                          <button onClick={()=>{setEditingRecordId(r.id); setCategory(r.category); setAmount(r.amount); setCurrency(r.currency || 'JPY'); setExpenseNote(r.note || ''); setPayMethod(r.payMethod); setExpenseDate(r.date); window.scrollTo({top:0, behavior:'smooth'});}} className="text-blue-300 text-[10px]">🖋️</button>
                          <button onClick={()=>{if(confirm('Delete?')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="text-red-300 text-sm">✕</button>
                        </div>
                    </div>
                  );
                })}
            </div>
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
                        if(!newJournal.content) return;
                        const n = [{id:Date.now(), authorId:user.id, content:newJournal.content, image:newJournal.image, date:new Date().toLocaleString(), lastUpdatedById: user.id}, ...journals];
                        setJournals(n); sync({journals:n}); setNewJournal({content:'', image:''});
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg italic font-black">Share</button>
                </div>
            </div>
            <div className="space-y-6">
              {journals.map(j => {
                const editor = j.lastUpdatedById ? getMember(j.lastUpdatedById) : null;
                return (
                  <div key={j.id} className="bg-white p-6 rounded-[32px] shadow-md border border-gray-100 animate-in slide-in-from-bottom-2 relative font-black">
                      <div className="absolute top-6 right-6 flex gap-3">
                        <button onClick={()=>{const nt=prompt("Edit Content:", j.content); if(nt){const n=journals.map(i=>i.id===j.id?{...i, content:nt, lastUpdatedById: user.id}:i); setJournals(n); sync({journals:n});}}} className="text-blue-400 text-xs">🖋️</button>
                        <button onClick={()=>{if(confirm('Delete Log?')){const n=journals.filter(i=>i.id!==j.id); setJournals(n); sync({journals:n});}}} className="text-red-300 text-xs">🗑️</button>
                      </div>
                      <div className="flex items-center gap-3 mb-4">
                          <img src={getMember(j.authorId).avatar} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                          <div>
                            <p className="text-sm font-black text-black">{getMember(j.authorId).name}</p>
                            <p className="text-[9px] opacity-30 italic font-mono uppercase tracking-widest">
                              {j.date} {editor && `(最後編輯: ${editor.name})`}
                            </p>
                          </div>
                      </div>
                      <p className="text-sm mb-4 leading-relaxed font-black text-gray-700">{j.content}</p>
                      {j.image && <img src={j.image} className="w-full rounded-[24px] shadow-sm border border-gray-100" />}
                  </div>
                );
              })}
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
                <input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput,task:e.target.value})} placeholder={`新增事項...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none font-black shadow-inner border-none" />
                <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2">
                    {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m=>(
                        <button key={m.id} onClick={()=>{
                            const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i=>i!==m.id) : [...newTodoInput.assigneeIds, m.id];
                            setNewTodoInput({...newTodoInput, assigneeIds: ids});
                        }} className={`p-2 px-4 rounded-xl border text-[10px] font-black transition-all ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-inner scale-110':'bg-gray-100 text-gray-400 border-transparent'}`}>{m.name}</button>
                    ))}
                </div>
                <button onClick={()=>{
                    if(!newTodoInput.task || newTodoInput.assigneeIds.length === 0) return alert("Task and assignee required");
                    const newItem = { id: editingTodoId || Date.now(), task: newTodoInput.task, assigneeIds: newTodoInput.assigneeIds, completedAssigneeIds: [], category: prepSubTab, lastUpdatedById: user.id };
                    const n = editingTodoId ? todos.map(t => t.id === editingTodoId ? newItem : t) : [newItem, ...todos];
                    setTodos(n); sync({todos:n}); setNewTodoInput({task:'', assigneeIds:[]}); setEditingTodoId(null);
                }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg italic">{editingTodoId ? 'UPDATE' : 'ADD'}</button>
                {editingTodoId && <button onClick={()=>{setEditingTodoId(null); setNewTodoInput({task:'', assigneeIds:[]});}} className="w-full mt-2 text-xs opacity-30 font-black">Cancel Edit</button>}
            </div>

            <div className="space-y-4">
                {todos.filter(t=>t.category===prepSubTab).map(todo => {
                  const editor = todo.lastUpdatedById ? getMember(todo.lastUpdatedById) : null;
                  return (
                    <div key={todo.id} className="bg-white p-6 rounded-[28px] shadow-md border border-gray-100 flex justify-between items-center group font-black">
                        <div className="flex flex-col flex-1 pr-4">
                            <h4 className={`text-sm font-black transition-all ${todo.completedAssigneeIds.length === todo.assigneeIds.length ? 'line-through opacity-20 text-gray-400' : 'text-black'}`}>{todo.task}</h4>
                            <div className="flex gap-2 mt-3 flex-wrap items-center">
                                {todo.assigneeIds.map(id => {
                                    const m = getMember(id);
                                    const isDone = todo.completedAssigneeIds.includes(id);
                                    return (
                                        <button key={id} onClick={() => {
                                            const question = isDone ? `Cancel ${m.name}'s finish?` : `Mark ${m.name} finished?`;
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
                                {editor && (
                                  <span className="text-[8px] opacity-30 ml-2">最後編輯: {editor.name}</span>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={()=>{setEditingTodoId(todo.id); setNewTodoInput({task: todo.task, assigneeIds: todo.assigneeIds});}} className="text-blue-200 text-lg active:text-blue-400">🖋️</button>
                            <button onClick={()=>{if(confirm('Remove?')){const n=todos.filter(t=>t.id!==todo.id); setTodos(n); sync({todos:n});}}} className="text-red-200 text-lg active:text-red-400">✕</button>
                        </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* --- [Tab: 成員] (加入既有成員、編輯個人資料、移除旅伴保留歷史) --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 pb-20 font-black">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[#5E9E8E] italic uppercase text-xs font-black tracking-widest">Trip Members</h3>
              {user.loginCode === 'wayne' && (
                <button 
                  onClick={() => setShowAddExistingModal(true)}
                  className="text-[10px] bg-[#86A760] text-white px-3 py-1.5 rounded-full shadow-md"
                >
                  + 加入既有成員
                </button>
              )}
            </div>

            {allMembers.filter(m=>tripData.memberIds.includes(m.id)).map(m => {
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
                    {user.loginCode === 'wayne' && m.loginCode !== 'wayne' && (
                      <button 
                        onClick={() => {
                          if (confirm(`確定將 ${m.name} 從此行程移除？其建立的記錄仍會完整保留。`)) {
                            const nextIds = tripData.memberIds.filter(id => id !== m.id);
                            tripData.memberIds = nextIds;
                            sync({});
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

      {/* 從系統既有用戶加入行程 Modal */}
      {showAddExistingModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-4 uppercase text-lg">選擇既有成員加入此行程</h3>
            <div className="space-y-3 max-h-60 overflow-y-auto mb-6 pr-2">
              {allMembers.filter(m => !tripData.memberIds.includes(m.id)).map(m => (
                <div key={m.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={m.avatar} className="w-10 h-10 rounded-full object-cover" />
                    <span>{m.name}</span>
                  </div>
                  <button 
                    onClick={() => {
                      tripData.memberIds.push(m.id);
                      sync({});
                      setShowAddExistingModal(false);
                    }}
                    className="bg-[#5E9E8E] text-white text-xs px-4 py-2 rounded-xl"
                  >
                    加入
                  </button>
                </div>
              ))}
              {allMembers.filter(m => !tripData.memberIds.includes(m.id)).length === 0 && (
                <p className="text-center text-xs opacity-40 py-4">所有系統用戶皆已在此行程中</p>
              )}
            </div>
            <button onClick={() => setShowAddExistingModal(false)} className="w-full py-4 bg-gray-100 rounded-3xl font-black">關閉</button>
          </div>
        </div>
      )}

      {/* 成員個人資料與可愛動物頭像編輯 Modal */}
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
                    className={`w-8 h-8 rounded-full cursor-pointer hover:scale-110 transition-transform border-2 object-cover ${editingMemberModal.avatar === av ? 'border-[#5E9E8E] scale-105' : 'border-gray-200'}`} 
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
                if (!trimmedName) return alert("請輸入姓名");

                const nameConflict = allMembers.some(m => m.id !== editingMemberModal.id && m.name === trimmedName);
                if (nameConflict) return alert("該名字有人使用，請更換名字");

                if (user.loginCode === 'wayne') {
                  const trimmedCode = editingMemberModal.loginCode.trim();
                  if (!trimmedCode) return alert("請輸入登入代碼");
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
                        if(!planForm.title) return alert("地點必填");
                        const dPlans = schedules[activeDay] || [];
                        const updatedPlan = { ...planForm, lastUpdatedById: user.id };
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
                const newFlight = { ...flightForm, lastUpdatedById: user.id };
                const n = showFlightModal.type === 'add' ? [{...newFlight, id: Date.now()}, ...flights] : flights.map(f=>f.id===showFlightModal.data?.id ? newFlight : f);
                setFlights(n); sync({flights:n}); setShowFlightModal({show:false, type:'add', data:null});
              }} className="flex-1 py-4 bg-blue-600 text-white rounded-3xl shadow-lg italic uppercase font-black">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 4. 入口點 (全域同步與雲端儲存)
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);

  // 雲端與本地端雙向同步用戶名單及行程列表
  useEffect(() => {
    const initGlobal = async () => {
      // 1. 先查 Supabase 儲存的系統全域名單
      const { data } = await supabase.from('trips').select('content').eq('id', 'system_global_config').single();
      if (data?.content?.members && data?.content?.members.length > 0) {
        setAllMembers(data.content.members);
        if (data.content.trips) setSelectedTrips(data.content.trips);
      } else {
        // 本地預設值
        const defaultMembers: Member[] = [
          { id: '1', name: '肚皮', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: 'wayne', editLogs: ['Account created'] },
          { id: '2', name: '豆豆皮', avatar: PRESET_ANIMAL_AVATARS[1], loginCode: 'Elvina', editLogs: ['Account created'] }
        ];
        const defaultTrips: Trip[] = [
          { id: 'hokkaido2026', title: '2026 日本之旅', startDate: getTodayDateString(), endDate: getTodayDateString(), emoji: '☃️', memberIds: ['1', '2'] }
        ];
        setAllMembers(defaultMembers);
        setSelectedTrips(defaultTrips);
        await supabase.from('trips').upsert({ id: 'system_global_config', content: { members: defaultMembers, trips: defaultTrips } });
      }
    };
    initGlobal();

    // 監聽全域變更
    const channel = supabase.channel('global-config-sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'trips', filter: 'id=eq.system_global_config' }, (payload) => {
        if (payload.new && (payload.new as any).content) {
          const c = (payload.new as any).content;
          if (c.members) setAllMembers(c.members);
          if (c.trips) setSelectedTrips(c.trips);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleUpdateMembers = async (newMembers: Member[]) => {
    setAllMembers(newMembers);
    await supabase.from('trips').upsert({ id: 'system_global_config', content: { members: newMembers, trips: selectedTrips } });
  };

  const handleAddTrip = async (newTrip: Trip) => {
    const next = [...selectedTrips, newTrip];
    setSelectedTrips(next);
    await supabase.from('trips').upsert({ id: 'system_global_config', content: { members: allMembers, trips: next } });
  };

  const handleDeleteTrip = async (id: string) => {
    const next = selectedTrips.filter(t => t.id !== id);
    setSelectedTrips(next);
    await supabase.from('trips').upsert({ id: 'system_global_config', content: { members: allMembers, trips: next } });
  };

  if (!user) return <LoginPage onLogin={setUser} allMembers={allMembers} />;
  
  if (!selectedTrip) return (
    <TripSelector 
      user={user} 
      allTrips={selectedTrips} 
      allMembers={allMembers} 
      onSelect={setSelectedTrip} 
      onAddTrip={handleAddTrip} 
      onDeleteTrip={handleDeleteTrip} 
      onUpdateMembers={handleUpdateMembers} 
    />
  );

  return (
    <MainApp 
      user={user} 
      tripData={selectedTrip} 
      allMembers={allMembers} 
      onUpdateMembers={handleUpdateMembers} 
      onBack={() => setSelectedTrip(null)} 
    />
  );
}