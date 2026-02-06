function slug(){
  return new URLSearchParams(location.search).get("p") || "pequenos-gigantes";
}

const el = (id)=>document.getElementById(id);

fetch(`/products/${slug()}.json`)
.then(r=>r.json())
.then(data=>{

  el("docTitle").textContent = data.title || "Landing";

  el("title").textContent = data.title || "";
  el("subtitle").textContent = data.subtitle || "";

  // =========================
  // OFERTA (editable desde JSON) — con precio gigante
  // =========================
  const offerEl = el("todayOffer");
  if (offerEl && data.todayOffer && (data.todayOffer.price || data.todayOffer.headline)) {

    const price = (data.todayOffer.price ?? "").toString().trim();      // "10"
    const currency = (data.todayOffer.currency || "USD").toString().trim();
    const note = (data.todayOffer.note || "solo por hoy").toString().trim();
    const headline = (data.todayOffer.headline || "Oferta").toString().trim();
    const context = (data.todayOffer.context || "").toString().trim();

    offerEl.style.display = "flex";

    // 🔥 IMPORTANTE: el precio va en .offerPrice para que el CSS lo haga gigante
    offerEl.innerHTML = `
      <div class="offerIcon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M20 13.5L13.5 20c-.6.6-1.4 1-2.2 1H6a2 2 0 0 1-2-2v-5.3c0-.8.3-1.6 1-2.2L11.5 5H18a2 2 0 0 1 2 2v6.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
          <path d="M15.2 9.2h.01" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
        </svg>
      </div>

      <div class="offerText">
        <p class="offerKicker">${escapeHtml(headline)}</p>

        <h3 class="offerHeadline">
          Oferta
          <span class="offerPrice">${escapeHtml(price)} ${escapeHtml(currency)}</span>
          ${escapeHtml(note)}
        </h3>

        ${context ? `<p class="offerContext">${escapeHtml(context)}</p>` : ``}
      </div>

      <div class="offerPill">✅ Acceso inmediato</div>
    `;
  } else if (offerEl) {
    offerEl.style.display = "none";
  }

  // Beneficios (título + items)
  renderBenefits(data);

  // Video
  el("video").src = data.video || "";

  // Descripción secundaria
  el("text2").textContent = data.text2 || "";

  // Garantía
  el("guaranteeText").textContent = data.guarantee || "";

  // Botones de compra (3 posiciones)
  ["buyBtnTop","buyBtnMid","buyBtnBottom"].forEach(id=>{
    const b = el(id);
    if(!b) return;
    b.href = data.buyLink || "#";
    b.target = "_blank";
    b.rel = "noopener";
    b.addEventListener("click", trackPurchase);
  });

  // Galería (3 imágenes horizontales)
  const gallery = el("gallery");
  gallery.innerHTML = "";
  (data.images||[]).forEach(src=>{
    const d=document.createElement("div");
    d.className="imgCard";
    d.innerHTML=`<img src="${src}" alt="">`;
    gallery.appendChild(d);
  });

  // Bonus (2 fotos verticales)
  renderBonuses(data);

  // FAQ
  buildFAQ(data.faq || []);

  // Contador 10 minutos (por visita)
  startTenMinuteCountdown((data.timerMinutes || 10) * 60);

  // WhatsApp burbuja
  const wa = el("whatsappBubble");
  if(wa){
    if(data.whatsappLink){
      wa.href = data.whatsappLink;
      wa.setAttribute("aria-label", "Abrir WhatsApp");

      wa.innerHTML = "<svg viewBox=\"0 0 32 32\" aria-hidden=\"true\"><path d=\"M19.11 17.49c-.27-.14-1.59-.79-1.84-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-.27-.14-1.14-.42-2.18-1.34-.81-.72-1.35-1.61-1.51-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.32.41-.48.14-.16.18-.27.27-.45.09-.18.05-.34-.02-.48-.07-.14-.61-1.47-.84-2.02-.22-.53-.44-.46-.61-.47l-.52-.01c-.18 0-.48.07-.73.34-.25.27-.95.93-.95 2.27s.97 2.63 1.1 2.81c.14.18 1.9 2.9 4.61 4.07.65.28 1.16.45 1.56.57.65.21 1.25.18 1.72.11.53-.08 1.59-.65 1.82-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32zM16.02 27.5h-.01c-1.93 0-3.82-.52-5.47-1.49l-.39-.23-4.05 1.06 1.08-3.95-.26-.41a11.46 11.46 0 0 1-1.75-6.09c0-6.35 5.18-11.52 11.55-11.52 3.08 0 5.97 1.2 8.15 3.38a11.44 11.44 0 0 1 3.39 8.13c0 6.35-5.18 11.52-11.54 11.52zm9.82-21.36A13.82 13.82 0 0 0 16.03 2.5C8.35 2.5 2.1 8.74 2.1 16.42c0 2.53.67 5 1.95 7.17L2 31.5l8.1-2.12a13.9 13.9 0 0 0 5.93 1.33h.01c7.67 0 13.92-6.24 13.92-13.92 0-3.71-1.45-7.2-4.12-9.65z\"/></svg>";
    } else {
      wa.style.display = "none";
    }
  }
});

function trackPurchase(){
  try{ if(window.fbq){ fbq('track', 'Purchase'); } }catch(e){}
  try{ if(window.ttq){ ttq.track('CompletePayment'); } }catch(e){}
  // gtag conversion is optional; if you have a conversion event, add it here
}

function renderBenefits(data){
  const box = el("benefits");
  if(!box) return;

  if(data.benefitsTitle && Array.isArray(data.benefits)){
    box.innerHTML = `
      <h2>${escapeHtml(data.benefitsTitle)}</h2>
      ${data.benefitsLead ? `<p class="lead">${escapeHtml(data.benefitsLead)}</p>` : ""}
      ${data.benefits.map(item=>{
        const bullets = Array.isArray(item.bullets) && item.bullets.length
          ? `<ul class="benefitBullets">${item.bullets.map(li=>`<li>${escapeHtml(li)}</li>`).join("")}</ul>`
          : "";
        const desc = item.desc ? `<p>${escapeHtml(item.desc)}</p>` : "";
        return `
          <div class="benefitItem">
            ${item.title ? `<h3>${escapeHtml(item.title)}</h3>` : ""}
            ${desc}
            ${bullets}
          </div>
        `;
      }).join("")}
    `;
    return;
  }

  box.innerHTML = `<h2>¿Qué incluye?</h2><p class="lead">${escapeHtml(data.text1 || "")}</p>`;
}

function renderBonuses(data){
  const wrap = el("bonusWrap");
  if(!wrap) return;

  const list = Array.isArray(data.bonusImages) ? data.bonusImages : [];
  if(!list.length){
    wrap.innerHTML = "";
    return;
  }

  wrap.innerHTML = list.map((b, idx)=>{
    const label = b.label || `Bonus ${(idx+1).toString().padStart(2,'0')}`;
    const src = b.src || "";
    return `
      <div class="bonusItem">
        <div class="bonusHeading">${escapeHtml(label)}</div>
        <div class="bonusCard">
          <img src="${src}" alt="${escapeHtml(label)}">
        </div>
      </div>
    `;
  }).join("");
}

function startTenMinuteCountdown(totalSeconds){
  const mm = el("mm");
  const ss = el("ss");
  if(!mm || !ss) return;

  let remaining = Math.max(0, Math.floor(totalSeconds));

  const tick = ()=>{
    const m = Math.floor(remaining / 60);
    const s = remaining % 60;

    mm.textContent = String(m).padStart(2,"0");
    ss.textContent = String(s).padStart(2,"0");

    if(remaining <= 0){
      clearInterval(timer);
      return;
    }
    remaining -= 1;
  };

  tick();
  const timer = setInterval(tick, 1000);
}

function buildFAQ(list){
  const faqList = el("faqList");
  faqList.innerHTML = "";
  list.forEach(item=>{
    const box=document.createElement("div");
    box.className="faqItem";
    box.innerHTML=`
      <div class="faqQ">${escapeHtml(item.q)}</div>
      <div class="faqA">${escapeHtml(item.a)}</div>`;
    box.querySelector(".faqQ").onclick=()=>box.classList.toggle("open");
    faqList.appendChild(box);
  });
}

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
