// แยกไฟล์ script เป็นอีกไฟล์ 
let vehicles=[],patients=[],editVehId=null,editPatId=null,vehFilter='all',patFilter='all',vehSearchPlate='',vehSearchType='',patSearchName='',patSearchTransfer='';
let cType=null,cStatus=null,cTriage=null,cPatSt=null,cPolar=null,cManpower=null;
const VT=['รถพยาบาล','รถกู้ชีพ','รถกู้ภัย','รถบัญชาการ','รถดับเพลิง','รถตำรวจ','อื่นๆ'];
const VC=['#3b82f6','#22c55e','#f59e0b','#a855f7','#ef4444','#06b6d4','#94a3b8'];

// ── Firebase helpers ─────────────────────────────────────
function fbReady(){return window._firebaseReady===true}
function dbRef(path){return window._ref(window._db,path)}

// ── ฟังก์ชัน save/load (เปลี่ยนเป็น Firebase แล้ว) ─────
// ข้อมูลถูก sync ผ่าน onValue listener ใน module script ด้านบน

function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function nowT(){return new Date().toLocaleTimeString('th-TH',{hour:'2-digit',minute:'2-digit'})}
function nowF(){return new Date().toLocaleString('th-TH')}

// ── Login/Logout จัดการผ่าน Firebase Auth ใน module script ด้านบน ──
// window.doLogin และ window.doLogout ถูก expose จาก module script แล้ว


function updateDate(){document.getElementById('dateDisplay').textContent=nowF()}

function showTab(t){
  document.querySelectorAll('.tab-content').forEach(el=>el.classList.remove('active'));
  document.getElementById('tab-'+t).classList.add('active');
  // desktop nav
  document.querySelectorAll('.nav-tab').forEach((b,i)=>b.classList.toggle('active',['dashboard','vehicles','patients'][i]===t));
  // bottom nav
  ['dashboard','vehicles','patients'].forEach(x=>{const b=document.getElementById('bn-'+x);if(b)b.classList.toggle('active',x===t)});
  if(t==='dashboard') renderDash();
  window.scrollTo(0,0);
}

function toast(msg){const el=document.getElementById('toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2500)}

/* ── VEHICLES ── */
async function saveVehicle(){
  if(!fbReady()){alert('Firebase ยังไม่พร้อม กรุณารอสักครู่');return}
  const plate=document.getElementById('v-plate').value.trim();
  if(!plate){alert('กรุณากรอกเลขทะเบียน');return}
  const obj={type:document.getElementById('v-type').value,plate,crew:document.getElementById('v-crew').value,dept:document.getElementById('v-dept').value.trim(),phone:document.getElementById('v-phone').value.trim(),status:document.getElementById('v-status').value,updated:nowF()};
  try{
    if(editVehId){
      // หา _key จากรายการ
      const v=vehicles.find(x=>x.id===editVehId);
      if(v&&v._key) await window._update(dbRef('vehicles/'+v._key),obj);
      editVehId=null;
    } else {
      const newObj={id:uid(),time:nowT(),...obj};
      await window._push(dbRef('vehicles'),newObj);
    }
    clearVehicleForm();toast('✅ บันทึกข้อมูลรถแล้ว');
  } catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
async function toggleVehStatus(id){
  if(!fbReady())return;
  const v=vehicles.find(x=>x.id===id);if(!v||!v._key)return;
  const newStatus=v.status==='อยู่จุดเช็คอิน'?'ออกปฏิบัติงาน':'อยู่จุดเช็คอิน';
  try{await window._update(dbRef('vehicles/'+v._key),{status:newStatus,updated:nowF()});toast('🔄 '+newStatus)}catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
function editVehicle(id){const v=vehicles.find(x=>x.id===id);if(!v)return;editVehId=id;document.getElementById('v-type').value=v.type;document.getElementById('v-plate').value=v.plate;document.getElementById('v-crew').value=v.crew;document.getElementById('v-dept').value=v.dept;document.getElementById('v-phone').value=v.phone;document.getElementById('v-status').value=v.status;document.getElementById('veh-form-title').textContent='✏️ แก้ไขรถ: '+v.plate;showTab('vehicles');window.scrollTo(0,0)}
async function deleteVehicle(id){
  if(!fbReady())return;
  if(!confirm('ลบข้อมูลรถนี้?'))return;
  const v=vehicles.find(x=>x.id===id);if(!v||!v._key)return;
  try{await window._remove(dbRef('vehicles/'+v._key));toast('🗑️ ลบแล้ว')}catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
function clearVehicleForm(){editVehId=null;['v-plate','v-crew','v-dept','v-phone'].forEach(id=>document.getElementById(id).value='');document.getElementById('v-type').selectedIndex=0;document.getElementById('v-status').selectedIndex=0;document.getElementById('veh-form-title').textContent='🚑 เพิ่ม / แก้ไข ข้อมูลรถ'}
function filterVeh(f,btn){vehFilter=f;vehSearchPlate='';vehSearchType='';document.getElementById('v-search-plate').value='';document.getElementById('v-search-type').value='';document.querySelectorAll('#tab-vehicles .filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderVTable()}
function searchVehicles(){vehSearchPlate=document.getElementById('v-search-plate').value.trim().toUpperCase();vehSearchType=document.getElementById('v-search-type').value;renderVTable()}
function renderVTable(){
  let data=vehFilter==='all'?vehicles:vehicles.filter(v=>v.status===vehFilter);
  if(vehSearchPlate)data=data.filter(v=>v.plate.toUpperCase().includes(vehSearchPlate));
  if(vehSearchType)data=data.filter(v=>v.type===vehSearchType);
  document.getElementById('v-count').textContent=vehicles.length;
  // desktop
  const td=document.getElementById('v-table-d');
  td.innerHTML=data.length?data.map((v,i)=>`<tr>
    <td style="color:#475569">${i+1}</td><td>${v.type}</td>
    <td style="font-weight:600;color:#f1f5f9">${v.plate}</td>
    <td style="text-align:center">${v.crew||'-'}</td>
    <td>${v.dept||'-'}</td><td style="color:#94a3b8">${v.phone||'-'}</td>
    <td><span class="tag status-toggle ${v.status==='อยู่จุดเช็คอิน'?'tag-checkin':'tag-out'}" onclick="toggleVehStatus('${v.id}')">${v.status} ⇄</span></td>
    <td style="white-space:nowrap"><button class="btn-danger" onclick="editVehicle('${v.id}')">แก้ไข</button> <button class="btn-danger" onclick="deleteVehicle('${v.id}')">ลบ</button></td>
  </tr>`).join(''):'<tr><td colspan="8" class="empty-state">ไม่มีข้อมูล</td></tr>';
  // mobile cards
  const tm=document.getElementById('v-table-m');
  tm.innerHTML=data.length?data.map(v=>`<div class="m-card">
    <div class="m-card-top">
      <div><div class="m-card-name">${v.plate}</div><div class="m-card-sub">${v.type} · ${v.dept||'-'}</div></div>
      <span class="tag status-toggle ${v.status==='อยู่จุดเช็คอิน'?'tag-checkin':'tag-out'}" onclick="toggleVehStatus('${v.id}')">${v.status} ⇄</span>
    </div>
    <div class="m-card-row">
      <span class="tag tag-gray">👥 ${v.crew||'-'} คน</span>
      <span class="tag tag-gray">📞 ${v.phone||'-'}</span>
    </div>
    <div class="m-card-actions">
      <button class="btn-danger" onclick="editVehicle('${v.id}')">แก้ไข</button>
      <button class="btn-danger" onclick="deleteVehicle('${v.id}')">ลบ</button>
    </div>
  </div>`).join(''):'<div class="empty-state">ไม่มีข้อมูล</div>';
}

/* ── PATIENTS ── */
async function savePatient(){
  if(!fbReady()){alert('Firebase ยังไม่พร้อม กรุณารอสักครู่');return}
  const name=document.getElementById('p-name').value.trim();
  if(!name){alert('กรุณากรอกชื่อผู้ป่วย');return}
  const obj={name,cas:document.getElementById('p-case').value,transfer:document.getElementById('p-transfer').value,status:document.getElementById('p-status').value.trim(),note:document.getElementById('p-note').value.trim(),updated:nowF()};
  try{
    if(editPatId){
      const p=patients.find(x=>x.id===editPatId);
      if(p&&p._key) await window._update(dbRef('patients/'+p._key),obj);
      editPatId=null;
    } else {
      const newObj={id:uid(),time:nowT(),...obj};
      await window._push(dbRef('patients'),newObj);
    }
    clearPatientForm();toast('✅ บันทึกข้อมูลผู้ป่วยแล้ว');
  } catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
async function togglePatStatus(id){
  if(!fbReady())return;
  const p=patients.find(x=>x.id===id);if(!p||!p._key)return;
  const opts=['อยู่จุดคัดแยก','ส่ง รพ.','กลับบ้าน','จุดพบญาติ'];
  const newStatus=opts[(opts.indexOf(p.transfer)+1)%opts.length];
  try{await window._update(dbRef('patients/'+p._key),{transfer:newStatus,updated:nowF()});toast('🔄 '+newStatus)}catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
function editPatient(id){const p=patients.find(x=>x.id===id);if(!p)return;editPatId=id;document.getElementById('p-name').value=p.name;document.getElementById('p-case').value=p.cas;document.getElementById('p-transfer').value=p.transfer||'';document.getElementById('p-status').value=p.status;document.getElementById('p-note').value=p.note||'';document.getElementById('pat-form-title').textContent='✏️ แก้ไขผู้ป่วย: '+p.name;showTab('patients');window.scrollTo(0,0)}
async function deletePatient(id){
  if(!fbReady())return;
  if(!confirm('ลบข้อมูลผู้ป่วยนี้?'))return;
  const p=patients.find(x=>x.id===id);if(!p||!p._key)return;
  try{await window._remove(dbRef('patients/'+p._key));toast('🗑️ ลบแล้ว')}catch(e){alert('เกิดข้อผิดพลาด: '+e.message)}
}
function clearPatientForm(){editPatId=null;['p-name','p-status','p-note'].forEach(id=>document.getElementById(id).value='');document.getElementById('p-case').selectedIndex=0;document.getElementById('p-transfer').selectedIndex=0;document.getElementById('pat-form-title').textContent='🏥 เพิ่ม / แก้ไข ข้อมูลผู้ป่วย'}
function filterPat(f,btn){patFilter=f;patSearchName='';patSearchTransfer='';document.getElementById('p-search-name').value='';document.getElementById('p-search-transfer').value='';document.querySelectorAll('#tab-patients .filter-btn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderPTable()}
function searchPatients(){patSearchName=document.getElementById('p-search-name').value.trim().toLowerCase();patSearchTransfer=document.getElementById('p-search-transfer').value;renderPTable()}

const CASE_TAG={เขียว:'tag-green',เหลือง:'tag-yellow',แดง:'tag-red',ดำ:'tag-black'};
const CASE_DOT={เขียว:'🟢',เหลือง:'🟡',แดง:'🔴',ดำ:'⚫'};
const PAT_ST_TAG={'ส่ง รพ.':'tag-blue','อยู่จุดคัดแยก':'tag-yellow','กลับบ้าน':'tag-green','จุดพบญาติ':'tag-purple'};
function caseTag(c){return`<span class="tag ${CASE_TAG[c]||'tag-gray'}">${CASE_DOT[c]||''}${c}</span>`};
function patStTag(s){return`<span class="tag ${PAT_ST_TAG[s]||'tag-gray'}">${s}</span>`};
function patStToggleTag(s,id){return`<span class="tag status-toggle ${PAT_ST_TAG[s]||'tag-gray'}" onclick="togglePatStatus('${id}')">${s} ⇄</span>`};

function renderPTable(){
  let data=patFilter==='all'?patients:patients.filter(p=>p.cas===patFilter);
  if(patSearchName)data=data.filter(p=>p.name.toLowerCase().includes(patSearchName));
  if(patSearchTransfer)data=data.filter(p=>p.transfer===patSearchTransfer);
  document.getElementById('p-count').textContent=patients.length;
  // desktop
  const td=document.getElementById('p-table-d');
  td.innerHTML=data.length?data.map((p,i)=>`<tr>
    <td style="color:#475569">${i+1}</td>
    <td style="font-weight:600;color:#f1f5f9">${p.name}</td>
    <td>${caseTag(p.cas)}</td>
    <td style="color:#94a3b8">${p.status||'-'}</td>
    <td>${patStToggleTag(p.transfer,p.id)}</td>
    <td style="color:#94a3b8;font-size:12px">${p.note||'-'}</td>
    <td style="color:#475569;font-size:11px">${p.time}</td>
    <td style="white-space:nowrap"><button class="btn-danger" onclick="editPatient('${p.id}')">แก้ไข</button> <button class="btn-danger" onclick="deletePatient('${p.id}')">ลบ</button></td>
  </tr>`).join(''):'<tr><td colspan="8" class="empty-state">ไม่มีข้อมูล</td></tr>';
  // mobile cards
  const tm=document.getElementById('p-table-m');
  tm.innerHTML=data.length?data.map(p=>`<div class="m-card">
    <div class="m-card-top">
      <div><div class="m-card-name">${p.name}</div><div class="m-card-sub">${p.time}</div></div>
      ${caseTag(p.cas)}
    </div>
    <div class="m-card-row">
      ${patStToggleTag(p.transfer,p.id)}
      ${p.status?`<span class="tag tag-gray" style="font-size:11px">${p.status}</span>`:''}
    </div>
    ${p.note?`<div style="font-size:11px;color:#64748b;margin-bottom:4px">📝 ${p.note}</div>`:''}
    <div class="m-card-actions">
      <button class="btn-danger" onclick="editPatient('${p.id}')">แก้ไข</button>
      <button class="btn-danger" onclick="deletePatient('${p.id}')">ลบ</button>
    </div>
  </div>`).join(''):'<div class="empty-state">ไม่มีข้อมูล</div>';
}

/* ── DASHBOARD CHARTS ── */
Chart.register(ChartDataLabels);
const CFG={responsive:true,maintainAspectRatio:false,animation:{duration:350}};
function renderDash(){
  const atBase=vehicles.filter(v=>v.status==='อยู่จุดเช็คอิน').length;
  const onDuty=vehicles.filter(v=>v.status==='ออกปฏิบัติงาน').length;
  const total=vehicles.length;
  const tc=VT.map(t=>vehicles.filter(v=>v.type===t).length);
  document.getElementById('donut-total').textContent=total;
  document.getElementById('dl-checkin').textContent=atBase;
  document.getElementById('dl-out').textContent=onDuty;
  const used=VT.filter((_,i)=>tc[i]>0);
  document.getElementById('bar-summary').innerHTML=used.map((t,i)=>{const idx=VT.indexOf(t);return`<div class="bar-chip"><div class="dot-chip" style="background:${VC[idx]}"></div><b style="color:${VC[idx]}">${tc[idx]}</b>${t}</div>`}).join('')||'<div class="bar-chip" style="color:#475569">ยังไม่มีข้อมูลรถ</div>';

  if(cType)cType.destroy();
  cType=new Chart(document.getElementById('chartVehType').getContext('2d'),{type:'bar',data:{labels:VT,datasets:[{label:'จำนวน',data:tc,backgroundColor:VC,borderRadius:5,borderSkipped:false}]},options:{...CFG,plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.y} คัน`}},datalabels: { display: false }},scales:{x:{ticks:{color:'#94a3b8',font:{size:14},maxRotation:30},grid:{color:'#0f172a'}},y:{ticks:{color:'#94a3b8',stepSize:1},grid:{color:'#334155'},beginAtZero:true}}}});

  if(cStatus)cStatus.destroy();
  cStatus=new Chart(document.getElementById('chartVehStatus').getContext('2d'),{type:'doughnut',data:{labels:['อยู่จุดเช็คอิน','ออกปฏิบัติงาน'],datasets:[{data:[atBase||0,onDuty||0],backgroundColor:['#22c55e','#f59e0b'],borderColor:'#1e293b',borderWidth:3,hoverOffset:4}]},options:{...CFG,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.parsed} คัน`}}}}});

  const g=patients.filter(p=>p.cas==='เขียว').length,y=patients.filter(p=>p.cas==='เหลือง').length,r=patients.filter(p=>p.cas==='แดง').length,b=patients.filter(p=>p.cas==='ดำ').length;
  const pTriage=patients.filter(p=>p.transfer==='อยู่จุดคัดแยก').length,pHosp=patients.filter(p=>p.transfer==='ส่ง รพ.').length,pHome=patients.filter(p=>p.transfer==='กลับบ้าน').length,pFamily=patients.filter(p=>p.transfer==='จุดพบญาติ').length;
  document.getElementById('donut-pat-total').textContent=patients.length;
  document.getElementById('pl-triage').textContent=pTriage;
  document.getElementById('pl-hosp').textContent=pHosp;
  document.getElementById('pl-home').textContent=pHome;
  document.getElementById('pl-family').textContent=pFamily;

  if(cTriage)cTriage.destroy();
  cTriage=new Chart(document.getElementById('chartTriage').getContext('2d'),{type:'bar',data:{labels:['🟢 เขียว','🟡 เหลือง','🔴 แดง','⚫ ดำ'],datasets:[{label:'ราย',data:[g,y,r,b],backgroundColor:['#22c55e','#f59e0b','#ef4444','#6b7280'],borderRadius:5,borderSkipped:false}]},options:{...CFG,indexAxis:'y',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.parsed.x} ราย`}}},scales:{x:{ticks:{color:'#94a3b8',stepSize:1},grid:{color:'#334155'},beginAtZero:true},y:{ticks:{color:'#94a3b8',font:{size:12}},grid:{color:'#0f172a'}}}}});

  if(cPatSt)cPatSt.destroy();
  cPatSt=new Chart(document.getElementById('chartPatStatus').getContext('2d'),{type:'doughnut',data:{labels:['อยู่จุดคัดแยก','ส่ง รพ.','กลับบ้าน','จุดพบญาติ'],datasets:[{data:[pTriage||0,pHosp||0,pHome||0,pFamily||0],backgroundColor:['#f59e0b','#3b82f6','#22c55e','#df1bbe'],borderColor:'#1e293b',borderWidth:3,hoverOffset:4}]},options:{...CFG,cutout:'65%',plugins:{legend:{display:false},tooltip:{callbacks:{label:c=>`${c.label}: ${c.parsed} ราย`}}}}});

  if(cPolar)cPolar.destroy();
  cPolar=new Chart(document.getElementById('chartCasePolar').getContext('2d'),{type:'polarArea',data:{labels:['เขียว','เหลือง','แดง','ดำ'],datasets:[{data:[g||0,y||0,r||0,b||0],backgroundColor:['#22c55e55','#f59e0b55','#ef444455','#6b728055'],borderColor:['#22c55e','#f59e0b','#ef4444','#6b7280'],borderWidth:2}]},options:{...CFG,plugins:{legend:{position:'right',labels:{color:'#94a3b8',font:{size:11},padding:10,boxWidth:10}}},scales:{r:{ticks:{color:'#475569',backdropColor:'transparent',stepSize:1},grid:{color:'#334155'},beginAtZero:true}}}});
  
 // คำนวณ manpower รวมตามสถานะรถ
  const manpowerCheckin = vehicles
  .filter(v => v.status === 'อยู่จุดเช็คอิน')
  .reduce((sum, v) => sum + (parseInt(v.crew) || 0), 0);

  const manpowerOut = vehicles
  .filter(v => v.status === 'ออกปฏิบัติงาน')
  .reduce((sum, v) => sum + (parseInt(v.crew) || 0), 0);

  if (cManpower) cManpower.destroy();
    cManpower = new Chart(document.getElementById('chartManpower').getContext('2d'), {
    type: 'bar',
    data: {
      labels: ['อยู่จุดเช็คอิน', 'ออกปฏิบัติงาน'],
      datasets: [{
      label: 'จำนวนคน (รวม)',
      data: [manpowerCheckin, manpowerOut],
      backgroundColor: ['#22c55e', '#f59e0b'],
      borderRadius: 5,
      borderSkipped: false,
      }]
    },
    options: {
      ...CFG,
      layout: {
      padding: { top: 24 }   // เผื่อพื้นที่ด้านบนสำหรับแสดงตัวเลข
      },
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: c => `${c.parsed.y} คน` } },
        // กำหนดการแสดงป้ายข้อมูลบนแท่งกราฟ
        datalabels: {
        anchor: 'end',        // ยึดที่ปลายแท่ง
        align: 'top',         // วางเหนือแท่ง
        offset: 4,            // ระยะห่างจากแท่ง
        color: '#ffffff',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: 4,
        padding: { left: 6, right: 6, top: 2, bottom: 2 },
        font: { weight: 'bold', size: 13, family: 'Sarabun' },
        formatter: (value) => value > 0 ? `${value} คน` : ''
        }
      },
      scales: {
      x: { ticks: { color: '#94a3b8', font: { size: 14 } }, grid: { color: '#0f172a' } },
      y: { ticks: { color: '#94a3b8', stepSize: 1 }, grid: { color: '#334155' }, beginAtZero: true }
      }
   }
  });
}

function renderAll(){renderDash();renderVTable();renderPTable()}

function exportVehicles(){
  if(!vehicles.length){alert('ไม่มีข้อมูลรถ');return}
  const ws=XLSX.utils.json_to_sheet(vehicles.map((v,i)=>({'ลำดับ':i+1,'ชนิดรถ':v.type,'เลขทะเบียน':v.plate,'จำนวนคนประจำรถ':v.crew||'-','สังกัด':v.dept||'-','โทรศัพท์':v.phone||'-','สถานะ':v.status,'เวลาบันทึก':v.time||'-','อัปเดต':v.updated||'-'})));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'ข้อมูลรถ');
  XLSX.writeFile(wb,'ข้อมูลรถ_'+new Date().toLocaleDateString('th-TH').replace(/\//g,'-')+'.xlsx');
  toast('📥 Export รถสำเร็จ');
}
function exportPatients(){
  if(!patients.length){alert('ไม่มีข้อมูลผู้ป่วย');return}
  const ws=XLSX.utils.json_to_sheet(patients.map((p,i)=>({'ลำดับ':i+1,'ชื่อ-นามสกุล':p.name,'ระดับเคส':p.cas,'อาการเบื้องต้น':p.status||'-','สถานะ':p.transfer,'หมายเหตุ':p.note||'-','เวลาบันทึก':p.time||'-','อัปเดต':p.updated||'-'})));
  const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'ข้อมูลผู้ป่วย');
  XLSX.writeFile(wb,'ข้อมูลผู้ป่วย_'+new Date().toLocaleDateString('th-TH').replace(/\//g,'-')+'.xlsx');
  toast('📥 Export ผู้ป่วยสำเร็จ');
}
