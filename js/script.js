document.documentElement.classList.add('js');
function initPage(){
try{
// ترويسة تتغير مع التمرير
const header = document.getElementById('header');
if(header){
  addEventListener('scroll', () => {
    header.classList.toggle('scrolled', scrollY > 20);
  }, {passive:true});
}

// لوحة القائمة على الجوال
const menuBtn = document.getElementById('menuBtn');
const navPanel = document.getElementById('navPanel');
if(menuBtn && navPanel){
  const setMenu = open => {
    navPanel.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    // تجميد تمرير الصفحة خلف اللوحة
    document.documentElement.classList.toggle('menu-open', open);
  };
  menuBtn.addEventListener('click', () =>
    setMenu(!navPanel.classList.contains('open'))
  );
  // أي رابط داخل اللوحة يقفلها (الروابط الداخلية بنفس الصفحة تحتاج ذلك)
  navPanel.querySelectorAll('a').forEach(a =>
    a.addEventListener('click', () => setMenu(false))
  );
  addEventListener('keydown', e => {
    if(e.key === 'Escape' && navPanel.classList.contains('open')){
      setMenu(false);
      menuBtn.focus();
    }
  });
  // لو كبّر المستخدم النافذة واللوحة مفتوحة نقفلها حتى لا يبقى التمرير مجمّدًا
  matchMedia('(min-width:1024px)').addEventListener('change', e => {
    if(e.matches) setMenu(false);
  });
}

// الظهور عند التمرير
const io = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  });
}, {threshold:.15});
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
// شبكة أمان: أي عنصر ما ظهر خلال ثانيتين نظهره فورًا
setTimeout(() => {
  document.querySelectorAll('.reveal:not(.in)').forEach(el => el.classList.add('in'));
}, 2000);

// خط مراحل العمل (صفحة "كيف نعمل" فقط)
const proc = document.getElementById('procGrid');
if(proc){
  const ioProc = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting){ proc.classList.add('on'); ioProc.unobserve(proc); }
    });
  }, {threshold:.3});
  ioProc.observe(proc);
}

// نبضة ضوء متحركة على خطوط السكاي لاين بالهيرو (الصفحة الرئيسية فقط)
const skyline = document.querySelector('.skyline-card svg');
if(skyline && matchMedia('(prefers-reduced-motion: no-preference)').matches){
  const group = skyline.querySelector('g');
  const flowLines = skyline.querySelectorAll('.sk-flow');
  flowLines.forEach((path, i) => {
    const len = path.getTotalLength();
    if(!len) return;
    const dash = Math.min(22, len * 0.6);
    const pulse = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pulse.setAttribute('d', path.getAttribute('d'));
    pulse.setAttribute('class', 'sk-pulse');
    pulse.style.strokeDasharray = dash + ' ' + len;
    group.appendChild(pulse);
    pulse.animate(
      [{ strokeDashoffset: 0 }, { strokeDashoffset: -(len + dash) }],
      { duration: 2200 + len * 7, iterations: Infinity, easing: 'linear', delay: 2400 + i * 220 }
    );
  });
}

// شريط الشركاء — نكرر الصف هنا حتى يبقى في HTML صف واحد فقط للتحرير.
// بدون هذا (أو عند تعطيل الحركة) يبقى الشريط شبكة ثابتة متمركزة.
const marquee = document.querySelector('.marquee');
if(marquee && matchMedia('(prefers-reduced-motion: no-preference)').matches){
  const buildMarquee = () => {
    try{
      const track = marquee.querySelector('.marquee-track');
      const row = track && track.firstElementChild;
      if(!row) return;
      // نقيس والشريط في هيئته النهائية (بلا التفاف): على الشاشات الضيقة يلتفّ الصف
      // في الحالة الأساسية فيُقاس عرضًا مقصوصًا وتخرج سرعة مختلفة لكل مقاس.
      // الإضافة والإزالة متزامنتان فلا يُرسم إطار بينهما.
      marquee.classList.add('is-ready');
      const rowW = row.getBoundingClientRect().width;
      marquee.classList.remove('is-ready');
      if(!rowW) return;
      // لا بد أن تغطي النسخ (ما عدا واحدة) عرض الشريط، وإلا ظهر فراغ عند نهاية الدورة.
      // نحسب على أوسع احتمال حتى لا يفسد عند تكبير النافذة أو تدوير الجوال.
      const need = Math.max(marquee.getBoundingClientRect().width, screen.width || 0, 1920);
      const copies = Math.max(2, Math.ceil(need / rowW) + 1);
      for(let i = 1; i < copies; i++){
        const copy = row.cloneNode(true);
        copy.setAttribute('aria-hidden','true');
        copy.removeAttribute('aria-label');
        track.appendChild(copy);
      }
      // مسافة الحركة = عرض صف واحد، والمدة تُشتق منه فتبقى السرعة ثابتة (~58px/ث)
      track.style.setProperty('--shift', (100 / copies) + '%');
      track.style.animationDuration = (rowW / 58).toFixed(2) + 's';
      marquee.classList.add('is-ready');
    }catch(e){ /* الشريط يبقى شبكة ثابتة — لا شيء ينكسر */ }
  };
  // لا نقيس قبل اكتمال الشعارات: القياس الناقص يعطي سرعة عشوائية تختلف كل تحميل
  const pending = [...marquee.querySelectorAll('img')].filter(img => !img.complete);
  if(pending.length){
    let left = pending.length;
    const tick = () => { if(--left === 0) buildMarquee(); };
    pending.forEach(img => {
      img.addEventListener('load', tick, {once:true});
      img.addEventListener('error', tick, {once:true});
    });
  }else{
    buildMarquee();
  }
}

// أكورديون الخدمات (صفحة "خدماتنا" فقط)
const acc = document.querySelector('.acc');
if(acc){
  const items = [...acc.querySelectorAll('.acc-item')];
  acc.addEventListener('click', e => {
    const btn = e.target.closest('.acc-btn');
    if(!btn) return;
    const item = btn.closest('.acc-item');
    const willOpen = !item.classList.contains('is-open');
    items.forEach(i => {
      i.classList.remove('is-open');
      i.querySelector('.acc-btn').setAttribute('aria-expanded','false');
    });
    if(willOpen){
      item.classList.add('is-open');
      btn.setAttribute('aria-expanded','true');
    }
  });
}

// النموذج (صفحة "تواصل معنا" فقط) — يفتح واتساب المستشار برسالة جاهزة ببيانات العميل
const submitBtn = document.getElementById('submitBtn');
if(submitBtn){
  submitBtn.addEventListener('click', () => {
    const name  = document.getElementById('fName').value.trim();
    const phone = document.getElementById('fPhone').value.trim();
    const type  = document.getElementById('fType').value;
    const msg   = document.getElementById('fMsg').value.trim();
    if(!name || !phone){
      [['fName',name],['fPhone',phone]].forEach(([id,val])=>{
        const el = document.getElementById(id);
        el.style.borderColor = val ? '' : '#1E228C';
        if(!val) el.focus();
      });
      return;
    }
    // wa.me لا يقبل إلا أرقامًا لاتينية، والحقل قد يستقبل أرقامًا عربية أو مسافات
    const digits = s => s.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d)).replace(/\D/g,'');
    const wa = digits(submitBtn.dataset.wa || '');
    const lines = [
      'طلب تقييم تشغيلي — موقع إتحادات',
      '',
      'الاسم: ' + name,
      'الجوال: ' + phone,
      'نوع العقار: ' + type
    ];
    if(msg) lines.push('التفاصيل: ' + msg);
    const url = 'https://wa.me/' + wa + '?text=' + encodeURIComponent(lines.join('\n'));

    // الرابط الاحتياطي يُملأ قبل الفتح حتى يبقى مفيدًا لو منع المتصفح النافذة
    const waLink = document.getElementById('waLink');
    if(waLink) waLink.href = url;
    window.open(url, '_blank', 'noopener');

    document.getElementById('formWrap').style.display = 'none';
    document.getElementById('formSuccess').classList.add('show');
  });
}
}catch(err){
  // أي خطأ غير متوقع: نظهر كل المحتوى فورًا بدل صفحة فارغة
  document.documentElement.classList.remove('js');
}
}
if(document.readyState === 'loading'){
  document.addEventListener('DOMContentLoaded', initPage);
}else{
  initPage();
}
