import { useState, useEffect, useRef } from 'react';
import { 
  Search, BookOpen, Volume2, FileText, ArrowLeft, SkipBack, SkipForward, 
  Menu, Play, Pause, Settings, FolderPlus, Trash2, X, RefreshCw, 
  ChevronRight, ChevronDown, Folder, FolderOpen, RotateCcw, RotateCw, 
  Volume, Volume1, VolumeX, LayoutGrid, List, FolderTree, Loader2, HardDrive
} from 'lucide-react';
import { cn } from './lib/utils';

// Helper: Màu nền phân cấp
const getDepthColor = (level) => {
  const opacities = [0, 0.03, 0.06, 0.1, 0.15];
  const opacity = opacities[Math.min(level, opacities.length - 1)];
  return `rgba(59, 130, 246, ${opacity})`;
};

// Helper: Tự động tạo màu nền gradient từ tên
const getGradientFromName = (name) => {
  const gradients = [
    'from-blue-500 to-indigo-600', 'from-emerald-400 to-teal-600',
    'from-violet-500 to-fuchsia-600', 'from-rose-400 to-orange-500',
    'from-amber-400 to-orange-500', 'from-cyan-500 to-blue-600',
    'from-pink-500 to-rose-600'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
};

// Helper: Sắp xếp tự nhiên (1, 2, 3, 10 thay vì 1, 10, 2)
const naturalSort = (a, b) => {
  return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
};

// Helper: Lấy URL truy cập file trực tiếp
const getLocalFileUrl = (filePath) => {
  if (!filePath) return '';
  const normalized = filePath.replace(/\\/g, '/');
  const parts = normalized.split('/');
  const encodedParts = parts.map((part, index) => {
    if (index === 0 && part.includes(':')) return part;
    return encodeURIComponent(part);
  });
  return `file:///${encodedParts.join('/')}`;
};

function App() {
  const [trees, setTrees] = useState([]);
  const [view, setView] = useState('dashboard');
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ scanFolders: [] });

  // === CÁC STATE CỦA DASHBOARD ĐƯỢC ĐƯA LÊN ĐÂY ĐỂ GIỮ NGUYÊN VỊ TRÍ KHI QUAY LẠI ===
  const [dashSearch, setDashSearch] = useState('');
  const [dashViewMode, setDashViewMode] = useState('grid');
  const [dashCurrentPath, setDashCurrentPath] = useState([]);
  const [dashExpandedFolders, setDashExpandedFolders] = useState({});

  const loadTrees = async (folders = null) => {
    setLoading(true);
    if (window.api) {
      try {
        const pathsToScan = folders || settings.scanFolders;
        const loadedTrees = await window.api.scanFoldersTree(pathsToScan);
        
        let flatRoots = [];
        loadedTrees.forEach(tree => {
          if (!tree) return;
          if (tree.children && tree.children.length > 0) flatRoots.push(...tree.children);
          else if (tree.docs > 0 || tree.audio > 0) flatRoots.push(tree);
        });
        
        const treesWithThumbs = await Promise.all(
          flatRoots.map(async (tree) => await loadThumbnailsRecursive(tree))
        );
        // Sắp xếp thư mục gốc
        setTrees(treesWithThumbs.sort(naturalSort));
        // Reset lại vị trí path khi có refresh lại hệ thống file
        setDashCurrentPath([]);
        setDashExpandedFolders({});
      } catch (error) { console.error("Failed to load trees", error); }
    }
    setLoading(false);
  };

  const loadThumbnailsRecursive = async (node) => {
    if (!node) return node;
    try {
      if ((node.docs > 0 || node.audio > 0) && !node.thumbnailData) {
        node.thumbnailData = await window.api.getThumbnail(node.path);
      }
    } catch (e) {}

    if (node.children && node.children.length > 0) {
      node.children = await Promise.all(node.children.map(child => loadThumbnailsRecursive(child)));
      node.children.sort(naturalSort); // Đảm bảo mọi nhánh đều sắp xếp đúng
    }
    return node;
  };

  useEffect(() => {
    async function init() {
      if (window.api) {
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings);
        await loadTrees(savedSettings.scanFolders);
      } else { setLoading(false); }
    }
    init();
  }, []);

  const handleSetClick = async (set) => {
    setLoading(true);
    if (window.api) {
      try {
        const details = await window.api.getSetDetailsGrouped(set.path);
        setSelectedSet({ ...set, ...details });
        setView('learning');
      } catch (e) { console.error("Failed to load details", e); }
    }
    setLoading(false);
  };

  const handleBack = () => {
    setView('dashboard');
    setSelectedSet(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 dark:bg-slate-950 flex-col gap-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-slate-500 font-medium animate-pulse">Đang đồng bộ thư viện...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/20 transition-colors duration-300">
      {view === 'dashboard' && (
        <Dashboard 
          trees={trees} 
          onSetClick={handleSetClick} 
          onSettingsClick={() => setShowSettings(true)}
          onRefresh={() => loadTrees()}
          search={dashSearch} setSearch={setDashSearch}
          viewMode={dashViewMode} setViewMode={setDashViewMode}
          currentPath={dashCurrentPath} setCurrentPath={setDashCurrentPath}
          expandedFolders={dashExpandedFolders} setExpandedFolders={setDashExpandedFolders}
        />
      )}
      {view === 'learning' && selectedSet && (
        <LearningView set={selectedSet} onBack={handleBack} onReloadSet={handleSetClick} />
      )}
      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onSave={async (s) => {
            await window.api.saveSettings(s);
            setSettings(s);
            setShowSettings(false);
            loadTrees(s.scanFolders);
          }} 
          onClose={() => setShowSettings(false)} 
        />
      )}
    </div>
  );
}

function Dashboard({ 
  trees, onSetClick, onSettingsClick, onRefresh,
  search, setSearch, viewMode, setViewMode, currentPath, setCurrentPath, expandedFolders, setExpandedFolders 
}) {
  const toggleFolder = (id) => setExpandedFolders(prev => ({ ...prev, [id]: !prev[id] }));
  const handleEnterFolder = (node) => setCurrentPath(prev => [...prev, node]);
  const handleGoBack = () => setCurrentPath(prev => prev.slice(0, -1));

  const currentNodes = currentPath.length > 0 ? (currentPath[currentPath.length - 1].children || []) : trees;
  const filteredNodes = currentNodes.filter(node => node.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight bg-gradient-to-br from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            My Library
          </h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý kho tàng kiến thức của bạn</p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Tìm tài liệu..." 
              className="w-full pl-10 pr-4 py-2 bg-transparent border-none focus:ring-0 text-sm outline-none"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
          <div className="flex gap-1">
            <button onClick={() => setViewMode('grid')} className={cn("p-2 rounded-xl transition-all", viewMode === 'grid' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100")} title="Chế độ Lưới"><LayoutGrid size={18} /></button>
            <button onClick={() => setViewMode('list')} className={cn("p-2 rounded-xl transition-all", viewMode === 'list' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100")} title="Chế độ Danh sách"><List size={18} /></button>
            <button onClick={() => { setViewMode('tree'); setCurrentPath([]); }} className={cn("p-2 rounded-xl transition-all", viewMode === 'tree' ? "bg-blue-100 text-blue-600" : "hover:bg-slate-100")} title="Chế độ Cây thư mục"><FolderTree size={18} /></button>
          </div>
          <div className="h-8 w-[1px] bg-slate-200 dark:bg-slate-800 mx-1" />
          <button onClick={onRefresh} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"><RefreshCw size={18} /></button>
          <button onClick={onSettingsClick} className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-500"><Settings size={18} /></button>
        </div>
      </header>

      {/* Breadcrumbs cho Grid và List */}
      {viewMode !== 'tree' && currentPath.length > 0 && (
        <nav className="flex items-center gap-2 mb-6 text-sm overflow-x-auto pb-2 scrollbar-hide">
          <button onClick={() => setCurrentPath([])} className="flex items-center gap-1 text-slate-500 hover:text-blue-600 transition-colors px-2 py-1 rounded-lg hover:bg-blue-50">
            <HardDrive size={14} /> Library
          </button>
          {currentPath.map((node, i) => (
            <div key={node.id} className="flex items-center gap-2 shrink-0">
              <ChevronRight size={14} className="text-slate-300" />
              <button onClick={() => setCurrentPath(currentPath.slice(0, i + 1))} className={cn("px-2 py-1 rounded-lg transition-all", i === currentPath.length - 1 ? "bg-blue-600 text-white font-medium" : "text-slate-500 hover:bg-blue-50 hover:text-blue-600")}>
                {node.name}
              </button>
            </div>
          ))}
        </nav>
      )}

      {trees.length === 0 ? (
        <EmptyState onSettings={onSettingsClick} />
      ) : (
        <div className={cn(viewMode === 'grid' ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6" : "space-y-3")}>
          
          {/* Nút Back cho Grid */}
          {viewMode === 'grid' && currentPath.length > 0 && (
            <div onClick={handleGoBack} className="flex flex-col items-center justify-center p-4 rounded-3xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group aspect-[4/5]">
              <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600 transition-all mb-3"><ArrowLeft size={32} /></div>
              <span className="font-bold text-slate-400 group-hover:text-blue-600">Quay lại</span>
            </div>
          )}

          {/* Nút Back cho List */}
          {viewMode === 'list' && currentPath.length > 0 && (
            <div onClick={handleGoBack} className="flex items-center gap-4 p-3 rounded-2xl border-2 border-dashed border-slate-200 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-all group">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-100 group-hover:text-blue-600"><ArrowLeft size={20} /></div>
              <span className="font-bold text-slate-500 group-hover:text-blue-600 flex-1">Quay lại thư mục cha</span>
            </div>
          )}

          {(viewMode === 'tree' ? trees : filteredNodes).map(node => (
            <TreeNode 
              key={node.id} node={node} level={viewMode === 'tree' ? 0 : currentPath.length} viewMode={viewMode}
              onSetClick={onSetClick} onEnterFolder={handleEnterFolder} expandedFolders={expandedFolders} toggleFolder={toggleFolder}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, level, viewMode, onSetClick, onEnterFolder, expandedFolders, toggleFolder }) {
  const isExpanded = expandedFolders[node.id];
  const hasChildren = node.children && node.children.length > 0;
  const isLearningMaterial = node.docs > 0 || node.audio > 0;
  const cardGradient = (!node.thumbnailData && !hasChildren && isLearningMaterial) ? getGradientFromName(node.name) : '';

  const handleClick = (e) => {
    if (hasChildren) {
      if (viewMode === 'tree') toggleFolder(node.id);
      else onEnterFolder(node);
    } else if (isLearningMaterial) onSetClick(node);
  };

  const handleStudyClick = (e) => {
    e.stopPropagation(); 
    onSetClick(node);
  };

  if (viewMode === 'grid') {
    return (
      <div onClick={handleClick} className="group relative flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 hover:-translate-y-1 transition-all cursor-pointer aspect-[4/5]">
        <div className={cn("relative flex-1 overflow-hidden flex items-center justify-center", node.thumbnailData ? "bg-slate-100" : (cardGradient ? `bg-gradient-to-br ${cardGradient}` : "bg-slate-100 dark:bg-slate-800"))}>
          {node.thumbnailData ? <img src={node.thumbnailData} alt="" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" /> : (!hasChildren && isLearningMaterial) ? <BookOpen size={56} className="text-white opacity-90 drop-shadow-md transition-transform duration-500 group-hover:scale-110" /> : <Folder size={64} className="text-amber-400 fill-amber-400/20" />}
          {node.audio > 0 && <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md text-white p-1.5 rounded-xl shadow-lg border border-white/20"><Volume2 size={14} /></div>}
          {isLearningMaterial && (
            <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={handleStudyClick} className="px-4 py-2.5 bg-white text-slate-900 font-bold text-xs rounded-xl shadow-xl flex items-center gap-2 hover:scale-105 transition-all">
                <BookOpen size={16} className="text-blue-600" /> HỌC NGAY
              </button>
            </div>
          )}
        </div>
        <div className="p-4 pt-3">
          <h3 className="font-bold text-sm line-clamp-2 group-hover:text-blue-600 transition-colors h-10" title={node.name}>{node.name}</h3>
          <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400 font-medium">
             <div className="flex gap-2">
                {node.docs > 0 && <span className="flex items-center gap-0.5"><FileText size={12}/>{node.docs}</span>}
                {node.audio > 0 && <span className="flex items-center gap-0.5"><Volume2 size={12}/>{node.audio}</span>}
             </div>
             <span>{(!hasChildren && isLearningMaterial) ? 'Bài học' : 'Thư mục'}</span>
          </div>
        </div>
      </div>
    );
  }

  // Chế độ List (phẳng) hoặc Tree (đệ quy)
  return (
    <div className="w-full">
      <div 
        onClick={handleClick}
        className={cn(
          "flex items-center gap-4 p-3 rounded-2xl border transition-all cursor-pointer group relative",
          isLearningMaterial && !hasChildren ? "bg-white border-slate-200 hover:border-blue-400 hover:shadow-md" : "bg-slate-50/50 border-transparent hover:bg-slate-100"
        )}
        style={{ marginLeft: viewMode === 'tree' ? level * 24 : 0, backgroundColor: viewMode === 'tree' ? getDepthColor(level) : '' }}
      >
        {(viewMode === 'tree' && hasChildren) ? (
          <button className="p-1 hover:bg-slate-200 rounded-lg">{isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}</button>
        ) : <div className={viewMode === 'tree' ? "w-7" : "hidden"} />}

        <div className={cn("w-12 h-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center shadow-sm", node.thumbnailData ? "bg-slate-100" : (cardGradient ? `bg-gradient-to-br ${cardGradient}` : "bg-slate-100 dark:bg-slate-800"))}>
          {node.thumbnailData ? <img src={node.thumbnailData} alt="" className="w-full h-full object-cover" /> : (!hasChildren && isLearningMaterial) ? <BookOpen size={20} className="text-white" /> : <Folder size={24} className="text-amber-500 fill-amber-500/10" />}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-bold truncate group-hover:text-blue-600 transition-colors">{node.name}</h3>
          <p className="text-xs text-slate-400">
            {node.docs > 0 && `${node.docs} tài liệu · `}
            {node.audio > 0 && `${node.audio} file nghe`}
            {node.docs === 0 && node.audio === 0 && "Thư mục rỗng"}
          </p>
        </div>

        {isLearningMaterial && (
          <button onClick={handleStudyClick} className="hidden md:flex opacity-0 group-hover:opacity-100 px-4 py-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full tracking-wider transition-all z-10 hover:scale-105 shadow-md">
            HỌC NGAY
          </button>
        )}
      </div>

      {viewMode === 'tree' && isExpanded && hasChildren && (
        <div className="mt-2 space-y-2">
          {node.children.map(child => (
            <TreeNode key={child.id} node={child} level={level + 1} viewMode="tree" onSetClick={onSetClick} expandedFolders={expandedFolders} toggleFolder={toggleFolder} />
          ))}
        </div>
      )}
    </div>
  );
}

function LearningView({ set, onBack, onReloadSet }) {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [collapsedGroups, setCollapsedGroups] = useState({});

  // === RESIZE SIDEBAR LOGIC ===
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('learning_sidebar_width');
    return saved ? parseInt(saved, 10) : 340; // Default width 340px
  });
  const [isResizing, setIsResizing] = useState(false);

  const startResizing = (e) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      // Calculate width from the right side of the screen
      const newWidth = window.innerWidth - e.clientX;
      // Constraints: Min 200px, Max 60% of window width
      if (newWidth > 200 && newWidth < window.innerWidth * 0.6) {
        setSidebarWidth(newWidth);
      }
    };
    
    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        localStorage.setItem('learning_sidebar_width', sidebarWidth);
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, sidebarWidth]);
  // ==============================

  useEffect(() => {
    if (set.docs && set.docs.length > 0) {
      const sortedDocs = [...set.docs].sort(naturalSort);
      const firstPdf = sortedDocs.find(d => d.name.toLowerCase().endsWith('.pdf'));
      setCurrentDoc(firstPdf || sortedDocs[0]);
    } else setCurrentDoc(null);
    
    if (set.audio && set.audio.length > 0) setCurrentAudio([...set.audio].sort(naturalSort)[0]);
    else setCurrentAudio(null);

    setCollapsedGroups({}); // Mặc định mở toàn bộ khi load set mới
  }, [set]);

  // Logic kiểm tra xem Group này có đang bị ẩn bởi cha của nó không (Tree Behavior)
  const isGroupVisible = (folderPath) => {
    if (folderPath === '/') return true;
    const parts = folderPath.split('/');
    let checkPath = '';
    for (let i = 0; i < parts.length - 1; i++) {
      checkPath = checkPath ? `${checkPath}/${parts[i]}` : parts[i];
      if (collapsedGroups[checkPath]) return false; // Thư mục cha đang bị gập -> Con bị ẩn
    }
    return true;
  };

  const toggleGroupCollapse = (folderPath) => setCollapsedGroups(prev => ({ ...prev, [folderPath]: !prev[folderPath] }));

  return (
    <div className="h-screen flex flex-col bg-slate-50 dark:bg-slate-950 overflow-hidden animate-in fade-in duration-500">
      <header className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center px-4 justify-between z-30 shadow-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-all"><ArrowLeft size={20} /></button>
          <div className="min-w-0">
            <h2 className="font-black text-sm md:text-base truncate">{set.name}</h2>
            <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase font-bold tracking-widest">
              <span className="flex items-center gap-1"><FileText size={10}/> {set.docs?.length || 0}</span><span>•</span>
              <span className="flex items-center gap-1"><Volume2 size={10}/> {set.audio?.length || 0}</span>
            </div>
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={cn("p-2 rounded-xl transition-all", isSidebarOpen ? "bg-slate-100 text-slate-900" : "hover:bg-slate-100")}><Menu size={20} /></button>
      </header>

      {/* Main Layout Area - Using Flexbox instead of Fixed Sidebar for easy resizing */}
      <main className="flex-1 flex overflow-hidden relative w-full">
        
        {/* Left Area (Doc + Audio) */}
        <div className="flex-1 flex flex-col min-w-0 relative">
          
          {/* OVERLAY FIX: Khi đang kéo thả resize, Iframe PDF sẽ nuốt mất sự kiện chuột. 
              Lớp div tàng hình này giúp che lại Iframe tạm thời để quá trình resize mượt mà */}
          {isResizing && <div className="absolute inset-0 z-50 cursor-col-resize bg-transparent" />}

          <div className="flex-1 bg-slate-200/50 dark:bg-slate-900/50 overflow-hidden relative">
            {currentDoc ? <DocViewer doc={currentDoc} /> : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-4 p-8 text-center">
                <BookOpen size={80} strokeWidth={1} className="opacity-20" />
                <p className="max-w-xs">Chọn tài liệu từ danh sách bên phải để bắt đầu học tập.</p>
              </div>
            )}
          </div>
          
          <AudioBar 
            currentAudio={currentAudio} 
            playlist={set.audio} 
            onNext={() => {
              if(!set.audio || !currentAudio) return;
              const sorted = [...set.audio].sort(naturalSort);
              const idx = sorted.findIndex(a => a.path === currentAudio.path);
              if (idx < sorted.length - 1) setCurrentAudio(sorted[idx+1]);
            }}
            onPrev={() => {
              if(!set.audio || !currentAudio) return;
              const sorted = [...set.audio].sort(naturalSort);
              const idx = sorted.findIndex(a => a.path === currentAudio.path);
              if (idx > 0) setCurrentAudio(sorted[idx-1]);
            }}
          />
        </div>

        {/* Resizer Handle (Chỉ hiện trên Desktop và khi Sidebar đang mở) */}
        {isSidebarOpen && (
          <div 
            onMouseDown={startResizing}
            className="hidden lg:block w-1.5 hover:w-2 bg-slate-200 dark:bg-slate-800 hover:bg-blue-500 active:bg-blue-600 cursor-col-resize shrink-0 z-40 transition-colors"
            title="Kéo để thay đổi kích thước"
          />
        )}

        {/* Right Sidebar - Cấu trúc Tree */}
        <aside 
          style={{ width: `${sidebarWidth}px` }}
          className={cn(
            "fixed inset-y-16 right-0 bg-white dark:bg-slate-900 flex flex-col shadow-2xl lg:shadow-none lg:static shrink-0 z-40 max-w-[85vw]",
            isSidebarOpen ? "translate-x-0" : "translate-x-full lg:hidden",
            isResizing ? "transition-none" : "transition-transform duration-300 ease-in-out"
          )}
        >
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shadow-sm z-10 bg-white dark:bg-slate-900 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-tighter text-slate-400">Nội dung bài học</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-1 scrollbar-thin">
            {set.structure && set.structure.map((group, i) => {
              if (!isGroupVisible(group.folder)) return null; // Ẩn hoàn toàn nếu cha bị gập
              
              const isCollapsed = collapsedGroups[group.folder];
              const sortedDocs = [...group.docs].sort(naturalSort);
              const sortedAudio = [...group.audio].sort(naturalSort);
              
              const depth = group.folder === '/' ? 0 : (group.folder.match(/\//g) || []).length;
              const folderName = group.folder === '/' ? 'Thư mục gốc' : group.folder.split('/').pop();

              return (
                <div key={i} className="space-y-1 mb-2">
                  <div 
                    onClick={() => toggleGroupCollapse(group.folder)}
                    className="group relative flex items-center gap-2 p-2 rounded-xl cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    style={{ marginLeft: `${depth * 14}px` }}
                  >
                    <button className="text-slate-400 group-hover:text-blue-600 transition-colors">
                      {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <FolderOpen size={16} className="text-amber-500 shrink-0" /> 
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-wide truncate pr-20" title={group.folder}>
                      {folderName}
                    </span>

                    {/* Reload Set Button (Hover to see) */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        // Nạp lại màn hình Learning với thư mục mới này
                        onReloadSet({ path: group.folderPath, name: folderName });
                      }}
                      className="absolute right-2 opacity-0 group-hover:opacity-100 px-3 py-1.5 bg-blue-600 text-white text-[9px] font-bold rounded-lg shadow-md hover:bg-blue-700 hover:scale-105 transition-all"
                    >
                      HỌC NGAY
                    </button>
                  </div>

                  {!isCollapsed && (
                    <div className="space-y-1 py-1" style={{ marginLeft: `${(depth * 14) + 26}px` }}>
                      {sortedDocs.map(doc => (
                        <button 
                          key={doc.path} onClick={() => setCurrentDoc(doc)}
                          className={cn("w-full flex items-center gap-2.5 p-2 rounded-lg text-xs transition-all text-left", currentDoc?.path === doc.path ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800")}
                        >
                          <FileText size={14} className={currentDoc?.path === doc.path ? "text-white shrink-0" : "text-blue-500 shrink-0"} />
                          <span className="truncate flex-1">{doc.name}</span>
                        </button>
                      ))}
                      {sortedAudio.map(track => (
                        <button 
                          key={track.path} onClick={() => setCurrentAudio(track)}
                          className={cn("w-full flex items-center gap-2.5 p-2 rounded-lg text-xs transition-all text-left group", currentAudio?.path === track.path ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20" : "text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800")}
                        >
                          <Volume2 size={14} className={currentAudio?.path === track.path ? "text-white shrink-0" : "text-indigo-500 shrink-0"} />
                          <span className="truncate flex-1">{track.name}</span>
                          {currentAudio?.path === track.path && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse shrink-0" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </main>
    </div>
  );
}

function DocViewer({ doc }) {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const isDocx = doc.name.toLowerCase().endsWith('.docx') || doc.name.toLowerCase().endsWith('.doc');

  useEffect(() => {
    setLoading(true);
    if (!isDocx) setUrl(getLocalFileUrl(doc.path));
    setTimeout(() => setLoading(false), 50);
  }, [doc, isDocx]);

  if (isDocx) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-slate-900">
        <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-blue-500/10"><FileText size={48} /></div>
        <h3 className="text-xl font-black mb-2">{doc.name}</h3>
        <p className="text-slate-500 max-w-sm mb-8">Tài liệu Word cần được mở bằng Microsoft Word để đảm bảo định dạng hiển thị chuẩn nhất.</p>
        <button onClick={() => window.api.openFileExternal(doc.path)} className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-95 flex items-center gap-3">
          MỞ BẰNG MS WORD <ArrowLeft size={18} className="rotate-180" />
        </button>
      </div>
    );
  }

  if (loading) return <div className="h-full flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={32} /></div>;
  return <iframe src={url} className="w-full h-full border-none" title="Reader" />;
}

function AudioBar({ currentAudio, playlist, onNext, onPrev }) {
  const [src, setSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isConverting, setIsConverting] = useState(false);
  const [volume, setVolume] = useState(80);
  const [skipHint, setSkipHint] = useState('');
  const audioRef = useRef(null);
  const lastClickRef = useRef(0);

  useEffect(() => {
    async function loadAudio() {
      if (!currentAudio) return;
      const isWma = currentAudio.name.toLowerCase().endsWith('.wma');
      try {
        if (isWma) {
          setIsConverting(true);
          if (window.api) setSrc(await window.api.getAudioData(currentAudio.path));
          setIsConverting(false);
        } else {
          setSrc(getLocalFileUrl(currentAudio.path));
        }
        setIsPlaying(true);
      } catch (e) { console.error("Audio error", e); setIsConverting(false); }
    }
    loadAudio();
  }, [currentAudio]);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) audioRef.current.play().catch(() => setIsPlaying(false));
      else audioRef.current.pause();
    }
  }, [isPlaying, src]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setProgress((audioRef.current.currentTime / audioRef.current.duration) * 100 || 0);
  };

  const handleSeek = (e) => {
    const time = (e.target.value / 100) * audioRef.current.duration;
    audioRef.current.currentTime = time;
    setProgress(e.target.value);
  };

  const smartSkip = (sec) => {
    const now = Date.now();
    let skip = sec;
    if (now - lastClickRef.current < 300) { skip = sec * 2; setSkipHint(sec > 0 ? `+${skip}s` : `${skip}s`); } 
    else { setSkipHint(sec > 0 ? `+${sec}s` : `${sec}s`); }
    lastClickRef.current = now;
    if (audioRef.current) audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.duration, audioRef.current.currentTime + skip));
    setTimeout(() => setSkipHint(''), 800);
  };

  const handleRewindHold = () => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (Date.now() - start > 600) { audioRef.current.currentTime = 0; setSkipHint('VỀ ĐẦU'); clearInterval(timer); }
    }, 100);
    const clear = () => { clearInterval(timer); window.removeEventListener('mouseup', clear); };
    window.addEventListener('mouseup', clear);
  };

  if (!currentAudio) return null;

  return (
    <div className="h-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 px-6 py-2 z-30 shadow-[0_-10px_30px_rgba(0,0,0,0.03)] shrink-0">
      <audio ref={audioRef} src={src} onTimeUpdate={handleTimeUpdate} onLoadedMetadata={(e) => setDuration(e.target.duration)} onEnded={onNext}/>
      <div className="max-w-6xl mx-auto h-full flex flex-col justify-center gap-2">
        <div className="flex items-center gap-4">
          <div className="flex-1 flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs truncate max-w-[200px]">{currentAudio.name}</span>
              {isConverting && <span className="text-[9px] font-black text-blue-600 animate-pulse">CONVERTING WMA...</span>}
              {skipHint && <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-1.5 rounded">{skipHint}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] font-mono text-slate-400 w-8">{formatTime(audioRef.current?.currentTime)}</span>
              <div className="flex-1 relative group h-6 flex items-center">
                <input type="range" min="0" max="100" value={progress} onChange={handleSeek} className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full appearance-none accent-blue-600 cursor-pointer group-hover:h-1.5 transition-all" />
              </div>
              <span className="text-[9px] font-mono text-slate-400 w-8">{formatTime(duration)}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
             <div className="flex items-center gap-0.5 mr-2">
                <VolumeX size={14} className="text-slate-300" />
                <input type="range" min="0" max="100" value={volume} onChange={(e) => { setVolume(e.target.value); if(audioRef.current) audioRef.current.volume = e.target.value / 100; }} className="w-16 h-1 accent-slate-400" />
                <Volume2 size={14} className="text-slate-400" />
             </div>
          </div>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button onClick={onPrev} className="text-slate-400 hover:text-slate-900"><SkipBack size={20}/></button>
          <button onMouseDown={handleRewindHold} onClick={() => smartSkip(-5)} className="text-slate-400 hover:text-indigo-600 transition-colors"><RotateCcw size={20}/></button>
          <button onClick={() => setIsPlaying(!isPlaying)} disabled={isConverting} className="w-10 h-10 bg-slate-900 dark:bg-blue-600 text-white rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50">
            {isPlaying ? <Pause size={20} fill="currentColor"/> : <Play size={20} fill="currentColor" className="ml-0.5"/>}
          </button>
          <button onClick={() => smartSkip(5)} className="text-slate-400 hover:text-indigo-600 transition-colors"><RotateCw size={20}/></button>
          <button onClick={onNext} className="text-slate-400 hover:text-slate-900"><SkipForward size={20}/></button>
        </div>
      </div>
    </div>
  );
}

const formatTime = (time) => {
  if (!time || isNaN(time)) return "0:00";
  const m = Math.floor(time / 60);
  const s = Math.floor(time % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
};

function EmptyState({ onSettings }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-[40px] border border-dashed border-slate-200">
      <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mb-6"><FolderPlus size={40} /></div>
      <h2 className="text-2xl font-black mb-2 text-slate-800">Thư viện trống</h2>
      <p className="text-slate-500 mb-8 max-w-sm text-center font-medium">Bạn chưa chỉ định thư mục chứa tài liệu học tập. Hãy thêm folder để bắt đầu quét dữ liệu.</p>
      <button onClick={onSettings} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl shadow-blue-500/20 hover:bg-blue-700 transition-all flex items-center gap-2">
        <FolderPlus size={20} /> THÊM THƯ MỤC NGAY
      </button>
    </div>
  );
}

function SettingsModal({ settings, onSave, onClose }) {
  const [folders, setFolders] = useState(settings.scanFolders || []);
  
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 pb-0 flex items-center justify-between">
          <h2 className="text-2xl font-black tracking-tight flex items-center gap-3"><Settings className="text-blue-600"/> Cấu hình</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full"><X/></button>
        </div>
        <div className="p-8 space-y-6">
           <div>
              <label className="text-[11px] font-black uppercase text-slate-400 mb-3 block tracking-widest">Thư mục đã kết nối</label>
              <div className="space-y-2 max-h-60 overflow-y-auto pr-2 scrollbar-thin">
                {folders.map((f, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl group">
                    <Folder className="text-blue-500 shrink-0" size={18} />
                    <span className="text-xs font-bold truncate flex-1">{f}</span>
                    <button onClick={() => setFolders(folders.filter((_, idx) => idx !== i))} className="text-rose-500 opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
                  </div>
                ))}
              </div>
              <button 
                onClick={async () => { const f = await window.api.selectFolder(); if(f && !folders.includes(f)) setFolders([...folders, f]); }}
                className="w-full mt-4 py-4 border-2 border-dashed border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-400 rounded-2xl font-black text-xs transition-all flex items-center justify-center gap-2"
              ><FolderPlus size={18}/> THÊM THƯ MỤC MỚI</button>
           </div>
        </div>
        <div className="p-8 pt-0 flex gap-4 mt-auto">
          <button onClick={onClose} className="flex-1 py-4 font-black text-slate-400 hover:text-slate-900">HUỶ BỎ</button>
          <button onClick={() => onSave({ ...settings, scanFolders: folders })} className="flex-1 py-4 bg-slate-900 dark:bg-blue-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95">LƯU & ĐỒNG BỘ</button>
        </div>
      </div>
    </div>
  );
}

export default App;