// Family Trips v3.1 — Firebase Authentication / Firestore / Storage
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,onSnapshot,serverTimestamp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js';
import {getStorage,ref,uploadString,uploadBytes,getDownloadURL} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-storage.js';
const config={apiKey:'AIzaSyB1A7Znwf9-I_7H89AXwsPeINn5VhmThpc',authDomain:'family-trips-6f940.firebaseapp.com',projectId:'family-trips-6f940',storageBucket:'family-trips-6f940.firebasestorage.app',messagingSenderId:'400857202870',appId:'1:400857202870:web:26511f27483fe9d230a617'};
const app=initializeApp(config),auth=getAuth(app),db=getFirestore(app),storage=getStorage(app);
const el=id=>document.getElementById(id), OWNER='kNg13uQp72bBQFDhZeqUZmnT0dp2';
let enabled=false,working=false,pending=false,unsub=null,lastSerialized='',user=null,debounce=null;
const cloudRef=doc(db,'familyTrips','main'), familyRef=doc(db,'familyTrips','familySettings');
let familyMembers=[];window.familyTripsFamily=[];
function panel(){el('authPanel').classList.remove('hidden')}
function message(t){el('authMessage').textContent=t}
function status(t){el('cloudStatus').textContent=t}
function safeTrips(){return window.familyTripsGet?.()||[]}
function restore(list){window.familyTripsSet?.(list)}
// The main page is a classic script: expose a narrow bridge instead of modifying its lexical state.
function update(u){user=u;el('authIdentity').classList.toggle('hidden',!u);el('loginBtn').textContent=u?'👤':'♙';el('loginBtn').title=u?'アカウント設定':'Googleログイン';if(u){el('authEmail').textContent=u.email||'';el('authUid').textContent=u.uid;message('ログイン成功。クラウド同期の状態を確認してください。')}else{message('ログインしていません。Googleログインしてください。');status('ログインするとクラウドを利用できます。')}}
function familyStatus(t){el('familyStatus').textContent=t}
function renderFamily(){el('familyRows').innerHTML=familyMembers.map((m,i)=>`<div class="row" style="padding:12px 0;border-bottom:1px solid #e8e5dd;align-items:end"><label class="field" style="flex:1;min-width:120px">名前<input data-family-name="${i}" maxlength="30" value="${escapeAttr(m.name||'')}" placeholder="名前"></label><label class="field" style="flex:1;min-width:150px">誕生日<input data-family-birth="${i}" type="date" value="${escapeAttr(m.birth||'')}"></label><button class="btn" type="button" data-family-remove="${i}">削除</button></div>`).join('');el('familyRows').querySelectorAll('[data-family-remove]').forEach(b=>b.onclick=()=>{collectFamily();familyMembers.splice(Number(b.dataset.familyRemove),1);renderFamily()})}
function escapeAttr(v){return String(v).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;')}
function collectFamily(){familyMembers=familyMembers.map((m,i)=>({name:el('familyRows').querySelector(`[data-family-name="${i}"]`)?.value.trim()||'',birth:el('familyRows').querySelector(`[data-family-birth="${i}"]`)?.value||''}))}
el('familyBtn').onclick=()=>{renderFamily();el('familyEditor').style.display='block'};
el('familyClose').onclick=()=>el('familyEditor').style.display='none';
el('familyAdd').onclick=()=>{collectFamily();familyMembers.push({name:'',birth:''});renderFamily()};
el('familySave').onclick=async()=>{if(!user||user.uid!==OWNER){familyStatus('本人のGoogleアカウントでログインしてください');return}collectFamily();if(familyMembers.some(m=>!m.name||!/^\d{4}-\d{2}-\d{2}$/.test(m.birth))){familyStatus('全員の名前と誕生日を入力してください');return}try{familyStatus('☁ 保存中…');await setDoc(familyRef,{members:familyMembers,updatedAt:serverTimestamp()});window.familyTripsFamily=familyMembers.map(m=>({...m}));familyStatus('☁ 家族設定を保存しました');const selected=window.familyTripsSelected?.();if(selected)window.familyTripsRefresh?.(selected)}catch(e){familyStatus('保存失敗：'+(e.code||e.message))}};
async function loadFamily(){try{const snap=await getDoc(familyRef);familyMembers=(snap.exists()?snap.data().members:[])||[];window.familyTripsFamily=familyMembers.map(m=>({...m}));renderFamily();familyStatus('☁ 家族設定を読み込みました')}catch(e){familyStatus('家族設定の読込失敗：'+(e.code||e.message))}}
async function prepare(){if(unsub){unsub();unsub=null}enabled=false;window.familyCloudSave=null;el('cloudMigrate').style.display='none';el('cloudReload').style.display='none';if(!user){familyMembers=[];window.familyTripsFamily=[];return}if(user.uid!==OWNER){status('このアカウントにはまだアクセス権がありません。');return}try{await loadFamily();const snap=await getDoc(cloudRef);if(!snap.exists()){status('クラウドは空です。初回移行で、この端末の旅程と写真を送信できます。');el('cloudMigrate').style.display='inline-block';return}const remote=snap.data().trips||[];const local=safeTrips();if(!local.length){restore(remote);lastSerialized=JSON.stringify(remote);enable();status('☁ クラウド'+remote.length+'件を自動取得・同期有効');el('cloudReload').style.display='inline-block';return}status(`クラウドに${remote.length}件あります。端末内${local.length}件。同期を開始するにはクラウドを読み込んでください。`);el('cloudReload').style.display='inline-block';}catch(e){status('接続確認失敗：'+(e.code||e.message))}}
async function cloudSave(){if(!enabled||!user||user.uid!==OWNER)return;if(working){pending=true;return}working=true;try{status('☁ 保存中…');const source=safeTrips();const cloud=[];for(const t of source){let item={...t};if(typeof item.cover==='string'&&item.cover.startsWith('data:image/')){const path='covers/'+encodeURIComponent(String(item.id))+'/'+Date.now();const obj=ref(storage,path);await uploadString(obj,item.cover,'data_url');item.cover=await getDownloadURL(obj);item.coverStoragePath=path;}cloud.push(item)}await setDoc(cloudRef,{trips:cloud,updatedAt:serverTimestamp(),schema:1});lastSerialized=JSON.stringify(cloud); // replace local data URLs only after cloud upload succeeds
if(source.length===safeTrips().length){const latest=safeTrips();for(let i=0;i<latest.length;i++){if(latest[i].id===cloud[i].id&&latest[i].cover?.startsWith('data:image/')&&cloud[i].coverStoragePath){latest[i].cover=cloud[i].cover;latest[i].coverStoragePath=cloud[i].coverStoragePath}}window.familyTripsSet?.(latest)}status('☁ 保存済み · '+new Date().toLocaleTimeString('ja-JP'));}catch(e){status('⚠ 保存失敗（端末には残っています）：'+(e.code||e.message));}finally{working=false;if(pending){pending=false;cloudSave()}}}
function schedule(){if(!enabled)return;clearTimeout(debounce);status('☁ 変更を保存待ち…');debounce=setTimeout(cloudSave,800)}
function enable(){enabled=true;window.familyCloudSave=schedule;status('☁ 自動保存が有効です');}
el('cloudMigrate').onclick=async()=>{const local=safeTrips();if(!local.length){status('端末に旅程がありません。まずJSONを読み込んでください。');return}if(!confirm(`端末の${local.length}件をFirebaseに初回登録します。写真も送信します。実行前にJSONバックアップを保存しましたか？`))return;enabled=true;await cloudSave();if(enabled&&lastSerialized){enable();el('cloudMigrate').style.display='none';el('cloudReload').style.display='inline-block';}};
el('cloudReload').onclick=async()=>{try{await loadFamily();const snap=await getDoc(cloudRef);if(!snap.exists()){status('クラウドにデータがありません');return}const remote=snap.data().trips||[],local=safeTrips();if(local.length&&!confirm(`クラウド${remote.length}件を読み込みます。端末の${local.length}件と差がある場合、端末側の内容が置き換わります。事前バックアップを確認してください。`))return;restore(remote);lastSerialized=JSON.stringify(remote);enable();status('☁ クラウド読込完了・自動保存有効');el('cloudMigrate').style.display='none';}catch(e){status('読込失敗：'+(e.code||e.message))}};
el('closeAccount').onclick=()=>el('authPanel').classList.add('hidden');
el('loginBtn').onclick=async()=>{el('authPanel').classList.toggle('hidden');if(auth.currentUser){update(auth.currentUser);return}try{message('Googleログインを開いています…');await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){message('ログイン失敗：'+(e.code||e.message))}};
el('logoutBtn').onclick=async()=>{try{await signOut(auth)}catch(e){message('ログアウト失敗：'+e.message)}};
el('copyUidBtn').onclick=async()=>{try{await navigator.clipboard.writeText(auth.currentUser?.uid||'');message('UIDをコピーしました')}catch{message('UIDを長押ししてコピーしてください')}};

window.familyGalleryUpload=async(tripId,file)=>{
 if(!enabled||!user||user.uid!==OWNER)throw Error('クラウド同期を有効にしてください');
 const bitmap=await createImageBitmap(file);
 const scale=Math.min(1,1600/bitmap.width,1600/bitmap.height);
 const canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
 canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
 const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('画像変換に失敗')),'image/jpeg',.8));
 const id=(crypto.randomUUID?.()||String(Date.now())+'-'+Math.random().toString(36).slice(2));
 const path='galleries/'+encodeURIComponent(String(tripId))+'/'+id+'.jpg';
 const obj=ref(storage,path);await uploadBytes(obj,blob,{contentType:'image/jpeg'});
 return {url:await getDownloadURL(obj),storagePath:path};
};

onAuthStateChanged(auth,async u=>{update(u);await prepare()},e=>message('認証エラー：'+e.message));
