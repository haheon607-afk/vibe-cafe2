// ========================================================
// 바이브 카페 (Vibe Cafe) - script.js
// 초보자를 위한 친절한 설명과 함께 작성된 자바스크립트 파일입니다.
// ========================================================


// ========================================================
// [파트 0] Supabase 설정 및 클라이언트 초기화
// ========================================================
// Supabase 프로젝트 대시보드(Project Settings -> API)에서 확인한 값을 아래에 직접 입력해주세요.
// 주의: URL은 반드시 'https://프로젝트ID.supabase.co' 형태의 전체 주소여야 합니다!
const SUPABASE_URL = 'https://tblnjaqqfgjzywyupfpv.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRibG5qYXFxZmdqenl3eXVwZnB2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTEzOTU1MTgsImV4cCI6MjEwNjk3MTUxOH0.663muiL0fFVEcifU66P_cniiInNFWerV-awT7tA1f0c';

// URL 형식 자동 보정 (혹시 프로젝트 ID만 적었더라도 오류 없이 정상 URL로 연결되도록 안전장치 추가)
let formattedSupabaseUrl = SUPABASE_URL.trim();
if (formattedSupabaseUrl && !formattedSupabaseUrl.startsWith('http://') && !formattedSupabaseUrl.startsWith('https://')) {
  formattedSupabaseUrl = `https://${formattedSupabaseUrl}.supabase.co`;
}

// CDN을 통해 불러온 supabase 객체를 이용해 클라이언트를 생성합니다.
let supabaseClient = null;
try {
  supabaseClient = supabase.createClient(formattedSupabaseUrl, SUPABASE_KEY);
} catch (initError) {
  console.error('Supabase 클라이언트 생성 실패:', initError);
}


// ========================================================
// [파트 1] 카페 로고 인터랙션 (커피 그림 애니메이션 & 순환)
// ========================================================

const cafeLogo = document.querySelector('.cafe-header .logo');
const coffeeLogos = ['☕', '🥤', '🧋'];
let currentLogoIndex = 0;

cafeLogo.addEventListener('click', () => {
  // 통통 튀는 애니메이션 실행
  cafeLogo.classList.remove('bounce-animate');
  void cafeLogo.offsetWidth; // 브라우저 화면 강제 갱신(Reflow)
  cafeLogo.classList.add('bounce-animate');

  // 다음 커피 그림으로 순환 (% 나머지 연산자 활용)
  currentLogoIndex = (currentLogoIndex + 1) % coffeeLogos.length;
  cafeLogo.textContent = coffeeLogos[currentLogoIndex];
});


// ========================================================
// [파트 2] 탭 메뉴 전환 (주문하기 <-> 주문 내역)
// ========================================================

const tabOrderBtn = document.getElementById('tab-order-btn');     // ☕ 주문하기 탭 버튼
const tabHistoryBtn = document.getElementById('tab-history-btn'); // 📋 주문 내역 탭 버튼
const orderTab = document.getElementById('order-tab');             // 주문하기 화면
const historyTab = document.getElementById('history-tab');         // 주문 내역 화면
const orderBadge = document.getElementById('order-badge');         // 주문 건수 배지

// "☕ 주문하기" 탭 클릭 시
tabOrderBtn.addEventListener('click', () => {
  tabOrderBtn.classList.add('active');
  tabHistoryBtn.classList.remove('active');

  orderTab.classList.remove('hidden');   // 주문하기 화면 표시
  historyTab.classList.add('hidden');    // 주문 내역 화면 숨김
});

// "📋 주문 내역" 탭 클릭 시
tabHistoryBtn.addEventListener('click', () => {
  tabHistoryBtn.classList.add('active');
  tabOrderBtn.classList.remove('active');

  historyTab.classList.remove('hidden'); // 주문 내역 화면 표시
  orderTab.classList.add('hidden');      // 주문하기 화면 숨김
});


// ========================================================
// [파트 3] 바이브 카페 주문서 및 실시간 금액 계산
// ========================================================

const orderForm = document.getElementById('order-form');
const customerNameInput = document.getElementById('customer-name');
const customerPhoneInput = document.getElementById('customer-phone');
const drinkSelect = document.getElementById('drink-select');
const sizeRadios = document.querySelectorAll('input[name="size"]');
const optionCheckboxes = document.querySelectorAll('input[name="options"]');
const quantityInput = document.getElementById('order-quantity');
const specialRequestsInput = document.getElementById('special-requests');
const totalPriceDisplay = document.getElementById('total-price-display');
const submitBtn = document.getElementById('submit-btn');
const orderConfirmation = document.getElementById('order-confirmation');

/**
 * [단일 계산 함수] 선택된 항목들의 금액을 합산하여 최종 금액을 반환합니다.
 * @returns {number} 총 금액 (숫자)
 */
function calculateTotal() {
  // 음료를 선택하지 않았으면 0원 반환
  if (!drinkSelect.value) {
    return 0;
  }

  // 1. 음료 기본 가격 (data-price)
  const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkPrice = Number(selectedOption.dataset.price) || 0;

  // 2. 사이즈 추가 가격 (data-price)
  const selectedSize = document.querySelector('input[name="size"]:checked');
  const sizePrice = selectedSize ? (Number(selectedSize.dataset.price) || 0) : 0;

  // 3. 선택된 옵션들 추가 가격 합산 (data-price)
  const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
  let optionsPrice = 0;
  checkedOptions.forEach((option) => {
    optionsPrice += Number(option.dataset.price) || 0;
  });

  // 4. 수량 (기본값 1)
  let quantity = parseInt(quantityInput.value, 10);
  if (isNaN(quantity) || quantity < 1) {
    quantity = 1;
  }

  // 최종 금액 = 1잔당 가격 * 수량
  return (drinkPrice + sizePrice + optionsPrice) * quantity;
}

/**
 * 화면의 "예상 금액" 표시를 갱신하는 함수
 */
function updateTotalPriceDisplay() {
  const total = calculateTotal();
  totalPriceDisplay.textContent = `예상 금액: ${total.toLocaleString()}원`;
}

// 실시간 금액 계산을 위한 이벤트 리스너 등록
drinkSelect.addEventListener('change', updateTotalPriceDisplay);
sizeRadios.forEach((radio) => radio.addEventListener('change', updateTotalPriceDisplay));
optionCheckboxes.forEach((checkbox) => checkbox.addEventListener('change', updateTotalPriceDisplay));
quantityInput.addEventListener('input', updateTotalPriceDisplay);


// ========================================================
// [파트 4] 주문 내역 관리 (저장, 렌더링, 취소, 초기화)
// ========================================================

// 주문 목록을 저장할 배열
let orders = [];

// 주문 번호를 부여할 카운터 (1부터 순차 증가)
let orderCounter = 0;

// 주문 내역 관련 화면 요소들
const emptyOrdersNotice = document.getElementById('empty-orders');     // 빈 주문 안내문
const orderListContainer = document.getElementById('order-list');       // 주문 카드 목록
const historySummary = document.getElementById('history-summary');       // 하단 요약 박스
const totalSummaryText = document.getElementById('total-summary-text'); // 총 금액 및 건수 텍스트
const clearAllBtn = document.getElementById('clear-all-btn');           // 내역 모두 지우기 버튼

/**
 * 주문 시간을 '오후 2:30' 형태로 만들어주는 보조 함수
 */
function getFormattedTime() {
  const now = new Date();
  const hours = now.getHours();
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const period = hours >= 12 ? '오후' : '오전';
  const displayHours = hours % 12 || 12;
  return `${period} ${displayHours}:${minutes}`;
}

/**
 * [단일 렌더링 함수] orders 배열의 내용을 바탕으로 주문 내역 화면을 그립니다.
 * XSS 공격 방지를 위해 사용자가 입력한 모든 값은 innerHTML 대신 textContent로 안전하게 삽입합니다.
 */
function renderOrders() {
  // [1] 탭 옆의 둥근 갈색 배지 건수 업데이트
  orderBadge.textContent = orders.length;

  // [2] 주문 내역이 하나도 없을 때
  if (orders.length === 0) {
    emptyOrdersNotice.classList.remove('hidden');
    orderListContainer.classList.add('hidden');
    historySummary.classList.add('hidden');
    orderListContainer.textContent = '';
    return;
  }

  // [3] 주문 내역이 있을 때
  emptyOrdersNotice.classList.add('hidden');
  orderListContainer.classList.remove('hidden');
  historySummary.classList.remove('hidden');

  orderListContainer.textContent = '';
  let grandTotal = 0;

  orders.forEach((order) => {
    grandTotal += order.total;

    // --- 카드 컨테이너 (<div class="order-card">) ---
    const card = document.createElement('div');
    card.className = 'order-card';

    // --- 1줄: 제목(주문번호, 이름, 금액)과 취소 버튼 ---
    const header = document.createElement('div');
    header.className = 'order-card-header';

    const title = document.createElement('span');
    title.className = 'order-card-title';
    title.textContent = `#${order.id} ${order.name}님 · ${order.total.toLocaleString()}원`;

    const cancelBtn = document.createElement('button');
    cancelBtn.type = 'button';
    cancelBtn.className = 'order-cancel-btn';
    cancelBtn.textContent = '취소';

    cancelBtn.addEventListener('click', () => {
      const isConfirmed = confirm(`주문번호 #${order.id} (${order.name}님) 주문을 취소하시겠습니까?`);
      if (isConfirmed) {
        orders = orders.filter((item) => item.id !== order.id);
        renderOrders();
      }
    });

    header.appendChild(title);
    header.appendChild(cancelBtn);

    // --- 2줄: 음료, 사이즈, 옵션, 수량 ---
    const drinkInfo = document.createElement('p');
    drinkInfo.className = 'order-card-drink';
    const optionsText = order.options.length > 0 ? ` (${order.options.join(', ')})` : '';
    drinkInfo.textContent = `${order.drink} ${order.size}${optionsText} ${order.quantity}잔`;

    // --- 3줄: 요청사항(있을 때만) · 주문 시간 ---
    const metaInfo = document.createElement('p');
    metaInfo.className = 'order-card-meta';
    const metaParts = [];
    if (order.requests) {
      metaParts.push(`요청: ${order.requests}`);
    }
    metaParts.push(order.time);
    metaInfo.textContent = metaParts.join(' · ');

    card.appendChild(header);
    card.appendChild(drinkInfo);
    card.appendChild(metaInfo);
    orderListContainer.appendChild(card);
  });

  // [4] 하단 요약 문구 업데이트
  totalSummaryText.textContent = `총 주문 금액: ${grandTotal.toLocaleString()}원 (${orders.length}건)`;
}

// "내역 모두 지우기" 버튼 클릭 시
clearAllBtn.addEventListener('click', () => {
  if (orders.length === 0) return;

  const isConfirmed = confirm('접수된 모든 주문 내역을 삭제하시겠습니까?');
  if (isConfirmed) {
    orders = [];
    renderOrders();
  }
});


// --------------------------------------------------------
// [파트 5] 주문하기 제출 (Supabase 저장 연동) 및 다시 작성
// --------------------------------------------------------

// async 키워드를 붙여서 비동기 데이터베이스 통신(await)을 처리합니다.
orderForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  const customerName = customerNameInput.value.trim();
  const customerPhone = customerPhoneInput.value.trim();

  // [유효성 검사 1] 이름 확인
  if (!customerName) {
    alert('이름을 입력해주세요');
    customerNameInput.focus();
    return;
  }

  // [유효성 검사 2] 음료 선택 확인
  if (!drinkSelect.value) {
    alert('음료를 선택해주세요');
    drinkSelect.focus();
    return;
  }

  // 주문 상세 정보 추출
  const selectedOption = drinkSelect.options[drinkSelect.selectedIndex];
  const drinkName = selectedOption.textContent.replace(/\s*\(.*\)/, '').trim();
  const drinkPrice = Number(selectedOption.dataset.price) || 0;

  const selectedSize = document.querySelector('input[name="size"]:checked');
  const sizeValue = selectedSize ? selectedSize.value : 'M'; // "S", "M", "L"
  const sizeName = selectedSize ? `${selectedSize.value}사이즈` : '';

  const checkedOptions = document.querySelectorAll('input[name="options"]:checked');
  const optionNames = [];
  checkedOptions.forEach((option) => {
    const label = document.querySelector(`label[for="${option.id}"]`);
    if (label) {
      optionNames.push(label.textContent.replace(/\s*\(.*\)/, '').trim());
    }
  });

  const quantity = parseInt(quantityInput.value, 10) || 1;
  const requests = specialRequestsInput.value.trim();
  const total = calculateTotal();
  const orderTime = getFormattedTime();

  // [중복 클릭 방지] 통신 중에는 주문하기 버튼을 비활성화하고 텍스트를 바꿉니다.
  const originalButtonText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '주문 저장 중...';

  try {
    // Supabase 클라이언트 연결 여부 확인
    if (!supabaseClient) {
      throw new Error('Supabase 클라이언트가 초기화되지 않았습니다. URL과 KEY 설정을 확인해주세요.');
    }

    // ----------------------------------------------------
    // Supabase 데이터베이스의 cafe_menu03 테이블에 주문 데이터 저장
    // ----------------------------------------------------
    const { data, error } = await supabaseClient
      .from('cafe_menu03')
      .insert([
        {
          customer_name: customerName,
          phone: customerPhone,
          drink: drinkName,
          drink_price: drinkPrice,
          size: sizeValue,
          options: optionNames, // 자바스크립트 배열 형태로 전달
          quantity: quantity,
          request: requests,
          total_price: total
        }
      ]);

    // Supabase에서 에러를 반환했을 경우 강제로 catch 블록으로 이동
    if (error) {
      throw error;
    }

    // ----------------------------------------------------
    // [저장 성공 시 후속 처리]
    // ----------------------------------------------------

    // 1. 주문 번호 증가 및 로컬 orders 배열에 추가
    orderCounter += 1;
    const newOrder = {
      id: orderCounter,
      name: customerName,
      drink: drinkName,
      size: sizeName,
      options: optionNames,
      quantity: quantity,
      requests: requests,
      total: total,
      time: orderTime
    };

    orders.unshift(newOrder); // 최신 주문을 배열 맨 앞에 삽입
    renderOrders();           // 주문 내역 탭 목록 및 배지 갱신

    // 2. 주문 확인 메시지 표시
    const optionsText = optionNames.length > 0 ? ` (${optionNames.join(', ')})` : '';
    const message = `${customerName}님, ${drinkName} ${sizeName}${optionsText} ${quantity}잔, 총 ${total.toLocaleString()}원 주문이 접수되었습니다!`;

    orderConfirmation.textContent = message;
    orderConfirmation.classList.remove('hidden');
    orderConfirmation.style.display = 'block';
    orderConfirmation.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

  } catch (error) {
    // ----------------------------------------------------
    // [저장 실패 시 처리]
    // ----------------------------------------------------
    console.error('Supabase 주문 저장 에러:', error);
    const reason = error.message ? `\n(원인: ${error.message})` : '';
    alert(`주문 저장에 실패했어요${reason}`);
  } finally {
    // 성공하든 실패하든 통신이 끝나면 버튼을 다시 활성화 상태로 되돌립니다.
    submitBtn.disabled = false;
    submitBtn.textContent = originalButtonText;
  }
});

// "다시 작성" 버튼 클릭 시 (주문 내역은 건드리지 않고 폼 입력값만 초기화)
orderForm.addEventListener('reset', () => {
  setTimeout(() => {
    const sizeM = document.getElementById('size-m');
    if (sizeM) sizeM.checked = true;
    quantityInput.value = 1;

    updateTotalPriceDisplay();

    orderConfirmation.textContent = '';
    orderConfirmation.classList.add('hidden');
    orderConfirmation.style.display = 'none';
  }, 0);
});

// 초기 실행: 처음 페이지 진입 시 주문 내역 빈 상태 안내 및 배지 0 설정
renderOrders();
