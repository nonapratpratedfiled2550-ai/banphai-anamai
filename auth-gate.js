/**
 * โหลดก่อน student-basic-data.js (ไฟล์ใหญ่) — ให้หน้า Welcome คลิกได้ทันที
 */
(function (w) {
  if (w.__shAuthGate) return;

  var ROLES = {
    nurse: { name: 'เจ้าหน้าที่อนามัย / พยาบาล' },
    teacher: { name: 'ครู / อาจารย์ที่ปรึกษา' },
    nursing_student: { name: 'นักเรียนพยาบาล' },
    student: { name: 'นักเรียน / ผู้ปกครอง' },
    admin: { name: 'ผู้บริหารโรงเรียน' }
  };

  function openModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.add('open');
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) m.classList.remove('open');
  }

  w.openStaffLogin = function (roleKey) {
    if (w.__shMainReady && w._openStaffLoginImpl) return w._openStaffLoginImpl(roleKey);
    if (!ROLES[roleKey] || roleKey === 'student') return;
    w.__pendingStaffRoleEarly = roleKey;
    var sub = document.getElementById('staffLoginSub');
    var err = document.getElementById('staffLoginError');
    var u = document.getElementById('staffLoginUser');
    var p = document.getElementById('staffLoginPass');
    if (u) u.value = '';
    if (p) p.value = '';
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    if (sub) sub.textContent = ROLES[roleKey].name;
    openModal('staffLoginModal');
    if (u) u.focus();
  };

  w.openStudentLogin = function () {
    if (w.__shMainReady && w._openStudentLoginImpl) return w._openStudentLoginImpl();
    var err = document.getElementById('studentLoginError');
    var u = document.getElementById('studentLoginUser');
    var p = document.getElementById('studentLoginPass');
    if (u) u.value = '';
    if (p) p.value = '';
    if (err) { err.style.display = 'none'; err.textContent = ''; }
    openModal('studentLoginModal');
    if (u) u.focus();
  };

  w.closeStaffLogin = function () {
    if (w.__shMainReady && w._closeStaffLoginImpl) return w._closeStaffLoginImpl();
    closeModal('staffLoginModal');
    w.__pendingStaffRoleEarly = '';
  };

  w.closeStudentLogin = function () {
    if (w.__shMainReady && w._closeStudentLoginImpl) return w._closeStudentLoginImpl();
    closeModal('studentLoginModal');
  };

  function applyEarlyGuestSidebar(guestMode) {
    var knowledgeSection = document.getElementById('sidebar-knowledge-section');
    if (knowledgeSection) knowledgeSection.style.display = (guestMode === 'knowledge') ? '' : 'none';
    var infoSection = document.getElementById('sidebar-info-section');
    if (infoSection) infoSection.style.display = (guestMode === 'info') ? '' : 'none';
    var publicSection = document.getElementById('sidebar-public-section');
    if (publicSection) publicSection.style.display = (guestMode === 'public') ? '' : 'none';
    var dataSection = document.getElementById('sidebar-data-section');
    if (dataSection) dataSection.style.display = 'none';
    document.querySelectorAll('#sidebar > .sidebar-section').forEach(function (sec) {
      if (sec.id === 'sidebar-public-section' || sec.id === 'sidebar-info-section' ||
          sec.id === 'sidebar-data-section' || sec.id === 'sidebar-knowledge-section') return;
      sec.style.display = 'none';
    });
    document.querySelectorAll('[data-staff-only]').forEach(function (el) { el.style.display = 'none'; });
  }

  w.enterGuestAccess = function (mode) {
    if (w.__shMainReady && w._enterGuestAccessImpl) return w._enterGuestAccessImpl(mode);
    var guestMode = mode === 'public' ? 'public' : (mode === 'info' ? 'info' : 'knowledge');
    var screen = document.getElementById('role-screen');
    if (screen) screen.classList.add('role-screen-hidden');
    var badge = document.getElementById('roleBadge');
    if (badge) {
      badge.style.display = '';
      if (guestMode === 'public') badge.textContent = 'บุคคลทั่วไป';
      else if (guestMode === 'info') badge.textContent = 'สารสนเทศ';
      else badge.textContent = 'ความรู้ด้านอนามัย';
      badge.title = badge.textContent;
    }
    document.querySelectorAll('.section-panel').forEach(function (p) { p.classList.remove('active'); });
    document.querySelectorAll('.nav-item').forEach(function (n) { n.classList.remove('active'); });
    var sid = guestMode === 'public' ? 'public' : (guestMode === 'info' ? 'gshps' : 'knowledge');
    var panel = document.getElementById('section-' + sid);
    if (panel) panel.classList.add('active');
    applyEarlyGuestSidebar(guestMode);
    var main = document.querySelector('.main');
    if (main) main.scrollTop = 0;
    /* รอสคริปต์หลักโหลดจบ แล้วค่อย render เนื้อหา (บทความ/วิดีโอ) */
    w.__pendingGuestMode = guestMode;
    w.__pendingShowSection = sid;
  };

  /**
   * run() ต้องคืนค่า:
   *   true  = ล็อกอินสำเร็จ → ปิด modal / ซ่อน Welcome
   *   false = รหัสผิดหรือกรอกไม่ครบ → คง modal + Welcome ไว้
   *   'wait' = ยังไม่พร้อม (เช่น ข้อมูลนักเรียนยังไม่โหลด) → รอต่อ
   */
  function whenMainReady(run, loadingMsg, btnSelector) {
    var btn = btnSelector ? document.querySelector(btnSelector) : null;
    var btnText = btn ? btn.textContent : '';
    function restoreBtn() {
      if (btn) { btn.disabled = false; btn.textContent = btnText; }
    }
    function onLoginSuccess() {
      restoreBtn();
      closeModal('staffLoginModal');
      closeModal('studentLoginModal');
      var rs = document.getElementById('role-screen');
      if (rs) rs.classList.add('role-screen-hidden');
    }
    function tryRun() {
      try {
        return run();
      } catch (e) {
        console.error('[SH auth-gate]', e);
        restoreBtn();
        alert('เข้าสู่ระบบไม่สำเร็จ กรุณารีเฟรชหน้าแล้วลองใหม่');
        return 'error';
      }
    }
    function handleResult(ok) {
      if (ok === true) {
        onLoginSuccess();
        return 'done';
      }
      if (ok === false) {
        restoreBtn();
        return 'done';
      }
      if (ok === 'error') return 'done';
      return 'wait';
    }

    var waited = 0;
    var step = 120;
    var maxWait = 60000;
    if (btn && loadingMsg) {
      btn.disabled = true;
      btn.textContent = loadingMsg;
    }
    (function tick() {
      if (w.__shMainReady) {
        var status = handleResult(tryRun());
        if (status === 'done') return;
      }
      waited += step;
      if (waited >= maxWait) {
        restoreBtn();
        alert('ระบบกำลังโหลดข้อมูล กรุณารอสักครู่แล้วลองใหม่');
        return;
      }
      setTimeout(tick, step);
    })();
  }

  w.showSection = function (id) {
    if (w.__shMainReady && w._showSectionImpl) return w._showSectionImpl(id);
    w.__pendingShowSection = id;
  };

  w.submitStaffLogin = function () {
    whenMainReady(function () {
      if (!w._submitStaffLoginImpl) return 'wait';
      return w._submitStaffLoginImpl() ? true : false;
    }, 'กำลังโหลดระบบ...', '#staffLoginModal .student-login-submit');
  };

  w.submitStudentLogin = function () {
    whenMainReady(function () {
      if (typeof w.STUDENT_BASIC === 'undefined') return 'wait';
      if (!w._submitStudentLoginImpl) return 'wait';
      return w._submitStudentLoginImpl() ? true : false;
    }, 'กำลังโหลดข้อมูลนักเรียน...', '#studentLoginModal .student-login-submit');
  };

  w.__shAuthGate = true;
})(window);
