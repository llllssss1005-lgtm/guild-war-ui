// ===== 여기부터 전부 JS =====
const SUPABASE_URL = "https://rtlkthadgfyszawgbevk.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Vsr12aXc5r8kCnjBnpvrcQ_4Enqbi3F";
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const KAKAO_LINK = "https://open.kakao.com/o/smXJOCfi";

// ✅ 세션 키
const SESSION_KEY = "guild_gate_ok_v1";
const LS_ACCOUNT_ID = "guild_account_id";
const LS_CODE = "guild_code";

// ✅ preset 저장 키(계정별)
const PRESET_KEY = (accountId) => `guild_my_atk_presets_v2_${accountId}`;

// ✅ 페이지(뷰) 전환
const tabBarEl = document.getElementById("tabBar");
const tabSearchEl = document.getElementById("tabSearch");
const tabAtkEl = document.getElementById("tabAtk");
const btnHomeEl = document.getElementById("btnHome");

const viewSearchEl = document.getElementById("viewSearch");
const viewAtkEl = document.getElementById("viewAtk");

const gateEl = document.getElementById("gate");
const gateMsgEl = document.getElementById("gateMsg");
const mainMenuEl = document.getElementById("mainMenu");

const btnKakao = document.getElementById("btnKakao");
const btnGateEnter = document.getElementById("btnGateEnter");
const gateIdInput = document.getElementById("gateId");
const gateCodeInput = document.getElementById("gateCode");

const toastEl = document.getElementById("toast");

function toast(msg){
  toastEl.textContent = msg;
  toastEl.style.display = "block";
  clearTimeout(window.__TOAST_T__);
  window.__TOAST_T__ = setTimeout(() => {
    toastEl.style.display = "none";
  }, 1700);
}

function showGateMsg(msg){
  gateMsgEl.style.display = "block";
  gateMsgEl.textContent = msg;
}
function clearGateMsg(){
  gateMsgEl.style.display = "none";
  gateMsgEl.textContent = "";
}

function clearAllSession(){
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(LS_ACCOUNT_ID);
  localStorage.removeItem(LS_CODE);
}

function getStoredAccountId(){
  const id = Number(localStorage.getItem(LS_ACCOUNT_ID));
  return Number.isInteger(id) ? id : null;
}

function showTabs(){
  tabBarEl.style.display = "block";
  document.body.classList.add("hasTabs");
}
function hideTabs(){
  tabBarEl.style.display = "none";
  document.body.classList.remove("hasTabs");
}

function setActiveTab(which){
  tabSearchEl.classList.toggle("active", which === "search");
  tabAtkEl.classList.toggle("active", which === "atk");
}

function showHome(){
  hideTabs();
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "none";
  mainMenuEl.style.display = "block";
  gateEl.style.display = "none";
}

function showSearchView(){
  gateEl.style.display = "none";
  mainMenuEl.style.display = "none";
  viewAtkEl.style.display = "none";
  viewSearchEl.style.display = "block";
  showTabs();
  setActiveTab("search");
  initGuildWar();
}

function showAtkView(){
  gateEl.style.display = "none";
  mainMenuEl.style.display = "none";
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "block";
  showTabs();
  setActiveTab("atk");
  renderAtkPage();
}

tabSearchEl.addEventListener("click", showSearchView);
tabAtkEl.addEventListener("click", showAtkView);
btnHomeEl.addEventListener("click", showHome);

function passGate(accountId, code){
  localStorage.setItem(SESSION_KEY, "1");
  localStorage.setItem(LS_ACCOUNT_ID, String(accountId));
  localStorage.setItem(LS_CODE, String(code));

  gateEl.style.display = "none";
  mainMenuEl.style.display = "block";
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "none";
  hideTabs();
}

function failGate(msg){
  clearAllSession();
  gateEl.style.display = "block";
  mainMenuEl.style.display = "none";
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "none";
  hideTabs();
  showGateMsg(msg);
}

function basicCheck(idStr, codeStr){
  const id = Number(String(idStr || "").trim());
  const code = Number(String(codeStr || "").trim());

  if(!Number.isInteger(id)) return { ok:false, msg:"아이디는 숫자만 입력해 주세요." };
  if(!Number.isInteger(code)) return { ok:false, msg:"코드는 숫자만 입력해 주세요." };

  return { ok:true, id, code };
}

btnKakao.addEventListener("click", () => {
  window.open(KAKAO_LINK, "_blank", "noopener");
});

// ✅ 공용: 현재 저장된 계정으로 접근권한 확인 (RPC)
async function checkAccessByStored(){
  const id = Number(localStorage.getItem(LS_ACCOUNT_ID));
  const code = Number(localStorage.getItem(LS_CODE));
  if(!Number.isInteger(id) || !Number.isInteger(code)) return false;

  const { data, error } = await supabaseClient.rpc("check_guild_access_code", {
    p_account_id: id,
    p_code: code
  });

  if(error){
    console.error("[checkAccess RPC error]", error);
    return null;
  }
  return data === true;
}

btnGateEnter.addEventListener("click", async () => {
  clearGateMsg();
  btnGateEnter.disabled = true;

  const chk = basicCheck(gateIdInput.value, gateCodeInput.value);
  if(!chk.ok){
    btnGateEnter.disabled = false;
    failGate(chk.msg);
    return;
  }

  try{
    const { data, error } = await supabaseClient.rpc("check_guild_access_code", {
      p_account_id: chk.id,
      p_code: chk.code
    });

    if(error){
      console.error(error);
      btnGateEnter.disabled = false;
      failGate("서버 확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      return;
    }

    if(data === true){
      btnGateEnter.disabled = false;
      passGate(chk.id, chk.code);
    }else{
      btnGateEnter.disabled = false;
      failGate("아이디/코드가 올바르지 않거나 비활성화된 코드입니다. 관리자에게 문의해주세요.");
    }
  }catch(err){
    console.error(err);
    btnGateEnter.disabled = false;
    failGate("네트워크 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
  }
});

[gateIdInput, gateCodeInput].forEach(inp => {
  inp.addEventListener("keydown", (e) => {
    if(e.key === "Enter") btnGateEnter.click();
  });
});

// ✅ 새로고침/재접속: 세션 있으면 진입(대문)
if (localStorage.getItem(SESSION_KEY) === "1") {
  gateEl.style.display = "none";
  mainMenuEl.style.display = "block";
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "none";
  hideTabs();
} else {
  gateEl.style.display = "block";
  mainMenuEl.style.display = "none";
  viewSearchEl.style.display = "none";
  viewAtkEl.style.display = "none";
  hideTabs();
}

// ✅ 대문 버튼 동작
const btnGoSearch = document.getElementById("btnGoSearch");
const btnGoAtk = document.getElementById("btnGoAtk");

if(btnGoSearch){
  btnGoSearch.addEventListener("click", () => showSearchView());
}
if(btnGoAtk){
  btnGoAtk.addEventListener("click", () => showAtkView());
}

// ===============================
// ✅ 프리셋(내 공격덱) 저장/렌더
// ===============================
function loadMyPresets(){
  const accountId = getStoredAccountId();
  if(!accountId) return [];
  try{
    const raw = localStorage.getItem(PRESET_KEY(accountId));
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  }catch(e){
    console.warn("loadMyPresets parse error", e);
    return [];
  }
}

function saveMyPresets(list){
  const accountId = getStoredAccountId();
  if(!accountId) return;
  try{
    localStorage.setItem(PRESET_KEY(accountId), JSON.stringify(list || []));
  }catch(e){
    console.warn("saveMyPresets error", e);
  }
}

function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rankMedalHtml(atkRank){
  const r = Number(atkRank);
  if(!Number.isInteger(r) || r < 1 || r > 4) return "";
  const cls = r === 1 ? "r1" : r === 2 ? "r2" : r === 3 ? "r3" : "r4";
  const emoji = r === 1 ? "🥇" : r === 2 ? "🥈" : r === 3 ? "🥉" : "🏅";
  return `
    <div class="rankMedal ${cls}" title="${r}순위">
      <span>${emoji} ${r}순위</span>
    </div>
  `;
}

// ✅ 프리셋 펼침: "검색 카드 UI 그대로" 생성
function renderPresetExpandedCard(p, map){
  const atkIds = (p.atkIds||[]).slice(0,3);
  const skillIds = (p.skillIds||[]).slice(0,3);

  const atkArr = atkIds.map(id => map.get(id) || null);
  const skArr  = skillIds.map(id => map.get(id) || null);
  const pet    = p.petId ? (map.get(p.petId) || null) : null;

  const importantText = String(p.important || "").trim() || "없음";
  const formationsComment = String(p.formationsComment || "").trim() || "없음";
  const setComment = String(p.setComment || "").trim() || "없음";

  const firstText = p.first || "없음";
  const badgeClass =
    firstText === "선공" ? "badge red" :
    firstText === "후공" ? "badge blue" :
    "badge gray";

  const formationUnit = p.formationId ? (map.get(p.formationId) || null) : null;
  const formationNameText = formationUnit?.name || "없음";
  const formationImgHtml = formationUnit?.image_url
    ? `<img class="formationImg" src="${escapeHtml(formationUnit.image_url)}" alt="formation">`
    : `<div class="emptyBox" style="width: calc(var(--narrowW) - 20px); height: 64px; border-radius:12px;">없음</div>`;

  const medal = rankMedalHtml(p.atkRank);

  const cellHtml = (unit) => {
    if(!unit){
      return `
        <div class="cell">
          <div class="emptyBox">없음</div>
          <div class="cap">없음</div>
        </div>
      `;
    }
    return `
      <div class="cell">
        <img src="${escapeHtml(unit.image_url)}" alt="${escapeHtml(unit.name)}">
        <div class="cap">${escapeHtml(unit.name)}</div>
      </div>
    `;
  };

  return `
    <div class="resultToolbar" style="margin-bottom:10px;">
      <div class="toolbarLeft">
        <div style="font-weight:900;color:#111827;">공격내용</div>
        ${medal}
      </div>
    </div>

    <div class="card">
      <div class="importantBar">
        <div class="ico">⚠️</div>
        <div class="txt">주요사항: ${escapeHtml(importantText)}</div>
      </div>

      <div class="layoutRows">
        <div class="row2col">
          <div class="panel box">
            <div class="panelTitle">공격유닛</div>
            <div class="grid3">
              ${cellHtml(atkArr[0])}
              ${cellHtml(atkArr[1])}
              ${cellHtml(atkArr[2])}
            </div>
          </div>

          <div class="panel box small centerCol">
            <div class="panelTitle">추천 펫</div>
            ${pet ? `
              <div class="cell">
                <img src="${escapeHtml(pet.image_url)}" alt="${escapeHtml(pet.name)}">
                <div class="petName">${escapeHtml(pet.name)}</div>
              </div>
            ` : `
              <div class="cell">
                <div class="emptyBox">없음</div>
                <div class="petName">없음</div>
              </div>
            `}
          </div>
        </div>

        <div class="row2col">
          <div class="panel box">
            <div class="panelTitle">스킬순서</div>
            <div class="grid3">
              ${cellHtml(skArr[0])}
              ${cellHtml(skArr[1])}
              ${cellHtml(skArr[2])}
            </div>
          </div>

          <div class="panel box small centerCol" style="align-items:center;text-align:center;">
            <div class="panelTitle">공격순서</div>
            <div style="width:100%;display:flex;justify-content:center;flex:1;align-items:center;">
              <span class="${badgeClass}">${escapeHtml(firstText)}</span>
            </div>
          </div>
        </div>

        <div class="row2col">
          <div class="panel box">
            <div class="panelTitle">세트추천 및 설명</div>
            <div class="textBox setTextBox">${escapeHtml(setComment)}</div>
          </div>

          <div class="panel box small centerCol">
            <div class="formationWrap">
              ${formationImgHtml}
              <div class="formationName">${escapeHtml(formationNameText)}</div>
              <div class="formationDesc">${escapeHtml(formationsComment)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

async function renderAtkPage(){
  const listEl = document.getElementById("presetList");
  const accountId = getStoredAccountId();
  if(!accountId){
    listEl.innerHTML = `<div class="rankEmpty" style="border:1px dashed #e5e7eb;border-radius:14px;background:#fff;">세션이 없습니다.</div>`;
    return;
  }

  const presets = loadMyPresets();

  if(!presets.length){
    listEl.innerHTML = `<div class="rankEmpty" style="border:1px dashed #e5e7eb;border-radius:14px;background:#fff;">저장된 공격덱이 없습니다. (길드전 검색에서 +저장)</div>`;
    return;
  }

  const sorted = [...presets].sort((a,b) => {
    const fa = !!a.isFavorite, fb = !!b.isFavorite;
    if(fa !== fb) return fb - fa;
    return (b.createdAt||0) - (a.createdAt||0);
  });

  const need = new Set();
  sorted.forEach(p => {
    (p.defIds||[]).forEach(id => id && need.add(id));
    (p.atkIds||[]).forEach(id => id && need.add(id));
    (p.skillIds||[]).forEach(id => id && need.add(id));
    if(p.petId) need.add(p.petId);
    if(p.formationId) need.add(p.formationId);
  });

  let map = new Map();
  try{
    const ids = Array.from(need);
    if(ids.length){
      const { data, error } = await supabaseClient
        .from("units")
        .select("id,name,image_url,kind")
        .in("id", ids);

      if(!error){
        map = new Map((data||[]).map(u => [u.id, u]));
      }
    }
  }catch(e){
    console.warn("preset units load fail", e);
  }

  const unitCell = (id) => {
    const u = id ? map.get(id) : null;
    if(!u || !u.image_url){
      return `<div class="uCell"><div class="uEmpty">없음</div><div class="nm">없음</div></div>`;
    }
    return `<div class="uCell"><img src="${escapeHtml(u.image_url)}" alt="${escapeHtml(u.name)}"><div class="nm">${escapeHtml(u.name)}</div></div>`;
  };

  listEl.innerHTML = sorted.map(p => {
    const slotNo = Number(p.slotNo || 0) || 1;
    const fav = !!p.isFavorite;

    const atkIds = (p.atkIds||[]).slice(0,3);
    const defIds = (p.defIds||[]).slice(0,3);

    const expandId = `detail_${slotNo}_${p.createdAt||0}`;
    const btnId = `expand_${slotNo}_${p.createdAt||0}`;

    return `
      <div class="presetItem" data-slot="${slotNo}">
        <div class="presetTopRow">
          <div class="presetLeft">
            <button class="starBtn ${fav ? "on":""}" type="button" data-act="fav" data-slot="${slotNo}">
              ${fav ? "★" : "☆"}
            </button>
            <div class="presetName">프리셋 ${slotNo}</div>
          </div>
          <button class="delBtn" type="button" data-act="del" data-slot="${slotNo}">제거</button>
        </div>

        <div class="presetBody">
          <div class="deckRow">
            <div class="sideLabel atk"><div>공</div><div>격</div></div>
            <div class="unitGrid">
              ${unitCell(atkIds[0])}
              ${unitCell(atkIds[1])}
              ${unitCell(atkIds[2])}
            </div>
          </div>

          <div class="deckRow">
            <div class="sideLabel def"><div>방</div><div>어</div></div>
            <div class="unitGrid">
              ${unitCell(defIds[0])}
              ${unitCell(defIds[1])}
              ${unitCell(defIds[2])}
            </div>
          </div>
        </div>

        <div class="expandRow">
          <button class="expandBtn" id="${btnId}" type="button" data-act="toggle" data-target="${expandId}">
            <span class="chev">⌄</span>
            공격내용 펼치기
          </button>
        </div>

        <div class="detailWrap" id="${expandId}"></div>
      </div>
    `;
  }).join("");

  listEl.querySelectorAll("[data-act]").forEach(btn => {
    btn.addEventListener("click", async () => {
      const act = btn.getAttribute("data-act");
      const slotNo = Number(btn.getAttribute("data-slot"));

      if(act === "toggle"){
        const tid = btn.getAttribute("data-target");
        const d = document.getElementById(tid);
        const card = btn.closest(".presetItem");
        const slot = Number(card?.getAttribute("data-slot") || slotNo);

        const list = loadMyPresets();
        const p = list.find(x => Number(x.slotNo) === slot);

        const on = d.classList.toggle("on");
        if(on){
          d.innerHTML = renderPresetExpandedCard(p, map);
          btn.innerHTML = `<span class="chev">⌃</span> 공격내용 접기`;
        }else{
          d.innerHTML = "";
          btn.innerHTML = `<span class="chev">⌄</span> 공격내용 펼치기`;
        }
        return;
      }

      const list = loadMyPresets();
      const p = list.find(x => Number(x.slotNo) === slotNo);
      if(!p) return;

      if(act === "fav"){
        p.isFavorite = !p.isFavorite;
        saveMyPresets(list);
        renderAtkPage();
        toast(p.isFavorite ? "즐겨찾기 추가" : "즐겨찾기 해제");
      }

      if(act === "del"){
        const next = list.filter(x => Number(x.slotNo) !== slotNo);
        saveMyPresets(next);
        renderAtkPage();
        toast(`프리셋 ${slotNo} 제거됨`);
      }
    });
  });
}

// ===============================
// ✅ 길드전 로직
// ===============================
function initGuildWar(){
  if(window.__GUILD_INITED__) return;
  window.__GUILD_INITED__ = true;

  let enforceTimerId = null;
  let enforceLastEnabled = null;
  let enforceLastSeconds = null;
  let IS_SEARCHING = false;

  // ✅ 저장용: 현재 페이지 결과
  let CURRENT_RESULT = null;

  async function runEnforceCheck(){
    if(IS_SEARCHING) return;
    const ok = await checkAccessByStored();
    if(ok === null) return;
    if(ok === false){
      failGate("접근 권한이 없거나 비활성화된 코드입니다. 관리자에게 문의해주세요.");
    }
  }

  async function refreshEnforceSchedule(){
    const { data, error } = await supabaseClient
      .from("app_settings")
      .select("enforce_active_enabled, enforce_active_seconds")
      .eq("id", 1)
      .single();

    if(error){
      console.error("[settings read error]", error);
      return;
    }

    const enabled = !!data?.enforce_active_enabled;
    const sec = Math.max(5, Number(data?.enforce_active_seconds || 10));

    if(enforceLastEnabled === enabled && enforceLastSeconds === sec) return;

    enforceLastEnabled = enabled;
    enforceLastSeconds = sec;

    if(enforceTimerId){
      clearInterval(enforceTimerId);
      enforceTimerId = null;
    }
    if(!enabled) return;

    enforceTimerId = setInterval(runEnforceCheck, sec * 1000);
    runEnforceCheck();
  }

  refreshEnforceSchedule();
  setInterval(refreshEnforceSchedule, 30000);

  const slots = [null, null, null];
  let activeSlotIndex = 0;

  let UNITS = [];
  let RESULTS = [];
  let currentIndex = 0;
  let UNIT_MAP = new Map();

  const modalBack = document.getElementById("modalBack");
  const unitListEl = document.getElementById("unitList");
  const searchInput = document.getElementById("searchInput");
  const statusText = document.getElementById("statusText");
  const resultBox = document.getElementById("resultBox");

  // TOP5
  const topTrackEl = document.getElementById("topTrack");
  const rankListEl = document.getElementById("rankList");

  let TOP_ROWS = [];
  let TOP_UNIT_MAP = new Map();
  let SLIDE_TIMER = null;
  let SLIDE_INDEX = 0;
  const SLIDE_INTERVAL_MS = 2600;
  const SLIDE_TRANS_MS = 900;

  function renderSlots(){
    document.querySelectorAll(".slot").forEach((el) => {
      const idx = Number(el.dataset.slot);
      const s = slots[idx];

      el.classList.toggle("filled", !!s);
      el.innerHTML = "";

      const rm = document.createElement("button");
      rm.className = "remove";
      rm.title = "제거";
      rm.type = "button";
      rm.textContent = "×";
      rm.addEventListener("click", (e) => {
        e.stopPropagation();
        clearSlot(idx);
      });
      el.appendChild(rm);

      if(!s){
        const plus = document.createElement("div");
        plus.className = "plus";
        plus.textContent = "+";
        el.appendChild(plus);
        return;
      }

      const thumb = document.createElement("div");
      thumb.className = "thumb";
      const img = document.createElement("img");
      img.src = s.image_url;
      img.alt = s.name;
      thumb.appendChild(img);

      const nm = document.createElement("div");
      nm.className = "name";
      nm.textContent = s.name;

      el.appendChild(thumb);
      el.appendChild(nm);
    });
  }

  function updateResultHint(){
    const chosen = slots.filter(Boolean);
    if(chosen.length < 3){
      statusText.textContent = "검색 전";
      resultBox.textContent = "방어 유닛 3명을 선택해 주세요";
      RESULTS = [];
      currentIndex = 0;
      return;
    }
    statusText.textContent = "준비됨";
    resultBox.textContent = `선택됨: ${chosen.map(x=>x.name).join(", ")}`;
  }

  function renderUnitList(list){
    unitListEl.innerHTML = "";
    list.forEach((u) => {
      const row = document.createElement("div");
      row.className = "item";
      row.innerHTML = `
        <div class="thumb"><img src="${u.image_url}" alt="${escapeHtml(u.name)}"></div>
        <div class="name">${escapeHtml(u.name)}</div>
      `;
      row.addEventListener("click", () => {
        setSlot(activeSlotIndex, u);
        closeModal();
      });
      unitListEl.appendChild(row);
    });

    if(list.length === 0){
      unitListEl.innerHTML = `<div style="padding:14px;color:#6b7280;font-size:13px;">검색 결과가 없습니다</div>`;
    }
  }

  function setSlot(i, unit){
    const already = slots.findIndex(s => s && s.name === unit.name);
    if(already !== -1 && already !== i){
      alert("이미 선택된 유닛입니다.");
      return;
    }
    slots[i] = { id: unit.id, name: unit.name, image_url: unit.image_url };
    renderSlots();
    updateResultHint();
  }

  function clearSlot(i){
    slots[i] = null;
    renderSlots();
    updateResultHint();
  }

  function openModal(slotIndex){
    activeSlotIndex = slotIndex;
    modalBack.style.display = "flex";
    searchInput.value = "";
    renderUnitList(UNITS);
    setTimeout(() => searchInput.focus({ preventScroll:true }), 50);
  }
  function closeModal(){
    modalBack.style.display = "none";
  }

  document.getElementById("btnClose").addEventListener("click", closeModal);
  modalBack.addEventListener("click", (e) => {
    if(e.target === modalBack) closeModal();
  });
  document.querySelectorAll(".slot").forEach((el) => {
    el.addEventListener("click", () => openModal(Number(el.dataset.slot)));
  });

  function cellHtml(unit){
    if(!unit){
      return `
        <div class="cell">
          <div class="emptyBox">없음</div>
          <div class="cap">없음</div>
        </div>
      `;
    }
    return `
      <div class="cell">
        <img src="${unit.image_url}" alt="${escapeHtml(unit.name)}">
        <div class="cap">${escapeHtml(unit.name)}</div>
      </div>
    `;
  }

  // ✅ 저장
  function addPresetFromCurrent(){
    if(!CURRENT_RESULT){
      toast("저장할 결과가 없습니다.");
      return;
    }

    const existing = loadMyPresets();
    const defIds = slots.map(s => (s && s.id) ? s.id : null).filter(Boolean).slice(0,3);
    const atkIds = (CURRENT_RESULT.atk || []).map(u => u?.id).filter(Boolean).slice(0,3);
    const sig = `${defIds.sort().join("|")}__${atkIds.sort().join("|")}`;
    if(existing.some(p => (p.sig === sig))){
      toast("이미 저장됨");
      return;
    }

    const accountId = getStoredAccountId();
    if(!accountId){
      toast("세션이 없습니다.");
      return;
    }

    const now = Date.now();
    const list = loadMyPresets();

    let targetSlot = null;
    for(let i=1;i<=10;i++){
      if(!list.find(p => Number(p.slotNo) === i)){
        targetSlot = i;
        break;
      }
    }
    if(!targetSlot){
      const sortedOld = [...list].sort((a,b) => (a.createdAt||0) - (b.createdAt||0));
      targetSlot = Number(sortedOld[0]?.slotNo || 1);
    }

    const preset = {
      slotNo: targetSlot,
      sig,
      isFavorite: false,
      createdAt: now,

      atkIds: (CURRENT_RESULT.atk || []).map(u => u?.id).filter(Boolean).slice(0,3),
      defIds: slots.map(s => s?.id).filter(Boolean).slice(0,3),

      atkRank: CURRENT_RESULT.atk_rank ?? null,
      first: CURRENT_RESULT.first ?? "없음",
      important: CURRENT_RESULT.important ?? "",
      setComment: CURRENT_RESULT.set_comment ?? "",
      skillIds: (CURRENT_RESULT.skill || []).map(u => u?.id).filter(Boolean).slice(0,3),
      petId: CURRENT_RESULT.pet?.id ?? null,
      formationId: CURRENT_RESULT.formationUnit?.id ?? null,
      formationsComment: CURRENT_RESULT.formations_comment ?? ""
    };

    const next = list.filter(p => Number(p.slotNo) !== targetSlot);
    next.push(preset);
    saveMyPresets(next);

    toast(`Preset ${targetSlot} 저장됨`);
  }

  function renderSingleResult(){
    const total = RESULTS.length;
    const hasAny = total > 0;

    const idx = Math.min(Math.max(currentIndex, 0), Math.max(total - 1, 0));
    currentIndex = idx;

    const r = hasAny ? RESULTS[idx] : null;
    CURRENT_RESULT = r;

    const atkArr = r ? r.atk : [null, null, null];
    const skArr  = r ? r.skill : [null, null, null];
    const pet    = r ? r.pet : null;

    const importantText = (r?.important ?? "").trim() || "없음";
    const formationsComment = (r?.formations_comment ?? "").trim() || "없음";
    const setComment = (r?.set_comment ?? "").trim() || "없음";

    const firstText = r?.first ?? "없음";
    const badgeClass =
      firstText === "선공" ? "badge red" :
      firstText === "후공" ? "badge blue" :
      "badge gray";

    const pageLabel = hasAny ? `${idx+1} / ${total}` : `0 / 0`;

    const formationUnit = (r?.formations ? (UNIT_MAP.get(r.formations) || null) : null);
    const formationNameText = formationUnit?.name || "없음";
    const formationImgHtml = formationUnit?.image_url
      ? `<img class="formationImg" src="${escapeHtml(formationUnit.image_url)}" alt="formation">`
      : `<div class="emptyBox" style="width: calc(var(--narrowW) - 20px); height: 64px; border-radius:12px;">없음</div>`;

    const medal = hasAny ? rankMedalHtml(r?.atk_rank) : "";

    resultBox.innerHTML = `
      <div class="resultToolbar">
        <div class="toolbarLeft">
          <div style="font-weight:900;color:#111827;">검색 결과</div>
          ${medal}
        </div>

        ${(() => {
          const list = loadMyPresets();
          const defIds = slots.map(s => s?.id).filter(Boolean).slice(0,3);
          const atkIds = (r?.atk || []).map(u => u?.id).filter(Boolean).slice(0,3);
          const sig = `${defIds.sort().join("|")}__${atkIds.sort().join("|")}`;
          const saved = list.some(p => p.sig === sig);
          const txt = saved ? "추가됨" : "+저장";
          const dis = saved ? "disabled" : "";
          return `<button class="pagerBtn" id="btnSavePreset" type="button" ${dis}>${txt}</button>`;
        })()}

        <div class="pager">
          <button class="pagerBtn" id="btnPrev" type="button" ${(!hasAny || idx===0) ? "disabled":""}>◀</button>
          <div class="pageInfo">${pageLabel}</div>
          <button class="pagerBtn" id="btnNext" type="button" ${(!hasAny || idx===total-1) ? "disabled":""}>▶</button>
        </div>
      </div>

      <div class="card">
        <div class="importantBar">
          <div class="ico">⚠️</div>
          <div class="txt">주요사항: ${escapeHtml(importantText)}</div>
        </div>

        <div class="layoutRows">
          <div class="row2col">
            <div class="panel box">
              <div class="panelTitle">공격유닛</div>
              <div class="grid3">
                ${cellHtml(atkArr[0])}
                ${cellHtml(atkArr[1])}
                ${cellHtml(atkArr[2])}
              </div>
            </div>

            <div class="panel box small centerCol">
              <div class="panelTitle">추천 펫</div>
              ${pet ? `
                <div class="cell">
                  <img src="${pet.image_url}" alt="${escapeHtml(pet.name)}">
                  <div class="petName">${escapeHtml(pet.name)}</div>
                </div>
              ` : `
                <div class="cell">
                  <div class="emptyBox">없음</div>
                  <div class="petName">없음</div>
                </div>
              `}
            </div>
          </div>

          <div class="row2col">
            <div class="panel box">
              <div class="panelTitle">스킬순서</div>
              <div class="grid3">
                ${cellHtml(skArr[0])}
                ${cellHtml(skArr[1])}
                ${cellHtml(skArr[2])}
              </div>
            </div>

            <div class="panel box small centerCol">
              <div class="panelTitle">공격순서</div>
              <div style="width:100%;display:flex;justify-content:center;flex:1;align-items:center;">
                <span class="${badgeClass}">${escapeHtml(firstText)}</span>
              </div>
            </div>
          </div>

          <div class="row2col">
            <div class="panel box">
              <div class="panelTitle">세트추천 및 설명</div>
              <div class="textBox setTextBox">${escapeHtml(setComment)}</div>
            </div>

            <div class="panel box small centerCol">
              <div class="formationWrap">
                ${formationImgHtml}
                <div class="formationName">${escapeHtml(formationNameText)}</div>
                <div class="formationDesc">${escapeHtml(formationsComment)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    const saveBtn = document.getElementById("btnSavePreset");
    if(saveBtn){
      saveBtn.addEventListener("click", () => {
        addPresetFromCurrent();
        renderSingleResult();
      });
    }

    const prevBtn = document.getElementById("btnPrev");
    const nextBtn = document.getElementById("btnNext");

    if(prevBtn) prevBtn.addEventListener("click", () => {
      if(currentIndex > 0){
        currentIndex--;
        renderSingleResult();
      }
    });
    if(nextBtn) nextBtn.addEventListener("click", () => {
      if(currentIndex < total - 1){
        currentIndex++;
        renderSingleResult();
      }
    });
  }

  document.getElementById("btnReset").addEventListener("click", () => {
    slots[0]=slots[1]=slots[2]=null;
    RESULTS = [];
    currentIndex = 0;
    renderSlots();
    updateResultHint();
  });

  document.getElementById("btnSearch").addEventListener("click", async (e) => {
    e.preventDefault();
    e.stopPropagation();

    IS_SEARCHING = true;

    try{
      const ok = await checkAccessByStored();
      if(ok === null){
        statusText.textContent = "서버 불안정";
        resultBox.textContent = "서버 확인 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.";
        return;
      }
      if(ok === false){
        failGate("접근 권한이 없거나 비활성화된 코드입니다. 관리자에게 문의해주세요.");
        return;
      }

      const selected = slots.filter(Boolean);
      if(selected.length < 3){
        alert("방어 유닛 3명을 먼저 선택해 주세요.");
        return;
      }

      const defKey = selected.map(s => s.id).sort().join("|");

      // 🔥 검색 로그
      try {
        const id = Number(localStorage.getItem(LS_ACCOUNT_ID));
        const code = Number(localStorage.getItem(LS_CODE));

        if (Number.isInteger(id) && Number.isInteger(code)) {
          await supabaseClient.rpc("log_guild_search", {
            p_account_id: id,
            p_code: code,
            p_def_key: defKey
          });
        }
      } catch (e) {
        console.error("검색 로그 기록 실패:", e);
      }

      statusText.textContent = "검색중...";
      resultBox.textContent = "잠시만...";

      const { data: rows, error } = await supabaseClient
        .from("guild_war_results")
        .select([
          "result_id","atk_rank",
          "atk_1","atk_2","atk_3",
          "skill_1","skill_2","skill_3",
          "pet","first","def_key",
          "important","formations","formations_comment","set_comment"
        ].join(", "))
        .eq("def_key", defKey)
        .order("atk_rank", { ascending: true })
        .order("result_id", { ascending: true });

      if(error){
        console.error(error);
        statusText.textContent = "에러";
        resultBox.textContent = "조회 실패(콘솔 확인)";
        return;
      }

      if(!rows || rows.length === 0){
        statusText.textContent = "결과 없음";
        RESULTS = [];
        currentIndex = 0;
        renderSingleResult();
        return;
      }

      const ids = new Set();
      rows.forEach(r => {
        [r.atk_1,r.atk_2,r.atk_3,r.skill_1,r.skill_2,r.skill_3,r.pet].forEach(x => { if(x) ids.add(x); });
        if (r.formations) ids.add(r.formations);
      });

      const { data: unitRows, error: unitErr } = await supabaseClient
        .from("units")
        .select("id, name, image_url, kind")
        .in("id", Array.from(ids));

      if(unitErr) console.error(unitErr);

      const unitMap = new Map((unitRows || []).map(u => [u.id, u]));
      UNIT_MAP = unitMap;

      RESULTS = rows.map(r => {
        const atk = [r.atk_1, r.atk_2, r.atk_3].map(id => unitMap.get(id) || null);
        const skill = [r.skill_1, r.skill_2, r.skill_3].map(id => unitMap.get(id) || null);
        const pet = unitMap.get(r.pet) || null;
        const formationUnit = r.formations ? (unitMap.get(r.formations) || null) : null;

        return {
          result_id: r.result_id,
          atk_rank: r.atk_rank ?? null,
          first: r.first ?? "없음",
          important: r.important ?? "",
          formations: r.formations ?? "",
          formations_comment: r.formations_comment ?? "",
          set_comment: r.set_comment ?? "",
          atk, skill, pet, formationUnit
        };
      });

      currentIndex = 0;
      statusText.textContent = `결과 ${RESULTS.length}개`;
      renderSingleResult();
    } finally {
      IS_SEARCHING = false;
    }
  });

  searchInput.addEventListener("input", () => {
    const q = searchInput.value.trim().toLowerCase();
    if(!q){
      renderUnitList(UNITS);
      return;
    }
    const filtered = UNITS.filter(u => (u.name || "").toLowerCase().includes(q));
    renderUnitList(filtered);
  });

  async function loadUnits(){
    statusText.textContent = "유닛 로딩중...";
    const { data, error } = await supabaseClient
      .from("units")
      .select("id, name, image_url")
      .eq("kind", "unit")
      .order("name", { ascending: true });

    if(error){
      console.error(error);
      statusText.textContent = "유닛 로드 실패";
      resultBox.textContent = "유닛을 불러오지 못했습니다. (RLS/정책 또는 컬럼 확인)";
      return;
    }

    UNITS = (data || []).map(u => ({ id: u.id, name: u.name, image_url: u.image_url }));
    statusText.textContent = `유닛 ${UNITS.length}개 로드됨`;
    updateResultHint();

    loadTop5AllTime();
  }

  function parseDefKeyToIds(defKey){
    return String(defKey || "")
      .split("|")
      .map(s => s.trim())
      .filter(Boolean)
      .slice(0,3);
  }

  async function loadTop5AllTime(){
    try{
      const ok = await checkAccessByStored();
      if(ok !== true) return;

      const { data, error } = await supabaseClient
        .from("defkey_alltime_counts")
        .select("def_key, total_count")
        .order("total_count", { ascending: false })
        .limit(5);

      if(error){
        console.warn("[TOP5] defkey_alltime_counts not ready:", error);
        renderTopEmpty("TOP 데이터 준비중");
        return;
      }

      const rows = (data || [])
        .filter(x => x?.def_key)
        .map((x, i) => ({
          rank: i + 1,
          def_key: x.def_key,
          def_ids: parseDefKeyToIds(x.def_key),
          count: Number(x.total_count || 0)
        }))
        .filter(x => x.def_ids.length === 3);

      if(rows.length === 0){
        renderTopEmpty("TOP 데이터 없음");
        return;
      }

      TOP_ROWS = rows;

      const need = new Set();
      TOP_ROWS.forEach(r => r.def_ids.forEach(id => need.add(id)));

      const { data: urows, error: uerr } = await supabaseClient
        .from("units")
        .select("id, name, image_url, kind")
        .in("id", Array.from(need));

      if(uerr){
        console.error("[TOP5 units load error]", uerr);
        renderTopEmpty("TOP 유닛 로드 실패");
        return;
      }

      TOP_UNIT_MAP = new Map((urows || []).map(u => [u.id, u]));

      renderTopSlider();
      renderTopRankList();
      startSlider();
    }catch(e){
      console.error("[TOP5 load error]", e);
      renderTopEmpty("TOP 데이터 오류");
    }
  }

  function renderTopEmpty(msg){
    topTrackEl.innerHTML = `
      <div class="topSlideRow">
        <div class="rankCol"><div class="rankBadge is-1">1</div></div>
        <div style="min-width:0;display:flex;align-items:center;justify-content:center;color:#6b7280;font-weight:900;font-size:12px;">
          ${escapeHtml(msg || "없음")}
        </div>
        <div class="countCol">🔥 0</div>
      </div>
    `;
    rankListEl.innerHTML = `<div class="rankEmpty">${escapeHtml(msg || "없음")}</div>`;
    stopSlider();
  }

  function getUnitForTop(id){
    const u = TOP_UNIT_MAP.get(id);
    if(!u) return null;
    return { id: u.id, name: u.name, image_url: u.image_url };
  }

  function topUnitCellHtml(u){
    if(!u){
      return `
        <div class="midUnit">
          <div class="uimg" style="display:flex;align-items:center;justify-content:center;color:#9ca3af;font-weight:1000;background:#f3f4f6;border:1px solid rgba(0,0,0,.06);">-</div>
          <div class="uname">없음</div>
        </div>
      `;
    }
    return `
      <div class="midUnit">
        <img class="uimg" src="${escapeHtml(u.image_url)}" alt="${escapeHtml(u.name)}">
        <div class="uname">${escapeHtml(u.name)}</div>
      </div>
    `;
  }

  function renderTopSlider(){
    const slides = [...TOP_ROWS];
    slides.push({ ...TOP_ROWS[0], rank: TOP_ROWS[0].rank, __clone:true });

    topTrackEl.style.transition = `transform ${SLIDE_TRANS_MS}ms cubic-bezier(0.4,0,0.2,1)`;
    topTrackEl.innerHTML = slides.map((r) => {
      const u1 = getUnitForTop(r.def_ids[0]);
      const u2 = getUnitForTop(r.def_ids[1]);
      const u3 = getUnitForTop(r.def_ids[2]);
      const rank = r.__clone ? TOP_ROWS[0].rank : r.rank;
      const count = r.count ?? 0;

      return `
        <div class="topSlideRow">
          <div class="rankCol"><div class="rankBadge is-${rank}">${rank}</div></div>
          <div class="midUnits">
            ${topUnitCellHtml(u1)}
            ${topUnitCellHtml(u2)}
            ${topUnitCellHtml(u3)}
          </div>
          <div class="countCol">🔥 ${escapeHtml(count)}</div>
        </div>
      `;
    }).join("");

    SLIDE_INDEX = 0;
    topTrackEl.style.transform = `translateY(0px)`;
  }

  function renderTopRankList(){
    rankListEl.innerHTML = TOP_ROWS.map((r) => {
      const u1 = getUnitForTop(r.def_ids[0]);
      const u2 = getUnitForTop(r.def_ids[1]);
      const u3 = getUnitForTop(r.def_ids[2]);

      const uHtml = (u) => {
        if(!u){
          return `<div class="rankUnit"><span>없음</span></div>`;
        }
        return `
          <div class="rankUnit">
            <img src="${escapeHtml(u.image_url)}" alt="${escapeHtml(u.name)}">
            <span>${escapeHtml(u.name)}</span>
          </div>
        `;
      };

      return `
        <div class="rankRow" data-defkey="${escapeHtml(r.def_key)}">
          <div class="rankNum">${r.rank}.</div>
          <div class="rankUnits">
            ${uHtml(u1)}
            ${uHtml(u2)}
            ${uHtml(u3)}
          </div>
          <div class="countCol">🔥 ${escapeHtml(r.count)}</div>
        </div>
      `;
    }).join("");

    document.querySelectorAll(".rankRow").forEach(el => {
      el.addEventListener("click", async () => {
        const defKey = el.getAttribute("data-defkey");
        if(!defKey) return;

        const ok = await checkAccessByStored();
        if(ok !== true){
          failGate("접근 권한이 없거나 비활성화된 코드입니다. 관리자에게 문의해주세요.");
          return;
        }

        const ids = parseDefKeyToIds(defKey);
        if(ids.length !== 3) return;

        const a = getUnitForTop(ids[0]);
        const b = getUnitForTop(ids[1]);
        const c = getUnitForTop(ids[2]);
        if(!a || !b || !c){
          alert("랭킹 유닛 정보를 불러오지 못했습니다.");
          return;
        }

        slots[0] = a;
        slots[1] = b;
        slots[2] = c;
        renderSlots();
        updateResultHint();

        statusText.textContent = "랭킹으로 검색중...";
        document.getElementById("btnSearch").click();
      });
    });
  }

  function startSlider(){
    stopSlider();
    if(!TOP_ROWS || TOP_ROWS.length === 0) return;

    SLIDE_TIMER = setInterval(() => {
      const rowH = Number(getComputedStyle(document.documentElement).getPropertyValue("--topRowH").replace("px","")) || 92;

      SLIDE_INDEX += 1;
      topTrackEl.style.transition = `transform ${SLIDE_TRANS_MS}ms cubic-bezier(0.4,0,0.2,1)`;
      topTrackEl.style.transform = `translateY(-${SLIDE_INDEX * rowH}px)`;

      if(SLIDE_INDEX === TOP_ROWS.length){
        setTimeout(() => {
          topTrackEl.style.transition = "none";
          SLIDE_INDEX = 0;
          topTrackEl.style.transform = `translateY(0px)`;
          requestAnimationFrame(() => {
            topTrackEl.style.transition = `transform ${SLIDE_TRANS_MS}ms cubic-bezier(0.4,0,0.2,1)`;
          });
        }, SLIDE_TRANS_MS + 20);
      }
    }, SLIDE_INTERVAL_MS);
  }

  function stopSlider(){
    if(SLIDE_TIMER){
      clearInterval(SLIDE_TIMER);
      SLIDE_TIMER = null;
    }
  }

  document.addEventListener("keydown", (e) => {
    if(e.key === "Escape"){
      if(modalBack.style.display === "flex") modalBack.style.display = "none";
    }
  });

  renderSlots();
  updateResultHint();
  loadUnits();
}
// ===== 여기까지 전부 JS =====
