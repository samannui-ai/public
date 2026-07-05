  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
  import { getDatabase, ref, set, push, remove, update, onValue } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-database.js";
  import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";

  // ══════════════════════════════════════════════════════
  //  🔧 ตั้งค่า Firebase config เอามาจาก Firebase Console
  // ══════════════════════════════════════════════════════
  const firebaseConfig = {
    apiKey: "AIzaSyAgGRJ3Fs6lm5WbNCZjecrOAafZbhHPJYk",
    authDomain: "eocairports.firebaseapp.com",
    projectId: "eocairports",
    databaseURL: "https://eocairports-default-rtdb.asia-southeast1.firebasedatabase.app/",
    storageBucket: "eocairports.firebasestorage.app",
    messagingSenderId: "423221533749",
    appId: "1:423221533749:web:13564b98b638fa57c0e57c",
    measurementId: "G-KV4JGSFZ68"
  };
  // ══════════════════════════════════════════════════════

  const app = initializeApp(firebaseConfig);
  const db = getDatabase(app);
  const auth = getAuth(app);

  // expose ไปยัง global scope เพื่อให้ฟังก์ชันอื่นเรียกได้
  window._db = db;
  window._ref = ref;
  window._set = set;
  window._push = push;
  window._remove = remove;
  window._update = update;
  window._onValue = onValue;
  window._auth = auth;
  window._signOut = signOut;
  window._firebaseReady = true;

  // ─── Real-time listeners ───────────────────────────────
  let vehiclesUnsub = null;
  let patientsUnsub = null;

  function startListeners() {
    vehiclesUnsub = onValue(ref(db, 'vehicles'), (snapshot) => {
      const data = snapshot.val();
      vehicles = data ? Object.entries(data).map(([k, v]) => ({ ...v, _key: k })) : [];
      renderAll();
    });
    patientsUnsub = onValue(ref(db, 'patients'), (snapshot) => {
      const data = snapshot.val();
      patients = data ? Object.entries(data).map(([k, v]) => ({ ...v, _key: k })) : [];
      renderAll();
    });
  }

  // ─── ติดตามสถานะ Auth แบบ real-time ───────────────────
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // ล็อกอินแล้ว → แสดงแอป
      document.getElementById('loginScreen').style.display = 'none';
      document.getElementById('app').style.display = 'flex';
      if (typeof updateDate === 'function') updateDate();
      startListeners();
    } else {
      // ออกจากระบบแล้ว → แสดงหน้า login
      document.getElementById('loginScreen').style.display = 'flex';
      document.getElementById('app').style.display = 'none';
      vehicles = [];
      patients = [];
    }
  });

  // ─── ฟังก์ชัน login ด้วย Firebase Auth ───────────────
  window.doLogin = async function() {
    const email = document.getElementById('emailInput').value.trim();
    const password = document.getElementById('pwInput').value;
    const errMsg = document.getElementById('loginErr');
    const btn = document.querySelector('#loginScreen .btn-primary');

    errMsg.style.display = 'none';
    if (!email || !password) {
      errMsg.innerText = 'กรุณากรอกอีเมลและรหัสผ่าน';
      errMsg.style.display = 'block';
      return;
    }
    btn.disabled = true;
    btn.textContent = 'กำลังเข้าสู่ระบบ...';
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged จะจัดการแสดงแอปให้อัตโนมัติ
    } catch (error) {
      const msgs = {
        'auth/invalid-email': 'รูปแบบอีเมลไม่ถูกต้อง',
        'auth/user-not-found': 'ไม่พบผู้ใช้งานนี้ในระบบ',
        'auth/wrong-password': 'รหัสผ่านไม่ถูกต้อง',
        'auth/invalid-credential': 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
        'auth/too-many-requests': 'ล็อกอินผิดหลายครั้ง กรุณารอสักครู่แล้วลองใหม่',
        'auth/network-request-failed': 'ไม่สามารถเชื่อมต่อเครือข่ายได้',
      };
      errMsg.innerText = msgs[error.code] || 'เกิดข้อผิดพลาด: ' + error.message;
      errMsg.style.display = 'block';
    } finally {
      btn.disabled = false;
      btn.textContent = 'เข้าสู่ระบบ';
    }
  };

  // ─── ฟังก์ชัน logout ───────────────────────────────────
  window.doLogout = async function() {
    try {
      await signOut(auth);
      document.getElementById('pwInput').value = '';
      document.getElementById('emailInput').value = '';
    } catch (e) {
      console.error('Logout error:', e);
    }
  };
