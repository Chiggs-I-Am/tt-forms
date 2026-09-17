# Pilot form research (decision ticket: Official pilot form selection)

Basis: official government sources only (ministry sites, TTPS portal, NIBTT). Reviewed 17 Sep 2026.

## Candidates

### 1. Certificate of Character request (TTPS)
- Official source: https://services.ttps.gov.tt/coc (live online request form, plus instructions at foreign.gov.tt and ttconnect.gov.tt/certificate-of-character)
- Fields observed: first/last name, address, contact (phone/email), ID type (National ID/Passport/Driver's Permit), ID number, occupation, purpose for certificate; then photo upload, appointment date and police-station choice.
- Strong pilot fit: covers personal details, single-select, upload, date and choice controls in one form; citizens know it (TT$50, 2-3 weeks). Already online, so "what is possible today" is demonstrable without inventing behavior.

### 2. Passport renewal, adults 16+ (Immigration Division)
- Official source: https://foreign.gov.tt/documents/1752/ADULT_RENEWAL_APPLICATION_FORM_FOR_TRINIDAD_AND_TOBAGO_PASSPORT.pdf (print form; in-country appointment process per nationalsecurity.gov.tt instructions)
- Fields observed: bio data, contact, marital history, passport particulars (number/issue/place), citizenship-other-country yes/no with details, parent/guardian block for under 18, two references with contact, declaration.
- Strong pilot fit: long form, sections, repeats (references), conditional questions (other citizenship yes/no). Exercises builder capabilities: sections, conditional display, repeatable groups.

### 3. Application for Computerized Birth Certificate (Registrar General, RGD 14A)
- Official source: https://foreign.gov.tt/documents/361/Application_for_Computerized_Birth_Certificate.pdf (also via agla.gov.tt civil registry forms)
- Fields observed: applicant details, service type (mail/walk-in), applying-for-own-certificate yes/no, person's details (names, sex, date and place of birth), mother's and father's names, ID type and number, purpose, signature declaration.
- Strong pilot fit: third-party application logic (own vs someone else's), ID-type dropdown, purpose free text. Compact form, good contrast to the passport form.

### 4. NIS NI 4 - Register as an Employed Person (NIBTT)
- Official source: https://www.nibtt.net/NI_Forms/NI4.pdf (full catalogue at nibtt.net/NI_Forms/NI_Forms_downloads_rev.html)
- Fit: employer/employee registration vocabulary, straightforward fields; good candidate for a fourth form or swap-in if one of the above proves awkward to model.

## Recommendation
Model three: Certificate of Character, Adult Passport Renewal, Computerized Birth Certificate. Together they exercise every builder capability the prototype needs (uploads, selects, conditionals, repeatable groups, declarations) and all have official sources to cite. Keep NI 4 as an alternate.

## Demo-safeguard note
ID-number fields (National ID, passport, driver's permit) appear in all three. These must be clearly marked as demo fields per the fake-data-only decision on the map.
