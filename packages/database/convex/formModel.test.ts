import { describe, expect, it } from "vitest"
import {
  validateAnswers,
  validateDefinition,
  type FormDefinition,
} from "./formModel"
import { pilotSeeds } from "./pilotDefinitions"

// Pure model tests for #35. validateDefinition is the publish gate;
// validateAnswers plus visibility is the server authority the applicant flow
// (#36/#37) will call at submit time.

const pattern: FormDefinition = {
  sections: [
    {
      id: "s1",
      title: "First",
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
          required: true,
          maxLength: 5,
        },
      ],
    },
    {
      id: "s2",
      title: "Second",
      condition: { mode: "any", rules: [{ fieldId: "choice", values: ["A"] }] },
      repeat: { min: 1, max: 2 },
      fields: [
        { id: "detail", kind: "short_text", label: "Detail", required: true },
      ],
    },
  ],
}

describe("validateDefinition", () => {
  it("accepts a well-formed definition", () => {
    expect(validateDefinition(pattern)).toEqual([])
  })

  it("accepts all four 1:1 pilot seeds (publish gate)", () => {
    for (const seed of pilotSeeds) {
      expect(validateDefinition(seed.definition)).toEqual([])
    }
  })

  it("rejects missing labels, bad options, and duplicate ids", () => {
    const bad: FormDefinition = {
      sections: [
        {
          id: "s",
          title: "S",
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
        },
      ],
    }
    const problems = validateDefinition(bad)
    expect(problems.join(" ")).toMatch(/label/)
    expect(problems.join(" ")).toMatch(/Duplicate field id/)
    expect(problems.join(" ")).toMatch(/two non-empty options/)
  })

  it("rejects impossible rules", () => {
    const bad: FormDefinition = {
      sections: [
        {
          id: "s",
          title: "S",
          repeat: { min: 3, max: 2 },
          fields: [{ id: "n", kind: "number", label: "N", min: 10, max: 5 }],
        },
      ],
    }
    const problems = validateDefinition(bad)
    expect(problems).toHaveLength(2)
  })

  it("validates mixed once-plus-rows sections", () => {
    const mixed: FormDefinition = {
      sections: [
        {
          id: "s",
          title: "S",
          repeat: { min: 0, max: 2 },
          repeatFields: ["row_note"],
          fields: [
            {
              id: "headline",
              kind: "short_text",
              label: "Headline",
              required: true,
            },
            { id: "row_note", kind: "short_text", label: "Note" },
          ],
        },
      ],
    }
    expect(validateDefinition(mixed)).toEqual([])
    // Once-field missing blocks; empty rows are fine at min 0.
    expect(validateAnswers(mixed, { s: [] }).errors.map((e) => e.path)).toEqual(
      ["headline"]
    )
    expect(validateAnswers(mixed, { headline: "Hi", s: [] }).errors).toEqual([])
    // Unknown repeat fields and row-level conditions are rejected.
    expect(
      validateDefinition({
        sections: [
          {
            id: "s",
            title: "S",
            repeat: { min: 0, max: 1 },
            repeatFields: ["ghost"],
            fields: [{ id: "a", kind: "short_text", label: "A" }],
          },
        ],
      }).join(" ")
    ).toMatch(/unknown field/)
  })

  it("rejects conditions on later or non-choice fields", () => {
    const bad: FormDefinition = {
      sections: [
        {
          id: "s1",
          title: "First",
          condition: {
            mode: "any",
            rules: [{ fieldId: "later", values: ["X"] }],
          },
          fields: [{ id: "t", kind: "short_text", label: "T" }],
        },
        {
          id: "s2",
          title: "Second",
          fields: [
            {
              id: "later",
              kind: "single_choice",
              label: "Later",
              options: ["X", "Y"],
            },
            {
              id: "t2",
              kind: "short_text",
              label: "T2",
              condition: {
                mode: "any",
                rules: [{ fieldId: "t", values: ["x"] }],
              },
            },
          ],
        },
      ],
    }
    const problems = validateDefinition(bad)
    expect(problems).toHaveLength(2)
    expect(problems.join(" ")).toMatch(/not an earlier choice field/)
  })
})

describe("validateAnswers", () => {
  it("requires visible fields and enforces length", () => {
    const { errors } = validateAnswers(pattern, { choice: "B" })
    expect(errors.map((e) => e.path)).toEqual(["name"])
    const ok = validateAnswers(pattern, { choice: "B", name: "Al" })
    expect(ok.errors).toEqual([])
  })

  it("validates repeated sections and skips hidden ones", () => {
    // s2 hidden when choice is B: rows are neither required nor checked.
    const hidden = validateAnswers(pattern, {
      choice: "B",
      name: "Al",
      s2: [{ detail: "" }],
    })
    expect(hidden.errors).toEqual([])

    // s2 visible when choice is A: min 1 row, each detail required.
    const missing = validateAnswers(pattern, { choice: "A", name: "Al" })
    expect(missing.errors.map((e) => e.path)).toEqual(["s2"])
    const badRow = validateAnswers(pattern, {
      choice: "A",
      name: "Al",
      s2: [{ detail: "" }, { detail: "x" }, { detail: "y" }],
    })
    expect(badRow.errors.map((e) => e.path)).toEqual(["s2", "s2[0].detail"])
  })

  it("checks email, phone, choice membership, and declarations", () => {
    const def: FormDefinition = {
      sections: [
        {
          id: "s",
          title: "S",
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
        },
      ],
    }
    const { errors } = validateAnswers(def, {
      e: "not-an-email",
      p: "123",
      c: "Z",
      d: false,
    })
    expect(errors.map((e) => e.path).sort()).toEqual(["c", "d", "e", "p"])
    const ok = validateAnswers(def, {
      e: "a@example.com",
      p: "868-123-4567",
      c: "A",
      d: true,
    })
    expect(ok.errors).toEqual([])
  })

  it("proves the passport guardian stays hidden for adults", () => {
    const passport = pilotSeeds.find(
      (s) => s.slug === "adult-passport-renewal"
    )!
    const answers = {
      surname: "Bhim",
      first_name: "Anya",
      date_of_birth: "1990-05-01",
      sex: "Female",
      place_of_birth: "San Fernando",
      country_of_birth: "Trinidad and Tobago",
      marital_status: "Single",
      home_address: "36 Ariapita Avenue",
      passport_number: "T1234567",
      passport_issue_date: "2020-01-15",
      passport_issue_place: "Port of Spain",
      other_citizenship: false,
      under_18: "No, I am 18 or over",
      references: [
        { ref_name: "C Patel", ref_tel: "8681112222" },
        { ref_name: "D Singh", ref_tel: "8683334444" },
      ],
      declarant_name: "Anya Bhim",
      accept: true,
      dated: "2026-09-01",
      decl_id_number: "T1234567",
      decl_id_issue_date: "2020-01-15",
    }
    const { errors, visible } = validateAnswers(passport.definition, answers)
    expect(errors).toEqual([])
    expect(visible).not.toContain("parent_first")
    expect(visible).not.toContain("previous_marriages")
  })

  it("proves the birth relationship appears only for third parties", () => {
    const birth = pilotSeeds.find(
      (s) => s.slug === "computerized-birth-certificate"
    )!
    const base = {
      first_name: "A",
      surname: "B",
      address: "X",
      service_type: "Walk In",
      telephone: "8681112222",
      purpose: "School",
      id_type: "ID",
      id_number: "123",
      child_first: "C",
      sex: "Male",
      date_of_birth: "2020-01-01",
      place_of_birth: "POS",
      mother_first: "M",
      mother_surname: "M",
      mother_maiden: "M",
      father_first: "F",
      father_surname: "F",
      application_date: "2026-09-01",
      certify: true,
    }
    const own = validateAnswers(birth.definition, {
      ...base,
      own_certificate: true,
    })
    expect(own.errors).toEqual([])
    expect(own.visible).not.toContain("relationship")
    const third = validateAnswers(birth.definition, {
      ...base,
      own_certificate: false,
    })
    expect(third.errors.map((e) => e.path)).toEqual(["relationship"])
  })
})
