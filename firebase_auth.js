// Family Trips v3.0: authentication-only bootstrap. No Firestore/Storage writes.
import {initializeApp} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js';
const firebaseConfig={
 apiKey:'AIzaSyB1A7Znwf9-I_7H89AXwsPeINn5VhmThpc',
 authDomain:'family-trips-6f940.firebaseapp.com',
 projectId:'family-trips-6f940',
 storageBucket:'family-trips-6f940.firebasestorage.app',
 messagingSenderId:'400857202870',
 appId:'1:400857202870:web:26511f27483fe9d230a617'
};
const auth=getAuth(initializeApp(firebaseConfig));
const el=id=>document.getElementById(id);
function panel(){el('authPanel').classList.remove('hidden')}
function message(msg){panel();el('authMessage').textContent=msg}
function update(user){
 el('authIdentity').classList.toggle('hidden',!user);
 el('loginBtn').textContent=user?'🔐 ログイン済み':'🔐 ログイン';
 if(user){el('authEmail').textContent=user.email||'Googleアカウント';el('authUid').textContent=user.uid;message('ログイン成功。UIDを確認できます。旅行データは端末内のままです。')}
 else message('まだログインしていません。「ログイン」を押してGoogleアカウントを選んでください。');
}
el('loginBtn').addEventListener('click',async()=>{panel();if(auth.currentUser){update(auth.currentUser);return;}try{message('Googleログイン画面を開きます…');await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){message('ログインできませんでした：'+(e.code||e.message)+'。iPhoneでポップアップがブロックされた場合はSafariで開いて試してください。')}});
el('logoutBtn').addEventListener('click',async()=>{try{await signOut(auth)}catch(e){message('ログアウト失敗：'+e.message)}});
el('copyUidBtn').addEventListener('click',async()=>{const uid=auth.currentUser?.uid;if(!uid)return;try{await navigator.clipboard.writeText(uid);message('UIDをコピーしました。')}catch(e){message('UIDを長押ししてコピーしてください。')}});
onAuthStateChanged(auth,update,err=>message('認証状態の確認に失敗：'+err.message));
