const test = require("node:test");
const assert = require("node:assert/strict");
const { parseStoredJson, prefillFields, readPath, resolveBinding, supportType } = require("./formPrefillResolver");

test("resolver supports nested arrays, multiple bindings, and zero values", () => {
  const source = {
    children: [{ name: "Alex", age: 0 }],
    applicant: { fullLegalName: "Jordan Doe" },
    respondent: { fullLegalName: "Sam Doe" },
  };
  assert.equal(readPath(source, "children[0].name"), "Alex");
  assert.equal(resolveBinding(source, "applicant.fullLegalName, respondent.fullLegalName"), "Jordan Doe, Sam Doe");
  assert.deepEqual(prefillFields(source, {
    staticFields: [
      { id: "child-age", bind: "children[0].age" },
      { id: "parties", bind: "applicant.fullLegalName, respondent.fullLegalName" },
    ],
  }), {
    values: { "child-age": 0, parties: "Jordan Doe, Sam Doe" },
    provenance: { "child-age": "prefill", parties: "prefill" },
  });
});

test("resolver only accepts structured calculation data", () => {
  assert.deepEqual(parseStoredJson('{"monthly":425}'), { monthly: 425 });
  assert.deepEqual(parseStoredJson("not json"), {});
  assert.equal(supportType({ type: "child_support" }), "child");
  assert.equal(supportType({ calculatorType: "spousal-support" }), "spousal");
  assert.equal(supportType({ type: "conversation" }), null);
});
