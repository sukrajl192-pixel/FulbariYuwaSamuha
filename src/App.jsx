import { useState, useEffect, useCallback, createContext, useContext } from "react";

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 1: UTILITIES
// ???????????????????????????????????????????????????????????????????????????????
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const today = () => new Date().toISOString().slice(0, 10);
const fmt = (n = 0) => "?? " + Number(n).toLocaleString("ne-NP", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtEn = (n = 0) => "Rs. " + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ?? BS/AD Calendar ?????????????????????????????????????????????????????????????
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
const BS_MONTHS_NP = ["?????","???","????","??????","?????","??????","???????","?????","???","???","???????","?????"];
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 2: TRANSLATIONS
// ???????????????????????????????????????????????????????????????????????????????
const T = {
  np:{
    appName:"??????? ???? ????",appSub:"??? ??? ?? ??????????",
    dashboard:"??????????",members:"?????",saving:"???",loan:"??",
    cash:"??? ?????",bank:"???? ?????",income:"??-????",report:"?????????",
    profile:"????????",logout:"????? ??????????",
    totalSaving:"??? ???",loanOutstanding:"?? ?????",cashBalance:"??? ???????",
    bankBalance:"???? ???????",monthlyIncome:"?? ????? ??",monthlyExpense:"?? ????? ????",
    totalFund:"?????? ??? ???",totalMembers:"??? ?????",
    add:"?????????",edit:"???????",delete:"??????????",save:"????????",cancel:"????",
    search:"??????????...",date:"????",particulars:"?????",balance:"???????",
    deposit:"?????",withdraw:"??????",cashIn:"??? ???????",cashOut:"??? ????",
    bankDeposit:"?????",bankWithdrawal:"??????",incomeLabel:"??",expenseLabel:"????",
    member:"?????",phone:"???",address:"??????",joinDate:"????? ????",
    loanAmount:"?? ???",principalPaid:"????? ????????",interestPaid:"????? ????????",
    lateFee:"????? ?????",totalPaid:"??? ????????",remaining:"?????",signature:"??????",
    name:"???? ???",role:"??????",username:"??????????? ???",password:"???????",
    login:"?????? ?????????",confirmDelete:"?? ????????? ???????",pdf:"PDF",csv:"CSV",
    category:"??????",addCategory:"???? ?????? ?????????",
    monthlyReport:"????? ?????????",yearlyReport:"??????? ?????????",
    print:"?????? ?????????",recentActivity:"?? ????? ??? ???????",
    changeUsername:"??????????? ??? ????????",changePassword:"??????? ????????",
    currentPassword:"????? ???????",newPassword:"???? ???????",
    bsLabel:"??.??.",adLabel:"?.??.",interestIncome:"????? ???????",
    netBalance:"??? ???????",selectMember:"-- ????? ?????????? --",allMembers:"??? ?????",
    noData:"???? ???????? ????",updateSuccess:"??????????? ????? ???!",wrongPassword:"??? ???????!",
    savingsContribution:"??? ??????",interest:"?????",donationGift:"??? / ?????",
    meetingExpense:"???? ????",emergencyUse:"???????? ?????",otherExpense:"???? ????",
    cashAsset:"???",bankAsset:"???? ???????",groupLoan:"???? ??",externalDebt:"????? ??",
    adakchya:"???????",sachin:"????",kosadhyaksha:"??????????",memberRole:"?????",
    upaAdakchya:"??-???????",sachib:"????",koshadhakshya:"??????????",sadasya:"?????",
    position:"??",loggedInAs:"???? ????:",
    nameNp:"?????? ???",nameEn:"???????? ???",
    syncNote:"?? ????????? ????? ??-???? ??????? ??????? ??????",
    syncHint:"?? ??????? ???????????? ???/???? ???????? ????? ???? ?????",
    syncedEdit:"?? ????????? ??????? ?? ??? ???????? ???????/???????????",
    txType:"??????? ??????",txTypeIncome:"??",txTypeExpense:"????",
    txTypeAsset:"????????",txTypeLiability:"???????",
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
    login:"Login",confirmDelete:"Delete this entry?",pdf:"PDF",csv:"CSV",
    category:"Category",addCategory:"Add New Category",
    monthlyReport:"Monthly Report",yearlyReport:"Yearly Report",
    print:"Print",recentActivity:"?? Recent Activity",
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
    syncHint:"?? marked entries are auto-synced from Cash/Bank books.",
    syncedEdit:"This entry is synced. Edit/delete from the source book.",
    txType:"Transaction Type",txTypeIncome:"Income",txTypeExpense:"Expense",
    txTypeAsset:"Asset",txTypeLiability:"Liability",
  }
};

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 3: STORAGE HOOK
// ???????????????????????????????????????????????????????????????????????????????
function useStore(key, seed) {
  const [data, setData] = useState(() => {
    try { const r=localStorage.getItem(key); return r?JSON.parse(r):seed; } catch { return seed; }
  });
  const save = useCallback((d) => {
    setData(d);
    try { localStorage.setItem(key, JSON.stringify(d)); } catch {}
  }, [key]);
  return [data, save];
}

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 4: SEED DATA
// ???????????????????????????????????????????????????????????????????????????????
const M1=uid(),M2=uid(),M3=uid();
const SEED_USERS=[
  {id:uid(),username:"adakchya",password:"admin123",role:"adakchya",displayName:"??? ??????"},
  {id:uid(),username:"sachin",password:"sachin123",role:"sachin",displayName:"???? ????"},
  {id:uid(),username:"kosa",password:"kosa123",role:"kosadhyaksha",displayName:"??? ??????"},
  {id:uid(),username:"member1",password:"member123",role:"member",displayName:"????? ??"},
];
const SEED_MEMBERS=[
  {id:M1,name:"??? ?????? ???????",nameEn:"Ram Bahadur Shrestha",phone:"??????????",address:"???????",joinDate:"2024-01-15",position:"adakchya"},
  {id:M2,name:"???? ???? ?????",nameEn:"Sita Devi Tamang",phone:"??????????",address:"????????",joinDate:"2024-02-01",position:"sachib"},
  {id:M3,name:"??? ?????? ?????",nameEn:"Hari Prasad Gurung",phone:"??????????",address:"???????",joinDate:"2024-01-20",position:"sadasya"},
];
const SEED_SAVINGS=[
  {id:uid(),memberId:M1,date:"2025-01-10",particulars:"????? ???",deposit:500,withdraw:0,signature:"",modifiedAt:today()},
  {id:uid(),memberId:M2,date:"2025-01-12",particulars:"????? ???",deposit:500,withdraw:0,signature:"",modifiedAt:today()},
  {id:uid(),memberId:M3,date:"2025-01-15",particulars:"????? ???",deposit:500,withdraw:0,signature:"",modifiedAt:today()},
  {id:uid(),memberId:M1,date:"2025-02-10",particulars:"????? ???",deposit:500,withdraw:0,signature:"",modifiedAt:today()},
];
const SEED_LOANS=[
  {id:uid(),memberId:M1,date:"2025-01-20",particulars:"??????? ??",loanAmount:5000,principalPaid:500,interestPaid:100,lateFee:0,signature:"",modifiedAt:today()},
  {id:uid(),memberId:M3,date:"2025-02-05",particulars:"???? ??",loanAmount:3000,principalPaid:300,interestPaid:60,lateFee:0,signature:"",modifiedAt:today()},
];
const TX1=uid(),TX2=uid(),TX3=uid(),TX4=uid(),TX5=uid();
const SEED_CASH=[
  {id:TX1,date:"2025-01-10",particulars:"??? ?????",cashIn:1500,cashOut:0,category:"savingsContribution",txId:TX1,modifiedAt:today()},
  {id:TX2,date:"2025-01-20",particulars:"?? ?????",cashIn:0,cashOut:8000,category:"groupLoan",txId:TX2,modifiedAt:today()},
  {id:TX3,date:"2025-02-05",particulars:"?? ????????",cashIn:960,cashOut:0,category:"interest",txId:TX3,modifiedAt:today()},
];
const SEED_BANK=[
  {id:TX4,date:"2025-01-11",particulars:"??? ?????",deposit:1000,withdrawal:0,category:"savingsContribution",txId:TX4,modifiedAt:today()},
  {id:TX5,date:"2025-02-01",particulars:"?? ??????",deposit:0,withdrawal:5000,category:"groupLoan",txId:TX5,modifiedAt:today()},
];
const SEED_IE=[
  {id:TX1+"_s",date:"2025-01-10",particulars:"??? ????? [Cash]",income:1500,expense:0,category:"savingsContribution",txId:TX1,source:"cash",modifiedAt:today()},
  {id:TX3+"_s",date:"2025-02-05",particulars:"?? ???????? [Cash]",income:960,expense:0,category:"interest",txId:TX3,source:"cash",modifiedAt:today()},
  {id:TX4+"_s",date:"2025-01-11",particulars:"??? ????? [Bank]",income:1000,expense:0,category:"savingsContribution",txId:TX4,source:"bank",modifiedAt:today()},
  {id:uid(),date:"2025-01-30",particulars:"???????? ????",income:0,expense:200,category:"meetingExpense",txId:null,source:"manual",modifiedAt:today()},
];
const SEED_CATEGORIES={
  income:["savingsContribution","interest","donationGift"],
  expense:["meetingExpense","emergencyUse","otherExpense"],
  assets:["cashAsset","bankAsset"],
  liabilities:["groupLoan","externalDebt"],
};

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 5: UI PRIMITIVES
// ???????????????????????????????????????????????????????????????????????????????
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
                  {c.key==="particulars"&&r.txId&&<span style={{marginLeft:4,fontSize:"0.7rem",color:"#7c3aed",background:"#ede9fe",borderRadius:4,padding:"1px 4px"}}>??</span>}
                </td>
              ))}
              {canAct&&(
                <td style={{padding:"0.45rem 0.75rem",whiteSpace:"nowrap"}}>
                  {onEdit&&<button onClick={()=>onEdit(r)} style={{background:"#dbeafe",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",marginRight:4}}><Icon name="edit" size={14} color="#1d4ed8"/></button>}
                  {onDelete&&<button onClick={()=>{if(window.confirm(t?.confirmDelete||"Delete?"))onDelete(r.id);}} style={{background:"#fee2e2",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}><Icon name="del" size={14} color="#dc2626"/></button>}
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

// Robust print/PDF export — uses a hidden iframe so it works even when
// popup-blockers prevent window.open(). Falls back to window.open if needed.
function exportPrint(title,html){
  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;600;700&display=swap');
    *{box-sizing:border-box;}
    body{
      font-family:'Tiro Devanagari Sanskrit','Mangal','Poppins',sans-serif;
      padding:1.5cm 2cm;font-size:13px;color:#111;margin:0;
    }
    .header{text-align:center;margin-bottom:1.5rem;border-bottom:2px solid #1b5e20;padding-bottom:0.75rem;}
    .header h1{margin:0;font-size:1.4rem;color:#1b5e20;font-family:'Poppins','Tiro Devanagari Sanskrit',sans-serif;}
    .header h2{margin:0.25rem 0 0;font-size:0.95rem;color:#555;font-weight:400;}
    table{width:100%;border-collapse:collapse;margin-top:1rem;page-break-inside:auto;}
    thead tr{background:#1b5e20;color:#fff;}
    th{padding:7px 10px;text-align:left;font-weight:600;font-size:0.82rem;}
    td{padding:6px 10px;border-bottom:1px solid #e5e7eb;font-size:0.82rem;}
    tr:nth-child(even) td{background:#f0fdf4;}
    .total-row td{font-weight:700;background:#dcfce7!important;color:#166534;}
    .footer{text-align:center;margin-top:2rem;color:#888;font-size:0.75rem;border-top:1px solid #e5e7eb;padding-top:0.75rem;}
    .sig-area{margin-top:2rem;display:grid;grid-template-columns:1fr 1fr;gap:2rem;}
    .sig-line{border-top:1.5px solid #374151;padding-top:0.3rem;font-size:0.8rem;color:#555;text-align:center;}
    @media print{
      body{padding:1cm 1.5cm;}
      button,.no-print{display:none!important;}
      table{page-break-inside:auto;}
      tr{page-break-inside:avoid;}
    }
  `;
  const fullHTML=`<!DOCTYPE html>
<html lang="ne"><head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>${title}</title>
  <style>${css}</style>
</head><body>
  <div class="header">
    <h1>?? ??????? ???? ????</h1>
    <h2>${title}</h2>
  </div>
  ${html}
  <div class="footer">
    ??????? ???? ???? &nbsp;•&nbsp; ?????? ????: ${new Date().toLocaleDateString("ne-NP")} &nbsp;•&nbsp; ${new Date().toLocaleDateString("en-GB")}
  </div>
</body></html>`;

  // Try iframe-based print (works without popup permission)
  try {
    // Remove any stale iframe
    const old=document.getElementById("__fys_print_frame");
    if(old) old.remove();
    const iframe=document.createElement("iframe");
    iframe.id="__fys_print_frame";
    iframe.style.cssText="position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;opacity:0;";
    document.body.appendChild(iframe);
    const doc=iframe.contentDocument||iframe.contentWindow?.document;
    if(!doc) throw new Error("no iframe doc");
    doc.open();doc.write(fullHTML);doc.close();
    // Wait for fonts to load then print
    iframe.contentWindow.focus();
    setTimeout(()=>{
      try{ iframe.contentWindow.print(); }
      catch(e){ window.print(); }
      // Cleanup after user closes print dialog
      setTimeout(()=>{ try{iframe.remove();}catch{} },30000);
    },800);
  } catch {
    // Fallback: window.open
    const w=window.open("","_blank","width=900,height=700");
    if(w){ w.document.write(fullHTML); w.document.close(); w.focus(); setTimeout(()=>w.print(),800); }
    else { alert("????? popup ?????? ???????? ? ???? ?????? ??????????\nPlease allow popups and try again."); }
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 6: LOGIN SCREEN
// ???????????????????????????????????????????????????????????????????????????????
function LoginScreen({users,onLogin}){
  const [uname,setUname]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const submit=()=>{
    const u=users.find(u=>u.username===uname&&u.password===pass);
    if(u)onLogin(u);else setErr("??? ??????????? ??? ?? ???????!");
  };
  return(
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#1b5e20,#4caf50)",display:"flex",alignItems:"center",justifyContent:"center",padding:"1rem",fontFamily:"'Tiro Devanagari Sanskrit','Mangal',sans-serif"}}>
      <div style={{background:"#fff",borderRadius:"1.25rem",padding:"2rem",width:"100%",maxWidth:360,boxShadow:"0 20px 60px rgba(0,0,0,0.3)"}}>
        <div style={{textAlign:"center",marginBottom:"1.5rem"}}>
          <div style={{fontSize:"3rem",marginBottom:"0.5rem"}}>??</div>
          <h1 style={{margin:0,color:"#1b5e20",fontSize:"1.3rem"}}>??????? ???? ????</h1>
          <p style={{margin:"0.25rem 0 0",color:"#6b7280",fontSize:"0.85rem"}}>????????? ?????? ?????????</p>
        </div>
        {err&&<div style={{background:"#fee2e2",color:"#dc2626",padding:"0.6rem 0.75rem",borderRadius:"0.5rem",marginBottom:"1rem",fontSize:"0.85rem"}}>{err}</div>}
        <Field label="??????????? ???" value={uname} onChange={setUname}/>
        <Field label="???????" type="password" value={pass} onChange={setPass}/>
        <button onKeyDown={e=>e.key==="Enter"&&submit()} onClick={submit} style={{width:"100%",padding:"0.75rem",background:"#1b5e20",color:"#fff",border:"none",borderRadius:"0.625rem",fontSize:"1rem",cursor:"pointer",fontFamily:"inherit",fontWeight:700,marginTop:"0.5rem"}}>
          ?????? ?????????
        </button>
        <div style={{marginTop:"1rem",padding:"0.75rem",background:"#f0fdf4",borderRadius:"0.5rem",fontSize:"0.75rem",color:"#374151"}}>
          <strong>Demo Logins:</strong><br/>
          adakchya / admin123 &nbsp; (???????)<br/>
          sachin / sachin123 &nbsp; (????)<br/>
          kosa / kosa123 &nbsp; (??????????)<br/>
          member1 / member123 &nbsp; (?????)
        </div>
      </div>
    </div>
  );
}

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 7: PROFILE MODAL
// ???????????????????????????????????????????????????????????????????????????????
function ProfileModal({user,users,setUsers,onClose,t}){
  const [newUname,setNewUname]=useState(user.username);
  const [curPass,setCurPass]=useState("");
  const [newPass,setNewPass]=useState("");
  const [msg,setMsg]=useState("");
  const saveU=()=>{
    if(users.find(u=>u.username===newUname&&u.id!==user.id)){setMsg("?? ??? ????? ?? ?!");return;}
    setUsers(users.map(u=>u.id===user.id?{...u,username:newUname}:u));setMsg(t.updateSuccess);
  };
  const saveP=()=>{
    if(curPass!==user.password){setMsg(t.wrongPassword);return;}
    setUsers(users.map(u=>u.id===user.id?{...u,password:newPass}:u));
    setMsg(t.updateSuccess);setCurPass("");setNewPass("");
  };
  const roleDisplay=t[user.role]||user.role;
  return(
    <Modal title={`?? ${t.profile}`} onClose={onClose}>
      {/* Logged-in-as banner */}
      <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",borderRadius:"0.75rem",padding:"0.85rem 1rem",marginBottom:"1rem",color:"#fff",textAlign:"center"}}>
        <div style={{fontSize:"0.7rem",opacity:0.8,marginBottom:2}}>
          {t.loggedInAs||"???? ????:"}
        </div>
        <div style={{fontSize:"1.05rem",fontWeight:700,letterSpacing:"0.01em",fontFamily:smartFont(user.displayName)}}>
          {user.displayName}
        </div>
        <div style={{marginTop:4,display:"inline-block",background:"rgba(255,255,255,0.2)",borderRadius:"1rem",padding:"2px 12px",fontSize:"0.78rem",fontWeight:600}}>
          {roleDisplay}
        </div>
        <div style={{marginTop:4,fontSize:"0.72rem",opacity:0.75}}>@{user.username}</div>
      </div>
      <h4 style={{color:"#1b5e20",margin:"0 0 0.75rem",fontSize:"0.9rem"}}>{t.changeUsername}</h4>
      <Field label={t.username} value={newUname} onChange={setNewUname}/>
      <Btn onClick={saveU} icon="user">{t.save}</Btn>
      <hr style={{border:"none",borderTop:"1px solid #e5e7eb",margin:"1rem 0"}}/>
      <h4 style={{color:"#1b5e20",margin:"0 0 0.75rem",fontSize:"0.9rem"}}>{t.changePassword}</h4>
      <Field label={t.currentPassword} type="password" value={curPass} onChange={setCurPass}/>
      <Field label={t.newPassword} type="password" value={newPass} onChange={setNewPass}/>
      <Btn onClick={saveP} icon="lock">{t.save}</Btn>
      {msg&&<div style={{marginTop:"1rem",padding:"0.6rem",background:"#dcfce7",color:"#166534",borderRadius:"0.5rem",fontSize:"0.85rem"}}>{msg}</div>}
    </Modal>
  );
}

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 8: CATEGORY MANAGER
// ???????????????????????????????????????????????????????????????????????????????
function CategoryManager({categories,setCategories,onClose,t,cash,bank,ie,savings,loans}){
  const [nc,setNc]=useState({type:"income",key:"",label:""});
  const [err,setErr]=useState("");
  const groups=["income","expense","assets","liabilities"];

  const addCat=()=>{
    if(!nc.key||!nc.label){setErr("??? ??????? ??????????");return;}
    if((categories[nc.type]||[]).includes(nc.key)){setErr("?? ?????? ????? ?? ?!");return;}
    // Use functional setter so we always work on latest state
    setCategories(prev=>({...prev,[nc.type]:[...(prev[nc.type]||[]),nc.key]}));
    try{localStorage.setItem("fys_catlbl_"+nc.key,nc.label);}catch{}
    setNc({type:"income",key:"",label:""});setErr("");
  };

  const delCat=(type,key)=>{
    // Check if category is used in any records
    const allRecords=[...(cash||[]),...(bank||[]),...(ie||[]),...(savings||[]),...(loans||[])];
    const usedCount=allRecords.filter(r=>r.category===key).length;
    // Detect language from translation object (EN appSub contains "Loan Management")
    const isEn=(t.appSub||"").includes("Loan Management");
    const confirmMsg=usedCount>0
      ? (isEn
          ? `This category is used in ${usedCount} record(s). Delete anyway?`
          : `?? ?????? ${usedCount} ???????? ?????? ???? ?? ??? ??? ???????`)
      : (t.confirmDelete||"Delete this entry?");
    if(!window.confirm(confirmMsg))return;
    // Use functional setter to avoid stale closure bug
    setCategories(prev=>({
      ...prev,
      [type]:(prev[type]||[]).filter(c=>c!==key)
    }));
  };

  const getLabel=k=>{
    try{return localStorage.getItem("fys_catlbl_"+k)||catLabel(k,t);}
    catch{return catLabel(k,t);}
  };

  const groupLabels={income:"?? / Income",expense:"???? / Expense",assets:"???????? / Assets",liabilities:"??????? / Liabilities"};

  return(
    <Modal title={`??? ${t.category}`} onClose={onClose} wide>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 9: MAIN APP
// ???????????????????????????????????????????????????????????????????????????????
export default function App(){
  const [lang,setLangState]=useState(()=>{ try{return localStorage.getItem("fys_lang")||"np";}catch{return "np";} });
  const t=T[lang];
  const fmtFn=lang==="en"?fmtEn:fmt;
  const setLang=l=>{ setLangState(l); try{localStorage.setItem("fys_lang",l);}catch{} };

  const [users,setUsers]=useStore("fys_users",SEED_USERS);
  const [currentUser,setCurrentUser]=useState(()=>{ try{const s=localStorage.getItem("fys_session");return s?JSON.parse(s):null;}catch{return null;} });
  const [tab,setTab]=useState("dashboard");
  const [showProfile,setShowProfile]=useState(false);
  const [showCatMgr,setShowCatMgr]=useState(false);
  const [useBS,setUseBS]=useState(true);

  const [members,setMembers]=useStore("fys_members",SEED_MEMBERS);
  const [savings,setSavings]=useStore("fys_savings",SEED_SAVINGS);
  const [loans,setLoans]=useStore("fys_loans",SEED_LOANS);
  const [cash,setCash]=useStore("fys_cash",SEED_CASH);
  const [bank,setBank]=useStore("fys_bank",SEED_BANK);
  const [ie,setIE]=useStore("fys_ie",SEED_IE);
  const [categories,setCategories]=useStore("fys_categories",SEED_CATEGORIES);
  const [search,setSearch]=useState("");

  const isAdmin=currentUser&&currentUser.role!=="member";

  const login=u=>{ setCurrentUser(u); try{localStorage.setItem("fys_session",JSON.stringify(u));}catch{} };
  const logout=()=>{ setCurrentUser(null); try{localStorage.removeItem("fys_session");}catch{} };

  // Sync session when users update (pw/username change)
  useEffect(()=>{
    if(currentUser){ const u=users.find(x=>x.id===currentUser.id); if(u&&(u.username!==currentUser.username||u.password!==currentUser.password)){ setCurrentUser(u); try{localStorage.setItem("fys_session",JSON.stringify(u));}catch{} } }
  },[users]);

  // ?? Sync helpers ???????????????????????????????????????????????????????????
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

  // ?? Computed totals ????????????????????????????????????????????????????????
  const totalSaving=savings.reduce((a,s)=>a+(s.deposit||0)-(s.withdraw||0),0);
  const totalLoanOut=loans.reduce((a,l)=>a+(l.loanAmount||0)-(l.principalPaid||0),0);
  const cashBal=cash.reduce((a,c)=>a+(c.cashIn||0)-(c.cashOut||0),0);
  const bankBal=bank.reduce((a,b)=>a+(b.deposit||0)-(b.withdrawal||0),0);
  const nowM=new Date().getMonth(),nowY=new Date().getFullYear();
  const monthlyIncome=ie.filter(x=>{const d=new Date(x.date);return d.getMonth()===nowM&&d.getFullYear()===nowY;}).reduce((a,x)=>a+(x.income||0),0);
  const monthlyExpense=ie.filter(x=>{const d=new Date(x.date);return d.getMonth()===nowM&&d.getFullYear()===nowY;}).reduce((a,x)=>a+(x.expense||0),0);
  const totalFund=totalSaving+bankBal+cashBal;

  const getMember=id=>members.find(m=>m.id===id);
  const memberOptions=[{value:"",label:t.selectMember},...members.map(m=>({value:m.id,label:getMemberDisplayName(m,lang)}))];
  const sp={lang,t,useBS,fmtFn,isAdmin,categories};

  if(!currentUser) return <LoginScreen users={users} onLogin={login}/>;

  // Shared styles for the compact header icon buttons
  const headerIconBtnStyle={
    background:"rgba(255,255,255,0.14)",
    border:"1px solid rgba(255,255,255,0.22)",
    borderRadius:"0.45rem",
    width:32,height:32,
    display:"flex",alignItems:"center",justifyContent:"center",
    cursor:"pointer",flexShrink:0,padding:0,
  };
  const headerBtnStyle={
    ...headerIconBtnStyle,
    width:"auto",
    padding:"0 8px",
    gap:4,
    height:30,
  };

  const nav=[
    {id:"dashboard",label:t.dashboard,icon:"dashboard"},
    {id:"members",label:t.members,icon:"members"},
    {id:"saving",label:t.saving,icon:"saving"},
    {id:"loan",label:t.loan,icon:"loan"},
    {id:"cash",label:t.cash,icon:"cash"},
    {id:"bank",label:t.bank,icon:"bank"},
    {id:"ie",label:t.income,icon:"income"},
    {id:"report",label:t.report,icon:"report"},
  ];

  return(
    <div style={{minHeight:"100vh",background:"#f0fdf4",fontFamily:"'Poppins','Tiro Devanagari Sanskrit','Mangal',sans-serif"}}>
      <link href="https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit&family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      {/* ??????????????????????????????????????????????????????
          HEADER — mobile-app style
          Layout: [?? logo] [title — flex center] [icon buttons]
          ?????????????????????????????????????????????????????? */}
      <header style={{
        background:"linear-gradient(135deg,#1b5e20,#2e7d32)",
        color:"#fff",
        /* fixed height so it never grows and wraps */
        height:52,
        padding:"0 0.75rem",
        display:"flex",
        alignItems:"center",
        gap:"0.5rem",
        position:"sticky",
        top:0,
        zIndex:200,
        boxShadow:"0 2px 10px rgba(0,0,0,0.28)",
        overflow:"hidden",          /* absolutely prevent any overflow */
      }}>

        {/* ?? Logo ?? */}
        <div style={{
          width:32,height:32,borderRadius:"50%",
          background:"#fff",flexShrink:0,
          display:"flex",alignItems:"center",justifyContent:"center",
        }}>
          <span style={{fontSize:"1.1rem",lineHeight:1}}>??</span>
        </div>

        {/* ?? App title — takes all remaining space, centered ?? */}
        <div style={{flex:"1 1 0",minWidth:0,textAlign:"center"}}>
          <div style={{
            fontFamily:"'Poppins','Tiro Devanagari Sanskrit',sans-serif",
            fontWeight:700,
            /* clamp: 0.78rem on tiny phones, up to 1rem on larger screens */
            fontSize:"clamp(0.78rem,3.5vw,1rem)",
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
            fontSize:"clamp(0.55rem,2vw,0.65rem)",
            opacity:0.78,
            whiteSpace:"nowrap",
            overflow:"hidden",
            textOverflow:"ellipsis",
            lineHeight:1.2,
          }}>
            {t.appSub}
          </div>
        </div>

        {/* ?? Right: compact icon-button row (NO user name shown) ?? */}
        <div style={{
          display:"flex",
          alignItems:"center",
          gap:"0.3rem",
          flexShrink:0,
        }}>

          {/* Language toggle — icon + short label */}
          <button
            type="button"
            onClick={()=>setLang(lang==="np"?"en":"np")}
            title={lang==="np"?"Switch to English":"???????? ??????"}
            style={headerBtnStyle}
          >
            <Icon name="globe" size={14} color="#fff"/>
            <span style={{fontFamily:"'Poppins',sans-serif",fontSize:"0.65rem",fontWeight:700,lineHeight:1}}>
              {lang==="np"?"EN":"NP"}
            </span>
          </button>

          {/* BS/AD calendar toggle — icon only with tooltip */}
          <button
            type="button"
            onClick={()=>setUseBS(b=>!b)}
            title={useBS?(lang==="np"?"?.??. ?????????":"Show AD"):(lang==="np"?"??.??. ?????????":"Show BS")}
            style={headerBtnStyle}
          >
            <Icon name="calendar" size={14} color="#fff"/>
            <span style={{fontFamily:"'Poppins',sans-serif",fontSize:"0.6rem",lineHeight:1}}>
              {useBS?t.bsLabel:t.adLabel}
            </span>
          </button>

          {/* Category manager — icon only, admin only */}
          {isAdmin&&(
            <button
              type="button"
              onClick={()=>setShowCatMgr(true)}
              title={t.category||"Categories"}
              style={headerIconBtnStyle}
            >
              <Icon name="tag" size={15} color="#fff"/>
            </button>
          )}

          {/* Profile — icon only (auth still fully works; name just not shown) */}
          <button
            type="button"
            onClick={()=>setShowProfile(true)}
            title={currentUser.displayName}
            style={headerIconBtnStyle}
          >
            <Icon name="user" size={15} color="#fff"/>
          </button>

          {/* Logout — distinct red icon button */}
          <button
            type="button"
            onClick={logout}
            title={t.logout}
            style={{
              ...headerIconBtnStyle,
              background:"rgba(185,28,28,0.8)",
              border:"1px solid rgba(255,255,255,0.15)",
            }}
          >
            <Icon name="close" size={14} color="#fff"/>
          </button>

        </div>
      </header>

      {/* ?? Nav ?? */}
      <nav style={{background:"#fff",borderBottom:"2px solid #bbf7d0",overflowX:"auto",display:"flex",whiteSpace:"nowrap",boxShadow:"0 2px 4px rgba(0,0,0,0.05)"}}>
        {nav.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{display:"inline-flex",flexDirection:"column",alignItems:"center",gap:2,padding:"0.55rem 0.85rem",border:"none",background:"none",cursor:"pointer",color:tab===n.id?"#1b5e20":"#6b7280",fontWeight:tab===n.id?700:500,fontSize:"0.67rem",borderBottom:tab===n.id?"3px solid #16a34a":"3px solid transparent",fontFamily:"inherit",transition:"all 0.15s"}}>
            <Icon name={n.icon} size={17} color={tab===n.id?"#1b5e20":"#9ca3af"}/>
            {n.label}
          </button>
        ))}
      </nav>

      {/* ?? Content ?? */}
      <main style={{padding:"1rem",maxWidth:960,margin:"0 auto"}}>
        {tab==="dashboard"&&<Dashboard {...{totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,lang,t,useBS,fmtFn,getMember}}/>}
        {tab==="members"&&<Members {...{members,setMembers,search,setSearch,...sp}}/>}
        {tab==="saving"&&<SavingLedger {...{savings,setSavings,members,memberOptions,getMember,...sp}}/>}
        {tab==="loan"&&<LoanLedger {...{loans,setLoans,members,memberOptions,getMember,...sp}}/>}
        {tab==="cash"&&<CashBook {...{cash,addCash,updCash,delCash,...sp}}/>}
        {tab==="bank"&&<BankBook {...{bank,addBank,updBank,delBank,...sp}}/>}
        {tab==="ie"&&<IncomeExpense {...{ie,setIE,...sp}}/>}
        {tab==="report"&&<Reports {...{totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,loans,cash,bank,ie,...sp}}/>}
      </main>

      {showProfile&&<ProfileModal user={currentUser} users={users} setUsers={setUsers} onClose={()=>setShowProfile(false)} t={t}/>}
      {showCatMgr&&isAdmin&&<CategoryManager categories={categories} setCategories={setCategories} onClose={()=>setShowCatMgr(false)} t={t} cash={cash} bank={bank} ie={ie} savings={savings} loans={loans}/>}
    </div>
  );
}

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 10: DASHBOARD — ORIGINAL DESIGN PRESERVED EXACTLY
// ???????????????????????????????????????????????????????????????????????????????
function Dashboard({totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,lang,t,useBS,fmtFn,getMember}){
  return(
    <div>
      <h2 style={{color:"#1b5e20",margin:"0 0 1rem",fontSize:"1.1rem"}}>?? {t.dashboard}</h2>
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
        <div style={{fontSize:"0.75rem",opacity:0.7,marginTop:4}}>{t.totalMembers}: {members.length} {lang==="np"?"???":"members"}</div>
      </div>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 11: MEMBERS
// ???????????????????????????????????????????????????????????????????????????????

// All official positions available for assignment
const POSITION_KEYS=["adakchya","upaAdakchya","sachib","koshadhakshya","sadasya"];

function positionLabel(posKey,t){
  const map={
    adakchya:     {np:"???????",     en:"Adakshya (President)"},
    upaAdakchya:  {np:"??-???????",  en:"Upa-Adakshya (Vice-Pres.)"},
    sachib:       {np:"????",         en:"Sachib (Secretary)"},
    koshadhakshya:{np:"??????????",  en:"Koshadhakshya (Treasurer)"},
    sadasya:      {np:"?????",        en:"Sadasya (Member)"},
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
    if(!primaryName){alert((t.nameNp||"?????? ???")+" ?? "+(t.nameEn||"English Name")+" ??????");return;}
    // Ensure at least `name` field is always populated (legacy compatibility)
    const entry={...form,name:form.name.trim()||form.nameEn.trim()};
    if(modal==="add")setMembers([...members,{...entry,id:uid()}]);
    else setMembers(members.map(m=>m.id===form.id?entry:m));
    setModal(null);
  };
  const del=id=>{if(window.confirm(t.confirmDelete))setMembers(members.filter(m=>m.id!==id));};

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

  // Print HTML with proper CSS class
  const printMembersHTML=`
    <table>
      <thead><tr>
        <th>${t.nameNp||"?????? ???"}</th>
        <th>${t.nameEn||"English Name"}</th>
        <th>${t.position||"??"}</th>
        <th>${t.phone}</th>
        <th>${t.address}</th>
        <th>${t.joinDate}</th>
      </tr></thead>
      <tbody>
        ${rows.map(m=>`<tr>
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
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.members}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.members,printMembersHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV("members",[
            {key:"name",label:t.nameNp||"?????? ???"},
            {key:"nameEn",label:t.nameEn||"English Name"},
            {key:"positionDisp",label:t.position||"??"},
            {key:"phone",label:t.phone},
            {key:"address",label:t.address},
            {key:"joinDateDisp",label:t.joinDate},
          ],rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>open("add")} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={t.search} style={{width:"100%",padding:"0.55rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontSize:"0.9rem",fontFamily:"inherit",boxSizing:"border-box",marginBottom:"0.75rem",outline:"none"}}/>

      {/* Member cards — bilingual name display */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:"0.75rem"}}>
        {rows.length===0&&(
          <div style={{gridColumn:"1/-1",textAlign:"center",color:"#9ca3af",padding:"2rem",fontStyle:"italic"}}>{t.noData}</div>
        )}
        {rows.map((m,i)=>(
          <div key={m.id||i} style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.07)",overflow:"hidden",borderTop:`3px solid ${positionBadgeColor(m.position)}`}}>
            <div style={{padding:"0.85rem 1rem 0.65rem"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:"0.5rem"}}>
                <div style={{minWidth:0,flex:1}}>
                  {/* Primary name — language aware */}
                  <div style={{fontWeight:700,fontSize:"0.95rem",color:"#111827",fontFamily:smartFont(m.displayName),lineHeight:1.3}}>
                    {m.displayName}
                  </div>
                  {/* Secondary name — always show the other language if present */}
                  {lang==="en" && m.name && (
                    <div style={{fontSize:"0.75rem",color:"#6b7280",fontFamily:smartFont(m.name),marginTop:1}}>
                      {m.name}
                    </div>
                  )}
                  {lang==="np" && m.nameEn && (
                    <div style={{fontSize:"0.75rem",color:"#6b7280",fontFamily:"'Poppins',sans-serif",marginTop:1}}>
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
                {m.phone&&<span>?? {m.phone}</span>}
                {m.address&&<span>?? {m.address}</span>}
                <span>?? {m.joinDateDisp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} ${t.member}`:`${t.edit} ${t.member}`} onClose={()=>setModal(null)}>
          {/* Bilingual name fields */}
          <Field label={t.nameNp||"?????? ???"} value={form.name||""} onChange={f("name")} inputFont="'Tiro Devanagari Sanskrit','Mangal',sans-serif" placeholder="?????? ???"/>
          <Field label={t.nameEn||"English Name"} value={form.nameEn||""} onChange={f("nameEn")} inputFont="'Poppins',sans-serif" placeholder="English Name"/>
          <Field label={t.position||"?? / Position"} type="select" value={form.position||"sadasya"} onChange={f("position")} options={posOpts}/>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 12: SAVING LEDGER
// ???????????????????????????????????????????????????????????????????????????????
function SavingLedger({savings,setSavings,members,memberOptions,getMember,lang,t,useBS,fmtFn,isAdmin}){
  const [modal,setModal]=useState(null);
  const [filterMember,setFilterMember]=useState("");
  const blank={memberId:"",date:today(),particulars:"????? ???",deposit:0,withdraw:0,signature:""};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const withBal=rows=>{let b=0;return rows.map(r=>{b+=(r.deposit||0)-(r.withdraw||0);return{...r,balance:b};});};
  const filtered=(filterMember?savings.filter(s=>s.memberId===filterMember):savings).sort((a,b)=>a.date.localeCompare(b.date));
  const rows=withBal(filtered).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS),memberName:getMemberDisplayName(getMember(r.memberId),lang)}));
  const save=()=>{
    if(!form.memberId){alert(t.selectMember);return;}
    const en={...form,deposit:+form.deposit,withdraw:+form.withdraw,modifiedAt:new Date().toISOString()};
    if(modal==="add")setSavings([...savings,{...en,id:uid()}]);
    else setSavings(savings.map(s=>s.id===form.id?en:s));
    setModal(null);
  };
  const del=id=>{if(window.confirm(t.confirmDelete))setSavings(savings.filter(s=>s.id!==id));};
  const cols=[{key:"dateDisp",label:t.date},{key:"memberName",label:t.member},{key:"particulars",label:t.particulars,wrap:true},{key:"deposit",label:t.deposit,fmt:true,num:true,green:true},{key:"withdraw",label:t.withdraw,fmt:true,num:true,red:true},{key:"balance",label:t.balance,fmt:true,num:true},{key:"signature",label:t.signature}];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.saving}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.saving,printHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.saving,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <select value={filterMember} onChange={e=>setFilterMember(e.target.value)} style={{padding:"0.5rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.85rem",width:"100%",maxWidth:260,marginBottom:"0.75rem"}}>
        <option value="">{t.allMembers}</option>
        {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={r=>{setForm(r);setModal("edit");}} onDelete={del} isAdmin={isAdmin}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.saving}`:`${t.edit} — ${t.saving}`} onClose={()=>setModal(null)}>
          <Field label={t.member} type="select" value={form.memberId} onChange={f("memberId")} options={memberOptions} required/>
          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.deposit} (??)`} type="number" value={form.deposit} onChange={f("deposit")}/>
            <Field label={`${t.withdraw} (??)`} type="number" value={form.withdraw} onChange={f("withdraw")}/>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 13: LOAN LEDGER
// ???????????????????????????????????????????????????????????????????????????????
function LoanLedger({loans,setLoans,members,memberOptions,getMember,lang,t,useBS,fmtFn,isAdmin}){
  const [modal,setModal]=useState(null);
  const [filterMember,setFilterMember]=useState("");
  const blank={memberId:"",date:today(),particulars:"??????? ??",loanAmount:0,principalPaid:0,interestPaid:0,lateFee:0,signature:""};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const withCalc=rows=>rows.map(r=>({...r,totalPaid:(r.principalPaid||0)+(r.interestPaid||0)+(r.lateFee||0),remaining:(r.loanAmount||0)-(r.principalPaid||0),memberName:getMemberDisplayName(getMember(r.memberId),lang),dateDisp:displayDate(r.date,lang,useBS)}));
  const filtered=(filterMember?loans.filter(l=>l.memberId===filterMember):loans).sort((a,b)=>a.date.localeCompare(b.date));
  const rows=withCalc(filtered);
  const save=()=>{
    if(!form.memberId){alert(t.selectMember);return;}
    const nums={loanAmount:+form.loanAmount,principalPaid:+form.principalPaid,interestPaid:+form.interestPaid,lateFee:+form.lateFee};
    const en={...form,...nums,modifiedAt:new Date().toISOString()};
    if(modal==="add")setLoans([...loans,{...en,id:uid()}]);
    else setLoans(loans.map(l=>l.id===form.id?en:l));
    setModal(null);
  };
  const del=id=>{if(window.confirm(t.confirmDelete))setLoans(loans.filter(l=>l.id!==id));};
  const cols=[{key:"dateDisp",label:t.date},{key:"memberName",label:t.member},{key:"particulars",label:t.particulars},{key:"loanAmount",label:t.loanAmount,fmt:true,num:true},{key:"principalPaid",label:t.principalPaid,fmt:true,num:true},{key:"interestPaid",label:t.interestPaid,fmt:true,num:true},{key:"lateFee",label:t.lateFee,fmt:true,num:true},{key:"totalPaid",label:t.totalPaid,fmt:true,num:true,green:true},{key:"remaining",label:t.remaining,fmt:true,num:true,red:true},{key:"signature",label:t.signature}];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.loan}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.loan,printHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.loan,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <select value={filterMember} onChange={e=>setFilterMember(e.target.value)} style={{padding:"0.5rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.85rem",width:"100%",maxWidth:260,marginBottom:"0.75rem"}}>
        <option value="">{t.allMembers}</option>
        {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
      </select>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={r=>{setForm(r);setModal("edit");}} onDelete={del} isAdmin={isAdmin}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.loan}`:`${t.edit} — ${t.loan}`} onClose={()=>setModal(null)}>
          <Field label={t.member} type="select" value={form.memberId} onChange={f("memberId")} options={memberOptions} required/>
          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.loanAmount} (??)`} type="number" value={form.loanAmount} onChange={f("loanAmount")}/>
            <Field label={`${t.principalPaid} (??)`} type="number" value={form.principalPaid} onChange={f("principalPaid")}/>
            <Field label={`${t.interestPaid} (??)`} type="number" value={form.interestPaid} onChange={f("interestPaid")}/>
            <Field label={`${t.lateFee} (??)`} type="number" value={form.lateFee} onChange={f("lateFee")}/>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 14: CASH BOOK (auto-sync) — with dynamic category filtering by txType
// ???????????????????????????????????????????????????????????????????????????????

// Helper: given txType, return the matching category group key
function txTypeToCatGroup(txType){
  return {income:"income",expense:"expense",asset:"assets",liability:"liabilities"}[txType]||"income";
}

// Helper: given txType, determine which amount fields are "in" vs "out"
// income/asset ? cashIn/deposit; expense/liability ? cashOut/withdrawal
function txTypeIsIn(txType){ return txType==="income"||txType==="asset"; }

function CashBook({cash,addCash,updCash,delCash,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",cashIn:0,cashOut:0,category:"savingsContribution",txType:"income"};
  const [form,setForm]=useState(blank);
  const [formErr,setFormErr]=useState("");
  const f=k=>v=>{setFormErr("");setForm(p=>({...p,[k]:v}));};

  // When txType changes: reset category to first of new group
  // For income ? clear cashOut; for expense ? clear cashIn
  // For asset/liability ? keep BOTH editable (do NOT zero either side)
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

  const getLabel=k=>{try{return localStorage.getItem("fys_catlbl_"+k)||catLabel(k,t);}catch{return catLabel(k,t);}};

  // Filtered category options based on current txType
  const filteredCatOpts=(()=>{
    const group=txTypeToCatGroup(form.txType);
    const keys=categories[group]||[];
    return keys.length
      ? keys.map(k=>({value:k,label:getLabel(k)}))
      : [{value:"",label:lang==="np"?"?????? ?????? ???":"No categories available"}];
  })();

  const txTypeOpts=[
    {value:"income",   label: t.txTypeIncome||"??"},
    {value:"expense",  label: t.txTypeExpense||"????"},
    {value:"asset",    label: t.txTypeAsset||"????????"},
    {value:"liability",label: t.txTypeLiability||"???????"},
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
      setFormErr(lang==="np"?"??????? ??? ?????? ????":"Negative amounts are not allowed.");
      return;
    }
    if(inAmt===0&&outAmt===0){
      setFormErr(lang==="np"?"??????? ?? ??? (????? ?? ??????) ?????? ??":"At least one amount (IN or OUT) is required.");
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
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.cash}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.cash,printHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.cash,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setFormErr("");setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginBottom:"0.75rem"}}>?? {t.syncNote}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={openEdit} onDelete={delCash} isAdmin={isAdmin}/>
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.cash}`:`${t.edit} — ${t.cash}`} onClose={()=>setModal(null)}>

          {/* Transaction type selector */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:6,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.txType||"??????? ??????"} <span style={{color:"#dc2626"}}>*</span>
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
                  ?"????? (IN) ? ?????? (OUT) ???? ???? ???????"
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
              - income ? only cashIn editable
              - expense ? only cashOut editable
              - asset/liability ? BOTH editable (dual amount) */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field
              label={lang==="np"?`????? / IN (??)`:`Deposit / IN (Rs.)`}
              type="number"
              value={form.cashIn}
              onChange={f("cashIn")}
              readOnly={form.txType==="expense"}
            />
            <Field
              label={lang==="np"?`?????? / OUT (??)`:`Withdrawal / OUT (Rs.)`}
              type="number"
              value={form.cashOut}
              onChange={f("cashOut")}
              readOnly={form.txType==="income"}
            />
          </div>

          {/* Validation error */}
          {formErr&&(
            <div style={{background:"#fee2e2",color:"#dc2626",borderRadius:"0.4rem",padding:"6px 10px",fontSize:"0.8rem",marginBottom:"0.5rem"}}>
              ? {formErr}
            </div>
          )}

          {/* Only show sync note for income/expense — assets/liabilities do NOT sync to IE */}
          {syncsToIE&&(
            <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginTop:"0.25rem"}}>?? {t.syncNote}</div>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 15: BANK BOOK (auto-sync) — with dynamic category filtering by txType
// ???????????????????????????????????????????????????????????????????????????????
function BankBook({bank,addBank,updBank,delBank,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",deposit:0,withdrawal:0,category:"savingsContribution",txType:"income"};
  const [form,setForm]=useState(blank);
  const [formErr,setFormErr]=useState("");
  const f=k=>v=>{setFormErr("");setForm(p=>({...p,[k]:v}));};

  // When txType changes: reset category to first of the new group
  // income ? clear withdrawal; expense ? clear deposit
  // asset/liability ? keep BOTH editable
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

  const getLabel=k=>{try{return localStorage.getItem("fys_catlbl_"+k)||catLabel(k,t);}catch{return catLabel(k,t);}};

  // Filtered category options based on current txType
  const filteredCatOpts=(()=>{
    const group=txTypeToCatGroup(form.txType);
    const keys=categories[group]||[];
    return keys.length
      ? keys.map(k=>({value:k,label:getLabel(k)}))
      : [{value:"",label:lang==="np"?"?????? ?????? ???":"No categories available"}];
  })();

  const txTypeOpts=[
    {value:"income",   label:t.txTypeIncome||"??"},
    {value:"expense",  label:t.txTypeExpense||"????"},
    {value:"asset",    label:t.txTypeAsset||"????????"},
    {value:"liability",label:t.txTypeLiability||"???????"},
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
      setFormErr(lang==="np"?"??????? ??? ?????? ????":"Negative amounts are not allowed.");
      return;
    }
    if(inAmt===0&&outAmt===0){
      setFormErr(lang==="np"?"??????? ?? ??? (????? ?? ??????) ?????? ??":"At least one amount (IN or OUT) is required.");
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
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>??? {t.bank}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.bank,printHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.bank,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setFormErr("");setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginBottom:"0.75rem"}}>?? {t.syncNote}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={openEdit} onDelete={delBank} isAdmin={isAdmin}/>
      </div>

      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.bank}`:`${t.edit} — ${t.bank}`} onClose={()=>setModal(null)}>

          {/* Transaction type selector */}
          <div style={{marginBottom:"0.85rem"}}>
            <label style={{display:"block",marginBottom:6,fontSize:"0.8rem",fontWeight:600,color:"#374151"}}>
              {t.txType||"??????? ??????"} <span style={{color:"#dc2626"}}>*</span>
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
                  ?"????? (IN) ? ?????? (OUT) ???? ???? ???????"
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
              - income ? only deposit editable
              - expense ? only withdrawal editable
              - asset/liability ? BOTH editable */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field
              label={lang==="np"?`????? / IN (??)`:`Deposit / IN (Rs.)`}
              type="number"
              value={form.deposit}
              onChange={f("deposit")}
              readOnly={form.txType==="expense"}
            />
            <Field
              label={lang==="np"?`?????? / OUT (??)`:`Withdrawal / OUT (Rs.)`}
              type="number"
              value={form.withdrawal}
              onChange={f("withdrawal")}
              readOnly={form.txType==="income"}
            />
          </div>

          {/* Validation error */}
          {formErr&&(
            <div style={{background:"#fee2e2",color:"#dc2626",borderRadius:"0.4rem",padding:"6px 10px",fontSize:"0.8rem",marginBottom:"0.5rem"}}>
              ? {formErr}
            </div>
          )}

          {/* Only show sync note for income/expense; assets/liabilities do NOT sync to IE */}
          {syncsToIE&&(
            <div style={{background:"#ede9fe",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#7c3aed",marginTop:"0.25rem"}}>?? {t.syncNote}</div>
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

// ???????????????????????????????????????????????????????????????????????????????
// SECTION 16: INCOME/EXPENSE
// ???????????????????????????????????????????????????????????????????????????????
function IncomeExpense({ie,setIE,lang,t,useBS,fmtFn,isAdmin,categories}){
  const [modal,setModal]=useState(null);
  const blank={date:today(),particulars:"",income:0,expense:0,category:"meetingExpense",source:"manual",txId:null};
  const [form,setForm]=useState(blank);
  const f=k=>v=>setForm(p=>({...p,[k]:v}));
  const withBal=rows=>{let b=0;return[...rows].sort((a,bb)=>a.date.localeCompare(bb.date)).map(r=>{b+=(r.income||0)-(r.expense||0);return{...r,balance:b};});};
  const rows=withBal(ie).map(r=>({...r,dateDisp:displayDate(r.date,lang,useBS)}));
  const getLabel=k=>{try{return localStorage.getItem("fys_catlbl_"+k)||catLabel(k,t);}catch{return catLabel(k,t);}};
  const catOpts=[...(categories.income||[]),...(categories.expense||[])].map(k=>({value:k,label:getLabel(k)}));
  const save=()=>{
    const en={...form,income:+form.income,expense:+form.expense,modifiedAt:new Date().toISOString()};
    if(modal==="add")setIE([...ie,{...en,id:uid()}]);
    else setIE(ie.map(x=>x.id===form.id?en:x));
    setModal(null);
  };
  const del=id=>{
    const en=ie.find(x=>x.id===id);
    if(en?.txId){alert(t.syncedEdit);return;}
    if(window.confirm(t.confirmDelete))setIE(ie.filter(x=>x.id!==id));
  };
  const editEntry=r=>{
    if(r.txId){alert(t.syncedEdit);return;}
    setForm(r);setModal("edit");
  };
  const cols=[{key:"dateDisp",label:t.date},{key:"particulars",label:t.particulars,wrap:true},{key:"income",label:t.incomeLabel,fmt:true,num:true,green:true},{key:"expense",label:t.expenseLabel,fmt:true,num:true,red:true},{key:"balance",label:t.balance,fmt:true,num:true}];
  const printHTML=`<table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${rows.map(r=>`<tr>${cols.map(c=>`<td>${r[c.key]??""}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"0.75rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.income}</h2>
        <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap"}}>
          <Btn onClick={()=>exportPrint(t.income,printHTML)} color="#dc2626" icon="pdf">{t.pdf}</Btn>
          <Btn onClick={()=>exportCSV(t.income,cols,rows)} color="#16a34a" icon="excel">{t.csv}</Btn>
          {isAdmin&&<Btn onClick={()=>{setForm(blank);setModal("add");}} icon="plus">{t.add}</Btn>}
        </div>
      </div>
      <div style={{background:"#fefce8",borderRadius:"0.5rem",padding:"0.5rem 0.75rem",fontSize:"0.78rem",color:"#854d0e",marginBottom:"0.75rem"}}>?? {t.syncHint}</div>
      <div style={{background:"#fff",borderRadius:"0.875rem",boxShadow:"0 2px 8px rgba(0,0,0,0.06)",overflow:"hidden"}}>
        <Table t={t} cols={cols} rows={rows} onEdit={editEntry} onDelete={del} isAdmin={isAdmin}/>
      </div>
      {modal&&(
        <Modal title={modal==="add"?`${t.add} — ${t.income}`:`${t.edit} — ${t.income}`} onClose={()=>setModal(null)}>
          <Field label={t.date} type="date" value={form.date} onChange={f("date")} required/>
          <Field label={t.particulars} value={form.particulars} onChange={f("particulars")}/>
          <Field label={t.category} type="select" value={form.category} onChange={f("category")} options={catOpts}/>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.5rem"}}>
            <Field label={`${t.incomeLabel} (??)`} type="number" value={form.income} onChange={f("income")}/>
            <Field label={`${t.expenseLabel} (??)`} type="number" value={form.expense} onChange={f("expense")}/>
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

function Reports({totalSaving,totalLoanOut,cashBal,bankBal,monthlyIncome,monthlyExpense,totalFund,members,savings,loans,cash,bank,ie,lang,t,useBS,fmtFn,isAdmin}){
  const [mode,setMode]=useState("monthly");

  // Dynamic BS year range: from 2079 up to current BS year + 2 (future-proof)
  const currentBsYear = adToBS(today()).y || 2081;
  const bsYearStart = 2079;
  const bsYearEnd = Math.max(currentBsYear + 2, 2090);
  const bsYears = Array.from({length:bsYearEnd-bsYearStart+1},(_,i)=>bsYearStart+i);

  const [selY,setSelY]=useState(currentBsYear);
  const [selM,setSelM]=useState(adToBS(today()).m||1);
  const bsMOpts=(lang==="en"?BS_MONTHS_EN:BS_MONTHS_NP).map((m,i)=>({value:i+1,label:m}));

  const filterBS=rows=>rows.filter(e=>{
    const bs=adToBS(e.date);
    return mode==="monthly"?(bs.y===selY&&bs.m===selM):(bs.y===selY);
  });

  const fS=filterBS(savings),fL=filterBS(loans),fIE=filterBS(ie);
  const rSaving=fS.reduce((a,s)=>a+(s.deposit||0)-(s.withdraw||0),0);
  const rLoanIssued=fL.reduce((a,l)=>a+(l.loanAmount||0),0);
  const rPrincipal=fL.reduce((a,l)=>a+(l.principalPaid||0),0);
  const rInterest=fL.reduce((a,l)=>a+(l.interestPaid||0),0);
  const rIncome=fIE.reduce((a,x)=>a+(x.income||0),0);
  const rExpense=fIE.reduce((a,x)=>a+(x.expense||0),0);
  const rNet=rIncome-rExpense;

  const mLabel=lang==="en"?BS_MONTHS_EN[selM-1]:BS_MONTHS_NP[selM-1];
  const period=mode==="monthly"?`${mLabel} ${selY} ${t.bsLabel}`:`${selY} ${t.bsLabel}`;

  const row=(lbl,val,hi=false)=>(
    <div style={{display:"flex",justifyContent:"space-between",padding:"0.65rem 1rem",background:hi?"#1b5e20":"transparent",color:hi?"#fff":"#111827",borderBottom:hi?"none":"1px solid #f3f4f6",fontWeight:hi?700:500,borderRadius:hi?"0.5rem":0,fontSize:"0.9rem"}}>
      <span>{lbl}</span><span>{val}</span>
    </div>
  );

  const sigNames=lang==="np"?["???????","?????????","????","??????????"]:["President","Vice-President","Secretary","Treasurer"];

  const printHTML=`
    <h2>${mode==="monthly"?t.monthlyReport:t.yearlyReport} — ${period}</h2>
    <table>
      <thead><tr><th>${lang==="np"?"?????":"Description"}</th><th style="text-align:right">${lang==="np"?"???":"Amount"}</th></tr></thead>
      <tbody>
        <tr><td>${t.totalSaving}</td><td style="text-align:right">${fmtFn(rSaving)}</td></tr>
        <tr><td>${lang==="np"?"?? ????":"Loan Issued"}</td><td style="text-align:right">${fmtFn(rLoanIssued)}</td></tr>
        <tr><td>${lang==="np"?"????? ????":"Principal Recovered"}</td><td style="text-align:right">${fmtFn(rPrincipal)}</td></tr>
        <tr><td>${t.interestIncome}</td><td style="text-align:right">${fmtFn(rInterest)}</td></tr>
        <tr><td>${t.incomeLabel}</td><td style="text-align:right">${fmtFn(rIncome)}</td></tr>
        <tr><td>${t.expenseLabel}</td><td style="text-align:right">${fmtFn(rExpense)}</td></tr>
        <tr class="total-row"><td>${t.netBalance}</td><td style="text-align:right">${fmtFn(rNet)}</td></tr>
        <tr><td>${t.cashBalance} (${lang==="np"?"???":"All"})</td><td style="text-align:right">${fmtFn(cashBal)}</td></tr>
        <tr><td>${t.bankBalance} (${lang==="np"?"???":"All"})</td><td style="text-align:right">${fmtFn(bankBal)}</td></tr>
        <tr class="total-row"><td>${t.totalFund}</td><td style="text-align:right">${fmtFn(totalFund)}</td></tr>
        <tr><td>${t.totalMembers}</td><td style="text-align:right">${members.length}</td></tr>
      </tbody>
    </table>
    <div class="sig-area">
      ${sigNames.map(n=>`<div class="sig-line">${n}</div>`).join("")}
    </div>`;

  return(
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1rem",flexWrap:"wrap",gap:"0.5rem"}}>
        <h2 style={{color:"#1b5e20",margin:0,fontSize:"1.1rem"}}>?? {t.report}</h2>
        <Btn onClick={()=>exportPrint(mode==="monthly"?t.monthlyReport:t.yearlyReport,printHTML)} color="#dc2626" icon="pdf">{t.print}</Btn>
      </div>
      <div style={{display:"flex",gap:"0.5rem",marginBottom:"1rem"}}>
        {["monthly","yearly"].map(m=>(
          <button key={m} onClick={()=>setMode(m)} style={{padding:"0.45rem 1rem",border:"1.5px solid",borderColor:mode===m?"#1b5e20":"#d1d5db",borderRadius:"0.5rem",background:mode===m?"#1b5e20":"#fff",color:mode===m?"#fff":"#374151",cursor:"pointer",fontFamily:"inherit",fontWeight:600,fontSize:"0.8rem"}}>
            {m==="monthly"?t.monthlyReport:t.yearlyReport}
          </button>
        ))}
      </div>
      <div style={{display:"flex",gap:"0.5rem",flexWrap:"wrap",marginBottom:"1rem"}}>
        <select value={selY} onChange={e=>setSelY(+e.target.value)} style={{padding:"0.45rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.85rem"}}>
          {bsYears.map(y=><option key={y} value={y}>{y} {t.bsLabel}</option>)}
        </select>
        {mode==="monthly"&&(
          <select value={selM} onChange={e=>setSelM(+e.target.value)} style={{padding:"0.45rem 0.75rem",border:"1.5px solid #d1d5db",borderRadius:"0.5rem",fontFamily:"inherit",fontSize:"0.85rem"}}>
            {bsMOpts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        )}
      </div>
      <div style={{background:"#fff",borderRadius:"1rem",boxShadow:"0 4px 16px rgba(0,0,0,0.08)",overflow:"hidden",marginBottom:"1rem"}}>
        <div style={{background:"linear-gradient(135deg,#1b5e20,#2e7d32)",padding:"1rem 1.25rem",color:"#fff",textAlign:"center"}}>
          <div style={{fontSize:"1.1rem",fontWeight:700}}>{t.appName}</div>
          <div style={{fontSize:"0.8rem",opacity:0.85}}>{mode==="monthly"?t.monthlyReport:t.yearlyReport} — {period}</div>
        </div>
        <div>
          {row(t.totalSaving,fmtFn(rSaving))}
          {row(lang==="np"?"?? ????":"Loan Issued",fmtFn(rLoanIssued))}
          {row(lang==="np"?"????? ????":"Principal Recovered",fmtFn(rPrincipal))}
          {row(t.interestIncome,fmtFn(rInterest))}
          {row(t.incomeLabel,fmtFn(rIncome))}
          {row(t.expenseLabel,fmtFn(rExpense))}
          {row(t.netBalance,fmtFn(rNet))}
          <div style={{borderTop:"2px solid #e5e7eb",padding:"0.25rem 0"}}>
            {row(`${t.cashBalance} (${lang==="np"?"???":"All"})`,fmtFn(cashBal))}
            {row(`${t.bankBalance} (${lang==="np"?"???":"All"})`,fmtFn(bankBal))}
          </div>
        </div>
        <div style={{padding:"0.75rem"}}>
          <div style={{display:"flex",justifyContent:"space-between",padding:"0.75rem 1rem",background:"#1b5e20",color:"#fff",borderRadius:"0.5rem",fontWeight:700,fontSize:"1rem"}}>
            <span>{t.totalFund}</span><span>{fmtFn(totalFund)}</span>
          </div>
        </div>
        <div style={{padding:"0 1rem 1rem"}}>
          <div style={{fontSize:"0.8rem",color:"#6b7280",marginBottom:"0.5rem",fontWeight:600}}>{lang==="np"?"????????? ???????":"Signature Area"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"1rem"}}>
            {sigNames.map(x=>(
              <div key={x} style={{borderTop:"2px solid #d1d5db",paddingTop:"0.4rem",fontSize:"0.8rem",color:"#6b7280",textAlign:"center"}}>{x}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
