/**
 * submit.js - Main form submission orchestrator
 */

document.addEventListener('DOMContentLoaded', () => {
  attachRealTimeValidation();
  setupImagePreviews();
  const form = document.getElementById('registrationForm');
  if (form) form.addEventListener('submit', handleSubmit);
});

// Track whether a submission is already in progress to prevent
// duplicate inserts. When true, subsequent submits are ignored
// until the current submission completes.
let submissionInProgress = false;

function setupImagePreviews() {
  setupPreview('aadharPhoto', 'aadharPreview', 'aadharPlaceholder', 'aadharUploadBox');
  setupPreview('selfiePhoto',  'selfiePreview',  'selfiePlaceholder',  'selfieUploadBox');
}

function setupPreview(inputId, previewId, placeholderId, boxId) {
  const input       = document.getElementById(inputId);
  const preview     = document.getElementById(previewId);
  const placeholder = document.getElementById(placeholderId);
  const box         = document.getElementById(boxId);
  if (!input) return;
  input.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      preview.src = ev.target.result;
      preview.classList.add('visible');
      placeholder.style.display = 'none';
      box.classList.add('has-file');
    };
    reader.readAsDataURL(file);
  });
}

async function handleSubmit(e) {
  e.preventDefault();
  // Prevent double submission if the user clicks the submit button multiple times.
  if (submissionInProgress) {
    // Ignore additional submits while one is already in progress.
    return;
  }
  submissionInProgress = true;
  const { valid } = validateForm();
  if (!valid) {
    showGlobalError('Please fix the errors above before submitting.');
    submissionInProgress = false;
    return;
  }
  setLoadingState(true);
  hideGlobalError();

  try {
    const formData = collectFormData();

    updateProgress('Compressing images…');
    const aadharFile = document.getElementById('aadharPhoto').files[0];
    const selfieFile = document.getElementById('selfiePhoto').files[0];
    let aadharBlob = null;
    let selfieBlob;

    // Compress Aadhaar only if a file was provided. If the user leaves
    // Aadhaar photo blank, aadharBlob remains null and we skip uploading it.
    if (aadharFile) {
      aadharBlob = await compressAadhar(aadharFile);
    }
    // Always compress the selfie/passport photo (required)
    selfieBlob = await compressSelfie(selfieFile);

    updateProgress('Generating Member ID…');
    const memberId = await fetchMemberId();

    updateProgress('Uploading photos…');
    let aadharPath = null;
    let selfiePath = null;
    // Upload the compressed selfie first (always required)
    selfiePath = await uploadSelfie(memberId, selfieBlob);
    // Upload Aadhaar only if provided. If not, leave the path as null.
    if (aadharBlob) {
      aadharPath = await uploadAadhar(memberId, aadharBlob);
    }

    const familyMembers = collectFamilyMembers();

    updateProgress('Building your family health card…');
    const cardEl = buildCardElement({
      fullName:    formData.fullName,
      memberId,
      mobile:      formData.mobile,
      bloodGroup:  formData.bloodGroup,
      age:         formData.age,
      district:    formData.district,
      familyMembers,
    });

    updateProgress('Generating PDF…');
    const pdfBlob = await generateCardPDF(cardEl);

    updateProgress('Uploading your card…');
    const cardPdfPath = await uploadCardPDF(memberId, pdfBlob);

    const cardDownloadUrl = await getSignedUrl(CONFIG.BUCKET_CARDS, cardPdfPath);

    updateProgress('Saving your registration…');
    await insertMemberRecord({ ...formData, memberId, aadharPath, selfiePath, cardPdfPath, familyMembers });

    updateProgress('Sending your card by email…');
    await sendCardEmail({ fullName: formData.fullName, email: formData.email, memberId, cardDownloadUrl });

    const successUrl = `pages/success.html?name=${encodeURIComponent(formData.fullName)}&id=${encodeURIComponent(memberId)}&email=${encodeURIComponent(formData.email)}`;
    window.location.href = successUrl;

  } catch (err) {
    console.error('Submission error:', err);
    showGlobalError(`Submission failed: ${err.message}. Please try again or contact us at 7731083108.`);
    setLoadingState(false);
  } finally {
    // Always reset the submission flag so that the user can try again
    submissionInProgress = false;
  }
}

function collectFormData() {
  return {
    fullName:   document.getElementById('fullName').value.trim(),
    gender:     document.getElementById('gender').value,
    age:        parseInt(document.getElementById('age').value, 10),
    relation:   document.getElementById('relation').value,
    mobile:     document.getElementById('mobile').value.trim(),
    email:      document.getElementById('email').value.trim(),
    address:    document.getElementById('address').value.trim(),
    village:    document.getElementById('village').value.trim(),
    mandal:     document.getElementById('mandal').value.trim(),
    district:   document.getElementById('district').value.trim(),
    state:      document.getElementById('state').value.trim(),
    anyQuery:   document.getElementById('anyQuery').value.trim(),
    bloodGroup: document.getElementById('bloodGroup').value,
  };
}

async function fetchMemberId() {
  const { data, error } = await supabaseClient.rpc('generate_member_id');
  if (error) throw new Error(`Member ID generation failed: ${error.message}`);
  if (!data) throw new Error('Invalid response from member ID function');
  return data;
}

async function insertMemberRecord(data) {
  const { error } = await supabaseClient.from('members').insert([{
    full_name:     data.fullName,
    gender:        data.gender,
    age:           data.age,
    relation:      data.relation,
    mobile_number: data.mobile,
    email:         data.email,
    address:       data.address,
    village:       data.village,
    mandal:        data.mandal,
    district:      data.district,
    state:         data.state,
    any_query:     data.anyQuery || null,
    aadhar_path:   data.aadharPath,
    selfie_path:   data.selfiePath,
    member_id:     data.memberId,
    card_pdf_path: data.cardPdfPath,
    family_members: data.familyMembers && data.familyMembers.length ? data.familyMembers : null,
    status:        'active',
    email_status:  'pending',
  }]);
  if (error) throw new Error(`Database insert failed: ${error.message}`);
}

async function sendCardEmail({ fullName, email, memberId, cardDownloadUrl }) {
  try {
    const res = await fetch(CONFIG.APPSCRIPT_EMAIL_URL, {
      method: 'POST',
      // text/plain avoids a CORS preflight against the Apps Script Web App,
      // which does not handle OPTIONS requests.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        fullName,
        email,
        memberId,
        cardDownloadUrl,
      }),
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Unknown error from email service');
    await updateEmailStatus(memberId, 'sent');
  } catch (err) {
    console.warn('Email send warning:', err.message);
    await updateEmailStatus(memberId, 'failed');
  }
}

async function updateEmailStatus(memberId, status) {
  const { error } = await supabaseClient
    .from('members')
    .update({ email_status: status })
    .eq('member_id', memberId);
  if (error) console.warn('Could not update email_status:', error.message);
}

function setLoadingState(loading) {
  const btn     = document.getElementById('submitBtn');
  const btnText = document.getElementById('btnText');
  const loader  = document.getElementById('btnLoader');
  if (!btn) return;
  btn.disabled = loading;
  btnText.classList.toggle('hidden', loading);
  loader.classList.toggle('hidden', !loading);
}

function updateProgress(message) {
  const el = document.getElementById('progressMsg');
  if (el) el.textContent = message;
}

function showGlobalError(msg) {
  const el = document.getElementById('globalError');
  if (el) {
    el.textContent = msg;
    el.classList.remove('hidden');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

function hideGlobalError() {
  const el = document.getElementById('globalError');
  if (el) el.classList.add('hidden');
}
