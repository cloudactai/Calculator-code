const test = require("node:test");
const assert = require("node:assert/strict");

const {
  MAX_FIELD_LENGTH,
  bool,
  lawyerRow,
  readPayload,
} = require("./lawyerContact");

test("readPayload trims every field and defaults memberOfFirm to true", () => {
  assert.deepEqual(
    readPayload({
      name: "  Sam Smith  ",
      address: " Barrie Road ",
      municipality: " Barrie ",
      province: " Ontario ",
      postalCode: " L4M 1A1 ",
      phone: " 12135 ",
      email: " SamSmith@gmail.com ",
    }),
    {
      values: {
        name: "Sam Smith",
        address: "Barrie Road",
        municipality: "Barrie",
        province: "Ontario",
        postalCode: "L4M 1A1",
        phone: "12135",
        email: "SamSmith@gmail.com",
        memberOfFirm: true,
      },
    }
  );
});

test("readPayload fills missing optional fields with empty strings", () => {
  assert.deepEqual(readPayload({ name: "Jane Advocate" }).values, {
    name: "Jane Advocate",
    address: "",
    municipality: "",
    province: "",
    postalCode: "",
    phone: "",
    email: "",
    memberOfFirm: true,
  });
});

test("readPayload rejects a missing or blank name", () => {
  assert.equal(readPayload({}).error, "Lawyer name is required.");
  assert.equal(readPayload({ name: "   " }).error, "Lawyer name is required.");
  assert.equal(readPayload(undefined).error, "Lawyer name is required.");
  assert.equal(readPayload({}).values, undefined);
});

test("readPayload caps runaway field lengths", () => {
  const long = "x".repeat(MAX_FIELD_LENGTH + 50);
  const { values } = readPayload({ name: long, address: long });
  assert.equal(values.name.length, MAX_FIELD_LENGTH);
  assert.equal(values.address.length, MAX_FIELD_LENGTH);
});

test("memberOfFirm accepts the UI's Yes/No as well as booleans", () => {
  assert.equal(readPayload({ name: "A", memberOfFirm: "No" }).values.memberOfFirm, false);
  assert.equal(readPayload({ name: "A", memberOfFirm: "Yes" }).values.memberOfFirm, true);
  assert.equal(readPayload({ name: "A", memberOfFirm: false }).values.memberOfFirm, false);
  assert.equal(readPayload({ name: "A", memberOfFirm: "false" }).values.memberOfFirm, false);
  // Unset means "our firm" - that is what the address book is mostly for.
  assert.equal(readPayload({ name: "A" }).values.memberOfFirm, true);
  // Anything unrecognised falls back rather than silently becoming false.
  assert.equal(bool("maybe"), true);
  assert.equal(bool("maybe", false), false);
});

test("lawyerRow turns nulls into empty strings so form inputs stay controlled", () => {
  assert.deepEqual(
    lawyerRow({
      id: 7,
      name: "Sam Smith",
      address: null,
      municipality: null,
      province: null,
      postalCode: null,
      phone: null,
      email: null,
      memberOfFirm: true,
      createdAt: new Date(),
    }),
    {
      id: 7,
      name: "Sam Smith",
      address: "",
      municipality: "",
      province: "",
      postalCode: "",
      phone: "",
      email: "",
      memberOfFirm: true,
    }
  );
});
