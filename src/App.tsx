import { useState, useEffect, useRef, ChangeEvent, DragEvent } from 'react';
import { 
  FileText, 
  Upload, 
  DollarSign, 
  Calendar, 
  Building, 
  Tag, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Copy, 
  Check, 
  ArrowRight, 
  Download, 
  RefreshCw, 
  FileJson, 
  Layers, 
  Search, 
  History, 
  X,
  Edit,
  Database,
  CloudLightning,
  AlertTriangle,
  Info
} from "lucide-react";
import { SAMPLE_TEMPLATES } from "./templates";
import { ExtractedData, SavedRecord, SampleTemplate } from "./types";

export default function App() {
  // Config state
  const [supabaseConfig, setSupabaseConfig] = useState<{
    configured: boolean;
    supabaseUrl: string;
    hasKey: boolean;
  }>({
    configured: false,
    supabaseUrl: "",
    hasKey: false,
  });
  const [isCheckingConfig, setIsCheckingConfig] = useState<boolean>(true);
  const [missingTableError, setMissingTableError] = useState<boolean>(false);
  const [supabaseLoading, setSupabaseLoading] = useState<boolean>(false);

  // Input states
  const [rawText, setRawText] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  
  // App states
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [rawJsonResponse, setRawJsonResponse] = useState<string>("");
  const [copiedJsonText, setCopiedJsonText] = useState<boolean>(false);
  const [copiedSql, setCopiedSql] = useState<boolean>(false);
  
  // Ledger History state
  const [records, setRecords] = useState<SavedRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"parser" | "ledger">("parser");
  const [categoryFilter, setCategoryFilter] = useState<string>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  
  // Refined edit modes
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<ExtractedData>({
    date: "",
    amount: null,
    vendor: "",
    category: "",
    confidence_score: 1.0,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Load backend Supabase configuration and records on mount
  useEffect(() => {
    checkBackendAndLoad();
  }, []);

  const checkBackendAndLoad = async () => {
    setIsCheckingConfig(true);
    try {
      const configRes = await fetch("/api/config");
      const configData = await configRes.json();
      setSupabaseConfig(configData);

      if (configData.configured) {
        // Fetch from Supabase
        await fetchSupabaseRecords();
      } else {
        // Fallback to local storage
        loadLocalRecords();
      }
    } catch (e) {
      console.error("Config check failed, falling back to local storage", e);
      loadLocalRecords();
    } finally {
      setIsCheckingConfig(false);
    }
  };

  const loadLocalRecords = () => {
    const saved = localStorage.getItem("financial_parser_records");
    if (saved) {
      try {
        setRecords(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse local records", e);
      }
    }
  };

  const fetchSupabaseRecords = async () => {
    setSupabaseLoading(true);
    setMissingTableError(false);
    try {
      const response = await fetch("/api/records");
      const data = await response.json();
      if (data.success) {
        setRecords(data.records);
      } else {
        if (data.isMissingTable) {
          setMissingTableError(true);
        }
        // Fallback to local records as visual buffer
        loadLocalRecords();
      }
    } catch (error) {
      console.error("Failed to fetch Supabase records", error);
      loadLocalRecords();
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Preset Template loader
  const handleLoadTemplate = (template: SampleTemplate) => {
    setRawText(template.text);
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    setParseError(null);
  };

  // Convert image file to base64
  const processImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setParseError("Please upload an image file (PNG, JPG, JPEG, WEBP).");
      return;
    }

    setImageFile(file);
    setImageMimeType(file.type);
    setParseError(null);

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImagePreview(base64String);
      const base64Data = base64String.split(",")[1] || base64String;
      setImageBase64(base64Data);
    };
    reader.readAsDataURL(file);
  };

  // File Drop Handlers
  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounterRef.current = 0;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setImageMimeType(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Call the extraction API
  const handleParseDocument = async () => {
    if (!rawText.trim() && !imageBase64) {
      setParseError("Please enter receipt or invoice text, or upload an image first.");
      return;
    }

    setIsParsing(true);
    setParseError(null);
    setExtractedData(null);
    setRawJsonResponse("");

    try {
      const response = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: rawText,
          image: imageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || errorData.details || `Server responded with ${response.status}`);
      }

      const data: ExtractedData = await response.json();
      setExtractedData(data);
      setRawJsonResponse(JSON.stringify(data, null, 2));

      // Preset the editing override form fields
      setEditForm({
        date: data.date || "",
        amount: data.amount,
        vendor: data.vendor || "",
        category: data.category || "Miscellaneous",
        confidence_score: data.confidence_score !== null ? data.confidence_score : 1.0,
      });

    } catch (error: any) {
      console.error(error);
      setParseError(error.message || "Something went wrong while parsing the document via Gemini.");
    } finally {
      setIsParsing(false);
    }
  };

  // Save the record - support either LocalStorage or Supabase
  const handleSaveToLedger = async () => {
    if (!extractedData) return;

    const newRecord: SavedRecord = {
      id: "rec_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
      date: editForm.date || extractedData.date,
      amount: editForm.amount !== null ? Number(editForm.amount) : extractedData.amount,
      vendor: editForm.vendor || extractedData.vendor,
      category: editForm.category || extractedData.category || "Miscellaneous",
      confidence_score: editForm.confidence_score !== null ? Number(editForm.confidence_score) : extractedData.confidence_score,
      sourceText: rawText ? rawText.substring(0, 300) + (rawText.length > 300 ? "..." : "") : undefined,
      sourceImageName: imageFile ? imageFile.name : undefined,
      parsedAt: new Date().toISOString(),
    };

    if (supabaseConfig.configured && !missingTableError) {
      setSupabaseLoading(true);
      try {
        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newRecord),
        });

        const data = await res.json();
        if (data.success) {
          // Success! Refetch records
          await fetchSupabaseRecords();
          showNotification("Logged successfully to Supabase!", "bg-teal-600");
          setActiveTab("ledger");
        } else {
          throw new Error(data.error || "Save endpoint failed.");
        }
      } catch (error: any) {
        console.error("Supabase write failed, writing locally as fallback", error);
        saveLocalRecord(newRecord);
        showNotification("Supabase error. Saved locally instead.", "bg-amber-600");
        setActiveTab("ledger");
      } finally {
        setSupabaseLoading(false);
      }
    } else {
      saveLocalRecord(newRecord);
      showNotification("Saved successfully to Local Storage Ledger!", "bg-indigo-650");
      setActiveTab("ledger");
    }
  };

  const saveLocalRecord = (record: SavedRecord) => {
    const updated = [record, ...records];
    setRecords(updated);
    localStorage.setItem("financial_parser_records", JSON.stringify(updated));
  };

  // Helper notification bubble
  const showNotification = (message: string, bgColorClass: string) => {
    const notification = document.createElement("div");
    notification.className = `fixed bottom-5 right-5 ${bgColorClass} text-white px-5 py-3 rounded-xl shadow-xl z-50 flex items-center gap-2 text-sm font-medium animate-bounce border border-white/10`;
    notification.innerHTML = `<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"></path></svg> ${message}`;
    document.body.appendChild(notification);
    setTimeout(() => {
      notification.classList.add("opacity-0");
      setTimeout(() => notification.remove(), 500);
    }, 3000);
  };

  // Manual Row Editing within Ledger Tab
  const handleStartEdit = (record: SavedRecord) => {
    setEditingRecordId(record.id);
    setEditForm({
      date: record.date || "",
      amount: record.amount,
      vendor: record.vendor || "",
      category: record.category || "Miscellaneous",
      confidence_score: record.confidence_score,
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (supabaseConfig.configured && !missingTableError) {
      setSupabaseLoading(true);
      try {
        const res = await fetch(`/api/records/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editForm),
        });

        const data = await res.json();
        if (data.success) {
          await fetchSupabaseRecords();
          showNotification("Record updated in Supabase!", "bg-teal-600");
          setEditingRecordId(null);
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Supabase update fail, update offline", error);
        updateOfflineRecord(id);
      } finally {
        setSupabaseLoading(false);
      }
    } else {
      updateOfflineRecord(id);
    }
  };

  const updateOfflineRecord = (id: string) => {
    const updated = records.map((rec) => {
      if (rec.id === id) {
        return {
          ...rec,
          date: editForm.date || null,
          amount: editForm.amount !== null ? Number(editForm.amount) : null,
          vendor: editForm.vendor || null,
          category: editForm.category || "Miscellaneous",
          confidence_score: editForm.confidence_score !== null ? Number(editForm.confidence_score) : null,
        };
      }
      return rec;
    });
    setRecords(updated);
    localStorage.setItem("financial_parser_records", JSON.stringify(updated));
    showNotification("Record updated locally!", "bg-indigo-600");
    setEditingRecordId(null);
  };

  // Deleting records
  const handleDeleteRecord = async (id: string) => {
    if (!confirm("Are you sure you want to delete this ledger entry?")) return;

    if (supabaseConfig.configured && !missingTableError) {
      setSupabaseLoading(true);
      try {
        const res = await fetch(`/api/records/${id}`, { method: "DELETE" });
        const data = await res.json();
        if (data.success) {
          await fetchSupabaseRecords();
          showNotification("Record deleted from Supabase!", "bg-rose-600");
        } else {
          throw new Error(data.error);
        }
      } catch (error) {
        console.error("Supabase delete failed, fallback to local", error);
        removeRecordFromState(id);
      } finally {
        setSupabaseLoading(false);
      }
    } else {
      removeRecordFromState(id);
    }
  };

  const removeRecordFromState = (id: string) => {
    const remaining = records.filter((rec) => rec.id !== id);
    setRecords(remaining);
    localStorage.setItem("financial_parser_records", JSON.stringify(remaining));
    showNotification("Record removed locally!", "bg-rose-650");
  };

  // Clean all cache
  const handleClearAllRecords = () => {
    if (confirm("Are you sure you want to purge records? This clears your offline LocalStorage.")) {
      setRecords([]);
      localStorage.removeItem("financial_parser_records");
      showNotification("LocalStorage ledger cleared!", "bg-slate-700");
    }
  };

  // Migrate locally stored records to Supabase
  const handleMigrateToSupabase = async () => {
    const localSaved = localStorage.getItem("financial_parser_records");
    if (!localSaved) {
      alert("No offline records found to migrate.");
      return;
    }
    const localRecords = JSON.parse(localSaved) as SavedRecord[];
    if (localRecords.length === 0) {
      alert("No offline records found to migrate.");
      return;
    }

    if (!confirm(`Do you wish to copy all ${localRecords.length} offline records over to your cloud Supabase database?`)) {
      return;
    }

    setSupabaseLoading(true);
    let successCount = 0;
    try {
      for (const rec of localRecords) {
        const res = await fetch("/api/records", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(rec),
        });
        const data = await res.json();
        if (data.success) successCount++;
      }
      
      // Clean up transferred files
      localStorage.removeItem("financial_parser_records");
      await fetchSupabaseRecords();
      showNotification(`Successfully migrated ${successCount} entries!`, "bg-emerald-600");
    } catch (e) {
      console.error("Batch migration failed partially", e);
      showNotification("Migration failed or partial.", "bg-rose-600");
    } finally {
      setSupabaseLoading(false);
    }
  };

  // Download raw ledger details as CSV format
  const handleExportCSV = () => {
    if (records.length === 0) return;
    
    const headers = ["ID", "Parsed At", "Transaction Date", "Vendor", "Category", "Amount", "Confidence Score", "Source Information"];
    const rows = records.map(rec => [
      rec.id,
      rec.parsedAt,
      rec.date || "N/A",
      `"${(rec.vendor || "N/A").replace(/"/g, '""')}"`,
      rec.category || "N/A",
      rec.amount || "0.00",
      rec.confidence_score || "0.0",
      `"${(rec.sourceImageName || rec.sourceText || "Pasted Unstructured Text").substring(0, 100).replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `FinExtract_Ledger_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy helper
  const handleCopyText = (text: string, isSql: boolean = false) => {
    navigator.clipboard.writeText(text);
    if (isSql) {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    } else {
      setCopiedJsonText(true);
      setTimeout(() => setCopiedJsonText(false), 2000);
    }
  };

  // Calculation parameters
  const totalExpenses = records
    .filter(r => r.amount !== null && !isNaN(r.amount))
    .reduce((sum, r) => sum + (r.amount || 0), 0);

  const averageConfidence = records.length > 0 
    ? (records.reduce((sum, r) => sum + (r.confidence_score || 0), 0) / records.length * 100).toFixed(0)
    : "0";

  // Filter lists & Query matches
  const filteredRecords = records.filter((rec) => {
    const matchesCategory = categoryFilter === "All" || rec.category === categoryFilter;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (rec.vendor && rec.vendor.toLowerCase().includes(searchLower)) ||
      (rec.category && rec.category.toLowerCase().includes(searchLower)) ||
      (rec.date && rec.date.includes(searchLower)) ||
      (rec.amount && rec.amount.toString().includes(searchLower));
    return matchesCategory && matchesSearch;
  });

  const getConfidenceBadgeColor = (score: number | null) => {
    if (score === null) return "bg-slate-850 text-slate-400 border-slate-750";
    if (score >= 0.85) return "bg-emerald-950/40 text-emerald-400 border-emerald-900/30";
    if (score >= 0.6) return "bg-amber-950/40 text-amber-400 border-amber-900/30";
    return "bg-rose-950/40 text-rose-400 border-rose-900/30";
  };

  const getCategoryBadgeColor = (cat: string | null) => {
    switch (cat) {
      case "Software/SaaS": return "bg-blue-950/40 text-blue-400 border-blue-900/30";
      case "Travel": return "bg-indigo-950/40 text-indigo-400 border-indigo-900/30";
      case "Meals & Entertainment": return "bg-amber-950/40 text-amber-400 border-amber-900/30";
      case "Office Supplies": return "bg-purple-950/40 text-purple-400 border-purple-900/30";
      case "Utilities": return "bg-teal-950/40 text-teal-400 border-teal-900/30";
      case "Marketing": return "bg-rose-950/40 text-rose-400 border-rose-900/30";
      default: return "bg-slate-900 text-slate-350 border-slate-800";
    }
  };

  // Script target helper
  const sqlSetupScript = `create table financial_records (
  id text primary key,
  date text,
  amount numeric,
  vendor text,
  category text,
  confidence_score numeric,
  source_text text,
  source_image_name text,
  parsed_at timestamp with time zone default timezone('utc'::text, now())
);`;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col" id="main_container">
      {/* Visual Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 py-4 px-6 shadow-md" id="header_section">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="flex items-center gap-3">
            <div className="bg-teal-500/10 text-teal-400 p-2.5 rounded-xl border border-teal-500/20" id="app_logo_wrapper">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                FinExtract <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono">Supabase Linked</span>
              </h1>
              <p className="text-xs text-slate-400">Intelligent PDF, Receipt & Invoice OCR Document Parsing Core</p>
            </div>
          </div>
          
          {/* Main Tabs */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-850" id="navigation_tabs">
            <button
              id="tab_parser_btn"
              onClick={() => setActiveTab("parser")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === "parser"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Extraction Panel
            </button>
            <button
              id="tab_ledger_btn"
              onClick={() => setActiveTab("ledger")}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all relative ${
                activeTab === "ledger"
                  ? "bg-teal-600 text-white shadow-md shadow-teal-900/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Dynamic Ledger
              {records.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-teal-500 text-slate-950 text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold font-mono">
                  {records.length}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Integration Status Ribbon */}
      <div className="bg-slate-900/40 border-b border-slate-850/60 py-2.5 px-6" id="supabase_integration_ribbon">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          
          <div className="flex items-center gap-2 text-slate-300">
            <Database className="w-4 h-4 text-teal-400" />
            <span className="font-semibold text-slate-200">Database Engine status:</span>
            {isCheckingConfig ? (
              <span className="text-slate-500 italic flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" /> checking environment...
              </span>
            ) : supabaseConfig.configured ? (
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-full bg-teal-550/15 text-teal-405 font-mono border border-teal-500/20 text-[10px]">
                  Supabase Cloud Active
                </span>
                <span className="text-slate-500 truncate max-w-[200px] sm:max-w-md hidden sm:inline">
                  ({supabaseConfig.supabaseUrl})
                </span>
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-slate-700 text-[10px]">
                Browser LocalStorage Mode
              </span>
            )}
          </div>

          {!isCheckingConfig && (
            <div className="flex items-center gap-2">
              {supabaseConfig.configured ? (
                <>
                  {missingTableError ? (
                    <div className="flex items-center gap-1 bg-amber-950/40 border border-amber-900/40 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                      <AlertTriangle className="w-3 h-3 text-amber-400" /> Table missing!
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-emerald-400 text-[10px] bg-emerald-950/20 border border-emerald-900/30 px-2.5 py-0.5 rounded">
                      <CloudLightning className="w-3 h-3" /> Real-time Cloud Sync is Active
                    </div>
                  )}
                  {localStorage.getItem("financial_parser_records") && (
                    <button
                      onClick={handleMigrateToSupabase}
                      className="bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20 transition-all px-2.5 py-1 rounded text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      Migrate Local Data to Cloud
                    </button>
                  )}
                </>
              ) : (
                <div className="text-[10px] text-slate-500 flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-indigo-400" />
                  <span>How to link Supabase? Add <b>SUPABASE_URL</b> and <b>SUPABASE_KEY</b> env configs.</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Body Grid */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex-1 w-full" id="main_content_area">
        
        {/* Supabase Missing Table alert prompt */}
        {missingTableError && (
          <div className="mb-6 p-5 bg-amber-950/30 border border-amber-850 text-slate-300 rounded-xl space-y-3" id="missing_database_table_alert">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-semibold text-white">Supabase Schema Action Required!</h3>
                <p className="text-xs text-slate-400 mt-1">
                  We connected to your Supabase credentials! However, the target table <code className="text-amber-300 font-mono text-[11px] bg-slate-900 px-1 py-0.5 rounded">financial_records</code> does not exist in your Supabase database yet.
                </p>
              </div>
            </div>
            
            <div className="bg-slate-900 border border-slate-850 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-semibold text-slate-400 font-mono">Execute on Supabase (SQL Editor panel):</span>
                <button
                  onClick={() => handleCopyText(sqlSetupScript, true)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-0.5 text-[10px] rounded flex items-center gap-1"
                >
                  {copiedSql ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy SQL</>}
                </button>
              </div>
              <pre className="text-[10px] text-amber-300/90 font-mono overflow-x-auto leading-relaxed max-h-[120px]">
                {sqlSetupScript}
              </pre>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSupabaseRecords}
                className="bg-teal-650 hover:bg-teal-700 text-slate-950 px-3 py-1.5 rounded text-xs font-semibold flex items-center gap-1 transition-all"
              >
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Verify Connection Again
              </button>
              <button
                onClick={() => setMissingTableError(false)}
                className="text-slate-400 text-xs hover:text-white"
              >
                Browse offline for now
              </button>
            </div>
          </div>
        )}

        {activeTab === "parser" ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="parser_tab_grid">
            
            {/* LEFT COLUMN: Input controls & presets (7 cols) */}
            <div className="lg:col-span-7 space-y-6" id="parser_input_panel">
              <div className="bg-slate-900 rounded-2xl border border-slate-805/65 p-6 shadow-xl relative overflow-hidden" id="input_card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl text-none" />
                
                <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                  Input Financial Artifact
                </h2>
                <p className="text-xs text-slate-400 mb-5">
                  Supply either plain OCR receipt dumps, invoicing text emails, Ledger logs, or drop receipts screenshots.
                </p>

                {/* Preset Templates */}
                <div className="mb-6" id="presets_container">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-305 flex items-center gap-1.5 font-mono">
                      <Layers className="w-3.5 h-3.5 text-teal-405" /> Pick a Sandbox Template
                    </span>
                    <span className="text-[10px] text-slate-500">Fast multi-line mock sets</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2" id="preset_buttons_grid">
                    {SAMPLE_TEMPLATES.map((sample) => (
                      <button
                        key={sample.id}
                        id={`btn_preset_${sample.id}`}
                        onClick={() => handleLoadTemplate(sample)}
                        className="text-left p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-teal-500/40 hover:bg-slate-900/40 transition-all text-xs group"
                      >
                        <div className="font-semibold text-slate-300 group-hover:text-teal-400 flex items-center justify-between">
                          <span className="truncate">{sample.name.split(" ")[0]} {sample.name.split(" ")[1] || ""}</span>
                          <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-teal-400" />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{sample.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload (Drag & Drop) */}
                <div className="mb-5" id="file_drag_container">
                  <span className="block text-xs font-semibold text-slate-300 mb-2 font-mono">
                    Receipt / Invoice Snapshot (Optional Visual Scanning)
                  </span>
                  
                  <div
                    onDragEnter={handleDragEnter}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                      isDragging
                        ? "border-teal-400 bg-teal-500/10 scale-[1.01]"
                        : imagePreview
                        ? "border-teal-500/40 bg-slate-950/60"
                        : "border-slate-800 hover:border-slate-700 bg-slate-950/30 hover:bg-slate-950/50"
                    }`}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/*"
                      className="hidden"
                    />

                    {imagePreview ? (
                      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
                        <div className="relative mx-auto max-w-[140px] rounded-lg overflow-hidden border border-slate-800 shadow-md">
                          <img src={imagePreview} alt="Receipt preview" className="w-full max-h-[120px] object-contain bg-slate-950" />
                          <button
                            onClick={handleRemoveImage}
                            className="absolute top-1 right-1 bg-rose-650 hover:bg-rose-750 text-white p-1 rounded-full shadow-lg transition-colors"
                            title="Remove image"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-slate-300 font-mono">
                          {imageFile?.name} <span className="text-slate-600">({(imageFile!.size / 1024).toFixed(0)} KB)</span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-2">
                        <div className="mx-auto w-8 h-8 rounded-full bg-slate-900 flex items-center justify-center text-slate-400 border border-slate-800">
                          <Upload className="w-4 h-4 text-teal-400" />
                        </div>
                        <div className="text-xs text-slate-300">
                          <span className="text-teal-400 font-semibold underline">Click to upload</span> or drag and drop image here
                        </div>
                        <p className="text-[10px] text-slate-500">PNG, JPG, JPEG or WEBP supported</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Plain Text Editor Area */}
                <div className="space-y-2" id="textarea_container">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-300 font-mono">
                      Raw Invoice Text or OCR dump
                    </span>
                    <span className="text-slate-500 font-mono">
                      {rawText.length} characters
                    </span>
                  </div>
                  
                  <div className="relative">
                    <textarea
                      id="raw_text_input"
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Paste financial email receipt text, unformatted invoice CSV strings, restaurant checkout text, or invoice descriptors..."
                      className="w-full h-52 bg-slate-950 border border-slate-850 rounded-xl p-4 text-[11px] font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-teal-500/50 transition-all resize-none"
                    />
                    
                    {rawText && (
                      <button
                        onClick={() => setRawText("")}
                        className="absolute bottom-3 right-3 bg-slate-900 hover:bg-slate-800 text-slate-450 hover:text-white px-2 py-1 rounded text-[10px] transition-all border border-slate-800"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                {/* Error Box */}
                {parseError && (
                  <div className="mt-4 p-4 bg-rose-950/30 border border-rose-900/40 rounded-xl flex items-start gap-3 text-xs text-rose-350 animate-bounce" id="error_container">
                    <AlertCircle className="w-4 h-4 text-rose-405 mt-0.5 shrink-0" />
                    <div>
                      <span className="font-semibold">Processing Error:</span> {parseError}
                    </div>
                  </div>
                )}

                {/* Submit Extraction Button */}
                <div className="mt-4">
                  <button
                    id="trigger_parse_btn"
                    onClick={handleParseDocument}
                    disabled={isParsing || (!rawText.trim() && !imageBase64)}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                      isParsing
                        ? "bg-slate-900 text-slate-500 cursor-not-allowed"
                        : (!rawText.trim() && !imageBase64)
                        ? "bg-slate-900 text-slate-500 cursor-not-allowed border border-slate-850"
                        : "bg-teal-600 hover:bg-teal-700 text-slate-950 font-bold tracking-brand cursor-pointer"
                    }`}
                  >
                    {isParsing ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-teal-400" />
                        Scanning content with Gemini 3.5 Flash...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                        Extract Structuring Attributes
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN: Results Section (5 cols) */}
            <div className="lg:col-span-5 space-y-6" id="parser_results_panel">
              <div className="bg-slate-900 rounded-2xl border border-slate-850 p-6 shadow-xl relative min-h-[440px] flex flex-col justify-between overflow-hidden" id="results_card">
                <div className="absolute top-0 right-0 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl text-none" />
                
                <div>
                  <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-3">
                    <h2 className="text-sm font-bold text-white flex items-center gap-1.5">
                      Extracted Structured Schema
                    </h2>
                    {extractedData && (
                      <span className="text-[9px] px-2 py-0.5 rounded bg-teal-500/10 text-teal-400 border border-teal-500/20 font-mono uppercase font-bold">
                        Parsed
                      </span>
                    )}
                  </div>

                  {!extractedData && !isParsing ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500 space-y-3" id="empty_extractor_placeholder">
                      <div className="bg-slate-950 absolute rounded-full border border-slate-850 p-4 shrink-0 relative">
                        <FileText className="w-6 h-6 text-slate-600" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-300">No Structured Data Yet</p>
                        <p className="text-[11px] text-slate-500 mt-1 max-w-[240px] mx-auto">
                          Select a quick-preset document template or paste custom receipts text and process it.
                        </p>
                      </div>
                    </div>
                  ) : isParsing ? (
                    <div className="py-24 text-center space-y-3" id="loader_placeholder">
                      <div className="relative w-10 h-10 mx-auto">
                        <div className="absolute inset-0 rounded-full border-2 border-teal-500/15" />
                        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-teal-500 animate-spin" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-slate-300 leading-none">Normalizing Values...</h4>
                        <p className="text-[10px] text-slate-500 mt-1">Structured JSON formatting in process API</p>
                      </div>
                    </div>
                  ) : (
                    /* ATTRIBUTES EXTRACTED VIEW */
                    <div className="space-y-4 animate-fade-in" id="attributes_display_view">
                      
                      {/* Vendor Card */}
                      <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 relative overflow-hidden">
                        <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Vendor Ident</span>
                        <div className="flex justify-between items-center mt-1">
                          <h3 className="text-sm font-bold text-teal-400">
                            {extractedData.vendor || <span className="text-slate-600 italic">Unidentified</span>}
                          </h3>
                          <Building className="w-3.5 h-3.5 text-slate-500" />
                        </div>
                      </div>

                      {/* Side-by-Side Date and Amount */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Date</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-semibold text-slate-200">
                              {extractedData.date || <span className="text-slate-600 italic">None</span>}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Numerical Amount</span>
                          <div className="flex items-center gap-1.5 mt-1">
                            <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                            <span className="text-xs font-bold text-teal-300">
                              {extractedData.amount !== null ? extractedData.amount.toFixed(2) : <span className="text-slate-600 italic">N/A</span>}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Category & Confidence Side-by-Side */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Classified Category</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeColor(extractedData.category)}`}>
                              {extractedData.category || "Miscellaneous"}
                            </span>
                          </div>
                        </div>

                        <div className="bg-slate-950 border border-slate-850 rounded-xl p-3">
                          <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider font-mono">Certainty Score</span>
                          <div className="mt-1">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold border ${getConfidenceBadgeColor(extractedData.confidence_score)}`}>
                              {extractedData.confidence_score !== null && extractedData.confidence_score !== undefined
                                ? (extractedData.confidence_score * 100).toFixed(0) + "% Conf" 
                                : "N/A"
                              }
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Form Edit Override inputs for Manual Refinements */}
                      <div className="border border-slate-850 bg-slate-950/60 rounded-xl p-3 space-y-2">
                        <div className="text-[9px] uppercase font-bold tracking-wider text-slate-500 font-mono">
                          Attribute Manual Override Refiner
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[8px] text-slate-500 font-mono mb-0.5">Vendor Name:</label>
                            <input
                              type="text"
                              value={editForm.vendor || ""}
                              onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-500 font-mono mb-0.5">Numeric Value:</label>
                            <input
                              type="number"
                              step="0.01"
                              value={editForm.amount !== null ? editForm.amount : ""}
                              onChange={(e) => setEditForm({ ...editForm, amount: e.target.value !== "" ? parseFloat(e.target.value) : null })}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-500 font-mono mb-0.5">Date String:</label>
                            <input
                              type="text"
                              placeholder="YYYY-MM-DD"
                              value={editForm.date || ""}
                              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded p-1 text-slate-200 font-mono focus:outline-none focus:border-teal-500"
                            />
                          </div>
                          <div>
                            <label className="block text-[8px] text-slate-500 font-mono mb-0.5">Category Class:</label>
                            <select
                              value={editForm.category || "Miscellaneous"}
                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                              className="w-full bg-slate-900 border border-slate-800 text-[10px] rounded p-1 text-slate-200 focus:outline-none focus:border-teal-500"
                            >
                              <option value="Software/SaaS">Software/SaaS</option>
                              <option value="Travel">Travel</option>
                              <option value="Meals & Entertainment">Meals & Entertainment</option>
                              <option value="Office Supplies">Office Supplies</option>
                              <option value="Utilities">Utilities</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Miscellaneous">Miscellaneous</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Raw JSON Target Display */}
                      <div className="space-y-1.5" id="json_code_output_wrapper">
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span className="flex items-center gap-1"><FileJson className="w-3.5 h-3.5 text-teal-500" /> API Target JSON Payload</span>
                          <button
                            onClick={() => handleCopyText(rawJsonResponse)}
                            className="text-slate-500 hover:text-white transition-all text-[9.5px] flex items-center gap-0.5 font-mono cursor-pointer"
                          >
                            {copiedJsonText ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy Out</>}
                          </button>
                        </div>
                        <pre className="text-[10px] text-emerald-400 bg-slate-950 p-2.5 rounded-lg overflow-x-auto border border-slate-850 h-28 leading-relaxed font-mono">
                          {rawJsonResponse}
                        </pre>
                      </div>

                    </div>
                  )}
                </div>

                {extractedData && (
                  <div className="mt-5 pt-4 border-t border-slate-850" id="results_save_actions">
                    <button
                      id="save_to_ledger_btn"
                      onClick={handleSaveToLedger}
                      disabled={supabaseLoading}
                      className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 hover:shadow-lg hover:shadow-teal-900/10 cursor-pointer transition-all"
                    >
                      {supabaseLoading ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving record to cloud...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Commit Record to Financial Ledger
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

          </div>
        ) : (
          /* LEDGER TAB VIEW */
          <div className="space-y-6 animate-fade-in" id="ledger_tab_view">
            
            {/* Quick Analytics ribbon */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="analytics_ribbon">
              
              <div className="bg-slate-900 p-5 rounded-xl border border-slate-850 relative overflow-hidden" id="analytics_stat_1">
                <div className="absolute right-3 top-3 text-emerald-500/5"><DollarSign className="w-12 h-12" /></div>
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider font-mono">Cumulative Logged Spend</span>
                <span className="text-xl font-extrabold text-teal-400 mt-2 block font-mono">
                  ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Aggregating structured transactions</span>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-850 relative overflow-hidden" id="analytics_stat_2">
                <div className="absolute right-3 top-3 text-teal-500/5"><Sparkles className="w-12 h-12" /></div>
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider font-mono">Receipts Database Size</span>
                <span className="text-xl font-extrabold text-white mt-2 block font-mono">
                  {records.length} <span className="text-xs font-normal text-slate-450">files</span>
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">
                  {supabaseConfig.configured ? "Linked to active Supabase schema" : "Stored in local browser sandbox"}
                </span>
              </div>

              <div className="bg-slate-900 p-5 rounded-xl border border-slate-850 relative overflow-hidden animate-pulse-slow" id="analytics_stat_3">
                <div className="absolute right-3 top-3 text-indigo-500/5"><CloudLightning className="w-12 h-12" /></div>
                <span className="text-[10px] text-slate-450 font-bold block uppercase tracking-wider font-mono">Model Consistency Rating</span>
                <span className="text-xl font-extrabold text-indigo-400 mt-2 block font-mono">
                  {averageConfidence}%
                </span>
                <span className="text-[10px] text-slate-500 block mt-1">Average confidence feedback</span>
              </div>

            </div>

            {/* Filter Options box */}
            <div className="bg-slate-900 rounded-xl border border-slate-850 p-4 flex flex-col md:flex-row gap-3 items-center justify-between" id="filter_options_box">
              <div className="flex flex-col sm:flex-row gap-2.5 w-full md:w-auto">
                
                {/* Search */}
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search by vendor, amount or category..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 text-xs rounded-lg pl-9 pr-4 py-1.5 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500/50"
                  />
                </div>

                {/* Dropdown Filter */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-slate-400 shrink-0">Category:</span>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="bg-slate-950 border border-slate-850 text-xs rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-teal-500/50"
                  >
                    <option value="All">All Categories</option>
                    <option value="Software/SaaS">Software/SaaS</option>
                    <option value="Travel">Travel</option>
                    <option value="Meals & Entertainment">Meals & Entertainment</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Utilities">Utilities</option>
                    <option value="Marketing">Marketing</option>
                    <option value="Miscellaneous">Miscellaneous</option>
                  </select>
                </div>
              </div>

              {/* Action buttons */}
              {records.length > 0 && (
                <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleExportCSV}
                    className="px-3 py-1.5 bg-slate-950 hover:bg-slate-900 text-slate-350 hover:text-white rounded-lg text-xs flex items-center gap-1.5 transition-all border border-slate-850 font-medium cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-teal-400" /> Export Ledger CSV
                  </button>
                  
                  {!supabaseConfig.configured && (
                    <button
                      onClick={handleClearAllRecords}
                      className="px-3 py-1.5 bg-rose-955/20 hover:bg-rose-950/40 text-rose-300 rounded-lg text-xs flex items-center gap-1 transition-all border border-rose-900/20 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Purge Cache Records
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Main Ledger Table */}
            <div className="bg-slate-900 rounded-2xl border border-slate-850 overflow-hidden shadow-xl" id="ledger_table_card">
              {filteredRecords.length === 0 ? (
                <div className="p-16 text-center text-slate-500 space-y-3" id="ledger_empty_view">
                  <History className="w-8 h-8 text-slate-700 mx-auto" />
                  <div>
                    <h4 className="text-xs font-semibold text-slate-300">No Ledger rows found</h4>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-[280px] mx-auto">
                      {records.length === 0 
                        ? "Process financial text artifacts and click Save to construct a gorgeous cloud/local ledger dashboard."
                        : "No transactions match your current search query or categories filter choices."}
                    </p>
                  </div>
                  {records.length === 0 && (
                    <button
                      onClick={() => setActiveTab("parser")}
                      className="text-xs text-teal-400 hover:text-teal-350 underline inline-flex items-center gap-1 outline-none"
                    >
                      Process high-precision document now <ArrowRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ) : (
                <div className="overflow-x-auto" id="table_wrap">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-850 bg-slate-950/50 text-slate-400 font-semibold font-mono uppercase tracking-wider text-[9px]">
                        <th className="p-4">Vendor Name</th>
                        <th className="p-4">Business Category</th>
                        <th className="p-4">Txn Date</th>
                        <th className="p-4 text-right">Raw Amount</th>
                        <th className="p-4">Certainty</th>
                        <th className="p-4 text-right">Table Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-850/60">
                      {filteredRecords.map((item) => {
                        const isEditing = editingRecordId === item.id;
                        
                        return (
                          <tr key={item.id} className="hover:bg-slate-955/30 transition-colors" id={`row_${item.id}`}>
                            {/* Vendor column */}
                            <td className="p-4 font-semibold text-slate-200">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.vendor || ""}
                                  onChange={(e) => setEditForm({ ...editForm, vendor: e.target.value })}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs w-full text-teal-300"
                                />
                              ) : (
                                <span className="flex items-center gap-1.5">
                                  {item.vendor || <span className="text-slate-600 italic">None determined</span>}
                                  {item.sourceImageName && (
                                    <span 
                                      className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-550 border border-amber-500/20" 
                                      title={`Parsed from file: ${item.sourceImageName}`}
                                    >
                                      OCR Image
                                    </span>
                                  )}
                                </span>
                              )}
                            </td>

                            {/* Category column */}
                            <td className="p-4">
                              {isEditing ? (
                                <select
                                  value={editForm.category || "Miscellaneous"}
                                  onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs w-full text-white"
                                >
                                  <option value="Software/SaaS">Software/SaaS</option>
                                  <option value="Travel">Travel</option>
                                  <option value="Meals & Entertainment">Meals & Entertainment</option>
                                  <option value="Office Supplies">Office Supplies</option>
                                  <option value="Utilities">Utilities</option>
                                  <option value="Marketing">Marketing</option>
                                  <option value="Miscellaneous">Miscellaneous</option>
                                </select>
                              ) : (
                                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold border ${getCategoryBadgeColor(item.category)}`}>
                                  {item.category || "Miscellaneous"}
                                </span>
                              )}
                            </td>

                            {/* Date column */}
                            <td className="p-4 text-slate-350 font-mono">
                              {isEditing ? (
                                <input
                                  type="text"
                                  value={editForm.date || ""}
                                  onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                  placeholder="YYYY-MM-DD"
                                  className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs w-full text-white font-mono"
                                />
                              ) : (
                                item.date || <span className="text-slate-650 italic">None</span>
                              )}
                            </td>

                            {/* Amount column */}
                            <td className="p-4 text-right font-bold text-teal-300 font-mono">
                              {isEditing ? (
                                <input
                                  type="number"
                                  step="0.01"
                                  value={editForm.amount !== null ? editForm.amount : ""}
                                  onChange={(e) => setEditForm({ ...editForm, amount: e.target.value !== "" ? parseFloat(e.target.value) : null })}
                                  className="bg-slate-955 border border-slate-800 rounded px-2 py-1 text-xs text-right w-full text-white font-mono"
                                />
                              ) : (
                                item.amount !== null ? `$${item.amount.toFixed(2)}` : <span className="text-slate-650 italic">N/A</span>
                              )}
                            </td>

                            {/* Confidence rating */}
                            <td className="p-4">
                              {isEditing ? (
                                <span className="text-slate-500 text-[11px]">System Locked</span>
                              ) : (
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-semibold border ${getConfidenceBadgeColor(item.confidence_score)}`}>
                                  {item.confidence_score !== null 
                                    ? (item.confidence_score * 100).toFixed(0) + "% Sure" 
                                    : "0%"
                                  }
                                </span>
                              )}
                            </td>

                            {/* Actions Column */}
                            <td className="p-4 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-2 text-xs">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleSaveEdit(item.id)}
                                      className="px-2 py-1 bg-teal-600 text-slate-950 rounded hover:bg-teal-700 font-bold transition-all"
                                    >
                                      Save
                                    </button>
                                    <button
                                      onClick={() => setEditingRecordId(null)}
                                      className="px-2 py-1 bg-slate-800 text-slate-400 rounded hover:bg-slate-700 transition-all font-mono"
                                    >
                                      Cancel
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => handleStartEdit(item)}
                                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition-colors"
                                      title="Edit attributes manually"
                                    >
                                      <Edit className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteRecord(item.id)}
                                      className="p-1 hover:bg-slate-800 text-rose-450 hover:text-rose-400 rounded transition-colors"
                                      title="Delete record logs"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Config & SQL Sandbox Help Card */}
            <div className="bg-slate-900 border border-slate-850 p-5 rounded-xl space-y-4" id="supabase_ledger_guide_section">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-teal-400 shrink-0" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                  Advanced database mapping commands guide
                </h3>
              </div>
              <p className="text-xs text-slate-450">
                FinExtract lets you host this data on high-performance cloud databases. Since your backend supports active proxying, you can configure your Supabase variables cleanly.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-medium" id="configs_guidelist">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-2">
                  <span className="text-teal-400 text-[10px] font-bold uppercase tracking-widest font-mono block">1. Environment variables required</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Set these in your project settings secrets panel or the local environment configuration:
                  </p>
                  <pre className="text-[10px] text-slate-400 bg-slate-900/60 p-2 rounded border border-slate-800 leading-normal font-mono">
                    SUPABASE_URL=your-supabase-project-url<br/>
                    SUPABASE_KEY=your-supabase-public-anon-key
                  </pre>
                </div>

                <div className="bg-slate-950 p-4 rounded-xl border border-slate-850 space-y-1">
                  <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-widest font-mono block">2. Database setup helper</span>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    Once variables are configured, create the SQL schema table structure via the Supabase console using the SQL Editor snippet shown highlighted on this page.
                  </p>
                  <ul className="list-disc pl-4 text-[10px] text-slate-500 space-y-0.5">
                    <li>Stores Date, Decimal Cashflows, and Vendor Names</li>
                    <li>Synchronizes with client endpoints dynamically</li>
                    <li>Secure proxy servers protect secret keys entirely</li>
                  </ul>
                </div>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Footer Branding */}
      <footer className="border-t border-slate-850/60 py-4 px-6 text-center text-[10px] text-slate-500 font-mono mt-12 bg-slate-900/10">
        FinExtract OCR Parser Engine &bull; Managed Securely on Cloud Run &bull; Powered by Google Gemini-3.5-Flash
      </footer>
    </div>
  );
}
