/* ============================================================
   HELP & ABOUT — About page, Contact us form, and the small info
   pages (What's new, Licence & copyright, Credits).

   Screens (index.html): #screen-about, #screen-contact, #screen-info.
   Settings has a "Help & About" group that links in here.

   ---- Fill these in when you have them ----
   Leaving any of them '' is safe: the matching row shows a
   "Coming soon" tag (manual / privacy / terms) or is hidden (email).

   17.11.2026: the "Download for Android" row (GitHub APK) and the in-app
   "Update available" check were removed. Android now comes from Google Play,
   which handles installs and updates. When NimoSail is public on Play, a
   simple Google Play link can be added to the About page.
   ============================================================ */
const COPYRIGHT_HOLDER = 'Pete Jackson';
const COPYRIGHT_YEAR   = 2026;
const SUPPORT_EMAIL    = 'support@nimosail.app'; // 17.11.2026: was sailapp141@gmail.com; support@ forwards there (Cloudflare Email Routing)
// Always the live copy on GitHub Pages. To update the guide, replace
// docs/NimoSail-User-Guide.pdf with the new file (same name) and push.
// The button adds ?v=<app version> so phones fetch a fresh copy after each
// release instead of showing one they saved earlier (GitHub Pages lets them
// keep it for 10 minutes).
const USER_MANUAL_URL  = 'https://petejackson141.github.io/nimosail/NimoSail-User-Guide.pdf';
const PRIVACY_URL      = 'https://petejackson141.github.io/nimosail/privacy.html';
const TERMS_URL        = 'https://petejackson141.github.io/nimosail/terms.html';
// Newest first. Add a line here with each release worth telling people about.
const WHATS_NEW = [
  { version: '17.11.2026', items: [
    'Sails saved with no signal now upload by themselves as soon as you are back in range, so you don\'t have to remember to open the app again.',
    'NimoSail now updates through Google Play.'
  ]},
  { version: '13.11.2026', items: [
    'Sail la Vie is now NimoSail: a new name and a new look. Sign in with the same email and password, and all your sails, boats, crew and photos are still there.',
    'The NimoSail app installs as a new app. Once you have signed in and checked your sails, you can uninstall the old Sail la Vie app.',
    'The user guide has new screenshots.'
  ]},
  { version: '07.11.2026', items: [
    'Notifications when a friend sends you a sail, sends you a friend request or accepts yours, even when the app is closed.',
    'iPhone: turn notifications on in Settings → Notifications (add the app to your Home Screen first).',
    'The last few seconds of a recorded sail are no longer lost when you end the journey.',
    'GPX files from SeaPeople now import correctly.'
  ]},
  { version: '04.11.2026', items: [
    'New Mapbox maps, with an animated wind layer.',
    '"Everywhere I\'ve sailed" map on your Profile.',
    'Import a GPX track for a sail you log by hand.',
    'Choose your tracking icon in Settings.',
    'Merge a crew member with a friend, and share your past sails with them.',
    'Automatic weather for sails you log by hand.',
    'Short video reels of your sails.',
    'Automatic error reporting, so problems get fixed faster.'
  ]},
  { version: '21.10.2026', items: [
    'Your profile, cover, boat and crew photos are now backed up to the cloud and stay in sync across your devices.',
    'The Nautical map style has a clearer, more colourful background under the sea marks.',
    'Location only needs “While using the app” now. Recording still carries on with the screen off.',
    'The user guide is updated, and a small security fix.'
  ]},
  { version: '01.10.2026', items: [
    'The black box that flashed when opening the app is gone.',
    'Security and privacy improvements behind the scenes.'
  ]},
  { version: '29.09.2026', items: [
    'New About page with the user manual, contact form and legal information (Settings → Help & About).',
    'Privacy policy and terms of use added.',
    'Delete your account from Settings → Account.',
    'Send feedback, report a problem or suggest a feature straight from the app.',
    'An account is now needed to use the app, and you choose a username when you first sign in.',
    'Usernames can now have spaces and capitals, like “Pete Jackson”.'
  ]},
  { version: '27.09.2026', items: [
    'Friends: find other sailors, send friend requests and see the sails they share with you.',
    'Choose Only me or Friends each time you save a sail or a Noticeboard plan.',
    '"Weather on the water" report on each recorded sail.',
    'Sail photos are now stored in the cloud, compressed, up to 20 per sail.'
  ]},
  { version: '26.09.2026', items: [
    'Sailing certificate as an A4 PDF.',
    'Sail PDF export rebuilt with the Nautical Magazine, Minimalist Yacht Club and Memory Page designs.'
  ]}
];

/* ---------- small helpers ---------- */
function _esc(s){ return String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function _soonTag(){ return '<span class="soon-tag">' + _esc(t('about.soon')) + '</span>'; }
function openExternalUrl(url){
  // In the Capacitor app, a _blank link opens in the phone's browser; on the web, a new tab.
  try{ window.open(url, '_blank', 'noopener'); }catch(e){ location.href = url; }
}

/* ---------- static bits filled in once at startup ---------- */
function initAboutPage(){
  document.querySelectorAll('.app-version-text').forEach(el => { el.textContent = t('about.version', {version: APP_VERSION}); });
  document.querySelectorAll('.support-email-text').forEach(el => { el.textContent = SUPPORT_EMAIL; });
  document.querySelectorAll('.manual-soon').forEach(el => { el.innerHTML = USER_MANUAL_URL ? '' : _soonTag(); });
  document.querySelectorAll('.privacy-soon').forEach(el => { el.innerHTML = PRIVACY_URL ? '' : _soonTag(); });
  document.querySelectorAll('.terms-soon').forEach(el => { el.innerHTML = TERMS_URL ? '' : _soonTag(); });
  const emailRow = document.getElementById('aboutEmailRow');
  if(emailRow) emailRow.style.display = SUPPORT_EMAIL ? '' : 'none';
  const emailAlt = document.getElementById('contactEmailAlt');
  if(emailAlt) emailAlt.style.display = SUPPORT_EMAIL ? '' : 'none';
  const copy = document.getElementById('aboutCopyright');
  if(copy) copy.innerHTML = _esc(t('about.copyright', {year: COPYRIGHT_YEAR, holder: COPYRIGHT_HOLDER})) + '<br>' + _esc(t('about.copyrightOwns', {holder: COPYRIGHT_HOLDER}));
}

/* ---------- Help links ---------- */
function openUserManual(){
  if(!USER_MANUAL_URL){ showToast(t('about.manualSoon')); return; }
  openExternalUrl(USER_MANUAL_URL + '?v=' + encodeURIComponent(APP_VERSION));
}
function openLegalLink(kind){
  const url = kind === 'privacy' ? PRIVACY_URL : TERMS_URL;
  if(!url){ showToast(kind === 'privacy' ? t('about.privacyLater') : t('about.termsLater')); return; }
  openExternalUrl(url);
}
function emailSupport(extraBody){
  if(!SUPPORT_EMAIL) return;
  const subject = encodeURIComponent('NimoSail ' + APP_VERSION);
  const body = extraBody ? '&body=' + encodeURIComponent(extraBody) : '';
  location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}${body}`;
}

/* ---------- info pages ---------- */
function showInfoPage(kind){
  const titleEl = document.getElementById('infoTitle');
  const bodyEl = document.getElementById('infoBody');
  let title = '', html = '';
  if(kind === 'whatsnew'){
    title = t('about.whatsNew');
    html = WHATS_NEW.map(r => `<h3>${_esc(r.version)}</h3><ul>${r.items.map(i => `<li>${_esc(i)}</li>`).join('')}</ul>`).join('');
  } else if(kind === 'licence'){
    title = t('about.licence');
    html = `
      <h3>Copyright</h3>
      <p>© ${COPYRIGHT_YEAR} ${_esc(COPYRIGHT_HOLDER)}. All rights reserved.</p>
      <p>The NimoSail app, including its source code, design, graphics, text and the NimoSail name and logo, belongs to ${_esc(COPYRIGHT_HOLDER)}.</p>
      <h3>What you may do</h3>
      <p>You may install and use the app for your own sailing logbook.</p>
      <h3>What you may not do</h3>
      <p>Without written permission, you may not copy, modify, redistribute, resell or publish the app or its code, or reuse its design, graphics or name.</p>
      <h3>Your content</h3>
      <p>Your sails, photos, notes and profile remain yours.</p>
      <p class="muted">The app uses third-party open-source components, which keep their own licences. See Credits &amp; open-source licences.</p>`;
  } else if(kind === 'credits'){
    title = t('about.creditsTitle');
    html = `
      <h3>Maps</h3>
      <ul>
        <li>Maps © Mapbox</li>
        <li>Map data and place names © OpenStreetMap contributors (ODbL)</li>
        <li>Sea marks © OpenSeaMap</li>
      </ul>
      <h3>Weather</h3>
      <ul><li>Weather, marine and place data by Open-Meteo.com (CC BY 4.0)</li></ul>
      <h3>Software</h3>
      <ul>
        <li>Mapbox GL JS (Mapbox Terms of Service)</li>
        <li>Capacitor (MIT)</li>
        <li>mp4-muxer (MIT)</li>
        <li>Supabase JavaScript client (MIT)</li>
        <li>jsPDF (MIT)</li>
        <li>html2canvas (MIT)</li>
      </ul>
      <h3>Fonts</h3>
      <ul><li>Inter, Space Grotesk, Playfair Display, Libre Baskerville and Alex Brush, via Google Fonts (SIL Open Font Licence)</li></ul>`;
  }
  titleEl.textContent = title;
  bodyEl.innerHTML = html;
  nav('info');
}

/* ---------- Contact us ---------- */
const CONTACT_PLACEHOLDERS = {   // translation keys — looked up with t() when shown
  feedback: 'contact.phFeedback',
  problem:  'contact.phProblem',
  idea:     'contact.phIdea',
  other:    'contact.phOther'
};
let contactState = { topic: 'feedback', screenshot: null, sending: false };

function deviceSummary(){
  const ua = navigator.userAgent || '';
  const isNative = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
  let os = 'Unknown device';
  const android = ua.match(/Android\s([\d.]+)/);
  const ios = ua.match(/(?:iPhone|iPad|iPod).*?OS\s([\d_]+)/);
  if(android) os = 'Android ' + android[1];
  else if(ios) os = 'iOS ' + ios[1].replace(/_/g, '.');
  else if(/Windows/.test(ua)) os = 'Windows';
  else if(/Mac OS X/.test(ua)) os = 'Mac';
  let model = '';
  const m = ua.match(/Android\s[\d.]+;\s([^;)]+)/);
  if(m && m[1] && m[1].trim() !== 'K') model = m[1].trim();
  return [os, model, isNative ? 'app' : 'web'].filter(Boolean).join(' · ');
}

function openContact(topic){
  setContactTopic(topic || 'feedback');
  document.getElementById('contactDeviceLine').textContent = t('contact.deviceLine', {version: APP_VERSION, device: deviceSummary()});
  nav('contact');
}
function setContactTopic(topic){
  contactState.topic = topic;
  document.querySelectorAll('#contactTopicChips .chip').forEach(c => c.classList.toggle('active', c.dataset.topic === topic));
  document.getElementById('contactMessage').placeholder = CONTACT_PLACEHOLDERS[topic] ? t(CONTACT_PLACEHOLDERS[topic]) : '';
}
async function onContactShotPicked(event){
  const file = event.target.files && event.target.files[0];
  event.target.value = ''; // so picking the same file again still fires
  if(!file) return;
  try{
    contactState.screenshot = await resizeImage(file, 1280, 0.7);
    document.getElementById('contactShotImg').src = contactState.screenshot;
    document.getElementById('contactShot').classList.add('show');
    document.getElementById('contactAttachBtn').style.display = 'none';
  }catch(e){
    showToast(t('contact.cantRead'));
  }
}
function removeContactShot(){
  contactState.screenshot = null;
  document.getElementById('contactShotImg').removeAttribute('src');
  document.getElementById('contactShot').classList.remove('show');
  document.getElementById('contactAttachBtn').style.display = '';
}
function resetContactForm(){
  document.getElementById('contactMessage').value = '';
  document.getElementById('contactIncludeDevice').checked = true;
  removeContactShot();
  setContactTopic('feedback');
}

async function sendContactMessage(){
  if(contactState.sending) return;
  const message = document.getElementById('contactMessage').value.trim();
  if(!message){ showToast(t('contact.writeFirst')); return; }
  const includeDevice = document.getElementById('contactIncludeDevice').checked;

  // Not signed in: fall back to email if there is one, otherwise ask them to sign in.
  if(!state.user){
    if(SUPPORT_EMAIL){ emailSupport(message); return; }
    showToast(t('contact.signInFirst'));
    return;
  }
  if(navigator.onLine === false){ showToast(t('contact.offline')); return; }

  const btn = document.getElementById('contactSendBtn');
  contactState.sending = true;
  btn.disabled = true; btn.textContent = t('contact.sending');
  try{
    const row = {
      user_id: state.user.id,
      email: state.user.email || null,
      topic: contactState.topic,
      message,
      app_version: includeDevice ? APP_VERSION : null,
      device: includeDevice ? deviceSummary() : null,
      screenshot: contactState.screenshot || null
    };
    const { error } = await getSupabaseClient().from('feedback').insert(row);
    if(error) throw error;
    resetContactForm();
    showToast(t('contact.sent'));
    nav('about');
  }catch(e){
    console.warn('feedback send failed', e);
    showToast(t('contact.failed'));
  }finally{
    contactState.sending = false;
    btn.disabled = false; btn.textContent = t('contact.send');
  }
}

initAboutPage();
setContactTopic('feedback');
