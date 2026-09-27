import { describe, expect, it } from "vitest";
import { validateAnswers, validateDefinition } from "./formModel";
import { pilotSeeds } from "./pilotDefinitions";
import type { FormDefinition } from "./formModel";

const compareText = (left: unknown, right: unknown): number =>
  String(left).localeCompare(String(right));

// Pure model tests for #35. validateDefinition is the publish gate;
// validateAnswers plus visibility is the server authority the applicant flow
// (#36/#37) will call at submit time.

const pattern: FormDefinition = {
  sections: [
    {
      fields: [
        {
          id: "choice",
          kind: "single_choice",
          label: "Pick",
          options: ["A", "B"],
        },
        {
          id: "name",
          kind: "short_text",
          label: "Name",
          maxLength: 5,
          required: true,
        },
      ],
      id: "s1",
      title: "First",
    },
    {
      condition: { mode: "any", rules: [{ fieldId: "choice", values: ["A"] }] },
      fields: [
        { id: "detail", kind: "short_text", label: "Detail", required: true },
      ],
      id: "s2",
      repeat: { max: 2, min: 1 },
      title: "Second",
    },
  ],
};

describe(validateDefinition, () => {
  it("accepts a well-formed definition", () => {
    expect(validateDefinition(pattern)).toStrictEqual([]);
  });

  it("accepts all four 1:1 pilot seeds (publish gate)", () => {
    for (const seed of pilotSeeds) {
      expect(validateDefinition(seed.definition)).toStrictEqual([]);
    }
  });

  it("rejects missing labels, bad options, and duplicate ids", () => {
    const bad: FormDefinition = {
      sections: [
        {
          fields: [
            { id: "a", kind: "short_text", label: "" },
            { id: "a", kind: "short_text", label: "Dupe" },
            {
              id: "c",
              kind: "single_choice",
              label: "Pick",
              options: ["Only"],
            },
          ],
          id: "s",
          title: "S",
        },
      ],
    };
    const problems = validateDefinition(bad);

    expect(problems.join(" ")).toMatch(/label/u);
    expect(problems.join(" ")).toMatch(/Duplicate field id/u);
    expect(problems.join(" ")).toMatch(/two non-empty options/u);
  });

  it("rejects impossible rules", () => {
    const bad: FormDefinition = {
      sections: [
        {
          fields: [{ id: "n", kind: "number", label: "N", max: 5, min: 10 }],
          id: "s",
          repeat: { max: 2, min: 3 },
          title: "S",
        },
      ],
    };
    const problems = validateDefinition(bad);

    expect(problems).toHaveLength(2);
  });

  it("validates mixed once-plus-rows sections", () => {
    const mixed: FormDefinition = {
      sections: [
        {
          fields: [
            {
              id: "headline",
              kind: "short_text",
              label: "Headline",
              required: true,
            },
            { id: "row_note", kind: "short_text", label: "Note" },
          ],
          id: "s",
          repeat: { max: 2, min: 0 },
          repeatFields: ["row_note"],
          title: "S",
        },
      ],
    };

    expect(validateDefinition(mixed)).toStrictEqual([]);
    // Once-field missing blocks; empty rows are fine at min 0.
    expect(
      validateAnswers(mixed, { s: [] }).errors.map((error) => error.path)
    ).toStrictEqual(["headline"]);
    expect(
      validateAnswers(mixed, { headline: "Hi", s: [] }).errors
    ).toStrictEqual([]);
    // Unknown repeat fields and row-level conditions are rejected.
    expect(
      validateDefinition({
        sections: [
          {
            fields: [{ id: "a", kind: "short_text", label: "A" }],
            id: "s",
            repeat: { max: 1, min: 0 },
            repeatFields: ["ghost"],
            title: "S",
          },
        ],
      }).join(" ")
    ).toMatch(/unknown field/u);
  });

  it("rejects conditions on later or non-choice fields", () => {
    const bad: FormDefinition = {
      sections: [
        {
          condition: {
            mode: "any",
            rules: [{ fieldId: "later", values: ["X"] }],
          },
          fields: [{ id: "t", kind: "short_text", label: "T" }],
          id: "s1",
          title: "First",
        },
        {
          fields: [
            {
              id: "later",
              kind: "single_choice",
              label: "Later",
              options: ["X", "Y"],
            },
            {
              condition: {
                mode: "any",
                rules: [{ fieldId: "t", values: ["x"] }],
              },
              id: "t2",
              kind: "short_text",
              label: "T2",
            },
          ],
          id: "s2",
          title: "Second",
        },
      ],
    };
    const problems = validateDefinition(bad);

    expect(problems).toHaveLength(2);
    expect(problems.join(" ")).toMatch(/not an earlier choice field/u);
  });
});

describe(validateAnswers, () => {
  it("requires visible fields and enforces length", () => {
    const { errors } = validateAnswers(pattern, { choice: "B" });

    expect(errors.map((error) => error.path)).toStrictEqual(["name"]);

    const ok = validateAnswers(pattern, { choice: "B", name: "Al" });

    expect(ok.errors).toStrictEqual([]);
  });

  it("validates repeated sections and skips hidden ones", () => {
    // s2 hidden when choice is B: rows are neither required nor checked.
    const hidden = validateAnswers(pattern, {
      choice: "B",
      name: "Al",
      s2: [{ detail: "" }],
    });

    expect(hidden.errors).toStrictEqual([]);

    // s2 visible when choice is A: min 1 row, each detail required.
    const missing = validateAnswers(pattern, { choice: "A", name: "Al" });

    expect(missing.errors.map((error) => error.path)).toStrictEqual(["s2"]);

    const badRow = validateAnswers(pattern, {
      choice: "A",
      name: "Al",
      s2: [{ detail: "" }, { detail: "x" }, { detail: "y" }],
    });

    expect(badRow.errors.map((error) => error.path)).toStrictEqual([
      "s2",
      "s2[0].detail",
    ]);
  });

  it("checks email, phone, choice membership, and declarations", () => {
    const fieldDefinition: FormDefinition = {
      sections: [
        {
          fields: [
            { id: "e", kind: "email", label: "Email", required: true },
            { id: "p", kind: "phone", label: "Phone" },
            {
              id: "c",
              kind: "single_choice",
              label: "Pick",
              options: ["A", "B"],
            },
            { id: "d", kind: "declaration", label: "Agree", required: true },
          ],
          id: "s",
          title: "S",
        },
      ],
    };
    const { errors } = validateAnswers(fieldDefinition, {
      c: "Z",
      d: false,
      e: "not-an-email",
      p: "123",
    });

    expect(
      errors.map((error) => error.path).toSorted(compareText)
    ).toStrictEqual(["c", "d", "e", "p"]);

    const ok = validateAnswers(fieldDefinition, {
      c: "A",
      d: true,
      e: "a@example.com",
      p: "868-123-4567",
    });

    expect(ok.errors).toStrictEqual([]);
  });

  it("proves the passport guardian stays hidden for adults", () => {
    const passport = pilotSeeds.find(
      (s) => s.slug === "adult-passport-renewal"
    );
    if (!passport) {
      throw new Error("Passport pilot seed is missing.");
    }
    const answers = {
      accept: true,
      country_of_birth: "Trinidad and Tobago",
      date_of_birth: "1990-05-01",
      dated: "2026-09-01",
      decl_id_issue_date: "2020-01-15",
      decl_id_number: "T1234567",
      declarant_name: "Anya Bhim",
      first_name: "Anya",
      home_address: "36 Ariapita Avenue",
      marital_status: "Single",
      other_citizenship: false,
      passport_issue_date: "2020-01-15",
      passport_issue_place: "Port of Spain",
      passport_number: "T1234567",
      place_of_birth: "San Fernando",
      references: [
        { ref_name: "C Patel", ref_tel: "8681112222" },
        { ref_name: "D Singh", ref_tel: "8683334444" },
      ],
      sex: "Female",
      surname: "Bhim",
      under_18: "No, I am 18 or over",
    };
    const { errors, visible } = validateAnswers(passport.definition, answers);

    expect(errors).toStrictEqual([]);
    expect(visible).not.toContain("parent_first");
    expect(visible).not.toContain("previous_marriages");
  });

  it("proves the birth relationship appears only for third parties", () => {
    const birth = pilotSeeds.find(
      (s) => s.slug === "computerized-birth-certificate"
    );
    if (!birth) {
      throw new Error("Birth certificate pilot seed is missing.");
    }
    const base = {
      address: "X",
      application_date: "2026-09-01",
      certify: true,
      child_first: "C",
      date_of_birth: "2020-01-01",
      father_first: "F",
      father_surname: "F",
      first_name: "A",
      id_number: "123",
      id_type: "ID",
      mother_first: "M",
      mother_maiden: "M",
      mother_surname: "M",
      place_of_birth: "POS",
      purpose: "School",
      service_type: "Walk In",
      sex: "Male",
      surname: "B",
      telephone: "8681112222",
    };
    const own = validateAnswers(birth.definition, {
      ...base,
      own_certificate: true,
    });

    expect(own.errors).toStrictEqual([]);
    expect(own.visible).not.toContain("relationship");

    const third = validateAnswers(birth.definition, {
      ...base,
      own_certificate: false,
    });

    expect(third.errors.map((error) => error.path)).toStrictEqual([
      "relationship",
    ]);
  });
});
