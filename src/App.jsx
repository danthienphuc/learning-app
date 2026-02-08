import { useState, useEffect, useRef } from 'react';
import { Search, BookOpen, Volume2, FileText, ArrowLeft, SkipBack, SkipForward, Menu, Clock, Play, Pause, Settings, FolderPlus, Trash2, X, RefreshCw, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { cn } from './lib/utils';

function App() {
  const [trees, setTrees] = useState([]);
  const [view, setView] = useState('dashboard');
  const [selectedSet, setSelectedSet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState({ scanFolders: [] });

  const loadTrees = async (folders = null) => {
    setLoading(true);
    if (window.api) {
      try {
        const loadedTrees = await window.api.scanFoldersTree(folders);
        // Load thumbnails for root level items
        const treesWithThumbs = await Promise.all(
          loadedTrees.map(async (tree) => {
            return await loadThumbnailsRecursive(tree);
          })
        );
        setTrees(treesWithThumbs);
      } catch (error) {
        console.error("Failed to load trees", error);
      }
    }
    setLoading(false);
  };

  const loadThumbnailsRecursive = async (node) => {
    if (!node) return node;

    try {
      if (node.docs > 0 || node.audio > 0) {
        const thumb = await window.api.getThumbnail(node.path);
        node.thumbnailData = thumb;
      }
    } catch (e) { }

    if (node.children) {
      node.children = await Promise.all(
        node.children.map(child => loadThumbnailsRecursive(child))
      );
    }

    return node;
  };

  useEffect(() => {
    async function init() {
      if (window.api) {
        const savedSettings = await window.api.getSettings();
        setSettings(savedSettings);
        await loadTrees(savedSettings.scanFolders);
      } else {
        setLoading(false);
      }
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
      } catch (e) {
        console.error("Failed to load details", e);
      }
    }
    setLoading(false);
  };

  const handleBack = () => {
    setView('dashboard');
    setSelectedSet(null);
  };

  const handleSettingsSave = async (newSettings) => {
    if (window.api) {
      await window.api.saveSettings(newSettings);
      setSettings(newSettings);
      await loadTrees(newSettings.scanFolders);
    }
    setShowSettings(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-background text-foreground flex-col gap-4">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground animate-pulse">Loading resources...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
      {view === 'dashboard' && (
        <Dashboard
          trees={trees}
          onSetClick={handleSetClick}
          onSettingsClick={() => setShowSettings(true)}
          onRefresh={() => loadTrees(settings.scanFolders)}
        />
      )}
      {view === 'learning' && selectedSet && (
        <LearningView set={selectedSet} onBack={handleBack} />
      )}
      {showSettings && (
        <SettingsModal
          settings={settings}
          onSave={handleSettingsSave}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
}

function SettingsModal({ settings, onSave, onClose }) {
  const [folders, setFolders] = useState(settings.scanFolders || []);

  const handleAddFolder = async () => {
    if (window.api) {
      const folder = await window.api.selectFolder();
      if (folder && !folders.includes(folder)) {
        setFolders([...folders, folder]);
      }
    }
  };

  const handleRemoveFolder = (index) => {
    setFolders(folders.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({ ...settings, scanFolders: folders });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg mx-4 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Settings size={24} className="text-primary" />
            Settings
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="font-semibold mb-3 text-sm uppercase tracking-wider text-muted-foreground">Scan Folders</h3>
            <p className="text-xs text-muted-foreground mb-4">Add folders containing your learning materials</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {folders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderPlus size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No folders added yet</p>
                </div>
              ) : (
                folders.map((folder, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-secondary/50 rounded-lg group">
                    <div className="w-8 h-8 bg-primary/10 rounded flex items-center justify-center text-primary shrink-0">
                      <Folder size={16} />
                    </div>
                    <span className="flex-1 text-sm truncate font-mono">{folder}</span>
                    <button
                      onClick={() => handleRemoveFolder(index)}
                      className="p-1.5 text-destructive hover:bg-destructive/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={handleAddFolder}
              className="mt-4 w-full py-3 border-2 border-dashed border-border rounded-xl text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <FolderPlus size={18} />
              Add Folder
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-6 border-t border-border">
          <button onClick={onClose} className="flex-1 py-2.5 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium">
            Cancel
          </button>
          <button onClick={handleSave} className="flex-1 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-lg shadow-primary/20">
            Save & Reload
          </button>
        </div>
      </div>
    </div>
  );
}

function Dashboard({ trees, onSetClick, onSettingsClick, onRefresh }) {
  const [search, setSearch] = useState('');
  const [expandedFolders, setExpandedFolders] = useState({});

  // Initialize all root folders as expanded
  useEffect(() => {
    const initial = {};
    trees.forEach(tree => {
      initial[tree.id] = true;
    });
    setExpandedFolders(initial);
  }, [trees]);

  const toggleFolder = (id) => {
    setExpandedFolders(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const filterTree = (node, searchTerm) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    if (node.name.toLowerCase().includes(term)) return true;
    if (node.children) {
      return node.children.some(child => filterTree(child, searchTerm));
    }
    return false;
  };

  const isEmpty = trees.length === 0 || trees.every(t => t.docs === 0 && t.audio === 0);

  return (
    <div className="p-6 max-w-[1920px] mx-auto">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-background/80 backdrop-blur-sm z-10 py-4 border-b border-border/50">
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">My Library</h1>
        <div className="flex items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="pl-10 pr-4 py-2 border rounded-full bg-secondary text-secondary-foreground focus:outline-none focus:ring-2 focus:ring-primary w-48 md:w-64"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button onClick={onRefresh} className="p-2.5 hover:bg-secondary rounded-full transition-colors" title="Refresh">
            <RefreshCw size={20} />
          </button>
          <button onClick={onSettingsClick} className="p-2.5 hover:bg-secondary rounded-full transition-colors" title="Settings">
            <Settings size={20} />
          </button>
        </div>
      </div>

      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-6">
            <BookOpen size={40} className="text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">No learning materials found</h2>
          <p className="text-muted-foreground mb-6">Add folders to get started.</p>
          <button onClick={onSettingsClick} className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium flex items-center gap-2">
            <FolderPlus size={18} /> Add Folders
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {trees.map(tree => (
            <TreeNode
              key={tree.id}
              node={tree}
              level={0}
              onSetClick={onSetClick}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              formatSize={formatSize}
              searchTerm={search}
              filterTree={filterTree}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreeNode({ node, level, onSetClick, expandedFolders, toggleFolder, formatSize, searchTerm, filterTree }) {
  const isExpanded = expandedFolders[node.id];
  const hasChildren = node.children && node.children.length > 0;
  const hasContent = node.docs > 0 || node.audio > 0;

  if (!filterTree(node, searchTerm)) return null;

  const handleClick = () => {
    if (hasContent) {
      onSetClick(node);
    } else if (hasChildren) {
      toggleFolder(node.id);
    }
  };

  const handleToggle = (e) => {
    e.stopPropagation();
    toggleFolder(node.id);
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-3 p-3 rounded-lg transition-all cursor-pointer group",
          hasContent ? "hover:bg-primary/10 hover:shadow-md" : "hover:bg-secondary/50",
          level === 0 && "bg-card border border-border"
        )}
        style={{ marginLeft: level * 16 }}
        onClick={handleClick}
      >
        {/* Expand/Collapse Toggle */}
        {hasChildren ? (
          <button onClick={handleToggle} className="p-1 hover:bg-secondary rounded shrink-0">
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <div className="w-6" />
        )}

        {/* Icon/Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-muted overflow-hidden shrink-0 flex items-center justify-center">
          {node.thumbnailData ? (
            <img src={node.thumbnailData} alt="" className="w-full h-full object-cover" />
          ) : hasContent ? (
            <BookOpen size={20} className="text-primary/50" />
          ) : (
            isExpanded ? <FolderOpen size={20} className="text-amber-500" /> : <Folder size={20} className="text-amber-500" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h3 className={cn("font-semibold truncate", hasContent && "group-hover:text-primary")}>{node.name}</h3>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {node.docs > 0 && <span className="flex items-center gap-1"><FileText size={12} /> {node.docs}</span>}
            {node.audio > 0 && <span className="flex items-center gap-1"><Volume2 size={12} /> {node.audio}</span>}
            {node.size > 0 && <span>{formatSize(node.size)}</span>}
          </div>
        </div>

        {/* Audio badge */}
        {node.audio > 0 && (
          <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-medium rounded-full">AUDIO</span>
        )}
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="mt-1">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              onSetClick={onSetClick}
              expandedFolders={expandedFolders}
              toggleFolder={toggleFolder}
              formatSize={formatSize}
              searchTerm={searchTerm}
              filterTree={filterTree}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LearningView({ set, onBack }) {
  const [currentDoc, setCurrentDoc] = useState(null);
  const [currentAudio, setCurrentAudio] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    // Initialize expanded groups
    const initial = {};
    if (set.structure) {
      set.structure.forEach((group, idx) => {
        initial[idx] = true;
      });
    }
    setExpandedGroups(initial);

    // Select first doc
    if (set.docs && set.docs.length > 0) {
      const pdf = set.docs.find(d => d.name.toLowerCase().endsWith('.pdf'));
      setCurrentDoc(pdf || set.docs[0]);
    }
    if (set.audio && set.audio.length > 0) {
      setCurrentAudio(set.audio[0]);
    }
  }, [set]);

  const toggleGroup = (idx) => {
    setExpandedGroups(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleNextAudio = () => {
    if (!set.audio || !currentAudio) return;
    const currentIndex = set.audio.findIndex(a => a.path === currentAudio.path);
    if (currentIndex < set.audio.length - 1) {
      setCurrentAudio(set.audio[currentIndex + 1]);
    }
  };

  const handlePrevAudio = () => {
    if (!set.audio || !currentAudio) return;
    const currentIndex = set.audio.findIndex(a => a.path === currentAudio.path);
    if (currentIndex > 0) {
      setCurrentAudio(set.audio[currentIndex - 1]);
    }
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Header */}
      <div className="h-14 border-b border-border flex items-center px-4 justify-between bg-card z-20 shadow-sm shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <button onClick={onBack} className="p-2 hover:bg-secondary rounded-full transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex flex-col min-w-0">
            <h2 className="font-semibold text-sm md:text-base truncate">{set.name}</h2>
            {currentDoc && <span className="text-xs text-muted-foreground truncate hidden md:block">{currentDoc.name}</span>}
          </div>
        </div>
        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-secondary rounded transition-colors">
          <Menu size={20} />
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Viewer */}
        <div className={cn("bg-muted/30 relative flex flex-col transition-all duration-300", isSidebarOpen ? 'w-full lg:w-3/4' : 'w-full')}>
          {currentDoc ? (
            <div className="flex-1 w-full h-full relative overflow-hidden">
              <DocViewer doc={currentDoc} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground flex-col gap-4">
              <BookOpen size={64} strokeWidth={1} />
              <p>Select a document to start reading</p>
            </div>
          )}
          <AudioBar
            currentAudio={currentAudio}
            playlist={set.audio}
            onSelect={setCurrentAudio}
            onNext={handleNextAudio}
            onPrev={handlePrevAudio}
          />
        </div>

        {/* Sidebar - Grouped */}
        <div className={cn("w-full lg:w-1/4 max-w-sm border-l border-border bg-card flex flex-col shrink-0 transition-all duration-300 absolute right-0 top-0 bottom-0 z-10 lg:static transform", isSidebarOpen ? 'translate-x-0 shadow-xl lg:shadow-none' : 'translate-x-full lg:hidden')}>
          <div className="p-4 border-b border-border font-medium flex justify-between items-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Contents</span>
            <span className="text-[10px] font-mono bg-primary/10 text-primary px-2 py-0.5 rounded-full">
              {set.docs?.length || 0} docs · {set.audio?.length || 0} audio
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {set.structure && set.structure.map((group, idx) => (
              <div key={idx} className="mb-2">
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(idx)}
                  className="w-full flex items-center gap-2 p-2 text-left hover:bg-secondary/50 rounded-lg transition-colors"
                >
                  {expandedGroups[idx] ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <FolderOpen size={14} className="text-amber-500" />
                  <span className="text-xs font-medium truncate flex-1">{group.folder || 'Root'}</span>
                  <span className="text-[10px] text-muted-foreground">{group.docs.length + group.audio.length}</span>
                </button>

                {/* Group Content */}
                {expandedGroups[idx] && (
                  <div className="ml-4 space-y-0.5">
                    {/* Docs */}
                    {group.docs.map(doc => (
                      <div
                        key={doc.path}
                        onClick={() => setCurrentDoc(doc)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                          currentDoc?.path === doc.path ? "bg-primary text-primary-foreground" : "hover:bg-secondary"
                        )}
                      >
                        <FileText size={14} />
                        <span className="truncate text-xs">{doc.name}</span>
                      </div>
                    ))}
                    {/* Audio */}
                    {group.audio.map((track, i) => (
                      <div
                        key={track.path}
                        onClick={() => setCurrentAudio(track)}
                        className={cn(
                          "flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all text-sm",
                          currentAudio?.path === track.path ? "bg-accent text-accent-foreground" : "hover:bg-secondary"
                        )}
                      >
                        <div className="w-5 h-5 flex items-center justify-center rounded bg-secondary text-[10px] font-mono shrink-0">
                          {i + 1}
                        </div>
                        <span className="truncate text-xs flex-1">{track.name}</span>
                        {currentAudio?.path === track.path && <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DocViewer({ doc }) {
  const [pdfUrl, setPdfUrl] = useState('');
  const isDocx = doc.name.toLowerCase().endsWith('.docx');

  useEffect(() => {
    async function loadPdfUrl() {
      if (window.api && !isDocx) {
        try {
          const url = await window.api.getFileUrl(doc.path);
          setPdfUrl(url);
        } catch (e) {
          console.error('Error getting file URL:', e);
        }
      }
    }
    loadPdfUrl();
  }, [doc, isDocx]);

  if (isDocx) {
    return (
      <div className="flex flex-col items-center justify-center h-full space-y-6 p-8 bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-background dark:to-muted/10">
        <div className="w-32 h-32 bg-white dark:bg-card rounded-2xl shadow-xl flex items-center justify-center text-blue-600 border">
          <FileText size={64} strokeWidth={1} />
        </div>
        <div className="text-center space-y-2 max-w-lg">
          <h3 className="text-2xl font-bold">{doc.name}</h3>
          <p className="text-muted-foreground">Open in Microsoft Word for best experience.</p>
        </div>
        <button
          onClick={() => window.api.openFileExternal(doc.path)}
          className="px-8 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all shadow-lg flex items-center gap-2 font-medium"
        >
          Open in Word <ArrowLeft size={16} className="rotate-180" />
        </button>
      </div>
    );
  }

  if (!pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return <iframe src={pdfUrl} className="w-full h-full border-none bg-white" title="PDF Viewer" />;
}

function AudioBar({ currentAudio, playlist, onSelect, onNext, onPrev }) {
  const [audioSrc, setAudioSrc] = useState('');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const audioRef = useRef(null);

  useEffect(() => {
    async function loadAudio() {
      if (window.api && currentAudio) {
        try {
          const dataUrl = await window.api.getAudioData(currentAudio.path);
          if (dataUrl) {
            setAudioSrc(dataUrl);
            setIsPlaying(true);
          }
        } catch (e) {
          console.error('Error loading audio:', e);
        }
      }
    }
    loadAudio();
  }, [currentAudio]);

  useEffect(() => {
    if (audioRef.current && audioSrc) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error('Play error:', e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, audioSrc]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleSeek = (e) => {
    const seekTime = (e.target.value / 100) * duration;
    if (audioRef.current) {
      audioRef.current.currentTime = seekTime;
      setCurrentTime(seekTime);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    if (onNext) onNext();
  };

  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!currentAudio) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="h-24 bg-card/95 backdrop-blur-md border-t border-border flex items-center px-6 shrink-0 shadow-[0_-8px_30px_rgba(0,0,0,0.06)] z-30">
      <audio
        ref={audioRef}
        src={audioSrc}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
      />

      <div className="w-full max-w-5xl mx-auto flex items-center gap-6">
        <div className="w-48 shrink-0 hidden md:block">
          <div className="font-semibold truncate text-sm">{currentAudio.name}</div>
          <div className="text-xs text-primary font-medium mt-0.5">Now Playing</div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="flex items-center justify-center gap-4">
            <button onClick={onPrev} className="p-2 text-muted-foreground hover:text-foreground">
              <SkipBack size={20} />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 shadow-lg"
            >
              {isPlaying ? <Pause size={18} /> : <Play size={18} className="ml-0.5" />}
            </button>
            <button onClick={onNext} className="p-2 text-muted-foreground hover:text-foreground">
              <SkipForward size={20} />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-10 text-right font-mono">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleSeek}
              className="flex-1 h-1 bg-secondary rounded-full appearance-none cursor-pointer accent-primary"
            />
            <span className="text-xs text-muted-foreground w-10 font-mono">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 w-32 justify-end hidden md:flex">
          <select
            value={playbackRate}
            onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
            className="bg-secondary text-xs rounded-lg px-2 py-1 cursor-pointer"
          >
            <option value={0.5}>0.5x</option>
            <option value={0.75}>0.75x</option>
            <option value={1}>1.0x</option>
            <option value={1.25}>1.25x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2.0x</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default App;
