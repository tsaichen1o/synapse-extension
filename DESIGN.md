# 🎨 Synapse 現代化介面設計

## 設計特色

### 1. **漸層背景**
- 使用柔和的紫色、粉色到藍色的漸層背景 (`from-purple-50 via-pink-50 to-blue-50`)
- 營造舒適、現代的視覺體驗

### 2. **玻璃態設計 (Glassmorphism)**
- 所有卡片使用半透明背景 (`bg-white/60`)
- 毛玻璃模糊效果 (`backdrop-blur-md`)
- 精緻的白色邊框 (`border-white/30`)
- 柔和的陰影效果 (`shadow-lg`)

### 3. **現代化圖標**
- 使用 SVG 圖標取代 emoji
- 更專業、更統一的視覺語言
- 包含：燈泡、文件、標籤、對話、飛機發送等圖標

### 4. **配色方案**

#### 主色調
- **紫色** (`purple-500` to `purple-700`): 主要操作、品牌色
- **粉紅色** (`pink-500` to `pink-600`): 漸層輔助色
- **藍色** (`blue-50`): 背景漸層

#### 按鈕樣式
- **主要按鈕**: 紫色到粉色漸層 (`from-purple-600 to-pink-600`)
- **次要按鈕**: 半透明白色玻璃態
- **發送按鈕**: 圓形紫粉漸層，懸浮效果

### 5. **動畫效果**

#### 淡入動畫 (fadeIn)
```css
from { opacity: 0; transform: translateY(10px); }
to { opacity: 1; transform: translateY(0); }
```

#### 懸浮效果
- `hover:scale-[1.02]` - 輕微放大
- `active:scale-[0.98]` - 按下縮小
- `transition-all duration-300` - 平滑過渡

#### 載入動畫
- 旋轉載入圖標 (`animate-spin`)
- 脈衝效果 (`animate-pulse`)

### 6. **聊天介面**

#### 使用者訊息
- 右對齊
- 紫粉漸層背景 (`from-purple-500 to-pink-500`)
- 白色文字
- 圓角氣泡 (`rounded-2xl`)

#### AI 訊息
- 左對齊
- 半透明白色背景 (`bg-white/60`)
- 灰色文字
- 機器人圖標 🤖

### 7. **結構化資訊卡片**
- 每個資訊項目獨立卡片
- 懸浮時變亮 (`hover:bg-white/60`)
- 添加陰影效果 (`hover:shadow-md`)
- 平滑過渡動畫

### 8. **輸入框設計**
- 內嵌發送按鈕
- 圓角設計 (`rounded-2xl`)
- 玻璃態背景
- 紫色焦點環 (`focus:ring-purple-500`)

### 9. **自定義滾動條**
- 細窄滾動條 (8px)
- 紫粉漸層顏色
- 圓角設計
- 懸浮時加深顏色

## 響應式設計

- 所有元素使用相對單位
- 靈活的間距系統
- 適配 Chrome 側邊欄寬度 (通常 400-500px)

## 可訪問性

- 所有按鈕添加 `aria-label` 和 `title`
- 適當的顏色對比度
- 鍵盤導航支援
- 螢幕閱讀器友善

## 技術實現

- **框架**: React + TypeScript
- **樣式**: Tailwind CSS
- **動畫**: CSS Transitions + Keyframes
- **圖標**: Heroicons (SVG)
- **效果**: Backdrop Filter (毛玻璃)

## 瀏覽器支援

- ✅ Chrome 90+
- ✅ Edge 90+
- ⚠️ Safari 需要 `-webkit-backdrop-filter` 前綴

## 效能優化

- CSS 動畫使用 `transform` 和 `opacity` (GPU 加速)
- 避免使用昂貴的 `box-shadow` 動畫
- 使用 `will-change` 提示瀏覽器優化
- 圖標使用 SVG (矢量，輕量)

---

**設計理念**: 現代、優雅、專業，同時保持使用者友善和高效能。