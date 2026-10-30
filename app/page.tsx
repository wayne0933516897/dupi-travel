"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- Supabase 初始化 ---
const supabase = createClient(
  'https://oqfysuuoxduginkfgggg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xZnlzdXVveGR1Z2lua2ZnZ2dnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2NDUxNjgsImV4cCI6MjA4MjIyMTE2OH0.igtMj90ihFLc3RIP0UGzXcUBxx4E16xMa9_HQcSfju8'
);

// --- 型別定義 ---
interface Member {
  id: string;
  account: string;
  name: string;
  avatar: string;
  loginCode: string;
  editLogs: string[];
}

interface ExpenseRecord {
  id: number;
  category: string;
  amount: string;
  currency: 'JPY' | 'TWD' | 'CNY';
  twdAmount: string;
  payMethod: string;
  payerId: string;
  date: string;
  note?: string;
  lastUpdatedById?: string;
  // 代墊相關欄位
  isAdvance?: boolean;
  advanceTargetType?: 'member' | 'other';
  advanceMemberId?: string;
  advanceOtherPerson?: string; // 幫其他人：對象名稱
  advanceOtherNote?: string;   // 幫其他人：備註說明
  isSettled?: boolean;
  originalPayerId?: string;
  // 多人分帳結清相關欄位
  isSplit?: boolean;
  isSplitSettled?: boolean;
  splitSettledTime?: string;
  splitMemberIds?: string[];           // 參與分攤的成員 ID 清單
  splitSettledMemberIds?: string[];    // 已個別結清的成員 ID 清單（支援單人獨立結清）
}

interface Plan {
  id: number;
  time: string;
  title: string;
  desc: string;
  icon: string;
  lastUpdatedById?: string;
}

interface TodoItem {
  id: number;
  task: string;
  note?: string;
  assigneeIds: string[];
  completedAssigneeIds: string[];
  category: string;
  lastUpdatedById?: string;
  image?: string; // 採購項目支援相片
}

interface JournalComment {
  id: number;
  authorId: string;
  content: string;
  date: string;
  likes?: string[];
  replyToCommentId?: number;
}

interface JournalEntry { 
  id: number; 
  authorId: string; 
  content: string; 
  date: string; 
  image?: string; 
  images?: string[];
  video?: string;
  lastUpdatedById?: string;
  likes?: string[];
  comments?: JournalComment[];
}

interface Flight {
  id: number;
  airline: string;
  flightNo: string;
  fromCode: string;
  toCode: string;
  depTime: string;
  arrTime: string;
  duration: string;
  date: string;
  baggage: string;
  aircraft: string;
  lastUpdatedById?: string;
}

interface BookingDoc { 
  id: number; 
  type: string; 
  title: string; 
  image?: string; 
  lastUpdatedById?: string;
  status?: 'unused' | 'used';
  usedByMemberName?: string;
  usedAt?: string;
}

interface Trip {
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  emoji: string;
  memberIds: string[];
  joinCode: string;
}

interface ScheduleData { [key: number]: Plan[]; }
interface CityWeatherConfig { id: string; name: string; dayIndexes: number[]; }

interface ChangelogItem {
  id: string;
  version: string;
  date: string;
  title: string;
  items: string[];
  enabled: boolean;
}

// 行李打包預設 5 大分類常數
const DEFAULT_PACKING_CATEGORIES = [
  {
    category: '出行必備',
    icon: '🛂',
    items: [
      '護照正本 (效期6個月以上)',
      '護照影本 / 大頭照2張備用',
      '身分證 / 健保卡',
      '國際駕照 / 日文譯本 (自駕必備)',
      '日幣現金 / 外幣信用卡 (至少2張備用)',
      'Visit Japan Web (VJW) QR Code 截圖',
      '海外旅遊平安險 / 不便險保單'
    ]
  },
  {
    category: '數位電器',
    icon: '🔌',
    items: [
      '手機充電線 / 豆腐頭',
      '行動電源 (需隨身攜帶，不可託運)',
      '出國上網卡 / eSIM QR Code / 退卡針',
      '萬國轉接頭 / 延長線',
      '降噪耳機',
      '相機 / 記憶卡 / 充電座 / 電池',
      '智慧手錶充電器'
    ]
  },
  {
    category: '衣物配飾',
    icon: '👕',
    items: [
      '換洗衣物 / 發熱衣 / 內搭',
      '免洗內褲 / 免洗襪',
      '保暖外套 / 防風防潑水外套',
      '好走耐穿休閒運動鞋',
      '遮陽帽 / 太陽眼鏡',
      '晴雨兩用摺疊傘',
      '髒衣收納袋 / 壓縮真空袋'
    ]
  },
  {
    category: '生活日用',
    icon: '🧴',
    items: [
      '牙刷 / 牙膏 (部分環保飯店不提供)',
      '洗面乳 / 個人護膚保養品旅行組',
      '刮鬍刀 / 刮鬍泡',
      '隨身衛生紙 / 濕紙巾 / 乾洗手',
      '保溫杯 / 隨行環保水壺',
      '保濕護唇膏 / 護手霜',
      '指甲剪 / 防水夾鏈袋'
    ]
  },
  {
    category: '常備藥品',
    icon: '💊',
    items: [
      '腸胃藥 / 止瀉藥',
      '感冒藥 / 止痛退燒藥 (如 EVE)',
      '暈車 / 暈機藥',
      '綜合維他命 / B群',
      'OK繃 / 痠痛貼布',
      '個人常備慢籤處方藥'
    ]
  }
];

const PRESET_ANIMAL_AVATARS = [
  'https://api.dicebear.com/7.x/notionists/svg?seed=Bear&backgroundColor=b6e3f4',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Panda&backgroundColor=c0aede',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Cat&backgroundColor=d1d4f9',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Dog&backgroundColor=ffd5dc',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Fox&backgroundColor=ffdfbf',
  'https://api.dicebear.com/7.x/notionists/svg?seed=Rabbit&backgroundColor=c1f0c8'
];

function generateJoinCode(existingTrips: Trip[]): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  let exists = true;
  while (exists) {
    code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    exists = existingTrips.some(t => t.joinCode === code);
  }
  return code;
}

function generateRandomCaptcha(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

function getTodayDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getNowTimestampString(): string {
  const now = new Date();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  return `${m}/${d} ${hh}:${mm}`;
}

function getDatesList(startStr: string, endStr: string, withDayOfWeek: boolean = true): string[] {
  if (!startStr || !endStr) return [];
  const start = new Date(startStr.replace(/-/g, '/'));
  const end = new Date(endStr.replace(/-/g, '/'));
  const daysOfWeek = ['日', '一', '二', '三', '四', '五', '六'];
  
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || start > end) {
    const d = startStr.slice(5).replace('-', '/');
    const day = isNaN(start.getTime()) ? '' : ` (${daysOfWeek[start.getDay()]})`;
    return [`${d}${withDayOfWeek ? day : ''}`];
  }
  
  const dates: string[] = [];
  const cur = new Date(start);
  while (cur <= end) {
    const m = String(cur.getMonth() + 1).padStart(2, '0');
    const d = String(cur.getDate()).padStart(2, '0');
    const dayName = daysOfWeek[cur.getDay()];
    dates.push(withDayOfWeek ? `${m}/${d} (${dayName})` : `${m}/${d}`);
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

function getDateObj(startStr: string, dayIndex: number): Date {
  const start = new Date(startStr.replace(/-/g, '/'));
  const target = new Date(start);
  target.setDate(start.getDate() + (dayIndex - 1));
  return target;
}

function detectPlaceIcon(name: string): string {
  if (/101|塔|tower|晴空塔|展望台|skytree/i.test(name)) return '🗼';
  if (/機場|飛機|airport|flight/i.test(name)) return '✈️';
  if (/飯店|酒店|旅館|hotel|inn|hostel/i.test(name)) return '🏨';
  if (/拉麵|壽司|料理|餐廳|食|餐|咖啡|甜點|肉|居酒屋|cafe|food/i.test(name)) return '🍜';
  if (/神社|寺|宮|大社|鳥居/i.test(name)) return '⛩️';
  if (/樂園|迪士尼|環球|影城|動物園|公園|park/i.test(name)) return '🎡';
  if (/站|車站|地鐵|JR|station/i.test(name)) return '🚉';
  if (/溫泉|湯|spa/i.test(name)) return '♨️';
  if (/山|岳|峰|谷/i.test(name)) return '🗻';
  if (/海|灘|島|港|beach/i.test(name)) return '🏖️';
  if (/購物|百貨|市場|商場|outlet|mall/i.test(name)) return '🛍️';
  return '📍';
}

function compressVideoFile(file: File, maxDurationSec = 15): Promise<string> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const blobUrl = URL.createObjectURL(file);
    video.src = blobUrl;
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(blobUrl);
      if (video.duration > maxDurationSec + 0.5) {
        alert(`❌ 影片長度為 ${Math.round(video.duration)} 秒，超過 ${maxDurationSec} 秒上限！`);
        return reject(new Error('Video duration exceeds limit'));
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve(e.target?.result as string);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    };
    video.onerror = () => {
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Failed to load video metadata'));
    };
  });
}

function ImageUploader({ 
  onUpload, 
  label, 
  maxDimension = 1200, 
  quality = 0.85,
  forceSquare = false
}: { 
  onUpload: (base64: string) => void, 
  label: string, 
  maxDimension?: number, 
  quality?: number, 
  forceSquare?: boolean
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const [rawImage, setRawImage] = useState<string | null>(null);
  const [imgNaturalSize, setImgNaturalSize] = useState({ width: 1, height: 1 });
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImgNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
        setRawImage(b64);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      img.src = b64;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const boxDimensions = useMemo(() => {
    if (forceSquare) return { width: 280, height: 280 };
    const maxBoxW = 280;
    const maxBoxH = 380;
    const aspect = imgNaturalSize.width / (imgNaturalSize.height || 1);
    
    let w = maxBoxW;
    let h = w / aspect;
    if (h > maxBoxH) {
      h = maxBoxH;
      w = h * aspect;
    }
    return { width: Math.max(160, Math.round(w)), height: Math.max(160, Math.round(h)) };
  }, [imgNaturalSize, forceSquare]);

  const renderedBaseSize = useMemo(() => {
    const boxW = boxDimensions.width;
    const boxH = boxDimensions.height;
    const imgW = imgNaturalSize.width;
    const imgH = imgNaturalSize.height;

    if (forceSquare) {
      const scale = Math.max(boxW / imgW, boxH / imgH);
      return { width: imgW * scale, height: imgH * scale };
    } else {
      return { width: boxW, height: boxH };
    }
  }, [boxDimensions, imgNaturalSize, forceSquare]);

  const clampOffset = (newX: number, newY: number, currentZoom: number) => {
    const boxW = boxDimensions.width;
    const boxH = boxDimensions.height;
    const curW = renderedBaseSize.width * currentZoom;
    const curH = renderedBaseSize.height * currentZoom;

    const maxOffsetX = Math.max(0, (curW - boxW) / 2);
    const maxOffsetY = Math.max(0, (curH - boxH) / 2);

    return {
      x: Math.min(maxOffsetX, Math.max(-maxOffsetX, newX)),
      y: Math.min(maxOffsetY, Math.max(-maxOffsetY, newY))
    };
  };

  const handlePointerDown = (clientX: number, clientY: number) => {
    setIsDragging(true);
    setDragStart({ x: clientX - offset.x, y: clientY - offset.y });
  };

  const handlePointerMove = (clientX: number, clientY: number) => {
    if (!isDragging) return;
    const targetX = clientX - dragStart.x;
    const targetY = clientY - dragStart.y;
    setOffset(clampOffset(targetX, targetY, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleConfirmCrop = () => {
    if (!imgRef.current || !containerRef.current) return;
    const img = imgRef.current;
    const container = containerRef.current;
    const targetWidth = forceSquare ? 400 : boxDimensions.width * 2;
    const targetHeight = forceSquare ? 400 : boxDimensions.height * 2;

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const boxRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    const scale = img.naturalWidth / imgRect.width;
    const cropX = Math.max(0, (boxRect.left - imgRect.left) * scale);
    const cropY = Math.max(0, (boxRect.top - imgRect.top) * scale);
    const cropW = Math.min(img.naturalWidth - cropX, boxRect.width * scale);
    const cropH = Math.min(img.naturalHeight - cropY, boxRect.height * scale);

    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', quality);
    onUpload(base64);
    setRawImage(null);
  };

  const handleDirectUseOriginal = () => {
    if (!rawImage) return;
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (w > maxDimension || h > maxDimension) {
        if (w > h) {
          h = Math.round((h * maxDimension) / w);
          w = maxDimension;
        } else {
          w = Math.round((w * maxDimension) / h);
          h = maxDimension;
        }
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        onUpload(canvas.toDataURL('image/jpeg', quality));
      } else {
        onUpload(rawImage);
      }
      setRawImage(null);
    };
    img.src = rawImage;
  };

  return (
    <div>
      <button 
        type="button" 
        onClick={() => fileInput.current?.click()} 
        className="text-[10px] bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl font-black text-black shadow-sm active:scale-95 transition-all"
      >
        📷 {label}
      </button>
      <input type="file" ref={fileInput} onChange={handleFile} accept="image/*" className="hidden" />

      {rawImage && (
        <div className="fixed inset-0 bg-black/85 z-[250] flex items-center justify-center p-4">
          <div className="bg-white rounded-[36px] p-6 max-w-sm w-full text-black font-black flex flex-col items-center animate-in zoom-in-95">
            <div className="w-full flex justify-between items-center mb-1">
              <h4 className="text-base font-black">
                {forceSquare ? '調整大頭貼位置 (1:1)' : '調整相片範圍'}
              </h4>
              {!forceSquare && (
                <button
                  type="button"
                  onClick={handleDirectUseOriginal}
                  className="text-[10px] bg-amber-100 text-amber-900 px-2.5 py-1 rounded-full font-black hover:bg-amber-200 active:scale-95"
                  title="不進行任何裁切，完整保留原圖"
                >
                  ⚡ 完整原圖使用
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-400 mb-3 text-left w-full">
              {forceSquare ? '自由上下左右拖曳對齊，滑桿可放大縮小（無黑邊）' : '上下左右拖曳對齊，限制在照片尺寸內無黑邊'}
            </p>

            <div 
              ref={containerRef}
              style={{ width: `${boxDimensions.width}px`, height: `${boxDimensions.height}px` }}
              className={`overflow-hidden relative bg-gray-900 flex items-center justify-center select-none cursor-move border-4 border-[#5E9E8E] ${forceSquare ? 'rounded-full shadow-lg' : 'rounded-3xl'}`}
              onMouseDown={(e) => handlePointerDown(e.clientX, e.clientY)}
              onMouseMove={(e) => handlePointerMove(e.clientX, e.clientY)}
              onMouseUp={handlePointerUp}
              onTouchStart={(e) => handlePointerDown(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchMove={(e) => handlePointerMove(e.touches[0].clientX, e.touches[0].clientY)}
              onTouchEnd={handlePointerUp}
            >
              <img
                ref={imgRef}
                src={rawImage}
                alt="Crop preview"
                draggable={false}
                style={{
                  transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                  transformOrigin: 'center center',
                  maxWidth: 'none',
                  width: `${renderedBaseSize.width}px`,
                  height: `${renderedBaseSize.height}px`,
                  objectFit: 'cover',
                  pointerEvents: 'none'
                }}
              />
              <div className={`absolute inset-0 pointer-events-none border-2 border-white/60 flex items-center justify-center shadow-inner ${forceSquare ? 'rounded-full' : 'rounded-2xl'}`}>
                <span className="text-[10px] text-white/80 bg-black/50 px-2 py-0.5 rounded-full font-black">
                  {forceSquare ? '大頭貼範圍' : '裁切視窗'}
                </span>
              </div>
            </div>

            <div className="w-full mt-4 px-2">
              <div className="flex justify-between text-[11px] text-gray-400 mb-1">
                <span>原比例 (1.0x)</span>
                <span className="text-[#5E9E8E] font-black">{zoom.toFixed(1)}x</span>
                <span>放大 (3.0x)</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  const newZoom = parseFloat(e.target.value);
                  setZoom(newZoom);
                  setOffset(clampOffset(offset.x, offset.y, newZoom));
                }}
                className="w-full accent-[#5E9E8E] cursor-pointer"
              />
            </div>

            <div className="flex gap-2.5 w-full mt-5">
              <button
                type="button"
                onClick={() => setRawImage(null)}
                className="flex-1 py-3 bg-gray-100 rounded-2xl text-xs font-black"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleConfirmCrop}
                className="flex-1 py-3 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md italic"
              >
                ✓ 確認套用
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// 1. 登錄與註冊頁面
function AuthPage({ onLogin, allMembers, onRegister, loginIcon }: { onLogin: (m: Member) => void, allMembers: Member[], onRegister: (newM: Member) => void, loginIcon: string }) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [loginAccountInput, setLoginAccountInput] = useState('');
  const [loginPasswordInput, setLoginPasswordInput] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const [regAccount, setRegAccount] = useState('');
  const [regName, setRegName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regAvatar, setRegAvatar] = useState(PRESET_ANIMAL_AVATARS[0]);
  const [captchaCode, setCaptchaCode] = useState(() => generateRandomCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
    const savedAcc = localStorage.getItem('remembered_account');
    const savedPwd = localStorage.getItem('remembered_password');
    if (savedAcc && savedPwd) {
      setLoginAccountInput(savedAcc);
      setLoginPasswordInput(savedPwd);
      setRememberMe(true);
    }
  }, []);

  const refreshCaptcha = () => {
    setCaptchaCode(generateRandomCaptcha());
    setCaptchaInput('');
  };

  const isImage = loginIcon && (loginIcon.startsWith('data:image') || loginIcon.startsWith('http'));

  const handleRegisterSubmit = () => {
    const trimmedAccount = regAccount.trim().toLowerCase();
    const trimmedName = regName.trim();
    const trimmedPassword = regPassword.trim();

    if (!trimmedAccount) return alert("❌ 請填寫登入帳號！");
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmedAccount)) {
      return alert("❌ 登入帳號必須是英文或數字（可含底線），不可包含中文或空格！");
    }
    if (!trimmedName) return alert("❌ 請填寫用戶名稱！");
    if (!trimmedPassword) return alert("❌ 請填寫登入密碼！");
    if (trimmedPassword !== regConfirmPassword.trim()) {
      return alert("❌ 兩次密碼輸入不一致，請再次確認！");
    }
    if (captchaInput.trim() !== captchaCode) {
      alert("❌ 驗證碼錯誤，請重新輸入！");
      refreshCaptcha();
      return;
    }
    if (allMembers.some(m => (m.account || m.loginCode).toLowerCase() === trimmedAccount)) {
      return alert("❌ 該英文帳號已被使用，請更換其他帳號！");
    }
    if (allMembers.some(m => m.name.toLowerCase() === trimmedName.toLowerCase())) {
      return alert("❌ 該用戶名稱已被使用，請更換其他名稱！");
    }

    const newMember: Member = {
      id: Date.now().toString(),
      account: trimmedAccount,
      name: trimmedName,
      loginCode: trimmedPassword,
      avatar: regAvatar,
      editLogs: [`Registered at ${new Date().toLocaleString()}`]
    };

    onRegister(newMember);
    alert(`🎉 註冊成功！歡迎 ${newMember.name}，現在請登入！`);
    setMode('login');
    setLoginAccountInput(trimmedAccount);
    setLoginPasswordInput(trimmedPassword);
  };

  const handleLoginSubmit = () => {
    const acc = loginAccountInput.trim().toLowerCase();
    const pwd = loginPasswordInput.trim();

    if (!acc) return alert("❌ 請輸入登入帳號！");
    if (!pwd) return alert("❌ 請輸入密碼！");

    const found = allMembers.find(m => {
      const matchAcc = (m.account && m.account.toLowerCase() === acc) || 
                       (m.loginCode && m.loginCode.toLowerCase() === acc) || 
                       (m.name && m.name.toLowerCase() === acc);
      const matchPwd = m.loginCode === pwd;
      return matchAcc && matchPwd;
    });

    if (found) {
      if (rememberMe) {
        localStorage.setItem('remembered_account', acc);
        localStorage.setItem('remembered_password', pwd);
      } else {
        localStorage.removeItem('remembered_account');
        localStorage.removeItem('remembered_password');
      }
      onLogin(found);
    } else {
      alert("❌ 帳號或密碼錯誤，請重新檢查！");
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] flex flex-col items-center justify-center p-6 text-center font-sans text-black">
      <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] mb-6 flex items-center justify-center text-4xl shadow-xl animate-bounce overflow-hidden border-2 border-white/50">
        {isImage ? <img src={loginIcon} alt="App Icon" className="w-full h-full object-cover" /> : <span>{loginIcon || '❄️'}</span>}
      </div>

      <h1 className="text-3xl font-black text-black mb-1 italic uppercase tracking-tighter">肚皮旅遊</h1>
      <p className="text-xs text-gray-400 mb-6 font-black tracking-widest uppercase">最好用的旅遊規劃</p>

      <div className="w-full max-w-xs bg-white rounded-2xl p-1 mb-6 flex shadow-sm border border-gray-100 font-black">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 py-2.5 rounded-xl text-xs transition-all ${mode === 'login' ? 'bg-[#5E9E8E] text-white shadow-md' : 'text-gray-400'}`}
        >
          登入 LOGIN
        </button>
        <button
          onClick={() => { setMode('register'); refreshCaptcha(); }}
          className={`flex-1 py-2.5 rounded-xl text-xs transition-all ${mode === 'register' ? 'bg-[#86A760] text-white shadow-md' : 'text-gray-400'}`}
        >
          註冊 REGISTER
        </button>
      </div>

      {mode === 'login' ? (
        <div className="w-full max-w-xs space-y-3 font-black">
          <input
            type="text"
            value={loginAccountInput}
            onChange={(e) => setLoginAccountInput(e.target.value)}
            placeholder="請輸入帳號 (英文/數字)..."
            className="w-full p-4 bg-white rounded-[22px] font-black text-black placeholder:text-gray-400 outline-none shadow-sm border border-gray-200 focus:border-[#86A760] transition-colors"
          />
          <input
            type="password"
            value={loginPasswordInput}
            onChange={(e) => setLoginPasswordInput(e.target.value)}
            placeholder="請輸入密碼..."
            className="w-full p-4 bg-white rounded-[22px] font-black text-black placeholder:text-gray-400 outline-none shadow-sm border border-gray-200 focus:border-[#86A760] transition-colors"
          />

          <div className="flex items-center justify-between px-2 pt-1 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded accent-[#5E9E8E] cursor-pointer"
              />
              <span className="text-gray-600 font-black">記住我 (保留帳號密碼)</span>
            </label>
          </div>

          <button
            onClick={handleLoginSubmit}
            className="w-full py-4 bg-[#86A760] text-white rounded-[22px] font-black shadow-lg active:scale-95 transition-transform mt-2"
          >
            LOGIN
          </button>
        </div>
      ) : (
        <div className="w-full max-w-xs bg-white p-6 rounded-[32px] shadow-xl text-left border border-gray-100 space-y-3 font-black">
          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">選擇頭像</label>
            <div className="flex items-center gap-2 mt-2">
              <img src={regAvatar} className="w-12 h-12 rounded-full border-2 border-[#5E9E8E] object-cover shadow-sm shrink-0" />
              <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
                {PRESET_ANIMAL_AVATARS.map((av, idx) => (
                  <img
                    key={idx}
                    src={av}
                    onClick={() => setRegAvatar(av)}
                    className={`w-7 h-7 rounded-full cursor-pointer hover:scale-110 transition-transform border ${regAvatar === av ? 'border-2 border-[#5E9E8E] scale-105' : 'border-gray-200'}`}
                  />
                ))}
              </div>
            </div>
            <div className="mt-2">
              <ImageUploader label="上傳相片" forceSquare maxDimension={300} onUpload={(b64) => setRegAvatar(b64)} />
            </div>
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">登入帳號 (Account - 限英文/數字)</label>
            <input
              type="text"
              placeholder="例如: cat123"
              value={regAccount}
              onChange={(e) => setRegAccount(e.target.value)}
              className="w-full p-3.5 bg-gray-50 rounded-xl outline-none text-xs font-black text-black placeholder:text-gray-400 border border-gray-200 font-mono"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">用戶名稱 (Name - 可中文)</label>
            <input
              type="text"
              placeholder="例如: 柴犬, 肚皮"
              value={regName}
              onChange={(e) => setRegName(e.target.value)}
              className="w-full p-3.5 bg-gray-50 rounded-xl outline-none text-xs font-black text-black placeholder:text-gray-400 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">登入密碼 (Password - 必填)</label>
            <input
              type="password"
              placeholder="請輸入密碼"
              value={regPassword}
              onChange={(e) => setRegPassword(e.target.value)}
              className="w-full p-3.5 bg-gray-50 rounded-xl outline-none text-xs font-black text-black placeholder:text-gray-400 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">確認密碼 (Confirm Password)</label>
            <input
              type="password"
              placeholder="再次輸入密碼"
              value={regConfirmPassword}
              onChange={(e) => setRegConfirmPassword(e.target.value)}
              className="w-full p-3.5 bg-gray-50 rounded-xl outline-none text-xs font-black text-black placeholder:text-gray-400 border border-gray-200"
            />
          </div>

          <div>
            <label className="text-[10px] text-gray-500 font-black ml-1">4 位數數字驗證碼</label>
            <div className="flex gap-2 items-center mt-1">
              <input
                type="text"
                placeholder="輸入右方 4 碼"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                maxLength={4}
                className="flex-1 p-3.5 bg-gray-50 rounded-xl outline-none text-xs font-black text-black placeholder:text-gray-400 border border-gray-200 text-center tracking-widest font-mono"
              />
              <div
                onClick={refreshCaptcha}
                title="點擊更換驗證碼"
                className="w-24 h-11 bg-gradient-to-r from-amber-200 to-emerald-200 rounded-xl flex items-center justify-center font-mono font-black text-lg tracking-widest text-emerald-950 shadow-inner cursor-pointer select-none border border-emerald-300 active:scale-95 transition-transform"
              >
                {captchaCode}
              </div>
            </div>
            <p className="text-[9px] text-gray-400 mt-1 ml-1 cursor-pointer font-black" onClick={refreshCaptcha}>↻ 點擊圖形可更換驗證碼</p>
          </div>

          <button
            onClick={handleRegisterSubmit}
            className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg text-sm active:scale-95 transition-transform mt-2"
          >
            確認註冊 REGISTER
          </button>
        </div>
      )}
    </div>
  );
}
// 2. 主畫面 (TripSelector)
function TripSelector({ 
  user, 
  onLogout, 
  onSelect, 
  allTrips, 
  onAddTrip, 
  onDeleteTrip, 
  onUpdateTripWithMigration, 
  allMembers, 
  onUpdateMembers, 
  onUpdateUser, 
  notice, 
  noticeEnabled,
  onUpdateNotice, 
  onUpdateNoticeEnabled,
  changelogs,
  onUpdateChangelogs,
  loginIcon, 
  onUpdateLoginIcon, 
  onJoinTrip 
}: { 
  user: Member, 
  onLogout: () => void, 
  onSelect: (trip: Trip) => void, 
  allTrips: Trip[], 
  onAddTrip: any, 
  onDeleteTrip: any, 
  onUpdateTripWithMigration: (updatedTrip: Trip, oldTrip: Trip) => Promise<void>, 
  allMembers: Member[], 
  onUpdateMembers: any, 
  onUpdateUser: (u: Member) => void, 
  notice: string, 
  noticeEnabled: boolean,
  onUpdateNotice: (n: string) => void, 
  onUpdateNoticeEnabled: (enabled: boolean) => void,
  changelogs: ChangelogItem[],
  onUpdateChangelogs: (logs: ChangelogItem[]) => void,
  loginIcon: string, 
  onUpdateLoginIcon: (icon: string) => void, 
  onJoinTrip: (code: string) => void 
}) {
  const [showAddTrip, setShowAddTrip] = useState(false);
  const [showJoinTripModal, setShowJoinTripModal] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [showUserAdmin, setShowUserAdmin] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [showLoginIconModal, setShowLoginIconModal] = useState(false);

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showNoticeAdminModal, setShowNoticeAdminModal] = useState(false);
  const [tempNoticeText, setTempNoticeText] = useState(notice || '');
  const [tempNoticeEnabled, setTempNoticeEnabled] = useState(noticeEnabled);

  const [showChangelogAdminModal, setShowChangelogAdminModal] = useState(false);
  const [editingLogItem, setEditingLogItem] = useState<{
    id: string;
    version: string;
    date: string;
    title: string;
    itemsText: string;
    enabled: boolean;
  } | null>(null);

  useEffect(() => {
    setTempNoticeText(notice || '');
    setTempNoticeEnabled(noticeEnabled);
  }, [notice, noticeEnabled]);

  const [editingTripSetting, setEditingTripSetting] = useState<{
    original: Trip;
    title: string;
    startDate: string;
    endDate: string;
    emoji: string;
  } | null>(null);

  const [wayneViewAll, setWayneViewAll] = useState(false);
  const todayStr = useMemo(() => getTodayDateString(), []);
  const [newTrip, setNewTrip] = useState<Trip>({ 
    id: '', 
    title: '', 
    startDate: todayStr, 
    endDate: todayStr, 
    emoji: '☃️', 
    memberIds: [user.id],
    joinCode: ''
  });

  const isWayne = (user.account || user.loginCode) === 'wayne';

  const visibleTrips = useMemo(() => {
    if (isWayne && wayneViewAll) return allTrips;
    return allTrips.filter(t => t.memberIds.includes(user.id));
  }, [allTrips, user, isWayne, wayneViewAll]);

  const editingTripDaysInfo = useMemo(() => {
    if (!editingTripSetting) return { oldDays: 0, newDays: 0, diff: 0 };
    const oldList = getDatesList(editingTripSetting.original.startDate, editingTripSetting.original.endDate);
    const newList = getDatesList(editingTripSetting.startDate, editingTripSetting.endDate);
    return {
      oldDays: oldList.length,
      newDays: newList.length,
      diff: newList.length - oldList.length
    };
  }, [editingTripSetting]);

  const handleSaveTripSettings = async () => {
    if (!editingTripSetting) return;
    const { original, title, startDate, endDate, emoji } = editingTripSetting;
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return alert("❌ 請輸入旅行名稱！");
    if (!startDate || !endDate) return alert("❌ 請選取完整的旅行起訖日期！");
    if (new Date(startDate) > new Date(endDate)) return alert("❌ 開始日期不可晚於結束日期！");

    const { oldDays, newDays, diff } = editingTripDaysInfo;
    if (diff < 0) {
      const confirmReduce = confirm(
        `⚠️ 天數縮短提醒：\n原行程為 ${oldDays} 天，修改後為 ${newDays} 天。\n系統將自動保留前 ${newDays} 天排程，超出範圍的排程景點將被清除，記帳項目將自動轉為 (旅行外) 保存。\n\n確定要縮短天數並儲存嗎？`
      );
      if (!confirmReduce) return;
    }

    const updated: Trip = {
      ...original,
      title: trimmedTitle,
      startDate,
      endDate,
      emoji
    };

    await onUpdateTripWithMigration(updated, original);
    alert("✅ 行程基本資料與日期已成功更新！");
    setEditingTripSetting(null);
  };

  const displayNoticeText = notice || '歡迎使用肚皮旅遊！祝各位旅遊愉快✈️ 點擊查看公告與版本更新～';
  const visibleChangelogs = useMemo(() => changelogs.filter(l => l.enabled), [changelogs]);

  return (
    <div className="min-h-screen bg-[#F9F8F3] p-8 font-sans pb-32 text-black font-black">
      <div className="flex justify-between items-center mb-6 relative">
        <div className="font-black">
          <p className="text-xs text-gray-400 uppercase tracking-widest">{isWayne ? 'Admin Mode,' : 'User Mode,'}</p>
          <h2 className="text-2xl text-black">{user.name}</h2>
        </div>
        
        <div className="relative">
          <div onClick={() => setShowUserDropdown(!showUserDropdown)} className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-white shadow-xl cursor-pointer active:scale-90 transition-transform">
            <img src={user.avatar} className="w-full h-full object-cover" />
          </div>

          {showUserDropdown && (
            <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl p-2 z-50 border border-gray-100 font-black animate-in fade-in">
              <div className="p-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-black font-black truncate">{user.name}</p>
                <p className="text-[10px] text-gray-400 font-mono">帳號: {user.account || user.loginCode}</p>
              </div>

              <button onClick={() => { setShowUserDropdown(false); setEditingMember(user); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 text-blue-600 font-black">
                👤 修改個人設定
              </button>

              <button onClick={() => { setShowUserDropdown(false); setShowNoticeModal(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 text-amber-700 font-black">
                📜 公告與版本更新
              </button>

              {isWayne && (
                <>
                  <button onClick={() => { setShowUserDropdown(false); setShowNoticeAdminModal(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 text-emerald-600 font-black">
                    📢 首頁公告開關 ({noticeEnabled ? '顯示中' : '已關閉'})
                  </button>
                  <button onClick={() => { setShowUserDropdown(false); setShowChangelogAdminModal(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 text-indigo-600 font-black">
                    ⚙️ 管理版本日記 ({visibleChangelogs.length} 個顯示中)
                  </button>
                  <button onClick={() => { setShowUserDropdown(false); setShowLoginIconModal(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 text-purple-600 font-black">
                    🖼️ 更換登入頁圖示
                  </button>
                  <button onClick={() => { setShowUserDropdown(false); setShowUserAdmin(true); }} className="w-full text-left p-2.5 rounded-xl text-xs hover:bg-gray-50 flex items-center gap-2 font-black">
                    👥 成員管理名冊
                  </button>
                </>
              )}
              <button onClick={() => { setShowUserDropdown(false); onLogout(); }} className="w-full text-left p-2.5 rounded-xl text-xs text-red-500 hover:bg-red-50 flex items-center gap-2 font-black">
                🚪 登出帳號
              </button>
            </div>
          )}
        </div>
      </div>

      {noticeEnabled && (
        <div 
          onClick={() => setShowNoticeModal(true)}
          className="bg-[#E9C46A]/20 border border-[#E9C46A]/40 rounded-2xl p-3.5 mb-6 flex items-center gap-2.5 font-black shadow-sm cursor-pointer hover:bg-[#E9C46A]/30 active:scale-98 transition-all overflow-hidden relative animate-in fade-in"
        >
          <span className="text-base shrink-0 z-10 bg-[#FAF6E8] p-1 rounded-lg">📢</span>
          <div className="overflow-hidden whitespace-nowrap flex-1 relative flex">
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes dupiMarquee {
                0% { transform: translateX(0%); }
                100% { transform: translateX(-50%); }
              }
            `}} />
            <div style={{ animation: 'dupiMarquee 20s linear infinite' }} className="inline-flex whitespace-nowrap items-center will-change-transform">
              <span className="text-xs text-amber-900 mr-12">{displayNoticeText}</span>
              <span className="text-xs text-amber-900 mr-12">{displayNoticeText}</span>
            </div>
          </div>
          <span className="text-[10px] text-amber-800 bg-white/60 px-2 py-0.5 rounded-lg shrink-0 z-10 font-black shadow-xs">詳情 📜</span>
        </div>
      )}

      {isWayne && (
        <div className="mb-6 bg-white p-3.5 rounded-2xl border border-purple-100 flex justify-between items-center shadow-sm font-black">
          <div className="flex items-center gap-2">
            <span className="text-base">👑</span>
            <div>
              <p className="text-xs text-purple-950 font-black">{wayneViewAll ? '當前視角：全站所有行程 (管理者視角)' : '當前視角：僅我的行程 (個人視角)'}</p>
              <p className="text-[9px] text-gray-400 font-black">{wayneViewAll ? '顯示系統內所有人的行程' : '主頁乾淨整齊，只保留 Wayne 有參與的行程'}</p>
            </div>
          </div>
          <button
            onClick={() => setWayneViewAll(!wayneViewAll)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all ${wayneViewAll ? 'bg-purple-600 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
          >
            {wayneViewAll ? '切回個人行程' : '👀 查看全站行程'}
          </button>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 font-black">
        <h3 className="text-sm text-[#5E9E8E] uppercase italic">
          {wayneViewAll ? 'All Trips (Global View)' : 'My Trips'}
        </h3>
        <div className="flex gap-2">
          <button
            onClick={() => { setJoinCodeInput(''); setShowJoinTripModal(true); }}
            className="text-[10px] bg-emerald-600 text-white px-3.5 py-2 rounded-full shadow-md active:scale-95 transition-transform font-black"
          >
            ➕ 加入旅行 (代碼)
          </button>
          
          <button
            onClick={() => {
              const today = getTodayDateString();
              const freshJoinCode = generateJoinCode(allTrips);
              setNewTrip({ id: '', title: '', startDate: today, endDate: today, emoji: '☃️', memberIds: [user.id], joinCode: freshJoinCode });
              setShowAddTrip(true);
            }}
            className="text-[10px] bg-blue-500 text-white px-3.5 py-2 rounded-full shadow-md active:scale-95 transition-transform font-black"
          >
            + NEW TRIP
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {visibleTrips.length === 0 && (
          <div className="bg-white p-8 rounded-3xl text-center text-gray-300 font-black">
            目前尚無你有權限查看的旅行計劃。<br />
            點擊上方「+ NEW TRIP」建立行程，或「➕ 加入旅行」輸入好友的 6 碼代碼！
          </div>
        )}
        {visibleTrips.map(trip => {
          const canEditThisTrip = isWayne || trip.memberIds[0] === user.id;
          const isIconImage = trip.emoji && (trip.emoji.startsWith('data:image') || trip.emoji.startsWith('http'));

          return (
            <div key={trip.id} className="relative font-black">
              <div 
                onClick={() => onSelect(trip)} 
                className="w-full bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 text-left active:scale-98 transition-all cursor-pointer"
              >
                <div 
                  onClick={(e) => {
                    if (canEditThisTrip) {
                      e.stopPropagation();
                      setEditingTripSetting({
                        original: trip,
                        title: trip.title,
                        startDate: trip.startDate,
                        endDate: trip.endDate,
                        emoji: trip.emoji || '☃️'
                      });
                    }
                  }}
                  title={canEditThisTrip ? "點擊開啟行程設定" : undefined}
                  className={`w-16 h-16 bg-[#F2F1EB] rounded-[24px] flex items-center justify-center text-3xl shrink-0 overflow-hidden relative shadow-inner ${canEditThisTrip ? 'hover:ring-2 hover:ring-[#5E9E8E] cursor-pointer' : ''}`}
                >
                  {isIconImage ? <img src={trip.emoji} alt="Trip Icon" className="w-full h-full object-cover" /> : <span>{trip.emoji || '☃️'}</span>}
                  {canEditThisTrip && (
                    <div className="absolute inset-0 bg-black/25 opacity-0 hover:opacity-100 flex items-center justify-center text-xs text-white transition-opacity">
                      🖋️
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center gap-2">
                    <h4 className="text-lg text-black truncate font-black">{trip.title}</h4>
                    {canEditThisTrip && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTripSetting({
                            original: trip,
                            title: trip.title,
                            startDate: trip.startDate,
                            endDate: trip.endDate,
                            emoji: trip.emoji || '☃️'
                          });
                        }}
                        title="編輯行程名稱與日期"
                        className="text-xs text-blue-500 hover:text-blue-700 bg-blue-50 p-1 rounded-lg shrink-0"
                      >
                        🖋️
                      </button>
                    )}
                    <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-lg shrink-0 font-mono font-black ml-auto">
                      代碼: {trip.joinCode}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase tracking-tighter font-black">{trip.startDate} ~ {trip.endDate}</p>
                  <p className="text-[9px] text-[#5E9E8E] mt-1 font-mono font-black">成員：{trip.memberIds.length} 人</p>
                </div>
              </div>

              {canEditThisTrip && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if(confirm(`確定刪除旅行「${trip.title}」？此操作無法復原。`)) onDeleteTrip(trip.id);
                  }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full text-xs shadow-lg font-black flex items-center justify-center hover:bg-red-600"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>

      {showNoticeModal && (
        <div className="fixed inset-0 bg-black/80 z-[120] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-7 rounded-[44px] shadow-2xl text-black my-auto max-h-[88vh] overflow-y-auto animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">📢</span>
                <div>
                  <h3 className="text-lg text-black font-black">公告與版本更新中心</h3>
                  <p className="text-[10px] text-gray-400">Dupi Travel Changelog & Notice</p>
                </div>
              </div>
              <button onClick={() => setShowNoticeModal(false)} className="text-gray-400 hover:text-black text-xl p-1">✕</button>
            </div>

            {noticeEnabled && (
              <div className="bg-amber-50 border border-amber-200/80 rounded-3xl p-5 mb-6">
                <span className="text-[10px] bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full font-black">📌 當前置頂公告</span>
                <p className="text-xs text-amber-950 leading-relaxed font-bold whitespace-pre-wrap mt-2">{notice || '歡迎使用肚皮旅遊！'}</p>
              </div>
            )}

            <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs text-[#5E9E8E] uppercase tracking-wider">📜 歷史版本更新日誌</span>
                {isWayne && (
                  <button onClick={() => { setShowNoticeModal(false); setShowChangelogAdminModal(true); }} className="text-[10px] text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-xl font-black">⚙️ 管理日記</button>
                )}
              </div>

              {visibleChangelogs.length === 0 && (
                <div className="bg-gray-50 p-6 rounded-3xl text-center text-xs text-gray-400 font-normal">目前尚無已發佈顯示的版本更新紀錄</div>
              )}

              {visibleChangelogs.map((log, idx) => (
                <div key={`${log.id}-${idx}`} className="bg-gray-50 border border-gray-100 rounded-3xl p-4.5">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-emerald-800 font-black bg-emerald-100/60 px-2 py-0.5 rounded-lg">{log.version}</span>
                    <span className="text-[10px] text-gray-400 font-mono">{log.date}</span>
                  </div>
                  <h4 className="text-xs text-black font-black mb-2">{log.title}</h4>
                  <ul className="space-y-1">
                    {log.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="text-[11px] text-gray-600 font-normal leading-relaxed flex items-start gap-1.5">
                        <span className="text-emerald-500 font-black mt-0.5">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            <button onClick={() => setShowNoticeModal(false)} className="w-full mt-6 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md">關閉視窗</button>
          </div>
        </div>
      )}

      {showNoticeAdminModal && (
        <div className="fixed inset-0 bg-black/80 z-[130] p-6 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-7 rounded-[44px] shadow-2xl text-black">
            <h3 className="text-center italic mb-1 uppercase text-lg">首頁公告設定 (Wayne Only)</h3>
            <p className="text-xs text-gray-400 text-center mb-6">可關閉公告以保持首頁乾淨，或開啟跑馬燈公告通知旅伴</p>

            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 flex justify-between items-center mb-5">
              <div>
                <p className="text-xs font-black">首頁跑馬燈顯示狀態</p>
                <p className="text-[10px] text-gray-400 font-normal">{tempNoticeEnabled ? '🟢 目前狀態：已開啟並顯示於首頁' : '⚪ 目前狀態：已關閉隱藏'}</p>
              </div>
              <button type="button" onClick={() => setTempNoticeEnabled(!tempNoticeEnabled)} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${tempNoticeEnabled ? 'bg-emerald-600 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                {tempNoticeEnabled ? '顯示中' : '已關閉'}
              </button>
            </div>

            <label className="text-[10px] text-gray-500 ml-1">公告內容文字</label>
            <textarea rows={4} value={tempNoticeText} onChange={(e) => setTempNoticeText(e.target.value)} className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none text-xs font-black text-black border border-gray-200 mt-1 mb-6 leading-relaxed" />

            <div className="flex gap-3">
              <button type="button" onClick={() => setShowNoticeAdminModal(false)} className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black">取消</button>
              <button type="button" onClick={() => { onUpdateNotice(tempNoticeText.trim()); onUpdateNoticeEnabled(tempNoticeEnabled); setShowNoticeAdminModal(false); }} className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md italic">✓ 儲存套用</button>
            </div>
          </div>
        </div>
      )}

      {showChangelogAdminModal && (
        <div className="fixed inset-0 bg-black/80 z-[140] p-4 flex items-center justify-center">
          <div className="bg-white w-full max-w-lg max-h-[85vh] p-6 rounded-[40px] shadow-2xl text-black font-black flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-lg font-black text-black">管理版本日誌</h3>
                <p className="text-[10px] text-gray-400 font-mono">Wayne Only · 每個版本皆可獨立開關顯示</p>
              </div>
              <button type="button" onClick={() => setShowChangelogAdminModal(false)} className="w-9 h-9 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-black">✕</button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-4">
              {editingLogItem ? (
                <div className="bg-gray-50 p-4 rounded-3xl border border-gray-200 space-y-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-xs text-indigo-600 font-black">{editingLogItem.id ? '🖋️ 編輯版本日誌' : '➕ 新增版本日誌'}</h4>
                    <button type="button" onClick={() => setEditingLogItem(null)} className="text-xs text-gray-400">取消</button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input type="text" placeholder="版本號 (如 v26.10.06)" value={editingLogItem.version} onChange={e => setEditingLogItem({ ...editingLogItem, version: e.target.value })} className="p-2.5 bg-white rounded-xl text-xs font-black border border-gray-200 outline-none" />
                    <input type="date" value={editingLogItem.date} onChange={e => setEditingLogItem({ ...editingLogItem, date: e.target.value })} className="p-2.5 bg-white rounded-xl text-xs font-black border border-gray-200 outline-none" />
                  </div>
                  <input type="text" placeholder="標題" value={editingLogItem.title} onChange={e => setEditingLogItem({ ...editingLogItem, title: e.target.value })} className="w-full p-2.5 bg-white rounded-xl text-xs font-black border border-gray-200 outline-none" />
                  <textarea rows={3} placeholder="項目說明 (每行一項)" value={editingLogItem.itemsText} onChange={e => setEditingLogItem({ ...editingLogItem, itemsText: e.target.value })} className="w-full p-2.5 bg-white rounded-xl text-xs font-black border border-gray-200 outline-none leading-relaxed" />
                  <button type="button" onClick={() => {
                    const parsed = editingLogItem.itemsText.split('\n').map(s => s.trim()).filter(Boolean);
                    const next = editingLogItem.id ? changelogs.map(l => l.id === editingLogItem.id ? { ...l, version: editingLogItem.version, date: editingLogItem.date, title: editingLogItem.title, items: parsed, enabled: editingLogItem.enabled } : l) : [{ id: Date.now().toString(), version: editingLogItem.version, date: editingLogItem.date, title: editingLogItem.title, items: parsed, enabled: editingLogItem.enabled }, ...changelogs];
                    onUpdateChangelogs(next);
                    setEditingLogItem(null);
                  }} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-md">✓ 儲存此版本</button>
                </div>
              ) : (
                <button type="button" onClick={() => setEditingLogItem({ id: '', version: '', date: getTodayDateString(), title: '', itemsText: '', enabled: false })} className="w-full py-3 border-2 border-dashed border-indigo-200 text-indigo-600 rounded-2xl text-xs font-black">+ 新增一筆版本日誌</button>
              )}

              <div className="space-y-2.5">
                {changelogs.map((log, idx) => (
                  <div key={`${log.id}-${idx}`} className="p-3.5 bg-gray-50 border border-gray-100 rounded-2xl flex justify-between items-start">
                    <div className="flex-1 mr-2 overflow-hidden">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs bg-indigo-100 text-indigo-900 px-2 py-0.5 rounded font-black">{log.version}</span>
                        <span className="text-[10px] text-gray-400 font-mono">{log.date}</span>
                        <button type="button" onClick={() => onUpdateChangelogs(changelogs.map(l => l.id === log.id ? { ...l, enabled: !l.enabled } : l))} className={`text-[9px] px-2 py-0.5 rounded-full font-black ${log.enabled ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-200 text-gray-500'}`}>{log.enabled ? '🟢 顯示中' : '⚪ 已隱藏'}</button>
                      </div>
                      <p className="text-xs font-black text-black mt-1 truncate">{log.title}</p>
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <button type="button" onClick={() => setEditingLogItem({ id: log.id, version: log.version, date: log.date, title: log.title, itemsText: log.items.join('\n'), enabled: log.enabled })} className="p-1.5 text-xs text-blue-500">🖋️</button>
                      <button type="button" onClick={() => onUpdateChangelogs(changelogs.filter(l => l.id !== log.id))} className="p-1.5 text-xs text-red-500">🗑️</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" onClick={() => setShowChangelogAdminModal(false)} className="w-full mt-4 py-3 bg-gray-100 text-gray-700 rounded-2xl text-xs font-black">完成並關閉</button>
          </div>
        </div>
      )}

      {editingTripSetting && (
        <div className="fixed inset-0 bg-black/80 z-[120] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black my-auto">
            <h3 className="text-center italic mb-1 uppercase text-xl">行程基本資料設定</h3>
            <p className="text-xs text-gray-400 text-center mb-6">修改封面圖示、行程名稱及旅行日期</p>

            <div className="flex flex-col items-center gap-3 mb-5">
              <div className="w-20 h-20 bg-[#F2F1EB] rounded-[28px] flex items-center justify-center text-4xl shadow-md overflow-hidden border-2 border-[#5E9E8E]">
                {editingTripSetting.emoji && (editingTripSetting.emoji.startsWith('data:image') || editingTripSetting.emoji.startsWith('http')) ? (
                  <img src={editingTripSetting.emoji} className="w-full h-full object-cover" />
                ) : (
                  <span>{editingTripSetting.emoji || '☃️'}</span>
                )}
              </div>
              <ImageUploader label="上傳自訂照片為封面" forceSquare maxDimension={350} onUpload={(b64) => setEditingTripSetting({ ...editingTripSetting, emoji: b64 })} />
            </div>

            <div className="mb-4">
              <label className="text-[10px] text-gray-500 font-black ml-1">行程名稱</label>
              <input type="text" value={editingTripSetting.title} onChange={(e) => setEditingTripSetting({ ...editingTripSetting, title: e.target.value })} className="w-full p-4 bg-gray-50 rounded-2xl outline-none border border-gray-200 font-black text-black mt-1" />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div>
                <label className="text-[10px] text-gray-500 font-black ml-1">開始日期</label>
                <input 
                  type="date" 
                  value={editingTripSetting.startDate} 
                  onChange={(e) => {
                    const startVal = e.target.value;
                    const endVal = editingTripSetting.endDate < startVal ? startVal : editingTripSetting.endDate;
                    setEditingTripSetting({ ...editingTripSetting, startDate: startVal, endDate: endVal });
                  }} 
                  className="w-full p-3.5 bg-gray-50 rounded-2xl text-xs outline-none font-black text-black border border-gray-200 mt-1" 
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 font-black ml-1">結束日期</label>
                <input 
                  type="date" 
                  min={editingTripSetting.startDate}
                  value={editingTripSetting.endDate} 
                  onChange={(e) => {
                    if (e.target.value < editingTripSetting.startDate) return alert("❌ 結束日期不能早於開始日期！");
                    setEditingTripSetting({ ...editingTripSetting, endDate: e.target.value });
                  }} 
                  className="w-full p-3.5 bg-gray-50 rounded-2xl text-xs outline-none font-black text-black border border-gray-200 mt-1" 
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => setEditingTripSetting(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black text-xs">取消</button>
              <button type="button" onClick={handleSaveTripSettings} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl font-black text-xs shadow-md italic">✓ 儲存修改</button>
            </div>
          </div>
        </div>
      )}

      {showJoinTripModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-2 uppercase text-xl">加入旅行計劃</h3>
            <input type="text" placeholder="輸入 6 位代碼..." value={joinCodeInput} onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())} maxLength={6} className="w-full p-5 bg-gray-50 rounded-2xl mb-6 outline-none text-center text-2xl font-mono tracking-widest uppercase border border-gray-200" />
            <div className="flex gap-4">
              <button onClick={() => setShowJoinTripModal(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">取消</button>
              <button onClick={() => { if (!joinCodeInput.trim()) return; onJoinTrip(joinCodeInput.trim().toUpperCase()); setShowJoinTripModal(false); }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic font-black">確認加入</button>
            </div>
          </div>
        </div>
      )}

      {showAddTrip && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] p-8 flex items-center justify-center font-black">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
             <h3 className="text-xl mb-4 italic uppercase">Setup New Trip</h3>
             <input placeholder="Trip Title..." value={newTrip.title} onChange={e=>setNewTrip({...newTrip, title:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-200 font-black text-black" />
             <div className="grid grid-cols-2 gap-4 mb-6">
               <div>
                 <label className="text-[10px] text-gray-500 font-black">開始日期</label>
                 <input 
                   type="date" 
                   value={newTrip.startDate} 
                   onChange={e => {
                     const startVal = e.target.value;
                     const endVal = newTrip.endDate < startVal ? startVal : newTrip.endDate;
                     setNewTrip({ ...newTrip, startDate: startVal, endDate: endVal });
                   }} 
                   className="p-4 bg-gray-50 rounded-2xl text-xs outline-none w-full mt-1 font-black text-black border border-gray-200" 
                 />
               </div>
               <div>
                 <label className="text-[10px] text-gray-500 font-black">結束日期</label>
                 <input 
                   type="date" 
                   min={newTrip.startDate}
                   value={newTrip.endDate} 
                   onChange={e => {
                     if (e.target.value < newTrip.startDate) return alert("❌ 結束日期不能早於開始日期！");
                     setNewTrip({ ...newTrip, endDate: e.target.value });
                   }} 
                   className="p-4 bg-gray-50 rounded-2xl text-xs outline-none w-full mt-1 font-black text-black border border-gray-200" 
                 />
               </div>
             </div>
             <div className="flex gap-4">
                <button onClick={()=>setShowAddTrip(false)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">Cancel</button>
                <button onClick={()=>{
                  if(!newTrip.title.trim()) return alert("請輸入旅行名稱！");
                  if (newTrip.startDate > newTrip.endDate) return alert("❌ 結束日期不能早於開始日期！");
                  onAddTrip({...newTrip, id: Date.now().toString()});
                  setShowAddTrip(false);
                }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic font-black">Create</button>
             </div>
          </div>
        </div>
      )}

      {showLoginIconModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl text-black">
            <h3 className="text-center italic mb-4 uppercase text-lg">更換登入頁面圖示</h3>
            <div className="flex flex-col items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-[#5E9E8E] rounded-[32px] flex items-center justify-center text-4xl shadow-md overflow-hidden border-2 border-white">
                {loginIcon && (loginIcon.startsWith('data:image') || loginIcon.startsWith('http')) ? <img src={loginIcon} className="w-full h-full object-cover" /> : <span>{loginIcon || '❄️'}</span>}
              </div>
              <ImageUploader label="上傳自訂圖案" forceSquare maxDimension={300} onUpload={(b64) => onUpdateLoginIcon(b64)} />
            </div>
            <button onClick={() => setShowLoginIconModal(false)} className="w-full py-4 bg-[#86A760] text-white rounded-3xl font-black">完成設定</button>
          </div>
        </div>
      )}

      {/* 1. 成員名冊 USER ADMIN */}
      {showUserAdmin && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[120] p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md max-h-[85vh] p-6 rounded-[40px] shadow-2xl text-black font-black flex flex-col animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-black text-black">USER ADMIN</h3>
              <button type="button" onClick={() => setShowUserAdmin(false)} className="w-9 h-9 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-black hover:bg-gray-200">✕</button>
            </div>
            <div className="space-y-3 overflow-y-auto flex-1 pr-1">
              {allMembers.map(m => {
                const isSuperAdmin = (m.account || m.loginCode) === 'wayne';

                return (
                  <div key={m.id} className="flex items-center gap-3 bg-gray-50 p-3.5 rounded-2xl shadow-xs">
                    <img src={m.avatar} className="w-10 h-10 rounded-full object-cover shrink-0" />
                    <div className="flex-1 overflow-hidden font-black">
                      <p className="text-xs font-black text-black truncate">{m.name}</p>
                      <p className="text-[9px] text-gray-400 font-mono">帳號: {m.account || m.loginCode}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        type="button" 
                        onClick={() => setEditingMember(m)} 
                        className="text-xs text-blue-500 hover:text-blue-700 font-black px-2 py-1 rounded-lg hover:bg-blue-50"
                      >
                        Edit
                      </button>
                      
                      {!isSuperAdmin && (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`確定要完全刪除成員「${m.name}」？\n此動作將從全站名冊中移除該帳號！`)) {
                              const next = allMembers.filter(item => item.id !== m.id);
                              onUpdateMembers(next);
                            }
                          }}
                          className="text-xs text-red-500 hover:text-red-700 font-black px-2 py-1 rounded-lg hover:bg-red-50"
                          title="刪除成員"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. 編輯個人資料彈窗 */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/80 z-[130] p-4 flex items-center justify-center overflow-y-auto">
          <div className="bg-white w-full max-w-md max-h-[85vh] p-6 rounded-[40px] shadow-2xl text-black flex flex-col animate-in zoom-in-95 my-auto">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <h3 className="text-lg italic uppercase text-black">設定個人資料</h3>
              <button type="button" onClick={() => setEditingMember(null)} className="w-9 h-9 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-sm font-black hover:bg-gray-200">✕</button>
            </div>
            <div className="overflow-y-auto flex-1 pr-1 space-y-3.5">
              <div className="flex flex-col items-center gap-2 mb-2">
                <img src={editingMember.avatar || PRESET_ANIMAL_AVATARS[0]} className="w-20 h-20 rounded-full border-4 border-gray-100 object-cover shadow-md" />
                <ImageUploader label="上傳相片" forceSquare maxDimension={300} onUpload={(b64)=>setEditingMember({...editingMember, avatar:b64})} />
              </div>
              <label className="text-[10px] text-gray-500 ml-2 font-black">用戶名稱</label>
              <input value={editingMember.name} onChange={e=>setEditingMember({...editingMember, name:e.target.value})} className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 font-black text-black text-xs" />
              <label className="text-[10px] text-gray-500 ml-2 font-black">密碼</label>
              <input value={editingMember.loginCode} onChange={e=>setEditingMember({...editingMember, loginCode:e.target.value})} className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 font-black text-black text-xs" />
            </div>
            <div className="flex gap-3 mt-4 pt-3 border-t border-gray-100 shrink-0">
              <button type="button" onClick={()=>setEditingMember(null)} className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black">取消</button>
              <button type="button" onClick={()=>{
                const nextMembers = allMembers.map(m => m.id === editingMember.id ? editingMember : m);
                onUpdateMembers(nextMembers);
                if (editingMember.id === user.id) onUpdateUser(editingMember);
                setEditingMember(null);
              }} className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md italic">✓ 儲存修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
// 3. 主應用程式 (MainApp)
function MainApp({ 
  onBack, 
  user, 
  tripData, 
  allMembers, 
  onUpdateMembers, 
  onUpdateTrip, 
  onUpdateUser 
}: { 
  onBack: () => void, 
  user: Member, 
  tripData: Trip, 
  allMembers: Member[], 
  onUpdateMembers: any, 
  onUpdateTrip: (updated: Trip) => void, 
  onUpdateUser: (u: Member) => void 
}) {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState('行程');
  const [activeDay, setActiveDay] = useState(1);
  const [prepSubTab, setPrepSubTab] = useState('待辦');
  const [bookSubTab, setBookSubTab] = useState('機票'); 
  const [voucherSubTab, setVoucherSubTab] = useState<'未使用' | '已使用'>('未使用');
  const [expenseSubTab, setExpenseSubTab] = useState<'明細' | '查帳'>('明細');
  
  const [filterPayerIds, setFilterPayerIds] = useState<string[]>([user.id]);
  const [filterDates, setFilterDates] = useState<string[]>([]);

  const currentMemberIds = tripData.memberIds || [user.id];
  const dynamicTripDates = useMemo(() => getDatesList(tripData.startDate, tripData.endDate), [tripData.startDate, tripData.endDate]);

  const [records, setRecords] = useState<ExpenseRecord[]>([]);
  const [schedules, setSchedules] = useState<ScheduleData>({});
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [journals, setJournals] = useState<JournalEntry[]>([]);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [bookings, setBookings] = useState<BookingDoc[]>([]);
  const [cityConfigs, setCityConfigs] = useState<CityWeatherConfig[]>([]);

  const [expandedComments, setExpandedComments] = useState<{ [journalId: number]: boolean }>({});
  const [commentInputs, setCommentInputs] = useState<{ [journalId: number]: string }>({});
  const [replyingCommentIds, setReplyingCommentIds] = useState<{ [journalId: number]: number | null }>({});
  const [replyInputs, setReplyInputs] = useState<{ [commentId: number]: string }>({});

  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  // 景點詳細資料彈窗 (Google Maps 風格 Bottom Sheet)
  const [viewingPlanDetail, setViewingPlanDetail] = useState<Plan | null>(null);

  // 準備清單詳細資料彈窗 (放大備註展示、採購相片展示)
  const [viewingTodoDetail, setViewingTodoDetail] = useState<TodoItem | null>(null);

  // 憑證詳細資訊彈窗 (點縮圖卡片開啟中型詳情，內有點擊全螢幕放大)
  const [viewingVoucherDetail, setViewingVoucherDetail] = useState<BookingDoc | null>(null);

  // 行李打包自訂新增項目狀態（依分類暫存輸入）
  const [newPackingInputs, setNewPackingInputs] = useState<{ [cat: string]: string }>({});

  // 行李分類摺疊狀態
  const [collapsedPackingCats, setCollapsedPackingCats] = useState<{ [cat: string]: boolean }>({});

  const [editingVoucherModal, setEditingVoucherModal] = useState<BookingDoc | null>(null);
  const [editingExpenseModal, setEditingExpenseModal] = useState<ExpenseRecord | null>(null);
  const [editingJournalModal, setEditingJournalModal] = useState<JournalEntry | null>(null);
  const [editingTodoModal, setEditingTodoModal] = useState<TodoItem | null>(null);

  // 多人分帳單人個別結清專屬彈窗管理狀態
  const [managingSplitRecord, setManagingSplitRecord] = useState<ExpenseRecord | null>(null);

  const stateRef = useRef({ records, schedules, todos, journals, flights, bookings, cityConfigs });
  useEffect(() => {
    stateRef.current = { records, schedules, todos, journals, flights, bookings, cityConfigs };
  }, [records, schedules, todos, journals, flights, bookings, cityConfigs]);

  const [newCityName, setNewCityName] = useState('');
  const [citySuggestions, setCitySuggestions] = useState<string[]>([]);
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

  const [editingMemberModal, setEditingMemberModal] = useState<Member | null>(null);
  const [exchangeRates, setExchangeRates] = useState({ JPY: 0.22, TWD: 1.0, CNY: 4.5 });
  
  const [currency, setCurrency] = useState<'JPY' | 'TWD' | 'CNY'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dupi_preferred_currency');
      if (saved === 'JPY' || saved === 'TWD' || saved === 'CNY') return saved;
    }
    return 'JPY';
  });

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [payMethod, setPayMethod] = useState(''); 
  const [otherPayMethodNote, setOtherPayMethodNote] = useState('');
  const [expensePayerId, setExpensePayerId] = useState(user.id);

  // 記帳代墊獨立大彈窗 Modal 相關狀態 (優先宣告，避免暫存死區)
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [isAdvanceConfigured, setIsAdvanceConfigured] = useState(false);
  const [advanceTargetType, setAdvanceTargetType] = useState<'member' | 'other'>('member');
  const [advanceMemberId, setAdvanceMemberId] = useState<string>('');
  const [advanceOtherPerson, setAdvanceOtherPerson] = useState('');
  const [advanceOtherNote, setAdvanceOtherNote] = useState('');

  const [tempAdvType, setTempAdvType] = useState<'member' | 'other'>('member');
  const [tempAdvMemberId, setTempAdvMemberId] = useState<string>('');
  const [tempAdvOtherPerson, setTempAdvOtherPerson] = useState('');
  const [tempAdvOtherNote, setTempAdvOtherNote] = useState('');

  // 排除自己：旅伴代墊名單中絕不出現當前的付款人
  const otherTripMembers = useMemo(() => {
    return allMembers.filter(m => currentMemberIds.includes(m.id) && m.id !== expensePayerId);
  }, [allMembers, currentMemberIds, expensePayerId]);

  const handleOpenAdvanceModal = () => {
    setTempAdvType(advanceTargetType);
    setTempAdvMemberId(isAdvanceConfigured ? advanceMemberId : '');
    setTempAdvOtherPerson(isAdvanceConfigured ? advanceOtherPerson : '');
    setTempAdvOtherNote(isAdvanceConfigured ? advanceOtherNote : '');
    setShowAdvanceModal(true);
  };

  const handleSaveAdvanceModal = () => {
    if (tempAdvType === 'member') {
      if (!tempAdvMemberId) {
        return alert("請選擇代墊對象旅伴！若只有自己一人，可切換為「幫其他人」。");
      }
      setAdvanceMemberId(tempAdvMemberId);
    } else {
      if (!tempAdvOtherPerson.trim()) {
        return alert("請輸入代墊對象名稱或點選快速標籤（如：家人、同事）！");
      }
      setAdvanceOtherPerson(tempAdvOtherPerson.trim());
      setAdvanceOtherNote(tempAdvOtherNote.trim());
    }
    setAdvanceTargetType(tempAdvType);
    setIsAdvanceConfigured(true);
    setIsSplitConfigured(false);
    setShowAdvanceModal(false);
  };

  // 多人分帳相關狀態
  const [showSplitModal, setShowSplitModal] = useState(false);
  const [isSplitConfigured, setIsSplitConfigured] = useState(false);
  const [splitMemberIds, setSplitMemberIds] = useState<string[]>(currentMemberIds);
  const [tempSplitMemberIds, setTempSplitMemberIds] = useState<string[]>(currentMemberIds);
  
  const handleOpenSplitModal = () => {
    setTempSplitMemberIds(isSplitConfigured ? splitMemberIds : currentMemberIds);
    setShowSplitModal(true);
  };

  const handleSaveSplitModal = () => {
    if (tempSplitMemberIds.length === 0) {
      return alert("請至少選擇一位分帳成員！");
    }
    setSplitMemberIds(tempSplitMemberIds);
    setIsSplitConfigured(true);
    setIsAdvanceConfigured(false);
    setShowSplitModal(false);
  };

  const [newJournalContent, setNewJournalContent] = useState('');
  const [newJournalImages, setNewJournalImages] = useState<string[]>([]);
  const [newJournalVideo, setNewJournalVideo] = useState('');

  // 待辦/採購新增輸入狀態
  const [newTodoInput, setNewTodoInput] = useState({ task: '', note: '', image: '', assigneeIds: [user.id] as string[] });

  const [showPlanModal, setShowPlanModal] = useState<{show: boolean, type: 'add'|'edit', data?: Plan}>({show: false, type: 'add'});
  const [planForm, setPlanForm] = useState({ time: '09:00', title: '', desc: '', icon: '📍' });
  const [placeSuggestions, setPlaceSuggestions] = useState<Array<{ title: string; subtitle: string; icon: string }>>([]);
  const [isSearchingPlaces, setIsSearchingPlaces] = useState(false);
  const isSelectingPlaceRef = useRef(false);

  const [showFlightModal, setShowFlightModal] = useState<{show: boolean, type: 'add'|'edit', data?: Flight | null}>({show: false, type: 'add', data: null});
  const [flightForm, setFlightForm] = useState<Flight>({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '10:00', arrTime: '14:00', duration: '', date: dynamicTripDates[0] || '10/07', baggage: '', aircraft: '' });

  // 行李清單初始化：若目前無行李項目，自動注入歷史/預設清單（未準備狀態）
  const hasInitializedPackingRef = useRef(false);
  useEffect(() => {
    if (!isDataLoaded) return;
    if (hasInitializedPackingRef.current) return;
    
    const currentPackingItems = todos.filter(t => t.category === '行李');
    if (currentPackingItems.length === 0) {
      let savedHistoryItems: string[] = [];
      try {
        const historyJson = localStorage.getItem('dupi_user_packing_history_v26');
        if (historyJson) {
          savedHistoryItems = JSON.parse(historyJson);
        }
      } catch (e) {}

      let itemsToInject: { task: string; note: string }[] = [];
      if (savedHistoryItems && savedHistoryItems.length > 0) {
        itemsToInject = savedHistoryItems.map(itemStr => {
          const parts = itemStr.split('::');
          return { task: parts[0] || itemStr, note: parts[1] || '生活日用' };
        });
      } else {
        DEFAULT_PACKING_CATEGORIES.forEach(cat => {
          cat.items.forEach(it => {
            itemsToInject.push({ task: it, note: cat.category });
          });
        });
      }

      if (itemsToInject.length > 0) {
        const generated: TodoItem[] = itemsToInject.map((it, idx) => ({
          id: Date.now() + idx,
          task: it.task,
          note: it.note,
          assigneeIds: currentMemberIds,
          completedAssigneeIds: [],
          category: '行李',
          lastUpdatedById: user.id
        }));

        const updated = [...todos, ...generated];
        setTodos(updated);
        sync({ todos: updated });
      }
    }
    hasInitializedPackingRef.current = true;
  }, [todos, currentMemberIds, user.id, isDataLoaded]);

  // 行李清單異動時，同步記憶至使用者個人偏好歷程
  const savePackingHistory = (currentTodos: TodoItem[]) => {
    const packing = currentTodos.filter(t => t.category === '行李');
    if (packing.length > 0) {
      const historyStrings = packing.map(p => `${p.task}::${p.note || '生活日用'}`);
      localStorage.setItem('dupi_user_packing_history_v26', JSON.stringify(Array.from(new Set(historyStrings))));
    }
  };

  // 彈窗背景鎖定
  useEffect(() => {
    const isAnyModalOpen = Boolean(
      viewingPlanDetail || 
      viewingTodoDetail || 
      viewingVoucherDetail ||
      showAdvanceModal || 
      showSplitModal || 
      editingVoucherModal || 
      editingExpenseModal || 
      editingJournalModal || 
      editingTodoModal || 
      editingMemberModal || 
      lightboxImg || 
      showPlanModal.show || 
      showFlightModal.show ||
      managingSplitRecord
    );
    document.body.style.overflow = isAnyModalOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [
    viewingPlanDetail, 
    viewingTodoDetail, 
    viewingVoucherDetail,
    showAdvanceModal, 
    showSplitModal, 
    editingVoucherModal, 
    editingExpenseModal, 
    editingJournalModal, 
    editingTodoModal, 
    editingMemberModal, 
    lightboxImg, 
    showPlanModal.show, 
    showFlightModal.show,
    managingSplitRecord
  ]);

  const isWayne = (user.account || user.loginCode) === 'wayne';

  const getMember = (id?: string) => {
    if (!id) return { id: '', account:'', name: '未定', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: '', editLogs: [] };
    const found = allMembers.find(m => m.id === id);
    return found || { id, account:'', name: '未知成員', avatar: PRESET_ANIMAL_AVATARS[0], loginCode: '', editLogs: [] };
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

  const fetchWeatherForDay = async (dayNum: number, configs: CityWeatherConfig[]) => {
    const currentCityConfig = configs.find(c => c.dayIndexes.includes(dayNum));
    if (!currentCityConfig) {
      setWeatherStatus({
        hasConfig: false,
        cityName: '',
        isTooFar: false,
        daysUntil: 0,
        advice: '請先在下方新增城市並勾選日期以獲取即時天氣'
      });
      return;
    }

    const targetDate = getDateObj(tripData.startDate, dayNum);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    targetDate.setHours(0, 0, 0, 0);

    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays > 14) {
      setWeatherStatus({
        hasConfig: true,
        cityName: currentCityConfig.name,
        isTooFar: true,
        daysUntil: diffDays,
        advice: '建議出發前 5 天查看最新即時預報'
      });
      return;
    }

    try {
      const cleanSearchName = currentCityConfig.name.replace(/(市|區|縣|町)$/, '').trim() || currentCityConfig.name;

      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cleanSearchName)}&count=1&language=zh&format=json`
      );
      const geoData = await geoRes.json();
      
      let lat = 34.6937;
      let lon = 135.5023;

      if (geoData.results && geoData.results.length > 0) {
        lat = geoData.results[0].latitude;
        lon = geoData.results[0].longitude;
      }

      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum&timezone=auto`
      );
      const wData = await weatherRes.json();

      if (wData.daily && wData.daily.temperature_2m_max) {
        const maxT = Math.round(wData.daily.temperature_2m_max[0]);
        const minT = Math.round(wData.daily.temperature_2m_min[0]);
        const avgTemp = Math.round((maxT + minT) / 2);
        const pop = wData.daily.precipitation_probability_max[0] || 0;
        const precip = wData.daily.precipitation_sum[0] || 0;

        let advice = '天氣舒適，適合外出！';
        if (pop >= 60 || precip > 5) advice = '降雨機率高，出門記得攜帶雨具 ☔';
        else if (avgTemp <= 10) advice = '氣溫偏低，請準備保暖防風外套 🧣';
        else if (avgTemp >= 28) advice = '天氣炎熱，請注意防曬並多補充水分 🥤';

        setWeatherStatus({
          hasConfig: true,
          cityName: currentCityConfig.name,
          isTooFar: false,
          daysUntil: Math.max(0, diffDays),
          temp: avgTemp,
          pop,
          precip,
          advice
        });
      }
    } catch (err) {
      console.warn('Weather fetch error:', err);
    }
  };

  useEffect(() => {
    fetchWeatherForDay(activeDay, cityConfigs);
  }, [activeDay, cityConfigs, tripData.startDate]);

  useEffect(() => {
    if (!newCityName.trim()) {
      setCitySuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(newCityName.trim())}&count=5&language=zh&format=json`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const names = data.results.map((r: any) => r.name);
          setCitySuggestions(Array.from(new Set(names)));
        } else {
          setCitySuggestions([]);
        }
      } catch (e) {
        setCitySuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [newCityName]);

  useEffect(() => {
    if (isSelectingPlaceRef.current) {
      isSelectingPlaceRef.current = false;
      return;
    }
    const q = planForm.title.trim();
    if (!q || q.length < 2) {
      setPlaceSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearchingPlaces(true);
      try {
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=zh&format=json`
        );
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const mapped = data.results.map((item: any) => ({
            title: item.name,
            subtitle: `${item.admin1 || ''} ${item.country || ''}`.trim(),
            icon: detectPlaceIcon(item.name)
          }));
          setPlaceSuggestions(mapped);
        } else {
          setPlaceSuggestions([]);
        }
      } catch (err) {
        setPlaceSuggestions([]);
      } finally {
        setIsSearchingPlaces(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [planForm.title]);

  const updateLocalState = (c: any) => {
    if (!c) return;
    setRecords(c.records || []);
    setSchedules(c.schedules || {});
    setTodos(c.todos || []);
    setJournals(c.journals || []);
    setFlights(c.flights || []);
    setBookings(c.bookings || []);
    if (c.cityConfigs) {
      setCityConfigs(c.cityConfigs);
      fetchWeatherForDay(activeDay, c.cityConfigs);
    }
    localStorage.setItem(`trip_cache_${tripData.id}`, JSON.stringify(c));

    stateRef.current = {
      ...stateRef.current,
      records: c.records || [],
      schedules: c.schedules || {},
      todos: c.todos || [],
      journals: c.journals || [],
      flights: c.flights || [],
      bookings: c.bookings || [],
      cityConfigs: c.cityConfigs || []
    };
  };

  useEffect(() => {
    const cached = localStorage.getItem(`trip_cache_${tripData.id}`);
    if (cached) {
      try { 
        updateLocalState(JSON.parse(cached)); 
        setIsDataLoaded(true);
      } catch(e){}
    }

    const loadCloudData = async () => {
      const { data } = await supabase.from('trips').select('content').eq('id', tripData.id).single();
      if (data?.content) {
        updateLocalState(data.content);
      }
      setIsDataLoaded(true);
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

// 🛡️ 3小時/5天 歷史快照備份機制 (自動管理)
const handleHistoricalBackup = async (currentData: any) => {
  const BACKUP_INTERVAL = 3 * 60 * 60 * 1000; // 3 小時的毫秒數
  const RETENTION_PERIOD = 5 * 24 * 60 * 60 * 1000; // 5 天的毫秒數
  const now = Date.now();
  const lastBackupKey = `last_backup_time_${tripData.id}`;
  const lastBackupTime = parseInt(localStorage.getItem(lastBackupKey) || '0', 10);

  // 如果距離上次備份已經超過 3 小時，觸發新備份
  if (now - lastBackupTime >= BACKUP_INTERVAL) {
    console.log("🕒 觸發 3 小時歷史快照備份...");
    try {
      // 1. 寫入新快照備份 (將 ID 加上 _backup_時間戳 作為獨立紀錄)
      const backupId = `${tripData.id}_backup_${now}`;
      await supabase.from('trips').upsert({ id: backupId, content: currentData });
      localStorage.setItem(lastBackupKey, now.toString()); // 記錄本次備份時間

      // 2. 抓取舊備份清單，並清理超過 5 天的資料
      const { data: existingBackups } = await supabase
        .from('trips')
        .select('id')
        .like('id', `${tripData.id}_backup_%`);

      if (existingBackups) {
        const cutoffTime = now - RETENTION_PERIOD;
        const toDelete = existingBackups.filter(b => {
          const parts = b.id.split('_backup_');
          if (parts.length === 2) {
            const bTime = parseInt(parts[1], 10);
            return bTime < cutoffTime; // 判斷是否小於 5 天前的時間戳
          }
          return false;
        }).map(b => b.id);

        // 一次性刪除所有過期的快照備份
        if (toDelete.length > 0) {
          await supabase.from('trips').delete().in('id', toDelete);
          console.log(`🗑️ 已自動清理 ${toDelete.length} 筆過期備份`);
        }
      }
    } catch (err) {
      console.error("備份機制發生錯誤:", err);
    }
  }
};

// 原有的資料同步功能 (加入觸發備份的邏輯)
  const sync = async (update: any) => {
  const full = { ...stateRef.current, ...update };
  
  // 🛡️ 保險開關：如果發現行程、記帳、準備清單全部都是空的，就直接擋下來！
  if (Object.keys(full.schedules || {}).length === 0 && (full.records || []).length === 0 && (full.todos || []).length === 0) {
    console.warn("⚠️ 偵測到資料為全空狀態，已啟動保護機制，停止覆蓋雲端資料！");
    return; 
  }

  stateRef.current = full;
  localStorage.setItem(`trip_cache_${tripData.id}`, JSON.stringify(full));
  try {
    // 更新主資料
    await supabase.from('trips').upsert({ id: tripData.id, content: full });
    
    // 👇 在每次成功同步主資料後，檢查是否需要進行 3 小時快照備份
    handleHistoricalBackup(full);
    
  } catch(e) {
    console.warn("Sync warning", e);
  }
};


const handleUpdateTripMembers = (newMemberIds: string[]) => {
  const updatedTrip = { ...tripData, memberIds: newMemberIds };
  onUpdateTrip(updatedTrip);
};

  const sortedFlights = useMemo(() => {
    return [...flights].sort((a, b) => {
      const indexA = dynamicTripDates.indexOf(a.date);
      const indexB = dynamicTripDates.indexOf(b.date);
      const validA = indexA === -1 ? 9999 : indexA;
      const validB = indexB === -1 ? 9999 : indexB;

      if (validA !== validB) return validA - validB;
      return a.depTime.localeCompare(b.depTime);
    });
  }, [flights, dynamicTripDates]);

  const pureTripDates = useMemo(() => {
    return dynamicTripDates.map(dStr => dStr.split(' ')[0]);
  }, [dynamicTripDates]);

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      const matchPayer = filterPayerIds.length === 0 || filterPayerIds.includes(r.payerId);
      const rPureDate = r.date.split(' ')[0];
      const matchDate = filterDates.length === 0 || filterDates.includes(rPureDate);
      return matchPayer && matchDate;
    });
  }, [records, filterPayerIds, filterDates]);

  const expenseStats = useMemo(() => {
    let totalTwd = 0;
    const categoryTotals: { [cat: string]: number } = {};
    const memberTotals: { [memberId: string]: number } = {};
    const dateGroups: { [groupName: string]: ExpenseRecord[] } = {};

    filteredRecords.forEach(r => {
      const isSettledOther = r.isAdvance && r.advanceTargetType === 'other' && r.isSettled;
      const amountNum = Number(r.twdAmount || 0);

      if (!isSettledOther) {
        totalTwd += amountNum;
        const c = r.category || '其他';
        categoryTotals[c] = (categoryTotals[c] || 0) + amountNum;
        memberTotals[r.payerId] = (memberTotals[r.payerId] || 0) + amountNum;
      }

      const rPureDate = r.date.split(' ')[0];
      const matchTripDateFull = dynamicTripDates.find(d => d.startsWith(rPureDate));
      const dName = matchTripDateFull || '其他日期 (非旅行日)';

      if (!dateGroups[dName]) dateGroups[dName] = [];
      dateGroups[dName].push(r);
    });

    const palette = ['#5E9E8E', '#E9C46A', '#E76F51', '#2A9D8F', '#F4A261', '#457B9D', '#A8DADC', '#6D6875'];
    let accumulated = 0;
    const slices = Object.entries(categoryTotals).map(([cat, val], idx) => {
      const pct = totalTwd > 0 ? (val / totalTwd) * 100 : 0;
      const startAngle = accumulated * 3.6;
      accumulated += pct;
      const endAngle = accumulated * 3.6;
      return {
        cat,
        val,
        pct: Number(pct.toFixed(1)),
        color: palette[idx % palette.length],
        startAngle,
        endAngle
      };
    });

    const maxMemberVal = Math.max(...Object.values(memberTotals), 1);
    const memberBars = Object.entries(memberTotals).map(([mId, val]) => {
      const pct = totalTwd > 0 ? (val / totalTwd) * 100 : 0;
      const barWidthPct = Math.min(100, (val / maxMemberVal) * 100);
      return {
        mId,
        val,
        pct: Number(pct.toFixed(1)),
        barWidthPct
      };
    });

    return { totalTwd, categoryTotals, dateGroups, slices, memberBars };
  }, [filteredRecords, dynamicTripDates]);

  const handleSettleAdvance = (recordId: number) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    if (target.advanceTargetType === 'member') {
      const advMember = getMember(target.advanceMemberId);
      if (!confirm(`確定要將此筆代墊款結清嗎？\n結清後，該筆金額將正式轉為 ${advMember.name} 的花費支出。`)) return;

      const next = records.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          isSettled: true,
          originalPayerId: r.payerId,
          payerId: r.advanceMemberId || r.payerId,
          lastUpdatedById: user.id
        };
      });
      setRecords(next);
      sync({ records: next });
      alert(`✅ 代墊款已結清，支出已轉移計入 ${advMember.name}！`);
    } else {
      if (!confirm(`確定已收到外部代墊款嗎？\n結清後紀錄將完整保留，但此筆金額將從行程總花費預算中扣除。`)) return;

      const next = records.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          isSettled: true,
          lastUpdatedById: user.id
        };
      });
      setRecords(next);
      sync({ records: next });
      alert("✅ 已標記代墊結清，款項已從實質總支出中扣除！");
    }
  };

  const handleUnsettleAdvance = (recordId: number) => {
    const target = records.find(r => r.id === recordId);
    if (!target) return;

    if (target.advanceTargetType === 'member') {
      const originalPayer = getMember(target.originalPayerId || target.payerId);
      if (!confirm(`確定要取消結清，將此筆款項退回為未結清嗎？\n款項將重新轉回 ${originalPayer.name} 帳上。`)) return;

      const next = records.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          isSettled: false,
          payerId: r.originalPayerId || r.payerId,
          lastUpdatedById: user.id
        };
      });
      setRecords(next);
      sync({ records: next });
      alert("✅ 已退回為未結清狀態！");
    } else {
      if (!confirm(`確定要取消結清嗎？\n退回後，此筆款項將重新計入行程總支出。`)) return;

      const next = records.map(r => {
        if (r.id !== recordId) return r;
        return {
          ...r,
          isSettled: false,
          lastUpdatedById: user.id
        };
      });
      setRecords(next);
      sync({ records: next });
      alert("✅ 已退回為未結清狀態！");
    }
  };

  const handleToggleLike = (journalId: number) => {
    const nextJournals = journals.map(j => {
      if (j.id !== journalId) return j;
      const currentLikes = j.likes || [];
      const hasLiked = currentLikes.includes(user.id);
      const updatedLikes = hasLiked
        ? currentLikes.filter(id => id !== user.id)
        : [...currentLikes, user.id];
      return { ...j, likes: updatedLikes };
    });
    setJournals(nextJournals);
    sync({ journals: nextJournals });
  };

  const handleToggleCommentLike = (journalId: number, commentId: number) => {
    const next = journals.map(j => {
      if (j.id !== journalId) return j;
      const nextComments = (j.comments || []).map(c => {
        if (c.id !== commentId) return c;
        const currentLikes = c.likes || [];
        const hasLiked = currentLikes.includes(user.id);
        return {
          ...c,
          likes: hasLiked ? currentLikes.filter(id => id !== user.id) : [...currentLikes, user.id]
        };
      });
      return { ...j, comments: nextComments };
    });
    setJournals(next);
    sync({ journals: next });
  };

  const handleAddComment = (journalId: number, replyToCommentId?: number) => {
    const text = replyToCommentId 
      ? (replyInputs[replyToCommentId] || '').trim()
      : (commentInputs[journalId] || '').trim();

    if (!text) return alert("請輸入留言內容！");

    const newComment: JournalComment = {
      id: Date.now(),
      authorId: user.id,
      content: text,
      date: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      likes: [],
      replyToCommentId
    };

    const nextJournals = journals.map(j => {
      if (j.id !== journalId) return j;
      const existingComments = j.comments || [];
      return { ...j, comments: [...existingComments, newComment] };
    });

    setJournals(nextJournals);
    sync({ journals: nextJournals });

    if (replyToCommentId) {
      setReplyInputs({ ...replyInputs, [replyToCommentId]: '' });
      setReplyingCommentIds({ ...replyingCommentIds, [journalId]: null });
    } else {
      setCommentInputs({ ...commentInputs, [journalId]: '' });
    }
  };

  const handleDeleteComment = (journalId: number, commentId: number) => {
    if (!confirm("確定要刪除此留言嗎？")) return;
    const nextJournals = journals.map(j => {
      if (j.id !== journalId) return j;
      return {
        ...j,
        comments: (j.comments || []).filter(c => c.id !== commentId && c.replyToCommentId !== commentId)
      };
    });
    setJournals(nextJournals);
    sync({ journals: nextJournals });
  };

  return (
    <div className="min-h-screen bg-[#F9F8F3] font-sans pb-32 text-black font-black">
      <div className="p-4 flex justify-between items-center sticky top-0 bg-[#F9F8F3]/90 backdrop-blur-md z-40">
        <div onClick={onBack} className="flex items-center gap-3 cursor-pointer">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-xl">←</div>
          <div>
            <h1 className="text-xl italic uppercase text-[#5E9E8E] tracking-tighter leading-tight font-black">{tripData.title}</h1>
            <p className="text-[9px] text-gray-400 font-mono tracking-wider font-black">CODE: {tripData.joinCode}</p>
          </div>
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
        {activeTab === '行程' && (
          <div className="animate-in fade-in">
            {/* 頂部天氣卡片 */}
            <div className="bg-[#5E9E8E] rounded-[32px] p-6 text-white mb-6 shadow-lg relative overflow-hidden transition-all">
                <button 
                  onClick={() => setShowCityEditor(!showCityEditor)}
                  className="absolute top-5 right-5 bg-white/20 hover:bg-white/30 p-2.5 rounded-2xl active:scale-95 transition-all text-sm z-10"
                  title="設定城市"
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
                    <p className="text-[11px] opacity-85 mt-1 italic">💡 距離出發日較遠，建議出發前 5 天查看即時預報！</p>
                    <button
                      type="button"
                      onClick={() => { window.location.href = `https://www.google.com/search?q=${encodeURIComponent(weatherStatus.cityName)}+天氣`; }}
                      className="mt-3 text-[10px] bg-white/25 hover:bg-white/35 px-3 py-1.5 rounded-xl font-black text-white flex items-center gap-1 active:scale-95 transition-all"
                    >
                      🔍 查看 Google {weatherStatus.cityName} 即時天氣
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex justify-between items-start pr-12">
                      <h2 className="text-5xl font-mono tracking-tighter">{weatherStatus.temp}°C</h2>
                      <button
                        type="button"
                        onClick={() => { window.location.href = `https://www.google.com/search?q=${encodeURIComponent(weatherStatus.cityName)}+天氣`; }}
                        className="text-xs bg-white/20 hover:bg-white/35 px-3 py-1 rounded-full uppercase tracking-widest active:scale-95 transition-all"
                        title="點擊查看 Google 官方詳細天氣"
                      >
                        📍 {weatherStatus.cityName} ↗
                      </button>
                    </div>
                    <div className="flex justify-between items-end mt-3">
                        <p className="text-[10px] uppercase opacity-70 font-black">Rain/Snow: {weatherStatus.pop}% | {weatherStatus.precip}mm</p>
                        <p className="text-[10px] bg-white/20 px-3 py-1 rounded-full italic shadow-sm max-w-[65%] truncate">💡 {weatherStatus.advice}</p>
                    </div>
                  </div>
                )}
            </div>

            {showCityEditor && (
              <div className="bg-white p-5 rounded-[28px] mb-6 shadow-sm border border-gray-100 animate-in slide-in-from-top-3">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-xs text-[#5E9E8E] uppercase tracking-wider font-black">🏙️ 城市與天氣排程</h4>
                  <div className="relative flex gap-2">
                    <input 
                      placeholder="輸入城市 (如: 台北、大阪)..." 
                      value={newCityName} 
                      onChange={e => setNewCityName(e.target.value)} 
                      className="p-2 px-3 bg-gray-50 rounded-xl text-xs outline-none border border-gray-200 font-black text-black placeholder:text-gray-400" 
                    />
                    <button 
                      onClick={() => {
                        if (!newCityName.trim()) return alert("請輸入城市名稱！");
                        const next = [...cityConfigs, { id: Date.now().toString(), name: newCityName.trim(), dayIndexes: [activeDay] }];
                        setCityConfigs(next);
                        sync({ cityConfigs: next });
                        fetchWeatherForDay(activeDay, next);
                        setNewCityName('');
                        setCitySuggestions([]);
                      }}
                      className="bg-[#5E9E8E] text-white text-[10px] px-3 py-2 rounded-xl shadow-sm active:scale-95 font-black"
                    >
                      + 新增
                    </button>

                    {citySuggestions.length > 0 && (
                      <div className="absolute top-11 left-0 right-14 bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                        {citySuggestions.map((cityName, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              setNewCityName(cityName);
                              setCitySuggestions([]);
                            }}
                            className="p-2.5 text-xs text-black font-black hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-b-0 flex items-center gap-1.5"
                          >
                            <span>🏙️</span> {cityName}
                          </div>
                        ))}
                      </div>
                    )}
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
                            fetchWeatherForDay(activeDay, next);
                          }}
                          className="text-red-400 text-xs font-black"
                        >
                          ✕ 刪除
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-[10px] text-gray-500 font-black">待在此處的日期：</span>
                        {dynamicTripDates.map((dStr, idx) => {
                          const dayNum = idx + 1;
                          const isChecked = c.dayIndexes.includes(dayNum);
                          return (
                            <label key={dayNum} className={`flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-xl cursor-pointer transition-all font-black ${isChecked ? 'bg-[#5E9E8E] text-white shadow-sm' : 'bg-white text-gray-500 border border-gray-200'}`}>
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
                                  fetchWeatherForDay(activeDay, next);
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
            
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {dynamicTripDates.map((dateStr, idx) => {
                const d = idx + 1;
                const [mDate, rawDay] = dateStr.includes(' ') ? dateStr.split(' ') : [dateStr, ''];
                const cleanDay = rawDay.replace(/[()]/g, '');
                const dayLabel = cleanDay ? `星期${cleanDay}` : '';

                return (
                  <button 
                    key={d} 
                    onClick={() => setActiveDay(d)} 
                    className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${activeDay===d?'bg-[#E9C46A] text-white shadow-lg scale-105':'bg-white text-gray-500 border border-gray-200'}`}
                  >
                    <span className="text-[10px] font-bold">{mDate}</span>
                    <span className="text-xl font-black">{d}</span>
                    <span className={`text-[9px] font-black ${activeDay===d ? 'text-white/90' : 'text-emerald-700'}`}>
                      {dayLabel}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-8 space-y-8 relative">
                <div className="absolute left-[19px] top-0 bottom-0 w-0.5 border-dashed border-l border-gray-200"></div>
                {(schedules[activeDay]||[]).sort((a,b)=>a.time.localeCompare(b.time)).map(item=>(
                    <div key={item.id} className="flex gap-4 relative">
                        <div className="w-10 flex flex-col items-center shrink-0">
                            <div className="w-4 h-4 rounded-full bg-white border-4 border-[#86A760] z-10 mt-1 shadow-sm"></div>
                            <span className="text-[10px] text-gray-500 mt-2 font-mono font-black">{item.time}</span>
                        </div>
                        <div 
                          onClick={() => setViewingPlanDetail(item)}
                          className="flex-1 bg-white p-5 rounded-[24px] shadow-sm border border-orange-50 relative group cursor-pointer hover:shadow-md active:scale-98 transition-all"
                        >
                            <div className="flex justify-between items-start">
                              <h4 className="font-black text-sm text-black">{item.icon} {item.title}</h4>
                              {item.lastUpdatedById && (
                                <span className="text-[9px] text-[#5E9E8E] bg-green-50 px-2 py-0.5 rounded-full font-black">
                                  最後編輯: {getMember(item.lastUpdatedById).name}
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] text-gray-500 mt-1 leading-relaxed font-black line-clamp-2">{item.desc}</p>
                            <div className="mt-4 flex justify-between items-center">
                                {/* 外部連結跳轉：使用 window.location.href 直接導向，避免產生空白標籤頁 */}
                                <button 
                                  onClick={(e) => { 
                                    e.stopPropagation(); 
                                    window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.title)}`;
                                  }} 
                                  className="text-[10px] bg-gray-50 text-[#5E9E8E] px-3 py-1.5 rounded-full font-black shadow-inner active:scale-95"
                                >
                                  📍 GOOGLE MAP
                                </button>
                                <div className="flex gap-3 z-20">
                                    <button onClick={(e)=>{e.stopPropagation(); setPlanForm(item); setShowPlanModal({show:true,type:'edit',data:item});}} className="text-xs text-blue-400 bg-blue-50 p-2 rounded-xl active:scale-90 transition-transform">🖋️</button>
                                    <button onClick={(e)=>{e.stopPropagation(); if(confirm('確定刪除此行程？')){const n=(schedules[activeDay]||[]).filter(p=>p.id!==item.id); const up={...schedules,[activeDay]:n}; setSchedules(up); sync({schedules:up});}}} className="text-xs text-red-400 bg-red-50 p-2 rounded-xl active:scale-90 transition-transform">🗑️</button>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
                <button onClick={()=> { setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'}); setPlaceSuggestions([]); setShowPlanModal({show:true,type:'add'}); }} className="ml-14 w-[calc(100%-3.5rem)] py-4 border-2 border-dashed border-gray-200 rounded-2xl text-gray-400 text-sm font-black active:bg-gray-50">+ ADD NEW STOP</button>
            </div>
          </div>
        )}

        {/* 行程詳細資訊彈窗 */}
        {viewingPlanDetail && (
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 font-black"
            onClick={() => setViewingPlanDetail(null)}
          >
            <div 
              className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto text-black flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

              <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 shrink-0">
                <div className="flex items-center gap-3 overflow-hidden pr-2">
                  <span className="text-3xl shrink-0 p-2 bg-[#F9F8F3] rounded-2xl border border-gray-200">
                    {viewingPlanDetail.icon || '📍'}
                  </span>
                  <div className="overflow-hidden">
                    <h3 className="text-lg font-black text-black truncate">{viewingPlanDetail.title}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">
                        ⏰ {viewingPlanDetail.time}
                      </span>
                      {viewingPlanDetail.lastUpdatedById && (
                        <span className="text-[9px] text-gray-400">
                          最後編輯: {getMember(viewingPlanDetail.lastUpdatedById).name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setViewingPlanDetail(null)} 
                  className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors"
                >
                  ✕
                </button>
              </div>

              {/* 外部連結跳轉：使用 window.location.href 直接導向，iOS 自動喚起 App 不留空白頁 */}
              <div className="grid grid-cols-2 gap-3 mb-5 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(viewingPlanDetail.title)}`;
                  }}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-emerald-50 hover:bg-emerald-100 text-[#5E9E8E] rounded-2xl active:scale-95 transition-all border border-emerald-100"
                >
                  <span className="text-lg mb-0.5">🧭</span>
                  <span className="text-xs font-black">地圖導航</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    window.location.href = `https://www.google.com/search?q=${encodeURIComponent(viewingPlanDetail.title)}`;
                  }}
                  className="flex flex-col items-center justify-center py-3 px-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-2xl active:scale-95 transition-all border border-blue-100"
                >
                  <span className="text-lg mb-0.5">🔍</span>
                  <span className="text-xs font-black">評價與資訊</span>
                </button>
              </div>

              <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 overflow-y-auto flex-1 mb-5">
                <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-black">備註與詳細說明</p>
                {viewingPlanDetail.desc ? (
                  <p className="text-base text-gray-800 leading-relaxed font-normal whitespace-pre-wrap">
                    {viewingPlanDetail.desc}
                  </p>
                ) : (
                  <p className="text-xs text-gray-400 italic font-normal py-4 text-center">
                    目前尚未填寫詳細備註～
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={() => setViewingPlanDetail(null)}
                className="w-full py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md active:scale-98 transition-transform shrink-0"
              >
                關閉
              </button>
            </div>
          </div>
        )}
        {/* --- [Tab: 預訂] --- */}
        {activeTab === '預訂' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
                {['機票','憑證'].map(t=>(
                    <button key={t} onClick={()=>setBookSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${bookSubTab===t?'bg-[#E9C46A] text-white shadow-md scale-105':'text-gray-400'}`}>{t}</button>
                ))}
            </div>

            {bookSubTab === '機票' ? (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Flight Info</h3>
                  <button onClick={()=>{setFlightForm({ id: 0, airline: '', flightNo: '', fromCode: '', toCode: '', depTime: '10:00', arrTime: '14:00', duration: '', date: dynamicTripDates[0] || '10/07', baggage: '', aircraft: '' }); setShowFlightModal({show:true, type:'add', data:null});}} className="bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black">+ ADD</button>
                </div>
                {sortedFlights.map(f => (
                  <div key={f.id} className="bg-white rounded-[40px] shadow-2xl overflow-hidden border border-blue-50 relative p-6 font-black">
                    <div className="flex justify-between mb-4 border-b border-dashed pb-4">
                      <span className="bg-blue-600 text-white px-3 py-1 rounded-lg text-[10px] font-black">{f.airline}</span>
                      <h2 className="text-2xl font-black italic">{f.flightNo}</h2>
                    </div>
                    <div className="flex justify-between text-center items-center">
                      <div><p className="text-3xl font-black">{f.fromCode}</p><p className="text-blue-500 font-mono text-sm">{f.depTime}</p></div>
                      <div className="flex-1 flex flex-col items-center opacity-40"><span className="text-[10px] uppercase font-black">{f.duration}</span><div className="w-full h-px bg-blue-100 my-1 relative"><span className="absolute -top-2 left-1/2 -translate-x-1/2">✈️</span></div><p className="text-[10px] font-black text-black">{f.date}</p></div>
                      <div><p className="text-3xl font-black">{f.toCode}</p><p className="text-blue-600 font-mono text-sm">{f.arrTime}</p></div>
                    </div>
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[9px] text-gray-400 font-black">最後編輯: {getMember(f.lastUpdatedById).name}</span>
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
                <div className="bg-white p-6 rounded-[32px] border-2 border-dashed border-gray-200 text-center shadow-sm">
                  <ImageUploader label="UPLOAD VOUCHER (新增憑證相片)" maxDimension={1200} onUpload={(b64)=>{
                    const title=prompt("請輸入憑證名稱 (例如: 迪士尼門票):"); 
                    if(title){
                      const newDoc: BookingDoc = {
                        id: Date.now(), 
                        type: '憑證', 
                        title: title.trim(), 
                        image: b64, 
                        lastUpdatedById: user.id,
                        status: 'unused'
                      };
                      const n = [newDoc, ...bookings]; 
                      setBookings(n); 
                      sync({bookings:n});
                    }
                  }} />
                </div>

                <div className="flex bg-gray-100 rounded-2xl p-1 font-black">
                  <button 
                    onClick={() => setVoucherSubTab('未使用')} 
                    className={`flex-1 py-2.5 rounded-xl text-xs transition-all font-black ${voucherSubTab === '未使用' ? 'bg-white text-black shadow-sm' : 'text-gray-400'}`}
                  >
                    🎫 未使用 ({bookings.filter(b => (b.status || 'unused') === 'unused').length})
                  </button>
                  <button 
                    onClick={() => setVoucherSubTab('已使用')} 
                    className={`flex-1 py-2.5 rounded-xl text-xs transition-all font-black ${voucherSubTab === '已使用' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-400'}`}
                  >
                    ✅ 已使用 ({bookings.filter(b => b.status === 'used').length})
                  </button>
                </div>

                <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">
                  {voucherSubTab === '未使用' ? 'Unused Vouchers' : 'Used Vouchers'}
                </h3>

                {bookings.filter(b => voucherSubTab === '未使用' ? (b.status || 'unused') === 'unused' : b.status === 'used').length === 0 ? (
                  <div className="text-center py-10 text-gray-400 text-xs bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
                    <p>{voucherSubTab === '未使用' ? '目前沒有未使用的憑證' : '目前沒有已使用的憑證'}</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bookings
                      .filter(b => voucherSubTab === '未使用' ? (b.status || 'unused') === 'unused' : b.status === 'used')
                      .map(b => (
                        <div 
                          key={b.id} 
                          onClick={() => setViewingVoucherDetail(b)}
                          className="bg-white p-4 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between gap-3 cursor-pointer hover:shadow-md active:scale-98 transition-all font-black group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden flex-1">
                            {b.image ? (
                              <img 
                                src={b.image} 
                                className="w-14 h-14 rounded-2xl object-cover shrink-0 border border-gray-100 shadow-xs" 
                                alt={b.title} 
                              />
                            ) : (
                              <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-2xl shrink-0 border border-orange-100">
                                🎫
                              </div>
                            )}
                            <div className="overflow-hidden flex-1">
                              <h4 className="text-sm font-black text-black truncate">{b.title}</h4>
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${b.status === 'used' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {b.status === 'used' ? '已使用' : '未使用'}
                                </span>
                                <span className="text-[9px] text-gray-400 font-mono truncate">
                                  {getMember(b.lastUpdatedById).name}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                            <button 
                              type="button" 
                              onClick={() => setEditingVoucherModal(b)} 
                              className="text-blue-500 text-xs font-black p-1.5 hover:bg-blue-50 rounded-lg"
                              title="編輯憑證"
                            >
                              🖋️
                            </button>
                            <button 
                              type="button" 
                              onClick={() => {if(confirm('確定刪除此憑證？')){const n=bookings.filter(i=>i.id!==b.id); setBookings(n); sync({bookings:n});}}} 
                              className="text-red-400 text-xs font-black p-1.5 hover:bg-red-50 rounded-lg"
                              title="刪除憑證"
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 記帳] --- */}
        {activeTab === '記帳' && (
          <div className="animate-in fade-in pb-20 font-black">
            <div className="flex bg-white rounded-full p-1 mb-6 shadow-sm border border-gray-100 font-black">
              <button onClick={() => setExpenseSubTab('明細')} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${expenseSubTab === '明細' ? 'bg-[#E9C46A] text-white shadow-md scale-105' : 'text-gray-400'}`}>記帳明細</button>
              <button onClick={() => setExpenseSubTab('查帳')} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${expenseSubTab === '查帳' ? 'bg-[#5E9E8E] text-white shadow-md scale-105' : 'text-gray-400'}`}>📊 查帳統計</button>
            </div>

            {expenseSubTab === '明細' ? (
              <>
                <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black">
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-xs text-gray-500">幣別選擇 (自動記憶)</span>
                      <select
                        value={currency}
                        onChange={(e) => {
                          const cur = e.target.value as 'JPY' | 'TWD' | 'CNY';
                          setCurrency(cur);
                          localStorage.setItem('dupi_preferred_currency', cur);
                        }}
                        className="p-2.5 px-4 bg-gray-100 rounded-xl text-xs font-black text-black outline-none border border-gray-200"
                      >
                        <option value="JPY">🇯🇵 日幣 (JPY)</option>
                        <option value="TWD">🇹🇼 台幣 (TWD)</option>
                        <option value="CNY">🇨🇳 人民幣 (CNY)</option>
                      </select>
                    </div>

                    <input value={category} onChange={e=>setCategory(e.target.value)} placeholder="消費內容 (項目)..." className="w-full p-4 bg-gray-50 rounded-2xl mb-2 outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
                    
                    <div className="flex gap-2 overflow-x-auto no-scrollbar mb-3">
                      {['早餐','午餐','晚餐','宵夜','交通','娛樂','購物','其他'].map(q=>(
                        <button key={q} onClick={()=>setCategory(q)} className="bg-gray-100 px-3 py-1 rounded-full text-[10px] text-gray-600 font-black shrink-0 active:bg-gray-200">{q}</button>
                      ))}
                    </div>
                    
                    <input value={expenseNote} onChange={e=>setExpenseNote(e.target.value)} placeholder="備註說明 (選填)..." className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-xs outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
                    
                    <input 
                      type="number" 
                      min="0"
                      value={amount} 
                      onChange={e => {
                        const val = e.target.value.replace('-', '');
                        setAmount(val);
                      }} 
                      placeholder={`金額 (${currency}) - 請輸入正數金額`} 
                      className="w-full p-4 bg-gray-50 rounded-2xl outline-none text-[#5E9E8E] font-black text-lg border border-gray-200 mb-4 placeholder:text-gray-400" 
                    />
                    
                    {/* 付款方式 */}
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-[10px] text-gray-500 ml-2 font-black">PAY METHOD (付款方式 - 必填)</p>
                      {!payMethod && <span className="text-[9px] text-rose-500 font-bold">請點選一種付款方式</span>}
                    </div>
                    <div className="grid grid-cols-5 gap-1.5 mb-2">
                      {['現金','信用卡','Suica','PayPay','其他'].map(p=>(
                        <button 
                          key={p} 
                          type="button"
                          onClick={()=>{
                            setPayMethod(p);
                            if (p !== '其他') setOtherPayMethodNote('');
                          }} 
                          className={`py-2 rounded-xl text-[10px] font-black transition-all ${payMethod===p?'bg-[#5E9E8E] text-white shadow-md scale-105':'bg-gray-100 text-gray-500'}`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>

                    {payMethod === '其他' && (
                      <div className="mb-4 animate-in slide-in-from-top-2 duration-150">
                        <input
                          type="text"
                          value={otherPayMethodNote}
                          onChange={(e) => setOtherPayMethodNote(e.target.value)}
                          placeholder="請說明付款方式 (例如: 街口支付、LINE Pay、轉帳)..."
                          className="w-full p-3 bg-emerald-50/60 rounded-xl text-xs outline-none font-black text-black placeholder:text-gray-400 border border-emerald-200"
                        />
                      </div>
                    )}

                    <p className="text-[10px] text-gray-500 mb-2 ml-2 font-black">PAYER (先付款人)</p>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m=>(
                        <button 
                          key={m.id} 
                          type="button"
                          onClick={()=>setExpensePayerId(m.id)} 
                          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all shrink-0 whitespace-nowrap ${expensePayerId===m.id?'bg-blue-500 text-white shadow-md':'bg-gray-100 text-gray-500'}`}
                        >
                          <img src={m.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" />
                          <span>{m.name}</span>
                        </button>
                      ))}
                    </div>

                    {/* 代墊與分帳雙並排按鈕區塊 */}
                    <div className="grid grid-cols-2 gap-3 mb-6 font-black">
                      <button
                        type="button"
                        onClick={handleOpenAdvanceModal}
                        className={`p-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all border font-black active:scale-98 truncate ${
                          isAdvanceConfigured
                            ? 'bg-amber-500 text-white border-amber-600 shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <span className="text-base shrink-0">🤝</span>
                        <span className="text-xs truncate">
                          {isAdvanceConfigured
                            ? advanceTargetType === 'member'
                              ? `代墊：${getMember(advanceMemberId).name}`
                              : `代墊：${advanceOtherPerson}`
                            : '幫人代墊'}
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handleOpenSplitModal}
                        className={`p-3.5 rounded-2xl flex items-center justify-center gap-1.5 transition-all border font-black active:scale-98 truncate ${
                          isSplitConfigured
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-md'
                            : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border-gray-200'
                        }`}
                      >
                        <span className="text-base shrink-0">📊</span>
                        <span className="text-xs truncate">
                          {isSplitConfigured
                            ? `分帳：${splitMemberIds.length}人均分`
                            : '多人分帳'}
                        </span>
                      </button>
                    </div>

                    <button onClick={()=>{
                        if(!category.trim()) return alert("請輸入消費內容！");
                        if(!amount || Number(amount) <= 0) return alert("金額必須大於 0，不能為負數或空白！");
                        if(!payMethod) return alert("❌ 請選擇付款方式！");
                        if(!expensePayerId) return alert("請選擇付款人！");

                        const twdVal = (Number(amount) * exchangeRates[currency]).toFixed(0);
                        const autoTimestamp = getNowTimestampString();

                        const finalPayMethod = payMethod === '其他' && otherPayMethodNote.trim()
                          ? `其他 (${otherPayMethodNote.trim()})`
                          : payMethod;

                        const rec: ExpenseRecord = {
                          isSplitSettled: false,
                          id: Date.now(), 
                          category: category.trim(), 
                          amount, 
                          currency, 
                          twdAmount: twdVal, 
                          payMethod: finalPayMethod, 
                          payerId: expensePayerId, 
                          date: autoTimestamp,
                          note: expenseNote.trim(),
                          lastUpdatedById: user.id,
                          isAdvance: isAdvanceConfigured,
                          isSplit: isSplitConfigured,
                          splitMemberIds: isSplitConfigured ? splitMemberIds : undefined,
                          splitSettledMemberIds: [], // 預設無人個別結清
                          advanceTargetType: isAdvanceConfigured ? advanceTargetType : undefined,
                          advanceMemberId: isAdvanceConfigured && advanceTargetType === 'member' ? advanceMemberId : undefined,
                          advanceOtherPerson: isAdvanceConfigured && advanceTargetType === 'other' ? advanceOtherPerson : undefined,
                          advanceOtherNote: isAdvanceConfigured && advanceTargetType === 'other' ? advanceOtherNote : undefined,
                          isSettled: false,
                          originalPayerId: expensePayerId
                        };
                        const n = [rec, ...records]; 
                        setRecords(n); 
                        sync({records:n}); 
                        
                        alert("✅ 記帳成功！");
                        setAmount(''); 
                        setCategory(''); 
                        setExpenseNote('');
                        setPayMethod('');
                        setOtherPayMethodNote('');
                        setIsAdvanceConfigured(false);
                        setIsSplitConfigured(false);
                    }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg uppercase italic active:scale-95 transition-transform">SAVE EXPENSE</button>
                </div>

                {/* 🤝 代墊款項明細專區 */}
                <div className="space-y-3 font-black">
                    <div className="flex justify-between items-center px-1 mb-1">
                      <span className="text-xs text-[#5E9E8E] uppercase tracking-wider">🤝 代墊款項明細專區</span>
                      <span className="text-[10px] text-gray-400">日常消費請至上方「查帳統計」</span>
                    </div>

                    {records.filter(r => r.isAdvance).length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl text-center text-xs text-gray-400 border border-gray-100 shadow-sm">
                        目前尚無代墊紀錄，一般日常消費請切換至上方「📊 查帳統計」查看！
                      </div>
                    ) : (
                      records.filter(r => r.isAdvance).map(r => {
                        const isSettledOther = r.isAdvance && r.advanceTargetType === 'other' && r.isSettled;
                        const canOperateAdvance = (user.id === (r.originalPayerId || r.payerId)) || isWayne;

                        return (
                          <div key={r.id} className={`bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100 pr-12 relative group ${isSettledOther ? 'opacity-60 bg-gray-50' : ''}`}>
                              <div className="flex items-center gap-3">
                                  <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full shadow-sm object-cover" />
                                  <div className="text-xs font-black">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`${isSettledOther ? 'line-through text-gray-500' : ''}`}>{r.category}</span>
                                      <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-mono">{r.date}</span>
                                      
                                      {r.isSettled ? (
                                        <span className="text-[8px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                                          ✓ 已結清 {r.advanceTargetType === 'member' ? `(轉為 ${getMember(r.advanceMemberId).name} 支出)` : `(已收訖)`}
                                        </span>
                                      ) : (
                                        <span className="text-[8px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">
                                          ⏳ 待結清 {r.advanceTargetType === 'member' ? `(代墊給 ${getMember(r.advanceMemberId).name})` : `(代墊給 ${r.advanceOtherPerson || '其他人'}${r.advanceOtherNote ? ` - ${r.advanceOtherNote}` : ''})`}
                                        </span>
                                      )}
                                    </div>

                                    {r.note && <p className="text-[10px] text-gray-600 font-normal mt-0.5">💬 {r.note}</p>}
                                    <p className="text-[8px] text-gray-400 font-mono italic mt-0.5">
                                      {r.payMethod} · {getMember(r.payerId).name} (最後編輯: {getMember(r.lastUpdatedById).name})
                                    </p>

                                    <div className="mt-2.5">
                                      {canOperateAdvance ? (
                                        !r.isSettled ? (
                                          <button
                                            type="button"
                                            onClick={() => handleSettleAdvance(r.id)}
                                            className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-4 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                          >
                                            ✓ 點擊標記為已結清
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            onClick={() => handleUnsettleAdvance(r.id)}
                                            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 border border-gray-300 font-black px-4 py-2 rounded-xl flex items-center gap-1.5 active:scale-95 transition-all"
                                          >
                                            ↺ 取消結清 (退回未結清)
                                          </button>
                                        )
                                      ) : (
                                        <span className="text-[10px] text-gray-400 italic">
                                          {r.isSettled ? '✓ 款項已由付款人結清' : `⏳ 需由代墊人 ${getMember(r.originalPayerId || r.payerId).name} 確認結清`}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                              </div>
                              <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">
                                <span className={`${isSettledOther ? 'line-through text-gray-400' : ''}`}>{r.amount} {r.currency || 'JPY'}</span>
                                <p className="text-[9px] text-gray-400 font-black">≈ NT$ {r.twdAmount}</p>
                                {isSettledOther && <p className="text-[8px] text-gray-400 font-normal">(已收回不計預算)</p>}
                              </div>
                              <div className="absolute right-4 flex flex-col gap-2">
                                <button onClick={()=>setEditingExpenseModal(r)} className="text-blue-400 text-[10px] hover:underline">🖋️</button>
                                <button onClick={()=>{if(confirm('確定刪除此記帳記錄？')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="text-red-400 text-sm">✕</button>
                              </div>
                          </div>
                        );
                      })
                    )}
                </div>

                {/* 📊 多人分帳結清明細專區 */}
                <div className="space-y-3 font-black mt-6">
                    <div className="flex justify-between items-center px-1 mb-1">
                      <span className="text-xs text-emerald-700 uppercase tracking-wider">📊 多人分帳結清明細專區</span>
                      <span className="text-[10px] text-gray-400">支援點選彈窗個別標記成員結清</span>
                    </div>

                    {records.filter(r => r.isSplit).length === 0 ? (
                      <div className="bg-white p-6 rounded-2xl text-center text-xs text-gray-400 border border-gray-100 shadow-sm">
                        目前尚無多人分帳紀錄！
                      </div>
                    ) : (
                      records.filter(r => r.isSplit).map(r => {
                        const targetSplitIds = r.splitMemberIds && r.splitMemberIds.length > 0 ? r.splitMemberIds : currentMemberIds;
                        const settledIds = r.splitSettledMemberIds || [];
                        // 扣除付款人自己，其他人需要給錢
                        const debtors = targetSplitIds.filter(id => id !== r.payerId);
                        const unsettledCount = debtors.filter(id => !settledIds.includes(id)).length;
                        const isAllSettled = r.isSplitSettled || (debtors.length > 0 && unsettledCount === 0);

                        return (
                          <div key={r.id} className="bg-white p-5 rounded-2xl flex justify-between items-center shadow-sm border border-gray-100 pr-16 relative group">
                              <div className="flex items-center gap-3">
                                  <img src={getMember(r.payerId).avatar} className="w-6 h-6 rounded-full shadow-sm object-cover" />
                                  <div className="text-xs font-black">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span>{r.category}</span>
                                      <span className="text-[9px] bg-gray-100 px-2 py-0.5 rounded-full text-gray-500 font-mono">{r.date}</span>
                                      
                                      <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${isAllSettled ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                        {isAllSettled ? '✅ 全員已結清' : `⏳ 尚有 ${unsettledCount} 人未結清`}
                                      </span>
                                    </div>

                                    {r.note && <p className="text-[10px] text-gray-600 font-normal mt-0.5">💬 {r.note}</p>}
                                    <p className="text-[8px] text-gray-400 font-mono italic mt-0.5">
                                      {r.payMethod} · 付款人: {getMember(r.payerId).name} (共 {targetSplitIds.length} 人分攤)
                                    </p>

                                    {/* 點擊開啟單人獨立結清管理彈窗 */}
                                    <div className="mt-2.5">
                                      {!isAllSettled ? (
                                        <button
                                          type="button"
                                          onClick={() => setManagingSplitRecord(r)}
                                          className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                        >
                                          <span>⏳ 尚有 {unsettledCount} 人未付清（點擊查看）</span>
                                        </button>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => setManagingSplitRecord(r)}
                                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                                        >
                                          <span>✅ 全員已結清（點擊查看明細）</span>
                                        </button>
                                      )}
                                    </div>
                                  </div>
                              </div>
                              <div className="text-right text-[#5E9E8E] font-mono tracking-tighter font-black">
                                <span>{r.amount} {r.currency || 'JPY'}</span>
                                <p className="text-[9px] text-gray-400 font-black">≈ NT$ {r.twdAmount}</p>
                              </div>
                              <div className="absolute right-4 flex flex-col gap-2">
                                <button onClick={()=>setEditingExpenseModal(r)} className="text-blue-400 text-[10px] hover:underline">🖋️</button>
                                <button onClick={()=>{if(confirm('確定刪除此記帳記錄？')){const n=records.filter(i=>i.id!==r.id); setRecords(n); sync({records:n});}}} className="text-red-400 text-sm">✕</button>
                              </div>
                          </div>
                        );
                      })
                    )}
                </div>
              </>

            ) : (
              <div className="space-y-6">
                <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100">
                  <div className="mb-4">
                    <h4 className="text-xs text-[#5E9E8E] uppercase tracking-wider mb-2">👥 選擇成員查帳 (複選可看多人對比)</h4>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setFilterPayerIds([])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filterPayerIds.length === 0 ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
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
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${isSel ? 'bg-[#5E9E8E] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                          >
                            <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" />
                            {m.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="mb-6 pt-3 border-t border-gray-100">
                    <h4 className="text-xs text-[#5E9E8E] uppercase tracking-wider mb-2">📅 行程日期篩選 (可單選或多選)</h4>
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => setFilterDates([])}
                        className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${filterDates.length === 0 ? 'bg-[#E9C46A] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                      >
                        全部日期
                      </button>
                      {dynamicTripDates.map(dStr => {
                        const pureD = dStr.split(' ')[0];
                        const isDateSel = filterDates.includes(pureD);
                        return (
                          <button
                            key={dStr}
                            onClick={() => {
                              const next = isDateSel ? filterDates.filter(d => d !== pureD) : [...filterDates, pureD];
                              setFilterDates(next);
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-black font-mono transition-all ${isDateSel ? 'bg-[#E9C46A] text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {dStr}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="bg-[#5E9E8E]/10 p-5 rounded-2xl border border-[#5E9E8E]/20 mb-6 text-center">
                    <p className="text-xs opacity-70 uppercase font-black">篩選統計總額 (折合台幣)</p>
                    <h3 className="text-3xl font-mono mt-1 text-[#5E9E8E]">NT$ {expenseStats.totalTwd.toLocaleString()}</h3>
                    <p className="text-[10px] text-gray-500 mt-1 font-black">
                      共 {filteredRecords.length} 筆明細 (已扣除已結清外部代墊款)
                    </p>
                  </div>

                  <div className="mb-6 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                    {filterPayerIds.length >= 2 ? (
                      <div>
                        <p className="text-xs text-gray-600 font-black mb-3">📊 多人花費對比長條圖</p>
                        <div className="space-y-3">
                          {filterPayerIds.map(mId => {
                            const barData = expenseStats.memberBars.find(b => b.mId === mId) || { val: 0, pct: 0, barWidthPct: 0 };
                            const member = getMember(mId);

                            return (
                              <div key={mId} className="space-y-1">
                                <div className="flex justify-between items-center text-xs">
                                  <div className="flex items-center gap-1.5">
                                    <img src={member.avatar} className="w-4 h-4 rounded-full object-cover" />
                                    <span>{member.name}</span>
                                  </div>
                                  <span className="font-mono text-gray-700">
                                    NT$ {barData.val.toLocaleString()} ({barData.pct}%)
                                  </span>
                                </div>
                                <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                                  <div 
                                    className="bg-[#5E9E8E] h-full rounded-full transition-all duration-500" 
                                    style={{ width: `${barData.barWidthPct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs text-gray-600 font-black mb-3">🍰 各分類支出佔比 (圓餅圖)</p>
                        {expenseStats.totalTwd > 0 ? (
                          <div className="flex flex-col sm:flex-row items-center justify-around gap-4">
                            <svg className="w-36 h-36 -rotate-90" viewBox="0 0 36 36">
                              {expenseStats.slices.map((slice, i) => {
                                const strokeDasharray = `${slice.pct} ${100 - slice.pct}`;
                                const strokeDashoffset = 100 - (slice.startAngle / 3.6);
                                return (
                                  <circle
                                    key={i}
                                    cx="18"
                                    cy="18"
                                    r="15.915"
                                    fill="transparent"
                                    stroke={slice.color}
                                    strokeWidth="4"
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                  />
                                );
                              })}
                            </svg>
                            <div className="flex flex-col gap-1.5 w-full sm:w-auto">
                              {expenseStats.slices.map((s, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-3 text-[11px]">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }}></span>
                                    <span>{s.cat}</span>
                                  </div>
                                  <span className="font-mono text-gray-600 font-bold">NT$ {s.val.toLocaleString()} ({s.pct}%)</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-400 text-center py-4">所選條件下無支出數據</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs text-gray-500 uppercase tracking-wider ml-1">📅 依行程日期分類檢視</h4>
                  {Object.keys(expenseStats.dateGroups).length === 0 && (
                    <div className="bg-white p-6 rounded-2xl text-center text-xs text-gray-400">目前沒有符合條件的明細</div>
                  )}
                  {Object.entries(expenseStats.dateGroups).map(([dateName, groupList]) => {
                    const groupTotalTwd = groupList.reduce((sum, item) => {
                      const isSettledOther = item.isAdvance && item.advanceTargetType === 'other' && item.isSettled;
                      return isSettledOther ? sum : sum + Number(item.twdAmount || 0);
                    }, 0);

                    return (
                      <div key={dateName} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
                        <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-50">
                          <span className="text-xs bg-[#5E9E8E]/10 text-[#5E9E8E] px-2.5 py-1 rounded-xl font-black">
                            {dateName}
                          </span>
                          <span className="text-xs font-mono text-gray-500 font-black">小計: NT$ {groupTotalTwd.toLocaleString()}</span>
                        </div>
                        <div className="space-y-2">
                          {groupList.map(r => {
                            const isSettledOther = r.isAdvance && r.advanceTargetType === 'other' && r.isSettled;

                            return (
                              <div key={r.id} className={`flex justify-between items-center text-xs py-1.5 border-b border-dashed border-gray-100 last:border-b-0 ${isSettledOther ? 'opacity-50 line-through' : ''}`}>
                                <div>
                                  <span className="font-black text-black">{r.category}</span>
                                  <span className="text-[10px] text-gray-400 ml-2">({getMember(r.payerId).name} · {r.payMethod})</span>
                                  {r.isAdvance && (
                                    <span className="text-[9px] text-amber-600 block">
                                      {r.isSettled ? '✓ 已結清代墊' : '⏳ 待結清代墊'}
                                    </span>
                                  )}
                                  {r.note && <span className="text-[10px] text-gray-500 block">💬 {r.note}</span>}
                                </div>
                                <div className="text-right font-mono text-[#5E9E8E]">
                                  <span>{r.amount} {r.currency}</span>
                                  <span className="text-[9px] text-gray-400 block font-normal">≈ NT$ {r.twdAmount}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 日誌] --- */}
        {activeTab === '日誌' && (
          <div className="animate-in fade-in space-y-6 pb-20">
            <div className="bg-white p-6 rounded-[32px] shadow-xl border border-orange-50 font-black">
                <textarea 
                  value={newJournalContent} 
                  onChange={e=>setNewJournalContent(e.target.value)} 
                  placeholder="記錄此刻的心情..." 
                  className="w-full bg-gray-50 p-4 rounded-2xl mb-3 outline-none min-h-[100px] font-black text-black placeholder:text-gray-400 border border-gray-200" 
                />

                {newJournalImages.length > 0 && (
                  <div className="flex gap-2 flex-wrap mb-3">
                    {newJournalImages.map((img, idx) => (
                      <div key={idx} className="relative w-16 h-16 rounded-2xl overflow-hidden border-2 border-[#5E9E8E]">
                        <img src={img} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewJournalImages(newJournalImages.filter((_, i) => i !== idx))}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center font-black shadow-md"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {newJournalVideo && (
                  <div className="relative mb-3 inline-block">
                    <video src={newJournalVideo} className="w-36 h-24 rounded-2xl object-cover border-2 border-[#E9C46A]" controls />
                    <button
                      type="button"
                      onClick={() => setNewJournalVideo('')}
                      className="absolute -top-2 -right-2 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center font-black shadow-md"
                    >
                      ✕
                    </button>
                    <span className="text-[9px] text-gray-400 block mt-1">15 秒短影片已就緒</span>
                  </div>
                )}

                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <ImageUploader 
                        label={`相片上傳 (${newJournalImages.length}/5)`} 
                        maxDimension={1200} 
                        onUpload={img => {
                          if (newJournalImages.length >= 5) return alert("每則日誌最多上傳 5 張相片！");
                          setNewJournalImages([...newJournalImages, img]);
                        }} 
                      />

                      <label className="text-[10px] bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl font-black text-black cursor-pointer shadow-sm active:scale-95 transition-all">
                        🎬 上傳短影片 (15s)
                        <input
                          type="file"
                          accept="video/*"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            try {
                              const b64 = await compressVideoFile(file, 15);
                              setNewJournalVideo(b64);
                            } catch (err) {}
                            e.target.value = '';
                          }}
                        />
                      </label>
                    </div>

                    <button onClick={()=>{
                        if(!newJournalContent.trim() && newJournalImages.length === 0 && !newJournalVideo) return alert("請輸入日誌內容或上傳多媒體！");
                        const n: JournalEntry[] = [{
                          id: Date.now(), 
                          authorId: user.id, 
                          content: newJournalContent.trim(), 
                          image: newJournalImages[0] || '',
                          images: newJournalImages,
                          video: newJournalVideo,
                          date: new Date().toLocaleString(), 
                          lastUpdatedById: user.id,
                          likes: [],
                          comments: []
                        }, ...journals];
                        setJournals(n); 
                        sync({journals:n}); 
                        setNewJournalContent(''); 
                        setNewJournalImages([]); 
                        setNewJournalVideo('');
                    }} className="bg-[#86A760] text-white px-8 py-3 rounded-2xl shadow-lg italic font-black active:scale-95 transition-transform">Share</button>
                </div>
            </div>

            <div className="space-y-6">
              {journals.map(j => {
                const likes = j.likes || [];
                const comments = j.comments || [];
                const hasLiked = likes.includes(user.id);
                const isCommentsOpen = !!expandedComments[j.id];

                const allPhotos = j.images && j.images.length > 0 ? j.images : (j.image ? [j.image] : []);
                const rootComments = comments.filter(c => !c.replyToCommentId);
                const getReplies = (parentId: number) => comments.filter(c => c.replyToCommentId === parentId);

                return (
                  <div key={j.id} className="bg-white p-6 rounded-[32px] shadow-md border border-gray-100 animate-in slide-in-from-bottom-2 relative font-black">
                      <div className="absolute top-6 right-6 flex gap-3">
                        {(j.authorId === user.id || isWayne) && (
                          <>
                            <button onClick={()=>setEditingJournalModal(j)} className="text-blue-400 text-xs hover:underline">🖋️</button>
                            <button onClick={()=>{if(confirm('確定刪除此日誌？')){const n=journals.filter(i=>i.id!==j.id); setJournals(n); sync({journals:n});}}} className="text-red-300 text-xs">🗑️</button>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-4">
                          <img src={getMember(j.authorId).avatar} className="w-10 h-10 rounded-full border border-gray-100 object-cover" />
                          <div>
                            <p className="text-sm font-black text-black">{getMember(j.authorId).name}</p>
                            <p className="text-[9px] text-gray-400 italic font-mono uppercase tracking-widest">{j.date} · 最後編輯: {getMember(j.lastUpdatedById).name}</p>
                          </div>
                      </div>

                      <p className="text-sm mb-4 leading-relaxed font-black text-gray-800 whitespace-pre-wrap">{j.content}</p>
                      
                      {allPhotos.length > 0 && (
                        <div className="relative mb-4">
                          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2 pt-1">
                            {allPhotos.map((photoSrc, pIdx) => (
                              <div 
                                key={pIdx} 
                                className="min-w-[85%] max-w-[85%] sm:min-w-[70%] snap-center shrink-0 max-h-[500px] overflow-y-auto bg-gray-50 rounded-[24px] p-2 border border-gray-100 relative group"
                              >
                                <div
                                  onClick={() => setLightboxImg(photoSrc)}
                                  className="w-full flex justify-center cursor-pointer hover:opacity-95 transition-opacity"
                                  title="點擊放大圖片"
                                >
                                  <img 
                                    src={photoSrc} 
                                    className="w-full object-contain rounded-[20px] shadow-sm max-h-[480px]" 
                                    alt={`visual ${pIdx + 1}`}
                                  />
                                </div>
                                <span className="absolute bottom-3 right-3 bg-black/60 text-white text-[9px] px-2 py-0.5 rounded-full font-mono font-black">
                                  {pIdx + 1} / {allPhotos.length}
                                </span>
                              </div>
                            ))}
                          </div>
                          {allPhotos.length > 1 && (
                            <p className="text-[9px] text-gray-400 text-center font-black mt-1">⟵ 左右滑動檢視更多相片 ⟶</p>
                          )}
                        </div>
                      )}

                      {j.video && (
                        <div className="w-full rounded-[24px] overflow-hidden bg-black mb-4 flex justify-center max-h-[400px]">
                          <video src={j.video} controls className="max-w-full max-h-[400px] object-contain" />
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => handleToggleLike(j.id)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all active:scale-90 ${hasLiked ? 'bg-rose-50 text-rose-500' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          <span className="text-sm">{hasLiked ? '❤️' : '🤍'}</span>
                          <span>{likes.length > 0 ? likes.length : '讚'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setExpandedComments({ ...expandedComments, [j.id]: !isCommentsOpen })}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black transition-all ${isCommentsOpen ? 'bg-[#5E9E8E] text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                        >
                          <span className="text-sm">💬</span>
                          <span>{comments.length > 0 ? `${comments.length} 則留言` : '留言'}</span>
                        </button>
                      </div>

                      {isCommentsOpen && (
                        <div className="mt-4 pt-3 border-t border-dashed border-gray-200 space-y-3 animate-in fade-in">
                          {rootComments.length === 0 ? (
                            <p className="text-[10px] text-gray-400 italic py-1">目前尚無留言，來留第一則吧～</p>
                          ) : (
                            <div className="space-y-3">
                              {rootComments.map(c => {
                                const cAuthor = getMember(c.authorId);
                                const canDeleteComment = c.authorId === user.id || isWayne;
                                const cLikes = c.likes || [];
                                const hasCLiked = cLikes.includes(user.id);
                                const isReplying = replyingCommentIds[j.id] === c.id;
                                const replies = getReplies(c.id);

                                return (
                                  <div key={c.id} className="bg-gray-50 p-4 rounded-3xl border border-gray-100 space-y-3">
                                    <div className="flex items-start gap-2.5">
                                      <img src={cAuthor.avatar} className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5" />
                                      <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-black text-black">{cAuthor.name}</span>
                                          <span className="text-[9px] text-gray-400 font-mono">{c.date}</span>
                                        </div>
                                        <p className="text-xs text-gray-800 mt-1 leading-relaxed font-normal">{c.content}</p>
                                        
                                        <div className="flex items-center gap-3 mt-2">
                                          <button
                                            type="button"
                                            onClick={() => handleToggleCommentLike(j.id, c.id)}
                                            className={`text-[10px] font-black flex items-center gap-1 ${hasCLiked ? 'text-rose-500' : 'text-gray-400'}`}
                                          >
                                            <span>{hasCLiked ? '❤️' : '🤍'}</span>
                                            <span>{cLikes.length > 0 ? cLikes.length : '讚'}</span>
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setReplyingCommentIds({ ...replyingCommentIds, [j.id]: isReplying ? null : c.id })}
                                            className="text-[10px] text-[#5E9E8E] font-black hover:underline"
                                          >
                                            {isReplying ? '取消回覆' : '回覆'}
                                          </button>
                                        </div>
                                      </div>
                                      {canDeleteComment && (
                                        <button
                                          type="button"
                                          onClick={() => handleDeleteComment(j.id, c.id)}
                                          className="text-[10px] text-gray-400 hover:text-red-500 ml-1 font-black"
                                          title="刪除留言"
                                        >
                                          ✕
                                        </button>
                                      )}
                                    </div>

                                    {replies.length > 0 && (
                                      <div className="pl-6 border-l-2 border-[#5E9E8E]/30 space-y-2 mt-2">
                                        {replies.map(rep => {
                                          const repAuthor = getMember(rep.authorId);
                                          const canDeleteReply = rep.authorId === user.id || isWayne;
                                          const repLikes = rep.likes || [];
                                          const hasRepLiked = repLikes.includes(user.id);

                                          return (
                                            <div key={rep.id} className="bg-white/80 p-2.5 rounded-2xl border border-gray-100 flex items-start gap-2">
                                              <img src={repAuthor.avatar} className="w-5 h-5 rounded-full object-cover shrink-0 mt-0.5" />
                                              <div className="flex-1">
                                                <div className="flex items-center justify-between">
                                                  <span className="text-[10px] font-black text-black">{repAuthor.name}</span>
                                                  <span className="text-[8px] text-gray-400 font-mono">{rep.date}</span>
                                                </div>
                                                <p className="text-[11px] text-gray-800 mt-0.5 leading-relaxed font-normal">{rep.content}</p>
                                                <div className="mt-1">
                                                  <button
                                                    type="button"
                                                    onClick={() => handleToggleCommentLike(j.id, rep.id)}
                                                    className={`text-[9px] font-black flex items-center gap-1 ${hasRepLiked ? 'text-rose-500' : 'text-gray-400'}`}
                                                  >
                                                    <span>{hasRepLiked ? '❤️' : '🤍'}</span>
                                                    <span>{repLikes.length > 0 ? repLikes.length : '讚'}</span>
                                                  </button>
                                                </div>
                                              </div>
                                              {canDeleteReply && (
                                                <button
                                                  type="button"
                                                  onClick={() => handleDeleteComment(j.id, rep.id)}
                                                  className="text-[9px] text-gray-300 hover:text-red-500 font-black"
                                                >
                                                  ✕
                                                </button>
                                              )}
                                            </div>
                                          );
                                        })}
                                      </div>
                                    )}

                                    {isReplying && (
                                      <div className="flex gap-2 pl-6 pt-2">
                                        <input
                                          type="text"
                                          value={replyInputs[c.id] || ''}
                                          onChange={(e) => setReplyInputs({ ...replyInputs, [c.id]: e.target.value })}
                                          placeholder={`回覆 @${cAuthor.name}...`}
                                          className="flex-1 p-2 px-3 bg-white rounded-xl text-xs outline-none border border-gray-200 font-black text-black"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => handleAddComment(j.id, c.id)}
                                          className="px-3.5 py-1.5 bg-[#5E9E8E] text-white rounded-xl text-[10px] font-black"
                                        >
                                          送出
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className="flex gap-2 items-center pt-2">
                            <input
                              type="text"
                              value={commentInputs[j.id] || ''}
                              onChange={(e) => setCommentInputs({ ...commentInputs, [j.id]: e.target.value })}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleAddComment(j.id);
                                }
                              }}
                              placeholder="發表公開留言..."
                              className="flex-1 p-2.5 px-4 bg-gray-50 rounded-2xl text-xs outline-none font-black text-black placeholder:text-gray-400 border border-gray-200"
                            />
                            <button
                              type="button"
                              onClick={() => handleAddComment(j.id)}
                              className="px-4 py-2.5 bg-[#5E9E8E] text-white rounded-2xl text-xs font-black shadow-sm active:scale-95 transition-transform"
                            >
                              送出
                            </button>
                          </div>
                        </div>
                      )}
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
                    <button key={t} onClick={()=>setPrepSubTab(t)} className={`flex-1 py-3 rounded-full text-xs transition-all uppercase italic font-black ${prepSubTab===t?'bg-[#86A760] text-white shadow-md scale-105':'text-gray-400'}`}>{t}</button>
                ))}
            </div>

            {/* 「待辦」與「採購」保留常規自訂新增面板 */}
            {prepSubTab !== '行李' && (
              <div className="bg-white rounded-[32px] p-6 shadow-sm border border-orange-50 mb-8 font-black">
                  <input value={newTodoInput.task} onChange={e=>setNewTodoInput({...newTodoInput, task:e.target.value})} placeholder={`新增事項 (${prepSubTab})...`} className="w-full p-4 bg-gray-50 rounded-2xl mb-3 outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
                  <textarea 
                   rows={3}
                   value={newTodoInput.note} 
                   onChange={e=>setNewTodoInput({...newTodoInput, note: e.target.value})} 
                   placeholder={`備註或詳細說明 (選填，支援換行)...`} 
                   className="w-full p-3 bg-gray-50 rounded-xl mb-3 text-xs outline-none font-black text-black placeholder:text-gray-400 border border-gray-200 leading-relaxed resize-none" 
                   />

                  {/* 採購項目專屬：上傳商品參考照片 */}
                  {prepSubTab === '採購' && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-2xl border border-gray-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {newTodoInput.image ? (
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-emerald-300">
                            <img src={newTodoInput.image} className="w-full h-full object-cover" />
                            <button
                              type="button"
                              onClick={() => setNewTodoInput({ ...newTodoInput, image: '' })}
                              className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-black"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-gray-200 flex items-center justify-center text-xl text-gray-400">
                            🛍️
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-black text-black">商品參考相片 (選填)</p>
                          <p className="text-[9px] text-gray-400 font-normal">方便買東西時對照包裝或款式</p>
                        </div>
                      </div>
                      <ImageUploader 
                        label={newTodoInput.image ? "更換相片" : "上傳相片"} 
                        maxDimension={1000} 
                        onUpload={(b64) => setNewTodoInput({ ...newTodoInput, image: b64 })} 
                      />
                    </div>
                  )}
                  
                  <p className="text-[10px] text-gray-500 mb-2 ml-1 font-black">指派人員 (預選自己，可點選切換或複選)</p>
                  <div className="flex flex-wrap gap-2 mb-6">
                      {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m=>(
                          <button 
                            key={m.id} 
                            type="button"
                            onClick={()=>{
                              const ids = newTodoInput.assigneeIds.includes(m.id) ? newTodoInput.assigneeIds.filter(i=>i!==m.id) : [...newTodoInput.assigneeIds, m.id];
                              setNewTodoInput({...newTodoInput, assigneeIds: ids});
                            }} 
                            className={`p-2 px-3.5 rounded-xl border text-[10px] font-black transition-all flex items-center gap-1.5 shrink-0 whitespace-nowrap ${newTodoInput.assigneeIds.includes(m.id)?'bg-green-700 text-white shadow-sm':'bg-gray-100 text-gray-500 border-gray-200'}`}
                          >
                            <img src={m.avatar} className="w-4 h-4 rounded-full object-cover shrink-0" />
                            <span>{m.name}</span>
                          </button>
                      ))}
                  </div>
                  <button onClick={()=>{
                      if(!newTodoInput.task.trim()) return alert("請輸入事項名稱！");
                      if(newTodoInput.assigneeIds.length === 0) return alert("請至少選擇一位指派人員！");

                      const newItem: TodoItem = { 
                        id: Date.now(), 
                        task: newTodoInput.task.trim(), 
                        note: newTodoInput.note.trim(), 
                        image: newTodoInput.image || undefined,
                        assigneeIds: newTodoInput.assigneeIds, 
                        completedAssigneeIds: [], 
                        category: prepSubTab, 
                        lastUpdatedById: user.id 
                      };
                      const n = [newItem, ...todos];
                      setTodos(n); sync({todos:n}); setNewTodoInput({task:'', note:'', image:'', assigneeIds:[user.id]});
                  }} className="w-full py-4 bg-[#86A760] text-white rounded-2xl font-black shadow-lg italic">ADD ITEM</button>
              </div>
            )}
            {/* 行李清單專屬：分類摺疊清單介面（高密度、可收合、好勾選） */}
            {prepSubTab === '行李' ? (
              <div className="space-y-4">
                {DEFAULT_PACKING_CATEGORIES.map(catGroup => {
                  const catItems = todos.filter(t => t.category === '行李' && (t.note || '生活日用') === catGroup.category);
                  const myCompletedCount = catItems.filter(t => t.completedAssigneeIds.includes(user.id)).length;
                  const isCollapsed = !!collapsedPackingCats[catGroup.category];

                  return (
                    <div key={catGroup.category} className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100 font-black">
                      {/* 分類標題列（點擊可展開/收合） */}
                      <div 
                        onClick={() => setCollapsedPackingCats(prev => ({ ...prev, [catGroup.category]: !prev[catGroup.category] }))}
                        className="flex justify-between items-center cursor-pointer select-none pb-2 border-b border-gray-50"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xl p-2 bg-[#F9F8F3] rounded-2xl border border-gray-100">{catGroup.icon}</span>
                          <div>
                            <h4 className="text-sm font-black text-black">{catGroup.category}</h4>
                            <span className="text-[10px] text-gray-400 font-mono">
                              已備妥 ({myCompletedCount}/{catItems.length})
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-black ${myCompletedCount === catItems.length && catItems.length > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-500'}`}>
                            {myCompletedCount === catItems.length && catItems.length > 0 ? '✅ 全數就緒' : '整理中'}
                          </span>
                          <span className="text-gray-400 text-sm">{isCollapsed ? '▼' : '▲'}</span>
                        </div>
                      </div>

                      {/* 展開後的項目清單 */}
                      {!isCollapsed && (
                        <div className="mt-3 space-y-2">
                          {catItems.length === 0 && (
                            <p className="text-xs text-gray-300 text-center py-3">此分類尚無清單項目</p>
                          )}
                          {catItems.map(item => {
                            const isDone = item.completedAssigneeIds.includes(user.id);
                            return (
                              <div 
                                key={item.id}
                                className={`flex items-center justify-between p-2.5 px-3 rounded-2xl border transition-all ${
                                  isDone ? 'bg-emerald-50/50 border-emerald-100 text-gray-400' : 'bg-gray-50 border-gray-100 text-black'
                                }`}
                              >
                                <div 
                                  onClick={() => {
                                    const nextCompleted = isDone 
                                      ? item.completedAssigneeIds.filter(id => id !== user.id) 
                                      : [...item.completedAssigneeIds, user.id];
                                    const next = todos.map(t => t.id === item.id ? { ...t, completedAssigneeIds: nextCompleted, lastUpdatedById: user.id } : t);
                                    setTodos(next);
                                    sync({ todos: next });
                                    savePackingHistory(next);
                                  }}
                                  className="flex items-center gap-2.5 flex-1 cursor-pointer overflow-hidden pr-2"
                                >
                                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isDone ? 'bg-[#86A760] border-[#86A760] text-white text-[11px]' : 'border-gray-300 bg-white'
                                  }`}>
                                    {isDone && '✓'}
                                  </div>
                                  <span className={`text-xs font-black truncate ${isDone ? 'line-through opacity-60' : ''}`}>
                                    {item.task}
                                  </span>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  {/* 已完成者的即時頭像列表 */}
                                  <div className="flex -space-x-1.5 overflow-hidden">
                                    {item.completedAssigneeIds.map(cId => (
                                      <img 
                                        key={cId}
                                        src={getMember(cId).avatar} 
                                        title={`${getMember(cId).name} 已打包`}
                                        className="w-5 h-5 rounded-full border border-white object-cover shadow-xs" 
                                      />
                                    ))}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm(`確定移除行李項目「${item.task}」？`)) {
                                        const next = todos.filter(t => t.id !== item.id);
                                        setTodos(next);
                                        sync({ todos: next });
                                        savePackingHistory(next);
                                      }
                                    }}
                                    className="text-gray-300 hover:text-red-500 text-xs p-1"
                                    title="刪除項目"
                                  >
                                    ✕
                                  </button>
                                </div>
                              </div>
                            );
                          })}

                          {/* 分類下方直接新增項目列 */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={newPackingInputs[catGroup.category] || ''}
                              onChange={e => setNewPackingInputs({ ...newPackingInputs, [catGroup.category]: e.target.value })}
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  const text = (newPackingInputs[catGroup.category] || '').trim();
                                  if (!text) return;
                                  const newItem: TodoItem = {
                                    id: Date.now(),
                                    task: text,
                                    note: catGroup.category,
                                    assigneeIds: currentMemberIds,
                                    completedAssigneeIds: [],
                                    category: '行李',
                                    lastUpdatedById: user.id
                                  };
                                  const next = [...todos, newItem];
                                  setTodos(next);
                                  sync({ todos: next });
                                  savePackingHistory(next);
                                  setNewPackingInputs({ ...newPackingInputs, [catGroup.category]: '' });
                                }
                              }}
                              placeholder={`+ 新增${catGroup.category}物品...`}
                              className="flex-1 p-2.5 px-3.5 bg-gray-50 rounded-xl text-xs outline-none border border-gray-200 font-black text-black placeholder:text-gray-400"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                const text = (newPackingInputs[catGroup.category] || '').trim();
                                if (!text) return alert("請輸入物品名稱！");
                                const newItem: TodoItem = {
                                  id: Date.now(),
                                  task: text,
                                  note: catGroup.category,
                                  assigneeIds: currentMemberIds,
                                  completedAssigneeIds: [],
                                  category: '行李',
                                  lastUpdatedById: user.id
                                };
                                const next = [...todos, newItem];
                                setTodos(next);
                                sync({ todos: next });
                                savePackingHistory(next);
                                setNewPackingInputs({ ...newPackingInputs, [catGroup.category]: '' });
                              }}
                              className="bg-[#86A760] text-white text-[11px] px-3.5 py-2.5 rounded-xl font-black shadow-xs active:scale-95"
                            >
                              加入
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              /* 待辦與採購清單列表 */
              <div className="space-y-4">
                  {todos.filter(t => t.category === prepSubTab).map(todo => (
                      <div 
                        key={todo.id} 
                        onClick={() => setViewingTodoDetail(todo)}
                        className="bg-white p-5 rounded-[28px] shadow-sm border border-gray-100 flex justify-between items-center group font-black cursor-pointer hover:shadow-md active:scale-98 transition-all"
                      >
                          <div className="flex items-center gap-3.5 flex-1 pr-3 overflow-hidden">
                              {/* 採購項目直接在外層顯示 52x52 清晰商品縮圖 */}
                              {todo.image ? (
                                <div 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLightboxImg(todo.image!);
                                  }}
                                  className="w-[52px] h-[52px] rounded-2xl overflow-hidden shrink-0 border border-gray-200 shadow-xs relative group/img cursor-pointer"
                                  title="點擊全螢幕放大"
                                >
                                  <img src={todo.image} className="w-full h-full object-cover group-hover/img:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-[10px] text-white">
                                    🔍
                                  </div>
                                </div>
                              ) : prepSubTab === '採購' ? (
                                <div className="w-[52px] h-[52px] rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-xl shrink-0">
                                  🛍️
                                </div>
                              ) : null}

                              <div className="flex flex-col flex-1 overflow-hidden">
                                  <h4 className={`text-sm font-black transition-all truncate ${todo.completedAssigneeIds.length === todo.assigneeIds.length && todo.assigneeIds.length > 0 ? 'line-through opacity-30 text-gray-400' : 'text-black'}`}>
                                    {todo.task}
                                  </h4>

                                  {todo.note && <p className="text-[10px] text-gray-600 font-normal mt-0.5 line-clamp-1">💬 {todo.note}</p>}
                                  <p className="text-[9px] text-gray-400 mt-0.5 font-mono">最後編輯: {getMember(todo.lastUpdatedById).name}</p>
                                  
                                  <div className="flex gap-1.5 mt-2 flex-wrap" onClick={e => e.stopPropagation()}>
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
                                              }} className={`text-[8px] px-2.5 py-1 rounded-full font-black shadow-xs transition-all flex items-center gap-1 ${isDone ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-600'}`}>
                                                  <img src={m.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                                                  {m?.name} {isDone && "✅"}
                                              </button>
                                          );
                                      })}
                                  </div>
                              </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
                              <button onClick={()=>setEditingTodoModal(todo)} className="text-blue-400 text-sm p-1.5 hover:bg-blue-50 rounded-lg">🖋️</button>
                              <button onClick={()=>{if(confirm('確定刪除此事項？')){const n=todos.filter(t=>t.id!==todo.id); setTodos(n); sync({todos:n});}}} className="text-red-400 text-sm p-1.5 hover:bg-red-50 rounded-lg">✕</button>
                          </div>
                      </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* --- [Tab: 成員] --- */}
        {activeTab === '成員' && (
          <div className="animate-in fade-in space-y-4 pb-20 font-black">
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-3xl p-5 text-white shadow-lg flex justify-between items-center">
              <div>
                <p className="text-[10px] uppercase opacity-85 tracking-wider font-black">旅行邀請代碼 (SHARE TO FRIENDS)</p>
                <h3 className="text-2xl font-mono tracking-widest mt-0.5">{tripData.joinCode}</h3>
                <p className="text-[9px] opacity-80 mt-1 font-black">朋友在首頁輸入此 6 碼代碼即可一鍵加入本行程</p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(tripData.joinCode);
                  alert(`✅ 旅行代碼【${tripData.joinCode}】已複製到剪貼簿！快傳給朋友吧！`);
                }}
                className="bg-white/20 hover:bg-white/30 text-white px-3.5 py-2 rounded-2xl text-xs active:scale-95 transition-all shadow-sm font-black"
              >
                📋 複製代碼
              </button>
            </div>

            <div className="flex justify-between items-center mt-6 mb-2">
              <h3 className="text-[#5E9E8E] italic uppercase text-xs tracking-widest font-black">Trip Members ({currentMemberIds.length})</h3>
            </div>

            {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m => {
              const canEditThisMember = isWayne || user.id === m.id;
              const isTripLeader = tripData.memberIds[0] === m.id;
              return (
                <div key={m.id} className="bg-white p-6 rounded-[32px] shadow-xl flex items-center gap-6 border border-gray-100 font-black relative">
                  <img src={m.avatar} className="w-16 h-16 rounded-[24px] object-cover border-2 border-white shadow-md font-black shrink-0" />
                  <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="text-lg text-black font-black">{m.name}</h4>
                        {isTripLeader && <span className="text-[9px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-black">開團者</span>}
                      </div>
                      <p className="text-[10px] text-gray-400 font-mono">帳號: {m.account || m.loginCode}</p>
                      {isWayne && (
                        <div className="mt-2 space-y-1">
                            <p className="text-[9px] text-gray-400 uppercase tracking-widest font-black">History Logs:</p>
                            {(m.editLogs || []).slice(-2).reverse().map((log, i) => (
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
                    {(isWayne || tripData.memberIds[0] === user.id) && m.id !== tripData.memberIds[0] && (
                      <button 
                        onClick={() => {
                          if (confirm(`確定將 ${m.name} 從此行程移除？其建立的記錄仍會完整保留。`)) {
                            const nextIds = currentMemberIds.filter(id => id !== m.id);
                            handleUpdateTripMembers(nextIds);
                          }
                        }}
                        className="bg-red-50 hover:bg-red-100 text-xs px-3 py-2 rounded-2xl text-red-500 font-black"
                      >
                        ✕ 移出
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 獨立大視窗彈窗：幫人代墊款項設定 Modal */}
      {showAdvanceModal && (
        <div className="fixed inset-0 bg-black/80 z-[160] p-4 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-lg max-h-[90vh] p-7 rounded-[44px] shadow-2xl text-black flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤝</span>
                <div>
                  <h3 className="text-lg font-black text-black">設定代墊款項</h3>
                  <p className="text-[10px] text-gray-400 font-mono">幫旅伴或其他人代付，紀錄超清楚</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setShowAdvanceModal(false)} 
                className="w-9 h-9 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-sm font-black hover:bg-gray-200 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto flex-1 pr-1 space-y-5">
              <div className="flex bg-gray-100 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setTempAdvType('member')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                    tempAdvType === 'member' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
                  }`}
                >
                  幫旅伴代墊
                </button>
                <button
                  type="button"
                  onClick={() => setTempAdvType('other')}
                  className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${
                    tempAdvType === 'other' ? 'bg-white text-black shadow-sm' : 'text-gray-400'
                  }`}
                >
                  幫其他人
                </button>
              </div>

              {tempAdvType === 'member' ? (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-black">
                    選擇代墊旅伴（已自動排除付款人自己）：
                  </p>
                  {otherTripMembers.length === 0 ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 text-center">
                      <p className="text-xs text-amber-900 font-black">💡 目前行程中沒有其他同行旅伴</p>
                      <p className="text-[10px] text-amber-700 mt-1 font-normal">若要幫同行以外的朋友買東西，請切換至上方「幫其他人」。</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2.5">
                      {otherTripMembers.map(m => (
                        <div
                          key={m.id}
                          onClick={() => setTempAdvMemberId(m.id)}
                          className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${
                            tempAdvMemberId === m.id
                              ? 'border-[#5E9E8E] bg-[#5E9E8E]/10 shadow-sm scale-102'
                              : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <img src={m.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" />
                          <div className="overflow-hidden">
                            <p className="text-xs font-black text-black truncate">{m.name}</p>
                            <span className="text-[9px] text-gray-400 font-mono">旅伴</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-black block mb-1">
                      代墊對象
                    </label>
                    <input
                      type="text"
                      value={tempAdvOtherPerson}
                      onChange={e => setTempAdvOtherPerson(e.target.value)}
                      placeholder="輸入姓名或稱謂 (如: 小明、老媽)..."
                      className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black placeholder:text-gray-400"
                    />

                    <div className="flex gap-2 mt-2">
                      <span className="text-[10px] text-gray-400 py-1 font-black">快速選單：</span>
                      {['家人', '朋友', '同事', '親戚'].map(tag => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => setTempAdvOtherPerson(tag)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] px-3 py-1 rounded-full font-black active:scale-95 transition-all"
                        >
                          {tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500 font-black block mb-1">
                      備註 (選填)
                    </label>
                    <input
                      type="text"
                      value={tempAdvOtherNote}
                      onChange={e => setTempAdvOtherNote(e.target.value)}
                      placeholder="提示（藥妝、公仔、食品）..."
                      className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black placeholder:text-gray-400"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3 mt-6 pt-3 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAdvanceConfigured(false);
                  setShowAdvanceModal(false);
                }}
                className="flex-1 py-4 bg-gray-100 hover:bg-red-50 text-red-500 rounded-2xl text-xs font-black active:scale-95 transition-all"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleSaveAdvanceModal}
                className="flex-1 py-4 bg-[#86A760] hover:bg-[#769650] text-white rounded-2xl text-xs font-black shadow-md italic active:scale-95 transition-all"
              >
                ✓ 保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 獨立大視窗彈窗：多人分帳設定 Modal */}
      {showSplitModal && (
        <div className="fixed inset-0 bg-black/80 z-[160] p-4 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-lg p-7 rounded-[44px] shadow-2xl text-black flex flex-col animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <h3 className="text-lg font-black text-black">設定多人分帳對象</h3>
              <button type="button" onClick={() => setShowSplitModal(false)} className="w-9 h-9 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-sm">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 mb-6 overflow-y-auto max-h-[60vh]">
              {allMembers.filter(m => currentMemberIds.includes(m.id)).map(m => {
                const isChecked = tempSplitMemberIds.includes(m.id);
                return (
                  <div key={m.id} onClick={() => {
                    const next = isChecked ? tempSplitMemberIds.filter(id => id !== m.id) : [...tempSplitMemberIds, m.id];
                    setTempSplitMemberIds(next);
                  }} className={`p-3.5 rounded-2xl border-2 flex items-center gap-3 cursor-pointer transition-all ${isChecked ? 'border-emerald-600 bg-emerald-50 shadow-sm' : 'border-gray-200 bg-gray-50'}`}>
                    <img src={m.avatar} className="w-8 h-8 rounded-full object-cover shrink-0" />
                    <span className="text-xs font-black text-black truncate">{m.name}</span>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button 
                type="button" 
                onClick={() => {
                  setIsSplitConfigured(false);
                  setShowSplitModal(false);
                }} 
                className="flex-1 py-4 bg-gray-100 text-red-500 rounded-2xl text-xs font-black"
              >
                取消
              </button>
              <button type="button" onClick={handleSaveSplitModal} className="flex-1 py-4 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md">✓ 保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 💥 獨立彈窗：多人分帳成員個別結清管理 Modal */}
      {managingSplitRecord && (
        <div className="fixed inset-0 bg-black/80 z-[165] p-4 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-6 rounded-[40px] shadow-2xl text-black flex flex-col animate-in zoom-in-95 max-h-[88vh]">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <div>
                <h3 className="text-base font-black text-black">多人分帳收款管理</h3>
                <p className="text-[10px] text-gray-400 font-mono">
                  {managingSplitRecord.category} · 總額: {managingSplitRecord.amount} {managingSplitRecord.currency} (≈ NT$ {managingSplitRecord.twdAmount})
                </p>
              </div>
              <button 
                type="button" 
                onClick={() => setManagingSplitRecord(null)} 
                className="w-8 h-8 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-xs font-black hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3 mb-4 shrink-0 text-xs text-emerald-950 font-normal">
              <span className="font-black">先付款人：</span> {getMember(managingSplitRecord.payerId).name} 💳<br />
              <span className="font-black">分攤人數：</span> {(managingSplitRecord.splitMemberIds || currentMemberIds).length} 人均分<br />
              <span className="font-black">每人應付：</span> ≈ {Math.round(Number(managingSplitRecord.amount) / ((managingSplitRecord.splitMemberIds || currentMemberIds).length || 1))} {managingSplitRecord.currency} (約 NT$ {Math.round(Number(managingSplitRecord.twdAmount) / ((managingSplitRecord.splitMemberIds || currentMemberIds).length || 1))})
            </div>

            <div className="space-y-2.5 overflow-y-auto flex-1 pr-1">
              {(managingSplitRecord.splitMemberIds || currentMemberIds).map(mId => {
                const member = getMember(mId);
                const isPayer = mId === managingSplitRecord.payerId;
                const settledList = managingSplitRecord.splitSettledMemberIds || [];
                const isSettled = isPayer || settledList.includes(mId);

                return (
                  <div key={mId} className="flex items-center justify-between p-3 bg-gray-50 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img src={member.avatar} className="w-8 h-8 rounded-full object-cover shrink-0 shadow-xs" />
                      <div className="overflow-hidden">
                        <p className="text-xs font-black text-black truncate">{member.name}</p>
                        <span className="text-[9px] text-gray-400 font-mono">
                          {isPayer ? '先行代付者 (免收款)' : isSettled ? '✅ 款項已結清' : '⏳ 尚未付款'}
                        </span>
                      </div>
                    </div>

                    <div>
                      {isPayer ? (
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-3 py-1.5 rounded-xl font-black">
                          先付款人
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const currentSettled = managingSplitRecord.splitSettledMemberIds || [];
                            const nextSettled = isSettled 
                              ? currentSettled.filter(id => id !== mId)
                              : [...currentSettled, mId];
                            
                            const splitTarget = (managingSplitRecord.splitMemberIds || currentMemberIds).filter(id => id !== managingSplitRecord.payerId);
                            const allCleared = splitTarget.length > 0 && splitTarget.every(id => nextSettled.includes(id));

                            const updatedRecord: ExpenseRecord = {
                              ...managingSplitRecord,
                              splitSettledMemberIds: nextSettled,
                              isSplitSettled: allCleared,
                              lastUpdatedById: user.id
                            };

                            const nextRecords = records.map(r => r.id === managingSplitRecord.id ? updatedRecord : r);
                            setRecords(nextRecords);
                            sync({ records: nextRecords });
                            setManagingSplitRecord(updatedRecord);
                          }}
                          className={`text-xs px-3.5 py-1.5 rounded-xl font-black transition-all active:scale-95 shadow-xs ${
                            isSettled
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                          }`}
                        >
                          {isSettled ? '✓ 已結清' : '點擊結清'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setManagingSplitRecord(null)}
              className="w-full mt-4 py-3 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md shrink-0"
            >
              完成並關閉
            </button>
          </div>
        </div>
      )}

      {/* 憑證詳細資訊彈窗 */}
      {viewingVoucherDetail && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[155] flex items-center justify-center p-4 font-black"
          onClick={() => setViewingVoucherDetail(null)}
        >
          <div 
            className="bg-white w-full max-w-md p-6 rounded-[40px] shadow-2xl text-black animate-in zoom-in-95 max-h-[88vh] overflow-y-auto flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="text-xl">🎫</span>
                <h3 className="text-base font-black text-black truncate">{viewingVoucherDetail.title}</h3>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingVoucherDetail(null)} 
                className="w-9 h-9 bg-gray-100 text-gray-500 rounded-full flex items-center justify-center text-sm font-black hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            <div className="flex justify-between items-center mb-3 text-xs">
              <span className={`px-3 py-1 rounded-full font-black ${viewingVoucherDetail.status === 'used' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                {viewingVoucherDetail.status === 'used' ? '✅ 已使用憑證' : '🎫 未使用憑證'}
              </span>
              <span className="text-[10px] text-gray-400">
                最後編輯: {getMember(viewingVoucherDetail.lastUpdatedById).name}
              </span>
            </div>

            {viewingVoucherDetail.status === 'used' && (
              <p className="text-[10px] text-emerald-800 bg-emerald-50 p-2.5 rounded-xl mb-3 font-normal">
                已由 {viewingVoucherDetail.usedByMemberName || '旅伴'} 於 {viewingVoucherDetail.usedAt || '剛剛'} 使用核銷。
              </p>
            )}

            {viewingVoucherDetail.image ? (
              <div 
                onClick={() => setLightboxImg(viewingVoucherDetail.image!)}
                className="relative cursor-pointer group bg-gray-50 rounded-3xl p-2 border border-gray-100 mb-4 flex justify-center overflow-hidden"
                title="點擊全螢幕放大查看"
              >
                <img 
                  src={viewingVoucherDetail.image} 
                  className="w-full max-h-72 object-contain rounded-2xl shadow-sm group-hover:scale-102 transition-transform" 
                  alt="voucher detail" 
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity rounded-3xl">
                  🔍 點擊全螢幕放大
                </div>
              </div>
            ) : (
              <div className="p-8 bg-gray-50 rounded-3xl text-center text-gray-400 text-xs mb-4">
                此憑證未附照片
              </div>
            )}

            <div className="space-y-2 mt-auto pt-2">
              {viewingVoucherDetail.status !== 'used' ? (
                <button
                  type="button"
                  onClick={() => {
                    const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const next = bookings.map(item => item.id === viewingVoucherDetail.id ? {
                      ...item,
                      status: 'used' as const,
                      usedByMemberName: user.name,
                      usedAt: nowStr,
                      lastUpdatedById: user.id
                    } : item);
                    setBookings(next);
                    sync({ bookings: next });
                    setViewingVoucherDetail(null);
                    alert(`✅ 憑證「${viewingVoucherDetail.title}」已標記為使用！`);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black shadow-md active:scale-98 transition-transform"
                >
                  ✓ 標記為已使用
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    const next = bookings.map(item => item.id === viewingVoucherDetail.id ? {
                      ...item,
                      status: 'unused' as const,
                      usedByMemberName: undefined,
                      usedAt: undefined,
                      lastUpdatedById: user.id
                    } : item);
                    setBookings(next);
                    sync({ bookings: next });
                    setViewingVoucherDetail(null);
                    alert(`↺ 憑證「${viewingVoucherDetail.title}」已改回未使用！`);
                  }}
                  className="w-full py-3.5 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-2xl text-xs font-black active:scale-98 transition-transform"
                >
                  ↺ 改回未使用
                </button>
              )}
              <button
                type="button"
                onClick={() => setViewingVoucherDetail(null)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-2xl text-xs font-black hover:bg-gray-200"
              >
                關閉
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 準備清單詳細備註與商品照片彈窗 */}
      {viewingTodoDetail && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[150] flex items-end sm:items-center justify-center p-0 sm:p-4 font-black"
          onClick={() => setViewingTodoDetail(null)}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-t-[40px] sm:rounded-[40px] p-6 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto text-black flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-4 sm:hidden shrink-0" />

            <div className="flex justify-between items-start mb-4 pb-3 border-b border-gray-100 shrink-0">
              <div className="flex items-center gap-3 overflow-hidden pr-2">
                <span className="text-2xl shrink-0 p-2.5 bg-[#F9F8F3] rounded-2xl border border-gray-200">
                  {viewingTodoDetail.category === '待辦' ? '💼' : viewingTodoDetail.category === '行李' ? '🧳' : '🛍️'}
                </span>
                <div className="overflow-hidden">
                  <h3 className="text-lg font-black text-black truncate">{viewingTodoDetail.task}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-mono">
                      {viewingTodoDetail.category}
                    </span>
                    {viewingTodoDetail.lastUpdatedById && (
                      <span className="text-[9px] text-gray-400">
                        最後編輯: {getMember(viewingTodoDetail.lastUpdatedById).name}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setViewingTodoDetail(null)} 
                className="w-9 h-9 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-full flex items-center justify-center text-sm font-black shrink-0 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="mb-4 shrink-0">
              <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-black">指派成員與進度</p>
              <div className="flex gap-2 flex-wrap">
                {viewingTodoDetail.assigneeIds.map(id => {
                  const m = getMember(id);
                  const isDone = viewingTodoDetail.completedAssigneeIds.includes(id);
                  return (
                    <span 
                      key={id} 
                      className={`text-xs px-3 py-1.5 rounded-full font-black flex items-center gap-1.5 ${isDone ? 'bg-green-600 text-white shadow-xs' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}
                    >
                      <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" />
                      <span>{m.name}</span>
                      <span>{isDone ? '✅ 已完成' : '⏳ 待處理'}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {viewingTodoDetail.image && (
              <div className="mb-4 shrink-0">
                <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-black">商品參考相片 (點擊放大)</p>
                <div 
                  onClick={() => setLightboxImg(viewingTodoDetail.image!)}
                  className="relative cursor-pointer group bg-gray-50 rounded-2xl p-2 border border-gray-100 flex justify-center max-h-60 overflow-hidden"
                  title="點擊全螢幕放大查看"
                >
                  <img src={viewingTodoDetail.image} className="max-h-56 object-contain rounded-xl shadow-xs group-hover:scale-102 transition-transform" />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-black transition-opacity rounded-2xl">
                    🔍 點擊放大
                  </div>
                </div>
              </div>
            )}

            <div className="bg-gray-50 rounded-3xl p-5 border border-gray-100 overflow-y-auto flex-1 mb-5">
              <p className="text-[11px] text-gray-400 mb-2 uppercase tracking-wider font-black">備註與詳細說明</p>
              {viewingTodoDetail.note ? (
                <p className="text-base text-gray-800 leading-relaxed font-normal whitespace-pre-wrap">
                  {viewingTodoDetail.note}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic font-normal py-4 text-center">
                  目前尚未填寫詳細備註～
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() => setViewingTodoDetail(null)}
              className="w-full py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md active:scale-98 transition-transform shrink-0"
            >
              關閉
            </button>
          </div>
        </div>
      )}

      {/* 編輯憑證彈窗 */}
      {editingVoucherModal && (
        <div className="fixed inset-0 bg-black/80 z-[150] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-7 rounded-[40px] shadow-2xl text-black animate-in zoom-in-95">
            <h3 className="text-lg italic mb-4 uppercase">編輯憑證資料</h3>
            <label className="text-[10px] text-gray-400 ml-1">憑證標題</label>
            <input 
              type="text" 
              value={editingVoucherModal.title} 
              onChange={e => setEditingVoucherModal({ ...editingVoucherModal, title: e.target.value })} 
              className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 mb-4 text-xs font-black text-black" 
            />
            
            <label className="text-[10px] text-gray-400 block mb-1 ml-1">更換憑證圖片</label>
            <ImageUploader 
              label="上傳新憑證相片" 
              maxDimension={1200} 
              onUpload={b64 => setEditingVoucherModal({ ...editingVoucherModal, image: b64 })} 
            />

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingVoucherModal(null)} 
                className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black"
              >
                取消
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const next = bookings.map(b => b.id === editingVoucherModal.id ? editingVoucherModal : b);
                  setBookings(next); 
                  sync({ bookings: next });
                  setEditingVoucherModal(null);
                  alert("✅ 憑證已更新！");
                }} 
                className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md"
              >
                ✓ 儲存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯記帳紀錄彈窗 */}
      {editingExpenseModal && (
        <div className="fixed inset-0 bg-black/80 z-[150] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-7 rounded-[40px] shadow-2xl text-black animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg italic mb-4 uppercase">編輯記帳紀錄</h3>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-gray-400 ml-1">幣別選擇</label>
                <select
                  value={editingExpenseModal.currency}
                  onChange={(e) => {
                    const cur = e.target.value as 'JPY' | 'TWD' | 'CNY';
                    setEditingExpenseModal({ ...editingExpenseModal, currency: cur });
                  }}
                  className="w-full p-3 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black mt-1"
                >
                  <option value="JPY">🇯🇵 日幣 (JPY)</option>
                  <option value="TWD">🇹🇼 台幣 (TWD)</option>
                  <option value="CNY">🇨🇳 人民幣 (CNY)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">消費類別</label>
                <input 
                  type="text" 
                  value={editingExpenseModal.category} 
                  onChange={e => setEditingExpenseModal({ ...editingExpenseModal, category: e.target.value })} 
                  className="w-full p-3 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black mt-1" 
                />
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar mt-2 pb-1">
                  {['早餐','午餐','晚餐','宵夜','交通','娛樂','購物','其他'].map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setEditingExpenseModal({ ...editingExpenseModal, category: cat })}
                      className={`px-3 py-1 rounded-full text-[10px] shrink-0 transition-all ${
                        editingExpenseModal.category === cat 
                          ? 'bg-[#5E9E8E] text-white shadow-xs' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">金額 ({editingExpenseModal.currency})</label>
                <input 
                  type="number" 
                  min="0"
                  value={editingExpenseModal.amount} 
                  onChange={e => setEditingExpenseModal({ ...editingExpenseModal, amount: e.target.value.replace('-', '') })} 
                  className="w-full p-3 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black mt-1 font-mono text-base" 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">付款人員 (PAYER)</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar mt-1 pb-1">
                  {allMembers.filter(m => currentMemberIds.includes(m.id)).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => setEditingExpenseModal({ ...editingExpenseModal, payerId: m.id })}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black shrink-0 transition-all ${
                        editingExpenseModal.payerId === m.id
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <img src={m.avatar} className="w-4 h-4 rounded-full object-cover" />
                      <span>{m.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">備註說明</label>
                <input 
                  type="text" 
                  value={editingExpenseModal.note || ''} 
                  onChange={e => setEditingExpenseModal({ ...editingExpenseModal, note: e.target.value })} 
                  placeholder="備註（選填）..." 
                  className="w-full p-3 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black mt-1" 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">付款方式</label>
                <div className="grid grid-cols-5 gap-1.5 mt-1">
                  {['現金','信用卡','Suica','PayPay','其他'].map(p => {
                    const isOther = editingExpenseModal.payMethod.startsWith('其他');
                    const isSelected = p === '其他' ? isOther : editingExpenseModal.payMethod === p;
                    return (
                      <button
                        key={p}
                        type="button"
                        onClick={() => {
                          if (p === '其他') {
                            setEditingExpenseModal({ ...editingExpenseModal, payMethod: '其他' });
                          } else {
                            setEditingExpenseModal({ ...editingExpenseModal, payMethod: p });
                          }
                        }}
                        className={`py-2 rounded-xl text-[10px] font-black transition-all ${
                          isSelected 
                            ? 'bg-[#5E9E8E] text-white shadow-xs' 
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {p}
                      </button>
                    );
                  })}
                </div>
                {editingExpenseModal.payMethod.startsWith('其他') && (
                  <input
                    type="text"
                    defaultValue={editingExpenseModal.payMethod.replace(/^其他\s*\(?/, '').replace(/\)?$/, '')}
                    onChange={(e) => {
                      const val = e.target.value.trim();
                      setEditingExpenseModal({
                        ...editingExpenseModal,
                        payMethod: val ? `其他 (${val})` : '其他'
                      });
                    }}
                    placeholder="說明其他付款方式 (例如: LINE Pay)..."
                    className="w-full p-2.5 bg-emerald-50 rounded-xl text-xs outline-none border border-emerald-200 mt-2 font-black"
                  />
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingExpenseModal(null)} 
                className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black hover:bg-gray-200"
              >
                取消
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (!editingExpenseModal.category.trim()) return alert("請輸入消費類別！");
                  if (!editingExpenseModal.amount || Number(editingExpenseModal.amount) <= 0) return alert("金額必須大於 0！");
                  
                  const twdVal = (Number(editingExpenseModal.amount) * exchangeRates[editingExpenseModal.currency || 'JPY']).toFixed(0);
                  const next = records.map(r => r.id === editingExpenseModal.id ? { 
                    ...editingExpenseModal, 
                    twdAmount: twdVal,
                    lastUpdatedById: user.id 
                  } : r);
                  setRecords(next); 
                  sync({ records: next });
                  setEditingExpenseModal(null);
                  alert("✅ 記帳紀錄已更新！");
                }} 
                className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md hover:bg-[#769650]"
              >
                ✓ 儲存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯日誌彈窗 */}
      {editingJournalModal && (
        <div className="fixed inset-0 bg-black/80 z-[150] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-7 rounded-[40px] shadow-2xl text-black animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg italic mb-4 uppercase">編輯日誌內容</h3>
            <textarea 
              rows={4} 
              value={editingJournalModal.content} 
              onChange={e => setEditingJournalModal({ ...editingJournalModal, content: e.target.value })} 
              className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 mb-4 text-xs font-black text-black leading-relaxed" 
            />

            <div className="mb-4">
              <label className="text-[10px] text-gray-400 block mb-1">相片管理 (點選 ✕ 移除)</label>
              <div className="flex gap-2 flex-wrap mb-2">
                {((editingJournalModal.images && editingJournalModal.images.length > 0) ? editingJournalModal.images : (editingJournalModal.image ? [editingJournalModal.image] : [])).map((img, idx) => (
                  <div key={idx} className="relative w-14 h-14 rounded-xl overflow-hidden border">
                    <img src={img} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        const current = (editingJournalModal.images && editingJournalModal.images.length > 0) ? editingJournalModal.images : (editingJournalModal.image ? [editingJournalModal.image] : []);
                        const filtered = current.filter((_, i) => i !== idx);
                        setEditingJournalModal({ ...editingJournalModal, images: filtered, image: filtered[0] || '' });
                      }}
                      className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <ImageUploader
                label="新增相片"
                maxDimension={1200}
                onUpload={(b64) => {
                  const current = (editingJournalModal.images && editingJournalModal.images.length > 0) ? editingJournalModal.images : (editingJournalModal.image ? [editingJournalModal.image] : []);
                  if (current.length >= 5) return alert("每則日誌最多 5 張相片！");
                  const updated = [...current, b64];
                  setEditingJournalModal({ ...editingJournalModal, images: updated, image: updated[0] });
                }}
              />
            </div>

            <div className="mb-4 p-3 bg-gray-50 rounded-2xl border border-gray-200">
              <label className="text-[10px] text-gray-500 block mb-2 font-black">短影片管理 (15秒)</label>
              {editingJournalModal.video ? (
                <div className="relative inline-block w-full">
                  <video src={editingJournalModal.video} controls className="w-full max-h-48 rounded-xl object-contain bg-black" />
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("確定刪除此日誌中的短影片？")) {
                        setEditingJournalModal({ ...editingJournalModal, video: '' });
                      }
                    }}
                    className="mt-2 w-full py-2 bg-red-50 text-red-500 hover:bg-red-100 rounded-xl text-xs font-black flex items-center justify-center gap-1"
                  >
                    🗑️ 刪除短影片
                  </button>
                </div>
              ) : (
                <label className="w-full py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-600 flex items-center justify-center cursor-pointer hover:bg-gray-100 active:scale-95 transition-all">
                  🎬 上傳短影片 (15s)
                  <input
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const b64 = await compressVideoFile(file, 15);
                        setEditingJournalModal({ ...editingJournalModal, video: b64 });
                      } catch (err) {}
                      e.target.value = '';
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingJournalModal(null)} 
                className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black"
              >
                取消
              </button>
              <button 
                type="button" 
                onClick={() => {
                  const next = journals.map(j => j.id === editingJournalModal.id ? editingJournalModal : j);
                  setJournals(next); 
                  sync({ journals: next });
                  setEditingJournalModal(null);
                  alert("✅ 日誌已更新！");
                }} 
                className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md"
              >
                ✓ 儲存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯準備項目彈窗（支援編輯相片） */}
      {editingTodoModal && (
        <div className="fixed inset-0 bg-black/80 z-[150] p-6 flex items-center justify-center font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-7 rounded-[40px] shadow-2xl text-black animate-in zoom-in-95">
            <h3 className="text-lg italic mb-4 uppercase">編輯準備項目</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] text-gray-400 ml-1">事項名稱</label>
                <input 
                  type="text" 
                  value={editingTodoModal.task} 
                  onChange={e => setEditingTodoModal({ ...editingTodoModal, task: e.target.value })} 
                  className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black" 
                />
              </div>

              <div>
                <label className="text-[10px] text-gray-400 ml-1">備註說明 (支援換行)</label>
                <textarea 
                  rows={3}
                  value={editingTodoModal.note || ''} 
                  onChange={e => setEditingTodoModal({ ...editingTodoModal, note: e.target.value })} 
                  placeholder="備註說明..." 
                  className="w-full p-3.5 bg-gray-50 rounded-2xl outline-none border border-gray-200 text-xs font-black text-black leading-relaxed resize-none" 
                />
              </div>

              {editingTodoModal.category === '採購' && (
                <div>
                  <label className="text-[10px] text-gray-400 ml-1">商品相片</label>
                  <div className="flex items-center gap-2 mt-1">
                    {editingTodoModal.image ? (
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden border">
                        <img src={editingTodoModal.image} className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingTodoModal({ ...editingTodoModal, image: undefined })}
                          className="absolute -top-1 -right-1 bg-red-500 text-white w-4 h-4 rounded-full text-[9px] flex items-center justify-center"
                        >
                          ✕
                        </button>
                      </div>
                    ) : null}
                    <ImageUploader 
                      label={editingTodoModal.image ? "更換相片" : "上傳相片"} 
                      maxDimension={1000} 
                      onUpload={(b64) => setEditingTodoModal({ ...editingTodoModal, image: b64 })} 
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-gray-400 ml-1">指派人員</label>
                <div className="flex gap-2 flex-wrap mt-1">
                  {allMembers.filter(m=>currentMemberIds.includes(m.id)).map(m => {
                    const isAssigned = editingTodoModal.assigneeIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => {
                          const updated = isAssigned
                            ? editingTodoModal.assigneeIds.filter(id => id !== m.id)
                            : [...editingTodoModal.assigneeIds, m.id];
                          setEditingTodoModal({ ...editingTodoModal, assigneeIds: updated });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 ${isAssigned ? 'bg-green-700 text-white' : 'bg-gray-100 text-gray-500'}`}
                      >
                        <img src={m.avatar} className="w-3.5 h-3.5 rounded-full object-cover" />
                        {m.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                type="button" 
                onClick={() => setEditingTodoModal(null)} 
                className="flex-1 py-3.5 bg-gray-100 rounded-2xl text-xs font-black"
              >
                取消
              </button>
              <button 
                type="button" 
                onClick={() => {
                  if (!editingTodoModal.task.trim()) return alert("請輸入事項名稱！");
                  const next = todos.map(t => t.id === editingTodoModal.id ? editingTodoModal : t);
                  setTodos(next); 
                  sync({ todos: next });
                  setEditingTodoModal(null);
                  alert("✅ 準備項目已更新！");
                }} 
                className="flex-1 py-3.5 bg-[#86A760] text-white rounded-2xl text-xs font-black shadow-md"
              >
                ✓ 儲存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 編輯個人資料與頭像彈窗 */}
      {editingMemberModal && (
        <div className="fixed inset-0 bg-black/80 z-[110] p-8 flex items-center justify-center font-black overflow-y-auto">
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

              <ImageUploader label="上傳自訂頭像" forceSquare maxDimension={300} onUpload={(b64)=>setEditingMemberModal({...editingMemberModal, avatar:b64})} />
            </div>

            <label className="text-[10px] text-gray-500 ml-2 font-black">
              登入帳號 (Account) {isWayne ? '（管理員可修改，限英文數字）' : '（帳號固定不可修改）'}
            </label>
            <input 
              placeholder="Account" 
              value={editingMemberModal.account || editingMemberModal.loginCode} 
              disabled={!isWayne}
              onChange={e=>setEditingMemberModal({...editingMemberModal, account: e.target.value.toLowerCase()})} 
              className={`w-full p-4 rounded-2xl mb-4 outline-none border font-black font-mono text-xs ${isWayne ? 'bg-gray-50 text-black border-gray-200' : 'bg-gray-100 text-gray-500 border-gray-100 cursor-not-allowed'}`} 
            />

            <label className="text-[10px] text-gray-500 ml-2 font-black">用戶名稱 (Name - 可中文，不可重複)</label>
            <input placeholder="Name" value={editingMemberModal.name} onChange={e=>setEditingMemberModal({...editingMemberModal, name:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-4 outline-none border border-gray-200 font-black text-black placeholder:text-gray-400 text-xs" />
            
            <label className="text-[10px] text-gray-500 ml-2 font-black">登入密碼 (Password)</label>
            <input placeholder="Password" value={editingMemberModal.loginCode} onChange={e=>setEditingMemberModal({...editingMemberModal, loginCode:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl mb-8 outline-none border border-gray-200 font-black text-black placeholder:text-gray-400 text-xs" />
            
            <div className="flex gap-4">
              <button onClick={()=>setEditingMemberModal(null)} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black">取消</button>
              <button onClick={()=>{
                const trimmedName = editingMemberModal.name.trim();
                if (!trimmedName) return alert("❌ 請輸入用戶名稱！");

                const nameConflict = allMembers.some(m => m.id !== editingMemberModal.id && m.name.toLowerCase() === trimmedName.toLowerCase());
                if (nameConflict) return alert("❌ 該用戶名稱已被他人使用，請更換！");

                const targetAccount = (editingMemberModal.account || editingMemberModal.loginCode).trim().toLowerCase();
                if (isWayne) {
                  if (!targetAccount) return alert("❌ 帳號不可為空！");
                  if (!/^[a-zA-Z0-9_-]+$/.test(targetAccount)) {
                    return alert("❌ 帳號必須為英文或數字！");
                  }
                  const accountConflict = allMembers.some(m => m.id !== editingMemberModal.id && (m.account || m.loginCode).toLowerCase() === targetAccount);
                  if (accountConflict) return alert("❌ 該帳號已被他人使用，請更換！");
                }

                const trimmedPassword = editingMemberModal.loginCode.trim();
                if (!trimmedPassword) return alert("❌ 請輸入密碼！");

                const timestamp = new Date().toLocaleString();
                const newLogs = [...(editingMemberModal.editLogs || []), `${user.name} modified at ${timestamp}`];
                const finalMember = { 
                  ...editingMemberModal, 
                  account: targetAccount,
                  name: trimmedName, 
                  loginCode: trimmedPassword, 
                  editLogs: newLogs 
                };
                
                const nextMembers = allMembers.map(m => m.id === finalMember.id ? finalMember : m);
                onUpdateMembers(nextMembers);
                if (finalMember.id === user.id) onUpdateUser(finalMember);

                alert("✅ 資料修改成功！");
                setEditingMemberModal(null);
              }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-lg italic font-black">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* 放大圖片 Lightbox Modal */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-black/90 z-[250] flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImg(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setLightboxImg(null)}
              className="absolute top-4 right-4 w-11 h-11 bg-white/20 hover:bg-white/40 text-white rounded-full flex items-center justify-center text-lg font-black z-10 transition-colors shadow-lg"
            >
              ✕
            </button>
            <img 
              src={lightboxImg} 
              className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl" 
              alt="Enlarged view" 
            />
          </div>
        </div>
      )}

      {/* 新增/編輯景點 Modal */}
      {showPlanModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-end">
            <div className="bg-white w-full p-8 rounded-t-[48px] shadow-2xl animate-in slide-in-from-bottom font-black text-black max-h-[90vh] overflow-y-auto">
                <h3 className="text-2xl mb-6 italic text-[#5E9E8E] uppercase tracking-tighter">Edit Travel Stop</h3>
                
                <div className="flex gap-3 mb-5 bg-gray-50 rounded-2xl p-2 shadow-inner border border-gray-200">
                    <select className="flex-1 p-3.5 bg-transparent outline-none text-xl font-black text-black" value={planForm.time.split(':')[0]} onChange={e=>setPlanForm({...planForm,time:`${e.target.value}:${planForm.time.split(':')[1]}`})}>
                        {Array.from({length: 24}).map((_,i)=><option key={i} value={i.toString().padStart(2,'0')}>{i.toString().padStart(2,'0')} 點</option>)}
                    </select>
                    <select className="flex-1 p-3.5 bg-transparent outline-none text-xl font-black text-black" value={planForm.time.split(':')[1]} onChange={e=>setPlanForm({...planForm,time:`${planForm.time.split(':')[0]}:${e.target.value}`})}>
                        {['00','10','20','30','40','50'].map(m=><option key={m} value={m}>{m} 分</option>)}
                    </select>
                </div>

                <div className="relative mb-4">
                  <div className="flex items-center gap-2 bg-gray-50 p-2 px-4 rounded-[28px] border border-gray-200">
                    <span className="text-2xl">{planForm.icon || '📍'}</span>
                    <input 
                      placeholder="要去哪裡？(輸入地標名稱自動搜尋)..." 
                      value={planForm.title} 
                      onChange={e => {
                        const val = e.target.value;
                        setPlanForm({ ...planForm, title: val, icon: detectPlaceIcon(val) });
                      }} 
                      className="w-full p-3 bg-transparent outline-none text-base font-black text-black placeholder:text-gray-400" 
                    />
                    {isSearchingPlaces && <span className="text-xs text-gray-400 animate-spin">⏳</span>}
                  </div>

                  {placeSuggestions.length > 0 && (
                    <>
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setPlaceSuggestions([])} 
                      />

                      <div className="absolute top-16 left-0 right-0 bg-white rounded-3xl shadow-2xl border border-emerald-100 z-50 overflow-hidden max-h-60 overflow-y-auto animate-in fade-in">
                        <div className="p-2.5 px-4 text-[10px] text-gray-400 bg-gray-50 border-b border-gray-100 font-black flex justify-between items-center">
                          <span>💡 點選官方標準地標（自動修正地名）：</span>
                          <button
                            type="button"
                            onClick={() => setPlaceSuggestions([])}
                            className="text-gray-400 hover:text-black font-black bg-gray-200/60 hover:bg-gray-200 px-2 py-0.5 rounded-full text-[9px]"
                          >
                            ✕ 收起
                          </button>
                        </div>
                        {placeSuggestions.map((place, idx) => (
                          <div
                            key={idx}
                            onClick={() => {
                              isSelectingPlaceRef.current = true;
                              setPlanForm({
                                ...planForm,
                                title: place.title,
                                icon: place.icon
                              });
                              setPlaceSuggestions([]);
                            }}
                            className="p-3.5 px-4 hover:bg-emerald-50 cursor-pointer border-b border-gray-50 last:border-b-0 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2 overflow-hidden">
                              <span className="text-lg">{place.icon}</span>
                              <span className="text-sm font-black text-black truncate">{place.title}</span>
                            </div>
                            <span className="text-[10px] text-gray-400 font-normal shrink-0 ml-2 truncate max-w-[45%]" role="contentinfo">{place.subtitle}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                <textarea placeholder="備註或細節..." value={planForm.desc} onChange={e=>setPlanForm({...planForm,desc:e.target.value})} className="w-full p-5 bg-gray-50 rounded-[28px] mb-8 outline-none text-sm h-28 leading-relaxed border border-gray-200 font-black text-black placeholder:text-gray-400" />
                
                <div className="flex gap-4">
                    <button onClick={()=>{ setShowPlanModal({show:false,type:'add'}); setPlaceSuggestions([]); }} className="flex-1 py-4 bg-gray-100 rounded-3xl font-black uppercase">Cancel</button>
                    <button onClick={()=>{
                        if(!planForm.title.trim()) return alert("請輸入地點或活動標題！");
                        const dPlans = schedules[activeDay] || [];
                        const updatedPlan = { ...planForm, title: planForm.title.trim(), lastUpdatedById: user.id };
                        const n = showPlanModal.type === 'add' ? [...dPlans, {...updatedPlan, id: Date.now()}] : dPlans.map(p=>p.id===showPlanModal.data?.id ? {...updatedPlan, id:p.id} : p);
                        const up = { ...schedules, [activeDay]: n };
                        setSchedules(up); sync({schedules:up}); 
                        setShowPlanModal({show:false,type:'add'}); 
                        setPlaceSuggestions([]);
                        setPlanForm({time:'09:00', title:'', desc:'', icon:'📍'});
                    }} className="flex-1 py-4 bg-[#86A760] text-white rounded-3xl shadow-xl italic uppercase font-black">Save Stop</button>
                </div>
            </div>
        </div>
      )}

      {/* 底部導覽列 */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t flex justify-around p-4 shadow-2xl z-50">
        {[{id:'行程',icon:'📅'},{id:'預訂',icon:'📔'},{id:'記帳',icon:'👛'},{id:'日誌',icon:'🖋️'},{id:'準備',icon:'💼'},{id:'成員',icon:'👥'}].map(tab=>(
          <button key={tab.id} onClick={()=>setActiveTab(tab.id)} className={`flex flex-col items-center gap-1 transition-all duration-300 font-black ${activeTab===tab.id?'text-[#86A760] scale-125 font-black -translate-y-1':'opacity-30'}`}>
            <span className="text-2xl">{tab.icon}</span>
            <span className="text-[10px] uppercase font-black tracking-tighter">{tab.id}</span>
          </button>
        ))}
      </div>

      {/* 新增/編輯航班 Modal */}
      {showFlightModal.show && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 font-black overflow-y-auto">
          <div className="bg-white w-full max-w-md p-8 rounded-[48px] shadow-2xl overflow-y-auto max-h-[90vh] text-black">
            <h3 className="text-2xl mb-6 italic text-[#5E9E8E] uppercase tracking-tighter">{showFlightModal.type === 'add' ? 'Add' : 'Edit'} Flight</h3>
            <div className="space-y-4">
              <input placeholder="Airline (如: 長榮航空)" value={flightForm.airline} onChange={e=>setFlightForm({...flightForm, airline:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
              <input placeholder="Flight No. (如: BR198)" value={flightForm.flightNo} onChange={e=>setFlightForm({...flightForm, flightNo:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
              
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="From (如: TPE)" value={flightForm.fromCode} onChange={e=>setFlightForm({...flightForm, fromCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
                <input placeholder="To (如: NRT)" value={flightForm.toCode} onChange={e=>setFlightForm({...flightForm, toCode:e.target.value})} className="p-4 bg-gray-50 rounded-2xl outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div><label className="text-[10px] ml-2 text-gray-500 font-black">起飛時間 (Dep Time)</label><input type="time" value={flightForm.depTime} onChange={e=>setFlightForm({...flightForm, depTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black font-mono border border-gray-200" /></div>
                <div><label className="text-[10px] ml-2 text-gray-500 font-black">抵達時間 (Arr Time)</label><input type="time" value={flightForm.arrTime} onChange={e=>setFlightForm({...flightForm, arrTime:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black font-mono border border-gray-200" /></div>
              </div>

              <div>
                <label className="text-[10px] ml-2 text-gray-500 font-black">搭乘日期 (選取行程日)</label>
                <select 
                  value={flightForm.date} 
                  onChange={e=>setFlightForm({...flightForm, date: e.target.value})}
                  className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black border border-gray-200"
                >
                  {dynamicTripDates.map((dStr, idx) => (
                    <option key={dStr} value={dStr}>D{idx + 1} ({dStr})</option>
                  ))}
                </select>
              </div>

              <input placeholder="飛行時長 (如: 3h 15m)" value={flightForm.duration} onChange={e=>setFlightForm({...flightForm, duration:e.target.value})} className="w-full p-4 bg-gray-50 rounded-2xl outline-none font-black text-black placeholder:text-gray-400 border border-gray-200" />
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

// 4. 入口點 (全域雲端同步)
export default function AppEntry() {
  const [user, setUser] = useState<Member | null>(null);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [allMembers, setAllMembers] = useState<Member[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<Trip[]>([]);
  const [notice, setNotice] = useState<string>('');
  const [noticeEnabled, setNoticeEnabled] = useState<boolean>(false);

  const [changelogs, setChangelogs] = useState<ChangelogItem[]>([]);
  const [loginIcon, setLoginIcon] = useState<string>('❄️');

  const fetchCloudData = async () => {
    const { data: mData } = await supabase.from('trips').select('content').eq('id', '__app_members__').single();
    if (mData?.content && Array.isArray(mData.content)) {
      const formatted = (mData.content as Member[]).map(m => ({
        ...m,
        account: m.account || m.loginCode || m.id
      }));
      setAllMembers(formatted);
      localStorage.setItem('app_members_v26', JSON.stringify(formatted));
    } else {
      const cachedM = localStorage.getItem('app_members_v26');
      if (cachedM) {
        setAllMembers(JSON.parse(cachedM));
      } else {
        const defaultM: Member[] = [
          { id:'1', account:'wayne', name:'肚皮', avatar: PRESET_ANIMAL_AVATARS[0], loginCode:'wayne', editLogs:['Account created'] },
          { id:'2', account:'elvina', name:'豆豆皮', avatar: PRESET_ANIMAL_AVATARS[1], loginCode:'Elvina', editLogs:['Account created'] }
        ];
        setAllMembers(defaultM);
        localStorage.setItem('app_members_v26', JSON.stringify(defaultM));
        await supabase.from('trips').upsert({ id: '__app_members__', content: defaultM });
      }
    }

    const { data: tData } = await supabase.from('trips').select('content').eq('id', '__app_trips__').single();
    if (tData?.content && Array.isArray(tData.content)) {
      const ensuredTrips = (tData.content as Trip[]).map(t => ({
        ...t,
        joinCode: t.joinCode || generateJoinCode([])
      }));
      setSelectedTrips(ensuredTrips);
      localStorage.setItem('app_trips_v26', JSON.stringify(ensuredTrips));
    } else {
      const cachedT = localStorage.getItem('app_trips_v26');
      if (cachedT) {
        setSelectedTrips(JSON.parse(cachedT));
      } else {
        const today = getTodayDateString();
        const defaultT: Trip[] = [{ id:'hokkaido2026', title:'2026 日本之旅', startDate: today, endDate: today, emoji:'☃️', memberIds:['1','2'], joinCode: 'JP2026' }];
        setSelectedTrips(defaultT);
        localStorage.setItem('app_trips_v26', JSON.stringify(defaultT));
        await supabase.from('trips').upsert({ id: '__app_trips__', content: defaultT });
      }
    }

    const { data: nData } = await supabase.from('trips').select('content').eq('id', '__app_notice__').single();
    if (nData?.content && typeof nData.content === 'string') {
      setNotice(nData.content);
      localStorage.setItem('app_notice_v26', nData.content);
    }

    const { data: neData } = await supabase.from('trips').select('content').eq('id', '__app_notice_enabled__').single();
    if (neData?.content !== undefined) {
      const isEn = Boolean(neData.content);
      setNoticeEnabled(isEn);
      localStorage.setItem('app_notice_enabled_v26', JSON.stringify(isEn));
    }

    const { data: cData } = await supabase.from('trips').select('content').eq('id', '__app_changelogs__').single();
    if (cData?.content && Array.isArray(cData.content)) {
      const formattedLogs = (cData.content as any[]).map(item => ({
        ...item,
        enabled: item.enabled !== undefined ? item.enabled : false
      }));
      setChangelogs(formattedLogs);
      localStorage.setItem('app_changelogs_v26', JSON.stringify(formattedLogs));
    }

    const { data: iData } = await supabase.from('trips').select('content').eq('id', '__app_login_icon__').single();
    if (iData?.content && typeof iData.content === 'string') {
      setLoginIcon(iData.content);
      localStorage.setItem('app_login_icon_v26', iData.content);
    }
  };

  useEffect(() => {
    const localM = localStorage.getItem('app_members_v26');
    const localT = localStorage.getItem('app_trips_v26');
    const localN = localStorage.getItem('app_notice_v26');
    const localNE = localStorage.getItem('app_notice_enabled_v26');
    const localC = localStorage.getItem('app_changelogs_v26');
    const localI = localStorage.getItem('app_login_icon_v26');

    if (localM) setAllMembers(JSON.parse(localM));
    if (localT) setSelectedTrips(JSON.parse(localT));
    if (localN) setNotice(localN);
    if (localNE) setNoticeEnabled(JSON.parse(localNE));
    if (localC) setChangelogs(JSON.parse(localC));
    if (localI) setLoginIcon(localI);

    fetchCloudData();

    const appChannel = supabase
      .channel('app-global-sync-v26')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'trips', filter: 'id=in.(__app_members__,__app_trips__,__app_notice__,__app_notice_enabled__,__app_changelogs__,__app_login_icon__)' },
        (payload) => {
          if (payload.new) {
            const p = payload.new as any;
            if (p.id === '__app_members__' && Array.isArray(p.content)) {
              setAllMembers(p.content);
              localStorage.setItem('app_members_v26', JSON.stringify(p.content));
            }
            if (p.id === '__app_trips__' && Array.isArray(p.content)) {
              setSelectedTrips(p.content);
              localStorage.setItem('app_trips_v26', JSON.stringify(p.content));
            }
            if (p.id === '__app_notice__' && typeof p.content === 'string') {
              setNotice(p.content);
              localStorage.setItem('app_notice_v26', p.content);
            }
            if (p.id === '__app_notice_enabled__') {
              const isEn = Boolean(p.content);
              setNoticeEnabled(isEn);
              localStorage.setItem('app_notice_enabled_v26', JSON.stringify(isEn));
            }
            if (p.id === '__app_changelogs__' && Array.isArray(p.content)) {
              setChangelogs(p.content);
              localStorage.setItem('app_changelogs_v26', JSON.stringify(p.content));
            }
            if (p.id === '__app_login_icon__' && typeof p.content === 'string') {
              setLoginIcon(p.content);
              localStorage.setItem('app_login_icon_v26', p.content);
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
    localStorage.setItem('app_members_v26', JSON.stringify(newM));
    await supabase.from('trips').upsert({ id: '__app_members__', content: newM });
  };

  const handleRegister = async (newM: Member) => {
    const updated = [...allMembers, newM];
    handleUpdateMembers(updated);
  };

  const handleAddTrip = async (t: Trip) => {
    const next = [...selectedTrips, t];
    setSelectedTrips(next);
    localStorage.setItem('app_trips_v26', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  const handleDeleteTrip = async (id: string) => {
    const next = selectedTrips.filter(t => t.id !== id);
    setSelectedTrips(next);
    localStorage.setItem('app_trips_v26', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  const handleUpdateTrip = async (updated: Trip) => {
    const next = selectedTrips.map(t => t.id === updated.id ? updated : t);
    setSelectedTrips(next);
    if (selectedTrip && selectedTrip.id === updated.id) {
      setSelectedTrip(updated);
    }
    localStorage.setItem('app_trips_v26', JSON.stringify(next));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: next });
  };

  const handleUpdateTripWithMigration = async (updatedTrip: Trip, oldTrip: Trip) => {
    await handleUpdateTrip(updatedTrip);

    const datesChanged = updatedTrip.startDate !== oldTrip.startDate || updatedTrip.endDate !== oldTrip.endDate;
    if (!datesChanged) return;

    const oldDates = getDatesList(oldTrip.startDate, oldTrip.endDate);
    const newDates = getDatesList(updatedTrip.startDate, updatedTrip.endDate);
    const newLength = newDates.length;

    const dateMapping: { [oldD: string]: string } = {};
    oldDates.forEach((oldD, idx) => {
      if (idx < newLength) {
        dateMapping[oldD] = newDates[idx];
      }
    });

    let currentContent: any = {};
    const cached = localStorage.getItem(`trip_cache_${updatedTrip.id}`);
    if (cached) {
      try { currentContent = JSON.parse(cached); } catch(e){}
    }
    if (!currentContent.records && !currentContent.schedules) {
      const { data } = await supabase.from('trips').select('content').eq('id', updatedTrip.id).single();
      if (data?.content) currentContent = data.content;
    }

    const newSchedules: ScheduleData = {};
    if (currentContent.schedules) {
      for (let dayNum = 1; dayNum <= newLength; dayNum++) {
        if (currentContent.schedules[dayNum]) {
          newSchedules[dayNum] = currentContent.schedules[dayNum];
        }
      }
    }

    const newRecords = (currentContent.records || []).map((r: ExpenseRecord) => {
      if (r.date.includes('(旅行外)')) return r;
      if (dateMapping[r.date]) {
        return { ...r, date: dateMapping[r.date] };
      }
      return { ...r, date: `${r.date} (旅行外)` };
    });

    const newFlights = (currentContent.flights || []).map((f: Flight) => {
      if (dateMapping[f.date]) {
        return { ...f, date: dateMapping[f.date] };
      }
      return { ...f, date: newDates[0] || f.date };
    });

    const newCityConfigs = (currentContent.cityConfigs || []).map((c: CityWeatherConfig) => ({
      ...c,
      dayIndexes: c.dayIndexes.filter(d => d <= newLength)
    }));

    const migratedContent = {
      ...currentContent,
      schedules: newSchedules,
      records: newRecords,
      flights: newFlights,
      cityConfigs: newCityConfigs
    };

    localStorage.setItem(`trip_cache_${updatedTrip.id}`, JSON.stringify(migratedContent));
    await supabase.from('trips').upsert({ id: updatedTrip.id, content: migratedContent });
  };

  const handleJoinTrip = async (code: string) => {
    if (!user) return;
    const target = selectedTrips.find(t => t.joinCode?.toUpperCase() === code);
    if (!target) {
      return alert("❌ 查無此旅行代碼，請確認代碼是否正確！");
    }

    if (target.memberIds.includes(user.id)) {
      return alert("💡 你已經是這趟旅行的成員囉！");
    }

    const updatedTrip: Trip = {
      ...target,
      memberIds: [...target.memberIds, user.id]
    };

    const nextTrips = selectedTrips.map(t => t.id === target.id ? updatedTrip : t);
    setSelectedTrips(nextTrips);
    localStorage.setItem('app_trips_v26', JSON.stringify(nextTrips));
    await supabase.from('trips').upsert({ id: '__app_trips__', content: nextTrips });

    alert(`🎉 成功加入旅行：【${target.title}】！`);
  };

  const handleUpdateNotice = async (n: string) => {
    setNotice(n);
    localStorage.setItem('app_notice_v26', n);
    await supabase.from('trips').upsert({ id: '__app_notice__', content: n });
  };

  const handleUpdateNoticeEnabled = async (enabled: boolean) => {
    setNoticeEnabled(enabled);
    localStorage.setItem('app_notice_enabled_v26', JSON.stringify(enabled));
    await supabase.from('trips').upsert({ id: '__app_notice_enabled__', content: enabled });
  };

  const handleUpdateChangelogs = async (logs: ChangelogItem[]) => {
    setChangelogs(logs);
    localStorage.setItem('app_changelogs_v26', JSON.stringify(logs));
    await supabase.from('trips').upsert({ id: '__app_changelogs__', content: logs });
  };

  const handleUpdateLoginIcon = async (icon: string) => {
    setLoginIcon(icon);
    localStorage.setItem('app_login_icon_v26', icon);
    await supabase.from('trips').upsert({ id: '__app_login_icon__', content: icon });
  };

  const handleLogout = () => {
    setUser(null);
    setSelectedTrip(null);
    fetchCloudData();
  };

  if (!user) return (
    <AuthPage
      onLogin={(loggedUser) => {
        setUser(loggedUser);
        fetchCloudData();
      }}
      allMembers={allMembers}
      onRegister={handleRegister}
      loginIcon={loginIcon}
    />
  );
  
  if (!selectedTrip) return (
    <TripSelector 
      user={user} 
      onLogout={handleLogout} 
      allTrips={selectedTrips} 
      allMembers={allMembers} 
      onSelect={setSelectedTrip} 
      onAddTrip={handleAddTrip} 
      onDeleteTrip={handleDeleteTrip} 
      onUpdateTripWithMigration={handleUpdateTripWithMigration} 
      onUpdateMembers={handleUpdateMembers} 
      onUpdateUser={setUser} 
      notice={notice} 
      noticeEnabled={noticeEnabled} 
      onUpdateNotice={handleUpdateNotice} 
      onUpdateNoticeEnabled={handleUpdateNoticeEnabled} 
      changelogs={changelogs} 
      onUpdateChangelogs={handleUpdateChangelogs} 
      loginIcon={loginIcon} 
      onUpdateLoginIcon={handleUpdateLoginIcon} 
      onJoinTrip={handleJoinTrip} 
    />
  );

  return (
    <MainApp 
      user={user} 
      tripData={selectedTrip} 
      allMembers={allMembers} 
      onUpdateMembers={handleUpdateMembers} 
      onUpdateTrip={handleUpdateTrip} 
      onUpdateUser={setUser} 
      onBack={() => setSelectedTrip(null)} 
    />
  );
}