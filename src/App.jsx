import React, { useState, useEffect, useCallback } from "react";
import { ref as fbRef, set as fbSet, onValue, get as fbGet } from "firebase/database";
import { db } from "./firebase";

// Logo SVG - inline, no external dependency
const LOGO_SRC = "data:image/webp;base64,UklGRiwFAABXRUJQVlA4ICAFAAAQGACdASp4AHgAPxGAt1SsKCUjKJtJ4YAiCWYAekZC99HZs9EO3G3J283egB0yeANdkXfb5GgJ10O9WUr+d8xNLu0QS18yJSX6mKjxNY90I24QYixJg2luKxvuaRmuWMCT1wmqLjaxYpctYaMyT59WPGkamxdEMW5V4n4JgAdXDlcrSXpEUEv8aXb3zlsUO/Skxaz1uRoN0JzaKtghNaNOKvbbjG5Q+PYrMJMpWRg8i9Iv1bo72UQd1B7qjSo/Q7FwYrnwsIUcoSAA/vFpALtWGlymSeVlR/zd6CYrMHE4E+HtbAA82BRGwvI5Jonr5Ft7uIMh1mPVsLfnUGBtWeQ/q5aYseNUcQonlbF1KTVB4p32w7tWPCvPTM+y3CMfqN/qxEtwVN9Uz4+9EX+6D/ga3cKqfb+2Lj4QVfncMi/O9T4YRSvIwZN9DCr7LtwJSE3wyK1FOpxYM1/duM/NQ5xjT2NtKE3dSr7DuiGs0PYnQGE1GjKUJGYOA2gTCz4+kgyAihvjoYyvSz+zrqKag5/fxpWXF+0rulyxFrz5ZHBCGaielJWRt+fHvyZl5Xon9WeUayPRFsSqpm69pcoRG8LNa+aPjs2fyS8uPrdx9m3k9tc0HcE/bvl5t0cdekdAT/8kCc6Q66r9KqikmPlBvDSFj+inoMWyN/QBsiup0uTA1VsW34y70PsdhKs01lu/cu0mB4BjH5AxIHKCXo4APcCJfDzsIKm0bmQme2GElGP5pXicrma/NuIjZlmVO8yWCfH69xWfVw3orsysxg2PxS38V37F8OMw4HQQWqRMqvv8ioVtrGtJ9OQtbsWY/d+aJLoJvwmwvKprZxIUDpFisEz664IJDAaXBpXsIISdEt+9ZO8NFOIB2Fms6zHf9bxHuvXi/jW//m/SxHQINIBOo4/BcyXv3eBbqDf4ChQih0Rya0RgiAyLuh/ugZFaf0p96T9eyqmQ5VZv+0bRSJd/SYsFCcdw/OL8E/Ky9HpkE+HyYry9Tv34ivFnFsho3IMKgBVfZJEugTlzSfO66WrLoXeQm/yizaIUqFp+M1akw6EIIy0Kb5ept27gFs6hvyRQHkAjQKzyqMkBHI1bT/M7+SxF9GxkPTYQvO8fcq3dr6xmX9HCLnWgvGO53Wcpu/RugN2J+ZuBDZVNGclicLi5HqJI3n9q7YL6UDDyf5cakX9UlLLgo4oX1XOM5SEy0FNxoVcrmK1Lj8v/yAgXTAtXDouKMTvFOOp0KhCvIDy79JullXgTmCp05lUStYFeCuQ6CKI7wqQOTutirPurFj2St+Mr523jdwQvdsKGPM2ZWfQCctWORqdoHja0IBCyRXOcQ/uRHZ5UVFJUFBNNOtPDo57vkGr8ZADn8Ybrtdj2wzMUwvVAZXZ8W0vyRWd9WVGJiwJnwgrPLTb7uOgQsOX3bCDpHwBFNGXeOwcP4TTnUq4IGlFVmti4cys1AY8g7/c8kEokmKWMYwsIYnqUJWHMRGtA7GI02LX8G2wKQCvXPbc9WQhfxWB0b7zk2DdWw7GXqppoB8aCr0dP4lJEGS9CmhxSI8TSpvIeiQqAxcLfGjqY8FSDPfKIuTG0PRYseIo62oj0idm59tl15WSf1m1c71dEfysO+wGy3nc1GZ0VKwowZ+Muvht9sbwe2M5YbejXU+DPmCyC+49tW+Bdlw6OMzfUnmihmztmgtql01cyBm6AMiQS6GdDXmpoT1gQgQMCxRegvWCeETs0PTEjH0lngAAA";

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 1: UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n = 0) => "रू " + Number(n).toLocaleString("ne-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEn = (n = 0) => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── BS/AD Calendar ─────────────────────────────────────────────────────────────
// BS month-day data per year (days per month, Baisakh–Chaitra)
// Extended through 2090 to avoid hardcoded year limits
const BS_YEAR_DATA = {
  2079:[31,32,31,32,31,30,30,30,29,29,30,31],
  2080:[31,31,32,32,31,30,30,30,29,30,30,30],
  2081:[31,31,32,31,31,31,30,29,30,29,30,30],
  2082:[31,32,31,32,31,30,30,30,29,29,30,31],
  2083:[31,31,31,32,31,30,30,30,29,30,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,30,30],
  2085:[31,32,31,32,31,30,30,30,29,29,30,31],
  2086:[30,32,31,32,31,30,30,30,29,30,30,30],
  2087:[31,31,32,31,31,31,30,29,30,29,30,30],
  2088:[31,31,32,31,31,31,30,29,30,29,30,30],
  2089:[31,32,31,32,31,30,30,30,29,29,30,30],
  2090:[31,31,32,32,31,30,30,30,29,30,30,30],
};
// Fallback for any unknown year — use typical pattern
const BS_YEAR_FALLBACK = [31,31,32,32,31,30,30,30,29,30,30,31];
const BS_MONTHS_NP = ["बैशाख","जेठ","असार","श्रावण","भाद्र","आश्विन","कार्तिक","मंसिर","पुष","माघ","फाल्गुन","चैत्र"];
const BS_MONTHS_EN = ["Baisakh","Jestha","Asar","Shrawan","Bhadra","Ashoj","Kartik","Mangsir","Poush","Magh","Falgun","Chaitra"];

function adToBS(adStr) {
  if (!adStr) return { y:0, m:0, d:0, str:"" };
  const [y,m,d] = adStr.split("-").map(Number);
  const refAD = new Date(2024,3,13); // 2081-01-01 BS
  const inputAD = new Date(y,m-1,d);
  let diffDays = Math.round((inputAD - refAD)/86400000);
  let bsY=2081, bsM=1, bsD=1, remaining=diffDays;
  if (remaining >= 0) {
    outer: while(true) {
      const months = BS_YEAR_DATA[bsY]||[31,31,32,32,31,30,30,30,29,30,30,31];
      for (let mi=bsM-1; mi<12; mi++) {
        if (remaining < months[mi]) { bsM=mi+1; bsD=1+remaining; break outer; }
        remaining -= months[mi]; if(mi===11){bsY++;bsM=1;}
      }
    }
  } else {
    remaining = Math.abs(remaining)-1;
    outer2: while(true) {
      if(bsM===1){bsY--;bsM=12;}else bsM--;
      const months = BS_YEAR_DATA[bsY]||[31,31,32,32,31,30,30,30,29,30,30,31];
      const days=months[bsM-1];
      if(remaining<days){bsD=days-remaining;break outer2;}
      remaining-=days;
    }
  }
  return { y:bsY, m:bsM, d:bsD, str:`${bsY}-${String(bsM).padStart(2,"0")}-${String(bsD).padStart(2,"0")}` };
}

function displayDate(adStr, lang, useBS) {
  if (!adStr) return "";
  if (!useBS) return adStr;
  const bs = adToBS(adStr);
  const months = lang==="en" ? BS_MONTHS_EN : BS_MONTHS_NP;
  return `${bs.d} ${months[bs.m-1]} ${bs.y}`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 2: TRANSLATIONS
// ═══════════════════════════════════════════════════════════════════════════════
const T = {
  np:{
    appName:"फुलबारी युवा समूह",appSub:"बचत तथा ऋण व्यवस्थापन",
    dashboard:"ड्यासबोर्ड",members:"सदस्य",saving:"बचत",loan:"ऋण",
    cash:"नगद किताब",bank:"बैंक किताब",income:"आय-व्यय",report:"प्रतिवेदन",
    profile:"प्रोफाइल",logout:"बाहिर निक्नुहोस्",
    totalSaving:"कुल बचत",loanOutstanding:"ऋण बाँकी",cashBalance:"नगद मौज्दात",
    bankBalance:"बैंक मौज्दात",monthlyIncome:"यो महिना आय",monthlyExpense:"यो महिना खर्च",
    totalFund:"समूहको कुल कोष",totalMembers:"कुल सदस्य",
    add:"थप्नुहोस्",edit:"सम्पादन",delete:"हटाउनुहोस्",save:"सुरक्षित",cancel:"रद्द",
    search:"खोज्नुहोस्...",date:"मिति",particulars:"विवरण",balance:"मौज्दात",
    deposit:"जम्मा",withdraw:"निकासी",cashIn:"नगद आम्दानी",cashOut:"नगद खर्च",
    bankDeposit:"जम्मा",bankWithdrawal:"निकासी",incomeLabel:"आय",expenseLabel:"व्यय",
    member:"सदस्य",phone:"फोन",address:"ठेगाना",joinDate:"सामेल मिति",
    loanAmount:"ऋण रकम",principalPaid:"साँवा भुक्तानी",interestPaid:"ब्याज भुक्तानी",
    lateFee:"ढिलाई शुल्क",totalPaid:"कुल भुक्तानी",remaining:"बाँकी",signature:"दस्तखत",
    name:"पूरा नाम",role:"भूमिका",username:"प्रयोगकर्ता नाम",password:"पासवर्ड",
    login:"प्रवेश गर्नुहोस्",confirmDelete:"यो प्रविष्टि हटाउने?",pdf:"डाउनलोड",csv:"CSV",
    category:"श्रेणी",addCategory:"नयाँ श्रेणी थप्नुहोस्",
    monthlyReport:"मासिक प्रतिवेदन",yearlyReport:"वार्षिक प्रतिवेदन",
    print:"डाउनलोड गर्नुहोस्",recentActivity:"📋 हालका बचत गतिविधि",
    changeUsername:"प्रयोगकर्ता नाम परिवर्तन",changePassword:"पासवर्ड परिवर्तन",
    currentPassword:"हालको पासवर्ड",newPassword:"नयाँ पासवर्ड",
    bsLabel:"वि.सं.",adLabel:"ई.सं.",interestIncome:"ब्याज आम्दानी",
    netBalance:"खुद मौज्दात",selectMember:"-- सदस्य छान्नुहोस् --",allMembers:"सबै सदस्य",
    noData:"कुनै तथ्याङ्क छैन।",updateSuccess:"सफलतापूर्वक अपडेट भयो!",wrongPassword:"गलत पासवर्ड!",
    savingsContribution:"बचत योगदान",interest:"ब्याज",donationGift:"दान / उपहार",
    meetingExpense:"बैठक खर्च",emergencyUse:"आपतकालीन उपयोग",otherExpense:"अन्य खर्च",
    cashAsset:"नगद",bankAsset:"बैंक मौज्दात",groupLoan:"समूह ऋण",externalDebt:"बाह्य ऋण",
    adakchya:"अध्यक्ष",sachin:"सचिव",kosadhyaksha:"कोषाध्यक्ष",memberRole:"सदस्य",
    upaAdakchya:"उप-अध्यक्ष",sachib:"सचिव",koshadhakshya:"कोषाध्यक्ष",sadasya:"सदस्य",
    position:"पद",loggedInAs:"लगइन भएको:",
    nameNp:"नेपाली नाम",nameEn:"अंग्रेजी नाम",
    syncNote:"यो प्रविष्टि स्वतः आय-व्यय किताबमा समन्वित हुन्छ।",
    syncHint:"🔗 चिह्नित प्रविष्टिहरू नगद/बैंक किताबबाट स्वतः आएका हुन्।",
    syncedEdit:"यो प्रविष्टि समन्वित छ। मूल स्रोतबाट सम्पादन/हटाउनुहोस्।",
    txType:"कारोबार प्रकार",txTypeIncome:"आय",txTypeExpense:"व्यय",
    txTypeAsset:"सम्पत्ति",txTypeLiability:"दायित्व",
  },
  en:{
    appName:"Fulbari Yuwa Samuha",appSub:"Saving & Loan Management",
    dashboard:"Dashboard",members:"Members",saving:"Savings",loan:"Loans",
    cash:"Cash Book",bank:"Bank Book",income:"Income/Expense",report:"Reports",
    profile:"Profile",logout:"Logout",
    totalSaving:"Total Saving",loanOutstanding:"Loan Outstanding",cashBalance:"Cash Balance",
    bankBalance:"Bank Balance",monthlyIncome:"Monthly Income",monthlyExpense:"Monthly Expense",
    totalFund:"Total Group Fund",totalMembers:"Total Members",
    add:"Add",edit:"Edit",delete:"Delete",save:"Save",cancel:"Cancel",
    search:"Search...",date:"Date",particulars:"Particulars",balance:"Balance",
    deposit:"Deposit",withdraw:"Withdraw",cashIn:"Cash In",cashOut:"Cash Out",
    bankDeposit:"Deposit",bankWithdrawal:"Withdrawal",incomeLabel:"Income",expenseLabel:"Expense",
    member:"Member",phone:"Phone",address:"Address",joinDate:"Join Date",
    loanAmount:"Loan Amount",principalPaid:"Principal Paid",interestPaid:"Interest Paid",
    lateFee:"Late Fee",totalPaid:"Total Paid",remaining:"Remaining",signature:"Signature",
    name:"Full Name",role:"Role",username:"Username",password:"Password",
    login:"Login",confirmDelete:"Delete this entry?",pdf:"Download",csv:"CSV",
    category:"Category",addCategory:"Add New Category",
    monthlyReport:"Monthly Report",yearlyReport:"Yearly Report",
    print:"Download",recentActivity:"📋 Recent Activity",
    changeUsername:"Change Username",changePassword:"Change Password",
    currentPassword:"Current Password",newPassword:"New Password",
    bsLabel:"BS",adLabel:"AD",interestIncome:"Interest Income",
    netBalance:"Net Balance",selectMember:"-- Select Member --",allMembers:"All Members",
    noData:"No data found.",updateSuccess:"Updated successfully!",wrongPassword:"Wrong password!",
    savingsContribution:"Savings Contribution",interest:"Interest",donationGift:"Donation/Gift",
    meetingExpense:"Meeting Expense",emergencyUse:"Emergency Use",otherExpense:"Other Expense",
    cashAsset:"Cash",bankAsset:"Bank Balance",groupLoan:"Group Loan",externalDebt:"External Debt",
    adakchya:"President (Adakshya)",sachin:"Secretary (Sachib)",kosadhyaksha:"Treasurer (Koshadhakshya)",memberRole:"Member (Sadasya)",
    upaAdakchya:"Vice-President (Upa-Adakshya)",sachib:"Secretary",koshadhakshya:"Treasurer",sadasya:"Member",
    position:"Position",loggedInAs:"Logged in as:",
    nameNp:"Nepali Name",nameEn:"English Name",
    syncNote:"This entry will auto-sync to Income/Expense book.",
    syncHint:"🔗 marked entries are auto-synced from Cash/Bank books.",
    syncedEdit:"This entry is synced. Edit/delete from the source book.",
    txType:"Transaction Type",txTypeIncome:"Income",txTypeExpense:"Expense",
    txTypeAsset:"Asset",txTypeLiability:"Liability",
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 3: STORAGE SYSTEM — permanent, update-safe, migration-aware
// ═══════════════════════════════════════════════════════════════════════════════


// App data version — bump this when schema changes require migration
const DATA_VERSION = "2.1.0";
const STORAGE_KEYS = {
  version:    "fys_data_version",
  users:      "fys_users",
  members:    "fys_members",
  savings:    "fys_savings",
  loans:      "fys_loans",
  loanPayments:"fys_loan_payments",
  cash:       "fys_cash",
  bank:       "fys_bank",
  ie:         "fys_ie",
  categories: "fys_categories",
  catLabels:  "fys_cat_labels",   // ← all category label strings in one key
  session:    "fys_session",
  lang:       "fys_lang",
};

// Safe localStorage read — never throws, returns null on any error
function lsGet(key) {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null; }
  catch { return null; }
}
// Safe localStorage write — never throws
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
// Safe raw localStorage read (no JSON.parse)
function lsGetRaw(key) {
  try { return localStorage.getItem(key) || ""; } catch { return ""; }
}
function lsSetRaw(key, value) {
  try { localStorage.setItem(key, value); } catch {}
}

// ── Category label helpers (store all labels in one JSON key) ─────────────────
function getCatLabels() {
  return lsGet(STORAGE_KEYS.catLabels) || {};
}
function setCatLabel(k, v) {
  const all = getCatLabels();
  all[k] = v;
  lsSet(STORAGE_KEYS.catLabels, all);
  // Also keep the legacy per-key format for backward compat
  try { localStorage.setItem("fys_catlbl_" + k, v); } catch {}
}
function getCatLabel(k) {
  const all = getCatLabels();
  if (all[k]) return all[k];
  // Fallback: legacy per-key
  try { return localStorage.getItem("fys_catlbl_" + k) || ""; } catch { return ""; }
}

// useStore: reads from localStorage first; falls back to seed only if key missing.
// The save() function returned updates BOTH React state AND localStorage atomically.
// Keys never change between app versions, so data survives updates.
function useStore(key, seed) {
  const [data, setData] = useState(() => {
    const saved = lsGet(key);
    if (saved !== null) return saved;   // ← real user data, use it
    lsSet(key, seed);                   // ← first ever load, persist seed immediately
    return seed;
  });
  const save = useCallback((newData) => {
    setData(newData);
    lsSet(key, newData);
  }, [key]);
  return [data, save];
}

// ── Sync engine — module-level so all store instances share one connection monitor ──
const _sync = {
  status: "synced",   // "synced" | "saving" | "offline" | "error"
  listeners: new Set(),
  queue: {},           // { [fbPath]: { data, ts } } — pending Firebase writes
  initialized: false,
};
// Restore any queue that survived a page-reload while offline
try { const _q = localStorage.getItem("fys_sync_q"); if (_q) _sync.queue = JSON.parse(_q); } catch {}

function _setStatus(s) {
  if (_sync.status === s) return;
  _sync.status = s;
  _sync.listeners.forEach(fn => fn(s));
}
function _saveQueue() {
  try { localStorage.setItem("fys_sync_q", JSON.stringify(_sync.queue)); } catch {}
}
function sanitizeForFirebase(val) {
  if (val === null || val === undefined) return null;
  if (typeof val === "number") return (isNaN(val) || !isFinite(val)) ? 0 : val;
  if (Array.isArray(val)) return val.map(sanitizeForFirebase);
  if (typeof val === "object") {
    const out = {};
    for (const [k, v] of Object.entries(val)) {
      if (v !== undefined) out[k] = sanitizeForFirebase(v);
    }
    return out;
  }
  return val;
}
function _flushQueue() {
  const paths = Object.keys(_sync.queue);
  if (!paths.length) { _setStatus("synced"); return; }
  _setStatus("saving");
  let remaining = paths.length;
  paths.forEach(path => {
    const { data } = _sync.queue[path];
    const payload = Array.isArray(data) && data.length === 0 ? null : sanitizeForFirebase(data);
    fbSet(fbRef(db, path), payload)
      .then(() => {
        delete _sync.queue[path]; _saveQueue();
        if (--remaining === 0) _setStatus("synced");
      })
      .catch(() => { if (--remaining === 0) _setStatus("offline"); });
  });
}
function _initSync() {
  if (_sync.initialized) return;
  _sync.initialized = true;
  // Firebase .info/connected — fires on every connection/disconnection
  onValue(fbRef(db, ".info/connected"), snap => {
    if (snap.val() === true) _flushQueue();
    else _setStatus("offline");
  });
  window.addEventListener("online",  _flushQueue);
  window.addEventListener("offline", () => _setStatus("offline"));
}

// useFirebaseStore — Firebase Realtime Database-backed store with offline support.
// • Boots instantly from localStorage cache (zero loading flash)
// • Queues writes while offline; auto-flushes when reconnected (local wins)
// • Ignores stale Firebase pushes when a local pending write exists for that path
function useFirebaseStore(fbPath, lsKey, seed) {
  _initSync(); // idempotent — runs once globally

  const [data, setDataState] = useState(() => {
    const saved = lsGet(lsKey);
    return saved !== null ? saved : seed;
  });

  useEffect(() => {
    const dbRef = fbRef(db, fbPath);
    const unsubscribe = onValue(dbRef, (snapshot) => {
      const raw = snapshot.val();
      if (raw === null || raw === undefined) {
        const local = lsGet(lsKey);
        if (local !== null) {
          const payload = Array.isArray(local) && local.length === 0 ? null : sanitizeForFirebase(local);
          fbSet(dbRef, payload).catch(() => {});
        }
        return;
      }
      // Normalise array-like Firebase objects
      let parsed = raw;
      if (Array.isArray(seed) && raw && typeof raw === "object" && !Array.isArray(raw)) {
        parsed = Object.values(raw);
      }
      // Skip if we have a pending write — local version is the source of truth
      if (_sync.queue[fbPath] !== undefined) return;
      setDataState(prev => {
        if (JSON.stringify(prev) === JSON.stringify(parsed)) return prev;
        lsSet(lsKey, parsed);
        return parsed;
      });
    }, () => {});
    return unsubscribe;
  }, [fbPath, lsKey]);

  const save = useCallback((newDataOrFn) => {
    const dbRef = fbRef(db, fbPath);
    const _write = (next) => {
      lsSet(lsKey, next);
      const payload = Array.isArray(next) && next.length === 0 ? null : sanitizeForFirebase(next);
      _setStatus("saving");
      if (!navigator.onLine) {
        _sync.queue[fbPath] = { data: next, ts: Date.now() };
        _saveQueue();
        _setStatus("offline");
        return;
      }
      fbSet(dbRef, payload)
        .then(() => {
          delete _sync.queue[fbPath];
          _saveQueue();
          if (!Object.keys(_sync.queue).length) _setStatus("synced");
        })
        .catch(() => {
          _sync.queue[fbPath] = { data: next, ts: Date.now() };
          _saveQueue();
          _setStatus("offline");
        });
    };
    if (typeof newDataOrFn === "function") {
      setDataState(prev => { const next = newDataOrFn(prev); _write(next); return next; });
    } else {
      setDataState(newDataOrFn);
      _write(newDataOrFn);
    }
  }, [fbPath, lsKey]);

  return [data, save];
}

// useSyncStatus — subscribe to the global sync status from any component
function useSyncStatus() {
  const [status, setStatus] = useState(() => _sync.status);
  useEffect(() => {
    _sync.listeners.add(setStatus);
    setStatus(_sync.status);
    return () => _sync.listeners.delete(setStatus);
  }, []);
  return status;
}

// SyncIndicator — sync runs silently in background; no UI shown to users
function SyncIndicator() {
  useSyncStatus(); // keep the hook active so status tracking continues
  return null;
}


// ── Full data backup / restore ─────────────────────────────────────────────────
const BACKUP_KEYS = [
  STORAGE_KEYS.users,
  STORAGE_KEYS.members,
  STORAGE_KEYS.savings,
  STORAGE_KEYS.loans,
  STORAGE_KEYS.loanPayments,
  STORAGE_KEYS.cash,
  STORAGE_KEYS.bank,
  STORAGE_KEYS.ie,
  STORAGE_KEYS.categories,
  STORAGE_KEYS.catLabels,
  STORAGE_KEYS.lang,
];

function exportBackup() {
  const backup = {
    _version: DATA_VERSION,
    _exported: new Date().toISOString(),
    _app: "Fulbari Yuwa Samuha",
  };
  BACKUP_KEYS.forEach(k => {
    const v = lsGet(k);
    if (v !== null) backup[k] = v;
  });
  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `FYS_Backup_${date}.json`;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
}

function importBackup(file, onDone) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const backup = JSON.parse(e.target.result);
      if (!backup._app || backup._app !== "Fulbari Yuwa Samuha") {
        alert("Invalid backup file. Please use a backup created from this app.");
        return;
      }
      let restored = 0;
      BACKUP_KEYS.forEach(k => {
        if (backup[k] !== undefined) {
          lsSet(k, backup[k]);
          restored++;
        }
      });
      alert(`✅ Backup restored! ${restored} data sets loaded. The page will now reload.`);
      setTimeout(() => window.location.reload(), 800);
    } catch {
      alert("Failed to read backup file. Make sure it is a valid JSON backup.");
    }
  };
  reader.readAsText(file);
}

// ═══════════════════════════════════════════════════════════════════════════════
// BACKUP / RESTORE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function BackupModal({ lang, users, members, savings, loans, loanPayments, cash, bank, ie, categories, onClose }) {
  const isEn = lang === "en";
  // step: "idle" | "exporting" | "exported" | "reading" | "confirm" | "restoring" | "restored" | "error"
  const [step, setStep] = useState("idle");
  const [restoreMode, setRestoreMode] = useState("overwrite");
  const [pendingData, setPendingData] = useState(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [exportStats, setExportStats] = useState(null);

  const col = (arr) => Array.isArray(arr) ? arr.length : (arr && typeof arr === "object" ? Object.keys(arr).length : 0);

  const COLLECTIONS = [
    { key: "members",      label: isEn ? "Members"       : "सदस्यहरू",     data: members },
    { key: "savings",      label: isEn ? "Savings"       : "बचतहरू",       data: savings },
    { key: "loans",        label: isEn ? "Loans"         : "ऋणहरू",        data: loans },
    { key: "loanPayments", label: isEn ? "Loan Payments" : "ऋण भुक्तानी",  data: loanPayments },
    { key: "cash",         label: isEn ? "Cash Book"     : "नगद किताब",    data: cash },
    { key: "bank",         label: isEn ? "Bank Book"     : "बैंक किताब",   data: bank },
    { key: "ie",           label: isEn ? "Income/Expense": "आय/व्यय",      data: ie },
    { key: "users",        label: isEn ? "Users"         : "प्रयोगकर्ता",  data: users },
    { key: "categories",   label: isEn ? "Categories"    : "श्रेणीहरू",    data: categories },
  ];

  const doExport = () => {
    setStep("exporting");
    try {
      const now = new Date();
      const dateStr = now.toISOString().slice(0,10).replace(/-/g,"_");
      const timeStr = now.toTimeString().slice(0,5).replace(":","-");
      const catLabels = lsGet(STORAGE_KEYS.catLabels) || {};
      const stats = {};
      COLLECTIONS.forEach(c => { stats[c.key] = col(c.data); });
      stats.catLabels = col(catLabels);
      const backup = {
        _version: DATA_VERSION,
        _exported: now.toISOString(),
        _app: "Fulbari Yuwa Samuha",
        _collections: stats,
        fys_data: { users, members, savings, loans, loanPayments, cash, bank, ie, categories, catLabels },
      };
      const json = JSON.stringify(backup, null, 2);
      const blob = new Blob([json], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `FYS_Backup_${dateStr}_${timeStr}.json`;
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
      setExportStats(stats);
      setStep("exported");
    } catch (err) {
      setErrorMsg(isEn ? `Export failed: ${err.message}` : `ब्याकअप असफल: ${err.message}`);
      setStep("error");
    }
  };

  const onFileSelect = (file) => {
    if (!file) return;
    setStep("reading");
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (parsed._app !== "Fulbari Yuwa Samuha") {
          setErrorMsg(isEn ? "Invalid file: not a Fulbari Yuwa Samuha backup." : "अमान्य फाइल: यो यस एपको ब्याकअप होइन।");
          setStep("error"); return;
        }
        if (!parsed.fys_data || typeof parsed.fys_data !== "object") {
          setErrorMsg(isEn ? "Invalid file: backup data missing or corrupted." : "अमान्य फाइल: ब्याकअप डाटा छैन वा बिग्रिएको छ।");
          setStep("error"); return;
        }
        setPendingData(parsed);
        setStep("confirm");
      } catch {
        setErrorMsg(isEn ? "Could not read file. Ensure it is a valid JSON backup." : "फाइल पढ्न सकिएन। सही JSON ब्याकअप फाइल छान्नुहोस्।");
        setStep("error");
      }
    };
    reader.onerror = () => { setErrorMsg(isEn ? "File read error." : "फाइल पढ्दा त्रुटि।"); setStep("error"); };
    reader.readAsText(file);
  };

  const doRestore = async () => {
    if (!pendingData) return;
    setStep("restoring");
    try {
      const src = pendingData.fys_data;
      const arrayCols = ["users","members","savings","loans","loanPayments","cash","bank","ie"];
      const currentMap = { users, members, savings, loans, loanPayments, cash, bank, ie };
      const writes = [];

      for (const key of arrayCols) {
        if (src[key] === undefined) continue;
        const srcArr = Array.isArray(src[key]) ? src[key] : Object.values(src[key] || {});
        let next;
        if (restoreMode === "merge") {
          const curr = currentMap[key] || [];
          const existIds = new Set(curr.map(r => r?.id).filter(Boolean));
          const incoming = srcArr.filter(r => r?.id && !existIds.has(r.id));
          next = [...curr, ...incoming];
        } else {
          next = srcArr;
        }
        const payload = next.length === 0 ? null : sanitizeForFirebase(next);
        writes.push(fbSet(fbRef(db, `fys_data/${key}`), payload).catch(() => {}));
      }

      const srcCats = src.categories && typeof src.categories === "object" ? src.categories : {};
      const nextCats = restoreMode === "merge" ? { ...srcCats, ...(categories||{}) } : srcCats;
      writes.push(fbSet(fbRef(db, "fys_data/categories"), sanitizeForFirebase(nextCats)).catch(() => {}));

      const srcLabels = src.catLabels && typeof src.catLabels === "object" ? src.catLabels : {};
      const currLabels = lsGet(STORAGE_KEYS.catLabels) || {};
      const nextLabels = restoreMode === "merge" ? { ...srcLabels, ...currLabels } : srcLabels;
      writes.push(fbSet(fbRef(db, "fys_data/catLabels"), sanitizeForFirebase(nextLabels)).catch(() => {}));

      await Promise.all(writes);
      setStep("restored");
    } catch (err) {
      setErrorMsg(isEn ? `Restore failed: ${err.message}` : `रिस्टोर असफल: ${err.message}`);
      setStep("error");
    }
  };

  const resetToIdle = () => { setStep("idle"); setErrorMsg(""); setPendingData(null); };

  const pct = (n, total) => total > 0 ? `${Math.round(n/total*100)}%` : "0%";
  const totalRecs = COLLECTIONS.reduce((s,c) => s + col(c.data), 0);

  return (
    <Modal title={`🗄️ ${isEn ? "Data Backup & Recovery" : "डाटा ब्याकअप / रिकभरी"}`} onClose={onClose}>

      {/* ── IDLE / main screen ── */}
      {(step === "idle" || step === "exported") && (
        <>
          {/* Summary strip */}
          <div style={{background:"#f0fdf4",borderRadius:"0.6rem",padding:"0.75rem 1rem",marginBottom:"1rem",border:"1px solid #bbf7d0"}}>
            <div style={{fontSize:"0.72rem",color:"#166534",fontWeight:700,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>{isEn?"Current data snapshot":"हालको डाटा सारांश"}</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.3rem"}}>
              {COLLECTIONS.map(c=>(
                <div key={c.key} style={{fontSize:"0.7rem",color:"#374151"}}>
                  <span style={{fontWeight:600,color:"#1b5e20"}}>{col(c.data)}</span> {c.label}
                </div>
              ))}
            </div>
            <div style={{marginTop:6,fontSize:"0.68rem",color:"#6b7280"}}>{isEn?`Total: ${totalRecs} records`:`जम्मा: ${totalRecs} रेकर्डहरू`}</div>
          </div>

          {step === "exported" && (
            <div style={{background:"#dcfce7",border:"1px solid #86efac",borderRadius:"0.5rem",padding:"0.65rem 0.85rem",marginBottom:"0.75rem",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:"1rem"}}>✅</span>
              <div style={{fontSize:"0.8rem",color:"#166534",fontWeight:600}}>
                {isEn?"Backup downloaded successfully!":"ब्याकअप सफलतापूर्वक डाउनलोड भयो!"}
              </div>
            </div>
          )}

          {/* Export button */}
          <button type="button" onClick={doExport}
            style={{width:"100%",padding:"0.7rem",background:"#1b5e20",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:"0.85rem",marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
            <Icon name="download" size={16} color="#fff"/>
            {isEn?"📥 Download Backup (.json)":"📥 ब्याकअप डाउनलोड गर्नुहोस् (.json)"}
          </button>
          <div style={{fontSize:"0.7rem",color:"#6b7280",textAlign:"center",marginBottom:"1rem"}}>
            {isEn?"Saves all app data as a JSON file with today's timestamp.":"सबै एप डाटा JSON फाइलमा आजको मितिसहित सेभ गर्छ।"}
          </div>

          <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"0.75rem 0"}}/>

          {/* Import trigger */}
          <label style={{display:"block",width:"100%",padding:"0.7rem",background:"#fff",color:"#1b5e20",border:"2px dashed #16a34a",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:"0.85rem",textAlign:"center",boxSizing:"border-box",marginBottom:"0.4rem"}}>
            <Icon name="plus" size={14} color="#1b5e20" style={{verticalAlign:"middle",marginRight:4}}/>
            {isEn?" 📂 Restore from Backup (.json)":" 📂 ब्याकअप फाइलबाट रिस्टोर गर्नुहोस्"}
            <input type="file" accept=".json,application/json" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)onFileSelect(f);e.target.value="";}}/>
          </label>
          <div style={{fontSize:"0.7rem",color:"#9ca3af",textAlign:"center"}}>
            {isEn?"⚠ Restore will overwrite or merge existing data — you will confirm before anything changes.":"⚠ रिस्टोर गर्दा डाटा बदलिनुभन्दा पहिले पुष्टि सोधिनेछ।"}
          </div>
        </>
      )}

      {/* ── EXPORTING spinner ── */}
      {step === "exporting" && (
        <div style={{textAlign:"center",padding:"2rem 0"}}>
          <div style={{fontSize:"2rem",animation:"spin 1s linear infinite",display:"inline-block"}}>⏳</div>
          <div style={{marginTop:12,color:"#1b5e20",fontWeight:600}}>{isEn?"Preparing backup…":"ब्याकअप तयार हुँदैछ…"}</div>
        </div>
      )}

      {/* ── READING spinner ── */}
      {step === "reading" && (
        <div style={{textAlign:"center",padding:"2rem 0"}}>
          <div style={{fontSize:"2rem",animation:"spin 1s linear infinite",display:"inline-block"}}>📂</div>
          <div style={{marginTop:12,color:"#1b5e20",fontWeight:600}}>{isEn?"Reading backup file…":"ब्याकअप फाइल पढ्दैछ…"}</div>
        </div>
      )}

      {/* ── CONFIRM step ── */}
      {step === "confirm" && pendingData && (
        <>
          <div style={{background:"#fefce8",border:"1px solid #fde047",borderRadius:"0.6rem",padding:"0.75rem 1rem",marginBottom:"1rem"}}>
            <div style={{fontWeight:700,fontSize:"0.85rem",color:"#713f12",marginBottom:4}}>
              {isEn?"⚠ Review before restoring":"⚠ रिस्टोर गर्नुभन्दा पहिले जाँच्नुस्"}
            </div>
            <div style={{fontSize:"0.72rem",color:"#78350f"}}>
              {isEn
                ?`Backup exported: ${pendingData._exported ? new Date(pendingData._exported).toLocaleString() : "unknown"} | Version: ${pendingData._version||"?"}`
                :`ब्याकअप मिति: ${pendingData._exported ? new Date(pendingData._exported).toLocaleString() : "अज्ञात"} | संस्करण: ${pendingData._version||"?"}`}
            </div>
          </div>

          {/* Collections from backup */}
          {pendingData._collections && (
            <div style={{background:"#f9fafb",borderRadius:"0.5rem",padding:"0.6rem 0.85rem",marginBottom:"1rem",border:"1px solid #e5e7eb"}}>
              <div style={{fontSize:"0.7rem",fontWeight:700,color:"#374151",marginBottom:6,textTransform:"uppercase"}}>{isEn?"Collections in backup":"ब्याकअपमा डाटा"}</div>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.25rem"}}>
                {Object.entries(pendingData._collections).map(([k,v])=>(
                  <div key={k} style={{fontSize:"0.68rem",color:"#374151"}}>
                    <span style={{fontWeight:600,color:"#1b5e20"}}>{v}</span> {k}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Merge/Overwrite choice */}
          <div style={{background:"#fff",border:"1px solid #e5e7eb",borderRadius:"0.5rem",padding:"0.75rem",marginBottom:"1rem"}}>
            <div style={{fontSize:"0.78rem",fontWeight:700,color:"#111827",marginBottom:"0.5rem"}}>{isEn?"Restore mode:":"रिस्टोर मोड:"}</div>
            {[
              { val:"overwrite", icon:"⛔", title: isEn?"Overwrite (recommended)":"ओभरराइट (सिफारिस)", desc: isEn?"Replace all current data with backup. Current data will be lost.":"हालको सम्पूर्ण डाटा ब्याकअपले बदल्नेछ। हालको डाटा हराउनेछ।" },
              { val:"merge",     icon:"🔀", title: isEn?"Merge (add new only)":"मर्ज (नयाँ मात्र थप्नुस्)", desc: isEn?"Add records from backup that don't exist in current data (by ID). Existing records kept.":"ब्याकअपका नयाँ रेकर्डहरू (ID अनुसार) थपिनेछन्। हालका रेकर्डहरू सुरक्षित रहनेछन्।" },
            ].map(opt=>(
              <label key={opt.val} style={{display:"flex",alignItems:"flex-start",gap:10,padding:"0.5rem 0",cursor:"pointer",borderBottom: opt.val==="overwrite"?"1px solid #f3f4f6":"none"}}>
                <input type="radio" name="restoreMode" value={opt.val} checked={restoreMode===opt.val} onChange={()=>setRestoreMode(opt.val)} style={{marginTop:2,accentColor:"#1b5e20"}}/>
                <div>
                  <div style={{fontSize:"0.8rem",fontWeight:600,color:"#111827"}}>{opt.icon} {opt.title}</div>
                  <div style={{fontSize:"0.68rem",color:"#6b7280",marginTop:2}}>{opt.desc}</div>
                </div>
              </label>
            ))}
          </div>

          {/* Confirm warning */}
          <div style={{background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.5rem",padding:"0.6rem 0.85rem",marginBottom:"1rem",fontSize:"0.78rem",color:"#991b1b",fontWeight:600}}>
            {restoreMode==="overwrite"
              ? (isEn?"⚠ This will REPLACE all existing data. This action cannot be undone.":"⚠ यसले सबै हालको डाटा मेटाउनेछ। यो कार्य पूर्ववत हुन सक्दैन।")
              : (isEn?"ℹ Merge will add new records only. Your existing data will remain.":"ℹ मर्जले नयाँ रेकर्डहरू मात्र थप्नेछ। हालको डाटा सुरक्षित रहनेछ।")}
          </div>

          <div style={{display:"flex",gap:8}}>
            <button type="button" onClick={resetToIdle}
              style={{flex:1,padding:"0.65rem",background:"#f9fafb",color:"#374151",border:"1px solid #e5e7eb",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:"0.83rem"}}>
              {isEn?"Cancel":"रद्द गर्नुहोस्"}
            </button>
            <button type="button" onClick={doRestore}
              style={{flex:2,padding:"0.65rem",background: restoreMode==="overwrite"?"#dc2626":"#1b5e20",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:"0.83rem"}}>
              {restoreMode==="overwrite"
                ? (isEn?"⛔ Yes, Overwrite & Restore":"⛔ हो, ओभरराइट गरी रिस्टोर")
                : (isEn?"🔀 Yes, Merge & Restore":"🔀 हो, मर्ज गरी रिस्टोर")}
            </button>
          </div>
        </>
      )}

      {/* ── RESTORING spinner ── */}
      {step === "restoring" && (
        <div style={{textAlign:"center",padding:"2.5rem 0"}}>
          <div style={{fontSize:"2.5rem",animation:"spin 1s linear infinite",display:"inline-block"}}>🔄</div>
          <div style={{marginTop:14,color:"#1b5e20",fontWeight:700,fontSize:"0.95rem"}}>{isEn?"Restoring data to Firebase…":"Firebase मा डाटा रिस्टोर हुँदैछ…"}</div>
          <div style={{marginTop:6,fontSize:"0.75rem",color:"#6b7280"}}>{isEn?"Please wait, do not close this window.":"कृपया प्रतीक्षा गर्नुहोस्, यो विन्डो नबन्द गर्नुहोस्।"}</div>
          <div style={{marginTop:16,height:6,background:"#e5e7eb",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",background:"#1b5e20",borderRadius:3,width:"100%",animation:"progress 2s ease-in-out infinite"}}/>
          </div>
        </div>
      )}

      {/* ── RESTORED success ── */}
      {step === "restored" && (
        <div style={{textAlign:"center",padding:"1.5rem 0"}}>
          <div style={{fontSize:"3rem"}}>✅</div>
          <div style={{marginTop:12,fontWeight:700,fontSize:"1rem",color:"#166534"}}>
            {isEn?"Data Restored Successfully!":"डाटा सफलतापूर्वक रिस्टोर भयो!"}
          </div>
          <div style={{marginTop:8,fontSize:"0.78rem",color:"#374151"}}>
            {restoreMode==="overwrite"
              ? (isEn?"All data has been replaced with the backup.":"सम्पूर्ण डाटा ब्याकअपले बदलिएको छ।")
              : (isEn?"New records from the backup have been merged in.":"ब्याकअपका नयाँ रेकर्डहरू मर्ज गरिएको छ।")}
          </div>
          <div style={{marginTop:16,background:"#f0fdf4",borderRadius:"0.5rem",padding:"0.65rem",fontSize:"0.75rem",color:"#166534"}}>
            {isEn?"The app will reload to reflect the restored data.":"एप पुनः लोड भएर रिस्टोर गरिएको डाटा देखाउनेछ।"}
          </div>
          <button type="button" onClick={()=>setTimeout(()=>window.location.reload(),200)}
            style={{marginTop:16,padding:"0.65rem 2rem",background:"#1b5e20",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700,fontSize:"0.88rem"}}>
            {isEn?"🔄 Reload App":"🔄 एप पुनः लोड गर्नुहोस्"}
          </button>
        </div>
      )}

      {/* ── ERROR state ── */}
      {step === "error" && (
        <div style={{textAlign:"center",padding:"1.5rem 0"}}>
          <div style={{fontSize:"2.5rem"}}>❌</div>
          <div style={{marginTop:12,fontWeight:700,fontSize:"0.95rem",color:"#991b1b"}}>
            {isEn?"Something went wrong":"केही गल्ती भयो"}
          </div>
          <div style={{marginTop:8,fontSize:"0.78rem",color:"#374151",background:"#fef2f2",border:"1px solid #fecaca",borderRadius:"0.5rem",padding:"0.6rem"}}>{errorMsg}</div>
          <button type="button" onClick={resetToIdle}
            style={{marginTop:16,padding:"0.6rem 2rem",background:"#1b5e20",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700}}>
            {isEn?"Try Again":"फेरि प्रयास गर्नुहोस्"}
          </button>
        </div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(100%)} }
      `}</style>
    </Modal>
  );
}

// ── Schema migration ───────────────────────────────────────────────────────────
// Called once on startup if stored version differs from current.
// NEVER deletes user data — only adds missing fields.
function runMigrations() {
  const storedVersion = lsGet(STORAGE_KEYS.version);
  if (storedVersion === DATA_VERSION) return; // already up to date

  // Members: ensure nameEn, position fields exist (added in v2)
  const members = lsGet(STORAGE_KEYS.members);
  if (Array.isArray(members)) {
    const migrated = members.map(m => ({
      nameEn: "",
      position: "sadasya",
      ...m, // existing fields always win — never overwrite
    }));
    lsSet(STORAGE_KEYS.members, migrated);
  }

  // Savings/Loans: ensure modifiedAt exists
  for (const key of [STORAGE_KEYS.savings, STORAGE_KEYS.loans]) {
    const rows = lsGet(key);
    if (Array.isArray(rows)) {
      lsSet(key, rows.map(r => ({ modifiedAt: today(), ...r })));
    }
  }

  // Cash/Bank: ensure txId and txType exist
  for (const key of [STORAGE_KEYS.cash, STORAGE_KEYS.bank]) {
    const rows = lsGet(key);
    if (Array.isArray(rows)) {
      lsSet(key, rows.map(r => ({
        txId: r.id || uid(),
        txType: (r.cashIn > 0 || r.deposit > 0) ? "income" : "expense",
        modifiedAt: today(),
        ...r,
      })));
    }
  }

  // IE: ensure source field exists
  const ie = lsGet(STORAGE_KEYS.ie);
  if (Array.isArray(ie)) {
    lsSet(STORAGE_KEYS.ie, ie.map(r => ({ source: "manual", modifiedAt: today(), ...r })));
  }

  // Categories: ensure all four groups exist, preserve user additions
  const cats = lsGet(STORAGE_KEYS.categories);
  if (cats && typeof cats === "object") {
    const merged = {
      income:      ["savingsContribution","interest","donationGift"],
      expense:     ["meetingExpense","emergencyUse","otherExpense"],
      assets:      ["cashAsset","bankAsset"],
      liabilities: ["groupLoan","externalDebt"],
      ...cats, // existing custom categories win
    };
    lsSet(STORAGE_KEYS.categories, merged);
  }

  // Migrate legacy per-key cat labels into unified key
  const legacyLabels = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("fys_catlbl_")) {
        legacyLabels[k.replace("fys_catlbl_", "")] = localStorage.getItem(k);
      }
    }
    if (Object.keys(legacyLabels).length > 0) {
      const existing = getCatLabels();
      lsSet(STORAGE_KEYS.catLabels, { ...legacyLabels, ...existing });
    }
  } catch {}

  // Mark migration complete
  lsSet(STORAGE_KEYS.version, DATA_VERSION);
}

// Run migrations immediately at module load (before any component mounts)
runMigrations();

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 4: SEED DATA
// Stable, hardcoded IDs — these never change between app versions.
// Seeds are ONLY used when localStorage is completely empty (first-ever load).
// Existing user data in localStorage always takes priority.
// ═══════════════════════════════════════════════════════════════════════════════

// Stable member IDs — hardcoded so cross-references between members/savings/loans
// remain consistent even if the module is re-evaluated after an update.
const M1 = "fys_m_001";
const M2 = "fys_m_002";
const M3 = "fys_m_003";

// Stable user IDs
const SEED_USERS = [
  { id: "fys_u_admin",  username: "admin",   password: "admin123",  role: "admin",  displayName: "Admin" },
  { id: "fys_u_member", username: "member",  password: "member123", role: "member", displayName: "सदस्य" },
];

const SEED_MEMBERS = [
  { id:M1, name:"राम बहादुर श्रेष्ठ", nameEn:"Ram Bahadur Shrestha", phone:"९८४१२३४५६७", address:"भक्तपुर",    joinDate:"2024-01-15", position:"adakchya" },
  { id:M2, name:"सीता देवी तामाङ",     nameEn:"Sita Devi Tamang",     phone:"९८०१२३४५६७", address:"काठमाडौं", joinDate:"2024-02-01", position:"sachib"   },
  { id:M3, name:"हरि प्रसाद गुरुङ",    nameEn:"Hari Prasad Gurung",   phone:"९८६१२३४५६७", address:"ललितपुर",  joinDate:"2024-01-20", position:"sadasya"  },
];

// Stable transaction IDs
const TX1="fys_tx_001", TX2="fys_tx_002", TX3="fys_tx_003",
      TX4="fys_tx_004", TX5="fys_tx_005";

const SEED_SAVINGS = [
  { id:"fys_sv_001", memberId:M1, date:"2025-01-10", particulars:"मासिक बचत", deposit:500, withdraw:0, signature:"", modifiedAt:"2025-01-10" },
  { id:"fys_sv_002", memberId:M2, date:"2025-01-12", particulars:"मासिक बचत", deposit:500, withdraw:0, signature:"", modifiedAt:"2025-01-12" },
  { id:"fys_sv_003", memberId:M3, date:"2025-01-15", particulars:"मासिक बचत", deposit:500, withdraw:0, signature:"", modifiedAt:"2025-01-15" },
  { id:"fys_sv_004", memberId:M1, date:"2025-02-10", particulars:"मासिक बचत", deposit:500, withdraw:0, signature:"", modifiedAt:"2025-02-10" },
];
const SEED_LOANS = [
  { id:"fys_ln_001", memberId:M1, startDate:"2025-01-20", particulars:"व्यापार ऋण", principal:5000, interestRate:12, duration:12, modifiedAt:"2025-01-20" },
  { id:"fys_ln_002", memberId:M3, startDate:"2025-02-05", particulars:"कृषि ऋण",   principal:3000, interestRate:12, duration:6,  modifiedAt:"2025-02-05" },
];
const SEED_LOAN_PAYMENTS = [
  { id:"fys_lp_001", loanId:"fys_ln_001", date:"2025-01-20", principalPaid:500, interestPaid:100, lateFee:0, signature:"", modifiedAt:"2025-01-20" },
  { id:"fys_lp_002", loanId:"fys_ln_002", date:"2025-02-05", principalPaid:300, interestPaid:60,  lateFee:0, signature:"", modifiedAt:"2025-02-05" },
];
const SEED_CASH = [
  { id:TX1, date:"2025-01-10", particulars:"बचत संकलन", cashIn:1500, cashOut:0,    category:"savingsContribution", txId:TX1, txType:"income",  modifiedAt:"2025-01-10" },
  { id:TX2, date:"2025-01-20", particulars:"ऋण वितरण",  cashIn:0,    cashOut:8000, category:"groupLoan",           txId:TX2, txType:"expense", modifiedAt:"2025-01-20" },
  { id:TX3, date:"2025-02-05", particulars:"ऋण भुक्तानी",cashIn:960, cashOut:0,    category:"interest",            txId:TX3, txType:"income",  modifiedAt:"2025-02-05" },
];
const SEED_BANK = [
  { id:TX4, date:"2025-01-11", particulars:"बचत जम्मा", deposit:1000, withdrawal:0,    category:"savingsContribution", txId:TX4, txType:"income",  modifiedAt:"2025-01-11" },
  { id:TX5, date:"2025-02-01", particulars:"ऋण निकासी", deposit:0,    withdrawal:5000, category:"groupLoan",           txId:TX5, txType:"expense", modifiedAt:"2025-02-01" },
];
const SEED_IE = [
  { id:TX1+"_s", date:"2025-01-10", particulars:"बचत संकलन [Cash]",  income:1500, expense:0,   category:"savingsContribution", txId:TX1, source:"cash",   modifiedAt:"2025-01-10" },
  { id:TX3+"_s", date:"2025-02-05", particulars:"ऋण भुक्तानी [Cash]", income:960,  expense:0,   category:"interest",            txId:TX3, source:"cash",   modifiedAt:"2025-02-05" },
  { id:TX4+"_s", date:"2025-01-11", particulars:"बचत जम्मा [Bank]",  income:1000, expense:0,   category:"savingsContribution", txId:TX4, source:"bank",   modifiedAt:"2025-01-11" },
  { id:"fys_ie_001", date:"2025-01-30", particulars:"कार्यालय खर्च", income:0,    expense:200, category:"meetingExpense",      txId:null, source:"manual", modifiedAt:"2025-01-30" },
];
const SEED_CATEGORIES = {
  income:      ["savingsContribution","interest","donationGift"],
  expense:     ["meetingExpense","emergencyUse","otherExpense"],
  assets:      ["cashAsset","bankAsset"],
  liabilities: ["groupLoan","externalDebt"],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 5: UI PRIMITIVES
// ═══════════════════════════════════════════════════════════════════════════════
const IP={
  dashboard:"M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z",
  members:"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
  saving:"M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z",
  loan:"M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z",
  cash:"M11.5 2C6.81 2 3 5.81 3 10.5S6.81 19 11.5 19h.5v3c4.86-2.34 8-7 8-11.5C20 5.81 16.19 2 11.5 2zm1 14.5h-2v-2h2v2zm0-4h-2c0-3.25 3-3 3-5 0-1.1-.9-2-2-2s-2 .9-2 2h-2c0-2.21 1.79-4 4-4s4 1.79 4 4c0 2.5-3 2.75-3 5z",
  bank:"M4 10v7h3v-7H4zm6 0v7h3v-7h-3zM2 22h19v-3H2v3zm14-12v7h3v-7h-3zM11.5 1L2 6v2h19V6l-9.5-5z",
  income:"M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 16.99z",
  report:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z",
  plus:"M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z",
  edit:"M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z",
  del:"M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z",
  close:"M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  pdf:"M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-8.5 7.5c0 .83-.67 1.5-1.5 1.5H9v2H7.5V7H10c.83 0 1.5.67 1.5 1.5v1zm5 2c0 .83-.67 1.5-1.5 1.5h-2.5V7H15c.83 0 1.5.67 1.5 1.5v3zm4-3H19v1h1.5V11H19v2h-1.5V7h3v1.5zM9 9.5h1v-1H9v1zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm10 5.5h1v-3h-1v3z",
  download:"M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z",
  excel:"M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1.99 4l-2.51 3.5L17 14h-2l-1.5-2.1-1.5 2.1H10l2.5-3.5L10 7h2l1.5 2.1L15 7h2.01z",
  user:"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  lock:"M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z",
  tag:"M21.41 11.58l-9-9C12.05 2.22 11.55 2 11 2H4c-1.1 0-2 .9-2 2v7c0 .55.22 1.05.59 1.42l9 9c.36.36.86.58 1.41.58.55 0 1.05-.22 1.41-.59l7-7c.37-.36.59-.86.59-1.41 0-.55-.23-1.06-.59-1.42zM5.5 7C4.67 7 4 6.33 4 5.5S4.67 4 5.5 4 7 4.67 7 5.5 6.33 7 5.5 7z",
  globe:"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm6.93 6h-2.95c-.32-1.25-.78-2.45-1.38-3.56 1.84.63 3.37 1.91 4.33 3.56zM12 4.04c.83 1.2 1.48 2.53 1.91 3.96h-3.82c.43-1.43 1.08-2.76 1.91-3.96zM4.26 14C4.1 13.36 4 12.69 4 12s.1-1.36.26-2h3.38c-.08.66-.14 1.32-.14 2 0 .68.06 1.34.14 2H4.26zm.82 2h2.95c.32 1.25.78 2.45 1.38 3.56-1.84-.63-3.37-1.9-4.33-3.56zm2.95-8H5.08c.96-1.66 2.49-2.93 4.33-3.56C8.81 5.55 8.35 6.75 8.03 8zM12 19.96c-.83-1.2-1.48-2.53-1.91-3.96h3.82c-.43 1.43-1.08 2.76-1.91 3.96zM14.34 14H9.66c-.09-.66-.16-1.32-.16-2 0-.68.07-1.35.16-2h4.68c.09.65.16 1.32.16 2 0 .68-.07 1.34-.16 2zm.25 5.56c.6-1.11 1.06-2.31 1.38-3.56h2.95c-.96 1.65-2.49 2.93-4.33 3.56zM16.36 14c.08-.66.14-1.32.14-2 0-.68-.06-1.34-.14-2h3.38c.16.64.26 1.31.26 2s-.1 1.36-.26 2h-3.38z",
  calendar:"M20 3h-1V1h-2v2H7V1H5v2H4c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 18H4V8h16v13z",
};
const Icon=({name,size=20,color="currentColor"})=>(
  <svg width={size} height={size} viewBox="0 0 24 24" fill={color} style={{flexShrink:0}}>
    <path d={IP[name]||""}/>
  </svg>
);

function Modal({title,onClose,children,wide}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.55)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem"}}>
      <div style={{background:"#fff",borderRadius:"1rem",width:"100%",maxWidth:wide?680:480,maxHeight:"92vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"1rem 1.25rem",borderBottom:"1px solid #e5e7eb",background:"#1b5e20",borderRadius:"1rem 1rem 0 0",position:"sticky",top:0,zIndex:1}}>
          <h3 style={{margin:0,color:"#fff",fontSize:"1rem",fontFamily:"inherit"}}>{title}</h3>
          <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}><Icon name="close" size={20} color="#fff"/></button>
        </div>
        <div style={{padding:"1.25rem"}}>{children}</div>
      </div>
    </div>
  );
}

function Field({label,type="text",value,onChange,options,required,readOnly,inputFont,placeholder}){
  const s={width:"100%",padding:"0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.9rem",fontFamily:inputFont||"inherit",boxSizing:"border-box",outline:"none",background:readOnly?"#f9fafb":"#fff"};
  return(
    <div style={{marginBottom:"0.85rem"}}>
      <label style={{display:"block",marginBottom:4,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>{label}{required&&<span style={{color:"#dc2626"}}> *</span>}</label>
      {type==="select"
        ?<select value={value} onChange={e=>onChange(e.target.value)} style={s} disabled={readOnly}>
           {options?.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
         </select>
        :<input type={type} value={value} onChange={e=>onChange(e.target.value)} style={s} required={required} readOnly={readOnly} placeholder={placeholder||""}/>
      }
    </div>
  );
}

// UNCHANGED original StatCard
function StatCard({label,value,color="#1b5e20",icon}){
  return(
    <div style={{background:"#fff",borderRadius:"0.875rem",padding:"1rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",borderLeft:`4px solid ${color}`,display:"flex",alignItems:"center",gap:"0.75rem"}}>
      <div style={{background:color+"18",borderRadius:"50%",width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
        <Icon name={icon} size={22} color={color}/>
      </div>
      <div>
        <div style={{fontSize:"0.72rem",color:"#6b7280",fontWeight:600,letterSpacing:"0.03em",marginBottom:2}}>{label}</div>
        <div style={{fontSize:"1.05rem",fontWeight:700,color:"#111827"}}>{value}</div>
      </div>
    </div>
  );
}

function Table({cols,rows,onEdit,onDelete,isAdmin,t}){
  const [pendingId,setPendingId]=useState(null); // id waiting for inline confirm
  if(!rows.length) return <div style={{textAlign:"center",color:"#9ca3af",padding:"2rem",fontStyle:"italic"}}>{t?.noData||"No data."}</div>;
  const canAct=isAdmin&&(onEdit||onDelete);
  return(
    <div style={{overflowX:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
        <thead>
          <tr style={{background:"#f0fdf4"}}>
            {cols.map(c=><th key={c.key} style={{padding:"0.6rem 0.75rem",textAlign:c.num?"right":"left",color:"#166534",fontWeight:700,whiteSpace:"nowrap",borderBottom:"2px solid #bbf7d0"}}>{c.label}</th>)}
            {canAct&&<th style={{padding:"0.6rem 0.75rem",color:"#166534",fontWeight:700}}>—</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,i)=>(
            <tr key={r.id||i} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
              {cols.map(c=>(
                <td key={c.key} style={{padding:"0.55rem 0.75rem",textAlign:c.num?"right":"left",whiteSpace:c.wrap?"normal":"nowrap",color:c.green?"#16a34a":c.red?"#dc2626":"#111827",fontFamily:(!c.fmt&&!c.num)?smartFont(String(r[c.key]||"")):undefined}}>
                  {c.fmt?(c.enFmt?fmtEn(r[c.key]):fmt(r[c.key])):(r[c.key]??"")}
                  {c.key==="particulars"&&r.txId&&<span style={{marginLeft:4,fontSize:"0.7rem",color:"#7c3aed",background:"#ede9fe",borderRadius:4,padding:"1px 4px"}}>🔗</span>}
                </td>
              ))}
              {canAct&&(
                <td style={{padding:"0.45rem 0.75rem",whiteSpace:"nowrap"}}>
                  {/* Edit button */}
                  {onEdit&&<button type="button" onClick={()=>{setPendingId(null);onEdit(r);}} style={{background:"#dbeafe",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",marginRight:4}}><Icon name="edit" size={14} color="#1d4ed8"/></button>}
                  {/* Delete: first click → show inline confirm; second click → actually delete */}
                  {onDelete&&(
                    pendingId===(r.id||i)
                      ? <span style={{display:"inline-flex",alignItems:"center",gap:3}}>
                          <span style={{fontSize:"0.7rem",color:"#dc2626",fontWeight:600,marginRight:2}}>
                            {t?.confirmDelete?t.confirmDelete.split("?")[0]+"?":"Sure?"}
                          </span>
                          <button type="button"
                            onClick={()=>{onDelete(r.id);setPendingId(null);}}
                            style={{background:"#dc2626",border:"none",borderRadius:5,padding:"2px 7px",cursor:"pointer",color:"#fff",fontSize:"0.72rem",fontWeight:700}}
                          >✓</button>
                          <button type="button"
                            onClick={()=>setPendingId(null)}
                            style={{background:"#6b7280",border:"none",borderRadius:5,padding:"2px 7px",cursor:"pointer",color:"#fff",fontSize:"0.72rem"}}
                          >✗</button>
                        </span>
                      : <button type="button"
                          onClick={()=>setPendingId(r.id||i)}
                          style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}
                        ><Icon name="del" size={14} color="#dc2626"/></button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Btn({onClick,color="#1b5e20",children,icon,sm}){
  return(
    <button onClick={onClick} style={{background:color,color:"#fff",border:"none",borderRadius:"0.5rem",padding:sm?"0.35rem 0.65rem":"0.45rem 0.85rem",cursor:"pointer",fontSize:sm?"0.75rem":"0.8rem",display:"flex",alignItems:"center",gap:4,fontFamily:"inherit",fontWeight:600}}>
      {icon&&<Icon name={icon} size={sm?12:14} color="#fff"/>}{children}
    </button>
  );
}

function exportCSV(filename,cols,rows){
  const h=cols.map(c=>`"${c.label}"`).join(",");
  const b=rows.map(r=>cols.map(c=>`"${String(r[c.key]??"")}"`).join(",")).join("\n");
  const blob=new Blob(["\uFEFF"+h+"\n"+b],{type:"text/csv;charset=utf-8;"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename+".csv";a.click();
}

// PDF / Download export
// Strategy: build a fully self-contained HTML document and trigger an
// immediate <a download> click — no print dialog, no popup, no iframe needed.
// The downloaded file opens in any browser and can be saved as PDF via Ctrl+P.
// This is the only approach that works reliably inside sandboxed iframes.
function exportPrint(title, html) {
  const date = new Date();
  const dateNP = date.toLocaleDateString("ne-NP");
  const dateEN = date.toLocaleDateString("en-GB");

  const fullHTML = `<!DOCTYPE html>
<html lang="ne">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0;}
    body{
      font-family:'Tiro Devanagari Sanskrit','Mangal','Poppins',sans-serif;
      padding:2cm 2.5cm;font-size:13px;color:#111;background:#fff;
    }
    .header{text-align:center;margin-bottom:1.5rem;border-bottom:3px solid #1b5e20;padding-bottom:1rem;}
    .org{font-size:1.5rem;font-weight:700;color:#1b5e20;font-family:'Poppins',sans-serif;letter-spacing:0.02em;}
    .report-title{font-size:1rem;color:#444;margin-top:0.4rem;font-weight:400;}
    table{width:100%;border-collapse:collapse;margin-top:1.2rem;}
    thead tr{background:#1b5e20;color:#fff;}
    th{padding:8px 10px;text-align:left;font-weight:600;font-size:0.82rem;}
    td{padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:0.82rem;}
    tr:nth-child(even) td{background:#f0fdf4;}
    .total-row td{font-weight:700;background:#dcfce7!important;color:#166534;border-top:2px solid #16a34a;}
    .footer{text-align:center;margin-top:2rem;color:#888;font-size:0.75rem;border-top:1px solid #e5e7eb;padding-top:0.75rem;}
    .sig-area{margin-top:2.5rem;display:grid;grid-template-columns:1fr 1fr;gap:3rem;}
    .sig-line{border-top:1.5px solid #374151;padding-top:0.4rem;font-size:0.82rem;color:#555;text-align:center;}
    @media print{body{padding:1cm 1.5cm;}@page{margin:1.5cm;}}
  </style>
</head>
<body>
  <div class="header">
    <img src="${LOGO_SRC}" alt="Fulbari Yuwa Samuha Logo" style="width:64px;height:64px;object-fit:cover;border-radius:50%;margin-bottom:0.5rem;"/>
    <div class="org">फुलबारी युवा समूह</div>
    <div class="report-title">${title}</div>
  </div>
  ${html}
  <div class="footer">
    फुलबारी युवा समूह &nbsp;•&nbsp; ${dateNP} &nbsp;•&nbsp; ${dateEN}
  </div>
</body>
</html>`;

  // Create blob and trigger immediate download — works in sandboxed iframes,
  // requires no popup permission, shows no dialog inside the app.
  try {
    const blob = new Blob([fullHTML], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    // Use .html extension — browser opens it natively; user can Ctrl+P → Save as PDF
    const safeTitle = title.replace(/[^a-zA-Z0-9\u0900-\u097F\s]/g, "").trim().replace(/\s+/g, "_") || "report";
    a.href = url;
    a.download = `${safeTitle}_${dateEN.replace(/\//g, "-")}.html`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    // Cleanup
    setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 5000);
  } catch (err) {
    // Last-resort: open in new tab
    try {
      const w = window.open("", "_blank");
      if (w) { w.document.write(fullHTML); w.document.close(); }
    } catch {}
  }
}

function catLabel(key,t){ return t[key]||key; }

// Detect whether a string contains Devanagari characters (Unicode range 0900–097F)
// Returns the right font-family stack so both scripts render cleanly
function smartFont(text){
  const hasDevanagari=/[\u0900-\u097F]/.test(text||"");
  return hasDevanagari
    ? "'Tiro Devanagari Sanskrit','Mangal',sans-serif"
    : "'Poppins',sans-serif";
}

// Return the correct language-appropriate name for a member object.
// Falls back gracefully: if English name missing, shows Nepali name; vice versa.
function getMemberDisplayName(member, lang){
  if(!member) return "?";
  if(lang==="en") return (member.nameEn||"").trim() || member.name || "?";
  return (member.name||"").trim() || member.nameEn || "?";
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 6: LOGIN SCREEN — Two fixed roles: Admin and Member
// ═══════════════════════════════════════════════════════════════════════════════
function LoginScreen({users,onLogin}){
  const [selectedRole,setSelectedRole]=useState(""); // "admin" | "member" | "" (auto)
  const [uname,setUname]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [showPass,setShowPass]=useState(false);

  const handleSubmit=()=>{
    setErr("");
    if(!uname.trim()){setErr("प्रयोगकर्ता नाम भर्नुहोस् / Enter username");return;}
    if(!pass){setErr("पासवर्ड भर्नुहोस् / Enter password");return;}

    // Find user matching credentials
    const matched=users.find(u=>
      u.username.toLowerCase()===uname.trim().toLowerCase()&&
      u.password===pass
    );

    if(!matched){
      setErr("गलत प्रयोगकर्ता नाम वा पासवर्ड\nInvalid username or password");
      return;
    }

    // Normalise role to exactly "admin" or "member"
    // Old sessions with adakchya/sachin/kosadhyaksha all count as admin
    const normRole=matched.role==="member"?"member":"admin";
    const normUser={...matched,role:normRole};

    // If user selected a role, verify it matches — prevents a member trying to log in as admin
    if(selectedRole&&selectedRole!==normRole){
      setErr(
        selectedRole==="admin"
          ? "यो खाता Admin होइन। Member रोल छान्नुहोस्।\nThis account is not Admin. Select Member role."
          : "यो खाता Member होइन। Admin रोल छान्नुहोस्।\nThis account is not Member. Select Admin role."
      );
      return;
    }

    onLogin(normUser);
  };

  const handleKey=e=>{if(e.key==="Enter")handleSubmit();};

  const roleBtn=(role,label,icon,color)=>(
    <button
      type="button"
      onClick={()=>setSelectedRole(prev=>prev===role?"":role)}
      style={{
        flex:1,padding:"0.75rem 0.5rem",
        border:`2px solid ${selectedRole===role?color:"#d1d5db"}`,
        borderRadius:"0.75rem",
        background:selectedRole===role?color+"12":"#fff",
        color:selectedRole===role?color:"#6b7280",
        cursor:"pointer",
        fontFamily:"'Poppins','Tiro Devanagari Sanskrit',sans-serif",
        fontWeight:selectedRole===role?700:500,
        fontSize:"0.82rem",
        display:"flex",flexDirection:"column",alignItems:"center",gap:4,
        transition:"all 0.15s",
      }}
    >
      <span style={{fontSize:"1.5rem"}}>{icon}</span>
      <span>{label}</span>
      {selectedRole===role&&(
        <span style={{fontSize:"0.65rem",color,background:color+"20",borderRadius:"1rem",padding:"1px 8px"}}>
          ✓ छानिएको / Selected
        </span>
      )}
    </button>
  );

  return(
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(160deg,#1b5e20 0%,#2e7d32 45%,#388e3c 100%)",
      display:"flex",alignItems:"center",justifyContent:"center",
      padding:"1rem",
      fontFamily:"'Poppins','Tiro Devanagari Sanskrit','Mangal',sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{
        background:"#fff",borderRadius:"1.5rem",
        padding:"2rem 1.75rem",width:"100%",maxWidth:380,
        boxShadow:"0 24px 64px rgba(0,0,0,0.35)",
      }}>

        {/* Logo + title */}
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{
            width:96,height:96,borderRadius:"50%",
            background:"#fff",border:"3px solid #e8f5e9",
            margin:"0 auto 0.85rem",overflow:"hidden",
            boxShadow:"0 6px 20px rgba(27,94,32,0.22)",
            display:"flex",alignItems:"center",justifyContent:"center",
          }}>
            <img
              src={LOGO_SRC}
              alt="Fulbari Yuwa Samuha Logo"
              style={{width:"100%",height:"100%",objectFit:"cover",display:"block"}}
            />
          </div>
          <h1 style={{margin:0,color:"#1b5e20",fontSize:"1.2rem",fontWeight:700,lineHeight:1.3}}>
            फुलबारी युवा समूह
          </h1>
          <p style={{margin:"0.3rem 0 0",color:"#6b7280",fontSize:"0.78rem"}}>
            Saving &amp; Loan Management System
          </p>
        </div>

        {/* Step 1: Role selector */}
        <div style={{marginBottom:"1.25rem"}}>
          <div style={{fontSize:"0.78rem",fontWeight:600,color:"#374151",marginBottom:"0.6rem",textAlign:"center"}}>
            भूमिका छान्नुहोस् / Select Role
            <span style={{fontWeight:400,color:"#9ca3af",marginLeft:4}}>(optional)</span>
          </div>
          <div style={{display:"flex",gap:"0.65rem"}}>
            {roleBtn("admin",  "Admin / प्रशासक", "🛡️", "#1b5e20")}
            {roleBtn("member", "Member / सदस्य",  "👤", "#2563eb")}
          </div>
        </div>

        {/* Step 2: Credentials */}
        {err&&(
          <div style={{
            background:"#fee2e2",color:"#dc2626",
            padding:"0.6rem 0.75rem",borderRadius:"0.5rem",
            marginBottom:"0.85rem",fontSize:"0.8rem",
            whiteSpace:"pre-line",lineHeight:1.5,
          }}>
            ⚠ {err}
          </div>
        )}

        <div style={{marginBottom:"0.75rem"}}>
          <label style={{display:"block",marginBottom:4,fontSize:"0.78rem",fontWeight:600,color:"#374151"}}>
            प्रयोगकर्ता नाम / Username
          </label>
          <input
            type="text"
            value={uname}
            onChange={e=>{setErr("");setUname(e.target.value);}}
            onKeyDown={handleKey}
            placeholder={selectedRole==="admin"?"admin":"member"}
            autoCapitalize="none"
            autoCorrect="off"
            style={{
              width:"100%",padding:"0.6rem 0.75rem",
              border:"1.5px solid #d1d5db",borderRadius:"0.5rem",
              fontSize:"0.9rem",fontFamily:"inherit",
              boxSizing:"border-box",outline:"none",
            }}
          />
        </div>

        <div style={{marginBottom:"1rem"}}>
          <label style={{display:"block",marginBottom:4,fontSize:"0.78rem",fontWeight:600,color:"#374151"}}>
            पासवर्ड / Password
          </label>
          <div style={{position:"relative"}}>
            <input
              type={showPass?"text":"password"}
              value={pass}
              onChange={e=>{setErr("");setPass(e.target.value);}}
              onKeyDown={handleKey}
              placeholder="••••••••"
              style={{
                width:"100%",padding:"0.6rem 2.5rem 0.6rem 0.75rem",
                border:"1.5px solid #d1d5db",borderRadius:"0.5rem",
                fontSize:"0.9rem",fontFamily:"inherit",
                boxSizing:"border-box",outline:"none",
              }}
            />
            <button
              type="button"
              onClick={()=>setShowPass(s=>!s)}
              style={{
                position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",
                background:"none",border:"none",cursor:"pointer",
                color:"#9ca3af",fontSize:"0.8rem",padding:4,
              }}
            >
              {showPass?"🙈":"👁"}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          style={{
            width:"100%",padding:"0.8rem",
            background:"linear-gradient(135deg,#1b5e20,#2e7d32)",
            color:"#fff",border:"none",borderRadius:"0.75rem",
            fontSize:"1rem",cursor:"pointer",
            fontFamily:"inherit",fontWeight:700,
            boxShadow:"0 4px 12px rgba(27,94,32,0.4)",
            transition:"opacity 0.15s",
          }}
          onMouseOver={e=>e.currentTarget.style.opacity="0.92"}
          onMouseOut={e=>e.currentTarget.style.opacity="1"}
        >
          प्रवेश गर्नुहोस् / Login
        </button>

      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 7: PROFILE MODAL
// ═══════════════════════════════════════════════════════════════════════════════
function ProfileModal({user,users,setUsers,onClose,t,lang}){
  const [newUname,setNewUname]=useState(user.username);
  const [curPass,setCurPass]=useState("");
  const [newPass,setNewPass]=useState("");
  const [msg,setMsg]=useState("");
  const saveU=()=>{
    if(users.find(u=>u.username===newUname&&u.id!==user.id)){setMsg("यो नाम पहिले नै छ!");return;}
    setUsers(users.map(u=>u.id===user.id?{...u,username:newUname}:u));setMsg(t.updateSuccess);
  };
  const saveP=()=>{
    if(curPass!==user.password){setMsg(t.wrongPassword);return;}
    setUsers(users.map(u=>u.id===user.id?{...u,password:newPass}:u));
    setMsg(t.updateSuccess);setCurPass("");setNewPass("");
  };
  const roleDisplay=user.role==="admin"
    ?"🛡 Admin / प्रशासक"
    :"👤 Member / सदस्य";
  return(
    <Modal title={`👤 ${t.profile}`} onClose={onClose}>
      {/* Logged-in-as banner */}
      <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",borderRadius:"0.75rem",padding:"0.85rem 1rem",marginBottom:"1rem",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:"0.7rem",opacity:0.8,marginBottom:2}}>
          {t.loggedInAs||"लगइन भएको:"}
        </div>
        <div style={{fontSize:"1.05rem",fontWeight:700,letterSpacing:"0.01em",fontFamily:smartFont(user.displayName)}}>
          {user.displayName}
        </div>
        <div style={{marginTop:4,display:"inline-block",background:"rgba(255,255,255,0.2)",borderRadius:"1rem",padding:"2px 12px",fontSize:"0.78rem",fontWeight:600}}>
          {roleDisplay}
        </div>
        <div style={{marginTop:4,fontSize:"0.72rem",opacity:0.75}}>@{user.username}</div>
      </div>
      {/* Credential editing — admin only (defensive: members cannot reach this modal) */}
      {user.role === "admin" && (
        <>
          <h4 style={{color:"#1b5e20",margin:"0 0 0.75rem",fontSize:"0.9rem"}}>{t.changeUsername}</h4>
          <Field label={t.username} value={newUname} onChange={setNewUname}/>
          <Btn onClick={saveU} icon="user">{t.save}</Btn>
          <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"1rem 0"}}/>
          <h4 style={{color:"#1b5e20",margin:"0 0 0.75rem",fontSize:"0.9rem"}}>{t.changePassword}</h4>
          <Field label={t.currentPassword} type="password" value={curPass} onChange={setCurPass}/>
          <Field label={t.newPassword} type="password" value={newPass} onChange={setNewPass}/>
          <Btn onClick={saveP} icon="lock">{t.save}</Btn>
        </>
      )}
      {msg&&<div style={{marginTop:"1rem",padding:"0.6rem",background:"#dcfce7",color:"#166534",borderRadius:"0.5rem",fontSize:"0.85rem"}}>{msg}</div>}

      {/* ── Data Backup / Restore ── */}
      <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"1rem 0"}}/>
      <h4 style={{color:"#1b5e20",margin:"0 0 0.5rem",fontSize:"0.9rem"}}>
        🗄️ {lang==="np"?"डाटा ब्याकअप / रिस्टोर":"Data Backup / Restore"}
      </h4>
      <p style={{fontSize:"0.78rem",color:"#6b7280",margin:"0 0 0.75rem",lineHeight:1.5}}>
        {lang==="np"
          ?"सबै सदस्य, बचत, ऋण, र अन्य डाटा JSON फाइलमा डाउनलोड गर्नुहोस्। यो फाइल राखेर भविष्यमा पुनः लोड गर्न सकिन्छ।"
          :"Download all members, savings, loans, and other data as a JSON file. Keep it safe to restore your data anytime."}
      </p>
      {/* Export backup */}
      <button
        type="button"
        onClick={exportBackup}
        style={{width:"100%",padding:"0.6rem",background:"#1b5e20",color:"#fff",border:"none",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:"0.85rem",marginBottom:"0.5rem",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
      >
        <Icon name="download" size={15} color="#fff"/>
        {lang==="np"?"डाटा ब्याकअप डाउनलोड गर्नुहोस्":"Download Data Backup (.json)"}
      </button>
      {/* Import backup */}
      <label style={{display:"block",width:"100%",padding:"0.6rem",background:"#f0fdf4",color:"#1b5e20",border:"2px dashed #16a34a",borderRadius:"0.5rem",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:"0.85rem",textAlign:"center",boxSizing:"border-box"}}>
        <Icon name="plus" size={14} color="#1b5e20" style={{verticalAlign:"middle",marginRight:4}}/>
        {lang==="np"?" ब्याकअप फाइलबाट रिस्टोर गर्नुहोस्":" Restore from Backup (.json)"}
        <input
          type="file"
          accept=".json,application/json"
          style={{display:"none"}}
          onChange={e=>{
            const file=e.target.files?.[0];
            if(file) importBackup(file, ()=>{});
            e.target.value="";
          }}
        />
      </label>
      <p style={{fontSize:"0.72rem",color:"#9ca3af",margin:"0.4rem 0 0",textAlign:"center"}}>
        {lang==="np"?"⚠ रिस्टोर गर्दा हालको डाटा बदलिनेछ।":"⚠ Restore will overwrite current data with backup."}
      </p>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// USER MANAGEMENT MODAL — Admin-only: create / edit / delete login accounts
// ═══════════════════════════════════════════════════════════════════════════════
function UserManagementModal({users,setUsers,currentUser,onClose,t,lang}){
  const isEn=lang==="en";
  const blank={id:"",username:"",password:"",role:"member",displayName:""};
  const [form,setForm]=useState(blank);
  const [mode,setMode]=useState("list"); // "list"|"add"|"edit"
  const [msg,setMsg]=useState({text:"",ok:true});
  const f=k=>v=>setForm(p=>({...p,[k]:v}));

  const info=(text,ok=true)=>setMsg({text,ok});
  const openAdd=()=>{setForm(blank);setMode("add");setMsg({text:"",ok:true});};
  const openEdit=u=>{setForm({...u});setMode("edit");setMsg({text:"",ok:true});};
  const cancel=()=>{setForm(blank);setMode("list");setMsg({text:"",ok:true});};

  const saveAdd=()=>{
    if(!form.username.trim()||!form.password){info(isEn?"Username and password are required.":"प्रयोगकर्ता नाम र पासवर्ड आवश्यक।",false);return;}
    if(users.find(u=>u.username.toLowerCase()===form.username.trim().toLowerCase())){info(isEn?"Username already taken.":"यो प्रयोगकर्ता नाम पहिले नै छ।",false);return;}
    const newUser={id:uid(),username:form.username.trim(),password:form.password,role:form.role,displayName:form.displayName.trim()||form.username.trim()};
    setUsers(prev=>[...prev,newUser]);
    info(isEn?"User created successfully.":"प्रयोगकर्ता सफलतापूर्वक बनाइयो।");
    setForm(blank);setMode("list");
  };

  const saveEdit=()=>{
    if(!form.username.trim()||!form.password){info(isEn?"Username and password are required.":"प्रयोगकर्ता नाम र पासवर्ड आवश्यक।",false);return;}
    if(users.find(u=>u.username.toLowerCase()===form.username.trim().toLowerCase()&&u.id!==form.id)){info(isEn?"Username already taken.":"यो प्रयोगकर्ता नाम पहिले नै छ।",false);return;}
    // Prevent removing the last admin role
    if(form.role!=="admin"){
      const otherAdmins=users.filter(u=>u.role==="admin"&&u.id!==form.id);
      if(otherAdmins.length===0){info(isEn?"Cannot remove admin role — at least one admin required.":"कम्तीमा एक एडमिन चाहिन्छ।",false);return;}
    }
    setUsers(prev=>prev.map(u=>u.id===form.id?{...form,username:form.username.trim(),displayName:form.displayName.trim()||form.username.trim()}:u));
    info(isEn?"Updated successfully.":"सफलतापूर्वक अपडेट गरियो।");
    setMode("list");
  };

  const del=id=>{
    if(id===currentUser.id){info(isEn?"Cannot delete your own account.":"आफ्नै खाता मेटाउन मिल्दैन।",false);return;}
    const remaining=users.filter(u=>u.id!==id);
    if(!remaining.some(u=>u.role==="admin")){info(isEn?"Cannot delete the last admin account.":"अन्तिम एडमिन खाता मेटाउन मिल्दैन।",false);return;}
    setUsers(prev=>prev.filter(u=>u.id!==id));
    info(isEn?"User deleted.":"प्रयोगकर्ता हटाइयो।");
  };

  const roleBadgeStyle=role=>({
    background:role==="admin"?"#dcfce7":"#dbeafe",
    color:role==="admin"?"#166534":"#1e40af",
    border:`1px solid ${role==="admin"?"#bbf7d0":"#bfdbfe"}`,
    borderRadius:"1rem",padding:"2px 10px",
    fontSize:"0.72rem",fontWeight:700,flexShrink:0,
  });

  return(
    <Modal title={`🔐 ${isEn?"User Management":"प्रयोगकर्ता व्यवस्थापन"}`} onClose={onClose} wide>
      {msg.text&&(
        <div style={{padding:"0.6rem 0.85rem",background:msg.ok?"#dcfce7":"#fee2e2",color:msg.ok?"#166534":"#dc2626",borderRadius:"0.5rem",fontSize:"0.85rem",marginBottom:"1rem",border:`1px solid ${msg.ok?"#bbf7d0":"#fecaca"}`}}>
          {msg.text}
        </div>
      )}

      {mode==="list"&&(
        <>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
            <span style={{fontSize:"0.82rem",color:"#6b7280"}}>{users.length} {isEn?"account(s)":"खाता"}</span>
            <Btn onClick={openAdd} icon="plus">{isEn?"Add User":"नयाँ प्रयोगकर्ता"}</Btn>
          </div>
          {users.map(u=>(
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.7rem 0.85rem",background:u.id===currentUser.id?"#f0fdf4":"#fafafa",borderRadius:"0.625rem",marginBottom:"0.5rem",border:`1px solid ${u.id===currentUser.id?"#bbf7d0":"#e5e7eb"}`}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:"0.875rem",fontFamily:"inherit"}}>{u.displayName||u.username}</div>
                <div style={{fontSize:"0.7rem",color:"#6b7280"}}>@{u.username} {u.id===currentUser.id&&<span style={{color:"#16a34a",fontWeight:600}}>{isEn?"· (You)":"· (तपाईं)"}</span>}</div>
              </div>
              <span style={roleBadgeStyle(u.role)}>{u.role==="admin"?"🛡 Admin":"👤 Member"}</span>
              <button type="button" onClick={()=>openEdit(u)} style={{background:"#e0f2fe",border:"1px solid #bae6fd",borderRadius:"0.4rem",padding:"4px 10px",cursor:"pointer",fontSize:"0.75rem",color:"#0369a1",fontWeight:600,fontFamily:"inherit"}}>
                {isEn?"Edit":"सम्पादन"}
              </button>
              {u.id!==currentUser.id&&(
                <button type="button" onClick={()=>del(u.id)} style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"0.4rem",padding:"4px 10px",cursor:"pointer",fontSize:"0.75rem",color:"#dc2626",fontWeight:600,fontFamily:"inherit"}}>
                  {isEn?"Delete":"हटाउनुहोस्"}
                </button>
              )}
            </div>
          ))}
        </>
      )}

      {(mode==="add"||mode==="edit")&&(
        <div>
          <h4 style={{color:"#1b5e20",margin:"0 0 1rem",fontSize:"0.9rem"}}>
            {mode==="add"?(isEn?"➕ New User":"➕ नयाँ प्रयोगकर्ता"):(isEn?"✏️ Edit User":"✏️ प्रयोगकर्ता सम्पादन")}
          </h4>
          <Field label={isEn?"Display Name":"प्रदर्शन नाम"} value={form.displayName} onChange={f("displayName")}/>
          <Field label={isEn?"Username":"प्रयोगकर्ता नाम"} value={form.username} onChange={f("username")} required/>
          <Field label={isEn?"Password":"पासवर्ड"} type="password" value={form.password} onChange={f("password")} required/>
          <Field label={isEn?"Role":"भूमिका"} type="select" value={form.role} onChange={f("role")} options={[{value:"admin",label:"🛡 Admin / प्रशासक"},{value:"member",label:"👤 Member / सदस्य"}]}/>
          <div style={{display:"flex",gap:"0.5rem",marginTop:"1rem"}}>
            <Btn onClick={mode==="add"?saveAdd:saveEdit} icon="user">{t.save}</Btn>
            <button type="button" onClick={cancel} style={{padding:"0.5rem 1rem",border:"1px solid #d1d5db",borderRadius:"0.5rem",background:"#f9fafb",cursor:"pointer",fontFamily:"inherit",fontSize:"0.85rem",color:"#374151"}}>
              {isEn?"Cancel":"रद्द"}
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 8: CATEGORY MANAGER
// ═══════════════════════════════════════════════════════════════════════════════
function CategoryManager({categories,setCategories,onClose,t,cash,bank,ie,savings,loans}){
  const [nc,setNc]=useState({type:"income",key:"",label:""});
  const [err,setErr]=useState("");
  const groups=["income","expense","assets","liabilities"];

  const addCat=()=>{
    if(!nc.key||!nc.label){setErr("सबै क्षेत्र भर्नुहोस्।");return;}
    if((categories[nc.type]||[]).includes(nc.key)){setErr("यो श्रेणी पहिले नै छ!");return;}
    // Use functional setter so we always work on latest state
    setCategories(prev=>({...prev,[nc.type]:[...(prev[nc.type]||[]),nc.key]}));
    setCatLabel(nc.key, nc.label);
    setNc({type:"income",key:"",label:""});setErr("");
  };

  const delCat=(type,key)=>{
    // Check if category is used in any records
    const allRecords=[...(cash||[]),...(bank||[]),...(ie||[]),...(savings||[]),...(loans||[])];
    const usedCount=allRecords.filter(r=>r.category===key).length;
    const isEn=(t.appSub||"").includes("Loan Management");
    if(usedCount>0){
      // alert (not confirm) is fine here — it works in sandboxed iframes
      const msg=isEn
        ?`This category is used in ${usedCount} record(s). It will be removed from the category list but existing records keep their data.`
        :`यो श्रेणी ${usedCount} रेकर्डमा प्रयोग भएको छ। श्रेणी सूचीबाट हटाइनेछ तर रेकर्डको डाटा सुरक्षित रहनेछ।`;
      alert(msg);
    }
    // Use functional setter to avoid stale closure bug
    setCategories(prev=>({
      ...prev,
      [type]:(prev[type]||[]).filter(c=>c!==key)
    }));
  };

  const getLabel=k=>getCatLabel(k)||catLabel(k,t);

  const groupLabels={income:"आय / Income",expense:"व्यय / Expense",assets:"सम्पत्ति / Assets",liabilities:"दायित्व / Liabilities"};

  return(
    <Modal title={`🏷️ ${t.category}`} onClose={onClose} wide>
      {groups.map(g=>(
        <div key={g} style={{marginBottom:"1.25rem"}}>
          <div style={{fontWeight:700,color:"#1b5e20",marginBottom:"0.5rem",fontSize:"0.82rem",letterSpacing:"0.04em",textTransform:"uppercase"}}>
            {groupLabels[g]||g}
          </div>
          <div style={{display:"flex",flexWrap:"wrap",gap:"0.4rem",minHeight:"2rem"}}>
            {(categories[g]||[]).length===0 && (
              <span style={{fontSize:"0.78rem",color:"#9ca3af",fontStyle:"italic"}}>
                {t.noData||"No categories."}
              </span>
            )}
            {(categories[g]||[]).map(k=>(
              <div key={k} style={{
                background:"#dcfce7",borderRadius:"1rem",
                padding:"4px 6px 4px 12px",fontSize:"0.8rem",
                display:"inline-flex",alignItems:"center",gap:6,
                border:"1px solid #bbf7d0"
              }}>
                <span>{getLabel(k)}</span>
                {/* FIX: type="button" prevents modal form submit; padding gives proper click area */}
                <button
                  type="button"
                  onClick={()=>delCat(g,k)}
                  title="Delete"
                  style={{
                    background:"#fee2e2",border:"1px solid #fecaca",cursor:"pointer",
                    color:"#dc2626",padding:"2px 6px",lineHeight:1,
                    borderRadius:"0.75rem",fontSize:"0.75rem",fontWeight:700,
                    display:"inline-flex",alignItems:"center",justifyContent:"center",
                    minWidth:20,minHeight:20,flexShrink:0
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
      <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"1rem 0"}}/>
      <h4 style={{margin:"0 0 0.75rem",color:"#1b5e20"}}>{t.addCategory}</h4>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
        <Field label="Type" type="select" value={nc.type} onChange={v=>setNc(p=>({...p,type:v}))} options={groups.map(g=>({value:g,label:groupLabels[g]||g}))}/>
        <Field label="Key (English, no spaces)" value={nc.key} onChange={v=>setNc(p=>({...p,key:v.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"")}))}/>
      </div>
      <Field label="Label (Nepali / English)" value={nc.label} onChange={v=>setNc(p=>({...p,label:v}))}/>
      {err&&<div style={{color:"#dc2626",fontSize:"0.82rem",marginBottom:"0.75rem",padding:"0.4rem 0.6rem",background:"#fee2e2",borderRadius:"0.4rem"}}>{err}</div>}
      <Btn onClick={addCat} icon="plus">{t.addCategory}</Btn>
    </Modal>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MEMBER DASHBOARD — read-only view shown to users with role="member"
// They see group totals and their own savings/loan records only.
// No add/edit/delete buttons visible. No admin pages accessible.
// ═══════════════════════════════════════════════════════════════════════════════
function MemberDashboard({currentUser,onLogout,lang,setLang,t,fmtFn,useBS,
  totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,
  members,savings,loans,loanPayments,getMember}){
  const [tab,setTab]=useState("summary");

  // Find this member's linked member record by matching displayName or just show all (member sees all group data read-only)
  // For simplicity: members can view all group summary + full savings + full loan tables (read-only)
  const tabs=[
    {id:"summary",  label:lang==="np"?"सारांश":"Summary",   emoji:"📊"},
    {id:"savings",  label:lang==="np"?"बचत":"Savings",      emoji:"💰"},
    {id:"loans",    label:lang==="np"?"ऋण":"Loans",         emoji:"🏦"},
  ];

  const StatC=({label,value,color,icon})=>(
    <div style={{background:"#fff",borderRadius:"0.875rem",padding:"1rem",boxShadow:"0 2px 8px rgba(0,0,0,0.08)",borderLeft:`4px solid ${color}`,display:"flex",alignItems:"center",gap:"0.75rem"}}>
      <div style={{background:color+"18",borderRadius:"50%",width:40,height:40,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:"1.2rem"}}>{icon}</div>
      <div>
        <div style={{fontSize:"0.7rem",color:"#6b7280",fontWeight:600,marginBottom:2}}>{label}</div>
        <div style={{fontSize:"1rem",fontWeight:700,color:"#111827"}}>{value}</div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#f0fdf4",fontFamily:"'Poppins','Tiro Devanagari Sanskrit','Mangal',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* Member header */}
      <header style={{
        background:"linear-gradient(135deg,#1565c0,#1976d2)",
        color:"#fff",height:52,padding:"0 12px",
        display:"flex",alignItems:"center",gap:8,
        position:"sticky",top:0,zIndex:200,
        boxShadow:"0 2px 10px rgba(0,0,0,0.3)",overflow:"hidden",
      }}>
        <div style={{width:36,height:36,borderRadius:"50%",background:"#fff",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
          <img src={LOGO_SRC} alt="Fulbari Yuwa Samuha Logo" style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}/>
        </div>
        <div style={{flex:"1 1 0",minWidth:0,overflow:"hidden"}}>
          <div style={{fontWeight:700,fontSize:"clamp(0.72rem,3.5vw,0.95rem)",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>
            {t.appName}
          </div>
          <div style={{fontSize:"0.6rem",opacity:0.8,whiteSpace:"nowrap"}}>
            👤 {lang==="np"?"सदस्य ड्यासबोर्ड":"Member Dashboard"} — {currentUser.displayName}
          </div>
        </div>
        <div style={{display:"flex",gap:5,flexShrink:0,alignItems:"center"}}>
          {/* Sync status indicator */}
          <SyncIndicator/>
          <button type="button" onClick={()=>setLang(lang==="np"?"en":"np")}
            style={{background:"rgba(255,255,255,0.15)",border:"1px solid rgba(255,255,255,0.25)",borderRadius:"0.4rem",width:32,height:32,cursor:"pointer",color:"#fff",fontSize:"0.7rem",fontWeight:700,fontFamily:"'Poppins',sans-serif",display:"flex",alignItems:"center",justifyContent:"center"}}>
            {lang==="np"?"EN":"NP"}
          </button>
          <button type="button" onClick={onLogout}
            style={{background:"rgba(185,28,28,0.8)",border:"none",borderRadius:"0.4rem",width:32,height:32,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon name="close" size={14} color="#fff"/>
          </button>
        </div>
      </header>

      {/* Member role badge */}
      <div style={{background:"#1565c0",padding:"0.45rem 1rem",display:"flex",alignItems:"center",gap:8}}>
        <span style={{background:"rgba(255,255,255,0.2)",borderRadius:"1rem",padding:"2px 12px",fontSize:"0.72rem",fontWeight:700,color:"#fff"}}>
          👤 {lang==="np"?"सदस्य (पढ्ने मात्र)":"Member — Read Only"}
        </span>
        <span style={{fontSize:"0.68rem",color:"rgba(255,255,255,0.75)"}}>
          {lang==="np"?"तपाईंसँग संपादन अनुमति छैन।":"You do not have edit permissions."}
        </span>
      </div>

      {/* Tab nav */}
      <nav style={{background:"#fff",borderBottom:"2px solid #bfdbfe",display:"flex",overflowX:"auto",boxShadow:"0 2px 4px rgba(0,0,0,0.05)"}}>
        {tabs.map(tb=>(
          <button key={tb.id} onClick={()=>setTab(tb.id)}
            style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0.55rem 1.2rem",border:"none",background:"none",cursor:"pointer",
              color:tab===tb.id?"#1565c0":"#6b7280",fontWeight:tab===tb.id?700:500,
              fontSize:"0.72rem",fontFamily:"inherit",whiteSpace:"nowrap",
              borderBottom:tab===tb.id?"3px solid #1565c0":"3px solid transparent",transition:"all 0.15s"}}>
            <span style={{fontSize:"1rem"}}>{tb.emoji}</span>
            {tb.label}
          </button>
        ))}
      </nav>

      <main style={{padding:"1rem",maxWidth:720,margin:"0 auto"}}>

        {/* SUMMARY TAB */}
        {tab==="summary"&&(
          <div>
            <h2 style={{color:"#1565c0",margin:"0 0 1rem",fontSize:"1rem"}}>
              📊 {lang==="np"?"समूह सारांश":"Group Summary"}
            </h2>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:"0.75rem",marginBottom:"1.5rem"}}>
              <StatC label={t.totalSaving}    value={fmtFn(totalSaving)}    color="#16a34a" icon="💰"/>
              <StatC label={t.loanOutstanding} value={fmtFn(totalLoanOut)}  color="#dc2626" icon="🏦"/>
              <StatC label={t.cashBalance}     value={fmtFn(cashBal)}       color="#d97706" icon="💵"/>
              <StatC label={t.bankBalance}     value={fmtFn(bankBal)}       color="#2563eb" icon="🏛"/>
              <StatC label={t.monthlyIncome}   value={fmtFn(monthlyIncome)} color="#7c3aed" icon="📈"/>
              <StatC label={t.monthlyExpense}  value={fmtFn(monthlyExpense)}color="#be185d" icon="📉"/>
            </div>
            <div style={{background:"linear-gradient(135deg,#1565c0,#1976d2)",borderRadius:"1rem",padding:"1.25rem",color:"#fff",textAlign:"center",marginBottom:"1rem"}}>
              <div style={{fontSize:"0.85rem",opacity:0.85,marginBottom:4}}>{t.totalFund}</div>
              <div style={{fontSize:"1.8rem",fontWeight:700}}>{fmtFn(totalFund)}</div>
              <div style={{fontSize:"0.72rem",opacity:0.7,marginTop:4}}>
                {t.totalMembers}: {members.length} {lang==="np"?"जना":"members"}
              </div>
            </div>
            {/* Members list read-only */}
            <div style={{background:"#fff",borderRadius:"0.875rem",padding:"1rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
              <h3 style={{margin:"0 0 0.75rem",color:"#1565c0",fontSize:"0.9rem"}}>👥 {t.members}</h3>
              <div style={{display:"flex",flexDirection:"column",gap:"0.5rem"}}>
                {members.map((m,i)=>(
                  <div key={m.id||i} style={{display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.5rem 0.75rem",background:"#f0f9ff",borderRadius:"0.5rem",border:"1px solid #bae6fd"}}>
                    <div style={{width:32,height:32,borderRadius:"50%",background:"#1565c0",color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:"0.85rem",flexShrink:0}}>
                      {(getMemberDisplayName(m,lang)||"?")[0].toUpperCase()}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontWeight:600,fontSize:"0.85rem",fontFamily:smartFont(getMemberDisplayName(m,lang))}}>{getMemberDisplayName(m,lang)}</div>
                      <div style={{fontSize:"0.7rem",color:"#6b7280"}}>{m.phone||""} {m.address?`• ${m.address}`:""}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SAVINGS TAB */}
        {tab==="savings"&&(
          <div>
            <h2 style={{color:"#1565c0",margin:"0 0 1rem",fontSize:"1rem"}}>💰 {t.saving}</h2>
            <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead>
                    <tr style={{background:"#dbeafe"}}>
                      {[t.date,t.member,t.particulars,t.deposit,t.withdraw].map(h=>(
                        <th key={h} style={{padding:"0.6rem 0.75rem",textAlign:"left",color:"#1565c0",fontWeight:700,whiteSpace:"nowrap",borderBottom:"2px solid #bfdbfe"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {savings.length===0&&(
                      <tr><td colSpan={5} style={{textAlign:"center",padding:"2rem",color:"#9ca3af",fontStyle:"italic"}}>{t.noData}</td></tr>
                    )}
                    {[...savings].sort((a,b)=>b.date.localeCompare(a.date)).map((s,i)=>(
                      <tr key={s.id||i} style={{background:i%2===0?"#fff":"#f0f9ff",borderBottom:"1px solid #f3f4f6"}}>
                        <td style={{padding:"0.5rem 0.75rem",whiteSpace:"nowrap"}}>{displayDate(s.date,lang,useBS)}</td>
                        <td style={{padding:"0.5rem 0.75rem"}}>{getMemberDisplayName(getMember(s.memberId),lang)}</td>
                        <td style={{padding:"0.5rem 0.75rem"}}>{s.particulars}</td>
                        <td style={{padding:"0.5rem 0.75rem",color:"#16a34a",fontWeight:600}}>{s.deposit?fmtFn(s.deposit):"—"}</td>
                        <td style={{padding:"0.5rem 0.75rem",color:"#dc2626"}}>{s.withdraw?fmtFn(s.withdraw):"—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* LOANS TAB */}
        {tab==="loans"&&(
          <div>
            <h2 style={{color:"#1565c0",margin:"0 0 1rem",fontSize:"1rem"}}>🏦 {t.loan}</h2>
            <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.8rem"}}>
                  <thead>
                    <tr style={{background:"#dbeafe"}}>
                      {[t.date,t.member,t.particulars,t.loanAmount,t.remaining].map(h=>(
                        <th key={h} style={{padding:"0.6rem 0.75rem",textAlign:"left",color:"#1565c0",fontWeight:700,whiteSpace:"nowrap",borderBottom:"2px solid #bfdbfe"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {loans.length===0&&(
                      <tr><td colSpan={5} style={{textAlign:"center",padding:"2rem",color:"#9ca3af",fontStyle:"italic"}}>{t.noData}</td></tr>
                    )}
                    {[...loans].sort((a,b)=>(b.startDate||b.date||"").localeCompare(a.startDate||a.date||"")).map((l,i)=>{
                      const paid=(loanPayments||[]).filter(p=>p.loanId===l.id).reduce((s,p)=>s+(p.principalPaid||0),0);
                      const remaining=Math.max(0,(l.principal||0)-paid);
                      return(
                        <tr key={l.id||i} style={{background:i%2===0?"#fff":"#f0f9ff",borderBottom:"1px solid #f3f4f6"}}>
                          <td style={{padding:"0.5rem 0.75rem",whiteSpace:"nowrap"}}>{displayDate(l.startDate||l.date,lang,useBS)}</td>
                          <td style={{padding:"0.5rem 0.75rem"}}>{getMemberDisplayName(getMember(l.memberId),lang)}</td>
                          <td style={{padding:"0.5rem 0.75rem"}}>{l.particulars}</td>
                          <td style={{padding:"0.5rem 0.75rem",color:"#1565c0",fontWeight:600}}>{fmtFn(l.principal||0)}</td>
                          <td style={{padding:"0.5rem 0.75rem",color:remaining>0?"#dc2626":"#16a34a",fontWeight:600}}>{fmtFn(remaining)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 9: MAIN APP (Admin only reaches here)
// ═══════════════════════════════════════════════════════════════════════════════
export default function App(){
  const [lang,setLangState]=useState(()=>lsGet(STORAGE_KEYS.lang)||"np");
  const t=T[lang];
  const fmtFn=lang==="en"?fmtEn:fmt;
  const setLang=l=>{ setLangState(l); lsSet(STORAGE_KEYS.lang, l); };

  const [users,setUsers]=useFirebaseStore("fys_data/users",STORAGE_KEYS.users,SEED_USERS);
  const [currentUser,setCurrentUser]=useState(()=>lsGet(STORAGE_KEYS.session));
  const [tab,setTab]=useState("dashboard");
  const [showProfile,setShowProfile]=useState(false);
  const [showCatMgr,setShowCatMgr]=useState(false);
  const [showUserMgr,setShowUserMgr]=useState(false);
  const [showSettings,setShowSettings]=useState(false);
  const [showBackup,setShowBackup]=useState(false);
  const [useBS,setUseBS]=useState(true);

  const [members,setMembers]=useFirebaseStore("fys_data/members",STORAGE_KEYS.members,SEED_MEMBERS);
  const [savings,setSavings]=useFirebaseStore("fys_data/savings",STORAGE_KEYS.savings,SEED_SAVINGS);
  const [loans,setLoans]=useFirebaseStore("fys_data/loans",STORAGE_KEYS.loans,SEED_LOANS);
  const [loanPayments,setLoanPayments]=useFirebaseStore("fys_data/loanPayments",STORAGE_KEYS.loanPayments,SEED_LOAN_PAYMENTS);
  const [cash,setCash]=useFirebaseStore("fys_data/cash",STORAGE_KEYS.cash,SEED_CASH);
  const [bank,setBank]=useFirebaseStore("fys_data/bank",STORAGE_KEYS.bank,SEED_BANK);
  const [ie,setIE]=useFirebaseStore("fys_data/ie",STORAGE_KEYS.ie,SEED_IE);
  const [categories,setCategories]=useFirebaseStore("fys_data/categories",STORAGE_KEYS.categories,SEED_CATEGORIES);
  const [search,setSearch]=useState("");
  const [filterStart,setFilterStart]=useState("");
  const [filterEnd,setFilterEnd]=useState("");

  // Strictly two roles: "admin" = full access, "member" = read-only
  // Any stored session from old multi-role system: treat non-"member" as admin
  const isAdmin=currentUser&&(currentUser.role==="admin"||
    (currentUser.role!=="member"&&!!currentUser.role));

  const login=u=>{ setCurrentUser(u); lsSet(STORAGE_KEYS.session, u); };
  const logout=()=>{ setCurrentUser(null); try{localStorage.removeItem(STORAGE_KEYS.session);}catch{} };

  // Sync session when users update (pw/username change)
  useEffect(()=>{
    if(currentUser){
      const u=users.find(x=>x.id===currentUser.id);
      if(u&&(u.username!==currentUser.username||u.password!==currentUser.password)){
        setCurrentUser(u); lsSet(STORAGE_KEYS.session, u);
      }
    }
  },[users]);

  // ── Sync helpers ───────────────────────────────────────────────────────────
  // Only income/expense entries sync to IE; assets/liabilities do NOT.
  const shouldSync=entry=>!entry.txType||entry.txType==="income"||entry.txType==="expense";

  const mkSync=(entry,source)=>{
    const isIn=source==="cash"?(entry.cashIn||0)>0:(entry.deposit||0)>0;
    const amt=isIn?(source==="cash"?entry.cashIn:entry.deposit):(source==="cash"?entry.cashOut:entry.withdrawal);
    const tag=source==="cash"?"[Cash]":"[Bank]";
    return{ id:entry.txId+"_s", date:entry.date, particulars:`${entry.particulars} ${tag}`, income:isIn?amt:0, expense:isIn?0:amt, category:entry.category||"otherExpense", txId:entry.txId, source, modifiedAt:new Date().toISOString() };
  };

  const addCash=useCallback(e=>{
    const tx=uid();
    const en={...e,txId:tx,id:uid(),modifiedAt:new Date().toISOString()};
    setCash(c=>[...c,en]);
    if(shouldSync(en)) setIE(i=>[...i.filter(x=>x.txId!==tx),mkSync(en,"cash")]);
  },[]);
  const updCash=useCallback(e=>{
    const en={...e,modifiedAt:new Date().toISOString()};
    setCash(c=>c.map(x=>x.id===e.id?en:x));
    if(shouldSync(en)) setIE(i=>[...i.filter(x=>x.txId!==en.txId),mkSync(en,"cash")]);
    else setIE(i=>i.filter(x=>x.txId!==en.txId)); // remove stale sync if type changed
  },[]);
  const delCash=useCallback(id=>{ const en=cash.find(c=>c.id===id); setCash(c=>c.filter(x=>x.id!==id)); if(en?.txId) setIE(i=>i.filter(x=>x.txId!==en.txId)); },[cash]);

  const addBank=useCallback(e=>{
    const tx=uid();
    const en={...e,txId:tx,id:uid(),modifiedAt:new Date().toISOString()};
    setBank(b=>[...b,en]);
    if(shouldSync(en)) setIE(i=>[...i.filter(x=>x.txId!==tx),mkSync(en,"bank")]);
  },[]);
  const updBank=useCallback(e=>{
    const en={...e,modifiedAt:new Date().toISOString()};
    setBank(b=>b.map(x=>x.id===e.id?en:x));
    if(shouldSync(en)) setIE(i=>[...i.filter(x=>x.txId!==en.txId),mkSync(en,"bank")]);
    else setIE(i=>i.filter(x=>x.txId!==en.txId)); // remove stale sync if type changed
  },[]);
  const delBank=useCallback(id=>{ const en=bank.find(b=>b.id===id); setBank(b=>b.filter(x=>x.id!==id)); if(en?.txId) setIE(i=>i.filter(x=>x.txId!==en.txId)); },[bank]);


  // ── Migrate old-format loans (loanAmount/principalPaid fields → new structure) ──
  useEffect(()=>{
    const needsMigration=loans.some(l=>l.loanAmount!==undefined&&l.principal===undefined);
    if(!needsMigration)return;
    setLoans(prev=>prev.map(l=>{
      if(l.loanAmount===undefined||l.principal!==undefined)return l;
      return{
        id:l.id,memberId:l.memberId||"",
        startDate:l.date||l.startDate||today(),
        particulars:l.particulars||"",
        principal:+(l.loanAmount||0),
        interestRate:+(l.interestRate||12),
        duration:+(l.duration||12),
        modifiedAt:l.modifiedAt||new Date().toISOString(),
      };
    }));
  },[loans]);

  // ── Computed totals ────────────────────────────────────────────────────────
  const totalSaving=savings.reduce((a,s)=>a+(s.deposit||0)-(s.withdraw||0),0);
  const totalLoanOut=loans.reduce((a,l)=>{const paid=(loanPayments||[]).filter(p=>p.loanId===l.id).reduce((s,p)=>s+(p.principalPaid||0),0);return a+Math.max(0,(l.principal||0)-paid);},0);
  const cashBal=cash.reduce((a,c)=>a+(c.cashIn||0)-(c.cashOut||0),0);
  const bankBal=bank.reduce((a,b)=>a+(b.deposit||0)-(b.withdrawal||0),0);
  const nowBS=adToBS(today());
  const monthlyIncome=ie.filter(x=>{const bs=adToBS(x.date);return bs.y===nowBS.y&&bs.m===nowBS.m;}).reduce((a,x)=>a+(x.income||0),0);
  const monthlyExpense=ie.filter(x=>{const bs=adToBS(x.date);return bs.y===nowBS.y&&bs.m===nowBS.m;}).reduce((a,x)=>a+(x.expense||0),0);
  const totalFund=totalSaving+ie.reduce((a,x)=>a+(x.income||0)-(x.expense||0),0);

  const getMember=id=>members.find(m=>m.id===id);
  const memberOptions=[{value:"",label:t.selectMember},...members.map(m=>({value:m.id,label:getMemberDisplayName(m,lang)}))];
  const sp={lang,t,useBS,fmtFn,isAdmin,categories};

  if(!currentUser) return <LoginScreen users={users} onLogin={login}/>;

  // ── Member-only dashboard ──────────────────────────────────────────────────
  // Members see a clean read-only summary; they cannot access any admin pages.
  if(currentUser.role==="member"){
    return(
      <MemberDashboard
        currentUser={currentUser}
        onLogout={logout}
        lang={lang} setLang={setLang} t={t} fmtFn={fmtFn} useBS={useBS}
        totalSaving={totalSaving} totalLoanOut={totalLoanOut}
        cashBal={cashBal} bankBal={bankBal}
        monthlyIncome={monthlyIncome} monthlyExpense={monthlyExpense}
        totalFund={totalFund} members={members}
        savings={savings} loans={loans} loanPayments={loanPayments}
        getMember={getMember}
      />
    );
  }
  // Reusable style for every compact header icon button
  const hBtn=(extra={})=>({
    background:"rgba(255,255,255,0.13)",
    border:"1px solid rgba(255,255,255,0.22)",
    borderRadius:"0.4rem",
    width:32,height:32,
    padding:0,
    display:"flex",alignItems:"center",justifyContent:"center",
    cursor:"pointer",flexShrink:0,
    ...extra,
  });

  return(
    <div style={{minHeight:"100vh",background:"#f0fdf4",fontFamily:"'Poppins','Tiro Devanagari Sanskrit','Mangal',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* ══════════════════════════════════════════════════════════════
          HEADER — clean mobile-app style
          Structure: [logo 32px] [title flex-1 centered] [buttons 32px each]
          Fixed height 52px, overflow hidden, no text wrapping.
          Auth is fully intact — only the display is changed.
          ══════════════════════════════════════════════════════════════ */}
      <header style={{
        background:"linear-gradient(135deg,#1b5e20,#2e7d32)",
        color:"#fff",
        height:52,                       /* fixed — never grows */
        padding:"0 10px",
        display:"flex",
        alignItems:"center",
        gap:8,
        position:"sticky",
        top:0,
        zIndex:200,
        boxShadow:"0 2px 10px rgba(0,0,0,0.3)",
        overflow:"hidden",
        boxSizing:"border-box",
      }}>

        {/* ── Logo circle ── */}
        <div style={{
          width:42,height:42,borderRadius:"50%",
          background:"#fff",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
          overflow:"hidden",
          boxShadow:"0 1px 6px rgba(0,0,0,0.3)",
        }}>
          <img
            src={LOGO_SRC}
            alt="Fulbari Yuwa Samuha Logo"
            style={{width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%"}}
          />
        </div>

        {/* ── App name — takes all available space, centered ── */}
        <div style={{flex:"1 1 0",minWidth:0,overflow:"hidden",textAlign:"center"}}>
          <div style={{
            fontFamily:"'Poppins',sans-serif",
            fontWeight:700,
            fontSize:"clamp(0.75rem,3.8vw,1rem)",
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis",
            lineHeight:1.25,
            letterSpacing:"0.01em",
          }}>
            {t.appName}
          </div>
          <div style={{
            fontFamily:"'Poppins',sans-serif",
            fontSize:"clamp(0.5rem,1.8vw,0.62rem)",
            opacity:0.75,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis",
            lineHeight:1.2,
          }}>
            {t.appSub}
          </div>
        </div>

        {/* ── Right side: sync + settings gear + logout only ── */}
        <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0,position:"relative"}}>

          <SyncIndicator/>

          {/* ⚙️ Settings button */}
          <button type="button"
            onClick={()=>setShowSettings(s=>!s)}
            title={lang==="np"?"सेटिङ्स":"Settings"}
            style={hBtn({background:showSettings?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.13)"})}
          >
            {/* Gear SVG */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>

          {/* Logout — always visible, red */}
          <button type="button"
            onClick={logout}
            title={t.logout}
            style={hBtn({background:"rgba(185,28,28,0.82)",border:"1px solid rgba(255,255,255,0.12)"})}
          >
            <Icon name="close" size={13} color="#fff"/>
          </button>

          {/* Settings dropdown panel */}
          {showSettings&&(
            <>
              {/* Invisible backdrop — closes on outside click */}
              <div
                onClick={()=>setShowSettings(false)}
                style={{position:"fixed",inset:0,zIndex:299}}
              />
              {/* Panel */}
              <div style={{
                position:"fixed",
                top:58,
                right:10,
                zIndex:300,
                background:"#fff",
                borderRadius:"0.875rem",
                boxShadow:"0 8px 32px rgba(0,0,0,0.22)",
                minWidth:240,
                overflow:"hidden",
                border:"1px solid #e5e7eb",
              }}>
                {/* Panel header */}
                <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",padding:"0.7rem 1rem",color:"#fff"}}>
                  <div style={{fontWeight:700,fontSize:"0.88rem"}}>{lang==="np"?"⚙️ सेटिङ्स":"⚙️ Settings"}</div>
                  <div style={{fontSize:"0.68rem",opacity:0.8,marginTop:1}}>{currentUser?.displayName||currentUser?.username||""}</div>
                </div>

                {/* Language toggle */}
                <button type="button"
                  onClick={()=>{setLang(lang==="np"?"en":"np");}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                >
                  <span style={{width:32,height:32,borderRadius:"50%",background:"#f0fdf4",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="globe" size={15} color="#1b5e20"/>
                  </span>
                  <div>
                    <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{lang==="np"?"Switch to English":"नेपालीमा जानुस्"}</div>
                    <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{lang==="np"?"English":"नेपाली"} → {lang==="np"?"English":"नेपाली"}</div>
                  </div>
                  <span style={{marginLeft:"auto",fontSize:"0.7rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"0.3rem",background:"#f0fdf4",color:"#1b5e20"}}>{lang==="np"?"EN":"NP"}</span>
                </button>

                {/* BS/AD toggle */}
                <button type="button"
                  onClick={()=>setUseBS(b=>!b)}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                >
                  <span style={{width:32,height:32,borderRadius:"50%",background:"#eff6ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="calendar" size={15} color="#2563eb"/>
                  </span>
                  <div>
                    <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{lang==="np"?"मिति प्रणाली":"Calendar System"}</div>
                    <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{lang==="np"?"वि.सं. / ई.सं. बदल्नुस्":"Toggle BS / AD"}</div>
                  </div>
                  <span style={{marginLeft:"auto",fontSize:"0.7rem",fontWeight:700,padding:"0.2rem 0.5rem",borderRadius:"0.3rem",background:"#eff6ff",color:"#2563eb"}}>{useBS?t.bsLabel:t.adLabel}</span>
                </button>

                {/* Profile */}
                <button type="button"
                  onClick={()=>{setShowProfile(true);setShowSettings(false);}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                >
                  <span style={{width:32,height:32,borderRadius:"50%",background:"#fdf4ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="user" size={15} color="#7c3aed"/>
                  </span>
                  <div>
                    <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{lang==="np"?"प्रोफाइल":"Profile"}</div>
                    <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{currentUser?.displayName||currentUser?.username||""}</div>
                  </div>
                </button>

                {/* Categories — admin only */}
                {isAdmin&&(
                  <button type="button"
                    onClick={()=>{setShowCatMgr(true);setShowSettings(false);}}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                  >
                    <span style={{width:32,height:32,borderRadius:"50%",background:"#fff7ed",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon name="tag" size={15} color="#ea580c"/>
                    </span>
                    <div>
                      <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{t.category||"Categories"}</div>
                      <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{lang==="np"?"आय/व्यय श्रेणी":"Manage income & expense categories"}</div>
                    </div>
                  </button>
                )}

                {/* User Management — admin only */}
                {isAdmin&&(
                  <button type="button"
                    onClick={()=>{setShowUserMgr(true);setShowSettings(false);}}
                    style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                  >
                    <span style={{width:32,height:32,borderRadius:"50%",background:"#fef2f2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <Icon name="lock" size={15} color="#dc2626"/>
                    </span>
                    <div>
                      <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{lang==="np"?"प्रयोगकर्ता व्यवस्थापन":"User Management"}</div>
                      <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{lang==="np"?"प्रयोगकर्ता थप्नुस्/हटाउनुस्":"Add or remove users"}</div>
                    </div>
                  </button>
                )}

                {/* Data Backup & Recovery */}
                <button type="button"
                  onClick={()=>{setShowBackup(true);setShowSettings(false);}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff",cursor:"pointer",borderBottom:"1px solid #f3f4f6",fontFamily:"inherit",textAlign:"left"}}
                >
                  <span style={{width:32,height:32,borderRadius:"50%",background:"#f0f9ff",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="download" size={15} color="#0284c7"/>
                  </span>
                  <div>
                    <div style={{fontSize:"0.83rem",fontWeight:600,color:"#111827"}}>{lang==="np"?"डाटा ब्याकअप / रिकभरी":"Data Backup & Recovery"}</div>
                    <div style={{fontSize:"0.68rem",color:"#6b7280"}}>{lang==="np"?"ब्याकअप डाउनलोड वा रिस्टोर गर्नुहोस्":"Export or restore all app data"}</div>
                  </div>
                </button>

                {/* Logout */}
                <button type="button"
                  onClick={()=>{setShowSettings(false);logout();}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:"0.75rem",padding:"0.75rem 1rem",border:"none",background:"#fff5f5",cursor:"pointer",fontFamily:"inherit",textAlign:"left"}}
                >
                  <span style={{width:32,height:32,borderRadius:"50%",background:"#fee2e2",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                    <Icon name="close" size={14} color="#dc2626"/>
                  </span>
                  <div>
                    <div style={{fontSize:"0.83rem",fontWeight:700,color:"#dc2626"}}>{t.logout}</div>
                    <div style={{fontSize:"0.68rem",color:"#9ca3af"}}>{currentUser?.username||""}</div>
                  </div>
                </button>

              </div>
            </>
          )}

        </div>
      </header>

      {/* ── Page content — padded bottom so it clears the fixed bottom nav ── */}
      <main style={{padding:"1rem",maxWidth:960,margin:"0 auto",paddingBottom:"5rem"}}>

        {/* ── DASHBOARD ── */}
        {tab==="dashboard"&&(
          <Dashboard {...{totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,lang,t,useBS,fmtFn,getMember}}/>
        )}

        {/* ── MEMBERS ── */}
        {tab==="members"&&(
          <Members {...{members,setMembers,search,setSearch,...sp}}/>
        )}

        {/* ── FINANCE (Saving + Loan + Income/Expense combined) ── */}
        {tab==="finance"&&(
          <FinancePage {...{savings,setSavings,loans,setLoans,loanPayments,setLoanPayments,ie,setIE,members,memberOptions,getMember,filterStart,setFilterStart,filterEnd,setFilterEnd,...sp}}/>
        )}

        {/* ── BOOKS (Cash Book + Bank Book combined) ── */}
        {tab==="books"&&(
          <BooksPage {...{cash,addCash,updCash,delCash,bank,addBank,updBank,delBank,...sp}}/>
        )}

        {/* ── REPORT ── */}
        {tab==="report"&&(
          <Reports {...{totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,loans,loanPayments,cash,bank,ie,filterStart,filterEnd,...sp}}/>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════
          BOTTOM NAVIGATION — fixed, 5 tabs, mobile-app style
          ══════════════════════════════════════════════════════════════ */}
      <nav style={{
        position:"fixed",bottom:0,left:0,right:0,
        height:58,
        background:"#fff",
        borderTop:"1.5px solid #bbf7d0",
        display:"flex",
        alignItems:"stretch",
        zIndex:300,
        boxShadow:"0 -2px 12px rgba(0,0,0,0.1)",
      }}>
        {[
          {id:"dashboard", label:lang==="np"?"होम":"Home",         icon:"dashboard"},
          {id:"members",   label:lang==="np"?"सदस्य":"Members",     icon:"members"},
          {id:"finance",   label:lang==="np"?"वित्त":"Finance",      icon:"saving"},
          {id:"books",     label:lang==="np"?"किताब":"Books",        icon:"bank"},
          {id:"report",    label:lang==="np"?"रिपोर्ट":"Report",     icon:"report"},
        ].map(n=>(
          <button
            key={n.id}
            type="button"
            onClick={()=>setTab(n.id)}
            style={{
              flex:1,border:"none",background:"none",cursor:"pointer",
              display:"flex",flexDirection:"column",alignItems:"center",
              justifyContent:"center",gap:2,
              fontFamily:"'Poppins',inherit",
              fontSize:"0.62rem",fontWeight:tab===n.id?700:400,
              color:tab===n.id?"#1b5e20":"#9ca3af",
              position:"relative",
              transition:"color 0.15s",
              paddingBottom:2,
            }}
          >
            {/* Active indicator dot above icon */}
            {tab===n.id&&(
              <span style={{
                position:"absolute",top:4,left:"50%",transform:"translateX(-50%)",
                width:20,height:3,borderRadius:2,
                background:"#1b5e20",
              }}/>
            )}
            <Icon name={n.icon} size={20} color={tab===n.id?"#1b5e20":"#9ca3af"}/>
            <span style={{lineHeight:1.1}}>{n.label}</span>
          </button>
        ))}
      </nav>

      {showProfile&&<ProfileModal user={currentUser} users={users} setUsers={setUsers} onClose={()=>setShowProfile(false)} t={t} lang={lang}/>}
      {showUserMgr&&isAdmin&&<UserManagementModal users={users} setUsers={setUsers} currentUser={currentUser} onClose={()=>setShowUserMgr(false)} t={t} lang={lang}/>}
      {showCatMgr&&isAdmin&&<CategoryManager categories={categories} setCategories={setCategories} onClose={()=>setShowCatMgr(false)} t={t} cash={cash} bank={bank} ie={ie} savings={savings} loans={loans}/>}
      {showBackup&&<BackupModal lang={lang} users={users} members={members} savings={savings} loans={loans} loanPayments={loanPayments} cash={cash} bank={bank} ie={ie} categories={categories} onClose={()=>setShowBackup(false)}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// FINANCE PAGE — Saving + Loan + Income/Expense with sub-tabs
// ═══════════════════════════════════════════════════════════════════════════════
function FinancePage({savings,setSavings,loans,setLoans,loanPayments,setLoanPayments,ie,setIE,members,memberOptions,getMember,filterStart,setFilterStart,filterEnd,setFilterEnd,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [sub,setSub]=useState("saving");
  const subTabs=[
    {id:"saving", label:lang==="np"?"बचत":"Saving",  icon:"saving",  color:"#16a34a"},
    {id:"loan",   label:lang==="np"?"ऋण":"Loan",     icon:"loan",    color:"#dc2626"},
    {id:"ie",     label:lang==="np"?"आय-व्यय":"Inc/Exp", icon:"income", color:"#7c3aed"},
  ];
  const sp={lang,t,useBS,fmtFn,isAdmin,categories};
  return(
    <div>
      {/* Sub-tab bar */}
      <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem",background:"#f0fdf4",borderRadius:"0.75rem",padding:"0.35rem"}}>
        {subTabs.map(s=>(
          <button key={s.id} type="button" onClick={()=>setSub(s.id)} style={{
            flex:1,padding:"0.45rem 0.25rem",border:"none",cursor:"pointer",
            borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.75rem",fontWeight:sub===s.id?700:500,
            background:sub===s.id?"#fff":"transparent",
            color:sub===s.id?s.color:"#6b7280",
            boxShadow:sub===s.id?"0 1px 4px rgba(0,0,0,0.1)":"none",
            display:"flex",alignItems:"center",justifyContent:"center",gap:4,
            transition:"all 0.15s",
          }}>
            <Icon name={s.icon} size={14} color={sub===s.id?s.color:"#9ca3af"}/>
            {s.label}
          </button>
        ))}
      </div>
      {sub==="saving"&&<SavingLedger {...{savings,setSavings,loans,members,memberOptions,getMember,...sp}}/>}
      {sub==="loan"&&<LoanLedger {...{loans,setLoans,loanPayments,setLoanPayments,members,memberOptions,getMember,...sp}}/>}
      {sub==="ie"&&<IncomeExpense {...{ie,setIE,filterStart,setFilterStart,filterEnd,setFilterEnd,...sp}}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKS PAGE — Cash Book + Bank Book with sub-tabs
// ═══════════════════════════════════════════════════════════════════════════════
function BooksPage({cash,addCash,updCash,delCash,bank,addBank,updBank,delBank,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [sub,setSub]=useState("cash");
  const subTabs=[
    {id:"cash", label:lang==="np"?"नगद किताब":"Cash Book",  icon:"cash",  color:"#d97706"},
    {id:"bank", label:lang==="np"?"बैंक किताब":"Bank Book",  icon:"bank",  color:"#2563eb"},
  ];
  const sp={lang,t,useBS,fmtFn,isAdmin,categories};
  return(
    <div>
      {/* Sub-tab bar */}
      <div style={{display:"flex",gap:"0.4rem",marginBottom:"1rem",background:"#f0fdf4",borderRadius:"0.75rem",padding:"0.35rem"}}>
        {subTabs.map(s=>(
          <button key={s.id} type="button" onClick={()=>setSub(s.id)} style={{
            flex:1,padding:"0.5rem 0.25rem",border:"none",cursor:"pointer",
            borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.78rem",fontWeight:sub===s.id?700:500,
            background:sub===s.id?"#fff":"transparent",
            color:sub===s.id?s.color:"#6b7280",
            boxShadow:sub===s.id?"0 1px 4px rgba(0,0,0,0.1)":"none",
            display:"flex",alignItems:"center",justifyContent:"center",gap:5,
            transition:"all 0.15s",
          }}>
            <Icon name={s.icon} size={15} color={sub===s.id?s.color:"#9ca3af"}/>
            {s.label}
          </button>
        ))}
      </div>
      {sub==="cash"&&<CashBook {...{cash,addCash,updCash,delCash,...sp}}/>}
      {sub==="bank"&&<BankBook {...{bank,addBank,updBank,delBank,...sp}}/>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 10: DASHBOARD — ORIGINAL DESIGN PRESERVED EXACTLY
// ═══════════════════════════════════════════════════════════════════════════════
function Dashboard({totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,lang,t,useBS,fmtFn,getMember}){
  return(
    <div>
      <h2 style={{color:"#1b5e20",margin:"0 0 1rem",fontSize:"1.1rem"}}>📊 {t.dashboard}</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:"0.75rem",marginBottom:"1.5rem"}}>
        <StatCard label={t.totalSaving} value={fmtFn(totalSaving)} color="#16a34a" icon="saving"/>
        <StatCard label={t.loanOutstanding} value={fmtFn(totalLoanOut)} color="#dc2626" icon="loan"/>
        <StatCard label={t.cashBalance} value={fmtFn(cashBal)} color="#d97706" icon="cash"/>
        <StatCard label={t.bankBalance} value={fmtFn(bankBal)} color="#2563eb" icon="bank"/>
        <StatCard label={t.monthlyIncome} value={fmtFn(monthlyIncome)} color="#7c3aed" icon="income"/>
        <StatCard label={t.monthlyExpense} value={fmtFn(monthlyExpense)} color="#be185d" icon="income"/>
      </div>
      <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",borderRadius:"1rem",padding:"1.25rem",color:"#fff",textAlign:"center",marginBottom:"1.5rem"}}>
        <div style={{fontSize:"0.85rem",opacity:0.85,marginBottom:4}}>{t.totalFund}</div>
        <div style={{fontSize:"2rem",fontWeight:700}}>{fmtFn(totalFund)}</div>
        <div style={{fontSize:"0.75rem",opacity:0.7,marginTop:4}}>{t.totalMembers}: {members.length} {lang==="np"?"जना":"members"}</div>
      </div>
      {/* ── Fund Distribution Breakdown ─────────────────────────────────────── */}
      {(()=>{
        const assetTotal=cashBal+bankBal+totalLoanOut;
        const pct=(v)=>assetTotal>0?Math.round(v/assetTotal*100):0;
        const loanPct=pct(totalLoanOut);
        const bankPct=pct(bankBal);
        const cashPct=pct(cashBal);
        const isEn=lang==="en";
        const bars=[
          {label:isEn?"Loans Out":"ऋण बाँकी",   val:totalLoanOut, pct:loanPct, color:"#dc2626", bg:"#fee2e2"},
          {label:isEn?"Bank":"बैंक",               val:bankBal,     pct:bankPct, color:"#2563eb", bg:"#dbeafe"},
          {label:isEn?"Cash":"नगद",                val:cashBal,     pct:cashPct, color:"#d97706", bg:"#fef3c7"},
        ];
        return(
          <div style={{background:"#fff",borderRadius:"0.875rem",padding:"1rem 1.1rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",marginBottom:"1.5rem"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem"}}>
              <h3 style={{margin:0,color:"#1b5e20",fontSize:"0.88rem",fontWeight:700}}>
                📊 {isEn?"Fund Distribution":"कोष वितरण"}
              </h3>
              <span style={{fontSize:"0.72rem",color:"#6b7280",fontWeight:500}}>
                {isEn?"Asset Base:":"सम्पत्ति:"} <strong style={{color:"#111827"}}>{fmtFn(assetTotal)}</strong>
              </span>
            </div>
            {/* Stacked bar */}
            <div style={{display:"flex",height:10,borderRadius:"999px",overflow:"hidden",marginBottom:"0.85rem",gap:1}}>
              {bars.map((b,i)=>b.pct>0&&(
                <div key={i} style={{width:`${b.pct}%`,background:b.color,transition:"width 0.4s"}}/>
              ))}
              {assetTotal===0&&<div style={{width:"100%",background:"#e5e7eb"}}/>}
            </div>
            {/* Rows */}
            {bars.map((b,i)=>(
              <div key={i} style={{marginBottom:i<bars.length-1?"0.55rem":0}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.2rem"}}>
                  <div style={{display:"flex",alignItems:"center",gap:"0.45rem"}}>
                    <div style={{width:10,height:10,borderRadius:"50%",background:b.color,flexShrink:0}}/>
                    <span style={{fontSize:"0.8rem",color:"#374151",fontWeight:500}}>{b.label}</span>
                  </div>
                  <div style={{display:"flex",alignItems:"center",gap:"0.65rem"}}>
                    <span style={{fontSize:"0.78rem",color:"#6b7280"}}>{fmtFn(b.val)}</span>
                    <span style={{fontSize:"0.78rem",fontWeight:700,color:b.color,minWidth:"2.8rem",textAlign:"right"}}>{b.pct}%</span>
                  </div>
                </div>
                <div style={{height:5,background:"#f3f4f6",borderRadius:"999px",overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${b.pct}%`,background:b.color,borderRadius:"999px",transition:"width 0.4s"}}/>
                </div>
              </div>
            ))}
          </div>
        );
      })()}
      <div style={{background:"#fff",borderRadius:"0.875rem",padding:"1rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>
        <h3 style={{margin:"0 0 0.75rem",color:"#1b5e20",fontSize:"0.9rem"}}>{t.recentActivity}</h3>
        <Table t={t} cols={[
          {key:"dateDisp",label:t.date},{key:"member",label:t.member},
          {key:"deposit",label:t.deposit,fmt:true,num:true,green:true},
          {key:"withdraw",label:t.withdraw,fmt:true,num:true,red:true},
        ]} rows={savings.slice(-5).reverse().map(s=>({...s,dateDisp:displayDate(s.date,lang,useBS),member:getMemberDisplayName(getMember(s.memberId),lang)}))} isAdmin={false}/>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 11: MEMBERS
// ═══════════════════════════════════════════════════════════════════════════════

// All official positions available for assignment
const POSITION_KEYS=["adakchya","upaAdakchya","sachib","koshadhakshya","sadasya"];

function positionLabel(posKey,t){
  const map={
    adakchya:     {np:"अध्यक्ष",     en:"Adakshya (President)"},
    upaAdakchya:  {np:"उप-अध्यक्ष",  en:"Upa-Adakshya (Vice-Pres.)"},
    sachib:       {np:"सचिव",         en:"Sachib (Secretary)"},
    koshadhakshya:{np:"कोषाध्यक्ष",  en:"Koshadhakshya (Treasurer)"},
    sadasya:      {np:"सदस्य",        en:"Sadasya (Member)"},
  };
  const isEn=(t?.appSub||"").includes("Loan Management");
  return map[posKey]?.[isEn?"en":"np"]||posKey||"—";
}

function positionBadgeColor(posKey){
  const colors={adakchya:"#1b5e20",upaAdakchya:"#2e7d32",sachib:"#1565c0",koshadhakshya:"#6a1b9a",sadasya:"#374151"};
  return colors[posKey]||"#6b7280";
}

function Members({members,setMembers,search,setSearch,lang,t,useBS,fmtFn,isAdmin}){
  const [modal,setModal]=useState(null);
  const blank={name:"",nameEn:"",phone:"",address:"",joinDate:today(),position:"sadasya"};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));

  const open=(mode,data=blank)=>{setForm({...blank,...data});setModal(mode);};
  const save=()=>{
    const primaryName=form.name.trim()||form.nameEn.trim();
    if(!primaryName){alert((t.nameNp||"नेपाली नाम")+" वा "+(t.nameEn||"English Name")+" आवश्यक");return;}
    // Ensure at least `name` field is always populated (legacy compatibility)
    const entry={...form,name:form.name.trim()||form.nameEn.trim()};
    if(modal==="add")setMembers([...members,{...entry,id:uid()}]);
    else setMembers(members.map(m=>m.id===form.id?entry:m));
    setModal(null);
  };
  const del=id=>{setMembers(members.filter(m=>m.id!==id));};

  // Search across both names
  const filtered=members.filter(m=>{
    const q=search.toLowerCase();
    return (m.name||"").toLowerCase().includes(q)||
           (m.nameEn||"").toLowerCase().includes(q)||
           (m.phone||"").includes(q)||
           (m.address||"").toLowerCase().includes(q);
  });

  const posOpts=POSITION_KEYS.map(k=>({value:k,label:positionLabel(k,t)}));

  // Build rows — displayName picks based on current language
  const rows=filtered.map(m=>({
    ...m,
    displayName:getMemberDisplayName(m,lang),
    joinDateDisp:displayDate(m.joinDate,lang,useBS),
    positionDisp:positionLabel(m.position||"sadasya",t),
  }));

  // Print HTML with proper CSS class — includes serial number column
  const printMembersHTML=`
    <table>
      <thead><tr>
        <th>#</th>
        <th>${t.nameNp||"नेपाली नाम"}</th>
        <th>${t.nameEn||"English Name"}</th>
        <th>${t.position||"पद"}</th>
        <th>${t.phone}</th>
        <th>${t.address}</th>
        <th>${t.joinDate}</th>
      </tr></thead>
      <tbody>
        ${rows.map((m,i)=>`<tr>
          <td style="text-align:center;font-weight:600;color:#1b5e20;">${i+1}</td>
          <td>${m.name||""}</td>
          <td>${m.nameEn||""}</td>
          <td>${m.positionDisp}</td>
          <td>${m.phone||""}</td>
          <td>${m.address||""}</td>
          <td>${m.joinDateDisp}</td>
        </tr>`).join("")}
      </tbody>
    </table>`;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>👥 {t.members}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.members,printMembersHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV("members",[
            {key:"sn",label:"#"},
            {key:"name",label:t.nameNp||"नेपाली नाम"},
            {key:"nameEn",label:t.nameEn||"English Name"},
            {key:"positionDisp",label:t.position||"पद"},
            {key:"phone",label:t.phone},
            {key:"address",label:t.address},
            {key:"joinDateDisp",label:t.joinDate},
          ],rows.map((m,i)=>({...m,sn:i+1})))} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>open("add")} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} style={{width:"100%",padding:"0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.9rem",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"0.75rem",outline:"none"}}/>

      {/* Member cards — bilingual name display with serial number */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"0.75rem"}}>
        {rows.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",color:"#9ca3af",padding:"2rem",fontStyle:"italic"}}>{t.noData}</div>
        )}
        {rows.map((m,i)=>(
          <div key={m.id||i} style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden",borderTop:`3px solid ${positionBadgeColor(m.position)}`}}>
            <div style={{padding:"0.85rem 1rem 0.65rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem"}}>
                <div style={{minWidth:0,flex:1}}>
                  {/* Serial number + Primary name row */}
                  <div style={{display:"flex",alignItems:"baseline",gap:"0.4rem"}}>
                    <span style={{
                      flexShrink:0,
                      minWidth:22,height:22,
                      background:"#1b5e20",color:"#fff",
                      borderRadius:"50%",
                      fontSize:"0.68rem",fontWeight:700,
                      display:"inline-flex",alignItems:"center",justifyContent:"center",
                      fontFamily:"'Poppins',sans-serif",
                      lineHeight:1,
                    }}>
                      {i+1}
                    </span>
                    <div style={{fontWeight:700,fontSize:"0.95rem",color:"#111827",fontFamily:smartFont(m.displayName),lineHeight:1.3}}>
                      {m.displayName}
                    </div>
                  </div>
                  {/* Secondary name — always show the other language if present */}
                  {lang==="en" && m.name && (
                    <div style={{fontSize:"0.75rem",color:"#6b7280",fontFamily:smartFont(m.name),marginTop:1,marginLeft:26}}>
                      {m.name}
                    </div>
                  )}
                  {lang==="np" && m.nameEn && (
                    <div style={{fontSize:"0.75rem",color:"#6b7280",fontFamily:"'Poppins',sans-serif",marginTop:1,marginLeft:26}}>
                      {m.nameEn}
                    </div>
                  )}
                  {/* Position badge */}
                  <span style={{
                    display:"inline-block",marginTop:4,
                    background:positionBadgeColor(m.position)+"18",
                    color:positionBadgeColor(m.position),
                    border:`1px solid ${positionBadgeColor(m.position)}40`,
                    borderRadius:"0.75rem",padding:"2px 10px",
                    fontSize:"0.72rem",fontWeight:700,letterSpacing:"0.02em"
                  }}>
                    {m.positionDisp}
                  </span>
                </div>
                {isAdmin&&(
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button type="button" onClick={()=>open("edit",m)} style={{background:"#dbeafe",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer"}}><Icon name="edit" size={13} color="#1d4ed8"/></button>
                    <button type="button" onClick={()=>del(m.id)} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"4px 8px",cursor:"pointer"}}><Icon name="del" size={13} color="#dc2626"/></button>
                  </div>
                )}
              </div>
              <div style={{marginTop:"0.6rem",display:"flex",flexDirection:"column",gap:3,fontSize:"0.8rem",color:"#6b7280"}}>
                {m.phone&&<span>📞 {m.phone}</span>}
                {m.address&&<span>📍 {m.address}</span>}
                <span>📅 {m.joinDateDisp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} ${t.member}`:`${t.edit} ${t.member}`} onClose={()=>setModal(null)}>
          {/* Bilingual name fields */}
          <Field label={t.nameNp||"नेपाली नाम"} value={form.name||""} onChange={f("name")} inputFont="'Tiro Devanagari Sanskrit','Mangal',sans-serif" placeholder="नेपाली नाम"/>
          <Field label={t.nameEn||"English Name"} value={form.nameEn||""} onChange={f("nameEn")} inputFont="'Poppins',sans-serif" placeholder="English Name"/>
          <Field label={t.position||"पद / Position"} type="select" value={form.position||"sadasya"} onChange={f("position")} options={posOpts}/>
          <Field label={t.phone} type="tel" value={form.phone||""} onChange={f("phone")}/>
          <Field label={t.address} value={form.address||""} onChange={f("address")}/>
          <Field label={t.joinDate} type="date" value={form.joinDate} onChange={f("joinDate")}/>
          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
            <button type="button" onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={save}>{t.save}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 12: SAVING LEDGER — with member name search + summary card
// ═══════════════════════════════════════════════════════════════════════════════
function SavingLedger({savings,setSavings,loans,members,memberOptions,getMember,lang,t,useBS,fmtFn,isAdmin}){
  const [modal,setModal]=useState(null);
  const [filterMember,setFilterMember]=useState("");
  const [searchText,setSearchText]=useState("");
  const [showDrop,setShowDrop]=useState(false);
  const blank={memberId:"",date:today(),particulars:"मासिक बचत",deposit:0,withdraw:0,signature:""};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const withBal=rows=>{let b=0;return rows.map(r=>{b+=(r.deposit||0)-(r.withdraw||0);return{...r,balance:b};});};
  const filtered=(filterMember?savings.filter(s=>s.memberId===filterMember):savings).sort((a,b)=>a.date.localeCompare(b.date));
  const rows=withBal(filtered).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS),memberName:getMemberDisplayName(getMember(r.memberId),lang)}));

  // Summary for selected member
  const selMember=filterMember?members.find(m=>m.id===filterMember):null;
  const selMemberName=selMember?getMemberDisplayName(selMember,lang):"";
  const memberDeposits=filtered.reduce((s,r)=>s+(r.deposit||0),0);
  const memberWithdrawals=filtered.reduce((s,r)=>s+(r.withdraw||0),0);
  const memberLateFees=filterMember?(loans||[]).filter(l=>l.memberId===filterMember).reduce((s,l)=>s+(l.lateFee||0),0):0;

  // Live search dropdown
  const matchedMembers=searchText
    ?members.filter(m=>(m.name||"").toLowerCase().includes(searchText.toLowerCase())||(m.nameEn||"").toLowerCase().includes(searchText.toLowerCase()))
    :members;

  const save=()=>{
    if(!form.memberId){alert(t.selectMember);return;}
    const en={...form,deposit:+form.deposit,withdraw:+form.withdraw,modifiedAt:new Date().toISOString()};
    if(modal==="add")setSavings([...savings,{...en,id:uid()}]);
    else setSavings(savings.map(s=>s.id===form.id?en:s));
    setModal(null);
  };
  const del=id=>{setSavings(savings.filter(s=>s.id!==id));};
  const cols=[{key:"dateDisp",label:t.date},{key:"memberName",label:t.member},{key:"particulars",label:t.particulars,wrap:true},{key:"deposit",label:t.deposit,fmt:true,num:true,green:true},{key:"withdraw",label:t.withdraw,fmt:true,num:true,red:true},{key:"balance",label:t.balance,fmt:true,num:true},{key:"signature",label:t.signature}];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const srchStyle={width:"100%",padding:"0.55rem 2.2rem 0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.85rem",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>💰 {t.saving}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.saving,printHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.saving,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>

      {/* Member name search */}
      <div style={{position:"relative",marginBottom:"0.75rem"}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setShowDrop(false);}}>
        <input
          value={filterMember?selMemberName:searchText}
          onChange={e=>{setSearchText(e.target.value);setFilterMember("");setShowDrop(true);}}
          onFocus={()=>setShowDrop(true)}
          placeholder={lang==="np"?"सदस्यको नाम खोज्नुहोस्...":"Search member by name..."}
          style={srchStyle}
        />
        {filterMember&&(
          <button type="button" onClick={()=>{setFilterMember("");setSearchText("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"1.1rem",color:"#6b7280",lineHeight:1}}>×</button>
        )}
        {showDrop&&!filterMember&&(
          <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #d1d5db",borderRadius:"0.5rem",zIndex:50,maxHeight:180,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.12)"}}>
            <div onMouseDown={()=>{setFilterMember("");setSearchText("");setShowDrop(false);}} style={{padding:"0.45rem 0.75rem",cursor:"pointer",fontSize:"0.82rem",color:"#6b7280",borderBottom:"1px solid #f3f4f6",background:"#f9fafb",fontWeight:600}}>{t.allMembers}</div>
            {matchedMembers.map(m=>(
              <div key={m.id} onMouseDown={()=>{setFilterMember(m.id);setSearchText("");setShowDrop(false);}}
                onMouseEnter={e=>e.currentTarget.style.background="#f0fdf4"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}
                style={{padding:"0.45rem 0.75rem",cursor:"pointer",fontSize:"0.83rem",color:"#111827"}}>
                {getMemberDisplayName(m,lang)}
              </div>
            ))}
            {matchedMembers.length===0&&<div style={{padding:"0.75rem",color:"#9ca3af",fontSize:"0.82rem",textAlign:"center"}}>{lang==="np"?"सदस्य भेटिएन":"No member found"}</div>}
          </div>
        )}
      </div>

      {/* Savings summary card */}
      {filterMember&&(
        <div style={{background:"linear-gradient(135deg,#f0fdf4,#dcfce7)",borderRadius:"0.75rem",padding:"0.75rem 1rem",marginBottom:"0.75rem",border:"1px solid #bbf7d0"}}>
          <div style={{fontWeight:700,color:"#166534",fontSize:"0.83rem",marginBottom:"0.5rem"}}>📊 {selMemberName} — {lang==="np"?"बचत सारांश":"Savings Summary"}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"0.4rem"}}>
            {[
              {label:t.deposit,  value:fmtFn(memberDeposits),               color:"#16a34a"},
              {label:t.withdraw, value:fmtFn(memberWithdrawals),             color:"#dc2626"},
              {label:t.balance,  value:fmtFn(memberDeposits-memberWithdrawals), color:"#2563eb"},
              ...(memberLateFees>0?[{label:t.lateFee, value:fmtFn(memberLateFees), color:"#d97706"}]:[]),
            ].map((item,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:"0.5rem",padding:"0.4rem 0.6rem",borderLeft:`3px solid ${item.color}`}}>
                <div style={{fontSize:"0.65rem",color:"#6b7280",fontWeight:600}}>{item.label}</div>
                <div style={{fontSize:"0.85rem",fontWeight:700,color:item.color}}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={r=>{setForm(r);setModal("edit");}} onDelete={del} isAdmin={isAdmin}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.saving}`:`${t.edit} — ${t.saving}`} onClose={()=>setModal(null)}>
          <Field label={t.member} type="select" value={form.memberId} onChange={f("memberId")} options={memberOptions} required/>
          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.deposit} (रू)`} type="number" value={form.deposit} onChange={f("deposit")}/>
            <Field label={`${t.withdraw} (रू)`} type="number" value={form.withdraw} onChange={f("withdraw")}/>
          </div>
          <Field label={t.signature} value={form.signature} onChange={f("signature")}/>
          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
            <button onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={save}>{t.save}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}


function LoanLedger({loans,setLoans,loanPayments,setLoanPayments,members,memberOptions,getMember,lang,t,useBS,fmtFn,isAdmin}){
  const [modal,setModal]=useState(null);
  const [expandedLoan,setExpandedLoan]=useState(null);
  const [filterMember,setFilterMember]=useState("");
  const [searchText,setSearchText]=useState("");
  const [showDrop,setShowDrop]=useState(false);
  const blankLoan={memberId:"",startDate:today(),particulars:"\u0935\u094d\u092f\u093e\u092a\u093e\u0930 \u090b\u0923",principal:0,interestRate:12,duration:12};
  const blankPayment={loanId:"",date:today(),principalPaid:0,interestPaid:0,lateFee:0,signature:""};
  const [loanForm,setLoanForm]=useState(blankLoan);
  const [payForm,setPayForm]=useState(blankPayment);
  const lf=k=>v=>setLoanForm(p=>({...p,[k]:v}));
  const pf=k=>v=>setPayForm(p=>({...p,[k]:v}));
  const isEn=lang==="en";

  const getRemaining=loan=>{
    const paid=(loanPayments||[]).filter(p=>p.loanId===loan.id).reduce((s,p)=>s+(p.principalPaid||0),0);
    return Math.max(0,(loan.principal||0)-paid);
  };

  const selMember=filterMember?members.find(m=>m.id===filterMember):null;
  const selMemberName=selMember?getMemberDisplayName(selMember,lang):"";
  const filteredLoans=(filterMember?loans.filter(l=>l.memberId===filterMember):loans)
    .sort((a,b)=>(a.startDate||"").localeCompare(b.startDate||""));

  const totalBorrowed=filteredLoans.reduce((s,l)=>s+(l.principal||0),0);
  const totalOutstanding=filteredLoans.reduce((s,l)=>s+getRemaining(l),0);
  const totalPrincipalPaid=filteredLoans.reduce((s,l)=>(loanPayments||[]).filter(p=>p.loanId===l.id).reduce((a,p)=>a+(p.principalPaid||0),s),0);
  const totalInterestPaid=filteredLoans.reduce((s,l)=>(loanPayments||[]).filter(p=>p.loanId===l.id).reduce((a,p)=>a+(p.interestPaid||0),s),0);

  const matchedMembers=searchText
    ?members.filter(m=>(m.name||"").toLowerCase().includes(searchText.toLowerCase())||(m.nameEn||"").toLowerCase().includes(searchText.toLowerCase()))
    :members;

  const saveLoan=()=>{
    if(!loanForm.memberId){alert(t.selectMember);return;}
    if(!(+loanForm.principal>0)){alert(isEn?"Loan amount is required.":"\u090b\u0923 \u0930\u0915\u092e \u0906\u0935\u0936\u094d\u092f\u0915 \u091b\u0964");return;}
    const en={...loanForm,principal:+loanForm.principal,interestRate:+loanForm.interestRate,duration:+loanForm.duration,modifiedAt:new Date().toISOString()};
    if(modal==="addLoan")setLoans(prev=>[...prev,{...en,id:uid()}]);
    else setLoans(prev=>prev.map(l=>l.id===loanForm.id?en:l));
    setModal(null);
  };

  const deleteLoan=id=>{
    if(!window.confirm(isEn?"Delete this loan and all its payments?":"\u092f\u094b \u090b\u0923 \u0930 \u092f\u0938\u0915\u093e \u0938\u092c\u0948 \u0915\u093f\u0938\u094d\u0924\u0939\u0930\u0942 \u0939\u091f\u093e\u0909\u0928\u0947?"))return;
    setLoans(prev=>prev.filter(l=>l.id!==id));
    setLoanPayments(prev=>(prev||[]).filter(p=>p.loanId!==id));
    if(expandedLoan===id)setExpandedLoan(null);
  };

  const savePayment=()=>{
    const pp=+payForm.principalPaid||0;
    const ip=+payForm.interestPaid||0;
    const lf2=+payForm.lateFee||0;
    if(pp===0&&ip===0&&lf2===0){alert(isEn?"At least one amount required.":"\u0915\u092e\u094d\u0924\u093f\u092e\u093e \u090f\u0915 \u0930\u0915\u092e \u0906\u0935\u0936\u094d\u092f\u0915 \u091b\u0964");return;}
    const en={...payForm,principalPaid:pp,interestPaid:ip,lateFee:lf2,modifiedAt:new Date().toISOString()};
    if(modal==="addPayment")setLoanPayments(prev=>[...(prev||[]),{...en,id:uid()}]);
    else setLoanPayments(prev=>(prev||[]).map(p=>p.id===payForm.id?en:p));
    setModal(null);
  };

  const deletePayment=id=>{setLoanPayments(prev=>(prev||[]).filter(p=>p.id!==id));};

  const flatRows=filteredLoans.map(l=>{
    const pmts=(loanPayments||[]).filter(p=>p.loanId===l.id);
    const principalPaid=pmts.reduce((s,p)=>s+(p.principalPaid||0),0);
    const interestPaidTot=pmts.reduce((s,p)=>s+(p.interestPaid||0),0);
    const lateFeeTot=pmts.reduce((s,p)=>s+(p.lateFee||0),0);
    const remaining=Math.max(0,(l.principal||0)-principalPaid);
    return{
      dateDisp:displayDate(l.startDate,lang,useBS),
      memberName:getMemberDisplayName(getMember(l.memberId),lang),
      particulars:l.particulars,
      principal:fmtFn(l.principal||0),
      duration:`${l.duration||"\u2014"} ${isEn?"mo":"\u092e\u0939\u093f\u0928\u093e"}`,
      interestRate:`${l.interestRate||0}%`,
      principalPaid:fmtFn(principalPaid),
      interestPaid:fmtFn(interestPaidTot),
      lateFee:fmtFn(lateFeeTot),
      remaining:fmtFn(remaining),
      status:remaining<=0
        ?(isEn?"\u2705 Paid":"\u2705 \u091a\u0941\u0915\u094d\u0924\u093e")
        :(isEn?"\ud83d\udd34 Active":"\ud83d\udd34 \u0938\u0915\u094d\u0930\u093f\u092f"),
    };
  });
  const printCols=[
    {key:"dateDisp",label:t.date},{key:"memberName",label:t.member},{key:"particulars",label:t.particulars},
    {key:"principal",label:t.loanAmount},{key:"duration",label:isEn?"Duration":"\u0905\u0935\u0927\u093f"},{key:"interestRate",label:isEn?"Rate":"\u0926\u0930"},
    {key:"principalPaid",label:t.principalPaid},{key:"interestPaid",label:t.interestPaid},{key:"lateFee",label:t.lateFee},
    {key:"remaining",label:t.remaining},{key:"status",label:isEn?"Status":"\u0938\u094d\u0925\u093f\u0924\u093f"},
  ];
  const printHTML=`<table><thead><tr>${printCols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${flatRows.map(r=>`<tr>${printCols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const srchStyle={width:"100%",padding:"0.55rem 2.2rem 0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.85rem",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>\ud83c\udfe6 {t.loan}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.loan,printHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.loan,printCols,flatRows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setLoanForm(blankLoan);setModal("addLoan");}} icon="plus">{isEn?"New Loan":"\u0928\u092f\u093e\u0901 \u090b\u0923"}</Btn>}
        </div>
      </div>

      {/* Member search */}
      <div style={{position:"relative",marginBottom:"0.75rem"}} onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setShowDrop(false);}}>
        <input
          value={filterMember?selMemberName:searchText}
          onChange={e=>{setSearchText(e.target.value);setFilterMember("");setShowDrop(true);}}
          onFocus={()=>setShowDrop(true)}
          placeholder={isEn?"Search member by name...":"\u0938\u0926\u0938\u094d\u092f\u0915\u094b \u0928\u093e\u092e \u062e\u094b\u091c\u094d\u0928\u0941\u0939\u094b\u0938\u094d..."}
          style={srchStyle}
        />
        {filterMember&&(
          <button type="button" onClick={()=>{setFilterMember("");setSearchText("");}} style={{position:"absolute",right:8,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",fontSize:"1.1rem",color:"#6b7280",lineHeight:1}}>\u00d7</button>
        )}
        {showDrop&&!filterMember&&(
          <div style={{position:"absolute",top:"100%",left:0,right:0,background:"#fff",border:"1px solid #d1d5db",borderRadius:"0.5rem",zIndex:50,maxHeight:180,overflowY:"auto",boxShadow:"0 4px 12px rgba(0,0,0,0.12)"}}>
            <div onMouseDown={()=>{setFilterMember("");setSearchText("");setShowDrop(false);}} style={{padding:"0.45rem 0.75rem",cursor:"pointer",fontSize:"0.82rem",color:"#6b7280",borderBottom:"1px solid #f3f4f6",background:"#f9fafb",fontWeight:600}}>{t.allMembers}</div>
            {matchedMembers.map(m=>(
              <div key={m.id} onMouseDown={()=>{setFilterMember(m.id);setSearchText("");setShowDrop(false);}}
                onMouseEnter={e=>e.currentTarget.style.background="#fff7ed"} onMouseLeave={e=>e.currentTarget.style.background="#fff"}
                style={{padding:"0.45rem 0.75rem",cursor:"pointer",fontSize:"0.83rem",color:"#111827"}}>
                {getMemberDisplayName(m,lang)}
              </div>
            ))}
            {matchedMembers.length===0&&<div style={{padding:"0.75rem",color:"#9ca3af",fontSize:"0.82rem",textAlign:"center"}}>{isEn?"No member found":"\u0938\u0926\u0938\u094d\u092f \u092d\u0947\u091f\u093f\u090f\u0928"}</div>}
          </div>
        )}
      </div>

      {/* Summary card */}
      {filterMember&&(
        <div style={{background:"linear-gradient(135deg,#fff7ed,#fed7aa)",borderRadius:"0.75rem",padding:"0.75rem 1rem",marginBottom:"0.75rem",border:"1px solid #fdba74"}}>
          <div style={{fontWeight:700,color:"#9a3412",fontSize:"0.83rem",marginBottom:"0.5rem"}}>\ud83c\udfe6 {selMemberName} \u2014 {isEn?"Loan Summary":"\u090b\u0923 \u0938\u093e\u0930\u093e\u0902\u0936"}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(120px,1fr))",gap:"0.4rem"}}>
            {[
              {label:t.loanAmount,    value:fmtFn(totalBorrowed),      color:"#dc2626"},
              {label:t.principalPaid, value:fmtFn(totalPrincipalPaid), color:"#16a34a"},
              {label:t.interestPaid,  value:fmtFn(totalInterestPaid),  color:"#7c3aed"},
              {label:t.remaining,     value:fmtFn(totalOutstanding),   color:totalOutstanding>0?"#dc2626":"#16a34a"},
            ].map((item,i)=>(
              <div key={i} style={{background:"#fff",borderRadius:"0.5rem",padding:"0.4rem 0.6rem",borderLeft:`3px solid ${item.color}`}}>
                <div style={{fontSize:"0.65rem",color:"#6b7280",fontWeight:600}}>{item.label}</div>
                <div style={{fontSize:"0.85rem",fontWeight:700,color:item.color}}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Loan cards */}
      {filteredLoans.length===0&&(
        <div style={{background:"#fff",borderRadius:"0.875rem",padding:"2rem",textAlign:"center",color:"#9ca3af",fontStyle:"italic",boxShadow:"0 2px 8px rgba(0,0,0,0.06)"}}>{t.noData}</div>
      )}
      {filteredLoans.map(loan=>{
        const pmts=(loanPayments||[]).filter(p=>p.loanId===loan.id).sort((a,b)=>a.date.localeCompare(b.date));
        const principalPaid=pmts.reduce((s,p)=>s+(p.principalPaid||0),0);
        const interestPaid=pmts.reduce((s,p)=>s+(p.interestPaid||0),0);
        const lateFee=pmts.reduce((s,p)=>s+(p.lateFee||0),0);
        const remaining=Math.max(0,(loan.principal||0)-principalPaid);
        const isPaid=remaining<=0;
        const isExpanded=expandedLoan===loan.id;
        const memberName=getMemberDisplayName(getMember(loan.memberId),lang);

        return(
          <div key={loan.id} style={{background:"#fff",borderRadius:"0.875rem",marginBottom:"0.75rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden",border:`1px solid ${isPaid?"#bbf7d0":"#fed7aa"}`}}>
            {/* Loan header row */}
            <div style={{display:"flex",alignItems:"center",gap:"0.5rem",padding:"0.75rem 1rem",background:isPaid?"#f0fdf4":"#fff7ed",cursor:"pointer",flexWrap:"wrap"}} onClick={()=>setExpandedLoan(isExpanded?null:loan.id)}>
              <span style={{fontSize:"0.85rem",flexShrink:0,color:"#6b7280"}}>{isExpanded?"\u25bc":"\u25b6"}</span>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:"0.5rem",flexWrap:"wrap"}}>
                  <span style={{fontWeight:700,fontSize:"0.9rem",color:"#1b5e20",fontFamily:"inherit"}}>{memberName}</span>
                  <span style={{background:isPaid?"#dcfce7":"#fee2e2",color:isPaid?"#166534":"#dc2626",fontSize:"0.68rem",fontWeight:700,padding:"2px 8px",borderRadius:"1rem",flexShrink:0}}>
                    {isPaid?(isEn?"\u2705 Paid":"\u2705 \u091a\u0941\u0915\u094d\u0924\u093e"):(isEn?"\ud83d\udd34 Active":"\ud83d\udd34 \u0938\u0915\u094d\u0930\u093f\u092f")}
                  </span>
                </div>
                <div style={{fontSize:"0.75rem",color:"#6b7280",marginTop:2}}>
                  {loan.particulars}&nbsp;|&nbsp;{displayDate(loan.startDate,lang,useBS)}&nbsp;|&nbsp;{loan.duration}{isEn?" mo":"\u092e."}&nbsp;|&nbsp;{loan.interestRate}%&nbsp;|&nbsp;{pmts.length}{isEn?" payment(s)":" \u0915\u093f\u0938\u094d\u0924"}
                </div>
              </div>
              <div style={{display:"flex",gap:"0.75rem",flexShrink:0,flexWrap:"wrap",alignItems:"center"}}>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.62rem",color:"#6b7280"}}>{t.loanAmount}</div>
                  <div style={{fontWeight:700,fontSize:"0.85rem",color:"#1565c0"}}>{fmtFn(loan.principal||0)}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:"0.62rem",color:"#6b7280"}}>{t.remaining}</div>
                  <div style={{fontWeight:700,fontSize:"0.85rem",color:isPaid?"#16a34a":"#dc2626"}}>{fmtFn(remaining)}</div>
                </div>
                {isAdmin&&(
                  <div style={{display:"flex",gap:4}} onClick={e=>e.stopPropagation()}>
                    <button type="button" onClick={()=>{setLoanForm({...loan});setModal("editLoan");}} style={{background:"#e0f2fe",border:"1px solid #bae6fd",borderRadius:"0.4rem",padding:"4px 8px",cursor:"pointer",fontSize:"0.72rem",color:"#0369a1",fontWeight:600,fontFamily:"inherit"}}>{t.edit}</button>
                    <button type="button" onClick={()=>{setPayForm({...blankPayment,loanId:loan.id});setModal("addPayment");}} style={{background:"#dcfce7",border:"1px solid #bbf7d0",borderRadius:"0.4rem",padding:"4px 8px",cursor:"pointer",fontSize:"0.72rem",color:"#166534",fontWeight:600,fontFamily:"inherit"}}>{isEn?"+ Pay":"+ \u0915\u093f\u0938\u094d\u0924"}</button>
                    <button type="button" onClick={()=>deleteLoan(loan.id)} style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"0.4rem",padding:"4px 8px",cursor:"pointer",fontSize:"0.72rem",color:"#dc2626",fontWeight:600,fontFamily:"inherit"}}>{t.delete}</button>
                  </div>
                )}
              </div>
            </div>

            {/* Expanded installment history */}
            {isExpanded&&(
              <div style={{borderTop:"1px solid #e5e7eb"}}>
                {/* Totals summary bar */}
                <div style={{display:"flex",gap:"0.4rem",padding:"0.5rem 1rem",background:"#f9fafb",flexWrap:"wrap"}}>
                  {[
                    {label:t.principalPaid, value:fmtFn(principalPaid), color:"#16a34a"},
                    {label:t.interestPaid,  value:fmtFn(interestPaid),  color:"#7c3aed"},
                    ...(lateFee>0?[{label:t.lateFee,value:fmtFn(lateFee),color:"#d97706"}]:[]),
                    {label:t.remaining,     value:fmtFn(remaining),     color:isPaid?"#16a34a":"#dc2626"},
                  ].map((item,i)=>(
                    <div key={i} style={{background:"#fff",borderRadius:"0.4rem",padding:"0.3rem 0.5rem",borderLeft:`3px solid ${item.color}`,flex:"1 1 80px"}}>
                      <div style={{fontSize:"0.6rem",color:"#6b7280",fontWeight:600}}>{item.label}</div>
                      <div style={{fontSize:"0.78rem",fontWeight:700,color:item.color}}>{item.value}</div>
                    </div>
                  ))}
                </div>
                {/* Payment rows */}
                {pmts.length===0
                  ?<div style={{padding:"1rem",textAlign:"center",color:"#9ca3af",fontSize:"0.82rem",fontStyle:"italic"}}>{isEn?"No payments recorded yet.":"\u0905\u0939\u093f\u0932\u0947\u0938\u092e\u092e \u0915\u0941\u0928\u0948 \u0915\u093f\u0938\u094d\u0924 \u091b\u0948\u0928\u0964"}</div>
                  :(
                    <div style={{overflowX:"auto"}}>
                      <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.78rem"}}>
                        <thead>
                          <tr style={{background:"#f3f4f6"}}>
                            {[t.date,t.principalPaid,t.interestPaid,t.lateFee,t.signature].map(h=>(
                              <th key={h} style={{padding:"0.45rem 0.75rem",textAlign:"left",color:"#374151",fontWeight:600,whiteSpace:"nowrap",borderBottom:"1px solid #e5e7eb"}}>{h}</th>
                            ))}
                            {isAdmin&&<th style={{padding:"0.45rem 0.75rem",borderBottom:"1px solid #e5e7eb"}}></th>}
                          </tr>
                        </thead>
                        <tbody>
                          {pmts.map((p,i)=>(
                            <tr key={p.id||i} style={{background:i%2===0?"#fff":"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
                              <td style={{padding:"0.45rem 0.75rem",whiteSpace:"nowrap"}}>{displayDate(p.date,lang,useBS)}</td>
                              <td style={{padding:"0.45rem 0.75rem",color:"#16a34a",fontWeight:600}}>{fmtFn(p.principalPaid||0)}</td>
                              <td style={{padding:"0.45rem 0.75rem",color:"#7c3aed"}}>{fmtFn(p.interestPaid||0)}</td>
                              <td style={{padding:"0.45rem 0.75rem",color:p.lateFee>0?"#d97706":"#9ca3af"}}>{p.lateFee>0?fmtFn(p.lateFee):"\u2014"}</td>
                              <td style={{padding:"0.45rem 0.75rem"}}>{p.signature||"\u2014"}</td>
                              {isAdmin&&(
                                <td style={{padding:"0.45rem 0.5rem"}}>
                                  <div style={{display:"flex",gap:3}}>
                                    <button type="button" onClick={()=>{setPayForm({...p});setModal("editPayment");}} style={{background:"#e0f2fe",border:"1px solid #bae6fd",borderRadius:"0.3rem",padding:"3px 6px",cursor:"pointer",fontSize:"0.68rem",color:"#0369a1",fontWeight:600,fontFamily:"inherit"}}>{t.edit}</button>
                                    <button type="button" onClick={()=>deletePayment(p.id)} style={{background:"#fee2e2",border:"1px solid #fecaca",borderRadius:"0.3rem",padding:"3px 6px",cursor:"pointer",fontSize:"0.68rem",color:"#dc2626",fontWeight:600,fontFamily:"inherit"}}>{t.delete}</button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            )}
          </div>
        );
      })}

      {/* ADD / EDIT LOAN MODAL */}
      {(modal==="addLoan"||modal==="editLoan")&&(
        <Modal title={modal==="addLoan"?(isEn?"New Loan Account":"\u0928\u092f\u093e\u0901 \u090b\u0923 \u0916\u093e\u0924\u093e"):(isEn?"Edit Loan":"\u090b\u0923 \u0938\u092e\u094d\u092a\u093e\u0926\u0928")} onClose={()=>setModal(null)}>
          <Field label={t.member} type="select" value={loanForm.memberId} onChange={lf("memberId")} options={memberOptions} required/>
          <Field label={isEn?"Start Date":"\u090b\u0923 \u092e\u093f\u0924\u093f"} type="date" value={loanForm.startDate} onChange={lf("startDate")} required/>
          <Field label={t.particulars} value={loanForm.particulars} onChange={lf("particulars")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.loanAmount} (\u0930\u0942)`} type="number" value={loanForm.principal} onChange={lf("principal")} required/>
            <Field label={isEn?"Interest Rate (%)":"\u092c\u094d\u092f\u093e\u091c \u0926\u0930 (%)"} type="number" value={loanForm.interestRate} onChange={lf("interestRate")}/>
            <Field label={isEn?"Duration (months)":"\u0905\u0935\u0927\u093f (\u092e\u0939\u093f\u0928\u093e)"} type="select" value={String(loanForm.duration)} onChange={v=>lf("duration")(+v)}
              options={[{value:"6",label:isEn?"6 Months":"6 \u092e\u0939\u093f\u0928\u093e"},{value:"12",label:isEn?"12 Months":"12 \u092e\u0939\u093f\u0928\u093e"},{value:"24",label:isEn?"24 Months":"24 \u092e\u0939\u093f\u0928\u093e"},{value:"36",label:isEn?"36 Months":"36 \u092e\u0939\u093f\u0928\u093e"}]}/>
          </div>
          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
            <button type="button" onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={saveLoan}>{t.save}</Btn>
          </div>
        </Modal>
      )}

      {/* ADD / EDIT PAYMENT MODAL */}
      {(modal==="addPayment"||modal==="editPayment")&&(()=>{
        const parentLoan=loans.find(l=>l.id===payForm.loanId);
        const paidSoFar=(loanPayments||[]).filter(p=>p.loanId===payForm.loanId&&(modal==="addPayment"||p.id!==payForm.id)).reduce((s,p)=>s+(p.principalPaid||0),0);
        const loanRemaining=Math.max(0,(parentLoan?.principal||0)-paidSoFar);
        return(
          <Modal title={modal==="addPayment"?(isEn?"Add Installment":"\u0915\u093f\u0938\u094d\u0924 \u0925\u092a\u094d\u0928\u0941\u0939\u094b\u0938\u094d"):(isEn?"Edit Installment":"\u0915\u093f\u0938\u094d\u0924 \u0938\u092e\u094d\u092a\u093e\u0926\u0928")} onClose={()=>setModal(null)}>
            {parentLoan&&(
              <div style={{background:"#f0fdf4",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",marginBottom:"0.75rem",fontSize:"0.8rem",color:"#166534",border:"1px solid #bbf7d0"}}>
                {isEn?"Loan":"\u090b\u0923"}: <strong>{getMemberDisplayName(getMember(parentLoan.memberId),lang)}</strong>&nbsp;\u2014&nbsp;{isEn?"Remaining":"\u092c\u093e\u0901\u0915\u0940"}: <strong>{fmtFn(loanRemaining)}</strong>
              </div>
            )}
            <Field label={t.date} type="date" value={payForm.date} onChange={pf("date")} required/>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
              <Field label={`${t.principalPaid} (\u0930\u0942)`} type="number" value={payForm.principalPaid} onChange={pf("principalPaid")}/>
              <Field label={`${t.interestPaid} (\u0930\u0942)`} type="number" value={payForm.interestPaid} onChange={pf("interestPaid")}/>
              <Field label={`${t.lateFee} (\u0930\u0942)`} type="number" value={payForm.lateFee} onChange={pf("lateFee")}/>
            </div>
            <Field label={t.signature} value={payForm.signature} onChange={pf("signature")}/>
            <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
              <button type="button" onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
              <Btn onClick={savePayment}>{t.save}</Btn>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}


// SECTION 14: CASH BOOK (auto-sync) — with dynamic category filtering by txType
// ═══════════════════════════════════════════════════════════════════════════════

// Helper: given txType, return the matching category group key
function txTypeToCatGroup(txType){
  return {income:"income",expense:"expense",asset:"assets",liability:"liabilities"}[txType]||"income";
}

// Helper: given txType, determine which amount fields are "in" vs "out"
// income/asset → cashIn/deposit; expense/liability → cashOut/withdrawal
function txTypeIsIn(txType){ return txType==="income"||txType==="asset"; }

function CashBook({cash,addCash,updCash,delCash,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",cashIn:0,cashOut:0,category:"savingsContribution",txType:"income"};
  const [form,setForm]=useState(blank);
  const [formErr,setFormErr]=useState("");
  const f=k=>v=>{setFormErr("");setForm(p=>({...p,[k]:v}));};

  // When txType changes: reset category to first of new group
  // For income → clear cashOut; for expense → clear cashIn
  // For asset/liability → keep BOTH editable (do NOT zero either side)
  const changeTxType=v=>{
    const group=txTypeToCatGroup(v);
    const firstCat=(categories[group]||[])[0]||"";
    setFormErr("");
    setForm(p=>{
      const isIncomeOrExpense=v==="income"||v==="expense";
      return{
        ...p,
        txType:v,
        category:firstCat,
        // Only auto-clear for pure income/expense; leave both fields for asset/liability
        cashIn:  isIncomeOrExpense ? (v==="income"?p.cashIn:0) : p.cashIn,
        cashOut: isIncomeOrExpense ? (v==="expense"?p.cashOut:0) : p.cashOut,
      };
    });
  };

  const getLabel=k=>getCatLabel(k)||catLabel(k,t);

  // Filtered category options based on current txType
  const filteredCatOpts=(()=>{
    const group=txTypeToCatGroup(form.txType);
    const keys=categories[group]||[];
    return keys.length
      ? keys.map(k=>({value:k,label:getLabel(k)}))
      : [{value:"",label:lang==="np"?"श्रेणी उपलब्ध छैन":"No categories available"}];
  })();

  const txTypeOpts=[
    {value:"income",   label: t.txTypeIncome||"आय"},
    {value:"expense",  label: t.txTypeExpense||"व्यय"},
    {value:"asset",    label: t.txTypeAsset||"सम्पत्ति"},
    {value:"liability",label: t.txTypeLiability||"दायित्व"},
  ];
  const txTypeColor={income:"#16a34a",expense:"#dc2626",asset:"#2563eb",liability:"#7c3aed"};

  // Is this txType one that syncs to IE? Only income/expense do.
  const syncsToIE=form.txType==="income"||form.txType==="expense";
  // Is this an asset or liability entry (both directions allowed)?
  const isDualAmount=form.txType==="asset"||form.txType==="liability";

  const withBal=rows=>{let b=0;return[...rows].sort((a,bb)=>a.date.localeCompare(bb.date)).map(r=>{b+=(r.cashIn||0)-(r.cashOut||0);return{...r,balance:b};});};
  const rows=withBal(cash).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS)}));

  const save=()=>{
    const inAmt=+(form.cashIn)||0;
    const outAmt=+(form.cashOut)||0;
    if(inAmt<0||outAmt<0){
      setFormErr(lang==="np"?"ऋणात्मक रकम अनुमति छैन।":"Negative amounts are not allowed.");
      return;
    }
    if(inAmt===0&&outAmt===0){
      setFormErr(lang==="np"?"कम्तिमा एक रकम (जम्मा वा निकासी) आवश्यक छ।":"At least one amount (IN or OUT) is required.");
      return;
    }
    setFormErr("");
    const en={...form,cashIn:inAmt,cashOut:outAmt};
    if(modal==="add")addCash(en);else updCash({...en,id:form.id,txId:form.txId});
    setModal(null);
  };

  // When opening edit modal, derive txType from existing entry if not stored
  const openEdit=r=>{
    let txType=r.txType||"";
    if(!txType){
      txType=(r.cashIn>0)?"income":"expense";
    }
    setFormErr("");
    setForm({...r,txType});
    setModal("edit");
  };

  const cols=[
    {key:"dateDisp",label:t.date},
    {key:"particulars",label:t.particulars,wrap:true},
    {key:"cashIn",label:t.cashIn,fmt:true,num:true,green:true},
    {key:"cashOut",label:t.cashOut,fmt:true,num:true,red:true},
    {key:"balance",label:t.balance,fmt:true,num:true},
  ];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>💵 {t.cash}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.cash,printHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.cash,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setFormErr("");setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginBottom:"0.75rem"}}>🔗 {t.syncNote}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={openEdit} onDelete={delCash} isAdmin={isAdmin}/>
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.cash}`:`${t.edit} — ${t.cash}`} onClose={()=>setModal(null)}>

          {/* Transaction type selector */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:6,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.txType||"कारोबार प्रकार"} <span style={{color:"#dc2626"}}>*</span>
            </label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0.35rem"}}>
              {txTypeOpts.map(o=>(
                <button
                  key={o.value}
                  type="button"
                  onClick={()=>changeTxType(o.value)}
                  style={{
                    padding:"6px 4px",
                    border:`2px solid ${form.txType===o.value?txTypeColor[o.value]:"#d1d5db"}`,
                    borderRadius:"0.5rem",
                    background:form.txType===o.value?txTypeColor[o.value]+"15":"#fff",
                    color:form.txType===o.value?txTypeColor[o.value]:"#6b7280",
                    cursor:"pointer",fontSize:"0.72rem",
                    fontWeight:form.txType===o.value?700:500,
                    fontFamily:"inherit",textAlign:"center",transition:"all 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {/* Hint for dual-amount types */}
            {isDualAmount&&(
              <div style={{marginTop:6,fontSize:"0.73rem",color:txTypeColor[form.txType],background:txTypeColor[form.txType]+"12",borderRadius:"0.4rem",padding:"4px 8px"}}>
                {lang==="np"
                  ?"जम्मा (IN) र निकासी (OUT) दुवै भर्न सकिन्छ।"
                  :"You can enter both Deposit (IN) and Withdrawal (OUT) for this type."}
              </div>
            )}
          </div>

          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>

          {/* Category filtered by txType */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:4,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.category}
              <span style={{
                marginLeft:6,fontSize:"0.68rem",fontWeight:600,
                color:txTypeColor[form.txType]||"#6b7280",
                background:(txTypeColor[form.txType]||"#6b7280")+"15",
                border:`1px solid ${txTypeColor[form.txType]||"#6b7280"}30`,
                borderRadius:"0.75rem",padding:"1px 8px",
              }}>
                {txTypeOpts.find(o=>o.value===form.txType)?.label}
              </span>
            </label>
            <select
              value={form.category}
              onChange={e=>f("category")(e.target.value)}
              style={{width:"100%",padding:"0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.9rem",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff"}}
            >
              {filteredCatOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Amount fields:
              - income → only cashIn editable
              - expense → only cashOut editable
              - asset/liability → BOTH editable (dual amount) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field
              label={lang==="np"?`जम्मा / IN (रू)`:`Deposit / IN (Rs.)`}
              type="number"
              value={form.cashIn}
              onChange={f("cashIn")}
              readOnly={form.txType==="expense"}
            />
            <Field
              label={lang==="np"?`निकासी / OUT (रू)`:`Withdrawal / OUT (Rs.)`}
              type="number"
              value={form.cashOut}
              onChange={f("cashOut")}
              readOnly={form.txType==="income"}
            />
          </div>

          {/* Validation error */}
          {formErr&&(
            <div style={{background:"#fee2e2",color:"#dc2626",borderRadius:"0.4rem",padding:"6px 10px",fontSize:"0.8rem",marginBottom:"0.5rem"}}>
              ⚠ {formErr}
            </div>
          )}

          {/* Only show sync note for income/expense — assets/liabilities do NOT sync to IE */}
          {syncsToIE&&(
            <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginTop:"0.25rem"}}>🔗 {t.syncNote}</div>
          )}

          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.75rem"}}>
            <button type="button" onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={save}>{t.save}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 15: BANK BOOK (auto-sync) — with dynamic category filtering by txType
// ═══════════════════════════════════════════════════════════════════════════════
function BankBook({bank,addBank,updBank,delBank,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",deposit:0,withdrawal:0,category:"savingsContribution",txType:"income"};
  const [form,setForm]=useState(blank);
  const [formErr,setFormErr]=useState("");
  const f=k=>v=>{setFormErr("");setForm(p=>({...p,[k]:v}));};

  // When txType changes: reset category to first of the new group
  // income → clear withdrawal; expense → clear deposit
  // asset/liability → keep BOTH editable
  const changeTxType=v=>{
    const group=txTypeToCatGroup(v);
    const firstCat=(categories[group]||[])[0]||"";
    setFormErr("");
    setForm(p=>{
      const isIncomeOrExpense=v==="income"||v==="expense";
      return{
        ...p,
        txType:v,
        category:firstCat,
        deposit:   isIncomeOrExpense ? (v==="income"?p.deposit:0) : p.deposit,
        withdrawal:isIncomeOrExpense ? (v==="expense"?p.withdrawal:0) : p.withdrawal,
      };
    });
  };

  const getLabel=k=>getCatLabel(k)||catLabel(k,t);

  // Filtered category options based on current txType
  const filteredCatOpts=(()=>{
    const group=txTypeToCatGroup(form.txType);
    const keys=categories[group]||[];
    return keys.length
      ? keys.map(k=>({value:k,label:getLabel(k)}))
      : [{value:"",label:lang==="np"?"श्रेणी उपलब्ध छैन":"No categories available"}];
  })();

  const txTypeOpts=[
    {value:"income",   label:t.txTypeIncome||"आय"},
    {value:"expense",  label:t.txTypeExpense||"व्यय"},
    {value:"asset",    label:t.txTypeAsset||"सम्पत्ति"},
    {value:"liability",label:t.txTypeLiability||"दायित्व"},
  ];
  const txTypeColor={income:"#16a34a",expense:"#dc2626",asset:"#2563eb",liability:"#7c3aed"};

  const syncsToIE=form.txType==="income"||form.txType==="expense";
  const isDualAmount=form.txType==="asset"||form.txType==="liability";

  const withBal=rows=>{let b=0;return[...rows].sort((a,bb)=>a.date.localeCompare(bb.date)).map(r=>{b+=(r.deposit||0)-(r.withdrawal||0);return{...r,balance:b};});};
  const rows=withBal(bank).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS)}));

  const save=()=>{
    const inAmt=+(form.deposit)||0;
    const outAmt=+(form.withdrawal)||0;
    if(inAmt<0||outAmt<0){
      setFormErr(lang==="np"?"ऋणात्मक रकम अनुमति छैन।":"Negative amounts are not allowed.");
      return;
    }
    if(inAmt===0&&outAmt===0){
      setFormErr(lang==="np"?"कम्तिमा एक रकम (जम्मा वा निकासी) आवश्यक छ।":"At least one amount (IN or OUT) is required.");
      return;
    }
    setFormErr("");
    const en={...form,deposit:inAmt,withdrawal:outAmt};
    if(modal==="add")addBank(en);else updBank({...en,id:form.id,txId:form.txId});
    setModal(null);
  };

  const openEdit=r=>{
    let txType=r.txType||"";
    if(!txType){ txType=(r.deposit>0)?"income":"expense"; }
    setFormErr("");
    setForm({...r,txType});
    setModal("edit");
  };

  const cols=[
    {key:"dateDisp",label:t.date},
    {key:"particulars",label:t.particulars,wrap:true},
    {key:"deposit",label:t.bankDeposit,fmt:true,num:true,green:true},
    {key:"withdrawal",label:t.bankWithdrawal,fmt:true,num:true,red:true},
    {key:"balance",label:t.balance,fmt:true,num:true},
  ];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>🏛️ {t.bank}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.bank,printHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.bank,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setFormErr("");setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginBottom:"0.75rem"}}>🔗 {t.syncNote}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={openEdit} onDelete={delBank} isAdmin={isAdmin}/>
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.bank}`:`${t.edit} — ${t.bank}`} onClose={()=>setModal(null)}>

          {/* Transaction type selector */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:6,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.txType||"कारोबार प्रकार"} <span style={{color:"#dc2626"}}>*</span>
            </label>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:"0.35rem"}}>
              {txTypeOpts.map(o=>(
                <button
                  key={o.value}
                  type="button"
                  onClick={()=>changeTxType(o.value)}
                  style={{
                    padding:"6px 4px",
                    border:`2px solid ${form.txType===o.value?txTypeColor[o.value]:"#d1d5db"}`,
                    borderRadius:"0.5rem",
                    background:form.txType===o.value?txTypeColor[o.value]+"15":"#fff",
                    color:form.txType===o.value?txTypeColor[o.value]:"#6b7280",
                    cursor:"pointer",fontSize:"0.72rem",
                    fontWeight:form.txType===o.value?700:500,
                    fontFamily:"inherit",textAlign:"center",transition:"all 0.15s",
                  }}
                >
                  {o.label}
                </button>
              ))}
            </div>
            {isDualAmount&&(
              <div style={{marginTop:6,fontSize:"0.73rem",color:txTypeColor[form.txType],background:txTypeColor[form.txType]+"12",borderRadius:"0.4rem",padding:"4px 8px"}}>
                {lang==="np"
                  ?"जम्मा (IN) र निकासी (OUT) दुवै भर्न सकिन्छ।"
                  :"You can enter both Deposit (IN) and Withdrawal (OUT) for this type."}
              </div>
            )}
          </div>

          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>

          {/* Category filtered by txType */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:4,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.category}
              <span style={{
                marginLeft:6,fontSize:"0.68rem",fontWeight:600,
                color:txTypeColor[form.txType]||"#6b7280",
                background:(txTypeColor[form.txType]||"#6b7280")+"15",
                border:`1px solid ${txTypeColor[form.txType]||"#6b7280"}30`,
                borderRadius:"0.75rem",padding:"1px 8px",
              }}>
                {txTypeOpts.find(o=>o.value===form.txType)?.label}
              </span>
            </label>
            <select
              value={form.category}
              onChange={e=>f("category")(e.target.value)}
              style={{width:"100%",padding:"0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.9rem",fontFamily:"inherit",boxSizing:"border-box",outline:"none",background:"#fff"}}
            >
              {filteredCatOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          {/* Amount fields:
              - income → only deposit editable
              - expense → only withdrawal editable
              - asset/liability → BOTH editable */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field
              label={lang==="np"?`जम्मा / IN (रू)`:`Deposit / IN (Rs.)`}
              type="number"
              value={form.deposit}
              onChange={f("deposit")}
              readOnly={form.txType==="expense"}
            />
            <Field
              label={lang==="np"?`निकासी / OUT (रू)`:`Withdrawal / OUT (Rs.)`}
              type="number"
              value={form.withdrawal}
              onChange={f("withdrawal")}
              readOnly={form.txType==="income"}
            />
          </div>

          {/* Validation error */}
          {formErr&&(
            <div style={{background:"#fee2e2",color:"#dc2626",borderRadius:"0.4rem",padding:"6px 10px",fontSize:"0.8rem",marginBottom:"0.5rem"}}>
              ⚠ {formErr}
            </div>
          )}

          {/* Only show sync note for income/expense; assets/liabilities do NOT sync to IE */}
          {syncsToIE&&(
            <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginTop:"0.25rem"}}>🔗 {t.syncNote}</div>
          )}

          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"0.75rem"}}>
            <button type="button" onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={save}>{t.save}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 16: INCOME/EXPENSE — with category + month filters and totals bar
// ═══════════════════════════════════════════════════════════════════════════════
function IncomeExpense({ie,setIE,filterStart,setFilterStart,filterEnd,setFilterEnd,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",income:0,expense:0,category:"meetingExpense",source:"manual",txId:null};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));

  // Filters — default to current BS year, all months
  const currentBs=adToBS(today());
  const [filterCat,setFilterCat]=useState("");
  const [filterYear,setFilterYear]=useState(currentBs.y||2081);
  const [filterMonth,setFilterMonth]=useState(0);
  const withBal=rows=>{let b=0;return[...rows].sort((a,bb)=>a.date.localeCompare(bb.date)).map(r=>{b+=(r.income||0)-(r.expense||0);return{...r,balance:b};});};

  // Apply category + month/year + date range filters
  const filteredIE=(()=>{
    let res=ie;
    if(filterCat) res=res.filter(r=>r.category===filterCat);
    // Date range overrides BS year/month when set
    if(filterStart||filterEnd){
      if(filterStart) res=res.filter(r=>r.date>=filterStart);
      if(filterEnd)   res=res.filter(r=>r.date<=filterEnd);
    } else if(filterYear){
      res=res.filter(r=>{
        const bs=adToBS(r.date);
        return filterMonth?bs.y===filterYear&&bs.m===filterMonth:bs.y===filterYear;
      });
    }
    return res;
  })();

  const rows=withBal(filteredIE).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS)}));

  // Totals for current filter
  const totalIncome=filteredIE.reduce((s,r)=>s+(r.income||0),0);
  const totalExpense=filteredIE.reduce((s,r)=>s+(r.expense||0),0);
  const netBalance=totalIncome-totalExpense;

  const getLabel=k=>getCatLabel(k)||catLabel(k,t);
  const catOpts=[...(categories.income||[]),...(categories.expense||[])].map(k=>({value:k,label:getLabel(k)}));

  // BS year range + month labels
  const bsYears=Array.from({length:8},(_,i)=>(currentBs.y||2081)-2+i);
  const bsMonthLabels=lang==="en"?BS_MONTHS_EN:BS_MONTHS_NP;

  const save=()=>{
    const en={...form,income:+form.income,expense:+form.expense,modifiedAt:new Date().toISOString()};
    if(modal==="add")setIE([...ie,{...en,id:uid()}]);
    else setIE(ie.map(x=>x.id===form.id?en:x));
    setModal(null);
  };
  const del=id=>{
    const en=ie.find(x=>x.id===id);
    if(en?.txId){alert(t.syncedEdit);return;}
    setIE(ie.filter(x=>x.id!==id));
  };
  const editEntry=r=>{
    if(r.txId){alert(t.syncedEdit);return;}
    setForm(r);setModal("edit");
  };
  const cols=[{key:"dateDisp",label:t.date},{key:"particulars",label:t.particulars,wrap:true},{key:"income",label:t.incomeLabel,fmt:true,num:true,green:true},{key:"expense",label:t.expenseLabel,fmt:true,num:true,red:true},{key:"balance",label:t.balance,fmt:true,num:true}];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  const selStyle={padding:"0.45rem 0.6rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.82rem",background:"#fff",flex:1,minWidth:0,outline:"none"};

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>📊 {t.income}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.income,printHTML)} color="#dc2626" icon="download">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.income,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>

      {/* Filter bar: category + year + month + date range */}
      <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"0.6rem",alignItems:"center"}}>
        <select value={filterCat} onChange={e=>setFilterCat(e.target.value)} style={selStyle}>
          <option value="">{lang==="np"?"सबै श्रेणी":"All Categories"}</option>
          {catOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select value={filterYear} onChange={e=>{setFilterYear(Number(e.target.value));setFilterStart("");setFilterEnd("");}} style={{...selStyle,opacity:filterStart||filterEnd?0.4:1}} disabled={!!(filterStart||filterEnd)}>
          {bsYears.map(y=><option key={y} value={y}>{y} {lang==="np"?"वि.सं.":"BS"}</option>)}
        </select>
        <select value={filterMonth} onChange={e=>{setFilterMonth(Number(e.target.value));setFilterStart("");setFilterEnd("");}} style={{...selStyle,opacity:filterStart||filterEnd?0.4:1}} disabled={!!(filterStart||filterEnd)}>
          <option value={0}>{lang==="np"?"सबै महिना":"All Months"}</option>
          {bsMonthLabels.map((m,i)=><option key={i+1} value={i+1}>{m}</option>)}
        </select>
      </div>
      <div style={{display:"flex",gap:"0.4rem",flexWrap:"wrap",marginBottom:"0.75rem",alignItems:"center"}}>
        <span style={{fontSize:"0.75rem",color:"#6b7280",fontWeight:600,whiteSpace:"nowrap"}}>{lang==="np"?"मिति दायरा:":"Date Range:"}</span>
        <input type="date" value={filterStart} onChange={e=>{setFilterStart(e.target.value);}} style={{...selStyle,flex:"0 1 auto"}} placeholder={lang==="np"?"सुरु मिति":"Start Date"}/>
        <span style={{fontSize:"0.78rem",color:"#9ca3af"}}>—</span>
        <input type="date" value={filterEnd} onChange={e=>{setFilterEnd(e.target.value);}} style={{...selStyle,flex:"0 1 auto"}} placeholder={lang==="np"?"अन्त मिति":"End Date"}/>
        {(filterCat||filterMonth!==0||filterStart||filterEnd)&&(
          <button type="button" onClick={()=>{setFilterCat("");setFilterMonth(0);setFilterStart("");setFilterEnd("");}} style={{padding:"0.4rem 0.7rem",border:"1px solid #fecaca",borderRadius:"0.5rem",background:"#fee2e2",color:"#dc2626",cursor:"pointer",fontSize:"0.78rem",fontFamily:"inherit",fontWeight:600,flexShrink:0}}>
            {lang==="np"?"रिसेट":"Reset"}
          </button>
        )}
      </div>

      {/* Totals bar */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.4rem",marginBottom:"0.75rem"}}>
        <div style={{background:"#f0fdf4",borderRadius:"0.5rem",padding:"0.5rem 0.6rem",borderLeft:"3px solid #16a34a",textAlign:"center"}}>
          <div style={{fontSize:"0.62rem",color:"#6b7280",fontWeight:600}}>{t.incomeLabel}</div>
          <div style={{fontSize:"0.88rem",fontWeight:700,color:"#16a34a"}}>{fmtFn(totalIncome)}</div>
        </div>
        <div style={{background:"#fff7ed",borderRadius:"0.5rem",padding:"0.5rem 0.6rem",borderLeft:"3px solid #dc2626",textAlign:"center"}}>
          <div style={{fontSize:"0.62rem",color:"#6b7280",fontWeight:600}}>{t.expenseLabel}</div>
          <div style={{fontSize:"0.88rem",fontWeight:700,color:"#dc2626"}}>{fmtFn(totalExpense)}</div>
        </div>
        <div style={{background:netBalance>=0?"#eff6ff":"#fef2f2",borderRadius:"0.5rem",padding:"0.5rem 0.6rem",borderLeft:`3px solid ${netBalance>=0?"#2563eb":"#dc2626"}`,textAlign:"center"}}>
          <div style={{fontSize:"0.62rem",color:"#6b7280",fontWeight:600}}>{t.netBalance||"Net"}</div>
          <div style={{fontSize:"0.88rem",fontWeight:700,color:netBalance>=0?"#2563eb":"#dc2626"}}>{fmtFn(netBalance)}</div>
        </div>
      </div>

      <div style={{background:"#fefce8",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#854d0e",marginBottom:"0.75rem"}}>💡 {t.syncHint}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={editEntry} onDelete={del} isAdmin={isAdmin}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.income}`:`${t.edit} — ${t.income}`} onClose={()=>setModal(null)}>
          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>
          <Field label={t.category} type="select" value={form.category} onChange={f("category")} options={catOpts}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.incomeLabel} (रू)`} type="number" value={form.income} onChange={f("income")}/>
            <Field label={`${t.expenseLabel} (रू)`} type="number" value={form.expense} onChange={f("expense")}/>
          </div>
          <div style={{display:"flex",gap:"0.5rem",justifyContent:"flex-end",marginTop:"1rem"}}>
            <button onClick={()=>setModal(null)} style={{padding:"0.55rem 1rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",background:"#fff",cursor:"pointer",fontFamily:"inherit"}}>{t.cancel}</button>
            <Btn onClick={save}>{t.save}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION 17: REPORTS DASHBOARD — Income/Expense + Asset/Liability + Monthly
// ═══════════════════════════════════════════════════════════════════════════════
// =============================================================================
// SECTION: TREASURER-STYLE MONTHLY FINANCIAL REPORT
// All totals are CUMULATIVE (all-time). Month/year selector = title only.
// =============================================================================
function Reports({totalSaving,totalLoanOut,cashBal,bankBal,totalFund,members,savings,loans,loanPayments,cash,bank,ie,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [subTab,setSubTab]=useState("monthly");

  // Month/year for TITLE ONLY — does NOT filter any calculations
  const currentBsYear=adToBS(today()).y||2081;
  const bsYearStart=2079;
  const bsYearEnd=Math.max(currentBsYear+2,2090);
  const bsYears=Array.from({length:bsYearEnd-bsYearStart+1},(_,i)=>bsYearStart+i);
  const [selY,setSelY]=useState(currentBsYear);
  const [selM,setSelM]=useState(adToBS(today()).m||1);
  const bsMOpts=(lang==="en"?BS_MONTHS_EN:BS_MONTHS_NP).map((m,i)=>({value:i+1,label:m}));

  // ALL CUMULATIVE — no period filtering anywhere
  const allInc=ie.reduce((a,x)=>a+(x.income||0),0);
  const allExp=ie.reduce((a,x)=>a+(x.expense||0),0);
  const profitLoss=allInc-allExp;

  const rLoanIssued=loans.reduce((a,l)=>a+(l.loanAmount||l.principal||0),0);
  const rPrincipal=(loanPayments||[]).reduce((a,p)=>a+(p.principalPaid||0),0)||
                    loans.reduce((a,l)=>a+(l.principalPaid||0),0);
  const rInterest=(loanPayments||[]).reduce((a,p)=>a+(p.interestPaid||0),0)||
                   loans.reduce((a,l)=>a+(l.interestPaid||0),0);
  const allSaving=savings.reduce((a,s)=>a+(s.deposit||0)-(s.withdraw||0),0);
  const bankInterestAmt=bank.filter(b=>b.category==="interest").reduce((a,b)=>a+(b.deposit||0),0);
  const netGroupFund=cashBal+bankBal;

  // Category breakdown — dynamically detect ALL categories from actual ie records
  // (never hardcode or rely on categories prop so future custom categories auto-appear)
  const getLabel=k=>getCatLabel(k)||catLabel(k,t);
  const allCatKeys=[...new Set(ie.map(r=>r.category).filter(Boolean))];
  // Also include any configured-but-unused categories so layout is consistent
  const configuredKeys=[...(categories.income||[]),...(categories.expense||[])];
  const mergedKeys=[...new Set([...allCatKeys,...configuredKeys])];
  const catBreakdown=mergedKeys.map(k=>{
    const inc=ie.filter(r=>r.category===k).reduce((s,r)=>s+(r.income||0),0);
    const exp=ie.filter(r=>r.category===k).reduce((s,r)=>s+(r.expense||0),0);
    return{key:k,label:getLabel(k),inc,exp,net:inc-exp};
  }).filter(c=>c.inc>0||c.exp>0);

  // Asset / Liability — balance sheet snapshot (always all-time)
  const totalAssets=cashBal+bankBal+totalLoanOut;
  const membersShare=totalSaving;
  const totalLiabilities=membersShare+profitLoss;
  const balanceDiff=totalAssets-totalLiabilities;

  // Period string — used in headings ONLY, no data filtering
  const mLabel=lang==="en"?BS_MONTHS_EN[selM-1]:BS_MONTHS_NP[selM-1];
  const period=`${mLabel} ${selY} ${t.bsLabel}`;
  const reportTitle=`${t.monthlyReport} \u2014 ${period}`;

  const sigNames=lang==="np"
    ?["\u0905\u0927\u094d\u092f\u0915\u094d\u0937","\u0938\u091a\u093f\u0935","\u0915\u094b\u0937\u093e\u0927\u094d\u092f\u0915\u094d\u0937"]
    :["President","Secretary","Treasurer"];

  // Print HTML (cumulative format)
  const incRows=catBreakdown.filter(c=>c.inc>0).map(c=>`<tr><td style="padding-left:1.5em">${c.label}</td><td style="text-align:right">${fmtFn(c.inc)}</td></tr>`).join("");
  const expRows=catBreakdown.filter(c=>c.exp>0).map(c=>`<tr><td style="padding-left:1.5em">${c.label}</td><td style="text-align:right">${fmtFn(c.exp)}</td></tr>`).join("");
  const printHTML=`
    <h2>${reportTitle}</h2>
    <p style="font-size:0.85em;color:#555;margin-top:-0.5em">${lang==="np"?"(\u0938\u0902\u0938\u094d\u0925\u093e\u092a\u0928\u093e\u0915\u093e\u0932\u0926\u0947\u0916\u093f \u0939\u093e\u0932\u0938\u092e\u094d\u092e\u0915\u094b \u0938\u0902\u091a\u093f\u0924 \u0915\u0941\u0932)":"(Cumulative totals from establishment to date)"}</p>
    <table><thead><tr><th>${lang==="np"?"\u0935\u093f\u0935\u0930\u0923":"Particulars"}</th><th style="text-align:right">${lang==="np"?"\u0930\u0915\u092e (\u0930\u0942)":"Amount (Rs.)"}</th></tr></thead><tbody>
      <tr><th colspan="2" style="text-align:left;background:#e8f5e9">${lang==="np"?"\u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Income"}</th></tr>
      ${incRows}
      <tr class="total-row"><td>${lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Total Income"}</td><td style="text-align:right">${fmtFn(allInc)}</td></tr>
      <tr><th colspan="2" style="text-align:left;background:#fce4ec">${lang==="np"?"\u0916\u0930\u094d\u091a":"Expense"}</th></tr>
      ${expRows}
      <tr class="total-row"><td>${lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0916\u0930\u094d\u091a":"Total Expense"}</td><td style="text-align:right">${fmtFn(allExp)}</td></tr>
      <tr class="total-row"><td>${lang==="np"?"\u0928\u093e\u092b\u093e / \u0918\u093e\u091f\u093e":"Profit / Loss"}</td><td style="text-align:right">${fmtFn(profitLoss)}</td></tr>
      <tr><th colspan="2" style="text-align:left;background:#e3f2fd">${lang==="np"?"\u0906\u0930\u094d\u0925\u093f\u0915 \u0938\u094d\u0925\u093f\u0924\u093f":"Financial Position"}</th></tr>
      <tr><td>${lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u092c\u091a\u0924 (\u0938\u0926\u0938\u094d\u092f)":"Total Savings (Members)"}</td><td style="text-align:right">${fmtFn(allSaving)}</td></tr>
      <tr><td>${lang==="np"?"\u0943\u0923 \u091c\u093e\u0930\u0940":"Loan Issued"}</td><td style="text-align:right">${fmtFn(rLoanIssued)}</td></tr>
      <tr><td>${lang==="np"?"\u0938\u093e\u0901\u0935\u093e \u0909\u0920\u093e\u0928":"Principal Recovered"}</td><td style="text-align:right">${fmtFn(rPrincipal)}</td></tr>
      <tr><td>${lang==="np"?"\u092c\u094d\u092f\u093e\u091c \u0909\u0920\u093e\u0928":"Interest Recovered"}</td><td style="text-align:right">${fmtFn(rInterest)}</td></tr>
      <tr><td>${t.cashBalance}</td><td style="text-align:right">${fmtFn(cashBal)}</td></tr>
      <tr><td>${t.bankBalance}</td><td style="text-align:right">${fmtFn(bankBal)}</td></tr>
      <tr class="total-row"><td>${lang==="np"?"\u0928\u0947\u091f \u0938\u092e\u0942\u0939 \u0915\u094b\u0937":"Net Group Fund"}</td><td style="text-align:right">${fmtFn(netGroupFund)}</td></tr>
      <tr><td>${t.totalMembers}</td><td style="text-align:right">${members.length}</td></tr>
    </tbody></table>
    <div class="sig-area">${sigNames.map(n=>`<div class="sig-line">${n}</div>`).join("")}</div>`;

  const selSt={padding:"0.4rem 0.65rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.82rem",background:"#fff",outline:"none"};

  const subTabs=[
    {id:"monthly",label:lang==="np"?"\u092e\u093e\u0938\u093f\u0915 \u092a\u094d\u0930\u0924\u093f\u0935\u0947\u0926\u0928":"Monthly Report",icon:"report", color:"#1b5e20"},
    {id:"ie",     label:lang==="np"?"\u0906\u092f-\u0935\u094d\u092f\u092f":"Income/Exp",       icon:"income", color:"#7c3aed"},
    {id:"balance",label:lang==="np"?"\u0938\u092e\u094d\u092a\u0924\u094d\u0924\u093f":"Assets",        icon:"bank",   color:"#2563eb"},
  ];

  // Reusable row renderer
  const Row=({l,v,bold,hi,indent})=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:indent?"0.55rem 1rem 0.55rem 1.5rem":"0.6rem 1rem",borderBottom:"1px solid #f3f4f6",fontSize:"0.88rem",background:hi||"transparent"}}>
      <span style={{color:hi?"#fff":"#374151",fontWeight:bold?700:500}}>{l}</span>
      <span style={{fontWeight:bold?700:600,color:hi?"#fff":"#111827"}}>{v}</span>
    </div>
  );

  return(
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>\ud83d\udcc4 {t.report}</h2>
        {subTab==="monthly"&&(
          <Btn onClick={()=>exportPrint(reportTitle,printHTML)} color="#dc2626" icon="download">{t.print}</Btn>
        )}
      </div>

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:"0.35rem",marginBottom:"0.85rem",background:"#f0fdf4",borderRadius:"0.75rem",padding:"0.35rem"}}>
        {subTabs.map(s=>(
          <button key={s.id} type="button" onClick={()=>setSubTab(s.id)} style={{
            flex:1,padding:"0.45rem 0.25rem",border:"none",cursor:"pointer",
            borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.75rem",
            fontWeight:subTab===s.id?700:500,
            background:subTab===s.id?"#fff":"transparent",
            color:subTab===s.id?s.color:"#6b7280",
            boxShadow:subTab===s.id?"0 1px 4px rgba(0,0,0,0.1)":"none",
            display:"flex",alignItems:"center",justifyContent:"center",gap:4,
            transition:"all 0.15s",
          }}>
            <Icon name={s.icon} size={13} color={subTab===s.id?s.color:"#9ca3af"}/>
            {s.label}
          </button>
        ))}
      </div>

      {/* Month/year selector — TITLE ONLY banner */}
      <div style={{background:"#fffbeb",border:"1px solid #fcd34d",borderRadius:"0.6rem",padding:"0.5rem 0.75rem",marginBottom:"0.75rem",display:"flex",gap:"0.5rem",alignItems:"center",flexWrap:"wrap"}}>
        <span style={{fontSize:"0.72rem",color:"#92400e",fontWeight:700,whiteSpace:"nowrap"}}>\ud83d\udcc5 {lang==="np"?"\u092a\u094d\u0930\u0924\u093f\u0935\u0947\u0926\u0928 \u092e\u0939\u093f\u0928\u093e \u2014 \u0936\u0940\u0930\u094d\u0937\u0915\u0915\u093e \u0932\u093e\u0917\u093f \u092e\u093e\u0924\u094d\u0930":"Report Month \u2014 for title only"}</span>
        <select value={selY} onChange={e=>setSelY(+e.target.value)} style={selSt}>
          {bsYears.map(y=><option key={y} value={y}>{y} {t.bsLabel}</option>)}
        </select>
        <select value={selM} onChange={e=>setSelM(+e.target.value)} style={selSt}>
          {bsMOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <span style={{fontSize:"0.72rem",color:"#b45309",fontStyle:"italic",marginLeft:"auto"}}>{period}</span>
      </div>

      {/* Cumulative notice */}
      <div style={{background:"#f0fdf4",border:"1px solid #bbf7d0",borderRadius:"0.5rem",padding:"0.4rem 0.75rem",marginBottom:"0.85rem",fontSize:"0.72rem",color:"#166534",fontWeight:500}}>
        \u2139\ufe0f {lang==="np"?"\u0938\u092c\u0948 \u0930\u0915\u092e\u0939\u0930\u0942 \u0938\u0902\u091a\u093f\u0924 \u091c\u092e\u094d\u092e\u093e\u0939\u0930\u0942 \u2014 \u0938\u0902\u0938\u094d\u0925\u093e\u092a\u0928\u093e\u0915\u093e\u0932\u0926\u0947\u0916\u093f \u0939\u093e\u0932\u0938\u092e\u094d\u092e\u0915\u094b \u0938\u092e\u0917\u094d\u0930 \u0915\u0941\u0932 (महिना छनोटले डेटा फिल्टर गर्दैन)":"All figures show cumulative totals from establishment to date. Month selection does not filter data."}
      </div>

      {/* ══ MONTHLY REPORT TAB ══ */}
      {subTab==="monthly"&&(
        <div>
          {/* Quick cards */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"0.5rem",marginBottom:"0.85rem"}}>
            {[
              {label:lang==="np"?"\u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Total Income",  val:allInc,    color:"#16a34a",bg:"#f0fdf4"},
              {label:lang==="np"?"\u0916\u0930\u094d\u091a":"Total Expense",   val:allExp,    color:"#dc2626",bg:"#fff7ed"},
              {label:lang==="np"?"\u0928\u093e\u092b\u093e/\u0918\u093e\u091f\u093e":"Profit/Loss", val:profitLoss,color:profitLoss>=0?"#2563eb":"#dc2626",bg:profitLoss>=0?"#eff6ff":"#fef2f2"},
            ].map((c,i)=>(
              <div key={i} style={{background:c.bg,borderRadius:"0.65rem",padding:"0.6rem 0.5rem",textAlign:"center"}}>
                <div style={{fontSize:"0.6rem",color:"#6b7280",fontWeight:600,marginBottom:2}}>{c.label}</div>
                <div style={{fontSize:"0.88rem",fontWeight:800,color:c.color}}>{fmtFn(c.val)}</div>
              </div>
            ))}
          </div>

          {/* Treasurer report card */}
          <div style={{background:"#fff",borderRadius:"1rem",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",overflow:"hidden",marginBottom:"1rem"}}>
            {/* Report header */}
            <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",padding:"1rem 1.25rem",color:"#fff",textAlign:"center"}}>
              <div style={{fontSize:"1.05rem",fontWeight:700}}>{t.appName}</div>
              <div style={{fontSize:"0.85rem",fontWeight:700,marginTop:3}}>{t.monthlyReport}</div>
              <div style={{fontSize:"0.78rem",opacity:0.85,marginTop:1}}>{period}</div>
            </div>
            <div style={{background:"#fefce8",padding:"0.35rem 1rem",fontSize:"0.7rem",color:"#854d0e",fontStyle:"italic",textAlign:"center",borderBottom:"1px solid #fef9c3"}}>
              {lang==="np"?"\u0938\u0902\u0938\u094d\u0925\u093e\u092a\u0928\u093e\u0915\u093e\u0932\u0926\u0947\u0916\u093f \u0939\u093e\u0932\u0938\u092e\u094d\u092e\u0915\u094b \u0938\u0902\u091a\u093f\u0924 \u0915\u0941\u0932 \u0930\u0915\u092e":"Cumulative totals from group establishment to date"}
            </div>

            {/* Income */}
            <div style={{padding:"0.45rem 1rem 0.2rem",background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,color:"#16a34a",textTransform:"uppercase",letterSpacing:"0.04em"}}>{lang==="np"?"\u0906\u092e\u094d\u0926\u093e\u0928\u0940 (Income)":"Income"}</div>
            </div>
            {catBreakdown.filter(c=>c.inc>0).length===0?(
              <div style={{padding:"0.5rem 1.5rem",fontSize:"0.82rem",color:"#9ca3af"}}>{t.noData}</div>
            ):catBreakdown.filter(c=>c.inc>0).map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 1rem 0.5rem 1.75rem",borderBottom:"1px solid #f3f4f6",fontSize:"0.85rem"}}>
                <span style={{color:"#374151"}}>{c.label}</span>
                <span style={{fontWeight:600,color:"#16a34a"}}>{fmtFn(c.inc)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"0.6rem 1rem",background:"#f0fdf4",fontWeight:700,fontSize:"0.88rem",borderBottom:"2px solid #e5e7eb"}}>
              <span style={{color:"#166534"}}>{lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Total Income"}</span>
              <span style={{color:"#16a34a"}}>{fmtFn(allInc)}</span>
            </div>

            {/* Expense */}
            <div style={{padding:"0.45rem 1rem 0.2rem",background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,color:"#dc2626",textTransform:"uppercase",letterSpacing:"0.04em"}}>{lang==="np"?"\u0916\u0930\u094d\u091a (Expense)":"Expense"}</div>
            </div>
            {catBreakdown.filter(c=>c.exp>0).length===0?(
              <div style={{padding:"0.5rem 1.5rem",fontSize:"0.82rem",color:"#9ca3af"}}>{t.noData}</div>
            ):catBreakdown.filter(c=>c.exp>0).map((c,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.5rem 1rem 0.5rem 1.75rem",borderBottom:"1px solid #f3f4f6",fontSize:"0.85rem"}}>
                <span style={{color:"#374151"}}>{c.label}</span>
                <span style={{fontWeight:600,color:"#dc2626"}}>{fmtFn(c.exp)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"0.6rem 1rem",background:"#fff7ed",fontWeight:700,fontSize:"0.88rem",borderBottom:"2px solid #e5e7eb"}}>
              <span style={{color:"#9a3412"}}>{lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0916\u0930\u094d\u091a":"Total Expense"}</span>
              <span style={{color:"#dc2626"}}>{fmtFn(allExp)}</span>
            </div>

            {/* Profit/Loss */}
            <div style={{display:"flex",justifyContent:"space-between",padding:"0.7rem 1rem",background:profitLoss>=0?"#166534":"#dc2626",color:"#fff",fontWeight:700,fontSize:"0.95rem",borderBottom:"2px solid #e5e7eb"}}>
              <span>{lang==="np"?"\u0928\u093e\u092b\u093e / \u0918\u093e\u091f\u093e":"Profit / Loss"}</span><span>{fmtFn(profitLoss)}</span>
            </div>

            {/* Financial Position */}
            <div style={{padding:"0.45rem 1rem 0.2rem",background:"#f9fafb",borderBottom:"1px solid #f3f4f6"}}>
              <div style={{fontSize:"0.72rem",fontWeight:700,color:"#2563eb",textTransform:"uppercase",letterSpacing:"0.04em"}}>{lang==="np"?"\u0906\u0930\u094d\u0925\u093f\u0915 \u0938\u094d\u0925\u093f\u0924\u093f (Financial Position)":"Financial Position"}</div>
            </div>
            {[
              [lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u092c\u091a\u0924 (\u0938\u0926\u0938\u094d\u092f)":"Total Savings (Members)",fmtFn(allSaving)],
              [lang==="np"?"\u0943\u0923 \u091c\u093e\u0930\u0940":"Loan Issued",                                                    fmtFn(rLoanIssued)],
              [lang==="np"?"\u0938\u093e\u0901\u0935\u093e \u0909\u0920\u093e\u0928":"Principal Recovered",                          fmtFn(rPrincipal)],
              [lang==="np"?"\u092c\u094d\u092f\u093e\u091c \u0909\u0920\u093e\u0928":"Interest Recovered",                           fmtFn(rInterest)],
              [t.cashBalance,                                                                                                         fmtFn(cashBal)],
              [t.bankBalance,                                                                                                         fmtFn(bankBal)],
              [lang==="np"?"\u0938\u0926\u0938\u094d\u092f \u0938\u0902\u0916\u094d\u092f\u093e":"Total Members",                    members.length],
            ].map(([l,v],i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"0.6rem 1rem",borderBottom:"1px solid #f3f4f6",fontSize:"0.88rem"}}>
                <span style={{color:"#374151"}}>{l}</span><span style={{fontWeight:600}}>{v}</span>
              </div>
            ))}

            {/* Net Group Fund */}
            <div style={{padding:"0.75rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",padding:"0.75rem 1rem",background:"#1b5e20",color:"#fff",borderRadius:"0.5rem",fontWeight:700,fontSize:"1rem"}}>
                <span>{lang==="np"?"\u0928\u0947\u091f \u0938\u092e\u0942\u0939 \u0915\u094b\u0937 (Cash + Bank)":"Net Group Fund (Cash + Bank)"}</span>
                <span>{fmtFn(netGroupFund)}</span>
              </div>
            </div>

            {/* Signature area */}
            <div style={{padding:"0 1rem 1rem"}}>
              <div style={{fontSize:"0.75rem",color:"#6b7280",marginBottom:"0.75rem",fontWeight:600,borderTop:"1px solid #f3f4f6",paddingTop:"0.75rem"}}>{lang==="np"?"\u0939\u0938\u094d\u0924\u093e\u0915\u094d\u0937\u0930 \u0915\u094d\u0937\u0947\u0924\u094d\u0930":"Signature Area"}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"1rem"}}>
                {sigNames.map(x=>(
                  <div key={x} style={{borderTop:"2px solid #d1d5db",paddingTop:"0.5rem",fontSize:"0.78rem",color:"#6b7280",textAlign:"center"}}>{x}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ══ INCOME/EXPENSE TAB (cumulative) ══ */}
      {subTab==="ie"&&(
        <div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0.5rem",marginBottom:"0.85rem"}}>
            {[
              {label:lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Total Income",  val:allInc,    color:"#16a34a",bg:"#f0fdf4",border:"#bbf7d0"},
              {label:lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0916\u0930\u094d\u091a":"Total Expense",   val:allExp,    color:"#dc2626",bg:"#fff7ed",border:"#fed7aa"},
              {label:lang==="np"?"\u0928\u093e\u092b\u093e/\u0918\u093e\u091f\u093e":"Net Profit/Loss",    val:profitLoss,color:profitLoss>=0?"#2563eb":"#dc2626",bg:profitLoss>=0?"#eff6ff":"#fef2f2",border:profitLoss>=0?"#bfdbfe":"#fecaca"},
            ].map((c,i)=>(
              <div key={i} style={{background:c.bg,borderRadius:"0.75rem",padding:"0.75rem 0.5rem",textAlign:"center",border:`1px solid ${c.border}`}}>
                <div style={{fontSize:"0.62rem",color:"#6b7280",fontWeight:600,marginBottom:2}}>{c.label}</div>
                <div style={{fontSize:"0.95rem",fontWeight:800,color:c.color}}>{fmtFn(c.val)}</div>
              </div>
            ))}
          </div>

          <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#5b21b6,#7c3aed)",padding:"0.65rem 1rem",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:700,fontSize:"0.85rem"}}>{lang==="np"?"\ud83d\udcc2 \u0936\u094d\u0930\u0947\u0923\u0940\u0917\u0924 \u0935\u093f\u0935\u0930\u0923":"\ud83d\udcc2 Category Breakdown"}</div>
              <div style={{fontSize:"0.7rem",opacity:0.85}}>{lang==="np"?"\u0938\u0902\u091a\u093f\u0924 \u091c\u092e\u094d\u092e\u093e":"Cumulative All-Time"}</div>
            </div>
            {catBreakdown.length===0?(
              <div style={{padding:"1.5rem",textAlign:"center",color:"#9ca3af",fontSize:"0.85rem"}}>{t.noData}</div>
            ):(
              <div style={{overflowX:"auto"}}>
                <table style={{width:"100%",borderCollapse:"collapse",fontSize:"0.82rem"}}>
                  <thead>
                    <tr style={{background:"#f9fafb"}}>
                      <th style={{padding:"0.5rem 1rem",textAlign:"left",fontWeight:700,color:"#6b7280",fontSize:"0.72rem"}}>{t.category}</th>
                      <th style={{padding:"0.5rem 0.75rem",textAlign:"right",fontWeight:700,color:"#16a34a",fontSize:"0.72rem"}}>{lang==="np"?"\u0906\u092e\u094d\u0926\u093e\u0928\u0940":"Income"}</th>
                      <th style={{padding:"0.5rem 0.75rem",textAlign:"right",fontWeight:700,color:"#dc2626",fontSize:"0.72rem"}}>{lang==="np"?"\u0916\u0930\u094d\u091a":"Expense"}</th>
                      <th style={{padding:"0.5rem 0.75rem",textAlign:"right",fontWeight:700,color:"#374151",fontSize:"0.72rem"}}>{lang==="np"?"\u0928\u0947\u091f":"Net"}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {catBreakdown.map((c,i)=>(
                      <tr key={i} style={{borderBottom:"1px solid #f3f4f6"}}>
                        <td style={{padding:"0.55rem 1rem",color:"#374151",fontWeight:500}}>{c.label}</td>
                        <td style={{padding:"0.55rem 0.75rem",textAlign:"right",color:"#16a34a",fontWeight:c.inc>0?600:400}}>{c.inc>0?fmtFn(c.inc):"\u2014"}</td>
                        <td style={{padding:"0.55rem 0.75rem",textAlign:"right",color:"#dc2626",fontWeight:c.exp>0?600:400}}>{c.exp>0?fmtFn(c.exp):"\u2014"}</td>
                        <td style={{padding:"0.55rem 0.75rem",textAlign:"right",color:c.net>=0?"#2563eb":"#dc2626",fontWeight:700}}>{fmtFn(c.net)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{background:"#f0fdf4",fontWeight:700}}>
                      <td style={{padding:"0.6rem 1rem",color:"#111827"}}>{lang==="np"?"\u091c\u092e\u094d\u092e\u093e":"Total"}</td>
                      <td style={{padding:"0.6rem 0.75rem",textAlign:"right",color:"#16a34a"}}>{fmtFn(allInc)}</td>
                      <td style={{padding:"0.6rem 0.75rem",textAlign:"right",color:"#dc2626"}}>{fmtFn(allExp)}</td>
                      <td style={{padding:"0.6rem 0.75rem",textAlign:"right",color:profitLoss>=0?"#2563eb":"#dc2626"}}>{fmtFn(profitLoss)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ ASSET/LIABILITY TAB ══ */}
      {subTab==="balance"&&(
        <div>
          <div style={{background:`linear-gradient(135deg,${Math.abs(balanceDiff)<1?"#166534,#16a34a":balanceDiff>0?"#1e40af,#2563eb":"#991b1b,#dc2626"})`,borderRadius:"0.875rem",padding:"1rem 1.25rem",marginBottom:"0.85rem",color:"#fff",textAlign:"center"}}>
            <div style={{fontSize:"0.72rem",fontWeight:600,opacity:0.85,marginBottom:3,letterSpacing:"0.04em"}}>{lang==="np"?"\u0938\u092e\u094d\u092a\u0924\u094d\u0924\u093f \u2014 \u0926\u093e\u092f\u093f\u0924\u094d\u0935":"ASSETS \u2014 LIABILITIES"}</div>
            <div style={{fontSize:"1.6rem",fontWeight:800}}>{fmtFn(Math.abs(balanceDiff))}</div>
            <div style={{fontSize:"0.7rem",opacity:0.8,marginTop:3}}>{Math.abs(balanceDiff)<1?(lang==="np"?"\u2713 \u0938\u0928\u094d\u0924\u0941\u0932\u093f\u0924":"\u2713 Balanced"):(balanceDiff>0?(lang==="np"?"\u25b2 \u0905\u0924\u093f\u0930\u093f\u0915\u094d\u0924":"\u25b2 Surplus"):(lang==="np"?"\u25bc \u0918\u093e\u091f\u093e":"\u25bc Deficit"))}</div>
          </div>

          {/* Assets card */}
          <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden",marginBottom:"0.75rem"}}>
            <div style={{background:"linear-gradient(135deg,#065f46,#059669)",padding:"0.65rem 1rem",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:"0.88rem"}}>\ud83c\udfd7\ufe0f {lang==="np"?"\u0938\u092e\u094d\u092a\u0924\u094d\u0924\u093f":"Assets"}</span>
              <span style={{fontWeight:800,fontSize:"0.95rem"}}>{fmtFn(totalAssets)}</span>
            </div>
            {[
              {label:lang==="np"?"\u0928\u0917\u0926 (Cash)":"Cash",                        val:cashBal,     note:lang==="np"?"\u0928\u0917\u0926 \u0915\u093f\u0924\u093e\u092c":"Cash Book"},
              {label:lang==="np"?"\u092c\u0948\u0902\u0915 (Bank)":"Bank",                   val:bankBal,     note:lang==="np"?"\u092c\u0948\u0902\u0915 \u0915\u093f\u0924\u093e\u092c":"Bank Book"},
              {label:lang==="np"?"\u0943\u0923 \u092c\u093e\u0901\u0915\u0940 (Loan O/S)":"Loan Outstanding",val:totalLoanOut,note:lang==="np"?"\u0943\u0923 \u0932\u0947\u091c\u0930":"Loan Ledger"},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.6rem 1rem",borderBottom:"1px solid #f0fdf4"}}>
                <div>
                  <div style={{fontSize:"0.83rem",color:"#374151",fontWeight:500}}>{r.label}</div>
                  <div style={{fontSize:"0.68rem",color:"#9ca3af"}}>{r.note}</div>
                </div>
                <span style={{fontWeight:700,color:"#065f46",fontSize:"0.9rem"}}>{fmtFn(r.val)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"0.65rem 1rem",background:"#ecfdf5",fontWeight:700,fontSize:"0.9rem"}}>
              <span style={{color:"#065f46"}}>{lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u0938\u092e\u094d\u092a\u0924\u094d\u0924\u093f":"Total Assets"}</span>
              <span style={{color:"#065f46"}}>{fmtFn(totalAssets)}</span>
            </div>
          </div>

          {/* Capital & Liabilities card */}
          <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden",marginBottom:"0.75rem"}}>
            <div style={{background:"linear-gradient(135deg,#1e40af,#2563eb)",padding:"0.65rem 1rem",color:"#fff",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <span style={{fontWeight:700,fontSize:"0.88rem"}}>\ud83d\udcdd {lang==="np"?"\u092a\u0941\u0901\u091c\u0940 \u0924\u0925\u093e \u0926\u093e\u092f\u093f\u0924\u094d\u0935":"Capital & Liabilities"}</span>
              <span style={{fontWeight:800,fontSize:"0.95rem"}}>{fmtFn(totalLiabilities)}</span>
            </div>
            {[
              {label:lang==="np"?"\u0938\u0926\u0938\u094d\u092f\u0915\u094b \u092c\u091a\u0924 (Members Share)":"Members\' Share Capital",val:membersShare,  note:lang==="np"?"\u092c\u091a\u0924 \u0932\u0947\u091c\u0930":"Savings Ledger",color:"#374151"},
              {label:profitLoss>=0?(lang==="np"?"\u091c\u094b\u0921\u093c: \u0928\u093e\u092b\u093e":"Add: Profit"):(lang==="np"?"\u0918\u091f\u093e\u0909: \u0918\u093e\u091f\u093e":"Less: Loss"),val:Math.abs(profitLoss),note:lang==="np"?"\u0906\u092f-\u0935\u094d\u092f\u092f":"Income/Expense",color:profitLoss>=0?"#16a34a":"#dc2626"},
            ].map((r,i)=>(
              <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"0.6rem 1rem",borderBottom:"1px solid #e0e7ff"}}>
                <div>
                  <div style={{fontSize:"0.83rem",color:"#374151",fontWeight:500}}>{r.label}</div>
                  <div style={{fontSize:"0.68rem",color:"#9ca3af"}}>{r.note}</div>
                </div>
                <span style={{fontWeight:700,color:r.color,fontSize:"0.9rem"}}>{fmtFn(r.val)}</span>
              </div>
            ))}
            <div style={{display:"flex",justifyContent:"space-between",padding:"0.65rem 1rem",background:"#eff6ff",fontWeight:700,fontSize:"0.9rem"}}>
              <span style={{color:"#1e40af"}}>{lang==="np"?"\u091c\u092e\u094d\u092e\u093e \u092a\u0941\u0901\u091c\u0940 / \u0926\u093e\u092f\u093f\u0924\u094d\u0935":"Total Capital & Liabilities"}</span>
              <span style={{color:"#1e40af"}}>{fmtFn(totalLiabilities)}</span>
            </div>
          </div>

          {/* Balance equation */}
          <div style={{background:Math.abs(balanceDiff)<1?"#f0fdf4":"#fef3c7",borderRadius:"0.75rem",padding:"0.75rem 1rem",border:`1px solid ${Math.abs(balanceDiff)<1?"#bbf7d0":"#fcd34d"}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontWeight:700,fontSize:"0.85rem",color:Math.abs(balanceDiff)<1?"#166534":"#92400e"}}>{lang==="np"?"\u0938\u092e\u094d\u092a\u0924\u094d\u0924\u093f = \u092a\u0941\u0901\u091c\u0940 + \u0926\u093e\u092f\u093f\u0924\u094d\u0935":"Assets = Capital + Liabilities"}</span>
            <span style={{fontWeight:800,color:Math.abs(balanceDiff)<1?"#16a34a":"#d97706",fontSize:"0.88rem"}}>{Math.abs(balanceDiff)<1?(lang==="np"?"\u2713 \u0938\u0928\u094d\u0924\u0941\u0932\u093f\u0924":"\u2713 Balanced"):fmtFn(balanceDiff)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
