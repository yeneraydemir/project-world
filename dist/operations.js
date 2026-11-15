// Operational records are separate from the accelerated 3D planning clock.
export const TYPES={stage:'Yapım aşaması',maintenance:'Bakım / arıza',delivery:'Malzeme teslimatı'};
export const STAGES={foundation:'Temel',structure:'Kaba inşaat',roof:'Çatı',facade:'Cephe',systems:'Tesisat',pool:'Havuz',landscape:'Peyzaj',other:'Diğer'};
export const STATES={todo:'Açık',doing:'Devam ediyor',done:'Tamamlandı'};
export const PRIORITIES={normal:'Normal',urgent:'Öncelikli'};
export function today(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Istanbul',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=k=>parts.find(p=>p.type===k).value;
 return get('year')+'-'+get('month')+'-'+get('day');
}
export function dueState(record,day){
 if(record.status==='done'||record.status==='delivered')return 'done';
 if(!record.due)return 'open';
 if(record.due<day)return 'late';
 if(record.due===day)return 'today';
 return 'upcoming';
}
export function daily(projects,day){
 const items=projects.flatMap(p=>['operations','tasks','jobs'].flatMap(col=>p[col].map(r=>({p,r,col,state:dueState(r,day)})))).filter(o=>o.state!=='done');
 const rank={late:0,today:1,upcoming:2,open:3};
 return items.sort((a,b)=>rank[a.state]-rank[b.state]||Number(b.r.priority==='urgent')-Number(a.r.priority==='urgent')||(a.r.due||'').localeCompare(b.r.due||''));
}
export function plannedStage(record,day){
 if(day>=record.due)return 100;
 if(day<=record.start)return 0;
 return Math.round(100*(Date.parse(day)-Date.parse(record.start))/(Date.parse(record.due)-Date.parse(record.start)));
}
