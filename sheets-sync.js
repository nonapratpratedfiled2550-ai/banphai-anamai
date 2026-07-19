/**
 * ส่งข้อมูลจากเว็บไซต์ → Google Sheets (Apps Script Web App)
 */
var SHEETS_CONFIG = {
  ENABLED: true,
  SPREADSHEET_ID: '15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw',
  WEB_APP_URL: 'https://script.google.com/macros/s/AKfycbz5VTou4-dFWVf-oHIgemDnsJopq9br_dKZnSLpSuzvllfHYBp_hSbi1LO6kn2qNUQciw/exec',
  QUEUE_KEY: 'sh-sheets-queue',
  IS_WORKSPACE: false
};

var SHEET_NAMES = {
  visit: 'บันทึกการรักษา',
  nutrition: 'ภาวะโภชนาการ',
  vaccine: 'วัคซีน',
  chronic: 'โรคเรื้อรัง',
  diseaseStudent: 'รายงานโรคติดต่อ_นักเรียน',
  diseaseStaff: 'รายงานโรคติดต่อ_เจ้าหน้าที่',
  emergency: 'เหตุฉุกเฉิน',
  referral: 'ส่งต่อและติดตาม',
  environment: 'อนามัยสิ่งแวดล้อม',
  mental: 'สุขภาพจิต',
  mentalTeacher: 'ผลตรวจคัดกรอง_ครู',
  appointment: 'ใบนัด',
  screening: 'ตรวจคัดกรอง',
  calendar: 'ปฏิทินโรงเรียน',
  medicine: 'คลังยา',
  nurseAlert: 'แจ้งเตือนงานอนามัย',
  knowledge: 'ความรู้ด้านอนามัย',
  studentHealth: 'ข้อมูลสุขภาพนักเรียน',
  studentRegistry: 'ทะเบียนนักเรียน',
  teacherRegistry: 'ทะเบียนครู',
  studentBasicInfo: 'ข้อมูลพื้นฐานนักเรียน',
  teacherBasicInfo: 'ข้อมูลพื้นฐานครู',
  studentTreatmentHistory: 'ประวัติการรักษานักเรียน',
  teacherTreatmentHistory: 'ประวัติการรักษาครู'
};

var STUDENT_ID_SHEET_KEY = '\u0e23\u0e2b\u0e31\u0e2a\u0e19\u0e31\u0e01\u0e40\u0e23\u0e35\u0e22\u0e19';

function getSyncRoleLabel() {
  if (typeof getCurrentRole !== 'function') return '';
  var map = {
    nurse: 'เจ้าหน้าที่อนามัย',
    teacher: 'ครู',
    admin: 'ผู้บริหาร',
    student: 'นักเรียน'
  };
  return map[getCurrentRole()] || getCurrentRole() || '';
}

function ensureSheetSyncDom_() {
  if (document.getElementById('sheet-sync-form')) return;
  var form = document.createElement('form');
  form.id = 'sheet-sync-form';
  form.method = 'POST';
  form.action = SHEETS_CONFIG.WEB_APP_URL;
  form.target = 'sheet-sync-frame';
  form.style.display = 'none';
  form.setAttribute('accept-charset', 'UTF-8');
  var input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'payload';
  form.appendChild(input);
  document.body.appendChild(form);
  var iframe = document.createElement('iframe');
  iframe.id = 'sheet-sync-frame';
  iframe.name = 'sheet-sync-frame';
  iframe.title = 'sheet-sync';
  iframe.style.cssText = 'display:none;width:0;height:0;border:0';
  document.body.appendChild(iframe);
}

function showSheetToast_(msg, isError) {
  var el = document.getElementById('sheet-sync-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'sheet-sync-toast';
    el.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;max-width:320px;padding:10px 14px;border-radius:10px;font-size:13px;line-height:1.4;box-shadow:0 4px 16px rgba(0,0,0,.15);display:none';
    document.body.appendChild(el);
  }
  el.style.background = isError ? '#fef2f2' : '#ecfdf5';
  el.style.color = isError ? '#991b1b' : '#065f46';
  el.style.border = isError ? '1px solid #fecaca' : '1px solid #a7f3d0';
  el.textContent = msg;
  el.style.display = 'block';
  clearTimeout(el._hideTimer);
  el._hideTimer = setTimeout(function() { el.style.display = 'none'; }, isError ? 8000 : 4000);
}

function loadSheetQueue_() {
  try { return JSON.parse(localStorage.getItem(SHEETS_CONFIG.QUEUE_KEY) || '[]'); } catch (e) { return []; }
}

function saveSheetQueue_(items) {
  try { localStorage.setItem(SHEETS_CONFIG.QUEUE_KEY, JSON.stringify(items)); } catch (e) {}
}

function enqueueSheetSync_(payload) {
  var q = loadSheetQueue_();
  q.push(Object.assign({ at: Date.now() }, payload));
  saveSheetQueue_(q);
}

function buildPayload_(sheetName, row, options) {
  var payload = { sheet: sheetName, row: row };
  if (options && options.action) payload.action = options.action;
  if (options && options.matchKey) payload.matchKey = options.matchKey;
  return payload;
}

function syncToSheet(sheetName, row) {
  return syncPayload_(buildPayload_(sheetName, row));
}

function syncViaHiddenForm_(payload) {
  ensureSheetSyncDom_();
  var form = document.getElementById('sheet-sync-form');
  form.action = SHEETS_CONFIG.WEB_APP_URL;
  form.querySelector('input[name="payload"]').value = JSON.stringify(payload);
  form.submit();
}

function syncViaPopup_(payload) {
  var url = SHEETS_CONFIG.WEB_APP_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  var w = window.open(url, 'sh_sheet_sync', 'width=480,height=200,left=100,top=100');
  setTimeout(function() {
    try { if (w && !w.closed) w.close(); } catch (e) {}
  }, 4000);
}

function parseSheetApiResponse_(text) {
  if (!text) throw new Error('EMPTY_RESPONSE');
  try {
    var data = JSON.parse(text);
    if (data && data.error) throw new Error(data.error);
    return data;
  } catch (e) {
    if (e && e.message && e.message !== 'Unexpected token' && e.message.indexOf('JSON') === -1) throw e;
    if (text.indexOf('"ok":true') !== -1 || text.indexOf('"ok": true') !== -1) {
      return { ok: true, parsedFromHtml: true };
    }
    throw new Error('BAD_RESPONSE');
  }
}

function shrinkRowForGet_(row) {
  var out = {};
  if (!row || typeof row !== 'object') return out;
  Object.keys(row).forEach(function(k) {
    var v = row[k];
    if (v === undefined || v === null) return;
    if (typeof v === 'string' && v.trim() === '') return;
    out[k] = v;
  });
  return out;
}

function compactPayloadForGet_(payload) {
  if (!payload) return null;
  var next = Object.assign({}, payload);
  if (payload.row && typeof payload.row === 'object') {
    next.row = shrinkRowForGet_(payload.row);
    // ต้องมีคีย์จับคู่เสมอ
    if (payload.matchKey && payload.row[payload.matchKey] != null && payload.row[payload.matchKey] !== '') {
      next.row[payload.matchKey] = payload.row[payload.matchKey];
    } else if (payload.matchKey === 'รหัสรายการ') {
      /* ห้ามใส่รหัสนักเรียนแทนรหัสรายการ — ทำให้ upsert ผิดแถว */
    } else if (payload.row.id != null && payload.row.id !== '') {
      next.row.id = payload.row.id;
      if (payload.matchKey) next.row[payload.matchKey] = payload.row.id;
    }
  }
  if (payload.matchValue != null) next.matchValue = payload.matchValue;
  return next;
}

function syncViaFetch_(payload) {
  return fetch(SHEETS_CONFIG.WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(function(res) {
    return res.text().then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
        throw new Error('AUTH_REQUIRED');
      }
      if (text.indexOf('Error 411') !== -1 || text.indexOf('Length Required') !== -1) {
        throw new Error('LENGTH_REQUIRED');
      }
      return parseSheetApiResponse_(text);
    });
  });
}

/**
 * POST แบบอ่าน Location เอง — กันกรณี redirect แล้วได้นหน้า ping ปลอม
 */
function syncViaFetchPostRedirectSafe_(payload) {
  return fetch(SHEETS_CONFIG.WEB_APP_URL, {
    method: 'POST',
    mode: 'cors',
    redirect: 'manual',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  }).then(function(res) {
    if (res.ok) {
      return res.text().then(function(text) {
        if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
          throw new Error('AUTH_REQUIRED');
        }
        return parseSheetApiResponse_(text);
      });
    }
    if (res.status >= 300 && res.status < 400) {
      var loc = null;
      try { loc = res.headers.get('Location'); } catch (e) { loc = null; }
      if (loc) {
        return fetch(loc, { method: 'GET', mode: 'cors', redirect: 'follow', cache: 'no-store' })
          .then(function(r2) { return r2.text(); })
          .then(function(text) {
            if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
              throw new Error('AUTH_REQUIRED');
            }
            return parseSheetApiResponse_(text);
          });
      }
      throw new Error('POST_REDIRECT_NO_LOCATION');
    }
    if (res.type === 'opaqueredirect' || res.status === 0) {
      throw new Error('OPAQUE_REDIRECT');
    }
    throw new Error('POST_STATUS_' + res.status);
  });
}

/** GET + ?payload= — เสถียรกับ Apps Script CORS และตรวจผล JSON จริงได้ */
function syncViaFetchGet_(payload) {
  var url = SHEETS_CONFIG.WEB_APP_URL +
    (SHEETS_CONFIG.WEB_APP_URL.indexOf('?') >= 0 ? '&' : '?') +
    'payload=' + encodeURIComponent(JSON.stringify(payload));
  if (url.length > 8000) {
    return Promise.reject(new Error('PAYLOAD_TOO_LARGE_FOR_GET'));
  }
  return fetch(url, {
    method: 'GET',
    mode: 'cors',
    redirect: 'follow',
    cache: 'no-store'
  }).then(function(res) {
    return res.text().then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
        throw new Error('AUTH_REQUIRED');
      }
      return parseSheetApiResponse_(text);
    });
  });
}

function isIdlePingResponse_(res) {
  return !!(res && res.ok && res.message &&
    String(res.message).indexOf('API is running') !== -1 &&
    !res.upserted && !res.deleted && res.count == null && !res.columnCount);
}

function isVerifiedSheetOk_(res) {
  // ห้ามถือว่าสำเร็จจากหน้า ping {ok:true,message:"API is running"}
  // (เกิดเมื่อ POST ถูก redirect แล้วเบราว์เซอร์เปลี่ยนเป็น GET โดยไม่มี body)
  if (!res || res.ok !== true || res.error || res.parsedFromHtml || res.unverified) return false;
  if (isIdlePingResponse_(res)) return false;
  return true;
}

function isVerifiedWriteOk_(res) {
  if (!isVerifiedSheetOk_(res)) return false;
  if (res.upserted || res.deleted || res.appended) return true;
  if (res.row != null && res.sheet) return true;
  if (typeof res.count === 'number' && res.count >= 0 && res.sheet) return true;
  if (res.columnCount != null && res.sheet) return true; // ensureSchema
  return false;
}

function pingSheetsApi_() {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL) {
    return Promise.resolve({ ok: false, error: 'DISABLED' });
  }
  var url = SHEETS_CONFIG.WEB_APP_URL +
    (SHEETS_CONFIG.WEB_APP_URL.indexOf('?') >= 0 ? '&' : '?') +
    '_ping=' + Date.now();
  return fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow', cache: 'no-store' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) {
        return { ok: false, error: 'AUTH_REQUIRED' };
      }
      var data = parseSheetApiResponse_(text);
      if (data && data.ok) return { ok: true, ping: true, message: data.message || '' };
      return data || { ok: false, error: 'BAD_PING' };
    })
    .catch(function(err) {
      return { ok: false, error: 'NETWORK', detail: String(err && err.message || err || '') };
    });
}

function isSheetTransportError_(msg) {
  msg = String(msg || '');
  return /PAYLOAD_TOO_LARGE|OPAQUE_REDIRECT|AUTH_REQUIRED|NETWORK|FAILED_TO_FETCH|TypeError|BAD_RESPONSE|EMPTY_RESPONSE|POST_|LENGTH_REQUIRED|REDIRECT_LOST|NOT_OK|START|SKIP_FULL|CORS|FORM_UNVERIFIED|Load failed|Failed to fetch/i.test(msg);
}

function describeSheetSyncFailure_(errors, apiReachable) {
  errors = (errors || []).filter(Boolean);
  var joined = errors.join(' | ');
  if (errors.indexOf('AUTH_REQUIRED') !== -1 || /Sign in|AccountChooser/i.test(joined)) {
    return 'Web App ยังต้องล็อกอิน — ใน Deploy ให้ตั้ง Who has access เป็น Anyone แล้วกด Deploy ใหม่';
  }
  if (errors.indexOf('no_entry') !== -1 || errors.indexOf('no_row') !== -1) {
    return 'ไม่พบข้อมูลนักเรียนในระบบสำหรับส่งไปชีต';
  }
  // error จาก Apps Script (เช่น เซลล์รวม) — โชว์ข้อความจริง ไม่กลบเป็น FORM_UNVERIFIED
  var serverErr = null;
  for (var i = 0; i < errors.length; i++) {
    if (!isSheetTransportError_(errors[i])) {
      serverErr = errors[i];
      break;
    }
  }
  if (serverErr) {
    var short = String(serverErr);
    if (/10000000|เซลล์ที่จำกัด|exceed.*cell/i.test(short)) {
      return 'Google Sheet เต็มลิมิตเซลล์ (10 ล้าน) — ลบชีต/แถวว่างที่ไม่ได้ใช้ แล้ว Deploy สคริปต์เวอร์ชันใหม่';
    }
    if (short.length > 120) short = short.slice(0, 117) + '...';
    return 'บันทึกลงชีตไม่สำเร็จ — ' + short +
      ( /แถว|merged|ช่วง/i.test(serverErr)
        ? ' (ตรวจเซลล์รวมในชีต หรือ Deploy สคริปต์เวอร์ชันใหม่)'
        : '' );
  }
  if (apiReachable) {
    return 'API เชื่อมได้แล้ว แต่บันทึกลงชีตไม่สำเร็จ — ลองบันทึกอีกครั้ง' +
      (errors.length ? ' (' + errors[0] + ')' : '');
  }
  if (errors.indexOf('NETWORK') !== -1 || errors.indexOf('FORM_UNVERIFIED') !== -1) {
    return 'เชื่อมต่อ Apps Script ไม่สำเร็จ (เครือข่าย/CORS) — รีเฟรชหน้าแล้วลองใหม่';
  }
  if (errors.length) return 'ส่งชีตไม่สำเร็จ — ' + errors[0];
  return 'ส่ง Google Sheet ไม่สำเร็จ — ลองบันทึกอีกครั้ง';
}

var _sheetFormSyncChain = Promise.resolve();

function syncViaFormQueued_(payload) {
  var rowCount = (payload.rows && payload.rows.length)
    || (payload.action === 'upsertRow' ? 1 : 0);
  var waitMs = payload.action === 'batchUpsertRows'
    ? Math.max(1500, 800 + rowCount * 120)
    : (payload.action === 'upsertRow' || payload.action === 'deleteRow' || payload.action === 'deleteVisit' ? 1600 : 800);
  return new Promise(function(resolve) {
    _sheetFormSyncChain = _sheetFormSyncChain
      .catch(function() { /* keep queue alive */ })
      .then(function() {
        return new Promise(function(done) {
          ensureSheetSyncDom_();
          var form = document.getElementById('sheet-sync-form');
          form.action = SHEETS_CONFIG.WEB_APP_URL;
          form.querySelector('input[name="payload"]').value = JSON.stringify(payload);
          form.submit();
          setTimeout(done, waitMs);
        });
      })
      .then(function() {
        var result = { ok: true, method: 'form', unverified: true };
        if (rowCount > 0) result.count = rowCount;
        resolve(result);
      })
      .catch(function(err) {
        resolve({ ok: false, method: 'form', error: String(err && err.message || err || '') });
      });
  });
}

/**
 * ลำดับที่เชื่อถือได้สำหรับ Apps Script (แก้ FORM_UNVERIFIED):
 * 1) GET payload แบบย่อ (สั้น ผ่าน CORS ได้)
 * 2) GET payload เต็ม (ถ้ายังสั้นพอ)
 * 3) POST แบบตาม Location เอง
 * 4) POST ปกติ
 * 5) form แล้วยืนยันด้วย GET ย่ออีกครั้ง
 */
function syncPayload_(payload) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL) {
    return Promise.resolve({ ok: false, skipped: true });
  }

  if (SHEETS_CONFIG.IS_WORKSPACE || SHEETS_CONFIG.WEB_APP_URL.indexOf('/a/macros/') !== -1) {
    if (!(payload && payload.silent)) {
      showSheetToast_('กำลังส่งไป Google Sheet... ถ้าขึ้นหน้า Google ให้ล็อกอิน @banphai.ac.th');
    }
  }

  var isWrite = payload && (payload.action === 'upsertRow' || payload.action === 'appendRow' ||
    payload.action === 'deleteRow' ||
    payload.action === 'deleteVisit' ||
    payload.action === 'batchUpsertRows' || payload.action === 'upsertAppointment' ||
    payload.action === 'upsertMental' || payload.action === 'deleteAppointment');

  function accept(res, method) {
    var ok = isWrite ? isVerifiedWriteOk_(res) : isVerifiedSheetOk_(res);
    if (!ok) throw new Error((res && (res.error || (isIdlePingResponse_(res) ? 'REDIRECT_LOST_BODY' : 'NOT_OK'))) || 'NOT_OK');
    var isQuiet = payload && (payload.silent || payload.action === 'ensureSchema' ||
      payload.action === 'upsertRow' || payload.action === 'deleteRow' || payload.action === 'deleteVisit');
    if (ok && !isQuiet) showSheetToast_('ส่ง Google Sheet สำเร็จ');
    if (res) res.method = method;
    return res;
  }

  function tryGet(p, method) {
    return syncViaFetchGet_(p).then(function(res) { return accept(res, method); });
  }

  function formThenConfirm(err) {
    var msg = String(err && err.message || err || '');
    if (msg === 'AUTH_REQUIRED') {
      return Promise.resolve({ ok: false, error: 'AUTH_REQUIRED', method: 'form', unverified: true });
    }
    // error จากเซิร์ฟเวอร์แล้ว — ไม่ต้องซ่อนด้วย form
    if (msg && !isSheetTransportError_(msg)) {
      return Promise.resolve({ ok: false, error: msg, method: 'server', formAttempted: false });
    }
    return syncViaFormQueued_(payload).then(function() {
      var compact = compactPayloadForGet_(payload);
      if (!compact) {
        return {
          ok: false,
          method: 'form',
          unverified: true,
          error: 'FORM_UNVERIFIED',
          fallbackError: msg,
          formAttempted: true
        };
      }
      // form อาจเขียนแล้ว — ยืนยัน/เขียนซ้ำด้วย GET ย่อที่อ่านผลได้
      return tryGet(compact, 'form+get-confirm').catch(function(confirmErr) {
        var confirmMsg = String(confirmErr && confirmErr.message || confirmErr || msg);
        return {
          ok: false,
          method: 'form',
          unverified: true,
          error: isSheetTransportError_(confirmMsg) ? 'FORM_UNVERIFIED' : confirmMsg,
          fallbackError: confirmMsg,
          formAttempted: true
        };
      });
    });
  }

  if (isWrite) {
    var compact = compactPayloadForGet_(payload);
    /* POST ก่อน GET — Apps Script รับ POST ได้เสถียรกว่า (GET ยาว/redirect มักล้มเหลว) */
    var chain = syncViaFetchPostRedirectSafe_(payload).then(function(res) {
      return accept(res, 'fetch-post-redirect');
    }).catch(function(err) {
      var msg = String(err && err.message || err || '');
      if (msg && !isSheetTransportError_(msg)) return Promise.reject(err);
      return syncViaFetch_(payload).then(function(res) {
        return accept(res, 'fetch-post');
      });
    });
    if (compact) {
      chain = chain.catch(function(err) {
        var msg = String(err && err.message || err || '');
        if (msg && !isSheetTransportError_(msg)) return Promise.reject(err);
        return tryGet(compact, 'fetch-get-compact');
      });
    }
    chain = chain.catch(function(err) {
      var msg = String(err && err.message || err || '');
      if (msg && !isSheetTransportError_(msg) && msg !== 'START') {
        return Promise.reject(err);
      }
      if (compact && payload.row && JSON.stringify(compact.row) === JSON.stringify(shrinkRowForGet_(payload.row))) {
        return Promise.reject(new Error('SKIP_FULL_GET'));
      }
      return tryGet(payload, 'fetch-get-full');
    });
    return chain.catch(function(err) {
      return formThenConfirm(err);
    });
  }

  return syncViaFetch_(payload)
    .then(function(res) { return accept(res, 'fetch-post'); })
    .catch(function(postErr) {
      return syncViaFetchGet_(payload)
        .then(function(res) { return accept(res, 'fetch-get'); })
        .catch(function(getErr) {
          return formThenConfirm(getErr || postErr);
        });
    });
}

function isProfileSheetResponseOk_(res, sheetName, rowCount) {
  if (!res || !res.ok || res.error || res.parsedFromHtml || res.unverified) return false;
  var minCols = {
    'ข้อมูลพื้นฐานนักเรียน': 20,
    'ข้อมูลพื้นฐานครู': 10,
    'ประวัติการรักษานักเรียน': 10,
    'ประวัติการรักษาครู': 8
  };
  if (!rowCount) {
    if (sheetName && minCols[sheetName]) {
      return !!(res.columnCount && res.columnCount >= minCols[sheetName]);
    }
    return true;
  }
  if (typeof res.count === 'number' && res.count > 0) return true;
  if (res.upserted && typeof res.count === 'number' && res.count > 0) return true;
  if (res.method === 'upsertRow' && typeof res.count === 'number' && res.count > 0) return true;
  // upsertRow เดี่ยวคืน { ok, sheet, row, upserted } ไม่มี count
  if (res.upserted && res.row) return true;
  return false;
}

function ensureSheetSchemaQuiet_(sheetName) {
  if (!sheetName) return Promise.resolve({ ok: false });
  var url = SHEETS_CONFIG.WEB_APP_URL + '?action=ensureSchema&sheet=' + encodeURIComponent(sheetName);
  return fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' })
    .then(function(res) { return res.text(); })
    .then(function(text) { return parseSheetApiResponse_(text); })
    .then(function(res) {
      if (isProfileSheetResponseOk_(res, sheetName, 0)) return res;
      return syncViaFormQueued_({ action: 'ensureSchema', sheet: sheetName, silent: true }).then(function() {
        return { ok: true, columnCount: minColsForSheet_(sheetName) };
      });
    })
    .catch(function() {
      return syncViaFormQueued_({ action: 'ensureSchema', sheet: sheetName, silent: true }).then(function() {
        return { ok: true, columnCount: minColsForSheet_(sheetName) };
      });
    });
}

function minColsForSheet_(sheetName) {
  var map = {
    'ข้อมูลพื้นฐานนักเรียน': 28,
    'ข้อมูลพื้นฐานครู': 12,
    'ประวัติการรักษานักเรียน': 14,
    'ประวัติการรักษาครู': 11
  };
  return map[sheetName] || 5;
}

function syncToSheetQuiet(sheetName, row) {
  syncPayloadQuiet(buildPayload_(sheetName, row));
}

function syncPayloadQuiet(payload) {
  if (!payload) return Promise.resolve({ ok: false });
  if (payload.silent == null) payload.silent = true;
  return syncPayload_(payload).then(function(res) {
    if (isVerifiedWriteOk_(res) || isVerifiedSheetOk_(res)) return res;
    if (res && res.skipped) return res;
    enqueueSheetSync_(payload);
    if (!window._sheetAuthWarned && res && res.error === 'AUTH_REQUIRED') {
      window._sheetAuthWarned = true;
      showSheetToast_('ส่ง Sheet ไม่สำเร็จ — Web App ยังบังคับล็อกอิน (ตั้งเป็น Anyone แล้ว Deploy ใหม่)', true);
    }
    return res || { ok: false };
  }).catch(function(err) {
    enqueueSheetSync_(payload);
    console.warn('[sheets-sync] quiet sync failed', err);
    return { ok: false, error: String(err && err.message || err || '') };
  });
}

function flushSheetQueue_() {
  var q = loadSheetQueue_();
  if (!q.length || !SHEETS_CONFIG.WEB_APP_URL) return;
  var item = q[0];
  var payload;
  if (item.action) {
    payload = { action: item.action, sheet: item.sheet, matchKey: item.matchKey };
    if (item.matchValue != null) payload.matchValue = item.matchValue;
    if (item.recordId != null) payload.recordId = item.recordId;
    if (item.recordedAt != null) payload.recordedAt = item.recordedAt;
    if (item.studentId != null) payload.studentId = item.studentId;
    if (item.id != null) payload.id = item.id;
    if (item.symptom != null) payload.symptom = item.symptom;
    if (item.rows) payload.rows = item.rows;
    else if (item.row) payload.row = item.row;
  } else {
    payload = buildPayload_(item.sheet, item.row);
  }
  syncPayload_(payload).then(function(res) {
    if (isVerifiedWriteOk_(res) || (res && res.ok && res.method === 'form')) {
      q.shift();
      saveSheetQueue_(q);
      if (q.length) flushSheetQueue_();
    }
  });
}

function formatSheetDate(iso) {
  if (!iso) return '';
  if (typeof formatVacDate === 'function' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    return formatVacDate(iso);
  }
  return iso;
}

function buildVaccineSheetRow(record) {
  return {
    'รหัสรายการ': record.recordId || '',
    'เลขประจำตัว': record.id || '',
    'ชื่อนามสกุล': record.name || '',
    'วัคซีนที่ฉีด': record.vaccine || '',
    'วันที่ฉีด': formatSheetDate(record.date),
    'วันที่บันทึก': record.recordedAt || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    recordId: record.recordId || '',
    id: record.id || '',
    name: record.name || '',
    vaccine: record.vaccine || '',
    date: formatSheetDate(record.date),
    recordedAt: record.recordedAt || ''
  };
}

function buildNutritionSheetRow(record) {
  var w = record.weight != null && record.weight !== '' ? String(record.weight) : '';
  var h = record.height != null && record.height !== '' ? String(record.height) : '';
  var bmi = record.bmi != null && record.bmi !== '' ? String(record.bmi) : '';
  var date = record.date || record.recordedAt || new Date().toLocaleString('th-TH');
  return {
    'วันที่บันทึก': date,
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'เพศ': record.sex || '',
    'อายุ': record.age != null && record.age !== '' ? String(record.age) : '',
    'น้ำหนัก(kg)': w,
    'น้ำหนัก': w,
    'น้ำหนัก(กก.)': w,
    'น้ำหนัก (kg)': w,
    'น้ำหนัก (กก.)': w,
    'ส่วนสูง(cm)': h,
    'ส่วนสูง': h,
    'ส่วนสูง(ซม.)': h,
    'ส่วนสูง (cm)': h,
    'ส่วนสูง (ซม.)': h,
    'BMI': bmi,
    'สถานะโภชนาการ': record.category || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    sex: record.sex || '',
    age: record.age != null && record.age !== '' ? String(record.age) : '',
    weight: w,
    height: h,
    bmi: bmi,
    category: record.category || '',
    recordedAt: date
  };
}

function buildChronicSheetRow(record) {
  return {
    'วันที่บันทึก': record.recordedAt || new Date().toLocaleString('th-TH'),
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'โรคประจำตัว': record.disease || '',
    'ยาที่ใช้': record.medicine || '',
    'เบอร์ติดต่อฉุกเฉิน': record.phone || '',
    'หมายเหตุ': record.note || '',
    'แผนการดูแล': record.carePlan || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    disease: record.disease || '',
    medicine: record.medicine || '',
    phone: record.phone || '',
    note: record.note || '',
    carePlan: record.carePlan || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildEmergencySheetRow(record) {
  return {
    'วันที่เวลา': record.eventAt || record.recordedAt || '',
    'ชื่อผู้บาดเจ็บ/เจ็บป่วย': record.name || '',
    'ประเภทเหตุการณ์': record.type || '',
    'สถานที่เกิดเหตุ': record.location || '',
    'การปฐมพยาบาล': record.firstaid || '',
    'ผลลัพธ์': record.result || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    name: record.name || '',
    type: record.type || '',
    location: record.location || '',
    firstaid: record.firstaid || '',
    result: record.result || '',
    eventAt: record.eventAt || record.recordedAt || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildDiseaseStudentSheetRow(record) {
  return {
    'วันที่รายงาน': record.recordedAt || '',
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'โรคที่พบ/สงสัย': record.disease || '',
    'วันที่เริ่มมีอาการ': formatSheetDate(record.symptomDate),
    'อาการ/รายละเอียด': record.note || '',
    'สถานะ': record.status || '',
    id: record.id || '',
    name: record.name || '',
    disease: record.disease || '',
    symptomDate: formatSheetDate(record.symptomDate),
    note: record.note || '',
    status: record.status || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildDiseaseStaffSheetRow(record) {
  return {
    'วันที่รายงาน': record.recordedAt || '',
    'โรคที่พบ': record.disease || '',
    'จำนวนผู้ป่วย': record.patients || '',
    'ห้องเรียน/กลุ่ม': record.room || '',
    'วันที่เริ่มพบ': formatSheetDate(record.startDate),
    'มาตรการที่ดำเนินการ': (record.measures || []).join(', '),
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    disease: record.disease || '',
    patients: record.patients || '',
    room: record.room || '',
    startDate: formatSheetDate(record.startDate),
    measures: (record.measures || []).join(', '),
    recordedAt: record.recordedAt || ''
  };
}

function buildEnvironmentSheetRow(record) {
  var items = record.items || [];
  var passed = items.filter(function(it) { return it.checked; });
  var failed = items.filter(function(it) { return !it.checked; });
  return {
    'วันที่ตรวจ': record.recordedAt || '',
    'ผลการตรวจ': (record.passCount != null ? record.passCount : passed.length) + '/' + (record.total || items.length) + ' ข้อ',
    'รายการที่ผ่าน': passed.map(function(it) { return it.text; }).join(' | '),
    'รายการที่ยังไม่ผ่าน': failed.map(function(it) { return it.text; }).join(' | '),
    'ผู้บันทึก': record.recordedBy || getSyncRoleLabel(),
    passCount: record.passCount,
    passed: passed.map(function(it) { return it.text; }).join(' | '),
    failed: failed.map(function(it) { return it.text; }).join(' | '),
    recordedAt: record.recordedAt || ''
  };
}

function buildReferralSheetRow(record) {
  return {
    'รหัสรายการ': record.uid || '',
    'วันที่บันทึก': record.recordedAt || '',
    'รหัส': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'สถานพยาบาล': record.hospital || '',
    'ความเร่งด่วน': record.urgency || '',
    'สาเหตุ/อาการ': record.reason || '',
    'แจ้งผู้ปกครอง': record.parentNotified || '',
    'หมายเหตุ': record.note || '',
    'สถานะ': record.status || '',
    'ผลติดตาม': record.followupNote || '',
    'แหล่งข้อมูล': record.source || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    hospital: record.hospital || '',
    urgency: record.urgency || '',
    reason: record.reason || '',
    parentNotified: record.parentNotified || '',
    note: record.note || '',
    status: record.status || '',
    followupNote: record.followupNote || '',
    source: record.source || '',
    uid: record.uid || '',
    recordedAt: record.recordedAt || ''
  };
}

function buildVisitSheetRowSlim_(record) {
  var providerName = visitProviderNameForSheet_(record);
  return {
    'วันที่เวลา': record.recordedAt || '',
    'รหัส': record.id || '',
    'ชื่อ': record.name || '',
    'ระดับชั้น/ตำแหน่ง': record.class || '',
    'ประเภทผู้รับบริการ': record.type || 'นักเรียน',
    'อาการ': record.symptom || '',
    'อุณหภูมิร่างกาย': record.temp || '',
    'ความดันโลหิต': record.bp || '',
    'ชีพจร': record.pulse || '',
    'การวินิจฉัยเบื้องต้น': record.diagnosis || '',
    'การรักษาและยาที่ให้': record.treatment || '',
    'ผลการรักษา': record.result || '',
    'ผู้ให้บริการ': providerName,
    'ตำแหน่งผู้ให้บริการ': record.providerRole || '',
    'ระดับชั้นผู้ให้บริการ (นักเรียน)': record.providerClass || '',
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    'รหัสรายการ': record.recordId || '',
    recordId: record.recordId || '',
    id: record.id || ''
  };
}

function collectLocalVisitRecordsForSheetPush_(clientOnly) {
  var records = [];
  if (typeof loadVisitRecords === 'function') {
    try { records = loadVisitRecords() || []; } catch (eLoad) { records = []; }
  }
  if (!Array.isArray(records) || !records.length) {
    try { records = JSON.parse(localStorage.getItem('sh-visit') || '[]'); } catch (eLs) { records = []; }
  }
  if (!Array.isArray(records)) records = [];
  var seen = {};
  var out = [];
  records.forEach(function(r) {
    if (!r) return;
    var rid = String(r.recordId || '').trim();
    var id = String(r.id || '').trim();
    if (!rid || !id) return;
    if (clientOnly && !/^v-\d{10,}-[a-z0-9]+$/i.test(rid)) return;
    if (seen[rid]) return;
    seen[rid] = true;
    out.push(r);
  });
  out.sort(function(a, b) {
    var ac = /^v-\d{10,}-/i.test(String(a.recordId || '')) ? 0 : 1;
    var bc = /^v-\d{10,}-/i.test(String(b.recordId || '')) ? 0 : 1;
    if (ac !== bc) return ac - bc;
    return (Number(b.savedAt) || 0) - (Number(a.savedAt) || 0);
  });
  return out;
}

var _visitLocalPushInFlight = false;

/**
 * ส่งรายการบันทึกการรักษาที่มีในเว็บ → แท็บ Google Sheet "บันทึกการรักษา"
 * ใช้ upsert ตามรหัสรายการ — ไม่แตะชีตอื่น
 */
function syncAllLocalVisitRecordsToSheet(options) {
  options = options || {};
  if (_visitLocalPushInFlight) {
    if (!options.silent && typeof showSheetToast_ === 'function') {
      showSheetToast_('กำลังส่งรายการรักษาขึ้นชีตอยู่แล้ว — รอสักครู่');
    }
    return Promise.resolve({ ok: false, busy: true });
  }
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL) {
    return Promise.resolve({ ok: false, error: 'DISABLED' });
  }
  var records = collectLocalVisitRecordsForSheetPush_(!!options.clientOnly);
  if (!records.length) {
    if (!options.silent && typeof showSheetToast_ === 'function') {
      showSheetToast_('ไม่พบรายการรักษาในเว็บสำหรับส่งขึ้นชีต', true);
    }
    return Promise.resolve({ ok: true, sent: 0, failed: 0, total: 0 });
  }

  _visitLocalPushInFlight = true;
  var total = records.length;
  var sent = 0;
  var failed = 0;
  var i = 0;
  var delayMs = options.delayMs > 0 ? options.delayMs : 600;
  if (!options.silent && typeof showSheetToast_ === 'function') {
    showSheetToast_('กำลังส่งรายการรักษาขึ้นชีต 0 / ' + total.toLocaleString('th-TH'));
  }

  return new Promise(function(resolve) {
    function finish() {
      _visitLocalPushInFlight = false;
      if (!options.silent && typeof showSheetToast_ === 'function') {
        if (!sent && failed) {
          showSheetToast_('ส่งขึ้นชีตไม่สำเร็จ — ตรวจ Web App URL / Deploy แล้วลองใหม่', true);
        } else if (failed) {
          showSheetToast_('ส่งขึ้นชีตแล้ว ' + sent.toLocaleString('th-TH') + '/' + total.toLocaleString('th-TH') +
            ' รายการ (ไม่สำเร็จ ' + failed + ')', true);
        } else {
          showSheetToast_('ส่งรายการรักษาขึ้นแท็บบันทึกการรักษาครบ ' + sent.toLocaleString('th-TH') + ' รายการแล้ว');
        }
      }
      resolve({ ok: failed === 0, sent: sent, failed: failed, total: total });
    }
    function next() {
      if (i >= total) {
        finish();
        return;
      }
      var rec = records[i++];
      if (!options.silent && typeof showSheetToast_ === 'function' &&
          (i === 1 || i % 5 === 0 || i >= total)) {
        showSheetToast_('กำลังส่งรายการรักษาขึ้นชีต ' + i.toLocaleString('th-TH') + ' / ' + total.toLocaleString('th-TH'));
      }
      syncVisitRecordToSheet(rec, {
        silent: true,
        toastOnFail: false,
        toastOnSuccess: false
      }).then(function(res) {
        if (res && (isVerifiedWriteOk_(res) || res.queued || res.upserted || res.appended)) sent++;
        else failed++;
        setTimeout(next, delayMs);
      }).catch(function() {
        failed++;
        setTimeout(next, delayMs + 350);
      });
    }
    next();
  });
}

function syncVisitRecordToSheet(record, opts) {
  opts = opts || {};
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL) {
    return Promise.resolve({ ok: false, error: 'DISABLED' });
  }
  if (!record || !record.recordId) {
    return Promise.resolve({ ok: false, error: 'NO_RECORD_ID' });
  }
  var sheetName = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.visit) ? SHEET_NAMES.visit : 'บันทึกการรักษา';
  var row = buildVisitSheetRowSlim_(record);
  var upsertPayload = {
    action: 'upsertRow',
    sheet: sheetName,
    matchKey: 'รหัสรายการ',
    row: row,
    silent: true
  };
  ensureSheetSyncDom_();

  function notifyFail(res, errMsg) {
    enqueueSheetSync_(upsertPayload);
    if (opts.toastOnFail !== false && typeof showSheetToast_ === 'function') {
      var msg = typeof describeSheetSyncFailure_ === 'function'
        ? describeSheetSyncFailure_([errMsg || (res && res.error)], false)
        : 'บันทึกในเว็บแล้ว แต่ส่ง Google Sheet ไม่สำเร็จ — ระบบจะลองส่งอีกครั้ง';
      showSheetToast_(msg, true);
    }
    setTimeout(function() { flushSheetQueue_(); }, 1500);
    return res || { ok: false, error: errMsg || 'SYNC_FAIL' };
  }

  /** GET ก่อน — เสถียรกับ Apps Script CORS; ไม่เรียก ensureSchema (เคยชนลิมิตเซลล์) */
  function tryGetWrite(payload) {
    var compact = compactPayloadForGet_(payload) || payload;
    return syncViaFetchGet_(compact).then(function(res) {
      if (isVerifiedWriteOk_(res)) return res;
      throw new Error((res && res.error) || 'NOT_OK');
    });
  }

  function tryPostWrite(payload) {
    return syncPayload_(Object.assign({}, payload, { silent: true })).then(function(res) {
      if (isVerifiedWriteOk_(res)) return res;
      throw new Error((res && res.error) || 'NOT_OK');
    });
  }

  return tryGetWrite(upsertPayload).catch(function(err1) {
    var msg1 = String(err1 && err1.message || err1 || '');
    /* ห้าม append หลัง upsert ล้ม — ทำให้แถวซ้ำรหัสรายการในชีต */
    return tryPostWrite(upsertPayload).catch(function() {
      return notifyFail(null, msg1);
    });
  }).then(function(res) {
    if (opts.toastOnSuccess && typeof showSheetToast_ === 'function') {
      showSheetToast_('บันทึกลง Google Sheet แล้ว');
    }
    return res;
  }).catch(function(err) {
    var errMsg = String(err && err.message || err || 'SYNC_FAIL');
    enqueueSheetSync_(upsertPayload);
    return syncViaFormQueued_(upsertPayload).then(function() {
      setTimeout(function() { flushSheetQueue_(); }, 2500);
      if (opts.toastOnFail !== false && typeof showSheetToast_ === 'function') {
        if (/10000000|เซลล์|cell/i.test(errMsg)) {
          showSheetToast_('ชีตเต็มลิมิตเซลล์ — ลบแถว/ชีตว่างใน Google Sheet แล้ว Deploy สคริปต์ใหม่ แล้วลองบันทึกอีกครั้ง', true);
        } else {
          showSheetToast_('บันทึกในเว็บแล้ว — กำลังส่งชีต (รอ 2–3 วินาทีแล้วตรวจแท็บบันทึกการรักษา)', false);
        }
      }
      return { ok: false, queued: true, method: 'form', unverified: true, error: errMsg };
    }).catch(function() {
      return notifyFail(null, errMsg);
    });
  });
}

function syncUpsertRowQuiet(sheetName, matchKey, row) {
  if (!sheetName || !matchKey || !row) return Promise.resolve({ ok: false });
  var payload = {
    action: 'upsertRow',
    sheet: sheetName,
    matchKey: matchKey,
    row: row,
    silent: true
  };
  ensureSheetSyncDom_();
  return syncPayloadQuiet(payload);
}

function syncDeleteRowQuiet(sheetName, matchKey, matchValue) {
  if (!sheetName || !matchKey || matchValue == null || matchValue === '') {
    return Promise.resolve({ ok: false });
  }
  var payload = {
    action: 'deleteRow',
    sheet: sheetName,
    matchKey: matchKey,
    matchValue: String(matchValue),
    silent: true
  };
  ensureSheetSyncDom_();
  return syncPayloadQuiet(payload);
}

function syncDeleteVisitQuiet(record) {
  if (!record) return Promise.resolve({ ok: false });
  var sheetName = (typeof SHEET_NAMES !== 'undefined' && SHEET_NAMES.visit) ? SHEET_NAMES.visit : 'บันทึกการรักษา';
  var payload = {
    action: 'deleteVisit',
    sheet: sheetName,
    recordId: String(record.recordId || ''),
    recordedAt: String(record.recordedAt || ''),
    studentId: String(record.id || ''),
    id: String(record.id || ''),
    symptom: String(record.symptom || ''),
    silent: true
  };
  if (!payload.recordId && !(payload.studentId && payload.recordedAt)) {
    return Promise.resolve({ ok: false });
  }
  ensureSheetSyncDom_();
  return syncPayloadQuiet(payload);
}

function screeningTypeLabel_(type) {
  var map = {
    vision: 'สายตา',
    hearing: 'การได้ยิน',
    blood: 'โลหิตจาง',
    oral: 'ช่องปาก',
    physical: 'ร่างกาย',
    fitness: 'สมรรถภาพร่างกาย'
  };
  return map[type] || type || '';
}

function formatScreeningDetail_(record) {
  if (!record || !record.detail) return '';
  var d = record.detail;
  if (record.type === 'vision') {
    return 'ตาขวา ' + (d.vaRight || '—') + ' / ตาซ้าย ' + (d.vaLeft || '—');
  }
  if (record.type === 'hearing') {
    return 'ขวา ' + (d.right || '—') + ' / ซ้าย ' + (d.left || '—') + (d.method ? ' · ' + d.method : '');
  }
  if (record.type === 'blood') {
    return (d.value || '—') + (d.method ? ' · ' + d.method : '');
  }
  if (record.type === 'oral') {
    return (d.findings || []).join(', ') + (d.note ? ' · ' + d.note : '');
  }
  if (record.type === 'physical') {
    return (d.note || '') + (d.checked ? ' · ตรวจครบ ' + d.checked + ' ท่า' : '');
  }
  if (record.type === 'fitness') {
    var parts = [];
    if (d.sprint != null) parts.push('50ม. ' + d.sprint + 'วิ' + (d.sprintLevel ? ' (' + d.sprintLevel + ')' : ''));
    if (d.jump != null) parts.push('กระโดด ' + d.jump + 'ซม.' + (d.jumpLevel ? ' (' + d.jumpLevel + ')' : ''));
    if (d.situp != null) parts.push('ลุกนั่ง ' + d.situp + (d.situpLevel ? ' (' + d.situpLevel + ')' : ''));
    if (d.pullup != null) parts.push('ดึงข้อ ' + d.pullup + (d.armLevel ? ' (' + d.armLevel + ')' : ''));
    if (d.hang != null) parts.push('ห้อยตัว ' + d.hang + 'วิ' + (d.armLevel ? ' (' + d.armLevel + ')' : ''));
    if (d.runSec != null) {
      var m = Math.floor(d.runSec / 60);
      var s = d.runSec % 60;
      parts.push('วิ่งอึด ' + m + ':' + (s < 10 ? '0' : '') + s + (d.runLevel ? ' (' + d.runLevel + ')' : ''));
    }
    if (d.note) parts.push(d.note);
    return parts.join(' · ') || (record.summary || '');
  }
  try { return JSON.stringify(d); } catch (e) { return ''; }
}

function getSyncRecorderName_() {
  if (typeof resolveLoggedInDisplayName === 'function') {
    try {
      var name = resolveLoggedInDisplayName();
      if (name) return name;
    } catch (e) {}
  }
  return getSyncRoleLabel();
}

function buildScreeningSheetRow(record) {
  return {
    'วันที่บันทึก': record.recordedAt || '',
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'เพศ': record.sex || '',
    'อายุ': record.age != null && record.age !== '' ? String(record.age) : '',
    'ประเภทการตรวจ': screeningTypeLabel_(record.type),
    'ผลสรุป': record.summary || '',
    'รายละเอียด': formatScreeningDetail_(record),
    'ผู้บันทึก': record.recorderName || getSyncRecorderName_(),
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: record.id || '',
    name: record.name || '',
    class: record.class || '',
    sex: record.sex || '',
    age: record.age != null && record.age !== '' ? String(record.age) : '',
    type: record.type || '',
    summary: record.summary || '',
    recordedAt: record.recordedAt || ''
  };
}

function syncScreeningToSheetQuiet(record) {
  if (!SHEET_NAMES.screening || !record) return;
  syncToSheetQuiet(SHEET_NAMES.screening, buildScreeningSheetRow(record));
}

function getNextCalendarSheetOrder(calendar) {
  var max = 0;
  (calendar || []).forEach(function(c) {
    var o = parseInt(c && c.sheetOrder, 10);
    if (!isNaN(o) && o > max) max = o;
  });
  return max + 1;
}

function buildCalendarSheetRow(item, index) {
  item = item || {};
  var order = item.sheetOrder != null && item.sheetOrder !== ''
    ? String(item.sheetOrder)
    : String((index || 0) + 1);
  return {
    'ลำดับ': order,
    'วันเริ่ม': formatSheetDate(item.dateStart) || item.dateStart || '',
    'วันสิ้นสุด': formatSheetDate(item.dateEnd) || item.dateEnd || '',
    'รายละเอียดงาน': item.text || '',
    'สถานะ': item.done ? 'เสร็จแล้ว' : 'วางแผน',
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    'รหัสกิจกรรม': item.id || '',
    id: item.id || ''
  };
}

function syncCalendarToSheetQuiet(item, index, calendar) {
  if (!SHEET_NAMES.calendar || !item) return;
  if (item.sheetOrder == null || item.sheetOrder === '') {
    item.sheetOrder = getNextCalendarSheetOrder(calendar);
  }
  syncToSheetQuiet(SHEET_NAMES.calendar, buildCalendarSheetRow(item, index));
}

function deleteCalendarFromSheetQuiet(item) {
  if (!SHEET_NAMES.calendar || !item) return;
  if (typeof item === 'string') {
    syncDeleteRowQuiet(SHEET_NAMES.calendar, 'รหัสกิจกรรม', item);
    return;
  }
  if (item.sheetOrder != null && item.sheetOrder !== '') {
    syncDeleteRowQuiet(SHEET_NAMES.calendar, 'ลำดับ', String(item.sheetOrder));
    return;
  }
  if (item.id) {
    syncDeleteRowQuiet(SHEET_NAMES.calendar, 'รหัสกิจกรรม', item.id);
  }
}

function deleteVaccineFromSheetQuiet(record) {
  if (!SHEET_NAMES.vaccine || !record) return;
  if (record.recordId) {
    syncDeleteRowQuiet(SHEET_NAMES.vaccine, 'รหัสรายการ', record.recordId);
    return;
  }
  syncDeleteRowQuiet(SHEET_NAMES.vaccine, 'เลขประจำตัว', record.id);
}

function buildMedicineSheetRow(item, opts) {
  opts = opts || {};
  item = item || {};
  return {
    'รหัสยา': item.id || '',
    'ชื่อยา': item.name || '',
    'ประเภท': item.category || '',
    'จำนวนคงเหลือ': item.qty != null ? String(item.qty) : '',
    'หน่วย': item.unit || '',
    'วันหมดอายุ': item.expiry || '',
    'สถานะ': opts.status || item.status || '',
    'จำนวนที่รับเพิ่ม': opts.addQty != null ? String(opts.addQty) : '',
    'ประเภทการบันทึก': opts.actionType || '',
    'หมายเหตุ': opts.note || item.lastNote || '',
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': getSyncRoleLabel()
  };
}

function syncMedicineStockToSheetQuiet(item, opts) {
  if (!SHEET_NAMES.medicine || !item) return;
  syncUpsertRowQuiet(SHEET_NAMES.medicine, 'รหัสยา', buildMedicineSheetRow(item, opts));
}

function syncMedicinePurchaseToSheetQuiet(item, addQty, note) {
  if (!SHEET_NAMES.medicine || !item) return;
  syncToSheetQuiet(SHEET_NAMES.medicine, buildMedicineSheetRow(item, {
    addQty: addQty,
    note: note,
    actionType: 'รับเข้า'
  }));
}

function deleteMedicineFromSheetQuiet(medId) {
  if (!SHEET_NAMES.medicine || !medId) return;
  syncDeleteRowQuiet(SHEET_NAMES.medicine, 'รหัสยา', String(medId));
}

function buildNurseAlertSheetRow(alert) {
  alert = alert || {};
  return {
    'รหัสแจ้งเตือน': alert.id || '',
    'ข้อความ': alert.text || '',
    'ระดับความสำคัญ': alert.priority || '',
    'สถานะ': alert.active !== false ? 'แสดง' : 'ปิด',
    'ผู้เผยแพร่': alert.author || '',
    'วันที่เผยแพร่': alert.createdAt ? new Date(alert.createdAt).toLocaleString('th-TH') : '',
    'วันที่แก้ไข': alert.updatedAt ? new Date(alert.updatedAt).toLocaleString('th-TH') : ''
  };
}

function syncNurseAlertToSheetQuiet(alert) {
  if (!SHEET_NAMES.nurseAlert || !alert) return;
  syncUpsertRowQuiet(SHEET_NAMES.nurseAlert, 'รหัสแจ้งเตือน', buildNurseAlertSheetRow(alert));
}

function buildKnowledgeSheetRow(article) {
  article = article || {};
  return {
    'รหัสบทความ': article.id || '',
    'หมวดหมู่': article.category || '',
    'หัวข้อ': article.title || '',
    'เนื้อหา': article.content || '',
    'ผู้เขียน': article.author || '',
    'ลิงก์วิดีโอ': article.youtubeUrl || (article.youtubeId ? ('https://youtu.be/' + article.youtubeId) : ''),
    'วันที่เผยแพร่': article.date || new Date().toLocaleString('th-TH')
  };
}

function syncKnowledgeToSheetQuiet(article) {
  if (!SHEET_NAMES.knowledge || !article) return;
  syncUpsertRowQuiet(SHEET_NAMES.knowledge, 'รหัสบทความ', buildKnowledgeSheetRow(article));
}

function buildStudentHealthSheetRow(id, extra) {
  extra = extra || {};
  var name = '';
  if (typeof lookupStudent === 'function') {
    var student = lookupStudent(id);
    if (student && student.fullName) name = student.fullName;
  }
  var chronic = '';
  var drug = extra.drugAllergy || '';
  var food = extra.foodAllergy || '';
  var precautions = extra.precautions || '';
  if (typeof getStudentRegistryHealth === 'function') {
    var health = getStudentRegistryHealth(id);
    if (!drug && health.drug && health.drug !== '—') drug = health.drug;
    if (!food && health.food && health.food !== '—') food = health.food;
    if (!precautions && health.precautions && health.precautions !== '—') precautions = health.precautions;
    if (health.chronic && health.chronic !== '—') chronic = health.chronic;
  }
  return {
    'รหัสนักเรียน': id || '',
    'ชื่อ-นามสกุล': name,
    'แพ้ยา': drug,
    'แพ้อาหาร': food,
    'ข้อควรระวัง': precautions,
    'เบอร์ผู้ปกครอง': extra.guardianPhone || '',
    'โรคประจำตัว': chronic,
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': getSyncRoleLabel()
  };
}

function syncStudentHealthToSheetQuiet(id) {
  if (!SHEET_NAMES.studentHealth || !id) return Promise.resolve({ ok: false });
  var extra = {};
  if (typeof getStudentHealthExtra === 'function') extra = getStudentHealthExtra(id) || {};
  return syncUpsertRowQuiet(SHEET_NAMES.studentHealth, 'รหัสนักเรียน', buildStudentHealthSheetRow(id, extra));
}

function buildStudentRegistrySheetRow(entry) {
  entry = entry || {};
  var dash = '—';
  function cell(v) {
    if (v == null || v === '' || v === dash || v === '-') return '';
    return String(v);
  }
  return {
    'รหัสนักเรียน': entry.id || '',
    'ชื่อ-นามสกุล': entry.name || '',
    'ชั้น': entry.class || '',
    'อายุ': entry.age != null && entry.age !== '' ? String(entry.age) : '',
    'เพศ': entry.genderLabel || entry.gender || '',
    'โรคประจำตัว': cell(entry.chronic),
    'แพ้ยา': cell(entry.drug),
    'แพ้อาหาร': cell(entry.food),
    'ข้อควรระวัง': cell(entry.precautions),
    'เบอร์ผู้ปกครอง': entry.guardianPhone || '',
    'วันที่อัปเดต': entry.updatedAt || new Date().toLocaleString('th-TH'),
    id: entry.id || '',
    name: entry.name || '',
    class: entry.class || ''
  };
}

function syncStudentRegistryEntryQuiet(entry) {
  if (!SHEET_NAMES.studentRegistry || !entry || !entry.id) return Promise.resolve({ ok: false });
  return syncUpsertRowQuiet(SHEET_NAMES.studentRegistry, 'รหัสนักเรียน', buildStudentRegistrySheetRow(entry));
}

function syncStudentRegistryBatchQuiet(rows) {
  if (!SHEET_NAMES.studentRegistry || !rows || !rows.length) {
    return Promise.resolve({ ok: false });
  }
  return syncRegistryProfileBatchQuiet_(SHEET_NAMES.studentRegistry, 'รหัสนักเรียน', rows);
}

function parseGvizStudentRegistryRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxAge = findGvizColIndex_(cols, ['อายุ', 'age']);
  var idxGender = findGvizColIndex_(cols, ['เพศ', 'gender']);
  var idxChronic = findGvizColIndex_(cols, ['โรคประจำตัว', 'chronic']);
  var idxDrug = findGvizColIndex_(cols, ['แพ้ยา', 'drug']);
  var idxFood = findGvizColIndex_(cols, ['แพ้อาหาร', 'food']);
  var idxPrec = findGvizColIndex_(cols, ['ข้อควรระวัง', 'precautions']);
  var idxPhone = findGvizColIndex_(cols, ['เบอร์ผู้ปกครอง', 'phone']);
  var idxUpdated = findGvizColIndex_(cols, ['วันที่อัปเดต', 'updatedat']);
  var items = [];
  table.rows.forEach(function(row) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    if (!id) return;
    items.push({
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      age: idxAge >= 0 ? gvizCell_(row, idxAge) : '',
      gender: idxGender >= 0 ? gvizCell_(row, idxGender) : '',
      chronic: idxChronic >= 0 ? gvizCell_(row, idxChronic) : '',
      drug: idxDrug >= 0 ? gvizCell_(row, idxDrug) : '',
      food: idxFood >= 0 ? gvizCell_(row, idxFood) : '',
      precautions: idxPrec >= 0 ? gvizCell_(row, idxPrec) : '',
      guardianPhone: idxPhone >= 0 ? gvizCell_(row, idxPhone) : '',
      updatedAt: idxUpdated >= 0 ? gvizCell_(row, idxUpdated) : ''
    });
  });
  return items;
}

function fetchStudentRegistryFromSheet() {
  if (!SHEETS_CONFIG.ENABLED || !SHEET_NAMES.studentRegistry) {
    return Promise.resolve([]);
  }
  return fetchGvizSheet_(SHEET_NAMES.studentRegistry).then(function(data) {
    if (!data) return [];
    return parseGvizStudentRegistryRows_(data);
  });
}

function buildTeacherRegistrySheetRow(entry) {
  entry = entry || {};
  function cell(v) {
    if (v == null || v === '' || v === '—' || v === '-') return '';
    return String(v);
  }
  return {
    'รหัสครู': entry.id || '',
    'ชื่อ-นามสกุล': entry.name || '',
    'กลุ่มสาระ': entry.subjectGroup || '',
    'สังกัด': entry.affiliation || '',
    'ประจำชั้น': entry.classLevel || '',
    'เบอร์โทร': entry.phone || '',
    'อีเมล': entry.email || '',
    'โรคประจำตัว': cell(entry.chronic),
    'แพ้ยา': cell(entry.drug),
    'แพ้อาหาร': cell(entry.food),
    'ข้อควรระวัง': cell(entry.precautions),
    'วันที่อัปเดต': entry.updatedAt || new Date().toLocaleString('th-TH'),
    id: entry.id || '',
    name: entry.name || ''
  };
}

function syncTeacherRegistryEntryQuiet(entry) {
  if (!SHEET_NAMES.teacherRegistry || !entry || !entry.id) return Promise.resolve({ ok: false });
  return syncUpsertRowQuiet(SHEET_NAMES.teacherRegistry, 'รหัสครู', buildTeacherRegistrySheetRow(entry));
}

function syncTeacherRegistryBatchQuiet(rows) {
  if (!SHEET_NAMES.teacherRegistry || !rows || !rows.length) {
    return Promise.resolve({ ok: false });
  }
  var payload = {
    action: 'batchUpsertRows',
    sheet: SHEET_NAMES.teacherRegistry,
    matchKey: 'รหัสครู',
    rows: rows
  };
  ensureSheetSyncDom_();
  return syncPayload_(payload).catch(function() {
    enqueueSheetSync_(payload);
    syncViaHiddenForm_(payload);
    return { ok: false, method: 'form' };
  });
}

function parseGvizTeacherRegistryRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสครู', 'รหัส', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxGroup = findGvizColIndex_(cols, ['กลุ่มสาระ', 'subjectgroup']);
  var idxAff = findGvizColIndex_(cols, ['สังกัด', 'affiliation']);
  var idxClass = findGvizColIndex_(cols, ['ประจำชั้น', 'class']);
  var idxPhone = findGvizColIndex_(cols, ['เบอร์โทร', 'phone']);
  var idxEmail = findGvizColIndex_(cols, ['อีเมล', 'email']);
  var idxChronic = findGvizColIndex_(cols, ['โรคประจำตัว', 'chronic']);
  var idxDrug = findGvizColIndex_(cols, ['แพ้ยา', 'drug']);
  var idxFood = findGvizColIndex_(cols, ['แพ้อาหาร', 'food']);
  var idxPrec = findGvizColIndex_(cols, ['ข้อควรระวัง', 'precautions']);
  var items = [];
  table.rows.forEach(function(row) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    if (!id) return;
    items.push({
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      subjectGroup: idxGroup >= 0 ? gvizCell_(row, idxGroup) : '',
      affiliation: idxAff >= 0 ? gvizCell_(row, idxAff) : '',
      classLevel: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      phone: idxPhone >= 0 ? gvizCell_(row, idxPhone) : '',
      email: idxEmail >= 0 ? gvizCell_(row, idxEmail) : '',
      chronic: idxChronic >= 0 ? gvizCell_(row, idxChronic) : '',
      drug: idxDrug >= 0 ? gvizCell_(row, idxDrug) : '',
      food: idxFood >= 0 ? gvizCell_(row, idxFood) : '',
      precautions: idxPrec >= 0 ? gvizCell_(row, idxPrec) : ''
    });
  });
  return items;
}

function fetchTeacherRegistryFromSheet() {
  if (!SHEETS_CONFIG.ENABLED || !SHEET_NAMES.teacherRegistry) {
    return Promise.resolve([]);
  }
  return fetchGvizSheet_(SHEET_NAMES.teacherRegistry).then(function(data) {
    if (!data) return [];
    return parseGvizTeacherRegistryRows_(data);
  });
}

function sheetPlainText_(value) {
  if (value == null || value === '' || value === '—' || value === '-') return '';
  return String(value).trim();
}

function sheetLabelLine_(label, value) {
  var v = sheetPlainText_(value);
  if (!v) return '';
  return label + ': ' + v;
}

function formatStudentGenderLabel_(g) {
  if (g === 'ช') return 'ชาย';
  if (g === 'ญ') return 'หญิง';
  return sheetPlainText_(g);
}

function getStudentClassForSheet_(id, student) {
  if (typeof getStudentRegistryClassMap === 'function') {
    var classMap = getStudentRegistryClassMap(false);
    var k = typeof canonicalStudentIdKey === 'function' ? canonicalStudentIdKey(id) : String(id).trim();
    if (classMap[k]) return classMap[k];
    if (classMap[id]) return classMap[id];
  }
  return (student && (student.classLevel || student.class)) || '';
}

function sheetCellValue_(value) {
  if (value == null || value === '' || value === '—' || value === '-') return '';
  return String(value).trim();
}

function buildStudentBasicInfoSheetRow(entry) {
  entry = entry || {};
  if (!entry.id) return null;
  function cell(v) {
    if (v == null || v === '' || v === '—' || v === '-') return '';
    return String(v);
  }
  return {
    'รหัสนักเรียน': entry.id,
    'ชื่อ-นามสกุล': entry.name || '',
    'ชั้น': entry.class || '',
    'เลขประจำตัวประชาชน': cell(entry.citizenId),
    'เพศ': entry.genderLabel || entry.gender || '',
    'วันเกิด': cell(entry.dob),
    'อายุ': cell(entry.age),
    'ศาสนา': cell(entry.religion),
    'เชื้อชาติ': cell(entry.race),
    'สัญชาติ': cell(entry.nationality),
    'น้ำหนัก(kg)': cell(entry.weight),
    'ส่วนสูง(cm)': cell(entry.height),
    'กลุ่มเลือด': cell(entry.bloodType),
    'ความด้อยโอกาส': cell(entry.disadvantaged),
    'ที่อยู่': cell(entry.address),
    'ผู้ปกครอง': cell(entry.guardian),
    'ความสัมพันธ์ผู้ปกครอง': cell(entry.guardianRel),
    'เบอร์ผู้ปกครอง': cell(entry.guardianPhone),
    'อาชีพผู้ปกครอง': cell(entry.guardianJob),
    'บิดา': cell(entry.father),
    'อาชีพบิดา': cell(entry.fatherJob),
    'มารดา': cell(entry.mother),
    'อาชีพมารดา': cell(entry.motherJob),
    'โรคประจำตัว': cell(entry.chronic),
    'แพ้ยา': cell(entry.drug),
    'แพ้อาหาร': cell(entry.food),
    'ข้อควรระวัง': cell(entry.precautions),
    'วันที่อัปเดต': entry.updatedAt || new Date().toLocaleString('th-TH'),
    id: entry.id,
    name: entry.name || '',
    class: entry.class || ''
  };
}

function buildTeacherBasicInfoSheetRow(id) {
  id = String(id || '').trim();
  if (!id || typeof lookupTeacher !== 'function') return null;
  var teacher = lookupTeacher(id);
  if (!teacher) return null;
  var health = typeof getTeacherRegistryHealth === 'function' ? getTeacherRegistryHealth(teacher.id) : {};
  return {
    'รหัสครู': teacher.id,
    'ชื่อ-นามสกุล': teacher.fullName || '',
    'กลุ่มสาระ': sheetCellValue_(teacher.subjectGroup),
    'สังกัด': sheetCellValue_(teacher.affiliation),
    'ประจำชั้น': sheetCellValue_(teacher.classLevel),
    'เบอร์โทร': sheetCellValue_(teacher.phone),
    'อีเมล': sheetCellValue_(teacher.email),
    'โรคประจำตัว': sheetCellValue_(health.chronic),
    'แพ้ยา': sheetCellValue_(health.drug),
    'แพ้อาหาร': sheetCellValue_(health.food),
    'ข้อควรระวัง': sheetCellValue_(health.precautions),
    'วันที่อัปเดต': new Date().toLocaleString('th-TH'),
    id: teacher.id,
    name: teacher.fullName || ''
  };
}

function isStaffVisitRecord_(record) {
  var type = String(record && record.type || '');
  return type.indexOf('ครู') !== -1 || type.indexOf('บุคลากร') !== -1;
}

function buildStudentVisitHistorySheetRow_(record) {
  if (!record) return null;
  var recordId = record.recordId || ('v-' + (record.savedAt || Date.now()) + '-' + (record.id || 'x'));
  return {
    'รหัสรายการ': recordId,
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'วันที่เวลา': record.recordedAt || '',
    'อาการ': record.symptom || '',
    'อุณหภูมิร่างกาย': record.temp || '',
    'ความดันโลหิต': record.bp || '',
    'ชีพจร': record.pulse || '',
    'การวินิจฉัยเบื้องต้น': record.diagnosis || '',
    'การรักษาและยาที่ให้': record.treatment || '',
    'ผลการรักษา': record.result || '',
    'ผู้ให้บริการ': record.provider || record.providerName || '',
    'วันที่อัปเดต': new Date().toLocaleString('th-TH'),
    recordId: recordId
  };
}

function resolveTeacherIdForVisit_(record) {
  if (!record) return '';
  if (record.id && typeof lookupTeacher === 'function' && lookupTeacher(record.id)) {
    return String(lookupTeacher(record.id).id);
  }
  if (typeof TEACHER_BASIC === 'undefined') return sheetCellValue_(record.id);
  var name = sheetCellValue_(record.name);
  if (!name) return sheetCellValue_(record.id);
  var found = Object.keys(TEACHER_BASIC).find(function(k) {
    var t = TEACHER_BASIC[k];
    if (!t) return false;
    if (t.fullName === name) return true;
    return t.lastName && name.indexOf(t.lastName) !== -1;
  });
  return found || sheetCellValue_(record.id);
}

function buildTeacherVisitHistorySheetRow_(record) {
  if (!record) return null;
  var teacherId = resolveTeacherIdForVisit_(record);
  var teacher = teacherId && typeof lookupTeacher === 'function' ? lookupTeacher(teacherId) : null;
  var recordId = record.recordId || ('v-' + (record.savedAt || Date.now()) + '-t' + (teacherId || 'x'));
  return {
    'รหัสรายการ': recordId,
    'รหัสครู': teacherId || '',
    'ชื่อ-นามสกุล': (teacher && teacher.fullName) || record.name || '',
    'กลุ่มสาระ': teacher ? sheetCellValue_(teacher.subjectGroup) : '',
    'วันที่เวลา': record.recordedAt || '',
    'อาการ': record.symptom || '',
    'การวินิจฉัยเบื้องต้น': record.diagnosis || '',
    'การรักษาและยาที่ให้': record.treatment || '',
    'ผลการรักษา': record.result || '',
    'ผู้ให้บริการ': record.provider || record.providerName || '',
    'วันที่อัปเดต': new Date().toLocaleString('th-TH'),
    recordId: recordId
  };
}

function collectStudentVisitHistoryRowsForId_(id) {
  return getStudentVisitRecordsForSheet_(id).map(buildStudentVisitHistorySheetRow_).filter(Boolean);
}

function collectTeacherVisitHistoryRowsForId_(id) {
  return getTeacherVisitRecordsForSheet_(id).map(buildTeacherVisitHistorySheetRow_).filter(Boolean);
}

function getStudentVisitRecordsForSheet_(id) {
  if (typeof loadVisitRecords !== 'function') return [];
  return loadVisitRecords().filter(function(r) {
    return r && r.id && typeof visitIdMatch === 'function' && visitIdMatch(r.id, id);
  });
}

function getTeacherVisitRecordsForSheet_(id) {
  if (typeof loadVisitRecords !== 'function') return [];
  var teacher = typeof lookupTeacher === 'function' ? lookupTeacher(id) : null;
  if (typeof teacherVisitMatch === 'function') {
    return loadVisitRecords().filter(function(r) {
      return teacherVisitMatch(r, id, teacher);
    });
  }
  return loadVisitRecords().filter(function(r) {
    if (!r) return false;
    if (r.id && typeof visitIdMatch === 'function' && visitIdMatch(r.id, id)) return true;
    if (!teacher) return false;
    var type = String(r.type || '');
    var isStaffVisit = type.indexOf('ครู') !== -1 || type.indexOf('บุคลากร') !== -1;
    if (r.name && teacher.fullName && r.name === teacher.fullName) return true;
    if (isStaffVisit && r.name && teacher.lastName && r.name.indexOf(teacher.lastName) !== -1) return true;
    return false;
  });
}

function syncStudentBasicInfoQuiet(id) {
  if (!SHEET_NAMES.studentBasicInfo || !id) return Promise.resolve({ ok: false });
  var entry = typeof collectStudentBasicInfoEntry === 'function'
    ? collectStudentBasicInfoEntry(id)
    : null;
  if (!entry) return Promise.resolve({ ok: false, error: 'no_entry' });
  var row = buildStudentBasicInfoSheetRow(entry);
  if (!row) return Promise.resolve({ ok: false, error: 'no_row' });
  return syncUpsertRowQuiet(SHEET_NAMES.studentBasicInfo, STUDENT_ID_SHEET_KEY, row);
}

function syncTeacherBasicInfoQuiet(id) {
  if (!SHEET_NAMES.teacherBasicInfo || !id) return Promise.resolve({ ok: false });
  var row = buildTeacherBasicInfoSheetRow(id);
  if (!row) return Promise.resolve({ ok: false, error: 'no_row' });
  return syncUpsertRowQuiet(SHEET_NAMES.teacherBasicInfo, 'รหัสครู', row);
}

/**
 * ซิงค์โปรไฟล์นักเรียนไปชีตทีละชุด (ข้อมูลพื้นฐาน → ทะเบียน → สุขภาพ)
 * ตรวจ API ก่อน — ไม่โทษสิทธิ์ Anyone ถ้า API ตอบได้แล้ว
 */
function syncStudentProfileToSheetsReliable(id, opts) {
  opts = opts || {};
  id = String(id || '').trim();
  if (!id) return Promise.resolve({ ok: false });

  return pingSheetsApi_().then(function(ping) {
    var apiReachable = !!(ping && ping.ok);
    if (!apiReachable && ping && ping.error === 'AUTH_REQUIRED') {
      if (opts.toast !== false && typeof showSheetToast_ === 'function') {
        showSheetToast_(describeSheetSyncFailure_(['AUTH_REQUIRED'], false), true);
      }
      return { ok: false, error: 'AUTH_REQUIRED' };
    }

    var steps = [];
    if (typeof syncStudentBasicInfoQuiet === 'function') {
      steps.push(function() { return syncStudentBasicInfoQuiet(id); });
    }
    if (typeof syncStudentRegistryEntryQuiet === 'function' && typeof collectStudentRegistryEntry === 'function') {
      steps.push(function() {
        var regEntry = collectStudentRegistryEntry(id);
        if (!regEntry) return Promise.resolve({ ok: false, error: 'no_entry' });
        return syncStudentRegistryEntryQuiet(regEntry);
      });
    }
    if (typeof syncStudentHealthToSheetQuiet === 'function') {
      steps.push(function() { return syncStudentHealthToSheetQuiet(id); });
    }

    var chain = Promise.resolve({ ok: true });
    var okCount = 0;
    var methods = [];
    var errors = [];
    steps.forEach(function(step) {
      chain = chain.then(function() {
        return Promise.resolve(step()).then(function(res) {
          if (isVerifiedWriteOk_(res) || isVerifiedSheetOk_(res)) {
            okCount++;
            if (res.method) methods.push(res.method);
          } else if (res && res.error) {
            errors.push(res.error);
          } else if (res && res.fallbackError) {
            errors.push(res.fallbackError);
          } else {
            errors.push('SYNC_FAILED');
          }
          return res;
        });
      });
    });

    return chain.then(function() {
      var result = {
        ok: okCount > 0,
        count: okCount,
        methods: methods,
        apiReachable: apiReachable,
        errors: errors
      };
      if (opts.toast !== false && typeof showSheetToast_ === 'function') {
        if (result.ok) {
          showSheetToast_('อัปเดต Google Sheet สำเร็จแล้ว (' + okCount + '/' + steps.length + ' ชีต)');
        } else {
          showSheetToast_(describeSheetSyncFailure_(errors, apiReachable), true);
        }
      }
      return result;
    });
  }).catch(function(err) {
    if (opts.toast !== false && typeof showSheetToast_ === 'function') {
      showSheetToast_(describeSheetSyncFailure_([String(err && err.message || err || 'UNKNOWN')], false), true);
    }
    return { ok: false, error: String(err && err.message || err || '') };
  });
}
window.syncStudentProfileToSheetsReliable = syncStudentProfileToSheetsReliable;
window.pingSheetsApi_ = pingSheetsApi_;

function syncStudentTreatmentHistoryQuiet(id) {
  if (!SHEET_NAMES.studentTreatmentHistory || !id) return;
  var rows = collectStudentVisitHistoryRowsForId_(id);
  if (!rows.length) return;
  syncStudentTreatmentHistoryBatchQuiet(rows);
}

function syncTeacherTreatmentHistoryQuiet(id) {
  if (!SHEET_NAMES.teacherTreatmentHistory || !id) return;
  var rows = collectTeacherVisitHistoryRowsForId_(id);
  if (!rows.length) return;
  syncTeacherTreatmentHistoryBatchQuiet(rows);
}

function syncProfileRowsViaUpsertQuiet_(sheetName, matchKey, rows) {
  if (!sheetName || !matchKey || !rows || !rows.length) {
    return Promise.resolve({ ok: false });
  }
  var chain = Promise.resolve();
  rows.forEach(function(row) {
    chain = chain.then(function() {
      return syncViaFormQueued_({
        action: 'upsertRow',
        sheet: sheetName,
        matchKey: matchKey,
        row: row,
        silent: true
      });
    });
  });
  return chain.then(function() {
    return { ok: true, count: rows.length, method: 'upsertRow', upserted: true };
  });
}

function syncRegistryProfileBatchQuiet_(sheetName, matchKey, rows) {
  if (!sheetName || !matchKey || !rows || !rows.length) {
    return Promise.resolve({ ok: false });
  }
  var payload = {
    action: 'batchUpsertRows',
    sheet: sheetName,
    matchKey: matchKey,
    rows: rows,
    silent: true
  };
  return syncViaFetch_(payload).then(function(res) {
    if (isProfileSheetResponseOk_(res, sheetName, rows.length)) return res;
    return syncViaFormQueued_(payload);
  }).then(function(res) {
    if (isProfileSheetResponseOk_(res, sheetName, rows.length)) return res;
    enqueueSheetSync_(payload);
    return { ok: false, error: 'batch_failed' };
  }).catch(function() {
    return syncViaFormQueued_(payload).then(function(res) {
      if (isProfileSheetResponseOk_(res, sheetName, rows.length)) return res;
      enqueueSheetSync_(payload);
      return { ok: false, error: 'batch_failed' };
    });
  });
}

function syncStudentBasicInfoBatchQuiet(rows) {
  if (!SHEET_NAMES.studentBasicInfo || !rows || !rows.length) {
    return Promise.resolve({ ok: false });
  }
  var sheetName = SHEET_NAMES.studentBasicInfo;
  return syncRegistryProfileBatchQuiet_(sheetName, STUDENT_ID_SHEET_KEY, rows).then(function(res) {
    if (isProfileSheetResponseOk_(res, sheetName, rows.length)) return res;
    return syncProfileRowsViaUpsertQuiet_(sheetName, STUDENT_ID_SHEET_KEY, rows);
  });
}

function syncTeacherBasicInfoBatchQuiet(rows) {
  if (!SHEET_NAMES.teacherBasicInfo || !rows || !rows.length) return Promise.resolve({ ok: false });
  return syncRegistryProfileBatchQuiet_(SHEET_NAMES.teacherBasicInfo, 'รหัสครู', rows);
}

function syncStudentTreatmentHistoryBatchQuiet(rows) {
  if (!SHEET_NAMES.studentTreatmentHistory || !rows || !rows.length) return Promise.resolve({ ok: false });
  return syncRegistryProfileBatchQuiet_(SHEET_NAMES.studentTreatmentHistory, 'รหัสรายการ', rows);
}

function syncTeacherTreatmentHistoryBatchQuiet(rows) {
  if (!SHEET_NAMES.teacherTreatmentHistory || !rows || !rows.length) return Promise.resolve({ ok: false });
  return syncRegistryProfileBatchQuiet_(SHEET_NAMES.teacherTreatmentHistory, 'รหัสรายการ', rows);
}

function collectStudentBasicInfoSheetRows() {
  if (typeof collectStudentBasicInfoEntries === 'function') {
    var rows = collectStudentBasicInfoEntries();
    if (rows && rows.length) return rows;
  }
  if (typeof STUDENT_BASIC === 'undefined') return [];
  return Object.keys(STUDENT_BASIC).map(function(id) {
    if (typeof collectStudentBasicInfoEntry === 'function') {
      var entry = collectStudentBasicInfoEntry(id);
      return entry && typeof buildStudentBasicInfoSheetRow === 'function'
        ? buildStudentBasicInfoSheetRow(entry)
        : null;
    }
    return null;
  }).filter(Boolean);
}

function collectTeacherBasicInfoSheetRows() {
  if (typeof TEACHER_BASIC === 'undefined') return [];
  return Object.keys(TEACHER_BASIC).map(function(id) {
    return buildTeacherBasicInfoSheetRow(id);
  }).filter(Boolean);
}

function collectStudentTreatmentHistorySheetRows() {
  if (typeof loadVisitRecords !== 'function') return [];
  return loadVisitRecords().filter(function(r) {
    return r && r.id && !isStaffVisitRecord_(r);
  }).map(buildStudentVisitHistorySheetRow_).filter(Boolean);
}

function collectTeacherTreatmentHistorySheetRows() {
  if (typeof loadVisitRecords !== 'function') return [];
  return loadVisitRecords().filter(function(r) {
    return r && isStaffVisitRecord_(r) && !!resolveTeacherIdForVisit_(r);
  }).map(buildTeacherVisitHistorySheetRow_).filter(Boolean);
}

function runRegistryProfileBatchSync_(collectRows, batchFn, options) {
  options = options || {};
  var rows = collectRows();
  if (!rows.length || typeof batchFn !== 'function') {
    if (!options.silent && typeof showSheetToast_ === 'function') {
      showSheetToast_('ไม่พบข้อมูลสำหรับซิงค์', true);
    }
    return Promise.resolve(0);
  }
  var chunkSize = options.chunkSize || 20;
  var i = 0;
  var total = rows.length;
  var sent = 0;
  var failed = 0;
  var sheetName = options.sheetName || '';
  return ensureSheetSchemaQuiet_(sheetName).then(function() {
    return new Promise(function(resolve) {
      function next() {
        if (i >= total) {
          if (!options.silent && typeof showSheetToast_ === 'function') {
            if (failed > 0) {
              showSheetToast_('ซิงค์เสร็จแต่ล้มเหลว ' + failed.toLocaleString('th-TH') + ' รายการ — ลองใหม่หรือ redeploy Apps Script', true);
            } else {
              showSheetToast_(options.doneMessage || ('ซิงค์ข้อมูล ' + total.toLocaleString('th-TH') + ' รายการเสร็จแล้ว'));
            }
          }
          resolve(sent);
          return;
        }
        var chunk = rows.slice(i, i + chunkSize);
        i += chunkSize;
        if (!options.silent && typeof showSheetToast_ === 'function' && (i === chunkSize || i % (chunkSize * 5) === 0 || i >= total)) {
          showSheetToast_((options.progressLabel || 'กำลังซิงค์') + ' ' + Math.min(i, total).toLocaleString('th-TH') + ' / ' + total.toLocaleString('th-TH'));
        }
        batchFn(chunk).then(function(res) {
          if (isProfileSheetResponseOk_(res, sheetName, chunk.length)) {
            sent += chunk.length;
          } else {
            failed += chunk.length;
          }
          setTimeout(next, options.delayMs || 450);
        }).catch(function() {
          failed += chunk.length;
          setTimeout(next, (options.delayMs || 450) + 400);
        });
      }
      if (!options.silent && options.startMessage && typeof showSheetToast_ === 'function') {
        showSheetToast_(options.startMessage);
      }
      next();
    });
  });
}

function ensureStudentBasicInfoSheetSchema_() {
  return ensureSheetSchemaQuiet_(SHEET_NAMES.studentBasicInfo);
}

var _studentBasicInfoSyncRunning = false;

function syncAllStudentBasicInfoToSheet(options) {
  options = options || {};
  if (_studentBasicInfoSyncRunning) return Promise.resolve(0);
  _studentBasicInfoSyncRunning = true;
  return runRegistryProfileBatchSync_(collectStudentBasicInfoSheetRows, syncStudentBasicInfoBatchQuiet, Object.assign({
    sheetName: SHEET_NAMES.studentBasicInfo,
    chunkSize: 8,
    delayMs: 350,
    progressLabel: 'ข้อมูลพื้นฐานนักเรียน',
    startMessage: 'กำลังส่งข้อมูลพื้นฐานไปชีต (แยกคอลัมน์)...',
    doneMessage: 'ซิงค์ข้อมูลพื้นฐานนักเรียนเสร็จแล้ว'
  }, options || {})).then(function(n) {
    _studentBasicInfoSyncRunning = false;
    return n;
  }).catch(function() {
    _studentBasicInfoSyncRunning = false;
    return 0;
  });
}

function syncAllTeacherBasicInfoToSheet(options) {
  return runRegistryProfileBatchSync_(collectTeacherBasicInfoSheetRows, syncTeacherBasicInfoBatchQuiet, Object.assign({
    sheetName: SHEET_NAMES.teacherBasicInfo,
    chunkSize: 10,
    delayMs: 500,
    progressLabel: 'ข้อมูลพื้นฐานครู',
    startMessage: 'กำลังซิงค์ข้อมูลพื้นฐานครู (แยกคอลัมน์)...',
    doneMessage: 'ซิงค์ข้อมูลพื้นฐานครูเสร็จแล้ว'
  }, options || {}));
}

function syncAllStudentTreatmentHistoryToSheet(options) {
  return runRegistryProfileBatchSync_(collectStudentTreatmentHistorySheetRows, syncStudentTreatmentHistoryBatchQuiet, Object.assign({
    sheetName: SHEET_NAMES.studentTreatmentHistory,
    chunkSize: 20,
    delayMs: 450,
    progressLabel: 'ประวัติการรักษานักเรียน',
    startMessage: 'กำลังซิงค์ประวัติการรักษานักเรียน (แยกรายการ)...',
    doneMessage: 'ซิงค์ประวัติการรักษานักเรียนเสร็จแล้ว'
  }, options || {}));
}

function syncAllTeacherTreatmentHistoryToSheet(options) {
  return runRegistryProfileBatchSync_(collectTeacherTreatmentHistorySheetRows, syncTeacherTreatmentHistoryBatchQuiet, Object.assign({
    sheetName: SHEET_NAMES.teacherTreatmentHistory,
    chunkSize: 20,
    delayMs: 450,
    progressLabel: 'ประวัติการรักษาครู',
    startMessage: 'กำลังซิงค์ประวัติการรักษาครู (แยกรายการ)...',
    doneMessage: 'ซิงค์ประวัติการรักษาครูเสร็จแล้ว'
  }, options || {}));
}

function syncRegistryProfileExtrasQuiet_(kind, id) {
  if (!id) return;
  if (kind === 'student') {
    syncStudentBasicInfoQuiet(id);
    syncStudentTreatmentHistoryQuiet(id);
    return;
  }
  if (kind === 'teacher') {
    syncTeacherBasicInfoQuiet(id);
    syncTeacherTreatmentHistoryQuiet(id);
  }
}

function visitProviderNameForSheet_(record) {
  if (record.providerName) return String(record.providerName).trim();
  if (!record.provider) return '';
  return String(record.provider).replace(/\s*\([^)]*\)\s*$/, '').trim();
}

function buildVisitSheetRow(record) {
  var slim = buildVisitSheetRowSlim_(record);
  var providerName = slim['ผู้ให้บริการ'] || '';
  return Object.assign({}, slim, {
    'ชื่อ-นามสกุล': slim['ชื่อ'] || '',
    'ชื่อนามสกุล': slim['ชื่อ'] || '',
    'ชั้น/ตำแหน่ง': slim['ระดับชั้น/ตำแหน่ง'] || '',
    'ชั้น': slim['ระดับชั้น/ตำแหน่ง'] || '',
    'อาการ/ปัญหาสุขภาพ': slim['อาการ'] || '',
    'อุณหภูมิ(°C)': slim['อุณหภูมิร่างกาย'] || '',
    'อุณหภูมิ': slim['อุณหภูมิร่างกาย'] || '',
    'ความดัน': slim['ความดันโลหิต'] || '',
    'การรักษาและยา': slim['การรักษาและยาที่ให้'] || '',
    name: slim['ชื่อ'] || '',
    class: slim['ระดับชั้น/ตำแหน่ง'] || '',
    type: slim['ประเภทผู้รับบริการ'] || '',
    symptom: slim['อาการ'] || '',
    temp: slim['อุณหภูมิร่างกาย'] || '',
    bp: slim['ความดันโลหิต'] || '',
    pulse: slim['ชีพจร'] || '',
    diagnosis: slim['การวินิจฉัยเบื้องต้น'] || '',
    treatment: slim['การรักษาและยาที่ให้'] || '',
    result: slim['ผลการรักษา'] || '',
    provider: providerName,
    providerName: providerName,
    providerRole: slim['ตำแหน่งผู้ให้บริการ'] || '',
    providerClass: slim['ระดับชั้นผู้ให้บริการ (นักเรียน)'] || '',
    recordedAt: slim['วันที่เวลา'] || ''
  });
}

function buildMentalSheetRow(record, type) {
  var id = record.id || '';
  var name = record.name || '';
  var row = {
    'เลขประจำตัวนักเรียน': id,
    'รหัสนักเรียน': id,
    'ชื่อนามสกุล': name,
    'ชื่อ-นามสกุล': name,
    'ชั้น': record.class || '',
    'เพศ': record.sex || '',
    'อายุ': record.age != null && record.age !== '' ? String(record.age) : '',
    id: id,
    name: name,
    class: record.class || '',
    sex: record.sex || '',
    age: record.age != null && record.age !== '' ? String(record.age) : ''
  };
  var scoreStr = record.score != null ? String(record.score) : '';
  var riskStr = record.risk || '';
  var cellVal = riskStr ? (scoreStr + ' (' + riskStr + ')') : scoreStr;
  if (type === 'sdq') {
    row['SDQ'] = cellVal;
  } else if (type === '9q') {
    row['ซึมเศร้า'] = cellVal;
  } else if (type === 'assist') {
    row['ASSIST'] = cellVal;
  }
  return row;
}

function syncMentalToSheetQuiet(record, type) {
  if (!type || !SHEET_NAMES.mental) return;
  var payload = {
    action: 'upsertMental',
    sheet: SHEET_NAMES.mental,
    matchKey: 'เลขประจำตัวนักเรียน',
    row: buildMentalSheetRow(record, type)
  };
  ensureSheetSyncDom_();
  syncPayloadQuiet(payload);
}

function buildMentalTeacherScreeningSheetRow(record, type) {
  record = record || {};
  type = type || record.type || '';
  var tool = record.tool || '';
  if (!tool) {
    if (type === 'sdq') tool = 'SDQ (พฤติกรรม)';
    else if (type === '9q') tool = 'คัดกรองซึมเศร้า (9Q)';
    else if (type === 'assist') tool = 'ASSIST (สารเสพติด)';
  }
  var detailParts = [];
  if (record.detail) {
    if (record.detail.subscales) {
      var s = record.detail.subscales;
      detailParts.push('อารมณ์ ' + (s.emotional != null ? s.emotional : '—') +
        ' · พฤติกรรม ' + (s.conduct != null ? s.conduct : '—') +
        ' · สมาธิ ' + (s.hyper != null ? s.hyper : '—') +
        ' · เพื่อน ' + (s.peer != null ? s.peer : '—'));
    }
    if (record.detail.q9 != null) detailParts.push('ข้อ 9 = ' + record.detail.q9);
    if (record.detail.substances && record.detail.substances.length) {
      detailParts.push('สาร: ' + record.detail.substances.join(', '));
    }
  }
  var teacherId = '';
  var teacherName = '';
  var teacherClass = '';
  if (typeof loggedInTeacherId !== 'undefined' && loggedInTeacherId) {
    teacherId = String(loggedInTeacherId);
  }
  if (typeof lookupTeacher === 'function' && teacherId) {
    var t = lookupTeacher(teacherId);
    if (t) {
      teacherName = t.fullName || '';
      teacherClass = t.classLevel || '';
      teacherId = t.id || teacherId;
    }
  }
  if (!teacherName && typeof resolveLoggedInDisplayName === 'function') {
    try { teacherName = resolveLoggedInDisplayName() || ''; } catch (e) {}
  }
  if (!teacherClass && typeof getLoggedInTeacherHomeroom === 'function') {
    try { teacherClass = getLoggedInTeacherHomeroom() || ''; } catch (e2) {}
  }
  return {
    'รหัสรายการ': '',
    'วันที่บันทึก': record.recordedAt || new Date().toLocaleString('th-TH'),
    'รหัสนักเรียน': record.id || '',
    'ชื่อ-นามสกุล': record.name || '',
    'ชั้น': record.class || '',
    'เพศ': record.sex || '',
    'อายุ': record.age != null && record.age !== '' ? String(record.age) : '',
    'ประเภทแบบประเมิน': tool,
    'คะแนน': record.score != null ? String(record.score) : '',
    'ระดับความเสี่ยง': record.risk || '',
    'รายละเอียด': detailParts.join(' | '),
    'รหัสครูผู้บันทึก': teacherId,
    'ชื่อครูผู้บันทึก': teacherName,
    'ประจำชั้นครู': teacherClass,
    id: record.id || '',
    name: record.name || '',
    uid: '',
    tool: tool,
    score: record.score != null ? String(record.score) : '',
    risk: record.risk || '',
    teacherId: teacherId,
    teacherName: teacherName,
    teacherClass: teacherClass
  };
}

/** เมื่อครูบันทึกแบบประเมินสุขภาพจิต → ชีต ผลตรวจคัดกรอง_ครู */
function syncMentalTeacherScreeningToSheetQuiet(record, type) {
  if (!SHEET_NAMES.mentalTeacher || !record) return Promise.resolve({ ok: false });
  var row = buildMentalTeacherScreeningSheetRow(record, type);
  var uid = 'mh-t-' + String(record.id || '') + '-' + String(record.type || type || '') + '-' +
    String(record.savedAt || Date.now());
  row['รหัสรายการ'] = uid;
  row.uid = uid;
  ensureSheetSyncDom_();
  return syncUpsertRowQuiet(SHEET_NAMES.mentalTeacher, 'รหัสรายการ', row);
}
window.syncMentalTeacherScreeningToSheetQuiet = syncMentalTeacherScreeningToSheetQuiet;

function buildAppointmentSheetRow(studentId, apptData) {
  apptData = apptData || {};
  return {
    'เลขประจำตัว': studentId || '',
    'ชื่อ-นามสกุล': apptData.studentName || '',
    'วันที่นัด': apptData.date || '',
    'เวลา': apptData.time || '',
    'เรื่อง': apptData.purpose || '',
    'สถานที่': apptData.place || '',
    'หมายเหตุ': apptData.note || '',
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': getSyncRoleLabel(),
    id: studentId || '',
    name: apptData.studentName || '',
    date: apptData.date || '',
    time: apptData.time || '',
    purpose: apptData.purpose || '',
    place: apptData.place || '',
    note: apptData.note || ''
  };
}

function syncAppointmentToSheetQuiet(studentId, apptData) {
  if (!SHEET_NAMES.appointment) return;
  var payload = {
    action: 'upsertAppointment',
    sheet: SHEET_NAMES.appointment,
    matchKey: 'เลขประจำตัว',
    row: buildAppointmentSheetRow(studentId, apptData)
  };
  ensureSheetSyncDom_();
  syncPayloadQuiet(payload);
}

function deleteAppointmentFromSheetQuiet(studentId) {
  if (!SHEET_NAMES.appointment) return;
  var payload = {
    action: 'deleteAppointment',
    sheet: SHEET_NAMES.appointment,
    studentId: String(studentId || '').trim()
  };
  ensureSheetSyncDom_();
  syncPayloadQuiet(payload);
}

function fetchAppointmentFromSheet(studentId) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.WEB_APP_URL || !studentId) {
    return Promise.resolve(null);
  }
  var payload = { action: 'getAppointment', studentId: String(studentId).trim() };
  var url = SHEETS_CONFIG.WEB_APP_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  return fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) return null;
      var data;
      try { data = JSON.parse(text); } catch (e) { return null; }
      if (data && data.ok && data.appointment && data.appointment.date) return data.appointment;
      return null;
    })
    .catch(function() { return null; });
}

function sheetIdsMatch_(a, b) {
  var sa = String(a == null ? '' : a).trim();
  var sb = String(b == null ? '' : b).trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  var na = parseInt(sa, 10);
  var nb = parseInt(sb, 10);
  return !isNaN(na) && !isNaN(nb) && na === nb;
}

function parseGvizJson_(text) {
  if (!text) return null;
  var jsonText = text;
  var marker = 'google.visualization.Query.setResponse(';
  var start = text.indexOf(marker);
  if (start !== -1) {
    jsonText = text.slice(start + marker.length);
    if (jsonText.slice(-2) === ');') jsonText = jsonText.slice(0, -2);
    else if (jsonText.slice(-1) === ')') jsonText = jsonText.slice(0, -1);
  }
  try { return JSON.parse(jsonText); } catch (e) { return null; }
}

function gvizCell_(row, idx) {
  if (!row || !row.c || !row.c[idx] || row.c[idx].v == null || row.c[idx].v === '') return '';
  if (row.c[idx].f != null && row.c[idx].f !== '') return String(row.c[idx].f);
  return String(row.c[idx].v);
}

function findGvizColIndex_(cols, names) {
  var normalized = {};
  for (var i = 0; i < cols.length; i++) {
    var label = String(cols[i].label || '').replace(/\s+/g, '').toLowerCase();
    normalized[label] = i;
  }
  for (var n = 0; n < names.length; n++) {
    var key = String(names[n]).replace(/\s+/g, '').toLowerCase();
    if (normalized[key] !== undefined) return normalized[key];
  }
  return -1;
}

/** แปลงปีที่ซ้ำพ.ศ. (เช่น 3112 / 2569 ที่เก็บผิดเป็น ค.ศ.) ให้เป็น ค.ศ. จริง */
function coerceVisitGregorianYear_(year) {
  var y = Number(year);
  if (!isFinite(y)) return 0;
  if (y > 0 && y < 100) y = 2500 + y - 543;
  /* 3112 = พ.ศ. ที่ถูก format ด้วย th-TH อีกรอบ → ลดทีละ 543 จนเข้าช่วง ค.ศ. */
  var guard = 0;
  while (y >= 2400 && y <= 3300 && guard < 4) {
    y -= 543;
    guard++;
  }
  return y;
}

function normalizeVisitEpochMs_(ts) {
  if (ts == null || typeof ts !== 'number' || !isFinite(ts) || ts <= 0) return 0;
  var ms = ts;
  if (ts >= 1e9 && ts < 1e11) ms = ts * 1000;
  else if (ts < 1e11) return 0;
  var d = new Date(ms);
  if (isNaN(d.getTime())) return 0;
  var y = d.getFullYear();
  if (y >= 2400 && y <= 3300) {
    var fixedY = coerceVisitGregorianYear_(y);
    if (fixedY >= 2000 && fixedY <= 2100) {
      d.setFullYear(fixedY);
      ms = d.getTime();
      y = fixedY;
    }
  }
  if (y < 2000 || y > 2100) return 0;
  /* ไม่นับเวลาอนาคตเกิน 2 วัน (กันพ.ศ.ผิด / นาฬิกาเพี้ยนทำให้ติด "วันนี้" ตลอด) */
  if (ms > Date.now() + 2 * 24 * 60 * 60 * 1000) return 0;
  return ms;
}

function parseVisitRecordedAt(s) {
  if (!s) return 0;
  var t = String(s).trim();
  if (!t || t === 'ตัวอย่างข้อมูล' || t === '—') return 0;
  var thMonths = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
  };
  var thMatch = t.match(/(\d{1,2})\s+([ก-ฮ\.]+)\s+(\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (thMatch) {
    var day = parseInt(thMatch[1], 10);
    var monKey = thMatch[2];
    var year = coerceVisitGregorianYear_(parseInt(thMatch[3], 10));
    var hour = parseInt(thMatch[4] || '12', 10);
    var min = parseInt(thMatch[5] || '0', 10);
    var sec = parseInt(thMatch[6] || '0', 10);
    var month = thMonths[monKey];
    if (!month) {
      Object.keys(thMonths).forEach(function(k) {
        if (!month && monKey.indexOf(k.replace(/\./g, '')) !== -1) month = thMonths[k];
      });
    }
    if (month && year >= 2000 && year <= 2100) {
      return normalizeVisitEpochMs_(new Date(year, month - 1, day, hour, min, sec).getTime());
    }
  }
  var slash = t.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slash) {
    var d2 = parseInt(slash[1], 10);
    var m2 = parseInt(slash[2], 10);
    var y2 = coerceVisitGregorianYear_(parseInt(slash[3], 10));
    var timeMatch = t.match(/(\d{1,2}):(\d{2})/);
    var hh = timeMatch ? parseInt(timeMatch[1], 10) : 12;
    var mm = timeMatch ? parseInt(timeMatch[2], 10) : 0;
    if (y2 >= 2000 && y2 <= 2100) {
      return normalizeVisitEpochMs_(new Date(y2, m2 - 1, d2, hh, mm, 0).getTime());
    }
  }
  var direct = new Date(t);
  if (!isNaN(direct.getTime())) {
    var dy = coerceVisitGregorianYear_(direct.getFullYear());
    if (dy >= 2000 && dy <= 2100 && dy !== direct.getFullYear()) {
      direct.setFullYear(dy);
    }
    return normalizeVisitEpochMs_(direct.getTime());
  }
  return 0;
}

function isValidVisitSavedAt(ts) {
  return normalizeVisitEpochMs_(ts) > 0;
}

function resolveVisitSavedAt(record) {
  record = record || {};
  var fromSaved = normalizeVisitEpochMs_(record.savedAt);
  if (fromSaved) return fromSaved;
  var m = String(record.recordId || '').match(/^v-(\d{11,})-/);
  if (m) {
    var fromId = normalizeVisitEpochMs_(parseInt(m[1], 10));
    if (fromId) return fromId;
  }
  var parsed = parseVisitRecordedAt(record.recordedAt);
  if (parsed) return parsed;
  return 0;
}

var VISIT_KNOWN_RESULTS_ = [
  'กลับชั้นเรียนได้', 'พักที่ห้องพยาบาล', 'แจ้งผู้ปกครองรับกลับบ้าน', 'แจ้งผู้ปกครองมารับ', 'ส่งต่อโรงพยาบาล'
];
var VISIT_KNOWN_SYMPTOMS_ = [
  'หวัด/น้ำมูก', 'ไข้หวัด / หวัดใหญ่', 'ปวดศีรษะ', 'ปวดท้อง',
  'ปวดท้องจุกเสียด/กระเพาะอาหาร', 'เจ็บคอ', 'ทอนซิลอักเสบ', 'ภูมิแพ้', 'โรคผิวหนัง',
  'อาการเวียนศีรษะ', 'บาดแผล / อุบัติเหตุ', 'ปัญหาสุขภาพจิต / ความเครียด', 'อื่นๆ', 'อื่น ๆ'
];

function isClientVisitRecordId_(recordId) {
  return /^v-\d{10,}-[a-z0-9]+$/i.test(String(recordId || '').trim());
}

function applySheetVisitTimestamp_(record, rowIndex) {
  if (!record) return record;
  var ts = resolveVisitSavedAt(record);
  if (ts && isValidVisitSavedAt(ts)) {
    record.savedAt = ts;
    if (!record.recordedAt) record.recordedAt = new Date(ts).toLocaleString('th-TH');
    record.fromSheet = true;
    if (!record.sheetRow) record.sheetRow = (typeof rowIndex === 'number' ? rowIndex : 0) + 2;
    /* คงรหัสรายการจากเครื่อง/ชีท — อย่าทับเป็น v-sheet-rN ซึ่งทำให้รายการซ้ำ */
    var rid = String(record.recordId || '').trim();
    if (!rid) {
      record.recordId = 'v-sheet-r' + record.sheetRow + '-' + record.id;
    } else if (!isClientVisitRecordId_(rid) && rid.indexOf('v-sheet-') !== 0) {
      record.recordId = 'v-sheet-r' + record.sheetRow + '-' + record.id;
    }
    delete record.timeRepaired;
    return record;
  }
  return assignSheetVisitUndated_(record, rowIndex);
}

/** รายการชีตไม่มีวันที่ — อย่าสร้างเวลาเป็นวันนี้ (เคยทำให้รายการเก่ารั่วเข้าวันนี้/ซ้ำ) */
function assignSheetVisitUndated_(record, rowIndex) {
  if (!record) return record;
  record.fromSheet = true;
  if (!record.sheetRow) record.sheetRow = (typeof rowIndex === 'number' ? rowIndex : 0) + 2;
  var rid = String(record.recordId || '').trim();
  if (!rid) {
    record.recordId = 'v-sheet-r' + record.sheetRow + '-' + (record.id || 'x');
  } else if (!isClientVisitRecordId_(rid) && rid.indexOf('v-sheet-') !== 0) {
    record.recordId = 'v-sheet-r' + record.sheetRow + '-' + (record.id || 'x');
  }
  if (record.savedAt && !isValidVisitSavedAt(record.savedAt)) delete record.savedAt;
  delete record.timeRepaired;
  return record;
}

function assignSheetVisitTodayTime_(record, rowIndex) {
  /* เก็บชื่อเดิมไว้ให้โค้ดเก่าเรียกได้ — พฤติกรรมใหม่คือไม่สร้างวันนี้อัตโนมัติ */
  return assignSheetVisitUndated_(record, rowIndex);
}

function parseGvizVisitDateTime_(row, idx) {
  if (!row || !row.c || !row.c[idx] || row.c[idx].v == null || row.c[idx].v === '') return 0;
  var cell = row.c[idx];
  if (typeof cell.v === 'string' && cell.v.indexOf('Date(') === 0) {
    var dm = String(cell.v).match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?/);
    if (dm) {
      var y = coerceVisitGregorianYear_(parseInt(dm[1], 10));
      var mo = parseInt(dm[2], 10);
      var d = parseInt(dm[3], 10);
      var h = parseInt(dm[4] || 0, 10);
      var mi = parseInt(dm[5] || 0, 10);
      var sec = parseInt(dm[6] || 0, 10);
      var ts = normalizeVisitEpochMs_(new Date(y, mo, d, h, mi, sec).getTime());
      if (ts) return ts;
    }
  }
  var f = cell.f != null && cell.f !== '' ? String(cell.f) : String(cell.v);
  var parsed = parseVisitRecordedAt(f);
  return isValidVisitSavedAt(parsed) ? parsed : 0;
}

function visitMatchKnownOption_(val, options) {
  var v = String(val || '').trim();
  if (!v) return '';
  for (var i = 0; i < options.length; i++) {
    var o = options[i];
    if (v === o || v.indexOf(o) !== -1 || o.indexOf(v) !== -1) return v;
  }
  return '';
}

function isCompactVisitSheetLayout_(cols) {
  var idxDate = findGvizColIndex_(cols, ['วันที่เวลา', 'วันที่บันทึก', 'recordedat']);
  if (idxDate >= 0) return false;
  var idxName = findGvizColIndex_(cols, ['ชื่อ', 'ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxSymptom = findGvizColIndex_(cols, ['อาการ', 'อาการ/ปัญหาสุขภาพ', 'symptom']);
  if (idxName >= 0 && idxSymptom >= 0) return false;
  var idxId = findGvizColIndex_(cols, ['รหัส', 'เลขประจำตัว', 'รหัสนักเรียน', 'id']);
  return idxId === 0;
}

function parseCompactVisitRowFromCells_(cells, rowIndex) {
  if (!cells || !cells.length) return null;
  var id = String(cells[0] || '').trim();
  if (!/^\d{4,6}$/.test(id)) return null;
  var record = {
    id: id,
    name: '',
    class: '',
    type: 'นักเรียน',
    symptom: '',
    temp: '',
    bp: '',
    pulse: '',
    diagnosis: '',
    treatment: '',
    result: '',
    provider: '',
    recordedAt: '',
    sheetRow: rowIndex + 2,
    fromSheet: true
  };
  var vals = [];
  for (var c = 1; c < cells.length; c++) {
    var v = String(cells[c] || '').trim();
    if (v) vals.push(v);
  }
  if (vals[0] === 'นักเรียน' || vals[0] === 'ครู' || vals[0] === 'บุคลากร') {
    record.type = vals[0];
    vals = vals.slice(1);
  }
  var providerCandidates = [];
  vals.forEach(function(val) {
    if (visitMatchKnownOption_(val, VISIT_KNOWN_RESULTS_)) {
      record.result = val;
      return;
    }
    if (visitMatchKnownOption_(val, VISIT_KNOWN_SYMPTOMS_)) {
      record.diagnosis = val;
      record.symptom = val;
      return;
    }
    if (/^\d{2,3}\/\d{2,3}$/.test(val)) {
      record.bp = val;
      return;
    }
    if (/^\d+(\.\d+)?$/.test(val)) {
      var n = parseFloat(val);
      if (n >= 35 && n <= 42 && !record.temp) {
        record.temp = val;
        return;
      }
      if (n >= 50 && n <= 250 && !record.pulse) {
        record.pulse = val;
        return;
      }
    }
    providerCandidates.push(val);
  });
  if (!record.provider && providerCandidates.length) {
    record.provider = providerCandidates[providerCandidates.length - 1];
  }
  /* แถว compact ไม่มีวันที่ — ไม่สร้างรายการผีด้วยเวลาวันนี้ */
  if (!record.recordedAt && !record.savedAt) return null;
  applySheetVisitTimestamp_(record, rowIndex);
  return record;
}

function parseGvizVisitRows_(gvizData, studentId) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var compactLayout = isCompactVisitSheetLayout_(cols);
  var idxId = findGvizColIndex_(cols, ['รหัส', 'เลขประจำตัว', 'รหัสนักเรียน', 'id']);
  var idxDate = findGvizColIndex_(cols, ['วันที่เวลา', 'วันที่บันทึก', 'recordedat']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ', 'ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ระดับชั้น/ตำแหน่ง', 'ระบดับชั้น/ตำแหน่ง', 'ชั้น/ตำแหน่ง', 'ชั้น', 'class']);
  var idxType = findGvizColIndex_(cols, ['ประเภทผู้รับบริการ', 'type']);
  var idxSymptom = findGvizColIndex_(cols, ['อาการ/ปัญหาสุขภาพ', 'อาการ', 'symptom']);
  var idxTemp = findGvizColIndex_(cols, ['อุณหภูมิ(°c)', 'อุณหภูมิร่างกาย', 'อุณหภูมิ', 'temp']);
  var idxBp = findGvizColIndex_(cols, ['ความดันโลหิต', 'ความดัน', 'bp']);
  var idxPulse = findGvizColIndex_(cols, ['ชีพจร', 'pulse']);
  var idxDiag = findGvizColIndex_(cols, ['การวินิจฉัยเบื้องต้น', 'การวินิจฉัย', 'diagnosis']);
  var idxTreat = findGvizColIndex_(cols, ['การรักษาและยาที่ให้', 'การรักษาและยา', 'การรักษา', 'treatment']);
  var idxResult = findGvizColIndex_(cols, ['ผลการรักษา', 'result']);
  var idxProvider = findGvizColIndex_(cols, ['ผู้ให้บริการ', 'provider']);
  var idxProviderRole = findGvizColIndex_(cols, ['ตำแหน่งผู้ให้บริการ', 'providerrole']);
  var idxProviderClass = findGvizColIndex_(cols, ['ระดับชั้นผู้ให้บริการ (นักเรียน)', 'providerclass']);
  var idxMedicine = findGvizColIndex_(cols, ['ยาที่ให้', 'medicine']);
  var idxRecordId = findGvizColIndex_(cols, ['รหัสรายการ', 'recordid']);
  /* ใช้ legacy เฉพาะชีตเก่าที่ไม่มีหัวคอลัมน์ชื่อ/อาการ — อย่าทับ index ที่หาได้จากหัวตาราง */
  var legacyLayout = !compactLayout && idxDate < 0 && idxId === 0 && cols[0] && cols[0].type === 'number'
    && idxName < 0 && idxSymptom < 0;
  if (legacyLayout) {
    idxId = 0;
    idxName = 1;
    idxClass = 2;
    idxType = 3;
    idxSymptom = 4;
    idxTemp = 6;
    idxBp = 7;
    idxDiag = 8;
    idxTreat = 9;
    idxResult = 10;
    idxProvider = 11;
  }
  var visits = [];
  table.rows.forEach(function(row, rowIndex) {
    if (compactLayout) {
      var cells = [];
      for (var ci = 0; ci < (row.c || []).length; ci++) cells.push(gvizCell_(row, ci));
      var compact = parseCompactVisitRowFromCells_(cells, rowIndex);
      if (!compact) return;
      if (studentId && !sheetIdsMatch_(compact.id, studentId)) return;
      visits.push(compact);
      return;
    }
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    id = String(id || '').trim();
    if (!id || (studentId && !sheetIdsMatch_(id, studentId))) return;
    var recordedAt = idxDate >= 0 ? gvizCell_(row, idxDate) : '';
    var savedAt = idxDate >= 0 ? parseGvizVisitDateTime_(row, idxDate) : 0;
    if (!savedAt) savedAt = resolveVisitSavedAt({ recordedAt: recordedAt });
    var sheetName = idxName >= 0 ? gvizCell_(row, idxName) : '';
    if (sheetName === 'นักเรียน' || sheetName === 'ครู' || sheetName === 'บุคลากร') sheetName = '';
    visits.push({
      recordId: idxRecordId >= 0 ? String(gvizCell_(row, idxRecordId) || '').trim() : '',
      id: id,
      name: sheetName,
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      type: idxType >= 0 ? gvizCell_(row, idxType) : '',
      symptom: idxSymptom >= 0 ? gvizCell_(row, idxSymptom) : '',
      temp: idxTemp >= 0 ? gvizCell_(row, idxTemp) : '',
      bp: idxBp >= 0 ? gvizCell_(row, idxBp) : '',
      pulse: idxPulse >= 0 ? gvizCell_(row, idxPulse) : '',
      diagnosis: idxDiag >= 0 ? gvizCell_(row, idxDiag) : '',
      treatment: idxTreat >= 0 ? gvizCell_(row, idxTreat) : '',
      result: idxResult >= 0 ? gvizCell_(row, idxResult) : '',
      provider: idxProvider >= 0 ? gvizCell_(row, idxProvider) : '',
      providerName: idxProvider >= 0 ? gvizCell_(row, idxProvider) : '',
      providerRole: idxProviderRole >= 0 ? gvizCell_(row, idxProviderRole) : '',
      providerClass: idxProviderClass >= 0 ? gvizCell_(row, idxProviderClass) : '',
      recordedAt: recordedAt,
      sheetRow: rowIndex + 2,
      fromSheet: true
    });
    var rec = visits[visits.length - 1];
    if (!rec.symptom && rec.diagnosis) rec.symptom = rec.diagnosis;
    var meds = idxMedicine >= 0 ? gvizCell_(row, idxMedicine) : '';
    if (meds) {
      rec.treatment = rec.treatment ? (rec.treatment + ' · ' + meds) : meds;
    }
    if (!rec.type) rec.type = 'นักเรียน';
    if (savedAt && isValidVisitSavedAt(savedAt)) {
      rec.savedAt = savedAt;
      /* ใช้เวลาจากค่าดิบ Date(…) เมื่อข้อความ f ไม่มีเวลา */
      if (!recordedAt || !/\d{1,2}:\d{2}/.test(String(recordedAt))) {
        rec.recordedAt = new Date(savedAt).toLocaleString('th-TH');
      }
      rec.recordId = rec.recordId || ('v-sheet-r' + rec.sheetRow + '-' + id);
    } else {
      applySheetVisitTimestamp_(rec, rowIndex);
      if (idxRecordId >= 0) {
        var ridFromSheet = String(gvizCell_(row, idxRecordId) || '').trim();
        if (ridFromSheet) rec.recordId = ridFromSheet;
      }
    }
  });
  visits.sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
  return visits;
}

function fetchVisitRecordsFromGviz(studentId) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID || !studentId) {
    return Promise.resolve([]);
  }
  var sheetName = (SHEET_NAMES && SHEET_NAMES.visit) ? SHEET_NAMES.visit : 'บันทึกการรักษา';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEETS_CONFIG.SPREADSHEET_ID +
    '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(sheetName);
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var data = parseGvizJson_(text);
      if (!data || data.status !== 'ok') return [];
      return parseGvizVisitRows_(data, studentId);
    })
    .catch(function() { return []; });
}

function fetchVisitRecordsFromSheetApi(studentId) {
  if (!SHEETS_CONFIG.WEB_APP_URL || !studentId) return Promise.resolve([]);
  var payload = { action: 'getVisits', studentId: String(studentId).trim() };
  var url = SHEETS_CONFIG.WEB_APP_URL + '?payload=' + encodeURIComponent(JSON.stringify(payload));
  return fetch(url, { method: 'GET', mode: 'cors', redirect: 'follow' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      if (text.indexOf('Sign in') !== -1 || text.indexOf('AccountChooser') !== -1) return [];
      var data;
      try { data = JSON.parse(text); } catch (e) { return []; }
      if (data && data.ok && Array.isArray(data.visits)) return data.visits;
      return [];
    })
    .catch(function() { return []; });
}

function fetchVisitRecordsFromSheet(studentId) {
  if (!SHEETS_CONFIG.ENABLED || !studentId) return Promise.resolve([]);
  return fetchVisitRecordsFromSheetApi(studentId).then(function(visits) {
    if (visits && visits.length) return visits;
    return fetchVisitRecordsFromGviz(studentId);
  });
}

function fetchAllVisitRecordsFromGviz() {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID) {
    return Promise.resolve([]);
  }
  var sheetName = (SHEET_NAMES && SHEET_NAMES.visit) ? SHEET_NAMES.visit : 'บันทึกการรักษา';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEETS_CONFIG.SPREADSHEET_ID +
    '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(sheetName);
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var data = parseGvizJson_(text);
      if (!data || data.status !== 'ok') return [];
      return parseGvizVisitRows_(data, null);
    })
    .catch(function() { return []; });
}

function fetchAllVisitRecordsFromSheet() {
  if (!SHEETS_CONFIG.ENABLED) return Promise.resolve([]);
  return fetchAllVisitRecordsFromGviz();
}

function padGvizDate2_(n) {
  return n < 10 ? '0' + n : String(n);
}

function parseGvizDateToIso_(row, idx) {
  if (!row || !row.c || !row.c[idx] || row.c[idx].v == null || row.c[idx].v === '') return '';
  var cell = row.c[idx];
  if (typeof cell.v === 'string' && cell.v.indexOf('Date(') === 0) {
    var dm = cell.v.match(/Date\((\d+),(\d+),(\d+)/);
    if (dm) {
      var y = parseInt(dm[1], 10);
      var mo = parseInt(dm[2], 10) + 1;
      var d = parseInt(dm[3], 10);
      if (y >= 2400) y -= 543;
      return y + '-' + padGvizDate2_(mo) + '-' + padGvizDate2_(d);
    }
  }
  var f = cell.f != null && cell.f !== '' ? String(cell.f) : String(cell.v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(f)) return f;
  var slash = f.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (slash) {
    var day = parseInt(slash[1], 10);
    var month = parseInt(slash[2], 10);
    var be = parseInt(slash[3], 10);
    if (be < 100) be = 2500 + be;
    else if (be < 2400) be += 543;
    return (be - 543) + '-' + padGvizDate2_(month) + '-' + padGvizDate2_(day);
  }
  return '';
}

function parseGvizCalendarRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสกิจกรรม', 'id']);
  var idxStart = findGvizColIndex_(cols, ['วันเริ่ม', 'datestart']);
  var idxEnd = findGvizColIndex_(cols, ['วันสิ้นสุด', 'dateend']);
  var idxText = findGvizColIndex_(cols, ['รายละเอียดงาน', 'ชื่อกิจกรรม', 'text']);
  var idxStatus = findGvizColIndex_(cols, ['สถานะ', 'status']);
  var idxOrder = findGvizColIndex_(cols, ['ลำดับ', 'order']);
  if (idxStart < 0) {
    for (var ci = 0; ci < cols.length; ci++) {
      if (cols[ci].type === 'date') {
        if (idxStart < 0) idxStart = ci;
        else if (idxEnd < 0) idxEnd = ci;
      }
    }
  }
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    var dateStart = idxStart >= 0 ? parseGvizDateToIso_(row, idxStart) : '';
    var dateEnd = idxEnd >= 0 ? parseGvizDateToIso_(row, idxEnd) : '';
    var text = idxText >= 0 ? gvizCell_(row, idxText) : '';
    var status = idxStatus >= 0 ? gvizCell_(row, idxStatus) : '';
    if (!text || !dateStart) return;
    var order = idxOrder >= 0 ? gvizCell_(row, idxOrder) : String(rowIndex + 1);
    if (!id) {
      id = 'cal-sheet-' + order + '-' + dateStart;
    }
    if (!dateEnd) dateEnd = dateStart;
    items.push({
      id: String(id).trim(),
      sheetOrder: order,
      dateStart: dateStart,
      dateEnd: dateEnd,
      text: String(text).trim(),
      done: status === 'เสร็จแล้ว',
      fromSheet: true
    });
  });
  return items;
}

function fetchAllCalendarFromGviz() {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID) {
    return Promise.resolve([]);
  }
  var sheetName = (SHEET_NAMES && SHEET_NAMES.calendar) ? SHEET_NAMES.calendar : 'ปฏิทินโรงเรียน';
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEETS_CONFIG.SPREADSHEET_ID +
    '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(sheetName);
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var data = parseGvizJson_(text);
      if (!data || data.status !== 'ok') return [];
      return parseGvizCalendarRows_(data);
    })
    .catch(function() { return []; });
}

function fetchAllCalendarFromSheet() {
  if (!SHEETS_CONFIG.ENABLED) return Promise.resolve([]);
  return fetchAllCalendarFromGviz();
}

function fetchGvizSheet_(sheetName) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID || !sheetName) {
    return Promise.resolve(null);
  }
  var url = 'https://docs.google.com/spreadsheets/d/' + SHEETS_CONFIG.SPREADSHEET_ID +
    '/gviz/tq?tqx=out:json&headers=1&sheet=' + encodeURIComponent(sheetName);
  return fetch(url, { method: 'GET', mode: 'cors' })
    .then(function(res) { return res.text(); })
    .then(function(text) {
      var data = parseGvizJson_(text);
      if (!data || data.status !== 'ok') return null;
      return data;
    })
    .catch(function() { return null; });
}

function sheetRowSavedAt_(row, idxDate, rowIndex, cols) {
  if (idxDate >= 0 && cols && cols[idxDate]) {
    var col = cols[idxDate];
    var cell = row.c && row.c[idxDate];
    if (cell && cell.v && String(cell.v).indexOf('Date(') === 0) {
      var dm = String(cell.v).match(/Date\((\d+),(\d+),(\d+)(?:,(\d+),(\d+),(\d+))?/);
      if (dm) {
        var y = parseInt(dm[1], 10);
        if (y >= 2400) y -= 543;
        var mo = parseInt(dm[2], 10);
        var d = parseInt(dm[3], 10);
        var h = parseInt(dm[4] || 0, 10);
        var mi = parseInt(dm[5] || 0, 10);
        var sec = parseInt(dm[6] || 0, 10);
        return new Date(y, mo, d, h, mi, sec).getTime();
      }
    }
    if (col.type === 'date') {
      var iso = parseGvizDateToIso_(row, idxDate);
      if (iso) {
        var p = iso.split('-');
        return new Date(parseInt(p[0], 10), parseInt(p[1], 10) - 1, parseInt(p[2], 10)).getTime();
      }
    }
  }
  return Date.now() - (rowIndex || 0) * 120000;
}

function screeningTypeFromLabel_(label) {
  var map = {
    'สายตา': 'vision',
    'การได้ยิน': 'hearing',
    'โลหิตจาง': 'blood',
    'ช่องปาก': 'oral',
    'ร่างกาย': 'physical',
    'สมรรถภาพร่างกาย': 'fitness',
    'สมรรถภาพ': 'fitness'
  };
  return map[String(label || '').trim()] || '';
}

function parseMentalScoreRisk_(val) {
  if (!val || !String(val).trim()) return null;
  var s = String(val).trim();
  var m = s.match(/^(\d+(?:\.\d+)?)\s*(?:\(([^)]+)\))?/);
  return {
    score: m ? m[1] : s,
    risk: m && m[2] ? m[2] : ''
  };
}

function parseGvizNutritionRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxSex = findGvizColIndex_(cols, ['เพศ', 'sex']);
  var idxAge = findGvizColIndex_(cols, ['อายุ', 'age']);
  var idxWeight = findGvizColIndex_(cols, ['น้ำหนัก(kg)', 'น้ำหนัก', 'weight']);
  var idxHeight = findGvizColIndex_(cols, ['ส่วนสูง(cm)', 'ส่วนสูง', 'height']);
  var idxBmi = findGvizColIndex_(cols, ['bmi']);
  var idxCat = findGvizColIndex_(cols, ['สถานะโภชนาการ', 'category']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    if (!id) return;
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    items.push({
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      sex: idxSex >= 0 ? gvizCell_(row, idxSex) : '',
      age: idxAge >= 0 ? gvizCell_(row, idxAge) : '',
      weight: idxWeight >= 0 ? gvizCell_(row, idxWeight) : '',
      height: idxHeight >= 0 ? gvizCell_(row, idxHeight) : '',
      bmi: idxBmi >= 0 ? gvizCell_(row, idxBmi) : '',
      category: idxCat >= 0 ? gvizCell_(row, idxCat) : '',
      date: idxDate >= 0 ? gvizCell_(row, idxDate) : '',
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizScreeningRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxSex = findGvizColIndex_(cols, ['เพศ', 'sex']);
  var idxAge = findGvizColIndex_(cols, ['อายุ', 'age']);
  var idxType = findGvizColIndex_(cols, ['ประเภทการตรวจ', 'type']);
  var idxSummary = findGvizColIndex_(cols, ['ผลสรุป', 'summary']);
  var idxDetail = findGvizColIndex_(cols, ['รายละเอียด', 'detail']);
  var idxRecorder = findGvizColIndex_(cols, ['ผู้บันทึก', 'recorder']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    var typeLabel = idxType >= 0 ? gvizCell_(row, idxType) : '';
    var type = screeningTypeFromLabel_(typeLabel);
    if (!id || !type) return;
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    var recordedAt = idxDate >= 0 ? gvizCell_(row, idxDate) : '';
    items.push({
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      sex: idxSex >= 0 ? gvizCell_(row, idxSex) : '',
      age: idxAge >= 0 ? gvizCell_(row, idxAge) : '',
      type: type,
      summary: idxSummary >= 0 ? gvizCell_(row, idxSummary) : '',
      detail: idxDetail >= 0 ? { note: gvizCell_(row, idxDetail) } : {},
      recorderName: idxRecorder >= 0 ? gvizCell_(row, idxRecorder) : '',
      recordedAt: recordedAt,
      savedAt: savedAt,
      recordId: 'scr-sheet-' + rowIndex + '-' + id + '-' + type,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizChronicRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxDisease = findGvizColIndex_(cols, ['โรคประจำตัว', 'disease']);
  var idxMed = findGvizColIndex_(cols, ['ยาที่ใช้', 'medicine']);
  var idxPhone = findGvizColIndex_(cols, ['เบอร์ติดต่อฉุกเฉิน', 'phone']);
  var idxNote = findGvizColIndex_(cols, ['หมายเหตุ', 'note']);
  var idxCare = findGvizColIndex_(cols, ['แผนการดูแล', 'careplan', 'การดูแล']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    var disease = idxDisease >= 0 ? gvizCell_(row, idxDisease) : '';
    if (!id || !disease) return;
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    items.push({
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      disease: disease,
      medicine: idxMed >= 0 ? gvizCell_(row, idxMed) : '',
      phone: idxPhone >= 0 ? gvizCell_(row, idxPhone) : '',
      note: idxNote >= 0 ? gvizCell_(row, idxNote) : '',
      carePlan: idxCare >= 0 ? gvizCell_(row, idxCare) : '',
      recordedAt: idxDate >= 0 ? gvizCell_(row, idxDate) : '',
      savedAt: savedAt,
      recordId: 'chr-sheet-' + rowIndex + '-' + id,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizDiseaseStudentRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxDisease = findGvizColIndex_(cols, ['โรคที่พบ/สงสัย', 'disease']);
  var idxSymDate = findGvizColIndex_(cols, ['วันที่เริ่มมีอาการ', 'symptomdate']);
  var idxNote = findGvizColIndex_(cols, ['อาการ/รายละเอียด', 'note']);
  var idxStatus = findGvizColIndex_(cols, ['สถานะ', 'status']);
  var idxDate = findGvizColIndex_(cols, ['วันที่รายงาน', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    var disease = idxDisease >= 0 ? gvizCell_(row, idxDisease) : '';
    if (!id || !disease) return;
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    items.push({
      source: 'student',
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      disease: disease,
      symptomDate: idxSymDate >= 0 ? gvizCell_(row, idxSymDate) : '',
      note: idxNote >= 0 ? gvizCell_(row, idxNote) : '',
      status: idxStatus >= 0 ? gvizCell_(row, idxStatus) : 'รอตรวจสอบ',
      recordedAt: idxDate >= 0 ? gvizCell_(row, idxDate) : '',
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizDiseaseStaffRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxDisease = findGvizColIndex_(cols, ['โรคที่พบ', 'disease']);
  var idxPatients = findGvizColIndex_(cols, ['จำนวนผู้ป่วย', 'patients']);
  var idxRoom = findGvizColIndex_(cols, ['ห้องเรียน/กลุ่ม', 'room']);
  var idxStart = findGvizColIndex_(cols, ['วันที่เริ่มพบ', 'startdate']);
  var idxMeasures = findGvizColIndex_(cols, ['มาตรการที่ดำเนินการ', 'measures']);
  var idxDate = findGvizColIndex_(cols, ['วันที่รายงาน', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var disease = idxDisease >= 0 ? gvizCell_(row, idxDisease) : '';
    if (!disease) return;
    var measuresRaw = idxMeasures >= 0 ? gvizCell_(row, idxMeasures) : '';
    var measures = measuresRaw ? String(measuresRaw).split(/\s*,\s*/) : [];
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    items.push({
      source: 'staff',
      disease: disease,
      patients: idxPatients >= 0 ? gvizCell_(row, idxPatients) : '',
      room: idxRoom >= 0 ? gvizCell_(row, idxRoom) : '',
      startDate: idxStart >= 0 ? gvizCell_(row, idxStart) : '',
      measures: measures,
      recordedAt: idxDate >= 0 ? gvizCell_(row, idxDate) : '',
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizMentalRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['เลขประจำตัวนักเรียน', 'รหัสนักเรียน', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อนามสกุล', 'ชื่อ-นามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxSex = findGvizColIndex_(cols, ['เพศ', 'sex']);
  var idxAge = findGvizColIndex_(cols, ['อายุ', 'age']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'วันที่', 'recordedat']);
  var idxSdq = findGvizColIndex_(cols, ['sdq']);
  var idx9q = findGvizColIndex_(cols, ['ซึมเศร้า', '9q', 'depression']);
  var idxAssist = findGvizColIndex_(cols, ['assist']);
  var toolMap = {
    sdq: 'SDQ (พฤติกรรม)',
    '9q': 'คัดกรองซึมเศร้า (9Q)',
    assist: 'ASSIST (สารเสพติด)'
  };
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    if (!id) return;
    var savedAt = 0;
    if (idxDate >= 0) {
      savedAt = typeof parseGvizVisitDateTime_ === 'function' ? parseGvizVisitDateTime_(row, idxDate) : 0;
      if (!savedAt && typeof parseVisitRecordedAt === 'function') {
        savedAt = parseVisitRecordedAt(gvizCell_(row, idxDate)) || 0;
      }
    }
    var base = {
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      sex: idxSex >= 0 ? gvizCell_(row, idxSex) : '',
      age: idxAge >= 0 ? gvizCell_(row, idxAge) : '',
      savedAt: savedAt,
      fromSheet: true
    };
    [
      { type: 'sdq', idx: idxSdq },
      { type: '9q', idx: idx9q },
      { type: 'assist', idx: idxAssist }
    ].forEach(function(col, ci) {
      if (col.idx < 0) return;
      var parsed = parseMentalScoreRisk_(gvizCell_(row, col.idx));
      if (!parsed) return;
      var itemSaved = savedAt || 0;
      items.push(Object.assign({}, base, {
        type: col.type,
        tool: toolMap[col.type] || col.type,
        score: parsed.score,
        risk: parsed.risk,
        recordedAt: itemSaved
          ? new Date(itemSaved - ci * 1000).toLocaleString('th-TH')
          : (idxDate >= 0 ? gvizCell_(row, idxDate) : ''),
        savedAt: itemSaved ? (itemSaved - ci * 1000) : 0,
        recordId: 'mh-sheet-' + rowIndex + '-' + id + '-' + col.type
      }));
    });
  });
  return items;
}

function fetchAllAssessmentDataFromSheet() {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID) {
    return Promise.resolve({});
  }
  var specs = [
    { key: 'nutrition', name: SHEET_NAMES.nutrition, parser: parseGvizNutritionRows_ },
    { key: 'screening', name: SHEET_NAMES.screening, parser: parseGvizScreeningRows_ },
    { key: 'chronic', name: SHEET_NAMES.chronic, parser: parseGvizChronicRows_ },
    { key: 'diseaseStudent', name: SHEET_NAMES.diseaseStudent, parser: parseGvizDiseaseStudentRows_ },
    { key: 'diseaseStaff', name: SHEET_NAMES.diseaseStaff, parser: parseGvizDiseaseStaffRows_ },
    { key: 'mental', name: SHEET_NAMES.mental, parser: parseGvizMentalRows_ }
  ];
  return Promise.all(specs.map(function(spec) {
    if (!spec.name) return Promise.resolve({ key: spec.key, items: [] });
    return fetchGvizSheet_(spec.name).then(function(data) {
      return { key: spec.key, items: data ? spec.parser(data) : [] };
    });
  })).then(function(results) {
    var out = {};
    results.forEach(function(r) { out[r.key] = r.items || []; });
    return out;
  });
}

function isDeployedAppHost() {
  var h = String((typeof location !== 'undefined' && location.hostname) || '').toLowerCase();
  return !!(h && h !== 'localhost' && h !== '127.0.0.1');
}

function localStorageNeedsSheetBootstrap() {
  var keys = ['sh-visit', 'sh-nutrition', 'sh-chronic', 'sh-screening', 'sh-vaccine', 'sh-emergency', 'sh-referral'];
  for (var i = 0; i < keys.length; i++) {
    try {
      var raw = localStorage.getItem(keys[i]);
      if (!raw || raw === '[]' || raw === '{}') continue;
      var parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length) return false;
      if (parsed && typeof parsed === 'object' && Object.keys(parsed).length) return false;
    } catch (e) {}
  }
  return true;
}

function shouldBootstrapCloudData(force) {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID) return false;
  var lastAt = 0;
  try { lastAt = parseInt(localStorage.getItem('sh-cloud-bootstrap-at') || '0', 10) || 0; } catch (e) {}
  var age = Date.now() - lastAt;
  /* ถ้ายังไม่มีข้อมูลในเครื่องเลย — โหลดทันที */
  if (typeof localStorageNeedsSheetBootstrap === 'function' && localStorageNeedsSheetBootstrap()) return true;
  /* force (เช่น กดรีเฟรช) อย่างน้อยห่าง 90 วินาที */
  if (force) return age >= 90000;
  /* เปิดหน้าปกติ — รีโหลดทั้งชุดไม่บ่อยกว่า 3 นาที เพื่อลดอาการค้าง */
  return age >= 180000;
}

function parseGvizVaccineRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxRecordId = findGvizColIndex_(cols, ['รหัสรายการ', 'recordid']);
  var idxId = findGvizColIndex_(cols, ['เลขประจำตัว', 'รหัสนักเรียน', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อนามสกุล', 'ชื่อ-นามสกุล', 'name']);
  var idxVac = findGvizColIndex_(cols, ['วัคซีนที่ฉีด', 'vaccine']);
  var idxDate = findGvizColIndex_(cols, ['วันที่ฉีด', 'date']);
  var idxRecorded = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    var vaccine = idxVac >= 0 ? gvizCell_(row, idxVac) : '';
    if (!id || !vaccine) return;
    var savedAt = sheetRowSavedAt_(row, idxRecorded, rowIndex, cols);
    items.push({
      recordId: idxRecordId >= 0 ? gvizCell_(row, idxRecordId) : ('vac-sheet-' + rowIndex + '-' + id),
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      vaccine: vaccine,
      date: idxDate >= 0 ? gvizCell_(row, idxDate) : '',
      recordedAt: idxRecorded >= 0 ? gvizCell_(row, idxRecorded) : '',
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizEmergencyRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxWhen = findGvizColIndex_(cols, ['วันที่เวลา', 'eventat']);
  var idxName = findGvizColIndex_(cols, ['ชื่อผู้บาดเจ็บ/เจ็บป่วย', 'ชื่อ', 'name']);
  var idxType = findGvizColIndex_(cols, ['ประเภทเหตุการณ์', 'type']);
  var idxLoc = findGvizColIndex_(cols, ['สถานที่เกิดเหตุ', 'location']);
  var idxAid = findGvizColIndex_(cols, ['การปฐมพยาบาล', 'firstaid']);
  var idxResult = findGvizColIndex_(cols, ['ผลลัพธ์', 'result']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var name = idxName >= 0 ? gvizCell_(row, idxName) : '';
    if (!name) return;
    var eventAt = idxWhen >= 0 ? gvizCell_(row, idxWhen) : '';
    var savedAt = parseVisitRecordedAt(eventAt) || sheetRowSavedAt_(row, idxWhen, rowIndex, cols);
    items.push({
      name: name,
      type: idxType >= 0 ? gvizCell_(row, idxType) : '',
      location: idxLoc >= 0 ? gvizCell_(row, idxLoc) : '',
      firstaid: idxAid >= 0 ? gvizCell_(row, idxAid) : '',
      result: idxResult >= 0 ? gvizCell_(row, idxResult) : '',
      eventAt: eventAt,
      recordedAt: eventAt,
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizReferralRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxUid = findGvizColIndex_(cols, ['รหัสรายการ', 'uid']);
  var idxId = findGvizColIndex_(cols, ['รหัส', 'เลขประจำตัว', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name']);
  var idxClass = findGvizColIndex_(cols, ['ชั้น', 'class']);
  var idxHospital = findGvizColIndex_(cols, ['สถานพยาบาล', 'hospital']);
  var idxUrgency = findGvizColIndex_(cols, ['ความเร่งด่วน', 'urgency']);
  var idxReason = findGvizColIndex_(cols, ['สาเหตุ/อาการ', 'reason']);
  var idxParent = findGvizColIndex_(cols, ['แจ้งผู้ปกครอง', 'parentnotified']);
  var idxNote = findGvizColIndex_(cols, ['หมายเหตุ', 'note']);
  var idxStatus = findGvizColIndex_(cols, ['สถานะ', 'status']);
  var idxFollow = findGvizColIndex_(cols, ['ผลติดตาม', 'followupnote']);
  var idxSource = findGvizColIndex_(cols, ['แหล่งข้อมูล', 'source']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var name = idxName >= 0 ? gvizCell_(row, idxName) : '';
    if (!name) return;
    var recordedAt = idxDate >= 0 ? gvizCell_(row, idxDate) : '';
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    items.push({
      uid: idxUid >= 0 ? gvizCell_(row, idxUid) : ('ref-sheet-' + rowIndex),
      id: idxId >= 0 ? gvizCell_(row, idxId) : '',
      name: name,
      class: idxClass >= 0 ? gvizCell_(row, idxClass) : '',
      hospital: idxHospital >= 0 ? gvizCell_(row, idxHospital) : '',
      urgency: idxUrgency >= 0 ? gvizCell_(row, idxUrgency) : '',
      reason: idxReason >= 0 ? gvizCell_(row, idxReason) : '',
      parentNotified: idxParent >= 0 ? gvizCell_(row, idxParent) : '',
      note: idxNote >= 0 ? gvizCell_(row, idxNote) : '',
      status: idxStatus >= 0 ? gvizCell_(row, idxStatus) : 'รอติดตาม',
      followupNote: idxFollow >= 0 ? gvizCell_(row, idxFollow) : '',
      source: idxSource >= 0 ? gvizCell_(row, idxSource) : 'sheet',
      sourceKey: 'sheet:' + rowIndex,
      recordedAt: recordedAt,
      savedAt: savedAt,
      fromSheet: true
    });
  });
  return items;
}

function parseGvizEnvironmentRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxDate = findGvizColIndex_(cols, ['วันที่ตรวจ', 'recordedat']);
  var idxResult = findGvizColIndex_(cols, ['ผลการตรวจ', 'result']);
  var idxPassed = findGvizColIndex_(cols, ['รายการที่ผ่าน', 'passed']);
  var idxFailed = findGvizColIndex_(cols, ['รายการที่ยังไม่ผ่าน', 'failed']);
  var idxBy = findGvizColIndex_(cols, ['ผู้บันทึก', 'recordedby']);
  var items = [];
  table.rows.forEach(function(row, rowIndex) {
    var recordedAt = idxDate >= 0 ? gvizCell_(row, idxDate) : '';
    if (!recordedAt) return;
    var passedRaw = idxPassed >= 0 ? gvizCell_(row, idxPassed) : '';
    var failedRaw = idxFailed >= 0 ? gvizCell_(row, idxFailed) : '';
    var envItems = [];
    if (passedRaw) passedRaw.split(/\s*\|\s*/).forEach(function(t) { if (t) envItems.push({ text: t, checked: true }); });
    if (failedRaw) failedRaw.split(/\s*\|\s*/).forEach(function(t) { if (t) envItems.push({ text: t, checked: false }); });
    var passCount = envItems.filter(function(it) { return it.checked; }).length;
    var resultText = idxResult >= 0 ? gvizCell_(row, idxResult) : '';
    var m = resultText.match(/(\d+)\s*\/\s*(\d+)/);
    if (m) {
      passCount = parseInt(m[1], 10) || passCount;
      var totalFromResult = parseInt(m[2], 10);
    }
    items.push({
      items: envItems,
      passCount: passCount,
      total: m ? (parseInt(m[2], 10) || envItems.length) : envItems.length,
      recordedAt: recordedAt,
      recordedBy: idxBy >= 0 ? gvizCell_(row, idxBy) : '',
      savedAt: sheetRowSavedAt_(row, idxDate, rowIndex, cols),
      fromSheet: true
    });
  });
  return items;
}

function parseGvizMedicineRows_(gvizData) {
  var table = gvizData && gvizData.table;
  if (!table || !Array.isArray(table.rows)) return [];
  var cols = table.cols || [];
  var idxId = findGvizColIndex_(cols, ['รหัสยา', 'id']);
  var idxName = findGvizColIndex_(cols, ['ชื่อยา', 'name']);
  var idxCat = findGvizColIndex_(cols, ['ประเภท', 'category']);
  var idxQty = findGvizColIndex_(cols, ['จำนวนคงเหลือ', 'qty']);
  var idxUnit = findGvizColIndex_(cols, ['หน่วย', 'unit']);
  var idxExpiry = findGvizColIndex_(cols, ['วันหมดอายุ', 'expiry']);
  var idxStatus = findGvizColIndex_(cols, ['สถานะ', 'status']);
  var idxDate = findGvizColIndex_(cols, ['วันที่บันทึก', 'recordedat']);
  var byId = {};
  table.rows.forEach(function(row, rowIndex) {
    var id = idxId >= 0 ? gvizCell_(row, idxId) : '';
    if (!id) return;
    var savedAt = sheetRowSavedAt_(row, idxDate, rowIndex, cols);
    var item = {
      id: String(id).trim(),
      name: idxName >= 0 ? gvizCell_(row, idxName) : '',
      category: idxCat >= 0 ? gvizCell_(row, idxCat) : '',
      qty: idxQty >= 0 ? (parseInt(gvizCell_(row, idxQty), 10) || 0) : 0,
      unit: idxUnit >= 0 ? gvizCell_(row, idxUnit) : '',
      expiry: idxExpiry >= 0 ? gvizCell_(row, idxExpiry) : '',
      status: idxStatus >= 0 ? gvizCell_(row, idxStatus) : '',
      savedAt: savedAt,
      fromSheet: true
    };
    if (!byId[item.id] || (item.savedAt || 0) >= (byId[item.id].savedAt || 0)) {
      byId[item.id] = item;
    }
  });
  return Object.keys(byId).map(function(k) { return byId[k]; });
}

function fetchAllCloudDataFromSheet() {
  if (!SHEETS_CONFIG.ENABLED || !SHEETS_CONFIG.SPREADSHEET_ID) {
    return Promise.resolve(null);
  }
  return Promise.all([
    fetchAllVisitRecordsFromGviz().catch(function() { return []; }),
    fetchAllAssessmentDataFromSheet().catch(function() { return {}; }),
    fetchAllCalendarFromGviz().catch(function() { return []; }),
    fetchStudentRegistryFromSheet().catch(function() { return []; }),
    fetchTeacherRegistryFromSheet().catch(function() { return []; }),
    fetchGvizSheet_(SHEET_NAMES.vaccine).then(function(d) { return d ? parseGvizVaccineRows_(d) : []; }).catch(function() { return []; }),
    fetchGvizSheet_(SHEET_NAMES.emergency).then(function(d) { return d ? parseGvizEmergencyRows_(d) : []; }).catch(function() { return []; }),
    fetchGvizSheet_(SHEET_NAMES.referral).then(function(d) { return d ? parseGvizReferralRows_(d) : []; }).catch(function() { return []; }),
    fetchGvizSheet_(SHEET_NAMES.environment).then(function(d) { return d ? parseGvizEnvironmentRows_(d) : []; }).catch(function() { return []; }),
    fetchGvizSheet_(SHEET_NAMES.medicine).then(function(d) { return d ? parseGvizMedicineRows_(d) : []; }).catch(function() { return []; })
  ]).then(function(parts) {
    return {
      visits: parts[0] || [],
      assessment: parts[1] || {},
      calendar: parts[2] || [],
      studentRegistry: parts[3] || [],
      teacherRegistry: parts[4] || [],
      vaccine: parts[5] || [],
      emergency: parts[6] || [],
      referral: parts[7] || [],
      environment: parts[8] || [],
      medicine: parts[9] || []
    };
  });
}

window.isDeployedAppHost = isDeployedAppHost;
window.localStorageNeedsSheetBootstrap = localStorageNeedsSheetBootstrap;
window.shouldBootstrapCloudData = shouldBootstrapCloudData;
window.fetchAllCloudDataFromSheet = fetchAllCloudDataFromSheet;
window.fetchStudentRegistryFromSheet = fetchStudentRegistryFromSheet;
window.fetchTeacherRegistryFromSheet = fetchTeacherRegistryFromSheet;
window.buildStudentRegistrySheetRow = buildStudentRegistrySheetRow;
window.buildStudentBasicInfoSheetRow = buildStudentBasicInfoSheetRow;
window.buildTeacherRegistrySheetRow = buildTeacherRegistrySheetRow;
window.syncStudentRegistryEntryQuiet = syncStudentRegistryEntryQuiet;
window.syncTeacherRegistryEntryQuiet = syncTeacherRegistryEntryQuiet;
window.syncStudentRegistryBatchQuiet = syncStudentRegistryBatchQuiet;
window.syncStudentBasicInfoBatchQuiet = syncStudentBasicInfoBatchQuiet;
window.syncTeacherRegistryBatchQuiet = syncTeacherRegistryBatchQuiet;
window.syncStudentBasicInfoQuiet = syncStudentBasicInfoQuiet;
window.syncTeacherBasicInfoQuiet = syncTeacherBasicInfoQuiet;
window.syncStudentTreatmentHistoryQuiet = syncStudentTreatmentHistoryQuiet;
window.syncTeacherTreatmentHistoryQuiet = syncTeacherTreatmentHistoryQuiet;
window.syncAllStudentBasicInfoToSheet = syncAllStudentBasicInfoToSheet;
window.syncAllTeacherBasicInfoToSheet = syncAllTeacherBasicInfoToSheet;
window.syncAllStudentTreatmentHistoryToSheet = syncAllStudentTreatmentHistoryToSheet;
window.syncAllTeacherTreatmentHistoryToSheet = syncAllTeacherTreatmentHistoryToSheet;
window.syncRegistryProfileExtrasQuiet_ = syncRegistryProfileExtrasQuiet_;
window.syncVisitRecordToSheet = syncVisitRecordToSheet;
window.syncAllLocalVisitRecordsToSheet = syncAllLocalVisitRecordsToSheet;
window.buildVisitSheetRow = buildVisitSheetRow;

document.addEventListener('DOMContentLoaded', function() {
  ensureSheetSyncDom_();
  flushSheetQueue_();
});
