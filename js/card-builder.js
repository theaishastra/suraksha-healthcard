/**
 * card-builder.js
 * Sree Suraksha Hospital – Family Health Card builder.
 * Front: img/front.png template + Card ID / District / Mobile row + a
 * Name/Age/Blood Group table listing the registrant and every added
 * family member (matches samples/family-front-sample.png).
 * Back: img/back.png (static benefits flyer), no overlay.
 * Card dimensions: 900×514px (matches the 1050×600 template artwork's aspect ratio).
 */

function buildCardElement(memberData) {
  const {
    fullName = "Member Name",
    memberId = "SSH260001",
    mobile = "",
    bloodGroup = "",
    age = "",
    district = "",
    familyMembers = [],
  } = memberData;

  const allMembers = [
    { name: fullName, age, bloodGroup: bloodGroup || "—" },
    ...familyMembers.map((m) => ({
      name: m.name,
      age: m.age ?? "",
      bloodGroup: m.bloodGroup || "—",
    })),
  ].slice(0, 4);

  const wrapper = document.createElement("div");
  wrapper.className = "cf-card-wrapper";

  /** FRONT CARD */
  const front = document.createElement("div");
  front.className = "cf-card cf-card-front";

  const frontImg = document.createElement("img");
  frontImg.className = "cf-template-img";
  frontImg.src = "img/front.png";
  frontImg.alt = "Sree Suraksha Family Health Card";
  front.appendChild(frontImg);

  front.appendChild(_buildInfoRow(memberId, district, mobile));
  front.appendChild(_buildMembersTable(allMembers));

  /** BACK CARD */
  const back = document.createElement("div");
  back.className = "cf-card cf-card-back";

  const backImg = document.createElement("img");
  backImg.className = "cf-template-img";
  backImg.src = "img/back.png";
  backImg.alt = "Sree Suraksha Hospital Benefits";
  back.appendChild(backImg);

  wrapper.appendChild(front);
  wrapper.appendChild(back);

  return wrapper;
}

function _buildInfoRow(memberId, district, mobile) {
  const row = document.createElement("div");
  row.className = "cf-info-row";
  row.appendChild(_infoItem("CARD ID", memberId));
  row.appendChild(_infoItem("DISTRICT", district));
  row.appendChild(_infoItem("MOBILE NO", mobile));
  return row;
}

function _infoItem(label, value) {
  const el = document.createElement("div");
  el.className = "cf-info-item";
  el.innerHTML =
    `<span class="cf-info-label">${_esc(label)}</span>` +
    `<span class="cf-info-value">${_esc(value || "—")}</span>`;
  return el;
}

function _buildMembersTable(members) {
  const table = document.createElement("div");
  table.className = "cf-members-table";

  const header = document.createElement("div");
  header.className = "cf-table-row cf-table-header";
  header.innerHTML =
    '<span class="cf-col-name">NAME</span>' +
    '<span class="cf-col-age">AGE</span>' +
    '<span class="cf-col-blood">BLOOD GROUP</span>';
  table.appendChild(header);

  members.forEach((m, i) => {
    const row = document.createElement("div");
    row.className = "cf-table-row" + (i % 2 === 1 ? " cf-row-alt" : "");
    row.innerHTML =
      `<span class="cf-col-name">${_esc(m.name)}</span>` +
      `<span class="cf-col-age">${_esc(m.age || "—")}</span>` +
      `<span class="cf-col-blood">${_esc(m.bloodGroup)}</span>`;
    table.appendChild(row);
  });

  return table;
}

function _esc(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
