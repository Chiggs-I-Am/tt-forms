---
name: TT Forms Demo
description: Plain official demo for completing T&T government forms online.
colors:
  stamp-red: "oklch(0.505 0.213 27.518)"
  stamp-red-ink: "oklch(0.971 0.013 17.38)"
  paper: "oklch(1 0 0)"
  ink: "oklch(0.148 0.004 228.8)"
  quiet-fill: "oklch(0.963 0.002 197.1)"
  quiet-ink: "oklch(0.56 0.021 213.5)"
  rule-line: "oklch(0.925 0.005 214.3)"
  warning-red: "oklch(0.577 0.245 27.325)"
typography:
  display:
    fontFamily: "Nunito Sans, Figtree, system-ui, sans-serif"
    fontSize: "30px"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  headline:
    fontFamily: "Nunito Sans, Figtree, system-ui, sans-serif"
    fontSize: "24px"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "normal"
  title:
    fontFamily: "Nunito Sans, Figtree, system-ui, sans-serif"
    fontSize: "18px"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "Figtree, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, monospace"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.1em"
rounded:
  none: "0px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.stamp-red}"
    textColor: "{colors.stamp-red-ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "40px"
  button-primary-hover:
    backgroundColor: "{colors.stamp-red}"
    textColor: "{colors.stamp-red-ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "40px"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "0 24px"
    height: "40px"
  input-search:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    height: "44px"
  card-form:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.none}"
    padding: "16px"
---

# Design System: TT Forms Demo

## Overview

**Creative North Star: "The Civic Service Counter"**

This system looks like a well-run service counter, not a startup landing page. One narrow column, sharp corners, numbered steps, and a single red stamp color that marks where action happens. The mood is plain but warm: official wording, quiet grays, and uppercase kickers that label instead of shout.

Density is low on purpose. The homepage is one task (find your form) followed by a short explanation of the demo. Nothing competes with the search box. Depth comes from borders and tonal fills at rest, with a small lift on hover to confirm what is clickable.

**Key Characteristics:**
- Narrow single column, generous vertical rhythm.
- Sharp corners everywhere; borders do the separating.
- One red, used structurally at action points.
- Uppercase kickers and queue-number numerals for orientation.

## Colors

Quiet paper and ink with a single structural red that marks action.

### Primary
- **Stamp Red** (oklch(0.505 0.213 27.518)): the action color. Primary buttons, active links, the hover border on form cards, focus accents. Its structural placement is the point.

### Neutral
- **Paper** (oklch(1 0 0)): page and card background.
- **Ink** (oklch(0.148 0.004 228.8)): body text and headings.
- **Quiet Fill** (oklch(0.963 0.002 197.1)): muted backgrounds and hover washes.
- **Quiet Ink** (oklch(0.56 0.021 213.5)): secondary text, kickers, step numerals.
- **Rule Line** (oklch(0.925 0.005 214.3)): borders on cards, inputs, and the footer rule.
- **Warning Red** (oklch(0.577 0.245 27.325)): destructive and invalid states only, never decoration.

### Named Rules
**The Structural Red Rule.** Stamp Red marks action points only. It never fills backgrounds, never decorates, never gradients.

## Typography

**Display Font:** Nunito Sans (with Figtree, system-ui fallback)
**Body Font:** Figtree (with system-ui fallback)
**Label/Mono Font:** Geist Mono (with ui-monospace fallback)

**Character:** Friendly official. Headings are medium-weight and calm; body is small and readable; labels are mono, uppercase, and widely tracked, like counter signage.

### Hierarchy
- **Display** (medium 500, 30px, 1.2): homepage headline only.
- **Headline** (medium 500, 24px, 1.25): per-form intro titles.
- **Title** (medium 500, 18px, 1.4): section headings ("Find your form", "How the demo works").
- **Body** (regular 400, 14px, 1.6): summaries, explanations, card text.
- **Label** (regular 400, 12px, 0.1em tracking, uppercase): kickers, search labels, "Alternate" flags, queue numerals.

### Named Rules
**The Signage Rule.** Uppercase tracked labels orient; they never carry the message itself. If a label has to explain, it belongs in body text.

## Layout

A single centered column (max-w-xl) with page padding (24px) and large section gaps (40px). Cards stack vertically with 12px gaps; inside a card, 4px label-to-title rhythm. The search field and its clear button sit on one row; results stack below. Responsive behavior: the column narrows, it never reflows into grids. At 320px the search row and practice field stay full width.

## Elevation & Depth

Flat by default, with a small lift on hover to confirm clickability. Depth comes from 1px Rule Line borders and Quiet Fill washes, not shadows.

### Named Rules
**The Flat Counter Rule.** Surfaces are flat at rest. The only permitted lift is the hover border shift on form cards and the hover wash on outline buttons.

## Shapes

Sharp and certain. Every interactive surface uses square corners (0px): buttons, inputs, cards, practice panels, empty states. Borders are 1px solid Rule Line; the footer uses a top rule instead of a box. No pills, no soft cards, no clipped geometry.

### Named Rules
**The Square Corner Rule.** If it looks rounded, it is wrong. Sharp corners are the system's signature.

## Components

### Buttons
Sharp and certain: square, uppercase, small semibold labels with wide tracking.
- **Shape:** square corners (0px)
- **Primary:** Stamp Red background, Stamp Red Ink text, 40px height, 24px horizontal padding
- **Hover / Focus:** primary deepens slightly; focus shows a visible ring; active presses down 1px
- **Secondary / Ghost / Tertiary:** outline uses a Rule Line border on transparent with a Quiet Fill hover; ghost is borderless with the same hover wash

### Cards / Containers
Form result cards are the signature container.
- **Corner Style:** square (0px)
- **Background:** Paper
- **Shadow Strategy:** none at rest; hover shifts the border to Stamp Red
- **Border:** 1px solid Rule Line
- **Internal Padding:** 16px

### Inputs / Fields
The search box and practice field share one language.
- **Style:** 1px Rule Line stroke on Paper, square corners, 44px height on search
- **Focus:** border and ring treatment; never removes the outline without a replacement
- **Error / Disabled:** Warning Red border for invalid; reduced opacity and no pointer events when disabled

### Navigation
Text links with underline and 4px offset. The demo badge kicker and auth status share the header row; the footer carries safety copy above a top rule. No nav bar component exists.

### Form Practice Panel
Bordered Paper panel holding one labeled field plus a sign-in nudge. Same square border as cards, 16px padding, Quiet Ink helper text.

## Do's and Don'ts

### Do:
- **Do** keep one centered column and let the search box own the first screen.
- **Do** use Stamp Red only at action points: primary button, active link, card hover border.
- **Do** keep every official source citation next to the form it describes.
- **Do** keep the demo badge and fake-data wording visible on home, sign-in, and intro pages.

### Don't:
- **Don't** use gradients of any kind, purple or otherwise.
- **Don't** build a generic marketing hero; the search task is the hero.
- **Don't** round corners or soften the system into pills and soft cards.
- **Don't** invent testimonials, metrics, or government affiliation claims.
