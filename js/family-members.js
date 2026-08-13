/**
 * family-members.js
 * Lets a registrant add extra family members (Name / Age / Blood Group)
 * covered under the same card. Rows are purely client-side inputs;
 * collectFamilyMembers() reads them back out for submit.js to use.
 *
 * Card holds 4 members total, and the registrant filling the form is
 * always member #1 — so at most 3 more can be added here.
 */

const MAX_CARD_MEMBERS = 4;
const MAX_ADDITIONAL_MEMBERS = MAX_CARD_MEMBERS - 1;

let familyMemberCount = 0;

document.addEventListener('DOMContentLoaded', () => {
  const addBtn = document.getElementById('addMemberBtn');
  if (addBtn) addBtn.addEventListener('click', addFamilyMemberRow);
  updateAddMemberButtonState();
});

function addFamilyMemberRow() {
  const list = document.getElementById('familyMembersList');
  if (!list) return;
  if (list.children.length >= MAX_ADDITIONAL_MEMBERS) return;

  const rowId = ++familyMemberCount;
  const row = document.createElement('div');
  row.className = 'family-member-row';
  row.dataset.rowId = String(rowId);

  row.innerHTML = `
    <div class="form-group">
      <label>Name</label>
      <input type="text" class="fm-name" placeholder="Family member's name" />
    </div>
    <div class="form-group">
      <label>Age</label>
      <input type="number" class="fm-age" placeholder="Age" min="0" max="120" />
    </div>
    <div class="form-group">
      <label>Blood Group</label>
      <select class="fm-blood">
        <option value="">Select</option>
        <option value="A+">A+</option>
        <option value="A-">A-</option>
        <option value="B+">B+</option>
        <option value="B-">B-</option>
        <option value="AB+">AB+</option>
        <option value="AB-">AB-</option>
        <option value="O+">O+</option>
        <option value="O-">O-</option>
      </select>
    </div>
    <button type="button" class="remove-member-btn" title="Remove this member" aria-label="Remove this member">&times;</button>
  `;

  row.querySelector('.remove-member-btn').addEventListener('click', () => {
    row.remove();
    updateAddMemberButtonState();
  });
  list.appendChild(row);
  updateAddMemberButtonState();
}

function updateAddMemberButtonState() {
  const list = document.getElementById('familyMembersList');
  const addBtn = document.getElementById('addMemberBtn');
  const hint = document.getElementById('memberLimitHint');
  if (!list || !addBtn) return;

  const atLimit = list.children.length >= MAX_ADDITIONAL_MEMBERS;
  addBtn.disabled = atLimit;
  addBtn.classList.toggle('hidden', atLimit);
  if (hint) hint.classList.toggle('hidden', !atLimit);
}

function collectFamilyMembers() {
  const rows = document.querySelectorAll('#familyMembersList .family-member-row');
  const members = [];
  rows.forEach((row) => {
    const name = row.querySelector('.fm-name').value.trim();
    const age = row.querySelector('.fm-age').value.trim();
    const bloodGroup = row.querySelector('.fm-blood').value;
    if (name) {
      members.push({ name, age: age ? parseInt(age, 10) : null, bloodGroup });
    }
  });
  return members;
}
