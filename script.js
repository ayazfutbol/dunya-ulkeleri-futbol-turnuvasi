import { auth, db, firebaseReady } from "./firebase-config.js";
import { GoogleAuthProvider, signInWithPopup, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js";
import { collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp, doc, setDoc, increment } from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const ADMIN_EMAIL = "ayazakçay599@gmail.com";
let currentUser = null;
let firebaseOnline = false;

function safeDate(ts){ try{return ts?.toDate?ts.toDate().toLocaleString("tr-TR"):new Date(ts||Date.now()).toLocaleString("tr-TR")}catch{return "-"} }
async function trackVisit(){
  try{
    const today=new Date().toISOString().slice(0,10);
    const key="dft_visit_"+today;
    if(sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key,"1");
    if(firebaseReady){
      await addDoc(collection(db,"visits"),{at:serverTimestamp(),date:today,userAgent:navigator.userAgent.slice(0,180)});
      firebaseOnline=true;
    } else { localStorage.setItem("dft_total_visits",String(Number(localStorage.getItem("dft_total_visits")||0)+1)); }
  }catch(e){ console.warn("Ziyaret kaydı yapılamadı",e); }
}
async function saveChampionRecord(x){
  const rec={country:x.country,flag:x.flag,capital:x.capital,at:serverTimestamp(),date:new Date().toISOString()};
  try{ if(firebaseReady) await addDoc(collection(db,"champions"),rec); }catch(e){console.warn("Şampiyon kaydı yapılamadı",e)}
  const local=JSON.parse(localStorage.getItem("dft_champions")||"[]"); local.unshift({...rec,at:Date.now()}); localStorage.setItem("dft_champions",JSON.stringify(local.slice(0,50)));
}
async function savePlayer(){
  if(!currentUser) return;
  try{if(firebaseReady) await setDoc(doc(db,"users",currentUser.uid),{email:currentUser.email||"",name:currentUser.displayName||"",lastSeen:serverTimestamp()},{merge:true})}catch(e){console.warn("Oyuncu kaydı yapılamadı",e)}
}

window.googleLogin=async()=>{
  try{
    if(!firebaseReady){$("accountStatus").textContent="Firebase yapılandırması eksik; giriş için firebase-config.js değerlerini ekleyin.";return;}
    const r=await signInWithPopup(auth,new GoogleAuthProvider());
    currentUser=r.user; savePlayer(); updateAccountUI();
  }catch(e){$("accountStatus").textContent="Giriş başarısız: "+(e.message||e)}
};
window.logoutUser=async()=>{try{if(auth) await (await import("https://www.gstatic.com/firebasejs/12.16.0/firebase-auth.js")).signOut(auth);currentUser=null;updateAccountUI()}catch(e){console.warn(e)}};
function updateAccountUI(){
  if(currentUser){$("accountText").textContent=currentUser.displayName||"Oyuncu hesabı aktif";$("accountStatus").textContent=currentUser.email||"";$("googleLoginBtn").style.display="none";$("logoutBtn").style.display="block";}
  else{$("accountText").textContent="İlerlemeni ve şampiyonluklarını hesabına kaydet.";$("accountStatus").textContent=firebaseReady?"Giriş yapılmadı.":"Firebase bağlantısı henüz yapılandırılmadı.";$("googleLoginBtn").style.display="block";$("logoutBtn").style.display="none";}
}

window.openAdmin=()=>{$("adminPanel").classList.add("on"); if(currentUser&&currentUser.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()) showAdminContent(); else showAdminLogin()};
window.closeAdmin=()=>{$("adminPanel").classList.remove("on")};
function showAdminLogin(){ $("adminLogin").style.display="block"; $("adminContent").style.display="none"; $("adminMsg").textContent=currentUser?"Bu hesap yönetici değil.":"Google hesabınla giriş yap."; }
function showAdminContent(){ $("adminLogin").style.display="none"; $("adminContent").style.display="block"; $("adminUser").textContent=currentUser?.email||"Yönetici"; refreshAdmin(); }
window.adminGoogleLogin=async()=>{
  try{
    if(!firebaseReady){$("adminMsg").textContent="Firebase yapılandırması eksik. firebase-config.js dosyasını doldur.";return;}
    const r=await signInWithPopup(auth,new GoogleAuthProvider());
    currentUser=r.user;
    if(currentUser.email?.toLowerCase()!==ADMIN_EMAIL.toLowerCase()){ $("adminMsg").textContent="Bu Google hesabının yönetici yetkisi yok."; return; }
    showAdminContent();
  }catch(e){$("adminMsg").textContent="Giriş başarısız: "+(e.message||e)}
};
window.refreshAdmin=async()=>{
  const localChamp=JSON.parse(localStorage.getItem("dft_champions")||"[]");
  $("statChampions").textContent=localChamp.length;
  $("statVisits").textContent=localStorage.getItem("dft_total_visits")||"0";
  $("statToday").textContent="-";
  if(!firebaseReady){$("firebaseStatus").textContent="Firebase yapılandırılmadı; yerel kayıtlar kullanılıyor."; renderChampions(localChamp); $("userList").textContent="Firebase kapalı."; return;}
  try{
    const vs=await getDocs(query(collection(db,"visits"),orderBy("at","desc"),limit(500)));
    const cs=await getDocs(query(collection(db,"champions"),orderBy("at","desc"),limit(50)));
    const us=await getDocs(query(collection(db,"users"),orderBy("lastSeen","desc"),limit(50)));
    $("statVisits").textContent=vs.size; $("statChampions").textContent=cs.size;
    const today=new Date().toISOString().slice(0,10); $("statToday").textContent=vs.docs.filter(d=>d.data().date===today).length; $("statUsers").textContent=us.size;
    renderChampions(cs.docs.map(d=>d.data()));
    $("userList").innerHTML=us.size?'<table class="admin-table"><tr><th>Ad</th><th>E-posta</th><th>Son giriş</th></tr>'+us.docs.map(d=>{const x=d.data();return `<tr><td>${x.name||"-"}</td><td>${x.email||"-"}</td><td>${safeDate(x.lastSeen)}</td></tr>`}).join("")+"</table>":"Henüz oyuncu yok.";
    $("firebaseStatus").textContent="Firebase bağlantısı aktif.";
  }catch(e){$("firebaseStatus").textContent="Firebase erişim hatası: "+(e.message||e); renderChampions(localChamp);}
};
function renderChampions(list){$("championList").innerHTML=list.length?'<table class="admin-table"><tr><th>Ülke</th><th>Tarih</th></tr>'+list.slice(0,30).map(x=>`<tr><td>${x.flag||"🏆"} ${x.country||x.name||"-"}</td><td>${safeDate(x.at||x.date)}</td></tr>`).join("")+"</table>":"Henüz şampiyonluk kaydı yok."}
window.exportAdminData=()=>{const data={visits:localStorage.getItem("dft_total_visits")||0,champions:JSON.parse(localStorage.getItem("dft_champions")||"[]")};const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:"application/json"}));a.download="dunya-futbol-admin-verileri.json";a.click();URL.revokeObjectURL(a.href)};

if(firebaseReady){onAuthStateChanged(auth,u=>{currentUser=u||null; updateAccountUI(); if(u){savePlayer(); if(u.email?.toLowerCase()===ADMIN_EMAIL.toLowerCase()) $("adminFab").classList.remove("hidden"); else $("adminFab").classList.add("hidden");}else $("adminFab").classList.remove("hidden");});}
trackVisit();

const strength={"İspanya": 99, "Arjantin": 98, "Fransa": 97, "İngiltere": 96, "Brezilya": 95, "Portekiz": 94, "Almanya": 92, "Hollanda": 91, "Fas": 90, "İtalya": 89, "Kolombiya": 89, "Uruguay": 88, "Hırvatistan": 87, "Belçika": 87, "Japonya": 84, "İsviçre": 84, "Danimarka": 84, "Senegal": 84, "Norveç": 82, "Ekvador": 82, "Avusturya": 83, "Türkiye": 81, "İran": 79, "Güney Kore": 78, "Meksika": 78, "Sırbistan": 77, "Polonya": 76, "Ukrayna": 76, "Çekya": 76, "İsveç": 76, "Kanada": 76, "Avustralya": 75, "Galler": 75, "Nijerya": 75, "Cezayir": 74, "Mısır": 73, "Şili": 72, "Mali": 71, "Venezuela": 70, "Paraguay": 70, "Gana": 70, "Tunus": 69, "Burkina Faso": 69, "Güney Afrika": 68, "Katar": 66, "Özbekistan": 66, "Suudi Arabistan": 65, "DR Kongo": 64, "Kongo Demokratik Cumhuriyeti": 64, "Jamaika": 63, "Irak": 62, "Peru": 62, "Ürdün": 61, "Kosta Rika": 61, "Gine": 61, "Honduras": 59, "Çin": 58, "Bolivya": 57, "Guatemala": 57, "Yeni Zelanda": 57, "Kuzey Kore": 56, "Uganda": 56, "Angola": 56, "El Salvador": 55, "Mozambik": 55, "Birleşik Arap Emirlikleri": 55, "Vietnam": 55, "Umman": 54, "Tayland": 53, "Endonezya": 52, "Kenya": 52, "Zimbabve": 52, "Tacikistan": 51, "Bahreyn": 51, "Tanzanya": 51, "Suriye": 50, "Kırgızistan": 50, "Filistin": 49, "Madagaskar": 48, "Libya": 48, "Hindistan": 48, "Malezya": 47, "Sudan": 47, "Kuveyt": 46, "Lübnan": 45};
const countries=[{"country": "Afganistan", "flag": "🇦🇫", "capital": "Kabil"}, {"country": "Arnavutluk", "flag": "🇦🇱", "capital": "Tiran"}, {"country": "Cezayir", "flag": "🇩🇿", "capital": "Cezayir"}, {"country": "Andorra", "flag": "🇦🇩", "capital": "Andorra la Vella"}, {"country": "Angola", "flag": "🇦🇴", "capital": "Luanda"}, {"country": "Antigua ve Barbuda", "flag": "🇦🇬", "capital": "Saint John's"}, {"country": "Arjantin", "flag": "🇦🇷", "capital": "Buenos Aires"}, {"country": "Ermenistan", "flag": "🇦🇲", "capital": "Erivan"}, {"country": "Avustralya", "flag": "🇦🇺", "capital": "Canberra"}, {"country": "Avusturya", "flag": "🇦🇹", "capital": "Viyana"}, {"country": "Azerbaycan", "flag": "🇦🇿", "capital": "Bakü"}, {"country": "Bahamalar", "flag": "🇧🇸", "capital": "Nassau"}, {"country": "Bahreyn", "flag": "🇧🇭", "capital": "Manama"}, {"country": "Bangladeş", "flag": "🇧🇩", "capital": "Dakka"}, {"country": "Barbados", "flag": "🇧🇧", "capital": "Bridgetown"}, {"country": "Belarus", "flag": "🇧🇾", "capital": "Minsk"}, {"country": "Belçika", "flag": "🇧🇪", "capital": "Brüksel"}, {"country": "Belize", "flag": "🇧🇿", "capital": "Belmopan"}, {"country": "Benin", "flag": "🇧🇯", "capital": "Porto-Novo"}, {"country": "Bhutan", "flag": "🇧🇹", "capital": "Thimphu"}, {"country": "Bolivya", "flag": "🇧🇴", "capital": "Sucre"}, {"country": "Bosna-Hersek", "flag": "🇧🇦", "capital": "Saraybosna"}, {"country": "Botsvana", "flag": "🇧🇼", "capital": "Gaborone"}, {"country": "Brezilya", "flag": "🇧🇷", "capital": "Brasília"}, {"country": "Brunei", "flag": "🇧🇳", "capital": "Bandar Seri Begawan"}, {"country": "Bulgaristan", "flag": "🇧🇬", "capital": "Sofya"}, {"country": "Burkina Faso", "flag": "🇧🇫", "capital": "Ouagadougou"}, {"country": "Burundi", "flag": "🇧🇮", "capital": "Gitega"}, {"country": "Cabo Verde", "flag": "🇨🇻", "capital": "Praia"}, {"country": "Kamboçya", "flag": "🇰🇭", "capital": "Phnom Penh"}, {"country": "Kamerun", "flag": "🇨🇲", "capital": "Yaoundé"}, {"country": "Kanada", "flag": "🇨🇦", "capital": "Ottawa"}, {"country": "Orta Afrika Cumhuriyeti", "flag": "🇨🇫", "capital": "Bangui"}, {"country": "Çad", "flag": "🇹🇩", "capital": "N'Djamena"}, {"country": "Şili", "flag": "🇨🇱", "capital": "Santiago"}, {"country": "Çin", "flag": "🇨🇳", "capital": "Pekin"}, {"country": "Kolombiya", "flag": "🇨🇴", "capital": "Bogotá"}, {"country": "Komorlar", "flag": "🇰🇲", "capital": "Moroni"}, {"country": "Kongo Cumhuriyeti", "flag": "🇨🇬", "capital": "Brazzaville"}, {"country": "Kosta Rika", "flag": "🇨🇷", "capital": "San José"}, {"country": "Fildişi Sahili", "flag": "🇨🇮", "capital": "Yamoussoukro"}, {"country": "Hırvatistan", "flag": "🇭🇷", "capital": "Zagreb"}, {"country": "Küba", "flag": "🇨🇺", "capital": "Havana"}, {"country": "Kıbrıs", "flag": "🇨🇾", "capital": "Lefkoşa"}, {"country": "Çekya", "flag": "🇨🇿", "capital": "Prag"}, {"country": "Kuzey Kore", "flag": "🇰🇵", "capital": "Pyongyang"}, {"country": "Kongo Demokratik Cumhuriyeti", "flag": "🇨🇩", "capital": "Kinşasa"}, {"country": "Danimarka", "flag": "🇩🇰", "capital": "Kopenhag"}, {"country": "Cibuti", "flag": "🇩🇯", "capital": "Cibuti"}, {"country": "Dominika", "flag": "🇩🇲", "capital": "Roseau"}, {"country": "Dominik Cumhuriyeti", "flag": "🇩🇴", "capital": "Santo Domingo"}, {"country": "Ekvador", "flag": "🇪🇨", "capital": "Quito"}, {"country": "Mısır", "flag": "🇪🇬", "capital": "Kahire"}, {"country": "El Salvador", "flag": "🇸🇻", "capital": "San Salvador"}, {"country": "Ekvator Ginesi", "flag": "🇬🇶", "capital": "Malabo"}, {"country": "Eritre", "flag": "🇪🇷", "capital": "Asmara"}, {"country": "Estonya", "flag": "🇪🇪", "capital": "Tallinn"}, {"country": "Esvatini", "flag": "🇸🇿", "capital": "Mbabane"}, {"country": "Etiyopya", "flag": "🇪🇹", "capital": "Addis Ababa"}, {"country": "Fiji", "flag": "🇫🇯", "capital": "Suva"}, {"country": "Finlandiya", "flag": "🇫🇮", "capital": "Helsinki"}, {"country": "Fransa", "flag": "🇫🇷", "capital": "Paris"}, {"country": "Gabon", "flag": "🇬🇦", "capital": "Libreville"}, {"country": "Gambiya", "flag": "🇬🇲", "capital": "Banjul"}, {"country": "Gürcistan", "flag": "🇬🇪", "capital": "Tiflis"}, {"country": "Almanya", "flag": "🇩🇪", "capital": "Berlin"}, {"country": "Gana", "flag": "🇬🇭", "capital": "Akra"}, {"country": "Yunanistan", "flag": "🇬🇷", "capital": "Atina"}, {"country": "Grenada", "flag": "🇬🇩", "capital": "Saint George's"}, {"country": "Guatemala", "flag": "🇬🇹", "capital": "Guatemala City"}, {"country": "Gine", "flag": "🇬🇳", "capital": "Konakri"}, {"country": "Gine-Bissau", "flag": "🇬🇼", "capital": "Bissau"}, {"country": "Guyana", "flag": "🇬🇾", "capital": "Georgetown"}, {"country": "Haiti", "flag": "🇭🇹", "capital": "Port-au-Prince"}, {"country": "Honduras", "flag": "🇭🇳", "capital": "Tegucigalpa"}, {"country": "Macaristan", "flag": "🇭🇺", "capital": "Budapeşte"}, {"country": "İzlanda", "flag": "🇮🇸", "capital": "Reykjavik"}, {"country": "Hindistan", "flag": "🇮🇳", "capital": "Yeni Delhi"}, {"country": "Endonezya", "flag": "🇮🇩", "capital": "Cakarta"}, {"country": "İran", "flag": "🇮🇷", "capital": "Tahran"}, {"country": "Irak", "flag": "🇮🇶", "capital": "Bağdat"}, {"country": "İrlanda", "flag": "🇮🇪", "capital": "Dublin"}, {"country": "İsrail", "flag": "🇮🇱", "capital": "Kudüs"}, {"country": "İtalya", "flag": "🇮🇹", "capital": "Roma"}, {"country": "Jamaika", "flag": "🇯🇲", "capital": "Kingston"}, {"country": "Japonya", "flag": "🇯🇵", "capital": "Tokyo"}, {"country": "Ürdün", "flag": "🇯🇴", "capital": "Amman"}, {"country": "Kazakistan", "flag": "🇰🇿", "capital": "Astana"}, {"country": "Kenya", "flag": "🇰🇪", "capital": "Nairobi"}, {"country": "Kiribati", "flag": "🇰🇮", "capital": "Güney Tarawa"}, {"country": "Kuveyt", "flag": "🇰🇼", "capital": "Kuveyt City"}, {"country": "Kırgızistan", "flag": "🇰🇬", "capital": "Bişkek"}, {"country": "Laos", "flag": "🇱🇦", "capital": "Vientiane"}, {"country": "Letonya", "flag": "🇱🇻", "capital": "Riga"}, {"country": "Lübnan", "flag": "🇱🇧", "capital": "Beyrut"}, {"country": "Lesotho", "flag": "🇱🇸", "capital": "Maseru"}, {"country": "Liberya", "flag": "🇱🇷", "capital": "Monrovia"}, {"country": "Libya", "flag": "🇱🇾", "capital": "Trablus"}, {"country": "Lihtenştayn", "flag": "🇱🇮", "capital": "Vaduz"}, {"country": "Litvanya", "flag": "🇱🇹", "capital": "Vilnius"}, {"country": "Lüksemburg", "flag": "🇱🇺", "capital": "Lüksemburg"}, {"country": "Madagaskar", "flag": "🇲🇬", "capital": "Antananarivo"}, {"country": "Malavi", "flag": "🇲🇼", "capital": "Lilongwe"}, {"country": "Malezya", "flag": "🇲🇾", "capital": "Kuala Lumpur"}, {"country": "Maldivler", "flag": "🇲🇻", "capital": "Malé"}, {"country": "Mali", "flag": "🇲🇱", "capital": "Bamako"}, {"country": "Malta", "flag": "🇲🇹", "capital": "Valletta"}, {"country": "Marshall Adaları", "flag": "🇲🇭", "capital": "Majuro"}, {"country": "Moritanya", "flag": "🇲🇷", "capital": "Nuakşot"}, {"country": "Mauritius", "flag": "🇲🇺", "capital": "Port Louis"}, {"country": "Meksika", "flag": "🇲🇽", "capital": "Meksiko"}, {"country": "Mikronezya", "flag": "🇫🇲", "capital": "Palikir"}, {"country": "Moldova", "flag": "🇲🇩", "capital": "Kişinev"}, {"country": "Monako", "flag": "🇲🇨", "capital": "Monako"}, {"country": "Moğolistan", "flag": "🇲🇳", "capital": "Ulan Batur"}, {"country": "Karadağ", "flag": "🇲🇪", "capital": "Podgoritsa"}, {"country": "Fas", "flag": "🇲🇦", "capital": "Rabat"}, {"country": "Mozambik", "flag": "🇲🇿", "capital": "Maputo"}, {"country": "Myanmar", "flag": "🇲🇲", "capital": "Naypyidaw"}, {"country": "Namibya", "flag": "🇳🇦", "capital": "Windhoek"}, {"country": "Nauru", "flag": "🇳🇷", "capital": "Yaren"}, {"country": "Nepal", "flag": "🇳🇵", "capital": "Katmandu"}, {"country": "Hollanda", "flag": "🇳🇱", "capital": "Amsterdam"}, {"country": "Yeni Zelanda", "flag": "🇳🇿", "capital": "Wellington"}, {"country": "Nikaragua", "flag": "🇳🇮", "capital": "Managua"}, {"country": "Nijer", "flag": "🇳🇪", "capital": "Niamey"}, {"country": "Nijerya", "flag": "🇳🇬", "capital": "Abuja"}, {"country": "Kuzey Makedonya", "flag": "🇲🇰", "capital": "Üsküp"}, {"country": "Norveç", "flag": "🇳🇴", "capital": "Oslo"}, {"country": "Umman", "flag": "🇴🇲", "capital": "Maskat"}, {"country": "Pakistan", "flag": "🇵🇰", "capital": "İslamabad"}, {"country": "Palau", "flag": "🇵🇼", "capital": "Ngerulmud"}, {"country": "Panama", "flag": "🇵🇦", "capital": "Panama City"}, {"country": "Papua Yeni Gine", "flag": "🇵🇬", "capital": "Port Moresby"}, {"country": "Paraguay", "flag": "🇵🇾", "capital": "Asunción"}, {"country": "Peru", "flag": "🇵🇪", "capital": "Lima"}, {"country": "Filipinler", "flag": "🇵🇭", "capital": "Manila"}, {"country": "Polonya", "flag": "🇵🇱", "capital": "Varşova"}, {"country": "Portekiz", "flag": "🇵🇹", "capital": "Lizbon"}, {"country": "Katar", "flag": "🇶🇦", "capital": "Doha"}, {"country": "Güney Kore", "flag": "🇰🇷", "capital": "Seul"}, {"country": "Romanya", "flag": "🇷🇴", "capital": "Bükreş"}, {"country": "Rusya", "flag": "🇷🇺", "capital": "Moskova"}, {"country": "Ruanda", "flag": "🇷🇼", "capital": "Kigali"}, {"country": "Saint Kitts ve Nevis", "flag": "🇰🇳", "capital": "Basseterre"}, {"country": "Saint Lucia", "flag": "🇱🇨", "capital": "Castries"}, {"country": "Saint Vincent ve Grenadinler", "flag": "🇻🇨", "capital": "Kingstown"}, {"country": "Samoa", "flag": "🇼🇸", "capital": "Apia"}, {"country": "San Marino", "flag": "🇸🇲", "capital": "San Marino"}, {"country": "São Tomé ve Príncipe", "flag": "🇸🇹", "capital": "São Tomé"}, {"country": "Suudi Arabistan", "flag": "🇸🇦", "capital": "Riyad"}, {"country": "Senegal", "flag": "🇸🇳", "capital": "Dakar"}, {"country": "Sırbistan", "flag": "🇷🇸", "capital": "Belgrad"}, {"country": "Seyşeller", "flag": "🇸🇨", "capital": "Victoria"}, {"country": "Sierra Leone", "flag": "🇸🇱", "capital": "Freetown"}, {"country": "Singapur", "flag": "🇸🇬", "capital": "Singapur"}, {"country": "Slovakya", "flag": "🇸🇰", "capital": "Bratislava"}, {"country": "Slovenya", "flag": "🇸🇮", "capital": "Ljubljana"}, {"country": "Solomon Adaları", "flag": "🇸🇧", "capital": "Honiara"}, {"country": "Somali", "flag": "🇸🇴", "capital": "Mogadişu"}, {"country": "Güney Afrika", "flag": "🇿🇦", "capital": "Pretoria"}, {"country": "Güney Sudan", "flag": "🇸🇸", "capital": "Juba"}, {"country": "İspanya", "flag": "🇪🇸", "capital": "Madrid"}, {"country": "Sri Lanka", "flag": "🇱🇰", "capital": "Sri Jayawardenepura Kotte"}, {"country": "Sudan", "flag": "🇸🇩", "capital": "Hartum"}, {"country": "Surinam", "flag": "🇸🇷", "capital": "Paramaribo"}, {"country": "İsveç", "flag": "🇸🇪", "capital": "Stockholm"}, {"country": "İsviçre", "flag": "🇨🇭", "capital": "Bern"}, {"country": "Suriye", "flag": "🇸🇾", "capital": "Şam"}, {"country": "Tacikistan", "flag": "🇹🇯", "capital": "Duşanbe"}, {"country": "Tanzanya", "flag": "🇹🇿", "capital": "Dodoma"}, {"country": "Tayland", "flag": "🇹🇭", "capital": "Bangkok"}, {"country": "Timor-Leste", "flag": "🇹🇱", "capital": "Dili"}, {"country": "Togo", "flag": "🇹🇬", "capital": "Lomé"}, {"country": "Tonga", "flag": "🇹🇴", "capital": "Nuku'alofa"}, {"country": "Trinidad ve Tobago", "flag": "🇹🇹", "capital": "Port of Spain"}, {"country": "Tunus", "flag": "🇹🇳", "capital": "Tunus"}, {"country": "Türkiye", "flag": "🇹🇷", "capital": "Ankara"}, {"country": "Türkmenistan", "flag": "🇹🇲", "capital": "Aşkabat"}, {"country": "Tuvalu", "flag": "🇹🇻", "capital": "Funafuti"}, {"country": "Uganda", "flag": "🇺🇬", "capital": "Kampala"}, {"country": "Ukrayna", "flag": "🇺🇦", "capital": "Kyiv"}, {"country": "Birleşik Arap Emirlikleri", "flag": "🇦🇪", "capital": "Abu Dabi"}, {"country": "Birleşik Krallık", "flag": "🇬🇧", "capital": "Londra"}, {"country": "Amerika Birleşik Devletleri", "flag": "🇺🇸", "capital": "Washington, D.C."}, {"country": "Uruguay", "flag": "🇺🇾", "capital": "Montevideo"}, {"country": "Özbekistan", "flag": "🇺🇿", "capital": "Taşkent"}, {"country": "Vanuatu", "flag": "🇻🇺", "capital": "Port Vila"}, {"country": "Venezuela", "flag": "🇻🇪", "capital": "Caracas"}, {"country": "Vietnam", "flag": "🇻🇳", "capital": "Hanoi"}, {"country": "Yemen", "flag": "🇾🇪", "capital": "Sana"}, {"country": "Zambiya", "flag": "🇿🇲", "capital": "Lusaka"}, {"country": "Zimbabve", "flag": "🇿🇼", "capital": "Harare"}, {"country": "Filistin", "flag": "🇵🇸", "capital": "Ramallah"}, {"country": "Vatikan", "flag": "🇻🇦", "capital": "Vatikan Şehri"}];
let selected=null,teams=[],next=[],byeHistory=[],matches=[],round=1,finished=false,stopped=false,sound=true,ctx=null;
const $=id=>document.getElementById(id);
function name(x){return x.country}
function power(x){return strength[x.country] ?? 45}
function strengthLabel(x){return "Güç: "+power(x)+"/100"}
function renderCountries(){const q=$("search").value.trim().toLocaleLowerCase("tr-TR");$("countries").innerHTML="";countries.filter(x=>x.country.toLocaleLowerCase("tr-TR").includes(q)||x.capital.toLocaleLowerCase("tr-TR").includes(q)).forEach(x=>{const d=document.createElement("div");d.className="country"+(selected===x?" selected":"");d.innerHTML='<div class="flag">'+x.flag+'</div><div class="country-info"><div class="country-name">'+x.country+'</div><div class="capital">Başkent: '+x.capital+'</div></div>';d.onclick=()=>selectCountry(x);$("countries").appendChild(d)})}
function selectCountry(x){selected=x;$("chosen").style.display="block";$("chosenName").textContent=name(x);$("start").style.display="block";renderCountries()}
function audio(){if(!ctx)ctx=new(window.AudioContext||window.webkitAudioContext)();if(ctx.state==="suspended")ctx.resume();return ctx}
function tone(f,d=.12){if(!sound)return;let c=audio(),o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(.05,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+d);o.connect(g);g.connect(c.destination);o.start();o.stop(c.currentTime+d)}
function clickSound(){tone(650,.07);setTimeout(()=>tone(900,.08),45)}
function playCrowd(){
  if(!sound) return;
  const c=audio(), now=c.currentTime;
  for(let i=0;i<22;i++){
    const o=c.createOscillator(), g=c.createGain();
    o.type="sawtooth";
    o.frequency.value=180+Math.random()*500;
    g.gain.setValueAtTime(0.001,now+i*0.025);
    g.gain.exponentialRampToValueAtTime(0.025,now+i*0.025+0.01);
    g.gain.exponentialRampToValueAtTime(0.001,now+i*0.025+0.12);
    o.connect(g);g.connect(c.destination);o.start(now+i*0.025);o.stop(now+i*0.025+0.13);
  }
}
function playVictory(){
  if(!sound)return;
  playCrowd();
  const notes=[523,659,784,1046,784,1046,1318];
  notes.forEach((n,i)=>setTimeout(()=>tone(n,.35),i*170));
  setTimeout(()=>playCrowd(),1300);
}
function playTournamentTheme(){
  if(!sound)return;
  // Kura ekranı için kısa, telifsiz stadyum-marşı hissi veren özgün melodi.
  const notes=[196,220,262,294,262,330,294,392,330,294,262,220];
  notes.forEach((n,i)=>setTimeout(()=>tone(n,.28),i*150));
}
function toggleSound(){sound=!sound;$("sound").textContent=sound?"🔊":"🔇";if(sound)clickSound()}
function shuffle(a){for(let i=a.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}}
function loading(icon,title,text){$("li").textContent=icon;$("lt").textContent=title;$("lx").textContent=text;$("loading").classList.add("on")}
function hideLoading(){$("loading").classList.remove("on")}
function show(id){document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));$(id).classList.add("active")}
function start(){clickSound();if(currentUser) savePlayer();teams=countries.slice();next=[];byeHistory=[];round=1;stopped=false;show("tournament");$("mine").textContent="⭐ SENİN ÜLKEN: "+name(selected);prepare()}
function prepare(){if(stopped)return; $("next").classList.remove("exit"); playTournamentTheme(); $("next").textContent="➡️ SONRAKİ TURA GEÇ"; loading("🎲","KURA ÇEKİLİYOR","Ülkeler eşleştiriliyor...");setTimeout(createRound,2200)}
function createRound(){shuffle(teams);next=[];let bye=null;if(teams.length%2){let a=teams.filter(x=>!byeHistory.includes(x));if(!a.length)a=teams.slice();bye=a[Math.floor(Math.random()*a.length)];byeHistory.push(bye);next.push(bye);teams=teams.filter(x=>x!==bye)}matches=[]; for(let i=0;i<teams.length;i+=2) matches.push({a:teams[i],b:teams[i+1],s1:0,s2:0,w:null}); const mineIndex=matches.findIndex(m=>m.a===selected||m.b===selected); if(mineIndex>0){ [matches[0],matches[mineIndex]]=[matches[mineIndex],matches[0]]; } renderRound(bye);setTimeout(play,500)}
function renderRound(bye){$("round").textContent="⚽ "+round+". TUR";$("info").textContent=matches.length+" maç oynanacak";$("bye").innerHTML=bye?'<div class="bye">🎟️ BU TUR BAY GEÇEN ÜLKE<strong>'+bye.flag+" "+name(bye)+'</strong></div>':"";$("matches").innerHTML="";matches.forEach(m=>{let d=document.createElement("div");d.className="match"+(m.a===selected||m.b===selected?" mine":"");d.innerHTML='<div class="row"><div class="team left">'+m.a.flag+" "+name(m.a)+'<div style="font-size:10px;color:#8a94a3;font-weight:600;margin-top:3px">Başkent: '+m.a.capital+'</div></div><div class="score">- : -</div><div class="team right">'+m.b.flag+" "+name(m.b)+'<div style="font-size:10px;color:#8a94a3;font-weight:600;margin-top:3px">Başkent: '+m.b.capital+'</div></div></div><div class="status">⏳ MAÇ BEKLENİYOR...</div>';$("matches").appendChild(d)})}
function play(){loading("⚽","MAÇLAR OYNANIYOR","Bütün maçlar aynı anda oynanıyor...");setTimeout(finish,4000)}
function simulateMatch(m){
  const pa=power(m.a), pb=power(m.b);
  const diff=pa-pb;

  // Güç, maç performansının temelini oluşturur.
  // Fakat form, maç içi dalgalanma ve sürprizler sonucu etkileyebilir.
  const strengthA=0.78 + pa/100*1.25;
  const strengthB=0.78 + pb/100*1.25;

  // Büyük güç farkı avantaj sağlar; küçük takıma da gerçekçi bir sürpriz payı bırakılır.
  const formA=(Math.random()-0.5)*0.75;
  const formB=(Math.random()-0.5)*0.75;
  const upsetA=Math.random()<Math.max(0.025,0.10-Math.max(0,diff)*0.001);
  const upsetB=Math.random()<Math.max(0.025,0.10-Math.max(0,-diff)*0.001);

  let expectedA=strengthA + diff*0.010 + formA;
  let expectedB=strengthB - diff*0.010 + formB;

  // Nadiren güçlü takım kötü gün geçirir, zayıf takım çok iyi oynar.
  if(diff>0 && upsetA) expectedA-=0.75;
  if(diff>0 && upsetB) expectedB+=0.75;
  if(diff<0 && upsetA) expectedA+=0.75;
  if(diff<0 && upsetB) expectedB-=0.75;

  const randomGoal=(expected)=>{
    const noise=(Math.random()-0.5)*1.8;
    return Math.max(0,Math.min(6,Math.round(expected+noise)));
  };

  let a=randomGoal(expectedA);
  let b=randomGoal(expectedB);

  // Çok büyük güç farklarında sonuçların mantıksız tersine dönmesini azalt,
  // ama tamamen engelleme.
  if(Math.abs(diff)>=25 && Math.random()<0.72){
    if(diff>0 && a<=b && Math.random()<0.88) a=Math.min(6,b+1);
    if(diff<0 && b<=a && Math.random()<0.88) b=Math.min(6,a+1);
  }

  m.pen1=null;
  m.pen2=null;

  // Beraberlikler mümkün. Eleme maçında penaltı ile kazanan belirlenir.
  if(a===b){
    m.s1=a;
    m.s2=b;
    let p1=3+Math.floor(Math.random()*3);
    let p2=3+Math.floor(Math.random()*3);
    while(p1===p2){
      if(Math.random()<0.5) p1++;
      else p2++;
    }
    m.pen1=p1;
    m.pen2=p2;
    m.w=p1>p2?m.a:m.b;
    return;
  }

  m.s1=a;
  m.s2=b;
  m.w=m.s1>m.s2?m.a:m.b;
}
function score(){let r=Math.random();return r<.14?0:r<.48?1:r<.77?2:r<.92?3:r<.98?4:5}
function finish(){matches.forEach(m=>{simulateMatch(m);next.push(m.w)});hideLoading();showResults();finished=true;let mine=matches.find(m=>m.a===selected||m.b===selected);if(mine&&mine.w!==selected){setTimeout(()=>{ $("elimName").textContent=name(selected); $("elim").classList.add("on"); $("next").textContent="🚪 TURNUVADAN ÇIK"; $("next").classList.add("exit"); $("next").style.display="block"; },900); stopped=true; return}if(next.length===1){setTimeout(()=>champion(next[0]),1200);return}$("next").style.display="block"}
function showResults(){document.querySelectorAll(".match").forEach((d,i)=>{let m=matches[i];d.querySelector(".score").innerHTML=m.pen1!==null ? (m.s1+" : "+m.s2+'<div style="font-size:10px;color:#64748b;font-weight:700;margin-top:2px">(Penaltılar: '+m.pen1+"-"+m.pen2+')</div>') : (m.s1+" : "+m.s2);d.querySelector(".status").innerHTML=m.w===selected?"🏆 TURU GEÇTİNİZ":"🏆 "+name(m.w)+" TURU GEÇTİ"})}
function nextRound(){
  if(stopped && $("next").classList.contains("exit")){
    clickSound();
    $("elim").classList.remove("on");
    $("next").style.display="none";
    selected=null;
    teams=[];
    next=[];
    matches=[];
    byeHistory=[];
    round=1;
    finished=false;
    stopped=false;
    $("chosen").style.display="none";
    $("start").style.display="none";
    $("search").value="";
    show("select");
    renderCountries();
    return;
  }
  if(!finished)return;
  clickSound();
  $("next").style.display="none";
  teams=next.slice();
  next=[];
  matches=[];
  round++;
  finished=false;
  prepare();
}
function champion(x){stopped=true;$("champName").textContent=x.flag+" "+name(x);show("champion");playVictory();saveChampionRecord(x)}
function closeElimination(){
  $("elim").classList.remove("on");
  $("next").textContent="🚪 TURNUVADAN ÇIK";
  $("next").classList.add("exit");
  $("next").style.display="block";
}
function restart(){clickSound();selected=null;teams=[];next=[];byeHistory=[];matches=[];round=1;finished=false;stopped=false;$("elim").classList.remove("on");$("next").style.display="none";$("next").classList.remove("exit");$("next").textContent="➡️ SONRAKİ TURA GEÇ";$("search").value="";$("chosen").style.display="none";$("start").style.display="none";show("select");renderCountries()}
renderCountries();

updateAccountUI();
