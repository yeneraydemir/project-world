// City-centre endpoints. Road geometry comes from OSRM; no GPS is inferred.
export const CITIES={
 İstanbul:[28.9784,41.0082],Ankara:[32.8597,39.9334],İzmir:[27.1428,38.4237],Bursa:[29.061,40.195],Antalya:[30.713,36.897],Adana:[35.321,37.0],Konya:[32.493,37.875],Eskişehir:[30.52,39.777],Kocaeli:[29.94,40.765],Sakarya:[30.403,40.773],Bolu:[31.606,40.735],Düzce:[31.163,40.838],Samsun:[36.336,41.286],Trabzon:[39.72,41.0],Gaziantep:[37.382,37.066],Kayseri:[35.483,38.72],Mersin:[34.633,36.8],Denizli:[29.087,37.776],Balıkesir:[27.89,39.649],Manisa:[27.428,38.62],Aydın:[27.845,37.845],Muğla:[28.366,37.216],Tekirdağ:[27.511,40.978],Edirne:[26.555,41.677],Çanakkale:[26.414,40.146],Kırklareli:[27.225,41.735],Yalova:[29.277,40.655],Bilecik:[29.979,40.143],Kütahya:[29.983,39.419],Afyonkarahisar:[30.539,38.756],Uşak:[29.405,38.682],Isparta:[30.554,37.765],Burdur:[30.29,37.721],Karaman:[33.215,37.181],Aksaray:[34.025,38.368],Nevşehir:[34.714,38.624],Niğde:[34.679,37.969],Kırşehir:[34.16,39.146],Kırıkkale:[33.508,39.846],Yozgat:[34.808,39.82],Çankırı:[33.616,40.602],Karabük:[32.626,41.196],Bartın:[32.337,41.634],Zonguldak:[31.793,41.456],Kastamonu:[33.776,41.377],Sinop:[35.153,42.026],Çorum:[34.956,40.55],Amasya:[35.833,40.65],Tokat:[36.554,40.316],Ordu:[37.879,40.986],Giresun:[38.389,40.912],Rize:[40.521,41.025],Artvin:[41.819,41.182],Ardahan:[42.702,41.11],Kars:[43.097,40.601],Iğdır:[44.045,39.923],Ağrı:[43.05,39.719],Erzurum:[41.276,39.905],Erzincan:[39.49,39.75],Bayburt:[40.228,40.256],Gümüşhane:[39.481,40.46],Sivas:[37.015,39.748],Malatya:[38.309,38.355],Elazığ:[39.222,38.681],Tunceli:[39.548,39.108],Bingöl:[40.498,38.885],Muş:[41.506,38.744],Bitlis:[42.109,38.401],Van:[43.38,38.502],Hakkari:[43.743,37.574],Şırnak:[42.458,37.519],Siirt:[41.942,37.934],Batman:[41.132,37.881],Diyarbakır:[40.23,37.914],Mardin:[40.735,37.313],Şanlıurfa:[38.795,37.168],Adıyaman:[38.277,37.764],Kahramanmaraş:[36.937,37.575],Osmaniye:[36.248,37.074],Hatay:[36.158,36.202],Kilis:[37.116,36.718]
};
export function instant(value){
 if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value))throw Error('Kalkış ve varış için tarih ve saat gir.');
 const t=Date.parse(value+':00+03:00');
 if(!Number.isFinite(t)||new Date(t+10800000).toISOString().slice(0,16)!==value)throw Error('Geçersiz tarih / saat.');
 return t;
}
export function normalizeTrip(t){
 if(!t)return null;
 if(!CITIES[t.from]||!CITIES[t.to]||t.from===t.to)throw Error('İki farklı Türkiye şehri seç.');
 if(instant(t.arrival)<=instant(t.departure))throw Error('Varış zamanı kalkıştan sonra olmalı.');
 const coordinates=t.coordinates;
 if(!Array.isArray(coordinates)||coordinates.length<2||coordinates.length>15000||coordinates.some(c=>!Array.isArray(c)||c.length!==2||!c.every(Number.isFinite)||c[0]<25||c[0]>46||c[1]<35||c[1]>43))throw Error('Geçerli Türkiye yol rotası gerekli.');
 for(const [city,pt] of [[t.from,coordinates[0]],[t.to,coordinates.at(-1)]]){
  if(Math.hypot(pt[0]-CITIES[city][0],pt[1]-CITIES[city][1])>.3)throw Error('Rota uçları şehirlerle eşleşmiyor.');
 }
 return {from:t.from,to:t.to,departure:t.departure,arrival:t.arrival,coordinates:coordinates.map(c=>[...c]),distance:Number(t.distance)||0,provider:'OSRM'};
}
export function position(trip,now=Date.now()){
 const a=instant(trip.departure),b=instant(trip.arrival),f=Math.max(0,Math.min(1,(now-a)/(b-a)));
 const pts=trip.coordinates,lengths=[0];
 for(let i=1;i<pts.length;i++)lengths.push(lengths.at(-1)+Math.hypot((pts[i][0]-pts[i-1][0])*Math.cos(pts[i][1]*Math.PI/180),pts[i][1]-pts[i-1][1]));
 const target=f*lengths.at(-1);let i=1;while(i<pts.length-1&&lengths[i]<target)i++;
 const ratio=lengths[i]===lengths[i-1]?0:(target-lengths[i-1])/(lengths[i]-lengths[i-1]);
 return {f,point:pts[i-1].map((v,k)=>v+(pts[i][k]-v)*ratio),state:now<a?'Kalkış bekleniyor':now>=b?'Planlanan varış saatine ulaştı':'Planlanan yolculuk sürüyor'};
}
export async function roadRoute(from,to){
 if(!CITIES[from]||!CITIES[to]||from===to)throw Error('İki farklı şehir seç.');
 const coordinates=CITIES[from].join(',')+';'+CITIES[to].join(',');
 const r=await fetch('https://router.project-osrm.org/route/v1/driving/'+coordinates+'?overview=simplified&geometries=geojson&steps=false',{signal:AbortSignal.timeout(20000)});
 if(!r.ok)throw Error('Yol rotası servisi yanıt vermedi.');
 const data=await r.json(),route=data.routes?.[0];
 if(data.code!=='Ok'||!route)throw Error('Bu şehirler arasında yol rotası bulunamadı.');
 return {coordinates:route.geometry.coordinates,distance:route.distance,duration:route.duration};
}
export const localNow=(t=Date.now())=>new Date(t+10800000).toISOString().slice(0,16);

export function vehiclePose(trip,now=Date.now()){
 const current=position(trip,now),a=position(trip,now-5000).point,b=position(trip,now+5000).point;
 const dx=(b[0]-a[0])*Math.cos(current.point[1]*Math.PI/180),dy=-(b[1]-a[1]);
 return {...current,angle:dx||dy?Math.atan2(dy,dx)*180/Math.PI:0};
}
