/**
 * ระบบอนามัยโรงเรียนบ้านไผ่ — Google Sheets Backend
 * Sheet: https://docs.google.com/spreadsheets/d/15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw
 *
 * Deploy Web App:
 *   Execute as: Me
 *   Who has access: Anyone (ถ้า Workspace ไม่มี Anyone ให้ใช้ Anyone in organization
 *   แล้วผู้ใช้ต้องล็อกอิน @banphai.ac.th ใน Chrome ขณะใช้เว็บ)
 */

var SPREADSHEET_ID = '15IlAOVYRi3MixwzvhwO10ZkDonm_oam_wzSM-3-BpIw';

var SHEET_SCHEMAS = {
  'บันทึกการรักษา': [
    'วันที่เวลา', 'รหัส', 'ชื่อ', 'ระดับชั้น/ตำแหน่ง', 'ประเภทผู้รับบริการ',
    'อาการ', 'อุณหภูมิร่างกาย', 'ความดันโลหิต', 'ชีพจร', 'การวินิจฉัยเบื้องต้น',
    'การรักษาและยาที่ให้', 'ผลการรักษา', 'ผู้ให้บริการ', 'ตำแหน่งผู้ให้บริการ',
    'ระดับชั้นผู้ให้บริการ (นักเรียน)', 'บทบาทผู้บันทึก', 'รหัสรายการ'
  ],
  'ภาวะโภชนาการ': [
    'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'เพศ', 'อายุ',
    'น้ำหนัก(kg)', 'ส่วนสูง(cm)', 'BMI', 'สถานะโภชนาการ', 'บทบาทผู้บันทึก'
  ],
  'วัคซีน': [
    'รหัสรายการ', 'เลขประจำตัว', 'ชื่อนามสกุล', 'วัคซีนที่ฉีด', 'วันที่ฉีด', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'โรคเรื้อรัง': [
    'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'โรคประจำตัว',
    'ยาที่ใช้', 'เบอร์ติดต่อฉุกเฉิน', 'หมายเหตุ', 'แผนการดูแล', 'บทบาทผู้บันทึก'
  ],
  'รายงานโรคติดต่อ_นักเรียน': [
    'วันที่รายงาน', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'โรคที่พบ/สงสัย',
    'วันที่เริ่มมีอาการ', 'อาการ/รายละเอียด', 'สถานะ'
  ],
  'รายงานโรคติดต่อ_เจ้าหน้าที่': [
    'วันที่รายงาน', 'โรคที่พบ', 'จำนวนผู้ป่วย', 'ห้องเรียน/กลุ่ม', 'วันที่เริ่มพบ',
    'มาตรการที่ดำเนินการ', 'บทบาทผู้บันทึก'
  ],
  'เหตุฉุกเฉิน': [
    'วันที่เวลา', 'ชื่อผู้บาดเจ็บ/เจ็บป่วย', 'ประเภทเหตุการณ์', 'สถานที่เกิดเหตุ',
    'การปฐมพยาบาล', 'ผลลัพธ์', 'บทบาทผู้บันทึก'
  ],
  'ส่งต่อและติดตาม': [
    'รหัสรายการ', 'วันที่บันทึก', 'รหัส', 'ชื่อ-นามสกุล', 'ชั้น', 'สถานพยาบาล', 'ความเร่งด่วน',
    'สาเหตุ/อาการ', 'แจ้งผู้ปกครอง', 'หมายเหตุ', 'สถานะ', 'ผลติดตาม', 'แหล่งข้อมูล', 'บทบาทผู้บันทึก'
  ],
  'อนามัยสิ่งแวดล้อม': [
    'วันที่ตรวจ', 'ผลการตรวจ', 'รายการที่ผ่าน', 'รายการที่ยังไม่ผ่าน', 'ผู้บันทึก'
  ],
  'สุขภาพจิต': [
    'เลขประจำตัวนักเรียน', 'ชื่อนามสกุล', 'ชั้น', 'เพศ', 'อายุ',
    'SDQ', 'ซึมเศร้า', 'ASSIST'
  ],
  'ผลตรวจคัดกรอง_ครู': [
    'รหัสรายการ', 'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'เพศ', 'อายุ',
    'ประเภทแบบประเมิน', 'คะแนน', 'ระดับความเสี่ยง', 'รายละเอียด',
    'รหัสครูผู้บันทึก', 'ชื่อครูผู้บันทึก', 'ประจำชั้นครู'
  ],
  'ใบนัด': [
    'เลขประจำตัว', 'ชื่อ-นามสกุล', 'วันที่นัด', 'เวลา', 'เรื่อง',
    'สถานที่', 'หมายเหตุ', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'ตรวจคัดกรอง': [
    'วันที่บันทึก', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'เพศ', 'อายุ',
    'ประเภทการตรวจ', 'ผลสรุป', 'รายละเอียด', 'ผู้บันทึก', 'บทบาทผู้บันทึก'
  ],
  'ปฏิทินโรงเรียน': [
    'ลำดับ', 'วันเริ่ม', 'วันสิ้นสุด', 'รายละเอียดงาน', 'สถานะ', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'คลังยา': [
    'รหัสยา', 'ชื่อยา', 'ประเภท', 'จำนวนคงเหลือ', 'หน่วย', 'วันหมดอายุ',
    'สถานะ', 'จำนวนที่รับเพิ่ม', 'ประเภทการบันทึก', 'หมายเหตุ', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'แจ้งเตือนงานอนามัย': [
    'รหัสแจ้งเตือน', 'ข้อความ', 'ระดับความสำคัญ', 'สถานะ', 'ผู้เผยแพร่', 'วันที่เผยแพร่', 'วันที่แก้ไข'
  ],
  'ความรู้ด้านอนามัย': [
    'รหัสบทความ', 'หมวดหมู่', 'หัวข้อ', 'เนื้อหา', 'ผู้เขียน', 'ลิงก์วิดีโอ', 'วันที่เผยแพร่'
  ],
  'ข้อมูลสุขภาพนักเรียน': [
    'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'แพ้ยา', 'แพ้อาหาร', 'ข้อควรระวัง',
    'เบอร์ผู้ปกครอง', 'โรคประจำตัว', 'วันที่บันทึก', 'บทบาทผู้บันทึก'
  ],
  'ทะเบียนนักเรียน': [
    'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'อายุ', 'เพศ',
    'โรคประจำตัว', 'แพ้ยา', 'แพ้อาหาร', 'ข้อควรระวัง',
    'เบอร์ผู้ปกครอง', 'วันที่อัปเดต'
  ],
  'ทะเบียนครู': [
    'รหัสครู', 'ชื่อ-นามสกุล', 'กลุ่มสาระ', 'สังกัด', 'ประจำชั้น',
    'เบอร์โทร', 'อีเมล', 'โรคประจำตัว', 'แพ้ยา', 'แพ้อาหาร',
    'ข้อควรระวัง', 'วันที่อัปเดต'
  ],
  'ข้อมูลพื้นฐานนักเรียน': [
    'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'เลขประจำตัวประชาชน', 'เพศ', 'วันเกิด', 'อายุ',
    'ศาสนา', 'เชื้อชาติ', 'สัญชาติ', 'น้ำหนัก(kg)', 'ส่วนสูง(cm)', 'กลุ่มเลือด', 'ความด้อยโอกาส',
    'ที่อยู่', 'ผู้ปกครอง', 'ความสัมพันธ์ผู้ปกครอง', 'เบอร์ผู้ปกครอง', 'อาชีพผู้ปกครอง',
    'บิดา', 'อาชีพบิดา', 'มารดา', 'อาชีพมารดา',
    'โรคประจำตัว', 'แพ้ยา', 'แพ้อาหาร', 'ข้อควรระวัง', 'วันที่อัปเดต'
  ],
  'ข้อมูลพื้นฐานครู': [
    'รหัสครู', 'ชื่อ-นามสกุล', 'กลุ่มสาระ', 'สังกัด', 'ประจำชั้น', 'เบอร์โทร', 'อีเมล',
    'โรคประจำตัว', 'แพ้ยา', 'แพ้อาหาร', 'ข้อควรระวัง', 'วันที่อัปเดต'
  ],
  'ประวัติการรักษานักเรียน': [
    'รหัสรายการ', 'รหัสนักเรียน', 'ชื่อ-นามสกุล', 'ชั้น', 'วันที่เวลา', 'อาการ',
    'อุณหภูมิร่างกาย', 'ความดันโลหิต', 'ชีพจร', 'การวินิจฉัยเบื้องต้น',
    'การรักษาและยาที่ให้', 'ผลการรักษา', 'ผู้ให้บริการ', 'วันที่อัปเดต'
  ],
  'ประวัติการรักษาครู': [
    'รหัสรายการ', 'รหัสครู', 'ชื่อ-นามสกุล', 'กลุ่มสาระ', 'วันที่เวลา', 'อาการ',
    'การวินิจฉัยเบื้องต้น', 'การรักษาและยาที่ให้', 'ผลการรักษา', 'ผู้ให้บริการ', 'วันที่อัปเดต'
  ]
};

/** คีย์จากเว็บ → คีย์ในชีต (รองรับหัวคอลัมน์หลายแบบ) */
var FIELD_ALIASES = {
  'เลขประจำตัว': ['รหัสนักเรียน', 'เลขประจำตัวนักเรียน', 'รหัส', 'id'],
  'เลขประจำตัวนักเรียน': ['รหัสนักเรียน', 'เลขประจำตัว', 'รหัส', 'id'],
  'ชื่อนามสกุล': ['ชื่อ-นามสกุล', 'ชื่อ', 'name'],
  'วัคซีนที่ฉีด': ['วัคซีน', 'vaccine'],
  'วันที่ฉีด': ['date'],
  'วันที่บันทึก': ['recordedAt'],
  'รหัสกิจกรรม': ['id'],
  'รหัสรายการ': ['recordId', 'uid'],
  'วันที่เวลา': ['recordedAt', 'eventAt'],
  'รหัสนักเรียน': ['รหัส', 'id', 'เลขประจำตัว', 'เลขประจำตัวนักเรียน'],
  'รหัสครู': ['รหัส', 'id'],
  'กลุ่มสาระ': ['subjectGroup'],
  'สังกัด': ['affiliation'],
  'ประจำชั้น': ['classLevel', 'ชั้น'],
  'เบอร์โทร': ['phone', 'เบอร์ผู้ปกครอง'],
  'อีเมล': ['email'],
  'ชื่อ': ['ชื่อ-นามสกุล', 'ชื่อนามสกุล', 'name'],
  'ชื่อ-นามสกุล': ['ชื่อ', 'ชื่อนามสกุล', 'name'],
  'ระบดับชั้น/ตำแหน่ง': ['ระดับชั้น/ตำแหน่ง', 'ชั้น/ตำแหน่ง', 'ชั้น', 'class'],
  'ระดับชั้น/ตำแหน่ง': ['ระบดับชั้น/ตำแหน่ง', 'ชั้น/ตำแหน่ง', 'ชั้น', 'class'],
  'อาการ': ['อาการ/ปัญหาสุขภาพ', 'symptom'],
  'อุณหภูมิร่างกาย': ['อุณหภูมิ(°C)', 'อุณหภูมิ', 'temp'],
  'การรักษาและยาที่ให้': ['การรักษาและยา', 'treatment'],
  'ตำแหน่งผู้ให้บริการ': ['providerRole'],
  'ระดับชั้นผู้ให้บริการ (นักเรียน)': ['providerClass', 'providerStudentClass'],
  'โรคที่พบ/สงสัย': ['disease'],
  'อาการ/รายละเอียด': ['note'],
  'ชั้น/ตำแหน่ง': ['class'],
  'อาการ/ปัญหาสุขภาพ': ['symptom'],
  'อุณหภูมิ(°C)': ['temp'],
  'ความดันโลหิต': ['bp'],
  'ชีพจร': ['pulse'],
  'การวินิจฉัยเบื้องต้น': ['diagnosis'],
  'การรักษาและยา': ['treatment'],
  'ผลการรักษา': ['result'],
  'ผู้ให้บริการ': ['provider', 'providerName'],
  'ชื่อผู้บาดเจ็บ/เจ็บป่วย': ['name'],
  'ประเภทเหตุการณ์': ['type'],
  'สถานที่เกิดเหตุ': ['location'],
  'การปฐมพยาบาล': ['firstaid'],
  'ผลลัพธ์': ['result'],
  'โรคประจำตัว': ['disease'],
  'ยาที่ใช้': ['medicine'],
  'เบอร์ติดต่อฉุกเฉิน': ['phone'],
  'หมายเหตุ': ['note'],
  'น้ำหนัก(kg)': ['weight', 'น้ำหนัก', 'น้ำหนัก(กก.)', 'น้ำหนัก (kg)', 'น้ำหนัก (กก.)'],
  'น้ำหนัก': ['weight', 'น้ำหนัก(kg)', 'น้ำหนัก(กก.)', 'น้ำหนัก (kg)', 'น้ำหนัก (กก.)'],
  'ส่วนสูง(cm)': ['height', 'ส่วนสูง', 'ส่วนสูง(ซม.)', 'ส่วนสูง (cm)', 'ส่วนสูง (ซม.)'],
  'ส่วนสูง': ['height', 'ส่วนสูง(cm)', 'ส่วนสูง(ซม.)', 'ส่วนสูง (cm)', 'ส่วนสูง (ซม.)'],
  'BMI': ['bmi'],
  'ชั้น': ['class'],
  'เพศ': ['sex'],
  'อายุ': ['age'],
  'สถานะโภชนาการ': ['category'],
  'โรคที่พบ': ['disease'],
  'จำนวนผู้ป่วย': ['patients'],
  'ห้องเรียน/กลุ่ม': ['room'],
  'วันที่เริ่มพบ': ['startDate', 'symptomDate'],
  'มาตรการที่ดำเนินการ': ['measures'],
  'ผลการตรวจ': ['passCount'],
  'รายการที่ผ่าน': ['passed'],
  'รายการที่ยังไม่ผ่าน': ['failed'],
  'SDQ': ['sdq'],
  'ซึมเศร้า': ['nineq', '9q', 'depression'],
  'ASSIST': ['assist'],
  'ระดับความเสี่ยง SDQ': ['riskSdq', 'risk'],
  'ระดับความเสี่ยง ซึมเศร้า': ['risk9q', 'risk'],
  'ระดับความเสี่ยง ASSIST': ['riskAssist', 'risk'],
  'วันที่บันทึก SDQ': ['recordedAtSdq'],
  'วันที่บันทึก ซึมเศร้า': ['recordedAt9q'],
  'วันที่บันทึก ASSIST': ['recordedAtAssist'],
  'วันที่นัด': ['date'],
  'เวลา': ['time'],
  'เรื่อง': ['purpose'],
  'สถานที่': ['place'],
  'ลำดับ': ['index', 'order'],
  'รายละเอียดงาน': ['text'],
  'วันเริ่ม': ['dateStart'],
  'วันสิ้นสุด': ['dateEnd'],
  'ประเภทการตรวจ': ['type'],
  'ผลสรุป': ['summary'],
  'รายละเอียด': ['detail'],
  'รหัสยา': ['id', 'medId'],
  'ชื่อยา': ['name'],
  'จำนวนคงเหลือ': ['qty'],
  'หน่วย': ['unit'],
  'วันหมดอายุ': ['expiry'],
  'จำนวนที่รับเพิ่ม': ['addQty'],
  'ประเภทการบันทึก': ['actionType'],
  'รหัสแจ้งเตือน': ['id', 'alertId'],
  'ข้อความ': ['text'],
  'ระดับความสำคัญ': ['priority'],
  'ผู้เผยแพร่': ['author'],
  'วันที่เผยแพร่': ['createdAt', 'date'],
  'วันที่แก้ไข': ['updatedAt'],
  'รหัสบทความ': ['id', 'articleId'],
  'หัวข้อ': ['title'],
  'เนื้อหา': ['content'],
  'ผู้เขียน': ['author'],
  'แพ้ยา': ['drugAllergy', 'drug'],
  'แพ้อาหาร': ['foodAllergy', 'food'],
  'ข้อควรระวัง': ['precautions'],
  'เบอร์ผู้ปกครอง': ['guardianPhone', 'phone'],
  'ผู้บันทึก': ['recorderName', 'recorder'],
  'ประเภทแบบประเมิน': ['tool', 'type'],
  'คะแนน': ['score'],
  'ระดับความเสี่ยง': ['risk'],
  'รหัสครูผู้บันทึก': ['teacherId'],
  'ชื่อครูผู้บันทึก': ['teacherName'],
  'ประจำชั้นครู': ['teacherClass', 'homeroom'],
  'เลขประจำตัวประชาชน': ['citizenId'],
  'วันเกิด': ['dob'],
  'ศาสนา': ['religion'],
  'เชื้อชาติ': ['race'],
  'สัญชาติ': ['nationality'],
  'กลุ่มเลือด': ['bloodType'],
  'ความด้อยโอกาส': ['disadvantaged'],
  'ที่อยู่': ['address'],
  'ผู้ปกครอง': ['guardian'],
  'ความสัมพันธ์ผู้ปกครอง': ['guardianRel'],
  'อาชีพผู้ปกครอง': ['guardianJob'],
  'บิดา': ['father'],
  'อาชีพบิดา': ['fatherJob'],
  'มารดา': ['mother'],
  'อาชีพมารดา': ['motherJob'],
  'วันที่อัปเดต': ['updatedAt', 'recordedAt']
};

function doGet(e) {
  try {
    if (e && e.parameter && e.parameter.payload) {
      // Apps Script ถอดรหัส query ให้แล้ว — อย่า decodeURIComponent ซ้ำ
      var rawPayload = e.parameter.payload;
      try {
        return handlePayload_(rawPayload);
      } catch (parseErr) {
        return handlePayload_(decodeURIComponent(rawPayload));
      }
    }
    if (e && e.parameter && e.parameter.action === 'ensureSchema') {
      return handlePayload_(JSON.stringify({
        action: 'ensureSchema',
        sheet: e.parameter.sheet
      }));
    }
    return jsonResponse_({ ok: true, message: 'School Health Sheets API is running' });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function doPost(e) {
  try {
    var raw = getRequestPayload_(e);
    if (!raw) throw new Error('Empty request body');
    return handlePayload_(raw);
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err.message || err) });
  }
}

function getRequestPayload_(e) {
  var raw = '';
  if (e && e.postData && e.postData.contents) {
    raw = e.postData.contents;
    var type = String(e.postData.type || '').toLowerCase();
    if (type.indexOf('application/x-www-form-urlencoded') !== -1) {
      var params = {};
      raw.split('&').forEach(function(pair) {
        var eq = pair.indexOf('=');
        if (eq < 0) return;
        var key = decodeURIComponent(pair.slice(0, eq).replace(/\+/g, ' '));
        var val = decodeURIComponent(pair.slice(eq + 1).replace(/\+/g, ' '));
        params[key] = val;
      });
      if (params.payload) return params.payload;
    }
  }
  if (e && e.parameter && e.parameter.payload) return e.parameter.payload;
  return raw;
}

function handlePayload_(raw) {
  var body = JSON.parse(raw);
  if (body.action === 'getAppointment') {
    var appt = getAppointmentRow_(body.sheet || 'ใบนัด', body.studentId || body.id);
    return jsonResponse_({ ok: true, appointment: appt });
  }
  if (body.action === 'getVisits') {
    var visitList = getVisitsByStudentId_(body.sheet || 'บันทึกการรักษา', body.studentId || body.id);
    return jsonResponse_({ ok: true, visits: visitList });
  }
  if (body.action === 'deleteAppointment') {
    var delSheet = body.sheet || 'ใบนัด';
    deleteAppointmentRow_(delSheet, body.studentId || body.id);
    return jsonResponse_({ ok: true, deleted: true });
  }
  if (body.action === 'deleteRow') {
    var delRowSheet = body.sheet;
    if (!delRowSheet || !SHEET_SCHEMAS[delRowSheet]) {
      throw new Error('Unknown sheet: ' + delRowSheet);
    }
    var delMatchKey = body.matchKey;
    var delMatchValue = body.matchValue;
    if (delMatchValue == null && body.row) {
      delMatchValue = body.row[delMatchKey] || body.row.id;
    }
    deleteRowByMatchKey_(delRowSheet, delMatchKey, delMatchValue);
    return jsonResponse_({ ok: true, deleted: true });
  }
  if (body.action === 'deleteVisit') {
    var visitDelSheet = body.sheet || 'บันทึกการรักษา';
    if (!SHEET_SCHEMAS[visitDelSheet]) {
      throw new Error('Unknown sheet: ' + visitDelSheet);
    }
    var deleted = deleteVisitRow_(visitDelSheet, body);
    return jsonResponse_({ ok: true, deleted: !!deleted });
  }
  if (body.action === 'upsertAppointment') {
    var apptSheet = body.sheet || 'ใบนัด';
    var apptRow = body.row || body.values || {};
    var apptMatchKey = body.matchKey || 'เลขประจำตัว';
    if (!SHEET_SCHEMAS[apptSheet]) throw new Error('Unknown sheet: ' + apptSheet);
    var apptNum = upsertMentalRow_(apptSheet, apptMatchKey, apptRow);
    return jsonResponse_({ ok: true, sheet: apptSheet, row: apptNum, upserted: true });
  }
  if (body.action === 'upsertMental') {
    var upsertSheet = body.sheet;
    var upsertRow = body.row || body.values || {};
    var matchKey = body.matchKey || 'เลขประจำตัวนักเรียน';
    if (!upsertSheet || !SHEET_SCHEMAS[upsertSheet]) {
      throw new Error('Unknown sheet: ' + upsertSheet);
    }
    var upsertNum = upsertMentalRow_(upsertSheet, matchKey, upsertRow);
    return jsonResponse_({ ok: true, sheet: upsertSheet, row: upsertNum, upserted: true });
  }
  if (body.action === 'upsertRow') {
    var rowSheet = body.sheet;
    var rowData = body.row || body.values || {};
    var rowMatchKey = body.matchKey;
    if (!rowSheet || !SHEET_SCHEMAS[rowSheet]) {
      throw new Error('Unknown sheet: ' + rowSheet);
    }
    if (!rowMatchKey) throw new Error('matchKey required for upsertRow');
    var rowNum = upsertMentalRow_(rowSheet, rowMatchKey, rowData);
    return jsonResponse_({ ok: true, sheet: rowSheet, row: rowNum, upserted: true });
  }
  if (body.action === 'appendRow') {
    var appendSheet = body.sheet;
    var appendData = body.row || body.values || {};
    if (!appendSheet || !SHEET_SCHEMAS[appendSheet]) {
      throw new Error('Unknown sheet: ' + appendSheet);
    }
    var appendNum = appendRow_(appendSheet, appendData);
    return jsonResponse_({ ok: true, sheet: appendSheet, row: appendNum, appended: true });
  }
  if (body.action === 'batchUpsertRows') {
    var batchSheet = body.sheet;
    var batchMatchKey = body.matchKey;
    var batchRows = body.rows || [];
    if (!batchSheet || !SHEET_SCHEMAS[batchSheet]) {
      throw new Error('Unknown sheet: ' + batchSheet);
    }
    if (!batchMatchKey) throw new Error('matchKey required for batchUpsertRows');
    var batchCount = batchUpsertRows_(batchSheet, batchMatchKey, batchRows);
    var batchHeaders = getSheetHeaders_(getSpreadsheet_().getSheetByName(batchSheet), batchSheet);
    return jsonResponse_({
      ok: true,
      sheet: batchSheet,
      count: batchCount,
      columnCount: batchHeaders.length,
      upserted: true
    });
  }
  if (body.action === 'ensureSchema') {
    var schemaSheet = body.sheet;
    if (!schemaSheet || !SHEET_SCHEMAS[schemaSheet]) {
      throw new Error('Unknown sheet: ' + schemaSheet);
    }
    var schemaSs = getSpreadsheet_();
    var schemaSh;
    try {
      schemaSh = ensureSheet_(schemaSs, schemaSheet);
    } catch (ensureErr) {
      /* ชีตเต็มลิมิตเซลล์ — อ่านหัวคอลัมน์เท่าที่มี ไม่บังคับอัปเกรด */
      schemaSh = ensureSheetForWrite_(schemaSs, schemaSheet);
    }
    var schemaHeaders = getSheetHeaders_(schemaSh, schemaSheet);
    return jsonResponse_({
      ok: true,
      sheet: schemaSheet,
      columnCount: schemaHeaders.length,
      headers: schemaHeaders
    });
  }
  var sheetName = body.sheet;
  var row = body.row || body.values || {};
  if (!sheetName || !SHEET_SCHEMAS[sheetName]) {
    throw new Error('Unknown sheet: ' + sheetName);
  }
  var rowNum = appendRow_(sheetName, row);
  return jsonResponse_({ ok: true, sheet: sheetName, row: rowNum });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSpreadsheet_() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (e) {
    var active = SpreadsheetApp.getActiveSpreadsheet();
    if (active) return active;
    throw e;
  }
}

function normalizeHeaderKey_(s) {
  return String(s || '').trim().replace(/\s+/g, '').toLowerCase();
}

function getValueForHeader_(header, rowObject) {
  if (rowObject[header] !== undefined && rowObject[header] !== null && rowObject[header] !== '') {
    return rowObject[header];
  }
  var aliases = FIELD_ALIASES[header] || [];
  for (var i = 0; i < aliases.length; i++) {
    var k = aliases[i];
    if (rowObject[k] !== undefined && rowObject[k] !== null && rowObject[k] !== '') {
      return rowObject[k];
    }
  }
  var nh = normalizeHeaderKey_(header);
  var keys = Object.keys(rowObject);
  for (var j = 0; j < keys.length; j++) {
    if (normalizeHeaderKey_(keys[j]) === nh) {
      var v = rowObject[keys[j]];
      if (v !== undefined && v !== null && v !== '') return v;
    }
  }
  if (nh.indexOf('น้ำหนัก') !== -1 || nh === 'weight') {
    for (var w = 0; w < keys.length; w++) {
      var lkw = normalizeHeaderKey_(keys[w]);
      if (lkw.indexOf('น้ำหนัก') !== -1 || lkw === 'weight') {
        var vw = rowObject[keys[w]];
        if (vw !== undefined && vw !== null && vw !== '') return vw;
      }
    }
  }
  if (nh.indexOf('ส่วนสูง') !== -1 || nh === 'height') {
    for (var h = 0; h < keys.length; h++) {
      var lkh = normalizeHeaderKey_(keys[h]);
      if (lkh.indexOf('ส่วนสูง') !== -1 || lkh === 'height') {
        var vh = rowObject[keys[h]];
        if (vh !== undefined && vh !== null && vh !== '') return vh;
      }
    }
  }
  if (nh === 'bmi') {
    for (var b = 0; b < keys.length; b++) {
      if (normalizeHeaderKey_(keys[b]) === 'bmi') {
        var vb = rowObject[keys[b]];
        if (vb !== undefined && vb !== null && vb !== '') return vb;
      }
    }
  }
  return '';
}

function getSheetHeaders_(sheet, sheetName) {
  var schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
  var lastCol = Math.max(sheet.getLastColumn(), schemaHeaders.length, 1);
  var physical = getSheetHeadersPhysical_(sheet, lastCol);
  if (physical.length) return physical;
  return schemaHeaders.slice();
}

function getSheetHeadersPhysical_(sheet, minCols) {
  minCols = minCols || 1;
  var lastCol = Math.max(sheet.getLastColumn(), minCols);
  /* กันอ่านคอลัมน์ว่างยาวๆ ที่เคยถูกขยายโดยไม่ตั้งใจ */
  if (lastCol > 80) lastCol = 80;
  var row1 = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
  var headers = [];
  for (var i = 0; i < lastCol; i++) {
    headers.push(row1[i] !== '' && row1[i] != null ? String(row1[i]) : '');
  }
  while (headers.length && !String(headers[headers.length - 1] || '').trim()) {
    headers.pop();
  }
  var hasAny = false;
  for (var j = 0; j < headers.length; j++) {
    if (headers[j]) { hasAny = true; break; }
  }
  return hasAny ? headers : [];
}

function getWriteHeaders_(sheetName) {
  return (SHEET_SCHEMAS[sheetName] || []).slice();
}

function forceSchemaHeaderRow_(sheet, schemaHeaders) {
  if (!schemaHeaders || !schemaHeaders.length) return;
  /* ห้ามใช้ getMaxColumns() — เคยขยายชีตจนชนลิมิต 10 ล้านเซลล์ */
  var lastCol = Math.max(sheet.getLastColumn() || 0, 1);
  if (lastCol > schemaHeaders.length) {
    sheet.getRange(1, schemaHeaders.length + 1, 1, lastCol).clearContent();
  }
  sheet.getRange(1, 1, 1, schemaHeaders.length).setValues([schemaHeaders]);
  styleHeaderRow_(sheet, schemaHeaders.length);
  SpreadsheetApp.flush();
}

var LEGACY_BLOB_HEADERS_ = {
  'ข้อมูลพื้นฐาน': true,
  'ข้อมูลพื้นฐานนักเรียน': true,
  'ประวัติการรักษา': true
};

function schemaHeadersNeedUpgrade_(headers, schemaHeaders) {
  if (!schemaHeaders || !schemaHeaders.length) return false;
  if (!headers || !headers.length) return true;
  var first = String(headers[0] || '').trim();
  if (first === '#') return true;
  for (var j = 0; j < headers.length; j++) {
    if (LEGACY_BLOB_HEADERS_[String(headers[j] || '').trim()]) return true;
  }
  /* มีคอลัมน์เกินสคีมาไม่ถือว่าต้องอัปเกรด — กัน rewrite ที่ขยายเซลล์ */
  for (var i = 0; i < schemaHeaders.length; i++) {
    if (findHeaderIndex_(headers, schemaHeaders[i]) < 0) return true;
  }
  return false;
}

/** เปิดชีตเพื่อเขียนอย่างเบา — ไม่ rewrite หัวคอลัมน์ (กันชนลิมิตเซลล์) */
function ensureSheetForWrite_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
    if (schemaHeaders.length) forceSchemaHeaderRow_(sheet, schemaHeaders);
    return sheet;
  }
  if (sheet.getLastRow() === 0) {
    var emptyHeaders = SHEET_SCHEMAS[sheetName] || [];
    if (emptyHeaders.length) forceSchemaHeaderRow_(sheet, emptyHeaders);
  }
  return sheet;
}

function upgradeSheetHeaders_(sheet, sheetName, schemaHeaders) {
  var lastRow = sheet.getLastRow();
  var lastCol = Math.max(sheet.getLastColumn(), schemaHeaders.length, 1);
  var oldHeaders = getSheetHeadersPhysical_(sheet, lastCol);
  var dataRows = [];
  if (lastRow >= 1) {
    var all = sheet.getRange(1, 1, lastRow, lastCol).getValues();
    for (var r = 1; r < all.length; r++) {
      dataRows.push(all[r]);
    }
  }
  var newRows = [];
  for (var dr = 0; dr < dataRows.length; dr++) {
    var oldRow = dataRows[dr];
    var rowObj = {};
    for (var c = 0; c < oldHeaders.length; c++) {
      var h = String(oldHeaders[c] || '').trim();
      if (!h || h === '#') continue;
      var v = oldRow[c];
      if (v !== '' && v != null) rowObj[h] = v;
    }
    newRows.push(rowValuesFromObject_(schemaHeaders, rowObj));
  }
  if (lastRow > 1) sheet.deleteRows(2, lastRow - 1);
  forceSchemaHeaderRow_(sheet, schemaHeaders);
  if (newRows.length) {
    sheet.getRange(2, 1, 1 + newRows.length, schemaHeaders.length).setValues(newRows);
  }
  SpreadsheetApp.flush();
}

function ensureSheet_(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  var schemaHeaders = SHEET_SCHEMAS[sheetName] || [];
  var lastRow = sheet.getLastRow();
  if (lastRow === 0) {
    if (schemaHeaders.length) forceSchemaHeaderRow_(sheet, schemaHeaders);
    return sheet;
  }
  var physical = getSheetHeadersPhysical_(sheet, schemaHeaders.length);
  if (schemaHeaders.length && schemaHeadersNeedUpgrade_(physical, schemaHeaders)) {
    try {
      upgradeSheetHeaders_(sheet, sheetName, schemaHeaders);
    } catch (upErr) {
      /* เต็มลิมิตเซลล์หรือ merge — คงหัวคอลัมน์เดิม แล้วเขียนต่อได้ */
      console.warn('upgradeSheetHeaders_ skipped: ' + String(upErr && upErr.message || upErr));
    }
  }
  return sheet;
}

function styleHeaderRow_(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#dcfce7');
  headerRange.setFontColor('#0a3d28');
  sheet.setFrozenRows(1);
}

function appendRow_(sheetName, rowObject) {
  var ss = getSpreadsheet_();
  var sheet = ensureSheetForWrite_(ss, sheetName);
  /* ใช้หัวคอลัมน์จริงในชีตก่อน — ไม่บังคับขยายตามสคีมา */
  var headers = getSheetHeadersPhysical_(sheet, 1);
  if (!headers.length) headers = getWriteHeaders_(sheetName);
  if (!headers.length) headers = getSheetHeaders_(sheet, sheetName);
  if (Array.isArray(rowObject)) {
    sheet.appendRow(rowObject.map(function(v) { return v == null ? '' : String(v); }));
  } else {
    var values = headers.map(function(h) {
      if (!h) return '';
      var v = getValueForHeader_(h, rowObject);
      if (Array.isArray(v)) return v.join(', ');
      return v === undefined || v === null ? '' : String(v);
    });
    sheet.appendRow(values);
  }
  SpreadsheetApp.flush();
  return sheet.getLastRow();
}

function idsMatch_(a, b) {
  var sa = String(a == null ? '' : a).trim();
  var sb = String(b == null ? '' : b).trim();
  if (!sa || !sb) return false;
  if (sa === sb) return true;
  var na = parseInt(sa, 10);
  var nb = parseInt(sb, 10);
  return !isNaN(na) && !isNaN(nb) && na === nb;
}

function findHeaderIndex_(headers, headerName) {
  var idx = headers.indexOf(headerName);
  if (idx >= 0) return idx;
  var aliases = FIELD_ALIASES[headerName] || [];
  var nh = normalizeHeaderKey_(headerName);
  for (var i = 0; i < headers.length; i++) {
    if (!String(headers[i] || '').trim()) continue;
    if (normalizeHeaderKey_(headers[i]) === nh) return i;
    for (var j = 0; j < aliases.length; j++) {
      if (normalizeHeaderKey_(headers[i]) === normalizeHeaderKey_(aliases[j])) return i;
    }
  }
  return -1;
}

var MENTAL_MATCH_KEYS_ = ['เลขประจำตัวนักเรียน', 'รหัสนักเรียน', 'รหัสครู', 'เลขประจำตัว', 'รหัส', 'id'];

function resolveMentalMatch_(headers, matchKey, rowObject) {
  var keys = [matchKey].concat(MENTAL_MATCH_KEYS_);
  var seen = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!key || seen[key]) continue;
    seen[key] = true;
    var idx = findHeaderIndex_(headers, key);
    if (idx >= 0) {
      return { index: idx, header: headers[idx], value: getValueForHeader_(headers[idx], rowObject) };
    }
  }
  return { index: -1, header: matchKey, value: getValueForHeader_(matchKey, rowObject) };
}

/**
 * เขียนแถวเดียวให้ปลอดภัย — กัน error จากเซลล์รวม (merged cells)
 * เช่น "ข้อมูลมี 1 แถว แต่ช่วงดังกล่าวมี N แถว"
 */
function setRowValuesSafe_(sheet, rowNum, values) {
  var n = values.length;
  if (!n || rowNum < 1) return;
  var range = sheet.getRange(rowNum, 1, rowNum, n);
  try {
    var merges = range.getMergedRanges();
    for (var i = 0; i < merges.length; i++) {
      merges[i].breakApart();
    }
  } catch (eMerge) { /* ignore */ }
  try {
    range = sheet.getRange(rowNum, 1, rowNum, n);
    range.setValues([values]);
    return;
  } catch (eSet) {
    for (var c = 0; c < n; c++) {
      try {
        var cell = sheet.getRange(rowNum, c + 1);
        try {
          var cellMerges = cell.getMergedRanges();
          for (var m = 0; m < cellMerges.length; m++) cellMerges[m].breakApart();
        } catch (e2) { /* ignore */ }
        cell.setValue(values[c]);
      } catch (e3) { /* skip bad cell */ }
    }
  }
}

function readRowValuesSafe_(sheet, rowNum, colCount) {
  colCount = Math.max(1, colCount || 1);
  try {
    var vals = sheet.getRange(rowNum, 1, rowNum, colCount).getValues();
    if (vals && vals.length) return vals[0];
  } catch (e) { /* fall through */ }
  var out = [];
  for (var c = 0; c < colCount; c++) {
    try {
      out.push(sheet.getRange(rowNum, c + 1).getValue());
    } catch (e2) {
      out.push('');
    }
  }
  return out;
}

function upsertMentalRow_(sheetName, matchKey, rowObject) {
  var ss = getSpreadsheet_();
  var sheet = ensureSheetForWrite_(ss, sheetName);
  var headers = getSheetHeadersPhysical_(sheet, 1);
  if (!headers.length) headers = getWriteHeaders_(sheetName);
  if (!headers.length) headers = getSheetHeaders_(sheet, sheetName);
  /* จับคู่เฉพาะคอลัมน์ที่ระบุ — ห้าม fallback ไปคอลัมน์ "รหัส" (จะทับแถวคนละรายการ) */
  var matchIndex = findHeaderIndex_(headers, matchKey);
  if (matchIndex < 0) {
    return appendRow_(sheetName, rowObject);
  }
  var matchValue = getValueForHeader_(headers[matchIndex], rowObject);
  if (!matchValue && rowObject && rowObject[matchKey]) matchValue = rowObject[matchKey];
  if (!matchValue && rowObject && rowObject.recordId) matchValue = rowObject.recordId;
  if (!matchValue) {
    return appendRow_(sheetName, rowObject);
  }

  var lastRow = sheet.getLastRow();
  var foundRow = -1;
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, matchIndex + 1, lastRow, matchIndex + 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      if (idsMatch_(idValues[i][0], matchValue)) {
        foundRow = i + 2;
        break;
      }
    }
  }

  if (foundRow < 0) {
    var newValues = headers.map(function(h) {
      if (!h) return '';
      var v = getValueForHeader_(h, rowObject);
      if (Array.isArray(v)) return v.join(', ');
      return v === undefined || v === null ? '' : String(v);
    });
    sheet.appendRow(newValues);
    SpreadsheetApp.flush();
    return sheet.getLastRow();
  }

  // อัปเดตแถวเดิม: ค่าว่างจาก client ไม่ทับค่าเดิมในชีต (กันข้อมูลหาย)
  var existing = readRowValuesSafe_(sheet, foundRow, headers.length);
  var fullValues = headers.map(function(h, idx) {
    if (!h) return existing[idx] == null ? '' : String(existing[idx]);
    var v = getValueForHeader_(h, rowObject);
    if (Array.isArray(v)) v = v.join(', ');
    if (v === undefined || v === null || v === '') {
      var old = existing[idx];
      return old === undefined || old === null ? '' : String(old);
    }
    return String(v);
  });
  setRowValuesSafe_(sheet, foundRow, fullValues);
  SpreadsheetApp.flush();
  return foundRow;
}

function rowValuesFromObject_(headers, rowObject) {
  return headers.map(function(h) {
    var v = getValueForHeader_(h, rowObject);
    if (Array.isArray(v)) return v.join(', ');
    return v === undefined || v === null ? '' : String(v);
  });
}

function batchUpsertRows_(sheetName, matchKey, rowObjects) {
  if (!rowObjects || !rowObjects.length) return 0;
  var ss = getSpreadsheet_();
  var sheet = ensureSheet_(ss, sheetName);
  var headers = getWriteHeaders_(sheetName);
  if (!headers.length) headers = getSheetHeaders_(sheet, sheetName);
  var matchIndex = findHeaderIndex_(headers, matchKey);
  if (matchIndex < 0) throw new Error('Missing match column: ' + matchKey);

  var lastRow = Math.max(sheet.getLastRow(), 1);
  var rowById = {};
  if (lastRow > 1) {
    var idValues = sheet.getRange(2, matchIndex + 1, lastRow, matchIndex + 1).getValues();
    for (var i = 0; i < idValues.length; i++) {
      var raw = idValues[i][0];
      if (raw === '' || raw == null) continue;
      var sk = String(raw).trim();
      rowById[sk] = i + 2;
      var num = parseInt(sk, 10);
      if (!isNaN(num)) rowById[String(num)] = i + 2;
    }
  }

  var updates = [];
  var appends = [];
  var batchSeen = {};
  var skipped = 0;

  for (var r = 0; r < rowObjects.length; r++) {
    var rowObject = rowObjects[r];
    var matchValue = resolveRowMatchId_(headers, matchKey, rowObject);
    if (!matchValue) {
      skipped++;
      continue;
    }
    var key = String(matchValue).trim();
    var numKey = parseInt(key, 10);
    var foundRow = rowById[key];
    if (foundRow == null && !isNaN(numKey)) foundRow = rowById[String(numKey)];
    if (foundRow == null && batchSeen[key]) foundRow = batchSeen[key];

    var values = rowValuesFromObject_(headers, rowObject);
    if (foundRow && foundRow > 0) {
      updates.push({ row: foundRow, values: values });
    } else {
      appends.push(values);
      var pendingRow = lastRow + appends.length;
      rowById[key] = pendingRow;
      batchSeen[key] = pendingRow;
      if (!isNaN(numKey)) rowById[String(numKey)] = pendingRow;
    }
  }

  for (var u = 0; u < updates.length; u++) {
    setRowValuesSafe_(sheet, updates[u].row, updates[u].values);
  }
  if (appends.length) {
    for (var a = 0; a < appends.length; a++) {
      sheet.appendRow(appends[a]);
    }
  }
  SpreadsheetApp.flush();
  return updates.length + appends.length;
}

function resolveRowMatchId_(headers, matchKey, rowObject) {
  var match = resolveMentalMatch_(headers, matchKey, rowObject);
  var matchValue = match.value;
  if (matchValue !== undefined && matchValue !== null && String(matchValue).trim() !== '') {
    return String(matchValue).trim();
  }
  var keys = [matchKey].concat(MENTAL_MATCH_KEYS_);
  var seen = {};
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    if (!key || seen[key]) continue;
    seen[key] = true;
    var v = getValueForHeader_(key, rowObject);
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim();
  }
  return '';
}

function normalizeSheetDate_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    var y = v.getFullYear();
    var m = String(v.getMonth() + 1);
    if (m.length < 2) m = '0' + m;
    var d = String(v.getDate());
    if (d.length < 2) d = '0' + d;
    return y + '-' + m + '-' + d;
  }
  var s = String(v).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    var yIso = parseInt(s.slice(0, 4), 10);
    if (yIso > 2400) yIso -= 543;
    return yIso + s.slice(4, 10);
  }
  var slash = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/);
  if (slash) {
    var y2 = parseInt(slash[3], 10);
    if (y2 > 2400) y2 -= 543;
    var mm = String(parseInt(slash[2], 10));
    if (mm.length < 2) mm = '0' + mm;
    var dd = String(parseInt(slash[1], 10));
    if (dd.length < 2) dd = '0' + dd;
    return y2 + '-' + mm + '-' + dd;
  }
  return s;
}

function normalizeSheetTime_(v) {
  if (!v) return '';
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), 'HH:mm');
  }
  var s = String(v).trim();
  var parts = s.split(':');
  if (parts.length >= 2) return parts[0] + ':' + parts[1];
  return s;
}

function rowObjectFromSheet_(headers, rowVals) {
  var obj = {};
  for (var c = 0; c < headers.length; c++) {
    obj[headers[c]] = rowVals[c];
  }
  return obj;
}

function findStudentRow_(sheet, headers, studentId) {
  var match = resolveMentalMatch_(headers, 'เลขประจำตัว', { id: studentId, 'เลขประจำตัว': studentId });
  if (match.index < 0) return -1;
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return -1;
  var idCol = match.index + 1;
  var idValues = sheet.getRange(2, idCol, lastRow, idCol).getValues();
  for (var i = 0; i < idValues.length; i++) {
    if (idsMatch_(idValues[i][0], studentId)) return i + 2;
  }
  return -1;
}

function getAppointmentRow_(sheetName, studentId) {
  if (!studentId) return null;
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return null;
  var headers = getSheetHeaders_(sheet, sheetName);
  var foundRow = findStudentRow_(sheet, headers, studentId);
  if (foundRow < 0) return null;
  var rowVals = sheet.getRange(foundRow, 1, foundRow, headers.length).getValues()[0];
  var obj = rowObjectFromSheet_(headers, rowVals);
  var dateVal = getValueForHeader_('วันที่นัด', obj);
  if (!dateVal) return null;
  return {
    date: normalizeSheetDate_(dateVal),
    time: normalizeSheetTime_(getValueForHeader_('เวลา', obj)),
    purpose: String(getValueForHeader_('เรื่อง', obj) || ''),
    place: String(getValueForHeader_('สถานที่', obj) || ''),
    note: String(getValueForHeader_('หมายเหตุ', obj) || ''),
    studentName: String(getValueForHeader_('ชื่อ-นามสกุล', obj) || ''),
    updatedAt: Date.now()
  };
}

function deleteRowByMatchKey_(sheetName, matchKey, matchValue) {
  if (!matchValue) return;
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  var headers = getSheetHeaders_(sheet, sheetName);
  var matchIndex = findHeaderIndex_(headers, matchKey);
  if (matchIndex < 0) return;
  var lastRow = sheet.getLastRow();
  for (var r = lastRow; r >= 2; r--) {
    if (idsMatch_(sheet.getRange(r, matchIndex + 1).getValue(), matchValue)) {
      sheet.deleteRow(r);
      SpreadsheetApp.flush();
      return;
    }
  }
}

/** ลบแถวบันทึกการรักษา — ใช้รหัสรายการก่อน แล้วค่อยจับคู่วันที่+รหัส+อาการ */
function deleteVisitRow_(sheetName, opts) {
  opts = opts || {};
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return false;
  var headers = getSheetHeaders_(sheet, sheetName);
  var idxRecordId = findHeaderIndex_(headers, 'รหัสรายการ');
  var idxDate = findHeaderIndex_(headers, 'วันที่เวลา');
  if (idxDate < 0) idxDate = findHeaderIndex_(headers, 'วันที่บันทึก');
  var idxId = findHeaderIndex_(headers, 'รหัส');
  if (idxId < 0) idxId = findHeaderIndex_(headers, 'เลขประจำตัว');
  var idxSymptom = findHeaderIndex_(headers, 'อาการ');
  if (idxSymptom < 0) idxSymptom = findHeaderIndex_(headers, 'อาการ/ปัญหาสุขภาพ');
  var recordId = String(opts.recordId || opts.matchValue || '').trim();
  var recordedAt = String(opts.recordedAt || '').trim();
  var studentId = String(opts.studentId || opts.id || '').trim();
  var symptom = String(opts.symptom || '').trim();
  var lastRow = sheet.getLastRow();
  function cellStr_(row, colIdx) {
    if (colIdx < 0) return '';
    return String(sheet.getRange(row, colIdx + 1).getValue() || '').trim();
  }
  function normDate_(s) {
    return String(s || '').replace(/\s+/g, ' ').trim();
  }
  for (var r = lastRow; r >= 2; r--) {
    if (recordId && idxRecordId >= 0) {
      if (idsMatch_(sheet.getRange(r, idxRecordId + 1).getValue(), recordId)) {
        sheet.deleteRow(r);
        SpreadsheetApp.flush();
        return true;
      }
    }
  }
  if (!studentId || !recordedAt) return false;
  for (var r2 = lastRow; r2 >= 2; r2--) {
    if (idxId >= 0 && !idsMatch_(sheet.getRange(r2, idxId + 1).getValue(), studentId)) continue;
    if (idxDate >= 0 && normDate_(cellStr_(r2, idxDate)) !== normDate_(recordedAt)) continue;
    if (symptom && idxSymptom >= 0) {
      var sheetSymptom = cellStr_(r2, idxSymptom);
      if (sheetSymptom && sheetSymptom !== symptom && sheetSymptom.indexOf(symptom) === -1 && symptom.indexOf(sheetSymptom) === -1) {
        continue;
      }
    }
    sheet.deleteRow(r2);
    SpreadsheetApp.flush();
    return true;
  }
  return false;
}

function deleteAppointmentRow_(sheetName, studentId) {
  if (!studentId) return;
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return;
  var headers = getSheetHeaders_(sheet, sheetName);
  var foundRow = findStudentRow_(sheet, headers, studentId);
  if (foundRow < 0) return;
  var clearCols = ['วันที่นัด', 'เวลา', 'เรื่อง', 'สถานที่', 'หมายเหตุ'];
  for (var i = 0; i < clearCols.length; i++) {
    var idx = findHeaderIndex_(headers, clearCols[i]);
    if (idx >= 0) sheet.getRange(foundRow, idx + 1).setValue('');
  }
  SpreadsheetApp.flush();
}

function parseVisitSavedAtFromCell_(v) {
  if (v == null || v === '') return 0;
  if (Object.prototype.toString.call(v) === '[object Date]' && !isNaN(v.getTime())) {
    var t = v.getTime();
    return t > 946684800000 ? t : 0;
  }
  var s = String(v).trim();
  if (!s) return 0;
  var thMonths = {
    'ม.ค.': 1, 'ก.พ.': 2, 'มี.ค.': 3, 'เม.ย.': 4, 'พ.ค.': 5, 'มิ.ย.': 6,
    'ก.ค.': 7, 'ส.ค.': 8, 'ก.ย.': 9, 'ต.ค.': 10, 'พ.ย.': 11, 'ธ.ค.': 12
  };
  var thMatch = s.match(/(\d{1,2})\s+([ก-ฮ\.]+)\s+(\d{2,4})(?:[,\s]+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (thMatch) {
    var dayT = parseInt(thMatch[1], 10);
    var monKey = thMatch[2];
    var yearT = parseInt(thMatch[3], 10);
    if (yearT > 2400) yearT -= 543;
    else if (yearT < 100) yearT += 2000;
    var monthT = thMonths[monKey] || 0;
    if (!monthT) {
      Object.keys(thMonths).forEach(function(k) {
        if (!monthT && monKey.indexOf(k.replace(/\./g, '')) !== -1) monthT = thMonths[k];
      });
    }
    if (monthT && yearT >= 2000 && yearT <= 2100) {
      var dtT = new Date(yearT, monthT - 1, dayT,
        parseInt(thMatch[4] || '12', 10), parseInt(thMatch[5] || '0', 10), parseInt(thMatch[6] || '0', 10));
      if (!isNaN(dtT.getTime()) && dtT.getTime() > 946684800000) return dtT.getTime();
    }
  }
  var m = s.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?/);
  if (m) {
    var y = parseInt(m[3], 10);
    if (y > 2400) y -= 543;
    var dt = new Date(y, parseInt(m[2], 10) - 1, parseInt(m[1], 10),
      parseInt(m[4] || '0', 10), parseInt(m[5] || '0', 10), parseInt(m[6] || '0', 10));
    if (!isNaN(dt.getTime()) && dt.getTime() > 946684800000) return dt.getTime();
  }
  var iso = new Date(s);
  if (!isNaN(iso.getTime()) && iso.getTime() > 946684800000) return iso.getTime();
  return 0;
}

function getVisitsByStudentId_(sheetName, studentId) {
  if (!studentId) return [];
  var ss = getSpreadsheet_();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() < 2) return [];
  var headers = getSheetHeaders_(sheet, sheetName);
  var idIdx = findHeaderIndex_(headers, 'รหัส');
  if (idIdx < 0) idIdx = findHeaderIndex_(headers, 'เลขประจำตัว');
  if (idIdx < 0) return [];
  var lastRow = sheet.getLastRow();
  var data = sheet.getRange(2, 1, lastRow, headers.length).getValues();
  var visits = [];
  for (var i = 0; i < data.length; i++) {
    if (!idsMatch_(data[i][idIdx], studentId)) continue;
    var obj = rowObjectFromSheet_(headers, data[i]);
    var rawDate = getValueForHeader_('วันที่เวลา', obj);
    if (rawDate == null || rawDate === '') rawDate = getValueForHeader_('วันที่บันทึก', obj);
    var recordedAt = '';
    if (Object.prototype.toString.call(rawDate) === '[object Date]' && !isNaN(rawDate.getTime())) {
      recordedAt = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm:ss');
    } else {
      recordedAt = String(rawDate || '');
    }
    var savedAt = parseVisitSavedAtFromCell_(rawDate);
    var providerName = String(getValueForHeader_('ผู้ให้บริการ', obj) || '');
    var providerRole = String(getValueForHeader_('ตำแหน่งผู้ให้บริการ', obj) || '');
    var providerClass = String(getValueForHeader_('ระดับชั้นผู้ให้บริการ (นักเรียน)', obj) || '');
    var recordId = String(getValueForHeader_('รหัสรายการ', obj) || '').trim();
    visits.push({
      id: String(getValueForHeader_('รหัส', obj) || studentId),
      name: String(getValueForHeader_('ชื่อ', obj) || getValueForHeader_('ชื่อ-นามสกุล', obj) || ''),
      class: String(getValueForHeader_('ระดับชั้น/ตำแหน่ง', obj) || getValueForHeader_('ชั้น/ตำแหน่ง', obj) || ''),
      type: String(getValueForHeader_('ประเภทผู้รับบริการ', obj) || ''),
      symptom: String(getValueForHeader_('อาการ', obj) || getValueForHeader_('อาการ/ปัญหาสุขภาพ', obj) || ''),
      temp: String(getValueForHeader_('อุณหภูมิร่างกาย', obj) || getValueForHeader_('อุณหภูมิ(°C)', obj) || ''),
      bp: String(getValueForHeader_('ความดันโลหิต', obj) || ''),
      pulse: String(getValueForHeader_('ชีพจร', obj) || ''),
      diagnosis: String(getValueForHeader_('การวินิจฉัยเบื้องต้น', obj) || ''),
      treatment: String(getValueForHeader_('การรักษาและยาที่ให้', obj) || getValueForHeader_('การรักษาและยา', obj) || ''),
      result: String(getValueForHeader_('ผลการรักษา', obj) || ''),
      provider: providerName,
      providerName: providerName,
      providerRole: providerRole,
      providerClass: providerClass,
      recordedAt: recordedAt,
      savedAt: savedAt,
      recordId: recordId
    });
  }
  visits.sort(function(a, b) { return (b.savedAt || 0) - (a.savedAt || 0); });
  return visits;
}

function appendRow(sheetName, rowObject) {
  return appendRow_(sheetName, rowObject);
}

function setupAllSheets() {
  var ss = getSpreadsheet_();
  Object.keys(SHEET_SCHEMAS).forEach(function(name) {
    var sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
      sheet.appendRow(SHEET_SCHEMAS[name]);
      styleHeaderRow_(sheet, SHEET_SCHEMAS[name].length);
    }
  });
  SpreadsheetApp.flush();
}

function testAppend() {
  appendRow_('วัคซีน', {
    'เลขประจำตัว': 'TEST001',
    'ชื่อนามสกุล': 'ทดสอบ ระบบ',
    'วัคซีนที่ฉีด': 'BCG',
    'วันที่ฉีด': '1/1/2569',
    'วันที่บันทึก': new Date().toLocaleString('th-TH'),
    'บทบาทผู้บันทึก': 'ทดสอบ Apps Script'
  });
}
