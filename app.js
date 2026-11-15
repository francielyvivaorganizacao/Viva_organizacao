const modules = [
  {id:"inicio",name:"Início",icon:"⌂",desc:"Visão geral",color:"#eeeaff",tone:"#7969c0"},
  {id:"agenda",name:"Agenda e rotina",icon:"▦",desc:"Compromissos e tarefas",color:"#eaf1ff",tone:"#4778c7"},
  {id:"pessoal",name:"Finanças pessoais",icon:"◈",desc:"Contas e orçamento",color:"#eaf6f0",tone:"#4b9a79"},
  {id:"escritorio",name:"Financeiro do escritório",icon:"▤",desc:"Receitas e despesas",color:"#fff2e8",tone:"#c47b4d"},
  {id:"clientes",name:"Clientes e arquivos",icon:"♧",desc:"Cadastros e documentos",color:"#f0edff",tone:"#7969c0"},
  {id:"fiscal",name:"Agenda fiscal",icon:"▣",desc:"Obrigações e prazos",color:"#eaf1ff",tone:"#4778c7"},
  {id:"estudos",name:"Estudos e leitura",icon:"⌑",desc:"Aprendizado e livros",color:"#fff5e4",tone:"#b18431"},
  {id:"casa",name:"Casa e família",icon:"⌂",desc:"Organização doméstica",color:"#eaf6f0",tone:"#4b9a79"},
  {id:"metas",name:"Metas e planejamento",icon:"◎",desc:"Objetivos e progresso",color:"#fff0f1",tone:"#c87583"},
  {id:"notas",name:"Anotações",icon:"✎",desc:"Ideias e registros",color:"#f0f2f6",tone:"#78839a"}
];
const $ = s => document.querySelector(s);
let current = "inicio";
let demoTasks = [
  {text:"Organizar as prioridades da semana",category:"Pessoal",done:false},
  {text:"Conferir documentos pendentes dos clientes",category:"Escritório",done:false},
  {text:"Dedicar um tempo aos estudos",category:"Estudos",done:true},
  {text:"Planejar as refeições da semana",category:"Casa",done:false}
];
const nav = $("#navigation");
modules.forEach(m=>{
  const b=document.createElement("button"); b.className="nav-item"; b.dataset.id=m.id;
  b.innerHTML=`<span class="nav-icon">${m.icon}</span><span>${m.name}</span>`;
  b.onclick=()=>showModule(m.id); nav.appendChild(b);
});
function today(){return new Intl.DateTimeFormat("pt-BR",{weekday:"long",day:"numeric",month:"long"}).format(new Date())}
$("#todayLabel").textContent=today();
function showModule(id){
  current=id; const m=modules.find(x=>x.id===id);
  $("#breadcrumbCurrent").textContent=m.name; $("#pageEyebrow").textContent=id==="inicio"?"SEU PAINEL":"SEU ESPAÇO";
  $("#pageTitle").textContent=id==="inicio"?"Bom dia! Vamos organizar sua vida?":m.name;
  $("#pageSubtitle").textContent=id==="inicio"?"Tudo o que importa, em um só lugar.":m.desc+" — estrutura inicial do seu VIVA.";
  document.querySelectorAll(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.id===id));
  $("#sidebar").classList.remove("open"); $("#overlay").classList.remove("show");
  render();
}
function taskMarkup(){
 return demoTasks.map((t,i)=>`<label class="task ${t.done?"done":""}"><input type="checkbox" data-task="${i}" ${t.done?"checked":""}><span>${escapeHtml(t.text)}</span><em class="tag ${t.category==="Estudos"?"gold":t.category==="Casa"?"green":t.category==="Escritório"?"":"lilac"}">${t.category}</em></label>`).join("");
}
function dashboard(){
 return `<div class="stats">
  ${stat("Tarefas abertas",demoTasks.filter(t=>!t.done).length,"Hoje","▦","#eaf1ff","#4778c7")}
  ${stat("Clientes ativos","—","Módulo em preparação","♧","#f0edff","#7969c0")}
  ${stat("A receber","—","Financeiro do escritório","R$","#eaf6f0","#4b9a79")}
  ${stat("Metas em andamento","—","Planejamento","◎","#fff0f1","#c87583")}
 </div>
 <div class="layout-two">
  <section class="panel"><div class="panel-heading"><h2>Minha lista de tarefas</h2><small>DEMONSTRAÇÃO</small></div>
   <div class="task-list" id="taskList">${taskMarkup()}</div>
   <form class="form-row" id="taskForm"><input class="field" id="taskInput" placeholder="Adicionar uma tarefa..." required><button class="primary-btn">Adicionar</button></form>
  </section>
  <section class="panel"><div class="panel-heading"><h2>Foco da semana</h2><small>EXEMPLO</small></div>
   <div class="progress-row"><span>Organização pessoal</span><strong>60%</strong></div><div class="progress"><span style="width:60%"></span></div>
   <div class="progress-row"><span>Rotina profissional</span><strong>45%</strong></div><div class="progress"><span style="width:45%"></span></div>
   <div class="progress-row"><span>Estudos</span><strong>35%</strong></div><div class="progress"><span style="width:35%"></span></div>
   <div class="notice" style="margin-top:18px">Os indicadores são ilustrativos. Os módulos serão conectados ao banco de dados na etapa de implementação.</div>
  </section>
 </div>
 <h2 class="section-title">Acesso rápido aos módulos</h2><div class="quick-grid">${modules.filter(m=>m.id!=="inicio").map(card).join("")}</div>`;
}
function stat(label,value,note,icon,bg,color){return `<div class="stat"><div class="stat-top"><span>${label}</span><span class="stat-icon" style="background:${bg};color:${color}">${icon}</span></div><div class="stat-value">${value}</div><div class="stat-note">${note}</div></div>`}
function card(m){return `<button class="module-card" data-open="${m.id}"><span class="m-icon" style="background:${m.color};color:${m.tone}">${m.icon}</span><strong>${m.name}</strong><small>${m.desc}</small></button>`}
function modulePage(m){
 const notice=`<div class="notice">Esta área está na estrutura inicial. Os recursos, cadastros e relatórios serão implementados por etapas. Não insira informações reais ou confidenciais nesta demonstração.</div>`;
 const detail={
 agenda:"Calendário semanal, tarefas com ou sem horário, recorrências e categorias por cor.",
 pessoal:"Receitas, despesas, contas, cartões, orçamento mensal e metas de reserva.",
 escritorio:"Honorários, recebimentos, despesas, fluxo de caixa e resultado mensal.",
 clientes:"Ficha cadastral, regime tributário, serviços contratados, honorários e arquivo digital.",
 fiscal:"Obrigações fiscais, trabalhistas e anuais, prazos, responsáveis e status.",
 estudos:"Concursos, questões, inglês, cursos, livros e acompanhamento de evolução.",
 casa:"Rotina doméstica, compras, refeições, compromissos e organização familiar.",
 metas:"Objetivos pessoais e profissionais, etapas, prazos e progresso.",
 notas:"Anotações rápidas, ideias, registros e listas."
 }[m.id];
 return `${notice}<div class="panel"><div class="module-header"><span class="m-icon" style="background:${m.color};color:${m.tone}">${m.icon}</span><div><h2>${m.name}</h2><p>${m.desc}</p></div></div><p style="font-size:13px;line-height:1.7;color:#65718a">${detail}</p><div class="empty-note">Área preparada para receber as funcionalidades deste módulo.</div></div>`;
}
function render(){
 const m=modules.find(x=>x.id===current);
 $("#pageContent").innerHTML=current==="inicio"?dashboard():modulePage(m);
 document.querySelectorAll("[data-open]").forEach(b=>b.addEventListener("click",()=>showModule(b.dataset.open)));
 document.querySelectorAll("[data-task]").forEach(c=>c.addEventListener("change",()=>{demoTasks[Number(c.dataset.task)].done=c.checked;render()}));
 const form=$("#taskForm"); if(form)form.addEventListener("submit",e=>{e.preventDefault();const input=$("#taskInput");if(input.value.trim()){demoTasks.push({text:input.value.trim(),category:"Pessoal",done:false});render()}});
}
function escapeHtml(s){return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
$("#menuToggle").onclick=()=>{$("#sidebar").classList.toggle("open");$("#overlay").classList.toggle("show")};
$("#overlay").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("show")};
showModule("inicio");
